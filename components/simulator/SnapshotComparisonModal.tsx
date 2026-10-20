'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  getAllSnapshots,
  DEFAULT_SNAPSHOT_ID,
  LATEST_SNAPSHOT_ID,
} from '@/lib/registry';
import {
  compareSnapshots,
  type SnapshotComparisonResult,
  type MetricDelta,
  type NodeAttributionDelta,
  type ModelPricingDiffItem,
} from '@/lib/simulation/snapshotComparison';
import {
  formatCurrency,
  formatNumber,
  type Architecture,
  type Workload,
  type BillCalibration,
} from '@/lib/simulation/engine';
import { encodeArchitectureState } from '@/lib/simulation/sharing';

interface SnapshotComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  architecture: Architecture;
  workload: Workload;
  calibration?: BillCalibration;
  initialReferenceSnapshotId?: string;
  initialComparisonSnapshotId?: string;
  onApplySnapshotToWorkbench?: (snapshotId: string) => void;
  showToast?: (msg: string) => void;
}

export default function SnapshotComparisonModal({
  isOpen,
  onClose,
  architecture,
  workload,
  calibration,
  initialReferenceSnapshotId,
  initialComparisonSnapshotId,
  onApplySnapshotToWorkbench,
  showToast,
}: SnapshotComparisonModalProps) {
  const availableSnapshots = useMemo(() => getAllSnapshots(), []);

  // Explicit user selection overrides props
  const [selectedRefSnapshotId, setSelectedRefSnapshotId] = useState<string | null>(null);
  const [selectedCompSnapshotId, setSelectedCompSnapshotId] = useState<string | null>(null);

  const refSnapshotId = selectedRefSnapshotId ?? (initialReferenceSnapshotId || DEFAULT_SNAPSHOT_ID);
  const compSnapshotId = selectedCompSnapshotId ?? (initialComparisonSnapshotId || LATEST_SNAPSHOT_ID);

  // Active view tab inside modal
  const [activeTab, setActiveTab] = useState<'metrics' | 'attribution' | 'catalog' | 'provenance'>('metrics');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogFilter, setCatalogFilter] = useState<'all' | 'changed' | 'lifecycle'>('all');

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Compute deterministic snapshot comparison
  const comparison: SnapshotComparisonResult = useMemo(() => {
    return compareSnapshots({
      referenceSnapshotId: refSnapshotId,
      comparisonSnapshotId: compSnapshotId,
      architecture,
      workload,
      calibration,
    });
  }, [refSnapshotId, compSnapshotId, architecture, workload, calibration]);

  // Swap snapshots
  const handleSwapSnapshots = () => {
    setSelectedRefSnapshotId(compSnapshotId);
    setSelectedCompSnapshotId(refSnapshotId);
  };

  // Generate shareable URL for this exact comparison
  const handleShareComparison = () => {
    try {
      const encoded = encodeArchitectureState({
        architecture,
        workload,
        calibration,
        pricingSnapshot: refSnapshotId,
        comparisonSnapshot: compSnapshotId,
      });
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://computecanvas.io';
      const shareUrl = `${origin}/simulator?data=${encoded}&snapshot=${encodeURIComponent(refSnapshotId)}&compareSnapshot=${encodeURIComponent(compSnapshotId)}`;
      navigator.clipboard.writeText(shareUrl);
      if (showToast) {
        showToast('Reproducible comparison URL copied to clipboard.');
      }
    } catch {
      if (showToast) {
        showToast('Unable to generate comparison share link.');
      }
    }
  };

  // Export specification JSON
  const handleExportComparisonSpec = () => {
    const spec = {
      specVersion: '1.0',
      product: 'ComputeCanvas Multi-Snapshot Delta Spec',
      comparisonIdentity: comparison.comparisonIdentity,
      generatedAt: new Date().toISOString(),
      referenceSnapshot: {
        id: comparison.referenceSnapshot?.metadata.snapshotId,
        label: comparison.referenceSnapshot?.metadata.label,
        contentHash: comparison.referenceSnapshot?.metadata.contentHash,
      },
      comparisonSnapshot: {
        id: comparison.comparisonSnapshot?.metadata.snapshotId,
        label: comparison.comparisonSnapshot?.metadata.label,
        contentHash: comparison.comparisonSnapshot?.metadata.contentHash,
      },
      status: comparison.status,
      summaryText: comparison.summaryText,
      workload,
      architecture: {
        nodesCount: architecture.nodes.length,
        edgesCount: architecture.edges.length,
      },
      deltas: {
        monthlyCost: comparison.deltas.monthlyCost,
        costPerRequest: comparison.deltas.costPerRequest,
        p95Latency: comparison.deltas.p95Latency,
        inputTokenCost: comparison.deltas.inputTokenCost,
        outputTokenCost: comparison.deltas.outputTokenCost,
        infraCost: comparison.deltas.infraCost,
        qualityEstimate: comparison.deltas.qualityEstimate,
      },
      nodeAttributions: comparison.nodeAttributions,
      modelDiffs: comparison.modelDiffs,
    };

    const blob = new Blob([JSON.stringify(spec, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `computecanvas-snapshot-delta-${comparison.comparisonIdentity.toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    if (showToast) {
      showToast('Comparison specification exported.');
    }
  };

  if (!isOpen) return null;

  // Filter model diffs
  const filteredModelDiffs = comparison.modelDiffs.filter((item) => {
    if (catalogFilter === 'changed' && item.changeType === 'unchanged') return false;
    if (catalogFilter === 'lifecycle' && item.changeType !== 'lifecycle_changed' && item.changeType !== 'both_changed') return false;
    if (catalogSearch.trim()) {
      const q = catalogSearch.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.modelId.toLowerCase().includes(q) ||
        item.provider.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const areBothValid = comparison.status === 'BOTH_VALID' || comparison.status === 'IDENTICAL_SNAPSHOTS';

  return (
    <div
      className="dialog-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="snapshot-compare-title"
    >
      <div className="dialog-window dialog-xl compare-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="dialog-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge-tag" style={{ background: '#27272A', color: '#FFFFFF' }}>
                MODULE 3-C INSTRUMENT
              </span>
              <span className="text-mono" style={{ fontSize: '0.75rem', color: '#A1A1AA' }}>
                ID: {comparison.comparisonIdentity}
              </span>
            </div>
            <h3 id="snapshot-compare-title" className="dialog-title">
              MULTI-SNAPSHOT VISUAL COMPARISON &amp; DELTA INSPECTOR
            </h3>
            <p className="dialog-subtitle">
              Deterministic analytical delta across versioned pricing assumptions, model lifecycles, and modeled consequences.
            </p>
          </div>
          <button onClick={onClose} className="dialog-close-btn" aria-label="Close Comparison Inspector">
            ✕
          </button>
        </div>

        {/* Snapshot Selection Strip */}
        <div className="compare-selection-bar">
          <div className="snapshot-select-column">
            <span className="compare-select-label">REFERENCE SNAPSHOT (BASELINE ASSUMPTION):</span>
            <select
              className="compare-dropdown"
              value={refSnapshotId}
              onChange={(e) => setSelectedRefSnapshotId(e.target.value)}
              aria-label="Select Reference Snapshot"
            >
              {availableSnapshots.map((s) => (
                <option key={`ref-${s.metadata.snapshotId}`} value={s.metadata.snapshotId}>
                  {s.metadata.label} ({s.metadata.snapshotId.slice(0, 15)}…)
                </option>
              ))}
            </select>
            <div className="compare-snapshot-meta">
              <span>Hash: {comparison.referenceSnapshot?.metadata.contentHash.slice(0, 10)}…</span>
              <span>·</span>
              <span>Models: {comparison.referenceSnapshot?.models.length ?? 0}</span>
              <span>·</span>
              <span>Infra: {comparison.referenceSnapshot?.infrastructure.length ?? 0}</span>
            </div>
          </div>

          <button
            onClick={handleSwapSnapshots}
            className="swap-snapshots-btn"
            title="Swap Reference and Comparison Snapshots"
            aria-label="Swap Snapshots"
          >
            ⇄
          </button>

          <div className="snapshot-select-column">
            <span className="compare-select-label">COMPARISON SNAPSHOT (TARGET EVALUATION):</span>
            <select
              className="compare-dropdown"
              value={compSnapshotId}
              onChange={(e) => setSelectedCompSnapshotId(e.target.value)}
              aria-label="Select Comparison Snapshot"
            >
              {availableSnapshots.map((s) => (
                <option key={`comp-${s.metadata.snapshotId}`} value={s.metadata.snapshotId}>
                  {s.metadata.label} ({s.metadata.snapshotId.slice(0, 15)}…)
                </option>
              ))}
            </select>
            <div className="compare-snapshot-meta">
              <span>Hash: {comparison.comparisonSnapshot?.metadata.contentHash.slice(0, 10)}…</span>
              <span>·</span>
              <span>Models: {comparison.comparisonSnapshot?.models.length ?? 0}</span>
              <span>·</span>
              <span>Infra: {comparison.comparisonSnapshot?.infrastructure.length ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Controlled Parameter Context Banner */}
        <div className="controlled-context-strip">
          <span className="text-mono" style={{ color: '#A1A1AA', fontSize: '0.75rem' }}>
            CONTROLLED CONFIGURATION:
          </span>
          <span className="context-item">
            <strong>Architecture:</strong> {architecture.name || 'Current Canvas'} ({architecture.nodes.length} nodes, {architecture.edges.length} edges)
          </span>
          <span className="context-item">
            <strong>Workload:</strong> {formatNumber(workload.requestsPerMonth)} req/mo · {workload.avgInputTokens} in / {workload.avgOutputTokens} out · {Math.round(workload.cacheHitRate * 100)}% cache
          </span>
        </div>

        {/* Primary Status Banner */}
        <div className={`status-banner status-${comparison.status.toLowerCase()}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className={`status-pill pill-${comparison.status.toLowerCase()}`}>
              {comparison.status.replace(/_/g, ' ')}
            </span>
            <span className="status-text">{comparison.summaryText}</span>
          </div>
        </div>

        {/* Hero Delta Readout (when comparable) */}
        {areBothValid && (
          <div className="hero-delta-strip">
            <div className="hero-delta-box">
              <span className="hero-lbl">ESTIMATED MONTHLY COST DELTA</span>
              <div className="hero-val-row">
                <span className={`hero-val val-${comparison.deltas.monthlyCost.direction}`}>
                  {comparison.deltas.monthlyCost.formattedDelta}
                </span>
                <span className={`hero-pct pct-${comparison.deltas.monthlyCost.direction}`}>
                  ({comparison.deltas.monthlyCost.formattedPercent})
                </span>
              </div>
              <span className="hero-sub">
                {comparison.deltas.monthlyCost.formattedReference} → {comparison.deltas.monthlyCost.formattedComparison}
              </span>
            </div>

            <div className="hero-delta-box">
              <span className="hero-lbl">P95 TAIL LATENCY DELTA</span>
              <div className="hero-val-row">
                <span className={`hero-val val-${comparison.deltas.p95Latency.direction}`}>
                  {comparison.deltas.p95Latency.formattedDelta}
                </span>
                <span className="hero-pct">
                  ({comparison.deltas.p95Latency.formattedPercent})
                </span>
              </div>
              <span className="hero-sub">
                {comparison.deltas.p95Latency.formattedReference} → {comparison.deltas.p95Latency.formattedComparison}
              </span>
            </div>

            <div className="hero-delta-box">
              <span className="hero-lbl">BOTTLENECK STATUS</span>
              <div className="hero-val-row">
                <span className="hero-val" style={{ fontSize: '1.25rem' }}>
                  {comparison.bottleneckDelta.compBottleneck}
                </span>
                <span className={`badge-tag ${comparison.bottleneckDelta.isShifted ? 'badge-tag-shifted' : ''}`} style={{ fontSize: '0.71875rem' }}>
                  {comparison.bottleneckDelta.isShifted ? 'SHIFTED' : 'CONSISTENT'}
                </span>
              </div>
              <span className="hero-sub">{comparison.bottleneckDelta.explanation}</span>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="compare-tabs-bar">
          <button
            className={`compare-tab-btn ${activeTab === 'metrics' ? 'active' : ''}`}
            onClick={() => setActiveTab('metrics')}
          >
            Economic &amp; Performance Deltas
          </button>
          <button
            className={`compare-tab-btn ${activeTab === 'attribution' ? 'active' : ''}`}
            onClick={() => setActiveTab('attribution')}
          >
            Component Attribution ({architecture.nodes.length})
          </button>
          <button
            className={`compare-tab-btn ${activeTab === 'catalog' ? 'active' : ''}`}
            onClick={() => setActiveTab('catalog')}
          >
            Model &amp; Pricing Diff ({comparison.modelDiffs.length})
          </button>
          <button
            className={`compare-tab-btn ${activeTab === 'provenance' ? 'active' : ''}`}
            onClick={() => setActiveTab('provenance')}
          >
            Cryptographic Provenance
          </button>
        </div>

        {/* Dialog Body Content */}
        <div className="dialog-body compare-body">
          {/* TAB 1: METRICS */}
          {activeTab === 'metrics' && (
            <div className="table-responsive">
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th style={{ width: '28%' }}>SIMULATION METRIC</th>
                    <th style={{ width: '24%' }}>REFERENCE ({comparison.referenceSnapshot?.metadata.label})</th>
                    <th style={{ width: '24%' }}>COMPARISON ({comparison.comparisonSnapshot?.metadata.label})</th>
                    <th style={{ width: '24%' }}>ANALYTICAL DELTA</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="comparison-section-divider">
                    <td colSpan={4}>PRIMARY ECONOMIC CONSEQUENCES (ENGINE 4.0)</td>
                  </tr>
                  {Object.values(comparison.deltas).map((m: MetricDelta) => (
                    <tr key={m.metricId}>
                      <td>
                        <strong>{m.label}</strong>
                        <span className="metric-unit-tag">({m.unit})</span>
                      </td>
                      <td className="text-mono">{m.formattedReference}</td>
                      <td className="text-mono">{m.formattedComparison}</td>
                      <td className={`text-mono delta-${m.direction}`}>
                        <strong>{m.formattedDelta}</strong>
                        {m.percentDelta !== null && (
                          <span className="delta-pct-tag"> ({m.formattedPercent})</span>
                        )}
                        {!m.isComparable && (
                          <div className="incompatible-note">{m.incompatibilityReason}</div>
                        )}
                      </td>
                    </tr>
                  ))}
                  <tr className="comparison-section-divider">
                    <td colSpan={4}>TOPOLOGY BOTTLENECK ANALYSIS</td>
                  </tr>
                  <tr>
                    <td>Primary Bottleneck</td>
                    <td className="text-mono">{comparison.bottleneckDelta.refBottleneck}</td>
                    <td className="text-mono">{comparison.bottleneckDelta.compBottleneck}</td>
                    <td>
                      <span className={`badge-tag ${comparison.bottleneckDelta.isShifted ? 'badge-tag-shifted' : ''}`}>
                        {comparison.bottleneckDelta.isShifted ? 'SHIFTED' : 'UNALTERED'}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: COMPONENT ATTRIBUTION */}
          {activeTab === 'attribution' && (
            <div className="table-responsive">
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th>COMPONENT</th>
                    <th>MODEL / TARIFF</th>
                    <th>LIFECYCLE</th>
                    <th>REF COST</th>
                    <th>COMP COST</th>
                    <th>COST DELTA</th>
                    <th>SHARE OF SHIFT</th>
                    <th>LATENCY DELTA</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.nodeAttributions.map((attr: NodeAttributionDelta) => (
                    <tr key={attr.nodeId} className={!attr.isCompatible ? 'row-incompatible' : ''}>
                      <td>
                        <strong>{attr.label}</strong>
                        <span className="component-type-tag">{attr.type}</span>
                      </td>
                      <td className="text-mono" style={{ fontSize: '0.78125rem' }}>
                        {attr.modelId || 'INFRASTRUCTURE'}
                      </td>
                      <td>
                        {attr.compModelStatus ? (
                          <span className={`status-pill pill-status-${attr.compModelStatus.toLowerCase()}`}>
                            {attr.compModelStatus}
                          </span>
                        ) : (
                          <span className="status-pill">ACTIVE</span>
                        )}
                        {!attr.isCompatible && (
                          <div className="incompatible-warning-text">{attr.incompatibilityReason}</div>
                        )}
                      </td>
                      <td className="text-mono">{areBothValid ? formatCurrency(attr.refMonthlyCost) : '—'}</td>
                      <td className="text-mono">{areBothValid ? formatCurrency(attr.compMonthlyCost) : 'BLOCKED'}</td>
                      <td className="text-mono">
                        {areBothValid ? (
                          <span className={`delta-${attr.costDelta > 0.001 ? 'increased' : attr.costDelta < -0.001 ? 'decreased' : 'unchanged'}`}>
                            {attr.costDelta > 0 ? '+' : ''}{formatCurrency(attr.costDelta)}
                            {attr.costPercentDelta !== null && ` (${attr.costPercentDelta > 0 ? '+' : ''}${attr.costPercentDelta.toFixed(1)}%)`}
                          </span>
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td className="text-mono">
                        {attr.contributionShareOfDelta !== null ? (
                          <span className="share-tag">
                            {attr.contributionShareOfDelta.toFixed(1)}%
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="text-mono">
                        {areBothValid ? (
                          <span>
                            {attr.latencyDelta > 0 ? '+' : ''}{Math.round(attr.latencyDelta)} ms
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: MODEL & PRICING DIFF */}
          {activeTab === 'catalog' && (
            <div>
              <div className="catalog-filter-bar">
                <input
                  type="text"
                  placeholder="Filter models (e.g. gpt-4o, llama, claude)..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="simulator-text-input"
                  style={{ width: '280px' }}
                />
                <div className="filter-btn-group">
                  <button
                    className={`filter-btn ${catalogFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setCatalogFilter('all')}
                  >
                    All Records ({comparison.modelDiffs.length})
                  </button>
                  <button
                    className={`filter-btn ${catalogFilter === 'changed' ? 'active' : ''}`}
                    onClick={() => setCatalogFilter('changed')}
                  >
                    Variances Only
                  </button>
                  <button
                    className={`filter-btn ${catalogFilter === 'lifecycle' ? 'active' : ''}`}
                    onClick={() => setCatalogFilter('lifecycle')}
                  >
                    Lifecycle Transitions
                  </button>
                </div>
              </div>

              <div className="table-responsive" style={{ marginTop: '12px' }}>
                <table className="comparison-table">
                  <thead>
                    <tr>
                      <th>MODEL PRODUCT</th>
                      <th>PROVIDER</th>
                      <th>CHANGE TYPE</th>
                      <th>STATUS REF → COMP</th>
                      <th>INPUT PRICE / 1M</th>
                      <th>OUTPUT PRICE / 1M</th>
                      <th>CONTEXT WINDOW</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredModelDiffs.map((diff: ModelPricingDiffItem) => (
                      <tr key={diff.modelId}>
                        <td>
                          <strong>{diff.name}</strong>
                          <div className="text-mono" style={{ fontSize: '0.71875rem', color: '#A1A1AA' }}>
                            {diff.modelId}
                          </div>
                        </td>
                        <td>{diff.provider}</td>
                        <td>
                          <span className={`change-badge change-${diff.changeType}`}>
                            {diff.changeType.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td>
                          <span className="text-mono" style={{ fontSize: '0.75rem' }}>
                            {diff.refStatus || 'NONE'} → <strong>{diff.compStatus || 'NONE'}</strong>
                          </span>
                        </td>
                        <td className="text-mono">
                          {diff.refInputPrice !== undefined ? `$${diff.refInputPrice.toFixed(2)}` : '—'} →{' '}
                          {diff.compInputPrice !== undefined ? `$${diff.compInputPrice.toFixed(2)}` : '—'}
                          {diff.inputPriceDelta !== undefined && Math.abs(diff.inputPriceDelta) > 0.0001 && (
                            <div className={`delta-${diff.inputPriceDelta > 0 ? 'increased' : 'decreased'}`} style={{ fontSize: '0.75rem' }}>
                              {diff.inputPriceDelta > 0 ? '+' : ''}${diff.inputPriceDelta.toFixed(2)}
                              {diff.inputPricePercentDelta != null && ` (${diff.inputPricePercentDelta > 0 ? '+' : ''}${diff.inputPricePercentDelta.toFixed(1)}%)`}
                            </div>
                          )}
                        </td>
                        <td className="text-mono">
                          {diff.refOutputPrice !== undefined ? `$${diff.refOutputPrice.toFixed(2)}` : '—'} →{' '}
                          {diff.compOutputPrice !== undefined ? `$${diff.compOutputPrice.toFixed(2)}` : '—'}
                          {diff.outputPriceDelta !== undefined && Math.abs(diff.outputPriceDelta) > 0.0001 && (
                            <div className={`delta-${diff.outputPriceDelta > 0 ? 'increased' : 'decreased'}`} style={{ fontSize: '0.75rem' }}>
                              {diff.outputPriceDelta > 0 ? '+' : ''}${diff.outputPriceDelta.toFixed(2)}
                              {diff.outputPricePercentDelta != null && ` (${diff.outputPricePercentDelta > 0 ? '+' : ''}${diff.outputPricePercentDelta.toFixed(1)}%)`}
                            </div>
                          )}
                        </td>
                        <td className="text-mono" style={{ fontSize: '0.75rem' }}>
                          {diff.refContextWindow ? formatNumber(diff.refContextWindow) : '—'} →{' '}
                          {diff.compContextWindow ? formatNumber(diff.compContextWindow) : '—'}
                        </td>
                      </tr>
                    ))}
                    {filteredModelDiffs.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#A1A1AA' }}>
                          No model records matched the current filter criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: PROVENANCE */}
          {activeTab === 'provenance' && (
            <div className="provenance-grid">
              <div className="provenance-card">
                <h4>REFERENCE SNAPSHOT PROVENANCE</h4>
                <div className="prov-row">
                  <span className="prov-lbl">Snapshot ID:</span>
                  <span className="prov-val text-mono">{comparison.referenceSnapshot?.metadata.snapshotId}</span>
                </div>
                <div className="prov-row">
                  <span className="prov-lbl">Label:</span>
                  <span className="prov-val">{comparison.referenceSnapshot?.metadata.label}</span>
                </div>
                <div className="prov-row">
                  <span className="prov-lbl">SHA-256 Hash:</span>
                  <span className="prov-val text-mono">{comparison.referenceSnapshot?.metadata.contentHash}</span>
                </div>
                <div className="prov-row">
                  <span className="prov-lbl">Release Date:</span>
                  <span className="prov-val">{comparison.referenceSnapshot?.metadata.createdAt.slice(0, 10)}</span>
                </div>
                <div className="prov-row">
                  <span className="prov-lbl">Aliases:</span>
                  <span className="prov-val text-mono">{comparison.referenceSnapshot?.metadata.aliases.join(', ') || 'none'}</span>
                </div>
                <div className="prov-row">
                  <span className="prov-lbl">Engine:</span>
                  <span className="prov-val">v{comparison.referenceSnapshot?.metadata.engineVersion}</span>
                </div>
              </div>

              <div className="provenance-card">
                <h4>COMPARISON SNAPSHOT PROVENANCE</h4>
                <div className="prov-row">
                  <span className="prov-lbl">Snapshot ID:</span>
                  <span className="prov-val text-mono">{comparison.comparisonSnapshot?.metadata.snapshotId}</span>
                </div>
                <div className="prov-row">
                  <span className="prov-lbl">Label:</span>
                  <span className="prov-val">{comparison.comparisonSnapshot?.metadata.label}</span>
                </div>
                <div className="prov-row">
                  <span className="prov-lbl">SHA-256 Hash:</span>
                  <span className="prov-val text-mono">{comparison.comparisonSnapshot?.metadata.contentHash}</span>
                </div>
                <div className="prov-row">
                  <span className="prov-lbl">Release Date:</span>
                  <span className="prov-val">{comparison.comparisonSnapshot?.metadata.createdAt.slice(0, 10)}</span>
                </div>
                <div className="prov-row">
                  <span className="prov-lbl">Aliases:</span>
                  <span className="prov-val text-mono">{comparison.comparisonSnapshot?.metadata.aliases.join(', ') || 'none'}</span>
                </div>
                <div className="prov-row">
                  <span className="prov-lbl">Engine:</span>
                  <span className="prov-val">v{comparison.comparisonSnapshot?.metadata.engineVersion}</span>
                </div>
              </div>

              <div className="provenance-card" style={{ gridColumn: 'span 2' }}>
                <h4>DETERMINISTIC SIMULATION CONTRACT</h4>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: '#D4D4D8', lineHeight: '1.5' }}>
                  All comparisons are evaluated strictly through Engine 4.0 using the exact identical topology graph, edge routing proportions, and monthly request volumes. Pricing records are resolved immutably from static snapshot catalogues without runtime network requests, scraping, or nondeterministic estimates.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="dialog-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleShareComparison}
              className="btn btn-secondary btn-sm"
              title="Copy reproducible comparison URL with both snapshots"
            >
              Share Comparison URL
            </button>
            <button
              onClick={handleExportComparisonSpec}
              className="btn btn-secondary btn-sm"
              title="Download comparison JSON specification"
            >
              Export Delta Spec (JSON)
            </button>
            {onApplySnapshotToWorkbench && compSnapshotId && (
              <button
                onClick={() => {
                  onApplySnapshotToWorkbench(compSnapshotId);
                  onClose();
                }}
                className="btn btn-outline btn-sm"
                title={`Switch Workbench to ${comparison.comparisonSnapshot?.metadata.label}`}
              >
                Apply Comparison Snapshot to Workbench
              </button>
            )}
          </div>
          <div>
            <button onClick={onClose} className="btn btn-primary btn-sm">
              Close
            </button>
          </div>
        </div>

        {/* Modal Scoped Styles */}
        <style jsx>{`
          .compare-dialog {
            max-width: 1040px;
            width: 95vw;
            max-height: 90vh;
            display: flex;
            flex-direction: column;
          }

          .compare-selection-bar {
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            align-items: center;
            gap: 12px;
            padding: 12px 18px;
            background: #141417;
            border-bottom: 1px solid var(--color-border);
          }

          .snapshot-select-column {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .compare-select-label {
            font-size: 0.6875rem;
            font-family: var(--font-mono);
            letter-spacing: 0.06em;
            color: #A1A1AA;
            font-weight: 700;
          }

          .compare-dropdown {
            background: #09090B;
            border: 1px solid var(--color-border);
            border-radius: var(--radius-sm);
            padding: 6px 10px;
            color: var(--color-text);
            font-size: 0.8125rem;
            font-family: var(--font-mono);
            outline: none;
            cursor: pointer;
          }

          .compare-dropdown:focus {
            border-color: #FAFAFA;
          }

          .compare-snapshot-meta {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 0.6875rem;
            font-family: var(--font-mono);
            color: #71717A;
          }

          .swap-snapshots-btn {
            background: #27272A;
            border: 1px solid var(--color-border);
            color: #FAFAFA;
            width: 32px;
            height: 32px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1rem;
            cursor: pointer;
            transition: background 0.15s ease;
          }

          .swap-snapshots-btn:hover {
            background: #3F3F46;
          }

          .controlled-context-strip {
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 8px 18px;
            background: #0D0D10;
            border-bottom: 1px solid var(--color-border-subtle);
            font-size: 0.75rem;
          }

          .context-item strong {
            color: #FAFAFA;
          }

          .status-banner {
            padding: 10px 18px;
            border-bottom: 1px solid var(--color-border);
            background: #141418;
          }

          .status-pill {
            font-family: var(--font-mono);
            font-size: 0.6875rem;
            font-weight: 700;
            letter-spacing: 0.05em;
            padding: 3px 8px;
            border-radius: 3px;
            text-transform: uppercase;
          }

          .pill-both_valid {
            background: #18181B;
            border: 1px solid #FAFAFA;
            color: #FAFAFA;
          }

          .pill-comparison_invalid,
          .pill-reference_invalid,
          .pill-both_invalid {
            background: #27272A;
            border: 1px solid #71717A;
            color: #FAFAFA;
          }

          .pill-identical_snapshots {
            background: #18181B;
            border: 1px solid #3F3F46;
            color: #A1A1AA;
          }

          .status-text {
            font-size: 0.8125rem;
            color: #E4E4E7;
            line-height: 1.4;
          }

          .hero-delta-strip {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            border-bottom: 1px solid var(--color-border);
            background: #09090B;
          }

          .hero-delta-box {
            padding: 14px 18px;
            border-right: 1px solid var(--color-border);
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .hero-delta-box:last-child {
            border-right: none;
          }

          .hero-lbl {
            font-size: 0.6875rem;
            font-family: var(--font-mono);
            letter-spacing: 0.06em;
            color: #A1A1AA;
            font-weight: 700;
          }

          .hero-val-row {
            display: flex;
            align-items: baseline;
            gap: 8px;
          }

          .hero-val {
            font-family: var(--font-mono);
            font-size: 1.625rem;
            font-weight: 700;
            font-variant-numeric: tabular-nums;
          }

          .hero-pct {
            font-family: var(--font-mono);
            font-size: 0.875rem;
            font-weight: 600;
          }

          .hero-sub {
            font-size: 0.75rem;
            font-family: var(--font-mono);
            color: #71717A;
          }

          .val-increased, .pct-increased {
            color: #FFFFFF;
          }

          .val-decreased, .pct-decreased {
            color: #A1A1AA;
          }

          .val-unchanged {
            color: #FAFAFA;
          }

          .compare-tabs-bar {
            display: flex;
            gap: 2px;
            padding: 4px 18px 0;
            background: #121215;
            border-bottom: 1px solid var(--color-border);
          }

          .compare-tab-btn {
            background: transparent;
            border: none;
            border-bottom: 2px solid transparent;
            color: #A1A1AA;
            padding: 8px 12px;
            font-size: 0.8125rem;
            font-family: var(--font-mono);
            cursor: pointer;
            transition: all 0.15s ease;
          }

          .compare-tab-btn:hover {
            color: #FFFFFF;
          }

          .compare-tab-btn.active {
            color: #FFFFFF;
            border-bottom-color: #FAFAFA;
            font-weight: 700;
          }

          .compare-body {
            padding: 16px 18px;
            max-height: calc(85vh - 320px);
            overflow-y: auto;
          }

          .metric-unit-tag {
            font-size: 0.6875rem;
            color: #71717A;
            margin-left: 6px;
            font-weight: 400;
          }

          .delta-pct-tag {
            font-size: 0.75rem;
            color: #A1A1AA;
          }

          .delta-increased {
            color: #FFFFFF;
          }

          .delta-decreased {
            color: #A1A1AA;
          }

          .delta-unchanged {
            color: #71717A;
          }

          .incompatible-note {
            font-size: 0.6875rem;
            color: #FAFAFA;
            background: #27272A;
            padding: 2px 6px;
            border-radius: 2px;
            margin-top: 4px;
            display: inline-block;
          }

          .component-type-tag {
            display: inline-block;
            font-size: 0.6875rem;
            font-family: var(--font-mono);
            background: #27272A;
            color: #A1A1AA;
            padding: 1px 5px;
            border-radius: 2px;
            margin-left: 6px;
          }

          .share-tag {
            background: #18181B;
            border: 1px solid #3F3F46;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 0.75rem;
          }

          .incompatible-warning-text {
            font-size: 0.6875rem;
            color: #FAFAFA;
            margin-top: 3px;
          }

          .catalog-filter-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
          }

          .filter-btn-group {
            display: flex;
            gap: 4px;
          }

          .filter-btn {
            background: #18181B;
            border: 1px solid var(--color-border);
            color: #A1A1AA;
            padding: 5px 10px;
            border-radius: var(--radius-xs);
            font-size: 0.75rem;
            font-family: var(--font-mono);
            cursor: pointer;
          }

          .filter-btn.active {
            background: #FAFAFA;
            color: #09090B;
            font-weight: 700;
          }

          .change-badge {
            font-size: 0.6875rem;
            font-family: var(--font-mono);
            padding: 2px 6px;
            border-radius: 2px;
            text-transform: uppercase;
          }

          .change-price_changed {
            background: #27272A;
            color: #FAFAFA;
            border: 1px solid #52525B;
          }

          .change-lifecycle_changed, .change-both_changed {
            background: #3F3F46;
            color: #FAFAFA;
            border: 1px solid #71717A;
          }

          .change-added {
            background: #18181B;
            color: #FAFAFA;
            border: 1px solid #FAFAFA;
          }

          .change-removed {
            background: #27272A;
            color: #A1A1AA;
          }

          .change-unchanged {
            background: #141417;
            color: #71717A;
          }

          .provenance-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
          }

          .provenance-card {
            background: #141417;
            border: 1px solid var(--color-border);
            border-radius: var(--radius-sm);
            padding: 14px 16px;
          }

          .provenance-card h4 {
            margin: 0 0 10px;
            font-size: 0.8125rem;
            font-family: var(--font-mono);
            letter-spacing: 0.05em;
            color: #A1A1AA;
          }

          .prov-row {
            display: grid;
            grid-template-columns: 110px 1fr;
            gap: 8px;
            font-size: 0.75rem;
            margin-bottom: 6px;
            word-break: break-all;
          }

          .prov-lbl {
            color: #71717A;
          }

          .prov-val {
            color: #FAFAFA;
          }

          @media (max-width: 900px) {
            .compare-selection-bar {
              grid-template-columns: 1fr;
            }
            .swap-snapshots-btn {
              margin: 4px auto;
            }
            .hero-delta-strip {
              grid-template-columns: 1fr;
            }
            .hero-delta-box {
              border-right: none;
              border-bottom: 1px solid var(--color-border);
            }
            .provenance-grid {
              grid-template-columns: 1fr;
            }
            .provenance-card {
              grid-column: span 1 !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
