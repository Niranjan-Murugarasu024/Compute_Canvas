/* ──────────────────────────────────────────────
   COMPUTECANVAS — DETERMINISTIC DECISION ENGINE 4.0
   Component Contribution Engine
   ────────────────────────────────────────────── */

import {
  type Architecture,
  type ComponentContribution,
  type NodeEconomics,
} from './types';
import { roundCurrency, roundPercent, safeDivide } from './precision';

/**
 * Calculates component-level contributions for every reachable node.
 * Unifies cost, latency, and traffic shares in one canonical structure.
 */
export function calculateComponentContributions(
  architecture: Architecture,
  nodeMetrics: Map<string, NodeEconomics>,
  nodeTraffic: Map<string, number>,
  totalCost: number,
  p95Latency: number,
  totalRequests: number,
  bottleneckNodeId: string
): Map<string, ComponentContribution> {
  const contributions = new Map<string, ComponentContribution>();

  for (const node of architecture.nodes) {
    const metrics = nodeMetrics.get(node.id);
    if (!metrics) continue;

    const traffic = nodeTraffic.get(node.id) || 0;
    const trafficShare = totalRequests > 0
      ? roundPercent(safeDivide(traffic, totalRequests))
      : 0;

    const costShare = totalCost > 0
      ? roundPercent(safeDivide(metrics.monthlyCost, totalCost))
      : 0;

    const latencyShare = p95Latency > 0
      ? Math.min(100, Math.round((metrics.latencyMs / p95Latency) * 100))
      : 0;

    contributions.set(node.id, {
      nodeId: node.id,
      label: node.label,
      type: node.type,
      costContribution: roundCurrency(metrics.monthlyCost),
      costShare,
      latencyContribution: metrics.latencyMs,
      latencyShare,
      trafficVolume: Math.round(traffic),
      trafficShare,
      isBottleneck: node.id === bottleneckNodeId,
    });
  }

  return contributions;
}
