import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { hash } from '../lib/rag-v2/contracts.js';
import { ANSWER_VERSION, digest, validateAnswer } from '../lib/rag-v2/pilot/contracts.js';
import { PilotService } from '../lib/rag-v2/pilot/service.js';
import { renderAnswer } from '../lib/rag-v2/pilot/presentation.js';

test('real v2 replay: both original rejected drafts still fail; independent expected partials pass v3 on the same packets',
  { skip: !process.env.M4_V3_REPLAY_INPUT || !process.env.M4_V3_EXPECTED }, async () => {
    const original = await fs.readFile(process.env.M4_V3_REPLAY_INPUT), data = JSON.parse(original);
    const fixtureBytes = await fs.readFile(process.env.M4_V3_EXPECTED), fixtures = JSON.parse(fixtureBytes);
    assert.equal(fixtures.inputFileSha256, hash(original));
    assert.equal(fixtures.status, 'hand_authored_test_fixtures_not_Luna_output');
    assert.equal(fixtures.cases.length, 2);
    const results = []; let calls = 0;
    for (const item of fixtures.cases) {
      const row = data.turns.find(r => r.id === item.turnId);
      assert.ok(Date.parse(row.expiresAt) > Date.now(), 'expired original must not be reused');
      assert.equal(row.state, 'answer_rejected');
      assert.equal(row.payload.answerVersion, 'm4-text-refs-2');
      assert.equal(item.originalVersion, row.payload.answerVersion);
      assert.equal(item.originalDraftSha256, hash(row.payload.responseAudit.draft.text));
      assert.equal(item.packetHash, digest(row.payload.packet));
      const raw = JSON.parse(row.payload.responseAudit.draft.text), before = JSON.stringify(raw);
      const references = Object.keys(row.payload.packet.reference_map);
      const oldFailure = row.payload.responseAudit.validation;
      for (const controlVersion of [item.originalVersion, ANSWER_VERSION]) {
        assert.throws(() => validateAnswer(raw, references, controlVersion), error => {
          assert.equal(error.code, oldFailure.code); assert.equal(error.validation.path, oldFailure.path); return true;
        });
      }
      assert.equal(JSON.stringify(raw), before);
      const service = new PilotService({ store: { mutate: async (_c, _r, fn) => fn() },
        readConfig: async () => ({ configHash: row.configHash, mode: 'real' }), adapters: {},
        call: async () => { calls++; throw Error('unexpected model call'); } });
      const restored = await service.restore({ ...row, expiresAt: new Date(row.expiresAt) });
      assert.equal(restored.state, 'answer_rejected'); assert.equal(restored.answer, undefined);
      const expected = validateAnswer(item.answer, references, ANSWER_VERSION);
      const display = renderAnswer(expected, ANSWER_VERSION);
      assert.ok(expected.blocks.length > 0); assert.ok(expected.limitations.length > 0);
      assert.ok(display.includes(expected.blocks[0].text)); assert.ok(display.includes(expected.limitations[0]));
      results.push({ turnId: row.id, originalDraftSha256: item.originalDraftSha256, packetHash: item.packetHash,
        originalVersion: item.originalVersion, controls: [{ version: item.originalVersion, result: oldFailure.code, path: oldFailure.path },
          { version: ANSWER_VERSION, originalDraft: 'still_rejected', handAuthoredExpected: 'technical_pass' }],
        expectedSha256: digest(item.answer), semanticReview: item.expectedSemanticReview, originalBlockReview: item.originalBlockReview });
    }
    // All six already published v2 answers retain their original reading meaning too.
    for (const row of data.turns.filter(r => r.state === 'completed')) {
      validateAnswer(row.payload.answer, Object.keys(row.payload.packet.reference_map), row.payload.answerVersion);
      assert.ok(renderAnswer(row.payload.answer, row.payload.answerVersion).trim());
    }
    assert.equal(calls, 0);
    assert.equal(hash(await fs.readFile(process.env.M4_V3_REPLAY_INPUT)), hash(original));
    assert.equal(hash(await fs.readFile(process.env.M4_V3_EXPECTED)), hash(fixtureBytes));
    if (process.env.M4_V3_REPLAY_OUTPUT) await fs.writeFile(process.env.M4_V3_REPLAY_OUTPUT, JSON.stringify({ inputFileSha256: hash(original),
      expectedFixtureFileSha256: hash(fixtureBytes), historicalPublishedAnswersChecked: 6, historicalRejectedAnswersChecked: 2,
      externalModelCalls: calls, historyUnchanged: true, results }, null, 2), { flag: 'wx' });
  });
