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
