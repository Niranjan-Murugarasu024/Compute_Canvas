'use client';

import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { motion, useInView } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  simulate,
  formatCurrency,
  formatLatency,
  formatNumber,
  type Workload,
  type Architecture,
  type SimulationResult,
  type CostBreakdown,
  TEMPLATES,
} from '@/lib/simulation/engine';
import { useArchitectureStore } from '@/lib/state/architectureStore';
import Link from 'next/link';

// ── Utility: Section wrapper with fade-in ──
function Section({ children, className = '', id = '' }: {
  children: React.ReactNode; className?: string; id?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.section
      ref={ref}
      id={id}
      className={`section ${className}`}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.section>
  );
}

// ──────────────────────────────────────────────
// SECTION: "EVERY AI REQUEST IS A SYSTEM"
// ──────────────────────────────────────────────

interface SubsystemDetail {
  id: string;
  tag: string;
  label: string;
  subsystemIndex: string;
  shortRole: string;
  unitCost: string;
  baselineLatency: string;
  impactPercent: number;
  flowSteps: string[];
  activeFlowIdx: number;
  diagnosticTitle: string;
  diagnosticDesc: string;
  diagnosticMitigation: string;
  tradeoffLabel: string;
  tradeoffRows: { condition: string; cost: string; latency: string; impact: string }[];
}

const SYSTEM_NODES: SubsystemDetail[] = [
  {
    id: 'api',
    tag: 'INGRESS',
    label: 'API Ingress Gateway',
    subsystemIndex: 'SUBSYSTEM // 01_INGRESS',
    shortRole: 'First operational boundary for inbound traffic. Enforces TLS termination, token bucket rate limits, and trace ID injection.',
    unitCost: '$1.00 / 1M REQ',
    baselineLatency: '+12 MS',
    impactPercent: 6,
    flowSteps: ['API INGRESS', 'SEMANTIC CACHE', 'COMPLEXITY ROUTER', 'FAST / FRONTIER'],
    activeFlowIdx: 0,
    diagnosticTitle: 'RATE LIMIT SATURATION & RETRY STORMS',
    diagnosticDesc: 'High client concurrency spikes can saturate edge rate-limit buckets (HTTP 429) or cause regional DNS latency delays.',
    diagnosticMitigation: 'Adaptive client backoff with full jitter, token bucket rate limits, and edge DNS anycast failover.',
    tradeoffLabel: 'INGRESS PROTOCOL COMPARISON',
    tradeoffRows: [
      { condition: 'Standard REST Request / Response', cost: '$1.00 / 1M req', latency: '12 ms', impact: 'Low overhead' },
      { condition: 'Server-Sent Events (SSE) Streaming', cost: '$1.50 / 1M req', latency: '18 ms', impact: 'High connection concurrency' },
    ],
  },
  {
    id: 'cache',
    tag: 'CACHE',
    label: 'Semantic Response & Prompt Cache',
    subsystemIndex: 'SUBSYSTEM // 02_CACHE',
    shortRole: 'Evaluates prompt text and embeddings against recent completions. Exact and cosine matches (>0.92) return in single-digit milliseconds.',
    unitCost: '$65.00 / MO',
    baselineLatency: '+5 MS',
    impactPercent: 78,
    flowSteps: ['API INGRESS', 'SEMANTIC CACHE', 'COMPLEXITY ROUTER', 'FAST / FRONTIER'],
    activeFlowIdx: 1,
    diagnosticTitle: 'CACHE STAMPEDE & STALE CONTEXT DRIFT',
    diagnosticDesc: 'Cold boots and sudden traffic spikes can stampede downstream models, while stale contexts risk outdated completions.',
    diagnosticMitigation: 'Probabilistic early expiration (XFetch algorithm) with strict cosine similarity (>0.92) thresholds.',
    tradeoffLabel: 'CACHE HIT RATE SENSITIVITY',
    tradeoffRows: [
      { condition: 'Semantic Cache Hit (70–80% Rate)', cost: '$0.00 / req', latency: '5 ms', impact: '98% latency reduction' },
      { condition: 'Semantic Cache Miss (Forward to LLM)', cost: '$0.0035 / req', latency: '382 ms', impact: 'Full LLM inference charge' },
    ],
  },
  {
    id: 'router',
    tag: 'ROUTER',
    label: 'Complexity Classifier & Router',
    subsystemIndex: 'SUBSYSTEM // 03_ROUTER',
    shortRole: 'Routes requests between fast and frontier inference tiers according to estimated reasoning complexity.',
    unitCost: '$0.50 / 1M REQ',
    baselineLatency: '+8 MS',
    impactPercent: 65,
    flowSteps: ['API INGRESS', 'SEMANTIC CACHE', 'COMPLEXITY ROUTER', 'FAST / FRONTIER'],
    activeFlowIdx: 2,
    diagnosticTitle: 'MISROUTING QUALITY RISK',
    diagnosticDesc: 'Complex requests routed to the fast tier can increase quality failures, user frustration, and re-prompts.',
    diagnosticMitigation: 'Confidence thresholds with automatic escalation rules to frontier models.',
    tradeoffLabel: 'ROUTING TRAFFIC DISTRIBUTION',
    tradeoffRows: [
      { condition: '80% Fast Model / 20% Frontier', cost: '$1,189 / mo', latency: '142 ms', impact: 'Optimal cost-performance frontier' },
      { condition: '100% Frontier Model (Direct Path)', cost: '$6,453 / mo', latency: '394 ms', impact: 'Highest quality, maximum spend' },
    ],
  },
  {
    id: 'vector',
    tag: 'RETRIEVAL',
    label: 'Vector Database & RAG Retrieval',
    subsystemIndex: 'SUBSYSTEM // 04_RETRIEVAL',
    shortRole: 'Performs approximate nearest-neighbor vector search over document chunks to inject relevant grounding context into prompt preambles.',
    unitCost: '$120.00 / MO',
    baselineLatency: '+45 MS',
    impactPercent: 15,
    flowSteps: ['API INGRESS', 'SEMANTIC CACHE', 'VECTOR DB', 'MODEL INFERENCE'],
    activeFlowIdx: 2,
    diagnosticTitle: 'CONTEXT WINDOW BLOAT & RETRIEVAL NOISE',
    diagnosticDesc: 'Excessive top-k retrieval chunks drive up prompt input token costs and increase tail latency across large vector indexes.',
    diagnosticMitigation: 'Hybrid lexical + dense search, semantic chunk deduplication, and cross-encoder reranker score filtering.',
    tradeoffLabel: 'RETRIEVAL DEPTH TRADEOFF',
    tradeoffRows: [
      { condition: 'Top-3 Chunks (1.2K Tokens Context)', cost: '+$0.0003 / req', latency: '45 ms', impact: 'Lean, low latency context' },
      { condition: 'Top-10 Chunks (4.0K Tokens Context)', cost: '+$0.0011 / req', latency: '82 ms', impact: 'Rich context, 3.7× input token cost' },
    ],
  },
  {
    id: 'fast',
    tag: 'FAST LLM',
    label: 'Fast Reasoning Model Tier',
    subsystemIndex: 'SUBSYSTEM // 05_FAST_LLM',
    shortRole: 'Sub-150ms execution tier for high concurrency and throughput. Ideal for classification, JSON extraction, and conversational dialogue.',
    unitCost: '$0.15 / 1M TOKENS',
    baselineLatency: '+120 MS',
    impactPercent: 25,
    flowSteps: ['API INGRESS', 'SEMANTIC CACHE', 'COMPLEXITY ROUTER', 'FAST MODEL'],
    activeFlowIdx: 3,
    diagnosticTitle: 'SYMBOLIC LOGIC & SYNTHESIS BOUNDARY',
    diagnosticDesc: 'Fast models experience degraded reasoning fidelity on complex symbolic logic, mathematical proofs, or multi-step tool loops.',
    diagnosticMitigation: 'Strict schema validation guards, system prompt constraints, and automated escalation to frontier models.',
    tradeoffLabel: 'SCALE TRAFFIC ECONOMICS',
    tradeoffRows: [
      { condition: '1.0 Million Monthly Requests', cost: '$180.00 / mo', latency: '120 ms', impact: 'Predictable high-scale operations' },
      { condition: '10.0 Million Monthly Requests', cost: '$1,800.00 / mo', latency: '124 ms', impact: 'Linear, manageable infra growth' },
    ],
  },
  {
    id: 'frontier',
    tag: 'FRONTIER',
    label: 'Frontier Reasoning & Synthesis Model',
    subsystemIndex: 'SUBSYSTEM // 06_FRONTIER',
    shortRole: 'State-of-the-art multi-step reasoning, mathematical proof, and code synthesis. Primary intelligence tier for high-complexity queries.',
    unitCost: '$2.50 / 1M TOKENS',
    baselineLatency: '+382 MS',
    impactPercent: 84,
    flowSteps: ['API INGRESS', 'SEMANTIC CACHE', 'COMPLEXITY ROUTER', 'FRONTIER MODEL'],
    activeFlowIdx: 3,
    diagnosticTitle: 'EXPONENTIAL SPEND & LATENCY BOTTLENECK',
    diagnosticDesc: 'Forms up to 84% of total system spend and the primary latency center during recursive or unconstrained agent execution loops.',
    diagnosticMitigation: 'Aggressive upstream semantic caching, max_tokens output clamps, and offloading 70%+ volume via Complexity Router.',
    tradeoffLabel: 'SYSTEM BOTTLENECK MITIGATION',
    tradeoffRows: [
      { condition: 'Un-architected (Direct Frontier LLM)', cost: '$6,097 / mo', latency: '382 ms', impact: 'Primary cost and latency bottleneck' },
      { condition: 'Architected (Ingress + Cache + Router)', cost: '$1,308 / mo', latency: '105 ms', impact: '78% spend savings, 3.6× faster P95' },
    ],
  },
];

export function EveryRequestSection() {
  const [selectedId, setSelectedId] = useState<string>('router');
  const [showTradeoffs, setShowTradeoffs] = useState<boolean>(false);
  const activeSubsystem = SYSTEM_NODES.find(n => n.id === selectedId) || SYSTEM_NODES[0];

  return (
    <Section id="every-request">
      <div className="container">
        <div className="section-header-block">
          <span className="section-label">[ARCHITECTURAL_DECOMPOSITION]</span>
          <h2 className="section-heading">Every AI request is a system.</h2>
          <p className="section-lead">
            What appears to be a single API call hides an entire multi-tier pipeline. Every layer introduces token spend, latency penalty, and operational failure modes. Select any subsystem to inspect its telemetry and economics.
          </p>
        </div>

        <div className="request-system">
          {/* Left Column: Chain of 6 Architectural Modules */}
          <div className="request-system__chain-col">
            <div className="chain-header">
              <span className="chain-title text-mono">REQUEST PIPELINE</span>
              <span className="chain-subtitle text-mono">6 COMPONENTS</span>
            </div>

            <div className="request-system__chain">
              {SYSTEM_NODES.map((node) => {
                const isSelected = selectedId === node.id;
                return (
                  <button
                    key={node.id}
                    type="button"
                    className={`request-system__node ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedId(node.id)}
                    aria-label={`Inspect ${node.label}`}
                  >
                    <div className="node-top-row">
                      <span className="node-tag text-mono">{node.tag}</span>
                      <span className="node-latency text-mono">{node.baselineLatency}</span>
                    </div>
                    <div className="node-main-row">
                      <span className="node-title">{node.label}</span>
                      {isSelected && <span className="node-active-arrow text-mono">&rarr;</span>}
                    </div>
                    <div className="node-meta-row text-mono">
                      <span className="node-cost">{node.unitCost.split('/')[0].trim()}</span>
                      <span className="node-share">{node.impactPercent}%</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Refined Two-Column Architectural Inspection Console */}
          <motion.div
            key={activeSubsystem.id}
            className="request-system__console"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
          >
            {/* Top Subsystem Breadcrumb & Status */}
            <div className="console-top-bar">
              <span className="console-breadcrumb text-mono">{activeSubsystem.subsystemIndex}</span>
              <div className="console-status text-mono">
                <span className="status-dot" />
                <span>DETERMINISTIC V1 SPEC</span>
              </div>
            </div>

            {/* Subsystem Name & Short Description (Max 2 lines) */}
            <div className="console-heading-block">
              <h3 className="subsystem-title">{activeSubsystem.label}</h3>
              <p className="subsystem-role">{activeSubsystem.shortRole}</p>
            </div>

            {/* Telemetry Metrics: Exactly 3 Equal-Width Cards */}
            <div className="console-metrics-grid">
              <div className="console-metric-cell">
                <span className="metric-cell-tag text-mono">UNIT COST</span>
                <span className="metric-cell-val text-mono">{activeSubsystem.unitCost}</span>
              </div>

              <div className="console-metric-cell">
                <span className="metric-cell-tag text-mono">LATENCY</span>
                <span className="metric-cell-val text-mono">{activeSubsystem.baselineLatency}</span>
              </div>

              <div className="console-metric-cell">
                <span className="metric-cell-tag text-mono">SYSTEM SHARE</span>
                <span className="metric-cell-val text-mono">{activeSubsystem.impactPercent}%</span>
              </div>
            </div>

            {/* Architecture Flow Strip */}
            <div className="console-flow-strip">
              <span className="flow-strip-label text-mono">ARCHITECTURE FLOW</span>
              <div className="flow-nodes-row">
                {activeSubsystem.flowSteps.map((step, idx) => {
                  const isCurrent = idx === activeSubsystem.activeFlowIdx;
                  return (
                    <div key={step} className="flow-step-item">
                      <span className={`flow-node-badge text-mono ${isCurrent ? 'active' : ''}`}>
                        {step}
                      </span>
                      {idx < activeSubsystem.flowSteps.length - 1 && (
                        <span className="flow-step-arrow text-mono">&rarr;</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Primary Diagnostic: One Compact Horizontal Panel */}
            <div className="console-diagnostic-panel">
              <div className="diagnostic-header-row">
                <span className="diagnostic-badge text-mono">PRIMARY DIAGNOSTIC</span>
                <span className="diagnostic-sep text-mono">//</span>
                <span className="diagnostic-subject text-mono">{activeSubsystem.diagnosticTitle}</span>
              </div>
              <p className="diagnostic-desc">
                {activeSubsystem.diagnosticDesc}
              </p>
              <div className="diagnostic-mitigation-row">
                <span className="mitigation-label text-mono">MITIGATION &rarr;</span>
                <span className="mitigation-text">{activeSubsystem.diagnosticMitigation}</span>
              </div>
            </div>

            {/* Collapsible Tradeoff Matrix (Data preserved, zero default clutter) */}
            <div className="console-tradeoff-drawer">
              <button
                type="button"
                className="tradeoff-toggle-btn text-mono"
                onClick={() => setShowTradeoffs(!showTradeoffs)}
                aria-expanded={showTradeoffs}
              >
                <span>{showTradeoffs ? '− HIDE EMPIRICAL TRADE-OFF DELTAS' : '+ VIEW EMPIRICAL TRADE-OFF DELTAS'}</span>
                <span className="tradeoff-toggle-count">({activeSubsystem.tradeoffRows.length} OPERATING STATES)</span>
              </button>

              {showTradeoffs && (
                <div className="tradeoff-table-wrap">
                  <table className="tradeoff-table text-mono">
                    <thead>
                      <tr>
                        <th>Operating State</th>
                        <th>Modeled Cost</th>
                        <th>Latency Impact</th>
                        <th>Architectural Consequence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeSubsystem.tradeoffRows.map((row, idx) => (
                        <tr key={idx}>
                          <td style={{ color: 'var(--color-text)', fontWeight: 500 }}>{row.condition}</td>
                          <td style={{ color: '#FFFFFF' }}>{row.cost}</td>
                          <td style={{ color: '#D4D4D8' }}>{row.latency}</td>
                          <td style={{ color: 'var(--color-text-secondary)' }}>{row.impact}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Single Primary Action Footer */}
            <div className="console-footer-bar">
              <Link href="/simulator" className="btn btn-primary btn-sm">
                OPEN IN WORKSTATION &rarr;
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      <style jsx>{`
        .request-system {
          display: grid;
          grid-template-columns: 310px minmax(0, 1fr);
          gap: 36px;
          align-items: stretch;
        }

        /* ── Left Column: Chain ── */
        .request-system__chain-col {
          background: var(--color-bg-elevated);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          padding: 24px 18px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .chain-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--color-border);
          min-height: 29px;
        }

        .chain-title {
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          font-weight: 500;
          color: #A1A1AA;
          letter-spacing: 0.08em;
        }

        .chain-subtitle {
          font-family: var(--font-mono);
          font-size: 0.625rem;
          color: #71717A;
          letter-spacing: 0.05em;
        }

        .request-system__chain {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
          justify-content: space-between;
        }

        .request-system__node {
          width: 100%;
          height: 98px;
          padding: 12px 14px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: var(--color-bg-surface);
          border: 1px solid #242428;
          border-radius: var(--radius-sm);
          cursor: pointer;
          text-align: left;
          transition: all var(--duration-fast) var(--ease-out);
        }

        .request-system__node:hover {
          border-color: var(--color-border-strong);
          background: #111114;
        }

        .request-system__node.selected {
          border-color: #F5F5F5;
          background: #141418;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
        }

        .node-top-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .node-tag {
          font-family: var(--font-mono);
          font-size: 0.625rem;
          color: #A1A1AA;
          letter-spacing: 0.08em;
        }

        .node-latency {
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          color: #D4D4D8;
          font-variant-numeric: tabular-nums;
        }

        .node-main-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          margin: 2px 0;
        }

        .node-title {
          font-family: var(--font-ui);
          font-size: 0.8125rem;
          font-weight: 600;
          color: #FFFFFF;
          line-height: 1.25;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .node-active-arrow {
          font-family: var(--font-mono);
          font-size: 0.8125rem;
          color: #FFFFFF;
          flex-shrink: 0;
        }

        .node-meta-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-family: var(--font-mono);
          font-size: 0.6875rem;
        }

        .node-cost {
          color: #A1A1AA;
        }

        .node-share {
          color: #D4D4D8;
          font-variant-numeric: tabular-nums;
        }

        /* ── Right Column: Architectural Inspection Console ── */
        .request-system__console {
          background: var(--color-bg-elevated);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          padding: 24px 28px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          justify-content: space-between;
        }

        .console-top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--color-border);
          min-height: 29px;
        }

        .console-breadcrumb {
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          letter-spacing: 0.08em;
          color: #A1A1AA;
        }

        .console-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          color: #71717A;
          letter-spacing: 0.06em;
        }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #FFFFFF;
        }

        .console-heading-block {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .subsystem-title {
          font-family: var(--font-display);
          font-size: clamp(1.5rem, 2vw, 1.875rem);
          font-weight: 600;
          letter-spacing: -0.02em;
          color: #FFFFFF;
          margin: 0;
          line-height: 1.15;
        }

        .subsystem-role {
          font-family: var(--font-ui);
          font-size: 0.9375rem;
          line-height: 1.5;
          color: var(--color-text-secondary);
          margin: 0;
          max-width: 760px;
        }

        /* ── Telemetry 3-Column Strip ── */
        .console-metrics-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }

        .console-metric-cell {
          background: var(--color-bg-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 6px;
          min-height: 76px;
        }

        .metric-cell-tag {
          font-family: var(--font-mono);
          font-size: 0.625rem;
          color: #71717A;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .metric-cell-val {
          font-family: var(--font-mono);
          font-size: 1.375rem;
          font-weight: 500;
          font-variant-numeric: tabular-nums;
          color: #FFFFFF;
          line-height: 1.1;
        }

        /* ── Architecture Flow ── */
        .console-flow-strip {
          background: var(--color-bg-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          padding: 14px 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .flow-strip-label {
          font-family: var(--font-mono);
          font-size: 0.625rem;
          color: #71717A;
          letter-spacing: 0.08em;
        }

        .flow-nodes-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .flow-step-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .flow-node-badge {
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          letter-spacing: 0.05em;
          padding: 4px 10px;
          border-radius: 2px;
          border: 1px solid var(--color-border-subtle);
          color: #A1A1AA;
          background: transparent;
        }

        .flow-node-badge.active {
          border-color: #FFFFFF;
          background: #18181B;
          color: #FFFFFF;
          font-weight: 600;
        }

        .flow-step-arrow {
          font-family: var(--font-mono);
          font-size: 0.8125rem;
          color: var(--color-border-strong);
        }

        /* ── Primary Diagnostic Panel ── */
        .console-diagnostic-panel {
          background: var(--color-bg-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          padding: 14px 18px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .diagnostic-header-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .diagnostic-badge {
          font-family: var(--font-mono);
          font-size: 0.625rem;
          letter-spacing: 0.08em;
          color: #71717A;
        }

        .diagnostic-sep {
          font-family: var(--font-mono);
          font-size: 0.625rem;
          color: #3F3F46;
        }

        .diagnostic-subject {
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          color: #FFFFFF;
        }

        .diagnostic-desc {
          font-family: var(--font-ui);
          font-size: 0.8125rem;
          line-height: 1.45;
          color: var(--color-text-secondary);
          margin: 0;
        }

        .diagnostic-mitigation-row {
          display: flex;
          align-items: baseline;
          gap: 8px;
          padding-top: 6px;
          border-top: 1px solid var(--color-border-subtle);
        }

        .mitigation-label {
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          font-weight: 600;
          color: #A1A1AA;
          flex-shrink: 0;
        }

        .mitigation-text {
          font-family: var(--font-ui);
          font-size: 0.8125rem;
          line-height: 1.4;
          color: #D4D4D8;
        }

        /* ── Collapsible Tradeoff Drawer ── */
        .console-tradeoff-drawer {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .tradeoff-toggle-btn {
          align-self: flex-start;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          padding: 6px 12px;
          color: #A1A1AA;
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          cursor: pointer;
          transition: all var(--duration-fast);
        }

        .tradeoff-toggle-btn:hover {
          border-color: var(--color-border-strong);
          color: #FFFFFF;
        }

        .tradeoff-toggle-count {
          color: #71717A;
          font-size: 0.625rem;
        }

        .tradeoff-table-wrap {
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          overflow: hidden;
          background: var(--color-bg-surface);
        }

        .tradeoff-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.75rem;
        }

        .tradeoff-table th,
        .tradeoff-table td {
          padding: 8px 12px;
          text-align: left;
          border-bottom: 1px solid var(--color-border-subtle);
        }

        .tradeoff-table th {
          background: var(--color-bg);
          color: var(--color-text-muted);
          font-size: 0.625rem;
          font-weight: 500;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .tradeoff-table tr:last-child td {
          border-bottom: none;
        }

        /* ── Single Primary CTA Footer ── */
        .console-footer-bar {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          padding-top: 14px;
          border-top: 1px solid var(--color-border);
        }

        /* ── Responsive ── */
        @media (max-width: 960px) {
          .request-system {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .request-system__chain-col {
            padding: 18px 16px;
          }

          .request-system__chain {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
          }

          .request-system__node {
            height: auto;
            min-height: 84px;
            padding: 10px 12px;
          }

          .console-metrics-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 640px) {
          .request-system__chain {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 6px;
          }

          .request-system__node {
            min-height: 72px;
            padding: 8px 10px;
          }

          .node-title {
            font-size: 0.75rem;
          }

          .console-metrics-grid {
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .diagnostic-mitigation-row {
            flex-direction: column;
            gap: 2px;
          }

          .console-footer-bar {
            justify-content: stretch;
          }

          .console-footer-bar :global(.btn) {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </Section>
  );
}

// ──────────────────────────────────────────────
// SECTION: "COST IS NOT JUST MODEL PRICING" (Interactive Data Instrument)
// ──────────────────────────────────────────────

export function CostDecompositionSection() {
  const router = useRouter();
  const { loadArchitecture } = useArchitectureStore();

  const [monthlyRequests, setMonthlyRequests] = useState(2_000_000);
  const [cacheHitRate, setCacheHitRate] = useState(0.35);
  const [avgInputTokens, setAvgInputTokens] = useState(1500);
  const [modelChoice, setModelChoice] = useState('gpt-4o');

  const arch: Architecture = useMemo(() => ({
    nodes: [
      { id: 'api', type: 'api', label: 'API Ingress' },
      { id: 'cache', type: 'cache', label: 'Semantic Cache' },
      { id: 'router', type: 'router', label: 'Complexity Router' },
      { id: 'model-1', type: 'frontier-model', label: modelChoice === 'gpt-4o' ? 'GPT-4o' : modelChoice === 'claude-3.5-sonnet' ? 'Claude 3.5 Sonnet' : 'Gemini 2.0 Flash', modelId: modelChoice },
      { id: 'vectordb', type: 'vectordb', label: 'Vector DB' },
    ],
    edges: [
      { source: 'api', target: 'cache' },
      { source: 'cache', target: 'router' },
      { source: 'router', target: 'model-1', trafficShare: 0.8 },
      { source: 'router', target: 'vectordb', trafficShare: 0.2 },
      { source: 'vectordb', target: 'model-1' },
    ],
  }), [modelChoice]);

  const workload: Workload = useMemo(() => ({
    requestsPerMonth: monthlyRequests,
    avgInputTokens,
    avgOutputTokens: 400,
    concurrency: 60,
    cacheHitRate,
    retrievalsPerRequest: 2,
    toolCallsPerRequest: 1,
  }), [monthlyRequests, avgInputTokens, cacheHitRate]);

  const result = useMemo(() => simulate(workload, arch), [workload, arch]);

  // Comparison with 0% cache to illustrate savings
  const noCacheResult = useMemo(() => simulate({ ...workload, cacheHitRate: 0 }, arch), [workload, arch]);
  const monthlySavings = Math.max(0, noCacheResult.monthlyCost - result.monthlyCost);

  const breakdown: { label: string; key: keyof CostBreakdown; color: string }[] = [
    { label: 'Model Inference', key: 'model', color: '#FFFFFF' },
    { label: 'Vector Database', key: 'vectorDb', color: '#D4D4D8' },
    { label: 'Semantic Cache', key: 'cache', color: '#A1A1AA' },
    { label: 'API Ingress Gateway', key: 'network', color: '#71717A' },
  ];

  const maxVal = Math.max(...breakdown.map(b => (result.costBreakdown[b.key] as number) || 1));

  const handleOpenSimulator = () => {
    loadArchitecture(arch, workload);
    router.push('/simulator');
  };

  return (
    <Section id="cost-decomposition">
      <div className="container">
        <div className="section-header-block">
          <span className="section-label">[ECONOMIC_DECOMPOSITION]</span>
          <h2 className="section-heading">Cost is not just model pricing.</h2>
          <p className="section-lead">
            Every layer of your architecture contributes to total monthly spend. Adjust workload parameters to see how traffic scale and cache hit rate reshape the economic profile.
          </p>
        </div>

        <div className="cost-instrument">
          {/* Controls Panel */}
          <div className="cost-instrument__controls">
            <span className="text-technical-label" style={{ marginBottom: 'var(--space-2)', display: 'block' }}>
              TUNING PARAMETERS
            </span>

            <div className="control-group">
              <div className="control-header">
                <label className="text-caption">Workload Volume</label>
                <span className="text-mono" style={{ fontSize: '0.8125rem' }}>{formatNumber(monthlyRequests)} REQ / MO</span>
              </div>
              <input
                type="range"
                min={200000}
                max={10000000}
                step={200000}
                value={monthlyRequests}
                onChange={e => setMonthlyRequests(Number(e.target.value))}
                className="slider"
              />
              <div className="slider-markers text-mono">
                <span>200K</span>
                <span>2M</span>
                <span>5M</span>
                <span>10M</span>
              </div>
            </div>

            <div className="control-group">
              <div className="control-header">
                <label className="text-caption">Semantic Cache Hit Rate</label>
                <span className="text-mono" style={{ fontSize: '0.8125rem', color: '#FFFFFF' }}>
                  {Math.round(cacheHitRate * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={80}
                step={5}
                value={Math.round(cacheHitRate * 100)}
                onChange={e => setCacheHitRate(Number(e.target.value) / 100)}
                className="slider"
              />
              <div className="slider-markers text-mono">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>80%</span>
              </div>
            </div>

            <div className="control-group">
              <div className="control-header">
                <label className="text-caption">Avg Input Tokens</label>
                <span className="text-mono" style={{ fontSize: '0.8125rem' }}>{avgInputTokens} tokens</span>
              </div>
              <input
                type="range"
                min={500}
                max={4000}
                step={250}
                value={avgInputTokens}
                onChange={e => setAvgInputTokens(Number(e.target.value))}
                className="slider"
              />
            </div>

            <div className="control-group">
              <label className="text-caption" style={{ marginBottom: '6px', display: 'block' }}>Primary Inference Model</label>
              <select
                className="select-input"
                value={modelChoice}
                onChange={e => setModelChoice(e.target.value)}
              >
                <option value="gpt-4o">OpenAI GPT-4o (Frontier)</option>
                <option value="claude-3.5-sonnet">Anthropic Claude 3.5 Sonnet</option>
                <option value="gemini-2.0-flash">Google Gemini 2.0 Flash (Fast &amp; Cheap)</option>
                <option value="gpt-4o-mini">OpenAI GPT-4o-mini</option>
              </select>
            </div>

            <button onClick={handleOpenSimulator} className="btn btn-primary" style={{ marginTop: 'var(--space-4)', width: '100%' }}>
              LOAD IN SPATIAL SIMULATOR &rarr;
            </button>
          </div>

          {/* Visualization Panel */}
          <div className="cost-instrument__bars">
            <div className="cost-summary-header">
              <div>
                <span className="text-technical-label">ESTIMATED MONTHLY SPEND</span>
                <p className="text-mono cost-total-number" style={{ color: '#FFFFFF' }}>
                  {formatCurrency(result.costBreakdown.total)}
                </p>
                <span className="text-caption text-mono" style={{ color: 'var(--color-text-muted)' }}>
                  ${(result.costPerRequest * 1000).toFixed(3)} USD per 1,000 requests
                </span>
              </div>

              {monthlySavings > 0 && (
                <div className="savings-badge">
                  <span className="text-caption text-mono" style={{ color: '#FFFFFF', fontWeight: 600 }}>
                    Δ -{formatCurrency(monthlySavings)} / MO
                  </span>
                  <span className="text-caption text-mono" style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)' }}>
                    AT {Math.round(cacheHitRate * 100)}% CACHE HIT RATE
                  </span>
                </div>
              )}
            </div>

            <div className="breakdown-track-list">
              {breakdown.map(b => {
                const val = (result.costBreakdown[b.key] as number) || 0;
                if (val <= 0) return null;
                const pctOfTotal = Math.round((val / result.costBreakdown.total) * 100);
                const pctWidth = Math.max(4, Math.round((val / maxVal) * 100));

                return (
                  <div key={b.key} className="breakdown-track-item">
                    <div className="track-label-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="track-dot" style={{ background: b.color }} />
                        <span style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-ui)', fontWeight: 500 }}>{b.label}</span>
                        <span className="text-caption text-mono" style={{ opacity: 0.6 }}>({pctOfTotal}%)</span>
                      </div>
                      <span className="text-mono" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                        {formatCurrency(val)}
                      </span>
                    </div>

                    <div className="bar-track">
                      <motion.div
                        className="bar-fill"
                        style={{ background: b.color }}
                        initial={false}
                        animate={{ width: `${pctWidth}%` }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="cost-causality-callout">
              <span className="text-mono" style={{ color: 'var(--color-text-muted)', marginRight: '6px' }}>[INFO]</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                Model inference accounts for {Math.round((result.costBreakdown.model / result.costBreakdown.total) * 100)}% of spend. Caching eliminates {formatCurrency(monthlySavings)}/mo before requests reach frontier inference.
              </span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .cost-instrument {
          display: grid;
          grid-template-columns: 340px 1fr;
          gap: 32px;
          background: #101012;
          border: 1px solid var(--color-border);
          border-radius: 4px;
          padding: 28px;
        }
        .cost-instrument__controls {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding-right: 28px;
          border-right: 1px solid var(--color-border);
        }
        .control-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .control-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .slider-markers {
          display: flex;
          justify-content: space-between;
          font-family: var(--font-mono);
          font-size: 0.625rem;
          color: #71717A;
          letter-spacing: 0.04em;
        }
        .select-input {
          padding: 8px 10px;
          background: #141418;
          border: 1px solid var(--color-border);
          border-radius: 3px;
          color: #FFFFFF;
          font-family: var(--font-mono);
          font-size: 0.75rem;
          outline: none;
        }
        .select-input:focus {
          border-color: #A1A1AA;
        }
        .cost-instrument__bars {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .cost-summary-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-bottom: 18px;
          border-bottom: 1px solid var(--color-border);
        }
        .cost-total-number {
          font-family: var(--font-mono);
          font-size: 2.25rem;
          font-weight: 500;
          line-height: 1.05;
          margin-top: 6px;
          letter-spacing: -0.02em;
          font-variant-numeric: tabular-nums;
        }
        .savings-badge {
          background: #141418;
          border: 1px solid var(--color-border);
          border-radius: 3px;
          padding: 8px 14px;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
        }
        .breakdown-track-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .breakdown-track-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .track-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .track-dot {
          width: 5px;
          height: 5px;
          border-radius: 1px;
        }
        .bar-track {
          height: 4px;
          background: #18181B;
          border-radius: 1px;
          overflow: hidden;
        }
        .bar-fill {
          height: 100%;
          border-radius: 1px;
        }
        .cost-causality-callout {
          background: #141418;
          border: 1px solid var(--color-border);
          padding: 12px 16px;
          border-radius: 3px;
          display: flex;
          align-items: baseline;
          gap: 8px;
        }
        @media (max-width: 900px) {
          .cost-instrument {
            grid-template-columns: 1fr;
            padding: 20px;
          }
          .cost-instrument__controls {
            padding-right: 0;
            border-right: none;
            border-bottom: 1px solid var(--color-border);
            padding-bottom: 24px;
          }
        }
      `}</style>
    </Section>
  );
}

// ──────────────────────────────────────────────
// SECTION: "SCALE CHANGES THE ARCHITECTURE" (Living System Visualization)
// ──────────────────────────────────────────────

interface ScaleTier {
  trafficLabel: string;
  trafficVal: number;
  label: string;
  description: string;
  templateId: string;
  architecture: Architecture;
  workload: Workload;
  bottleneck: string;
}

const SCALE_TIERS: ScaleTier[] = [
  {
    trafficLabel: '100K',
    trafficVal: 100_000,
    label: 'Prototype',
    description: 'Direct model calling. Inexpensive at low volume, but completely unbuffered against latency spikes.',
    templateId: 'minimal',
    architecture: {
      nodes: [
        { id: 'api', type: 'api', label: 'API Gateway', x: 80, y: 80 },
        { id: 'model', type: 'model', label: 'GPT-4o-mini', modelId: 'gpt-4o-mini', x: 280, y: 80 },
      ],
      edges: [{ source: 'api', target: 'model' }],
    },
    workload: {
      requestsPerMonth: 100_000,
      avgInputTokens: 1000,
      avgOutputTokens: 300,
      concurrency: 5,
      cacheHitRate: 0,
      retrievalsPerRequest: 0,
      toolCallsPerRequest: 0,
    },
    bottleneck: 'Single point of failure; zero caching; unhedged rate-limits.',
  },
  {
    trafficLabel: '1M',
    trafficVal: 1_000_000,
    label: 'Production RAG',
    description: 'Adding a semantic prompt cache stops duplicate queries. Vector retrieval grounds domain context.',
    templateId: 'rag',
    architecture: {
      nodes: [
        { id: 'api', type: 'api', label: 'API Gateway', x: 80, y: 80 },
        { id: 'cache', type: 'cache', label: 'Semantic Cache (Redis)', x: 240, y: 80 },
        { id: 'vectordb', type: 'vectordb', label: 'Pinecone Vector DB', x: 420, y: 80 },
        { id: 'model', type: 'model', label: 'GPT-4o', modelId: 'gpt-4o', x: 600, y: 80 },
      ],
      edges: [
        { source: 'api', target: 'cache' },
        { source: 'cache', target: 'vectordb' },
        { source: 'vectordb', target: 'model' },
      ],
    },
    workload: {
      requestsPerMonth: 1_000_000,
      avgInputTokens: 1500,
      avgOutputTokens: 400,
      concurrency: 30,
      cacheHitRate: 0.35,
      retrievalsPerRequest: 2,
      toolCallsPerRequest: 0,
    },
    bottleneck: 'Vector DB query latency begins dominating P95 response times.',
  },
  {
    trafficLabel: '10M',
    trafficVal: 10_000_000,
    label: 'Intelligent Routing',
    description: 'Complexity classifier directs 70% of volume to low-latency models and 30% to high-reasoning engines.',
    templateId: 'customer-support',
    architecture: {
      nodes: [
        { id: 'api', type: 'api', label: 'API Gateway', x: 60, y: 90 },
        { id: 'cache', type: 'cache', label: 'Prompt Cache', x: 200, y: 90 },
        { id: 'router', type: 'router', label: 'Classifier Router', x: 340, y: 90 },
        { id: 'm-fast', type: 'model', label: 'Flash 2.0 (70%)', modelId: 'gemini-2.0-flash', x: 500, y: 45 },
        { id: 'm-deep', type: 'model', label: 'Claude 3.5 (30%)', modelId: 'claude-3.5-sonnet', x: 500, y: 135 },
        { id: 'vectordb', type: 'vectordb', label: 'Vector Cluster', x: 660, y: 90 },
      ],
      edges: [
        { source: 'api', target: 'cache' },
        { source: 'cache', target: 'router' },
        { source: 'router', target: 'm-fast', trafficShare: 0.7 },
        { source: 'router', target: 'm-deep', trafficShare: 0.3 },
        { source: 'm-fast', target: 'vectordb' },
        { source: 'm-deep', target: 'vectordb' },
      ],
    },
    workload: {
      requestsPerMonth: 10_000_000,
      avgInputTokens: 1200,
      avgOutputTokens: 400,
      concurrency: 180,
      cacheHitRate: 0.45,
      retrievalsPerRequest: 1,
      toolCallsPerRequest: 1,
    },
    bottleneck: 'Cross-provider rate limits require failover queues and retry buffers.',
  },
  {
    trafficLabel: '50M',
    trafficVal: 50_000_000,
    label: 'High-Volume Router',
    description: 'Tiered semantic cache and dynamic complexity routing directing 85% of queries to fast model inference.',
    templateId: 'router-cache',
    architecture: {
      nodes: [
        { id: 'api', type: 'api', label: 'API Ingress', x: 80, y: 80 },
        { id: 'cache', type: 'cache', label: 'Semantic Cache', x: 220, y: 80 },
        { id: 'router', type: 'router', label: 'Complexity Router', x: 380, y: 80 },
        { id: 'm-fast', type: 'fast-model', label: 'Fast Model (85%)', modelId: 'gemini-2.0-flash', x: 540, y: 45 },
        { id: 'm-deep', type: 'frontier-model', label: 'Frontier (15%)', modelId: 'gpt-4o', x: 540, y: 115 },
      ],
      edges: [
        { source: 'api', target: 'cache' },
        { source: 'cache', target: 'router' },
        { source: 'router', target: 'm-fast', trafficShare: 0.85 },
        { source: 'router', target: 'm-deep', trafficShare: 0.15 },
      ],
    },
    workload: {
      requestsPerMonth: 50_000_000,
      avgInputTokens: 1000,
      avgOutputTokens: 300,
      concurrency: 400,
      cacheHitRate: 0.65,
      retrievalsPerRequest: 0,
      toolCallsPerRequest: 0,
    },
    bottleneck: 'Frontier reasoning tier capacity during burst complexity traffic.',
  },
];

export function ScaleSection() {
  const router = useRouter();
  const { loadArchitecture } = useArchitectureStore();
  const [activeStep, setActiveStep] = useState(1);

  const tier = SCALE_TIERS[activeStep];
  const sim = useMemo(() => simulate(tier.workload, tier.architecture), [tier]);

  const handleOpenScale = () => {
    loadArchitecture(tier.architecture, tier.workload);
    router.push('/simulator');
  };

  return (
    <Section id="scale">
      <div className="container">
        <div className="section-header-block">
          <span className="section-label">[SCALE_TRANSITIONS]</span>
          <h2 className="section-heading">Scale changes the architecture.</h2>
          <p className="section-lead">
            What functions at 100K requests breaks at 10M. Watch components emerge, routing bifurcate, and economics shift across four orders of magnitude.
          </p>
        </div>

        <div className="scale-living">
          {/* Tab Strip */}
          <div className="scale-living__tabs" role="tablist">
            {SCALE_TIERS.map((t, idx) => (
              <button
                key={t.trafficLabel}
                className={`scale-living__tab ${activeStep === idx ? 'active' : ''}`}
                onClick={() => setActiveStep(idx)}
                role="tab"
                aria-selected={activeStep === idx}
              >
                <span className="scale-tab-value text-mono">
                  {t.trafficLabel}
                </span>
                <span className="scale-tab-label">
                  {t.label.toUpperCase()}
                </span>
              </button>
            ))}
          </div>

          {/* Interactive Topology Display */}
          <div className="scale-living__content">
            <div className="scale-living__topology">
              <div className="topology-header">
                <span className="text-technical-label">
                  TOPOLOGY // {tier.architecture.nodes.length} COMPONENTS // {tier.architecture.edges.length} WIRES
                </span>
                <span className="badge badge--neutral text-mono" style={{ fontSize: '0.6875rem' }}>
                  {tier.trafficLabel} REQ / MO
                </span>
              </div>

              {/* Animated Mini SVG Graph */}
              <div className="topology-svg-wrap">
                <svg width="100%" height="160" viewBox="0 0 780 160">
                  {/* Edges */}
                  {tier.architecture.edges.map((e, i) => {
                    const from = tier.architecture.nodes.find(n => n.id === e.source);
                    const to = tier.architecture.nodes.find(n => n.id === e.target);
                    if (!from || !to) return null;
                    const fx = from.x || 100;
                    const fy = from.y || 80;
                    const tx = to.x || 200;
                    const ty = to.y || 80;

                    return (
                      <g key={i}>
                        <line
                          x1={fx + 40} y1={fy}
                          x2={tx - 40} y2={ty}
                          stroke="#3F3F46"
                          strokeWidth="1.5"
                          strokeDasharray="4 4"
                        />
                        <circle r="2.5" fill="#FFFFFF">
                          <animateMotion
                            dur="2s"
                            repeatCount="indefinite"
                            path={`M${fx + 40},${fy} L${tx - 40},${ty}`}
                          />
                        </circle>
                      </g>
                    );
                  })}

                  {/* Nodes */}
                  {tier.architecture.nodes.map(n => {
                    const nx = n.x || 100;
                    const ny = n.y || 80;
                    const isModel = n.type === 'model' || n.type === 'frontier-model' || n.type === 'fast-model';
                    const stroke = isModel ? '#FFFFFF' : '#3F3F46';

                    return (
                      <g key={n.id}>
                        <rect
                          x={nx - 45}
                          y={ny - 16}
                          width={90}
                          height={32}
                          rx={2}
                          fill="#18181B"
                          stroke={stroke}
                          strokeWidth="1"
                        />
                        <text
                          x={nx}
                          y={ny + 4}
                          textAnchor="middle"
                          fill="#F4F4F5"
                          fontSize="9"
                          fontFamily="var(--font-ui)"
                          fontWeight="500"
                        >
                          {n.label.slice(0, 14)}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: 'var(--space-3)', lineHeight: 1.5, fontFamily: 'var(--font-ui)' }}>
                {tier.description}
              </p>

              <div className="bottleneck-strip">
                <span className="text-caption text-mono" style={{ color: '#FFFFFF', fontWeight: 600 }}>
                  BOTTLENECK AT SCALE:
                </span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-ui)' }}>
                  {tier.bottleneck}
                </span>
              </div>
            </div>

            {/* Metrics Sidebar */}
            <div className="scale-living__metrics">
              <div className="scale-metric-box">
                <span className="text-caption text-mono" style={{ color: 'var(--color-text-muted)' }}>EST. MONTHLY SPEND</span>
                <span className="text-mono scale-metric-val" style={{ color: '#FFFFFF' }}>
                  {formatCurrency(sim.monthlyCost)}
                </span>
                <span className="text-caption text-mono" style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                  ${(sim.costPerRequest * 1000).toFixed(3)} USD / 1K REQ
                </span>
              </div>

              <div className="scale-metric-box">
                <span className="text-caption text-mono" style={{ color: 'var(--color-text-muted)' }}>EST. P95 LATENCY</span>
                <span className="text-mono scale-metric-val" style={{ color: '#D4D4D8' }}>
                  {formatLatency(sim.p95Latency)}
                </span>
                <span className="text-caption text-mono" style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                  THROUGHPUT: {sim.throughputRPS} RPS
                </span>
              </div>

              <div className="scale-metric-box">
                <span className="text-caption text-mono" style={{ color: 'var(--color-text-muted)' }}>CAPACITY UTILIZATION</span>
                <span className="text-mono scale-metric-val" style={{ color: '#A1A1AA' }}>
                  {sim.capacityUtilization.toFixed(0)}%
                </span>
                <span className="text-caption text-mono" style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                  CONCURRENCY: {tier.workload.concurrency}
                </span>
              </div>

              <button onClick={handleOpenScale} className="btn btn-secondary" style={{ width: '100%', marginTop: 'auto' }}>
                OPEN IN SIMULATOR &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .scale-living {
          background: #101012;
          border: 1px solid var(--color-border);
          border-radius: 4px;
          overflow: hidden;
        }
        .scale-living__tabs {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          background: var(--color-border);
          gap: 1px;
        }
        .scale-living__tab {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 18px 12px;
          background: #141418;
          border: none;
          cursor: pointer;
          transition: all 150ms ease;
        }
        .scale-living__tab:hover {
          background: #18181D;
        }
        .scale-living__tab.active {
          background: #101012;
          box-shadow: inset 0 -2px 0 #FFFFFF;
        }
        .scale-tab-value {
          font-family: var(--font-mono);
          font-size: 1.5rem;
          font-weight: 500;
          color: #FFFFFF;
          font-variant-numeric: tabular-nums;
        }
        .scale-tab-label {
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          letter-spacing: 0.08em;
          color: #A1A1AA;
        }
        .scale-living__content {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 28px;
          padding: 24px;
        }
        .scale-living__topology {
          display: flex;
          flex-direction: column;
        }
        .topology-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
        }
        .topology-svg-wrap {
          background: #09090B;
          border: 1px solid var(--color-border);
          border-radius: 3px;
          overflow: hidden;
        }
        .bottleneck-strip {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #141418;
          border: 1px solid var(--color-border);
          padding: 10px 14px;
          border-radius: 3px;
          margin-top: 16px;
        }
        .scale-living__metrics {
          display: flex;
          flex-direction: column;
          gap: 14px;
          border-left: 1px solid var(--color-border);
          padding-left: 24px;
        }
        .scale-metric-box {
          background: #09090B;
          border: 1px solid var(--color-border);
          border-radius: 3px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .scale-metric-val {
          font-family: var(--font-mono);
          font-size: 1.375rem;
          font-weight: 500;
          font-variant-numeric: tabular-nums;
        }
        @media (max-width: 860px) {
          .scale-living__content {
            grid-template-columns: 1fr;
            gap: 20px;
            padding: 18px;
          }
          .scale-living__metrics {
            border-left: none;
            border-top: 1px solid var(--color-border);
            padding-left: 0;
            padding-top: 18px;
          }
        }
          }
          .scale-living__metrics {
            border-left: none;
            padding-left: 0;
            border-top: 1px solid var(--color-border);
            padding-top: var(--space-4);
          }
        }
      `}</style>
    </Section>
  );
}

// ──────────────────────────────────────────────
// SECTION: "WHAT WOULD YOU BUILD?" (Architectural Trade-offs)
// ──────────────────────────────────────────────

interface ObjectiveItem {
  id: string;
  label: string;
  icon: string;
  description: string;
  model: string;
  cache: number;
  tradeoffNote: string;
  architecture: Architecture;
}

const OBJECTIVES: ObjectiveItem[] = [
  {
    id: 'cost',
    label: 'COST OPTIMIZED',
    icon: '◈',
    description: 'Aggressive 65% semantic caching paired with Gemini 2.0 Flash for lowest cost per inference.',
    model: 'gemini-2.0-flash',
    cache: 0.65,
    tradeoffNote: 'Trades slight reasoning depth on edge-cases for a 75% reduction in total infrastructure bill.',
    architecture: {
      nodes: [
        { id: 'api', type: 'api', label: 'API Gateway' },
        { id: 'cache', type: 'cache', label: 'Aggressive Prompt Cache' },
        { id: 'model', type: 'model', label: 'Gemini 2.0 Flash', modelId: 'gemini-2.0-flash' },
      ],
      edges: [
        { source: 'api', target: 'cache' },
        { source: 'cache', target: 'model' },
      ],
    },
  },
  {
    id: 'latency',
    label: 'SUB-SECOND LATENCY',
    icon: '⚡',
    description: 'Pre-warmed inference endpoints, Redis vector caching, and compact model context.',
    model: 'gemini-2.0-flash',
    cache: 0.45,
    tradeoffNote: 'Sacrifices long context retrieval to maintain P95 latency strictly under 280ms.',
    architecture: {
      nodes: [
        { id: 'api', type: 'api', label: 'API Ingress' },
        { id: 'cache', type: 'cache', label: 'Memory Cache Tier' },
        { id: 'model', type: 'model', label: 'Gemini 2.0 Flash', modelId: 'gemini-2.0-flash' },
      ],
      edges: [
        { source: 'api', target: 'cache' },
        { source: 'cache', target: 'model' },
      ],
    },
  },
  {
    id: 'quality',
    label: 'MAXIMUM QUALITY',
    icon: '◉',
    description: 'Claude 3.5 Sonnet frontier reasoning with multi-step vector retrieval and reranking.',
    model: 'claude-3.5-sonnet',
    cache: 0.20,
    tradeoffNote: 'Prioritizes reasoning precision; higher token cost and longer inference generation times.',
    architecture: {
      nodes: [
        { id: 'api', type: 'api', label: 'API Ingress' },
        { id: 'vectordb', type: 'vectordb', label: 'Vector Database' },
        { id: 'model', type: 'frontier-model', label: 'Claude 3.5 Sonnet', modelId: 'claude-3.5-sonnet' },
      ],
      edges: [
        { source: 'api', target: 'vectordb' },
        { source: 'vectordb', target: 'model' },
      ],
    },
  },
  {
    id: 'scale',
    label: 'HIGH THROUGHPUT',
    icon: '⬡',
    description: 'Tiered cache and complexity routing steering 85% of traffic to fast model inference.',
    model: 'gpt-4o-mini',
    cache: 0.50,
    tradeoffNote: 'Optimized for high concurrency and steady availability under sustained burst traffic.',
    architecture: {
      nodes: [
        { id: 'api', type: 'api', label: 'API Ingress' },
        { id: 'cache', type: 'cache', label: 'Semantic Cache' },
        { id: 'router', type: 'router', label: 'Complexity Router' },
        { id: 'm-fast', type: 'fast-model', label: 'Fast Model (85%)', modelId: 'gpt-4o-mini' },
        { id: 'm-deep', type: 'frontier-model', label: 'Frontier (15%)', modelId: 'gpt-4o' },
      ],
      edges: [
        { source: 'api', target: 'cache' },
        { source: 'cache', target: 'router' },
        { source: 'router', target: 'm-fast', trafficShare: 0.85 },
        { source: 'router', target: 'm-deep', trafficShare: 0.15 },
      ],
    },
  },
  {
    id: 'balance',
    label: 'BALANCED SYSTEM',
    icon: '◎',
    description: 'GPT-4o with complexity routing and standard vector search for enterprise production.',
    model: 'gpt-4o',
    cache: 0.35,
    tradeoffNote: 'Evenly distributes spend and latency; solid baseline for general application workloads.',
    architecture: {
      nodes: [
        { id: 'api', type: 'api', label: 'API Ingress' },
        { id: 'cache', type: 'cache', label: 'Semantic Cache' },
        { id: 'router', type: 'router', label: 'Complexity Router' },
        { id: 'm-fast', type: 'fast-model', label: 'Fast Model (70%)', modelId: 'gpt-4o-mini' },
        { id: 'm-deep', type: 'frontier-model', label: 'Frontier (30%)', modelId: 'gpt-4o' },
      ],
      edges: [
        { source: 'api', target: 'cache' },
        { source: 'cache', target: 'router' },
        { source: 'router', target: 'm-fast', trafficShare: 0.70 },
        { source: 'router', target: 'm-deep', trafficShare: 0.30 },
      ],
    },
  },
];

export function WhatWouldYouBuildSection() {
  const router = useRouter();
  const { loadArchitecture } = useArchitectureStore();
  const [selectedId, setSelectedId] = useState('balance');

  const obj = OBJECTIVES.find(o => o.id === selectedId)!;

  const workload: Workload = useMemo(() => ({
    requestsPerMonth: 2_000_000,
    avgInputTokens: 1200,
    avgOutputTokens: 400,
    concurrency: 60,
    cacheHitRate: obj.cache,
    retrievalsPerRequest: obj.id === 'quality' ? 3 : 1,
    toolCallsPerRequest: 0,
  }), [obj]);

  const result = useMemo(() => simulate(workload, obj.architecture), [workload, obj]);

  const handleLoad = () => {
    loadArchitecture(obj.architecture, workload);
    router.push('/simulator');
  };

  return (
    <Section id="what-would-you-build">
      <div className="container">
        <div className="section-header-block">
          <span className="section-label">[ARCHITECTURAL_TRADEOFFS]</span>
          <h2 className="section-heading">What would you optimize for?</h2>
          <p className="section-lead">
            Every AI architecture decision is an explicit engineering tradeoff. Select an objective to inspect how component topologies alter cost, latency, and capability.
          </p>
        </div>

        <div className="objectives-wrap">
          {/* Target Choices */}
          <div className="objectives-choices" role="tablist">
            {OBJECTIVES.map(o => (
              <button
                key={o.id}
                className={`obj-btn ${selectedId === o.id ? 'active' : ''}`}
                onClick={() => setSelectedId(o.id)}
                role="tab"
                aria-selected={selectedId === o.id}
              >
                <span className="obj-icon">{o.icon}</span>
                <span className="text-technical-label" style={{ color: selectedId === o.id ? '#FFFFFF' : 'var(--color-text-muted)' }}>
                  {o.label}
                </span>
              </button>
            ))}
          </div>

          {/* Active Result Card */}
          <motion.div
            className="obj-card"
            key={selectedId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="obj-card-top">
              <div>
                <span className="badge badge--neutral text-mono" style={{ fontSize: '0.6875rem' }}>
                  {obj.label} TOPOLOGY // {obj.model.toUpperCase()}
                </span>
                <p style={{ color: 'var(--color-text)', fontSize: '0.9375rem', marginTop: 'var(--space-2)', fontFamily: 'var(--font-ui)', fontWeight: 500 }}>
                  {obj.description}
                </p>
              </div>

              <button onClick={handleLoad} className="btn btn-primary" style={{ flexShrink: 0 }}>
                LOAD IN SIMULATOR &rarr;
              </button>
            </div>

            {/* Metrics Strip */}
            <div className="obj-metrics-grid">
              <div className="obj-metric-item">
                <span className="text-caption text-mono" style={{ color: 'var(--color-text-muted)' }}>EST. MONTHLY SPEND</span>
                <span className="text-mono obj-metric-num" style={{ color: '#FFFFFF' }}>
                  {formatCurrency(result.monthlyCost)}
                </span>
              </div>
              <div className="obj-metric-item">
                <span className="text-caption text-mono" style={{ color: 'var(--color-text-muted)' }}>EST. P95 LATENCY</span>
                <span className="text-mono obj-metric-num" style={{ color: '#D4D4D8' }}>
                  {formatLatency(result.p95Latency)}
                </span>
              </div>
              <div className="obj-metric-item">
                <span className="text-caption text-mono" style={{ color: 'var(--color-text-muted)' }}>CAPACITY UTILIZATION</span>
                <span className="text-mono obj-metric-num" style={{ color: '#A1A1AA' }}>
                  {result.capacityUtilization.toFixed(0)}%
                </span>
              </div>
              <div className="obj-metric-item">
                <span className="text-caption text-mono" style={{ color: 'var(--color-text-muted)' }}>QUALITY ESTIMATE</span>
                <span className="text-mono obj-metric-num" style={{ color: '#E4E4E7' }}>
                  {result.qualityEstimate}%
                </span>
              </div>
            </div>

            <div className="obj-tradeoff-note">
              <span className="text-mono" style={{ color: 'var(--color-text-muted)', marginRight: '6px' }}>[TRADEOFF]</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-ui)' }}>
                <strong>Empirical Reality:</strong> {obj.tradeoffNote}
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      <style jsx>{`
        .objectives-wrap {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .objectives-choices {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 8px;
        }
        .obj-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 16px 10px;
          background: #141418;
          border: 1px solid var(--color-border);
          border-radius: 3px;
          cursor: pointer;
          color: #A1A1AA;
          transition: all 150ms ease;
        }
        .obj-btn:hover {
          border-color: #3F3F46;
          color: #FFFFFF;
          background: #18181D;
        }
        .obj-btn.active {
          border-color: #FFFFFF;
          background: #101012;
          color: #FFFFFF;
          box-shadow: none;
        }
        .obj-icon {
          font-size: 1.125rem;
          color: #FFFFFF;
        }
        .obj-card {
          background: #101012;
          border: 1px solid var(--color-border);
          border-radius: 4px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .obj-card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          padding-bottom: 18px;
          border-bottom: 1px solid var(--color-border);
        }
        .obj-metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        .obj-metric-item {
          background: #09090B;
          border: 1px solid var(--color-border);
          border-radius: 3px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .obj-metric-num {
          font-family: var(--font-mono);
          font-size: 1.25rem;
          font-weight: 500;
          color: #FFFFFF;
          font-variant-numeric: tabular-nums;
        }
        .obj-tradeoff-note {
          background: #141418;
          border: 1px solid var(--color-border);
          border-radius: 3px;
          padding: 12px 16px;
        }
        @media (max-width: 860px) {
          .objectives-choices {
            grid-template-columns: repeat(2, 1fr);
          }
          .obj-card-top {
            flex-direction: column;
          }
          .obj-metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </Section>
  );
}

// ──────────────────────────────────────────────
// SECTION: STORY FLOW (scroll-driven narrative)
// ──────────────────────────────────────────────

const STORY_LINES = [
  { text: 'AI systems look simple.', muted: false },
  { text: 'But every request hides an architecture.', muted: true },
  { text: 'Architecture creates economics.', muted: true },
  { text: 'Scale changes everything.', muted: true },
  { text: 'ComputeCanvas lets you see it before deployment.', muted: false },
];

function StoryLine({ text, muted }: { text: string; muted: boolean }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  return (
    <motion.p
      ref={ref}
      className="story-flow__line"
      style={{
        color: muted ? '#A1A1AA' : '#FFFFFF',
        fontFamily: 'var(--font-display)',
        fontSize: 'clamp(1.75rem, 3.2vw, 2.5rem)',
        fontWeight: muted ? 500 : 600,
        lineHeight: 1.2,
        letterSpacing: '-0.02em',
        margin: 0,
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
    >
      {text}
    </motion.p>
  );
}

export function StoryFlowSection() {
  return (
    <Section id="story-flow">
      <div className="container">
        <div className="story-flow-block">
          <span className="section-label">[SYSTEM_THESIS]</span>
          <div className="story-flow">
            {STORY_LINES.map((line, i) => (
              <StoryLine key={i} text={line.text} muted={line.muted} />
            ))}
          </div>

          <motion.div
            className="story-flow__ctas"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <p className="story-flow__statement">
              Build. <span style={{ color: '#A1A1AA' }}>Simulate.</span>{' '}
              <span style={{ color: '#71717A' }}>Compare. Optimize.</span>
            </p>
            <div className="story-flow__btn-group">
              <Link href="/simulator" className="btn btn-primary story-btn-main">
                OPEN SIMULATOR &rarr;
              </Link>
              <Link href="/templates" className="btn btn-secondary story-btn-sec">
                EXPLORE TEMPLATES
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      <style jsx>{`
        .story-flow-block {
          max-width: 840px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .story-flow {
          display: flex;
          flex-direction: column;
          gap: 28px;
          padding: 32px 0;
          border-bottom: 1px solid var(--color-border);
        }
        .story-flow__statement {
          font-family: var(--font-display);
          font-size: clamp(2rem, 3.4vw, 3rem);
          font-weight: 600;
          line-height: 1.1;
          letter-spacing: -0.02em;
          color: #FFFFFF;
          margin: 0 0 24px 0;
        }
        .story-flow__ctas {
          padding-top: 16px;
        }
        .story-flow__btn-group {
          display: flex;
          gap: 16px;
          align-items: center;
          flex-wrap: wrap;
        }
        .story-btn-main {
          height: 44px;
          padding: 0 22px;
          border-radius: 3px;
          font-family: var(--font-sans);
          font-size: 0.875rem;
          font-weight: 600;
          letter-spacing: 0.02em;
          display: inline-flex;
          align-items: center;
        }
        .story-btn-sec {
          height: 44px;
          padding: 0 20px;
          border-radius: 3px;
          font-family: var(--font-sans);
          font-size: 0.875rem;
          font-weight: 500;
          letter-spacing: 0.02em;
          display: inline-flex;
          align-items: center;
        }
      `}</style>
    </Section>
  );
}

// ──────────────────────────────────────────────
// SECTION: TEMPLATES PREVIEW
// ──────────────────────────────────────────────

export function TemplatesPreviewSection() {
  return (
    <Section id="templates-preview">
      <div className="container">
        <div className="section-header-block" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <span className="section-label">[CANONICAL_BLUEPRINTS]</span>
            <h2 className="section-heading">Start from proven architectures.</h2>
            <p className="section-lead">Pre-modeled topologies with verified cost functions and empirical latency baselines.</p>
          </div>
          <Link href="/templates" className="btn btn-secondary" style={{ height: '42px', padding: '0 18px', borderRadius: '3px', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', fontWeight: 500 }}>
            VIEW ALL TEMPLATES &rarr;
          </Link>
        </div>

        <div className="templates-grid">
          {TEMPLATES.slice(0, 3).map((template, idx) => {
            const result = simulate(template.defaultWorkload, template.architecture);
            const indexLabel = `0${idx + 1} / ${template.category.toUpperCase()}`;
            return (
              <Link href={`/simulator?template=${template.id}`} key={template.id} className="template-card">
                <div className="template-card__header">
                  <span className="text-mono" style={{ fontSize: '0.6875rem', letterSpacing: '0.08em', color: '#71717A' }}>
                    {indexLabel}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.125rem', fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: '8px', color: '#FFFFFF' }}>
                  {template.name}
                </h3>
                <p style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-sans)', color: '#A1A1AA', marginBottom: '16px', lineHeight: 1.55 }}>
                  {template.description}
                </p>
                <div className="template-card__metrics">
                  <div>
                    <span className="text-mono" style={{ fontSize: '0.625rem', color: '#71717A', letterSpacing: '0.08em' }}>EST. SPEND</span>
                    <span className="text-mono" style={{ color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
                      {formatCurrency(result.monthlyCost, true)}/MO
                    </span>
                  </div>
                  <div>
                    <span className="text-mono" style={{ fontSize: '0.625rem', color: '#71717A', letterSpacing: '0.08em' }}>P95 LATENCY</span>
                    <span className="text-mono" style={{ color: '#D4D4D8', fontSize: '0.875rem', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
                      {formatLatency(result.p95Latency)}
                    </span>
                  </div>
                  <div>
                    <span className="text-mono" style={{ fontSize: '0.625rem', color: '#71717A', letterSpacing: '0.08em' }}>NODES</span>
                    <span className="text-mono" style={{ fontSize: '0.875rem', color: '#A1A1AA', fontVariantNumeric: 'tabular-nums' }}>
                      {template.architecture.nodes.length}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        .templates-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: var(--color-border);
          border: 1px solid var(--color-border);
          border-radius: 4px;
          overflow: hidden;
        }
        @media (max-width: 820px) {
          .templates-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
      <style jsx global>{`
        .template-card {
          display: flex;
          flex-direction: column;
          padding: 24px;
          background: #101012;
          text-decoration: none;
          color: var(--color-text);
          transition: background 150ms ease;
        }
        .template-card:hover {
          background: #141418;
        }
        .template-card__header {
          margin-bottom: 12px;
        }
        .template-card__metrics {
          display: flex;
          gap: 20px;
          margin-top: auto;
          padding-top: 16px;
          border-top: 1px solid var(--color-border);
        }
        .template-card__metrics > div {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
      `}</style>
    </Section>
  );
}

// ──────────────────────────────────────────────
// FOOTER
// ──────────────────────────────────────────────

export function Footer() {
  return (
    <footer className="footer" id="cc-footer" role="contentinfo">
      <div className="container">
        {/* Top: 4-Column Navigation & Brand Specification Panel */}
        <div className="footer__grid">
          {/* Brand Column (Anchor) */}
          <div className="footer__brand-col">
            <div className="footer__brand-identity">
              <span className="footer__brand-mark" aria-hidden="true">■</span>
              <span className="footer__brand-name">COMPUTECANVAS</span>
              <span className="footer__version text-mono">/ V1.2</span>
            </div>
            <p className="footer__desc">
              Deterministic interactive AI architecture and economics simulator.
            </p>
            <div className="footer__signature text-mono">
              ARCHITECTURE // ECONOMICS // LATENCY
            </div>
          </div>

          {/* Product Nav Column */}
          <nav className="footer__nav-col" aria-label="Product navigation">
            <h3 className="footer__col-label text-mono">PRODUCT</h3>
            <ul className="footer__nav-list">
              <li>
                <Link href="/simulator" className="footer__link">Simulator</Link>
              </li>
              <li>
                <Link href="/templates" className="footer__link">Templates</Link>
              </li>
              <li>
                <Link href="/assumptions" className="footer__link">Assumptions</Link>
              </li>
              <li>
                <Link href="/pricing" className="footer__link">Pricing</Link>
              </li>
            </ul>
          </nav>

          {/* System Nav Column */}
          <nav className="footer__nav-col" aria-label="System navigation">
            <h3 className="footer__col-label text-mono">SYSTEM</h3>
            <ul className="footer__nav-list">
              <li>
                <Link href="/docs" className="footer__link">Documentation</Link>
              </li>
              <li>
                <Link href="/company" className="footer__link">Design Principles</Link>
              </li>
              <li>
                <Link href="/assumptions" className="footer__link">Latency Benchmarks</Link>
              </li>
            </ul>
          </nav>

          {/* Legal Nav Column */}
          <nav className="footer__nav-col" aria-label="Legal navigation">
            <h3 className="footer__col-label text-mono">LEGAL</h3>
            <ul className="footer__nav-list">
              <li>
                <Link href="/privacy" className="footer__link">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/terms" className="footer__link">Terms &amp; Disclaimers</Link>
              </li>
            </ul>
          </nav>
        </div>

        {/* Bottom: Technical Signature & Copyright Row */}
        <div className="footer__bottom-row">
          <span className="footer__copyright text-mono">
            &copy; {new Date().getFullYear()} COMPUTECANVAS
          </span>
          <span className="footer__meta text-mono">
            DETERMINISTIC SIMULATION SYSTEM
          </span>
        </div>
      </div>

      <style jsx global>{`
        .footer {
          border-top: 1px solid #242428;
          padding: 64px 0 28px;
          margin-top: 100px;
          background: var(--color-bg);
          position: relative;
        }

        .footer__grid {
          display: grid;
          grid-template-columns: minmax(320px, 1.8fr) minmax(140px, 1fr) minmax(160px, 1fr) minmax(140px, 1fr);
          column-gap: 48px;
          row-gap: 32px;
          padding-bottom: 48px;
          border-bottom: 1px solid #242428;
          align-items: start;
        }

        .footer__brand-col {
          display: flex;
          flex-direction: column;
        }

        .footer__brand-identity {
          display: flex;
          align-items: baseline;
          gap: 8px;
          margin-bottom: 22px;
        }

        .footer__brand-mark {
          font-size: 11px;
          color: #F5F5F5;
          line-height: 1;
        }

        .footer__brand-name {
          font-family: var(--font-display);
          font-size: 1.0625rem;
          font-weight: 600;
          letter-spacing: -0.02em;
          color: #F5F5F5;
          line-height: 1;
        }

        .footer__version {
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          font-weight: 400;
          color: #74747C;
          font-variant-numeric: tabular-nums;
        }

        .footer__desc {
          font-family: var(--font-ui);
          font-size: 0.875rem;
          line-height: 1.55;
          color: #A0A0A8;
          max-width: 340px;
          margin: 0 0 24px 0;
        }

        .footer__signature {
          font-family: var(--font-mono);
          font-size: 0.625rem;
          letter-spacing: 0.10em;
          color: #707078;
          margin: 0;
          font-variant-numeric: tabular-nums;
        }

        .footer__nav-col {
          display: flex;
          flex-direction: column;
        }

        .footer__col-label {
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          letter-spacing: 0.10em;
          color: #74747C;
          text-transform: uppercase;
          font-weight: 500;
          margin: 0 0 18px 0;
          line-height: 1;
        }

        .footer__nav-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .footer__link {
          font-family: var(--font-ui);
          font-size: 0.875rem;
          color: #A8A8B0;
          text-decoration: none;
          transition: color 150ms ease;
          display: inline-block;
          line-height: 1.4;
        }

        .footer__link:hover {
          color: #F5F5F5;
          text-decoration: underline;
          text-underline-offset: 4px;
        }

        .footer__link:focus-visible {
          outline: 1px solid #F5F5F5;
          outline-offset: 3px;
        }

        /* ── Bottom Row (Copyright + Specification Closing Signature) ── */
        .footer__bottom-row {
          padding-top: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }

        .footer__copyright {
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          color: #707078;
          letter-spacing: 0.05em;
          font-variant-numeric: tabular-nums;
        }

        .footer__meta {
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          color: #707078;
          letter-spacing: 0.05em;
          font-variant-numeric: tabular-nums;
        }

        /* ── Responsive ── */
        @media (max-width: 1024px) {
          .footer__grid {
            grid-template-columns: repeat(3, 1fr);
            column-gap: 36px;
            row-gap: 36px;
          }

          .footer__brand-col {
            grid-column: 1 / -1;
            max-width: 440px;
            margin-bottom: 8px;
          }
        }

        @media (max-width: 640px) {
          .footer {
            padding: 48px 0 24px;
            margin-top: 64px;
          }

          .footer__grid {
            display: flex;
            flex-direction: column;
            gap: 32px;
            padding-bottom: 32px;
          }

          .footer__brand-col {
            max-width: 320px;
            margin-bottom: 0;
          }

          .footer__link {
            padding: 6px 0;
            min-height: 40px;
            display: flex;
            align-items: center;
          }

          .footer__bottom-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
            padding-top: 20px;
          }
        }
      `}</style>
    </footer>
  );
}
