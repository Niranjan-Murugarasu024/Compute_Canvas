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
          <div className="docs-header">
            <span className="badge badge--neutral">SPECIFICATION &bull; v2.6</span>
            <h1 className="text-display" style={{ fontSize: '2.5rem', marginTop: 'var(--space-2)' }}>
              Deterministic Simulation Engine
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.0625rem', marginTop: 'var(--space-2)' }}>
              How ComputeCanvas calculates inference cost, queue latencies, token economics, and bottleneck thresholds without stochastic hallucinations.
            </p>
          </div>

          <div className="docs-body">
            <section className="docs-section">
              <h2 className="docs-title">1. The Principle of Determinism</h2>
              <p>
                In production AI systems, LLMs are non-deterministic, but cloud bills and physics are not. ComputeCanvas enforces a strict rule: <strong>LLMs are used only for requirement interpretation and architectural recommendations; numerical calculations are 100% deterministic</strong>.
              </p>
            </section>

            <section className="docs-section">
              <h2 className="docs-title">2. Cost Calculation Formula</h2>
              <div className="docs-code-block">
                <code>
{`Total Monthly Cost = 
  ∑ (Requests_eff × (InputTokens × InputPrice + OutputTokens × OutputPrice))
  + ∑ VectorDB_Base + (Retrievals × CostPerQuery)
  + ∑ Cache_Storage + (CacheHitRate × MemoryCost)
  + ∑ API_Gateway + Egress_GB × PricePerGB`}
                </code>
              </div>
              <p style={{ marginTop: 'var(--space-3)' }}>
                Where <code>Requests_eff = Requests × (1 - CacheHitRate)</code>. When prompt caching or semantic caching is enabled, token pricing reflects provider-specific cache read discounts (e.g. Anthropic prompt caching 90% discount on cache hits).
              </p>
            </section>

            <section className="docs-section">
              <h2 className="docs-title">3. Latency Estimation (P95)</h2>
              <p>
                Latency is modeled as a composite pipeline with queuing effects under concurrency:
              </p>
              <div className="docs-code-block">
                <code>
{`P95 Latency = 
  Time_To_First_Token (TTFT)
  + (OutputTokens × InterTokenLatency)
  + RetrievalLatency × (1 - CacheHitRate)
  + NetworkRoundTrip × RegionHopCount
  + ConcurrencyPenalty(Concurrency, TierLimits)`}
                </code>
              </div>
            </section>

            <section className="docs-section">
              <h2 className="docs-title">4. Capacity Utilization &amp; Saturation</h2>
              <p>
                Capacity utilization tracks the ratio of peak concurrency against vendor rate limits (TPM - Tokens Per Minute, and RPM - Requests Per Minute). Once utilization exceeds 85%, queue contention increases non-linearly. At &gt;100%, rate limits reject requests with HTTP 429 errors.
              </p>
            </section>

            <div className="docs-cta-card">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Test the simulation yourself</h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
                Open the interactive canvas to tweak parameters and observe the formula output in real-time.
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
          font-weight: 600;
          color: var(--color-text);
          margin-bottom: var(--space-3);
        }
        .docs-code-block {
          background: var(--color-surface);
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
          background: radial-gradient(circle at top right, rgba(255, 255, 255, 0.04) 0%, transparent 60%), var(--color-bg-elevated);
          border: 1px solid var(--color-border-strong);
          border-radius: var(--radius-lg);
          padding: var(--space-6);
        }
      `}</style>
    </>
  );
}
