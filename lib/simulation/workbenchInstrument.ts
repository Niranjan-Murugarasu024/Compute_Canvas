/* ──────────────────────────────────────────────
   COMPUTECANVAS 3.2 — WORKBENCH INSTRUMENT UTILITIES
   Causality, State Identity, Plaintext Tracing & Spec Export
   ────────────────────────────────────────────── */

import {
  type Architecture,
  type Workload,
  type BillCalibration,
  type SimulationResult,
  type CalculationTrace,
  type ArchNode,
  formatCurrency,
  formatLatency,
  formatNumber,
} from './engine';

export interface ParameterDeltaItem {
  id: string;
  label: string;
  category: 'workload' | 'routing' | 'topology' | 'model';
  baseline: string;
  current: string;
  delta?: string;
  unit?: string;
}

/**
 * Deterministically generates a unique simulation snapshot ID.
 * Format: CC-[BLUEPRINT]-[SNAPSHOT]-[REGISTRY]
 */
export function generateSimulationSnapshotId(
  blueprintIdOrName: string,
  pricingSnapshot = '2026-03',
  registryVersion = 'v1.4'
): string {
  const cleanId = blueprintIdOrName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 16) || 'CUSTOM';

  const cleanSnap = pricingSnapshot.toUpperCase().replace(/[^A-Z0-9]/g, '-');
  const cleanReg = registryVersion.toUpperCase().replace(/[^A-Z0-9]/g, '-');
  return `CC-${cleanId}-${cleanSnap}-${cleanReg}`;
}

/**
 * Deterministically computes all parameter differences between baseline and current state.
 */
export function computeBaselineDeltas(
  baselineWorkload: Workload,
  currentWorkload: Workload,
  baselineArch: Architecture,
  currentArch: Architecture
): {
  deltas: ParameterDeltaItem[];
  modifiedCount: number;
  requestsDeltaText: string;
  cacheDeltaText: string;
  baselineRoutingSummary: string;
  currentRoutingSummary: string;
  routingDeltaText: string;
  topologyDeltaText: string;
} {
  const deltas: ParameterDeltaItem[] = [];

  // 1. Monthly requests
  if (currentWorkload.requestsPerMonth !== baselineWorkload.requestsPerMonth) {
    const diff = currentWorkload.requestsPerMonth - baselineWorkload.requestsPerMonth;
    deltas.push({
      id: 'requests',
      label: 'Monthly Requests',
      category: 'workload',
      baseline: `${formatNumber(baselineWorkload.requestsPerMonth)} req/mo`,
      current: `${formatNumber(currentWorkload.requestsPerMonth)} req/mo`,
      delta: `${diff > 0 ? '+' : ''}${formatNumber(diff)} req/mo`,
    });
  }

  // 2. Cache hit rate
  const baselineCachePct = Math.round(baselineWorkload.cacheHitRate * 100);
  const currentCachePct = Math.round(currentWorkload.cacheHitRate * 100);
  if (currentCachePct !== baselineCachePct) {
    const diff = currentCachePct - baselineCachePct;
    deltas.push({
      id: 'cache-rate',
      label: 'Semantic Cache Hit Rate',
      category: 'workload',
      baseline: `${baselineCachePct}%`,
      current: `${currentCachePct}%`,
      delta: `${diff > 0 ? '+' : ''}${diff} pts`,
    });
  }

  // 3. Input tokens
  if (currentWorkload.avgInputTokens !== baselineWorkload.avgInputTokens) {
    const diff = currentWorkload.avgInputTokens - baselineWorkload.avgInputTokens;
    deltas.push({
      id: 'input-tokens',
      label: 'Avg Input Tokens',
      category: 'workload',
      baseline: `${formatNumber(baselineWorkload.avgInputTokens)} tokens`,
      current: `${formatNumber(currentWorkload.avgInputTokens)} tokens`,
      delta: `${diff > 0 ? '+' : ''}${formatNumber(diff)}`,
    });
  }

  // 4. Output tokens
  if (currentWorkload.avgOutputTokens !== baselineWorkload.avgOutputTokens) {
    const diff = currentWorkload.avgOutputTokens - baselineWorkload.avgOutputTokens;
    deltas.push({
      id: 'output-tokens',
      label: 'Avg Output Tokens',
      category: 'workload',
      baseline: `${formatNumber(baselineWorkload.avgOutputTokens)} tokens`,
      current: `${formatNumber(currentWorkload.avgOutputTokens)} tokens`,
      delta: `${diff > 0 ? '+' : ''}${formatNumber(diff)}`,
    });
  }

  // 5. Routing edges differences
  currentArch.edges.forEach(edge => {
    if (edge.trafficShare !== undefined) {
      const baseEdge = baselineArch.edges.find(e => e.source === edge.source && e.target === edge.target);
      const currPct = Math.round(edge.trafficShare * 100);
      const basePct = baseEdge && baseEdge.trafficShare !== undefined ? Math.round(baseEdge.trafficShare * 100) : 100;
      if (currPct !== basePct) {
        const targetNode = currentArch.nodes.find(n => n.id === edge.target);
        deltas.push({
          id: `route-${edge.source}-${edge.target}`,
          label: `${targetNode?.label || 'Route'} Allocation`,
          category: 'routing',
          baseline: `${basePct}%`,
          current: `${currPct}%`,
          delta: `${currPct - basePct > 0 ? '+' : ''}${currPct - basePct} pts`,
        });
      }
    }
  });

  // 6. Node additions / removals
  const baseNodeIds = new Set(baselineArch.nodes.map(n => n.id));
  const currNodeIds = new Set(currentArch.nodes.map(n => n.id));

  currentArch.nodes.forEach(node => {
    if (!baseNodeIds.has(node.id)) {
      deltas.push({
        id: `node-add-${node.id}`,
        label: `Added Component`,
        category: 'topology',
        baseline: 'None',
        current: `${node.label} (${node.type})`,
      });
    }
  });

  baselineArch.nodes.forEach(node => {
    if (!currNodeIds.has(node.id)) {
      deltas.push({
        id: `node-rem-${node.id}`,
        label: `Removed Component`,
        category: 'topology',
        baseline: `${node.label} (${node.type})`,
        current: 'Removed',
      });
    }
  });

  // 7. Model selection changes
  currentArch.nodes.forEach(node => {
    const baseNode = baselineArch.nodes.find(n => n.id === node.id);
    if (baseNode && node.modelId && baseNode.modelId && node.modelId !== baseNode.modelId) {
      deltas.push({
        id: `model-${node.id}`,
        label: `${node.label} Model Target`,
        category: 'model',
        baseline: baseNode.modelId,
        current: node.modelId,
      });
    }
  });

  // Helper summaries
  const reqDeltaItem = deltas.find(d => d.id === 'requests');
  const cacheDeltaItem = deltas.find(d => d.id === 'cache-rate');
  const routingDeltaItems = deltas.filter(d => d.category === 'routing');
  const topologyDeltaItems = deltas.filter(d => d.category === 'topology');

  const formatRoutingSummary = (arch: Architecture) => {
    const routeEdges = arch.edges.filter(e => e.trafficShare !== undefined);
    if (routeEdges.length === 0) return 'Standard Direct';
    return routeEdges.map(e => `${Math.round((e.trafficShare || 0) * 100)}%`).join(' / ');
  };

  const baselineRoutingSummary = formatRoutingSummary(baselineArch);
  const currentRoutingSummary = formatRoutingSummary(currentArch);

  return {
    deltas,
    modifiedCount: deltas.length,
    requestsDeltaText: reqDeltaItem?.delta || 'Unchanged',
    cacheDeltaText: cacheDeltaItem?.delta || 'Unchanged',
    baselineRoutingSummary,
    currentRoutingSummary,
    routingDeltaText: routingDeltaItems.length > 0 ? `${routingDeltaItems.length} routes shifted` : 'Unchanged',
    topologyDeltaText: topologyDeltaItems.length > 0 ? `${topologyDeltaItems.length} nodes changed` : 'Unchanged',
  };
}

/**
 * Deterministic explanation of why a selected component matters within the architecture.
 * Strict logic — deterministic calculation directly from active graph topology.
 */
export function getComponentCausalRole(
  node: ArchNode,
  workload: Workload,
  architecture: Architecture,
  result: SimulationResult
): {
  role: string;
  whyItMatters: string;
  sourceType: 'PROVIDER' | 'INTERNAL REFERENCE' | 'DERIVED';
  registryVersion: string;
  pricingSnapshot: string;
} {
  const metric = result.nodeMetrics.get(node.id);
  const costPct = metric?.costPercentage || 0;
  const isBottleneck = result.bottleneck.nodeId === node.id;

  switch (node.type) {
    case 'api':
      return {
        role: 'Request entry point & TLS rate-limiting gateway',
        whyItMatters: `Ingress processes 100% of ingress requests (${formatNumber(workload.requestsPerMonth)} req/mo) with edge rate limiting. Incurs fixed infrastructure tariff ($0.60/1M requests).`,
        sourceType: 'INTERNAL REFERENCE',
        registryVersion: 'v1.4',
        pricingSnapshot: '2026-03',
      };
    case 'cache': {
      const hitPct = Math.round(workload.cacheHitRate * 100);
      const cachedReqs = Math.round(workload.requestsPerMonth * workload.cacheHitRate);
      return {
        role: 'Semantic prompt & embedding caching layer',
        whyItMatters: `Intercepts ${hitPct}% of ingress traffic (${formatNumber(cachedReqs)} req/mo) directly in RAM. Bypasses downstream complexity routing and LLM token billing, reducing tail latency by ~80-120ms on hit.`,
        sourceType: 'INTERNAL REFERENCE',
        registryVersion: 'v1.4',
        pricingSnapshot: '2026-03',
      };
    }
    case 'router':
      return {
        role: 'Dynamic prompt classification and intent routing',
        whyItMatters: `Evaluates prompt complexity on cache-missed traffic and partitions requests between high-throughput utility tiers and frontier reasoning tiers, balancing unit economics with model capability.`,
        sourceType: 'INTERNAL REFERENCE',
        registryVersion: 'v1.4',
        pricingSnapshot: '2026-03',
      };
    case 'vectordb':
      return {
        role: 'Approximate nearest-neighbor vector retrieval for RAG grounding',
        whyItMatters: `Hosts chunk embeddings and queries factual context documents. Accounts for cluster baseline infrastructure and adds ~45ms retrieval latency to the end-to-end critical path.`,
        sourceType: 'INTERNAL REFERENCE',
        registryVersion: 'v1.4',
        pricingSnapshot: '2026-03',
      };
    case 'fast-model':
      return {
        role: 'High-throughput low-latency utility inference tier',
        whyItMatters: `Handles routine prompts and classification tasks with sub-150ms execution at low cost ($0.15/1M input, $0.60/1M output), defending total architecture spend from runaway frontier charges.`,
        sourceType: 'PROVIDER',
        registryVersion: 'v1.4',
        pricingSnapshot: '2026-03',
      };
    case 'frontier-model':
    case 'model':
      return {
        role: 'High-intelligence reasoning and multi-step agent execution',
        whyItMatters: isBottleneck
          ? `Primary architectural cost driver (${costPct}% of total modeled monthly cost). Consumes the largest share of token expenditure and governs P95 critical-path latency.`
          : `Executes high-complexity synthesis. Billed at premium token rates ($2.50/1M input, $10.00/1M output); traffic allocation directly controls budget scaling.`,
        sourceType: 'PROVIDER',
        registryVersion: 'v1.4',
        pricingSnapshot: '2026-03',
      };
    default:
      return {
        role: 'Modular architecture node',
        whyItMatters: `Integrated pipeline component contributing to total modeled monthly economics (${formatCurrency(metric?.monthlyCost || 0)}/mo).`,
        sourceType: 'DERIVED',
        registryVersion: 'v1.4',
        pricingSnapshot: '2026-03',
      };
  }
}

/**
 * Formats calculation trace into clean, copyable plain-text markdown
 * suitable for engineering pull requests, design review docs, and tickets.
 */
export function formatCalculationTraceAsText(
  trace: CalculationTrace,
  blueprintName: string,
  snapshotId: string,
  result: SimulationResult,
  calibrated?: { isCalibrated: boolean; calibratedMonthlyCost: number; calibrationFactor: number }
): string {
  const lines: string[] = [
    `# ComputeCanvas Calculation Trace`,
    `Blueprint: ${blueprintName}`,
    `Snapshot: ${snapshotId}`,
    `Registry: v1.4 | Pricing Snapshot: March 2026`,
    `Generated: ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC`,
    `Methodology: Deterministic mathematical graph modeling (No stochastic sampling)`,
    ``,
    `## 1. WORKLOAD & TRAFFIC`,
    `  Ingress Requests: ${formatNumber(trace.totalRequests)} / mo`,
    `  Semantic Cache Hit Rate: ${Math.round(trace.cacheHitRate * 100)}%`,
    `  Cached Requests (Terminated): ${formatNumber(trace.cachedRequests)} / mo`,
    `  Model Inference Requests (Missed): ${formatNumber(trace.uncachedRequests)} / mo`,
    `  Average Tokens: ${formatNumber(trace.avgInputTokens)} in / ${formatNumber(trace.avgOutputTokens)} out per req`,
    `  Total Modeled Tokens: ${formatNumber(trace.totalInputTokens)} in / ${formatNumber(trace.totalOutputTokens)} out`,
    ``,
    `## 2. REASONING MODEL TIER BREAKDOWN`,
  ];

  if (trace.models && trace.models.length > 0) {
    trace.models.forEach(m => {
      lines.push(
        `  - ${m.modelName}: ${Math.round(m.trafficShare * 100)}% route | ${formatNumber(m.routedRequests)} reqs/mo`
      );
      lines.push(
        `    Input Cost: ${formatCurrency(m.inputCost)} | Output Cost: ${formatCurrency(m.outputCost)} | Subtotal: ${formatCurrency(m.totalCost)}/mo`
      );
    });
  } else {
    lines.push(`  (No reasoning models active)`);
  }

  lines.push(``);
  lines.push(`## 3. INFRASTRUCTURE SUBSYSTEMS`);
  lines.push(`  Semantic Cache: ${formatCurrency(trace.cacheCost)} / mo`);
  lines.push(`  API Gateway Ingress: ${formatCurrency(trace.ingressCost)} / mo`);
  if (trace.routerCost > 0) {
    lines.push(`  Complexity Router: ${formatCurrency(trace.routerCost)} / mo`);
  }
  if (trace.vectorDbCost > 0) {
    lines.push(`  Vector Database Retrieval: ${formatCurrency(trace.vectorDbCost)} / mo`);
  }

  lines.push(``);
  lines.push(`## 4. MODELED TOTALS`);
  lines.push(`  Raw Modeled Monthly Cost: ${formatCurrency(trace.totalCost)} / mo`);
  lines.push(`  Raw Modeled Cost / Request: $${trace.costPerRequest.toFixed(4)}`);
  lines.push(`  Modeled Tail Latency (P95): ${formatLatency(result.p95Latency)}`);
  lines.push(`  Primary Bottleneck: ${result.bottleneck.componentName} (${result.bottleneck.impactPercentage}% cost share)`);
  lines.push(`  Capability Tier: ${result.capabilityTier || 'BALANCED'}`);

  if (calibrated?.isCalibrated) {
    lines.push(``);
    lines.push(`## 5. HISTORICAL BILL CALIBRATION`);
    lines.push(`  Calibrated Monthly Cost: ${formatCurrency(calibrated.calibratedMonthlyCost)} / mo`);
    lines.push(`  Calibration Factor: ${calibrated.calibrationFactor.toFixed(2)}x empirical variance`);
  }

  return lines.join('\n');
}

/**
 * Builds the comprehensive Export Specification 2.0 object.
 */
export function buildExportSpecification(
  architecture: Architecture,
  workload: Workload,
  calibration: BillCalibration,
  result: SimulationResult,
  blueprintName: string,
  snapshotId: string
) {
  return {
    $schema: 'https://computecanvas.io/schemas/v2/simulation-spec.json',
    specVersion: 2,
    simulationSnapshotId: snapshotId,
    generatedAt: new Date().toISOString(),
    blueprint: {
      id: architecture.id || 'custom',
      name: blueprintName,
    },
    provenance: {
      registryVersion: 'v1.4',
      pricingSnapshot: '2026-03',
      engine: 'deterministic-discrete-graph-v1',
      disclaimer: 'Modeled analytical simulation; not live production infrastructure telemetry.',
    },
    workload: {
      requestsPerMonth: workload.requestsPerMonth,
      avgInputTokens: workload.avgInputTokens,
      avgOutputTokens: workload.avgOutputTokens,
      cacheHitRate: workload.cacheHitRate,
      concurrency: workload.concurrency,
    },
    topology: {
      nodes: architecture.nodes.map(n => ({
        id: n.id,
        type: n.type,
        label: n.label,
        modelId: n.modelId,
        x: n.x,
        y: n.y,
      })),
      edges: architecture.edges.map(e => ({
        source: e.source,
        target: e.target,
        trafficShare: e.trafficShare,
      })),
    },
    modeledEconomics: {
      monthlyCost: result.monthlyCost,
      costPerRequest: result.costPerRequest,
      costBreakdown: result.costBreakdown,
    },
    modeledLatency: {
      p95LatencyMs: result.p95Latency,
      percentiles: result.latencies,
    },
    bottleneck: result.bottleneck,
    capabilityTier: result.capabilityTier,
    historicalCalibration: calibration.enabled
      ? {
          active: true,
          actualBill: calibration.actualBill,
          actualRequests: calibration.actualRequests,
          baselineSimulatedCost: calibration.baselineSimulatedCost,
        }
      : { active: false },
    calculationTrace: result.calculationTrace,
  };
}
