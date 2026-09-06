import { buildQuestion, exact, reject, digest, answerRequest, validateAnswer } from './contracts.js';
import { checkedTokens, MockEmbedding, validateVector } from '../search/embedding.js';
import { providerCall } from './provider.js';

export class PilotService {
  constructor({ store, readConfig, adapters, call = providerCall }) { Object.assign(this, { store, readConfig, adapters, call }); }
  async access(row) {
    const config = await this.readConfig();
    if (row && (row.configHash !== config.configHash || row.expiresAt <= new Date())) reject('pilot_scope_changed', 403);
    return config;
  }
  async restore(row) {
    const config = await this.access(row);
    await this.store.mutate(config, row, async () => null);
    if (row.state !== 'completed') return { id: row.id, state: row.state, mode: config.mode, recoverable: row.state === 'needs_recovery' };
    for (const ref of Object.keys(row.payload.packet.reference_map)) await this.adapters.canonical(config, row.payload.packet, ref);
    await this.access(row);
    return { id: row.id, state: 'completed', mode: config.mode, question: row.payload.question, answer: row.payload.answer,
      messageId: row.payload.messageId, sources: Object.entries(row.payload.packet.reference_map).map(([ref, value]) => ({ ref,
        title: row.payload.packet.evidence.find(e => e.evidence_id === value.evidence_id)?.bibliography.title,
        pages: value.pdf_pages, version: value.document_version_id, used: row.payload.answer.blocks.some(b => b.refs.includes(ref)) })),
      measurements: { queryTokens: row.payload.query.tokens, events: row.payload.events.map(e => ({ stage: e.stage, state: e.state, reservation: e.reservation, usage: e.usage, estimatedNanoUsd: e.estimatedNanoUsd, timings: e.timings })), timings: row.payload.timings } };
  }
  async run(userId, input) {
    exact(input, ['convId', 'clientTurnKey', 'question', 'contextMode', 'language']);
    if (input.language !== undefined && !['et', 'en', 'ru'].includes(input.language)) reject('invalid_language');
    if (![input.convId, input.clientTurnKey].every(x => typeof x === 'string' && /^[\w-]{8,100}$/.test(x))) reject('invalid_turn_identity');
    buildQuestion({ question: input.question, contextMode: input.contextMode });
    let config = await this.access();
    if (config.mode === 'real' && config.questionPolicy?.mode === 'locked'
      && !config.questionPolicy.inputs.some(x => x.question === input.question && x.contextMode === input.contextMode && x.language === (input.language || 'et'))) reject('question_not_in_approved_plan', 403);
    await this.store.purge();
    const claimed = await this.store.claim(config, userId, input);
    if (!claimed.fresh) return this.restore(claimed.row);
    let row = claimed.row;
    const start = Date.now();
    try {
      const query = buildQuestion({ question: input.question, contextMode: input.contextMode }, row.payload.previous);
      query.language = input.language || 'et';
      const embeddingTokens = checkedTokens(query.text, config.embedding);
      await this.adapters.preflight(config);
      row = await this.store.save(config, row, 'claimed', { query });
      let vector = await this.store.cache(config, userId, query.hash);
      if (!vector) {
        config = await this.access(row);
        const body = { input: query.text, model: config.embedding.model, dimensions: config.embedding.dimensions, encoding_format: 'float' };
        row = await this.store.reserve(config, row, 'embedding', { tokens: embeddingTokens, nanoUsd: config.mode === 'real' ? embeddingTokens * config.prices.embeddingInput : 0 },
          { inputHash: query.hash, bodyHash: digest(body), inputVersion: query.version });
        config = await this.access(row);
        row = await this.store.sent(config, row, 'embedding');
        const result = config.mode === 'test' ? { value: await new MockEmbedding(config.embedding).embed(query.text), usage: { input: embeddingTokens, output: 0 }, requestId: 'test-embedding' }
          : await this.call({ stage: 'embedding', body, config, apiKey: process.env.OPENAI_API_KEY });
        row = await this.store.usage(config, row, 'embedding', result);
        vector = validateVector(result.value, config.embedding);
      } else validateVector(vector, config.embedding);
      config = await this.access(row);
      row = await this.store.save(config, row, 'claimed', { vector });
      const packet = await this.adapters.search(config, query, vector);
      config = await this.access(row);
      for (const ref of Object.keys(packet.reference_map)) await this.adapters.canonical(config, packet, ref);
      const body = answerRequest(config, query.text, packet.model_context);
      // UTF-8 bytes conservatively bound text tokenization including the full schema and prompt.
      // Extra protocol allowance is reserved; exact provider usage remains a separate measurement.
      const inputBound = Buffer.byteLength(JSON.stringify(body), 'utf8') + 1024;
      if (inputBound > config.maxInputTokens) reject('answer_input_budget_exceeded');
      row = await this.store.reserve(config, row, 'answer', { tokens: inputBound + config.maxOutputTokens,
        nanoUsd: config.mode === 'real' ? inputBound * config.prices.answerInput + config.maxOutputTokens * config.prices.answerOutput : 0 },
      { bodyHash: digest(body), inputBound, maxOutputTokens: config.maxOutputTokens });
      config = await this.access(row);
      row = await this.store.sent(config, row, 'answer');
      const result = config.mode === 'test' ? { value: { kind: 'partial', blocks: [{ text: `Testvastaja kuvab allikakatkendi: ${packet.evidence[0].source_text.slice(0, 700)}`, factual: true, refs: ['S1'] }],
        limitations: ['Fikseeritud testtransport. See ei tõenda Luna vastuse ega vektorotsingu kvaliteeti.'], clarification: null }, usage: { input: inputBound, output: 200 }, requestId: 'test-answer' }
        : await this.call({ stage: 'answer', body, config, apiKey: process.env.OPENAI_API_KEY });
      row = await this.store.usage(config, row, 'answer', result);
      const answer = validateAnswer(result.value, Object.keys(packet.reference_map));
      config = await this.access(row);
      for (const ref of Object.keys(packet.reference_map)) await this.adapters.canonical(config, packet, ref);
      // Persist validated draft first. A later message transaction failure can recover without generation.
      row = await this.store.save(config, row, 'needs_recovery', { answer, packet, timings: { validatedDraftMs: Date.now() - start } });
      config = await this.access(row);
      row = await this.store.publish(config, row, answer, packet);
      const restored = await this.restore(row);
      restored.measurements.timings = { ...restored.measurements.timings, publishedMs: Date.now() - start };
      return restored;
    } catch (error) {
      if (row.state === 'completed') throw error; // A failed restore must not rewrite a committed answer's state.
      if (error.usage && row.payload.events.at(-1)?.state === 'sent_unknown') {
        row = await this.store.usage(config, row, row.payload.events.at(-1).stage, error).catch(() => row);
      }
      const state = row.state === 'needs_recovery' ? 'needs_recovery' : row.payload.events.some(e => e.state === 'sent_unknown') ? 'unknown' : 'stopped';
      await this.store.save(config, row, state, { error: /^[a-z_]+$/.test(error.code || '') ? error.code : 'pilot_failed' }).catch(() => {});
      throw error;
    }
  }
  async recover(row) {
    const config = await this.access(row);
    if (row.state !== 'needs_recovery' || !row.payload.answer || !row.payload.packet) return this.restore(row);
    validateAnswer(row.payload.answer, Object.keys(row.payload.packet.reference_map));
    for (const ref of Object.keys(row.payload.packet.reference_map)) await this.adapters.canonical(config, row.payload.packet, ref);
    await this.access(row);
    return this.restore(await this.store.publish(config, row, row.payload.answer, row.payload.packet));
  }
}
