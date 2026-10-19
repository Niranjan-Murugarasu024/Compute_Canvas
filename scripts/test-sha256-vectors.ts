import { sha256, computeContentHash, canonicalizeJson } from '../lib/registry/hasher';
import { createHash } from 'crypto';

console.log('──────────────────────────────────────────────────────────');
console.log('SHA-256 & CANONICAL SERIALIZATION INDEPENDENT AUDIT');
console.log('──────────────────────────────────────────────────────────\n');

// 1. Official NIST / FIPS 180-4 Test Vectors
console.log('1. Official NIST / FIPS 180-4 Standard Vectors:');

const nistVectors = [
  {
    name: 'Empty string ("")',
    input: '',
    expected: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  },
  {
    name: 'Single block ("abc")',
    input: 'abc',
    expected: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
  },
  {
    name: 'Multi-block (448 bits, 56 bytes)',
    input: 'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq',
    expected: '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1',
  },
];

let allPass = true;

for (const vec of nistVectors) {
  const actual = sha256(vec.input);
  const nodeActual = createHash('sha256').update(vec.input, 'utf8').digest('hex');
  const matchExpected = actual === vec.expected;
  const matchNode = actual === nodeActual;

  if (matchExpected && matchNode) {
    console.log(`  ✅ NIST PASS [${vec.name}]: ${actual.slice(0, 20)}...`);
  } else {
    console.error(`  ❌ NIST FAIL [${vec.name}]:`);
    console.error(`     Actual:   ${actual}`);
    console.error(`     Expected: ${vec.expected}`);
    allPass = false;
  }
}

// 2. Differential Testing against Node crypto for complex cases
console.log('\n2. Differential Verification vs Node.js crypto:');

const differentialInputs = [
  'ComputeCanvas Decision Engine 4.0',
  'Unicode test: €uro, £pound, ¥en, 中文, 🚀 rocket',
  'Boundary 55 bytes: ' + 'x'.repeat(55 - 19),
  'Boundary 56 bytes: ' + 'x'.repeat(56 - 19),
  'Boundary 64 bytes: ' + 'x'.repeat(64 - 19),
  'Large block 1,000 bytes: ' + 'A'.repeat(1000),
  'Large block 10,000 bytes: ' + 'B'.repeat(10000),
];

for (const input of differentialInputs) {
  const actual = sha256(input);
  const expected = createHash('sha256').update(input, 'utf8').digest('hex');
  if (actual === expected) {
    console.log(`  ✅ Differential PASS (len ${input.length.toString().padStart(5, ' ')}): ${actual.slice(0, 16)}...`);
  } else {
    console.error(`  ❌ Differential FAIL (len ${input.length}):`);
    console.error(`     Pure: ${actual}`);
    console.error(`     Node: ${expected}`);
    allPass = false;
  }
}

// 3. Canonical JSON Key Order Independence
console.log('\n3. Canonical JSON Key Reordering Stability:');
const obj1 = { z: 1, a: 2, m: { y: 'b', x: 'a' }, arr: [{ b: 2, a: 1 }] };
const obj2 = { a: 2, arr: [{ a: 1, b: 2 }], m: { x: 'a', y: 'b' }, z: 1 };
const hashObj1 = computeContentHash(obj1);
const hashObj2 = computeContentHash(obj2);

if (hashObj1 === hashObj2) {
  console.log(`  ✅ Key Reordering PASS: identical hash ${hashObj1.slice(0, 20)}...`);
} else {
  console.error(`  ❌ Key Reordering FAIL: ${hashObj1} !== ${hashObj2}`);
  allPass = false;
}

// 4. Array Order Preservation (Arrays must NOT be sorted arbitrarily)
console.log('\n4. Array Order Sensitivity (Preservation of sequence):');
const arrA = { items: [1, 2, 3] };
const arrB = { items: [3, 2, 1] };
const hashArrA = computeContentHash(arrA);
const hashArrB = computeContentHash(arrB);

if (hashArrA !== hashArrB) {
  console.log(`  ✅ Array Order Sensitivity PASS: sequence difference detected`);
} else {
  console.error(`  ❌ Array Order FAIL: arrays unexpectedly produced identical hashes`);
  allPass = false;
}

// 5. Semantic Modification Sensitivity
console.log('\n5. Semantic Change Sensitivity:');
const baseObj = { model: 'gpt-4o', price: 2.50 };
const modifiedObj = { model: 'gpt-4o', price: 2.51 };
if (computeContentHash(baseObj) !== computeContentHash(modifiedObj)) {
  console.log(`  ✅ Semantic Mutation Sensitivity PASS: $2.50 vs $2.51 produced distinct hashes`);
} else {
  console.error(`  ❌ Semantic Mutation FAIL: price change produced identical hash`);
  allPass = false;
}

if (!allPass) {
  console.error('\n❌ AUDIT FAILED: Cryptographic verification errors detected.');
  process.exit(1);
} else {
  console.log('\n🏆 AUDIT PASSED: SHA-256 and Canonical Serialization verified with 100% standards compliance.');
}
