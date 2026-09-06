import test from 'node:test';
import assert from 'node:assert/strict';
import { providerCall } from '../lib/rag-v2/pilot/provider.js';
import { answerRequest } from '../lib/rag-v2/pilot/contracts.js';
import { embeddingConfig } from '../lib/rag-v2/search/embedding.js';

const config = { mode: 'real', model: 'gpt-5.6-luna', accountProject: 'proj_test', timeoutMs: 100, maxOutputTokens: 1000, reasoning: 'low',
  embedding: embeddingConfig({ embedding_mode: 'real', provider: 'openai', model: 'text-embedding-3-large', dimensions: 3072, endpoint: 'https://api.openai.com/v1/embeddings' }) };
const answer = { kind: 'unsupported', blocks: [{ text: 'See materjal ei anna hinda.', factual: false, refs: [] }], limitations: ['Hind puudub'], clarification: null };
const good = { model: config.model, status: 'completed', output: [{ type: 'reasoning' }, { type: 'message', content: [{ type: 'output_text', text: JSON.stringify(answer) }] }],
  usage: { input_tokens: 100, output_tokens: 50, output_tokens_details: { reasoning_tokens: 20 } } };
test('Responses adapter sends exact endpoint, project, no store/tools/temperature, and retains reasoning usage', async () => {
  let calls = 0;
  const result = await providerCall({ stage: 'answer', body: answerRequest(config, 'question', null), config, apiKey: 'synthetic-key',
    transport: async (url, options) => {
      calls++; assert.equal(url, 'https://api.openai.com/v1/responses'); assert.equal(options.redirect, 'error');
      assert.equal(options.headers['OpenAI-Project'], 'proj_test'); assert.ok(options.signal);
      const body = JSON.parse(options.body); assert.equal(body.store, false); assert.equal(body.tools, undefined); assert.equal(body.temperature, undefined);
      return Response.json(good, { headers: { 'x-request-id': 'test-response' } });
    } });
  assert.equal(calls, 1); assert.deepEqual(result.value, answer); assert.equal(result.usage.reasoning, 20); assert.ok(result.timings.firstDataMs >= 0);
});
test('timeout and HTTP errors have no transport retries; test mode cannot call with a real-looking key', async () => {
  let calls = 0; const transport = async () => { calls++; throw Error('timeout'); };
  await assert.rejects(providerCall({ stage: 'answer', config, body: {}, apiKey: 'synthetic', transport })); assert.equal(calls, 1);
  await assert.rejects(providerCall({ stage: 'answer', config: { ...config, mode: 'test' }, body: {}, apiKey: 'sk-present', transport }), { code: 'not_configured' });
  assert.equal(calls, 1);
  await assert.rejects(providerCall({ stage: 'answer', config, body: {}, apiKey: 'synthetic', transport: async () => { calls++; return new Response('secret provider body', { status: 429 }); } }), { code: 'provider_http_error' });
  assert.equal(calls, 2);
});
test('refusal, malformed structured output, incomplete output, wrong model and unknown usage never become success', async () => {
  const cases = [
    [{ ...good, output: [{ type: 'message', content: [{ type: 'refusal', refusal: 'No' }] }] }, 'provider_refusal_or_invalid_output'],
    [{ ...good, output: [{ type: 'message', content: [{ type: 'output_text', text: '{broken' }] }] }, 'provider_invalid_json'],
    [{ ...good, status: 'incomplete' }, 'provider_incomplete'],
    [{ ...good, model: 'another-model' }, 'answer_model_mismatch'],
    [{ ...good, usage: {} }, 'provider_usage_unknown'],
  ];
  for (const [body, code] of cases) {
    let calls = 0;
    await assert.rejects(providerCall({ stage: 'answer', config, body: {}, apiKey: 'synthetic', transport: async () => { calls++; return Response.json(body); } }), error => {
      assert.equal(error.code, code); if (code !== 'provider_usage_unknown') assert.equal(error.usage.output, 50); return true;
    }); assert.equal(calls, 1);
  }
});
test('query embedding shape and dimensions are validated', async () => {
  const response = { model: config.embedding.model, data: [{ index: 0, embedding: Array.from({ length: 3072 }, (_, i) => i === 0 ? 1 : 0) }], usage: { prompt_tokens: 7 } };
  const result = await providerCall({ stage: 'embedding', config, body: { input: 'only this query' }, apiKey: 'synthetic', transport: async url => {
    assert.equal(url, 'https://api.openai.com/v1/embeddings'); return Response.json(response);
  } });
  assert.equal(result.value.length, 3072); assert.equal(result.usage.input, 7);
  await assert.rejects(providerCall({ stage: 'embedding', config, body: {}, apiKey: 'synthetic', transport: async () => Response.json({ ...response, data: [{ index: 0, embedding: [0] }] }) }));
});
