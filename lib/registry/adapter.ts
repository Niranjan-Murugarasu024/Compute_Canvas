/**
 * ComputeCanvas — Module 2: Model & Pricing Intelligence Registry
 * Engine Registry Adapter (Phase 2)
 * 
 * Provides a narrow, deterministic boundary bridging the immutable Registry
 * snapshots with Engine 4.0 computational components.
 * 
 * Guarantees:
 * - Mathematical invariance: exact 1:1 numerical mapping for all baseline records
 * - Zero mutable globals
 * - Zero network requests during simulation
 * - Zero React, Zustand, or browser API dependencies
 * - Strict unknown snapshot rejection (no silent fallback)
 * - Strict unknown model rejection (no silent fallback to arbitrary models)
 * - Full backward compatibility for simulate(workload, architecture)
 */

import {
  type PricingRecord,
  type ModelAssumption,
  type Architecture,
} from '../simulation/engine/types';
import { type RegistrySnapshot } from './types';
import { BASELINE_SNAPSHOT } from './snapshots/baseline';
import { getSnapshot } from './catalog';

export interface EngineInfraPricing {
  vectorDb: {
    baseMonthlyCost: number;
    perMillionQueries: number;
    perGBStorage: number;
    lookupLatencyMs: number;
    provider: string;
    unit: string;
    notes: string;
  };
  cache: {
    baseMonthlyCost: number;
    perGBHour: number;
    lookupLatencyMs: number;
    provider: string;
    unit: string;
    notes: string;
  };
  apiGateway: {
    perMillionRequests: number;
    latencyMs: number;
    provider: string;
    unit: string;
    notes: string;
  };
  router: {
    perMillionRequests: number;
    latencyMs: number;
    provider: string;
    unit: string;
    notes: string;
  };
}

export interface EnginePricingBundle {
  snapshotId: string;
  label: string;
  engineVersion: string;
  modelRegistryVersion: string;
  pricingSnapshot: string;
  models: Record<string, PricingRecord>;
  infra: EngineInfraPricing;
  assumptions: ModelAssumption[];
  isBaseline: boolean;
}

export type SnapshotResolutionResult =
  | { ok: true; bundle: EnginePricingBundle }
  | { ok: false; error: 'UNKNOWN_SNAPSHOT'; message: string; requestedId: string };

export class UnknownSnapshotError extends Error {
  constructor(public readonly requestedSnapshotId: string) {
    super(
      `Unknown pricing snapshot identifier "${requestedSnapshotId}". Silent fallback to other snapshots is blocked to prevent untracked cost variance.`
    );
    this.name = 'UnknownSnapshotError';
  }
}

export class UnpricedModelError extends Error {
  constructor(
    public readonly modelId: string,
    public readonly nodeId: string,
    public readonly snapshotId: string
  ) {
    super(
      `Unpriced or unrecognized model ID "${modelId}" on node "${nodeId}" in snapshot "${snapshotId}". Silent fallback to another model is blocked.`
    );
    this.name = 'UnpricedModelError';
  }
}

/**
 * Maps an immutable RegistrySnapshot into an Engine 4.0 pricing bundle.
 */
function mapSnapshotToBundle(snapshot: Readonly<RegistrySnapshot>): EnginePricingBundle {
  const modelsMap: Record<string, PricingRecord> = {};

  const pricingLookup = new Map(snapshot.pricing.map(p => [p.resourceId, p]));

  for (const model of snapshot.models) {
    const pricing = pricingLookup.get(model.id);
    if (!pricing) continue;

    modelsMap[model.id] = Object.freeze({
      provider: model.provider,
      product: model.product,
      category: model.category,
      inputPricePer1M: pricing.inputPricePer1M,
      outputPricePer1M: pricing.outputPricePer1M,
      baselineLatencyMs: model.baselineLatencyMs,
      contextWindowTokens: model.contextWindowTokens,
      capabilityTier: model.capabilityTier,
      capabilityDescription: model.capabilityDescription,
      sourceType: 'PROVIDER',
      pricingSnapshot: 'March 2026',
      registryVersion: snapshot.metadata.modelRegistryVersion,
      status: model.status,
      qualityScore: model.qualityScore,
      qualityBenchmark: model.qualityBenchmark,
      qualitySource: model.qualitySource,
      source: model.source,
      unit: pricing.billingUnit,
      notes: model.notes,
      benchmarkDate: 'March 2026',
      assumptions: model.assumptions || `${model.product} input rate.`,
    });
  }

  // Register compatibility aliases that don't collide with existing canonical IDs
  for (const model of snapshot.models) {
    if (model.legacyAlias && !modelsMap[model.legacyAlias] && modelsMap[model.id]) {
      modelsMap[model.legacyAlias] = modelsMap[model.id];
    }
  }

  const infraLookup = new Map(snapshot.infrastructure.map(i => [i.id, i]));
  const vectorDb = infraLookup.get('vectorDb');
  const cache = infraLookup.get('cache');
  const apiGateway = infraLookup.get('apiGateway');
  const router = infraLookup.get('router');

  const infra: EngineInfraPricing = Object.freeze({
    vectorDb: Object.freeze({
      baseMonthlyCost: vectorDb?.baseMonthlyCost ?? 120,
      perMillionQueries: vectorDb?.perMillionQueries ?? 0.20,
      perGBStorage: vectorDb?.perGBStorage ?? 0.25,
      lookupLatencyMs: vectorDb?.lookupLatencyMs ?? 45,
      provider: vectorDb?.provider ?? 'Pinecone / Qdrant',
      unit: vectorDb?.unit ?? 'USD / cluster-month',
      notes: vectorDb?.notes ?? 'Base indexing pod + query volume + index storage',
    }),
    cache: Object.freeze({
      baseMonthlyCost: cache?.baseMonthlyCost ?? 65,
      perGBHour: cache?.perGBHour ?? 0.012,
      lookupLatencyMs: cache?.lookupLatencyMs ?? 5,
      provider: cache?.provider ?? 'Redis Cloud',
      unit: cache?.unit ?? 'USD / instance-month',
      notes: cache?.notes ?? 'In-memory key-value cache + RAM capacity allocation',
    }),
    apiGateway: Object.freeze({
      perMillionRequests: apiGateway?.perMillionRequests ?? 1.00,
      latencyMs: apiGateway?.lookupLatencyMs ?? 12,
      provider: apiGateway?.provider ?? 'API Gateway',
      unit: apiGateway?.unit ?? 'USD / 1M requests',
      notes: apiGateway?.notes ?? 'TLS termination, rate limiting, and traffic ingress',
    }),
    router: Object.freeze({
      perMillionRequests: router?.perMillionRequests ?? 0.50,
      latencyMs: router?.lookupLatencyMs ?? 8,
      provider: router?.provider ?? 'AI Complexity Router',
      unit: router?.unit ?? 'USD / 1M requests',
      notes: router?.notes ?? 'Classification and heuristic model dispatch',
    }),
  });

  const assumptions: ModelAssumption[] = snapshot.assumptions.map(a => Object.freeze({
    id: a.id,
    name: a.name,
    value: a.value,
    unit: a.unit,
    source: a.source,
    sourceType: (a.sourceType === 'INDUSTRY BENCHMARK' ? 'BENCHMARK' : a.sourceType) as 'PROVIDER' | 'BENCHMARK' | 'INTERNAL REFERENCE' | 'DERIVED',
    snapshot: a.snapshot,
    sourceUrl: a.sourceUrl,
    effectiveDate: a.effectiveDate,
    notes: a.notes,
    category: a.category as 'pricing' | 'latency' | 'infrastructure',
  }));

  const isBaseline = snapshot.metadata.snapshotId === BASELINE_SNAPSHOT.metadata.snapshotId;

  return Object.freeze({
    snapshotId: snapshot.metadata.snapshotId,
    label: snapshot.metadata.label,
    engineVersion: snapshot.metadata.engineVersion,
    modelRegistryVersion: snapshot.metadata.modelRegistryVersion,
    pricingSnapshot: isBaseline ? '2026-03' : snapshot.metadata.label,
    models: Object.freeze(modelsMap),
    infra,
    assumptions: Object.freeze(assumptions) as unknown as ModelAssumption[],
    isBaseline,
  });
}

// Canonical pre-compiled baseline bundle for zero-allocation performance on default runs
export const BASELINE_ENGINE_BUNDLE = mapSnapshotToBundle(BASELINE_SNAPSHOT);

/**
 * Resolves a snapshot identifier to an immutable EnginePricingBundle.
 * Returns a typed failure if the snapshot is unknown.
 */
export function resolveRegistryPricing(snapshotIdentifier?: string): SnapshotResolutionResult {
  if (!snapshotIdentifier) {
    return { ok: true, bundle: BASELINE_ENGINE_BUNDLE };
  }

  const snapshot = getSnapshot(snapshotIdentifier);
  if (!snapshot) {
    return {
      ok: false,
      error: 'UNKNOWN_SNAPSHOT',
      requestedId: snapshotIdentifier,
      message: `Unknown pricing snapshot identifier "${snapshotIdentifier}". Silent fallback to other snapshots is blocked to prevent untracked cost variance.`,
    };
  }

  // Optimize: reuse baseline bundle if resolving to baseline snapshot
  if (snapshot.metadata.snapshotId === BASELINE_SNAPSHOT.metadata.snapshotId) {
    return { ok: true, bundle: BASELINE_ENGINE_BUNDLE };
  }

  return { ok: true, bundle: mapSnapshotToBundle(snapshot) };
}

/**
 * Returns Engine 4.0 MODEL_PRICING map for a snapshot.
 * Throws UnknownSnapshotError if an explicit snapshot ID cannot be resolved.
 */
export function getEnginePricingRecords(snapshotIdentifier?: string): Record<string, PricingRecord> {
  const result = resolveRegistryPricing(snapshotIdentifier);
  if (!result.ok) {
    throw new UnknownSnapshotError(result.requestedId);
  }
  return result.bundle.models;
}

/**
 * Returns Engine 4.0 INFRA_PRICING for a snapshot.
 */
export function getEngineInfraPricing(snapshotIdentifier?: string): EngineInfraPricing {
  const result = resolveRegistryPricing(snapshotIdentifier);
  if (!result.ok) {
    throw new UnknownSnapshotError(result.requestedId);
  }
  return result.bundle.infra;
}

/**
 * Returns Engine 4.0 ASSUMPTION_REGISTRY for a snapshot.
 */
export function getEngineAssumptionRegistry(snapshotIdentifier?: string): ModelAssumption[] {
  const result = resolveRegistryPricing(snapshotIdentifier);
  if (!result.ok) {
    throw new UnknownSnapshotError(result.requestedId);
  }
  return result.bundle.assumptions;
}

export interface NodePricingResolution {
  pricing: PricingRecord;
  modelId: string;
  isDefaultFallback: boolean;
  unrecognizedModelId?: string;
}

/**
 * Resolves a node's pricing against the given bundle.
 * Distinguishes:
 * 1. Valid explicit modelId -> exact pricing record, isDefaultFallback: false
 * 2. Omitted modelId (legacy template node) -> default 'gpt-4o-mini'/'gpt-4o', isDefaultFallback: true
 * 3. Unrecognized explicit modelId -> returns undefined for unpriced model detection
 */
export function resolveNodePricing(
  node: { type: string; modelId?: string; id?: string },
  bundle: EnginePricingBundle = BASELINE_ENGINE_BUNDLE
): NodePricingResolution | undefined {
  if (node.modelId) {
    const record = bundle.models[node.modelId];
    if (record) {
      return {
        pricing: record,
        modelId: node.modelId,
        isDefaultFallback: false,
      };
    }
    // Explicit modelId provided but not found in registry!
    return undefined;
  }

  // Legacy node with omitted modelId: fallback to node type baseline defaults
  const defaultModelId = node.type === 'fast-model' ? 'gpt-4o-mini' : 'gpt-4o';
  const defaultRecord = bundle.models[defaultModelId] || bundle.models['gpt-4o'];

  return {
    pricing: defaultRecord,
    modelId: defaultModelId,
    isDefaultFallback: true,
  };
}

export interface ModelValidationReport {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates that all reasoning models in an architecture are known and priced
 * in the selected snapshot bundle.
 */
export function validateArchitectureModels(
  arch: Architecture,
  bundle: EnginePricingBundle = BASELINE_ENGINE_BUNDLE
): ModelValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  const nodes = arch.nodes || [];
  for (const node of nodes) {
    const isModelType = node.type === 'fast-model' || node.type === 'frontier-model' || node.type === 'model';
    if (!isModelType) continue;

    if (node.modelId) {
      const record = bundle.models[node.modelId];
      if (!record) {
        errors.push(
          `Unrecognized model ID "${node.modelId}" on component "${node.label || node.id}". Model is not available in snapshot "${bundle.label}". Silent fallback is blocked.`
        );
      } else if (!bundle.isBaseline && (record.status === 'DISCONTINUED' || record.status === 'DEPRECATED')) {
        errors.push(
          `Model "${node.modelId}" on component "${node.label || node.id}" is ${record.status} in snapshot "${bundle.label}". Simulation with non-active models is blocked to prevent invalid estimates.`
        );
      }
    } else {
      warnings.push(
        `Component "${node.label || node.id}" has no explicit modelId specified. Pinned default "${node.type === 'fast-model' ? 'gpt-4o-mini' : 'gpt-4o'}" will be used.`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
