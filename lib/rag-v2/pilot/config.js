import fs from 'node:fs/promises';
import { digest, reject, PROMPT_VERSION, QUESTION_VERSION } from './contracts.js';
import { implementationManifest } from './provenance.js';
import { embeddingConfig } from '../search/embedding.js';
import { retrievalProfile } from '../search/profiles.js';
import { ANSWER_ENDPOINT, EMBEDDING_ENDPOINT } from './provider.js';

export async function readPilotConfig(userId) {
  if (process.env.M4_PILOT_ENABLED !== '1' || !process.env.M4_PILOT_CONFIG) reject('pilot_disabled', 404);
  let config; try { config = JSON.parse(await fs.readFile(process.env.M4_PILOT_CONFIG, 'utf8')); } catch { reject('not_configured', 503); }
  if (!Array.isArray(config.users) || !config.users.includes(userId)) reject('pilot_access_denied', 403);
  if (!['test', 'real'].includes(config.mode) || !config.id || !config.tenant || config.usage !== 'development_only'
    || !Number.isFinite(Date.parse(config.expiresAt)) || Date.parse(config.expiresAt) <= Date.now()
    || !Number.isInteger(config.retentionHours) || config.retentionHours < 1 || config.retentionHours > 168
    || !Number.isInteger(config.timeoutMs) || config.timeoutMs < 100 || config.timeoutMs > 60000
    || !config.documents || !Object.keys(config.documents).length) reject('not_configured', 503);
  for (const field of ['attempts', 'tokens', 'nanoUsd']) if (!Number.isSafeInteger(config.budget?.[field]) || config.budget[field] < 0) reject('not_configured', 503);
  const profile = retrievalProfile(config.profileId);
  const embedding = embeddingConfig(config.embedding);
  if (config.mode === 'real') {
    for (const stage of ['embeddingAttempts', 'answerAttempts']) {
      if (!Number.isSafeInteger(config.budget[stage]) || config.budget[stage] < 1 || config.budget[stage] > 8) reject('stage_budget_not_configured', 503);
    }
    if (embedding.embedding_mode !== 'real' || config.endpoint !== ANSWER_ENDPOINT || config.embedding.endpoint !== EMBEDDING_ENDPOINT
      || config.model !== process.env.OPENAI_MODEL || config.model !== 'gpt-5.6-luna' || !process.env.OPENAI_API_KEY
      || !['low', 'medium', 'high'].includes(config.reasoning) || !Number.isInteger(config.maxOutputTokens) || config.maxOutputTokens < 256
      || config.maxOutputTokens > 4096 || !Number.isInteger(config.maxInputTokens) || config.maxInputTokens < 1 || config.maxInputTokens > 128000
      || !/^proj_[A-Za-z0-9_-]+$/.test(config.accountProject || '') || !config.generationId || config.modelContract !== 'responses-strict-reasoning-v1') reject('not_configured', 503);
    if (config.promptVersion !== PROMPT_VERSION || config.questionVersion !== QUESTION_VERSION
      || config.implementationHash !== (await implementationManifest()).hash) reject('implementation_approval_mismatch', 403);
    if (!['embeddingInput', 'answerInput', 'answerOutput'].every(k => Number.isSafeInteger(config.prices?.[k]) && config.prices[k] > 0)) reject('price_not_configured', 503);
    const { approval, ...plan } = config;
    const locked = config.questionPolicy?.mode === 'locked' && Array.isArray(config.questionPolicy.inputs) && config.questionPolicy.inputs.length > 0
      && config.questionPolicy.inputs.every(x => typeof x.question === 'string' && x.contextMode === 'new' && ['et', 'en', 'ru'].includes(x.language));
    const dynamic = config.questionPolicy?.mode === 'bounded_dynamic' && approval?.dynamicQuestions === true;
    if (!approval?.approvedBy || approval.planHash !== digest(plan) || (!locked && !dynamic) || !approval.queryAndSourceEgress
      || !Number.isFinite(Date.parse(approval.approvedAt)) || Date.parse(approval.approvedAt) > Date.now()) reject('pilot_approval_required', 403);
  } else if (embedding.embedding_mode !== 'mock' || process.env.NODE_ENV === 'production') reject('test_mode_development_only', 503);
  return { ...config, profile, embedding, configHash: digest(config) };
}
