/**
 * ComputeCanvas — Module 2: Model & Pricing Intelligence Registry
 * Snapshot Catalog & Strict Resolver
 */

import { RegistrySnapshot } from './types';
import { BASELINE_SNAPSHOT } from './snapshots/baseline';
import { OCTOBER_2026_SNAPSHOT } from './snapshots/october2026';

const SNAPSHOT_CATALOG: Readonly<RegistrySnapshot>[] = [
  BASELINE_SNAPSHOT,
  OCTOBER_2026_SNAPSHOT,
];

/**
 * ── Snapshot Role Semantics ──
 *
 * 1. DEFAULT_SNAPSHOT / DEFAULT_SNAPSHOT_ID:
 *    The authoritative default for brand-new Workbench sessions (March 2026 Baseline).
 *    Intentionally pinned to the baseline to ensure all canonical blueprint templates
 *    (Direct LLM, RAG Pipeline, Router + Cache) operate with 100% active, non-deprecated
 *    model nodes and verified 0-variance math out of the box.
 *
 * 2. LATEST_SNAPSHOT / LATEST_SNAPSHOT_ID:
 *    The most recent released pricing snapshot in the catalog (October 2026 Release).
 *    Used when users explicitly select the latest pricing tier to inspect recent
 *    model deprecations, additions (e.g. Llama 3.3 70B), and market price movements.
 *
 * 3. LEGACY_COMPATIBILITY_SNAPSHOT_ID:
 *    The fallback target for legacy share payloads that omit a snapshot identifier.
 *    Points strictly to the March 2026 Baseline via the canonical '2026-03' alias.
 */
export const BASELINE_SNAPSHOT_ID: string = BASELINE_SNAPSHOT.metadata.snapshotId;
export const DEFAULT_SNAPSHOT: Readonly<RegistrySnapshot> = BASELINE_SNAPSHOT;
export const DEFAULT_SNAPSHOT_ID: string = BASELINE_SNAPSHOT.metadata.snapshotId;

export const LATEST_SNAPSHOT: Readonly<RegistrySnapshot> = OCTOBER_2026_SNAPSHOT;
export const LATEST_SNAPSHOT_ID: string = OCTOBER_2026_SNAPSHOT.metadata.snapshotId;

export const LEGACY_COMPATIBILITY_SNAPSHOT_ID: string = BASELINE_SNAPSHOT.metadata.snapshotId;

/**
 * Resolves a snapshot by canonical ID, content hash, or registered legacy alias.
 * 
 * IMPORTANT:
 * If an identifier is unknown, this function returns undefined.
 * It will NEVER silently resolve to current or default pricing.
 */
export function getSnapshot(identifierOrAlias: string): Readonly<RegistrySnapshot> | undefined {
  if (!identifierOrAlias || typeof identifierOrAlias !== 'string') {
    return undefined;
  }

  const query = identifierOrAlias.trim().toLowerCase();

  for (const snapshot of SNAPSHOT_CATALOG) {
    if (snapshot.metadata.snapshotId.toLowerCase() === query) {
      return snapshot;
    }
    if (snapshot.metadata.contentHash.toLowerCase() === query) {
      return snapshot;
    }
    if (snapshot.metadata.label.toLowerCase() === query) {
      return snapshot;
    }
    const matchedAlias = snapshot.metadata.aliases.some(alias => alias.toLowerCase() === query);
    if (matchedAlias) {
      return snapshot;
    }
  }

  return undefined;
}

/**
 * Returns all registered immutable snapshots.
 */
export function getAllSnapshots(): Readonly<RegistrySnapshot>[] {
  return [...SNAPSHOT_CATALOG];
}
