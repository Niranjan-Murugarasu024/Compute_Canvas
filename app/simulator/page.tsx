'use client';

import { useState, useCallback, useMemo, useEffect, Suspense, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Navigation from '@/components/navigation/Navigation';
import SpatialCanvas from '@/components/simulator/SpatialCanvas';
import SimulatorErrorBoundary from '@/components/simulator/SimulatorErrorBoundary';
import { useArchitectureStore } from '@/lib/state/architectureStore';
import {
  simulate,
  formatCurrency,
  formatLatency,
  formatNumber,
  calculateCalibratedEconomics,
  explainEconomicsDelta,
  type ArchNode,
  type SimulationResult,
  MODEL_PRICING,
  INFRA_PRICING,
  TEMPLATES,
} from '@/lib/simulation/engine';
import {
  encodeArchitectureState,
  decodeArchitectureState,
  type V1ShareState,
} from '@/lib/simulation/sharing';

// ── 6 Core V1 Building Blocks ──
const CORE_COMPONENTS: {
  type: ArchNode['type'];
  label: string;
  icon: string;
  badge: string;
  desc: string;
  color: string;
}[] = [
  {
    type: 'api',
    label: 'API Ingress',
    icon: '◇',
    badge: 'INGRESS',
    desc: 'API gateway entrypoint & rate limiting',
    color: '#F4F4F5',
  },
  {
    type: 'cache',
    label: 'Semantic Cache',
    icon: '▤',
    badge: 'CACHE',
    desc: 'Prompt & embedding cache tier',
    color: '#D4D4D8',
  },
  {
    type: 'router',
    label: 'Complexity Router',
    icon: '⬡',
    badge: 'ROUTER',
    desc: 'Dynamic traffic steering between models',
    color: '#A1A1AA',
  },
  {
    type: 'vectordb',
    label: 'Vector Database',
    icon: '▣',
    badge: 'RETRIEVAL',
    desc: 'High-dim nearest-neighbor search for RAG',
    color: '#D4D4D8',
  },
  {
    type: 'fast-model',
    label: 'Fast Model',
    icon: '⚡',
    badge: 'FAST LLM',
    desc: 'Sub-150ms reasoning tier (GPT-4o Mini / Flash)',
    color: '#E4E4E7',
  },
  {
    type: 'frontier-model',
    label: 'Frontier Model',
    icon: '◈',
    badge: 'FRONTIER',
    desc: 'High-intelligence reasoning (GPT-4o / Sonnet)',
    color: '#FFFFFF',
  },
];

const FAST_MODELS = Object.entries(MODEL_PRICING)
  .filter(([_, p]) => p.category === 'fast')
  .map(([id, p]) => ({ id, name: p.product, provider: p.provider, cost: `$${p.inputPricePer1M}/M` }));

const FRONTIER_MODELS = Object.entries(MODEL_PRICING)
  .filter(([_, p]) => p.category === 'frontier')
  .map(([id, p]) => ({ id, name: p.product, provider: p.provider, cost: `$${p.inputPricePer1M}/M` }));

// ── Isolated Query Sync Component (prevents full-page SSR bailout) ──
function SimulatorQuerySync({
  onLoadShare,
  onLoadTemplate,
  onError,
}: {
  onLoadShare: (data: V1ShareState) => void;
  onLoadTemplate: (templateId: string) => void;
  onError: (msg: string) => void;
}) {
  const searchParams = useSearchParams();
  const processedParamRef = useRef<string | null>(null);

  useEffect(() => {
    if (!searchParams) return;

    const queryData = searchParams.get('data');
    if (queryData) {
      const key = `data:${queryData}`;
      if (processedParamRef.current === key) return;
      processedParamRef.current = key;

      const decoded = decodeArchitectureState(queryData);
      if (decoded.success && decoded.data) {
        onLoadShare(decoded.data);
      } else {
        onError('Unable to restore this shared architecture. Loaded default baseline.');
      }
      return;
    }

    const templateParam = searchParams.get('template');
    if (templateParam) {
      const key = `template:${templateParam}`;
      if (processedParamRef.current === key) return;
      processedParamRef.current = key;

      onLoadTemplate(templateParam);
    }
  }, [searchParams, onLoadShare, onLoadTemplate, onError]);

  return null;
}

function SimulatorContent() {
  const {
    architecture,
    workload,
    calibration,
    previousState,
    selectedNodeId,
    selectedEdgeIndex,
    setWorkload,
    applyCalibration,
    clearCalibration,
    addNode,
    removeNode,
    updateNodeModel,
    updateEdgeShare,
    removeEdge,
    setSelectedNode,
    setSelectedEdge,
    loadArchitecture,
  } = useArchitectureStore();

  // Local UI states
  const [leftTab, setLeftTab] = useState<'all' | 'components' | 'workload' | 'calibration'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calBillInput, setCalBillInput] = useState(calibration.actualBill ? String(calibration.actualBill) : '4500');
  const [calReqInput, setCalReqInput] = useState(calibration.actualRequests ? String(calibration.actualRequests) : '1200000');
  const [isAssumptionsOpen, setIsAssumptionsOpen] = useState(false);
  const [shareModalUrl, setShareModalUrl] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('router-cache');
  const [calibrationError, setCalibrationError] = useState<string | null>(null);

  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // 1. Authoritative deterministic simulation
  const result: SimulationResult = useMemo(
    () => simulate(workload, architecture),
    [workload, architecture]
  );

  // 2. Calibrated economics
  const calibrated = useMemo(
    () => calculateCalibratedEconomics(result, workload, calibration),
    [result, workload, calibration]
  );

  // 3. Dynamic causal explanation ("Why did this change?")
  const deltaExplanation = useMemo(() => {
    return explainEconomicsDelta(
      previousState?.workload || null,
      previousState?.arch || null,
      previousState?.sim || null,
      workload,
      architecture,
      result
    );
  }, [previousState, workload, architecture, result]);

  // Share architecture action: Base64URL encode and copy to clipboard
  const handleShare = useCallback(async () => {
    try {
      const encoded = encodeArchitectureState({ architecture, workload, calibration });
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://computecanvas.io';
      const shareUrl = `${origin}/simulator?data=${encoded}`;

      if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
        showToast('Architecture link copied to clipboard.');
      } else {
        setShareModalUrl(shareUrl);
      }
    } catch {
      showToast('Architecture URL generated.');
    }
  }, [architecture, workload, calibration, showToast]);

  // Export JSON specification
  const handleExport = useCallback(() => {
    const payload = {
      specVersion: 1,
      name: architecture.name || 'AI Architecture Spec',
      timestamp: new Date().toISOString(),
      architecture,
      workload,
      calibration: calibration.enabled ? calibration : undefined,
      simulation: {
        monthlySpend: result.monthlyCost,
        costPerRequest: result.costPerRequest,
        estimatedP95LatencyMs: result.p95Latency,
        bottleneck: result.bottleneck,
        costBreakdown: result.costBreakdown,
      },
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `computecanvas-${(architecture.name || 'architecture').toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Architecture JSON exported.');
  }, [architecture, workload, calibration, result, showToast]);

  // Template switch handler
  const handleSelectTemplate = (templateId: string) => {
    const template = TEMPLATES.find(t => t.id === templateId);
    if (!template) return;
    setSelectedTemplateId(template.id);
    loadArchitecture(template.architecture, template.defaultWorkload);
    showToast(`Loaded ${template.name}`);
  };

  // Calibration submit
  const handleApplyCalibration = (e: React.FormEvent) => {
    e.preventDefault();
    setCalibrationError(null);

    const billNum = parseFloat(calBillInput.replace(/[^0-9.]/g, '')) || 0;
    const reqNum = parseInt(calReqInput.replace(/[^0-9]/g, ''), 10) || 0;

    if (billNum <= 0) {
      setCalibrationError('Actual bill must be greater than $0.');
      return;
    }
    if (reqNum <= 0) {
      setCalibrationError('Monthly requests must be greater than 0.');
      return;
    }

    applyCalibration(billNum, reqNum, result.monthlyCost);
    setIsCalibrating(false);
    showToast('Calibrated baseline applied.');
  };

  const handleLoadShare = useCallback((data: V1ShareState) => {
    loadArchitecture(data.architecture, data.workload, data.calibration);
    showToast('Shared architecture restored.');
  }, [loadArchitecture, showToast]);

  const handleLoadTemplate = useCallback((id: string) => {
    const match = TEMPLATES.find(t => t.id === id || t.id.includes(id));
    if (match) {
      loadArchitecture(match.architecture, match.defaultWorkload);
      setSelectedTemplateId(match.id);
      showToast(`Template loaded: ${match.name}`);
    }
  }, [loadArchitecture, showToast]);

  const handleSyncError = useCallback((msg: string) => {
    showToast(msg);
  }, [showToast]);

  const selectedNode = architecture.nodes.find(n => n.id === selectedNodeId);
  const selectedEdge = selectedEdgeIndex !== null ? architecture.edges[selectedEdgeIndex] : null;

  return (
    <div className="simulator-v1-root">
      {/* Navigation */}
      <Navigation />

      {/* Query Sync for URL-based architecture sharing */}
      <Suspense fallback={null}>
        <SimulatorQuerySync
          onLoadShare={handleLoadShare}
          onLoadTemplate={handleLoadTemplate}
          onError={handleSyncError}
        />
      </Suspense>

      {/* Main Top Header Bar */}
      <header className="simulator-header-bar">
        <div className="simulator-header-left">
          <div className="simulator-title-group">
            <span className="badge badge--primary text-mono">SIMULATOR V1</span>
            <h1 className="simulator-app-title">AI Architecture &amp; Economics</h1>
          </div>

          {/* Canonical Template Selector */}
          <div className="template-selector-group">
            <span className="template-label text-caption">TEMPLATE:</span>
            <select
              className="template-select-dropdown text-mono"
              value={selectedTemplateId}
              onChange={(e) => handleSelectTemplate(e.target.value)}
              aria-label="Select AI Architecture Template"
            >
              {TEMPLATES.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="simulator-header-right">
          <Link
            href="/assumptions"
            className="btn btn-secondary btn-sm"
            title="View transparent pricing & latency formulas"
          >
            Assumptions
          </Link>

          <button
            onClick={handleExport}
            className="btn btn-secondary btn-sm"
            title="Download architecture JSON specification"
          >
            Export Spec
          </button>

          <button
            onClick={handleShare}
            className="btn btn-primary btn-sm"
            title="Copy shareable zero-backend architecture URL"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginRight: '6px' }}>
              <path d="M4 7h6m0 0l-2.5-2.5M10 7l-2.5 2.5M2 3h10a1 1 0 011 1v6a1 1 0 01-1 1H2a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Share Architecture
          </button>
        </div>
      </header>

      {/* Validation Banner (if architecture cannot be simulated reliably) */}
      {!result.validation.isValid && (
        <div className="validation-warning-banner" role="alert">
          <span className="warning-icon">⚠</span>
          <div className="warning-text">
            <strong>Architecture Validation Notice: </strong>
            {result.validation.errors.join(' • ')}
          </div>
        </div>
      )}

      {/* 3-Column Responsive Work Area */}
      <div className="simulator-body-grid">
        {/* ── LEFT COLUMN: Palette + Workload + Calibration ── */}
        <aside className="simulator-sidebar-left">
          {/* Quick Section Switcher */}
          <div className="left-sidebar-tabs" role="tablist" aria-label="Sidebar sections">
            <button
              className={`sidebar-tab-btn ${leftTab === 'all' ? 'active' : ''}`}
              onClick={() => setLeftTab('all')}
              role="tab"
              aria-selected={leftTab === 'all'}
            >
              All
            </button>
            <button
              className={`sidebar-tab-btn ${leftTab === 'components' ? 'active' : ''}`}
              onClick={() => setLeftTab('components')}
              role="tab"
              aria-selected={leftTab === 'components'}
            >
              Components
            </button>
            <button
              className={`sidebar-tab-btn ${leftTab === 'workload' ? 'active' : ''}`}
              onClick={() => setLeftTab('workload')}
              role="tab"
              aria-selected={leftTab === 'workload'}
            >
              Workload
            </button>
            <button
              className={`sidebar-tab-btn ${leftTab === 'calibration' ? 'active' : ''}`}
              onClick={() => {
                setLeftTab('calibration');
                setIsCalibrating(true);
              }}
              role="tab"
              aria-selected={leftTab === 'calibration'}
            >
              Anchor Bill {calibration.enabled && '✓'}
            </button>
          </div>

          {/* Section 1: Core Components Palette */}
          {(leftTab === 'all' || leftTab === 'components') && (
            <div className="sidebar-card">
              <div className="sidebar-card-header">
                <h2 className="sidebar-section-title">COMPONENTS</h2>
                <span className="text-caption text-mono" style={{ color: 'var(--color-text-muted)' }}>
                  Drag or click to add
                </span>
              </div>

              <div className="palette-components-list">
                {CORE_COMPONENTS.map(comp => (
                  <div
                    key={comp.type}
                    className="palette-component-item"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/computecanvas-type', comp.type);
                      e.dataTransfer.setData('application/computecanvas-label', comp.label);
                    }}
                    onClick={() => addNode(comp.type, comp.label)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        addNode(comp.type, comp.label);
                      }
                    }}
                    aria-label={`Add ${comp.label}`}
                  >
                    <div className="palette-item-icon" style={{ color: comp.color }}>
                      {comp.icon}
                    </div>
                    <div className="palette-item-info">
                      <div className="palette-item-name">{comp.label}</div>
                      <div className="palette-item-desc">{comp.desc}</div>
                    </div>
                    <span className="palette-item-badge text-mono" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)', background: 'var(--color-bg-base)' }}>
                      {comp.badge}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Workload Controls (3 Primary Controls) */}
          {(leftTab === 'all' || leftTab === 'workload') && (
            <div className="sidebar-card">
              <div className="sidebar-card-header">
                <h2 className="sidebar-section-title">WORKLOAD CONTROLS</h2>
                <span className="text-caption text-mono" style={{ color: 'var(--color-text-muted)' }}>
                  Real-time
                </span>
              </div>

              <div className="workload-controls-stack">
                {/* 1. Monthly Requests */}
                <div className="control-field">
                  <div className="control-label-row">
                    <label htmlFor="req-slider" className="control-label">Monthly Requests</label>
                    <span className="control-val text-mono">{formatNumber(workload.requestsPerMonth)}</span>
                  </div>
                  <input
                    id="req-slider"
                    type="range"
                    min={100000}
                    max={20000000}
                    step={100000}
                    value={workload.requestsPerMonth}
                    onChange={(e) => setWorkload({ requestsPerMonth: Number(e.target.value) })}
                    className="simulator-slider"
                  />
                </div>

                {/* 2. Average Tokens: Input & Output */}
                <div className="control-field">
                  <div className="control-label-row">
                    <label htmlFor="input-token-slider" className="control-label">Input Tokens / Req</label>
                    <span className="control-val text-mono">{formatNumber(workload.avgInputTokens)}</span>
                  </div>
                  <input
                    id="input-token-slider"
                    type="range"
                    min={200}
                    max={12000}
                    step={100}
                    value={workload.avgInputTokens}
                    onChange={(e) => setWorkload({ avgInputTokens: Number(e.target.value) })}
                    className="simulator-slider"
                  />
                </div>

                <div className="control-field">
                  <div className="control-label-row">
                    <label htmlFor="output-token-slider" className="control-label">Output Tokens / Req</label>
                    <span className="control-val text-mono">{formatNumber(workload.avgOutputTokens)}</span>
                  </div>
                  <input
                    id="output-token-slider"
                    type="range"
                    min={50}
                    max={4000}
                    step={50}
                    value={workload.avgOutputTokens}
                    onChange={(e) => setWorkload({ avgOutputTokens: Number(e.target.value) })}
                    className="simulator-slider"
                  />
                </div>

                {/* 3. Cache Hit Rate */}
                <div className="control-field">
                  <div className="control-label-row">
                    <label htmlFor="cache-slider" className="control-label">Cache Hit Rate</label>
                    <span className="control-val text-mono" style={{ color: 'var(--color-quality)' }}>
                      {Math.round(workload.cacheHitRate * 100)}%
                    </span>
                  </div>
                  <input
                    id="cache-slider"
                    type="range"
                    min={0}
                    max={0.90}
                    step={0.05}
                    value={workload.cacheHitRate}
                    onChange={(e) => setWorkload({ cacheHitRate: Number(e.target.value) })}
                    className="simulator-slider"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Bill Calibration ("Anchor to My Bill") */}
          {(leftTab === 'all' || leftTab === 'calibration') && (
            <div className="sidebar-card">
              <div className="sidebar-card-header">
                <h2 className="sidebar-section-title">ANCHOR TO MY BILL</h2>
                {calibration.enabled ? (
                  <button onClick={clearCalibration} className="calibration-reset-btn text-mono" title="Disable calibration">
                    RESET
                  </button>
                ) : null}
              </div>

              {calibration.enabled ? (
                <div className="calibration-active-card">
                  <div className="calibration-status-badge">
                    <span className="status-dot-green" />
                    <span className="text-mono" style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.04em' }}>ANCHORED TO EMPIRICAL BILL</span>
                  </div>

                  <div className="calibration-meta-grid">
                    <div className="meta-col">
                      <span className="meta-sub">ACTUAL BILL</span>
                      <span className="meta-num text-mono">{formatCurrency(calibration.actualBill)}</span>
                    </div>
                    <div className="meta-col">
                      <span className="meta-sub">MODELLED BASE</span>
                      <span className="meta-num text-mono">{formatCurrency(calibration.baselineSimulatedCost)}</span>
                    </div>
                    <div className="meta-col">
                      <span className="meta-sub">CALIBRATION</span>
                      <span className="meta-num text-mono">
                        {(calibration.baselineSimulatedCost > 0 ? (calibration.actualBill / calibration.baselineSimulatedCost) : 1).toFixed(2)}×
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.6875rem' }}>
                    <span style={{ color: 'var(--color-text-muted)' }} className="text-mono">VARIANCE DELTA</span>
                    <span className="text-mono" style={{ color: calibrated.variancePercentage <= 0 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                      {calibrated.variancePercentage > 0 ? `+${calibrated.variancePercentage}%` : `${calibrated.variancePercentage}%`} vs baseline
                    </span>
                  </div>

                  <p className="calibration-explainer">
                    Calibrated on {formatNumber(calibration.actualRequests)} empirical requests.
                  </p>
                </div>
              ) : isCalibrating ? (
                <form onSubmit={handleApplyCalibration} className="calibration-form">
                  <div className="calibration-input-row">
                    <label className="text-caption">Last Month&apos;s AI Bill ($)</label>
                    <input
                      type="text"
                      value={calBillInput}
                      onChange={(e) => setCalBillInput(e.target.value)}
                      className="simulator-text-input text-mono"
                      placeholder="4500"
                      required
                    />
                  </div>

                  <div className="calibration-input-row">
                    <label className="text-caption">Monthly Requests</label>
                    <input
                      type="text"
                      value={calReqInput}
                      onChange={(e) => setCalReqInput(e.target.value)}
                      className="simulator-text-input text-mono"
                      placeholder="1200000"
                      required
                    />
                  </div>

                  {calibrationError && (
                    <div className="calibration-error-msg text-caption text-mono" style={{ color: '#ef4444' }}>
                      {calibrationError}
                    </div>
                  )}

                  <div className="calibration-btn-row">
                    <button type="submit" className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                      Apply Calibration
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCalibrating(false)}
                      className="btn btn-ghost btn-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="calibration-idle-box">
                  <p className="calibration-idle-desc">
                    Anchor the simulator to your real provider invoice to ground architectural changes in empirical reality.
                  </p>
                  <button
                    onClick={() => setIsCalibrating(true)}
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%', marginTop: 'var(--space-2)' }}
                  >
                    Anchor to My Bill
                  </button>
                </div>
              )}
            </div>
          )}
        </aside>

        {/* ── CENTER COLUMN: Architecture Canvas ── */}
        <main className="simulator-canvas-center">
          <div className="canvas-wrapper-outer">
            <SpatialCanvas simulation={result} />

            {/* Selected Element Floating Inspector */}
            {selectedNode && (
              <div className="selected-inspector-dock" role="region" aria-label="Component Inspector">
                <div className="inspector-header">
                  <span className="inspector-type-pill text-mono">{selectedNode.type.toUpperCase()}</span>
                  <span className="inspector-title">{selectedNode.label}</span>
                </div>

                <div className="inspector-actions">
                  {/* Model Switcher for LLM Nodes */}
                  {(selectedNode.type === 'fast-model' || (selectedNode.type === 'model' && selectedNode.modelId === 'gpt-4o-mini')) && (
                    <select
                      className="inspector-select text-mono"
                      value={selectedNode.modelId || 'gpt-4o-mini'}
                      onChange={(e) => updateNodeModel(selectedNode.id, e.target.value)}
                      aria-label="Select Fast Reasoning Model"
                    >
                      {FAST_MODELS.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.cost})
                        </option>
                      ))}
                    </select>
                  )}

                  {(selectedNode.type === 'frontier-model' || (selectedNode.type === 'model' && selectedNode.modelId !== 'gpt-4o-mini')) && (
                    <select
                      className="inspector-select text-mono"
                      value={selectedNode.modelId || 'gpt-4o'}
                      onChange={(e) => updateNodeModel(selectedNode.id, e.target.value)}
                      aria-label="Select Frontier Reasoning Model"
                    >
                      {FRONTIER_MODELS.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.cost})
                        </option>
                      ))}
                    </select>
                  )}

                  <button
                    onClick={() => removeNode(selectedNode.id)}
                    className="btn btn-danger btn-sm"
                    title="Remove component (Delete)"
                  >
                    Delete Node
                  </button>

                  <button
                    onClick={() => setSelectedNode(null)}
                    className="btn btn-ghost btn-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* Selected Edge Inspector */}
            {selectedEdge && (
              <div className="selected-inspector-dock" role="region" aria-label="Connection Inspector">
                <div className="inspector-header">
                  <span className="inspector-type-pill text-mono">CONNECTION</span>
                  <span className="inspector-title">
                    {selectedEdge.source} → {selectedEdge.target}
                  </span>
                </div>

                <div className="inspector-actions">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="text-caption text-mono">Traffic:</span>
                    <input
                      type="range"
                      min={0.1}
                      max={1.0}
                      step={0.05}
                      value={selectedEdge.trafficShare ?? 1.0}
                      onChange={(e) => updateEdgeShare(selectedEdge.source, selectedEdge.target, parseFloat(e.target.value))}
                      style={{ width: '90px' }}
                    />
                    <span className="text-caption text-mono" style={{ fontWeight: 600 }}>
                      {Math.round((selectedEdge.trafficShare ?? 1.0) * 100)}%
                    </span>
                  </div>

                  <button
                    onClick={() => removeEdge(selectedEdge.source, selectedEdge.target)}
                    className="btn btn-danger btn-sm"
                  >
                    Remove Connection
                  </button>

                  <button
                    onClick={() => setSelectedEdge(null)}
                    className="btn btn-ghost btn-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* ── RIGHT COLUMN: Live Economics Panel ── */}
        <aside className="simulator-sidebar-right">
          {/* Card 1: Key Economics Metrics */}
          <div className="sidebar-card">
            <div className="sidebar-card-header">
              <h2 className="sidebar-section-title">LIVE ECONOMICS</h2>
              {calibrated.isCalibrated ? (
                <span className="badge badge--success text-mono" style={{ fontSize: '0.6875rem' }}>
                  CALIBRATED ESTIMATE
                </span>
              ) : (
                <span className="badge badge--neutral text-mono" style={{ fontSize: '0.6875rem' }}>
                  SIMULATION
                </span>
              )}
            </div>

            <div className="metrics-primary-stack">
              {/* Monthly Spend */}
              <div className="metric-box">
                <span className="metric-label">
                  {calibrated.isCalibrated ? 'CALIBRATED MONTHLY SPEND' : 'ESTIMATED MONTHLY SPEND'}
                </span>
                <div className="metric-huge-value text-mono">
                  {calibrated.isCalibrated
                    ? formatCurrency(calibrated.calibratedMonthlyCost)
                    : formatCurrency(result.monthlyCost)}
                  <span className="metric-unit"> / mo</span>
                </div>
                {calibrated.isCalibrated && (
                  <span className="metric-sub-detail text-mono">
                    Baseline: {formatCurrency(calibrated.simulatedBaselineCost)}/mo ({calibrated.variancePercentage > 0 ? `+${calibrated.variancePercentage}%` : `${calibrated.variancePercentage}%`})
                  </span>
                )}
              </div>

              {/* Cost Per Request */}
              <div className="metric-dual-row">
                <div className="metric-sub-box">
                  <span className="metric-label">COST / REQUEST</span>
                  <div className="metric-val text-mono">
                    {calibrated.isCalibrated
                      ? `$${calibrated.calibratedCostPerRequest.toFixed(4)}`
                      : `$${result.costPerRequest.toFixed(4)}`}
                  </div>
                </div>

                {/* Estimated P95 Latency */}
                <div className="metric-sub-box">
                  <span className="metric-label">ESTIMATED P95 LATENCY</span>
                  <div className="metric-val text-mono" style={{ color: 'var(--color-performance)' }}>
                    {formatLatency(result.p95Latency)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Bottleneck Detection */}
          <div className="sidebar-card">
            <div className="sidebar-card-header">
              <h2 className="sidebar-section-title">BOTTLENECK IDENTIFIER</h2>
              <span className="badge badge--warning text-mono" style={{ fontSize: '0.6875rem' }}>
                DOMINANT FACTOR
              </span>
            </div>

            <div className="bottleneck-display-card">
              <div className="bottleneck-head-row">
                <span className="bottleneck-component-name">
                  {result.bottleneck.componentName}
                </span>
                <span className="bottleneck-impact-badge text-mono">
                  {result.bottleneck.impactPercentage}% {result.bottleneck.metricType === 'cost' ? 'of spend' : 'of latency'}
                </span>
              </div>
              <p className="bottleneck-explanation-text">
                {result.bottleneck.explanation}
              </p>
            </div>
          </div>

          {/* Card 3: Cost Breakdown */}
          <div className="sidebar-card">
            <div className="sidebar-card-header">
              <h2 className="sidebar-section-title">COST BREAKDOWN</h2>
              <span className="text-caption text-mono" style={{ color: 'var(--color-text-muted)' }}>
                {formatCurrency(result.monthlyCost)}/mo
              </span>
            </div>

            <div className="cost-breakdown-stack">
              {/* Visual Breakdown Bar */}
              <div className="breakdown-bar-track">
                {result.monthlyCost > 0 && (
                  <>
                    <div
                      className="breakdown-bar-segment"
                      style={{
                        width: `${(result.costBreakdown.models / result.monthlyCost) * 100}%`,
                        backgroundColor: '#FFFFFF',
                      }}
                      title={`Models: ${formatCurrency(result.costBreakdown.models)}`}
                    />
                    <div
                      className="breakdown-bar-segment"
                      style={{
                        width: `${(result.costBreakdown.vectorDb / result.monthlyCost) * 100}%`,
                        backgroundColor: '#A1A1AA',
                      }}
                      title={`Vector DB: ${formatCurrency(result.costBreakdown.vectorDb)}`}
                    />
                    <div
                      className="breakdown-bar-segment"
                      style={{
                        width: `${(result.costBreakdown.cache / result.monthlyCost) * 100}%`,
                        backgroundColor: '#71717A',
                      }}
                      title={`Cache: ${formatCurrency(result.costBreakdown.cache)}`}
                    />
                    <div
                      className="breakdown-bar-segment"
                      style={{
                        width: `${(result.costBreakdown.ingress / result.monthlyCost) * 100}%`,
                        backgroundColor: '#3F3F46',
                      }}
                      title={`Ingress: ${formatCurrency(result.costBreakdown.ingress)}`}
                    />
                  </>
                )}
              </div>

              {/* Breakdown List */}
              <div className="breakdown-legend-list">
                <div className="breakdown-legend-item">
                  <span className="legend-indicator" style={{ backgroundColor: '#FFFFFF' }} />
                  <span className="legend-name">Model Inference</span>
                  <span className="legend-amount text-mono">{formatCurrency(result.costBreakdown.models)}</span>
                </div>

                <div className="breakdown-legend-item">
                  <span className="legend-indicator" style={{ backgroundColor: '#A1A1AA' }} />
                  <span className="legend-name">Vector Retrieval</span>
                  <span className="legend-amount text-mono">{formatCurrency(result.costBreakdown.vectorDb)}</span>
                </div>

                <div className="breakdown-legend-item">
                  <span className="legend-indicator" style={{ backgroundColor: '#71717A' }} />
                  <span className="legend-name">Semantic Cache</span>
                  <span className="legend-amount text-mono">{formatCurrency(result.costBreakdown.cache)}</span>
                </div>

                <div className="breakdown-legend-item">
                  <span className="legend-indicator" style={{ backgroundColor: '#3F3F46' }} />
                  <span className="legend-name">API Gateway Ingress</span>
                  <span className="legend-amount text-mono">{formatCurrency(result.costBreakdown.ingress)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: "Why did this change?" Causal Delta Box */}
          <div className="sidebar-card">
            <div className="sidebar-card-header">
              <h2 className="sidebar-section-title">WHY DID THIS CHANGE?</h2>
              <span className="badge badge--neutral text-mono" style={{ fontSize: '0.6875rem' }}>
                CAUSAL DELTA
              </span>
            </div>

            <div className="why-changed-box">
              <p className="why-changed-text">
                {deltaExplanation}
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* Share URL Fallback Modal */}
      {shareModalUrl && (
        <div className="assumptions-modal-overlay" onClick={() => setShareModalUrl(null)}>
          <div className="assumptions-modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div className="dialog-header">
              <h3 className="dialog-title">Share Architecture</h3>
              <button onClick={() => setShareModalUrl(null)} className="btn btn-ghost btn-sm">✕</button>
            </div>
            <div className="dialog-content">
              <p className="dialog-intro">
                Copy this URL to share this exact architecture, components, workload parameters, and bill calibration:
              </p>
              <input
                type="text"
                readOnly
                value={shareModalUrl}
                className="simulator-text-input text-mono"
                style={{ width: '100%', fontSize: '0.75rem', padding: '8px' }}
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
            </div>
            <div className="dialog-footer">
              <button
                onClick={() => {
                  navigator.clipboard?.writeText?.(shareModalUrl);
                  showToast('Architecture link copied.');
                  setShareModalUrl(null);
                }}
                className="btn btn-primary btn-sm"
              >
                Copy Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assumptions Modal */}
      {isAssumptionsOpen && (
        <div className="assumptions-modal-overlay" onClick={() => setIsAssumptionsOpen(false)}>
          <div className="assumptions-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h3 className="dialog-title">Pricing &amp; Simulation Assumptions</h3>
              <button onClick={() => setIsAssumptionsOpen(false)} className="btn btn-ghost btn-sm">
                ✕
              </button>
            </div>

            <div className="dialog-content">
              <p className="dialog-intro">
                ComputeCanvas generates deterministic architecture estimates to compare structural AI trade-offs before building. Estimates are based on transparent, publicly verifiable provider unit pricing.
              </p>

              <div className="assumptions-table-wrapper">
                <table className="assumptions-table text-mono">
                  <thead>
                    <tr>
                      <th>Component</th>
                      <th>Input Price</th>
                      <th>Output Price</th>
                      <th>Baseline Latency</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Fast Models (GPT-4o Mini / Gemini Flash)</td>
                      <td>$0.10 - $0.15 / 1M</td>
                      <td>$0.40 - $0.60 / 1M</td>
                      <td>90 - 140 ms</td>
                    </tr>
                    <tr>
                      <td>Frontier Models (GPT-4o / Claude 3.5 Sonnet)</td>
                      <td>$2.50 - $3.00 / 1M</td>
                      <td>$10.00 - $15.00 / 1M</td>
                      <td>380 - 420 ms</td>
                    </tr>
                    <tr>
                      <td>Vector Database (Pinecone / Qdrant)</td>
                      <td colSpan={2}>$120/mo cluster base + $0.20/1M queries</td>
                      <td>45 ms</td>
                    </tr>
                    <tr>
                      <td>Semantic Cache (Redis Cloud)</td>
                      <td colSpan={2}>$65/mo base + memory footprint</td>
                      <td>5 ms</td>
                    </tr>
                    <tr>
                      <td>API Gateway Ingress</td>
                      <td colSpan={2}>$1.00 / 1M requests</td>
                      <td>12 ms</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="assumptions-notes">
                <h4>Calibration Methodology:</h4>
                <p>
                  When &ldquo;Anchor to My Bill&rdquo; is applied, the calibration factor scales token volume relative to your actual cloud invoice. It does not alter fixed provider infrastructure pricing or fake individual line items.
                </p>
              </div>
            </div>

            <div className="dialog-footer">
              <button onClick={() => setIsAssumptionsOpen(false)} className="btn btn-primary btn-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="simulator-toast" role="status" aria-live="polite">
          <span className="toast-dot" />
          <span>{toastMessage}</span>
        </div>
      )}

      <style jsx>{`
        .simulator-v1-root {
          min-height: 100vh;
          background: var(--color-bg);
          color: var(--color-text);
          display: flex;
          flex-direction: column;
          padding-top: var(--nav-height, 58px);
        }

        .simulator-header-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px var(--space-6);
          border-bottom: 1px solid var(--color-border);
          background: var(--color-bg-elevated);
          z-index: 30;
          gap: var(--space-4);
          flex-wrap: wrap;
        }

        .simulator-header-left {
          display: flex;
          align-items: center;
          gap: var(--space-4);
          flex-wrap: wrap;
        }

        .simulator-title-group {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .simulator-app-title {
          font-size: 1.05rem;
          font-weight: 700;
          letter-spacing: -0.01em;
          margin: 0;
        }

        .template-selector-group {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          background: var(--color-bg-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          padding: 2px 8px;
        }

        .template-label {
          color: var(--color-text-muted);
          font-weight: 600;
          font-size: 0.6875rem;
        }

        .template-select-dropdown {
          background: transparent;
          border: none;
          color: var(--color-text);
          font-size: 0.8125rem;
          font-weight: 600;
          cursor: pointer;
          outline: none;
        }

        .template-select-dropdown option {
          background: var(--color-bg-surface);
          color: var(--color-text);
        }

        .simulator-header-right {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .validation-warning-banner {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          background: #18181B;
          border-bottom: 2px solid #FFFFFF;
          color: #FFFFFF;
          padding: var(--space-2) var(--space-6);
          font-size: 0.8125rem;
          font-family: var(--font-mono);
          z-index: 25;
        }

        .warning-icon {
          font-size: 1rem;
        }

        /* 3-Column Work Area Grid */
        .simulator-body-grid {
          display: grid;
          grid-template-columns: 310px 1fr 340px;
          flex: 1;
          min-height: calc(100vh - var(--nav-height, 58px) - 48px);
          overflow: hidden;
        }

        /* Sidebars */
        .simulator-sidebar-left {
          border-right: 1px solid var(--color-border);
          background: var(--color-bg);
          padding: var(--space-3);
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
          max-height: calc(100vh - var(--nav-height, 58px) - 48px);
        }

        .left-sidebar-tabs {
          display: flex;
          background: var(--color-bg-elevated);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          padding: 2px;
          gap: 2px;
        }

        .sidebar-tab-btn {
          flex: 1;
          background: none;
          border: none;
          padding: 4px 6px;
          border-radius: 3px;
          font-size: 0.6875rem;
          font-family: var(--font-mono);
          color: var(--color-text-muted);
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
        }

        .sidebar-tab-btn.active {
          background: var(--color-bg-surface);
          color: var(--color-text);
          font-weight: 700;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        }

        .simulator-sidebar-right {
          border-left: 1px solid var(--color-border);
          background: var(--color-bg);
          padding: var(--space-3);
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
          max-height: calc(100vh - var(--nav-height, 58px) - 48px);
        }

        .sidebar-card {
          background: var(--color-bg-elevated);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          padding: var(--space-3);
        }

        .sidebar-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--space-2);
        }

        .sidebar-section-title {
          font-size: 0.8125rem;
          font-family: var(--font-display);
          letter-spacing: 0.05em;
          font-weight: 600;
          color: var(--color-text);
          margin: 0;
        }

        /* Palette list */
        .palette-components-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .palette-component-item {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          background: var(--color-bg-surface);
          border: 1px solid var(--color-border-subtle);
          border-radius: var(--radius-sm);
          padding: 6px 8px;
          cursor: grab;
          transition: all var(--duration-fast);
          user-select: none;
        }

        .palette-component-item:hover {
          border-color: var(--color-border-strong);
          background: var(--color-bg-light-surface, #1e1e24);
          transform: translateY(-1px);
        }

        .palette-item-icon {
          font-size: 0.875rem;
          width: 20px;
          text-align: center;
          flex-shrink: 0;
          color: var(--color-text-secondary);
        }

        .palette-item-info {
          flex: 1;
          min-width: 0;
        }

        .palette-item-name {
          font-family: var(--font-ui);
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--color-text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .palette-item-desc {
          font-family: var(--font-ui);
          font-size: 0.6875rem;
          color: var(--color-text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .palette-item-badge {
          font-family: var(--font-mono);
          font-size: 0.5625rem;
          font-weight: 500;
          border: 1px solid;
          border-radius: 2px;
          padding: 1px 4px;
          flex-shrink: 0;
        }

        /* Workload Controls */
        .workload-controls-stack {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .control-field {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .control-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .control-label {
          font-family: var(--font-ui);
          font-size: 0.75rem;
          color: var(--color-text-secondary);
        }

        .control-val {
          font-family: var(--font-mono);
          font-size: 0.8125rem;
          font-weight: 500;
          font-variant-numeric: tabular-nums;
          color: var(--color-text);
        }

        .simulator-slider {
          width: 100%;
          accent-color: var(--color-accent);
          cursor: pointer;
        }

        /* Calibration */
        .calibration-reset-btn {
          background: none;
          border: none;
          color: var(--color-text-muted);
          font-size: 0.6875rem;
          cursor: pointer;
        }

        .calibration-reset-btn:hover {
          color: var(--color-critical);
        }

        .calibration-active-card {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .calibration-status-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #FFFFFF;
        }

        .status-dot-green {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #FFFFFF;
        }

        .calibration-meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: var(--space-2);
          background: var(--color-bg-surface);
          border-radius: var(--radius-sm);
          padding: 8px;
        }

        .meta-col {
          display: flex;
          flex-direction: column;
        }

        .meta-sub {
          font-size: 0.625rem;
          color: var(--color-text-muted);
        }

        .meta-num {
          font-size: 0.75rem;
          font-weight: 500;
          font-variant-numeric: tabular-nums;
          color: var(--color-text);
        }

        .calibration-explainer {
          font-size: 0.6875rem;
          color: var(--color-text-muted);
          margin: 0;
        }

        .calibration-idle-desc {
          font-family: var(--font-ui);
          font-size: 0.75rem;
          color: var(--color-text-secondary);
          line-height: 1.4;
          margin: 0;
        }

        .calibration-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .calibration-input-row {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .simulator-text-input {
          background: var(--color-bg-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          padding: 6px 8px;
          color: var(--color-text);
          font-size: 0.8125rem;
          outline: none;
        }

        .simulator-text-input:focus {
          border-color: var(--color-accent);
        }

        .calibration-btn-row {
          display: flex;
          gap: var(--space-2);
          margin-top: 4px;
        }

        /* Center Canvas */
        .simulator-canvas-center {
          position: relative;
          background: var(--color-bg);
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .canvas-wrapper-outer {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 520px;
        }

        /* Inspector Floating Bar */
        .selected-inspector-dock {
          position: absolute;
          bottom: var(--space-4);
          left: 50%;
          transform: translateX(-50%);
          z-index: 25;
          display: flex;
          align-items: center;
          gap: var(--space-3);
          background: var(--color-bg-elevated);
          border: 1px solid var(--color-border-strong);
          border-radius: var(--radius-sm);
          padding: 6px 14px;
          box-shadow: var(--shadow-md);
          max-width: 90%;
        }

        .inspector-header {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .inspector-type-pill {
          font-size: 0.625rem;
          font-weight: 500;
          color: #F4F4F5;
          background: #27272A;
          border: 1px solid #3F3F46;
          padding: 2px 6px;
          border-radius: 2px;
        }

        .inspector-title {
          font-family: var(--font-ui);
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--color-text);
        }

        .inspector-actions {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .inspector-select {
          background: var(--color-bg-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          color: var(--color-text);
          font-size: 0.75rem;
          padding: 4px 8px;
          outline: none;
        }

        /* Right Column Metrics */
        .metrics-primary-stack {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .metric-box {
          background: var(--color-bg-surface);
          border-radius: var(--radius-sm);
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .metric-label {
          font-size: 0.6875rem;
          font-family: var(--font-mono);
          letter-spacing: 0.05em;
          color: var(--color-text-muted);
          font-weight: 500;
        }

        .metric-huge-value {
          font-size: 1.75rem;
          font-weight: 500;
          font-family: var(--font-mono);
          font-variant-numeric: tabular-nums;
          color: var(--color-text);
          line-height: 1.1;
        }

        .metric-unit {
          font-size: 0.8125rem;
          color: var(--color-text-muted);
          font-weight: 400;
        }

        .metric-sub-detail {
          font-size: 0.6875rem;
          color: var(--color-text-muted);
          margin-top: 2px;
        }

        .metric-dual-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-2);
        }

        .metric-sub-box {
          background: var(--color-bg-surface);
          border-radius: var(--radius-sm);
          padding: 8px 10px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .metric-val {
          font-size: 1.0625rem;
          font-weight: 500;
          font-family: var(--font-mono);
          font-variant-numeric: tabular-nums;
          color: var(--color-text);
        }

        /* Bottleneck */
        .bottleneck-display-card {
          background: #141417;
          border: 1px solid #FFFFFF;
          border-radius: var(--radius-sm);
          padding: 8px 10px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .bottleneck-head-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .bottleneck-component-name {
          font-family: var(--font-ui);
          font-weight: 600;
          font-size: 0.875rem;
          color: #FFFFFF;
        }

        .bottleneck-impact-badge {
          font-size: 0.6875rem;
          background: #FFFFFF;
          color: #09090B;
          font-weight: 700;
          padding: 1px 6px;
          border-radius: 2px;
        }

        .bottleneck-explanation-text {
          font-family: var(--font-ui);
          font-size: 0.75rem;
          color: var(--color-text-secondary);
          line-height: 1.35;
          margin: 0;
        }

        /* Cost Breakdown */
        .cost-breakdown-stack {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .breakdown-bar-track {
          display: flex;
          height: 6px;
          border-radius: var(--radius-xs);
          overflow: hidden;
          background: var(--color-border);
        }

        .breakdown-bar-segment {
          height: 100%;
          transition: width var(--duration-normal);
        }

        .breakdown-legend-list {
          display: flex;
          flex-direction: column;
          gap: 5px;
          margin-top: 4px;
        }

        .breakdown-legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
        }

        .legend-indicator {
          width: 8px;
          height: 8px;
          border-radius: 2px;
          flex-shrink: 0;
        }

        .legend-name {
          flex: 1;
          color: var(--color-text-secondary);
        }

        .legend-amount {
          color: var(--color-text);
          font-weight: 600;
        }

        /* Why changed */
        .why-changed-box {
          background: var(--color-bg-surface);
          border-radius: var(--radius-sm);
          padding: 8px 10px;
        }

        .why-changed-text {
          font-size: 0.75rem;
          color: var(--color-text-secondary);
          line-height: 1.4;
          margin: 0;
        }

        /* Assumptions Modal */
        .assumptions-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(4px);
          z-index: 999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-4);
        }

        .assumptions-modal-dialog {
          background: var(--color-bg-elevated);
          border: 1px solid var(--color-border-strong);
          border-radius: var(--radius-lg);
          max-width: 640px;
          width: 100%;
          box-shadow: var(--shadow-lg);
          overflow: hidden;
        }

        .dialog-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-3) var(--space-4);
          border-bottom: 1px solid var(--color-border);
        }

        .dialog-title {
          font-size: 1rem;
          font-weight: 700;
          margin: 0;
        }

        .dialog-content {
          padding: var(--space-4);
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
          max-height: 70vh;
          overflow-y: auto;
        }

        .dialog-intro {
          font-size: 0.8125rem;
          color: var(--color-text-secondary);
          line-height: 1.4;
          margin: 0;
        }

        .assumptions-table-wrapper {
          overflow-x: auto;
        }

        .assumptions-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.75rem;
        }

        .assumptions-table th,
        .assumptions-table td {
          border: 1px solid var(--color-border);
          padding: 6px 10px;
          text-align: left;
        }

        .assumptions-table th {
          background: var(--color-bg-surface);
          color: var(--color-text-secondary);
        }

        .assumptions-notes h4 {
          font-size: 0.8125rem;
          margin: 0 0 4px 0;
          color: var(--color-text);
        }

        .assumptions-notes p {
          font-size: 0.75rem;
          color: var(--color-text-muted);
          line-height: 1.4;
          margin: 0;
        }

        .dialog-footer {
          padding: var(--space-3) var(--space-4);
          border-top: 1px solid var(--color-border);
          display: flex;
          justify-content: flex-end;
        }

        /* Toast */
        .simulator-toast {
          position: fixed;
          bottom: var(--space-6);
          right: var(--space-6);
          background: var(--color-bg-surface);
          border: 1px solid var(--color-accent);
          color: var(--color-text);
          padding: 8px 14px;
          border-radius: var(--radius-md);
          font-size: 0.8125rem;
          font-family: var(--font-mono);
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: var(--shadow-lg);
          z-index: 1000;
          animation: slideUp 0.2s ease-out;
        }

        .toast-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--color-accent);
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Responsive Layout Breakpoints */
        @media (max-width: 1100px) {
          .simulator-body-grid {
            grid-template-columns: 270px 1fr 290px;
          }
        }

        @media (max-width: 900px) {
          .simulator-body-grid {
            display: flex;
            flex-direction: column;
            overflow-y: auto;
          }
          .simulator-sidebar-left,
          .simulator-sidebar-right {
            max-height: none;
            border: none;
          }
          .simulator-canvas-center {
            min-height: 480px;
          }
        }
      `}</style>
    </div>
  );
}

// ── SSR Fallback Shell (eliminates unstyled text and ensures instant visual structure) ──
function SimulatorFallbackShell() {
  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: '#f4f4f5', display: 'flex', flexDirection: 'column' }}>
      <header style={{ height: '60px', borderBottom: '1px solid #27272a', background: '#121215', display: 'flex', alignItems: 'center', padding: '0 24px', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', background: '#27272a', color: '#f4f4f5', padding: '2px 6px', borderRadius: '2px' }}>SIMULATOR V1</span>
          <span style={{ fontWeight: 700, fontSize: '1rem' }}>AI Architecture &amp; Economics</span>
        </div>
      </header>
      <div style={{ display: 'grid', gridTemplateColumns: '310px 1fr 340px', flex: 1, minHeight: 'calc(100vh - 60px)' }}>
        <div style={{ borderRight: '1px solid #27272a', padding: '16px', background: '#09090b' }}>
          <div style={{ height: '24px', background: '#18181b', borderRadius: '4px', marginBottom: '12px' }} />
          <div style={{ height: '180px', background: '#18181b', borderRadius: '8px' }} />
        </div>
        <div style={{ background: '#0d0d10', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#71717a', fontFamily: 'monospace', fontSize: '0.875rem' }}>
          Initializing interactive architecture canvas…
        </div>
        <div style={{ borderLeft: '1px solid #27272a', padding: '16px', background: '#09090b' }}>
          <div style={{ height: '140px', background: '#18181b', borderRadius: '8px', marginBottom: '12px' }} />
          <div style={{ height: '90px', background: '#18181b', borderRadius: '8px' }} />
        </div>
      </div>
    </div>
  );
}

export default function SimulatorPage() {
  return (
    <SimulatorErrorBoundary>
      <Suspense fallback={<SimulatorFallbackShell />}>
        <SimulatorContent />
      </Suspense>
    </SimulatorErrorBoundary>
  );
}
