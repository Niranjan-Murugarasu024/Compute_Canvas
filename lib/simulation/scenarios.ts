import {
  type Architecture,
  type Workload,
  type SimulationResult,
  simulate,
  MODEL_PRICING,
} from './engine';

export interface WhatIfParameters {
  trafficMultiplier?: number; // e.g. 2, 5, 10
  customMonthlyRequests?: number;
  overrideCacheHitRate?: number; // e.g. 0 (cache outage), 0.6
  overrideModelId?: string; // replace primary model with another
  failedNodeId?: string; // simulate node outage
  failedRegionId?: string; // simulate regional failure
  removeRetrieval?: boolean; // simulate RAG off
}

export interface WhatIfDeltaResult {
  baseline: SimulationResult;
  projected: SimulationResult;
  deltaCost: number;
  deltaCostPercent: number;
  deltaLatency: number;
  deltaLatencyPercent: number;
  deltaCapacity: number;
  riskAssessment: 'Low' | 'Moderate' | 'High' | 'Critical';
  newBottlenecks: string[];
  explanation: string;
}

export interface CapacityForecastPoint {
  month: number;
  monthlyRequests: number;
  projectedCost: number;
  capacityUtilization: number;
  isSaturated: boolean;
  criticalBottlenecks: string[];
}

export interface CapacityPlanResult {
  growthRatePercent: number;
  monthsToSaturation: number | null; // null if safe for 12 months
  limitingComponent: string;
  forecastPoints: CapacityForecastPoint[];
  recommendation: string;
}

/**
 * Calculates deterministic delta between current baseline and a what-if perturbation
 */
export function calculateWhatIfDelta(
  baselineWorkload: Workload,
  baselineArchitecture: Architecture,
  params: WhatIfParameters
): WhatIfDeltaResult {
  const baseline = simulate(baselineWorkload, baselineArchitecture);

  // Apply workload modifications
  let projectedRequests = baselineWorkload.requestsPerMonth;
  if (params.customMonthlyRequests !== undefined) {
    projectedRequests = params.customMonthlyRequests;
  } else if (params.trafficMultiplier !== undefined) {
    projectedRequests = Math.round(baselineWorkload.requestsPerMonth * params.trafficMultiplier);
  }

  const projectedWorkload: Workload = {
    ...baselineWorkload,
    requestsPerMonth: projectedRequests,
    concurrency: Math.max(1, Math.round((baselineWorkload.concurrency || 50) * (projectedRequests / Math.max(1, baselineWorkload.requestsPerMonth)))),
    cacheHitRate: params.overrideCacheHitRate !== undefined ? params.overrideCacheHitRate : baselineWorkload.cacheHitRate,
    retrievalsPerRequest: params.removeRetrieval ? 0 : baselineWorkload.retrievalsPerRequest,
  };

  // Apply architecture modifications
  let projectedArchitecture: Architecture = {
    ...baselineArchitecture,
    nodes: baselineArchitecture.nodes.map(n => {
      // Model migration
      if (params.overrideModelId && n.type === 'model') {
        const modelInfo = MODEL_PRICING[params.overrideModelId];
        return {
          ...n,
          modelId: params.overrideModelId,
          label: modelInfo ? modelInfo.product : params.overrideModelId,
        };
      }
      return n;
    }),
  };

  // If simulating a node failure, remove or bypass it
  if (params.failedNodeId) {
    projectedArchitecture = {
      ...projectedArchitecture,
      nodes: projectedArchitecture.nodes.filter(n => n.id !== params.failedNodeId),
      edges: projectedArchitecture.edges.filter(e => e.source !== params.failedNodeId && e.target !== params.failedNodeId),
    };
  }

  const projected = simulate(projectedWorkload, projectedArchitecture);

  const deltaCost = projected.monthlyCost - baseline.monthlyCost;
  const deltaCostPercent = baseline.monthlyCost > 0 ? (deltaCost / baseline.monthlyCost) * 100 : 0;
  const deltaLatency = projected.p95Latency - baseline.p95Latency;
  const deltaLatencyPercent = baseline.p95Latency > 0 ? (deltaLatency / baseline.p95Latency) * 100 : 0;
  const deltaCapacity = projected.capacityUtilization - baseline.capacityUtilization;

  // Evaluate risk level
  let riskAssessment: WhatIfDeltaResult['riskAssessment'] = 'Low';
  if (projected.capacityUtilization > 100 || params.failedNodeId) {
    riskAssessment = 'Critical';
  } else if (projected.capacityUtilization > 85 || deltaCostPercent > 100) {
    riskAssessment = 'High';
  } else if (projected.capacityUtilization > 70 || deltaCostPercent > 30) {
    riskAssessment = 'Moderate';
  }

  // Identify newly emerged bottlenecks
  const baselineWarnings = new Set(baseline.warnings.map(w => w.message));
  const newBottlenecks = projected.warnings
    .filter(w => !baselineWarnings.has(w.message))
    .map(w => w.message);

  // Generate deterministic cause-and-effect narrative
  let explanation = '';
  if (params.trafficMultiplier && params.trafficMultiplier > 1) {
    explanation = `${params.trafficMultiplier}× traffic scale raises monthly spend by ${deltaCostPercent > 0 ? '+' : ''}${deltaCostPercent.toFixed(0)}% ($${Math.abs(deltaCost).toLocaleString()}/mo). `;
    if (projected.capacityUtilization > 100) {
      explanation += `System saturates at ${projected.capacityUtilization.toFixed(0)}% capacity. Concurrency queueing will increase P95 latency by +${deltaLatency}ms.`;
    } else {
      explanation += `Architecture operates safely with ${(100 - projected.capacityUtilization).toFixed(0)}% headroom remaining.`;
    }
  } else if (params.overrideCacheHitRate !== undefined && params.overrideCacheHitRate < baselineWorkload.cacheHitRate) {
    explanation = `Reducing cache hit rate from ${Math.round(baselineWorkload.cacheHitRate * 100)}% to ${Math.round(params.overrideCacheHitRate * 100)}% redirects unbuffered requests directly to the model, increasing inference spend by +$${deltaCost.toLocaleString()}/mo.`;
  } else if (params.overrideModelId) {
    explanation = `Switching model to ${MODEL_PRICING[params.overrideModelId]?.product || params.overrideModelId} results in a ${deltaCost < 0 ? 'cost savings' : 'cost increase'} of $${Math.abs(deltaCost).toLocaleString()}/mo and shifts P95 latency by ${deltaLatency > 0 ? '+' : ''}${deltaLatency}ms.`;
  } else if (params.failedNodeId) {
    explanation = `Node "${params.failedNodeId}" failure disables its downstream path. Downstream nodes lose traffic, requiring failover configuration.`;
  } else {
    explanation = `Modified parameters result in $${projected.monthlyCost.toLocaleString()}/mo projected spend and ${projected.p95Latency}ms P95 latency.`;
  }

  return {
    baseline,
    projected,
    deltaCost,
    deltaCostPercent,
    deltaLatency,
    deltaLatencyPercent,
    deltaCapacity,
    riskAssessment,
    newBottlenecks,
    explanation,
  };
}

/**
 * Calculates month-by-month compounding capacity forecast for 12 months
 */
export function calculateCapacityPlan(
  workload: Workload,
  architecture: Architecture,
  monthlyGrowthRatePercent: number = 25
): CapacityPlanResult {
  const forecastPoints: CapacityForecastPoint[] = [];
  let monthsToSaturation: number | null = null;
  let limitingComponent = 'System Throughput';

  for (let m = 1; m <= 12; m++) {
    const growthFactor = Math.pow(1 + monthlyGrowthRatePercent / 100, m);
    const monthRequests = Math.round(workload.requestsPerMonth * growthFactor);
    const monthConcurrency = Math.max(1, Math.round((workload.concurrency || 50) * growthFactor));

    const monthWorkload: Workload = {
      ...workload,
      requestsPerMonth: monthRequests,
      concurrency: monthConcurrency,
    };

    const sim = simulate(monthWorkload, architecture);
    const isSaturated = sim.capacityUtilization > 100;

    if (isSaturated && monthsToSaturation === null) {
      monthsToSaturation = m;
      limitingComponent = sim.warnings[0]?.message.split(' ')[0] || 'Compute / Concurrency';
    }

    forecastPoints.push({
      month: m,
      monthlyRequests: monthRequests,
      projectedCost: sim.monthlyCost,
      capacityUtilization: Math.min(250, Math.round(sim.capacityUtilization)),
      isSaturated,
      criticalBottlenecks: sim.warnings.filter(w => w.severity === 'critical').map(w => w.message),
    });
  }

  let recommendation = '';
  if (monthsToSaturation === null) {
    recommendation = `Current architecture supports ${monthlyGrowthRatePercent}% monthly growth for at least 12 months with healthy headroom.`;
  } else if (monthsToSaturation <= 3) {
    recommendation = `CRITICAL: Saturated within ${monthsToSaturation} months at ${monthlyGrowthRatePercent}% growth. Immediate sharding or semantic caching tier required.`;
  } else {
    recommendation = `System approaches saturation at Month ${monthsToSaturation}. Plan capacity expansion or complexity routing before Month ${monthsToSaturation - 1}.`;
  }

  return {
    growthRatePercent: monthlyGrowthRatePercent,
    monthsToSaturation,
    limitingComponent,
    forecastPoints,
    recommendation,
  };
}
