import test from 'node:test';
import assert from 'node:assert/strict';
import Ajv from 'ajv';
import { ANSWER_SCHEMA, ANSWER_VERSION, validateAnswer, answerRequest } from '../lib/rag-v2/pilot/contracts.js';
import { renderAnswer } from '../lib/rag-v2/pilot/presentation.js';
import { pilotChatResult } from '../lib/chat/m4PilotClientContract.js';

const schemaValid = new Ajv({ allErrors: true }).compile(ANSWER_SCHEMA);
const block = { text: 'The sample states that the desk opens at nine.', factual: true, refs: ['S1'] };
const complete = { kind: 'grounded', blocks: [block], limitations: [], clarification: null };
const fixtures = [
  complete,
  { ...complete, kind: 'partial', limitations: ['The excerpts used here do not establish the closing time.'] },
  { ...complete, kind: 'partial', clarification: 'Which desk do you mean?' },
  { kind: 'clarification', blocks: [], limitations: [], clarification: 'Which municipality do you mean?' },
  { kind: 'clarification', blocks: [block], limitations: [], clarification: 'Which desk do you mean?' },
  { kind: 'unsupported', blocks: [], limitations: ['These excerpts do not establish a price.'], clarification: null },
];

test('v3: supported full/partial answers and citation-free clarification/unsupported branches render meaningful content', () => {
  for (const answer of fixtures) {
    assert.equal(schemaValid(answer), true, JSON.stringify(schemaValid.errors));
    assert.deepEqual(validateAnswer(answer, ['S1']), answer);
    const visible = pilotChatResult({ id: 'synthetic', state: 'completed', answer, answerVersion: ANSWER_VERSION, sources: [] }, 'local');
    assert.ok(visible.answer.trim());
    if (!answer.blocks.length) assert.ok(!visible.answer.includes('[S'));
  }
  assert.match(renderAnswer(fixtures[1], ANSWER_VERSION), /opens at nine\. \[S1\]\n\nThe excerpts/);
});

test('v3: positive claims cannot bypass references with an empty list or factual=false, and input is not repaired', () => {
  for (const changed of [{ refs: [] }, { factual: false }, { factual: false, refs: [] }]) {
    const answer = { ...complete, blocks: [{ ...block, ...changed }] }, before = JSON.stringify(answer);
    assert.equal(schemaValid(answer), false);
    assert.throws(() => validateAnswer(answer, ['S1']));
    assert.equal(JSON.stringify(answer), before);
  }
  assert.throws(() => validateAnswer({ ...complete, blocks: [{ ...block, refs: ['S99'] }] }, ['S1']), { code: 'invalid_answer_reference' });
});

test('v3: kind/content consistency rejects empty answers and incompatible labels without manufacturing blocks', () => {
  for (const answer of [
    { ...complete, blocks: [] },
    { ...complete, kind: 'partial' },
    { ...complete, kind: 'clarification' },
    { ...complete, kind: 'unsupported', blocks: [] },
    { ...complete, kind: 'unsupported', limitations: ['A selected-evidence limit.'] },
    { kind: 'clarification', blocks: [], limitations: [], clarification: ' \n\t' },
    { kind: 'unsupported', blocks: [], limitations: ['   '], clarification: null },
    { kind: 'partial', blocks: [block], limitations: [''], clarification: 'Which desk?' },
  ]) assert.throws(() => validateAnswer(answer, ['S1']), { code: 'invalid_answer' });
});

test('v1 and v2 retain their own validation and citation behavior after v3 is introduced', () => {
  const old = { kind: 'unsupported', blocks: [{ text: 'A legacy nonfactual response.', factual: false, refs: [] }], limitations: [], clarification: null };
  for (const version of ['m4-text-refs-1', 'm4-text-refs-2']) {
    assert.deepEqual(validateAnswer(old, [], version), old);
    assert.throws(() => validateAnswer(fixtures[3], [], version), { code: 'invalid_answer' });
    assert.throws(() => validateAnswer({ ...complete, blocks: [{ ...block, refs: [] }] }, ['S1'], version), { code: 'invalid_answer_reference' });
  }
  const legacyCite = { ...complete, blocks: [{ ...block, text: 'Supported. [S1]' }] };
  assert.equal(renderAnswer(validateAnswer(legacyCite, ['S1'], 'm4-text-refs-1'), 'm4-text-refs-1'), 'Supported. [S1]');
  assert.throws(() => validateAnswer(legacyCite, ['S1'], 'm4-text-refs-2'), { code: 'inline_answer_reference' });
  assert.throws(() => validateAnswer(old, [], ANSWER_VERSION));
});

test('v3: selected-evidence limits do not create an automatic natural-language truth or scope classifier', () => {
  const allowed = { kind: 'unsupported', blocks: [], limitations: ['The excerpts used for this answer do not establish a price.'], clarification: null };
  const semanticallyWrong = { ...allowed, limitations: ['Every municipality provides this service free of charge.'] };
  // Both have valid syntax. The second is a manually identified, unsupported world claim.
  // Its acceptance by a shape check must never be reported as semantic approval.
  for (const answer of [allowed, semanticallyWrong]) {
    assert.equal(schemaValid(answer), true);
    assert.deepEqual(validateAnswer(answer, []), answer);
  }
  const prompt = answerRequest({ model: 'gpt-5.6-luna', reasoning: 'low', maxOutputTokens: 1000 }, 'Question', null, 'en').instructions;
  assert.match(prompt, /limitations and clarification are not bypasses for unsupported facts/);
  assert.match(prompt, /exact named addressee or institutional level/);
  assert.match(prompt, /goals are not already accomplished events/);
});

test('v3: size and inline-reference boundaries remain enforced for claims, limits and questions', () => {
  for (const answer of [
    { ...complete, blocks: Array(13).fill(block) },
    { ...complete, blocks: [{ ...block, refs: Array(6).fill('S1') }] },
    { ...complete, blocks: [{ ...block, text: 'x'.repeat(6001) }] },
    { ...complete, limitations: Array(13).fill('Limit') },
    { ...complete, limitations: ['x'.repeat(2001)] },
    { ...complete, clarification: 'x'.repeat(2001) },
    { ...fixtures[3], clarification: 'Question [S1]?' },
    { ...fixtures[5], limitations: ['A limit [S1]'] },
  ]) assert.throws(() => validateAnswer(answer, ['S1']));
});
