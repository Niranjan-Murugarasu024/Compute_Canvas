/* ──────────────────────────────────────────────
   COMPUTECANVAS — DETERMINISTIC DECISION ENGINE 4.0
   Calculation Trace 3.0 Engine & Step Generation
   ────────────────────────────────────────────── */

import {
  type CalculationTrace,
  type CalculationStep,
  type Workload,
  type Architecture,
  type SimulationResult,
} from './types';
import { type CostModelResult } from './cost';
import { type TrafficPropagationResult } from './traffic';
import { type LatencyModelResult } from './latency';
import { formatNumber, formatCurrency, roundCurrency } from './precision';

/**
 * Builds the canonical CalculationTrace with structured Trace 3.0 calculation steps.
 * The steps are derived directly from the exact mathematical values computed by the engine.
 */
export function generateCalculationTrace(
  workload: Workload,
  traffic: TrafficPropagationResult,
  cost: CostModelResult,
  latency: LatencyModelResult
): CalculationTrace {
  const requestsPerMonth = workload.requestsPerMonth;
  const avgInputTokens = workload.avgInputTokens;
  const avgOutputTokens = workload.avgOutputTokens;
  const effectiveCacheRate = traffic.effectiveCacheRate;
  const cachedRequests = traffic.trafficFlow.cachedRequests;
  const uncachedRequests = traffic.trafficFlow.uncachedRequests;

  const totalInputTokens = Math.round(uncachedRequests * avgInputTokens);
  const totalOutputTokens = Math.round(uncachedRequests * avgOutputTokens);

  const steps: CalculationStep[] = [];

  // Step 1: Ingress Workload
  steps.push({
    id: 'step-01-workload-ingress',
    category: 'workload',
    label: 'Ingress Request Volume',
    inputs: { requestsPerMonth },
    formula: 'Configured monthly ingress requests',
    substitution: `${formatNumber(requestsPerMonth)} requests`,
    result: requestsPerMonth,
    units: 'requests/month',
    source: 'Workload Definition',
  });

  // Step 2: Semantic Cache Routing
  if (effectiveCacheRate > 0) {
    steps.push({
      id: 'step-02-cache-termination',
      category: 'traffic',
      label: 'Semantic Cache Terminated Traffic',
      inputs: { requestsPerMonth, cacheHitRate: effectiveCacheRate },
      formula: 'requestsPerMonth * cacheHitRate',
      substitution: `${formatNumber(requestsPerMonth)} * ${effectiveCacheRate}`,
      result: cachedRequests,
      units: 'requests/month',
      source: 'Semantic Cache Subsystem',
    });
  }

  // Step 3: Model Inference Traffic
  steps.push({
    id: 'step-03-model-traffic',
    category: 'traffic',
    label: 'Model Inference Ingress Traffic',
    inputs: { requestsPerMonth, effectiveCacheRate },
    formula: 'requestsPerMonth * (1 - effectiveCacheRate)',
    substitution: `${formatNumber(requestsPerMonth)} * (1 - ${effectiveCacheRate})`,
    result: uncachedRequests,
    units: 'requests/month',
    source: 'Traffic Propagation Engine',
  });

  // Step 4: Token Accounting
  steps.push({
    id: 'step-04-token-accounting',
    category: 'traffic',
    label: 'Modeled Token Volume',
    inputs: { uncachedRequests, avgInputTokens, avgOutputTokens },
    formula: 'uncachedRequests * (avgInputTokens in + avgOutputTokens out)',
    substitution: `${formatNumber(uncachedRequests)} * (${formatNumber(avgInputTokens)} in + ${formatNumber(avgOutputTokens)} out)`,
    result: `${formatNumber(totalInputTokens)} in / ${formatNumber(totalOutputTokens)} out`,
    units: 'tokens/month',
    source: 'Token Accounting Engine',
  });

  // Steps for each active reasoning model
  cost.modelCalculationDetails.forEach((m, idx) => {
    steps.push({
      id: `step-05-model-${idx + 1}-${m.modelId}`,
      category: 'model',
      label: `${m.modelName} Inference Cost`,
      inputs: {
        routedRequests: m.routedRequests,
        inputTokens: m.inputTokens,
        outputTokens: m.outputTokens,
        inputPrice: m.inputPricePer1M,
        outputPrice: m.outputPricePer1M,
      },
      formula: '(inputTokens / 1M * inputPrice) + (outputTokens / 1M * outputPrice)',
      substitution: `(${formatNumber(m.inputTokens)} / 1M * $${m.inputPricePer1M}) + (${formatNumber(m.outputTokens)} / 1M * $${m.outputPricePer1M})`,
      result: formatCurrency(m.totalCost),
      units: 'USD/month',
      source: 'Model Pricing Registry (March 2026)',
    });
  });

  // Steps for Infrastructure Subsystems
  if (cost.ingressCost > 0) {
    steps.push({
      id: 'step-06-infra-ingress',
      category: 'infrastructure',
      label: 'API Gateway Ingress Tariff',
      inputs: { requestsPerMonth },
      formula: '(requests / 1,000,000) * $1.00/1M',
      substitution: `(${formatNumber(requestsPerMonth)} / 1M) * $1.00`,
      result: formatCurrency(cost.ingressCost),
      units: 'USD/month',
      source: 'Infrastructure Pricing Registry',
    });
  }

  if (cost.cacheCost > 0) {
    steps.push({
      id: 'step-07-infra-cache',
      category: 'infrastructure',
      label: 'Semantic Cache Infrastructure',
      inputs: { requestsPerMonth },
      formula: '$65 base + cachedGBHours * $0.012/GB-hour',
      substitution: `$65 base + ${formatNumber(Math.max(1, requestsPerMonth / 500_000) * 730)} GB-hrs * $0.012`,
      result: formatCurrency(cost.cacheCost),
      units: 'USD/month',
      source: 'Infrastructure Pricing Registry',
    });
  }

  if (cost.vectorDbCost > 0) {
    steps.push({
      id: 'step-08-infra-vectordb',
      category: 'infrastructure',
      label: 'Vector Database Storage & Queries',
      inputs: { uncachedRequests },
      formula: '$120 base + (queries / 1M * $0.20 * 100) + (10GB * $0.25)',
      substitution: `$120 + (${formatNumber(uncachedRequests)} / 1M * $20) + $2.50`,
      result: formatCurrency(cost.vectorDbCost),
      units: 'USD/month',
      source: 'Infrastructure Pricing Registry',
    });
  }

  if (cost.routerCost > 0) {
    steps.push({
      id: 'step-09-infra-router',
      category: 'infrastructure',
      label: 'Complexity Router Compute Tariff',
      inputs: { uncachedRequests },
      formula: '(uncachedRequests / 1,000,000) * $0.50/1M',
      substitution: `(${formatNumber(uncachedRequests)} / 1M) * $0.50`,
      result: formatCurrency(cost.routerCost),
      units: 'USD/month',
      source: 'Infrastructure Pricing Registry',
    });
  }

  // Final Step: Total Cost
  steps.push({
    id: 'step-10-total-cost',
    category: 'total',
    label: 'Total Modeled Monthly Cost',
    inputs: {
      modelCost: cost.totalModelCost,
      cacheCost: cost.cacheCost,
      vectorDbCost: cost.vectorDbCost,
      ingressCost: cost.ingressCost,
      routerCost: cost.routerCost,
    },
    formula: 'modelCost + cacheCost + vectorDbCost + ingressCost + routerCost',
    substitution: `${formatCurrency(cost.totalModelCost)} + ${formatCurrency(cost.cacheCost)} + ${formatCurrency(cost.vectorDbCost)} + ${formatCurrency(cost.ingressCost)} + ${formatCurrency(cost.routerCost)}`,
    result: formatCurrency(cost.totalCost),
    units: 'USD/month',
    source: 'ComputeCanvas Deterministic Decision Engine 4.0',
  });

  return {
    totalRequests: requestsPerMonth,
    cacheHitRate: effectiveCacheRate,
    cachedRequests,
    uncachedRequests,
    avgInputTokens,
    avgOutputTokens,
    totalInputTokens,
    totalOutputTokens,
    modelInputCost: roundCurrency(cost.modelInputCostTotal),
    modelOutputCost: roundCurrency(cost.modelOutputCostTotal),
    totalModelCost: roundCurrency(cost.totalModelCost),
    cacheCost: roundCurrency(cost.cacheCost),
    ingressCost: roundCurrency(cost.ingressCost),
    routerCost: roundCurrency(cost.routerCost),
    vectorDbCost: roundCurrency(cost.vectorDbCost),
    totalCost: cost.totalCost,
    costPerRequest: cost.costPerRequest,
    models: cost.modelCalculationDetails,
    steps,
  };
}

/**
 * Backward compatible trace builder.
 */
export function buildCalculationTrace(
  workload: Workload,
  architecture: Architecture,
  sim?: SimulationResult
): CalculationTrace {
  if (sim?.calculationTrace) {
    return sim.calculationTrace;
  }
  return {
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
    totalCost: sim?.monthlyCost || 0,
    costPerRequest: sim?.costPerRequest || 0,
    models: [],
  };
}
