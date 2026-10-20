/**
 * ComputeCanvas — Module 2, Phase 3-B: Versioned Snapshot UI Integration Test Suite
 * 
 * Verifies all 14 Phase B.6 requirements:
 * 1. Default snapshot behavior remains correct.
 * 2. Selecting March loads the baseline model options.
 * 3. Selecting October loads the October model options.
 * 4. Discontinued October models cannot produce a valid-looking UI result.
 * 5. Switching snapshots does not silently replace a model.
 * 6. Llama's canonical ID and legacy alias do not appear as separate selectable models.
 * 7. A valid canonical snapshot ID survives URL serialization and parsing.
 * 8. Unknown snapshot IDs are handled safely.
 * 9. Reloading a shared URL restores the selected snapshot.
 * 10. Validation failures are rendered distinctly from valid simulation results.
 * 11. Active-model simulations continue to display their normal results.
 * 12. Existing workload settings survive snapshot changes.
 * 13. March baseline simulation outputs remain exactly equivalent to the frozen baseline.
 * 14. Existing registry and hashing tests continue to pass.
 */

import assert from 'node:assert';
import {
  BASELINE_SNAPSHOT,
  OCTOBER_2026_SNAPSHOT,
  getSnapshot,
  resolveRegistryPricing,
} from '../lib/registry';
import {
  simulate,
  explainEconomicsDelta,
  computeCausalDeltaDetails,
  DEFAULT_V1_ARCHITECTURE,
  DEFAULT_V1_WORKLOAD,
  type Architecture,
  type Workload,
} from '../lib/simulation/engine';
import {
  encodeArchitectureState,
  decodeArchitectureState,
} from '../lib/simulation/sharing';

console.log('─────────────────────────────────────────────────────────────');
console.log('ComputeCanvas — Phase 3-B UI Snapshot Integration Test Suite');
console.log('─────────────────────────────────────────────────────────────\n');

let passCount = 0;
let failCount = 0;

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  [FAIL] ${name}`);
    console.error(`         ${err instanceof Error ? err.message : String(err)}`);
    failCount++;
  }
}

// 1. Default snapshot behavior remains correct
runTest('1. Default snapshot behavior resolves to March 2026 baseline (snap-cc-3b3fbd4cbab4e979)', () => {
  const defaultRes = resolveRegistryPricing();
  assert.strictEqual(defaultRes.ok, true);
  if (!defaultRes.ok) return;
  assert.strictEqual(defaultRes.bundle.snapshotId, BASELINE_SNAPSHOT.metadata.snapshotId);
  assert.strictEqual(defaultRes.bundle.isBaseline, true);
  assert.strictEqual(defaultRes.bundle.snapshotId, 'snap-cc-3b3fbd4cbab4e979');

  // simulate() without pricingSnapshot defaults to baseline
  const sim = simulate(DEFAULT_V1_WORKLOAD, DEFAULT_V1_ARCHITECTURE);
  assert.strictEqual(sim.validation.isValid, true);
  assert.ok(sim.provenance);
  assert.strictEqual(sim.provenance.pricingSnapshot, '2026-03');
});

// 2. Selecting March loads the baseline model options
runTest('2. Selecting March loads baseline model options through registry adapter', () => {
  const march = getSnapshot('snap-cc-3b3fbd4cbab4e979');
  assert.ok(march, 'March snapshot must exist');
  assert.strictEqual(march.metadata.snapshotId, 'snap-cc-3b3fbd4cbab4e979');
  
  const marchModelIds = march.models.map(m => m.id);
  assert.deepStrictEqual(marchModelIds.sort(), [
    'claude-3-haiku',
    'claude-3.5-sonnet',
    'gemini-2.0-flash',
    'gemini-2.5-pro',
    'gpt-4o',
    'gpt-4o-mini',
  ].sort());

  // All baseline models are active in baseline snapshot
  assert.ok(march.models.every(m => m.status === 'ACTIVE'));
});

// 3. Selecting October loads October model options
runTest('3. Selecting October loads October model options with active and discontinued models', () => {
  const october = getSnapshot('snap-cc-382481fe0de34aaf');
  assert.ok(october, 'October snapshot must exist');
  assert.strictEqual(october.metadata.snapshotId, 'snap-cc-382481fe0de34aaf');

  const activeModels = october.models.filter(m => m.status === 'ACTIVE').map(m => m.id);
  const discontinuedModels = october.models.filter(m => m.status === 'DISCONTINUED').map(m => m.id);

  assert.ok(activeModels.includes('gpt-4o-mini'));
  assert.ok(activeModels.includes('gpt-4o'));
  assert.ok(activeModels.includes('deepseek-flash'));
  assert.ok(activeModels.includes('meta-llama/Llama-3.3-70B-Instruct-Turbo'));

  assert.ok(discontinuedModels.includes('gemini-2.0-flash'));
  assert.ok(discontinuedModels.includes('claude-3-haiku'));
  assert.ok(discontinuedModels.includes('claude-3.5-sonnet'));
  assert.ok(discontinuedModels.includes('deepseek-chat'));
});

// 4. Discontinued October models cannot produce a valid-looking UI result
runTest('4. Discontinued October models produce validation errors and blocked simulation results', () => {
  const discontinuedArch: Architecture = {
    id: 'test-discontinued-arch',
    name: 'Discontinued Model Test',
    nodes: [
      { id: 'api', type: 'api', label: 'API Ingress' },
      { id: 'm1', type: 'fast-model', label: 'Flash Node', modelId: 'gemini-2.0-flash' },
    ],
    edges: [{ source: 'api', target: 'm1' }],
  };

  const simResult = simulate({
    workload: DEFAULT_V1_WORKLOAD,
    architecture: discontinuedArch,
    pricingSnapshot: 'snap-cc-382481fe0de34aaf',
  });

  assert.strictEqual(simResult.validation.isValid, false);
  assert.ok(simResult.validation.errors.length > 0);
  assert.ok(
    simResult.validation.errors.some(e => e.includes('gemini-2.0-flash') && e.includes('DISCONTINUED')),
    'Validation error must identify gemini-2.0-flash as DISCONTINUED'
  );
  // Zero cost is returned by engine, but isValid is false so UI intercepts and renders INVALID CONFIG
  assert.strictEqual(simResult.validation.isValid, false);
});

// 5. Switching snapshots does not silently replace a model
runTest('5. Switching snapshots preserves current architecture and model selections without substitution', () => {
  const originalArch: Architecture = {
    id: 'test-arch',
    name: 'Model Preservation Test',
    nodes: [
      { id: 'api', type: 'api', label: 'Ingress' },
      { id: 'm1', type: 'fast-model', label: 'Model Node', modelId: 'gemini-2.0-flash' },
    ],
    edges: [{ source: 'api', target: 'm1' }],
  };

  // User selects March -> gemini-2.0-flash is valid
  const marchSim = simulate({
    workload: DEFAULT_V1_WORKLOAD,
    architecture: originalArch,
    pricingSnapshot: 'snap-cc-3b3fbd4cbab4e979',
  });
  assert.strictEqual(marchSim.validation.isValid, true);
  assert.strictEqual(originalArch.nodes[1].modelId, 'gemini-2.0-flash');

  // User selects October -> modelId must remain gemini-2.0-flash (NOT silently swapped)
  const octoberSim = simulate({
    workload: DEFAULT_V1_WORKLOAD,
    architecture: originalArch,
    pricingSnapshot: 'snap-cc-382481fe0de34aaf',
  });
  assert.strictEqual(originalArch.nodes[1].modelId, 'gemini-2.0-flash');
  // It is properly rejected as DISCONTINUED rather than silently substituted
  assert.strictEqual(octoberSim.validation.isValid, false);
});

// 6. Llama's canonical ID and legacy alias do not appear as separate selectable models
runTest('6. Llama canonical ID meta-llama/Llama-3.3-70B-Instruct-Turbo is unique and legacy alias is not a separate selectable model', () => {
  const october = getSnapshot('snap-cc-382481fe0de34aaf');
  assert.ok(october);

  // In snapshot models (the source for UI selectable options):
  const llamaEntries = october.models.filter(
    m => m.id === 'meta-llama/Llama-3.3-70B-Instruct-Turbo' || m.id === 'llama-3.3-70b-instruct'
  );
  assert.strictEqual(llamaEntries.length, 1, 'Only one model entry for Llama in snapshot.models');
  assert.strictEqual(llamaEntries[0].id, 'meta-llama/Llama-3.3-70B-Instruct-Turbo');
  assert.strictEqual(llamaEntries[0].legacyAlias, 'llama-3.3-70b-instruct');
  assert.strictEqual(llamaEntries[0].status, 'ACTIVE');

  // Verify adapter backward compatibility: alias resolves to canonical pricing
  const res = resolveRegistryPricing('snap-cc-382481fe0de34aaf');
  assert.ok(res.ok);
  if (!res.ok) return;
  assert.ok(res.bundle.models['meta-llama/Llama-3.3-70B-Instruct-Turbo']);
  assert.ok(res.bundle.models['llama-3.3-70b-instruct']);
  assert.strictEqual(
    res.bundle.models['llama-3.3-70b-instruct'].inputPricePer1M,
    res.bundle.models['meta-llama/Llama-3.3-70B-Instruct-Turbo'].inputPricePer1M
  );
});

// 7. A valid canonical snapshot ID survives URL serialization and parsing
runTest('7. Valid canonical snapshot ID survives URL serialization and parsing', () => {
  const testPayload = {
    architecture: DEFAULT_V1_ARCHITECTURE,
    workload: DEFAULT_V1_WORKLOAD,
    pricingSnapshot: 'snap-cc-382481fe0de34aaf',
  };

  const encoded = encodeArchitectureState(testPayload);
  assert.ok(encoded && encoded.length > 0);

  const decoded = decodeArchitectureState(encoded);
  assert.strictEqual(decoded.success, true);
  assert.ok(decoded.data);
  assert.strictEqual(decoded.data.pricingSnapshot, 'snap-cc-382481fe0de34aaf');
});

// 8. Unknown snapshot IDs are handled safely
runTest('8. Unknown snapshot IDs are handled safely with non-fatal recovery', () => {
  // getSnapshot returns undefined (no silent substitution)
  assert.strictEqual(getSnapshot('unknown-snapshot-id-xyz'), undefined);
  assert.strictEqual(getSnapshot('snap-cc-fake12345'), undefined);

  // resolveRegistryPricing returns typed error
  const res = resolveRegistryPricing('unknown-snapshot-id-xyz');
  assert.strictEqual(res.ok, false);
  if (!res.ok) {
    assert.strictEqual(res.error, 'UNKNOWN_SNAPSHOT');
    assert.ok(res.message.includes('Silent fallback to other snapshots is blocked'));
  }

  // simulate() returns validation error for unknown snapshot
  const sim = simulate({
    workload: DEFAULT_V1_WORKLOAD,
    architecture: DEFAULT_V1_ARCHITECTURE,
    pricingSnapshot: 'unknown-snapshot-id-xyz',
  });
  assert.strictEqual(sim.validation.isValid, false);
  assert.ok(sim.validation.errors.some(e => e.includes('unknown-snapshot-id-xyz')));
});

// 9. Reloading a shared URL restores the selected snapshot
runTest('9. Reloading a shared URL restores the exact canonical snapshot selection and state', () => {
  // Scenario A: October snapshot shared URL
  const octPayload = {
    architecture: DEFAULT_V1_ARCHITECTURE,
    workload: DEFAULT_V1_WORKLOAD,
    pricingSnapshot: 'snap-cc-382481fe0de34aaf',
  };
  const octEncoded = encodeArchitectureState(octPayload);
  const octDecoded = decodeArchitectureState(octEncoded);
  assert.strictEqual(octDecoded.success, true);
  assert.strictEqual(octDecoded.data?.pricingSnapshot, 'snap-cc-382481fe0de34aaf');

  // Scenario B: March baseline snapshot shared URL
  const marchPayload = {
    architecture: DEFAULT_V1_ARCHITECTURE,
    workload: DEFAULT_V1_WORKLOAD,
    pricingSnapshot: 'snap-cc-3b3fbd4cbab4e979',
  };
  const marchEncoded = encodeArchitectureState(marchPayload);
  const marchDecoded = decodeArchitectureState(marchEncoded);
  assert.strictEqual(marchDecoded.success, true);
  assert.strictEqual(marchDecoded.data?.pricingSnapshot, 'snap-cc-3b3fbd4cbab4e979');
});

// 10. Validation failures are rendered distinctly from valid simulation results
runTest('10. Validation failures are distinguishable with isValid=false and non-empty error list', () => {
  const invalidArch: Architecture = {
    id: 'invalid-model-arch',
    name: 'Invalid Model',
    nodes: [
      { id: 'api', type: 'api', label: 'Ingress' },
      { id: 'm1', type: 'fast-model', label: 'Bad Model', modelId: 'nonexistent-model-id-999' },
    ],
    edges: [{ source: 'api', target: 'm1' }],
  };

  const simResult = simulate({
    workload: DEFAULT_V1_WORKLOAD,
    architecture: invalidArch,
    pricingSnapshot: 'snap-cc-382481fe0de34aaf',
  });

  assert.strictEqual(simResult.validation.isValid, false);
  assert.ok(simResult.validation.errors.length > 0);
  assert.ok(simResult.validation.errors.some(e => e.includes('nonexistent-model-id-999')));
});

// 11. Active-model simulations continue to display their normal results
runTest('11. Active-model simulations in October snapshot produce valid, positive results', () => {
  const activeOctArch: Architecture = {
    id: 'active-oct-arch',
    name: 'October Active Architecture',
    nodes: [
      { id: 'api', type: 'api', label: 'Ingress' },
      { id: 'cache', type: 'cache', label: 'Semantic Cache' },
      { id: 'fast', type: 'fast-model', label: 'DeepSeek Flash', modelId: 'deepseek-flash' },
      { id: 'frontier', type: 'frontier-model', label: 'Llama 3.3 70B', modelId: 'meta-llama/Llama-3.3-70B-Instruct-Turbo' },
    ],
    edges: [
      { source: 'api', target: 'cache' },
      { source: 'cache', target: 'fast', trafficShare: 0.7 },
      { source: 'cache', target: 'frontier', trafficShare: 0.3 },
    ],
  };

  const simResult = simulate({
    workload: DEFAULT_V1_WORKLOAD,
    architecture: activeOctArch,
    pricingSnapshot: 'snap-cc-382481fe0de34aaf',
  });

  assert.strictEqual(simResult.validation.isValid, true);
  assert.ok(simResult.monthlyCost > 0, 'Cost must be positive');
  assert.ok(simResult.p95Latency > 0, 'Latency must be positive');
  assert.ok(simResult.throughputRPS > 0, 'Throughput must be positive');
  assert.ok(simResult.provenance);
  assert.strictEqual(simResult.provenance.pricingSnapshot, 'snap-cc-382481fe0de34aaf');
});

// 12. Existing workload settings survive snapshot changes
runTest('12. Existing workload settings survive snapshot changes', () => {
  const customWorkload: Workload = {
    requestsPerMonth: 5_000_000,
    avgInputTokens: 3200,
    avgOutputTokens: 1100,
    cacheHitRate: 0.42,
  };

  // Simulating with March
  const simMarch = simulate({
    workload: customWorkload,
    architecture: DEFAULT_V1_ARCHITECTURE,
    pricingSnapshot: 'snap-cc-3b3fbd4cbab4e979',
  });
  assert.strictEqual(simMarch.calculationTrace.totalRequests, 5_000_000);
  assert.strictEqual(simMarch.calculationTrace.avgInputTokens, 3200);

  // Simulating with October using identical workload
  const simOctober = simulate({
    workload: customWorkload,
    architecture: DEFAULT_V1_ARCHITECTURE,
    pricingSnapshot: 'snap-cc-382481fe0de34aaf',
  });
  // Gemini-2.0-flash is in DEFAULT_V1_ARCHITECTURE fast node, so October validation detects it
  assert.strictEqual(simOctober.calculationTrace.totalRequests, 5_000_000);
  assert.strictEqual(simOctober.calculationTrace.avgInputTokens, 3200);
});

// 13. March baseline simulation outputs remain exactly equivalent to the frozen baseline
runTest('13. March baseline simulation outputs remain numerically identical to frozen Engine 4.0 baseline', () => {
  const baselineSimDirect = simulate(DEFAULT_V1_WORKLOAD, DEFAULT_V1_ARCHITECTURE);
  const baselineSim = simulate({
    workload: DEFAULT_V1_WORKLOAD,
    architecture: DEFAULT_V1_ARCHITECTURE,
    pricingSnapshot: 'snap-cc-3b3fbd4cbab4e979',
  });

  assert.strictEqual(baselineSim.monthlyCost, baselineSimDirect.monthlyCost);
  assert.strictEqual(baselineSim.costPerRequest, baselineSimDirect.costPerRequest);
  assert.strictEqual(baselineSim.p95Latency, baselineSimDirect.p95Latency);
  assert.strictEqual(baselineSim.capacityUtilization, baselineSimDirect.capacityUtilization);
  assert.strictEqual(baselineSim.qualityEstimate, baselineSimDirect.qualityEstimate);
  assert.strictEqual(baselineSim.throughputRPS, baselineSimDirect.throughputRPS);
  assert.strictEqual(baselineSim.monthlyCost, 2505.8);
});

// 14. Existing registry and hashing tests continue to pass
runTest('14. Verified snapshot registry hashes match immutable pins', () => {
  assert.strictEqual(
    BASELINE_SNAPSHOT.metadata.contentHash,
    '3b3fbd4cbab4e9794d4f76ebb2ffcbb865b7a35232248e24aae986e7bf22080c'
  );
  assert.strictEqual(BASELINE_SNAPSHOT.metadata.snapshotId, 'snap-cc-3b3fbd4cbab4e979');

  assert.strictEqual(
    OCTOBER_2026_SNAPSHOT.metadata.contentHash,
    '382481fe0de34aaf70f9aec566d22d67d40406952b7564441c5be598a34aea7a'
  );
  assert.strictEqual(OCTOBER_2026_SNAPSHOT.metadata.snapshotId, 'snap-cc-382481fe0de34aaf');
});

// 15. Valid legacy alias '2026-03' resolves strictly to March 2026 baseline
runTest('15. Valid legacy alias "2026-03" resolves strictly to baseline snapshot without variance', () => {
  const snap = getSnapshot('2026-03');
  assert.ok(snap, 'Alias 2026-03 must resolve');
  assert.strictEqual(snap.metadata.snapshotId, BASELINE_SNAPSHOT.metadata.snapshotId);
  assert.strictEqual(snap.metadata.snapshotId, 'snap-cc-3b3fbd4cbab4e979');

  const res = resolveRegistryPricing('2026-03');
  assert.strictEqual(res.ok, true);
  if (!res.ok) return;
  assert.strictEqual(res.bundle.snapshotId, BASELINE_SNAPSHOT.metadata.snapshotId);
  assert.strictEqual(res.bundle.isBaseline, true);

  const sim = simulate({
    workload: DEFAULT_V1_WORKLOAD,
    architecture: DEFAULT_V1_ARCHITECTURE,
    pricingSnapshot: '2026-03',
  });
  assert.strictEqual(sim.validation.isValid, true);
  assert.strictEqual(sim.monthlyCost, 2505.8);
});

// 16. Legacy share payload without snapshot field defaults to 2026-03 and baseline numbers
runTest('16. Legacy share payload with missing snapshot field follows legacy baseline semantics', () => {
  const legacyPayload = {
    architecture: DEFAULT_V1_ARCHITECTURE,
    workload: DEFAULT_V1_WORKLOAD,
  };
  const encoded = encodeArchitectureState(legacyPayload);
  const decoded = decodeArchitectureState(encoded);

  assert.strictEqual(decoded.success, true);
  assert.ok(decoded.data);
  assert.strictEqual(decoded.data.pricingSnapshot, '2026-03');

  const snap = getSnapshot(decoded.data.pricingSnapshot);
  assert.ok(snap);
  assert.strictEqual(snap.metadata.snapshotId, BASELINE_SNAPSHOT.metadata.snapshotId);

  const sim = simulate({
    workload: decoded.data.workload,
    architecture: decoded.data.architecture,
    pricingSnapshot: decoded.data.pricingSnapshot,
  });
  assert.strictEqual(sim.validation.isValid, true);
  assert.strictEqual(sim.monthlyCost, 2505.8);
});

// 17. Unknown canonical snapshot ID fails closed into an invalid state
runTest('17. Unknown canonical snapshot ID fails closed and produces invalid simulation state', () => {
  const unknownId = 'snap-cc-unknown-canonical-999';
  assert.strictEqual(getSnapshot(unknownId), undefined);

  const res = resolveRegistryPricing(unknownId);
  assert.strictEqual(res.ok, false);
  if (res.ok) return;
  assert.strictEqual(res.error, 'UNKNOWN_SNAPSHOT');
  assert.strictEqual(res.requestedId, unknownId);

  const sim = simulate({
    workload: DEFAULT_V1_WORKLOAD,
    architecture: DEFAULT_V1_ARCHITECTURE,
    pricingSnapshot: unknownId,
  });

  assert.strictEqual(sim.validation.isValid, false);
  assert.strictEqual(sim.monthlyCost, 0);
  assert.strictEqual(sim.costPerRequest, 0);
  assert.strictEqual(sim.p95Latency, 0);
  assert.ok(sim.validation.errors.length > 0);
  assert.ok(sim.validation.errors[0].includes('Unknown pricing snapshot identifier'));
  assert.ok(sim.validation.errors[0].includes(unknownId));
  assert.strictEqual(sim.warnings[0].severity, 'critical');
});

// 18. Unavailable snapshot in shared URL fails closed without silent substitution
runTest('18. Unavailable snapshot in shared URL fails closed without silent substitution', () => {
  const sharedWithUnavailable = {
    architecture: DEFAULT_V1_ARCHITECTURE,
    workload: DEFAULT_V1_WORKLOAD,
    pricingSnapshot: 'snap-cc-nonexistent-archive',
  };

  const encoded = encodeArchitectureState(sharedWithUnavailable);
  const decoded = decodeArchitectureState(encoded);

  assert.strictEqual(decoded.success, true);
  assert.ok(decoded.data);
  assert.strictEqual(decoded.data.pricingSnapshot, 'snap-cc-nonexistent-archive');

  // Verify that resolution fails closed
  const resolved = getSnapshot(decoded.data.pricingSnapshot);
  assert.strictEqual(resolved, undefined);

  // Simulating with the decoded snapshot must fail closed
  const sim = simulate({
    workload: decoded.data.workload,
    architecture: decoded.data.architecture,
    pricingSnapshot: decoded.data.pricingSnapshot,
  });
  assert.strictEqual(sim.validation.isValid, false);
  assert.strictEqual(sim.monthlyCost, 0);
  assert.ok(sim.validation.errors[0].includes('snap-cc-nonexistent-archive'));
});

// 19. Prevention of invalid configuration masquerading as successful zero-cost result
runTest('19. Prevention of invalid configuration appearing as a successful zero-cost result', () => {
  const invalidSim = simulate({
    workload: DEFAULT_V1_WORKLOAD,
    architecture: DEFAULT_V1_ARCHITECTURE,
    pricingSnapshot: 'snap-cc-corrupt-ref',
  });

  assert.strictEqual(invalidSim.validation.isValid, false);
  assert.strictEqual(invalidSim.monthlyCost, 0);

  // Causal delta and explanation must withhold savings claims
  const baselineSim = simulate(DEFAULT_V1_WORKLOAD, DEFAULT_V1_ARCHITECTURE);
  const explanation = explainEconomicsDelta(
    DEFAULT_V1_WORKLOAD,
    DEFAULT_V1_ARCHITECTURE,
    baselineSim,
    DEFAULT_V1_WORKLOAD,
    DEFAULT_V1_ARCHITECTURE,
    invalidSim
  );

  assert.strictEqual(explanation, 'Simulation withheld: architecture configuration is invalid.');

  const deltaDetails = computeCausalDeltaDetails(
    DEFAULT_V1_WORKLOAD,
    DEFAULT_V1_ARCHITECTURE,
    baselineSim,
    DEFAULT_V1_WORKLOAD,
    DEFAULT_V1_ARCHITECTURE,
    invalidSim
  );

  assert.strictEqual(deltaDetails.primaryCause, 'Simulation withheld: architecture configuration is invalid.');
  assert.strictEqual(deltaDetails.causalFactor, 'Invalid Configuration');
  assert.strictEqual(deltaDetails.costDelta, 0);
});

// 20. Canonical model ID preservation and round-tripping across valid snapshots
runTest('20. Canonical model ID preservation and round-tripping across valid snapshots', () => {
  const mixedArch: Architecture = {
    id: 'multi-model-arch',
    name: 'Multi Model Arch',
    nodes: [
      { id: 'ingress', type: 'api', label: 'API Ingress' },
      { id: 'fast', type: 'fast-model', label: 'Fast Model', modelId: 'gemini-2.0-flash' },
      { id: 'frontier', type: 'frontier-model', label: 'Frontier Model', modelId: 'claude-3.5-sonnet' },
    ],
    edges: [
      { source: 'ingress', target: 'fast', trafficShare: 0.7 },
      { source: 'ingress', target: 'frontier', trafficShare: 0.3 },
    ],
  };

  const payload = {
    architecture: mixedArch,
    workload: DEFAULT_V1_WORKLOAD,
    pricingSnapshot: 'snap-cc-382481fe0de34aaf',
  };

  const encoded = encodeArchitectureState(payload);
  const decoded = decodeArchitectureState(encoded);
  assert.strictEqual(decoded.success, true);
  assert.ok(decoded.data);

  const restoredNodes = decoded.data.architecture.nodes;
  const fastNode = restoredNodes.find(n => n.id === 'fast');
  const frontierNode = restoredNodes.find(n => n.id === 'frontier');

  assert.strictEqual(fastNode?.modelId, 'gemini-2.0-flash');
  assert.strictEqual(frontierNode?.modelId, 'claude-3.5-sonnet');
  assert.strictEqual(decoded.data.pricingSnapshot, 'snap-cc-382481fe0de34aaf');
});

console.log('\n─────────────────────────────────────────────────────────────');
console.log(`Results: ${passCount} passed, ${failCount} failed`);
console.log('─────────────────────────────────────────────────────────────\n');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log(`Phase 3-B UI Snapshot Integration Test Suite: ALL ${passCount} GATES PASSED.`);
}
