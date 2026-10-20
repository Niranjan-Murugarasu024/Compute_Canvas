/**
 * ComputeCanvas — Module 3-C
 * Multi-Snapshot Visual Comparison & Delta Inspector Test Suite
 *
 * Verifies:
 * 1. Snapshot Resolution & Fail-Closed Behavior
 * 2. Deterministic Delta Arithmetic & Zero-Denominator Safety
 * 3. Controlled Simulation Configuration & Engine Invariance
 * 4. Model Lifecycle Incompatibility Handling (fail-closed, no silent substitution)
 * 5. Component & Node Attribution Consistency (real engine output verification)
 * 6. Model Catalog & Pricing Rate Diffing Accuracy
 * 7. URL State Serialization, Restoration & Provenance Retention
 */

import { BASELINE_SNAPSHOT } from '../lib/registry/snapshots/baseline';
import { OCTOBER_2026_SNAPSHOT } from '../lib/registry/snapshots/october2026';
import { getSnapshot } from '../lib/registry/catalog';
import {
  calculateNumericDelta,
  compareSnapshots,
  computeModelCatalogDiff,
} from '../lib/simulation/snapshotComparison';
import { type Architecture, type Workload, TEMPLATES } from '../lib/simulation/engine';
import { encodeArchitectureState, decodeArchitectureState } from '../lib/simulation/sharing';
import { formatCurrency } from '../lib/simulation/engine/precision';

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
console.log('COMPUTECANVAS MODULE 3-C: DELTA INSPECTOR TEST SUITE');
console.log('──────────────────────────────────────────────────────────\n');

// Standard controlled architecture & workload from canonical template
const directLlmTemplate = TEMPLATES.find(t => t.id === 'direct-llm')!;
const controlledWorkload: Workload = JSON.parse(JSON.stringify(directLlmTemplate.defaultWorkload));
const controlledArch: Architecture = JSON.parse(JSON.stringify(directLlmTemplate.architecture));

// ──────────────────────────────────────────────────────────
// Section 1: Snapshot Resolution & Fail-Closed Behavior
// ──────────────────────────────────────────────────────────
console.log('1. Snapshot Resolution & Fail-Closed Semantics');

const refId = BASELINE_SNAPSHOT.metadata.snapshotId;
const compId = OCTOBER_2026_SNAPSHOT.metadata.snapshotId;

assert(getSnapshot(refId) !== undefined, 'Baseline canonical snapshot resolves');
assert(getSnapshot(compId) !== undefined, 'October canonical snapshot resolves');

// Unknown snapshot in reference role
const unknownRefComp = compareSnapshots({
  referenceSnapshotId: 'snap-non-existent-999',
  comparisonSnapshotId: compId,
  architecture: controlledArch,
  workload: controlledWorkload,
});
assert(unknownRefComp.status === 'UNKNOWN_SNAPSHOT', 'Rejects unknown reference snapshot with UNKNOWN_SNAPSHOT');
assert(!unknownRefComp.deltas.monthlyCost.isComparable, 'Unknown snapshot comparison is not comparable');
assert(unknownRefComp.statusExplanation.includes('snap-non-existent-999'), 'Status explanation identifies missing snapshot ID');

// Unknown snapshot in comparison role
const unknownCompComp = compareSnapshots({
  referenceSnapshotId: refId,
  comparisonSnapshotId: 'snap-non-existent-888',
  architecture: controlledArch,
  workload: controlledWorkload,
});
assert(unknownCompComp.status === 'UNKNOWN_SNAPSHOT', 'Rejects unknown comparison snapshot with UNKNOWN_SNAPSHOT');
assert(!unknownCompComp.deltas.monthlyCost.isComparable, 'Yields non-comparable deltas for unknown comparison snapshot');

// Identical snapshots comparison
const identicalComp = compareSnapshots({
  referenceSnapshotId: refId,
  comparisonSnapshotId: refId,
  architecture: controlledArch,
  workload: controlledWorkload,
});
assert(identicalComp.status === 'IDENTICAL_SNAPSHOTS', 'Identifies identical snapshots as IDENTICAL_SNAPSHOTS');
assert(identicalComp.isIdenticalSnapshot === true, 'isIdenticalSnapshot flag is true');
assert(identicalComp.deltas.monthlyCost.isComparable, 'Identical snapshots are comparable');
assert(identicalComp.deltas.monthlyCost.delta === 0, 'Identical snapshots produce exactly $0.00 cost delta');
assert(identicalComp.deltas.monthlyCost.percentDelta === 0, 'Identical snapshots produce exactly 0% delta');
assert(identicalComp.deltas.monthlyCost.direction === 'unchanged', 'Identical snapshots report unchanged direction');

// ──────────────────────────────────────────────────────────
// Section 2: Deterministic Delta Arithmetic & Zero-Denominator Safety
// ──────────────────────────────────────────────────────────
console.log('\n2. Deterministic Delta Arithmetic & Zero-Denominator Safety');

// Positive absolute delta (cost increased)
const incDelta = calculateNumericDelta('testCost', 'Test Cost', '$', 100, 150, formatCurrency);
assert(incDelta.referenceValue === 100, 'Inc reference value preserved');
assert(incDelta.comparisonValue === 150, 'Inc comparison value preserved');
assert(incDelta.delta === 50, 'comp - ref = 150 - 100 = 50');
assert(incDelta.percentDelta === 50, 'Percent delta is +50%');
assert(incDelta.direction === 'increased', 'Direction is increased');

// Negative absolute delta (cost decreased)
const decDelta = calculateNumericDelta('testCost', 'Test Cost', '$', 200, 150, formatCurrency);
assert(decDelta.delta === -50, 'comp - ref = 150 - 200 = -50');
assert(decDelta.percentDelta === -25, 'Percent delta is -25%');
assert(decDelta.direction === 'decreased', 'Direction is decreased');

// Exactly zero delta
const zeroDelta = calculateNumericDelta('testCost', 'Test Cost', '$', 75.5, 75.5, formatCurrency);
assert(zeroDelta.delta === 0, 'Zero delta is exactly 0');
assert(zeroDelta.percentDelta === 0, 'Zero percent delta is 0');
assert(zeroDelta.direction === 'unchanged', 'Direction is unchanged');

// Zero reference value (Division by Zero Protection)
const zeroRefDelta = calculateNumericDelta('testCost', 'Test Cost', '$', 0, 120, formatCurrency);
assert(zeroRefDelta.referenceValue === 0, 'Zero reference value preserved');
assert(zeroRefDelta.comparisonValue === 120, 'Comparison value preserved');
assert(zeroRefDelta.delta === 120, 'comp - ref = 120 - 0 = 120');
assert(zeroRefDelta.percentDelta === null, 'percentDelta is strictly null when reference is zero');
assert(zeroRefDelta.direction === 'increased', 'Direction is increased');
assert(zeroRefDelta.formattedPercent === 'N/A — reference value is zero', 'Formatted percent shows explicit zero-reference message');

// Both values zero
const bothZeroDelta = calculateNumericDelta('testCost', 'Test Cost', '$', 0, 0, formatCurrency);
assert(bothZeroDelta.delta === 0, 'Both zero produces delta = 0');
assert(bothZeroDelta.percentDelta === 0, 'Both zero produces percentDelta = 0');
assert(bothZeroDelta.direction === 'unchanged', 'Direction is unchanged');

// Incompatible metric handling
const incompDelta = calculateNumericDelta('testCost', 'Test Cost', '$', 100, 150, formatCurrency, false, 'Model retired');
assert(incompDelta.isComparable === false, 'isComparable is false');
assert(incompDelta.formattedDelta === 'N/A', 'Formatted delta is N/A when incompatible');
assert(incompDelta.direction === 'not_applicable', 'Direction is not_applicable');

// ──────────────────────────────────────────────────────────
// Section 3: Controlled Simulation Configuration & Engine Invariance
// ──────────────────────────────────────────────────────────
console.log('\n3. Controlled Simulation Configuration & Engine Invariance');

const validComp = compareSnapshots({
  referenceSnapshotId: refId,
  comparisonSnapshotId: compId,
  architecture: controlledArch,
  workload: controlledWorkload,
});

assert(validComp.status === 'BOTH_VALID', 'Comparison between baseline and October is BOTH_VALID');
assert(validComp.deltas.monthlyCost.isComparable, 'Valid comparison is marked comparable');
assert(validComp.referenceResult !== undefined, 'Reference simulation result is present');
assert(validComp.comparisonResult !== undefined, 'Comparison simulation result is present');

// Verify deterministic reproducibility: Running again produces identical values
const validCompRepeat = compareSnapshots({
  referenceSnapshotId: refId,
  comparisonSnapshotId: compId,
  architecture: controlledArch,
  workload: controlledWorkload,
});
assert(
  validComp.deltas.monthlyCost.delta === validCompRepeat.deltas.monthlyCost.delta,
  'Repeated comparison produces 100% bit-exact identical monthlyCost delta'
);
assert(
  validComp.deltas.p95Latency.delta === validCompRepeat.deltas.p95Latency.delta,
  'Repeated comparison produces bit-exact identical p95Latency delta'
);

// For controlled direct-llm (gpt-4o), pricing is unchanged between March and October snapshots
assert(
  validComp.deltas.monthlyCost.delta === 0,
  'gpt-4o monthly cost delta is exactly 0 under identical provider rate assumptions'
);
assert(
  validComp.deltas.monthlyCost.direction === 'unchanged',
  'Monthly cost direction is correctly unchanged'
);

// ──────────────────────────────────────────────────────────
// Section 4: Model Lifecycle Incompatibility Handling
// ──────────────────────────────────────────────────────────
console.log('\n4. Model Lifecycle Incompatibility Handling');

// Case A: Model discontinued in October (gemini-2.0-flash was ACTIVE in March, DISCONTINUED in October)
const discontinuedModelArch: Architecture = {
  id: 'arch-discontinued-model',
  name: 'Discontinued Model Test',
  nodes: [
    {
      id: 'api-1',
      type: 'api',
      label: 'API Ingress',
      x: 220,
      y: 100,
    },
    {
      id: 'fast-1',
      type: 'fast-model',
      label: 'Fast Model',
      modelId: 'gemini-2.0-flash',
      x: 220,
      y: 260,
    },
  ],
  edges: [
    { source: 'api-1', target: 'fast-1' },
  ],
};

const discontinuedComp = compareSnapshots({
  referenceSnapshotId: refId, // March 2026: ACTIVE
  comparisonSnapshotId: compId, // October 2026: DISCONTINUED
  architecture: discontinuedModelArch,
  workload: controlledWorkload,
});

assert(discontinuedComp.status === 'COMPARISON_INVALID', 'Fails closed when model is discontinued in comparison snapshot');
assert(!discontinuedComp.deltas.monthlyCost.isComparable, 'Lifecycle incompatibility is marked NOT comparable');
assert(discontinuedComp.deltas.monthlyCost.formattedDelta === 'N/A', 'Does NOT fabricate an economic delta for invalid simulation');
assert(
  discontinuedComp.statusExplanation.includes('gemini-2.0-flash') || discontinuedComp.statusExplanation.includes('DISCONTINUED'),
  'Status explanation identifies discontinued model'
);

// Case B: Model newly added in October (deepseek-flash is NOT in March, but is ACTIVE in October)
const newModelArch: Architecture = {
  id: 'arch-new-model',
  name: 'October Model Test',
  nodes: [
    {
      id: 'api-1',
      type: 'api',
      label: 'API Ingress',
      x: 220,
      y: 100,
    },
    {
      id: 'fast-1',
      type: 'fast-model',
      label: 'DeepSeek Flash',
      modelId: 'deepseek-flash', // Only present in October 2026 snapshot!
      x: 220,
      y: 260,
    },
  ],
  edges: [
    { source: 'api-1', target: 'fast-1' },
  ],
};

const newModelComp = compareSnapshots({
  referenceSnapshotId: refId, // March 2026: MISSING
  comparisonSnapshotId: compId, // October 2026: PRESENT
  architecture: newModelArch,
  workload: controlledWorkload,
});

assert(newModelComp.status === 'REFERENCE_INVALID', 'Fails closed when model is unavailable in reference snapshot');
assert(!newModelComp.deltas.monthlyCost.isComparable, 'Lifecycle incompatibility is marked NOT comparable');
assert(newModelComp.deltas.monthlyCost.formattedDelta === 'N/A', 'Does NOT fabricate an economic delta for invalid simulation');

// ──────────────────────────────────────────────────────────
// Section 5: Component & Node Attribution Consistency
// ──────────────────────────────────────────────────────────
console.log('\n5. Component & Node Attribution Consistency');

assert(validComp.nodeAttributions.length > 0, 'Component attributions are populated');
const llmNodeAttr = validComp.nodeAttributions.find(a => a.nodeId === 'frontier-1');
assert(llmNodeAttr !== undefined, 'Found attribution record for frontier-1');
assert(llmNodeAttr?.type === 'frontier-model', 'Node type is frontier-model');
assert(llmNodeAttr?.modelId === 'gpt-4o', 'Model ID is gpt-4o');
assert(llmNodeAttr?.isCompatible === true, 'Node attribution is compatible');
assert(llmNodeAttr?.costDelta === 0, 'Node-level cost delta is 0 for unchanged model pricing');

// Check that client ingress node has zero cost delta
const apiNodeAttr = validComp.nodeAttributions.find(a => a.nodeId === 'api-1');
assert(apiNodeAttr !== undefined, 'Found attribution record for api-1');
assert(apiNodeAttr?.costDelta === 0, 'API ingress node cost delta is exactly 0');

// ──────────────────────────────────────────────────────────
// Section 6: Model Catalog & Pricing Rate Diffing
// ──────────────────────────────────────────────────────────
console.log('\n6. Model Catalog & Pricing Rate Diffing');

const catDiff = computeModelCatalogDiff(refId, compId);
assert(catDiff.length > 0, 'Catalog diff contains model entries');

// Check gpt-4o in catalog diff
const gpt4oDiff = catDiff.find(d => d.modelId === 'gpt-4o');
assert(gpt4oDiff !== undefined, 'gpt-4o is found in catalog diff');
assert(gpt4oDiff?.changeType === 'unchanged', 'gpt-4o is classified as unchanged');
assert(gpt4oDiff?.refInputPrice === 2.5, 'Ref input rate is $2.50/M tokens');
assert(gpt4oDiff?.compInputPrice === 2.5, 'Comp input rate is $2.50/M tokens');

// Check gemini-2.0-flash lifecycle change in catalog diff
const geminiDiff = catDiff.find(d => d.modelId === 'gemini-2.0-flash');
assert(geminiDiff !== undefined, 'gemini-2.0-flash is found in catalog diff');
assert(geminiDiff?.changeType === 'lifecycle_changed', 'gemini-2.0-flash is classified as lifecycle_changed');
assert(geminiDiff?.refStatus === 'ACTIVE', 'gemini-2.0-flash refStatus is ACTIVE');
assert(geminiDiff?.compStatus === 'DISCONTINUED', 'gemini-2.0-flash compStatus is DISCONTINUED');

// Check new model added in October (deepseek-flash)
const dsDiff = catDiff.find(d => d.modelId === 'deepseek-flash');
assert(dsDiff !== undefined, 'deepseek-flash is found in catalog diff');
assert(dsDiff?.changeType === 'added', 'deepseek-flash is classified as added');
assert(dsDiff?.refInputPrice === undefined, 'deepseek-flash has undefined ref input price');
assert(dsDiff?.compInputPrice !== undefined, 'deepseek-flash has defined comp input price');

// Check summary generation
assert(validComp.summaryText.length > 0, 'Summary text is generated');
assert(validComp.summaryText.includes('unchanged') || validComp.summaryText.includes('$7,001'), 'Summary accurately describes simulation economics');

// ──────────────────────────────────────────────────────────
// Section 7: URL State Serialization, Restoration & Provenance
// ──────────────────────────────────────────────────────────
console.log('\n7. URL State Serialization, Restoration & Provenance');

// Serialize comparison state
const encoded = encodeArchitectureState({
  architecture: controlledArch,
  workload: controlledWorkload,
  pricingSnapshot: refId,
  comparisonSnapshot: compId,
});

assert(typeof encoded === 'string' && encoded.length > 0, 'Encodes comparison state to Base64 URL string');

// Decode comparison state
const decoded = decodeArchitectureState(encoded);
assert(decoded.success === true, 'Successfully decodes state');
assert(decoded.data?.pricingSnapshot === refId, 'Decoded reference snapshot matches original');
assert(decoded.data?.comparisonSnapshot === compId, 'Decoded comparison snapshot matches original');
assert(decoded.data?.architecture.id === controlledArch.id, 'Decoded architecture ID matches original');
assert(decoded.data?.workload.requestsPerMonth === controlledWorkload.requestsPerMonth, 'Decoded workload matches original');

// Legacy URL state without comparisonSnapshot
const legacyEncoded = encodeArchitectureState({
  architecture: controlledArch,
  workload: controlledWorkload,
  pricingSnapshot: refId,
});
const legacyDecoded = decodeArchitectureState(legacyEncoded);
assert(legacyDecoded.success === true, 'Decodes legacy URL state');
assert(legacyDecoded.data?.pricingSnapshot === refId, 'Legacy snapshot matches');
assert(legacyDecoded.data?.comparisonSnapshot === undefined, 'Legacy URL has undefined comparisonSnapshot without error');

// Unknown snapshot in decoded state should fail closed in compareSnapshots
const tamperedDecodedComp = compareSnapshots({
  referenceSnapshotId: 'snap-tampered-unknown',
  comparisonSnapshotId: compId,
  architecture: decoded.data!.architecture,
  workload: decoded.data!.workload,
});
assert(tamperedDecodedComp.status === 'UNKNOWN_SNAPSHOT', 'Tampered snapshot ID fails closed');
assert(!tamperedDecodedComp.deltas.monthlyCost.isComparable, 'Tampered comparison is not comparable');

console.log('\n──────────────────────────────────────────────────────────');
console.log(`ALL MODULE 3-C TESTS COMPLETED: ${passCount} PASSED, ${failCount} FAILED`);
console.log('──────────────────────────────────────────────────────────\n');
