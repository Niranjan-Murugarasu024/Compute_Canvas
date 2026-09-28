/* ──────────────────────────────────────────────
   COMPUTECANVAS — DETERMINISTIC SIMULATION ENGINE (V1)
   Formulaic, reproducible AI architecture & economics.
   ────────────────────────────────────────────── */

// ── 1. Centralized Model & Infrastructure Pricing ──

export interface PricingRecord {
  provider: string;
  product: string;
  category: 'fast' | 'frontier';
  inputPricePer1M: number;
  outputPricePer1M: number;
  baselineLatencyMs: number;
  qualityScore: number;
  source: string;
}

export const MODEL_PRICING: Record<string, PricingRecord> = {
  // Fast Models
  'gpt-4o-mini': {
    provider: 'OpenAI',
    product: 'GPT-4o Mini',
    category: 'fast',
    inputPricePer1M: 0.15,
    outputPricePer1M: 0.60,
    baselineLatencyMs: 140,
    qualityScore: 82,
    source: 'openai.com/pricing',
  },
  'gemini-2.0-flash': {
    provider: 'Google',
    product: 'Gemini 2.0 Flash',
    category: 'fast',
    inputPricePer1M: 0.10,
    outputPricePer1M: 0.40,
    baselineLatencyMs: 90,
    qualityScore: 80,
    source: 'cloud.google.com/vertex-ai/pricing',
  },
  'claude-3-haiku': {
    provider: 'Anthropic',
    product: 'Claude 3 Haiku',
    category: 'fast',
    inputPricePer1M: 0.25,
    outputPricePer1M: 1.25,
    baselineLatencyMs: 120,
    qualityScore: 78,
    source: 'anthropic.com/pricing',
  },

  // Frontier Models
  'gpt-4o': {
    provider: 'OpenAI',
    product: 'GPT-4o',
    category: 'frontier',
    inputPricePer1M: 2.50,
    outputPricePer1M: 10.00,
    baselineLatencyMs: 380,
    qualityScore: 95,
    source: 'openai.com/pricing',
  },
  'claude-3.5-sonnet': {
    provider: 'Anthropic',
    product: 'Claude 3.5 Sonnet',
    category: 'frontier',
    inputPricePer1M: 3.00,
    outputPricePer1M: 15.00,
    baselineLatencyMs: 420,
    qualityScore: 96,
    source: 'anthropic.com/pricing',
  },
  'gemini-2.5-pro': {
    provider: 'Google',
    product: 'Gemini 2.5 Pro',
    category: 'frontier',
    inputPricePer1M: 1.25,
    outputPricePer1M: 10.00,
    baselineLatencyMs: 350,
    qualityScore: 94,
    source: 'cloud.google.com/vertex-ai/pricing',
  },
};

export const INFRA_PRICING = {
  vectorDb: {
    baseMonthlyCost: 120,
    perMillionQueries: 0.20,
    perGBStorage: 0.25,
    lookupLatencyMs: 45,
    provider: 'Pinecone / Qdrant',
  },
  cache: {
    baseMonthlyCost: 65,
    perGBHour: 0.012,
    lookupLatencyMs: 5,
    provider: 'Redis Cloud',
  },
  apiGateway: {
    perMillionRequests: 1.00,
    latencyMs: 12,
    provider: 'API Gateway',
  },
  router: {
    perMillionRequests: 0.50,
    latencyMs: 8,
    provider: 'AI Complexity Router',
  },
};

// ── 2. Core Types ──

export type ComponentType =
  | 'api'
  | 'cache'
  | 'router'
  | 'vectordb'
  | 'fast-model'
  | 'frontier-model'
  | 'model'        // legacy backward compatibility
  | 'embedding'    // legacy backward compatibility
  | 'compute'      // legacy backward compatibility
  | 'storage'      // legacy backward compatibility
  | 'observability'// legacy backward compatibility
  | 'worker'       // legacy backward compatibility
  | 'reranker'     // legacy backward compatibility
  | 'loadbalancer';// legacy backward compatibility

export interface ArchNode {
  id: string;
  type: ComponentType;
  label: string;
  modelId?: string;
  x?: number;
  y?: number;
  config?: Record<string, number | string | boolean>;
}

export interface ArchEdge {
  source: string;
  target: string;
  trafficShare?: number; // 0.0 - 1.0 (portion of traffic routed through this edge)
}

export interface Architecture {
  id?: string;
  name?: string;
  nodes: ArchNode[];
  edges: ArchEdge[];
}

export interface Workload {
  requestsPerMonth: number;
  avgInputTokens: number;
  avgOutputTokens: number;
  cacheHitRate: number;      // 0.0 - 1.0
  concurrency?: number;      // optional internal load factor
  retrievalsPerRequest?: number;
  toolCallsPerRequest?: number;
}

export interface BillCalibration {
  enabled: boolean;
  actualBill: number;           // e.g. 4500
  actualRequests: number;       // e.g. 1200000
  baselineSimulatedCost: number;// simulated cost when calibration was applied
}

export interface NodeEconomics {
  nodeId: string;
  monthlyCost: number;
  costPercentage: number;
  latencyMs: number;
  isBottleneck: boolean;
}

export interface ArchitectureValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  reachableNodeIds: Set<string>;
  hasModel: boolean;
  hasApi: boolean;
}

export interface CostBreakdown {
  models: number;
  cache: number;
  vectorDb: number;
  ingress: number;
  total: number;
  model: number;
  compute: number;
  network: number;
  observability: number;
}

export interface BottleneckInfo {
  nodeId: string;
  componentName: string;
  componentType: ComponentType;
  metricType: 'cost' | 'latency';
  impactPercentage: number;
  explanation: string;
}

export interface SimulationResult {
  monthlyCost: number;
  costPerRequest: number;
  p95Latency: number;
  capacityUtilization: number;
  qualityEstimate: number;
  throughputRPS: number;
  costBreakdown: CostBreakdown;
  bottleneck: BottleneckInfo;
  nodeMetrics: Map<string, NodeEconomics>;
  validation: ArchitectureValidation;
  warnings: { type: string; message: string; severity: 'info' | 'warning' | 'critical' }[];
  assumptions: { category: string; detail: string }[];
}

export interface CalibratedEconomics {
  actualCostPerRequest: number;
  simulatedBaselineCost: number;
  variancePercentage: number;
  calibratedMonthlyCost: number;
  calibratedCostPerRequest: number;
  isCalibrated: boolean;
}

// ── 3. Helper Formatters ──

export function formatNumber(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

export function formatCurrency(n: number, compact = false): string {
  if (compact && n >= 1_000_000) {
    return `$${(n / 1_000_000).toFixed(2)}M`;
  }
  if (compact && n >= 1_000) {
    return `$${(n / 1_000).toFixed(1)}K`;
  }
  if (n < 1 && n > 0) {
    return `$${n.toFixed(4)}`;
  }
  return `$${Math.round(n).toLocaleString('en-US')}`;
}

export function formatLatency(ms: number): string {
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(2)}s`;
  }
  return `${Math.round(ms)} ms`;
}

// ── 4. Architecture Graph Validation ──

export function validateArchitecture(arch: Architecture): ArchitectureValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const nodeIds = new Set(arch.nodes.map(n => n.id));

  // 1. Must have at least one API Ingress node
  const apiNodes = arch.nodes.filter(n => n.type === 'api');
  const hasApi = apiNodes.length > 0;
  if (!hasApi) {
    errors.push('Architecture requires an API Ingress component to receive incoming requests.');
  }

  // 2. Check for missing edge endpoints
  for (const edge of arch.edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      errors.push('Architecture contains broken connections pointing to missing components.');
      break;
    }
  }

  // 3. Cycle Detection (DFS)
  const adjacency = new Map<string, string[]>();
  arch.nodes.forEach(n => adjacency.set(n.id, []));
  arch.edges.forEach(e => {
    if (adjacency.has(e.source)) {
      adjacency.get(e.source)!.push(e.target);
    }
  });

  const visited = new Map<string, 'unvisited' | 'visiting' | 'visited'>();
  arch.nodes.forEach(n => visited.set(n.id, 'unvisited'));
  let hasCycle = false;

  function dfs(nodeId: string): boolean {
    visited.set(nodeId, 'visiting');
    const neighbors = adjacency.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (visited.get(neighbor) === 'visiting') {
        return true;
      }
      if (visited.get(neighbor) === 'unvisited') {
        if (dfs(neighbor)) return true;
      }
    }
    visited.set(nodeId, 'visited');
    return false;
  }

  for (const node of arch.nodes) {
    if (visited.get(node.id) === 'unvisited') {
      if (dfs(node.id)) {
        hasCycle = true;
        break;
      }
    }
  }

  if (hasCycle) {
    errors.push('Architecture contains a circular dependency loop. Data flow must be directed acyclic.');
  }

  // 4. Reachability from API
  const reachableNodeIds = new Set<string>();
  const queue = apiNodes.map(n => n.id);
  queue.forEach(id => reachableNodeIds.add(id));

  let head = 0;
  while (head < queue.length) {
    const curr = queue[head++];
    const targets = adjacency.get(curr) || [];
    for (const t of targets) {
      if (!reachableNodeIds.has(t)) {
        reachableNodeIds.add(t);
        queue.push(t);
      }
    }
  }

  // Check if any model is reachable
  const isModelType = (t: ComponentType) =>
    t === 'fast-model' || t === 'frontier-model' || t === 'model';

  const reachableModels = arch.nodes.filter(n => reachableNodeIds.has(n.id) && isModelType(n.type));
  const hasModel = reachableModels.length > 0;
  if (hasApi && !hasModel) {
    errors.push('Connect the API Ingress to at least one reasoning model to simulate economics.');
  }

  // Check unreachable nodes
  const unreachableCount = arch.nodes.length - reachableNodeIds.size;
  if (hasApi && unreachableCount > 0) {
    warnings.push(`${unreachableCount} disconnected component${unreachableCount > 1 ? 's' : ''} not in the request path.`);
  }

  // Check router outbound splits
  const routers = arch.nodes.filter(n => reachableNodeIds.has(n.id) && n.type === 'router');
  for (const r of routers) {
    const outbound = arch.edges.filter(e => e.source === r.id);
    if (outbound.length > 1) {
      const sum = outbound.reduce((acc, e) => acc + (e.trafficShare !== undefined ? e.trafficShare : 1 / outbound.length), 0);
      if (Math.abs(sum - 1.0) > 0.05) {
        warnings.push(`Router "${r.label}" outbound allocations total ${(sum * 100).toFixed(0)}% (must equal 100%).`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    reachableNodeIds,
    hasModel,
    hasApi,
  };
}

// ── 5. Deterministic Simulation Engine ──

export function simulate(workload: Workload, architecture: Architecture): SimulationResult {
  const validation = validateArchitecture(architecture);
  const assumptions: { category: string; detail: string }[] = [];

  const requestsPerMonth = Math.max(0, workload.requestsPerMonth);
  const avgInputTokens = Math.max(0, workload.avgInputTokens);
  const avgOutputTokens = Math.max(0, workload.avgOutputTokens);
  const cacheHitRate = Math.min(1.0, Math.max(0, workload.cacheHitRate));

  assumptions.push(
    { category: 'Monthly Ingress', detail: `${formatNumber(requestsPerMonth)} requests/mo` },
    { category: 'Token Volume', detail: `${formatNumber(avgInputTokens)} in / ${formatNumber(avgOutputTokens)} out avg` },
    { category: 'Semantic Cache Rate', detail: `${Math.round(cacheHitRate * 100)}% on cache hits` }
  );

  // If invalid or missing model, return zeroed economics with validation errors
  if (!validation.isValid) {
    return {
      monthlyCost: 0,
      costPerRequest: 0,
      p95Latency: 0,
      capacityUtilization: 0,
      qualityEstimate: 0,
      throughputRPS: 0,
      costBreakdown: {
        models: 0,
        cache: 0,
        vectorDb: 0,
        ingress: 0,
        total: 0,
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
        explanation: validation.errors[0] || 'Invalid architecture flow.',
      },
      nodeMetrics: new Map(),
      validation,
      warnings: validation.errors.map(err => ({ type: 'validation', message: err, severity: 'critical' as const })),
      assumptions,
    };
  }

  const reachableNodes = architecture.nodes.filter(n => validation.reachableNodeIds.has(n.id));

  // Determine active component presence
  const hasCache = reachableNodes.some(n => n.type === 'cache');
  const hasVectorDb = reachableNodes.some(n => n.type === 'vectordb');
  const hasRouter = reachableNodes.some(n => n.type === 'router');

  // Traffic volume passing through cache
  const effectiveCacheRate = hasCache ? cacheHitRate : 0;
  const uncachedFraction = 1 - effectiveCacheRate;
  const uncachedRequests = requestsPerMonth * uncachedFraction;

  // Track per-node costs and latency contributions
  const nodeMetrics = new Map<string, NodeEconomics>();

  // 1. Ingress Cost & Latency
  const apiNodes = reachableNodes.filter(n => n.type === 'api');
  const ingressCost = (requestsPerMonth / 1_000_000) * INFRA_PRICING.apiGateway.perMillionRequests * Math.max(1, apiNodes.length);
  const ingressLatency = INFRA_PRICING.apiGateway.latencyMs;

  apiNodes.forEach(api => {
    nodeMetrics.set(api.id, {
      nodeId: api.id,
      monthlyCost: ingressCost / apiNodes.length,
      costPercentage: 0, // calculated later
      latencyMs: ingressLatency,
      isBottleneck: false,
    });
  });

  // 2. Semantic Cache Cost & Latency
  let cacheCost = 0;
  let cacheLookupLatency = 0;
  if (hasCache) {
    const cacheNodes = reachableNodes.filter(n => n.type === 'cache');
    const cachedGBHours = Math.max(1, requestsPerMonth / 500_000) * 730;
    cacheCost = INFRA_PRICING.cache.baseMonthlyCost * cacheNodes.length + cachedGBHours * INFRA_PRICING.cache.perGBHour;
    cacheLookupLatency = INFRA_PRICING.cache.lookupLatencyMs;

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

  // 3. Vector DB Cost & Latency
  let vectorDbCost = 0;
  let vectorLookupLatency = 0;
  if (hasVectorDb) {
    const vectorNodes = reachableNodes.filter(n => n.type === 'vectordb');
    const vectorQueries = uncachedRequests;
    vectorDbCost = (INFRA_PRICING.vectorDb.baseMonthlyCost * vectorNodes.length) +
      (vectorQueries / 1_000_000) * INFRA_PRICING.vectorDb.perMillionQueries * 100 +
      10 * INFRA_PRICING.vectorDb.perGBStorage;
    vectorLookupLatency = INFRA_PRICING.vectorDb.lookupLatencyMs;

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

  // 4. Router Cost & Latency
  let routerCost = 0;
  let routerLatency = 0;
  if (hasRouter) {
    const routerNodes = reachableNodes.filter(n => n.type === 'router');
    routerCost = (uncachedRequests / 1_000_000) * INFRA_PRICING.router.perMillionRequests;
    routerLatency = INFRA_PRICING.router.latencyMs;

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

  // 5. Reasoning Models (Fast & Frontier)
  const isModel = (t: ComponentType) => t === 'fast-model' || t === 'frontier-model' || t === 'model';
  const modelNodes = reachableNodes.filter(n => isModel(n.type));

  let totalModelCost = 0;
  let weightedModelLatency = 0;

  if (modelNodes.length === 1) {
    const node = modelNodes[0];
    const defaultModelId = node.type === 'fast-model' ? 'gpt-4o-mini' : 'gpt-4o';
    const modelId = node.modelId || defaultModelId;
    const pricing = MODEL_PRICING[modelId] || MODEL_PRICING['gpt-4o'];

    const inputCost = (uncachedRequests * avgInputTokens / 1_000_000) * pricing.inputPricePer1M;
    const outputCost = (uncachedRequests * avgOutputTokens / 1_000_000) * pricing.outputPricePer1M;
    const nodeCost = inputCost + outputCost;

    totalModelCost += nodeCost;
    weightedModelLatency = pricing.baselineLatencyMs;

    nodeMetrics.set(node.id, {
      nodeId: node.id,
      monthlyCost: nodeCost,
      costPercentage: 0,
      latencyMs: pricing.baselineLatencyMs,
      isBottleneck: false,
    });
  } else if (modelNodes.length > 1) {
    // Multi-model router distribution
    const edges = architecture.edges;
    let shareSum = 0;

    const allocations = modelNodes.map(m => {
      const edge = edges.find(e => e.target === m.id);
      const share = edge?.trafficShare !== undefined ? edge.trafficShare : 1 / modelNodes.length;
      shareSum += share;
      return { node: m, share };
    });

    for (const alloc of allocations) {
      const normalizedShare = shareSum > 0 ? alloc.share / shareSum : 1 / modelNodes.length;
      const node = alloc.node;
      const defaultModelId = node.type === 'fast-model' ? 'gpt-4o-mini' : 'gpt-4o';
      const modelId = node.modelId || defaultModelId;
      const pricing = MODEL_PRICING[modelId] || MODEL_PRICING['gpt-4o-mini'];

      const nodeRequests = uncachedRequests * normalizedShare;
      const inputCost = (nodeRequests * avgInputTokens / 1_000_000) * pricing.inputPricePer1M;
      const outputCost = (nodeRequests * avgOutputTokens / 1_000_000) * pricing.outputPricePer1M;
      const nodeCost = inputCost + outputCost;

      totalModelCost += nodeCost;
      weightedModelLatency += pricing.baselineLatencyMs * normalizedShare;

      nodeMetrics.set(node.id, {
        nodeId: node.id,
        monthlyCost: nodeCost,
        costPercentage: 0,
        latencyMs: pricing.baselineLatencyMs,
        isBottleneck: false,
      });
    }
  }

  // Total System Cost
  const totalCost = Math.round((totalModelCost + cacheCost + vectorDbCost + ingressCost + routerCost) * 100) / 100;
  const costPerRequest = requestsPerMonth > 0 ? totalCost / requestsPerMonth : 0;

  // P95 Latency Model:
  // Cache hits take: Ingress + Cache Lookup (~17ms)
  // Cache misses take: Ingress + Cache Lookup + Router + Vector DB + Model Inference
  const cacheHitLatency = ingressLatency + cacheLookupLatency;
  const cacheMissLatency = ingressLatency + cacheLookupLatency + routerLatency + vectorLookupLatency + weightedModelLatency;
  const p95Latency = Math.round(effectiveCacheRate * cacheHitLatency + (1 - effectiveCacheRate) * cacheMissLatency);

  // Compute node cost percentages & find bottleneck
  let maxCost = -1;
  let maxCostNodeId = '';
  let maxLatency = -1;
  let maxLatencyNodeId = '';

  nodeMetrics.forEach((metrics, id) => {
    metrics.costPercentage = totalCost > 0 ? Math.round((metrics.monthlyCost / totalCost) * 100) : 0;
    if (metrics.monthlyCost > maxCost) {
      maxCost = metrics.monthlyCost;
      maxCostNodeId = id;
    }
    if (metrics.latencyMs > maxLatency) {
      maxLatency = metrics.latencyMs;
      maxLatencyNodeId = id;
    }
  });

  // Assign bottleneck indicator: highest cost driver is typically dominant
  const bottleneckNodeId = maxCostNodeId || maxLatencyNodeId;
  const bottleneckNode = architecture.nodes.find(n => n.id === bottleneckNodeId);
  const bottleneckMetrics = nodeMetrics.get(bottleneckNodeId);

  if (bottleneckMetrics) {
    bottleneckMetrics.isBottleneck = true;
  }

  const bottleneck: BottleneckInfo = {
    nodeId: bottleneckNodeId,
    componentName: bottleneckNode?.label || 'Frontier Model',
    componentType: bottleneckNode?.type || 'frontier-model',
    metricType: 'cost',
    impactPercentage: bottleneckMetrics?.costPercentage || 0,
    explanation: bottleneckMetrics
      ? `${bottleneckNode?.label || 'Component'} accounts for ${bottleneckMetrics.costPercentage}% of total monthly spend (${formatCurrency(bottleneckMetrics.monthlyCost)}/mo).`
      : 'Frontier model token consumption represents the primary architectural cost driver.',
  };

  const costBreakdown: CostBreakdown = {
    models: Math.round(totalModelCost * 100) / 100,
    cache: Math.round(cacheCost * 100) / 100,
    vectorDb: Math.round(vectorDbCost * 100) / 100,
    ingress: Math.round((ingressCost + routerCost) * 100) / 100,
    total: totalCost,
    model: Math.round(totalModelCost * 100) / 100,
    compute: Math.round(cacheCost * 100) / 100,
    network: Math.round((ingressCost + routerCost) * 100) / 100,
    observability: 0,
  };

  const capacityUtilization = Math.min(100, Math.round((workload.requestsPerMonth / 5_000_000) * 100));
  const qualityEstimate = architecture.nodes.some(n => n.type === 'frontier-model' || n.modelId === 'gpt-4o' || n.modelId === 'claude-3.5-sonnet') ? 95 : 82;
  const throughputRPS = Math.max(1, Math.round(workload.requestsPerMonth / (30 * 24 * 3600)));

  const warnings: { type: string; message: string; severity: 'info' | 'warning' | 'critical' }[] = [];
  if (bottleneckMetrics && bottleneckMetrics.costPercentage > 50) {
    warnings.push({
      type: 'cost-bottleneck',
      message: `${bottleneckNode?.label || 'Component'} accounts for ${bottleneckMetrics.costPercentage}% of total spend. Consider model routing or caching.`,
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

  return {
    monthlyCost: totalCost,
    costPerRequest,
    p95Latency,
    capacityUtilization,
    qualityEstimate,
    throughputRPS,
    costBreakdown,
    bottleneck,
    nodeMetrics,
    validation,
    warnings,
    assumptions,
  };
}

// ── 6. Bill Calibration Engine ("Anchor to My Bill") ──

export function calculateCalibratedEconomics(
  simulation: SimulationResult,
  workload: Workload,
  calibration: BillCalibration
): CalibratedEconomics {
  if (!calibration.enabled || calibration.actualBill <= 0 || calibration.actualRequests <= 0) {
    return {
      actualCostPerRequest: 0,
      simulatedBaselineCost: simulation.monthlyCost,
      variancePercentage: 0,
      calibratedMonthlyCost: simulation.monthlyCost,
      calibratedCostPerRequest: simulation.costPerRequest,
      isCalibrated: false,
    };
  }

  const actualCostPerRequest = calibration.actualBill / calibration.actualRequests;
  const baselineSimulated = calibration.baselineSimulatedCost > 0
    ? calibration.baselineSimulatedCost
    : simulation.monthlyCost;

  const variancePercentage = baselineSimulated > 0
    ? ((calibration.actualBill - baselineSimulated) / baselineSimulated) * 100
    : 0;

  // Calibration factor adjusts theoretical token consumption to real-world bill scale
  const calibrationFactor = baselineSimulated > 0 ? (calibration.actualBill / baselineSimulated) : 1;
  const calibratedMonthlyCost = Math.round(simulation.monthlyCost * calibrationFactor * 100) / 100;
  const calibratedCostPerRequest = workload.requestsPerMonth > 0
    ? calibratedMonthlyCost / workload.requestsPerMonth
    : 0;

  return {
    actualCostPerRequest,
    simulatedBaselineCost: baselineSimulated,
    variancePercentage: Math.round(variancePercentage * 10) / 10,
    calibratedMonthlyCost,
    calibratedCostPerRequest,
    isCalibrated: true,
  };
}

// ── 7. Causal Explanation Generator ("Why Did This Change?") ──

export function explainEconomicsDelta(
  prevWorkload: Workload | null,
  prevArch: Architecture | null,
  prevSim: SimulationResult | null,
  currentWorkload: Workload,
  currentArch: Architecture,
  currentSim: SimulationResult
): string {
  if (!prevSim || !prevArch || !prevWorkload) {
    return 'Baseline architecture simulation loaded.';
  }

  const costDiff = currentSim.monthlyCost - prevSim.monthlyCost;
  const absCostDiff = Math.abs(costDiff);

  if (absCostDiff < 5) {
    return 'Architecture adjustments produced negligible cost change.';
  }

  // Cost decreased
  if (costDiff < 0) {
    const hadCacheBefore = prevArch.nodes.some(n => n.type === 'cache');
    const hasCacheNow = currentArch.nodes.some(n => n.type === 'cache');

    if (!hadCacheBefore && hasCacheNow) {
      return `Added Semantic Cache: reduced model invocations by ${Math.round(currentWorkload.cacheHitRate * 100)}%, saving approximately ${formatCurrency(absCostDiff)}/mo.`;
    }

    if (currentWorkload.cacheHitRate > prevWorkload.cacheHitRate) {
      return `Increased cache hit rate from ${Math.round(prevWorkload.cacheHitRate * 100)}% to ${Math.round(currentWorkload.cacheHitRate * 100)}%, lowering model inference costs by ${formatCurrency(absCostDiff)}/mo.`;
    }

    const prevFrontier = prevArch.nodes.filter(n => n.type === 'frontier-model' || (n.type === 'model' && n.modelId !== 'gpt-4o-mini')).length;
    const currFrontier = currentArch.nodes.filter(n => n.type === 'frontier-model' || (n.type === 'model' && n.modelId !== 'gpt-4o-mini')).length;
    if (currFrontier < prevFrontier) {
      return `Replaced frontier LLM with fast reasoning tier, reducing spend by ${formatCurrency(absCostDiff)}/mo while maintaining low latency.`;
    }

    if (currentWorkload.requestsPerMonth < prevWorkload.requestsPerMonth) {
      return `Lowered monthly request volume, reducing overall token consumption by ${formatCurrency(absCostDiff)}/mo.`;
    }

    return `Architecture optimization reduced monthly expenditure by ${formatCurrency(absCostDiff)}/mo.`;
  }

  // Cost increased
  if (costDiff > 0) {
    if (currentWorkload.requestsPerMonth > prevWorkload.requestsPerMonth) {
      const pctIncrease = Math.round(((currentWorkload.requestsPerMonth - prevWorkload.requestsPerMonth) / Math.max(1, prevWorkload.requestsPerMonth)) * 100);
      return `Monthly request volume increased by ${pctIncrease}%, raising token consumption by ${formatCurrency(absCostDiff)}/mo.`;
    }

    const hadVectorDbBefore = prevArch.nodes.some(n => n.type === 'vectordb');
    const hasVectorDbNow = currentArch.nodes.some(n => n.type === 'vectordb');
    if (!hadVectorDbBefore && hasVectorDbNow) {
      return `Added Vector Database: enabled semantic search lookups for RAG (+${formatCurrency(absCostDiff)}/mo infrastructure cost).`;
    }

    const hadCacheBefore = prevArch.nodes.some(n => n.type === 'cache');
    const hasCacheNow = currentArch.nodes.some(n => n.type === 'cache');
    if (hadCacheBefore && !hasCacheNow) {
      return `Removed Semantic Cache: 100% of ingress requests now hit LLM models directly (+${formatCurrency(absCostDiff)}/mo).`;
    }

    return `Added components increased infrastructure and token volume by ${formatCurrency(absCostDiff)}/mo.`;
  }

  return 'Simulation updated with current workload parameters.';
}

// ── 8. Three Canonical Templates + Default Architecture ──

export interface ArchTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  architecture: Architecture;
  defaultWorkload: Workload;
}

export const TEMPLATES: ArchTemplate[] = [
  {
    id: 'direct-llm',
    name: 'Direct LLM',
    category: 'Generative AI',
    description: 'Direct baseline pipeline routing all ingress requests to a Frontier Reasoning Model.',
    architecture: {
      id: 'direct-llm',
      name: 'Direct LLM Baseline',
      nodes: [
        { id: 'api-1', type: 'api', label: 'API Ingress', x: 220, y: 100 },
        { id: 'frontier-1', type: 'frontier-model', label: 'Frontier Model', modelId: 'gpt-4o', x: 220, y: 260 },
      ],
      edges: [
        { source: 'api-1', target: 'frontier-1' },
      ],
    },
    defaultWorkload: {
      requestsPerMonth: 1_000_000,
      avgInputTokens: 1200,
      avgOutputTokens: 400,
      cacheHitRate: 0.0,
      concurrency: 50,
      retrievalsPerRequest: 0,
      toolCallsPerRequest: 0,
    },
  },
  {
    id: 'rag-pipeline',
    name: 'RAG Pipeline',
    category: 'Data',
    description: 'Retrieval-augmented generation pipeline with vector search and frontier LLM synthesis.',
    architecture: {
      id: 'rag-pipeline',
      name: 'RAG Pipeline',
      nodes: [
        { id: 'api-1', type: 'api', label: 'API Ingress', x: 220, y: 80 },
        { id: 'vectordb-1', type: 'vectordb', label: 'Vector Database', x: 220, y: 220 },
        { id: 'frontier-1', type: 'frontier-model', label: 'Frontier Model', modelId: 'claude-3.5-sonnet', x: 220, y: 360 },
      ],
      edges: [
        { source: 'api-1', target: 'vectordb-1' },
        { source: 'vectordb-1', target: 'frontier-1' },
      ],
    },
    defaultWorkload: {
      requestsPerMonth: 1_000_000,
      avgInputTokens: 2000,
      avgOutputTokens: 600,
      cacheHitRate: 0.0,
      concurrency: 50,
      retrievalsPerRequest: 1,
      toolCallsPerRequest: 0,
    },
  },
  {
    id: 'router-cache',
    name: 'Router + Cache',
    category: 'Infrastructure',
    description: 'Production architecture combining semantic caching with dynamic complexity routing between fast and frontier models.',
    architecture: {
      id: 'router-cache',
      name: 'Router + Cache Architecture',
      nodes: [
        { id: 'api-1', type: 'api', label: 'API Ingress', x: 240, y: 60 },
        { id: 'cache-1', type: 'cache', label: 'Semantic Cache', x: 240, y: 180 },
        { id: 'router-1', type: 'router', label: 'Complexity Router', x: 240, y: 300 },
        { id: 'fast-1', type: 'fast-model', label: 'Fast Model', modelId: 'gpt-4o-mini', x: 120, y: 440 },
        { id: 'frontier-1', type: 'frontier-model', label: 'Frontier Model', modelId: 'gpt-4o', x: 360, y: 440 },
      ],
      edges: [
        { source: 'api-1', target: 'cache-1' },
        { source: 'cache-1', target: 'router-1' },
        { source: 'router-1', target: 'fast-1', trafficShare: 0.70 },
        { source: 'router-1', target: 'frontier-1', trafficShare: 0.30 },
      ],
    },
    defaultWorkload: {
      requestsPerMonth: 2_500_000,
      avgInputTokens: 1200,
      avgOutputTokens: 400,
      cacheHitRate: 0.60,
      concurrency: 50,
      retrievalsPerRequest: 0,
      toolCallsPerRequest: 0,
    },
  },
];

// Default baseline on first load is Template 3 (Router + Cache)
export const DEFAULT_V1_ARCHITECTURE = TEMPLATES[2].architecture;
export const DEFAULT_V1_WORKLOAD = TEMPLATES[2].defaultWorkload;
export const DEFAULT_V1_CALIBRATION: BillCalibration = {
  enabled: false,
  actualBill: 4500,
  actualRequests: 1200000,
  baselineSimulatedCost: 0,
};

// Legacy exports to preserve backward compatibility
export const DEFAULT_SIMPLE_ARCHITECTURE = TEMPLATES[0].architecture;
export const DEFAULT_OPTIMIZED_ARCHITECTURE = TEMPLATES[2].architecture;
export const DEFAULT_WORKLOAD = DEFAULT_V1_WORKLOAD;
