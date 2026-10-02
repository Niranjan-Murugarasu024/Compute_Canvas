'use client';

import Navigation from '@/components/navigation/Navigation';
import { Footer } from '@/components/sections/LandingSections';
import Link from 'next/link';
import {
  MODEL_PRICING,
  INFRA_PRICING,
  MODEL_METADATA,
  ASSUMPTION_REGISTRY,
  QUALITY_BENCHMARK_METHODOLOGY,
} from '@/lib/simulation/engine';

export default function AssumptionsClient() {
  const fastModels = Object.entries(MODEL_PRICING).filter(([_, m]) => m.category === 'fast');
  const frontierModels = Object.entries(MODEL_PRICING).filter(([_, m]) => m.category === 'frontier');

  return (
    <>
      <Navigation />
      <main className="assumptions-page">
        <div className="container">
          <div className="section-header-block" style={{ marginBottom: 'var(--space-8)' }}>
            <h1 className="section-heading">Model Assumption Registry</h1>
            <p className="section-lead">
              Every formula, unit price, latency baseline, and calibration parameter used by ComputeCanvas is deterministic and publicly traceable. Prices reflect a point-in-time snapshot.
            </p>

            {/* Model Metadata & Provenance Strip (Section 11) */}
            <div className="model-metadata-strip text-mono" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', padding: '12px 16px', background: '#141417', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '0.75rem', marginTop: '16px' }}>
              <div><span style={{ color: '#71717A' }}>ENGINE: </span><strong style={{ color: '#FFFFFF' }}>{MODEL_METADATA.engineVersion}</strong></div>
              <div><span style={{ color: '#71717A' }}>PRICING EFFECTIVE: </span><strong style={{ color: '#FFFFFF' }}>{MODEL_METADATA.pricingAssumptionsDate}</strong></div>
              <div><span style={{ color: '#71717A' }}>LATENCY BENCHMARKS: </span><strong style={{ color: '#FFFFFF' }}>{MODEL_METADATA.latencyAssumptionsDate}</strong></div>
              <div><span style={{ color: '#71717A' }}>DATA MODE: </span><strong style={{ color: '#FFFFFF' }}>DETERMINISTIC SIMULATION</strong></div>
            </div>

            <div className="trust-disclaimer-box" role="note" style={{ marginTop: '16px' }}>
              <span className="trust-icon text-mono">[NOTE]</span>
              <p>
                <strong>Operational Scope: </strong>
                ComputeCanvas produces deterministic estimates based on configurable assumptions and published provider benchmarks. It is designed for architectural comparison, planning, and pre-deployment cost modeling.
              </p>
            </div>
          </div>

          <div className="assumptions-sections">
            {/* Section 0: Centralized Assumption Registry (Section 10) */}
            <section className="assumption-card">
              <div className="card-top-row">
                <span className="badge badge--primary text-mono">SOURCE OF TRUTH</span>
                <span className="card-date text-technical-label">16 MODEL ASSUMPTIONS</span>
              </div>
              <h2 className="card-title">Model Assumption Registry</h2>
              <p className="card-desc">
                Centralized registry of all simulation variables, provider unit rates, and network baselines with verifiable citations.
              </p>

              <div className="table-responsive">
                <table className="assumptions-data-table text-mono">
                  <thead>
                    <tr>
                      <th>Assumption ID</th>
                      <th>Parameter Name</th>
                      <th>Default Value</th>
                      <th>Unit</th>
                      <th>Source Type</th>
                      <th>Primary Source</th>
                      <th>Snapshot</th>
                      <th>Technical Context / Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ASSUMPTION_REGISTRY.map(a => (
                      <tr key={a.id}>
                        <td style={{ color: '#A1A1AA', fontWeight: 600 }}>{a.id}</td>
                        <td style={{ color: '#FFFFFF', fontWeight: 500 }}>{a.name}</td>
                        <td style={{ color: '#FAFAFA' }}>{a.value}</td>
                        <td style={{ color: '#71717A' }}>{a.unit}</td>
                        <td>
                          <span className="badge badge--neutral text-mono" style={{ fontSize: '0.625rem' }}>
                            {a.sourceType || 'INTERNAL REFERENCE'}
                          </span>
                        </td>
                        <td>
                          {a.sourceUrl ? (
                            <a href={a.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#FAFAFA', textDecoration: 'underline' }}>
                              {a.source}
                            </a>
                          ) : (
                            <span style={{ color: '#A1A1AA' }}>{a.source || 'Internal reference assumption'}</span>
                          )}
                        </td>
                        <td style={{ color: '#71717A' }}>{a.snapshot || a.effectiveDate || '2026-03'}</td>
                        <td style={{ color: '#A1A1AA', fontSize: '0.6875rem' }}>{a.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Section 1: Fast Reasoning Models */}
            <section className="assumption-card">
              <div className="card-top-row">
                <span className="badge badge--neutral text-mono">TIER 1 FAST</span>
                <span className="card-date text-technical-label">PRICING SNAPSHOT: MARCH 2026</span>
              </div>
              <h2 className="card-title">Fast Reasoning Models (Low Latency / High Volume)</h2>
              <p className="card-desc">
                Ideal for classification, routing, extraction, and sub-150ms interactive UI workflows.
              </p>

              <div className="text-mono" style={{ fontSize: '0.6875rem', color: '#A1A1AA', background: '#141417', padding: '6px 10px', borderRadius: '3px', border: '1px solid var(--color-border)', margin: '10px 0 14px' }}>
                PRICING SNAPSHOT: <strong style={{ color: '#FFFFFF' }}>MARCH 2026</strong> · NOT LIVE PROVIDER PRICING · REGISTRY: <strong style={{ color: '#FFFFFF' }}>v1.4</strong> · STATUS: <span style={{ color: 'var(--color-success, #4ADE80)' }}>ACTIVE</span>
              </div>

              <div className="table-responsive">
                <table className="assumptions-data-table text-mono">
                  <thead>
                    <tr>
                      <th>Model ID</th>
                      <th>Display Name</th>
                      <th>Provider</th>
                      <th>Input / 1M</th>
                      <th>Output / 1M</th>
                      <th>Baseline Latency</th>
                      <th>Source Type</th>
                      <th>Status</th>
                      <th>Benchmark Citation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fastModels.map(([id, m]) => (
                      <tr key={id}>
                        <td style={{ color: '#71717A', fontWeight: 600 }}>{id}</td>
                        <td style={{ fontWeight: 500, color: 'var(--color-text)' }}>{m.product}</td>
                        <td>{m.provider}</td>
                        <td style={{ color: '#FFFFFF' }}>${m.inputPricePer1M.toFixed(2)}</td>
                        <td style={{ color: '#FFFFFF' }}>${m.outputPricePer1M.toFixed(2)}</td>
                        <td style={{ color: '#D4D4D8' }}>{m.baselineLatencyMs} ms</td>
                        <td>
                          <span className="badge badge--neutral text-mono" style={{ fontSize: '0.5625rem' }}>
                            {m.sourceType || 'PROVIDER'}
                          </span>
                        </td>
                        <td style={{ color: 'var(--color-success, #4ADE80)' }}>{m.status || 'ACTIVE'}</td>
                        <td className="text-caption text-mono" style={{ color: 'var(--color-text-muted)' }}>
                          {m.qualityBenchmark}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Section 2: Frontier Reasoning Models */}
            <section className="assumption-card">
              <div className="card-top-row">
                <span className="badge badge--neutral text-mono">TIER 2 FRONTIER</span>
                <span className="card-date text-technical-label">PRICING SNAPSHOT: MARCH 2026</span>
              </div>
              <h2 className="card-title">Frontier Reasoning Models (Complex Synthesis &amp; Code)</h2>
              <p className="card-desc">
                Highest reasoning depth, multi-step problem solving, complex agent workflows, and critical synthesis.
              </p>

              <div className="text-mono" style={{ fontSize: '0.6875rem', color: '#A1A1AA', background: '#141417', padding: '6px 10px', borderRadius: '3px', border: '1px solid var(--color-border)', margin: '10px 0 14px' }}>
                PRICING SNAPSHOT: <strong style={{ color: '#FFFFFF' }}>MARCH 2026</strong> · NOT LIVE PROVIDER PRICING · REGISTRY: <strong style={{ color: '#FFFFFF' }}>v1.4</strong> · STATUS: <span style={{ color: 'var(--color-success, #4ADE80)' }}>ACTIVE</span>
              </div>

              <div className="table-responsive">
                <table className="assumptions-data-table text-mono">
                  <thead>
                    <tr>
                      <th>Model ID</th>
                      <th>Display Name</th>
                      <th>Provider</th>
                      <th>Input / 1M</th>
                      <th>Output / 1M</th>
                      <th>Baseline Latency</th>
                      <th>Source Type</th>
                      <th>Status</th>
                      <th>Benchmark Citation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {frontierModels.map(([id, m]) => (
                      <tr key={id}>
                        <td style={{ color: '#71717A', fontWeight: 600 }}>{id}</td>
                        <td style={{ fontWeight: 600, color: 'var(--color-text)' }}>{m.product}</td>
                        <td>{m.provider}</td>
                        <td style={{ color: '#FAFAFA' }}>${m.inputPricePer1M.toFixed(2)}</td>
                        <td style={{ color: '#FAFAFA' }}>${m.outputPricePer1M.toFixed(2)}</td>
                        <td style={{ color: '#FAFAFA' }}>{m.baselineLatencyMs} ms</td>
                        <td>
                          <span className="badge badge--neutral text-mono" style={{ fontSize: '0.5625rem' }}>
                            {m.sourceType || 'PROVIDER'}
                          </span>
                        </td>
                        <td style={{ color: 'var(--color-success, #4ADE80)' }}>{m.status || 'ACTIVE'}</td>
                        <td className="text-caption text-mono" style={{ color: 'var(--color-text-muted)' }}>
                          {m.qualityBenchmark}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Section 3: Model Capability Tiers & Citations */}
            <section className="assumption-card">
              <div className="card-top-row">
                <span className="badge badge--neutral text-mono">TAXONOMY</span>
                <span className="card-date text-technical-label">CITED BENCHMARKS</span>
              </div>
              <h2 className="card-title">Architectural Capability Tiers &amp; Grounding</h2>
              <p className="card-desc" style={{ marginBottom: 'var(--space-4)' }}>
                ComputeCanvas organizes architectures into discrete qualitative capability tiers rather than arbitrary single-percentage scores:
              </p>

              <div className="formula-box text-mono" style={{ marginBottom: 'var(--space-4)' }}>
                <p>• Frontier Reasoning: Pure frontier model reasoning (GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro) with deepest synthesis capacity.</p>
                <p>• Context-Grounded Frontier: Frontier model paired with active Vector Database retrieval for verifiable ground-truth synthesis.</p>
                <p>• Blended Routing: Complexity router steering requests between fast models and frontier models to balance cost and capability.</p>
                <p>• Fast Utility: Pure fast model execution for classification, routing, and low-latency throughput.</p>
              </div>

              <div className="table-responsive" style={{ marginTop: 'var(--space-4)' }}>
                <table className="assumptions-data-table text-mono">
                  <thead>
                    <tr>
                      <th>Benchmark / Standard</th>
                      <th>Evaluated Criteria</th>
                      <th>Primary Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {QUALITY_BENCHMARK_METHODOLOGY.citations.map((c, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600, color: 'var(--color-text)' }}>{c.name}</td>
                        <td>{c.metric}</td>
                        <td>
                          <a
                            href={c.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}
                          >
                            {c.url.replace(/^https?:\/\//, '')}
                          </a>
                        </td>
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
            </section>

            {/* Section 5: Model Limitations (Section 50) */}
            <section className="assumption-card" style={{ borderLeft: '3px solid #FFFFFF' }}>
              <div className="card-top-row">
                <span className="badge badge--neutral text-mono">DISCLOSURE</span>
                <span className="card-date text-technical-label">METHODOLOGY SCOPE</span>
              </div>
              <h2 className="card-title">Model Limitations &amp; Financial Disclaimer</h2>
              <p className="card-desc" style={{ marginBottom: 'var(--space-4)' }}>
                ComputeCanvas is a comparative architecture workbench for engineering trade-off analysis. It is not an invoice prediction guarantee.
              </p>

              <div className="formula-box text-mono" style={{ lineHeight: 1.8 }}>
                <p><strong>Actual production spend and latency depend on variables outside this model:</strong></p>
                <p>• Workload variance and non-uniform token distributions (long-tail outliers)</p>
                <p>• Real-world cache invalidation dynamics and dynamic prompt entropy</p>
                <p>• Provider pricing updates, volume commitments, and currency fluctuations</p>
                <p>• Infrastructure concurrency limits, rate-limit 429 retries, and network jitter</p>
                <p>• Secondary services outside the modeled graph (evaluators, guardrails, storage)</p>
              </div>

              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: 'var(--space-4)', lineHeight: 1.6 }}>
                Use ComputeCanvas results to compare alternative architectural topologies (e.g. evaluating whether adding a semantic cache amortizes latency and cost), not as legally binding financial invoice guarantees.
              </p>
            </section>

            {/* CTA */}
            <div className="assumptions-cta-banner">
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Ready to simulate your architecture?</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
                  Design custom topologies and inspect deterministic cost and latency updates across every component.
                </p>
              </div>
              <Link href="/simulator" className="btn btn-primary" style={{ flexShrink: 0 }}>
                Open Workbench
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      <style>{`
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
