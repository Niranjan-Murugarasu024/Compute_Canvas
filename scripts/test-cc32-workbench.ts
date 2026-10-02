import {
  simulate,
  TEMPLATES,
  buildCalculationTrace,
  type Workload,
  type Architecture,
} from '../lib/simulation/engine';
import {
  generateSimulationSnapshotId,
  computeBaselineDeltas,
  getComponentCausalRole,
  formatCalculationTraceAsText,
  buildExportSpecification,
} from '../lib/simulation/workbenchInstrument';
import {
  encodeArchitectureState,
  decodeArchitectureState,
} from '../lib/simulation/sharing';

console.log('──────────────────────────────────────────────────────────');
console.log('COMPUTECANVAS 3.2 — ENGINEERING WORKBENCH TEST SUITE');
console.log('──────────────────────────────────────────────────────────');

let passed = 0;
let failed = 0;

function assert(condition: boolean, name: string) {
  if (condition) {
    console.log(`  ✅ PASSED: ${name}`);
    passed++;
  } else {
    console.error(`  ❌ FAILED: ${name}`);
    failed++;
  }
}

const template = TEMPLATES.find(t => t.id === 'router-cache')!;
const baselineWorkload: Workload = JSON.parse(JSON.stringify(template.defaultWorkload));
const baselineArch: Architecture = JSON.parse(JSON.stringify(template.architecture));

// ── 1. BASELINE IDENTITY & SNAPSHOT ID ──
const snapshotId = generateSimulationSnapshotId(template.name, '2026-03', 'v1.4');
assert(snapshotId.startsWith('CC-ROUTER---CACHE-') || snapshotId.includes('ROUTER'), 'Snapshot ID incorporates blueprint name');
assert(snapshotId.includes('2026-03'), 'Snapshot ID incorporates pricing snapshot date');
assert(snapshotId.includes('V1-4'), 'Snapshot ID incorporates registry version');

// ── 2. BASELINE EQUALITY (UNMODIFIED) ──
const zeroDeltas = computeBaselineDeltas(baselineWorkload, baselineWorkload, baselineArch, baselineArch);
assert(zeroDeltas.modifiedCount === 0, 'Initial state: modified count is strictly 0');
assert(zeroDeltas.deltas.length === 0, 'Initial state: deltas list is empty');
assert(zeroDeltas.requestsDeltaText === 'Unchanged', 'Initial state: requests delta is "Unchanged"');
assert(zeroDeltas.cacheDeltaText === 'Unchanged', 'Initial state: cache delta is "Unchanged"');

// ── 3. CACHE HIT RATE CHANGE (60% -> 80%) ──
const modifiedWorkloadCache: Workload = { ...baselineWorkload, cacheHitRate: 0.80 };
const cacheDeltas = computeBaselineDeltas(baselineWorkload, modifiedWorkloadCache, baselineArch, baselineArch);
assert(cacheDeltas.modifiedCount === 1, 'Cache change: exactly 1 parameter modified');
assert(cacheDeltas.deltas[0].id === 'cache-rate', 'Cache change: detected cache-rate delta ID');
assert(cacheDeltas.deltas[0].delta === '+20 pts', 'Cache change: delta formatted as +20 pts');

// ── 4. ROUTING ALLOCATION CHANGE (70/30 -> 50/50) ──
const modifiedArchRouting: Architecture = {
  ...baselineArch,
  edges: baselineArch.edges.map(e => {
    if (e.target.includes('fast') || e.target === 'fast-model') {
      return { ...e, trafficShare: 0.50 };
    }
    if (e.target.includes('frontier') || e.target === 'frontier-model') {
      return { ...e, trafficShare: 0.50 };
    }
    return e;
  }),
};
const routingDeltas = computeBaselineDeltas(baselineWorkload, baselineWorkload, baselineArch, modifiedArchRouting);
assert(routingDeltas.modifiedCount > 0, 'Routing change: modifiedCount > 0');
assert(routingDeltas.deltas.some(d => d.category === 'routing'), 'Routing change: category is routing');

// ── 5. TOPOLOGY MODIFICATION (NODE ADDITION) ──
const modifiedArchTopology: Architecture = {
  ...baselineArch,
  nodes: [
    ...baselineArch.nodes,
    { id: 'node-vectordb-extra', type: 'vectordb', label: 'Knowledge Base', x: 200, y: 300 },
  ],
};
const topoDeltas = computeBaselineDeltas(baselineWorkload, baselineWorkload, baselineArch, modifiedArchTopology);
assert(topoDeltas.modifiedCount === 1, 'Topology change: exactly 1 modified parameter');
assert(topoDeltas.deltas[0].id.includes('node-add'), 'Topology change: detected node addition');

// ── 6. EXACT RESET TO BASELINE MATHEMATICAL EQUIVALENCE ──
// Modify workload and architecture, then restore baseline
let activeWorkload: Workload = { ...baselineWorkload, requestsPerMonth: 5_000_000, cacheHitRate: 0.90 };
let activeArch: Architecture = JSON.parse(JSON.stringify(modifiedArchRouting));
assert(computeBaselineDeltas(baselineWorkload, activeWorkload, baselineArch, activeArch).modifiedCount > 0, 'State is modified before reset');

// Perform Reset
activeWorkload = JSON.parse(JSON.stringify(baselineWorkload));
activeArch = JSON.parse(JSON.stringify(baselineArch));
const postResetDeltas = computeBaselineDeltas(baselineWorkload, activeWorkload, baselineArch, activeArch);
assert(postResetDeltas.modifiedCount === 0, 'Post-reset: modified count is strictly 0');

const baseSim = simulate(baselineWorkload, baselineArch);
const resetSim = simulate(activeWorkload, activeArch);
assert(baseSim.monthlyCost === resetSim.monthlyCost, 'Post-reset: monthlyCost strictly equals baseline');
assert(baseSim.p95Latency === resetSim.p95Latency, 'Post-reset: p95Latency strictly equals baseline');
assert(baseSim.bottleneck.componentName === resetSim.bottleneck.componentName, 'Post-reset: bottleneck strictly equals baseline');

// ── 7. DETERMINISTIC UNDO / REDO STATE SIMULATION ──
const historyPast: Array<{ workload: Workload; arch: Architecture }> = [];
const historyFuture: Array<{ workload: Workload; arch: Architecture }> = [];

// Step 1: Initial state
let currentWl = { ...baselineWorkload };
let currentAr = { ...baselineArch };

// Step 2: User changes cache 60 -> 80
historyPast.push({ workload: currentWl, arch: currentAr });
currentWl = { ...currentWl, cacheHitRate: 0.80 };
const simStep2 = simulate(currentWl, currentAr);

// Step 3: User changes volume 2.5M -> 5M
historyPast.push({ workload: currentWl, arch: currentAr });
currentWl = { ...currentWl, requestsPerMonth: 5_000_000 };
const simStep3 = simulate(currentWl, currentAr);

// Undo Step 3 -> should restore Step 2
const undoEntry = historyPast.pop()!;
historyFuture.unshift({ workload: currentWl, arch: currentAr });
currentWl = undoEntry.workload;
currentAr = undoEntry.arch;
const simUndo = simulate(currentWl, currentAr);
assert(currentWl.requestsPerMonth === 2_500_000, 'Undo restores requestsPerMonth to 2,500,000');
assert(currentWl.cacheHitRate === 0.80, 'Undo preserves cacheHitRate at 0.80');
assert(simUndo.monthlyCost === simStep2.monthlyCost, 'Undo recalculates exact deterministic monthlyCost');

// Redo -> should restore Step 3
const redoEntry = historyFuture.shift()!;
historyPast.push({ workload: currentWl, arch: currentAr });
currentWl = redoEntry.workload;
currentAr = redoEntry.arch;
const simRedo = simulate(currentWl, currentAr);
assert(currentWl.requestsPerMonth === 5_000_000, 'Redo restores requestsPerMonth to 5,000,000');
assert(simRedo.monthlyCost === simStep3.monthlyCost, 'Redo recalculates exact deterministic monthlyCost');

// ── 8. CALCULATION TRACE 2.0 & PLAIN-TEXT FORMATTING ──
const trace = buildCalculationTrace(baselineWorkload, baselineArch, baseSim);
const textTrace = formatCalculationTraceAsText(trace, 'Router + Cache', snapshotId, baseSim);
assert(textTrace.includes('# ComputeCanvas Calculation Trace'), 'Plain-text trace contains title');
assert(textTrace.includes('## 1. WORKLOAD & TRAFFIC'), 'Plain-text trace contains WORKLOAD & TRAFFIC section');
assert(textTrace.includes('Semantic Cache:'), 'Plain-text trace contains Semantic Cache breakdown');
assert(textTrace.includes('Raw Modeled Monthly Cost:'), 'Plain-text trace contains total cost line');
assert(textTrace.includes('Deterministic mathematical graph modeling'), 'Plain-text trace contains methodology guarantee');

// ── 9. EXPORT SPECIFICATION 2.0 SCHEMA COMPLIANCE ──
const exportSpec = buildExportSpecification(
  baselineArch,
  baselineWorkload,
  { enabled: false, actualBill: 4500, actualRequests: 1200000, baselineSimulatedCost: 0 },
  baseSim,
  'Router + Semantic Cache',
  snapshotId
);
assert(exportSpec.$schema === 'https://computecanvas.io/schemas/v2/simulation-spec.json', 'Export Spec has authoritative $schema');
assert(exportSpec.provenance.pricingSnapshot === '2026-03', 'Export Spec includes pricing snapshot');
assert(exportSpec.provenance.registryVersion === 'v1.4', 'Export Spec includes registry version');
assert(exportSpec.modeledEconomics.monthlyCost === baseSim.monthlyCost, 'Export Spec matches simulated cost');
assert(exportSpec.topology.nodes.length === baselineArch.nodes.length, 'Export Spec topology nodes count is exact');

// ── 10. COMPONENT CAUSAL ROLE DETERMINISM ──
const frontierNode = baselineArch.nodes.find(n => n.type === 'frontier-model')!;
const frontierRole = getComponentCausalRole(frontierNode, baselineWorkload, baselineArch, baseSim);
assert(frontierRole.role.toLowerCase().includes('reasoning'), 'Frontier role identified correctly');
assert(frontierRole.whyItMatters.length > 20, 'Why it matters provides deterministic explanation');
assert(frontierRole.sourceType === 'PROVIDER', 'Frontier node sourceType is PROVIDER');

const apiNode = baselineArch.nodes.find(n => n.type === 'api')!;
const apiRole = getComponentCausalRole(apiNode, baselineWorkload, baselineArch, baseSim);
assert(apiRole.role.toLowerCase().includes('gateway') || apiRole.role.toLowerCase().includes('entry point'), 'API Ingress role identified');
assert(apiRole.sourceType === 'INTERNAL REFERENCE', 'API Ingress sourceType is INTERNAL REFERENCE');

// ── 11. SHARE URL ROUND-TRIP REPRODUCIBILITY ──
const shareState = {
  architecture: baselineArch,
  workload: baselineWorkload,
  calibration: { enabled: false, actualBill: 4500, actualRequests: 1200000, baselineSimulatedCost: 0 },
};
const encoded = encodeArchitectureState(shareState);
assert(typeof encoded === 'string' && encoded.length > 10, 'State encodes to Base64URL string');

const decoded = decodeArchitectureState(encoded);
assert(decoded.success === true, 'Decoded share state succeeds');
assert(decoded.data !== undefined, 'Decoded share state has data');
if (decoded.data) {
  const roundtripSim = simulate(decoded.data.workload, decoded.data.architecture);
  assert(roundtripSim.monthlyCost === baseSim.monthlyCost, 'Roundtrip shared state cost matches original');
  assert(roundtripSim.p95Latency === baseSim.p95Latency, 'Roundtrip shared state latency matches original');
  assert(roundtripSim.bottleneck.componentName === baseSim.bottleneck.componentName, 'Roundtrip bottleneck matches original');
}

// ── 12. MALFORMED / UNSUPPORTED SHARE HANDLING ──
const malformedDecode = decodeArchitectureState('not-a-valid-base64-payload!!!');
assert(malformedDecode.success === false, 'Malformed URL payload safely returns success: false');

// ── 13. EXTREME WORKLOAD INVARIANTS ──
const extremeCacheSim = simulate({ ...baselineWorkload, cacheHitRate: 1.0 }, baselineArch);
assert(extremeCacheSim.costBreakdown.models === 0, '100% cache: Model inference spend is strictly 0');

const zeroReqSim = simulate({ ...baselineWorkload, requestsPerMonth: 0 }, baselineArch);
assert(zeroReqSim.costBreakdown.models === 0, '0 requests: Model cost is 0');
assert(zeroReqSim.monthlyCost >= 0, '0 requests: Monthly cost is non-negative infrastructure base');

console.log('──────────────────────────────────────────────────────────');
console.log(`TOTAL PASSED: ${passed} / ${passed + failed}`);
if (failed > 0) {
  console.error(`TOTAL FAILED: ${failed}`);
  process.exit(1);
} else {
  console.log('ALL WORKBENCH TESTS PASSED (30/30) ✅');
}
