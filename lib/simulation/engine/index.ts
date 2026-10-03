/* ──────────────────────────────────────────────
   COMPUTECANVAS — DETERMINISTIC DECISION ENGINE 4.0
   Pipeline Orchestrator & Canonical simulate() Function
   ────────────────────────────────────────────── */

import {
  type Workload,
  type Architecture,
  type SimulationInput,
  type SimulationResult,
  type CapabilityTier,
} from './types';
import { ENGINE_VERSION } from './version';
import { normalizeSimulationInput } from './input';
import { validateArchitecture } from './validation';
import { resolveGraph } from './graph';
import { propagateTraffic } from './traffic';
import { calculateCosts, MODEL_PRICING } from './cost';
import { calculateLatency } from './latency';
import { calculateCapacity } from './capacity';
import { calculateThroughputRPS } from './throughput';
import { evaluateBottleneck } from './bottleneck';
import { calculateComponentContributions } from './contribution';
import { generateCalculationTrace } from './trace';
import { getEngineProvenance } from './provenance';
import { formatNumber } from './precision';

/**
 * Canonical simulate() pipeline for ComputeCanvas Engine 4.0.
 * Supports both simulate(workload, architecture) and simulate(input: SimulationInput).
 *
 * Execution flow:
 * 1. Input Normalization
 * 2. Input & Graph Validation
 * 3. Graph Resolution (topological order, reachability)
 * 4. Traffic Propagation & Token Accounting (conservation)
 * 5. Cost Model (models, cache, vector DB, ingress, router)
 * 6. Latency Model (path-based, percentiles, TTFT)
 * 7. Capacity & Throughput Model (utilization, saturation, RPS)
 * 8. Bottleneck Analysis (multi-factor evaluation)
 * 9. Component Contribution Engine (unified shares)
 * 10. Calculation Trace 3.0 (structured steps + backward compatibility)
 * 11. Provenance Attachment
 */
export function simulate(
  inputOrWorkload: SimulationInput | Workload,
  architecture?: Architecture
): SimulationResult {
  const normalized = normalizeSimulationInput(inputOrWorkload, architecture);
  const arch = normalized.architecture;
  const workload = normalized.workload;

  const validation = validateArchitecture(arch);
  const assumptions: { category: string; detail: string }[] = [];

  const requestsPerMonth = workload.requestsPerMonth;
  const avgInputTokens = workload.avgInputTokens;
  const avgOutputTokens = workload.avgOutputTokens;
  const cacheHitRate = workload.cacheHitRate;

  assumptions.push(
    { category: 'Monthly Ingress', detail: `${formatNumber(requestsPerMonth)} requests/mo` },
    { category: 'Token Volume', detail: `${formatNumber(avgInputTokens)} in / ${formatNumber(avgOutputTokens)} out avg` },
    { category: 'Semantic Cache Rate', detail: `${Math.round(cacheHitRate * 100)}% on cache hits` }
  );

  const provenance = getEngineProvenance({
    engineVersion: normalized.engineVersion || ENGINE_VERSION,
    pricingSnapshot: normalized.pricingSnapshot,
    modelRegistryVersion: normalized.modelRegistryVersion,
    assumptionVersion: normalized.assumptionVersion,
  });

  // Guard: If invalid architecture, return safe zeroed economics with validation errors
  if (!validation.isValid) {
    return {
      monthlyCost: 0,
      costPerRequest: 0,
      p95Latency: 0,
      latencies: {
        p50: 0,
        p90: 0,
        p95: 0,
        p99: 0,
        ttftMs: 0,
        generationMs: 0,
        queueingMs: 0,
        networkMs: 0,
        cachePathMs: 0,
        criticalPathMs: 0,
        criticalPathSegments: [],
        latencyDisclaimer: 'Estimated P95 is a model-derived metric based on configured latency and saturation assumptions, not a live production measurement.',
      },
      capacityUtilization: 0,
      capabilityTier: 'Quality Not Modeled',
      capabilityDescription: 'Architecture validation incomplete or blocked.',
      qualityEstimate: 0,
      throughputRPS: 0,
      costBreakdown: {
        models: 0,
        cache: 0,
        vectorDb: 0,
        ingress: 0,
        router: 0,
        total: 0,
        subsystems: [],
        model: 0,
        compute: 0,
        network: 0,
        observability: 0,
      },
      bottleneck: {
        nodeId: '',
        componentName: 'No Active Flow',
        componentType: 'api',
        metricType: 'cost',
        impactPercentage: 0,
        costSharePercentage: 0,
        latencySharePercentage: 0,
        explanation: validation.errors[0] || 'Invalid architecture flow.',
      },
      nodeMetrics: new Map(),
      validation,
      warnings: validation.errors.map(err => ({ type: 'validation', message: err, severity: 'critical' as const })),
      assumptions,
      calculationTrace: {
        totalRequests: requestsPerMonth,
        cacheHitRate,
        cachedRequests: 0,
        uncachedRequests: 0,
        avgInputTokens,
        avgOutputTokens,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        modelInputCost: 0,
        modelOutputCost: 0,
        totalModelCost: 0,
        cacheCost: 0,
        ingressCost: 0,
        routerCost: 0,
        vectorDbCost: 0,
        totalCost: 0,
        costPerRequest: 0,
        models: [],
        steps: [],
      },
      engineVersion: ENGINE_VERSION,
      provenance,
    };
  }

  // 1. Graph Resolution
  const graph = resolveGraph(arch, validation.reachableNodeIds);

  // 2. Traffic Propagation & Token Accounting
  const traffic = propagateTraffic(workload, arch, graph);

  // 3. Cost Engine
  const cost = calculateCosts(workload, graph, traffic);

  // 4. Latency Engine
  const latency = calculateLatency(graph, traffic.effectiveCacheRate, cost.weightedModelLatency);

  // 5. Capacity & Throughput Engine
  const { capacityUtilization, capacity } = calculateCapacity(workload);
  const throughputRPS = calculateThroughputRPS(requestsPerMonth);

  // 6. Bottleneck Analysis
  const { bottleneck } = evaluateBottleneck(arch, cost.nodeMetrics, cost.totalCost, latency.p95Latency);

  // 7. Component Contribution Engine
  const contributions = calculateComponentContributions(
    arch,
    cost.nodeMetrics,
    traffic.trafficFlow.nodeTraffic,
    cost.totalCost,
    latency.p95Latency,
    requestsPerMonth,
    bottleneck.nodeId
  );

  // 8. Architectural Capability Tier
  let capabilityTier: CapabilityTier = 'Quality Not Modeled';
  let capabilityDescription = 'Architecture contains no active reasoning models.';

  const frontierCount = graph.modelNodes.filter(n => n.type === 'frontier-model' || (n.type === 'model' && n.modelId !== 'gpt-4o-mini')).length;
  const fastCount = graph.modelNodes.filter(n => n.type === 'fast-model' || (n.type === 'model' && n.modelId === 'gpt-4o-mini')).length;
  const hasVectorGrounding = graph.hasVectorDb;

  if (frontierCount > 0 && fastCount > 0) {
    capabilityTier = 'Blended Routing';
    capabilityDescription = 'Dynamic traffic steering: Fast model handles high volume; Frontier model handles high complexity.';
  } else if (hasVectorGrounding && frontierCount > 0) {
    capabilityTier = 'Context-Grounded Frontier';
    capabilityDescription = 'Frontier reasoning grounded by approximate nearest-neighbor vector document retrieval.';
  } else if (frontierCount > 0) {
    capabilityTier = 'Frontier Reasoning';
    capabilityDescription = 'Full frontier reasoning tier (e.g. GPT-4o / Claude 3.5 Sonnet) optimizing for depth and accuracy.';
  } else if (fastCount > 0) {
    capabilityTier = 'Fast Utility';
    capabilityDescription = 'Utility reasoning tier (e.g. GPT-4o Mini / Gemini Flash) prioritizing sub-150ms latency and high volume.';
  }

  // Quality estimate (deprecated compatibility for existing tests)
  let rawQuality = 80;
  if (graph.modelNodes.length === 1) {
    const node = graph.modelNodes[0];
    const defaultModelId = node.type === 'fast-model' ? 'gpt-4o-mini' : 'gpt-4o';
    const modelId = node.modelId || defaultModelId;
    const pricing = MODEL_PRICING[modelId] || (node.type === 'fast-model' ? MODEL_PRICING['gpt-4o-mini'] : MODEL_PRICING['gpt-4o']);
    rawQuality = pricing.qualityScore ?? (node.type === 'fast-model' ? 82 : 95);
  } else if (graph.modelNodes.length > 1) {
    let weightedScoreSum = 0;
    let totalShare = 0;
    const edges = arch.edges || [];
    graph.modelNodes.forEach(m => {
      const edge = edges.find(e => e.target === m.id);
      const share = edge?.trafficShare !== undefined ? edge.trafficShare : 1 / graph.modelNodes.length;
      const defaultModelId = m.type === 'fast-model' ? 'gpt-4o-mini' : 'gpt-4o';
      const modelId = m.modelId || defaultModelId;
      const pricing = MODEL_PRICING[modelId] || (m.type === 'fast-model' ? MODEL_PRICING['gpt-4o-mini'] : MODEL_PRICING['gpt-4o']);
      const score = pricing.qualityScore ?? (m.type === 'fast-model' ? 82 : 95);
      weightedScoreSum += score * share;
      totalShare += share;
    });
    rawQuality = totalShare > 0 ? (weightedScoreSum / totalShare) : 80;
  }
  const groundingBonus = hasVectorGrounding ? 1 : 0;
  const qualityEstimate = Math.min(99, Math.max(50, Math.round(rawQuality + groundingBonus)));

  // Warnings collection
  const warnings: { type: string; message: string; severity: 'info' | 'warning' | 'critical' }[] = [];

  const bottleneckMetrics = cost.nodeMetrics.get(bottleneck.nodeId);
  if (bottleneckMetrics && bottleneckMetrics.costPercentage > 50) {
    const bottleneckNode = arch.nodes.find(n => n.id === bottleneck.nodeId);
    warnings.push({
      type: 'cost-bottleneck',
      message: `${bottleneckNode?.label || 'Component'} accounts for ${bottleneckMetrics.costPercentage}% of total spend. Consider model routing or caching.`,
      severity: 'warning',
    });
  }

  for (const tw of traffic.trafficFlow.warnings) {
    warnings.push({
      type: 'unallocated-traffic',
      message: tw,
      severity: 'warning',
    });
  }

  for (const w of validation.warnings) {
    warnings.push({
      type: 'validation',
      message: w,
      severity: 'info',
    });
  }

  // 9. Calculation Trace 3.0
  const calculationTrace = generateCalculationTrace(workload, traffic, cost, latency);

  return {
    monthlyCost: cost.totalCost,
    costPerRequest: cost.costPerRequest,
    p95Latency: latency.p95Latency,
    latencies: latency.latencies,
    capacityUtilization,
    capabilityTier,
    capabilityDescription,
    qualityEstimate,
    throughputRPS,
    costBreakdown: cost.costBreakdown,
    bottleneck,
    nodeMetrics: cost.nodeMetrics,
    validation,
    warnings,
    assumptions,
    calculationTrace,
    // Engine 4.0 Extensions:
    engineVersion: ENGINE_VERSION,
    provenance,
    trafficFlow: traffic.trafficFlow,
    contributions,
    capacity,
  };
}

// Re-export all subsystem functions and types
export * from './types';
export * from './version';
export * from './precision';
export * from './input';
export * from './validation';
export * from './graph';
export * from './traffic';
export * from './cost';
export * from './latency';
export * from './capacity';
export * from './throughput';
export * from './bottleneck';
export * from './contribution';
export * from './trace';
export * from './provenance';
