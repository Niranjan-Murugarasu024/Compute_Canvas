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

const SYSTEM_NODES = [
  { id: 'api', label: 'API Ingress', tag: 'INGRESS' },
  { id: 'cache', label: 'Semantic Cache', tag: 'CACHE' },
  { id: 'router', label: 'Complexity Router', tag: 'ROUTER' },
  { id: 'vector', label: 'Vector Database', tag: 'RETRIEVAL' },
  { id: 'fast', label: 'Fast Reasoning', tag: 'FAST LLM' },
  { id: 'frontier', label: 'Frontier Reasoning', tag: 'FRONTIER' },
];

const NODE_DETAILS: Record<string, { role: string; cost: string; latency: string }> = {
  api: { role: 'Request ingestion, TLS termination, and rate limits', cost: '$1.00 / 1M requests', latency: '~12ms' },
  cache: { role: 'Prompt and semantic response cache tier', cost: '$65/mo base + memory footprint', latency: '~5ms' },
  router: { role: 'Traffic steering between fast and frontier models', cost: '$0.50 / 1M requests', latency: '~8ms' },
  vector: { role: 'Document embeddings & nearest-neighbor search for RAG', cost: '$120/mo + $0.20/1M queries', latency: '~45ms' },
  fast: { role: 'Sub-150ms reasoning tier (GPT-4o Mini / Gemini Flash)', cost: '$0.10–0.15 / 1M tokens', latency: '~90–140ms' },
  frontier: { role: 'High-intelligence reasoning & synthesis (GPT-4o / Claude Sonnet)', cost: '$2.50–3.00 / 1M tokens', latency: '~380–420ms' },
};

export function EveryRequestSection() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const detail = selectedNode ? NODE_DETAILS[selectedNode] : null;

  return (
    <Section id="every-request">
      <div className="container">
        <div style={{ maxWidth: 640, marginBottom: 'var(--space-12)' }}>
          <p className="text-technical-label" style={{ marginBottom: 'var(--space-2)' }}>
            [ARCHITECTURAL_DECOMPOSITION]
          </p>
          <h2 className="text-heading-xl">Every AI request is a system.</h2>
          <p className="text-body-lg" style={{ marginTop: 'var(--space-3)' }}>
            What appears to be a single API call hides an entire multi-tier pipeline. Every layer introduces token spend, latency penalty, and operational failure modes.
          </p>
        </div>

        <div className="request-system">
          <div className="request-system__chain">
            {SYSTEM_NODES.map((node, i) => (
              <div key={node.id} className="request-system__node-wrapper">
                <button
                  className={`request-system__node ${selectedNode === node.id ? 'selected' : ''}`}
                  onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
                  aria-label={`Inspect ${node.label}`}
                >
                  <span className="node-tag text-mono">{node.tag}</span>
                  <span className="node-title">{node.label}</span>
                </button>
                {i < SYSTEM_NODES.length - 1 && (
                  <div className="request-system__connector">
                    <svg width="2" height="20" viewBox="0 0 2 20">
                      <line x1="1" y1="0" x2="1" y2="20" stroke="var(--color-border-strong)" strokeWidth="1" strokeDasharray="3 3" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>

          {detail && selectedNode && (
            <motion.div
              className="request-system__detail"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              key={selectedNode}
            >
              <div className="detail-header-row">
                <span className="text-technical-label">COMPONENT SPECIFICATION</span>
                <span className="text-mono" style={{ fontSize: '0.6875rem', color: '#FFFFFF' }}>
                  {SYSTEM_NODES.find(n => n.id === selectedNode)?.label}
                </span>
              </div>
              <div className="request-system__detail-row">
                <span className="text-caption">Role</span>
                <span className="text-body-sm" style={{ color: 'var(--color-text)' }}>{detail.role}</span>
              </div>
              <div className="request-system__detail-row">
                <span className="text-caption">Cost Impact</span>
                <span className="text-mono" style={{ fontSize: '0.8125rem', color: 'var(--color-text)' }}>{detail.cost}</span>
              </div>
              <div className="request-system__detail-row">
                <span className="text-caption">Latency Added</span>
                <span className="text-mono" style={{ fontSize: '0.8125rem', color: 'var(--color-text)' }}>{detail.latency}</span>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <style jsx>{`
        .request-system {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: var(--space-8);
          align-items: start;
        }
        .request-system__chain {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .request-system__node-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .request-system__node {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 2px;
          padding: 8px 14px;
          background: var(--color-bg-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all var(--duration-fast) var(--ease-out);
          min-width: 170px;
          text-align: left;
        }
        .node-tag {
          font-size: 0.625rem;
          color: var(--color-text-muted);
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .node-title {
          font-family: var(--font-ui);
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--color-text);
        }
        .request-system__node:hover {
          border-color: var(--color-border-strong);
          background: var(--color-bg-elevated);
        }
        .request-system__node.selected {
          border-color: var(--color-accent);
          background: #141417;
        }
        .request-system__connector {
          padding: 2px 0;
        }
        .request-system__detail {
          padding: var(--space-6);
          background: var(--color-bg-elevated);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          position: sticky;
          top: 120px;
        }
        .detail-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: var(--space-3);
          border-bottom: 1px solid var(--color-border);
          margin-bottom: var(--space-2);
        }
        .request-system__detail-row {
          display: flex;
          justify-content: space-between;
          padding: var(--space-2) 0;
          font-size: 0.8125rem;
          border-bottom: 1px solid var(--color-border-subtle);
        }
        .request-system__detail-row:last-child {
          border-bottom: none;
        }
        @media (max-width: 768px) {
          .request-system {
            grid-template-columns: 1fr;
          }
          .request-system__chain {
            overflow-x: auto;
            flex-direction: row;
            flex-wrap: wrap;
            gap: var(--space-2);
            justify-content: center;
          }
          .request-system__connector {
            display: none;
          }
          .request-system__node {
            min-width: auto;
            padding: var(--space-1) var(--space-3);
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
        <div style={{ maxWidth: 640, marginBottom: 'var(--space-10)' }}>
          <p className="text-technical-label" style={{ marginBottom: 'var(--space-2)' }}>
            [ECONOMIC_DECOMPOSITION]
          </p>
          <h2 className="text-heading-xl">Cost is not just model pricing.</h2>
          <p className="text-body-lg" style={{ marginTop: 'var(--space-3)' }}>
            Every layer of your architecture contributes to the total monthly spend. Adjust the workload parameters to see how traffic scale and cache hit rate reshape the economic profile.
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
          grid-template-columns: 320px 1fr;
          gap: var(--space-8);
          background: var(--color-bg-elevated);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          padding: var(--space-8);
        }
        .cost-instrument__controls {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
          padding-right: var(--space-6);
          border-right: 1px solid var(--color-border);
        }
        .control-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .control-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .slider-markers {
          display: flex;
          justify-content: space-between;
          font-size: 0.625rem;
          color: var(--color-text-muted);
        }
        .select-input {
          padding: 8px 10px;
          background: var(--color-bg-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          color: var(--color-text);
          font-family: var(--font-mono);
          font-size: 0.75rem;
        }
        .cost-instrument__bars {
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
        }
        .cost-summary-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-bottom: var(--space-4);
          border-bottom: 1px solid var(--color-border);
        }
        .cost-total-number {
          font-size: 2rem;
          font-weight: 600;
          line-height: 1.1;
          margin-top: 4px;
        }
        .savings-badge {
          background: var(--color-bg-surface);
          border: 1px solid var(--color-border-strong);
          border-radius: var(--radius-sm);
          padding: 6px 12px;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }
        .breakdown-track-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
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
          width: 6px;
          height: 6px;
          border-radius: 1px;
        }
        .bar-track {
          height: 6px;
          background: var(--color-bg-surface);
          border-radius: var(--radius-xs);
          overflow: hidden;
        }
        .bar-fill {
          height: 100%;
          border-radius: var(--radius-xs);
        }
        .cost-causality-callout {
          background: var(--color-bg-surface);
          border: 1px solid var(--color-border-subtle);
          padding: var(--space-3) var(--space-4);
          border-radius: var(--radius-md);
        }
        @media (max-width: 900px) {
          .cost-instrument {
            grid-template-columns: 1fr;
          }
          .cost-instrument__controls {
            padding-right: 0;
            border-right: none;
            border-bottom: 1px solid var(--color-border);
            padding-bottom: var(--space-6);
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
        <div style={{ maxWidth: 640, marginBottom: 'var(--space-10)' }}>
          <p className="text-technical-label" style={{ marginBottom: 'var(--space-2)' }}>
            [SCALE_TRANSITIONS]
          </p>
          <h2 className="text-heading-xl">Scale changes the architecture.</h2>
          <p className="text-body-lg" style={{ marginTop: 'var(--space-3)' }}>
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
                <span className="text-mono" style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                  {t.trafficLabel}
                </span>
                <span className="text-technical-label" style={{ color: activeStep === idx ? '#FFFFFF' : 'var(--color-text-muted)' }}>
                  {t.label}
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
          background: var(--color-bg-elevated);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
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
          gap: 2px;
          padding: var(--space-4) var(--space-2);
          background: var(--color-bg-elevated);
          border: none;
          cursor: pointer;
          transition: all var(--duration-fast);
        }
        .scale-living__tab:hover {
          background: var(--color-bg-surface);
        }
        .scale-living__tab.active {
          background: var(--color-bg-surface);
          box-shadow: inset 0 -3px 0 var(--color-accent);
        }
        .scale-living__content {
          display: grid;
          grid-template-columns: 1fr 280px;
          gap: var(--space-6);
          padding: var(--space-6);
        }
        .scale-living__topology {
          display: flex;
          flex-direction: column;
        }
        .topology-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-3);
        }
        .topology-svg-wrap {
          background: var(--color-bg);
          border: 1px solid var(--color-border-subtle);
          border-radius: var(--radius-md);
          overflow: hidden;
        }
        .bottleneck-strip {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          background: rgba(245, 158, 11, 0.08);
          border: 1px solid rgba(245, 158, 11, 0.25);
          padding: 8px 12px;
          border-radius: var(--radius-sm);
          margin-top: var(--space-4);
        }
        .scale-living__metrics {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
          border-left: 1px solid var(--color-border);
          padding-left: var(--space-6);
        }
        .scale-metric-box {
          background: var(--color-bg);
          border: 1px solid var(--color-border-subtle);
          border-radius: var(--radius-sm);
          padding: var(--space-3);
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .scale-metric-val {
          font-size: 1.25rem;
          font-weight: 700;
        }
        @media (max-width: 860px) {
          .scale-living__content {
            grid-template-columns: 1fr;
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
        <div style={{ maxWidth: 640, marginBottom: 'var(--space-10)' }}>
          <p className="text-technical-label" style={{ marginBottom: 'var(--space-2)' }}>
            [ARCHITECTURAL_TRADEOFFS]
          </p>
          <h2 className="text-heading-xl">What would you optimize for?</h2>
          <p className="text-body-lg" style={{ marginTop: 'var(--space-3)' }}>
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
          gap: var(--space-4);
        }
        .objectives-choices {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: var(--space-2);
        }
        .obj-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: var(--space-4) var(--space-2);
          background: var(--color-bg-elevated);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          cursor: pointer;
          color: var(--color-text-secondary);
          transition: all var(--duration-fast);
        }
        .obj-btn:hover {
          border-color: var(--color-border-strong);
          color: var(--color-text);
        }
        .obj-btn.active {
          border-color: var(--color-accent);
          background: var(--color-bg-surface);
          color: var(--color-text);
          box-shadow: none;
        }
        .obj-icon {
          font-size: 1.125rem;
          color: var(--color-text);
        }
        .obj-card {
          background: var(--color-bg-elevated);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          padding: var(--space-6);
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
        }
        .obj-card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: var(--space-4);
          padding-bottom: var(--space-4);
          border-bottom: 1px solid var(--color-border-subtle);
        }
        .obj-metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--space-4);
        }
        .obj-metric-item {
          background: var(--color-bg);
          border: 1px solid var(--color-border-subtle);
          border-radius: var(--radius-xs);
          padding: var(--space-3);
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .obj-metric-num {
          font-size: 1.25rem;
          font-weight: 500;
        }
        .obj-tradeoff-note {
          background: var(--color-bg-surface);
          border: 1px solid var(--color-border-subtle);
          border-radius: var(--radius-xs);
          padding: var(--space-3) var(--space-4);
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
        color: muted ? 'var(--color-text-secondary)' : 'var(--color-text)',
        fontFamily: 'var(--font-display)',
        fontSize: 'clamp(1.75rem, 3.2vw, 2.5rem)',
        fontWeight: 600,
        lineHeight: 1.2,
        letterSpacing: '-0.02em',
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
      <div className="container" style={{ maxWidth: 720, textAlign: 'center' }}>
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
          <p className="text-display-lg" style={{ marginBottom: 'var(--space-8)' }}>
            Build. <span style={{ color: 'var(--color-text-secondary)' }}>Simulate.</span><br />
            <span style={{ color: 'var(--color-text-muted)' }}>Compare. Optimize.</span>
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/simulator" className="btn btn-primary" style={{ padding: '12px 24px' }}>
              OPEN SIMULATOR &rarr;
            </Link>
            <Link href="/templates" className="btn btn-secondary" style={{ padding: '12px 24px' }}>
              EXPLORE TEMPLATES &rarr;
            </Link>
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        .story-flow {
          display: flex;
          flex-direction: column;
          gap: var(--space-8);
          padding: var(--space-16) 0;
        }
        .story-flow__ctas {
          padding-top: var(--space-12);
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--space-8)', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div style={{ maxWidth: 480 }}>
            <p className="text-technical-label" style={{ marginBottom: 'var(--space-2)' }}>
              [CANONICAL_BLUEPRINTS]
            </p>
            <h2 className="text-heading-xl">Start from proven architectures.</h2>
          </div>
          <Link href="/templates" className="btn btn-secondary">
            VIEW ALL TEMPLATES &rarr;
          </Link>
        </div>

        <div className="templates-grid">
          {TEMPLATES.slice(0, 3).map(template => {
            const result = simulate(template.defaultWorkload, template.architecture);
            return (
              <Link href={`/simulator?template=${template.id}`} key={template.id} className="template-card">
                <div className="template-card__header">
                  <span className="text-technical-label">{template.category}</span>
                </div>
                <h3 style={{ fontSize: '1.125rem', fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                  {template.name}
                </h3>
                <p style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-ui)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)', lineHeight: 1.5 }}>
                  {template.description}
                </p>
                <div className="template-card__metrics">
                  <div>
                    <span className="text-technical-label">EST. SPEND</span>
                    <span className="text-mono" style={{ color: 'var(--color-text)', fontSize: '0.8125rem', fontWeight: 500 }}>
                      {formatCurrency(result.monthlyCost, true)}/mo
                    </span>
                  </div>
                  <div>
                    <span className="text-technical-label">P95 LATENCY</span>
                    <span className="text-mono" style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>
                      {formatLatency(result.p95Latency)}
                    </span>
                  </div>
                  <div>
                    <span className="text-technical-label">NODES</span>
                    <span className="text-mono" style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
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
          border-radius: var(--radius-sm);
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
          padding: var(--space-6);
          background: var(--color-bg-elevated);
          text-decoration: none;
          color: var(--color-text);
          transition: background var(--duration-fast) var(--ease-out);
        }
        .template-card:hover {
          background: var(--color-bg-surface);
        }
        .template-card__header {
          margin-bottom: var(--space-3);
        }
        .template-card__metrics {
          display: flex;
          gap: var(--space-6);
          margin-top: auto;
          padding-top: var(--space-4);
          border-top: 1px solid var(--color-border-subtle);
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
              <span style={{ fontSize: '10px', color: '#FFFFFF' }}>■</span>
              <span style={{ fontWeight: 600, fontSize: '0.9375rem', letterSpacing: '0.06em', fontFamily: 'var(--font-display)' }}>COMPUTECANVAS</span>
              <span style={{ color: 'var(--color-border-strong)', fontSize: '0.875rem' }}>/</span>
              <span className="text-mono" style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>V1</span>
            </div>
            <p style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-ui)', color: 'var(--color-text-muted)', maxWidth: 280, lineHeight: 1.5 }}>
              Deterministic interactive AI architecture and economics simulator.
            </p>
          </div>

          <div className="footer__links">
            <div>
              <p className="text-technical-label" style={{ marginBottom: 'var(--space-3)' }}>PRODUCT</p>
              <Link href="/simulator">Simulator Workbench</Link>
              <Link href="/templates">Canonical Templates</Link>
              <Link href="/assumptions">Pricing Assumptions</Link>
              <Link href="/pricing">Free Community V1</Link>
            </div>
            <div>
              <p className="text-technical-label" style={{ marginBottom: 'var(--space-3)' }}>SYSTEM</p>
              <Link href="/docs">Documentation</Link>
              <Link href="/company">Principles &amp; Design</Link>
              <Link href="/assumptions">Latency Benchmarks</Link>
            </div>
            <div>
              <p className="text-technical-label" style={{ marginBottom: 'var(--space-3)' }}>LEGAL</p>
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/terms">Terms &amp; Disclaimers</Link>
            </div>
          </div>
        </div>

        <div className="footer__bottom">
          <span className="text-mono" style={{ fontSize: '0.6875rem' }}>© {new Date().getFullYear()} COMPUTECANVAS // DETERMINISTIC SIMULATION SYSTEM</span>
        </div>
      </div>

      <style jsx global>{`
        .footer {
          border-top: 1px solid var(--color-border);
          padding: var(--space-12) 0 var(--space-8);
          margin-top: var(--space-16);
        }
        .footer__inner {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: var(--space-12);
          margin-bottom: var(--space-8);
        }
        .footer__links {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-8);
        }
        .footer__links a {
          display: block;
          font-family: var(--font-ui);
          color: var(--color-text-secondary);
          text-decoration: none;
          font-size: 0.8125rem;
          padding: 3px 0;
          transition: color var(--duration-fast);
        }
        .footer__links a:hover {
          color: var(--color-text);
        }
        .footer__bottom {
          padding-top: var(--space-6);
          border-top: 1px solid var(--color-border-subtle);
          font-size: 0.75rem;
          color: var(--color-text-muted);
        }
        @media (max-width: 768px) {
          .footer__inner {
            grid-template-columns: 1fr;
            gap: var(--space-8);
          }
          .footer__links {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </footer>
  );
}
