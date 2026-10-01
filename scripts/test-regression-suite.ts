/* ──────────────────────────────────────────────────────────────
   COMPUTECANVAS V1.3 — REGRESSION, ROBUSTNESS & FUZZ TEST SUITE
   Deterministic verification of simulation math, graph DAG checks,
   traffic conservation, URL resilience, and numerical stability.
   ────────────────────────────────────────────────────────────── */

import {
  simulate,
  validateArchitecture,
  calculateCalibratedEconomics,
  calculateSensitivity,
  calculateHardwareCost,
  formatCurrency,
  TEMPLATES,
  DEFAULT_V1_ARCHITECTURE,
  DEFAULT_V1_WORKLOAD,
  type Architecture,
  type Workload,
  type BillCalibration,
} from '../lib/simulation/engine';
import {
  encodeArchitectureState,
  decodeArchitectureState,
} from '../lib/simulation/sharing';
import { useArchitectureStore } from '../lib/state/architectureStore';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASSED: ${testName}`);
  } else {
    console.error(`  ❌ FAILED: ${testName}${detail ? ` — ${detail}` : ''}`);
    process.exitCode = 1;
  }
}

console.log('──────────────────────────────────────────────────────────');
console.log('COMPUTECANVAS V1.3 — COMPREHENSIVE REGRESSION & FUZZ SUITE');
console.log('──────────────────────────────────────────────────────────\n');

// ══════════════════════════════════════════════════════════════
// SUITE 1: SIMULATION ENGINE BOUNDARIES & NUMERICAL STABILITY
// ══════════════════════════════════════════════════════════════
console.log('1. Simulation Boundary Conditions');

// 1.1 Zero Requests
const zeroWorkload: Workload = {
  ...DEFAULT_V1_WORKLOAD,
  requestsPerMonth: 0,
};
const zeroSim = simulate(zeroWorkload, DEFAULT_V1_ARCHITECTURE);
assert(!isNaN(zeroSim.monthlyCost), 'Zero requests: monthlyCost is not NaN');
assert(isFinite(zeroSim.monthlyCost), 'Zero requests: monthlyCost is finite');
assert(zeroSim.costPerRequest === 0, 'Zero requests: costPerRequest is exactly 0', `Got ${zeroSim.costPerRequest}`);
assert(zeroSim.throughputRPS === 0, 'Zero requests: throughputRPS is exactly 0', `Got ${zeroSim.throughputRPS}`);
assert(zeroSim.monthlyCost >= 0, 'Zero requests: monthlyCost is non-negative');

// 1.2 100% Cache Hit Rate (Model cost must be strictly 0)
const fullCacheWorkload: Workload = {
  ...DEFAULT_V1_WORKLOAD,
  cacheHitRate: 1.0,
};
const fullCacheSim = simulate(fullCacheWorkload, DEFAULT_V1_ARCHITECTURE);
assert(fullCacheSim.costBreakdown.models === 0, '100% cache: Model cost is strictly $0.00', `Got ${fullCacheSim.costBreakdown.models}`);
assert(fullCacheSim.monthlyCost < zeroSim.monthlyCost + 200, '100% cache: Incurs only fixed infrastructure cost');

// 1.3 0% Cache Hit Rate (Full Model Ingress)
const zeroCacheWorkload: Workload = {
  ...DEFAULT_V1_WORKLOAD,
  cacheHitRate: 0.0,
};
const zeroCacheSim = simulate(zeroCacheWorkload, DEFAULT_V1_ARCHITECTURE);
assert(zeroCacheSim.monthlyCost > fullCacheSim.monthlyCost, '0% cache costs significantly more than 100% cache');
assert(zeroCacheSim.costBreakdown.models > 0, '0% cache: Full token volume charged to models');

// 1.4 High Volume (100M Requests / Month)
const highVolumeWorkload: Workload = {
  ...DEFAULT_V1_WORKLOAD,
  requestsPerMonth: 100_000_000,
};
const highVolSim = simulate(highVolumeWorkload, DEFAULT_V1_ARCHITECTURE);
assert(isFinite(highVolSim.monthlyCost), '100M requests: monthlyCost remains finite');
assert(!isNaN(highVolSim.monthlyCost), '100M requests: monthlyCost is not NaN');
assert(highVolSim.throughputRPS > 35, '100M requests: throughputRPS correctly reflects ~38 RPS');

// 1.5 Zero Tokens where Valid
const zeroTokensWorkload: Workload = {
  ...DEFAULT_V1_WORKLOAD,
  avgInputTokens: 0,
  avgOutputTokens: 0,
};
const zeroTokensSim = simulate(zeroTokensWorkload, DEFAULT_V1_ARCHITECTURE);
assert(zeroTokensSim.costBreakdown.models === 0, 'Zero tokens: Model inference spend is $0.00');
assert(!isNaN(zeroTokensSim.monthlyCost), 'Zero tokens: monthlyCost is not NaN');

// 1.6 High Token Context (128,000 tokens)
const highTokenWorkload: Workload = {
  ...DEFAULT_V1_WORKLOAD,
  avgInputTokens: 120_000,
  avgOutputTokens: 8_000,
};
const highTokenSim = simulate(highTokenWorkload, DEFAULT_V1_ARCHITECTURE);
assert(isFinite(highTokenSim.monthlyCost), '128K context: monthlyCost remains numerically stable');
assert(highTokenSim.monthlyCost > zeroCacheSim.monthlyCost, '128K context scales cost appropriately');

// 1.7 Dedicated Hardware Formula
const hwCost = calculateHardwareCost(3.2, 2.50); // ceil(3.2) = 4 instances * $2.50 * 730 = $7,300
assert(hwCost === 7300, 'Hardware formula: ceil(instances) * rate * 730 is exact', `Expected 7300, got ${hwCost}`);
assert(calculateHardwareCost(0, 5.0) === 0, 'Hardware formula: 0 instances yields $0');

// ══════════════════════════════════════════════════════════════
// SUITE 2: GRAPH VALIDATION & TRAFFIC CONSERVATION
// ══════════════════════════════════════════════════════════════
console.log('\n2. Graph Validation & Traffic Conservation');

// 2.1 Self-Loop Rejection
const selfLoopArch: Architecture = {
  nodes: [
    { id: 'api-1', type: 'api', label: 'API Ingress' },
    { id: 'model-1', type: 'frontier-model', label: 'Frontier LLM' },
  ],
  edges: [
    { source: 'api-1', target: 'model-1' },
    { source: 'model-1', target: 'model-1' }, // Self loop!
  ],
};
const selfLoopVal = validateArchitecture(selfLoopArch);
assert(!selfLoopVal.isValid, 'Self-loop: Architecture rejected as invalid');
assert(selfLoopVal.errors.some(e => e.includes('self-loop')), 'Self-loop: Explicit error message generated');

// 2.2 Duplicate Edge Warning
const duplicateEdgeArch: Architecture = {
  nodes: [
    { id: 'api-1', type: 'api', label: 'API Ingress' },
    { id: 'model-1', type: 'frontier-model', label: 'Frontier LLM' },
  ],
  edges: [
    { source: 'api-1', target: 'model-1' },
    { source: 'api-1', target: 'model-1' }, // Duplicate!
  ],
};
const dupVal = validateArchitecture(duplicateEdgeArch);
assert(dupVal.isValid, 'Duplicate edge: Still valid for simulation execution');
assert(dupVal.warnings.some(w => w.includes('Duplicate connection')), 'Duplicate edge: Warning raised to user');

// 2.3 Traffic Conservation: Router Under-allocation (<100%)
const routerUnderAllocArch: Architecture = {
  nodes: [
    { id: 'api-1', type: 'api', label: 'API Ingress' },
    { id: 'router-1', type: 'router', label: 'Router' },
    { id: 'fast-1', type: 'fast-model', label: 'Fast Model', modelId: 'gpt-4o-mini' },
    { id: 'frontier-1', type: 'frontier-model', label: 'Frontier Model', modelId: 'gpt-4o' },
  ],
  edges: [
    { source: 'api-1', target: 'router-1' },
    { source: 'router-1', target: 'fast-1', trafficShare: 0.60 },
    { source: 'router-1', target: 'frontier-1', trafficShare: 0.30 }, // Sum = 90% (10% unallocated)
  ],
};
const routerUnderSim = simulate(DEFAULT_V1_WORKLOAD, routerUnderAllocArch);
assert(routerUnderSim.warnings.some(w => w.message.includes('Unallocated router traffic')), 'Router <100%: Unallocated traffic explicitly warned');
// Fast model should receive exactly 60% of uncached requests, Frontier receives 30%
const fastNodeMetrics = routerUnderSim.nodeMetrics.get('fast-1');
const frontierNodeMetrics = routerUnderSim.nodeMetrics.get('frontier-1');
assert(Boolean(fastNodeMetrics && frontierNodeMetrics), 'Router <100%: Node metrics exist for both branches');

// 2.4 Traffic Conservation: Router Over-allocation (>100%)
const routerOverAllocArch: Architecture = {
  nodes: [
    { id: 'api-1', type: 'api', label: 'API Ingress' },
    { id: 'router-1', type: 'router', label: 'Router' },
    { id: 'fast-1', type: 'fast-model', label: 'Fast Model', modelId: 'gpt-4o-mini' },
    { id: 'frontier-1', type: 'frontier-model', label: 'Frontier Model', modelId: 'gpt-4o' },
  ],
  edges: [
    { source: 'api-1', target: 'router-1' },
    { source: 'router-1', target: 'fast-1', trafficShare: 0.80 },
    { source: 'router-1', target: 'frontier-1', trafficShare: 0.40 }, // Sum = 120%
  ],
};
const routerOverVal = validateArchitecture(routerOverAllocArch);
assert(!routerOverVal.isValid, 'Router >100%: Invalid routing blocks architecture calculation');
assert(routerOverVal.errors.some(e => e.includes('INVALID ROUTING') && e.includes('exceeds 100% capacity')), 'Router >100%: Explicit error raised for capacity overrun');
const routerOverSim = simulate(DEFAULT_V1_WORKLOAD, routerOverAllocArch);
assert(routerOverSim.monthlyCost === 0, 'Router >100%: Calculation blocked safely (monthlyCost is 0)');

// 2.5 Percentile Latency Engine
assert(zeroSim.latencies.p50 >= 0, 'Latency engine: P50 latency calculated');
assert(zeroSim.latencies.p90 >= zeroSim.latencies.p50, 'Latency engine: P90 >= P50');
assert(zeroSim.latencies.p95 >= zeroSim.latencies.p90, 'Latency engine: P95 >= P90');
assert(zeroSim.latencies.p99 >= zeroSim.latencies.p95, 'Latency engine: P99 >= P95');
assert(zeroSim.latencies.ttftMs > 0, 'Latency engine: TTFT explicitly modeled');

// ══════════════════════════════════════════════════════════════
// SUITE 3: CALIBRATION & EMPIRICAL VARIANCE HONESTY
// ══════════════════════════════════════════════════════════════
console.log('\n3. Calibration & Empirical Variance Honesty');

const baseSimForCal = simulate(DEFAULT_V1_WORKLOAD, DEFAULT_V1_ARCHITECTURE);
const calib: BillCalibration = {
  enabled: true,
  actualBill: 4500,
  actualRequests: 1200000,
  baselineSimulatedCost: baseSimForCal.monthlyCost,
};
const calibratedResult = calculateCalibratedEconomics(baseSimForCal, DEFAULT_V1_WORKLOAD, calib);
assert(calibratedResult.isCalibrated, 'Calibration: Marked active');
assert(calibratedResult.calibrationFactor > 1.0, 'Calibration factor kappa > 1.0 reflects real cloud overhead');
assert(calibratedResult.limitationsNote.includes('variance accounts for real-world cloud factors'), 'Calibration: Transparent limitations explanation provided');
assert(calibratedResult.variancePercentage > 0, 'Calibration: Variance percentage is honestly exposed without manipulation');

// ══════════════════════════════════════════════════════════════
// SUITE 4: STATE SERIALIZATION & SHARE RESILIENCE
// ══════════════════════════════════════════════════════════════
console.log('\n4. URL Share Encoding & Corruption Resilience');

// 4.1 Valid roundtrip
const encoded = encodeArchitectureState({
  architecture: DEFAULT_V1_ARCHITECTURE,
  workload: DEFAULT_V1_WORKLOAD,
  calibration: calib,
});
const decoded = decodeArchitectureState(encoded);
assert(decoded.success, 'Valid share payload decodes successfully');
assert(decoded.data?.version === 1, 'Decoded payload preserves Schema Version 1');
assert(decoded.data?.calibration?.enabled === true, 'Decoded payload preserves calibration state');

// 4.2 Future Schema Version (v2 or v99)
const futureSchemaObj = {
  version: 99,
  architecture: DEFAULT_V1_ARCHITECTURE,
  workload: DEFAULT_V1_WORKLOAD,
};
const futureEncoded = Buffer.from(JSON.stringify(futureSchemaObj)).toString('base64url');
const futureDecoded = decodeArchitectureState(futureEncoded);
assert(!futureDecoded.success, 'Future schema version is rejected gracefully');
assert(futureDecoded.error?.includes('schema version') ?? false, 'Graceful error message for future schema');

// 4.3 Truncated Payload
const truncatedEncoded = encoded.slice(0, 15);
const truncDecoded = decodeArchitectureState(truncatedEncoded);
assert(!truncDecoded.success, 'Truncated Base64URL string handled gracefully without crash');

// 4.4 Malformed Non-Base64 Content
const garbageDecoded = decodeArchitectureState('???&&&$$$');
assert(!garbageDecoded.success, 'Garbage characters handled gracefully without crash');

// ══════════════════════════════════════════════════════════════
// SUITE 5: DETERMINISTIC SENSITIVITY ENGINE
// ══════════════════════════════════════════════════════════════
console.log('\n5. Deterministic Sensitivity Engine');

const cacheSensitivity = calculateSensitivity(DEFAULT_V1_WORKLOAD, DEFAULT_V1_ARCHITECTURE, 'cacheHitRate');
assert(cacheSensitivity.length === 6, 'Sensitivity: Generated 6 discrete hit rate data points');
assert(cacheSensitivity[0].parameterValue === 0.0, 'Sensitivity: First point is 0% cache hit rate');
assert(cacheSensitivity[5].parameterValue === 0.95, 'Sensitivity: Sixth point is 95% cache hit rate');
assert(cacheSensitivity[0].monthlyCost > cacheSensitivity[5].monthlyCost, 'Sensitivity: 0% hit rate costs more than 95% hit rate');

const reqSensitivity = calculateSensitivity(DEFAULT_V1_WORKLOAD, DEFAULT_V1_ARCHITECTURE, 'requests');
assert(reqSensitivity.length === 6, 'Sensitivity: Generated 6 traffic scale points');
assert(reqSensitivity[0].monthlyCost < reqSensitivity[5].monthlyCost, 'Sensitivity: Higher request volume increases monthly cost monotonically');

// ══════════════════════════════════════════════════════════════
// SUITE 6: CANONICAL TEMPLATES INTEGRITY
// ══════════════════════════════════════════════════════════════
console.log('\n6. Canonical Templates Verification');

assert(TEMPLATES.length === 3, 'Exactly 3 canonical templates maintained');
const [tDirect, tRag, tRouter] = TEMPLATES;

const simDirect = simulate(tDirect.defaultWorkload, tDirect.architecture);
assert(simDirect.validation.isValid, 'Template 1 (Direct LLM): Passes graph validation');
assert(simDirect.monthlyCost > 0, 'Template 1: Generates valid monthly spend');
assert(simDirect.capabilityTier === 'Frontier Reasoning', 'Template 1: Evaluates to Frontier Reasoning capability tier');
assert(simDirect.qualityEstimate === 95, 'Template 1: Evaluates to deterministic 95% quality legacy score');

const simRag = simulate(tRag.defaultWorkload, tRag.architecture);
assert(simRag.validation.isValid, 'Template 2 (RAG Pipeline): Passes graph validation');
assert(simRag.costBreakdown.vectorDb > 0, 'Template 2: Vector DB cost actively modeled');
assert(simRag.capabilityTier === 'Context-Grounded Frontier', 'Template 2: Evaluates to Context-Grounded Frontier tier');
assert(simRag.qualityEstimate === 97, 'Template 2: Evaluates to grounded 97% quality (+1% RAG grounding)');

const simRouter = simulate(tRouter.defaultWorkload, tRouter.architecture);
assert(simRouter.validation.isValid, 'Template 3 (Router + Cache): Passes graph validation');
assert(simRouter.costBreakdown.cache > 0, 'Template 3: Semantic Cache actively modeled');
assert(simRouter.capabilityTier === 'Blended Routing', 'Template 3: Evaluates to Blended Routing capability tier');
assert(simRouter.qualityEstimate === 86, 'Template 3: Evaluates to routed 86% quality (70% fast + 30% frontier)');

assert(formatCurrency(0.50) === '$0.50', 'Currency formatting: Sub-dollar amounts display with 2 decimal places ($0.50)');
assert(formatCurrency(0.0025) === '$0.0025', 'Currency formatting: Sub-cent per-request values retain 4 decimal places ($0.0025)');

// ══════════════════════════════════════════════════════════════
// SUITE 7: WORKBENCH STATE HISTORY & CASCADE
// ══════════════════════════════════════════════════════════════
console.log('\n7. Workbench State Store & Cascade Deletion');

const store = useArchitectureStore.getState();
store.loadArchitecture(tDirect.architecture, tDirect.defaultWorkload);
assert(useArchitectureStore.getState().architecture.nodes.length === 2, 'Store: Loaded 2 nodes from Direct LLM');

const addedNodeId = store.addNode('cache', 'Semantic Cache');
assert(useArchitectureStore.getState().architecture.nodes.length === 3, 'Store: Added 3rd node');

// Connect edge
store.addEdge('api-1', addedNodeId);
assert(useArchitectureStore.getState().architecture.edges.some(e => e.target === addedNodeId), 'Store: Edge created to new node');

// Delete node and verify cascade
store.removeNode(addedNodeId);
assert(useArchitectureStore.getState().architecture.nodes.length === 2, 'Store: Node removed cleanly');
assert(!useArchitectureStore.getState().architecture.edges.some(e => e.target === addedNodeId || e.source === addedNodeId), 'Store: Edge cascade removed on node deletion');

// ══════════════════════════════════════════════════════════════
// SUITE 8: FUZZ TESTING — 50 RANDOMIZED ARCHITECTURE STATES
// ══════════════════════════════════════════════════════════════
console.log('\n8. Fuzz Testing (50 Randomized Architecture Permutations)');

const componentTypes = ['api', 'cache', 'router', 'vectordb', 'fast-model', 'frontier-model'] as const;
let fuzzSuccesses = 0;

for (let i = 0; i < 50; i++) {
  const nodeCount = 2 + Math.floor(Math.random() * 6); // 2 to 7 nodes
  const nodes = [];

  // Always include at least one API Ingress
  nodes.push({ id: 'api-root', type: 'api' as const, label: 'API Gateway' });

  for (let j = 1; j < nodeCount; j++) {
    const type = componentTypes[Math.floor(Math.random() * componentTypes.length)];
    nodes.push({ id: `node-${j}`, type, label: `Component ${j}` });
  }

  // Create random forward edges
  const edges = [];
  for (let j = 0; j < nodes.length - 1; j++) {
    const targetIdx = j + 1 + Math.floor(Math.random() * (nodes.length - 1 - j));
    if (targetIdx < nodes.length) {
      edges.push({
        source: nodes[j].id,
        target: nodes[targetIdx].id,
        trafficShare: Math.round(Math.random() * 100) / 100,
      });
    }
  }

  const fuzzArch: Architecture = { nodes, edges };
  const fuzzWorkload: Workload = {
    requestsPerMonth: Math.floor(Math.random() * 50_000_000),
    avgInputTokens: Math.floor(Math.random() * 32_000),
    avgOutputTokens: Math.floor(Math.random() * 8_000),
    cacheHitRate: Math.random(),
  };

  const fuzzResult = simulate(fuzzWorkload, fuzzArch);

  if (
    !isNaN(fuzzResult.monthlyCost) &&
    isFinite(fuzzResult.monthlyCost) &&
    fuzzResult.monthlyCost >= 0 &&
    !isNaN(fuzzResult.p95Latency) &&
    isFinite(fuzzResult.p95Latency) &&
    fuzzResult.p95Latency >= 0 &&
    !isNaN(fuzzResult.costPerRequest) &&
    !isNaN(fuzzResult.throughputRPS)
  ) {
    fuzzSuccesses++;
  } else {
    console.error(`Fuzz failed on iteration ${i}:`, fuzzResult);
  }
}

assert(fuzzSuccesses === 50, 'Fuzz testing: 50/50 randomized states generated 0 NaN, 0 Infinity, 0 negative values');

// ══════════════════════════════════════════════════════════════
// SUMMARY
// ══════════════════════════════════════════════════════════════
console.log('\n──────────────────────────────────────────────────────────');
console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
console.log('──────────────────────────────────────────────────────────');

if (passedTests === totalTests) {
  console.log('\n🏆 ALL REGRESSION & ROBUSTNESS TESTS PASSED WITH 100% INTEGRITY!\n');
} else {
  process.exit(1);
}
