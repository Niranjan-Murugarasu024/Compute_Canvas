import { simulate, type Workload, type Architecture, TEMPLATES } from '../lib/simulation/engine';

console.log('──────────────────────────────────────────────────────────');
console.log('COMPUTECANVAS 3.0 — MATHEMATICAL INVARIANT TEST SUITE');
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

const routerCacheTemplate = TEMPLATES.find(t => t.id === 'router-cache')!;
const baseWorkload = { ...routerCacheTemplate.defaultWorkload };
const baseArch = { ...routerCacheTemplate.architecture };

// 1. Cache hit rate increase invariant
const simCache60 = simulate({ ...baseWorkload, cacheHitRate: 0.60 }, baseArch);
const simCache80 = simulate({ ...baseWorkload, cacheHitRate: 0.80 }, baseArch);
assert(
  simCache80.costBreakdown.models < simCache60.costBreakdown.models,
  'Cache increase (60% -> 80%): Model cost strictly decreases'
);
assert(
  simCache80.monthlyCost < simCache60.monthlyCost,
  'Cache increase (60% -> 80%): Total monthly cost strictly decreases'
);

// 2. Cache extremes invariant
const simCache0 = simulate({ ...baseWorkload, cacheHitRate: 0.0 }, baseArch);
const simCache100 = simulate({ ...baseWorkload, cacheHitRate: 1.0 }, baseArch);
assert(
  simCache100.costBreakdown.models === 0,
  '100% cache: Model inference spend is strictly $0'
);
assert(
  simCache0.costBreakdown.models > simCache60.costBreakdown.models,
  '0% cache: Model inference cost is maximum'
);

// 3. Zero traffic invariant
const simZero = simulate({ ...baseWorkload, requestsPerMonth: 0 }, baseArch);
assert(
  simZero.costBreakdown.models === 0 && simZero.costBreakdown.ingress === 0,
  'Zero traffic: Variable costs are strictly $0'
);
assert(
  simZero.monthlyCost >= 0,
  'Zero traffic: Total monthly cost is finite and non-negative'
);

// 4. Scaling invariant (2x traffic volume)
const sim1M = simulate({ ...baseWorkload, requestsPerMonth: 1_000_000, cacheHitRate: 0 }, baseArch);
const sim2M = simulate({ ...baseWorkload, requestsPerMonth: 2_000_000, cacheHitRate: 0 }, baseArch);
const ratio = sim2M.costBreakdown.models / sim1M.costBreakdown.models;
assert(
  Math.abs(ratio - 2.0) < 0.01,
  `Scaling: Request volume 2x yields ~2.00x variable model cost (actual: ${ratio.toFixed(4)}x)`
);

// 5. Routing extremes invariant
const fastOnlyArch: Architecture = {
  ...baseArch,
  edges: baseArch.edges.map(e => {
    if (e.target.includes('fast')) return { ...e, trafficShare: 1.0 };
    if (e.target.includes('frontier')) return { ...e, trafficShare: 0.0 };
    return e;
  }),
};
const frontierOnlyArch: Architecture = {
  ...baseArch,
  edges: baseArch.edges.map(e => {
    if (e.target.includes('fast')) return { ...e, trafficShare: 0.0 };
    if (e.target.includes('frontier')) return { ...e, trafficShare: 1.0 };
    return e;
  }),
};

const simFastOnly = simulate(baseWorkload, fastOnlyArch);
const simFrontierOnly = simulate(baseWorkload, frontierOnlyArch);

const fastNodeMetrics = simFastOnly.nodeMetrics.get('frontier-model');
const frontierNodeMetrics = simFrontierOnly.nodeMetrics.get('fast-model');

assert(
  !fastNodeMetrics || fastNodeMetrics.monthlyCost === 0,
  '100% Fast routing: Frontier model incurs $0 spend'
);
assert(
  !frontierNodeMetrics || frontierNodeMetrics.monthlyCost === 0,
  '100% Frontier routing: Fast model incurs $0 spend'
);

// 6. Trace & Delta determinism invariant
assert(
  simCache60.calculationTrace !== undefined,
  'Simulation result attaches CalculationTrace'
);
assert(
  simCache60.calculationTrace?.totalCost === simCache60.monthlyCost,
  'CalculationTrace totalCost exactly matches simulation monthlyCost'
);

console.log('──────────────────────────────────────────────────────────');
console.log(`TOTAL INVARIANTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log('──────────────────────────────────────────────────────────');

if (failed > 0) process.exit(1);
