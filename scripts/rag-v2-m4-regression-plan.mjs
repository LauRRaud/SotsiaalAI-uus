// Preparation only: no provider, SSH, database writes, approval, deployment or pilot activation.
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { digest, buildQuestion, answerRequest, PROMPT_VERSION, QUESTION_VERSION, ANSWER_VERSION, ANSWER_SCHEMA } from '../lib/rag-v2/pilot/contracts.js';
import { implementationManifest } from '../lib/rag-v2/pilot/provenance.js';
const root = path.resolve('tmp/rag-v2-m4-followups');
const read = async file => JSON.parse(await fs.readFile(file, 'utf8'));
const old = await read('tmp/rag-v2-m4-b-ready/server-plan.json');
const results = await read('tmp/rag-v2-m4-b-ready/real-results.json');
const vectors = await read(path.join(root, 'original-vector-inventory.json'));
if (vectors.sourceConfigHash !== digest(old) || vectors.sourcePlanHash !== old.approval.planHash || vectors.rows.length !== 8
  || vectors.ledger.totals.embeddingAttempts !== 8 || vectors.ledger.totals.answerAttempts !== 8) throw Error('original scope/counters mismatch');
const inputs = old.questionPolicy.inputs;
if (inputs.length !== 8 || Date.parse(old.expiresAt) <= Date.now()) throw Error('original artifacts unavailable/expired');
const entries = inputs.map(input => {
  const question = buildQuestion({ question: input.question, contextMode: input.contextMode });
  const source = vectors.rows.find(r => r.queryHash === question.hash);
  const bodyHash = digest({ input: question.text, model: old.embedding.model, dimensions: old.embedding.dimensions, encoding_format: 'float' });
  if (!source || source.vectorDimensions !== old.embedding.dimensions || source.embeddingEvent?.state !== 'response_received'
    || source.embeddingEvent.bodyHash !== bodyHash || Date.parse(source.expiresAt) <= Date.now()) throw Error('original query vector unavailable');
  return { turnId: source.id, queryHash: question.hash, vectorHash: source.vectorHash, embeddingBodyHash: bodyHash };
});
const implementation = await implementationManifest();
const { approval: _oldApproval, ...priorPlan } = old;
const plan = { ...priorPlan, id: 'm4-regression-20260906-1', status: 'draft_not_authorized',
  sourceHead: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', windowsHide: true }).trim(),
  implementationHash: implementation.hash, sourceWorktree: 'local_modified_not_pushed', promptVersion: PROMPT_VERSION, questionVersion: QUESTION_VERSION, answerVersion: ANSWER_VERSION,
  answerSchemaHash: digest(ANSWER_SCHEMA), accountAccess: 'same_account_used_in_original_run_new_run_requires_approval',
  expiresAt: old.expiresAt, queryReuse: { pilotId: old.id, configHash: digest(old), expiresAt: old.expiresAt, entries },
  budget: { attempts: 8, embeddingAttempts: 0, answerAttempts: 8, tokens: 8 * (old.maxInputTokens + old.maxOutputTokens), nanoUsd: 160000000 },
  proposedBudgetNanoUsd: 160000000, proposedBudgetStatus: 'owner_approval_required_not_authorized',
  attemptRule: 'Eight answers maximum. Zero new embeddings; exact still-permitted original query vectors only. Missing, expired, changed, or forbidden vectors stop before answer egress. No automatic fallback, retry or quota reset. A new embedding allowance would require another explicit plan approval.',
  authorizationBasis: { status: 'new_regression_approval_required', scope: 'This regression alone: same eight locked questions and pinned materials, at most eight answer attempts, zero new embeddings, USD 0.16 total cap, within the stated expiry. The previous USD 0.25 grant is historical only.' },
  predecessor: { authorizationBasis: old.authorizationBasis, pilotId: old.id, planHash: old.approval.planHash, configHash: digest(old), completedAttemptCounters: vectors.ledger.totals,
    originalResultsHash: digest(results), inventoryHash: digest(vectors), preserveOriginalRowsAndLedger: true },
  egress: { ...old.egress, query: 'Same eight locked questions; query vectors are reused locally, no embedding endpoint calls.',
    source: 'Same eight pinned document versions, unchanged vector-ranked-first-v1 selection and 6000-token compact context cap. Actual packet and exact body persist before every answer call.',
    reviewLimit: 'Seven original packets are available for paired comparison. For each new UI retrieval, compare model_context plus canonical document/version/chunk/text-hash bindings with the matching original, excluding generated query IDs. A changed packet is reported as changed. Original question 4 has no recoverable packet or invalid draft; its new packet is a new result.' },
  retention: { ...old.retention, ownServer: 'Raw query/vector/audit/answer expires at the earliest of the turn retention, the new plan expiry and reused source turn expiry. No original grant or artifact lifetime is extended.',
    copies: ['Existing permitted original artifacts remain under their original deadline', 'New protected local regression artifacts under tmp/rag-v2-m4-followups: 2026-09-07T08:00:00Z; no automatic extension', 'Existing canonical development corpus retains its separate contract'] },
  regression: { kind: 'same_eight_questions_not_held_out', originalQuestionSetHash: digest(inputs),
    dimensions: ['visible_language_all_answer_parts', 'supported_core_and_completeness', 'unsupported_or_overscoped_claim', 'technical_reference_validity',
      'semantic_reference_support', 'no_raw_citations', 'published_or_withheld', 'refresh_restoration', 'actual_usage', 'latency'],
    acceptance: 'Report all eight separately and retain the supplied packet. Do not equate publication with correctness. Compare attribution, timepoint/trend, recommendation/obligation and training/live-rule scope. No new topics or multi-turn questions in this run.',
    limitation: 'One stochastic rerun is a regression check, not independent generalization evidence or a semantic guarantee.' },
  missing: ['Explicit owner approval of these pinned materials, model/project/tester, unchanged expiry and total USD 0.16 cap',
    'Deployment authorization and validation that the server implementation matches the reviewed file contents; any plan change is reviewed before calls'],
  approval: null };
// Detailed lower estimate from the seven actual retained packets; question 4 uses the full approved input ceiling.
const estimates = inputs.map(input => {
  const row = results.turns.find(r => r.payload.question === input.question);
  const bound = row?.payload.packet ? Buffer.byteLength(JSON.stringify(answerRequest(plan, input.question, row.payload.packet.model_context, input.language)), 'utf8') + 1024 : plan.maxInputTokens;
  if (bound > plan.maxInputTokens) throw Error('original packet exceeds new input cap');
  return { queryHash: buildQuestion({ question: input.question, contextMode: input.contextMode }).hash, originalPacketAvailable: !!row?.payload.packet, inputBound: bound,
    answerReservationNanoUsd: bound * plan.prices.answerInput + plan.maxOutputTokens * plan.prices.answerOutput };
});
const calculation = { newEmbeddingAttempts: 0, reusedVectors: entries.length, maximumAnswerAttempts: 8, maximumAnswerInputTokens: 8 * plan.maxInputTokens,
  maximumOutputTokens: 8 * plan.maxOutputTokens, upperReservationNanoUsd: 8 * (plan.maxInputTokens * plan.prices.answerInput + plan.maxOutputTokens * plan.prices.answerOutput),
  oldPacketBasedReservationNanoUsd: estimates.reduce((n,e) => n + e.answerReservationNanoUsd,0), proposedCapNanoUsd: plan.budget.nanoUsd,
  priceBasis: 'Conservative rates retained from original 2026-09-06 plan; verify account/rates before approval if changed. This is a reservation estimate, not an invoice.',
  exactPacketBaselineCount: 7, originalFourthPacket: 'NOT_PROVEN', estimates };
const packetComparisons = results.turns.map(r => ({ turnId: r.id, queryHash: r.payload.query.hash, packetAvailable: !!r.payload.packet,
  ...(r.payload.packet ? { modelContextHash: digest(r.payload.packet.model_context), canonicalBindingsHash: digest(Object.fromEntries(Object.entries(r.payload.packet.reference_map)
    .map(([ref, value]) => [ref, { document: value.document_id, version: value.document_version_id, chunk: value.chunk_id, textHash: value.source_text_sha256, pages: value.pdf_pages }]))) } : {}) }));
for (const [name, value] of Object.entries({ 'regression-plan.json': plan, 'regression-costs.json': calculation,
  'regression-implementation.json': implementation, 'regression-packet-baselines.json': packetComparisons })) {
  await fs.writeFile(path.join(root,name), JSON.stringify(value,null,2), { flag:'wx', mode:0o600 });
}
console.log(JSON.stringify({ output: root, planHashWithoutApproval: digest(Object.fromEntries(Object.entries(plan).filter(([key]) => key !== 'approval'))),
  implementationHash: implementation.hash, approved:false, answers:8, newEmbeddings:0, upperReservationUsd:calculation.upperReservationNanoUsd/1e9,
  oldPacketBasedReservationUsd:calculation.oldPacketBasedReservationNanoUsd/1e9, proposedCapUsd:0.16, externalCalls:0 }));
