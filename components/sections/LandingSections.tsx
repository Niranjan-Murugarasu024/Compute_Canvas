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
  role: string;
  unitCost: string;
  unitCostSub: string;
  baselineLatency: string;
  latencySub: string;
  systemImpact: string;
  impactPercent: number;
  inputSignal: string;
  outputSignal: string;
  failureMode: string;
  mitigation: string;
  tradeoffLabel: string;
  tradeoffRows: { condition: string; cost: string; latency: string; impact: string }[];
}

const SYSTEM_NODES: SubsystemDetail[] = [
  {
    id: 'api',
    tag: 'INGRESS',
    label: 'API Ingress Gateway',
    subsystemIndex: 'SUBSYSTEM // 01_INGRESS',
    role: 'First operational boundary for inbound requests. Enforces TLS termination, client credential validation, rate-limiting token buckets, DDoS shedding, and distributed trace ID injection before dispatching downstream.',
    unitCost: '$1.00 / 1M REQ',
    unitCostSub: 'AWS HTTP API Gateway / Cloudflare Workers tier',
    baselineLatency: '+12 MS',
    latencySub: 'P95 TLS handshake & edge routing dispatch',
    systemImpact: '5.6% OF SYSTEM SPEND',
    impactPercent: 6,
    inputSignal: 'Client HTTPS POST /v1/chat/completions (JSON Payload)',
    outputSignal: 'Authenticated Internal RPC Context + Trace ID',
    failureMode: 'Edge rate-limit saturation (HTTP 429), regional routing DNS delays, client retry storms under load.',
    mitigation: 'Adaptive client backoff with full jitter, token bucket rate limits, edge DNS anycast failover.',
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
    role: 'Evaluates prompt text and high-dimensional semantic embeddings against recent query completions. Exact and cosine-similarity matches (>0.92) return cached responses in single-digit milliseconds, entirely bypassing frontier LLM costs.',
    unitCost: '$65.00 / MO',
    unitCostSub: 'Redis Cloud High-Availability tier + RAM scale',
    baselineLatency: '+5 MS',
    latencySub: 'In-memory KV / HNSW vector index lookup',
    systemImpact: 'SAVES UP TO 78% INFERENCE COST',
    impactPercent: 78,
    inputSignal: 'Normalized Prompt String + Query Vector Key',
    outputSignal: 'Instant Cached Completion OR Cache-Miss Bypass',
    failureMode: 'Cache stampede during cold boots, memory exhaustion from long context histories, stale retrieval answers.',
    mitigation: 'Probabilistic early expiration (XFetch algorithm), TTL boundaries, strict cosine similarity thresholds.',
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
    role: 'Analyzes prompt reasoning requirements, multi-step dependencies, and token length using lightweight heuristic classifiers. Dynamically routes routine extraction to fast models and reserves frontier models for complex multi-hop synthesis.',
    unitCost: '$0.50 / 1M REQ',
    unitCostSub: 'Edge rule engine / Sub-10M parameter classifier',
    baselineLatency: '+8 MS',
    latencySub: 'Regex parser + classifier inference pass',
    systemImpact: '4.2× ECONOMIC MULTIPLIER',
    impactPercent: 65,
    inputSignal: 'Uncached User Query + System Prompt Instructions',
    outputSignal: 'Deterministic Model Route Dispatch Tag',
    failureMode: 'Misclassification routing complex reasoning queries to small models, leading to user hallucinations and re-prompts.',
    mitigation: 'Classifier confidence scoring with automatic escalation thresholds and user feedback loop triggers.',
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
    role: 'Performs approximate nearest-neighbor (ANN) vector search over document chunk embeddings. Retrieves top-k relevant grounding chunks and injects them into the model prompt preamble to eliminate hallucinations and provide domain context.',
    unitCost: '$120.00 / MO',
    unitCostSub: 'Managed serverless index + $0.20/1M queries',
    baselineLatency: '+45 MS',
    latencySub: 'Hierarchical Navigable Small World (HNSW) scan',
    systemImpact: '9.2% OF TOTAL ARCHITECTURE SPEND',
    impactPercent: 15,
    inputSignal: 'Query Embedding Vector (1536 / 3072 Dimensions)',
    outputSignal: 'Top-3 Grounded Document Chunks (Token Payload)',
    failureMode: 'Context window bloat driving up token input charges, index fragmentation, high tail latency on large corpora (>10M vectors).',
    mitigation: 'Hybrid lexical + dense search, semantic chunk deduplication, cross-encoder reranker score filtering.',
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
    role: 'Engineered for sub-150ms execution, high concurrency, and massive request throughput. Ideal for classification, JSON data extraction, dialogue formatting, filtering, and initial triage before escalating to heavy reasoning tiers.',
    unitCost: '$0.15 / 1M TOKENS',
    unitCostSub: 'GPT-4o Mini / Gemini 2.0 Flash / Claude 3.5 Haiku',
    baselineLatency: '~120 MS',
    latencySub: 'TTFT ~80ms, 45 tokens/sec completion stream',
    systemImpact: '14.2% OF INFERENCE SPEND',
    impactPercent: 25,
    inputSignal: 'Hydrated Prompt + RAG Context Chunks',
    outputSignal: 'Structured Completion Stream (Fast Return)',
    failureMode: 'Degraded accuracy on symbolic logic, complex mathematical proofs, or multi-step tool calling orchestration.',
    mitigation: 'Strict system prompt constraints, schema validation guards, automated retry with frontier tier escalation.',
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
    role: 'State-of-the-art multi-step reasoning, mathematical proof, architecture generation, and nuanced code synthesis. Forms the core intelligence engine, but represents the single largest cost bottleneck (up to 84%) and latency center in the pipeline.',
    unitCost: '$2.50 / 1M TOKENS',
    unitCostSub: 'GPT-4o / Claude 3.5 Sonnet / Gemini 1.5 Pro',
    baselineLatency: '~382 MS',
    latencySub: 'TTFT ~240ms, 30 tokens/sec completion stream',
    systemImpact: '78.4% OF TOTAL SYSTEM COST (PRIMARY BOTTLENECK)',
    impactPercent: 84,
    inputSignal: 'Complex Synthesized Prompt + Tool Definitions',
    outputSignal: 'High-Fidelity Multi-Step Reasoning Completion',
    failureMode: 'Runaway token expenditures during unconstrained recursive agent loops, severe P99 latency spikes, provider rate limits.',
    mitigation: 'Aggressive upstream semantic caching, max_tokens output clamps, offloading 70%+ volume to Complexity Router.',
    tradeoffLabel: 'SYSTEM BOTTLENECK MITIGATION',
    tradeoffRows: [
      { condition: 'Un-architected (Direct Frontier LLM)', cost: '$6,097 / mo', latency: '382 ms', impact: 'Primary cost and latency bottleneck' },
      { condition: 'Architected (Ingress + Cache + Router)', cost: '$1,308 / mo', latency: '105 ms', impact: '78% spend savings, 3.6× faster P95' },
    ],
  },
];

export function EveryRequestSection() {
  // Default to 'router' so the inspection console is NEVER empty on initial page load
  const [selectedId, setSelectedId] = useState<string>('router');
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
              <span className="text-technical-label">REQUEST PIPELINE CHAIN</span>
              <span className="text-mono" style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)' }}>
                6 V1 COMPONENTS
              </span>
            </div>

            <div className="request-system__chain">
              {SYSTEM_NODES.map((node, i) => {
                const isSelected = selectedId === node.id;
                return (
                  <div key={node.id} className="request-system__node-wrapper">
                    <button
                      className={`request-system__node ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedId(node.id)}
                      aria-label={`Inspect ${node.label}`}
                    >
                      <div className="node-top-row">
                        <span className="node-tag text-mono">{node.tag}</span>
                        <span className="node-latency text-mono">{node.baselineLatency.replace('+', '')}</span>
                      </div>
                      <div className="node-main-row">
                        <span className="node-title">{node.label}</span>
                        {isSelected && <span className="node-active-arrow text-mono">&rarr;</span>}
                      </div>
                      <div className="node-meta-row text-mono">
                        <span>{node.unitCost.split('/')[0].trim()}</span>
                        <span style={{ opacity: 0.6 }}>&bull;</span>
                        <span style={{ color: node.impactPercent >= 70 ? 'var(--color-warning)' : 'var(--color-text-muted)' }}>
                          {node.impactPercent >= 70 ? `${node.impactPercent}% LOAD` : `${node.impactPercent}%`}
                        </span>
                      </div>
                    </button>

                    {i < SYSTEM_NODES.length - 1 && (
                      <div className="request-system__connector">
                        <svg width="2" height="18" viewBox="0 0 2 18">
                          <line x1="1" y1="0" x2="1" y2="18" stroke="var(--color-border-strong)" strokeWidth="1" strokeDasharray="3 3" />
                        </svg>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: High-Density Architectural Inspection Console */}
          <motion.div
            key={activeSubsystem.id}
            className="request-system__console"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {/* Console Header Bar */}
            <div className="console-top-bar">
              <div className="console-top-left">
                <span className="badge badge--neutral text-mono" style={{ fontSize: '0.625rem' }}>
                  {activeSubsystem.subsystemIndex}
                </span>
                <span className="text-technical-label" style={{ color: 'var(--color-text-secondary)' }}>
                  INSPECTION TELEMETRY
                </span>
              </div>
              <div className="console-top-right">
                <span className="status-dot-pulse" />
                <span className="text-mono" style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                  DETERMINISTIC V1 SPEC
                </span>
              </div>
            </div>

            {/* Subsystem Name & Primary Role */}
            <div className="console-heading-block">
              <h3 className="subsystem-title">{activeSubsystem.label}</h3>
              <p className="subsystem-role">{activeSubsystem.role}</p>
            </div>

            {/* Telemetry Metric Cards Strip (3-column instrument display) */}
            <div className="console-metrics-grid">
              <div className="console-metric-cell">
                <span className="metric-cell-tag text-mono">UNIT COST RATE</span>
                <span className="metric-cell-val text-mono">{activeSubsystem.unitCost}</span>
                <span className="metric-cell-sub text-mono">{activeSubsystem.unitCostSub}</span>
              </div>

              <div className="console-metric-cell">
                <span className="metric-cell-tag text-mono">BASELINE LATENCY PENALTY</span>
                <span className="metric-cell-val text-mono">{activeSubsystem.baselineLatency}</span>
                <span className="metric-cell-sub text-mono">{activeSubsystem.latencySub}</span>
              </div>

              <div className="console-metric-cell">
                <span className="metric-cell-tag text-mono">SYSTEM SPEND CONTRIBUTION</span>
                <span className="metric-cell-val text-mono" style={{ color: activeSubsystem.impactPercent >= 70 ? 'var(--color-warning)' : 'var(--color-text)' }}>
                  {activeSubsystem.impactPercent}%
                </span>
                <div className="console-meter-track">
                  <div
                    className="console-meter-fill"
                    style={{
                      width: `${Math.min(100, activeSubsystem.impactPercent)}%`,
                      backgroundColor: activeSubsystem.impactPercent >= 70 ? 'var(--color-warning)' : 'var(--color-text)',
                    }}
                  />
                </div>
                <span className="metric-cell-sub text-mono">{activeSubsystem.systemImpact}</span>
              </div>
            </div>

            {/* Signal Flow Trace */}
            <div className="console-signal-trace">
              <div className="signal-trace-header">
                <span className="text-technical-label">SIGNAL FLOW STAGE</span>
                <span className="text-mono" style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                  INBOUND &rarr; SUBSYSTEM &rarr; OUTBOUND
                </span>
              </div>

              <div className="signal-flow-row">
                <div className="signal-hop">
                  <span className="signal-hop-label text-mono">INPUT SIGNAL</span>
                  <span className="signal-hop-text text-mono">{activeSubsystem.inputSignal}</span>
                </div>
                <div className="signal-arrow text-mono">&rarr;</div>
                <div className="signal-hop active-hop">
                  <span className="signal-hop-label text-mono">PROCESSING</span>
                  <span className="signal-hop-text">{activeSubsystem.tag} EXECUTION</span>
                </div>
                <div className="signal-arrow text-mono">&rarr;</div>
                <div className="signal-hop">
                  <span className="signal-hop-label text-mono">OUTPUT SIGNAL</span>
                  <span className="signal-hop-text text-mono">{activeSubsystem.outputSignal}</span>
                </div>
              </div>
            </div>

            {/* Failure Modes & Defense Grid */}
            <div className="console-diagnostics-grid">
              <div className="diagnostic-card">
                <span className="diagnostic-tag text-mono" style={{ color: 'var(--color-warning)' }}>
                  FAILURE MODES &amp; BOTTLENECKS
                </span>
                <p className="diagnostic-text">{activeSubsystem.failureMode}</p>
              </div>

              <div className="diagnostic-card">
                <span className="diagnostic-tag text-mono" style={{ color: 'var(--color-text-secondary)' }}>
                  ARCHITECTURAL MITIGATION
                </span>
                <p className="diagnostic-text">{activeSubsystem.mitigation}</p>
              </div>
            </div>

            {/* Tradeoff Empirical Matrix Table */}
            <div className="console-tradeoff-block">
              <div className="tradeoff-header-row">
                <span className="text-technical-label">{activeSubsystem.tradeoffLabel}</span>
                <span className="text-mono" style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                  EMPIRICAL TRADE-OFF DELTAS
                </span>
              </div>

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
            </div>

            {/* Footer Action Bar */}
            <div className="console-footer-bar">
              <span className="text-mono" style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                Simulate this layer with custom tokens &amp; latency formulas:
              </span>
              <Link href="/simulator" className="btn btn-primary btn-sm">
                Open in Workstation &rarr;
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      <style jsx>{`
        .request-system {
          display: grid;
          grid-template-columns: 240px 1fr;
          gap: var(--space-6);
          align-items: start;
        }

        /* ── Left Column: Chain ── */
        .request-system__chain-col {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .chain-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: var(--space-2);
          border-bottom: 1px solid var(--color-border);
          margin-bottom: var(--space-1);
        }

        .request-system__chain {
          display: flex;
          flex-direction: column;
          align-items: stretch;
        }

        .request-system__node-wrapper {
          display: flex;
          flex-direction: column;
          align-items: stretch;
        }

        .request-system__node {
          display: flex;
          flex-direction: column;
          align-items: stretch;
          gap: 3px;
          padding: 10px 12px;
          background: var(--color-bg-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all var(--duration-fast) var(--ease-out);
          text-align: left;
          width: 100%;
        }

        .node-top-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .node-tag {
          font-size: 0.5625rem;
          color: var(--color-text-muted);
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .node-latency {
          font-size: 0.625rem;
          color: var(--color-text-muted);
        }

        .node-main-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 6px;
        }

        .node-title {
          font-family: var(--font-ui);
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--color-text);
        }

        .node-active-arrow {
          font-size: 0.75rem;
          color: var(--color-text);
        }

        .node-meta-row {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.6875rem;
          color: var(--color-text-secondary);
        }

        .request-system__node:hover {
          border-color: var(--color-border-strong);
          background: var(--color-bg-elevated);
        }

        .request-system__node.selected {
          border-color: var(--color-border-focus);
          background: var(--color-bg-elevated);
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
        }

        .request-system__connector {
          display: flex;
          justify-content: center;
          padding: 2px 0;
        }

        /* ── Right Column: Architectural Inspection Console ── */
        .request-system__console {
          background: var(--color-bg-elevated);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          padding: var(--space-6);
          display: flex;
          flex-direction: column;
          gap: var(--space-5);
        }

        .console-top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: var(--space-3);
          border-bottom: 1px solid var(--color-border);
        }

        .console-top-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .console-top-right {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .status-dot-pulse {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #FFFFFF;
          display: inline-block;
        }

        .console-heading-block {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .subsystem-title {
          font-family: var(--font-display);
          font-size: 1.5rem;
          font-weight: 600;
          letter-spacing: -0.01em;
          color: var(--color-text);
          margin: 0;
        }

        .subsystem-role {
          font-family: var(--font-ui);
          font-size: 0.875rem;
          line-height: 1.55;
          color: var(--color-text-secondary);
          margin: 0;
        }

        /* ── Telemetry 3-Column Strip ── */
        .console-metrics-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-3);
        }

        .console-metric-cell {
          background: var(--color-bg-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          padding: var(--space-3) var(--space-4);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .metric-cell-tag {
          font-size: 0.625rem;
          color: var(--color-text-muted);
          letter-spacing: 0.04em;
        }

        .metric-cell-val {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--color-text);
        }

        .metric-cell-sub {
          font-size: 0.6875rem;
          color: var(--color-text-secondary);
          line-height: 1.3;
        }

        .console-meter-track {
          height: 3px;
          background: var(--color-border);
          border-radius: 1px;
          overflow: hidden;
          margin-top: 2px;
        }

        .console-meter-fill {
          height: 100%;
          transition: width 0.25s ease;
        }

        /* ── Signal Flow ── */
        .console-signal-trace {
          background: var(--color-bg-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          padding: var(--space-4);
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .signal-trace-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2px;
        }

        .signal-flow-row {
          display: grid;
          grid-template-columns: 1fr auto 1fr auto 1fr;
          align-items: center;
          gap: 8px;
        }

        .signal-hop {
          background: var(--color-bg);
          border: 1px solid var(--color-border-subtle);
          border-radius: var(--radius-sm);
          padding: 8px 10px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .signal-hop.active-hop {
          border-color: var(--color-border-strong);
          background: #111115;
        }

        .signal-hop-label {
          font-size: 0.5625rem;
          color: var(--color-text-muted);
          letter-spacing: 0.05em;
        }

        .signal-hop-text {
          font-size: 0.6875rem;
          color: var(--color-text);
          line-height: 1.3;
          word-break: break-word;
        }

        .signal-arrow {
          color: var(--color-border-strong);
          font-size: 0.875rem;
        }

        /* ── Diagnostics Grid ── */
        .console-diagnostics-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-3);
        }

        .diagnostic-card {
          background: var(--color-bg-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          padding: var(--space-3) var(--space-4);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .diagnostic-tag {
          font-size: 0.625rem;
          letter-spacing: 0.05em;
        }

        .diagnostic-text {
          font-family: var(--font-ui);
          font-size: 0.75rem;
          line-height: 1.45;
          color: var(--color-text-secondary);
          margin: 0;
        }

        /* ── Tradeoff Matrix Table ── */
        .console-tradeoff-block {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .tradeoff-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
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

        /* ── Footer Bar ── */
        .console-footer-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: var(--space-3);
          border-top: 1px solid var(--color-border);
          gap: var(--space-4);
          flex-wrap: wrap;
        }

        /* ── Responsive ── */
        @media (max-width: 960px) {
          .request-system {
            grid-template-columns: 1fr;
          }

          .request-system__chain {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: var(--space-2);
          }

          .request-system__connector {
            display: none;
          }

          .console-metrics-grid {
            grid-template-columns: 1fr;
          }

          .console-diagnostics-grid {
            grid-template-columns: 1fr;
          }

          .signal-flow-row {
            grid-template-columns: 1fr;
          }

          .signal-arrow {
            display: none;
          }
        }

        @media (max-width: 600px) {
          .request-system__chain {
            grid-template-columns: 1fr;
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
    <footer className="footer">
      <div className="container">
        <div className="footer__inner">
          <div className="footer__brand">
            <div className="footer__wordmark">
              <span style={{ fontSize: '10px', color: '#FFFFFF' }}>■</span>
              <span className="footer__brand-text">COMPUTECANVAS</span>
              <span className="footer__version text-mono">/ V1.2</span>
            </div>
            <p className="footer__desc">
              Deterministic interactive AI architecture and economics simulator.
            </p>
          </div>

          <div className="footer__col">
            <p className="footer__col-label text-mono">PRODUCT</p>
            <Link href="/simulator" className="footer__link">Simulator Workbench</Link>
            <Link href="/templates" className="footer__link">Canonical Templates</Link>
            <Link href="/assumptions" className="footer__link">Pricing Assumptions</Link>
            <Link href="/pricing" className="footer__link">Free Community V1</Link>
          </div>

          <div className="footer__col">
            <p className="footer__col-label text-mono">SYSTEM</p>
            <Link href="/docs" className="footer__link">Documentation</Link>
            <Link href="/company" className="footer__link">Principles &amp; Design</Link>
            <Link href="/assumptions" className="footer__link">Latency Benchmarks</Link>
          </div>

          <div className="footer__col">
            <p className="footer__col-label text-mono">LEGAL</p>
            <Link href="/privacy" className="footer__link">Privacy Policy</Link>
            <Link href="/terms" className="footer__link">Terms &amp; Disclaimers</Link>
          </div>
        </div>

        <div className="footer__bottom">
          <span className="text-mono" style={{ fontSize: '0.6875rem', color: '#71717A' }}>
            © {new Date().getFullYear()} COMPUTECANVAS // DETERMINISTIC SIMULATION SYSTEM
          </span>
        </div>
      </div>

      <style jsx global>{`
        .footer {
          border-top: 1px solid var(--color-border);
          padding: 64px 0 36px;
          margin-top: 120px;
        }
        .footer__inner {
          display: grid;
          grid-template-columns: 1.4fr 1fr 1fr 1fr;
          gap: 32px;
          margin-bottom: 48px;
          align-items: flex-start;
        }
        .footer__wordmark {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }
        .footer__brand-text {
          font-family: var(--font-display);
          font-size: 0.9375rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          color: #FFFFFF;
        }
        .footer__version {
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          color: #71717A;
        }
        .footer__desc {
          font-family: var(--font-sans);
          font-size: 0.875rem;
          color: #A0A0A8;
          max-width: 280px;
          line-height: 1.5;
          margin: 0;
        }
        .footer__col {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .footer__col-label {
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          color: #71717A;
          letter-spacing: 0.08em;
          margin: 0 0 4px 0;
        }
        .footer__link {
          font-family: var(--font-sans);
          color: #A0A0A8;
          text-decoration: none;
          font-size: 0.875rem;
          padding: 2px 0;
          transition: color 150ms ease;
        }
        .footer__link:hover {
          color: #FFFFFF;
        }
        .footer__bottom {
          padding-top: 24px;
          border-top: 1px solid var(--color-border);
        }
        @media (max-width: 900px) {
          .footer__inner {
            grid-template-columns: 1fr 1fr;
            gap: 32px;
          }
        }
        @media (max-width: 540px) {
          .footer__inner {
            grid-template-columns: 1fr;
            gap: 28px;
          }
        }
      `}</style>
    </footer>
  );
}
