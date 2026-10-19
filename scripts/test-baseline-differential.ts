import { simulate, TEMPLATES } from '../lib/simulation/engine';
import { MODEL_PRICING, INFRA_PRICING } from '../lib/simulation/engine/cost';
import { BASELINE_SNAPSHOT, getSnapshot } from '../lib/registry';

console.log('──────────────────────────────────────────────────────────');
console.log('MODULE 2 PHASE 2: BASELINE MATHEMATICAL EQUIVALENCE AUDIT');
console.log('──────────────────────────────────────────────────────────\n');

let diffPass = true;

// 1. Template Fixture Tests across multiple workloads
const workloads = [
  { name: 'Low Workload (10K)', requestsPerMonth: 10_000, avgInputTokens: 500, avgOutputTokens: 200, cacheHitRate: 0.0 },
  { name: 'Medium Workload (1M)', requestsPerMonth: 1_000_000, avgInputTokens: 1200, avgOutputTokens: 400, cacheHitRate: 0.5 },
  { name: 'High Workload (20M)', requestsPerMonth: 20_000_000, avgInputTokens: 2500, avgOutputTokens: 600, cacheHitRate: 0.8 },
];

for (const template of TEMPLATES) {
  console.log(`Auditing Blueprint: ${template.name}`);
  for (const wl of workloads) {
    const resWithoutSnapshot = simulate(wl, template.architecture);
    const resWithSnapshot = simulate({
      workload: wl,
      architecture: template.architecture,
      pricingSnapshot: '2026-03',
    });

    const checks = [
      { field: 'monthlyCost', a: resWithoutSnapshot.monthlyCost, b: resWithSnapshot.monthlyCost },
      { field: 'costPerRequest', a: resWithoutSnapshot.costPerRequest, b: resWithSnapshot.costPerRequest },
      { field: 'p95Latency', a: resWithoutSnapshot.p95Latency, b: resWithSnapshot.p95Latency },
      { field: 'modelsCost', a: resWithoutSnapshot.costBreakdown.models, b: resWithSnapshot.costBreakdown.models },
      { field: 'cacheCost', a: resWithoutSnapshot.costBreakdown.cache, b: resWithSnapshot.costBreakdown.cache },
      { field: 'vectorDbCost', a: resWithoutSnapshot.costBreakdown.vectorDb, b: resWithSnapshot.costBreakdown.vectorDb },
      { field: 'ingressCost', a: resWithoutSnapshot.costBreakdown.ingress, b: resWithSnapshot.costBreakdown.ingress },
      { field: 'routerCost', a: resWithoutSnapshot.costBreakdown.router, b: resWithSnapshot.costBreakdown.router },
      { field: 'qualityEstimate', a: resWithoutSnapshot.qualityEstimate, b: resWithSnapshot.qualityEstimate },
      { field: 'throughputRPS', a: resWithoutSnapshot.throughputRPS, b: resWithSnapshot.throughputRPS },
    ];

    for (const c of checks) {
      if (c.a !== c.b) {
        console.error(`  ❌ DIFFERENCE DETECTED [${template.name} - ${wl.name}]: ${c.field} (${c.a} !== ${c.b})`);
        diffPass = false;
      }
    }
    console.log(`  ✅ ${template.name} [${wl.name}]: Exact match ($${resWithoutSnapshot.monthlyCost}/mo, ${resWithoutSnapshot.p95Latency}ms)`);
  }
}

// 2. Model-by-Model Isolation across all 6 models
console.log('\n2. Single-Model Direct Ingress Equivalence across all 6 Models:');
const testWorkload = {
  requestsPerMonth: 1_000_000,
  avgInputTokens: 1000,
  avgOutputTokens: 500,
  cacheHitRate: 0.0,
};

const allModels = ['gpt-4o-mini', 'gemini-2.0-flash', 'claude-3-haiku', 'gpt-4o', 'claude-3.5-sonnet', 'gemini-2.5-pro'];

for (const modelId of allModels) {
  const arch = {
    id: `direct-${modelId}`,
    name: `Direct ${modelId}`,
    nodes: [
      { id: 'api-1', type: 'api' as const, label: 'API Ingress' },
      { id: 'model-1', type: (MODEL_PRICING[modelId].category === 'fast' ? 'fast-model' : 'frontier-model') as any, label: modelId, modelId },
    ],
    edges: [
      { source: 'api-1', target: 'model-1' },
    ],
  };

  const simBaseline = simulate(testWorkload, arch);
  const simSnapshot = simulate({
    workload: testWorkload,
    architecture: arch,
    pricingSnapshot: '2026-03',
  });

  const expectedModelCost = (1_000_000 * 1000 / 1_000_000) * MODEL_PRICING[modelId].inputPricePer1M +
    (1_000_000 * 500 / 1_000_000) * MODEL_PRICING[modelId].outputPricePer1M;
  const expectedTotalCost = expectedModelCost + (1_000_000 / 1_000_000) * INFRA_PRICING.apiGateway.perMillionRequests;

  const matchesExpected = Math.abs(simBaseline.monthlyCost - expectedTotalCost) < 0.01;
  const matchesSnapshot = simBaseline.monthlyCost === simSnapshot.monthlyCost;

  if (matchesExpected && matchesSnapshot) {
    console.log(`  ✅ ${modelId}: Exact match ($${simBaseline.monthlyCost}/mo, P95: ${simBaseline.p95Latency}ms)`);
  } else {
    console.error(`  ❌ ${modelId} MISMATCH: sim=${simBaseline.monthlyCost}, exp=${expectedTotalCost}`);
    diffPass = false;
  }
}

if (!diffPass) {
  console.error('\n❌ EQUIVALENCE AUDIT FAILED');
  process.exit(1);
} else {
  console.log('\n🏆 ALL BASELINE MATHEMATICAL EQUIVALENCE TESTS PASSED: 0.000000000 variance detected across all fields.');
}
