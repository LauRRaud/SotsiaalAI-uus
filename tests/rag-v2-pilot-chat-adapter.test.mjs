import test from 'node:test';
import assert from 'node:assert/strict';
import { pilotChatResult } from '../lib/chat/m4PilotClientContract.js';
import { rememberPilotIntent, forgetPilotIntent } from '../lib/chat/m4PilotIntent.js';
test('normal chat adapter publishes only completed answers and binds every link to a turn', () => {
  assert.equal(pilotChatResult({ state: 'unknown' }, 'conv').ok, false);
  assert.equal(pilotChatResult({ state: 'needs_recovery' }, 'conv').answer, undefined);
  const turn = { id: 'turn-123', state: 'completed', mode: 'test', answer: { kind: 'partial', blocks: [{ text: 'Piiratud vastus', refs: ['S1'] }], limitations: ['Puuduv tingimus'], clarification: null },
    sources: [{ ref: 'S1', title: '<script>not HTML</script>', pages: [3], used: true }] };
  const first = pilotChatResult(turn, 'conv-123');
  const second = pilotChatResult({ ...turn, id: 'turn-456' }, 'conv-123');
  assert.match(first.answer, /Piiratud vastus \[S1\]/);
  assert.match(first.answer, /Puuduv tingimus/);
  assert.match(first.sources[0].url, /^\/chat-source\?convId=conv-123&turnId=turn-123&ref=S1$/);
  assert.notEqual(first.sources[0].key, second.sources[0].key);
  assert.equal(first.pilotKind, 'partial');
});
test('pilot intent survives refresh without storing question text and clears only its own completed key', async () => {
  const map = new Map(); const storage = { getItem: key => map.get(key) || null, setItem: (key, value) => map.set(key, value), removeItem: key => map.delete(key) };
  const input = { convId: 'conversation', text: 'private question', language: 'et', key: 'first-key' };
  assert.equal(await rememberPilotIntent(storage, input), 'first-key');
  assert.equal(await rememberPilotIntent(storage, { ...input, key: 'second-key' }), 'first-key');
  assert.ok(![...map.values()][0].includes(input.text));
  forgetPilotIntent(storage, input.convId, 'other-key'); assert.equal(map.size, 1);
  forgetPilotIntent(storage, input.convId, 'first-key'); assert.equal(map.size, 0);
});
