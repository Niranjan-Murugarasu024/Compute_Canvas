/* ──────────────────────────────────────────────
   COMPUTECANVAS — DETERMINISTIC DECISION ENGINE 4.0
   Traffic Propagation & Token Accounting Engine
   ────────────────────────────────────────────── */

import {
  type Architecture,
  type Workload,
  type TrafficFlowResult,
  type TokenAccountingResult,
  type ArchNode,
} from './types';
import { type ResolvedGraph } from './graph';

export interface ModelTrafficAllocation {
  node: ArchNode;
  trafficShare: number;
  routedRequests: number;
}

export interface TrafficPropagationResult {
  trafficFlow: TrafficFlowResult;
  tokenAccounting: TokenAccountingResult;
  modelAllocations: ModelTrafficAllocation[];
  effectiveCacheRate: number;
  uncachedRequests: number;
}

/**
 * Propagates traffic across the architecture DAG.
 * Enforces strict traffic conservation: Ingress = Terminated (Cache) + Routed + Dropped.
 */
export function propagateTraffic(
  workload: Workload,
  architecture: Architecture,
  graph: ResolvedGraph
): TrafficPropagationResult {
  const requestsPerMonth = Math.max(0, workload.requestsPerMonth);
  const avgInputTokens = Math.max(0, workload.avgInputTokens);
  const avgOutputTokens = Math.max(0, workload.avgOutputTokens);
  const cacheHitRate = Math.min(1.0, Math.max(0, workload.cacheHitRate));

  const effectiveCacheRate = graph.hasCache ? cacheHitRate : 0;
  const uncachedFraction = 1 - effectiveCacheRate;
  const cachedRequests = requestsPerMonth * effectiveCacheRate;
  const uncachedRequests = requestsPerMonth * uncachedFraction;

  const nodeTraffic = new Map<string, number>();
  const edgeTraffic = new Map<string, number>();
  const warnings: string[] = [];

  // 1. API Ingress traffic
  graph.apiNodes.forEach(api => {
    nodeTraffic.set(api.id, requestsPerMonth);
  });

  // 2. Cache traffic
  if (graph.hasCache) {
    graph.cacheNodes.forEach(cache => {
      nodeTraffic.set(cache.id, requestsPerMonth);
    });
  }

  // 3. Router & Vector DB traffic receive uncached requests
  if (graph.hasRouter) {
    graph.routerNodes.forEach(r => {
      nodeTraffic.set(r.id, uncachedRequests);
    });
  }
  if (graph.hasVectorDb) {
    graph.vectorNodes.forEach(v => {
      nodeTraffic.set(v.id, uncachedRequests);
    });
  }

  // 4. Model traffic allocation & edge traffic
  const modelNodes = graph.modelNodes;
  const modelAllocations: ModelTrafficAllocation[] = [];
  let droppedTraffic = 0;

  if (modelNodes.length === 1) {
    const node = modelNodes[0];
    const routedRequests = uncachedRequests;
    nodeTraffic.set(node.id, routedRequests);
    modelAllocations.push({
      node,
      trafficShare: 1.0,
      routedRequests,
    });
  } else if (modelNodes.length > 1) {
    const edges = architecture.edges || [];
    let shareSum = 0;

    const rawAllocations = modelNodes.map(m => {
      const edge = edges.find(e => e.target === m.id);
      const share = edge?.trafficShare !== undefined ? edge.trafficShare : 1 / modelNodes.length;
      shareSum += share;
      return { node: m, share, edge };
    });

    const isOverAllocated = shareSum > 1.001;
    const isUnderAllocated = shareSum < 0.999;
    const scaleFactor = isOverAllocated ? 1 / shareSum : 1.0;

    for (const alloc of rawAllocations) {
      const effectiveShare = alloc.share * scaleFactor;
      const routedRequests = uncachedRequests * effectiveShare;
      nodeTraffic.set(alloc.node.id, routedRequests);

      if (alloc.edge) {
        edgeTraffic.set(`${alloc.edge.source}->${alloc.edge.target}`, routedRequests);
      }

      modelAllocations.push({
        node: alloc.node,
        trafficShare: effectiveShare,
        routedRequests,
      });
    }

    if (isUnderAllocated) {
      const unallocatedFraction = Math.max(0, 1 - shareSum);
      droppedTraffic = uncachedRequests * unallocatedFraction;
      const droppedPct = Math.round(unallocatedFraction * 100);
      warnings.push(`Unallocated router traffic: ${droppedPct}% of requests are dropped without reaching any model tier.`);
    }
  }

  // 5. Token Accounting across active reasoning models
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  const modelTokens = new Map<string, {
    modelId: string;
    modelName: string;
    trafficShare: number;
    requests: number;
    inputTokens: number;
    outputTokens: number;
    inputCost: number;
    outputCost: number;
    totalCost: number;
  }>();

  for (const alloc of modelAllocations) {
    const nodeInputTokens = alloc.routedRequests * avgInputTokens;
    const nodeOutputTokens = alloc.routedRequests * avgOutputTokens;
    totalInputTokens += nodeInputTokens;
    totalOutputTokens += nodeOutputTokens;

    modelTokens.set(alloc.node.id, {
      modelId: alloc.node.modelId || (alloc.node.type === 'fast-model' ? 'gpt-4o-mini' : 'gpt-4o'),
      modelName: alloc.node.label || alloc.node.type,
      trafficShare: alloc.trafficShare,
      requests: Math.round(alloc.routedRequests),
      inputTokens: Math.round(nodeInputTokens),
      outputTokens: Math.round(nodeOutputTokens),
      inputCost: 0,
      outputCost: 0,
      totalCost: 0,
    });
  }

  const terminatedTraffic = cachedRequests;
  const totalRoutedToModels = modelAllocations.reduce((acc, m) => acc + m.routedRequests, 0);

  // Traffic conservation invariant check:
  // requestsPerMonth ≈ cachedRequests (terminated) + totalRoutedToModels + droppedTraffic
  const accountedTraffic = terminatedTraffic + totalRoutedToModels + droppedTraffic;
  const isConserved = requestsPerMonth === 0 || Math.abs(requestsPerMonth - accountedTraffic) < 0.001;

  const trafficFlow: TrafficFlowResult = {
    totalIngressRequests: requestsPerMonth,
    effectiveCacheHitRate: effectiveCacheRate,
    cachedRequests: Math.round(cachedRequests),
    uncachedRequests: Math.round(uncachedRequests),
    nodeTraffic,
    edgeTraffic,
    terminatedTraffic: Math.round(terminatedTraffic),
    droppedTraffic: Math.round(droppedTraffic),
    isConserved,
    warnings,
  };

  const tokenAccounting: TokenAccountingResult = {
    totalInputTokens: Math.round(totalInputTokens),
    totalOutputTokens: Math.round(totalOutputTokens),
    modelTokens,
  };

  return {
    trafficFlow,
    tokenAccounting,
    modelAllocations,
    effectiveCacheRate,
    uncachedRequests,
  };
}
