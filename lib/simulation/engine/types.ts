/* ──────────────────────────────────────────────
   COMPUTECANVAS — DETERMINISTIC DECISION ENGINE 4.0
   Canonical Type System & Domain Contracts
   ────────────────────────────────────────────── */

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

export interface PricingRecord {
  provider: string;
  product: string;
  inputPricePer1M: number;
  outputPricePer1M: number;
  baselineLatencyMs: number;
  contextWindowTokens: number;
  qualityScore?: number;
  benchmarkDate: string;
  assumptions: string;
  category?: 'fast' | 'frontier' | string;
  capabilityTier?: string;
  capabilityDescription?: string;
  sourceType?: AssumptionSourceType | string;
  pricingSnapshot?: string;
  registryVersion?: string;
  status?: string;
  qualityBenchmark?: string;
  qualitySource?: string;
  source?: string;
  unit?: string;
  notes?: string;
}

export type ComponentType =
  | 'api'
  | 'cache'
  | 'router'
  | 'vectordb'
  | 'model'
  | 'fast-model'
  | 'frontier-model'
  | 'fallback'
  | 'agent'
  | 'compute'
  | 'embedding'
  | 'reranker';

export interface ArchNode {
  id: string;
  type: ComponentType;
  label: string;
  modelId?: string;
  x?: number;
  y?: number;
  config?: Record<string, unknown>;
}

export interface ArchEdge {
  source: string;
  target: string;
  trafficShare?: number; // 0.0 - 1.0 (for router splits)
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
  cacheHitRate: number; // 0.0 - 1.0
  concurrency?: number;
  retrievalsPerRequest?: number;
  toolCallsPerRequest?: number;
}

export interface BillCalibration {
  enabled: boolean;
  actualBill: number;
  actualRequests: number;
  baselineSimulatedCost?: number;
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

export type GraphValidationResult = ArchitectureValidation;

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
  label: string;
  componentType: ComponentType;
  latencyMs: number;
  sharePercentage: number;
  componentId: string;
  componentName: string;
  type: ComponentType;
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
  metricType: 'cost' | 'latency' | 'throughput' | 'concurrency';
  impactPercentage: number;
  costSharePercentage: number;
  latencySharePercentage: number;
  explanation: string;
}

export type CapabilityTier =
  | 'Fast Utility'
  | 'Context-Grounded Frontier'
  | 'Frontier Reasoning'
  | 'Blended Routing'
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

export interface CalculationStep {
  id: string;
  category: 'workload' | 'traffic' | 'model' | 'infrastructure' | 'latency' | 'total';
  label: string;
  inputs: Record<string, number | string>;
  formula: string;
  substitution: string;
  result: number | string;
  units: string;
  source: string;
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
  steps?: CalculationStep[];
}

export interface EngineProvenance {
  engineVersion: string;
  engineSpecification: string;
  pricingSnapshot: string;
  modelRegistryVersion: string;
  assumptionVersion: string;
  methodology: string;
}

export interface TrafficFlowResult {
  totalIngressRequests: number;
  effectiveCacheHitRate: number;
  cachedRequests: number;
  uncachedRequests: number;
  nodeTraffic: Map<string, number>;
  edgeTraffic: Map<string, number>;
  terminatedTraffic: number;
  droppedTraffic: number;
  isConserved: boolean;
  warnings: string[];
}

export interface TokenAccountingResult {
  totalInputTokens: number;
  totalOutputTokens: number;
  modelTokens: Map<string, {
    modelId: string;
    modelName: string;
    trafficShare: number;
    requests: number;
    inputTokens: number;
    outputTokens: number;
    inputCost: number;
    outputCost: number;
    totalCost: number;
  }>;
}

export interface ComponentContribution {
  nodeId: string;
  label: string;
  type: ComponentType;
  costContribution: number;
  costShare: number;
  latencyContribution: number;
  latencyShare: number;
  trafficVolume: number;
  trafficShare: number;
  isBottleneck: boolean;
}

export interface ComponentCapacity {
  capacityPerSecond: number;
  requestsPerSecond: number;
  utilization: number;
  queueDepth: number;
  saturationState: 'UNDER_CAPACITY' | 'NEAR_CAPACITY' | 'SATURATED';
}

export interface SimulationResult {
  monthlyCost: number;
  costPerRequest: number;
  p95Latency: number;
  latencies: LatencyBreakdown;
  capacityUtilization: number;
  capabilityTier: CapabilityTier;
  capabilityDescription: string;
  qualityEstimate: number;
  throughputRPS: number;
  costBreakdown: CostBreakdown;
  bottleneck: BottleneckInfo;
  nodeMetrics: Map<string, NodeEconomics>;
  validation: ArchitectureValidation;
  warnings: { type: string; message: string; severity: 'info' | 'warning' | 'critical' }[];
  assumptions: { category: string; detail: string }[];
  calculationTrace: CalculationTrace;
  // Engine 4.0 Extensions:
  engineVersion?: string;
  provenance?: EngineProvenance;
  trafficFlow?: TrafficFlowResult;
  contributions?: Map<string, ComponentContribution>;
  capacity?: ComponentCapacity;
}

export interface SimulationInput {
  architecture: Architecture;
  workload: Workload;
  pricingSnapshot?: string;
  modelRegistryVersion?: string;
  assumptionVersion?: string;
  engineVersion?: string;
  decisionObjective?: 'cost' | 'latency' | 'quality' | 'balanced';
}

export interface CalibratedEconomics {
  actualCostPerRequest: number;
  simulatedBaselineCost: number;
  variancePercentage: number;
  calibratedMonthlyCost: number;
  calibratedCostPerRequest: number;
  isCalibrated: boolean;
  calibrationFactor: number;
  confidenceLevel?: 'High Confidence' | 'Moderate Confidence' | 'Low Confidence' | string;
  confidenceNotes?: string;
  limitationsNote: string;
  actualHistoricalBill: number;
  historicalRequests: number;
  rawMonthlyCost?: number;
}

export interface SensitivityPoint {
  parameterValue: number;
  label?: string;
  displayValue?: string;
  monthlyCost: number;
  p95Latency: number;
  costPerRequest?: number;
  costDelta?: number;
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
  deltaCost?: number;
  deltaCostPercentage?: number;
  costTrend?: 'cheaper' | 'more-expensive' | 'neutral';
  deltaLatency?: number;
  deltaLatencyPercentage?: number;
  latencyTrend?: 'faster' | 'slower' | 'neutral';
  causalFactor?: string;
  causalSubsystem?: string;
  causalDescription?: string;
  actionableRecommendation?: string;
}

export interface ArchTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  tags?: string[];
  whenToUse?: string;
  whatItOptimizes?: string;
  keyTradeoff?: string;
  tradeoffs?: string;
  capabilityTier?: CapabilityTier;
  architecture: Architecture;
  defaultWorkload: Workload;
  qualityScore?: number;
  estimatedCostRange?: string;
  latencyExpectation?: string;
}
