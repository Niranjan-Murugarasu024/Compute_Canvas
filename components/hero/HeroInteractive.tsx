'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  simulate,
  formatCurrency,
  formatLatency,
  formatNumber,
  type Workload,
  type Architecture,
} from '@/lib/simulation/engine';
import { useArchitectureStore } from '@/lib/state/architectureStore';

// Canonical V1 Architecture for Hero Live Instrument
const HERO_V1_ARCHITECTURE: Architecture = {
  nodes: [
    { id: 'api-ingress', type: 'api', label: 'API Ingress', x: 40, y: 70 },
    { id: 'semantic-cache', type: 'cache', label: 'Semantic Cache', x: 190, y: 70 },
    { id: 'complexity-router', type: 'router', label: 'Complexity Router', x: 350, y: 70 },
    { id: 'fast-model', type: 'fast-model', label: 'Fast Model', x: 510, y: 35 },
    { id: 'frontier-model', type: 'frontier-model', label: 'Frontier Model', x: 510, y: 105 },
  ],
  edges: [
    { source: 'api-ingress', target: 'semantic-cache' },
    { source: 'semantic-cache', target: 'complexity-router' },
    { source: 'complexity-router', target: 'fast-model', trafficShare: 0.70 },
    { source: 'complexity-router', target: 'frontier-model', trafficShare: 0.30 },
  ],
};

export default function HeroInteractive() {
  const router = useRouter();
  const { loadArchitecture } = useArchitectureStore();

  const [monthlyRequests, setMonthlyRequests] = useState(2_500_000);
  const [cacheHitRate, setCacheHitRate] = useState(0.60);
  const [fastModelRouting, setFastModelRouting] = useState(0.70);

  // Dynamic workload based on user hero sliders
  const workload: Workload = useMemo(() => ({
    requestsPerMonth: monthlyRequests,
    avgInputTokens: 1200,
    avgOutputTokens: 400,
    concurrency: 60,
    cacheHitRate,
    retrievalsPerRequest: 0,
    toolCallsPerRequest: 0,
  }), [monthlyRequests, cacheHitRate]);

  // Dynamic architecture reflecting routing
  const activeArch: Architecture = useMemo(() => {
    return {
      ...HERO_V1_ARCHITECTURE,
      edges: HERO_V1_ARCHITECTURE.edges.map(e => {
        if (e.source === 'complexity-router' && e.target === 'fast-model') {
          return { ...e, trafficShare: fastModelRouting };
        }
        if (e.source === 'complexity-router' && e.target === 'frontier-model') {
          return { ...e, trafficShare: Math.round((1 - fastModelRouting) * 100) / 100 };
        }
        return e;
      }),
    };
  }, [fastModelRouting]);

  // Pure deterministic simulation calculation
  const sim = useMemo(() => simulate(workload, activeArch), [workload, activeArch]);

  // Savings relative to zero cache
  const noCacheSim = useMemo(() => simulate({ ...workload, cacheHitRate: 0 }, activeArch), [workload, activeArch]);
  const estimatedSavings = Math.max(0, noCacheSim.monthlyCost - sim.monthlyCost);

  const handleOpenWorkbench = () => {
    loadArchitecture(activeArch, workload);
    router.push('/simulator');
  };

  return (
    <section className="tech-hero">
      <div className="container">
        <div className="tech-hero__grid">
          {/* Left Column: Technical Narrative & Actions */}
          <div className="tech-hero__left">
            <div className="tech-hero__meta-strip">
              <span className="coordinate-tag text-mono">[SYS_SPEC: V1.2]</span>
              <span className="dot-divider" />
              <span className="meta-label text-mono">PRE-DEPLOYMENT ARCHITECTURE ECONOMICS</span>
            </div>

            <h1 className="tech-hero__title">
              <span className="hero-title-main">DESIGN AI SYSTEMS.</span>
              <span className="hero-title-sub">See the economics before you build.</span>
            </h1>

            <p className="tech-hero__lead">
              Model your architecture, adjust workload assumptions, and understand how infrastructure decisions affect cost and latency before writing deployment code.
            </p>

            <div className="tech-hero__cta-group">
              <Link href="/simulator" className="btn btn-primary tech-hero__btn-main">
                OPEN SIMULATOR &rarr;
              </Link>
              <Link href="/templates" className="btn btn-secondary tech-hero__btn-sec">
                EXPLORE TEMPLATES
              </Link>
              <Link href="/assumptions" className="tech-hero__link-assumptions">
                PRICING ASSUMPTIONS &rarr;
              </Link>
            </div>

            <div className="tech-hero__specs-footer">
              <div className="spec-item">
                <span className="spec-label text-mono">ENGINE</span>
                <span className="spec-val text-mono">Pure Deterministic</span>
              </div>
              <div className="spec-item">
                <span className="spec-label text-mono">DATA PERSISTENCE</span>
                <span className="spec-val text-mono">0 Backend // URL State</span>
              </div>
              <div className="spec-item">
                <span className="spec-label text-mono">CALIBRATION</span>
                <span className="spec-val text-mono">Empirical Invoice Scalar</span>
              </div>
            </div>
          </div>

          {/* Right Column: Live Interactive Architecture Instrument */}
          <div className="tech-hero__right">
            <div className="instrument-shell">
              {/* Instrument Header Bar */}
              <div className="instrument-header">
                <div className="instrument-title-row">
                  <span className="instrument-live-tag text-mono">● LIVE INSTRUMENT</span>
                  <span className="instrument-model-tag text-mono">TOPOLOGY: ROUTER + CACHE</span>
                </div>
                <button
                  onClick={handleOpenWorkbench}
                  className="btn btn-ghost btn-sm text-mono"
                  style={{ border: '1px solid var(--color-border)', fontSize: '0.625rem', padding: '3px 8px' }}
                >
                  OPEN IN WORKBENCH &rarr;
                </button>
              </div>

              {/* Blueprint Topology View */}
              <div className="instrument-svg-wrap">
                <svg viewBox="0 0 660 140" className="instrument-svg" aria-label="Architecture Topology">
                  <defs>
                    <pattern id="hero-grid-pat" width="20" height="20" patternUnits="userSpaceOnUse">
                      <circle cx="1" cy="1" r="0.8" fill="var(--color-border-strong)" />
                    </pattern>
                    <marker id="hero-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                      <polygon points="0 0, 6 3, 0 6" fill="#A1A1AA" />
                    </marker>
                  </defs>

                  <rect width="100%" height="100%" fill="url(#hero-grid-pat)" opacity="0.4" />

                  {/* Edges */}
                  <line x1="120" y1="70" x2="190" y2="70" stroke="#3F3F46" strokeWidth="1.5" markerEnd="url(#hero-arrow)" />
                  <line x1="290" y1="70" x2="350" y2="70" stroke="#3F3F46" strokeWidth="1.5" markerEnd="url(#hero-arrow)" />
                  <path d="M 450 70 C 480 70, 480 35, 510 35" stroke="#3F3F46" strokeWidth="1.5" fill="none" markerEnd="url(#hero-arrow)" />
                  <path d="M 450 70 C 480 70, 480 105, 510 105" stroke="#3F3F46" strokeWidth="1.5" fill="none" markerEnd="url(#hero-arrow)" />

                  {/* Animated Traffic Particles */}
                  <circle r="2" fill="#FFFFFF">
                    <animateMotion dur="1.8s" repeatCount="indefinite" path="M 120 70 L 190 70" />
                  </circle>
                  <circle r="2" fill="#FFFFFF">
                    <animateMotion dur="1.8s" repeatCount="indefinite" path="M 290 70 L 350 70" />
                  </circle>
                  <circle r="2" fill="#A1A1AA">
                    <animateMotion dur="2.2s" repeatCount="indefinite" path="M 450 70 C 480 70, 480 35, 510 35" />
                  </circle>
                  <circle r="2" fill="#A1A1AA">
                    <animateMotion dur="2.2s" repeatCount="indefinite" path="M 450 70 C 480 70, 480 105, 510 105" />
                  </circle>

                  {/* Routing Percent Badges */}
                  <text x="475" y="44" fill="#A1A1AA" fontSize="8" fontFamily="var(--font-mono)" fontWeight="600">
                    {Math.round(fastModelRouting * 100)}%
                  </text>
                  <text x="475" y="102" fill="#A1A1AA" fontSize="8" fontFamily="var(--font-mono)" fontWeight="600">
                    {Math.round((1 - fastModelRouting) * 100)}%
                  </text>

                  {/* Node 1: API Ingress */}
                  <g transform="translate(20, 52)">
                    <rect width="100" height="36" rx="2" fill="#18181B" stroke="#3F3F46" strokeWidth="1" />
                    <text x="10" y="15" fill="#71717A" fontSize="7" fontFamily="var(--font-mono)" letterSpacing="0.08em">GATEWAY</text>
                    <text x="10" y="27" fill="#F4F4F5" fontSize="10" fontFamily="var(--font-ui)" fontWeight="500">API Ingress</text>
                  </g>

                  {/* Node 2: Semantic Cache */}
                  <g transform="translate(190, 52)">
                    <rect width="100" height="36" rx="2" fill="#18181B" stroke="#3F3F46" strokeWidth="1" />
                    <text x="10" y="15" fill="#71717A" fontSize="7" fontFamily="var(--font-mono)" letterSpacing="0.08em">CACHE</text>
                    <text x="10" y="27" fill="#F4F4F5" fontSize="10" fontFamily="var(--font-ui)" fontWeight="500">Semantic Cache</text>
                  </g>

                  {/* Node 3: Complexity Router */}
                  <g transform="translate(350, 52)">
                    <rect width="100" height="36" rx="2" fill="#18181B" stroke="#3F3F46" strokeWidth="1" />
                    <text x="10" y="15" fill="#71717A" fontSize="7" fontFamily="var(--font-mono)" letterSpacing="0.08em">ROUTER</text>
                    <text x="10" y="27" fill="#F4F4F5" fontSize="10" fontFamily="var(--font-ui)" fontWeight="500">Complexity Router</text>
                  </g>

                  {/* Node 4: Fast Model */}
                  <g transform="translate(510, 17)">
                    <rect width="115" height="36" rx="2" fill="#18181B" stroke="#3F3F46" strokeWidth="1" />
                    <text x="10" y="15" fill="#71717A" fontSize="7" fontFamily="var(--font-mono)" letterSpacing="0.08em">FAST TIER</text>
                    <text x="10" y="27" fill="#F4F4F5" fontSize="10" fontFamily="var(--font-ui)" fontWeight="500">Fast Model (140ms)</text>
                  </g>

                  {/* Node 5: Frontier Model (Bottleneck highlighted) */}
                  <g transform="translate(510, 87)">
                    <rect width="115" height="36" rx="2" fill="#18181B" stroke="#FFFFFF" strokeWidth="1.5" />
                    <rect x="75" y="4" width="36" height="11" rx="1" fill="#FFFFFF" />
                    <text x="93" y="12" textAnchor="middle" fill="#09090B" fontSize="6.5" fontFamily="var(--font-mono)" fontWeight="700">BOTTLENECK</text>
                    <text x="10" y="15" fill="#71717A" fontSize="7" fontFamily="var(--font-mono)" letterSpacing="0.08em">FRONTIER</text>
                    <text x="10" y="27" fill="#F4F4F5" fontSize="10" fontFamily="var(--font-ui)" fontWeight="500">Frontier Model</text>
                  </g>
                </svg>
              </div>

              {/* Live Sliders Instrument */}
              <div className="instrument-controls-strip">
                <div className="instrument-control-block">
                  <div className="control-label-row">
                    <span className="control-title text-mono">WORKLOAD VOLUME</span>
                    <span className="control-value text-mono">{formatNumber(monthlyRequests)} REQ / MO</span>
                  </div>
                  <input
                    type="range"
                    min={200_000}
                    max={15_000_000}
                    step={100_000}
                    value={monthlyRequests}
                    onChange={e => setMonthlyRequests(Number(e.target.value))}
                    className="tech-slider"
                  />
                </div>

                <div className="instrument-control-block">
                  <div className="control-label-row">
                    <span className="control-title text-mono">CACHE HIT RATE</span>
                    <span className="control-value text-mono">{Math.round(cacheHitRate * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={0.85}
                    step={0.05}
                    value={cacheHitRate}
                    onChange={e => setCacheHitRate(Number(e.target.value))}
                    className="tech-slider"
                  />
                </div>

                <div className="instrument-control-block">
                  <div className="control-label-row">
                    <span className="control-title text-mono">FAST MODEL ROUTING</span>
                    <span className="control-value text-mono">{Math.round(fastModelRouting * 100)}% FAST / {Math.round((1 - fastModelRouting) * 100)}% FRONTIER</span>
                  </div>
                  <input
                    type="range"
                    min={0.1}
                    max={0.9}
                    step={0.05}
                    value={fastModelRouting}
                    onChange={e => setFastModelRouting(Number(e.target.value))}
                    className="tech-slider"
                  />
                </div>
              </div>

              {/* Instrument Digital Readouts Table */}
              <div className="instrument-readouts-table">
                <div className="readout-row readout-row--primary">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span className="readout-label text-mono">MONTHLY SPEND</span>
                    <span className="text-mono" style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', letterSpacing: '0.04em' }}>USD / MONTH</span>
                  </div>
                  <span className="readout-num text-mono">{formatCurrency(sim.monthlyCost)}</span>
                </div>
                <div className="readout-grid-3">
                  <div className="readout-col">
                    <span className="readout-col-label text-mono">COST / 1K REQ</span>
                    <span className="readout-col-val text-mono">${(sim.costPerRequest * 1000).toFixed(3)}</span>
                  </div>
                  <div className="readout-col">
                    <span className="readout-col-label text-mono">P95 LATENCY</span>
                    <span className="readout-col-val text-mono">{formatLatency(sim.p95Latency)}</span>
                  </div>
                  <div className="readout-col">
                    <span className="readout-col-label text-mono">CACHE DELTA</span>
                    <span className="readout-col-val text-mono">-{formatCurrency(estimatedSavings)}/MO</span>
                  </div>
                </div>
                <div className="readout-footnote text-mono">
                  <span>DIAGNOSTIC: {sim.bottleneck.componentName.toUpperCase()} CONTRIBUTES {sim.bottleneck.impactPercentage}% TO {sim.bottleneck.metricType.toUpperCase()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .tech-hero {
          width: 100%;
          padding-top: calc(var(--nav-height) + 48px);
          padding-bottom: var(--space-8);
          background: #09090B;
          border-bottom: 1px solid var(--color-border);
        }
        .tech-hero__grid {
          display: grid;
          grid-template-columns: 1fr 1.18fr;
          gap: 56px;
          align-items: flex-start;
        }
        .tech-hero__left {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .tech-hero__meta-strip {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .coordinate-tag {
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          color: #A1A1AA;
          letter-spacing: 0.08em;
          font-weight: 500;
        }
        .dot-divider {
          width: 3px;
          height: 3px;
          background: #3F3F46;
          border-radius: 50%;
        }
        .meta-label {
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          color: #71717A;
          letter-spacing: 0.08em;
        }
        .tech-hero__title {
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .hero-title-main {
          display: block;
          font-family: var(--font-display);
          font-size: clamp(40px, 4.4vw, 68px);
          font-weight: 600;
          line-height: 1.0;
          letter-spacing: -0.03em;
          color: #FFFFFF;
        }
        .hero-title-sub {
          display: block;
          font-family: var(--font-display);
          font-size: clamp(26px, 2.8vw, 44px);
          font-weight: 500;
          line-height: 1.1;
          letter-spacing: -0.02em;
          color: #A1A1AA;
        }
        .tech-hero__lead {
          font-family: var(--font-sans);
          font-size: 1.0625rem;
          color: #A1A1AA;
          line-height: 1.6;
          max-width: 600px;
          margin: 0;
        }
        .tech-hero__cta-group {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          margin-top: 4px;
        }
        .tech-hero__btn-main {
          height: 44px;
          padding: 0 20px;
          border-radius: 3px;
          font-family: var(--font-sans);
          font-size: 0.875rem;
          font-weight: 600;
          letter-spacing: 0.02em;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .tech-hero__btn-sec {
          height: 44px;
          padding: 0 18px;
          border-radius: 3px;
          font-family: var(--font-sans);
          font-size: 0.875rem;
          font-weight: 500;
          letter-spacing: 0.02em;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .tech-hero__link-assumptions {
          font-family: var(--font-sans);
          font-size: 0.875rem;
          font-weight: 500;
          color: #A1A1AA;
          text-decoration: none;
          letter-spacing: 0.02em;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 8px 4px;
          transition: color 150ms ease;
        }
        .tech-hero__link-assumptions:hover {
          color: #FFFFFF;
        }
        .tech-hero__specs-footer {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          padding-top: 24px;
          margin-top: 12px;
          border-top: 1px solid var(--color-border);
        }
        .spec-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .spec-label {
          font-family: var(--font-mono);
          font-size: 0.625rem;
          color: #71717A;
          letter-spacing: 0.08em;
        }
        .spec-val {
          font-family: var(--font-sans);
          font-size: 0.8125rem;
          color: #D4D4D8;
          font-weight: 500;
        }

        /* ── Right Column: Instrument Shell ── */
        .instrument-shell {
          background: #101012;
          border: 1px solid var(--color-border);
          border-radius: 4px;
          overflow: hidden;
        }
        .instrument-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 20px;
          background: #141418;
          border-bottom: 1px solid var(--color-border);
        }
        .instrument-title-row {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .instrument-live-tag {
          font-family: var(--font-sans);
          font-size: 0.75rem;
          color: #FFFFFF;
          letter-spacing: 0.06em;
          font-weight: 600;
        }
        .instrument-model-tag {
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          color: #71717A;
          letter-spacing: 0.06em;
        }
        .instrument-svg-wrap {
          background: #09090B;
          padding: 16px 20px;
          border-bottom: 1px solid var(--color-border);
        }
        .instrument-svg {
          width: 100%;
          height: auto;
          display: block;
        }
        .instrument-controls-strip {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          background: #101012;
          border-bottom: 1px solid var(--color-border);
        }
        .instrument-control-block {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .control-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .control-title {
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          color: #A1A1AA;
          letter-spacing: 0.08em;
        }
        .control-value {
          font-family: var(--font-mono);
          font-size: 0.75rem;
          color: #FFFFFF;
          font-weight: 500;
          font-variant-numeric: tabular-nums;
        }
        .tech-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 3px;
          background: #242428;
          outline: none;
          border-radius: 1px;
        }
        .tech-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 12px;
          height: 12px;
          background: #FFFFFF;
          cursor: pointer;
          border-radius: 1px;
          border: 1px solid #09090B;
        }
        .tech-slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          background: #FFFFFF;
          cursor: pointer;
          border-radius: 1px;
          border: 1px solid #09090B;
        }
        .instrument-readouts-table {
          padding: 20px;
          background: #09090B;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .readout-row--primary {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          padding-bottom: 14px;
          border-bottom: 1px solid var(--color-border);
        }
        .readout-label {
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          letter-spacing: 0.08em;
          color: #A1A1AA;
        }
        .readout-num {
          font-family: var(--font-mono);
          font-size: 1.875rem;
          font-weight: 500;
          color: #FFFFFF;
          letter-spacing: -0.02em;
          font-variant-numeric: tabular-nums;
        }
        .readout-grid-3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        .readout-col {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .readout-col-label {
          font-family: var(--font-mono);
          font-size: 0.625rem;
          letter-spacing: 0.08em;
          color: #71717A;
        }
        .readout-col-val {
          font-family: var(--font-mono);
          font-size: 0.9375rem;
          font-weight: 500;
          color: #F4F4F5;
          font-variant-numeric: tabular-nums;
        }
        .readout-footnote {
          padding-top: 10px;
          border-top: 1px solid var(--color-border);
          font-family: var(--font-mono);
          font-size: 0.625rem;
          color: #71717A;
          letter-spacing: 0.06em;
        }

        @media (max-width: 1080px) {
          .tech-hero__grid {
            grid-template-columns: 1fr;
            gap: 48px;
          }
        }
        @media (max-width: 640px) {
          .tech-hero {
            padding-top: calc(var(--nav-height) + 24px);
            padding-bottom: var(--space-6);
          }
          .tech-hero__specs-footer {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          .readout-grid-3 {
            grid-template-columns: 1fr;
            gap: 12px;
          }
        }
      `}</style>
    </section>
  );
}
