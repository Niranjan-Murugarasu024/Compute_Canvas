# ComputeCanvas — Module 2, Phase 3-B: Versioned Snapshot UI Integration Report

**Date:** October 19, 2026  
**Module:** Module 2 — Model & Pricing Intelligence Registry  
**Phase:** Phase 3-B (Versioned Snapshot UI Integration)  
**Status:** Complete  
**Final Verdict:** `PASS`  

---

## 1. Executive Summary

Phase 3-B integrates the versioned model registry established in Phase 3-A into the ComputeCanvas workbench UI. The workbench now dynamically presents models based on the selected registry snapshot, preserves canonical snapshot identity in shareable URLs and local state, and distinctly handles invalid or discontinued models without presenting zero-cost estimates as valid calculated outcomes.

All 14 required Phase B.6 validation gates pass with zero regressions against frozen Engine 4.0 simulation semantics.

---

## 2. Architecture Inspection & Files Changed

### Files Inspected
1. `app/simulator/page.tsx` — Simulator entry point and Next.js server component handling `searchParams`.
2. `app/workbench/page.tsx` — Direct alias route forwarding to simulator.
3. `app/simulator/SimulatorClient.tsx` — Main interactive workbench client, telemetry strip, query sync, and state bindings.
4. `components/simulator/SpatialCanvas.tsx` — Spatial node graph canvas, contextual toolbar, and model switcher dropdowns.
5. `app/s/[id]/page.tsx` — Public shared architecture page and fork workflow.
6. `lib/state/architectureStore.ts` — Zustand store managing active architecture, workload, calibration, and snapshot selection.
7. `lib/simulation/sharing.ts` — Base64URL deterministic state serialization and deserialization.
8. `lib/registry/` — Registry catalog, snapshots (`baseline.ts`, `october2026.ts`), and engine adapter.

### Files Modified
| File Path | Description of Changes |
| :--- | :--- |
| [`lib/state/architectureStore.ts`](file:///e:/Winter_Seasons/computecanvas/lib/state/architectureStore.ts) | Added `pricingSnapshot: string` state and `setPricingSnapshot` action. Updated `loadArchitecture` and simulation calls to preserve and accept snapshot identifiers. |
| [`lib/simulation/sharing.ts`](file:///e:/Winter_Seasons/computecanvas/lib/simulation/sharing.ts) | Preserved snapshot identity in `encodeArchitectureState` and `decodeArchitectureState`. Maintained backward compatibility with `'2026-03'` default. |
| [`components/simulator/SpatialCanvas.tsx`](file:///e:/Winter_Seasons/computecanvas/components/simulator/SpatialCanvas.tsx) | Replaced hardcoded `MODEL_PRICING` fast/frontier lists with registry snapshot-derived options. Clearly labeled discontinued models with `[DISCONTINUED - Historical Only]` and disabled selection. Ensured alias `llama-3.3-70b-instruct` does not duplicate canonical `meta-llama/Llama-3.3-70B-Instruct-Turbo`. |
| [`app/simulator/SimulatorClient.tsx`](file:///e:/Winter_Seasons/computecanvas/app/simulator/SimulatorClient.tsx) | Added Registry Snapshot dropdown selector in header bar displaying human-readable labels and canonical IDs. Passed `pricingSnapshot` to authoritative `simulate()`. Enhanced telemetry strip and validation card to render distinct blocked state on invalid configuration. Replaced static `MODEL_PRICING` in inspection sidebar with active pricing bundle. |
| [`app/simulator/page.tsx`](file:///e:/Winter_Seasons/computecanvas/app/simulator/page.tsx) | Added support for `?snapshot=...` query parameter, forwarding `initialPricingSnapshot` to `SimulatorClient`. |
| [`app/s/[id]/page.tsx`](file:///e:/Winter_Seasons/computecanvas/app/s/%5Bid%5D/page.tsx) | Preserved snapshot identity in shared URLs, forwarded snapshot to `simulate()` and `loadArchitecture()`, and displayed snapshot badge and validation notice. |
| [`scripts/test-snapshot-ui.ts`](file:///e:/Winter_Seasons/computecanvas/scripts/test-snapshot-ui.ts) | Created dedicated 14-point test suite for Phase 3-B UI integration. |

---

## 3. Snapshot Selector Behavior (Phase B.2)

The top header bar now includes a canonical Registry Snapshot selector immediately adjacent to the Blueprint selector:

- **Options Available:**
  1. `March 2026 Baseline (snap-cc-3b3fbd4cbab4e979)`
  2. `October 2026 Snapshot (snap-cc-382481fe0de34aaf)`
- **Identity Preservation:** Options always display both human-readable labels and canonical snapshot IDs. Friendly labels are never substituted for canonical identifiers internally or in serializations.
- **State Transition Guarantees:**
  - Changing the selected snapshot updates `store.pricingSnapshot`.
  - User workload parameters (`requestsPerMonth`, `avgInputTokens`, `avgOutputTokens`, `cacheHitRate`) are 100% preserved.
  - User model selections are never silently replaced or mapped to fallbacks.
  - Switching to a snapshot where an existing model is discontinued (e.g., selecting October while using `gemini-2.0-flash`) triggers revalidation and flags the component for user correction.

---

## 4. Registry-Driven Dynamic Model Selection (Phase B.3)

Hardcoded references to static global model tables were removed from UI components:

1. **Snapshot-Derived Options:**
   - In `SpatialCanvas.tsx`, fast and frontier model options are derived directly from `activeSnapshot.models` via the registry adapter.
   - For October 2026:
     - Active models (`gpt-4o-mini`, `gpt-4o`, `deepseek-flash`, `meta-llama/Llama-3.3-70B-Instruct-Turbo`) are selectable.
     - Discontinued models (`gemini-2.0-flash`, `claude-3-haiku`, `claude-3.5-sonnet`, `deepseek-chat`) are displayed as disabled options with the clear label `[DISCONTINUED - Historical Only]`.
   - For March 2026:
     - Baseline models (`gpt-4o-mini`, `gemini-2.0-flash`, `claude-3-haiku`, `gpt-4o`, `claude-3.5-sonnet`, `gemini-2.5-pro`) are displayed as active and selectable.
2. **Alias Deduplication:**
   - `meta-llama/Llama-3.3-70B-Instruct-Turbo` has `legacyAlias: 'llama-3.3-70b-instruct'`.
   - Because model options iterate over `activeSnapshot.models` (where each model is canonically represented once), the alias `llama-3.3-70b-instruct` never appears as a duplicate dropdown option.
   - The canonical model ID is preserved internally on the node.
3. **Prevention of Silent Mapping:**
   - If an unlisted or legacy model ID is encountered, an explicit disabled option `[UNLISTED / INVALID]` is rendered so the browser native `<select>` cannot silently default to the first active model.

---

## 5. URL State Serialization & Sharing (Phase B.4)

Shareable URLs now faithfully preserve snapshot identity without state corruption:

- **Query Parameters:**
  - Standard sharing generates URLs containing `?data=<base64>&snapshot=<canonical_snapshot_id>`.
  - The payload inside `?data=...` also embeds `pricingSnapshot: <canonical_snapshot_id>`.
- **Query Synchronization:**
  - `SimulatorQuerySync` validates `?snapshot=...` using `getSnapshot()`.
  - If a valid snapshot ID is supplied, it synchronizes the workbench state to that snapshot.
  - If the snapshot parameter is absent, it loads the established default baseline snapshot.
  - If an unknown or invalid snapshot ID is passed (e.g., `?snapshot=unknown-snap-99`), it renders a recoverable error notice and safely falls back to `snap-cc-3b3fbd4cbab4e979`. It never silently interprets an unknown ID as a different historical snapshot.
- **Reconstruction:** Reloading a shared URL restores the exact snapshot, topology, workload, and calibration state.

---

## 6. Invalid-Configuration UI Behavior (Phase B.5)

A rejected architecture never looks like a successful zero-cost simulation:

- **When Registry Validation Fails:**
  - **Prominent Banner:** Renders an `Architecture Validation Blocked` card displaying:
    - Clear title: `SIMULATION BLOCKED — INVALID ARCHITECTURE CONFIGURATION`.
    - Specific error diagnostics listing the affected node, model ID, and lifecycle status (e.g., `Model "gemini-2.0-flash" on component "Fast Model" is DISCONTINUED in snapshot "October 2026 Snapshot"`).
    - Actionable remediation path: guidance to change model in canvas, plus a one-click button: `Switch to Baseline (snap-cc-3b3fbd4cbab4e979)`.
  - **Engineering Telemetry Strip:**
    - Monthly Cost: Displays `INVALID CONFIG` in bold red (instead of `$0.00 / mo`), subtext `Estimates withheld · Non-active or unrecognized model`.
    - Tail Latency: Displays `BLOCKED` (instead of `0ms`), subtext `Calculations withheld for rejected architecture`.
    - Bottleneck: Displays `VALIDATION BLOCKED`, subtext `Resolve model lifecycle errors`.
    - Capability / Snapshot: Displays `BLOCKED`, subtext `Action required to resume simulation`.
  - **Right Sidebar Properties:** Shows properties inspector with warning state and suppresses zero-cost readouts.
- **When Validation Succeeds:**
  - Existing simulation metrics and calculation traces display normally with exact precision.
  - Telemetry strip displays the active snapshot label and canonical snapshot ID badge.

---

## 7. Test Verification & Actual Observed Results

All test suites were executed and passed with exit code 0:

### 1. Phase B.6 Dedicated UI Suite (`scripts/test-snapshot-ui.ts`)
```
─────────────────────────────────────────────────────────────
ComputeCanvas — Phase 3-B UI Snapshot Integration Test Suite
─────────────────────────────────────────────────────────────

  [PASS] 1. Default snapshot behavior resolves to March 2026 baseline (snap-cc-3b3fbd4cbab4e979)
  [PASS] 2. Selecting March loads baseline model options through registry adapter
  [PASS] 3. Selecting October loads October model options with active and discontinued models
  [PASS] 4. Discontinued October models produce validation errors and blocked simulation results
  [PASS] 5. Switching snapshots preserves current architecture and model selections without substitution
  [PASS] 6. Llama canonical ID meta-llama/Llama-3.3-70B-Instruct-Turbo is unique and legacy alias is not a separate selectable model
  [PASS] 7. Valid canonical snapshot ID survives URL serialization and parsing
  [PASS] 8. Unknown snapshot IDs are handled safely with non-fatal recovery
  [PASS] 9. Reloading a shared URL restores the exact canonical snapshot selection and state
  [PASS] 10. Validation failures are distinguishable with isValid=false and non-empty error list
  [PASS] 11. Active-model simulations in October snapshot produce valid, positive results
  [PASS] 12. Existing workload settings survive snapshot changes
  [PASS] 13. March baseline simulation outputs remain numerically identical to frozen Engine 4.0 baseline
  [PASS] 14. Verified snapshot registry hashes match immutable pins

─────────────────────────────────────────────────────────────
Results: 14 passed, 0 failed
─────────────────────────────────────────────────────────────
Phase 3-B UI Snapshot Integration Test Suite: ALL 14 GATES PASSED.
```

### 2. Multi-Snapshot Registry Suite (`scripts/test-multi-snapshot.ts`)
- **Result:** `TOTAL MULTI-SNAPSHOT TESTS: 240 | PASSED: 240 | FAILED: 0` (Exit code 0).

### 3. Registry V2 Core Suite (`scripts/test-registry-v2.ts`)
- **Result:** `TOTAL REGISTRY V2 TESTS: 127 | PASSED: 127 | FAILED: 0` (Exit code 0).

### 4. SHA-256 Vector & Canonicalization Suite (`scripts/test-sha256-vectors.ts`)
- **Result:** All NIST vectors, differential verification, key reordering, and mutation sensitivity checks passed (Exit code 0).

### 5. Baseline Differential Invariance Suite (`scripts/test-baseline-differential.ts`)
- **Result:** Exact 0.000000000 variance detected across all blueprints and model isolations (Exit code 0).

### 6. Standard Unit & Integration Test Suite (`npm test`)
- **Result:** All 70 regression, graph conservation, calibration, sharing, and fuzz tests passed (Exit code 0).

### 7. Comprehensive Project Test Suite (`npm run test:all`)
- **Result:** All tests across workbench, invariants, sharing, typography, waitlist API passed (Exit code 0).

### 8. TypeScript Type Checking (`npx tsc --noEmit`)
- **Result:** Clean compilation with 0 errors (Exit code 0).

### 9. Next.js Production Build (`npm run build`)
- **Result:** 19/19 pages compiled and generated successfully with Turbopack (Exit code 0).

### 10. Git Cleanliness & Whitespace (`git diff --check`)
- **Result:** Clean, zero conflict markers or whitespace errors (Exit code 0).

---

## 8. Remaining Limitations

1. **Read-Only Historical Snapshots:** The October 2026 and March 2026 snapshots are immutable static registries. Dynamic creation of user-customized pricing snapshots is not supported in Phase 3-B and is reserved for future schema iterations.
2. **Offline Local Pricing:** Provider pricing values are deterministic snapshot records; real-time provider billing API sync is intentionally out of scope per non-negotiable constraints.

---

## 9. Final Verdict

**Verdict:** `PASS`

All requirements for **Module 2, Phase 3-B: Versioned Snapshot UI Integration** have been implemented, verified, and audited against the active repository state. Engine 4.0 mathematical invariants and cryptographic snapshot content hashes remain 100% frozen and intact.
