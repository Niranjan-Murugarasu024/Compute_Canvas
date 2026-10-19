/**
 * ComputeCanvas — Module 2 Phase 1 Test Suite
 * Comprehensive Verification of Registry Foundation & Invariant Baseline
 * 
 * Verifies:
 * 1. Valid registry records & snapshot validation
 * 2. Negative & malformed prices rejection
 * 3. Missing units & provenance rejection
 * 4. Duplicate identifiers rejection
 * 5. Broken referential integrity rejection
 * 6. Invalid effective-date ranges rejection
 * 7. Unknown-price handling (never converted to 0)
 * 8. Canonicalization independent of object key order
 * 9. Stable content hashing
 * 10. Runtime snapshot immutability
 * 11. Baseline pricing equivalence with Engine 4.0 constants
 * 12. Strict legacy snapshot identifier resolution
 */

import {
  BASELINE_SNAPSHOT,
  OCTOBER_2026_SNAPSHOT,
  validateRegistrySnapshot,
  canonicalizeJson,
  computeContentHash,
  getSnapshot,
  getAllSnapshots,
  RegistrySnapshot,
} from '../lib/registry';
import { MODEL_PRICING, INFRA_PRICING } from '../lib/simulation/engine/cost';
import { ASSUMPTION_REGISTRY } from '../lib/simulation/engine';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASSED: ${message}`);
  } else {
    console.error(`  ❌ FAILED: ${message}`);
    process.exitCode = 1;
  }
}

console.log('──────────────────────────────────────────────────────────');
console.log('COMPUTECANVAS MODULE 2: REGISTRY FOUNDATION TEST SUITE');
console.log('──────────────────────────────────────────────────────────\n');

// 1. Valid Baseline Snapshot Validation
console.log('1. Baseline Snapshot Validation');
const baselineValidation = validateRegistrySnapshot(BASELINE_SNAPSHOT);
assert(baselineValidation.isValid, 'BASELINE_SNAPSHOT passes validation');
assert(baselineValidation.fatalCount === 0, 'BASELINE_SNAPSHOT has exactly 0 fatal violations');
assert(baselineValidation.violations.length === 0, 'BASELINE_SNAPSHOT has 0 violations');
assert(BASELINE_SNAPSHOT.models.length === 6, 'Contains exactly 6 canonical models');
assert(BASELINE_SNAPSHOT.pricing.length === 6, 'Contains exactly 6 model pricing records');
assert(BASELINE_SNAPSHOT.infrastructure.length === 4, 'Contains exactly 4 infrastructure tariff records');
assert(BASELINE_SNAPSHOT.assumptions.length === 16, 'Contains exactly 16 assumption records');

// 2. Negative and Malformed Price Rejection
console.log('\n2. Negative & Malformed Price Rejection');
const negativePriceSnapshot: RegistrySnapshot = JSON.parse(JSON.stringify(BASELINE_SNAPSHOT));
negativePriceSnapshot.pricing[0].inputPricePer1M = -0.50;
const negValidation = validateRegistrySnapshot(negativePriceSnapshot);
assert(!negValidation.isValid, 'Rejects negative inputPricePer1M');
assert(negValidation.fatalCount > 0, 'Reports fatal violation for negative input price');

const negativeOutputSnapshot: RegistrySnapshot = JSON.parse(JSON.stringify(BASELINE_SNAPSHOT));
negativeOutputSnapshot.pricing[0].outputPricePer1M = -10.0;
const negOutValidation = validateRegistrySnapshot(negativeOutputSnapshot);
assert(!negOutValidation.isValid, 'Rejects negative outputPricePer1M');

const negativeInfraSnapshot: RegistrySnapshot = JSON.parse(JSON.stringify(BASELINE_SNAPSHOT));
negativeInfraSnapshot.infrastructure[0].baseMonthlyCost = -100;
const negInfraValidation = validateRegistrySnapshot(negativeInfraSnapshot);
assert(!negInfraValidation.isValid, 'Rejects negative infrastructure baseMonthlyCost');

// 3. Unknown Price Handling (Never zeroed)
console.log('\n3. Unknown Price Handling');
const nanPriceSnapshot: RegistrySnapshot = JSON.parse(JSON.stringify(BASELINE_SNAPSHOT));
(nanPriceSnapshot.pricing[0] as unknown as Record<string, unknown>).inputPricePer1M = NaN;
const nanValidation = validateRegistrySnapshot(nanPriceSnapshot);
assert(!nanValidation.isValid, 'Rejects NaN as input price');

// 4. Missing Units & Provenance Rejection
console.log('\n4. Missing Units & Provenance Rejection');
const missingProvenanceModel: RegistrySnapshot = JSON.parse(JSON.stringify(BASELINE_SNAPSHOT));
missingProvenanceModel.models[0].source = '';
missingProvenanceModel.models[0].sourceUrl = '';
const noProvValidation = validateRegistrySnapshot(missingProvenanceModel);
assert(!noProvValidation.isValid, 'Rejects model with missing source and sourceUrl');

const missingPricingProvenance: RegistrySnapshot = JSON.parse(JSON.stringify(BASELINE_SNAPSHOT));
missingPricingProvenance.pricing[0].sourceUrl = '';
const noPricingProvValidation = validateRegistrySnapshot(missingPricingProvenance);
assert(!noPricingProvValidation.isValid, 'Rejects pricing record with missing sourceUrl');

// 5. Duplicate Identifier Rejection
console.log('\n5. Duplicate Identifier Rejection');
const duplicateModelSnapshot: RegistrySnapshot = JSON.parse(JSON.stringify(BASELINE_SNAPSHOT));
duplicateModelSnapshot.models.push({ ...duplicateModelSnapshot.models[0] });
const dupModelValidation = validateRegistrySnapshot(duplicateModelSnapshot);
assert(!dupModelValidation.isValid, 'Rejects duplicate Model ID');

const duplicatePricingSnapshot: RegistrySnapshot = JSON.parse(JSON.stringify(BASELINE_SNAPSHOT));
duplicatePricingSnapshot.pricing.push({ ...duplicatePricingSnapshot.pricing[0] });
const dupPricingValidation = validateRegistrySnapshot(duplicatePricingSnapshot);
assert(!dupPricingValidation.isValid, 'Rejects duplicate Pricing ID');

const duplicateInfraSnapshot: RegistrySnapshot = JSON.parse(JSON.stringify(BASELINE_SNAPSHOT));
duplicateInfraSnapshot.infrastructure.push({ ...duplicateInfraSnapshot.infrastructure[0] });
const dupInfraValidation = validateRegistrySnapshot(duplicateInfraSnapshot);
assert(!dupInfraValidation.isValid, 'Rejects duplicate Infrastructure ID');

// 6. Broken Referential Integrity Rejection
console.log('\n6. Broken Referential Integrity Rejection');
const brokenRefSnapshot: RegistrySnapshot = JSON.parse(JSON.stringify(BASELINE_SNAPSHOT));
brokenRefSnapshot.pricing[0].resourceId = 'non-existent-model-xyz';
const brokenRefValidation = validateRegistrySnapshot(brokenRefSnapshot);
assert(!brokenRefValidation.isValid, 'Rejects pricing record referencing non-existent resourceId');
assert(
  brokenRefValidation.violations.some(v => v.field === 'pricing.resourceId'),
  'Flags pricing.resourceId referential integrity violation'
);

// 7. Invalid Effective-Date Range Rejection
console.log('\n7. Invalid Effective-Date Range Rejection');
const invalidDateSnapshot: RegistrySnapshot = JSON.parse(JSON.stringify(BASELINE_SNAPSHOT));
invalidDateSnapshot.pricing[0].effectiveFrom = '2026-06-01';
invalidDateSnapshot.pricing[0].effectiveTo = '2026-01-01'; // Before effectiveFrom
const invalidDateValidation = validateRegistrySnapshot(invalidDateSnapshot);
assert(!invalidDateValidation.isValid, 'Rejects effectiveTo < effectiveFrom');

// 8. Canonicalization Independent of Key Order
console.log('\n8. Canonicalization Key-Order Independence');
const objA = {
  z: 100,
  a: 'test',
  m: { b: 2, a: 1 },
  list: [{ y: 2, x: 1 }],
};
const objB = {
  a: 'test',
  list: [{ x: 1, y: 2 }],
  m: { a: 1, b: 2 },
  z: 100,
};
const canonicalA = canonicalizeJson(objA);
const canonicalB = canonicalizeJson(objB);
assert(canonicalA === canonicalB, 'canonicalizeJson produces identical string regardless of key insertion order');
assert(computeContentHash(objA) === computeContentHash(objB), 'computeContentHash is identical for permuted keys');

// 9. Stable Content Hashing
console.log('\n9. Content Hashing & Identity');
const hash1 = computeContentHash(BASELINE_SNAPSHOT.models);
const hash2 = computeContentHash(BASELINE_SNAPSHOT.models);
assert(hash1 === hash2, 'Content hash is strictly deterministic across runs');
assert(BASELINE_SNAPSHOT.metadata.contentHash.length === 64, 'Metadata contentHash is a valid 64-char SHA-256 hex string');
assert(BASELINE_SNAPSHOT.metadata.snapshotId.startsWith('snap-cc-'), 'Snapshot ID has canonical prefix snap-cc-');

// 10. Runtime Immutability
console.log('\n10. Runtime Immutability');
assert(Object.isFrozen(BASELINE_SNAPSHOT), 'BASELINE_SNAPSHOT root is frozen');
assert(Object.isFrozen(BASELINE_SNAPSHOT.metadata), 'BASELINE_SNAPSHOT.metadata is frozen');
assert(Object.isFrozen(BASELINE_SNAPSHOT.models[0]), 'BASELINE_SNAPSHOT.models[0] is frozen');

let mutationBlocked = false;
try {
  (BASELINE_SNAPSHOT.models[0] as { baselineLatencyMs: number }).baselineLatencyMs = 9999;
} catch {
  mutationBlocked = true;
}
assert(
  mutationBlocked || BASELINE_SNAPSHOT.models[0].baselineLatencyMs !== 9999,
  'Runtime mutation on BASELINE_SNAPSHOT is blocked'
);

// 11. Baseline Pricing Equivalence
console.log('\n11. Baseline Pricing Equivalence with Engine 4.0');
const baselinePricingMap = Object.fromEntries(
  BASELINE_SNAPSHOT.pricing.map(p => [p.resourceId, p])
);

for (const [modelId, engineModel] of Object.entries(MODEL_PRICING)) {
  const regPricing = baselinePricingMap[modelId];
  assert(regPricing !== undefined, `Model "${modelId}" exists in registry pricing`);
  assert(
    regPricing?.inputPricePer1M === engineModel.inputPricePer1M,
    `Input price matches for "${modelId}": $${engineModel.inputPricePer1M}/1M`
  );
  assert(
    regPricing?.outputPricePer1M === engineModel.outputPricePer1M,
    `Output price matches for "${modelId}": $${engineModel.outputPricePer1M}/1M`
  );
}

// Infrastructure equivalence
const infraMap = Object.fromEntries(
  BASELINE_SNAPSHOT.infrastructure.map(i => [i.id, i])
);
assert(infraMap['vectorDb']?.baseMonthlyCost === INFRA_PRICING.vectorDb.baseMonthlyCost, 'Vector DB baseMonthlyCost matches ($120)');
assert(infraMap['vectorDb']?.perMillionQueries === INFRA_PRICING.vectorDb.perMillionQueries, 'Vector DB perMillionQueries matches ($0.20)');
assert(infraMap['cache']?.baseMonthlyCost === INFRA_PRICING.cache.baseMonthlyCost, 'Cache baseMonthlyCost matches ($65)');
assert(infraMap['apiGateway']?.perMillionRequests === INFRA_PRICING.apiGateway.perMillionRequests, 'API Gateway perMillionRequests matches ($1.00)');
assert(infraMap['router']?.perMillionRequests === INFRA_PRICING.router.perMillionRequests, 'Router perMillionRequests matches ($0.50)');

// Assumptions equivalence
const regAssumpMap = Object.fromEntries(
  BASELINE_SNAPSHOT.assumptions.map(a => [a.id, a])
);
for (const engineAssump of ASSUMPTION_REGISTRY) {
  const regAssump = regAssumpMap[engineAssump.id];
  assert(regAssump !== undefined, `Assumption "${engineAssump.id}" exists in registry`);
  assert(regAssump?.value === engineAssump.value, `Assumption "${engineAssump.id}" value matches (${engineAssump.value})`);
}

// 12. Strict Legacy Snapshot Identifier Resolution
console.log('\n12. Legacy Snapshot Resolution & Strict Unknown Handling');
assert(getSnapshot('2026-03') !== undefined, 'Resolves alias "2026-03" to baseline snapshot');
assert(getSnapshot('March 2026') !== undefined, 'Resolves alias "March 2026" to baseline snapshot');
assert(getSnapshot('v1.4') !== undefined, 'Resolves alias "v1.4" to baseline snapshot');
assert(getSnapshot('2026-03-baseline') !== undefined, 'Resolves label "2026-03-baseline" to baseline snapshot');
assert(getSnapshot(BASELINE_SNAPSHOT.metadata.snapshotId) !== undefined, 'Resolves canonical snapshotId');
assert(getSnapshot(BASELINE_SNAPSHOT.metadata.contentHash) !== undefined, 'Resolves full contentHash');

// STRICT: Unknown snapshots must NEVER silently resolve to current or default
assert(getSnapshot('unknown-snapshot-2099') === undefined, 'STRICT: Unknown snapshot returns undefined');

// Explicit multi-snapshot catalog assertions (Gate 4)
const catalogSnapshots = getAllSnapshots();
assert(catalogSnapshots.length === 2, 'Registry catalog contains exactly 2 registered snapshots');
assert(getSnapshot(BASELINE_SNAPSHOT.metadata.snapshotId) !== undefined, 'Canonical baseline snapshot is registered and resolves');
assert(getSnapshot(OCTOBER_2026_SNAPSHOT.metadata.snapshotId) !== undefined, 'Canonical October snapshot is registered and resolves');
assert(getSnapshot('snap-cc-382481fe0de34aaf') !== undefined, 'Exact canonical October snapshot ID resolves');
assert(getSnapshot('2026-03-baseline') !== undefined, 'Baseline label resolves to baseline snapshot');
assert(getSnapshot('2026-10-expanded') !== undefined, 'October label resolves to October snapshot');
assert(getSnapshot('2026-10') !== undefined, 'October alias "2026-10" resolves to October snapshot');
assert(getSnapshot('October 2026') !== undefined, 'October alias "October 2026" resolves to October snapshot');

// 13. Engine Registry Adapter & Integration
console.log('\n13. Engine Registry Adapter & Decoupled Simulation');
import {
  resolveRegistryPricing,
  getEnginePricingRecords,
  getEngineInfraPricing,
  getEngineAssumptionRegistry,
  validateArchitectureModels,
  UnknownSnapshotError,
  BASELINE_ENGINE_BUNDLE,
} from '../lib/registry/adapter';
import { simulate, TEMPLATES } from '../lib/simulation/engine';

// Adapter resolution tests
const resolvedBaseline = resolveRegistryPricing();
assert(resolvedBaseline.ok, 'Default resolveRegistryPricing() resolves successfully');
assert(resolvedBaseline.ok && resolvedBaseline.bundle.isBaseline, 'Default bundle is marked baseline');
assert(resolveRegistryPricing('2026-03').ok, 'Resolves alias "2026-03" via adapter');
assert(resolveRegistryPricing('March 2026').ok, 'Resolves alias "March 2026" via adapter');
assert(resolveRegistryPricing('v1.4').ok, 'Resolves alias "v1.4" via adapter');

// Strict rejection of unknown snapshots
const unknownSnapResult = resolveRegistryPricing('unknown-snapshot-2099');
assert(!unknownSnapResult.ok, 'Adapter rejects unknown snapshot');
if (!unknownSnapResult.ok) {
  assert(unknownSnapResult.error === 'UNKNOWN_SNAPSHOT', 'Returns typed UNKNOWN_SNAPSHOT error');
}

let threwUnknownError = false;
try {
  getEnginePricingRecords('non-existent-snapshot');
} catch (e) {
  if (e instanceof UnknownSnapshotError) {
    threwUnknownError = true;
  }
}
assert(threwUnknownError, 'getEnginePricingRecords throws UnknownSnapshotError for invalid snapshot');

// Infrastructure & assumption registry via adapter
const adapterInfra = getEngineInfraPricing();
assert(adapterInfra.vectorDb.baseMonthlyCost === 120, 'Adapter infra vectorDb baseMonthlyCost matches');
assert(adapterInfra.cache.baseMonthlyCost === 65, 'Adapter infra cache baseMonthlyCost matches');
assert(adapterInfra.apiGateway.perMillionRequests === 1.0, 'Adapter infra apiGateway perMillionRequests matches');
assert(adapterInfra.router.perMillionRequests === 0.5, 'Adapter infra router perMillionRequests matches');

const adapterAssumptions = getEngineAssumptionRegistry();
assert(adapterAssumptions.length === 16, 'Adapter assumptions contains exactly 16 records');

// Unknown model rejection in architecture
const archWithUnknownModel = {
  id: 'test-unknown',
  name: 'Test Unknown Model',
  nodes: [
    { id: 'api-1', type: 'api' as const, label: 'API Ingress' },
    { id: 'model-1', type: 'frontier-model' as const, label: 'Custom Model', modelId: 'non-existent-frontier-99' },
  ],
  edges: [
    { source: 'api-1', target: 'model-1' },
  ],
};

const modelValidation = validateArchitectureModels(archWithUnknownModel, BASELINE_ENGINE_BUNDLE);
assert(!modelValidation.isValid, 'validateArchitectureModels rejects unrecognized model ID');
assert(
  modelValidation.errors.some(e => e.includes('non-existent-frontier-99')),
  'Error explicitly mentions the unrecognized model ID'
);

// Engine simulate() with unknown model returns safe invalid result (no silent fallback!)
const workload = TEMPLATES[0].defaultWorkload;
const simUnknownModel = simulate({
  workload,
  architecture: archWithUnknownModel,
});
assert(!simUnknownModel.validation.isValid, 'simulate() blocks execution for unknown model');
assert(simUnknownModel.monthlyCost === 0, 'simulate() returns monthlyCost 0 when model is unpriced/unknown');
assert(
  simUnknownModel.validation.errors.some(e => e.includes('non-existent-frontier-99')),
  'simulate() reports explicit error for unknown model'
);

// Engine simulate() with unknown snapshot returns safe invalid result
const simUnknownSnapshot = simulate({
  workload,
  architecture: TEMPLATES[0].architecture,
  pricingSnapshot: 'fantasy-pricing-2099',
});
assert(!simUnknownSnapshot.validation.isValid, 'simulate() blocks execution for unknown snapshot');
assert(simUnknownSnapshot.monthlyCost === 0, 'simulate() returns monthlyCost 0 for unknown snapshot');
assert(
  simUnknownSnapshot.validation.errors.some(e => e.includes('fantasy-pricing-2099')),
  'simulate() reports explicit error for unknown snapshot'
);

// Deterministic Replay: identical inputs and snapshots produce identical outputs
const simRun1 = simulate(workload, TEMPLATES[0].architecture);
const simRun2 = simulate(workload, TEMPLATES[0].architecture);
assert(simRun1.monthlyCost === simRun2.monthlyCost, 'Deterministic replay: monthlyCost matches exactly');
assert(simRun1.p95Latency === simRun2.p95Latency, 'Deterministic replay: p95Latency matches exactly');
assert(simRun1.qualityEstimate === simRun2.qualityEstimate, 'Deterministic replay: qualityEstimate matches exactly');
assert(simRun1.provenance?.pricingSnapshot === '2026-03', 'Deterministic replay: pricingSnapshot is 2026-03');

// Historical URL Compatibility with Decoupled Engine
import { encodeArchitectureState, decodeArchitectureState } from '../lib/simulation/sharing';

const encodedUrl = encodeArchitectureState({
  architecture: TEMPLATES[0].architecture,
  workload: TEMPLATES[0].defaultWorkload,
});
const decodedState = decodeArchitectureState(encodedUrl);
assert(decodedState.success && decodedState.data !== undefined, 'Decoded shared URL state is valid');
if (decodedState.success && decodedState.data) {
  const urlSim = simulate({
    workload: decodedState.data.workload,
    architecture: decodedState.data.architecture,
    pricingSnapshot: decodedState.data.pricingSnapshot,
    modelRegistryVersion: decodedState.data.registryVersion,
  });
  assert(urlSim.monthlyCost === simRun1.monthlyCost, 'Decoded historical URL reproduces identical baseline monthly cost');
  assert(urlSim.p95Latency === simRun1.p95Latency, 'Decoded historical URL reproduces identical baseline P95 latency');
}

console.log('\n──────────────────────────────────────────────────────────');
console.log(`TOTAL REGISTRY V2 TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
console.log('──────────────────────────────────────────────────────────\n');

if (passedTests === totalTests) {
  console.log('🏆 ALL MODULE 2 REGISTRY FOUNDATION & ADAPTER TESTS PASSED WITH 100% INTEGRITY!\n');
} else {
  console.error('❌ SOME REGISTRY TESTS FAILED!\n');
  process.exit(1);
}

