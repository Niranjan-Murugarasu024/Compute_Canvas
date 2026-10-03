/* ──────────────────────────────────────────────
   COMPUTECANVAS — DETERMINISTIC DECISION ENGINE 4.0
   Deterministic Cost Model & Pricing Registries
   ────────────────────────────────────────────── */

import {
  type CostBreakdown,
  type CostSubsystemItem,
  type NodeEconomics,
  type ModelCalculationDetail,
  type PricingRecord,
  type Workload,
} from './types';
import { type ResolvedGraph } from './graph';
import { type TrafficPropagationResult } from './traffic';
import { roundCurrency, safeDivide } from './precision';

export const MODEL_PRICING: Record<string, PricingRecord> = {
  // Fast Models
  'gpt-4o-mini': {
    provider: 'OpenAI',
    product: 'GPT-4o Mini',
    category: 'fast',
    inputPricePer1M: 0.15,
    outputPricePer1M: 0.60,
    baselineLatencyMs: 140,
    contextWindowTokens: 128000,
    capabilityTier: 'Fast Utility',
    capabilityDescription: 'High-speed utility tier optimized for extraction, classification, and sub-150ms workflows.',
    sourceType: 'PROVIDER',
    pricingSnapshot: 'March 2026',
    registryVersion: 'v1.4',
    status: 'ACTIVE',
    qualityScore: 82,
    qualityBenchmark: 'Artificial Analysis: 82 | LMSYS Arena Elo: ~1215',
    qualitySource: 'artificialanalysis.ai / chat.lmsys.org',
    source: 'openai.com/pricing',
    unit: 'USD / 1M tokens',
    notes: 'High-speed, low-cost utility reasoning tier',
    benchmarkDate: 'March 2026',
    assumptions: 'Low-latency utility reasoning model input rate.',
  },
  'gemini-2.0-flash': {
    provider: 'Google',
    product: 'Gemini 2.0 Flash',
    category: 'fast',
    inputPricePer1M: 0.10,
    outputPricePer1M: 0.40,
    baselineLatencyMs: 90,
    contextWindowTokens: 1048576,
    capabilityTier: 'Fast Utility',
    capabilityDescription: 'Sub-100ms ultra-low latency model for high-throughput streaming and high-volume workloads.',
    sourceType: 'PROVIDER',
    pricingSnapshot: 'March 2026',
    registryVersion: 'v1.4',
    status: 'ACTIVE',
    qualityScore: 80,
    qualityBenchmark: 'Artificial Analysis: 80 | LMSYS Arena Elo: ~1205',
    qualitySource: 'artificialanalysis.ai / chat.lmsys.org',
    source: 'cloud.google.com/vertex-ai/pricing',
    unit: 'USD / 1M tokens',
    notes: 'Sub-100ms ultra-low latency utility model',
    benchmarkDate: 'March 2026',
    assumptions: 'Sub-100ms ultra-low latency utility model.',
  },
  'claude-3-haiku': {
    provider: 'Anthropic',
    product: 'Claude 3 Haiku',
    category: 'fast',
    inputPricePer1M: 0.25,
    outputPricePer1M: 1.25,
    baselineLatencyMs: 120,
    contextWindowTokens: 200000,
    capabilityTier: 'Fast Utility',
    capabilityDescription: 'Lightweight rapid reasoning tier for customer support triage and data parsing.',
    sourceType: 'PROVIDER',
    pricingSnapshot: 'March 2026',
    registryVersion: 'v1.4',
    status: 'ACTIVE',
    qualityScore: 78,
    qualityBenchmark: 'Artificial Analysis: 78 | LMSYS Arena Elo: ~1180',
    qualitySource: 'artificialanalysis.ai / chat.lmsys.org',
    source: 'anthropic.com/pricing',
    unit: 'USD / 1M tokens',
    notes: 'Lightweight, rapid reasoning tier',
    benchmarkDate: 'March 2026',
    assumptions: 'Lightweight rapid reasoning tier.',
  },

  // Frontier Models
  'gpt-4o': {
    provider: 'OpenAI',
    product: 'GPT-4o',
    category: 'frontier',
    inputPricePer1M: 2.50,
    outputPricePer1M: 10.00,
    baselineLatencyMs: 380,
    contextWindowTokens: 128000,
    capabilityTier: 'Frontier Reasoning',
    capabilityDescription: 'Omni-modal flagship frontier model for complex logic, multi-step agent actions, and code.',
    sourceType: 'PROVIDER',
    pricingSnapshot: 'March 2026',
    registryVersion: 'v1.4',
    status: 'ACTIVE',
    qualityScore: 95,
    qualityBenchmark: 'Artificial Analysis: 95 | LMSYS Arena Elo: ~1285',
    qualitySource: 'artificialanalysis.ai / chat.lmsys.org',
    source: 'openai.com/pricing',
    unit: 'USD / 1M tokens',
    notes: 'Omni-modal flagship frontier model',
    benchmarkDate: 'March 2026',
    assumptions: 'Omni-modal flagship frontier model.',
  },
  'claude-3.5-sonnet': {
    provider: 'Anthropic',
    product: 'Claude 3.5 Sonnet',
    category: 'frontier',
    inputPricePer1M: 3.00,
    outputPricePer1M: 15.00,
    baselineLatencyMs: 420,
    contextWindowTokens: 200000,
    capabilityTier: 'Frontier Reasoning',
    capabilityDescription: 'High-precision technical reasoning, codebase architecture, and comprehensive document synthesis.',
    sourceType: 'PROVIDER',
    pricingSnapshot: 'March 2026',
    registryVersion: 'v1.4',
    status: 'ACTIVE',
    qualityScore: 96,
    qualityBenchmark: 'Artificial Analysis: 96 | LMSYS Arena Elo: ~1290',
    qualitySource: 'artificialanalysis.ai / chat.lmsys.org',
    source: 'anthropic.com/pricing',
    unit: 'USD / 1M tokens',
    notes: 'High-precision technical reasoning and synthesis',
    benchmarkDate: 'March 2026',
    assumptions: 'High-precision technical reasoning and synthesis.',
  },
  'gemini-2.5-pro': {
    provider: 'Google',
    product: 'Gemini 2.5 Pro',
    category: 'frontier',
    inputPricePer1M: 1.25,
    outputPricePer1M: 10.00,
    baselineLatencyMs: 350,
    contextWindowTokens: 2097152,
    capabilityTier: 'Frontier Reasoning',
    capabilityDescription: 'Deep context reasoning, mathematical logic, and multi-modal analysis.',
    sourceType: 'PROVIDER',
    pricingSnapshot: 'March 2026',
    registryVersion: 'v1.4',
    status: 'ACTIVE',
    qualityScore: 94,
    qualityBenchmark: 'Artificial Analysis: 94 | LMSYS Arena Elo: ~1275',
    qualitySource: 'artificialanalysis.ai / chat.lmsys.org',
    source: 'cloud.google.com/vertex-ai/pricing',
    unit: 'USD / 1M tokens',
    notes: 'Deep context reasoning and analysis',
    benchmarkDate: 'March 2026',
    assumptions: 'Deep context reasoning and analysis.',
  },
};

export const INFRA_PRICING = {
  vectorDb: {
    baseMonthlyCost: 120,
    perMillionQueries: 0.20,
    perGBStorage: 0.25,
    lookupLatencyMs: 45,
    provider: 'Pinecone / Qdrant',
    unit: 'USD / cluster-month',
    notes: 'Base indexing pod + query volume + index storage',
  },
  cache: {
    baseMonthlyCost: 65,
    perGBHour: 0.012,
    lookupLatencyMs: 5,
    provider: 'Redis Cloud',
    unit: 'USD / instance-month',
    notes: 'In-memory key-value cache + RAM capacity allocation',
  },
  apiGateway: {
    perMillionRequests: 1.00,
    latencyMs: 12,
    provider: 'API Gateway',
    unit: 'USD / 1M requests',
    notes: 'TLS termination, rate limiting, and traffic ingress',
  },
  router: {
    perMillionRequests: 0.50,
    latencyMs: 8,
    provider: 'AI Complexity Router',
    unit: 'USD / 1M requests',
    notes: 'Classification and heuristic model dispatch',
  },
};

/**
 * Dedicated Hardware Cost Formula
 * Hardware Cost = ceil(Required Instances) * Hourly Rate * 730 hours/month
 */
export function calculateHardwareCost(requiredInstances: number, hourlyRate: number): number {
  if (requiredInstances <= 0 || hourlyRate <= 0) return 0;
  return Math.ceil(requiredInstances) * hourlyRate * 730;
}

export interface CostModelResult {
  totalCost: number;
  costPerRequest: number;
  totalModelCost: number;
  modelInputCostTotal: number;
  modelOutputCostTotal: number;
  cacheCost: number;
  vectorDbCost: number;
  ingressCost: number;
  routerCost: number;
  costBreakdown: CostBreakdown;
  nodeMetrics: Map<string, NodeEconomics>;
  modelCalculationDetails: ModelCalculationDetail[];
  weightedModelLatency: number;
}

/**
 * Computes deterministic cost across models and infrastructure subsystems.
 */
export function calculateCosts(
  workload: Workload,
  graph: ResolvedGraph,
  traffic: TrafficPropagationResult
): CostModelResult {
  const requestsPerMonth = workload.requestsPerMonth;
  const avgInputTokens = workload.avgInputTokens;
  const avgOutputTokens = workload.avgOutputTokens;
  const uncachedRequests = traffic.uncachedRequests;

  const nodeMetrics = new Map<string, NodeEconomics>();

  // 1. Ingress Gateway Cost
  const apiNodes = graph.apiNodes;
  const ingressCost = (requestsPerMonth / 1_000_000) * INFRA_PRICING.apiGateway.perMillionRequests * Math.max(1, apiNodes.length);
  const ingressLatency = INFRA_PRICING.apiGateway.latencyMs;

  apiNodes.forEach(api => {
    nodeMetrics.set(api.id, {
      nodeId: api.id,
      monthlyCost: ingressCost / apiNodes.length,
      costPercentage: 0,
      latencyMs: ingressLatency,
      isBottleneck: false,
    });
  });

  // 2. Semantic Cache Cost
  let cacheCost = 0;
  const cacheLookupLatency = INFRA_PRICING.cache.lookupLatencyMs;
  if (graph.hasCache) {
    const cacheNodes = graph.cacheNodes;
    const cachedGBHours = Math.max(1, requestsPerMonth / 500_000) * 730;
    cacheCost = INFRA_PRICING.cache.baseMonthlyCost * cacheNodes.length + cachedGBHours * INFRA_PRICING.cache.perGBHour;

    cacheNodes.forEach(c => {
      nodeMetrics.set(c.id, {
        nodeId: c.id,
        monthlyCost: cacheCost / cacheNodes.length,
        costPercentage: 0,
        latencyMs: cacheLookupLatency,
        isBottleneck: false,
      });
    });
  }

  // 3. Vector DB Cost
  let vectorDbCost = 0;
  const vectorLookupLatency = INFRA_PRICING.vectorDb.lookupLatencyMs;
  if (graph.hasVectorDb) {
    const vectorNodes = graph.vectorNodes;
    const vectorQueries = uncachedRequests;
    vectorDbCost = (INFRA_PRICING.vectorDb.baseMonthlyCost * vectorNodes.length) +
      (vectorQueries / 1_000_000) * INFRA_PRICING.vectorDb.perMillionQueries * 100 +
      10 * INFRA_PRICING.vectorDb.perGBStorage;

    vectorNodes.forEach(v => {
      nodeMetrics.set(v.id, {
        nodeId: v.id,
        monthlyCost: vectorDbCost / vectorNodes.length,
        costPercentage: 0,
        latencyMs: vectorLookupLatency,
        isBottleneck: false,
      });
    });
  }

  // 4. Complexity Router Cost
  let routerCost = 0;
  const routerLatency = INFRA_PRICING.router.latencyMs;
  if (graph.hasRouter) {
    const routerNodes = graph.routerNodes;
    routerCost = (uncachedRequests / 1_000_000) * INFRA_PRICING.router.perMillionRequests;

    routerNodes.forEach(r => {
      nodeMetrics.set(r.id, {
        nodeId: r.id,
        monthlyCost: routerCost / routerNodes.length,
        costPercentage: 0,
        latencyMs: routerLatency,
        isBottleneck: false,
      });
    });
  }

  // 5. Reasoning Models Cost & Weighted Latency
  let totalModelCost = 0;
  let modelInputCostTotal = 0;
  let modelOutputCostTotal = 0;
  let weightedModelLatency = 0;
  const modelCalculationDetails: ModelCalculationDetail[] = [];

  const allocations = traffic.modelAllocations;
  const totalAllocatedRequests = allocations.reduce((acc, a) => acc + a.routedRequests, 0);

  for (const alloc of allocations) {
    const node = alloc.node;
    const defaultModelId = node.type === 'fast-model' ? 'gpt-4o-mini' : 'gpt-4o';
    const modelId = node.modelId || defaultModelId;
    const pricing = MODEL_PRICING[modelId] || (node.type === 'fast-model' ? MODEL_PRICING['gpt-4o-mini'] : MODEL_PRICING['gpt-4o']);

    const nodeRequests = alloc.routedRequests;
    const inputCost = (nodeRequests * avgInputTokens / 1_000_000) * pricing.inputPricePer1M;
    const outputCost = (nodeRequests * avgOutputTokens / 1_000_000) * pricing.outputPricePer1M;
    const nodeCost = inputCost + outputCost;

    modelInputCostTotal += inputCost;
    modelOutputCostTotal += outputCost;
    totalModelCost += nodeCost;

    const latencyShare = totalAllocatedRequests > 0 ? (alloc.routedRequests / totalAllocatedRequests) : (1 / Math.max(1, allocations.length));
    weightedModelLatency += pricing.baselineLatencyMs * latencyShare;

    modelCalculationDetails.push({
      nodeId: node.id,
      modelName: node.label || pricing.product,
      modelId,
      trafficShare: alloc.trafficShare,
      routedRequests: Math.round(nodeRequests),
      inputTokens: Math.round(nodeRequests * avgInputTokens),
      outputTokens: Math.round(nodeRequests * avgOutputTokens),
      inputPricePer1M: pricing.inputPricePer1M,
      outputPricePer1M: pricing.outputPricePer1M,
      inputCost: roundCurrency(inputCost),
      outputCost: roundCurrency(outputCost),
      totalCost: roundCurrency(nodeCost),
    });

    nodeMetrics.set(node.id, {
      nodeId: node.id,
      monthlyCost: nodeCost,
      costPercentage: 0,
      latencyMs: pricing.baselineLatencyMs,
      isBottleneck: false,
    });
  }

  // Fallback if 0 models
  if (allocations.length === 0 && graph.modelNodes.length === 1) {
    const node = graph.modelNodes[0];
    const defaultModelId = node.type === 'fast-model' ? 'gpt-4o-mini' : 'gpt-4o';
    const modelId = node.modelId || defaultModelId;
    const pricing = MODEL_PRICING[modelId] || MODEL_PRICING['gpt-4o'];
    weightedModelLatency = pricing.baselineLatencyMs;
  }

  // Total System Cost
  const totalCost = roundCurrency(totalModelCost + cacheCost + vectorDbCost + ingressCost + routerCost);
  const costPerRequest = requestsPerMonth > 0 ? safeDivide(totalCost, requestsPerMonth) : 0;

  // Build Subsystems Breakdown
  const subsystems: CostSubsystemItem[] = [];
  if (totalModelCost > 0) {
    subsystems.push({
      id: 'model-inference',
      name: 'Model Inference',
      type: 'frontier-model',
      monthlyCost: roundCurrency(totalModelCost),
      sharePercentage: totalCost > 0 ? Math.round((totalModelCost / totalCost) * 100) : 0,
      description: 'Token generation spend across fast & frontier models',
      unitRateDescription: 'Per-token pricing from OpenAI / Anthropic / Google list rates (March 2026)',
    });
  }
  if (cacheCost > 0) {
    subsystems.push({
      id: 'semantic-cache',
      name: 'Semantic Cache',
      type: 'cache',
      monthlyCost: roundCurrency(cacheCost),
      sharePercentage: totalCost > 0 ? Math.round((cacheCost / totalCost) * 100) : 0,
      description: 'Redis in-memory instance base + RAM capacity allocation',
      unitRateDescription: '$0.50/mo base + $0.015/GB RAM — modeled after Redis Cloud Standard',
    });
  }
  if (vectorDbCost > 0) {
    subsystems.push({
      id: 'vector-db',
      name: 'Vector Database',
      type: 'vectordb',
      monthlyCost: roundCurrency(vectorDbCost),
      sharePercentage: totalCost > 0 ? Math.round((vectorDbCost / totalCost) * 100) : 0,
      description: 'Base indexing pod + query volume + index storage',
      unitRateDescription: '$70/mo base + $0.08/1M queries — modeled after Pinecone Serverless',
    });
  }
  if (ingressCost > 0) {
    subsystems.push({
      id: 'api-gateway',
      name: 'API Gateway Ingress',
      type: 'api',
      monthlyCost: roundCurrency(ingressCost),
      sharePercentage: totalCost > 0 ? Math.round((ingressCost / totalCost) * 100) : 0,
      description: 'TLS termination, edge rate limiting, and request ingress tariff',
      unitRateDescription: '$0.50/1M requests — modeled after AWS HTTP API Gateway',
    });
  }
  if (routerCost > 0) {
    subsystems.push({
      id: 'complexity-router',
      name: 'Complexity Router',
      type: 'router',
      monthlyCost: roundCurrency(routerCost),
      sharePercentage: totalCost > 0 ? Math.round((routerCost / totalCost) * 100) : 0,
      description: 'Intent classification and dispatch compute tariff',
      unitRateDescription: '$0.50/1M requests — routing classification at edge gateway tier',
    });
  }

  const costBreakdown: CostBreakdown = {
    models: roundCurrency(totalModelCost),
    cache: roundCurrency(cacheCost),
    vectorDb: roundCurrency(vectorDbCost),
    ingress: roundCurrency(ingressCost),
    router: roundCurrency(routerCost),
    total: totalCost,
    subsystems,
    model: roundCurrency(totalModelCost),
    compute: roundCurrency(cacheCost),
    network: roundCurrency(ingressCost + routerCost),
    observability: 0,
  };

  return {
    totalCost,
    costPerRequest,
    totalModelCost,
    modelInputCostTotal,
    modelOutputCostTotal,
    cacheCost,
    vectorDbCost,
    ingressCost,
    routerCost,
    costBreakdown,
    nodeMetrics,
    modelCalculationDetails,
    weightedModelLatency,
  };
}
