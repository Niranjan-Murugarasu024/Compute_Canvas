/* ──────────────────────────────────────────────
   COMPUTECANVAS — DETERMINISTIC DECISION ENGINE 4.0
   Path-Based Latency Engine & Critical Path Modeling
   ────────────────────────────────────────────── */

import {
  type LatencyBreakdown,
  type LatencyCriticalPathSegment,
} from './types';
import { type ResolvedGraph } from './graph';
import { INFRA_PRICING } from './cost';

export interface LatencyModelResult {
  p95Latency: number;
  latencies: LatencyBreakdown;
  cacheHitLatency: number;
  cacheMissLatency: number;
  criticalPathSegments: LatencyCriticalPathSegment[];
}

/**
 * Computes modeled path latency across cache-hit and cache-miss execution flows.
 * Exposes honest, model-derived estimates and critical path breakdown.
 */
export function calculateLatency(
  graph: ResolvedGraph,
  effectiveCacheRate: number,
  weightedModelLatency: number
): LatencyModelResult {
  const ingressLatency = INFRA_PRICING.apiGateway.latencyMs;
  const cacheLookupLatency = graph.hasCache ? INFRA_PRICING.cache.lookupLatencyMs : 0;
  const routerLatency = graph.hasRouter ? INFRA_PRICING.router.latencyMs : 0;
  const vectorLookupLatency = graph.hasVectorDb ? INFRA_PRICING.vectorDb.lookupLatencyMs : 0;

  // Path estimates:
  // Cache hits: Ingress + Cache Lookup
  // Cache misses: Ingress + Cache Lookup + Router + Vector DB + Model Inference
  const cacheHitLatency = ingressLatency + cacheLookupLatency;
  const cacheMissLatency = ingressLatency + cacheLookupLatency + routerLatency + vectorLookupLatency + weightedModelLatency;

  // Weighted-average path latency estimate across active traffic flows
  const p95Latency = Math.round(effectiveCacheRate * cacheHitLatency + (1 - effectiveCacheRate) * cacheMissLatency);

  // Percentile Latency Decomposition:
  const ttftMs = Math.round(
    ingressLatency +
    cacheLookupLatency +
    (graph.hasRouter ? routerLatency : 0) +
    (graph.hasVectorDb ? vectorLookupLatency : 0) +
    weightedModelLatency * 0.35
  );
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

  if (graph.hasCache) {
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

  if (graph.hasRouter) {
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

  if (graph.hasVectorDb) {
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

  if (graph.modelNodes.length > 0) {
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

  const latencies: LatencyBreakdown = {
    p50: Math.round(p95Latency * 0.72), // deterministic multiplier — not observed P50
    p90: Math.round(p95Latency * 0.92), // deterministic multiplier — not observed P90
    p95: p95Latency,                     // weighted-average path estimate — not observed P95
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

  return {
    p95Latency,
    latencies,
    cacheHitLatency,
    cacheMissLatency,
    criticalPathSegments,
  };
}
