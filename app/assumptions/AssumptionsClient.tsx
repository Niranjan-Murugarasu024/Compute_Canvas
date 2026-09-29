'use client';

import Navigation from '@/components/navigation/Navigation';
import { Footer } from '@/components/sections/LandingSections';
import Link from 'next/link';
import { MODEL_PRICING, INFRA_PRICING } from '@/lib/simulation/engine';

export default function AssumptionsClient() {
  const fastModels = Object.entries(MODEL_PRICING).filter(([_, m]) => m.category === 'fast');
  const frontierModels = Object.entries(MODEL_PRICING).filter(([_, m]) => m.category === 'frontier');

  return (
    <>
      <Navigation />
      <main className="assumptions-page">
        <div className="container">
          <div className="section-header-block" style={{ marginBottom: 'var(--space-8)' }}>
            <span className="section-label">[TRANSPARENCY_SPECIFICATION]</span>
            <h1 className="section-heading">Pricing &amp; Simulation Assumptions</h1>
            <p className="section-lead">
              Every formula, unit price, latency expectation, and calibration curve used by ComputeCanvas is deterministic and publicly verifiable.
            </p>
            <div className="trust-disclaimer-box" role="note" style={{ marginTop: '20px' }}>
              <span className="trust-icon text-mono">[NOTE]</span>
              <p>
                <strong>Operational Scope: </strong>
                ComputeCanvas produces deterministic estimates based on configurable assumptions. It is designed for architectural comparison, planning, and pre-deployment cost modeling.
              </p>
            </div>
          </div>

          <div className="assumptions-sections">
            {/* Section 1: Fast Reasoning Models */}
            <section className="assumption-card">
              <div className="card-top-row">
                <span className="badge badge--neutral text-mono">TIER 1</span>
                <span className="card-date text-technical-label">UPDATED: Q1 2026</span>
              </div>
              <h2 className="card-title">Fast Reasoning Models (Low Latency / High Volume)</h2>
              <p className="card-desc">
                Ideal for classification, routing, extraction, and sub-150ms interactive UI workflows.
              </p>

              <div className="table-responsive">
                <table className="assumptions-data-table text-mono">
                  <thead>
                    <tr>
                      <th>Model</th>
                      <th>Provider</th>
                      <th>Input / 1M Tokens</th>
                      <th>Output / 1M Tokens</th>
                      <th>Baseline P95 Latency</th>
                      <th>Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fastModels.map(([id, m]) => (
                      <tr key={id}>
                        <td style={{ fontWeight: 500, color: 'var(--color-text)' }}>{m.product}</td>
                        <td>{m.provider}</td>
                        <td style={{ color: '#FFFFFF' }}>${m.inputPricePer1M.toFixed(2)}</td>
                        <td style={{ color: '#FFFFFF' }}>${m.outputPricePer1M.toFixed(2)}</td>
                        <td style={{ color: '#D4D4D8' }}>{m.baselineLatencyMs} ms</td>
                        <td className="text-caption text-mono" style={{ color: 'var(--color-text-muted)' }}>{m.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Section 2: Frontier Reasoning Models */}
            <section className="assumption-card">
              <div className="card-top-row">
                <span className="badge badge--neutral text-mono">TIER 2</span>
                <span className="card-date text-technical-label">UPDATED: Q1 2026</span>
              </div>
              <h2 className="card-title">Frontier Reasoning Models (Complex Synthesis &amp; Code)</h2>
              <p className="card-desc">
                Highest reasoning depth, multi-step problem solving, complex agent workflows, and critical synthesis.
              </p>

              <div className="table-responsive">
                <table className="assumptions-data-table text-mono">
                  <thead>
                    <tr>
                      <th>Model</th>
                      <th>Provider</th>
                      <th>Input / 1M Tokens</th>
                      <th>Output / 1M Tokens</th>
                      <th>Baseline P95 Latency</th>
                      <th>Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {frontierModels.map(([id, m]) => (
                      <tr key={id}>
                        <td style={{ fontWeight: 600, color: 'var(--color-text)' }}>{m.product}</td>
                        <td>{m.provider}</td>
                        <td style={{ color: 'var(--color-cost)' }}>${m.inputPricePer1M.toFixed(2)}</td>
                        <td style={{ color: 'var(--color-cost)' }}>${m.outputPricePer1M.toFixed(2)}</td>
                        <td style={{ color: 'var(--color-performance)' }}>{m.baselineLatencyMs} ms</td>
                        <td className="text-caption" style={{ color: 'var(--color-text-muted)' }}>{m.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Section 3: Infrastructure Assumptions */}
            <section className="assumption-card">
              <div className="card-top-row">
                <span className="badge badge--neutral text-mono">INFRASTRUCTURE TIERS</span>
              </div>
              <h2 className="card-title">Cache, Vector DB, and Ingress Pricing</h2>
              <p className="card-desc">
                Modeled after enterprise cloud equivalents (Redis Cloud, Pinecone, AWS API Gateway).
              </p>

              <div className="table-responsive">
                <table className="assumptions-data-table text-mono">
                  <thead>
                    <tr>
                      <th>Component</th>
                      <th>Base Monthly Cost</th>
                      <th>Variable Query Fee</th>
                      <th>Modeled Latency</th>
                      <th>Representative Benchmark</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: 600 }}>API Ingress Gateway</td>
                      <td>$0 / mo</td>
                      <td style={{ color: 'var(--color-cost)' }}>${INFRA_PRICING.apiGateway.perMillionRequests.toFixed(2)} / 1M req</td>
                      <td style={{ color: 'var(--color-performance)' }}>{INFRA_PRICING.apiGateway.latencyMs} ms</td>
                      <td>AWS HTTP API Gateway</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600 }}>Semantic Cache</td>
                      <td>${INFRA_PRICING.cache.baseMonthlyCost} / mo</td>
                      <td style={{ color: 'var(--color-cost)' }}>${INFRA_PRICING.cache.perGBHour} / GB-hr</td>
                      <td style={{ color: 'var(--color-performance)' }}>{INFRA_PRICING.cache.lookupLatencyMs} ms</td>
                      <td>Redis Cloud High-Availability</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600 }}>Complexity Router</td>
                      <td>$0 / mo</td>
                      <td style={{ color: 'var(--color-cost)' }}>${INFRA_PRICING.router.perMillionRequests.toFixed(2)} / 1M req</td>
                      <td style={{ color: 'var(--color-performance)' }}>{INFRA_PRICING.router.latencyMs} ms</td>
                      <td>Edge Router Rule Evaluator</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600 }}>Vector Database (RAG)</td>
                      <td>${INFRA_PRICING.vectorDb.baseMonthlyCost} / mo</td>
                      <td style={{ color: 'var(--color-cost)' }}>${INFRA_PRICING.vectorDb.perMillionQueries.toFixed(2)} / 1M queries</td>
                      <td style={{ color: 'var(--color-performance)' }}>{INFRA_PRICING.vectorDb.lookupLatencyMs} ms</td>
                      <td>Pinecone Serverless / Qdrant</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Section 4: Calibration Methodology */}
            <section className="assumption-card">
              <h2 className="card-title">&ldquo;Anchor to My Bill&rdquo; Calibration Methodology</h2>
              <p className="card-desc" style={{ marginBottom: 'var(--space-4)' }}>
                Theoretical models often miss retry storms, preamble prompts, tool definitions, or background token usage. Calibration reconciles this discrepancy:
              </p>

              <div className="formula-box text-mono">
                <p>1. Actual Cost Per Request = Last Month&apos;s AI Bill / Monthly Requests</p>
                <p>2. Calibration Factor = Actual Bill / Baseline Simulated Spend</p>
                <p>3. Calibrated Monthly Cost = Raw Simulated Spend × Calibration Factor</p>
              </div>

              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: 'var(--space-4)', lineHeight: 1.6 }}>
                <strong>Integrity Guarantee:</strong> Calibration scales model token consumption proportionally to match your historical empirical bill. It does <em>not</em> arbitrarily fake individual service rates or invent artificial line items.
              </p>
            </section>

            {/* CTA */}
            <div className="assumptions-cta-banner">
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Ready to simulate your architecture?</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
                  Design custom pipelines and see your cost and latency change in real-time.
                </p>
              </div>
              <Link href="/simulator" className="btn btn-primary" style={{ flexShrink: 0 }}>
                Open Simulator
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      <style jsx>{`
        .assumptions-page {
          min-height: 100vh;
          padding-top: calc(var(--nav-height) + 40px);
          padding-bottom: var(--space-16);
          background: var(--color-bg);
        }
        .trust-disclaimer-box {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          background: var(--color-bg-surface);
          border: 1px solid var(--color-border-strong);
          border-radius: var(--radius-sm);
          padding: 12px 16px;
          margin-top: var(--space-6);
          max-width: 1120px;
        }
        .trust-icon {
          font-size: 0.8125rem;
          color: var(--color-text-secondary);
          flex-shrink: 0;
          padding-top: 2px;
        }
        .trust-disclaimer-box p {
          margin: 0;
          font-size: 0.875rem;
          color: var(--color-text-secondary);
          line-height: 1.5;
        }
        .assumptions-sections {
          display: flex;
          flex-direction: column;
          gap: var(--space-8);
          max-width: 1120px;
        }
        .assumption-card {
          background: var(--color-bg-elevated);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          padding: var(--space-6);
        }
        .card-top-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-2);
        }
        .card-date {
          color: var(--color-text-muted);
        }
        .card-title {
          font-family: var(--font-display);
          font-size: 1.25rem;
          font-weight: 600;
          letter-spacing: -0.01em;
          margin: 0 0 6px 0;
        }
        .card-desc {
          color: var(--color-text-secondary);
          font-size: 0.875rem;
          line-height: 1.5;
          margin: 0 0 var(--space-4) 0;
        }
        .table-responsive {
          overflow-x: auto;
        }
        .assumptions-data-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.8125rem;
        }
        .assumptions-data-table th,
        .assumptions-data-table td {
          border: 1px solid var(--color-border);
          padding: 8px 12px;
          text-align: left;
        }
        .assumptions-data-table th {
          background: var(--color-bg-surface);
          color: var(--color-text-secondary);
          font-weight: 500;
          letter-spacing: 0.03em;
        }
        .formula-box {
          background: var(--color-bg-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          padding: 14px 18px;
          font-size: 0.8125rem;
          color: var(--color-text);
          line-height: 1.7;
        }
        .formula-box p {
          margin: 0;
        }
        .assumptions-cta-banner {
          background: var(--color-bg-elevated);
          border: 1px solid var(--color-border-strong);
          border-radius: var(--radius-sm);
          padding: var(--space-8);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: var(--space-6);
        }
        @media (max-width: 768px) {
          .assumptions-cta-banner {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </>
  );
}
