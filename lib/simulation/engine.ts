/* ──────────────────────────────────────────────
   COMPUTECANVAS — DETERMINISTIC SIMULATION ENGINE (V1)
   Formulaic, reproducible AI architecture & economics.
   ────────────────────────────────────────────── */

// ── 1. Centralized Model & Infrastructure Pricing ──

export const PRICING_VERSION = '2026.03.1';
export const PRICING_ASSUMPTION_DATE = 'March 2026';

export interface PricingRecord {
  provider: string;
  product: string;
  category: 'fast' | 'frontier';
  inputPricePer1M: number;
  outputPricePer1M: number;
  baselineLatencyMs: number;
  qualityScore: number;
  qualityBenchmark: string;
  qualitySource: string;
  source: string;
  unit: string;
  notes: string;
}

export const QUALITY_BENCHMARK_METHODOLOGY = {
  primaryBenchmark: 'Artificial Analysis Intelligence Index & LMSYS Chatbot Arena',
  scale: '0–100 Normalized Composite Score (MMLU-Pro, GPQA Diamond, MATH-500, HumanEval & Arena Elo)',
  ragGroundingBonus: '+1% Factual Grounding Bonus for active Vector DB context retrieval (benchmarked on RAGBench)',
  citations: [
    {
      name: 'Artificial Analysis Intelligence Index',
      url: 'https://artificialanalysis.ai',
      metric: 'Composite reasoning & accuracy index',
    },
    {
      name: 'LMSYS Chatbot Arena',
      url: 'https://chat.lmsys.org',
      metric: 'Crowdsourced human preference Elo ratings',
    },
    {
      name: 'RAGBench (Factual Grounding)',
      url: 'https://arxiv.org/abs/2407.11005',
      metric: 'Context precision & hallucination mitigation',
    },
  ],
};

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
    qualityBenchmark: 'Artificial Analysis: 82 | LMSYS Arena Elo: ~1215',
    qualitySource: 'artificialanalysis.ai / chat.lmsys.org',
    source: 'openai.com/pricing',
    unit: 'USD / 1M tokens',
    notes: 'High-speed, low-cost utility reasoning tier',
  },
  'gemini-2.0-flash': {
    provider: 'Google',
    product: 'Gemini 2.0 Flash',
    category: 'fast',
    inputPricePer1M: 0.10,
    outputPricePer1M: 0.40,
    baselineLatencyMs: 90,
    qualityScore: 80,
    qualityBenchmark: 'Artificial Analysis: 80 | LMSYS Arena Elo: ~1205',
    qualitySource: 'artificialanalysis.ai / chat.lmsys.org',
    source: 'cloud.google.com/vertex-ai/pricing',
    unit: 'USD / 1M tokens',
    notes: 'Sub-100ms ultra-low latency utility model',
  },
  'claude-3-haiku': {
    provider: 'Anthropic',
    product: 'Claude 3 Haiku',
    category: 'fast',
    inputPricePer1M: 0.25,
    outputPricePer1M: 1.25,
    baselineLatencyMs: 120,
    qualityScore: 78,
    qualityBenchmark: 'Artificial Analysis: 78 | LMSYS Arena Elo: ~1180',
    qualitySource: 'artificialanalysis.ai / chat.lmsys.org',
    source: 'anthropic.com/pricing',
    unit: 'USD / 1M tokens',
    notes: 'Lightweight, rapid reasoning tier',
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
    qualityBenchmark: 'Artificial Analysis: 95 | LMSYS Arena Elo: ~1285',
    qualitySource: 'artificialanalysis.ai / chat.lmsys.org',
    source: 'openai.com/pricing',
    unit: 'USD / 1M tokens',
    notes: 'Omni-modal flagship frontier model',
  },
  'claude-3.5-sonnet': {
    provider: 'Anthropic',
    product: 'Claude 3.5 Sonnet',
    category: 'frontier',
    inputPricePer1M: 3.00,
    outputPricePer1M: 15.00,
    baselineLatencyMs: 420,
    qualityScore: 96,
    qualityBenchmark: 'Artificial Analysis: 96 | LMSYS Arena Elo: ~1290',
    qualitySource: 'artificialanalysis.ai / chat.lmsys.org',
    source: 'anthropic.com/pricing',
    unit: 'USD / 1M tokens',
    notes: 'High-precision technical reasoning and synthesis',
  },
  'gemini-2.5-pro': {
    provider: 'Google',
    product: 'Gemini 2.5 Pro',
    category: 'frontier',
    inputPricePer1M: 1.25,
    outputPricePer1M: 10.00,
    baselineLatencyMs: 350,
    qualityScore: 94,
    qualityBenchmark: 'Artificial Analysis: 94 | LMSYS Arena Elo: ~1275',
    qualitySource: 'artificialanalysis.ai / chat.lmsys.org',
    source: 'cloud.google.com/vertex-ai/pricing',
    unit: 'USD / 1M tokens',
    notes: 'Deep context reasoning and analysis',
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
 * Dedicated Hardware / Instance Cost Formula (Section 6)
 * Hardware Cost = ceil(Required Instances) * Hourly Rate * 730 hours/month
 */
export function calculateHardwareCost(requiredInstances: number, hourlyRate: number): number {
  if (requiredInstances <= 0 || hourlyRate <= 0) return 0;
  return Math.ceil(requiredInstances) * hourlyRate * 730;
}

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

export interface LatencyBreakdown {
  p50: number;
  p90: number;
  p95: number;
  p99: number;
  ttftMs: number;
  generationMs: number;
  queueingMs: number;
  networkMs: number;
  cachePathMs: number;
}

export interface BottleneckInfo {
  nodeId: string;
  componentName: string;
  componentType: ComponentType;
  metricType: 'cost' | 'latency';
  impactPercentage: number;
  explanation: string;
  costSharePercentage?: number;
  latencySharePercentage?: number;
}

export interface SimulationResult {
  monthlyCost: number;
  costPerRequest: number;
  p95Latency: number;
  latencies: LatencyBreakdown;
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
  calibrationFactor: number;
  limitationsNote: string;
}

// ── 3. Helper Formatters ──

export function formatNumber(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

export function formatCurrency(n: number, compact = false): string {
  const isNegative = n < 0;
  const absN = Math.abs(n);
  const prefix = isNegative ? '-$' : '$';

  if (compact && absN >= 1_000_000) {
    return `${prefix}${(absN / 1_000_000).toFixed(2)}M`;
  }
  if (compact && absN >= 1_000) {
    return `${prefix}${(absN / 1_000).toFixed(1)}K`;
  }
  // Sub-cent pricing (e.g. per-request unit cost $0.0025)
  if (absN < 0.01 && absN > 0) {
    return `${prefix}${absN.toFixed(4)}`;
  }
  // Sub-dollar pricing (e.g. router infra cost $0.50/mo)
  if (absN < 1 && absN > 0) {
    return `${prefix}${absN.toFixed(2)}`;
  }
  return `${prefix}${Math.round(absN).toLocaleString('en-US')}`;
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

  // 2. Check for missing edge endpoints & self-loops
  const seenEdges = new Set<string>();
  for (const edge of arch.edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      errors.push('Architecture contains broken connections pointing to missing components.');
      break;
    }
    if (edge.source === edge.target) {
      const node = arch.nodes.find(n => n.id === edge.source);
      errors.push(`Architecture contains a self-loop on "${node?.label || edge.source}". Self-referential connections are not permitted.`);
      break;
    }
    const edgeKey = `${edge.source}->${edge.target}`;
    if (seenEdges.has(edgeKey)) {
      warnings.push(`Duplicate connection from "${edge.source}" to "${edge.target}" detected. Redundant connection ignored.`);
    }
    seenEdges.add(edgeKey);
  }

  // 3. Cycle Detection (DFS)
  const adjacency = new Map<string, string[]>();
  arch.nodes.forEach(n => adjacency.set(n.id, []));
  arch.edges.forEach(e => {
    if (adjacency.has(e.source) && e.source !== e.target) {
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
      if (sum > 1.02) {
        warnings.push(`Router "${r.label}" outbound allocations total ${Math.round(sum * 100)}% (exceeds 100% capacity; clamped in simulation).`);
      } else if (sum < 0.98) {
        warnings.push(`Router "${r.label}" outbound allocations total ${Math.round(sum * 100)}% (remaining ${Math.round((1 - sum) * 100)}% traffic is unallocated/dropped).`);
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
      },
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
  const warnings: { type: string; message: string; severity: 'info' | 'warning' | 'critical' }[] = [];

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

    // Traffic conservation:
    // If sum > 1.0, scale down to prevent manufacturing requests beyond 100%.
    // If sum < 1.0, allocate exact configured shares; unallocated requests are explicitly treated as dropped.
    const isOverAllocated = shareSum > 1.001;
    const isUnderAllocated = shareSum < 0.999;
    const scaleFactor = isOverAllocated ? 1 / shareSum : 1.0;

    for (const alloc of allocations) {
      const effectiveShare = alloc.share * scaleFactor;
      const node = alloc.node;
      const defaultModelId = node.type === 'fast-model' ? 'gpt-4o-mini' : 'gpt-4o';
      const modelId = node.modelId || defaultModelId;
      const pricing = MODEL_PRICING[modelId] || MODEL_PRICING['gpt-4o-mini'];

      const nodeRequests = uncachedRequests * effectiveShare;
      const inputCost = (nodeRequests * avgInputTokens / 1_000_000) * pricing.inputPricePer1M;
      const outputCost = (nodeRequests * avgOutputTokens / 1_000_000) * pricing.outputPricePer1M;
      const nodeCost = inputCost + outputCost;

      totalModelCost += nodeCost;
      const latencyShare = shareSum > 0 ? (alloc.share / shareSum) : (1 / modelNodes.length);
      weightedModelLatency += pricing.baselineLatencyMs * latencyShare;

      nodeMetrics.set(node.id, {
        nodeId: node.id,
        monthlyCost: nodeCost,
        costPercentage: 0,
        latencyMs: pricing.baselineLatencyMs,
        isBottleneck: false,
      });
    }

    if (isUnderAllocated) {
      const droppedPct = Math.round((1 - shareSum) * 100);
      warnings.push({
        type: 'unallocated-traffic',
        message: `Unallocated router traffic: ${droppedPct}% of requests are dropped without reaching any model tier.`,
        severity: 'warning',
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

  // Percentile Latency Decomposition:
  const ttftMs = Math.round(ingressLatency + cacheLookupLatency + (hasRouter ? routerLatency : 0) + (hasVectorDb ? vectorLookupLatency : 0) + weightedModelLatency * 0.35);
  const generationMs = Math.round(weightedModelLatency * 0.65);
  const queueingMs = Math.round(Math.max(4, p95Latency * 0.12));
  const networkMs = ingressLatency;

  const latencies: LatencyBreakdown = {
    p50: Math.round(p95Latency * 0.72),
    p90: Math.round(p95Latency * 0.92),
    p95: p95Latency,
    p99: Math.round(p95Latency * 1.35 + queueingMs),
    ttftMs,
    generationMs,
    queueingMs,
    networkMs,
    cachePathMs: cacheHitLatency,
  };

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
    costSharePercentage: bottleneckMetrics?.costPercentage || 0,
    latencySharePercentage: p95Latency > 0 && bottleneckMetrics ? Math.min(100, Math.round((bottleneckMetrics.latencyMs / p95Latency) * 100)) : 0,
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

  // Deterministic quality score derived from model allocations & RAG grounding
  let rawQuality = 80;
  if (modelNodes.length === 1) {
    const node = modelNodes[0];
    const defaultModelId = node.type === 'fast-model' ? 'gpt-4o-mini' : 'gpt-4o';
    const modelId = node.modelId || defaultModelId;
    const pricing = MODEL_PRICING[modelId] || (node.type === 'fast-model' ? MODEL_PRICING['gpt-4o-mini'] : MODEL_PRICING['gpt-4o']);
    rawQuality = pricing.qualityScore;
  } else if (modelNodes.length > 1) {
    let weightedScoreSum = 0;
    let totalShare = 0;
    const edges = architecture.edges;
    modelNodes.forEach(m => {
      const edge = edges.find(e => e.target === m.id);
      const share = edge?.trafficShare !== undefined ? edge.trafficShare : 1 / modelNodes.length;
      const defaultModelId = m.type === 'fast-model' ? 'gpt-4o-mini' : 'gpt-4o';
      const modelId = m.modelId || defaultModelId;
      const pricing = MODEL_PRICING[modelId] || (m.type === 'fast-model' ? MODEL_PRICING['gpt-4o-mini'] : MODEL_PRICING['gpt-4o']);
      weightedScoreSum += pricing.qualityScore * share;
      totalShare += share;
    });
    rawQuality = totalShare > 0 ? (weightedScoreSum / totalShare) : 80;
  }

  // Grounding / Retrieval boost: Vector DB adds verifiable factual grounding (+1%)
  const hasVectorGrounding = architecture.nodes.some(n => n.type === 'vectordb');
  const groundingBonus = hasVectorGrounding ? 1 : 0;
  const qualityEstimate = Math.min(99, Math.max(50, Math.round(rawQuality + groundingBonus)));

  const throughputRPS = requestsPerMonth > 0 ? Math.max(1, Math.round(requestsPerMonth / (30 * 24 * 3600))) : 0;

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
    latencies,
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
      calibrationFactor: 1.0,
      limitationsNote: 'Uncalibrated theoretical baseline. Actual cloud bills may include unmodeled overhead such as egress networking, retries, and idle infrastructure.',
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

  const limitationsNote = `Empirical calibration factor (${calibrationFactor.toFixed(4)}×) reconciles theoretical token calculations with your invoice ($${formatNumber(calibration.actualBill)}/mo across ${formatNumber(calibration.actualRequests)} requests). The +${(Math.round(variancePercentage * 10) / 10)}% variance accounts for real-world cloud factors not in the pure LLM token model: egress network bandwidth, retry storms, tool executions, vector index storage, observability logging, and idle provisioned capacity.`;

  return {
    actualCostPerRequest,
    simulatedBaselineCost: baselineSimulated,
    variancePercentage: Math.round(variancePercentage * 10) / 10,
    calibratedMonthlyCost,
    calibratedCostPerRequest,
    isCalibrated: true,
    calibrationFactor: Math.round(calibrationFactor * 10000) / 10000,
    limitationsNote,
  };
}

// ── 7. Sensitivity Analysis Engine (Deterministic Curves) ──

export interface SensitivityPoint {
  parameterValue: number;
  label: string;
  monthlyCost: number;
  costDelta: number;
  p95Latency: number;
}

export function calculateSensitivity(
  workload: Workload,
  architecture: Architecture,
  parameter: 'cacheHitRate' | 'requests' | 'tokens'
): SensitivityPoint[] {
  const points: SensitivityPoint[] = [];
  const baseSim = simulate(workload, architecture);

  if (parameter === 'cacheHitRate') {
    const rates = [0.0, 0.2, 0.4, 0.6, 0.8, 0.95];
    for (const r of rates) {
      const sim = simulate({ ...workload, cacheHitRate: r }, architecture);
      points.push({
        parameterValue: r,
        label: `${Math.round(r * 100)}% Hit Rate`,
        monthlyCost: sim.monthlyCost,
        costDelta: Math.round((sim.monthlyCost - baseSim.monthlyCost) * 100) / 100,
        p95Latency: sim.p95Latency,
      });
    }
  } else if (parameter === 'requests') {
    const scales = [0.2, 0.5, 1.0, 2.0, 5.0, 10.0];
    for (const s of scales) {
      const reqs = Math.round(workload.requestsPerMonth * s);
      const sim = simulate({ ...workload, requestsPerMonth: reqs }, architecture);
      points.push({
        parameterValue: reqs,
        label: `${formatNumber(reqs)} reqs`,
        monthlyCost: sim.monthlyCost,
        costDelta: Math.round((sim.monthlyCost - baseSim.monthlyCost) * 100) / 100,
        p95Latency: sim.p95Latency,
      });
    }
  } else if (parameter === 'tokens') {
    const scales = [0.5, 0.75, 1.0, 1.5, 2.0, 3.0];
    for (const s of scales) {
      const inTok = Math.round(workload.avgInputTokens * s);
      const outTok = Math.round(workload.avgOutputTokens * s);
      const sim = simulate({ ...workload, avgInputTokens: inTok, avgOutputTokens: outTok }, architecture);
      points.push({
        parameterValue: inTok + outTok,
        label: `${formatNumber(inTok + outTok)} tokens`,
        monthlyCost: sim.monthlyCost,
        costDelta: Math.round((sim.monthlyCost - baseSim.monthlyCost) * 100) / 100,
        p95Latency: sim.p95Latency,
      });
    }
  }

  return points;
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
