import { encodeArchitectureState, decodeArchitectureState } from '../lib/simulation/sharing';
import { simulate, TEMPLATES } from '../lib/simulation/engine';

console.log('──────────────────────────────────────────────────────────');
console.log('COMPUTECANVAS 3.0 — URL STATE SHARING & CORRUPTION TEST');
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
const initialArch = template.architecture;
const initialWorkload = template.defaultWorkload;
const initialCalibration = { enabled: false, actualBill: 3500, actualRequests: 1000000, baselineSimulatedCost: 3000 };

// 1. Encode
const encoded = encodeArchitectureState({
  architecture: initialArch,
  workload: initialWorkload,
  calibration: initialCalibration,
});

assert(typeof encoded === 'string' && encoded.length > 20, 'Encoding produces valid non-empty string');

// 2. Decode
const decoded = decodeArchitectureState(encoded);
assert(decoded.success === true, 'Decoding succeeds for valid payload');
assert(decoded.data?.architecture.nodes.length === initialArch.nodes.length, 'Decoded nodes length matches');
assert(decoded.data?.workload.requestsPerMonth === initialWorkload.requestsPerMonth, 'Decoded requests match');
assert(decoded.data?.pricingSnapshot === '2026-03', 'Decoded pricing snapshot is preserved (2026-03)');
assert(decoded.data?.registryVersion === 'v1.4', 'Decoded registry version is preserved (v1.4)');

// 3. Mathematical reproducibility
const simOriginal = simulate(initialWorkload, initialArch);
const simRestored = simulate(decoded.data!.workload, decoded.data!.architecture);
assert(
  simOriginal.monthlyCost === simRestored.monthlyCost,
  `Economics equivalence: original $${simOriginal.monthlyCost} === restored $${simRestored.monthlyCost}`
);
assert(
  simOriginal.p95Latency === simRestored.p95Latency,
  `Latency equivalence: original ${simOriginal.p95Latency}ms === restored ${simRestored.p95Latency}ms`
);

// 4. Corrupted payloads handling (Section 56)
const malformedGarbage = decodeArchitectureState('not-a-valid-base64-payload!!!');
assert(malformedGarbage.success === false, 'Garbage payload returns success: false without throwing');

const malformedJson = decodeArchitectureState('e30'); // base64url of "{}"
assert(malformedJson.success === false, 'Empty object schema returns success: false without throwing');

console.log('──────────────────────────────────────────────────────────');
console.log(`TOTAL SHARING TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log('──────────────────────────────────────────────────────────');

if (failed > 0) process.exit(1);
