/* ──────────────────────────────────────────────
   COMPUTECANVAS — DETERMINISTIC DECISION ENGINE 4.0
   Input Normalization & Sanitization
   ────────────────────────────────────────────── */

import { type Workload, type Architecture, type SimulationInput } from './types';
import { clamp } from './precision';

export interface NormalizedWorkload extends Workload {
  requestsPerMonth: number;
  avgInputTokens: number;
  avgOutputTokens: number;
  cacheHitRate: number;
  concurrency: number;
}

export interface NormalizedInput {
  architecture: Architecture;
  workload: NormalizedWorkload;
  pricingSnapshot?: string;
  modelRegistryVersion?: string;
  assumptionVersion?: string;
  engineVersion?: string;
  decisionObjective: 'cost' | 'latency' | 'quality' | 'balanced';
}

/**
 * Normalizes workload inputs safely.
 * Non-negative constraints, bounds cacheHitRate between [0, 1], removes NaN and Infinity.
 */
export function normalizeWorkload(workload: Workload): NormalizedWorkload {
  const requestsPerMonth = !isFinite(workload.requestsPerMonth) || isNaN(workload.requestsPerMonth)
    ? 0
    : Math.max(0, workload.requestsPerMonth);

  const avgInputTokens = !isFinite(workload.avgInputTokens) || isNaN(workload.avgInputTokens)
    ? 0
    : Math.max(0, workload.avgInputTokens);

  const avgOutputTokens = !isFinite(workload.avgOutputTokens) || isNaN(workload.avgOutputTokens)
    ? 0
    : Math.max(0, workload.avgOutputTokens);

  const cacheHitRate = !isFinite(workload.cacheHitRate) || isNaN(workload.cacheHitRate)
    ? 0
    : clamp(workload.cacheHitRate, 0, 1.0);

  const concurrency = workload.concurrency && isFinite(workload.concurrency) && !isNaN(workload.concurrency)
    ? Math.max(1, workload.concurrency)
    : 1;

  return {
    requestsPerMonth,
    avgInputTokens,
    avgOutputTokens,
    cacheHitRate,
    concurrency,
  };
}

/**
 * Normalizes full simulation input, providing canonical defaults.
 */
export function normalizeSimulationInput(
  inputOrWorkload: SimulationInput | Workload,
  architecture?: Architecture
): NormalizedInput {
  if (architecture !== undefined) {
    // Legacy invocation: simulate(workload, architecture)
    const workload = normalizeWorkload(inputOrWorkload as Workload);
    return {
      architecture: architecture || { nodes: [], edges: [] },
      workload,
      decisionObjective: 'balanced',
    };
  }

  // Canonical invocation: simulate(input)
  const input = inputOrWorkload as SimulationInput;
  return {
    architecture: input.architecture || { nodes: [], edges: [] },
    workload: normalizeWorkload(input.workload),
    pricingSnapshot: input.pricingSnapshot,
    modelRegistryVersion: input.modelRegistryVersion,
    assumptionVersion: input.assumptionVersion,
    engineVersion: input.engineVersion,
    decisionObjective: input.decisionObjective || 'balanced',
  };
}
