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
  type Architecture,
  type Workload,
  type BillCalibration,
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

export interface SimulatorClientProps {
  initialTemplateId?: string;
  initialArchitecture?: Architecture;
  initialWorkload?: Workload;
  initialCalibration?: BillCalibration;
}

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
        onError('SHARED ARCHITECTURE COULD NOT BE RESTORED. The link may be corrupted or from an incompatible version. A clean baseline workspace has been loaded.');
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

export default function SimulatorClient({
  initialTemplateId,
  initialArchitecture,
  initialWorkload,
  initialCalibration,
}: SimulatorClientProps) {
  const store = useArchitectureStore();
  const [hasUserModified, setHasUserModified] = useState(false);

  // Synchronize store on client mount
  useEffect(() => {
    if (initialArchitecture) {
      store.loadArchitecture(initialArchitecture, initialWorkload, initialCalibration);
    }
  }, []);

  // Use initialArchitecture directly for SSR & initial client hydration
  const architecture = (!hasUserModified && initialArchitecture) ? initialArchitecture : store.architecture;
  const workload = (!hasUserModified && initialWorkload) ? initialWorkload : store.workload;
  const calibration = (!hasUserModified && initialCalibration) ? initialCalibration : store.calibration;

  const {
    previousState,
    selectedNodeId,
    selectedEdgeIndex,
    setSelectedNode,
    setSelectedEdge,
  } = store;

  const setWorkload = useCallback((wl: Partial<Workload>) => {
    setHasUserModified(true);
    store.setWorkload(wl);
  }, [store]);

  const applyCalibration = useCallback((bill: number, reqs: number, simCost: number) => {
    setHasUserModified(true);
    store.applyCalibration(bill, reqs, simCost);
  }, [store]);

  const clearCalibration = useCallback(() => {
    setHasUserModified(true);
    store.clearCalibration();
  }, [store]);

  const addNode = useCallback((type: ArchNode['type'], label: string, x?: number, y?: number) => {
    setHasUserModified(true);
    return store.addNode(type, label, x, y);
  }, [store]);

  const removeNode = useCallback((id: string) => {
    setHasUserModified(true);
    store.removeNode(id);
  }, [store]);

  const updateNodeModel = useCallback((id: string, modelId: string) => {
    setHasUserModified(true);
    store.updateNodeModel(id, modelId);
  }, [store]);

  const updateEdgeShare = useCallback((source: string, target: string, share: number) => {
    setHasUserModified(true);
    store.updateEdgeShare(source, target, share);
  }, [store]);

  const removeEdge = useCallback((source: string, target: string) => {
    setHasUserModified(true);
    store.removeEdge(source, target);
  }, [store]);

  const loadArchitecture = useCallback((arch: Architecture, wl?: Workload, cal?: BillCalibration) => {
    setHasUserModified(true);
    store.loadArchitecture(arch, wl, cal);
  }, [store]);

  // Local UI states
  const [leftTab, setLeftTab] = useState<'all' | 'components' | 'workload' | 'calibration'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calBillInput, setCalBillInput] = useState(calibration.actualBill ? String(calibration.actualBill) : '4500');
  const [calReqInput, setCalReqInput] = useState(calibration.actualRequests ? String(calibration.actualRequests) : '1200000');
  const [isAssumptionsOpen, setIsAssumptionsOpen] = useState(false);
  const [isCostModalOpen, setIsCostModalOpen] = useState(false);
  const [isLatencyModalOpen, setIsLatencyModalOpen] = useState(false);
  const [shareModalUrl, setShareModalUrl] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(initialTemplateId || 'router-cache');
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

  // Selected node inspection calculations (Section 42)
  const selectedNode = useMemo(
    () => (selectedNodeId ? architecture.nodes.find(n => n.id === selectedNodeId) || null : null),
    [architecture.nodes, selectedNodeId]
  );

  const selectedNodeMetrics = useMemo(
    () => (selectedNodeId ? result.nodeMetrics.get(selectedNodeId) || null : null),
    [result.nodeMetrics, selectedNodeId]
  );

  const selectedNodeTrafficInfo = useMemo(() => {
    if (!selectedNode) return null;
    const hasCache = architecture.nodes.some(n => n.type === 'cache');
    const effectiveCacheRate = hasCache ? workload.cacheHitRate : 0;
    const uncachedRequests = workload.requestsPerMonth * (1 - effectiveCacheRate);

    if (selectedNode.type === 'api' || selectedNode.type === 'cache') {
      return { shareText: '100% Ingress', routedReqs: workload.requestsPerMonth, isModel: false };
    }
    if (selectedNode.type === 'vectordb' || selectedNode.type === 'router') {
      return { shareText: `${Math.round((1 - effectiveCacheRate) * 100)}% Miss`, routedReqs: uncachedRequests, isModel: false };
    }
    // Model nodes
    const incomingEdge = architecture.edges.find(e => e.target === selectedNode.id);
    const modelNodes = architecture.nodes.filter(n => n.type === 'fast-model' || n.type === 'frontier-model' || n.type === 'model');
    const share = incomingEdge?.trafficShare !== undefined ? incomingEdge.trafficShare : 1 / Math.max(1, modelNodes.length);
    const routedReqs = uncachedRequests * share;
    return {
      shareText: `${Math.round(share * 100)}% Route`,
      routedReqs,
      isModel: true,
    };
  }, [selectedNode, architecture, workload]);

  // Share architecture action: Base64URL encode and open share modal with disclosure (Section 26)
  const handleShare = useCallback(() => {
    try {
      const encoded = encodeArchitectureState({ architecture, workload, calibration });
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://computecanvas.io';
      const shareUrl = `${origin}/simulator?data=${encoded}`;
      setShareModalUrl(shareUrl);
    } catch {
      showToast('Architecture URL could not be generated.');
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

      {/* Section 21 & 22: Engineering Telemetry Strip */}
      <section className="simulator-telemetry-strip" aria-label="Live Simulation Telemetry">
        <div
          className="telemetry-cell telemetry-cell--clickable"
          onClick={() => setIsCostModalOpen(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setIsCostModalOpen(true)}
          title="Click to view detailed itemized cost breakdown"
        >
          <div className="telemetry-cell-header">
            <span className="telemetry-cell-label">MONTHLY SPEND</span>
            <span className={`telemetry-mode-tag text-mono ${calibrated.isCalibrated ? 'mode-calibrated' : 'mode-live'}`}>
              {calibrated.isCalibrated ? 'CALIBRATED ESTIMATE' : 'LIVE SIMULATION'}
            </span>
          </div>
          <div className="telemetry-cell-value text-mono">
            {calibrated.isCalibrated ? formatCurrency(calibrated.calibratedMonthlyCost) : formatCurrency(result.monthlyCost)}
            <span className="telemetry-unit">/mo</span>
          </div>
          <div className="telemetry-cell-subtext text-mono">
            {calibrated.isCalibrated
              ? `Factor: ${calibrated.calibrationFactor.toFixed(2)}× (Baseline: ${formatCurrency(calibrated.simulatedBaselineCost)})`
              : `$${result.costPerRequest.toFixed(4)} / request · Breakdown →`}
          </div>
        </div>

        <div
          className="telemetry-cell telemetry-cell--clickable"
          onClick={() => setIsLatencyModalOpen(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setIsLatencyModalOpen(true)}
          title="Click to inspect modeled tail latency critical path"
        >
          <div className="telemetry-cell-header">
            <span className="telemetry-cell-label">MODELED TAIL LATENCY</span>
            <span className="telemetry-mode-tag text-mono mode-live">ESTIMATED P95</span>
          </div>
          <div className="telemetry-cell-value text-mono" style={{ color: 'var(--color-performance, #FAFAFA)' }}>
            {formatLatency(result.p95Latency)}
          </div>
          <div className="telemetry-cell-subtext text-mono">
            Critical path: {formatLatency(result.latencies.criticalPathMs || result.p95Latency)} · Critical path →
          </div>
        </div>

        <div className="telemetry-cell">
          <div className="telemetry-cell-header">
            <span className="telemetry-cell-label">BOTTLENECK IDENTIFIER</span>
            <span className="telemetry-mode-tag text-mono mode-warning">DOMINANT FACTOR</span>
          </div>
          <div className="telemetry-cell-value text-mono">
            {result.bottleneck.componentName.toUpperCase()}
          </div>
          <div className="telemetry-cell-subtext text-mono">
            {result.bottleneck.impactPercentage}% of total spend
          </div>
        </div>

        <div className="telemetry-cell">
          <div className="telemetry-cell-header">
            <span className="telemetry-cell-label">CAPABILITY TIER</span>
            <span className="telemetry-mode-tag text-mono mode-neutral">QUALITATIVE</span>
          </div>
          <div className="telemetry-cell-value text-mono" style={{ fontSize: '1.05rem', letterSpacing: '0.01em' }}>
            {result.capabilityTier || 'Quality Not Modeled'}
          </div>
          <div className="telemetry-cell-subtext text-mono" style={{ fontSize: '0.6875rem' }}>
            {result.capabilityDescription || 'Architectural tier classification'}
          </div>
        </div>
      </section>

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
                    <span className="text-mono" style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.04em' }}>CALIBRATED EMPIRICAL BASELINE</span>
                  </div>

                  <div className="calibration-meta-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    <div className="meta-col">
                      <span className="meta-sub">THEORETICAL MODEL</span>
                      <span className="meta-num text-mono">{formatCurrency(calibrated.simulatedBaselineCost)}</span>
                    </div>
                    <div className="meta-col">
                      <span className="meta-sub">ACTUAL HISTORICAL BILL</span>
                      <span className="meta-num text-mono">{formatCurrency(calibrated.actualHistoricalBill)}</span>
                    </div>
                    <div className="meta-col">
                      <span className="meta-sub">HISTORICAL REQUESTS</span>
                      <span className="meta-num text-mono">{formatNumber(calibrated.historicalRequests)}/mo</span>
                    </div>
                    <div className="meta-col">
                      <span className="meta-sub">CALIBRATION FACTOR</span>
                      <span className="meta-num text-mono">{calibrated.calibrationFactor.toFixed(2)}×</span>
                    </div>
                  </div>

                  <div style={{ padding: '8px', background: '#18181B', borderRadius: '3px', border: '1px solid var(--color-border)', marginTop: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.6875rem' }}>
                      <span style={{ color: 'var(--color-text-muted)' }} className="text-mono">CALIBRATED ESTIMATE</span>
                      <span className="text-mono" style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '0.875rem' }}>
                        {formatCurrency(calibrated.calibratedMonthlyCost)}/mo
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.625rem', marginTop: '4px' }}>
                      <span style={{ color: 'var(--color-text-muted)' }} className="text-mono">CONFIDENCE:</span>
                      <span className="text-mono" style={{ color: calibrated.confidenceLevel === 'High Confidence' ? '#FAFAFA' : '#A1A1AA' }}>
                        {calibrated.confidenceLevel}
                      </span>
                    </div>
                  </div>

                  <div style={{ marginTop: '8px', padding: '8px 10px', background: '#09090B', border: '1px solid #27272A', borderRadius: '3px', fontSize: '0.625rem', color: '#71717A', lineHeight: 1.4 }}>
                    <strong style={{ color: '#A1A1AA' }}>IMPORTANT: </strong>
                    Calibration adjusts the model to your historical baseline. It does not reproduce provider invoices and does not guarantee future spend.
                  </div>
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
            <SpatialCanvas simulation={result} architecture={architecture} />
          </div>
        </main>

        {/* ── RIGHT COLUMN: Live Economics Panel ── */}
        <aside className="simulator-sidebar-right">
          {/* Subsystem Inspection Card (Section 42) */}
          {selectedNode && selectedNodeTrafficInfo && (
            <div className="sidebar-card" style={{ borderColor: '#FFFFFF', background: '#0D0D10' }}>
              <div className="sidebar-card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 className="sidebar-section-title">SUBSYSTEM INSPECTION</h2>
                  <span className="badge badge--neutral text-mono" style={{ fontSize: '0.625rem' }}>
                    {selectedNode.type.toUpperCase()}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="btn btn-ghost btn-sm text-mono"
                  style={{ fontSize: '0.6875rem', padding: '2px 6px', height: 'auto', minHeight: 'unset' }}
                  title="Close inspection"
                >
                  ✕
                </button>
              </div>

              <div style={{ padding: '4px 0 2px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#FFFFFF' }}>{selectedNode.label}</span>
                  {selectedNodeMetrics?.isBottleneck && (
                    <span className="badge badge--warning text-mono" style={{ fontSize: '0.625rem' }}>
                      BOTTLENECK
                    </span>
                  )}
                </div>

                <div className="inspection-matrix-grid text-mono">
                  <div className="inspection-matrix-item">
                    <span className="insp-lbl">TRAFFIC</span>
                    <span className="insp-val">{selectedNodeTrafficInfo.shareText}</span>
                  </div>
                  <div className="inspection-matrix-item">
                    <span className="insp-lbl">MONTHLY REQS</span>
                    <span className="insp-val">{formatNumber(selectedNodeTrafficInfo.routedReqs)}</span>
                  </div>
                  <div className="inspection-matrix-item">
                    <span className="insp-lbl">INPUT TOKENS</span>
                    <span className="insp-val">{selectedNodeTrafficInfo.isModel ? formatNumber(workload.avgInputTokens) : '—'}</span>
                  </div>
                  <div className="inspection-matrix-item">
                    <span className="insp-lbl">OUTPUT TOKENS</span>
                    <span className="insp-val">{selectedNodeTrafficInfo.isModel ? formatNumber(workload.avgOutputTokens) : '—'}</span>
                  </div>
                  <div className="inspection-matrix-item">
                    <span className="insp-lbl">MONTHLY COST</span>
                    <span className="insp-val" style={{ color: '#FFFFFF' }}>{formatCurrency(selectedNodeMetrics?.monthlyCost ?? 0)}</span>
                  </div>
                  <div className="inspection-matrix-item">
                    <span className="insp-lbl">SHARE OF SPEND</span>
                    <span className="insp-val">{selectedNodeMetrics?.costPercentage ?? 0}%</span>
                  </div>
                  <div className="inspection-matrix-item">
                    <span className="insp-lbl">P95 LATENCY</span>
                    <span className="insp-val" style={{ color: 'var(--color-performance)' }}>{formatLatency(selectedNodeMetrics?.latencyMs ?? 0)}</span>
                  </div>
                  <div className="inspection-matrix-item">
                    <span className="insp-lbl">CAPACITY</span>
                    <span className="insp-val">{result.capacityUtilization}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

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

              {/* Cost Per Request & P95 Latency */}
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

              {/* Latency Percentiles Strip (Section 8) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-xs)', fontSize: '0.6875rem', border: '1px solid var(--color-border)' }} className="text-mono">
                <span style={{ color: 'var(--color-text-muted)' }}>P50: <strong style={{ color: 'var(--color-text)' }}>{formatLatency(result.latencies.p50)}</strong></span>
                <span style={{ color: 'var(--color-text-muted)' }}>P90: <strong style={{ color: 'var(--color-text)' }}>{formatLatency(result.latencies.p90)}</strong></span>
                <span style={{ color: 'var(--color-text-muted)' }}>P99: <strong style={{ color: 'var(--color-text)' }}>{formatLatency(result.latencies.p99)}</strong></span>
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
                  {result.bottleneck.impactPercentage}% of spend
                </span>
              </div>
              {result.bottleneck.latencySharePercentage !== undefined && result.bottleneck.latencySharePercentage > 0 && (
                <div className="text-mono" style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  Critical-path latency contribution: {result.bottleneck.latencySharePercentage}%
                </div>
              )}
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

      {/* Share URL Modal with Section 26 Privacy Disclosure */}
      {shareModalUrl && (
        <div className="assumptions-modal-overlay" onClick={() => setShareModalUrl(null)}>
          <div className="assumptions-modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div className="dialog-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge badge--primary text-mono">SHAREABLE ARCHITECTURE</span>
              </div>
              <button onClick={() => setShareModalUrl(null)} className="btn btn-ghost btn-sm" aria-label="Close dialog">✕</button>
            </div>
            <div className="dialog-content">
              <div className="share-disclosure-box">
                <div className="share-disclosure-title text-mono">ENCODED PAYLOAD DISCLOSURE</div>
                <p className="share-disclosure-text">
                  This shareable link encodes your architecture topology directly in the URL query string:
                </p>
                <ul className="share-disclosure-list text-mono">
                  <li>• Architecture nodes, types, and model selections</li>
                  <li>• Graph connections &amp; traffic routing percentages</li>
                  <li>• Monthly requests, input tokens, output tokens &amp; cache hit rate</li>
                  <li>• Anchor bill calibration parameters (if enabled)</li>
                </ul>
                <p className="share-disclosure-warning">
                  <strong>Notice:</strong> Anyone with this link can view these architectural parameters. Do not embed confidential provider credentials or private network identifiers in component labels.
                </p>
              </div>

              <div style={{ marginTop: '14px' }}>
                <label className="text-caption text-mono" style={{ color: 'var(--color-text-muted)', display: 'block', marginBottom: '6px' }}>
                  SHAREABLE URL (ZERO-DATABASE / CLIENT-ENCODED)
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    readOnly
                    value={shareModalUrl}
                    className="simulator-text-input text-mono"
                    style={{ flex: 1, fontSize: '0.75rem', padding: '8px' }}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(shareModalUrl);
                        showToast('Link copied to clipboard.');
                      } catch {
                        showToast('Link ready to copy.');
                      }
                    }}
                    className="btn btn-primary btn-sm"
                  >
                    Copy Link
                  </button>
                </div>
              </div>
            </div>
            <div className="dialog-footer" style={{ justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShareModalUrl(null)}
                className="btn btn-secondary btn-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cost Subsystems Drill-Down Modal (Section 14) */}
      {isCostModalOpen && (
        <div className="assumptions-modal-overlay" onClick={() => setIsCostModalOpen(false)}>
          <div className="assumptions-modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
            <div className="dialog-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge badge--primary text-mono">COST MODEL TRANSPARENCY</span>
                <h3 className="dialog-title" style={{ margin: 0 }}>Itemized Spend Breakdown</h3>
              </div>
              <button onClick={() => setIsCostModalOpen(false)} className="btn btn-ghost btn-sm" aria-label="Close dialog">✕</button>
            </div>
            <div className="dialog-content">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--color-border)' }}>
                <div>
                  <span className="text-caption text-mono" style={{ color: 'var(--color-text-muted)' }}>TOTAL MONTHLY SPEND</span>
                  <div className="text-mono" style={{ fontSize: '1.5rem', fontWeight: 700, color: '#FFFFFF' }}>
                    {formatCurrency(result.monthlyCost)} <span style={{ fontSize: '0.875rem', color: '#71717A' }}>/ mo</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="text-caption text-mono" style={{ color: 'var(--color-text-muted)' }}>COST PER REQUEST</span>
                  <div className="text-mono" style={{ fontSize: '1.125rem', fontWeight: 600, color: '#A1A1AA' }}>
                    ${result.costPerRequest.toFixed(4)}
                  </div>
                </div>
              </div>

              <div className="assumptions-table-wrapper">
                <table className="assumptions-table text-mono" style={{ fontSize: '0.75rem' }}>
                  <thead>
                    <tr>
                      <th>Subsystem Component</th>
                      <th>Type</th>
                      <th style={{ textAlign: 'right' }}>Monthly Spend</th>
                      <th style={{ textAlign: 'right' }}>Share</th>
                      <th>Unit Rate Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.costBreakdown.subsystems && result.costBreakdown.subsystems.length > 0 ? (
                      result.costBreakdown.subsystems.map(sub => (
                        <tr key={sub.id}>
                          <td style={{ fontWeight: 600, color: '#FFFFFF' }}>{sub.name}</td>
                          <td style={{ color: '#A1A1AA' }}>{sub.type}</td>
                          <td style={{ textAlign: 'right', color: '#FFFFFF' }}>{formatCurrency(sub.monthlyCost)}</td>
                          <td style={{ textAlign: 'right', color: '#A1A1AA' }}>{sub.sharePercentage}%</td>
                          <td style={{ color: '#71717A', fontSize: '0.6875rem' }}>{sub.unitRateDescription}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', color: '#71717A' }}>No active subsystems modeled</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: '16px', padding: '12px', background: '#141417', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '0.6875rem', color: '#A1A1AA', lineHeight: 1.5 }}>
                <strong style={{ color: '#FFFFFF' }}>Methodology Note: </strong>
                ComputeCanvas computes cost deterministically from active graph routes and configured token counts. Token pricing reflects publicly cited list rates (March 2026). Ingress and routing costs are modeled on public edge gateway tiers ($0.50 - $0.60 / 1M requests).
              </div>
            </div>
            <div className="dialog-footer" style={{ justifyContent: 'flex-end' }}>
              <button onClick={() => setIsCostModalOpen(false)} className="btn btn-secondary btn-sm">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Latency Critical Path Modal (Sections 12 & 13) */}
      {isLatencyModalOpen && (
        <div className="assumptions-modal-overlay" onClick={() => setIsLatencyModalOpen(false)}>
          <div className="assumptions-modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
            <div className="dialog-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge badge--primary text-mono">LATENCY FORMULA TRANSPARENCY</span>
                <h3 className="dialog-title" style={{ margin: 0 }}>Modeled Tail Latency Breakdown</h3>
              </div>
              <button onClick={() => setIsLatencyModalOpen(false)} className="btn btn-ghost btn-sm" aria-label="Close dialog">✕</button>
            </div>
            <div className="dialog-content">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--color-border)' }}>
                <div>
                  <span className="text-caption text-mono" style={{ color: 'var(--color-text-muted)' }}>MODELED P95 TAIL LATENCY</span>
                  <div className="text-mono" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-performance, #FAFAFA)' }}>
                    {formatLatency(result.p95Latency)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '16px' }} className="text-mono">
                  <div>
                    <span style={{ fontSize: '0.6875rem', color: '#71717A', display: 'block' }}>P50</span>
                    <strong style={{ color: '#FFFFFF' }}>{formatLatency(result.latencies.p50)}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.6875rem', color: '#71717A', display: 'block' }}>P90</span>
                    <strong style={{ color: '#FFFFFF' }}>{formatLatency(result.latencies.p90)}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.6875rem', color: '#71717A', display: 'block' }}>P99</span>
                    <strong style={{ color: '#FFFFFF' }}>{formatLatency(result.latencies.p99)}</strong>
                  </div>
                </div>
              </div>

              <div className="assumptions-table-wrapper">
                <table className="assumptions-table text-mono" style={{ fontSize: '0.75rem' }}>
                  <thead>
                    <tr>
                      <th>Pipeline Stage</th>
                      <th>Type</th>
                      <th style={{ textAlign: 'right' }}>Base Latency</th>
                      <th style={{ textAlign: 'right' }}>Traffic Factor</th>
                      <th style={{ textAlign: 'right' }}>Effective Path</th>
                      <th>Architectural Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.latencies.criticalPathSegments && result.latencies.criticalPathSegments.length > 0 ? (
                      result.latencies.criticalPathSegments.map((seg, idx) => (
                        <tr key={`${seg.componentId}-${idx}`}>
                          <td style={{ fontWeight: 600, color: '#FFFFFF' }}>{seg.componentName}</td>
                          <td style={{ color: '#A1A1AA' }}>{seg.type}</td>
                          <td style={{ textAlign: 'right', color: '#A1A1AA' }}>{formatLatency(seg.baseLatencyMs)}</td>
                          <td style={{ textAlign: 'right', color: '#71717A' }}>{Math.round(seg.trafficFactor * 100)}%</td>
                          <td style={{ textAlign: 'right', color: '#FFFFFF', fontWeight: 600 }}>{formatLatency(seg.effectiveLatencyMs)}</td>
                          <td style={{ color: '#71717A', fontSize: '0.6875rem' }}>{seg.notes}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', color: '#71717A' }}>No critical path stages identified</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: '16px', padding: '12px', background: '#141417', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '0.6875rem', color: '#A1A1AA', lineHeight: 1.5 }}>
                <strong style={{ color: '#FFFFFF' }}>Model Transparency: </strong>
                {result.latencies.latencyDisclaimer || 'P95 is a model-derived estimate based on configured latency and saturation assumptions, not a measurement from production infrastructure.'}
              </div>
            </div>
            <div className="dialog-footer" style={{ justifyContent: 'flex-end' }}>
              <button onClick={() => setIsLatencyModalOpen(false)} className="btn btn-secondary btn-sm">Close</button>
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
          height: 100vh;
          max-height: 100vh;
          background: var(--color-bg);
          color: var(--color-text);
          display: flex;
          flex-direction: column;
          padding-top: var(--nav-height, 56px);
          box-sizing: border-box;
          overflow: hidden;
        }

        .simulator-header-bar {
          height: 50px;
          min-height: 50px;
          max-height: 50px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 var(--space-6);
          border-bottom: 1px solid var(--color-border);
          background: var(--color-bg-elevated);
          z-index: 30;
          flex-shrink: 0;
          box-sizing: border-box;
        }

        .simulator-header-left {
          display: flex;
          align-items: center;
          gap: var(--space-4);
        }

        .simulator-title-group {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .simulator-app-title {
          font-size: 0.9375rem;
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
          padding: 6px var(--space-6);
          font-size: 0.8125rem;
          font-family: var(--font-mono);
          z-index: 25;
          flex-shrink: 0;
        }

        .warning-icon {
          font-size: 1rem;
        }

        /* Section 21 & 22: Engineering Telemetry Strip */
        .simulator-telemetry-strip {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          background: #09090B;
          border-bottom: 1px solid var(--color-border);
          flex-shrink: 0;
          z-index: 20;
        }

        .telemetry-cell {
          padding: 8px 16px;
          border-right: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
          gap: 2px;
          background: #09090B;
          transition: background 0.15s ease;
        }

        .telemetry-cell:last-child {
          border-right: none;
        }

        .telemetry-cell--clickable {
          cursor: pointer;
        }

        .telemetry-cell--clickable:hover {
          background: #141417;
        }

        .telemetry-cell--clickable:focus-visible {
          outline: 1px solid #FFFFFF;
          outline-offset: -1px;
        }

        .telemetry-cell-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .telemetry-cell-label {
          font-family: var(--font-display);
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: #71717A;
        }

        .telemetry-mode-tag {
          font-size: 0.5625rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          padding: 1px 4px;
          border-radius: 2px;
        }

        .mode-live {
          color: #FAFAFA;
          background: #18181B;
          border: 1px solid #3F3F46;
        }

        .mode-calibrated {
          color: #09090B;
          background: #FAFAFA;
          font-weight: 800;
        }

        .mode-warning {
          color: #FAFAFA;
          background: #27272A;
          border: 1px solid #52525B;
        }

        .mode-neutral {
          color: #A1A1AA;
          background: #141417;
          border: 1px solid #27272A;
        }

        .telemetry-cell-value {
          font-family: var(--font-mono);
          font-size: 1.1875rem;
          font-weight: 700;
          color: #FFFFFF;
          display: flex;
          align-items: baseline;
          gap: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .telemetry-unit {
          font-size: 0.75rem;
          font-weight: 400;
          color: #71717A;
        }

        .telemetry-cell-subtext {
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          color: #A1A1AA;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Share Disclosure Box (Section 26) */
        .share-disclosure-box {
          background: #141417;
          border: 1px solid var(--color-border);
          border-radius: 4px;
          padding: 12px 14px;
        }

        .share-disclosure-title {
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: #FFFFFF;
          margin-bottom: 6px;
        }

        .share-disclosure-text {
          font-family: var(--font-ui);
          font-size: 0.75rem;
          color: #A1A1AA;
          margin-bottom: 8px;
          line-height: 1.4;
        }

        .share-disclosure-list {
          font-size: 0.6875rem;
          color: #D4D4D8;
          display: flex;
          flex-direction: column;
          gap: 3px;
          margin-bottom: 10px;
          list-style: none;
          padding: 0;
        }

        .share-disclosure-warning {
          font-family: var(--font-ui);
          font-size: 0.6875rem;
          color: #71717A;
          line-height: 1.4;
          border-top: 1px solid #27272A;
          padding-top: 8px;
          margin: 0;
        }

        /* 3-Column Work Area Grid: Left 330px, Canvas flex-1, Right 370px */
        .simulator-body-grid {
          display: grid;
          grid-template-columns: 330px minmax(0, 1fr) 370px;
          flex: 1;
          min-height: 0;
          height: 100%;
          overflow: hidden;
        }

        /* Sidebars: Independent Scroll Areas */
        .simulator-sidebar-left {
          width: 330px;
          height: 100%;
          border-right: 1px solid var(--color-border);
          background: var(--color-bg);
          padding: var(--space-3);
          overflow-y: auto;
          overflow-x: hidden;
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
          box-sizing: border-box;
        }

        .left-sidebar-tabs {
          display: flex;
          background: var(--color-bg-elevated);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          padding: 2px;
          gap: 2px;
          flex-shrink: 0;
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
          width: 370px;
          height: 100%;
          border-left: 1px solid var(--color-border);
          background: var(--color-bg);
          padding: var(--space-3);
          overflow-y: auto;
          overflow-x: hidden;
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
          box-sizing: border-box;
        }

        .sidebar-card {
          background: var(--color-bg-elevated);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          padding: var(--space-3);
          flex-shrink: 0;
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

        /* Palette list: Strict 3-column grid per card */
        .palette-components-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .palette-component-item {
          display: grid;
          grid-template-columns: 22px minmax(0, 1fr) auto;
          align-items: center;
          gap: 10px;
          min-height: 60px;
          padding: 10px 12px;
          background: var(--color-bg-surface);
          border: 1px solid var(--color-border-subtle);
          border-radius: var(--radius-sm);
          cursor: grab;
          transition: border-color 0.15s, background-color 0.15s;
          user-select: none;
          box-sizing: border-box;
        }

        .palette-component-item:hover {
          border-color: #FFFFFF;
          background: #18181B;
        }

        .palette-item-icon {
          font-size: 1rem;
          width: 22px;
          height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: var(--color-text-secondary);
        }

        .palette-item-info {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .palette-item-name {
          font-family: var(--font-ui);
          font-size: 0.8125rem;
          font-weight: 600;
          color: #FFFFFF;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.2;
        }

        .palette-item-desc {
          font-family: var(--font-ui);
          font-size: 0.6875rem;
          color: var(--color-text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.2;
        }

        .palette-item-badge {
          font-family: var(--font-mono);
          font-size: 0.5625rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          padding: 2px 6px;
          border-radius: 2px;
          border: 1px solid var(--color-border-strong);
          color: var(--color-text-secondary);
          background: #141417;
          white-space: nowrap;
          text-align: center;
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
          min-width: 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .canvas-wrapper-outer {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        /* Subsystem Inspection Grid */
        .inspection-matrix-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
        }

        .inspection-matrix-item {
          background: #18181B;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xs);
          padding: 6px 8px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .insp-lbl {
          font-size: 0.625rem;
          color: var(--color-text-muted);
          letter-spacing: 0.04em;
        }

        .insp-val {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--color-text);
          font-variant-numeric: tabular-nums;
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
          display: grid;
          grid-template-columns: 8px 1fr auto;
          align-items: center;
          gap: 8px;
          font-size: 0.75rem;
        }

        .legend-indicator {
          width: 8px;
          height: 8px;
          border-radius: 2px;
          flex-shrink: 0;
        }

        .legend-name {
          color: var(--color-text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .legend-amount {
          color: var(--color-text);
          font-weight: 600;
          font-family: var(--font-mono);
          font-variant-numeric: tabular-nums;
          text-align: right;
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
        @media (max-width: 1150px) {
          .simulator-body-grid {
            grid-template-columns: 290px minmax(0, 1fr) 320px;
          }
          .simulator-sidebar-left {
            width: 290px;
          }
          .simulator-sidebar-right {
            width: 320px;
          }
        }

        @media (max-width: 900px) {
          .simulator-v1-root {
            height: auto;
            max-height: none;
            overflow: auto;
          }
          .simulator-header-bar {
            height: auto;
            min-height: 48px;
            max-height: none;
            padding: 8px var(--space-4);
          }
          .simulator-body-grid {
            display: flex;
            flex-direction: column;
            overflow: visible;
            height: auto;
          }
          .simulator-sidebar-left,
          .simulator-sidebar-right {
            width: 100%;
            height: auto;
            max-height: none;
            border: none;
          }
          .simulator-canvas-center {
            min-height: 480px;
            height: 520px;
          }
        }
      `}</style>
    </div>
  );
}

// ── SSR Fallback Shell (eliminates unstyled text and ensures instant visual structure) ──
export function SimulatorFallbackShell() {
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
