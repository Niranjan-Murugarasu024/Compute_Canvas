/* ──────────────────────────────────────────────
   COMPUTECANVAS — DETERMINISTIC DECISION ENGINE 4.0
   Authoritative Facade & Backward Compatibility Boundary
   ────────────────────────────────────────────── */

export * from './engine/types';
export * from './engine/version';
export * from './engine/precision';
export * from './engine/input';
export * from './engine/validation';
export * from './engine/graph';
export * from './engine/traffic';
export * from './engine/cost';
export * from './engine/latency';
export * from './engine/capacity';
export * from './engine/throughput';
export * from './engine/bottleneck';
export * from './engine/contribution';
export * from './engine/trace';
export * from './engine/provenance';
export { simulate } from './engine/index';

import {
  type Workload,
  type Architecture,
  type SimulationResult,
  type BillCalibration,
  type CalibratedEconomics,
  type SensitivityPoint,
  type CausalDeltaDetails,
  type ArchTemplate,
  type ModelAssumption,
} from './engine/types';
import { simulate } from './engine/index';
import { formatNumber, formatCurrency } from './engine/precision';

// ── 1. Model Engine Metadata & Assumptions Registry ──

export const MODEL_METADATA = {
  engineVersion: '4.0',
  pricingAssumptionsDate: 'March 2026',
  latencyAssumptionsDate: 'March 2026',
  specification: 'ComputeCanvas Deterministic Decision Engine 4.0',
};

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

// ── 2. Bill Calibration Engine ("Anchor to My Bill") ──

export function calculateCalibratedEconomics(
  simulation: SimulationResult,
  workload: Workload,
  calibration: BillCalibration
): CalibratedEconomics {
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
      rawMonthlyCost: simulation.monthlyCost,
    };
  }

  const actualCostPerRequest = calibration.actualBill / calibration.actualRequests;
  const baselineSimulated = (calibration.baselineSimulatedCost !== undefined && calibration.baselineSimulatedCost > 0)
    ? calibration.baselineSimulatedCost
    : simulation.monthlyCost;

  const variancePercentage = baselineSimulated > 0
    ? ((calibration.actualBill - baselineSimulated) / baselineSimulated) * 100
    : 0;

  const calibrationFactor = baselineSimulated > 0 ? (calibration.actualBill / baselineSimulated) : 1;
  const calibratedMonthlyCost = Math.round(simulation.monthlyCost * calibrationFactor * 100) / 100;
  const calibratedCostPerRequest = workload.requestsPerMonth > 0
    ? calibratedMonthlyCost / workload.requestsPerMonth
    : 0;

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
    rawMonthlyCost: simulation.monthlyCost,
  };
}

// ── 3. Sensitivity Analysis Engine (Deterministic Curves) ──

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
        displayValue: `${Math.round(r * 100)}% Hit Rate`,
        monthlyCost: sim.monthlyCost,
        costDelta: Math.round((sim.monthlyCost - baseSim.monthlyCost) * 100) / 100,
        p95Latency: sim.p95Latency,
        costPerRequest: sim.costPerRequest,
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
        displayValue: `${formatNumber(reqs)} reqs`,
        monthlyCost: sim.monthlyCost,
        costDelta: Math.round((sim.monthlyCost - baseSim.monthlyCost) * 100) / 100,
        p95Latency: sim.p95Latency,
        costPerRequest: sim.costPerRequest,
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
        displayValue: `${formatNumber(inTok + outTok)} tokens`,
        monthlyCost: sim.monthlyCost,
        costDelta: Math.round((sim.monthlyCost - baseSim.monthlyCost) * 100) / 100,
        p95Latency: sim.p95Latency,
        costPerRequest: sim.costPerRequest,
      });
    }
  }

  return points;
}

// ── 4. Causal Explanation Generator ("Why Did This Change?") ──

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
      return `Removed Semantic Cache: all ingress requests now hit reasoning models directly (+${formatCurrency(absCostDiff)}/mo).`;
    }

    if (currentWorkload.cacheHitRate < prevWorkload.cacheHitRate) {
      return `Reduced cache hit rate from ${Math.round(prevWorkload.cacheHitRate * 100)}% to ${Math.round(currentWorkload.cacheHitRate * 100)}%, increasing model inference costs by ${formatCurrency(absCostDiff)}/mo.`;
    }

    return `Architecture adjustments increased modeled monthly spend by ${formatCurrency(absCostDiff)}/mo.`;
  }

  return 'Simulation updated with current workload parameters.';
}

// ── 5. Causal Delta Details Engine ──

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
      deltaCost: 0,
      deltaCostPercentage: 0,
      costTrend: 'neutral',
      deltaLatency: 0,
      deltaLatencyPercentage: 0,
      latencyTrend: 'neutral',
      causalFactor: 'Baseline Architecture',
      causalSubsystem: 'Ingress / Models',
      causalDescription: 'Baseline architecture loaded.',
      actionableRecommendation: 'Adjust workload parameters or add caching to evaluate cost optimizations.',
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
  let causalFactor = 'Operating Parameters';
  let causalSubsystem = 'Model Inference';
  let actionableRecommendation = 'Monitor cost trajectory as monthly request volume grows.';

  if (Math.abs(costDelta) >= 5) {
    if (costDelta < 0) {
      if (!hadCacheBefore && hasCacheNow) {
        primaryCause = `Adding Semantic Cache intercepted ${Math.round(currentWorkload.cacheHitRate * 100)}% of requests, eliminating downstream model inference.`;
        causalFactor = 'Semantic Caching';
        causalSubsystem = 'Semantic Cache';
        actionableRecommendation = 'Maintain high cache hit rates through prompt canonicalization.';
      } else if (currentWorkload.cacheHitRate > prevWorkload.cacheHitRate) {
        primaryCause = `Cache hit rate increased by ${Math.round((currentWorkload.cacheHitRate - prevWorkload.cacheHitRate) * 100)}%, intercepting more requests before model inference.`;
        causalFactor = 'Cache Hit Rate Expansion';
        causalSubsystem = 'Semantic Cache';
        actionableRecommendation = 'Evaluate semantic cache TTL to optimize cache freshness.';
      } else if (currentWorkload.requestsPerMonth < prevWorkload.requestsPerMonth) {
        primaryCause = `Monthly request volume decreased by ${formatNumber(prevWorkload.requestsPerMonth - currentWorkload.requestsPerMonth)}, lowering total token consumption.`;
        causalFactor = 'Workload Reduction';
        causalSubsystem = 'API Ingress';
        actionableRecommendation = 'Align infrastructure provisioning with observed demand.';
      } else {
        primaryCause = `Architecture optimization reduced modeled expenditure by ${formatCurrency(Math.abs(costDelta))}/mo.`;
      }
    } else {
      if (currentWorkload.requestsPerMonth > prevWorkload.requestsPerMonth) {
        primaryCause = `Request volume grew by ${formatNumber(currentWorkload.requestsPerMonth - prevWorkload.requestsPerMonth)} reqs/mo, scaling total model token generation.`;
        causalFactor = 'Traffic Volume Scaling';
        causalSubsystem = 'API Ingress';
        actionableRecommendation = 'Consider adding dynamic complexity routing to steer routine traffic to fast utility models.';
      } else if (!prevArch.nodes.some(n => n.type === 'vectordb') && currentArch.nodes.some(n => n.type === 'vectordb')) {
        primaryCause = `Added Vector Database cluster base and retrieval query fees (+${formatCurrency(costDelta)}/mo).`;
        causalFactor = 'Vector DB Indexing';
        causalSubsystem = 'Vector Database';
        actionableRecommendation = 'Optimize vector retrieval chunk size and similarity thresholds.';
      } else if (hadCacheBefore && !hasCacheNow) {
        primaryCause = `Removed Semantic Cache: all ingress traffic now reaches model inference directly (+${formatCurrency(costDelta)}/mo).`;
        causalFactor = 'Cache Removal';
        causalSubsystem = 'Semantic Cache';
        actionableRecommendation = 'Reinstate semantic caching to avoid paying full token rates for repeated prompts.';
      } else {
        primaryCause = `Component topology additions and workload changes increased modeled spend by ${formatCurrency(costDelta)}/mo.`;
      }
    }
  }

  const summary = explainEconomicsDelta(prevWorkload, prevArch, prevSim, currentWorkload, currentArch, currentSim);
  const deltaCostPercentage = prevSim.monthlyCost > 0 ? (costDelta / prevSim.monthlyCost) * 100 : 0;
  const deltaLatencyPercentage = prevSim.p95Latency > 0 ? (latencyDelta / prevSim.p95Latency) * 100 : 0;
  const costTrend = costDelta < -0.5 ? 'cheaper' : costDelta > 0.5 ? 'more-expensive' : 'neutral';
  const latencyTrend = latencyDelta < -1 ? 'faster' : latencyDelta > 1 ? 'slower' : 'neutral';

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
    deltaCost: costDelta,
    deltaCostPercentage,
    costTrend,
    deltaLatency: latencyDelta,
    deltaLatencyPercentage,
    latencyTrend,
    causalFactor,
    causalSubsystem,
    causalDescription: primaryCause,
    actionableRecommendation,
  };
}

// ── 6. Three Canonical Templates + Default Architecture ──

export const TEMPLATES: ArchTemplate[] = [
  {
    id: 'direct-llm',
    name: 'Direct LLM',
    category: 'BASELINE',
    description: 'Direct baseline pipeline routing all ingress requests to a Frontier Reasoning Model.',
    whenToUse: 'Simple prototyping, internal reasoning tasks, or low-volume applications where pipeline complexity is unwarranted.',
    whatItOptimizes: 'Development simplicity and raw reasoning fidelity without intermediary hops.',
    keyTradeoff: 'High per-request inference cost and zero defense against repeated prompt volume.',
    difficulty: 'Beginner',
    tags: ['Baseline', 'Frontier Model', 'Zero Infra'],
    qualityScore: 95,
    estimatedCostRange: '$3,500 – $4,500',
    latencyExpectation: '380ms P95',
    tradeoffs: 'High per-request inference cost and zero defense against repeated prompt volume.',
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
    difficulty: 'Intermediate',
    tags: ['RAG', 'Vector DB', 'Knowledge Grounding'],
    qualityScore: 97,
    estimatedCostRange: '$5,000 – $6,500',
    latencyExpectation: '440ms P95',
    tradeoffs: 'Vector DB cluster base spend, embedding compute, and increased critical-path retrieval latency.',
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
    difficulty: 'Advanced',
    tags: ['Router', 'Semantic Cache', 'Multi-Tier', 'Cost Optimized'],
    qualityScore: 86,
    estimatedCostRange: '$2,000 – $3,000',
    latencyExpectation: '105ms P95',
    tradeoffs: 'Routing complexity, cache invalidation overhead, and model tier coordination.',
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

/** String-keyed lookup map for templates */
export const TEMPLATES_MAP: Record<string, ArchTemplate> = Object.fromEntries(
  TEMPLATES.map((t) => [t.id, t])
);

/** Cited quality benchmark methodology */
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
