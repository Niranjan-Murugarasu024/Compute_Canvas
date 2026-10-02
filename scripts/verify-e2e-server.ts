import http from 'http';

function fetchPage(path: string): Promise<{ status: number; html: string }> {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode || 0, html: data }));
    }).on('error', reject);
  });
}

async function run() {
  console.log('──────────────────────────────────────────────────────────');
  console.log('COMPUTECANVAS 3.0 — END-TO-END HTTP & DOM VALIDATION');
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

  // 1. Homepage (/)
  const home = await fetchPage('/');
  assert(home.status === 200, 'Homepage (/) returns HTTP 200');
  assert(!home.html.includes('01 ARCHITECTURE'), 'Homepage excludes "01 ARCHITECTURE"');
  assert(!home.html.includes('02 ECONOMICS'), 'Homepage excludes "02 ECONOMICS"');
  assert(!home.html.includes('03 SCALE'), 'Homepage excludes "03 SCALE"');
  assert(!home.html.includes('04 TRADEOFFS'), 'Homepage excludes "04 TRADEOFFS"');
  assert(!home.html.includes('05 METHODOLOGY'), 'Homepage excludes "05 METHODOLOGY"');
  assert(!home.html.includes('06 BLUEPRINTS'), 'Homepage excludes "06 BLUEPRINTS"');
  assert(!home.html.includes('LIVE SYSTEM'), 'Homepage excludes deprecated "LIVE SYSTEM"');
  assert(home.html.includes('MODELED ARCHITECTURE'), 'Homepage includes "MODELED ARCHITECTURE"');
  assert(home.html.includes('MODELED MONTHLY COST'), 'Homepage includes "MODELED MONTHLY COST"');
  assert(home.html.includes('MODELED TAIL LATENCY'), 'Homepage includes "MODELED TAIL LATENCY"');
  assert(home.html.includes('MODELED SAVINGS VS BASELINE'), 'Homepage includes "MODELED SAVINGS VS BASELINE"');
  assert(home.html.includes('COST SHARE'), 'Homepage includes "COST SHARE"');
  assert(!home.html.includes('LIVE SIMULATION'), 'Homepage excludes deprecated "LIVE SIMULATION"');
  assert(!home.html.includes('LIVE ECONOMICS'), 'Homepage excludes deprecated "LIVE ECONOMICS"');

  // 2. Workbench (/simulator)
  const sim = await fetchPage('/simulator');
  assert(sim.status === 200, 'Workbench (/simulator) returns HTTP 200');
  assert(sim.html.includes('MODELED MONTHLY COST'), 'Workbench includes "MODELED MONTHLY COST" telemetry');
  assert(sim.html.includes('MODELED TAIL LATENCY'), 'Workbench includes "MODELED TAIL LATENCY" telemetry');
  assert(sim.html.includes('WHY DID THIS CHANGE?'), 'Workbench includes "WHY DID THIS CHANGE?" panel');
  assert(sim.html.includes('CALCULATION TRACE'), 'Workbench includes "CALCULATION TRACE"');
  assert(sim.html.includes('PROPERTIES INSPECTOR'), 'Workbench includes "PROPERTIES INSPECTOR"');
  assert(sim.html.includes('COST SHARE'), 'Workbench includes "COST SHARE"');
  assert(!sim.html.includes('TOTAL MONTHLY SPEND'), 'Workbench excludes deprecated "TOTAL MONTHLY SPEND"');

  // 3. Blueprints (/templates)
  const templates = await fetchPage('/templates');
  assert(templates.status === 200, 'Blueprints (/templates) returns HTTP 200');
  assert(!templates.html.includes('06 / BLUEPRINTS'), 'Blueprints excludes "06 / BLUEPRINTS" section number');
  assert(templates.html.includes('BASELINE'), 'Blueprints includes "BASELINE" taxonomy');
  assert(templates.html.includes('RETRIEVAL'), 'Blueprints includes "RETRIEVAL" taxonomy');
  assert(templates.html.includes('ROUTING'), 'Blueprints includes "ROUTING" taxonomy');
  assert(templates.html.includes('MODELED MONTHLY COST'), 'Blueprints includes "MODELED MONTHLY COST"');
  assert(templates.html.includes('MODELED TAIL LATENCY'), 'Blueprints includes "MODELED TAIL LATENCY"');
  assert(templates.html.includes('REFERENCE WORKLOAD'), 'Blueprints includes "REFERENCE WORKLOAD" configuration');

  // 4. Models & Assumptions (/assumptions)
  const assumptions = await fetchPage('/assumptions');
  assert(assumptions.status === 200, 'Models (/assumptions) returns HTTP 200');
  assert(assumptions.html.includes('Model Assumption Registry'), 'Assumptions includes "Model Assumption Registry"');
  assert(assumptions.html.includes('16 MODEL ASSUMPTIONS'), 'Assumptions includes "16 MODEL ASSUMPTIONS"');
  assert(assumptions.html.includes('PRICING SNAPSHOT: MARCH 2026'), 'Assumptions includes "PRICING SNAPSHOT: MARCH 2026"');
  assert(assumptions.html.includes('NOT LIVE PROVIDER PRICING'), 'Assumptions includes "NOT LIVE PROVIDER PRICING"');
  assert(assumptions.html.includes('Source Type'), 'Assumptions table has "Source Type"');
  assert(!assumptions.html.includes('VERIFIED ASSUMPTIONS'), 'Assumptions excludes deprecated "VERIFIED ASSUMPTIONS"');

  // 5. Methodology & Documentation (/docs)
  const docs = await fetchPage('/docs');
  assert(docs.status === 200, 'Docs (/docs) returns HTTP 200');
  assert(!docs.html.includes('05 / METHODOLOGY'), 'Docs excludes "05 / METHODOLOGY"');
  assert(docs.html.includes('deterministic simulation methodology'), 'Docs includes "deterministic simulation methodology"');
  assert(!docs.html.includes('stochastic hallucinations'), 'Docs excludes "without stochastic hallucinations"');
  assert(!docs.html.includes('[SYSTEM_DOCUMENTATION]'), 'Docs excludes label fatigue "[SYSTEM_DOCUMENTATION]"');

  console.log('──────────────────────────────────────────────────────────');
  console.log(`TOTAL E2E TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('──────────────────────────────────────────────────────────');

  if (failed > 0) process.exit(1);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
