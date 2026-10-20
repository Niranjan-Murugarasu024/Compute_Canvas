/**
 * ComputeCanvas — Module 2 Phase 3-A
 * Multi-Snapshot Registry, Integrity & Simulation Regression Suite
 * 
 * Verifies:
 * A. Snapshot Resolution & Independence
 * B. March 2026 Baseline Invariant Integrity
 * C. October 2026 Expanded Snapshot Integrity & Validation
 * D. Engine Pricing Adapter Multi-Snapshot Behavior
 * E. Baseline Simulation Invariant Equivalence (0.000000000 Variance)
 * F. Expanded Model Simulations & Fail-Safe Protection
 * G. URL State Serialization & Historical Deserialization Compatibility
 */

import { BASELINE_SNAPSHOT } from '../lib/registry/snapshots/baseline';
import { OCTOBER_2026_SNAPSHOT } from '../lib/registry/snapshots/october2026';
import { getSnapshot, getAllSnapshots } from '../lib/registry/catalog';
import { validateRegistrySnapshot } from '../lib/registry/validator';
import { computeContentHash } from '../lib/registry/hasher';
import {
  resolveRegistryPricing,
  validateArchitectureModels,
  resolveNodePricing,
} from '../lib/registry/adapter';
import { simulate, type Architecture, type Workload } from '../lib/simulation/engine';
import { encodeArchitectureState, decodeArchitectureState, type V1ShareState } from '../lib/simulation/sharing';

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`  ✅ PASSED: ${message}`);
    passCount++;
  } else {
    console.error(`  ❌ FAILED: ${message}`);
    failCount++;
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('──────────────────────────────────────────────────────────');
console.log('COMPUTECANVAS MODULE 2 PHASE 3-A: MULTI-SNAPSHOT TEST SUITE');
console.log('──────────────────────────────────────────────────────────\n');

// ──────────────────────────────────────────────────────────
// Section A: Snapshot Resolution & Independence
// ──────────────────────────────────────────────────────────
console.log('A. Snapshot Resolution & Strict Independence');

const baselineCanonical = getSnapshot(BASELINE_SNAPSHOT.metadata.snapshotId);
assert(baselineCanonical !== undefined, 'Canonical baseline snapshot ID resolves');
assert(baselineCanonical?.metadata.snapshotId === BASELINE_SNAPSHOT.metadata.snapshotId, 'Canonical baseline ID matches snapshot object');

const octoberCanonical = getSnapshot(OCTOBER_2026_SNAPSHOT.metadata.snapshotId);
assert(octoberCanonical !== undefined, 'Canonical October snapshot ID resolves');
assert(octoberCanonical?.metadata.snapshotId === OCTOBER_2026_SNAPSHOT.metadata.snapshotId, 'Canonical October ID matches snapshot object');

// Independence: The two snapshot IDs are distinct
assert(BASELINE_SNAPSHOT.metadata.snapshotId !== OCTOBER_2026_SNAPSHOT.metadata.snapshotId, 'Baseline and October snapshot IDs are strictly distinct');
assert(BASELINE_SNAPSHOT.metadata.contentHash !== OCTOBER_2026_SNAPSHOT.metadata.contentHash, 'Baseline and October content hashes are strictly distinct');

// Label resolution
assert(getSnapshot('2026-03-baseline')?.metadata.snapshotId === BASELINE_SNAPSHOT.metadata.snapshotId, 'Resolves label "2026-03-baseline" to baseline');
assert(getSnapshot('2026-10-expanded')?.metadata.snapshotId === OCTOBER_2026_SNAPSHOT.metadata.snapshotId, 'Resolves label "2026-10-expanded" to October');

// Alias resolution
assert(getSnapshot('2026-03')?.metadata.snapshotId === BASELINE_SNAPSHOT.metadata.snapshotId, 'Resolves alias "2026-03" to baseline');
assert(getSnapshot('March 2026')?.metadata.snapshotId === BASELINE_SNAPSHOT.metadata.snapshotId, 'Resolves alias "March 2026" to baseline');
assert(getSnapshot('v1.4')?.metadata.snapshotId === BASELINE_SNAPSHOT.metadata.snapshotId, 'Resolves legacy alias "v1.4" to baseline');
assert(getSnapshot('2026-10')?.metadata.snapshotId === OCTOBER_2026_SNAPSHOT.metadata.snapshotId, 'Resolves alias "2026-10" to October');
assert(getSnapshot('October 2026')?.metadata.snapshotId === OCTOBER_2026_SNAPSHOT.metadata.snapshotId, 'Resolves alias "October 2026" to October');

// Rejection of unknown snapshots
assert(getSnapshot('unknown-snap-99') === undefined, 'Unknown snapshot ID returns undefined');
assert(getSnapshot('') === undefined, 'Empty string snapshot ID returns undefined');
assert(getAllSnapshots().length === 2, 'Catalog contains exactly 2 registered snapshots');


// ──────────────────────────────────────────────────────────
// Section B: March 2026 Baseline Invariant Integrity
// ──────────────────────────────────────────────────────────
console.log('\nB. March 2026 Baseline Invariant Integrity');

assert(BASELINE_SNAPSHOT.metadata.snapshotId === 'snap-cc-3b3fbd4cbab4e979', 'Baseline canonical snapshot ID is strictly "snap-cc-3b3fbd4cbab4e979"');
assert(BASELINE_SNAPSHOT.metadata.contentHash === '3b3fbd4cbab4e9794d4f76ebb2ffcbb865b7a35232248e24aae986e7bf22080c', 'Baseline content hash is strictly preserved');
assert(BASELINE_SNAPSHOT.models.length === 6, 'Baseline contains exactly 6 models');
assert(BASELINE_SNAPSHOT.pricing.length === 6, 'Baseline contains exactly 6 pricing records');
assert(BASELINE_SNAPSHOT.infrastructure.length === 4, 'Baseline contains exactly 4 infrastructure records');
assert(BASELINE_SNAPSHOT.assumptions.length === 16, 'Baseline contains exactly 16 assumptions');
assert(Object.isFrozen(BASELINE_SNAPSHOT), 'Baseline snapshot object is frozen');
assert(Object.isFrozen(BASELINE_SNAPSHOT.models), 'Baseline models array is frozen');


// ──────────────────────────────────────────────────────────
// Section C: October 2026 Expanded Snapshot Integrity
// ──────────────────────────────────────────────────────────
console.log('\nC. October 2026 Expanded Snapshot Integrity');

assert(OCTOBER_2026_SNAPSHOT.models.length === 12, 'October snapshot contains exactly 12 models (6 baseline + 3 active + 3 historical)');
assert(OCTOBER_2026_SNAPSHOT.pricing.length === 12, 'October snapshot contains exactly 12 pricing records (1:1 with models)');
assert(OCTOBER_2026_SNAPSHOT.infrastructure.length === 4, 'October snapshot preserves exactly 4 infrastructure records');
assert(OCTOBER_2026_SNAPSHOT.assumptions.length === 28, 'October snapshot contains exactly 28 assumptions (16 baseline + 6 active + 6 historical)');

// Schema validation on October snapshot
const validationReport = validateRegistrySnapshot(OCTOBER_2026_SNAPSHOT);
assert(validationReport.isValid, 'October snapshot passes complete registry validation');
assert(validationReport.fatalCount === 0, 'October snapshot has 0 fatal validation violations');

const octoberModelMap = new Map(OCTOBER_2026_SNAPSHOT.models.map(m => [m.id, m]));
const octoberPricingMap = new Map(OCTOBER_2026_SNAPSHOT.pricing.map(p => [p.resourceId, p]));

// 1. Audit active models: Exactly 6 models are ACTIVE in October 2026
const verifiedActiveModelIds = [
  'gpt-4o-mini',
  'gpt-4o',
  'gemini-2.5-pro',
  'deepseek-flash',
  'meta-llama/Llama-3.3-70B-Instruct-Turbo',
  'mistral-large-latest',
];

const actualActiveModels = OCTOBER_2026_SNAPSHOT.models.filter(m => m.status === 'ACTIVE');
assert(actualActiveModels.length === 6, `October snapshot contains strictly 6 ACTIVE models (got: ${actualActiveModels.length})`);

for (const modelId of verifiedActiveModelIds) {
  const model = octoberModelMap.get(modelId);
  const pricing = octoberPricingMap.get(modelId);
  assert(model !== undefined, `Active model "${modelId}" exists in October snapshot`);
  assert(pricing !== undefined, `Pricing record exists for "${modelId}" in October snapshot`);
  assert(pricing!.inputPricePer1M > 0, `Input price for "${modelId}" is strictly positive ($${pricing?.inputPricePer1M})`);
  assert(pricing!.outputPricePer1M > 0, `Output price for "${modelId}" is strictly positive ($${pricing?.outputPricePer1M})`);
  assert(model!.contextWindowTokens >= 128000, `Context window for "${modelId}" is >= 128k (${model?.contextWindowTokens})`);
  assert(model!.baselineLatencyMs > 0, `Baseline latency for "${modelId}" is positive (${model?.baselineLatencyMs}ms)`);
}

// Verify DeepSeek Flash active configuration & 1M context window
const deepseekFlashModel = octoberModelMap.get('deepseek-flash');
assert(deepseekFlashModel !== undefined, 'Active DeepSeek model deepseek-flash exists');
assert(deepseekFlashModel?.contextWindowTokens === 1048576, 'DeepSeek Flash context window is strictly 1,048,576 tokens (1M)');
assert(deepseekFlashModel?.status === 'ACTIVE', 'DeepSeek Flash lifecycle status is ACTIVE');

// Verify historical deepseek-chat separation
const deepseekChatModel = octoberModelMap.get('deepseek-chat');
assert(deepseekChatModel !== undefined, 'Historical deepseek-chat is preserved as a separate model record');
assert(deepseekChatModel?.status === 'DISCONTINUED', 'Historical deepseek-chat is marked DISCONTINUED');
assert(deepseekChatModel?.contextWindowTokens === 128000, 'Historical deepseek-chat preserves 128K context window');

// 2. Audit retired / non-active models: Exactly 6 models are NOT ACTIVE in October 2026
const retiredOctoberModelIds = [
  'gemini-2.0-flash',    // Endpoint shut down June 1, 2026
  'claude-3-haiku',      // claude-3-haiku-20240307 retired April 20, 2026
  'claude-3.5-sonnet',   // claude-3-5-sonnet-20240620 retired October 28, 2025
  'deepseek-chat',       // Discontinued July 24, 2026
  'deepseek-reasoner',   // Discontinued July 24, 2026
  'mistral-large-2411',  // Deprecated February 27, 2026
];

for (const modelId of retiredOctoberModelIds) {
  const model = octoberModelMap.get(modelId);
  assert(model !== undefined, `Historical/retired model "${modelId}" is retained in snapshot`);
  assert(model!.status !== 'ACTIVE', `STRICT: Retired model "${modelId}" is NOT classified as ACTIVE in October snapshot (status: ${model?.status})`);
}

// 3. Verify single representation of Llama 3.3 70B (Together AI Serverless)
assert(octoberModelMap.has('meta-llama/Llama-3.3-70B-Instruct-Turbo'), 'Canonical Together AI Llama endpoint is registered');
assert(!octoberModelMap.has('llama-3.3-70b-instruct'), 'Duplicate llama-3.3-70b-instruct model record is REMOVED from models catalog');
assert(!octoberPricingMap.has('llama-3.3-70b-instruct'), 'Duplicate llama-3.3-70b-instruct pricing record is REMOVED from pricing catalog');
const llamaRecord = octoberModelMap.get('meta-llama/Llama-3.3-70B-Instruct-Turbo');
assert(llamaRecord?.legacyAlias === 'llama-3.3-70b-instruct', 'Llama record specifies legacyAlias: "llama-3.3-70b-instruct"');

// 4. Verify Anthropic dated model aliases
const haikuRecord = octoberModelMap.get('claude-3-haiku');
assert(haikuRecord?.legacyAlias === 'claude-3-haiku-20240307', 'Claude 3 Haiku maps to dated model alias claude-3-haiku-20240307');
const sonnetRecord = octoberModelMap.get('claude-3.5-sonnet');
assert(sonnetRecord?.legacyAlias === 'claude-3-5-sonnet-20240620', 'Claude 3.5 Sonnet maps to dated model alias claude-3-5-sonnet-20240620');

// 5. Verify claude-haiku-5-5 is strictly EXCLUDED to eliminate undercounting risk
assert(!octoberModelMap.has('claude-haiku-5-5'), 'Tiered model "claude-haiku-5-5" is strictly EXCLUDED from October snapshot');
assert(!octoberPricingMap.has('claude-haiku-5-5'), 'claude-haiku-5-5 has NO pricing record in October snapshot');

// Immutability
assert(Object.isFrozen(OCTOBER_2026_SNAPSHOT), 'October snapshot object is deeply frozen');
assert(Object.isFrozen(OCTOBER_2026_SNAPSHOT.models), 'October snapshot models array is deeply frozen');


// ──────────────────────────────────────────────────────────
// Section D: Engine Pricing Adapter Multi-Snapshot Behavior
// ──────────────────────────────────────────────────────────
console.log('\nD. Engine Pricing Adapter Multi-Snapshot Behavior');

const baselineBundleRes = resolveRegistryPricing(BASELINE_SNAPSHOT.metadata.snapshotId);
assert(baselineBundleRes.ok, 'Resolves baseline bundle via adapter');
if (baselineBundleRes.ok) {
  assert(baselineBundleRes.bundle.isBaseline, 'Baseline bundle is marked isBaseline: true');
  assert(Object.keys(baselineBundleRes.bundle.models).length === 6, 'Baseline bundle contains exactly 6 models');
}

const octoberBundleRes = resolveRegistryPricing(OCTOBER_2026_SNAPSHOT.metadata.snapshotId);
assert(octoberBundleRes.ok, 'Resolves October bundle via adapter');
if (octoberBundleRes.ok) {
  assert(!octoberBundleRes.bundle.isBaseline, 'October bundle is marked isBaseline: false');
  // 12 canonical models + 3 aliases (llama-3.3-70b-instruct, claude-3-haiku-20240307, claude-3-5-sonnet-20240620) = 15 keys
  assert(Object.keys(octoberBundleRes.bundle.models).length === 15, 'October bundle contains 15 keys (12 models + 3 compatibility aliases)');
}

// Node resolution differences across bundles
if (baselineBundleRes.ok && octoberBundleRes.ok) {
  const newModelNode = { id: 'node-test', type: 'fast-model', modelId: 'deepseek-flash' };
  
  const inOctober = resolveNodePricing(newModelNode, octoberBundleRes.bundle);
  assert(inOctober !== undefined, 'deepseek-flash resolves in October bundle');
  assert(inOctober?.pricing.inputPricePer1M === 0.30, 'deepseek-flash input price in October bundle is $0.30');

  const inBaseline = resolveNodePricing(newModelNode, baselineBundleRes.bundle);
  assert(inBaseline === undefined, 'deepseek-flash returns undefined (unpriced) in Baseline bundle');

  // Verify Llama canonical ID and alias resolution in October bundle
  const llamaCanonical = resolveNodePricing({ type: 'frontier-model', modelId: 'meta-llama/Llama-3.3-70B-Instruct-Turbo' }, octoberBundleRes.bundle);
  const llamaAlias = resolveNodePricing({ type: 'frontier-model', modelId: 'llama-3.3-70b-instruct' }, octoberBundleRes.bundle);
  assert(llamaCanonical !== undefined, 'Llama canonical endpoint resolves in October bundle');
  assert(llamaAlias !== undefined, 'Llama alias "llama-3.3-70b-instruct" resolves in October bundle');
  assert(llamaCanonical?.pricing.inputPricePer1M === llamaAlias?.pricing.inputPricePer1M, 'Canonical and alias Llama pricing match ($1.04)');
  assert(llamaCanonical?.pricing.outputPricePer1M === 1.04, 'Llama output price matches ($1.04)');

  // Verify dated Anthropic aliases resolve to the historical record
  const haikuDated = resolveNodePricing({ type: 'fast-model', modelId: 'claude-3-haiku-20240307' }, octoberBundleRes.bundle);
  assert(haikuDated !== undefined, 'Dated alias claude-3-haiku-20240307 resolves in October bundle');
  assert(haikuDated?.pricing.status === 'DISCONTINUED', 'Dated alias reflects DISCONTINUED lifecycle status');

  const sonnetDated = resolveNodePricing({ type: 'frontier-model', modelId: 'claude-3-5-sonnet-20240620' }, octoberBundleRes.bundle);
  assert(sonnetDated !== undefined, 'Dated alias claude-3-5-sonnet-20240620 resolves in October bundle');
  assert(sonnetDated?.pricing.status === 'DISCONTINUED', 'Dated alias reflects DISCONTINUED lifecycle status');

  // Verify excluded model returns undefined in both bundles
  const claudeNode = { id: 'node-claude', type: 'fast-model', modelId: 'claude-haiku-5-5' };
  assert(resolveNodePricing(claudeNode, octoberBundleRes.bundle) === undefined, 'claude-haiku-5-5 returns undefined in October bundle');
  assert(resolveNodePricing(claudeNode, baselineBundleRes.bundle) === undefined, 'claude-haiku-5-5 returns undefined in Baseline bundle');
}

// Architecture model validation
if (baselineBundleRes.ok && octoberBundleRes.ok) {
  const archWithNewModel: Architecture = {
    id: 'test-deepseek-arch',
    name: 'DeepSeek Flash Test',
    nodes: [
      { id: 'api', type: 'api', label: 'API Ingress' },
      { id: 'm1', type: 'fast-model', label: 'DeepSeek Flash', modelId: 'deepseek-flash' },
    ],
    edges: [{ source: 'api', target: 'm1' }],
  };

  const validInOctober = validateArchitectureModels(archWithNewModel, octoberBundleRes.bundle);
  assert(validInOctober.isValid, 'Architecture with deepseek-flash is VALID in October bundle');

  const invalidInBaseline = validateArchitectureModels(archWithNewModel, baselineBundleRes.bundle);
  assert(!invalidInBaseline.isValid, 'Architecture with deepseek-flash is INVALID in Baseline bundle');
  assert(invalidInBaseline.errors[0].includes('deepseek-flash'), 'Baseline error mentions deepseek-flash explicitly');
}


// ──────────────────────────────────────────────────────────
// Section E: Baseline Simulation Invariant Equivalence
// ──────────────────────────────────────────────────────────
console.log('\nE. Baseline Simulation Invariant Equivalence');

const workload1M: Workload = {
  requestsPerMonth: 1_000_000,
  avgInputTokens: 800,
  avgOutputTokens: 200,
  cacheHitRate: 0,
};

const directArch: Architecture = {
  id: 'direct-llm',
  name: 'Direct LLM',
  nodes: [
    { id: 'api-gateway', type: 'api', label: 'API Ingress Gateway' },
    { id: 'frontier-model', type: 'frontier-model', label: 'GPT-4o', modelId: 'gpt-4o' },
  ],
  edges: [{ source: 'api-gateway', target: 'frontier-model' }],
};

const baselineRun = simulate({
  workload: workload1M,
  architecture: directArch,
  pricingSnapshot: '2026-03',
});
assert(baselineRun.validation.isValid, 'Baseline simulation is valid');
assert(baselineRun.monthlyCost === 4001, 'Baseline Direct LLM cost is strictly $4,001.00');
assert(baselineRun.latencies.p95 === 392, 'Baseline Direct LLM P95 latency is strictly 392ms');
assert(baselineRun.provenance?.pricingSnapshot === '2026-03', 'Baseline provenance snapshot is 2026-03');


// ──────────────────────────────────────────────────────────
// Section F: Expanded Model Simulations & Fail-Safe Protection
// ──────────────────────────────────────────────────────────
console.log('\nF. Expanded Model Simulations & Fail-Safe Protection');

// Expected cost calculations for 1M requests (800 in, 200 out) + Ingress ($1.00):
// deepseek-flash: In = 800 * $0.30 = $240, Out = 200 * $1.20 = $240, Total model = $480, + $1.00 ingress = $481.00
// llama-3.3-70b-instruct: In = 800 * $1.04 = $832, Out = 200 * $1.04 = $208, Total model = $1040, + $1.00 ingress = $1041.00
// meta-llama/Llama-3.3-70B-Instruct-Turbo: In = 800 * $1.04 = $832, Out = 200 * $1.04 = $208, Total model = $1040, + $1.00 ingress = $1041.00
// mistral-large-latest: In = 800 * $2.00 = $1600, Out = 200 * $6.00 = $1200, Total model = $2800, + $1.00 ingress = $2801.00

const expectedExpandedModels = [
  { modelId: 'deepseek-flash', nodeType: 'fast-model' as const, expectedMonthlyCost: 481.00, expectedP95: 122 },
  { modelId: 'llama-3.3-70b-instruct', nodeType: 'frontier-model' as const, expectedMonthlyCost: 1041.00, expectedP95: 292 },
  { modelId: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', nodeType: 'frontier-model' as const, expectedMonthlyCost: 1041.00, expectedP95: 292 },
  { modelId: 'mistral-large-latest', nodeType: 'frontier-model' as const, expectedMonthlyCost: 2801.00, expectedP95: 372 },
];

for (const exp of expectedExpandedModels) {
  const arch: Architecture = {
    id: `arch-${exp.modelId}`,
    name: `Test ${exp.modelId}`,
    nodes: [
      { id: 'api', type: 'api', label: 'API Gateway' },
      { id: 'model', type: exp.nodeType, label: exp.modelId, modelId: exp.modelId },
    ],
    edges: [{ source: 'api', target: 'model' }],
  };

  // 1. Simulation under October snapshot: Valid and deterministic
  const octResult = simulate({
    workload: workload1M,
    architecture: arch,
    pricingSnapshot: '2026-10',
  });
  assert(octResult.validation.isValid, `October simulation for "${exp.modelId}" is VALID`);
  assert(octResult.monthlyCost === exp.expectedMonthlyCost, `Cost for "${exp.modelId}" is strictly $${exp.expectedMonthlyCost} (actual: $${octResult.monthlyCost})`);
  assert(octResult.latencies.p95 === exp.expectedP95, `P95 for "${exp.modelId}" is strictly ${exp.expectedP95}ms (actual: ${octResult.latencies.p95}ms)`);
  assert(octResult.calculationTrace.models[0]?.modelId === exp.modelId, `Trace records modelId "${exp.modelId}"`);

  // 2. Simulation under Baseline snapshot: Rejected with explicit error (no silent fallback!)
  const baseResult = simulate({
    workload: workload1M,
    architecture: arch,
    pricingSnapshot: '2026-03',
  });
  assert(!baseResult.validation.isValid, `Baseline simulation rejects "${exp.modelId}"`);
  assert(baseResult.monthlyCost === 0, `Rejected baseline simulation returns monthlyCost 0 (got: ${baseResult.monthlyCost})`);
  assert(baseResult.validation.errors.some(e => e.includes(exp.modelId)), `Baseline error diagnostic mentions "${exp.modelId}"`);
}

// Fail-safe protection: Tiered model claude-haiku-5-5 cannot be simulated and undercounted
const claudeArch: Architecture = {
  id: 'arch-claude',
  name: 'Test Claude Haiku',
  nodes: [
    { id: 'api', type: 'api', label: 'API Gateway' },
    { id: 'model', type: 'fast-model', label: 'Claude Haiku', modelId: 'claude-haiku-5-5' },
  ],
  edges: [{ source: 'api', target: 'model' }],
};

const octClaudeResult = simulate({
  workload: workload1M,
  architecture: claudeArch,
  pricingSnapshot: '2026-10',
});
assert(!octClaudeResult.validation.isValid, 'October simulation REJECTS unpriced claude-haiku-5-5');
assert(octClaudeResult.monthlyCost === 0, 'Rejected October Claude simulation returns monthlyCost: 0');
assert(octClaudeResult.validation.errors.some(e => e.includes('claude-haiku-5-5')), 'Error mentions claude-haiku-5-5 explicitly');

const baseClaudeResult = simulate({
  workload: workload1M,
  architecture: claudeArch,
  pricingSnapshot: '2026-03',
});
assert(!baseClaudeResult.validation.isValid, 'Baseline simulation REJECTS claude-haiku-5-5');
assert(baseClaudeResult.monthlyCost === 0, 'Rejected Baseline Claude simulation returns monthlyCost: 0');


// ──────────────────────────────────────────────────────────
// Section G: URL State Serialization & Deserialization
// ──────────────────────────────────────────────────────────
console.log('\nG. URL State Serialization & Deserialization');

// 1. Standard URL encoding and decoding preserves baseline state
const directArchForShare: Architecture = {
  id: 'direct-llm',
  name: 'Direct LLM',
  nodes: [
    { id: 'api', type: 'api', label: 'API Gateway' },
    { id: 'm', type: 'frontier-model', label: 'GPT-4o', modelId: 'gpt-4o' },
  ],
  edges: [{ source: 'api', target: 'm' }],
};

const encodedState = encodeArchitectureState({
  architecture: directArchForShare,
  workload: workload1M,
});
const decodedState = decodeArchitectureState(encodedState);
assert(decodedState.success, 'Standard URL payload decodes cleanly');
if (decodedState.success && decodedState.data) {
  assert(decodedState.data.pricingSnapshot === '2026-03', 'Default shared URL preserves baseline snapshot as "2026-03"');
  const restoredSim = simulate({
    workload: decodedState.data.workload,
    architecture: decodedState.data.architecture,
    pricingSnapshot: decodedState.data.pricingSnapshot,
  });
  assert(restoredSim.monthlyCost === 4001, 'Restored baseline simulation cost is exact ($4,001.00)');
  assert(restoredSim.latencies.p95 === 392, 'Restored baseline P95 latency is exact (392ms)');
}

// 2. Custom snapshot payload serialization and roundtrip
function encodeCustomPayload(payload: V1ShareState): string {
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

const customOctoberPayload: V1ShareState = {
  version: 1,
  schemaVersion: '1.0',
  registryVersion: 'v1.5',
  pricingSnapshot: OCTOBER_2026_SNAPSHOT.metadata.snapshotId,
  architecture: {
    id: 'oct-share',
    name: 'October Llama Arch',
    nodes: [
      { id: 'api', type: 'api', label: 'API Gateway' },
      { id: 'm', type: 'frontier-model', label: 'Together Llama 3.3 70B', modelId: 'meta-llama/Llama-3.3-70B-Instruct-Turbo' },
    ],
    edges: [{ source: 'api', target: 'm' }],
  },
  workload: workload1M,
};

const octEncoded = encodeCustomPayload(customOctoberPayload);
const octDecoded = decodeArchitectureState(octEncoded);
assert(octDecoded.success, 'October snapshot URL payload decodes cleanly');
if (octDecoded.success && octDecoded.data) {
  assert(octDecoded.data.pricingSnapshot === OCTOBER_2026_SNAPSHOT.metadata.snapshotId, 'Canonical October snapshot ID is preserved');
  const restoredOctSim = simulate({
    workload: octDecoded.data.workload,
    architecture: octDecoded.data.architecture,
    pricingSnapshot: octDecoded.data.pricingSnapshot,
  });
  assert(restoredOctSim.validation.isValid, 'Restored October simulation is valid');
  assert(restoredOctSim.monthlyCost === 1041.00, 'Restored October simulation cost is exact ($1,041.00)');
  assert(restoredOctSim.latencies.p95 === 292, 'Restored October P95 latency is exact (292ms)');
}

// ──────────────────────────────────────────────────────────
// Section H: Gate 2 — Discontinued / Deprecated Lifecycle Simulation Enforcement
// ──────────────────────────────────────────────────────────
console.log('\nH. Gate 2: Lifecycle Simulation Enforcement & Positive Controls');

// Test all 6 canonical discontinued/deprecated October models
const discontinuedOctoberModels = [
  { modelId: 'gemini-2.0-flash', status: 'DISCONTINUED', baselineCost: 161.00 },
  { modelId: 'claude-3-haiku', status: 'DISCONTINUED', baselineCost: 451.00 },
  { modelId: 'claude-3.5-sonnet', status: 'DISCONTINUED', baselineCost: 5401.00 },
  { modelId: 'deepseek-chat', status: 'DISCONTINUED', baselineCost: null },
  { modelId: 'deepseek-reasoner', status: 'DISCONTINUED', baselineCost: null },
  { modelId: 'mistral-large-2411', status: 'DEPRECATED', baselineCost: null },
];

for (const item of discontinuedOctoberModels) {
  const testArch: Architecture = {
    id: `arch-${item.modelId}`,
    name: `Test ${item.modelId}`,
    nodes: [
      { id: 'api', type: 'api', label: 'API Gateway' },
      { id: 'model', type: 'fast-model', label: item.modelId, modelId: item.modelId },
    ],
    edges: [{ source: 'api', target: 'model' }],
  };

  // 1. October simulation MUST fail deterministically with zeroed economics
  const octSim = simulate({
    workload: workload1M,
    architecture: testArch,
    pricingSnapshot: '2026-10',
  });
  assert(!octSim.validation.isValid, `October simulation strictly REJECTS ${item.status} model "${item.modelId}"`);
  assert(octSim.monthlyCost === 0, `Simulation with ${item.status} model "${item.modelId}" returns monthlyCost: 0`);
  assert(octSim.costPerRequest === 0, `Simulation with ${item.status} model "${item.modelId}" returns costPerRequest: 0`);
  assert(octSim.p95Latency === 0, `Simulation with ${item.status} model "${item.modelId}" returns p95Latency: 0`);
  assert(
    octSim.validation.errors.some(e => e.includes(item.modelId) && (e.includes('DISCONTINUED') || e.includes('DEPRECATED'))),
    `Diagnostic error explicitly mentions "${item.modelId}" and "${item.status}"`
  );

  // 2. If present in March baseline, March simulation MUST continue to reproduce valid baseline results
  if (item.baselineCost !== null) {
    const marchSim = simulate({
      workload: workload1M,
      architecture: testArch,
      pricingSnapshot: '2026-03',
    });
    assert(marchSim.validation.isValid, `Historical March simulation accepts "${item.modelId}"`);
    assert(marchSim.monthlyCost === item.baselineCost, `Historical March simulation matches exact baseline cost ($${item.baselineCost})`);
  }
}

// Test legacy aliases of discontinued models in October
const discontinuedAliases = [
  { alias: 'claude-3-haiku-20240307', canonical: 'claude-3-haiku' },
  { alias: 'claude-3-5-sonnet-20240620', canonical: 'claude-3.5-sonnet' },
];

for (const aliasItem of discontinuedAliases) {
  const testArch: Architecture = {
    id: `arch-alias-${aliasItem.alias}`,
    name: `Test Alias ${aliasItem.alias}`,
    nodes: [
      { id: 'api', type: 'api', label: 'API Gateway' },
      { id: 'model', type: 'fast-model', label: aliasItem.alias, modelId: aliasItem.alias },
    ],
    edges: [{ source: 'api', target: 'model' }],
  };

  const aliasOctSim = simulate({
    workload: workload1M,
    architecture: testArch,
    pricingSnapshot: '2026-10',
  });
  assert(!aliasOctSim.validation.isValid, `Legacy alias "${aliasItem.alias}" CANNOT bypass lifecycle enforcement`);
  assert(aliasOctSim.monthlyCost === 0, `Simulation with legacy alias "${aliasItem.alias}" returns monthlyCost: 0`);
  assert(
    aliasOctSim.validation.errors.some(e => e.includes(aliasItem.alias) && e.includes('DISCONTINUED')),
    `Diagnostic error explicitly mentions alias "${aliasItem.alias}" is DISCONTINUED`
  );
}

// Positive Control: Valid active model simulation in October
const positiveControlArch: Architecture = {
  id: 'positive-control-llama',
  name: 'Positive Control Llama',
  nodes: [
    { id: 'api', type: 'api', label: 'API Gateway' },
    { id: 'model', type: 'frontier-model', label: 'Llama 3.3', modelId: 'meta-llama/Llama-3.3-70B-Instruct-Turbo' },
  ],
  edges: [{ source: 'api', target: 'model' }],
};

const positiveControlSim = simulate({
  workload: workload1M,
  architecture: positiveControlArch,
  pricingSnapshot: '2026-10',
});
assert(positiveControlSim.validation.isValid, 'Positive control active model simulation is VALID');
assert(positiveControlSim.monthlyCost === 1041.00, 'Positive control simulation returns exact monthlyCost ($1,041.00)');
assert(positiveControlSim.p95Latency === 292, 'Positive control simulation returns exact P95 latency (292ms)');


// ──────────────────────────────────────────────────────────
// Section I: Gate 3 — Alias Collision Resistance & Ambiguity Rejection
// ──────────────────────────────────────────────────────────
console.log('\nI. Gate 3: Alias Collision Resistance & Ambiguity Rejection');

// 1. Verify single representation in catalog
const llamaMatches = OCTOBER_2026_SNAPSHOT.models.filter(
  m => m.id === 'meta-llama/Llama-3.3-70B-Instruct-Turbo' || m.id === 'llama-3.3-70b-instruct'
);
assert(llamaMatches.length === 1, 'Llama 3.3 70B exists exactly once in October catalog');
assert(llamaMatches[0].id === 'meta-llama/Llama-3.3-70B-Instruct-Turbo', 'Canonical ID is meta-llama/Llama-3.3-70B-Instruct-Turbo');
assert(llamaMatches[0].legacyAlias === 'llama-3.3-70b-instruct', 'llama-3.3-70b-instruct is an alias, not a separate model record');

// 2. Both canonical ID and alias resolve to identical pricing record
if (octoberBundleRes.ok) {
  const canonicalRec = octoberBundleRes.bundle.models['meta-llama/Llama-3.3-70B-Instruct-Turbo'];
  const aliasRec = octoberBundleRes.bundle.models['llama-3.3-70b-instruct'];
  assert(canonicalRec !== undefined, 'Canonical Llama resolves in adapter bundle');
  assert(aliasRec !== undefined, 'Alias Llama resolves in adapter bundle');
  assert(canonicalRec === aliasRec, 'Canonical ID and alias reference the exact same PricingRecord object');
  assert(aliasRec.inputPricePer1M === 1.04, 'Alias input price is $1.04');
  assert(aliasRec.outputPricePer1M === 1.04, 'Alias output price is $1.04');
  assert(aliasRec.status === 'ACTIVE', 'Alias status is ACTIVE');
}

// 3. Rejection of ambiguous aliases by validator
const ambiguousAliasSnapshot = JSON.parse(JSON.stringify(OCTOBER_2026_SNAPSHOT));
ambiguousAliasSnapshot.models[0].legacyAlias = 'shared-alias';
ambiguousAliasSnapshot.models[1].legacyAlias = 'shared-alias';
const ambigValidation = validateRegistrySnapshot(ambiguousAliasSnapshot);
assert(!ambigValidation.isValid, 'Validator rejects ambiguous alias defined on multiple models');
assert(ambigValidation.violations.some(v => v.message.includes('Ambiguous alias')), 'Violation message mentions ambiguous alias');

// 4. Rejection of alias colliding with canonical ID
const collidingAliasSnapshot = JSON.parse(JSON.stringify(OCTOBER_2026_SNAPSHOT));
collidingAliasSnapshot.models[0].legacyAlias = 'gpt-4o'; // collides with existing canonical ID
const collValidation = validateRegistrySnapshot(collidingAliasSnapshot);
assert(!collValidation.isValid, 'Validator rejects alias colliding with canonical model ID');
assert(collValidation.violations.some(v => v.message.includes('Alias collision')), 'Violation message mentions alias collision');

// 5. Rejection of duplicate pricing resource reference
const duplicatePricingResourceSnapshot = JSON.parse(JSON.stringify(OCTOBER_2026_SNAPSHOT));
duplicatePricingResourceSnapshot.pricing[1].resourceId = duplicatePricingResourceSnapshot.pricing[0].resourceId;
const dupPricingValidation = validateRegistrySnapshot(duplicatePricingResourceSnapshot);
assert(!dupPricingValidation.isValid, 'Validator rejects multiple pricing records for the same resource');
assert(dupPricingValidation.violations.some(v => v.message.includes('Duplicate pricing resource')), 'Violation message mentions duplicate pricing resource');


// ──────────────────────────────────────────────────────────
// Section J: Gate 4 — Snapshot Cryptographic Verification & Tamper Detection
// ──────────────────────────────────────────────────────────
console.log('\nJ. Gate 4: Snapshot Cryptographic Verification & Tamper Detection');

// 1. Recompute canonical content hashes
const recomputedBaselineHash = computeContentHash({
  models: BASELINE_SNAPSHOT.models,
  pricing: BASELINE_SNAPSHOT.pricing,
  infrastructure: BASELINE_SNAPSHOT.infrastructure,
  assumptions: BASELINE_SNAPSHOT.assumptions,
});
assert(recomputedBaselineHash === BASELINE_SNAPSHOT.metadata.contentHash, 'Baseline recomputed hash strictly matches metadata contentHash');
assert(BASELINE_SNAPSHOT.metadata.snapshotId === `snap-cc-${recomputedBaselineHash.slice(0, 16)}`, 'Baseline snapshot ID strictly matches derivation rule');

const recomputedOctoberHash = computeContentHash({
  models: OCTOBER_2026_SNAPSHOT.models,
  pricing: OCTOBER_2026_SNAPSHOT.pricing,
  infrastructure: OCTOBER_2026_SNAPSHOT.infrastructure,
  assumptions: OCTOBER_2026_SNAPSHOT.assumptions,
});
assert(recomputedOctoberHash === OCTOBER_2026_SNAPSHOT.metadata.contentHash, 'October recomputed hash strictly matches metadata contentHash');
assert(OCTOBER_2026_SNAPSHOT.metadata.snapshotId === `snap-cc-${recomputedOctoberHash.slice(0, 16)}`, 'October snapshot ID strictly matches derivation rule');

// 2. Hash determinism across 10 repeated executions
let isDeterministic = true;
for (let i = 0; i < 10; i++) {
  const hashRun = computeContentHash({
    models: OCTOBER_2026_SNAPSHOT.models,
    pricing: OCTOBER_2026_SNAPSHOT.pricing,
    infrastructure: OCTOBER_2026_SNAPSHOT.infrastructure,
    assumptions: OCTOBER_2026_SNAPSHOT.assumptions,
  });
  if (hashRun !== recomputedOctoberHash) {
    isDeterministic = false;
  }
}
assert(isDeterministic, 'Canonical content hashing is 100% deterministic across repeated runs');

// 3. Tamper detection: modifying a price produces hash divergence
const tamperedSnapshot = JSON.parse(JSON.stringify(OCTOBER_2026_SNAPSHOT));
tamperedSnapshot.pricing[0].inputPricePer1M = 999.99;
const tamperedHash = computeContentHash({
  models: tamperedSnapshot.models,
  pricing: tamperedSnapshot.pricing,
  infrastructure: tamperedSnapshot.infrastructure,
  assumptions: tamperedSnapshot.assumptions,
});
assert(tamperedHash !== OCTOBER_2026_SNAPSHOT.metadata.contentHash, 'Tampered snapshot produces divergent content hash (tampering detected)');
assert(`snap-cc-${tamperedHash.slice(0, 16)}` !== OCTOBER_2026_SNAPSHOT.metadata.snapshotId, 'Tampered snapshot ID diverges from canonical ID');

// 4. Infrastructure tariffs invariance check
assert(BASELINE_SNAPSHOT.infrastructure.length === 4, 'Baseline has 4 infrastructure tariffs');
assert(OCTOBER_2026_SNAPSHOT.infrastructure.length === 4, 'October has 4 infrastructure tariffs');
for (let i = 0; i < 4; i++) {
  const baseInfra = BASELINE_SNAPSHOT.infrastructure[i];
  const octInfra = OCTOBER_2026_SNAPSHOT.infrastructure[i];
  assert(baseInfra.id === octInfra.id, `Infra tariff [${i}] ID matches (${baseInfra.id})`);
  assert(baseInfra.lookupLatencyMs === octInfra.lookupLatencyMs, `Infra tariff [${i}] latency matches (${baseInfra.lookupLatencyMs}ms)`);
}

console.log('\n──────────────────────────────────────────────────────────');
console.log(`TOTAL MULTI-SNAPSHOT TESTS: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
console.log('──────────────────────────────────────────────────────────\n');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('🏆 ALL MULTI-SNAPSHOT REGISTRY & SIMULATION INVARIANTS PASSED!');
}
