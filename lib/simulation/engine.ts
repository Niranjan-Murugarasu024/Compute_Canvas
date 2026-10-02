/* ──────────────────────────────────────────────
   COMPUTECANVAS — DETERMINISTIC SIMULATION ENGINE (V1)
   Formulaic, reproducible AI architecture & economics.
   ────────────────────────────────────────────── */

// ── 1. Model Engine Metadata & Assumptions Registry ──

export const MODEL_METADATA = {
  engineVersion: 'v1.0',
  pricingAssumptionsDate: 'March 2026',
  latencyAssumptionsDate: 'March 2026',
  specification: 'ComputeCanvas Production Deterministic Engine',
};

export const PRICING_VERSION = '2026.03.1';
export const PRICING_ASSUMPTION_DATE = 'March 2026';

export type AssumptionSourceType = 'PROVIDER' | 'BENCHMARK' | 'INTERNAL REFERENCE' | 'DERIVED';

export interface ModelAssumption {
  id: string;
  name: string;
  value: number | string;
  unit: string;
  source: string;
  sourceType?: AssumptionSourceType;
  snapshot?: string;
  sourceUrl?: string;
  effectiveDate: string;
  notes: string;
  category: 'pricing' | 'latency' | 'infrastructure' | 'traffic';
}

export const ASSUMPTION_REGISTRY: ModelAssumption[] = [
  {
    id: 'gpt-4o-mini-in',
    name: 'GPT-4o Mini Input Price',
    value: 0.15,
    unit: 'USD / 1M tokens',
    source: 'OpenAI Pricing Table',
    sourceType: 'PROVIDER',
    snapshot: '2026-03',
    sourceUrl: 'https://openai.com/pricing',
    effectiveDate: 'March 2026',
    notes: 'Low-latency utility reasoning model input rate.',
    category: 'pricing',
  },
  {
    id: 'gpt-4o-mini-out',
    name: 'GPT-4o Mini Output Price',
    value: 0.60,
    unit: 'USD / 1M tokens',
    source: 'OpenAI Pricing Table',
    sourceType: 'PROVIDER',
    snapshot: '2026-03',
    sourceUrl: 'https://openai.com/pricing',
    effectiveDate: 'March 2026',
    notes: 'Low-latency utility reasoning model output rate.',
    category: 'pricing',
  },
  {
    id: 'gemini-2-flash-in',
    name: 'Gemini 2.0 Flash Input Price',
    value: 0.10,
    unit: 'USD / 1M tokens',
    source: 'Google Cloud Vertex AI Pricing',
    sourceType: 'PROVIDER',
    snapshot: '2026-03',
    sourceUrl: 'https://cloud.google.com/vertex-ai/pricing',
    effectiveDate: 'March 2026',
    notes: 'Sub-100ms ultra-low latency utility model.',
    category: 'pricing',
  },
  {
    id: 'gemini-2-flash-out',
    name: 'Gemini 2.0 Flash Output Price',
    value: 0.40,
    unit: 'USD / 1M tokens',
    source: 'Google Cloud Vertex AI Pricing',
    sourceType: 'PROVIDER',
    snapshot: '2026-03',
    sourceUrl: 'https://cloud.google.com/vertex-ai/pricing',
    effectiveDate: 'March 2026',
    notes: 'Sub-100ms ultra-low latency utility model.',
    category: 'pricing',
  },
  {
    id: 'claude-3-haiku-in',
    name: 'Claude 3 Haiku Input Price',
    value: 0.25,
    unit: 'USD / 1M tokens',
    source: 'Anthropic Pricing API',
    sourceType: 'PROVIDER',
    snapshot: '2026-03',
    sourceUrl: 'https://anthropic.com/pricing',
    effectiveDate: 'March 2026',
    notes: 'Lightweight rapid reasoning tier.',
    category: 'pricing',
  },
  {
    id: 'claude-3-haiku-out',
    name: 'Claude 3 Haiku Output Price',
    value: 1.25,
    unit: 'USD / 1M tokens',
    source: 'Anthropic Pricing API',
    sourceType: 'PROVIDER',
    snapshot: '2026-03',
    sourceUrl: 'https://anthropic.com/pricing',
    effectiveDate: 'March 2026',
    notes: 'Lightweight rapid reasoning tier.',
    category: 'pricing',
  },
  {
    id: 'gpt-4o-in',
    name: 'GPT-4o Input Price',
    value: 2.50,
    unit: 'USD / 1M tokens',
    source: 'OpenAI Pricing Table',
    sourceType: 'PROVIDER',
    snapshot: '2026-03',
    sourceUrl: 'https://openai.com/pricing',
    effectiveDate: 'March 2026',
    notes: 'Omni-modal flagship frontier model input rate.',
    category: 'pricing',
  },
  {
    id: 'gpt-4o-out',
    name: 'GPT-4o Output Price',
    value: 10.00,
    unit: 'USD / 1M tokens',
    source: 'OpenAI Pricing Table',
    sourceType: 'PROVIDER',
    snapshot: '2026-03',
    sourceUrl: 'https://openai.com/pricing',
    effectiveDate: 'March 2026',
    notes: 'Omni-modal flagship frontier model output rate.',
    category: 'pricing',
  },
  {
    id: 'claude-3-5-sonnet-in',
    name: 'Claude 3.5 Sonnet Input Price',
    value: 3.00,
    unit: 'USD / 1M tokens',
    source: 'Anthropic Pricing API',
    sourceType: 'PROVIDER',
    snapshot: '2026-03',
    sourceUrl: 'https://anthropic.com/pricing',
    effectiveDate: 'March 2026',
    notes: 'High-precision technical synthesis input rate.',
    category: 'pricing',
  },
  {
    id: 'claude-3-5-sonnet-out',
    name: 'Claude 3.5 Sonnet Output Price',
    value: 15.00,
    unit: 'USD / 1M tokens',
    source: 'Anthropic Pricing API',
    sourceType: 'PROVIDER',
    snapshot: '2026-03',
    sourceUrl: 'https://anthropic.com/pricing',
    effectiveDate: 'March 2026',
    notes: 'High-precision technical synthesis output rate.',
    category: 'pricing',
  },
  {
    id: 'gemini-2-5-pro-in',
    name: 'Gemini 2.5 Pro Input Price',
    value: 1.25,
    unit: 'USD / 1M tokens',
    source: 'Google Cloud Vertex AI Pricing',
    sourceType: 'PROVIDER',
    snapshot: '2026-03',
    sourceUrl: 'https://cloud.google.com/vertex-ai/pricing',
    effectiveDate: 'March 2026',
    notes: 'Deep context reasoning input rate.',
    category: 'pricing',
  },
  {
    id: 'gemini-2-5-pro-out',
    name: 'Gemini 2.5 Pro Output Price',
    value: 10.00,
    unit: 'USD / 1M tokens',
    source: 'Google Cloud Vertex AI Pricing',
    sourceType: 'PROVIDER',
    snapshot: '2026-03',
    sourceUrl: 'https://cloud.google.com/vertex-ai/pricing',
    effectiveDate: 'March 2026',
    notes: 'Deep context reasoning output rate.',
    category: 'pricing',
  },
  {
    id: 'redis-cache-base',
    name: 'Semantic Cache Base Pod',
    value: 65.00,
    unit: 'USD / instance-month',
    source: 'Redis Cloud Standard Tier',
    sourceType: 'PROVIDER',
    snapshot: '2026-03',
    sourceUrl: 'https://redis.io/pricing',
    effectiveDate: 'March 2026',
    notes: 'In-memory prompt & embedding cache instance.',
    category: 'infrastructure',
  },
  {
    id: 'vector-db-base',
    name: 'Vector Database Base Cluster',
    value: 120.00,
    unit: 'USD / cluster-month',
    source: 'Pinecone / Qdrant Cloud Standard Pod',
    sourceType: 'PROVIDER',
    snapshot: '2026-03',
    sourceUrl: 'https://pinecone.io/pricing',
    effectiveDate: 'March 2026',
    notes: 'Base indexing pod for nearest-neighbor approximate search.',
    category: 'infrastructure',
  },
  {
    id: 'api-gateway-rate',
    name: 'API Gateway Ingress Tariff',
    value: 1.00,
    unit: 'USD / 1M requests',
    source: 'Internal reference assumption (AWS API Gateway / Cloudflare)',
    sourceType: 'INTERNAL REFERENCE',
    snapshot: '2026-03',
    effectiveDate: 'March 2026',
    notes: 'TLS termination, edge rate limiting, and request ingress.',
    category: 'infrastructure',
  },
  {
    id: 'router-compute-rate',
    name: 'Complexity Router Compute Tariff',
    value: 0.50,
    unit: 'USD / 1M requests',
    source: 'Internal reference assumption (Edge Worker / Classification)',
    sourceType: 'INTERNAL REFERENCE',
    snapshot: '2026-03',
    effectiveDate: 'March 2026',
    notes: 'Heuristic prompt intent classification and steering compute.',
    category: 'infrastructure',
  },
];

export interface PricingRecord {
  provider: string;
  product: string;
  category: 'fast' | 'frontier';
  inputPricePer1M: number;
  outputPricePer1M: number;
  baselineLatencyMs: number;
  capabilityTier: 'Fast Utility' | 'Frontier Reasoning';
  capabilityDescription: string;
  source: string;
  sourceType?: AssumptionSourceType;
  pricingSnapshot?: string;
  registryVersion?: string;
  status?: 'ACTIVE' | 'HISTORICAL' | 'DEPRECATED';
  unit: string;
  notes: string;
  // Optional backward compatibility
  qualityScore?: number;
  qualityBenchmark?: string;
  qualitySource?: string;
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
    capabilityTier: 'Fast Utility',
    capabilityDescription: 'High-speed utility tier optimized for extraction, classification, and sub-150ms workflows.',
    sourceType: 'PROVIDER',
    pricingSnapshot: 'March 2026',
    registryVersion: 'v1.4',
    status: 'ACTIVE',
    qualityScore: 82, // Deprecated compatibility
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
    capabilityTier: 'Fast Utility',
    capabilityDescription: 'Sub-100ms ultra-low latency model for high-throughput streaming and high-volume workloads.',
    sourceType: 'PROVIDER',
    pricingSnapshot: 'March 2026',
    registryVersion: 'v1.4',
    status: 'ACTIVE',
    qualityScore: 80, // Deprecated compatibility
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
    capabilityTier: 'Fast Utility',
    capabilityDescription: 'Lightweight rapid reasoning tier for customer support triage and data parsing.',
    sourceType: 'PROVIDER',
    pricingSnapshot: 'March 2026',
    registryVersion: 'v1.4',
    status: 'ACTIVE',
    qualityScore: 78, // Deprecated compatibility
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
    capabilityTier: 'Frontier Reasoning',
    capabilityDescription: 'Omni-modal flagship frontier model for complex logic, multi-step agent actions, and code.',
    sourceType: 'PROVIDER',
    pricingSnapshot: 'March 2026',
    registryVersion: 'v1.4',
    status: 'ACTIVE',
    qualityScore: 95, // Deprecated compatibility
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
    capabilityTier: 'Frontier Reasoning',
    capabilityDescription: 'High-precision technical reasoning, codebase architecture, and comprehensive document synthesis.',
    sourceType: 'PROVIDER',
    pricingSnapshot: 'March 2026',
    registryVersion: 'v1.4',
    status: 'ACTIVE',
    qualityScore: 96, // Deprecated compatibility
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
    capabilityTier: 'Frontier Reasoning',
    capabilityDescription: 'Deep context reasoning, mathematical logic, and multi-modal analysis.',
    sourceType: 'PROVIDER',
    pricingSnapshot: 'March 2026',
    registryVersion: 'v1.4',
    status: 'ACTIVE',
    qualityScore: 94, // Deprecated compatibility
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

export interface CostSubsystemItem {
  id: string;
  name: string;
  type: ComponentType;
  monthlyCost: number;
  sharePercentage: number;
  description: string;
  unitRateDescription: string;
}

export interface CostBreakdown {
  models: number;
  cache: number;
  vectorDb: number;
  ingress: number;
  router: number;
  total: number;
  subsystems: CostSubsystemItem[];
  model: number;
  compute: number;
  network: number;
  observability: number;
}

export interface LatencyCriticalPathSegment {
  /** Display label for the segment */
  label: string;
  /** Original field name preserved for backward compat */
  componentType: string;
  /** Base latency value in ms */
  latencyMs: number;
  sharePercentage: number;
  // Extended fields used by the latency modal
  componentId: string;
  componentName: string;
  type: string;
  baseLatencyMs: number;
  trafficFactor: number;
  effectiveLatencyMs: number;
  notes: string;
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
  criticalPathMs: number;
  criticalPathSegments: LatencyCriticalPathSegment[];
  latencyDisclaimer: string;
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

export type CapabilityTier =
  | 'Frontier Reasoning'
  | 'Blended Routing'
  | 'Fast Utility'
  | 'Context-Grounded Frontier'
  | 'Quality Not Modeled';

export interface ModelCalculationDetail {
  nodeId: string;
  modelName: string;
  modelId: string;
  trafficShare: number;
  routedRequests: number;
  inputTokens: number;
  outputTokens: number;
  inputPricePer1M: number;
  outputPricePer1M: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
}

export interface CalculationTrace {
  totalRequests: number;
  cacheHitRate: number;
  cachedRequests: number;
  uncachedRequests: number;
  avgInputTokens: number;
  avgOutputTokens: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  modelInputCost: number;
  modelOutputCost: number;
  totalModelCost: number;
  cacheCost: number;
  ingressCost: number;
  routerCost: number;
  vectorDbCost: number;
  totalCost: number;
  costPerRequest: number;
  models: ModelCalculationDetail[];
}

export interface SimulationResult {
  monthlyCost: number;
  costPerRequest: number;
  p95Latency: number;
  latencies: LatencyBreakdown;
  capacityUtilization: number;
  capabilityTier: CapabilityTier;
  capabilityDescription: string;
  qualityEstimate?: number; // Optional deprecated backward compatibility
  throughputRPS: number;
  costBreakdown: CostBreakdown;
  bottleneck: BottleneckInfo;
  nodeMetrics: Map<string, NodeEconomics>;
  validation: ArchitectureValidation;
  warnings: { type: string; message: string; severity: 'info' | 'warning' | 'critical' }[];
  assumptions: { category: string; detail: string }[];
  calculationTrace?: CalculationTrace;
}

export interface CalibratedEconomics {
  actualCostPerRequest: number;
  simulatedBaselineCost: number;
  variancePercentage: number;
  calibratedMonthlyCost: number;
  calibratedCostPerRequest: number;
  isCalibrated: boolean;
  calibrationFactor: number;
  confidenceLevel: 'High Confidence' | 'Moderate Confidence' | 'Low Confidence';
  confidenceNotes: string;
  limitationsNote: string;
  /** The actual historical bill provided by the user (from BillCalibration.actualBill) */
  actualHistoricalBill: number;
  /** The actual historical request count provided by the user (from BillCalibration.actualRequests) */
  historicalRequests: number;
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
      if (sum > 1.01) {
        errors.push(`INVALID ROUTING: Router "${r.label}" outbound allocations total ${Math.round(sum * 100)}% (exceeds 100% capacity). Reduce allocations to 100% or less to simulate.`);
      } else if (sum < 0.99) {
        warnings.push(`UNALLOCATED TRAFFIC: Router "${r.label}" outbound allocations total ${Math.round(sum * 100)}% (${Math.round((1 - sum) * 100)}% unallocated/dropped traffic).`);
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
      },
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
  let modelInputCostTotal = 0;
  let modelOutputCostTotal = 0;
  const modelCalculationDetails: ModelCalculationDetail[] = [];
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

    modelInputCostTotal += inputCost;
    modelOutputCostTotal += outputCost;
    totalModelCost += nodeCost;
    weightedModelLatency = pricing.baselineLatencyMs;

    modelCalculationDetails.push({
      nodeId: node.id,
      modelName: node.label || pricing.product,
      modelId,
      trafficShare: 1.0,
      routedRequests: Math.round(uncachedRequests),
      inputTokens: Math.round(uncachedRequests * avgInputTokens),
      outputTokens: Math.round(uncachedRequests * avgOutputTokens),
      inputPricePer1M: pricing.inputPricePer1M,
      outputPricePer1M: pricing.outputPricePer1M,
      inputCost: Math.round(inputCost * 100) / 100,
      outputCost: Math.round(outputCost * 100) / 100,
      totalCost: Math.round(nodeCost * 100) / 100,
    });

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

      modelInputCostTotal += inputCost;
      modelOutputCostTotal += outputCost;
      totalModelCost += nodeCost;
      const latencyShare = shareSum > 0 ? (alloc.share / shareSum) : (1 / modelNodes.length);
      weightedModelLatency += pricing.baselineLatencyMs * latencyShare;

      modelCalculationDetails.push({
        nodeId: node.id,
        modelName: node.label || pricing.product,
        modelId,
        trafficShare: effectiveShare,
        routedRequests: Math.round(nodeRequests),
        inputTokens: Math.round(nodeRequests * avgInputTokens),
        outputTokens: Math.round(nodeRequests * avgOutputTokens),
        inputPricePer1M: pricing.inputPricePer1M,
        outputPricePer1M: pricing.outputPricePer1M,
        inputCost: Math.round(inputCost * 100) / 100,
        outputCost: Math.round(outputCost * 100) / 100,
        totalCost: Math.round(nodeCost * 100) / 100,
      });

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

  // MODELED TAIL LATENCY (labeled as p95Latency for interface compatibility):
  // This is a weighted-average latency estimate across the request path.
  // It is NOT a statistically-derived P95 from a latency distribution.
  // Cache hits: Ingress + Cache Lookup
  // Cache misses: Ingress + Cache Lookup + Router + Vector DB + Model Inference
  // Result: cache-hit-rate weighted combination of both paths.
  const cacheHitLatency = ingressLatency + cacheLookupLatency;
  const cacheMissLatency = ingressLatency + cacheLookupLatency + routerLatency + vectorLookupLatency + weightedModelLatency;
  const p95Latency = Math.round(effectiveCacheRate * cacheHitLatency + (1 - effectiveCacheRate) * cacheMissLatency);

  // Percentile Latency Decomposition:
  const ttftMs = Math.round(ingressLatency + cacheLookupLatency + (hasRouter ? routerLatency : 0) + (hasVectorDb ? vectorLookupLatency : 0) + weightedModelLatency * 0.35);
  const generationMs = Math.round(weightedModelLatency * 0.65);
  const queueingMs = Math.round(Math.max(4, p95Latency * 0.12));
  const networkMs = ingressLatency;

  const criticalPathSegments: LatencyCriticalPathSegment[] = [];
  criticalPathSegments.push({
    label: 'API Ingress Gateway',
    componentType: 'api',
    latencyMs: ingressLatency,
    sharePercentage: p95Latency > 0 ? Math.round((ingressLatency / p95Latency) * 100) : 0,
    componentId: 'api-ingress',
    componentName: 'API Ingress Gateway',
    type: 'api',
    baseLatencyMs: ingressLatency,
    trafficFactor: 1.0,
    effectiveLatencyMs: ingressLatency,
    notes: 'TLS handshake + edge routing',
  });
  if (hasCache) {
    criticalPathSegments.push({
      label: 'Semantic Cache Lookup',
      componentType: 'cache',
      latencyMs: cacheLookupLatency,
      sharePercentage: p95Latency > 0 ? Math.round((cacheLookupLatency / p95Latency) * 100) : 0,
      componentId: 'cache-lookup',
      componentName: 'Semantic Cache Lookup',
      type: 'cache',
      baseLatencyMs: cacheLookupLatency,
      trafficFactor: 1.0,
      effectiveLatencyMs: cacheLookupLatency,
      notes: 'Redis embedding similarity scan',
    });
  }
  if (hasRouter) {
    criticalPathSegments.push({
      label: 'Complexity Router',
      componentType: 'router',
      latencyMs: routerLatency,
      sharePercentage: p95Latency > 0 ? Math.round((routerLatency / p95Latency) * 100) : 0,
      componentId: 'router',
      componentName: 'Complexity Router',
      type: 'router',
      baseLatencyMs: routerLatency,
      trafficFactor: 1.0,
      effectiveLatencyMs: routerLatency,
      notes: 'Intent classification dispatch',
    });
  }
  if (hasVectorDb) {
    criticalPathSegments.push({
      label: 'Vector DB Retrieval',
      componentType: 'vectordb',
      latencyMs: vectorLookupLatency,
      sharePercentage: p95Latency > 0 ? Math.round((vectorLookupLatency / p95Latency) * 100) : 0,
      componentId: 'vectordb-retrieval',
      componentName: 'Vector DB Retrieval',
      type: 'vectordb',
      baseLatencyMs: vectorLookupLatency,
      trafficFactor: 1.0,
      effectiveLatencyMs: vectorLookupLatency,
      notes: 'ANN similarity search + index scan',
    });
  }
  if (modelNodes.length > 0) {
    criticalPathSegments.push({
      label: 'Model Inference',
      componentType: 'model',
      latencyMs: Math.round(weightedModelLatency),
      sharePercentage: p95Latency > 0 ? Math.round((weightedModelLatency / p95Latency) * 100) : 0,
      componentId: 'model-inference',
      componentName: 'Model Inference',
      type: 'model',
      baseLatencyMs: Math.round(weightedModelLatency),
      trafficFactor: 1.0,
      effectiveLatencyMs: Math.round(weightedModelLatency),
      notes: 'Token generation + TTFT (weighted across active models)',
    });
  }

  // Latency percentile methodology note:
  // p50/p90/p99 are deterministic multipliers applied to the modeled tail estimate.
  // They are NOT derived from a statistical latency distribution.
  // All values should be read as model-derived approximations, not observed production percentiles.
  const latencies: LatencyBreakdown = {
    p50: Math.round(p95Latency * 0.72),  // deterministic multiplier — not observed P50
    p90: Math.round(p95Latency * 0.92),  // deterministic multiplier — not observed P90
    p95: p95Latency,                      // weighted-average path estimate — not observed P95
    p99: Math.round(p95Latency * 1.35 + queueingMs), // deterministic multiplier — not observed P99
    ttftMs,
    generationMs,
    queueingMs,
    networkMs,
    cachePathMs: cacheHitLatency,
    criticalPathMs: p95Latency,
    criticalPathSegments,
    latencyDisclaimer: 'Modeled tail latency is a weighted-average path estimate across cache-hit and cache-miss request paths. P50/P90/P95/P99 labels use deterministic multipliers — they are not derived from a production latency distribution.',
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

  const subsystems: CostSubsystemItem[] = [];
  if (totalModelCost > 0) {
    subsystems.push({
      id: 'model-inference',
      name: 'Model Inference',
      type: 'frontier-model',
      monthlyCost: Math.round(totalModelCost * 100) / 100,
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
      monthlyCost: Math.round(cacheCost * 100) / 100,
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
      monthlyCost: Math.round(vectorDbCost * 100) / 100,
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
      monthlyCost: Math.round(ingressCost * 100) / 100,
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
      monthlyCost: Math.round(routerCost * 100) / 100,
      sharePercentage: totalCost > 0 ? Math.round((routerCost / totalCost) * 100) : 0,
      description: 'Intent classification and dispatch compute tariff',
      unitRateDescription: '$0.50/1M requests — routing classification at edge gateway tier',
    });
  }

  const costBreakdown: CostBreakdown = {
    models: Math.round(totalModelCost * 100) / 100,
    cache: Math.round(cacheCost * 100) / 100,
    vectorDb: Math.round(vectorDbCost * 100) / 100,
    ingress: Math.round(ingressCost * 100) / 100,
    router: Math.round(routerCost * 100) / 100,
    total: totalCost,
    subsystems,
    model: Math.round(totalModelCost * 100) / 100,
    compute: Math.round(cacheCost * 100) / 100,
    network: Math.round((ingressCost + routerCost) * 100) / 100,
    observability: 0,
  };

  const capacityUtilization = Math.min(100, Math.round((workload.requestsPerMonth / 5_000_000) * 100));

  // Determine Architectural Capability Tier (Section 8: No arbitrary synthetic quality score)
  let capabilityTier: CapabilityTier = 'Quality Not Modeled';
  let capabilityDescription = 'Architecture contains no active reasoning models.';

  const frontierCount = modelNodes.filter(n => n.type === 'frontier-model' || (n.type === 'model' && n.modelId !== 'gpt-4o-mini')).length;
  const fastCount = modelNodes.filter(n => n.type === 'fast-model' || (n.type === 'model' && n.modelId === 'gpt-4o-mini')).length;
  const hasVectorGrounding = architecture.nodes.some(n => n.type === 'vectordb');

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

  // Deterministic quality score derived from model allocations & RAG grounding (maintained for legacy compatibility)
  let rawQuality = 80;
  if (modelNodes.length === 1) {
    const node = modelNodes[0];
    const defaultModelId = node.type === 'fast-model' ? 'gpt-4o-mini' : 'gpt-4o';
    const modelId = node.modelId || defaultModelId;
    const pricing = MODEL_PRICING[modelId] || (node.type === 'fast-model' ? MODEL_PRICING['gpt-4o-mini'] : MODEL_PRICING['gpt-4o']);
    rawQuality = pricing.qualityScore ?? (node.type === 'fast-model' ? 82 : 95);
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
      const score = pricing.qualityScore ?? (m.type === 'fast-model' ? 82 : 95);
      weightedScoreSum += score * share;
      totalShare += share;
    });
    rawQuality = totalShare > 0 ? (weightedScoreSum / totalShare) : 80;
  }

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

  const calculationTrace: CalculationTrace = {
    totalRequests: requestsPerMonth,
    cacheHitRate: effectiveCacheRate,
    cachedRequests: Math.round(requestsPerMonth * effectiveCacheRate),
    uncachedRequests: Math.round(uncachedRequests),
    avgInputTokens,
    avgOutputTokens,
    totalInputTokens: Math.round(uncachedRequests * avgInputTokens),
    totalOutputTokens: Math.round(uncachedRequests * avgOutputTokens),
    modelInputCost: Math.round(modelInputCostTotal * 100) / 100,
    modelOutputCost: Math.round(modelOutputCostTotal * 100) / 100,
    totalModelCost: Math.round(totalModelCost * 100) / 100,
    cacheCost: Math.round(cacheCost * 100) / 100,
    ingressCost: Math.round(ingressCost * 100) / 100,
    routerCost: Math.round(routerCost * 100) / 100,
    vectorDbCost: Math.round(vectorDbCost * 100) / 100,
    totalCost,
    costPerRequest,
    models: modelCalculationDetails,
  };

  return {
    monthlyCost: totalCost,
    costPerRequest,
    p95Latency,
    latencies,
    capacityUtilization,
    capabilityTier,
    capabilityDescription,
    qualityEstimate,
    throughputRPS,
    costBreakdown,
    bottleneck,
    nodeMetrics,
    validation,
    warnings,
    assumptions,
    calculationTrace,
  };
}

// ── 6. Bill Calibration Engine ("Anchor to My Bill") ──

export function calculateCalibratedEconomics(
  simulation: SimulationResult,
  workload: Workload,
  calibration: BillCalibration
): CalibratedEconomics {
  // Reject negative, zero, NaN, or non-finite inputs safely (Section 24)
  const isValidBill = typeof calibration.actualBill === 'number' && isFinite(calibration.actualBill) && calibration.actualBill > 0;
  const isValidReqs = typeof calibration.actualRequests === 'number' && isFinite(calibration.actualRequests) && calibration.actualRequests > 0;

  if (!calibration.enabled || !isValidBill || !isValidReqs) {
    return {
      actualCostPerRequest: 0,
      simulatedBaselineCost: simulation.monthlyCost,
      variancePercentage: 0,
      calibratedMonthlyCost: simulation.monthlyCost,
      calibratedCostPerRequest: simulation.costPerRequest,
      isCalibrated: false,
      calibrationFactor: 1.0,
      confidenceLevel: 'High Confidence',
      confidenceNotes: 'Theoretical model uncalibrated. Zero invoice baseline applied.',
      limitationsNote: 'Uncalibrated theoretical baseline. Actual cloud bills may include unmodeled overhead such as egress networking, retries, and idle infrastructure.',
      actualHistoricalBill: calibration.actualBill ?? 0,
      historicalRequests: calibration.actualRequests ?? 0,
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

  // Confidence assessment based on empirical variance magnitude (Section 25)
  let confidenceLevel: 'High Confidence' | 'Moderate Confidence' | 'Low Confidence' = 'High Confidence';
  let confidenceNotes = 'Single workload and matching architecture profile. Good correlation to modeled token consumption.';

  if (variancePercentage > 300 || variancePercentage < -50) {
    confidenceLevel = 'Low Confidence';
    confidenceNotes = 'Substantial divergence (>4×). Historical bill likely includes mixed multi-service bills, large fixed provisioned clusters, or unmodeled organizational spend.';
  } else if (variancePercentage > 120 || variancePercentage < -20) {
    confidenceLevel = 'Moderate Confidence';
    confidenceNotes = 'Noticeable variance. Historical spend may include background tool calling, agent loop iterations, or untracked vector storage.';
  }

  const limitationsNote = `Empirical calibration factor (${calibrationFactor.toFixed(4)}×) reconciles theoretical token calculations with your invoice ($${formatNumber(calibration.actualBill)}/mo across ${formatNumber(calibration.actualRequests)} requests). The +${(Math.round(variancePercentage * 10) / 10)}% variance accounts for real-world cloud factors not in the pure LLM token model: egress network bandwidth, retry storms, tool executions, vector index storage, observability logging, and idle provisioned capacity. IMPORTANT: Calibration adjusts the model to your historical baseline. It does not reproduce provider invoices and does not guarantee future spend.`;

  return {
    actualCostPerRequest: isFinite(actualCostPerRequest) ? actualCostPerRequest : 0,
    simulatedBaselineCost: baselineSimulated,
    variancePercentage: isFinite(variancePercentage) ? Math.round(variancePercentage * 10) / 10 : 0,
    calibratedMonthlyCost: isFinite(calibratedMonthlyCost) ? calibratedMonthlyCost : simulation.monthlyCost,
    calibratedCostPerRequest: isFinite(calibratedCostPerRequest) ? calibratedCostPerRequest : 0,
    isCalibrated: true,
    calibrationFactor: isFinite(calibrationFactor) ? Math.round(calibrationFactor * 10000) / 10000 : 1,
    confidenceLevel,
    confidenceNotes,
    limitationsNote,
    actualHistoricalBill: calibration.actualBill,
    historicalRequests: calibration.actualRequests,
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

export function buildCalculationTrace(
  workload: Workload,
  architecture: Architecture,
  sim?: SimulationResult
): CalculationTrace {
  if (sim?.calculationTrace) {
    return sim.calculationTrace;
  }
  const result = sim || simulate(workload, architecture);
  return result.calculationTrace || {
    totalRequests: workload.requestsPerMonth,
    cacheHitRate: workload.cacheHitRate,
    cachedRequests: 0,
    uncachedRequests: workload.requestsPerMonth,
    avgInputTokens: workload.avgInputTokens,
    avgOutputTokens: workload.avgOutputTokens,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    modelInputCost: 0,
    modelOutputCost: 0,
    totalModelCost: 0,
    cacheCost: 0,
    ingressCost: 0,
    routerCost: 0,
    vectorDbCost: 0,
    totalCost: result.monthlyCost,
    costPerRequest: result.costPerRequest,
    models: [],
  };
}

export interface CausalDeltaDetails {
  baselineCost: number;
  currentCost: number;
  costDelta: number;
  baselineLatency: number;
  currentLatency: number;
  latencyDelta: number;
  parameterChanges: {
    label: string;
    baseline: string;
    current: string;
    delta?: string;
  }[];
  primaryCause: string;
  summary: string;
}

export function computeCausalDeltaDetails(
  prevWorkload: Workload | null,
  prevArch: Architecture | null,
  prevSim: SimulationResult | null,
  currentWorkload: Workload,
  currentArch: Architecture,
  currentSim: SimulationResult
): CausalDeltaDetails {
  if (!prevSim || !prevArch || !prevWorkload) {
    return {
      baselineCost: currentSim.monthlyCost,
      currentCost: currentSim.monthlyCost,
      costDelta: 0,
      baselineLatency: currentSim.p95Latency,
      currentLatency: currentSim.p95Latency,
      latencyDelta: 0,
      parameterChanges: [],
      primaryCause: 'Baseline architecture loaded.',
      summary: 'Baseline architecture simulation loaded.',
    };
  }

  const costDelta = currentSim.monthlyCost - prevSim.monthlyCost;
  const latencyDelta = currentSim.p95Latency - prevSim.p95Latency;
  const changes: { label: string; baseline: string; current: string; delta?: string }[] = [];

  if (currentWorkload.cacheHitRate !== prevWorkload.cacheHitRate) {
    const diffPct = Math.round((currentWorkload.cacheHitRate - prevWorkload.cacheHitRate) * 100);
    changes.push({
      label: 'CACHE HIT RATE',
      baseline: `${Math.round(prevWorkload.cacheHitRate * 100)}%`,
      current: `${Math.round(currentWorkload.cacheHitRate * 100)}%`,
      delta: `${diffPct > 0 ? '+' : ''}${diffPct}%`,
    });
  }

  if (currentWorkload.requestsPerMonth !== prevWorkload.requestsPerMonth) {
    const diff = currentWorkload.requestsPerMonth - prevWorkload.requestsPerMonth;
    changes.push({
      label: 'MONTHLY REQUESTS',
      baseline: formatNumber(prevWorkload.requestsPerMonth),
      current: formatNumber(currentWorkload.requestsPerMonth),
      delta: `${diff > 0 ? '+' : ''}${formatNumber(diff)}`,
    });
  }

  if (currentWorkload.avgInputTokens !== prevWorkload.avgInputTokens) {
    const diff = currentWorkload.avgInputTokens - prevWorkload.avgInputTokens;
    changes.push({
      label: 'INPUT TOKENS',
      baseline: `${formatNumber(prevWorkload.avgInputTokens)}`,
      current: `${formatNumber(currentWorkload.avgInputTokens)}`,
      delta: `${diff > 0 ? '+' : ''}${formatNumber(diff)}`,
    });
  }

  if (currentWorkload.avgOutputTokens !== prevWorkload.avgOutputTokens) {
    const diff = currentWorkload.avgOutputTokens - prevWorkload.avgOutputTokens;
    changes.push({
      label: 'OUTPUT TOKENS',
      baseline: `${formatNumber(prevWorkload.avgOutputTokens)}`,
      current: `${formatNumber(currentWorkload.avgOutputTokens)}`,
      delta: `${diff > 0 ? '+' : ''}${formatNumber(diff)}`,
    });
  }

  // Model node differences
  const prevModels = prevArch.nodes.filter(n => n.type === 'model' || n.type === 'fast-model' || n.type === 'frontier-model');
  const currModels = currentArch.nodes.filter(n => n.type === 'model' || n.type === 'fast-model' || n.type === 'frontier-model');
  const prevModelKeys = prevModels.map(m => m.modelId || m.type).sort().join(',');
  const currModelKeys = currModels.map(m => m.modelId || m.type).sort().join(',');
  if (prevModelKeys !== currModelKeys) {
    changes.push({
      label: 'MODEL INFERENCE TIER',
      baseline: prevModels.map(m => m.label).join(' + ') || 'None',
      current: currModels.map(m => m.label).join(' + ') || 'None',
    });
  }

  // Topology node differences
  const hadCacheBefore = prevArch.nodes.some(n => n.type === 'cache');
  const hasCacheNow = currentArch.nodes.some(n => n.type === 'cache');
  if (!hadCacheBefore && hasCacheNow) {
    changes.push({ label: 'TOPOLOGY', baseline: 'Direct path', current: '+ Semantic Cache' });
  } else if (hadCacheBefore && !hasCacheNow) {
    changes.push({ label: 'TOPOLOGY', baseline: 'With Cache', current: 'Removed Cache' });
  }

  const hadVectorDbBefore = prevArch.nodes.some(n => n.type === 'vectordb');
  const hasVectorDbNow = currentArch.nodes.some(n => n.type === 'vectordb');
  if (!hadVectorDbBefore && hasVectorDbNow) {
    changes.push({ label: 'TOPOLOGY', baseline: 'Without Retrieval', current: '+ Vector Database' });
  } else if (hadVectorDbBefore && !hasVectorDbNow) {
    changes.push({ label: 'TOPOLOGY', baseline: 'With Vector DB', current: 'Removed Vector DB' });
  }

  let primaryCause = 'Parameters updated within modeled operating range.';
  if (Math.abs(costDelta) >= 5) {
    if (costDelta < 0) {
      if (!hadCacheBefore && hasCacheNow) {
        primaryCause = `Adding Semantic Cache intercepted ${Math.round(currentWorkload.cacheHitRate * 100)}% of requests, eliminating downstream model inference.`;
      } else if (currentWorkload.cacheHitRate > prevWorkload.cacheHitRate) {
        primaryCause = `Cache hit rate increased by ${Math.round((currentWorkload.cacheHitRate - prevWorkload.cacheHitRate) * 100)}%, intercepting more requests before model inference.`;
      } else if (currentWorkload.requestsPerMonth < prevWorkload.requestsPerMonth) {
        primaryCause = `Monthly request volume decreased by ${formatNumber(prevWorkload.requestsPerMonth - currentWorkload.requestsPerMonth)}, lowering total token consumption.`;
      } else {
        primaryCause = `Architecture optimization reduced modeled expenditure by ${formatCurrency(Math.abs(costDelta))}/mo.`;
      }
    } else {
      if (currentWorkload.requestsPerMonth > prevWorkload.requestsPerMonth) {
        primaryCause = `Request volume grew by ${formatNumber(currentWorkload.requestsPerMonth - prevWorkload.requestsPerMonth)} reqs/mo, scaling total model token generation.`;
      } else if (!hadVectorDbBefore && hasVectorDbNow) {
        primaryCause = `Added Vector Database cluster base and retrieval query fees (+${formatCurrency(costDelta)}/mo).`;
      } else if (hadCacheBefore && !hasCacheNow) {
        primaryCause = `Removed Semantic Cache: all ingress traffic now reaches model inference directly (+${formatCurrency(costDelta)}/mo).`;
      } else {
        primaryCause = `Component topology additions and workload changes increased modeled spend by ${formatCurrency(costDelta)}/mo.`;
      }
    }
  }

  const summary = explainEconomicsDelta(prevWorkload, prevArch, prevSim, currentWorkload, currentArch, currentSim);

  return {
    baselineCost: prevSim.monthlyCost,
    currentCost: currentSim.monthlyCost,
    costDelta,
    baselineLatency: prevSim.p95Latency,
    currentLatency: currentSim.p95Latency,
    latencyDelta,
    parameterChanges: changes,
    primaryCause,
    summary,
  };
}

// ── 8. Three Canonical Templates + Default Architecture ──

export interface ArchTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  whenToUse: string;
  whatItOptimizes: string;
  keyTradeoff: string;
  capabilityTier: CapabilityTier;
  architecture: Architecture;
  defaultWorkload: Workload;
}

export const TEMPLATES: ArchTemplate[] = [
  {
    id: 'direct-llm',
    name: 'Direct LLM',
    category: 'BASELINE',
    description: 'Direct baseline pipeline routing all ingress requests to a Frontier Reasoning Model.',
    whenToUse: 'Simple prototyping, internal reasoning tasks, or low-volume applications where pipeline complexity is unwarranted.',
    whatItOptimizes: 'Development simplicity and raw reasoning fidelity without intermediary hops.',
    keyTradeoff: 'High per-request inference cost and zero defense against repeated prompt volume.',
    capabilityTier: 'Frontier Reasoning',
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
    category: 'RETRIEVAL',
    description: 'Retrieval-augmented generation pipeline with vector search and frontier LLM synthesis.',
    whenToUse: 'Dynamic knowledge bases, enterprise document search, and private factual domain synthesis.',
    whatItOptimizes: 'Factual grounding and context precision from proprietary external documents.',
    keyTradeoff: 'Vector DB cluster base spend, embedding compute, and increased critical-path retrieval latency.',
    capabilityTier: 'Context-Grounded Frontier',
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
    category: 'ROUTING',
    description: 'Production architecture combining semantic caching with dynamic complexity routing between fast and frontier models.',
    whenToUse: 'High-volume production workloads with repeated queries and varying intent complexity.',
    whatItOptimizes: 'Cost per request and P95 latency via semantic cache hits and intelligent utility model tiering.',
    keyTradeoff: 'Routing complexity, cache invalidation overhead, and model tier coordination.',
    capabilityTier: 'Blended Routing',
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

/** String-keyed lookup map for templates — use instead of TEMPLATES[index] */
export const TEMPLATES_MAP: Record<string, ArchTemplate> = Object.fromEntries(
  TEMPLATES.map((t) => [t.id, t])
);

/** Cited quality benchmark methodology used in the Assumptions page */
export const QUALITY_BENCHMARK_METHODOLOGY = {
  citations: [
    {
      name: 'MMLU (Massive Multitask Language Understanding)',
      metric: 'Frontier model reasoning accuracy across 57 academic subjects',
      url: 'https://arxiv.org/abs/2009.03300',
    },
    {
      name: 'HumanEval (OpenAI Codex)',
      metric: 'Code generation correctness — pass@1 on Python programming problems',
      url: 'https://arxiv.org/abs/2107.03374',
    },
    {
      name: 'HELM (Stanford CRFM)',
      metric: 'Holistic evaluation across accuracy, calibration, robustness, fairness',
      url: 'https://crfm.stanford.edu/helm/latest/',
    },
    {
      name: 'MT-Bench (LMSYS)',
      metric: 'Multi-turn instruction following quality (GPT-4 as judge)',
      url: 'https://huggingface.co/spaces/lmsys/mt-bench',
    },
    {
      name: 'RAGAS (RAG Assessment)',
      metric: 'Faithfulness, answer relevance, context precision for RAG pipelines',
      url: 'https://docs.ragas.io/en/latest/',
    },
  ],
};
