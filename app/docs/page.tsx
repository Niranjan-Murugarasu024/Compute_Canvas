'use client';

import Navigation from '@/components/navigation/Navigation';
import { Footer } from '@/components/sections/LandingSections';
import Link from 'next/link';

export default function DocsPage() {
  return (
    <>
      <Navigation />
      <main className="docs-page">
        <div className="container" style={{ maxWidth: '960px' }}>
          {/* Header */}
          <div className="docs-header">
            <span className="badge badge--primary text-mono">DOCUMENTATION &bull; V1</span>
            <h1 className="text-display" style={{ fontSize: '2.5rem', marginTop: 'var(--space-2)' }}>
              ComputeCanvas Architecture &amp; Simulation Guide
            </h1>
            <p className="docs-subtitle">
              Learn how ComputeCanvas calculates token economics, composite P95 latencies, bottleneck thresholds, and calibration factors without stochastic hallucinations.
            </p>
          </div>

          <div className="docs-body">
            {/* Section 1: Overview */}
            <section className="docs-section">
              <h2 className="docs-title">1. What is ComputeCanvas?</h2>
              <p>
                ComputeCanvas is an interactive AI architecture and economics decision simulator. It allows engineers, architects, founders, and FinOps practitioners to map generative AI systems visually and immediately understand their trade-offs across <strong>monthly spend</strong>, <strong>cost per request</strong>, and <strong>estimated P95 latency</strong> before writing code or provisioning cloud infrastructure.
              </p>
            </section>

            {/* Section 2: Six Core Building Blocks */}
            <section className="docs-section">
              <h2 className="docs-title">2. The Six V1 Building Blocks</h2>
              <p>
                ComputeCanvas V1 focuses on the primary architectural levers that dictate 95%+ of generative AI system cost and latency:
              </p>
              <div className="docs-components-grid">
                <div className="doc-component-card">
                  <span className="doc-pill text-mono" style={{ borderColor: '#38bdf8', color: '#38bdf8' }}>INGRESS</span>
                  <h3>API Ingress Gateway</h3>
                  <p>Handles incoming client traffic, TLS termination, and rate gating ($1.00 / 1M requests, ~12ms latency).</p>
                </div>
                <div className="doc-component-card">
                  <span className="doc-pill text-mono" style={{ borderColor: '#34d399', color: '#34d399' }}>CACHE</span>
                  <h3>Semantic Cache</h3>
                  <p>Intercepts incoming prompts and serves exact/semantic cache hits, skipping model inference entirely ($65/mo base + memory, ~5ms).</p>
                </div>
                <div className="doc-component-card">
                  <span className="doc-pill text-mono" style={{ borderColor: '#a78bfa', color: '#a78bfa' }}>ROUTER</span>
                  <h3>Complexity Router</h3>
                  <p>Analyzes prompt intent and dynamically steers queries between fast low-cost models and high-depth frontier models ($0.50 / 1M requests, ~8ms).</p>
                </div>
                <div className="doc-component-card">
                  <span className="doc-pill text-mono" style={{ borderColor: '#fbbf24', color: '#fbbf24' }}>RETRIEVAL</span>
                  <h3>Vector Database</h3>
                  <p>Stores document chunk embeddings and executes approximate nearest-neighbor search for RAG ($120/mo cluster base + $0.20/1M queries, ~45ms).</p>
                </div>
                <div className="doc-component-card">
                  <span className="doc-pill text-mono" style={{ borderColor: '#06b6d4', color: '#06b6d4' }}>FAST MODEL</span>
                  <h3>Fast Reasoning Model</h3>
                  <p>Sub-150ms models (e.g. GPT-4o Mini, Gemini 2.0 Flash) priced at $0.10–0.15 / 1M input tokens and $0.40–0.60 / 1M output tokens.</p>
                </div>
                <div className="doc-component-card">
                  <span className="doc-pill text-mono" style={{ borderColor: '#ec4899', color: '#ec4899' }}>FRONTIER</span>
                  <h3>Frontier Reasoning Model</h3>
                  <p>High-intelligence tier (e.g. GPT-4o, Claude 3.5 Sonnet) priced at $2.50–3.00 / 1M input tokens and $10.00–15.00 / 1M output tokens (~380–420ms).</p>
                </div>
              </div>
            </section>

            {/* Section 3: Mathematical Model */}
            <section className="docs-section">
              <h2 className="docs-title">3. Deterministic Cost &amp; Latency Formulation</h2>
              <p>
                ComputeCanvas computes economics deterministically using standard provider pricing metrics:
              </p>
              <div className="docs-code-block">
                <code>
{`// 1. Effective Uncached Volume
UncachedRequests = TotalRequests × (1 - CacheHitRate)

// 2. Model Inference Cost
ModelSpend = ∑ [ UncachedRequests × RouteShare × 
  ((InputTokens / 1M × InputPrice) + (OutputTokens / 1M × OutputPrice)) ]

// 3. Infrastructure Spend
InfraSpend = (TotalRequests / 1M × GatewayFee)
           + (CacheBase + MemoryFee)
           + (VectorDBBase + UncachedRequests × QueryFee)

Total Monthly Spend = ModelSpend + InfraSpend`}
                </code>
              </div>
              <p style={{ marginTop: 'var(--space-4)' }}>
                <strong>Estimated P95 Latency Model:</strong>
              </p>
              <div className="docs-code-block">
                <code>
{`CacheHitLatency  = IngressLatency + CacheLookupLatency (~17 ms)
CacheMissLatency = IngressLatency + CacheLookupLatency + RouterLatency + VectorLookupLatency + ModelInferenceLatency
Estimated P95    = (CacheHitRate × CacheHitLatency) + ((1 - CacheHitRate) × CacheMissLatency)`}
                </code>
              </div>
            </section>

            {/* Section 4: Anchor to My Bill */}
            <section className="docs-section">
              <h2 className="docs-title">4. &ldquo;Anchor to My Bill&rdquo; Calibration</h2>
              <p>
                Theoretical formulas often underestimate real-world cloud bills due to retry loops, system prompt overhead, agent tool definitions, or background token spikes.
              </p>
              <p>
                Entering your <strong>Last Month&apos;s AI Bill</strong> and <strong>Monthly Request Count</strong> calculates your actual empirical cost-per-request and applies a proportional calibration scale across your architecture. This enables you to test potential changes (e.g. &ldquo;What if we route 70% of traffic to Gemini Flash?&rdquo;) while remaining anchored to your real baseline.
              </p>
            </section>

            {/* Section 5: Zero-Backend Link Sharing */}
            <section className="docs-section">
              <h2 className="docs-title">5. Zero-Backend State Sharing</h2>
              <p>
                ComputeCanvas uses RFC 4648 § 5 Base64URL client serialization. Clicking <strong>Share Architecture</strong> encodes the complete graph topology, workload sliders, and calibration parameters directly into the URL hash or query string (`/simulator?data=...`).
              </p>
              <p>
                There is <strong>no backend database</strong> and <strong>no account required</strong>. Recipients receive the exact same architecture, components, and economics instantaneously.
              </p>
            </section>

            {/* Section 6: Limitations */}
            <section className="docs-section">
              <h2 className="docs-title">6. Intended Use &amp; Limitations</h2>
              <p>
                ComputeCanvas is an architecture planning and comparative decision instrument. It models steady-state expected behavior under specified traffic assumptions. It is not an invoice guarantee, an observability APM, or an automated cloud billing sync.
              </p>
            </section>

            <div className="docs-cta-card">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Evaluate your system in the simulator</h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
                Open the interactive canvas to build an architecture and see its economics update in real time.
              </p>
              <Link href="/simulator" className="btn btn-primary" style={{ marginTop: 'var(--space-4)', display: 'inline-flex' }}>
                Open Simulator &rarr;
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      <style jsx>{`
        .docs-page {
          min-height: 100vh;
          padding-top: 100px;
          padding-bottom: var(--space-16);
          background: var(--color-bg);
        }
        .docs-header {
          padding-bottom: var(--space-8);
          border-bottom: 1px solid var(--color-border);
          margin-bottom: var(--space-8);
        }
        .docs-subtitle {
          color: var(--color-text-secondary);
          font-size: 1.0625rem;
          margin-top: var(--space-3);
          line-height: 1.5;
        }
        .docs-body {
          display: flex;
          flex-direction: column;
          gap: var(--space-8);
        }
        .docs-section {
          background: var(--color-bg-elevated);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-6);
        }
        .docs-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--color-text);
          margin-bottom: var(--space-3);
        }
        .docs-components-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--space-4);
          margin-top: var(--space-4);
        }
        .doc-component-card {
          background: var(--color-bg-surface);
          border: 1px solid var(--color-border-subtle);
          border-radius: var(--radius-md);
          padding: var(--space-4);
        }
        .doc-component-card h3 {
          font-size: 0.9375rem;
          font-weight: 600;
          margin: 6px 0;
        }
        .doc-component-card p {
          font-size: 0.8125rem;
          color: var(--color-text-secondary);
          line-height: 1.4;
          margin: 0;
        }
        .doc-pill {
          font-size: 0.5625rem;
          font-weight: 700;
          border: 1px solid;
          border-radius: 3px;
          padding: 1px 5px;
          display: inline-block;
        }
        .docs-code-block {
          background: var(--color-surface, #0d0d11);
          border: 1px solid var(--color-border-strong);
          border-radius: var(--radius-md);
          padding: var(--space-4);
          font-family: var(--font-mono);
          font-size: 0.8125rem;
          color: var(--color-cost);
          overflow-x: auto;
          line-height: 1.6;
        }
        .docs-cta-card {
          background: radial-gradient(circle at top right, rgba(99, 102, 241, 0.12) 0%, transparent 60%), var(--color-bg-elevated);
          border: 1px solid var(--color-border-strong);
          border-radius: var(--radius-lg);
          padding: var(--space-8);
        }
        @media (max-width: 768px) {
          .docs-components-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
