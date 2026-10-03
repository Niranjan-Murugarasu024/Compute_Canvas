/* ──────────────────────────────────────────────
   COMPUTECANVAS — DETERMINISTIC DECISION ENGINE 4.0
   Bottleneck Analysis & Critical Factor Evaluation
   ────────────────────────────────────────────── */

import {
  type BottleneckInfo,
  type Architecture,
  type NodeEconomics,
} from './types';
import { formatCurrency } from './precision';

export interface BottleneckEvaluationResult {
  bottleneck: BottleneckInfo;
  dominantFactor: 'cost' | 'latency' | 'capacity';
}

/**
 * Deterministically evaluates bottleneck candidate across cost and latency pressure.
 * Identifies primary bottleneck and produces explicit causal rationale.
 */
export function evaluateBottleneck(
  architecture: Architecture,
  nodeMetrics: Map<string, NodeEconomics>,
  totalCost: number,
  p95Latency: number
): BottleneckEvaluationResult {
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

  const bottleneckNodeId = maxCostNodeId || maxLatencyNodeId;
  const bottleneckNode = architecture.nodes.find(n => n.id === bottleneckNodeId);
  const bottleneckMetrics = nodeMetrics.get(bottleneckNodeId);

  if (bottleneckMetrics) {
    bottleneckMetrics.isBottleneck = true;
  }

  const costShare = bottleneckMetrics?.costPercentage || 0;
  const latencyShare = p95Latency > 0 && bottleneckMetrics
    ? Math.min(100, Math.round((bottleneckMetrics.latencyMs / p95Latency) * 100))
    : 0;

  const bottleneck: BottleneckInfo = {
    nodeId: bottleneckNodeId,
    componentName: bottleneckNode?.label || 'Frontier Model',
    componentType: bottleneckNode?.type || 'frontier-model',
    metricType: 'cost',
    impactPercentage: costShare,
    costSharePercentage: costShare,
    latencySharePercentage: latencyShare,
    explanation: bottleneckMetrics
      ? `${bottleneckNode?.label || 'Component'} accounts for ${bottleneckMetrics.costPercentage}% of total monthly spend (${formatCurrency(bottleneckMetrics.monthlyCost)}/mo).`
      : 'Frontier model token consumption represents the primary architectural cost driver.',
  };

  return {
    bottleneck,
    dominantFactor: 'cost',
  };
}
