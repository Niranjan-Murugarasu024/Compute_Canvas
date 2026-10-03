/* ──────────────────────────────────────────────
   COMPUTECANVAS — DETERMINISTIC DECISION ENGINE 4.0
   Deterministic Provenance & Identity
   ────────────────────────────────────────────── */

import {
  ENGINE_VERSION,
  ENGINE_SPECIFICATION,
  MODEL_REGISTRY_VERSION,
  PRICING_SNAPSHOT,
  ASSUMPTION_VERSION,
} from './version';
import { type EngineProvenance } from './types';

/**
 * Returns canonical execution provenance without non-deterministic timestamps.
 * Two identical runs with the same input produce mathematically identical provenance.
 */
export function getEngineProvenance(overrides?: Partial<EngineProvenance>): EngineProvenance {
  return {
    engineVersion: overrides?.engineVersion || ENGINE_VERSION,
    engineSpecification: overrides?.engineSpecification || ENGINE_SPECIFICATION,
    pricingSnapshot: overrides?.pricingSnapshot || PRICING_SNAPSHOT,
    modelRegistryVersion: overrides?.modelRegistryVersion || MODEL_REGISTRY_VERSION,
    assumptionVersion: overrides?.assumptionVersion || ASSUMPTION_VERSION,
    methodology: overrides?.methodology || 'Deterministic mathematical graph modeling (No stochastic sampling)',
  };
}

/**
 * Deterministically constructs a canonical snapshot identity string:
 * Format: CC-[BLUEPRINT]-[SNAPSHOT]-[ENGINE]-[REGISTRY]
 */
export function generateEngineSnapshotId(
  blueprintName: string,
  pricingSnapshot = PRICING_SNAPSHOT,
  engineVersion = ENGINE_VERSION,
  registryVersion = MODEL_REGISTRY_VERSION
): string {
  const cleanBlueprint = blueprintName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 16) || 'CUSTOM';

  const cleanPricing = pricingSnapshot.toUpperCase().replace(/[^A-Z0-9]/g, '-');
  const cleanEngine = engineVersion.toUpperCase().replace(/[^A-Z0-9]/g, '-');
  const cleanRegistry = registryVersion.toUpperCase().replace(/[^A-Z0-9]/g, '-');

  return `CC-${cleanBlueprint}-${cleanPricing}-V${cleanEngine}-${cleanRegistry}`;
}
