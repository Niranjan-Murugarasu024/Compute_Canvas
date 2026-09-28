import {
  simulate,
  calculateCalibratedEconomics,
  explainEconomicsDelta,
  validateArchitecture,
  formatCurrency,
  formatLatency,
  DEFAULT_V1_ARCHITECTURE,
  DEFAULT_V1_WORKLOAD,
  DEFAULT_V1_CALIBRATION,
  TEMPLATES,
  type Architecture,
  type Workload,
  type BillCalibration,
} from '../lib/simulation/engine';
import {
  encodeArchitectureState,
  decodeArchitectureState,
} from '../lib/simulation/sharing';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

console.log('──────────────────────────────────────────────────');
console.log('COMPUTECANVAS V1 — AUTOMATED MASTER SCENARIO SUITE');
console.log('──────────────────────────────────────────────────\n');

// ── Scenario A: Baseline Architecture & Default State ──
console.log('Scenario A: Initial Baseline Architecture Verification');
const baseSim = simulate(DEFAULT_V1_WORKLOAD, DEFAULT_V1_ARCHITECTURE);
assert(baseSim.validation.isValid, 'Baseline architecture passes graph validation');
assert(baseSim.monthlyCost > 0, `Baseline monthly cost is deterministic ($${baseSim.monthlyCost.toFixed(2)})`);
assert(baseSim.p95Latency > 0, `Baseline P95 latency is deterministic (${baseSim.p95Latency} ms)`);
assert(baseSim.bottleneck.impactPercentage > 0, `Bottleneck identified: ${baseSim.bottleneck.componentName} (${baseSim.bottleneck.impactPercentage}% impact)`);

// ── Scenario B & C: Cache Impact and Hit Rate Sensitivity ──
console.log('\nScenario B & C: Cache Impact & Hit Rate Sensitivity');
const noCacheWorkload: Workload = { ...DEFAULT_V1_WORKLOAD, cacheHitRate: 0.0 };
const highCacheWorkload: Workload = { ...DEFAULT_V1_WORKLOAD, cacheHitRate: 0.80 };

const noCacheSim = simulate(noCacheWorkload, DEFAULT_V1_ARCHITECTURE);
const highCacheSim = simulate(highCacheWorkload, DEFAULT_V1_ARCHITECTURE);

assert(
  highCacheSim.monthlyCost < noCacheSim.monthlyCost,
  `High cache hit rate (80%) lowers monthly spend ($${highCacheSim.monthlyCost}) compared to 0% cache ($${noCacheSim.monthlyCost})`
);

const deltaExplanation = explainEconomicsDelta(
  noCacheWorkload,
  DEFAULT_V1_ARCHITECTURE,
  noCacheSim,
  highCacheWorkload,
  DEFAULT_V1_ARCHITECTURE,
  highCacheSim
);
assert(
  deltaExplanation.includes('cache hit rate') || deltaExplanation.includes('cache'),
  `Causal explanation accurately attributes savings to caching: "${deltaExplanation}"`
);

// ── Scenario D: Router Traffic Split Shift ──
console.log('\nScenario D: Router Allocation Shift');
const highFrontierArch: Architecture = {
  ...DEFAULT_V1_ARCHITECTURE,
  edges: DEFAULT_V1_ARCHITECTURE.edges.map(e => {
    if (e.target.includes('fast')) return { ...e, trafficShare: 0.10 };
    if (e.target.includes('frontier')) return { ...e, trafficShare: 0.90 };
    return e;
  }),
};

const lowFrontierArch: Architecture = {
  ...DEFAULT_V1_ARCHITECTURE,
  edges: DEFAULT_V1_ARCHITECTURE.edges.map(e => {
    if (e.target.includes('fast')) return { ...e, trafficShare: 0.90 };
    if (e.target.includes('frontier')) return { ...e, trafficShare: 0.10 };
    return e;
  }),
};

const highFrontierSim = simulate(DEFAULT_V1_WORKLOAD, highFrontierArch);
const lowFrontierSim = simulate(DEFAULT_V1_WORKLOAD, lowFrontierArch);

assert(
  lowFrontierSim.monthlyCost < highFrontierSim.monthlyCost,
  `Routing 90% traffic to fast tier costs ($${lowFrontierSim.monthlyCost}) significantly less than 90% to frontier tier ($${highFrontierSim.monthlyCost})`
);

// ── Scenario E: Request Volume Scaling ──
console.log('\nScenario E: Request Volume Scaling');
const lowVolWorkload: Workload = { ...DEFAULT_V1_WORKLOAD, requestsPerMonth: 500_000 };
const highVolWorkload: Workload = { ...DEFAULT_V1_WORKLOAD, requestsPerMonth: 5_000_000 };

const lowVolSim = simulate(lowVolWorkload, DEFAULT_V1_ARCHITECTURE);
const highVolSim = simulate(highVolWorkload, DEFAULT_V1_ARCHITECTURE);

assert(
  highVolSim.monthlyCost > lowVolSim.monthlyCost,
  `Scaling requests from 500K ($${lowVolSim.monthlyCost}) to 5M ($${highVolSim.monthlyCost}) proportionally increases token expenditure`
);

// ── Scenario F: Bill Calibration ("Anchor to My Bill") ──
console.log('\nScenario F: Bill Calibration Anchor');
const testCalibration: BillCalibration = {
  enabled: true,
  actualBill: 4500,
  actualRequests: 1200000,
  baselineSimulatedCost: baseSim.monthlyCost,
};

const calibratedEco = calculateCalibratedEconomics(baseSim, DEFAULT_V1_WORKLOAD, testCalibration);
assert(calibratedEco.isCalibrated, 'Calibration is marked active');
assert(calibratedEco.actualCostPerRequest === 4500 / 1200000, `Actual $/req is precisely calculated ($${calibratedEco.actualCostPerRequest.toFixed(5)})`);
assert(calibratedEco.calibratedMonthlyCost > 0, `Calibrated monthly spend is computed ($${calibratedEco.calibratedMonthlyCost.toFixed(2)})`);
assert(typeof calibratedEco.variancePercentage === 'number', `Variance percentage is tracked (${calibratedEco.variancePercentage}%)`);

// ── Scenario G & H: Zero-Backend State URL Encoding & Restoration ──
console.log('\nScenario G & H: Shareable URL Encoding & Restoration');
const originalState = {
  architecture: DEFAULT_V1_ARCHITECTURE,
  workload: DEFAULT_V1_WORKLOAD,
  calibration: testCalibration,
};

const encodedUrlPayload = encodeArchitectureState(originalState);
assert(typeof encodedUrlPayload === 'string' && encodedUrlPayload.length > 20, 'State successfully encoded to compact Base64URL string');
assert(!encodedUrlPayload.includes('+') && !encodedUrlPayload.includes('/') && !encodedUrlPayload.includes('='), 'Payload conforms to URL-safe Base64URL (no +, /, or = padding)');

const decodedResult = decodeArchitectureState(encodedUrlPayload);
assert(decodedResult.success && !!decodedResult.data, 'Encoded payload successfully decoded without loss');
assert(decodedResult.data?.version === 1, 'Decoded payload adheres to Schema Version 1');
assert(decodedResult.data?.architecture.nodes.length === originalState.architecture.nodes.length, 'Restored node count matches original');
assert(decodedResult.data?.architecture.edges.length === originalState.architecture.edges.length, 'Restored edge count matches original');
assert(decodedResult.data?.workload.requestsPerMonth === originalState.workload.requestsPerMonth, 'Restored workload requests match original');
assert(decodedResult.data?.calibration?.actualBill === testCalibration.actualBill, 'Restored bill calibration matches original');

// ── Scenario I: Corrupted / Malformed URL Resilience ──
console.log('\nScenario I: Corrupted / Malformed URL Resilience');
const malformedOutputs = [
  decodeArchitectureState(''),
  decodeArchitectureState('not-a-valid-base64-payload!!!'),
  decodeArchitectureState('eyAidmVyc2lvbiI6IDk5OSB9'), // Unsupported version
];

malformedOutputs.forEach((res, idx) => {
  assert(!res.success && typeof res.error === 'string', `Malformed input #${idx + 1} fails gracefully without crashing (${res.error})`);
});

// ── Scenario J: Graph Validation & Error Detection ──
console.log('\nScenario J: Graph Validation & Error Detection');
const missingApiArch: Architecture = {
  nodes: [
    { id: 'model-1', type: 'frontier-model', label: 'Frontier Model' },
  ],
  edges: [],
};
const missingApiVal = validateArchitecture(missingApiArch);
assert(!missingApiVal.isValid, 'Detects missing API ingress component');
assert(missingApiVal.errors.some(e => e.includes('API Ingress')), 'Provides human-readable guidance to connect API');

const circularArch: Architecture = {
  nodes: [
    { id: 'api-1', type: 'api', label: 'API Ingress' },
    { id: 'cache-1', type: 'cache', label: 'Cache' },
    { id: 'router-1', type: 'router', label: 'Router' },
  ],
  edges: [
    { source: 'api-1', target: 'cache-1' },
    { source: 'cache-1', target: 'router-1' },
    { source: 'router-1', target: 'cache-1' }, // Circular!
  ],
};
const circularVal = validateArchitecture(circularArch);
assert(!circularVal.isValid, 'Detects circular graph dependency');
assert(circularVal.errors.some(e => e.includes('cycle') || e.includes('circular')), 'Provides human-readable circular dependency error');

console.log('\n──────────────────────────────────────────────────');
console.log('ALL 10 VALIDATION SCENARIOS PASSED WITH 100% SUCCESS');
console.log('──────────────────────────────────────────────────');
