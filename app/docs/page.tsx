'use client';

import Navigation from '@/components/navigation/Navigation';
import { Footer } from '@/components/sections/LandingSections';
import Link from 'next/link';

export default function DocsPage() {
  return (
    <>
      <Navigation />
      <main className="docs-page">
        <div className="container">
          {/* Header */}
          <div className="section-header-block" style={{ marginBottom: 'var(--space-8)' }}>
            <span className="badge badge--neutral text-mono" style={{ fontSize: '0.75rem', marginBottom: '12px', display: 'inline-block' }}>
              METHODOLOGY &amp; REFERENCE
            </span>
            <h1 className="section-heading">
              Architecture Planning &amp; Decision Instrument Guide
            </h1>
            <p className="section-lead">
              A comprehensive technical reference for ComputeCanvas: an architecture planning and comparative decision instrument for reasoning deterministically about AI systems, economics, latencies, and topological bottlenecks before deployment.
            </p>
          </div>

          <div className="docs-body" style={{ maxWidth: '960px' }}>
            {/* 1. Product Purpose */}
            <section className="docs-section">
              <h2 className="docs-title">1. Product Purpose</h2>
              <p>
                ComputeCanvas is an <strong>architecture planning and comparative decision instrument</strong>. It enables software architects, machine learning engineers, and engineering leadership to model generative AI systems visually and deterministically before writing production orchestration code or committing infrastructure spend.
              </p>
              <p>
                Rather than treating generative AI economics as an opaque post-deployment cloud invoice surprise, ComputeCanvas enables teams to answer:
              </p>
              <ul className="docs-list">
                <li>What will this topology cost per month under steady-state request volumes?</li>
                <li>How does adding a semantic cache shift our token expenditure and tail latency?</li>
                <li>Where is the primary critical-path bottleneck in our multi-stage pipeline?</li>
                <li>What is the deterministic causal consequence of switching 70% of traffic to a fast utility model?</li>
                <li>How can we prove and share these engineering trade-offs with verifiable reproducibility?</li>
              </ul>
            </section>

            {/* 2. Architecture Graph */}
            <section className="docs-section">
              <h2 className="docs-title">2. Architecture Graph &amp; Core Building Blocks</h2>
              <p>
                Systems in ComputeCanvas are modeled as directed acyclic topologies composed of six fundamental building blocks:
              </p>
              <div className="docs-components-grid">
                <div className="doc-component-card">
                  <span className="doc-pill text-mono">INGRESS</span>
                  <h3>API Ingress Gateway</h3>
                  <p>Handles incoming client traffic, edge TLS termination, and rate gating ($1.00 / 1M requests, ~12ms base latency).</p>
                </div>
                <div className="doc-component-card">
                  <span className="doc-pill text-mono">CACHE</span>
                  <h3>Semantic Cache</h3>
                  <p>Intercepts inbound queries to return cached completions, eliminating downstream token inference ($65/mo base + memory tier, ~5ms).</p>
                </div>
                <div className="doc-component-card">
                  <span className="doc-pill text-mono">ROUTER</span>
                  <h3>Complexity Router</h3>
                  <p>Evaluates prompt difficulty and dynamically steers queries between fast utility and high-depth frontier models ($0.50 / 1M requests, ~8ms).</p>
                </div>
                <div className="doc-component-card">
                  <span className="doc-pill text-mono">RETRIEVAL</span>
                  <h3>Vector Database</h3>
                  <p>Stores document chunk embeddings and executes vector similarity searches for RAG pipelines ($120/mo cluster + $0.20 / 1M queries, ~45ms).</p>
                </div>
                <div className="doc-component-card">
                  <span className="doc-pill text-mono">FAST MODEL</span>
                  <h3>Fast Reasoning Model</h3>
                  <p>Sub-150ms utility inference tier (e.g. GPT-4o Mini, Gemini 2.0 Flash) priced at $0.15 / 1M input and $0.60 / 1M output tokens.</p>
                </div>
                <div className="doc-component-card">
                  <span className="doc-pill text-mono">FRONTIER</span>
                  <h3>Frontier Reasoning Model</h3>
                  <p>High-intelligence tier (e.g. GPT-4o, Claude 3.5 Sonnet) priced at $2.50 / 1M input and $10.00 / 1M output tokens (~380–420ms).</p>
                </div>
              </div>
            </section>

            {/* 3. Workload Model */}
            <section className="docs-section">
              <h2 className="docs-title">3. Workload Model</h2>
              <p>
                Workloads define the operational traffic environment driving the architecture. Every simulation is parameterized by:
              </p>
              <ul className="docs-list">
                <li><strong>Monthly Requests:</strong> Inbound query volume across the billing cycle (e.g. 2,500,000 req/mo).</li>
                <li><strong>Average Input Tokens:</strong> User prompt tokens plus system preamble and context window load (default 1,200 tokens).</li>
                <li><strong>Average Output Tokens:</strong> Model completion length generated per uncached query (default 400 tokens).</li>
                <li><strong>Cache Hit Rate:</strong> Proportion of traffic intercepted before hitting LLM inference (0%–90%).</li>
                <li><strong>Concurrency:</strong> Peak concurrent execution threads, governing queue saturation and tail latency multiplier.</li>
              </ul>
            </section>

            {/* 4. Cost Model */}
            <section className="docs-section">
              <h2 className="docs-title">4. Cost Model Formulation</h2>
              <p>
                Economics are computed deterministically from active graph wires and unit rate specifications:
              </p>
              <div className="docs-code-block">
                <code>
{`// 1. Effective Uncached Requests
UncachedRequests = TotalRequests × (1 - CacheHitRate)

// 2. Model Inference Spend
ModelCost = ∑ [ UncachedRequests × RouteShare × 
  ((InputTokens / 1,000,000 × InputPrice) + (OutputTokens / 1,000,000 × OutputPrice)) ]

// 3. Infrastructure Fixed & Variable Spend
InfraCost = (TotalRequests / 1,000,000 × IngressTariff)
          + (CacheBaseCost + MemoryStorageAllocation)
          + (VectorDBClusterBase + UncachedRequests × QueryTariff)

// 4. Total Modeled Monthly Cost
ModeledMonthlyCost = ModelCost + InfraCost`}
                </code>
              </div>
            </section>

            {/* 5. Cache Model */}
            <section className="docs-section">
              <h2 className="docs-title">5. Cache Model</h2>
              <p>
                The Semantic Cache operates as an upstream filter. Hits terminate at the cache tier, incurring single-digit latency (~5ms) and zero downstream inference token charges. Misses pass through to the complexity router or models at full token unit rates.
              </p>
              <div className="docs-code-block">
                <code>
{`CacheHitTraffic   = TotalRequests × CacheHitRate       // Incurs 0 model inference cost
CacheMissTraffic  = TotalRequests × (1 - CacheHitRate) // Propagated downstream to model tiers
CacheMonthlyCost  = BaseInstanceCost ($65) + MemoryCost`}
                </code>
              </div>
            </section>

            {/* 6. Routing Model */}
            <section className="docs-section">
              <h2 className="docs-title">6. Complexity Routing Model</h2>
              <p>
                The Complexity Router splits uncached queries across downstream model tiers using normalized traffic shares:
              </p>
              <div className="docs-code-block">
                <code>
{`FastTierVolume     = CacheMissTraffic × FastRouteShare     // e.g. 70% to Fast Model
FrontierTierVolume = CacheMissTraffic × FrontierRouteShare // e.g. 30% to Frontier Model

// Conservation Constraint:
∑ RouteShares == 1.0 (Checked by graph validator)`}
                </code>
              </div>
            </section>

            {/* 7. Latency Model */}
            <section className="docs-section">
              <h2 className="docs-title">7. Latency Model &amp; Tail Decomposition</h2>
              <p>
                ComputeCanvas decomposes the critical execution path into individual network, queue, and computation stages. P95 latency is modeled from baseline component benchmarks scaled by non-linear concurrency queue factors:
              </p>
              <div className="docs-code-block">
                <code>
{`// Critical Path Latency Formulation
CacheHitLatency  = IngressLatency (~12ms) + CacheLookupLatency (~5ms) = ~17ms
CacheMissLatency = IngressLatency + CacheLookupLatency + RouterLatency (~8ms) 
                 + VectorSearchLatency (~45ms if present) + ModelInferenceLatency (~380ms)

QueueMultiplier  = (1 + (Concurrency / NominalCapacity))^1.8
ModeledP95       = ((CacheHitRate × CacheHitLatency) + ((1 - CacheHitRate) × CacheMissLatency)) × QueueMultiplier

// Modeled Percentiles:
ModeledP50 ≈ ModeledP95 × 0.65
ModeledP90 ≈ ModeledP95 × 0.90
ModeledP99 ≈ ModeledP95 × 1.35`}
                </code>
              </div>
            </section>

            {/* 8. Bottleneck Methodology */}
            <section className="docs-section">
              <h2 className="docs-title">8. Primary Bottleneck Methodology</h2>
              <p>
                Every simulation computes component-level cost percentages and critical-path latency contributions. The <strong>Primary Bottleneck</strong> identifies the single component exerting the greatest economic or latency pressure on the topology:
              </p>
              <ul className="docs-list">
                <li><strong>Economic Bottleneck:</strong> The component accounting for the largest percentage of total monthly spend (typically Frontier Model in unrouted architectures).</li>
                <li><strong>Latency Bottleneck:</strong> The critical-path stage contributing the highest tail duration (typically sequential retrieval or generation phases).</li>
              </ul>
            </section>

            {/* 9. Historical Bill Calibration */}
            <section className="docs-section">
              <h2 className="docs-title">9. Historical Bill Calibration (&ldquo;Anchor to My Bill&rdquo;)</h2>
              <p>
                Theoretical equations model steady-state prompt transactions. In production environments, unmodeled tokens (developer testing, retry loops, system preambles, and background agents) often create variance against list-price models.
              </p>
              <p>
                Entering your <strong>Last Month&apos;s AI Bill</strong> and <strong>Monthly Request Count</strong> establishes an empirical calibration factor (&kappa;):
              </p>
              <div className="docs-code-block">
                <code>
{`CalibrationFactor (κ) = ActualHistoricalBill / SimulatedTheoreticalBaselineCost
CalibratedMonthlyCost = ModeledMonthlyCost × κ`}
                </code>
              </div>
              <p style={{ marginTop: '8px' }}>
                This preserves your historical empirical reality while allowing you to deterministically explore comparative architectural optimizations.
              </p>
            </section>

            {/* 10. Model Assumption Registry */}
            <section className="docs-section">
              <h2 className="docs-title">10. Model Assumption Registry</h2>
              <p>
                All unit prices, latency baselines, and infrastructure parameters originate from the public <Link href="/assumptions" style={{ color: '#FFFFFF', textDecoration: 'underline' }}>Model Assumption Registry</Link>. Each entry documents:
              </p>
              <ul className="docs-list">
                <li><strong>Pricing Snapshot:</strong> Point-in-time timestamp (Snapshot 2026-03).</li>
                <li><strong>Source Type:</strong> Provider published documentation or internal reference benchmark.</li>
                <li><strong>Registry Version:</strong> Immutable schema and rate tier identifier (v1.4).</li>
                <li><strong>Status:</strong> Active validation status.</li>
              </ul>
            </section>

            {/* 11. URL Sharing & Reproducibility */}
            <section className="docs-section">
              <h2 className="docs-title">11. Zero-Backend URL Sharing &amp; Reproducibility</h2>
              <p>
                ComputeCanvas implements pure client-side state serialization under RFC 4648 &sect; 5 Base64URL. Clicking <strong>Share Architecture</strong> encodes the complete topology, workload parameters, and calibration factors directly into the URL query parameter (<code>/simulator?data=...</code>).
              </p>
              <p>
                Every simulation generates a persistent snapshot identity (e.g. <code>CC-ROUTER-CACHE-ARC-2026-03-V1-4</code>) enabling verifiable reproduction across engineering teams, code reviews, and technical design documents without requiring server databases or user accounts.
              </p>
            </section>

            {/* 12. Comparison Mode */}
            <section className="docs-section">
              <h2 className="docs-title">12. Side-by-Side Architecture Comparison</h2>
              <p>
                The Workbench comparison mode contrasts your active design against the clean baseline architecture:
              </p>
              <ul className="docs-list">
                <li><strong>Economic Delta:</strong> Absolute and percentage monthly spend differences.</li>
                <li><strong>Latency Delta:</strong> Millisecond changes across P95 critical-path latency.</li>
                <li><strong>Topology Changes:</strong> Component additions, removals, and routing reallocation.</li>
              </ul>
            </section>

            {/* 13. Calculation Trace 2.0 */}
            <section className="docs-section">
              <h2 className="docs-title">13. Calculation Trace 2.0</h2>
              <p>
                The Calculation Trace exposes every intermediate arithmetic step between workload inputs and total monthly cost. It includes:
              </p>
              <ul className="docs-list">
                <li>Line-by-line token and dollar arithmetic.</li>
                <li>Interactive formula toggle for inspecting mathematical equations.</li>
                <li>One-click copyable markdown formatted for pull requests and architecture decision records (ADRs).</li>
              </ul>
            </section>

            {/* 14. Causal Delta 2.0 */}
            <section className="docs-section">
              <h2 className="docs-title">14. Causal Delta 2.0</h2>
              <p>
                Whenever an architecture or workload parameter changes, Causal Delta deconstructs the outcome into three structured stages:
              </p>
              <div className="docs-code-block">
                <code>
{`1. ARCHITECTURAL CHANGE    → What parameter or topology wire was altered?
2. DETERMINISTIC CAUSE     → Why did the simulation model shift?
3. ECONOMIC CONSEQUENCE    → What is the exact dollar and latency delta vs baseline?`}
                </code>
              </div>
            </section>

            {/* 15. Capability Taxonomy */}
            <section className="docs-section">
              <h2 className="docs-title">15. Capability Tiers &amp; Objective Trade-Offs</h2>
              <p>
                Rather than using subjective or marketing-biased scores, ComputeCanvas categorizes architectures into objective functional tiers:
              </p>
              <ul className="docs-list">
                <li><strong>Frontier Priority:</strong> Maximum reasoning depth for complex multi-step synthesis.</li>
                <li><strong>Context-Grounded Frontier:</strong> Frontier reasoning augmented with vector retrieval for domain grounding.</li>
                <li><strong>Blended Routing:</strong> Dynamic complexity classification balancing cost and capability across tiers.</li>
                <li><strong>Utility Priority:</strong> High-throughput, sub-150ms utility execution for extraction and classification.</li>
              </ul>
            </section>

            {/* 16. Intended Use & Limitations */}
            <section className="docs-section">
              <h2 className="docs-title">16. Operational Scope &amp; Limitations</h2>
              <p>
                ComputeCanvas produces deterministic estimates based on configurable assumptions and published provider benchmarks. It is designed for architectural comparison, planning, and pre-deployment cost modeling.
              </p>
              <div className="docs-code-block" style={{ marginTop: '8px' }}>
                <code>
{`// Model Disclosures:
- Results reflect steady-state traffic and published unit list pricing.
- Network jitter, rate-limit retries (HTTP 429), and traffic spikes alter real latency.
- Ancillary infrastructure (long-term object storage, custom fine-tuning) is outside scope.
- Use results to compare architecture trade-offs, not as legally binding billing guarantees.`}
                </code>
              </div>
            </section>

            {/* CTA */}
            <div className="docs-cta-card">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Evaluate your system in the workbench</h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
                Open the interactive canvas to build an architecture and see its economics update in real time.
              </p>
              <Link href="/simulator" className="btn btn-primary" style={{ marginTop: 'var(--space-4)', display: 'inline-flex' }}>
                Open Workbench &rarr;
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      <style>{`
        .docs-page {
          min-height: 100vh;
          padding-top: calc(var(--nav-height) + 40px);
          padding-bottom: var(--space-16);
          background: var(--color-bg);
        }
        .docs-body {
          display: flex;
          flex-direction: column;
          gap: var(--space-8);
          max-width: 960px;
          margin: 0;
        }
        .docs-section {
          background: var(--color-bg-elevated);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          padding: var(--space-6);
        }
        .docs-title {
          font-family: var(--font-display);
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--color-text);
          margin-bottom: var(--space-3);
        }
        .docs-list {
          margin: var(--space-3) 0 0 var(--space-5);
          color: var(--color-text-secondary);
          font-size: 0.90625rem;
          line-height: 1.6;
        }
        .docs-list li {
          margin-bottom: 6px;
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
          line-height: 1.45;
          margin: 0;
        }
        .doc-pill {
          font-family: var(--font-mono);
          font-size: 0.75rem;
          font-weight: 600;
          border: 1px solid var(--color-border);
          background: #141418;
          color: #A1A1AA;
          border-radius: 2px;
          padding: 3px 8px;
          display: inline-block;
          letter-spacing: 0.06em;
        }
        .docs-code-block {
          background: #09090B;
          border: 1px solid var(--color-border);
          border-radius: 3px;
          padding: var(--space-4);
          font-family: var(--font-mono);
          font-size: 0.8125rem;
          color: #F4F4F5;
          overflow-x: auto;
          line-height: 1.6;
        }
        .docs-cta-card {
          background: #101012;
          border: 1px solid var(--color-border);
          border-radius: 4px;
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
