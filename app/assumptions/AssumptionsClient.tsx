'use client';

import { useState } from 'react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSnapshot, setSelectedSnapshot] = useState('ALL');
  const [selectedSourceType, setSelectedSourceType] = useState('ALL');
  const [sortField, setSortField] = useState<'id' | 'name' | 'value' | 'snapshot'>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const fastModels = Object.entries(MODEL_PRICING).filter(([, m]) => m.category === 'fast');
  const frontierModels = Object.entries(MODEL_PRICING).filter(([, m]) => m.category === 'frontier');

  // Extract available filter values from the authoritative registry
  const availableSnapshots = Array.from(
    new Set(ASSUMPTION_REGISTRY.map(a => a.snapshot || a.effectiveDate || '2026-03'))
  );

  const availableSourceTypes = Array.from(
    new Set(ASSUMPTION_REGISTRY.map(a => a.sourceType).filter(Boolean) as string[])
  );

  // Filter and sort assumption records (instant evaluation on 16 registry records)
  const filteredAssumptions = ASSUMPTION_REGISTRY.filter(a => {
    // 1. Text search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matches =
        a.id.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        (a.source && a.source.toLowerCase().includes(q)) ||
        (a.notes && a.notes.toLowerCase().includes(q)) ||
        (a.unit && a.unit.toLowerCase().includes(q)) ||
        ((a.snapshot || a.effectiveDate || '').toLowerCase().includes(q));
      if (!matches) return false;
    }

    // 2. Snapshot filter
    if (selectedSnapshot !== 'ALL') {
      const snap = a.snapshot || a.effectiveDate || '2026-03';
      if (snap !== selectedSnapshot) return false;
    }

    // 3. Source type filter
    if (selectedSourceType !== 'ALL') {
      const st = a.sourceType || 'INTERNAL REFERENCE';
      if (st !== selectedSourceType) return false;
    }

    return true;
  }).sort((a, b) => {
    let comparison = 0;
    if (sortField === 'value') {
      const valA = typeof a.value === 'number' ? a.value : parseFloat(String(a.value)) || 0;
      const valB = typeof b.value === 'number' ? b.value : parseFloat(String(b.value)) || 0;
      comparison = valA - valB;
    } else if (sortField === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (sortField === 'snapshot') {
      const snapA = a.snapshot || a.effectiveDate || '';
      const snapB = b.snapshot || b.effectiveDate || '';
      comparison = snapA.localeCompare(snapB);
    } else {
      comparison = a.id.localeCompare(b.id);
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleSort = (field: 'id' | 'name' | 'value' | 'snapshot') => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const isFiltered = searchQuery !== '' || selectedSnapshot !== 'ALL' || selectedSourceType !== 'ALL';

  return (
    <>
      <Navigation />
      <main className="assumptions-page">
        <div className="container">
          <div className="section-header-block" style={{ marginBottom: 'var(--space-8)' }}>
            <h1 className="section-heading">Model Assumption Registry</h1>
            <p className="section-lead">
              Every formula, unit price, latency baseline, and calibration parameter used by ComputeCanvas is deterministic and publicly traceable. Prices reflect an immutable point-in-time snapshot.
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
            {/* Section 0: Centralized Assumption Registry */}
            <section className="assumption-card">
              <div className="card-top-row">
                <span className="badge badge--primary text-mono">SOURCE OF TRUTH</span>
                <span className="card-date text-technical-label">
                  {isFiltered
                    ? `SHOWING ${filteredAssumptions.length} OF ${ASSUMPTION_REGISTRY.length} PARAMETER ASSUMPTIONS`
                    : `${ASSUMPTION_REGISTRY.length} PARAMETER ASSUMPTIONS`}
                </span>
              </div>
              <h2 className="card-title">Model Assumption Registry</h2>
              <p className="card-desc">
                Centralized registry of all simulation variables, provider unit rates, and network baselines with verifiable citations.
              </p>

              {/* Engineering Controls Bar: Search, Filters, and Reset */}
              <div className="registry-controls-bar">
                <div className="registry-search-wrap">
                  <svg className="registry-search-icon" width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <circle cx="7" cy="7" r="5" stroke="#71717A" strokeWidth="1.5" />
                    <path d="M11 11L14.5 14.5" stroke="#71717A" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by ID, parameter, source, notes..."
                    className="registry-search-input text-mono"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    aria-label="Search assumption registry"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="registry-search-clear text-mono"
                      onClick={() => setSearchQuery('')}
                      aria-label="Clear search input"
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="registry-filters-group">
                  <label className="registry-filter-label text-mono">
                    <span className="filter-label-text">SNAPSHOT:</span>
                    <select
                      value={selectedSnapshot}
                      onChange={e => setSelectedSnapshot(e.target.value)}
                      className="registry-select text-mono"
                      aria-label="Filter by snapshot"
                    >
                      <option value="ALL">ALL SNAPSHOTS</option>
                      {availableSnapshots.map(snap => (
                        <option key={snap} value={snap}>{snap.toUpperCase()}</option>
                      ))}
                    </select>
                  </label>

                  <label className="registry-filter-label text-mono">
                    <span className="filter-label-text">SOURCE:</span>
                    <select
                      value={selectedSourceType}
                      onChange={e => setSelectedSourceType(e.target.value)}
                      className="registry-select text-mono"
                      aria-label="Filter by source type"
                    >
                      <option value="ALL">ALL SOURCE TYPES</option>
                      {availableSourceTypes.map(st => (
                        <option key={st} value={st}>{st.toUpperCase()}</option>
                      ))}
                    </select>
                  </label>

                  {isFiltered && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm text-mono registry-reset-btn"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedSnapshot('ALL');
                        setSelectedSourceType('ALL');
                      }}
                    >
                      RESET FILTERS
                    </button>
                  )}
                </div>
              </div>

              <div className="table-responsive">
                <table className="assumptions-data-table text-mono">
                  <thead>
                    <tr>
                      <th scope="col" aria-sort={sortField === 'id' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}>
                        <button
                          type="button"
                          className="table-sort-btn text-mono"
                          onClick={() => handleSort('id')}
                          aria-label={`Sort by Assumption ID, currently ${sortField === 'id' ? sortOrder : 'unsorted'}`}
                        >
                          <span>ASSUMPTION ID</span>
                          <span className="sort-indicator" aria-hidden="true">
                            {sortField === 'id' ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}
                          </span>
                        </button>
                      </th>
                      <th scope="col" aria-sort={sortField === 'name' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}>
                        <button
                          type="button"
                          className="table-sort-btn text-mono"
                          onClick={() => handleSort('name')}
                          aria-label={`Sort by Parameter Name, currently ${sortField === 'name' ? sortOrder : 'unsorted'}`}
                        >
                          <span>PARAMETER NAME</span>
                          <span className="sort-indicator" aria-hidden="true">
                            {sortField === 'name' ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}
                          </span>
                        </button>
                      </th>
                      <th scope="col" style={{ textAlign: 'right' }} aria-sort={sortField === 'value' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}>
                        <button
                          type="button"
                          className="table-sort-btn text-mono"
                          style={{ justifyContent: 'flex-end', width: '100%' }}
                          onClick={() => handleSort('value')}
                          aria-label={`Sort by Default Value, currently ${sortField === 'value' ? sortOrder : 'unsorted'}`}
                        >
                          <span>DEFAULT VALUE</span>
                          <span className="sort-indicator" aria-hidden="true">
                            {sortField === 'value' ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}
                          </span>
                        </button>
                      </th>
                      <th scope="col">UNIT</th>
                      <th scope="col" style={{ textAlign: 'center' }}>SOURCE TYPE</th>
                      <th scope="col">PRIMARY SOURCE</th>
                      <th scope="col" style={{ textAlign: 'center' }} aria-sort={sortField === 'snapshot' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}>
                        <button
                          type="button"
                          className="table-sort-btn text-mono"
                          style={{ justifyContent: 'center', width: '100%' }}
                          onClick={() => handleSort('snapshot')}
                          aria-label={`Sort by Snapshot, currently ${sortField === 'snapshot' ? sortOrder : 'unsorted'}`}
                        >
                          <span>SNAPSHOT</span>
                          <span className="sort-indicator" aria-hidden="true">
                            {sortField === 'snapshot' ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}
                          </span>
                        </button>
                      </th>
                      <th scope="col">TECHNICAL CONTEXT / NOTES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssumptions.map(a => (
                      <tr key={a.id}>
                        <td className="cell-id text-mono">{a.id}</td>
                        <td className="cell-name">{a.name}</td>
                        <td className="cell-value text-mono">
                          {typeof a.value === 'number' ? (a.value < 1 ? a.value.toFixed(2) : a.value.toFixed(2)) : a.value}
                        </td>
                        <td className="cell-unit">{a.unit}</td>
                        <td className="cell-source-type">
                          <span className="badge badge--neutral text-mono" style={{ fontSize: '0.6875rem' }}>
                            {a.sourceType || 'INTERNAL REFERENCE'}
                          </span>
                        </td>
                        <td className="cell-source">
                          {a.sourceUrl ? (
                            <a
                              href={a.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="registry-link"
                            >
                              {a.source}
                            </a>
                          ) : (
                            <span style={{ color: '#71717A' }}>{a.source || 'Internal reference assumption'}</span>
                          )}
                        </td>
                        <td className="cell-snapshot text-mono">{a.snapshot || a.effectiveDate || '2026-03'}</td>
                        <td className="cell-notes">{a.notes}</td>
                      </tr>
                    ))}

                    {filteredAssumptions.length === 0 && (
                      <tr>
                        <td colSpan={8} className="registry-empty-state">
                          <div style={{ padding: '36px 16px', textAlign: 'center', color: '#71717A' }}>
                            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', marginBottom: '8px', color: '#D4D4D8' }}>
                              No assumptions match &ldquo;{searchQuery}&rdquo;
                            </p>
                            <p style={{ fontSize: '0.8125rem', marginBottom: '16px' }}>
                              Try adjusting your query, snapshot, or source type filters.
                            </p>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm text-mono"
                              onClick={() => {
                                setSearchQuery('');
                                setSelectedSnapshot('ALL');
                                setSelectedSourceType('ALL');
                              }}
                            >
                              Reset Filters
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
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

              <div className="text-mono" style={{ fontSize: '0.78125rem', color: '#A1A1AA', background: '#141417', padding: '8px 12px', borderRadius: '3px', border: '1px solid var(--color-border)', margin: '10px 0 14px' }}>
                PRICING SNAPSHOT: <strong style={{ color: '#FFFFFF' }}>MARCH 2026</strong> · NOT LIVE PROVIDER PRICING · REGISTRY: <strong style={{ color: '#FFFFFF' }}>v1.4</strong> · STATUS: <span style={{ color: 'var(--color-success, #4ADE80)' }}>ACTIVE</span>
              </div>

              <div className="table-responsive">
                <table className="assumptions-data-table text-mono">
                  <thead>
                    <tr>
                      <th scope="col">Model ID</th>
                      <th scope="col">Display Name</th>
                      <th scope="col">Provider</th>
                      <th scope="col" style={{ textAlign: 'right' }}>Input / 1M</th>
                      <th scope="col" style={{ textAlign: 'right' }}>Output / 1M</th>
                      <th scope="col" style={{ textAlign: 'right' }}>Baseline Latency</th>
                      <th scope="col" style={{ textAlign: 'center' }}>Source Type</th>
                      <th scope="col" style={{ textAlign: 'center' }}>Status</th>
                      <th scope="col">Benchmark Citation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fastModels.map(([id, m]) => (
                      <tr key={id}>
                        <td className="cell-id text-mono">{id}</td>
                        <td style={{ fontWeight: 500, color: 'var(--color-text)' }}>{m.product}</td>
                        <td>{m.provider}</td>
                        <td style={{ color: '#FFFFFF', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>${m.inputPricePer1M.toFixed(2)}</td>
                        <td style={{ color: '#FFFFFF', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>${m.outputPricePer1M.toFixed(2)}</td>
                        <td style={{ color: '#D4D4D8', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{m.baselineLatencyMs} ms</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="badge badge--neutral text-mono" style={{ fontSize: '0.6875rem' }}>
                            {m.sourceType || 'PROVIDER'}
                          </span>
                        </td>
                        <td style={{ color: 'var(--color-success, #4ADE80)', textAlign: 'center', fontWeight: 600 }}>{m.status || 'ACTIVE'}</td>
                        <td className="text-caption text-mono" style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
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

              <div className="text-mono" style={{ fontSize: '0.78125rem', color: '#A1A1AA', background: '#141417', padding: '8px 12px', borderRadius: '3px', border: '1px solid var(--color-border)', margin: '10px 0 14px' }}>
                PRICING SNAPSHOT: <strong style={{ color: '#FFFFFF' }}>MARCH 2026</strong> · NOT LIVE PROVIDER PRICING · REGISTRY: <strong style={{ color: '#FFFFFF' }}>v1.4</strong> · STATUS: <span style={{ color: 'var(--color-success, #4ADE80)' }}>ACTIVE</span>
              </div>

              <div className="table-responsive">
                <table className="assumptions-data-table text-mono">
                  <thead>
                    <tr>
                      <th scope="col">Model ID</th>
                      <th scope="col">Display Name</th>
                      <th scope="col">Provider</th>
                      <th scope="col" style={{ textAlign: 'right' }}>Input / 1M</th>
                      <th scope="col" style={{ textAlign: 'right' }}>Output / 1M</th>
                      <th scope="col" style={{ textAlign: 'right' }}>Baseline Latency</th>
                      <th scope="col" style={{ textAlign: 'center' }}>Source Type</th>
                      <th scope="col" style={{ textAlign: 'center' }}>Status</th>
                      <th scope="col">Benchmark Citation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {frontierModels.map(([id, m]) => (
                      <tr key={id}>
                        <td className="cell-id text-mono">{id}</td>
                        <td style={{ fontWeight: 600, color: 'var(--color-text)' }}>{m.product}</td>
                        <td>{m.provider}</td>
                        <td style={{ color: '#FAFAFA', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>${m.inputPricePer1M.toFixed(2)}</td>
                        <td style={{ color: '#FAFAFA', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>${m.outputPricePer1M.toFixed(2)}</td>
                        <td style={{ color: '#FAFAFA', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{m.baselineLatencyMs} ms</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="badge badge--neutral text-mono" style={{ fontSize: '0.6875rem' }}>
                            {m.sourceType || 'PROVIDER'}
                          </span>
                        </td>
                        <td style={{ color: 'var(--color-success, #4ADE80)', textAlign: 'center', fontWeight: 600 }}>{m.status || 'ACTIVE'}</td>
                        <td className="text-caption text-mono" style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
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
                      <th scope="col">Benchmark / Standard</th>
                      <th scope="col">Evaluated Criteria</th>
                      <th scope="col">Primary Reference</th>
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
                            className="registry-link"
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

            {/* Section 4: Infrastructure Assumptions */}
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
                      <th scope="col">Component</th>
                      <th scope="col">Base Monthly Cost</th>
                      <th scope="col">Variable Query Fee</th>
                      <th scope="col">Modeled Latency</th>
                      <th scope="col">Representative Benchmark</th>
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

            {/* Section 5: Calibration Methodology */}
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

            {/* Section 6: Model Limitations */}
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
                OPEN WORKBENCH →
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
          width: 100%;
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
          gap: 12px;
          flex-wrap: wrap;
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
          color: #FFFFFF;
        }

        .card-desc {
          color: var(--color-text-secondary);
          font-size: 0.875rem;
          line-height: 1.5;
          margin: 0 0 var(--space-4) 0;
        }

        /* ── Registry Controls Bar ── */
        .registry-controls-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 12px 14px;
          background: #141418;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          margin-bottom: var(--space-4);
          flex-wrap: wrap;
        }

        .registry-search-wrap {
          position: relative;
          display: flex;
          align-items: center;
          flex: 1;
          min-width: 260px;
        }

        .registry-search-icon {
          position: absolute;
          left: 10px;
          pointer-events: none;
        }

        .registry-search-input {
          width: 100%;
          background: #09090B;
          border: 1px solid var(--color-border);
          border-radius: 2px;
          padding: 8px 30px 8px 32px;
          color: #FFFFFF;
          font-size: 0.8125rem;
          outline: none;
          transition: border-color 0.12s ease;
        }

        .registry-search-input:focus {
          border-color: #FFFFFF;
        }

        .registry-search-input::placeholder {
          color: #71717A;
        }

        .registry-search-clear {
          position: absolute;
          right: 8px;
          background: none;
          border: none;
          color: #A1A1AA;
          font-size: 1.125rem;
          line-height: 1;
          cursor: pointer;
          padding: 2px 4px;
        }

        .registry-search-clear:hover {
          color: #FFFFFF;
        }

        .registry-filters-group {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .registry-filter-label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.6875rem;
          color: #A1A1AA;
          letter-spacing: 0.04em;
        }

        .registry-select {
          background: #09090B;
          border: 1px solid var(--color-border);
          border-radius: 2px;
          padding: 7px 10px;
          color: #FAFAFA;
          font-size: 0.75rem;
          outline: none;
          cursor: pointer;
          transition: border-color 0.12s ease;
        }

        .registry-select:focus {
          border-color: #FFFFFF;
        }

        .registry-reset-btn {
          height: 32px;
          padding: 0 10px;
          font-size: 0.6875rem;
          border: 1px solid var(--color-border);
        }

        /* ── Table & Cells ── */
        .table-responsive {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
        }

        .assumptions-data-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }

        .assumptions-data-table th,
        .assumptions-data-table td {
          border: 1px solid var(--color-border);
          padding: 10px 14px;
          text-align: left;
          vertical-align: middle;
        }

        .assumptions-data-table th {
          background: var(--color-bg-surface);
          color: #A1A1AA;
          font-weight: 600;
          font-size: 0.75rem;
          letter-spacing: 0.04em;
          white-space: nowrap;
        }

        .table-sort-btn {
          background: none;
          border: none;
          color: inherit;
          font: inherit;
          padding: 0;
          margin: 0;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          width: 100%;
        }

        .table-sort-btn:hover {
          color: #FFFFFF;
        }

        .table-sort-btn:focus-visible {
          outline: 2px solid var(--color-accent);
          outline-offset: 2px;
        }

        .sort-indicator {
          font-size: 0.6875rem;
          color: #71717A;
        }

        .table-sort-btn:hover .sort-indicator {
          color: #FFFFFF;
        }

        .cell-id {
          min-width: 175px;
          white-space: nowrap;
          color: #A1A1AA;
          font-weight: 600;
          letter-spacing: -0.01em;
        }

        .cell-name {
          min-width: 220px;
          color: #FFFFFF;
          font-weight: 500;
        }

        .cell-value {
          min-width: 110px;
          text-align: right;
          color: #FAFAFA;
          font-weight: 600;
          font-variant-numeric: tabular-nums;
        }

        .cell-unit {
          min-width: 140px;
          white-space: nowrap;
          color: #71717A;
        }

        .cell-source-type {
          min-width: 130px;
          text-align: center;
        }

        .cell-source {
          min-width: 180px;
        }

        .cell-snapshot {
          min-width: 90px;
          text-align: center;
          color: #A1A1AA;
        }

        .cell-notes {
          min-width: 260px;
          color: #A1A1AA;
          font-size: 0.75rem;
          line-height: 1.5;
        }

        .registry-link {
          color: #FAFAFA;
          text-decoration: underline;
          text-underline-offset: 2px;
          transition: color 0.12s ease;
        }

        .registry-link:hover {
          color: #FFFFFF;
        }

        .registry-link:focus-visible {
          outline: 2px solid var(--color-accent);
          outline-offset: 2px;
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
          .registry-controls-bar {
            flex-direction: column;
            align-items: stretch;
          }
          .registry-search-wrap {
            min-width: 100%;
          }
          .registry-filters-group {
            width: 100%;
            justify-content: space-between;
          }
          .assumptions-cta-banner {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </>
  );
}
