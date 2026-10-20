/**
 * ComputeCanvas — Module 3-C: Multi-Snapshot Visual Comparison & Delta Inspector
 *
 * Pure, deterministic comparison engine connecting snapshot-aware simulation runs,
 * metric deltas, component-level cost attribution, and registry pricing diffs.
 */

import {
  simulate,
  formatCurrency,
  formatLatency,
  type Architecture,
  type Workload,
  type BillCalibration,
  type SimulationResult,
} from './engine';
import {
  getSnapshot,
  type RegistrySnapshot,
  type PricingRecordV2,
  type LifecycleStatus,
} from '../registry';

// ── Types ──

export type ComparisonStatus =
  | 'BOTH_VALID'
  | 'REFERENCE_INVALID'
  | 'COMPARISON_INVALID'
  | 'BOTH_INVALID'
  | 'IDENTICAL_SNAPSHOTS'
  | 'UNKNOWN_SNAPSHOT';

export interface MetricDelta {
  metricId: string;
  label: string;
  unit: string;
  referenceValue: number;
  comparisonValue: number;
  delta: number;
  percentDelta: number | null; // null when referenceValue === 0
  direction: 'increased' | 'decreased' | 'unchanged' | 'not_applicable';
  formattedReference: string;
  formattedComparison: string;
  formattedDelta: string;
  formattedPercent: string;
  isComparable: boolean;
  incompatibilityReason?: string;
}

export interface NodeAttributionDelta {
  nodeId: string;
  label: string;
  type: string;
  modelId?: string;
  refMonthlyCost: number;
  compMonthlyCost: number;
  costDelta: number;
  costPercentDelta: number | null;
  refLatencyMs: number;
  compLatencyMs: number;
  latencyDelta: number;
  refModelStatus?: LifecycleStatus;
  compModelStatus?: LifecycleStatus;
  isCompatible: boolean;
  incompatibilityReason?: string;
  contributionShareOfDelta: number | null; // percentage of total cost delta accounted for by this node
}

export interface ModelPricingDiffItem {
  modelId: string;
  name: string;
  provider: string;
  category: string;
  changeType: 'unchanged' | 'price_changed' | 'lifecycle_changed' | 'both_changed' | 'added' | 'removed';
  refStatus?: LifecycleStatus;
  compStatus?: LifecycleStatus;
  refInputPrice?: number;
  compInputPrice?: number;
  inputPriceDelta?: number;
  inputPricePercentDelta?: number | null;
  refOutputPrice?: number;
  compOutputPrice?: number;
  outputPriceDelta?: number;
  outputPricePercentDelta?: number | null;
  refContextWindow?: number;
  compContextWindow?: number;
  contextWindowDelta?: number;
  notes?: string;
}

export interface SnapshotComparisonResult {
  referenceSnapshotId: string;
  comparisonSnapshotId: string;
  referenceSnapshot?: Readonly<RegistrySnapshot>;
  comparisonSnapshot?: Readonly<RegistrySnapshot>;
  isIdenticalSnapshot: boolean;
  status: ComparisonStatus;
  statusExplanation: string;
  referenceResult?: SimulationResult;
  comparisonResult?: SimulationResult;
  deltas: {
    monthlyCost: MetricDelta;
    costPerRequest: MetricDelta;
    p95Latency: MetricDelta;
    inputTokenCost: MetricDelta;
    outputTokenCost: MetricDelta;
    infraCost: MetricDelta;
    qualityEstimate: MetricDelta;
  };
  bottleneckDelta: {
    refBottleneck: string;
    compBottleneck: string;
    isShifted: boolean;
    explanation: string;
  };
  nodeAttributions: NodeAttributionDelta[];
  modelDiffs: ModelPricingDiffItem[];
  summaryText: string;
  comparisonIdentity: string;
}

/**
 * Computes arithmetic delta and safe percentage between two numeric values.
 * Delta definition: comparison - reference.
 * Prevents division by zero: returns percentDelta = null when reference === 0.
 */
export function calculateNumericDelta(
  metricId: string,
  label: string,
  unit: string,
  refVal: number,
  compVal: number,
  formatter: (val: number) => string,
  isComparable = true,
  incompatibilityReason?: string
): MetricDelta {
  if (!isComparable) {
    return {
      metricId,
      label,
      unit,
      referenceValue: refVal,
      comparisonValue: compVal,
      delta: 0,
      percentDelta: null,
      direction: 'not_applicable',
      formattedReference: formatter(refVal),
      formattedComparison: 'BLOCKED',
      formattedDelta: 'N/A',
      formattedPercent: 'N/A',
      isComparable: false,
      incompatibilityReason: incompatibilityReason || 'Metric cannot be compared due to simulation failure.',
    };
  }

  const delta = compVal - refVal;
  let percentDelta: number | null = null;
  let formattedPercent = 'N/A — reference value is zero';

  if (refVal > 0) {
    percentDelta = (delta / refVal) * 100;
    const sign = percentDelta > 0 ? '+' : '';
    formattedPercent = `${sign}${percentDelta.toFixed(1)}%`;
  } else if (refVal === 0 && compVal === 0) {
    percentDelta = 0;
    formattedPercent = '0.0%';
  }

  let direction: MetricDelta['direction'] = 'unchanged';
  if (delta > 0.0001) direction = 'increased';
  else if (delta < -0.0001) direction = 'decreased';

  const sign = delta > 0 ? '+' : '';
  const formattedDelta = `${sign}${formatter(delta).replace('$-', '-$')}`;

  return {
    metricId,
    label,
    unit,
    referenceValue: refVal,
    comparisonValue: compVal,
    delta,
    percentDelta,
    direction,
    formattedReference: formatter(refVal),
    formattedComparison: formatter(compVal),
    formattedDelta,
    formattedPercent,
    isComparable: true,
  };
}

/**
 * Compares two snapshots on a single controlled architecture and workload.
 */
export function compareSnapshots(input: {
  referenceSnapshotId: string;
  comparisonSnapshotId: string;
  architecture: Architecture;
  workload: Workload;
  calibration?: BillCalibration;
}): SnapshotComparisonResult {
  const {
    referenceSnapshotId,
    comparisonSnapshotId,
    architecture,
    workload,
  } = input;

  const refSnapshot = getSnapshot(referenceSnapshotId);
  const compSnapshot = getSnapshot(comparisonSnapshotId);

  // Check unknown snapshot fail-closed
  if (!refSnapshot || !compSnapshot) {
    const unknownId = !refSnapshot ? referenceSnapshotId : comparisonSnapshotId;
    return {
      referenceSnapshotId,
      comparisonSnapshotId,
      referenceSnapshot: refSnapshot,
      comparisonSnapshot: compSnapshot,
      isIdenticalSnapshot: false,
      status: 'UNKNOWN_SNAPSHOT',
      statusExplanation: `Snapshot ID "${unknownId}" is not present in the authoritative registry catalog. Unknown snapshots cannot be compared.`,
      deltas: {
        monthlyCost: calculateNumericDelta('monthlyCost', 'Monthly Cost', 'USD', 0, 0, formatCurrency, false, 'Unknown snapshot'),
        costPerRequest: calculateNumericDelta('costPerRequest', 'Cost per Request', 'USD', 0, 0, (v) => `$${v.toFixed(4)}`, false, 'Unknown snapshot'),
        p95Latency: calculateNumericDelta('p95Latency', 'P95 Latency', 'ms', 0, 0, formatLatency, false, 'Unknown snapshot'),
        inputTokenCost: calculateNumericDelta('inputTokens', 'Input Token Cost', 'USD', 0, 0, formatCurrency, false, 'Unknown snapshot'),
        outputTokenCost: calculateNumericDelta('outputTokens', 'Output Token Cost', 'USD', 0, 0, formatCurrency, false, 'Unknown snapshot'),
        infraCost: calculateNumericDelta('infraCost', 'Infrastructure Base Cost', 'USD', 0, 0, formatCurrency, false, 'Unknown snapshot'),
        qualityEstimate: calculateNumericDelta('quality', 'Quality Score', 'pts', 0, 0, (v) => `${v}`, false, 'Unknown snapshot'),
      },
      bottleneckDelta: {
        refBottleneck: 'Unknown',
        compBottleneck: 'Unknown',
        isShifted: false,
        explanation: 'Comparison blocked due to unknown snapshot.',
      },
      nodeAttributions: [],
      modelDiffs: [],
      summaryText: `Comparison blocked: snapshot "${unknownId}" does not exist in registry catalog.`,
      comparisonIdentity: `COMP-ERR-${referenceSnapshotId}-${comparisonSnapshotId}`,
    };
  }

  const isIdenticalSnapshot = refSnapshot.metadata.snapshotId === compSnapshot.metadata.snapshotId;

  // Run deterministic simulations for both snapshots
  const refResult = simulate({
    architecture,
    workload,
    pricingSnapshot: refSnapshot.metadata.snapshotId,
  });

  const compResult = simulate({
    architecture,
    workload,
    pricingSnapshot: compSnapshot.metadata.snapshotId,
  });

  const isRefValid = refResult.validation.isValid;
  const isCompValid = compResult.validation.isValid;

  let status: ComparisonStatus = 'BOTH_VALID';
  let statusExplanation = 'Both simulation configurations are valid and fully comparable.';

  if (isIdenticalSnapshot) {
    status = 'IDENTICAL_SNAPSHOTS';
    statusExplanation = 'Both sides reference the exact same snapshot. All mathematical deltas are zero.';
  } else if (!isRefValid && !isCompValid) {
    status = 'BOTH_INVALID';
    statusExplanation = 'Architecture fails validation under both snapshots.';
  } else if (!isRefValid) {
    status = 'REFERENCE_INVALID';
    statusExplanation = `Reference snapshot validation failed: ${refResult.validation.errors.join('; ')}`;
  } else if (!isCompValid) {
    status = 'COMPARISON_INVALID';
    statusExplanation = `Comparison snapshot validation failed: ${compResult.validation.errors.join('; ')}`;
  }

  const areBothValid = isRefValid && isCompValid;

  // Compute Core Metric Deltas
  const monthlyCostDelta = calculateNumericDelta(
    'monthlyCost',
    'Estimated Monthly Cost',
    'USD/mo',
    isRefValid ? refResult.monthlyCost : 0,
    isCompValid ? compResult.monthlyCost : 0,
    formatCurrency,
    areBothValid,
    statusExplanation
  );

  const costPerRequestDelta = calculateNumericDelta(
    'costPerRequest',
    'Cost per Request',
    'USD/req',
    isRefValid ? refResult.costPerRequest : 0,
    isCompValid ? compResult.costPerRequest : 0,
    (v) => `$${v.toFixed(4)}`,
    areBothValid,
    statusExplanation
  );

  const p95LatencyDelta = calculateNumericDelta(
    'p95Latency',
    'Modeled P95 Tail Latency',
    'ms',
    isRefValid ? refResult.p95Latency : 0,
    isCompValid ? compResult.p95Latency : 0,
    formatLatency,
    areBothValid,
    statusExplanation
  );

  const refInputTokensCost = isRefValid ? (refResult.calculationTrace?.modelInputCost || 0) : 0;
  const compInputTokensCost = isCompValid ? (compResult.calculationTrace?.modelInputCost || 0) : 0;
  const inputTokenCostDelta = calculateNumericDelta(
    'inputTokens',
    'Input Token Spend',
    'USD/mo',
    refInputTokensCost,
    compInputTokensCost,
    formatCurrency,
    areBothValid,
    statusExplanation
  );

  const refOutputTokensCost = isRefValid ? (refResult.calculationTrace?.modelOutputCost || 0) : 0;
  const compOutputTokensCost = isCompValid ? (compResult.calculationTrace?.modelOutputCost || 0) : 0;
  const outputTokenCostDelta = calculateNumericDelta(
    'outputTokens',
    'Output Token Spend',
    'USD/mo',
    refOutputTokensCost,
    compOutputTokensCost,
    formatCurrency,
    areBothValid,
    statusExplanation
  );

  const refInfraCost = isRefValid
    ? ((refResult.costBreakdown?.cache || 0) + (refResult.costBreakdown?.vectorDb || 0) + (refResult.costBreakdown?.ingress || 0) + (refResult.costBreakdown?.router || 0))
    : 0;
  const compInfraCost = isCompValid
    ? ((compResult.costBreakdown?.cache || 0) + (compResult.costBreakdown?.vectorDb || 0) + (compResult.costBreakdown?.ingress || 0) + (compResult.costBreakdown?.router || 0))
    : 0;
  const infraCostDelta = calculateNumericDelta(
    'infraCost',
    'Infrastructure Base Spend',
    'USD/mo',
    refInfraCost,
    compInfraCost,
    formatCurrency,
    areBothValid,
    statusExplanation
  );

  const qualityEstimateDelta = calculateNumericDelta(
    'quality',
    'Quality Score',
    'pts',
    isRefValid ? refResult.qualityEstimate : 0,
    isCompValid ? compResult.qualityEstimate : 0,
    (v) => `${Math.round(v)} pts`,
    areBothValid,
    statusExplanation
  );

  // Bottleneck Shift Detection
  const refBottleneckName = isRefValid ? refResult.bottleneck.componentName : 'None';
  const compBottleneckName = isCompValid ? compResult.bottleneck.componentName : 'None';
  const isBottleneckShifted = areBothValid && refBottleneckName !== compBottleneckName;
  const bottleneckExplanation = !areBothValid
    ? 'Bottleneck shift cannot be determined due to validation blockage.'
    : isBottleneckShifted
    ? `Bottleneck shifted from ${refBottleneckName} to ${compBottleneckName} under ${compSnapshot.metadata.label}.`
    : `Primary bottleneck remained at ${refBottleneckName} under both snapshots.`;

  // Component-Level Attribution
  const nodeAttributions: NodeAttributionDelta[] = architecture.nodes.map((node) => {
    const refNode = isRefValid ? refResult.nodeMetrics.get(node.id) : undefined;
    const compNode = isCompValid ? compResult.nodeMetrics.get(node.id) : undefined;

    const refCost = refNode?.monthlyCost ?? 0;
    const compCost = compNode?.monthlyCost ?? 0;
    const costDelta = compCost - refCost;

    let costPercentDelta: number | null = null;
    if (refCost > 0) {
      costPercentDelta = (costDelta / refCost) * 100;
    }

    const refLatency = refNode?.latencyMs ?? 0;
    const compLatency = compNode?.latencyMs ?? 0;
    const latencyDelta = compLatency - refLatency;

    // Model lifecycle check in both snapshots
    const refModelRecord = node.modelId ? refSnapshot.models.find(m => m.id === node.modelId) : undefined;
    const compModelRecord = node.modelId ? compSnapshot.models.find(m => m.id === node.modelId) : undefined;

    const isNodeCompatible = !node.modelId || (compModelRecord?.status === 'ACTIVE' || compModelRecord?.status === undefined);
    let incompatibilityReason: string | undefined;

    if (node.modelId && compModelRecord?.status && compModelRecord.status !== 'ACTIVE') {
      incompatibilityReason = `Model "${node.modelId}" is ${compModelRecord.status} in ${compSnapshot.metadata.label}.`;
    }

    // Share of total cost delta accounted for by this node
    let contributionShareOfDelta: number | null = null;
    if (areBothValid && Math.abs(monthlyCostDelta.delta) > 0.001) {
      contributionShareOfDelta = (costDelta / monthlyCostDelta.delta) * 100;
    }

    return {
      nodeId: node.id,
      label: node.label || node.type,
      type: node.type,
      modelId: node.modelId,
      refMonthlyCost: refCost,
      compMonthlyCost: compCost,
      costDelta,
      costPercentDelta,
      refLatencyMs: refLatency,
      compLatencyMs: compLatency,
      latencyDelta,
      refModelStatus: refModelRecord?.status,
      compModelStatus: compModelRecord?.status,
      isCompatible: isNodeCompatible,
      incompatibilityReason,
      contributionShareOfDelta,
    };
  });

  // Registry Model & Pricing Catalog Diff
  const modelDiffs = computeModelCatalogDiff(refSnapshot, compSnapshot);

  // Generate Factual Change Summary
  const summaryText = buildFactualSummary({
    refSnapshot,
    compSnapshot,
    status,
    areBothValid,
    monthlyCostDelta,
    p95LatencyDelta,
    isBottleneckShifted,
    refBottleneckName,
    compBottleneckName,
    nodeAttributions,
  });

  const comparisonIdentity = `CMP-${refSnapshot.metadata.snapshotId.slice(0, 8)}-${compSnapshot.metadata.snapshotId.slice(0, 8)}-${architecture.nodes.length}N-${workload.requestsPerMonth}R`;

  return {
    referenceSnapshotId,
    comparisonSnapshotId,
    referenceSnapshot: refSnapshot,
    comparisonSnapshot: compSnapshot,
    isIdenticalSnapshot,
    status,
    statusExplanation,
    referenceResult: refResult,
    comparisonResult: compResult,
    deltas: {
      monthlyCost: monthlyCostDelta,
      costPerRequest: costPerRequestDelta,
      p95Latency: p95LatencyDelta,
      inputTokenCost: inputTokenCostDelta,
      outputTokenCost: outputTokenCostDelta,
      infraCost: infraCostDelta,
      qualityEstimate: qualityEstimateDelta,
    },
    bottleneckDelta: {
      refBottleneck: refBottleneckName,
      compBottleneck: compBottleneckName,
      isShifted: isBottleneckShifted,
      explanation: bottleneckExplanation,
    },
    nodeAttributions,
    modelDiffs,
    summaryText,
    comparisonIdentity,
  };
}

/**
 * Computes canonical model catalog and pricing rate differences between two snapshots.
 */
export function computeModelCatalogDiff(
  refInput: Readonly<RegistrySnapshot> | string,
  compInput: Readonly<RegistrySnapshot> | string
): ModelPricingDiffItem[] {
  const refSnapshot = typeof refInput === 'string' ? getSnapshot(refInput) : refInput;
  const compSnapshot = typeof compInput === 'string' ? getSnapshot(compInput) : compInput;

  if (!refSnapshot || !compSnapshot) return [];

  const diffs: ModelPricingDiffItem[] = [];

  // Find pricing records in snapshots
  const getPricing = (snap: Readonly<RegistrySnapshot>, modelId: string): PricingRecordV2 | undefined => {
    return snap.pricing.find(p => p.resourceId === modelId);
  };

  // Inspect models in reference snapshot
  for (const refModel of refSnapshot.models) {
    const compModel = compSnapshot.models.find(m => m.id === refModel.id);
    const refP = getPricing(refSnapshot, refModel.id);

    if (!compModel) {
      // Model was removed / not present in comparison snapshot
      diffs.push({
        modelId: refModel.id,
        name: refModel.product,
        provider: refModel.provider,
        category: refModel.category,
        changeType: 'removed',
        refStatus: refModel.status,
        refInputPrice: refP?.inputPricePer1M,
        refOutputPrice: refP?.outputPricePer1M,
        refContextWindow: refModel.contextWindowTokens,
        notes: `Model present in ${refSnapshot.metadata.label} but omitted from ${compSnapshot.metadata.label}.`,
      });
      continue;
    }

    const compP = getPricing(compSnapshot, compModel.id);

    const refIn = refP?.inputPricePer1M ?? 0;
    const compIn = compP?.inputPricePer1M ?? 0;
    const inDelta = compIn - refIn;
    const inPercentDelta = refIn > 0 ? (inDelta / refIn) * 100 : null;

    const refOut = refP?.outputPricePer1M ?? 0;
    const compOut = compP?.outputPricePer1M ?? 0;
    const outDelta = compOut - refOut;
    const outPercentDelta = refOut > 0 ? (outDelta / refOut) * 100 : null;

    const statusChanged = refModel.status !== compModel.status;
    const priceChanged = Math.abs(inDelta) > 0.0001 || Math.abs(outDelta) > 0.0001;

    let changeType: ModelPricingDiffItem['changeType'] = 'unchanged';
    if (statusChanged && priceChanged) changeType = 'both_changed';
    else if (statusChanged) changeType = 'lifecycle_changed';
    else if (priceChanged) changeType = 'price_changed';

    const ctxDelta = (compModel.contextWindowTokens ?? 0) - (refModel.contextWindowTokens ?? 0);

    diffs.push({
      modelId: refModel.id,
      name: compModel.product || refModel.product,
      provider: compModel.provider || refModel.provider,
      category: compModel.category || refModel.category,
      changeType,
      refStatus: refModel.status,
      compStatus: compModel.status,
      refInputPrice: refIn,
      compInputPrice: compIn,
      inputPriceDelta: inDelta,
      inputPricePercentDelta: inPercentDelta,
      refOutputPrice: refOut,
      compOutputPrice: compOut,
      outputPriceDelta: outDelta,
      outputPricePercentDelta: outPercentDelta,
      refContextWindow: refModel.contextWindowTokens,
      compContextWindow: compModel.contextWindowTokens,
      contextWindowDelta: ctxDelta,
      notes: compModel.notes,
    });
  }

  // Inspect models newly added in comparison snapshot
  for (const compModel of compSnapshot.models) {
    if (!refSnapshot.models.some(m => m.id === compModel.id)) {
      const compP = getPricing(compSnapshot, compModel.id);
      diffs.push({
        modelId: compModel.id,
        name: compModel.product,
        provider: compModel.provider,
        category: compModel.category,
        changeType: 'added',
        compStatus: compModel.status,
        compInputPrice: compP?.inputPricePer1M,
        compOutputPrice: compP?.outputPricePer1M,
        compContextWindow: compModel.contextWindowTokens,
        notes: `Newly introduced in ${compSnapshot.metadata.label}.`,
      });
    }
  }

  return diffs;
}

/**
 * Builds a factual, non-speculative summary of the snapshot comparison.
 */
function buildFactualSummary(params: {
  refSnapshot: Readonly<RegistrySnapshot>;
  compSnapshot: Readonly<RegistrySnapshot>;
  status: ComparisonStatus;
  areBothValid: boolean;
  monthlyCostDelta: MetricDelta;
  p95LatencyDelta: MetricDelta;
  isBottleneckShifted: boolean;
  refBottleneckName: string;
  compBottleneckName: string;
  nodeAttributions: NodeAttributionDelta[];
}): string {
  const {
    refSnapshot,
    compSnapshot,
    status,
    areBothValid,
    monthlyCostDelta,
    p95LatencyDelta,
    isBottleneckShifted,
    refBottleneckName,
    compBottleneckName,
    nodeAttributions,
  } = params;

  if (status === 'IDENTICAL_SNAPSHOTS') {
    return `Evaluated under identical snapshot "${refSnapshot.metadata.label}". No cost, latency, or registry variances exist.`;
  }

  if (!areBothValid) {
    const invalidNodes = nodeAttributions.filter(n => !n.isCompatible);
    if (invalidNodes.length > 0) {
      const reasons = invalidNodes.map(n => n.incompatibilityReason).filter(Boolean);
      return `Simulation comparison withheld: ${reasons.join(' ')}`;
    }
    return `Simulation comparison withheld: configuration fails validation under ${status === 'REFERENCE_INVALID' ? refSnapshot.metadata.label : compSnapshot.metadata.label}.`;
  }

  // Factual economic delta statement
  let costStatement = 'Modeled monthly cost is unchanged between snapshots.';
  if (monthlyCostDelta.direction === 'increased') {
    costStatement = `Modeled monthly cost increased by ${monthlyCostDelta.formattedDelta} (${monthlyCostDelta.formattedPercent}) under ${compSnapshot.metadata.label}.`;
  } else if (monthlyCostDelta.direction === 'decreased') {
    costStatement = `Modeled monthly cost decreased by ${monthlyCostDelta.formattedDelta.replace('+-', '-')} (${monthlyCostDelta.formattedPercent}) under ${compSnapshot.metadata.label}.`;
  }

  // Latency statement
  let latencyStatement = 'P95 latency remains identical.';
  if (p95LatencyDelta.direction === 'increased') {
    latencyStatement = `P95 tail latency increased by ${p95LatencyDelta.formattedDelta}.`;
  } else if (p95LatencyDelta.direction === 'decreased') {
    latencyStatement = `P95 tail latency decreased by ${p95LatencyDelta.formattedDelta}.`;
  }

  // Bottleneck statement
  let bottleneckStatement = `Bottleneck is consistent at ${refBottleneckName}.`;
  if (isBottleneckShifted) {
    bottleneckStatement = `Primary bottleneck shifted from ${refBottleneckName} to ${compBottleneckName}.`;
  }

  // Top component contributor
  const sortedNodes = [...nodeAttributions].sort((a, b) => Math.abs(b.costDelta) - Math.abs(a.costDelta));
  let topNodeStatement = '';
  if (sortedNodes.length > 0 && Math.abs(sortedNodes[0].costDelta) > 0.01) {
    const top = sortedNodes[0];
    topNodeStatement = ` Primary cost driver is "${top.label}" (${top.costDelta > 0 ? '+' : ''}${formatCurrency(top.costDelta)}/mo).`;
  }

  return `${costStatement} ${latencyStatement} ${bottleneckStatement}${topNodeStatement}`;
}
