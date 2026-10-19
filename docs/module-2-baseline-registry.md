# ComputeCanvas — Module 2 Phase 1: Baseline Registry Specification
## Registry Contracts, Baseline Identity & Invariant Verification

**Document Identifier:** `CC-M2-REG-SPEC-001`  
**Phase:** Phase 1 (Registry Foundation & Invariant Baseline)  
**Status:** IMPLEMENTED & VERIFIED  
**Engine Baseline:** Deterministic Decision Engine 4.0 (Frozen)  

---

## 1. Registry Architecture & Files Implemented

Module 2 Phase 1 establishes the strongly typed, validated, and immutable data foundation for ComputeCanvas without altering Engine 4.0's mathematical behavior.

### Created Files
- `lib/registry/types.ts`: Strongly typed domain contracts for models, pricing, infrastructure, assumptions, provenance, and snapshot metadata.
- `lib/registry/hasher.ts`: Deterministic JSON canonicalization (recursive key sorting), SHA-256 content hashing, and runtime `deepFreeze` immutability utility.
- `lib/registry/validator.ts`: Validation engine enforcing the 14 Inviolable Rules, distinguishing fatal publication blockers from non-fatal warnings.
- `lib/registry/snapshots/baseline.ts`: Compiled canonical baseline snapshot capturing the exact values of the 6 canonical models, 4 infrastructure components, and 16 operational assumptions.
- `lib/registry/index.ts`: Public API facade and strict snapshot resolver (`getSnapshot()`).
- `scripts/test-registry-v2.ts`: Dedicated 93-assertion test suite validating schemas, immutability, unit normalization, error rejection, and baseline equivalence.

---

## 2. Canonical Baseline Identity

The baseline snapshot is cryptographically identified by the SHA-256 hash of its canonicalized content payload (models, pricing, infrastructure, assumptions).

- **Canonical Content Hash:** Derived from `canonicalizeJson(payload)` using Node's standard `crypto.createHash('sha256')`.
- **Snapshot ID:** `snap-cc-` prefix + first 16 characters of content hash.
- **Canonical Label:** `2026-03-baseline`
- **Supported Legacy Aliases:** `['2026-03', 'March 2026', 'v1.4', 'baseline']`
- **Engine Version Target:** `4.0`
- **Model Registry Version:** `v1.4`
- **Runtime Immutability:** Recursively frozen via `Object.freeze()` and `deepFreeze()`. Attempted mutation is blocked.

---

## 3. Preserved Baseline Inventory

### A. Models (6 Canonical Models)
1. **`gpt-4o-mini` (OpenAI):** $0.15/1M input, $0.60/1M output, 128K context, 140ms P95 latency, 82 quality score.
2. **`gemini-2.0-flash` (Google):** $0.10/1M input, $0.40/1M output, 1M context, 90ms P95 latency, 80 quality score.
3. **`claude-3-haiku` (Anthropic):** $0.25/1M input, $1.25/1M output, 200K context, 120ms P95 latency, 78 quality score.
4. **`gpt-4o` (OpenAI):** $2.50/1M input, $10.00/1M output, 128K context, 380ms P95 latency, 95 quality score.
5. **`claude-3.5-sonnet` (Anthropic):** $3.00/1M input, $15.00/1M output, 200K context, 420ms P95 latency, 96 quality score.
6. **`gemini-2.5-pro` (Google):** $1.25/1M input, $10.00/1M output, 2M context, 350ms P95 latency, 94 quality score.

### B. Infrastructure Components (4 Tariffs)
1. **`vectorDb` (Pinecone / Qdrant):** $120.00 base cluster spend/month, $0.20 per 1M queries, $0.25 per GB storage, 45ms lookup latency.
2. **`cache` (Redis Cloud):** $65.00 base instance spend/month, $0.012 per GB-hour, 5ms lookup latency.
3. **`apiGateway` (API Ingress Gateway):** $1.00 per 1M requests, 12ms latency.
4. **`router` (AI Complexity Router):** $0.50 per 1M requests, 8ms latency.

### C. Operational Assumptions (16 Canonical Records)
Exact numerical match for all 16 assumptions defined in `ASSUMPTION_REGISTRY` in `lib/simulation/engine.ts`.

---

## 4. Invariant Pricing-Mode & Historical URL Policies

### Pricing-Mode Policy (Informational in Phase 1)
- `cachedInputPricePer1M`, `batchInputPricePer1M`, and `batchOutputPricePer1M` are defined as optional fields in `PricingRecordV2`.
- In Phase 1, these fields are purely informational metadata.
- **Engine 4.0 calculations do not apply cache discounts or batch discounts.** Standard on-demand formulas remain 100% frozen.

### Strict Historical Snapshot Resolution
- `getSnapshot(identifier)` resolves canonical IDs, full hashes, or registered aliases (`2026-03`).
- **Strict Fallback Prevention:** If an unknown identifier is provided (e.g. `unknown-2099`), `getSnapshot()` returns `undefined`.
- The engine will **never** silently substitute an unknown snapshot with current pricing. Any fallback in later phases must be an explicit, audible user choice.

---

## 5. Verification Gate Status

- **Existing Test Suites:** 259/259 tests passing (56 Engine 4.0 tests + 203 regression/fuzz tests).
- **Module 2 Registry Test Suite:** 93/93 tests passing (`scripts/test-registry-v2.ts`).
- **Total Test Suite across Repository:** 352/352 tests passing (100% pass rate).
- **TypeScript Compiler (`npx tsc --noEmit`):** 0 errors.
- **Production Build (`npm run build`):** Succeeded (19/19 static pages rendered).
