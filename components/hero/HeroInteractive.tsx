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

// Canonical Router + Cache architecture used as live instrument
const HERO_ARCH: Architecture = {
  id: 'hero-router-cache',
  name: 'Router + Cache',
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

  const workload: Workload = useMemo(() => ({
    requestsPerMonth: monthlyRequests,
    avgInputTokens: 1200,
    avgOutputTokens: 400,
    concurrency: 60,
    cacheHitRate,
    retrievalsPerRequest: 0,
    toolCallsPerRequest: 0,
  }), [monthlyRequests, cacheHitRate]);

  const activeArch: Architecture = useMemo(() => ({
    ...HERO_ARCH,
    edges: HERO_ARCH.edges.map(e => {
      if (e.source === 'complexity-router' && e.target === 'fast-model') {
        return { ...e, trafficShare: fastModelRouting };
      }
      if (e.source === 'complexity-router' && e.target === 'frontier-model') {
        return { ...e, trafficShare: Math.round((1 - fastModelRouting) * 100) / 100 };
      }
      return e;
    }),
  }), [fastModelRouting]);

  const sim = useMemo(() => simulate(workload, activeArch), [workload, activeArch]);
  const noCacheSim = useMemo(() => simulate({ ...workload, cacheHitRate: 0 }, activeArch), [workload, activeArch]);
  const estimatedSavings = Math.max(0, noCacheSim.monthlyCost - sim.monthlyCost);

  const handleOpenWorkbench = () => {
    loadArchitecture(activeArch, workload);
    router.push('/simulator');
  };

  const frontierRouting = Math.round((1 - fastModelRouting) * 100);
  const fastRouting = Math.round(fastModelRouting * 100);

  return (
    <section className="hero" aria-label="ComputeCanvas live instrument">
      <div className="container">

        <div className="hero__grid">
          {/* Left: Editorial Narrative */}
          <div className="hero__narrative">
            <h1 className="hero__headline">
              Design the system.<br />
              <span className="hero__headline-secondary">Understand the bill.</span>
            </h1>

            <p className="hero__body">
              Model an AI architecture before deployment. See how cost, latency, and bottlenecks change as the system changes.
            </p>

            <div className="hero__actions">
              <button
                onClick={handleOpenWorkbench}
                className="btn btn-primary hero__cta"
                type="button"
              >
                OPEN WORKBENCH →
              </button>
              <Link href="/templates" className="btn btn-secondary hero__cta-secondary">
                Browse blueprints
              </Link>
            </div>

            {/* Technical provenance line */}
            <div className="hero__provenance text-mono">
              <span>Deterministic simulation engine</span>
              <span className="hero__provenance-sep" aria-hidden="true">·</span>
              <span>Pricing Snapshot 2026-03</span>
              <span className="hero__provenance-sep" aria-hidden="true">·</span>
              <span>Model-derived tail latency baselines</span>
            </div>
          </div>

          {/* Right: Live Architecture Instrument */}
          <div className="hero__instrument">
            {/* Instrument header */}
            <div className="instrument__header">
              <div className="instrument__title-row">
                <span className="instrument__arch-label text-mono">MODELED ARCHITECTURE</span>
                <span className="instrument__sep text-mono" aria-hidden="true">/</span>
                <span className="instrument__arch-name text-mono">ROUTER + CACHE</span>
              </div>
              <button
                onClick={handleOpenWorkbench}
                className="instrument__open text-mono"
                type="button"
              >
                OPEN IN WORKBENCH →
              </button>
            </div>

            {/* SVG Architecture diagram */}
            <div className="instrument__diagram" role="img" aria-label="Router + Cache architecture: API Ingress → Semantic Cache → Complexity Router → Fast Model (70%) / Frontier Model (30%)">
              <svg viewBox="0 0 640 130" className="instrument__svg" aria-hidden="true">
                <defs>
                  {/* Engineering grid */}
                  <pattern id="hgrid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1E1E22" strokeWidth="0.5" />
                  </pattern>
                  <marker id="harrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
                    <polygon points="0 0, 5 2.5, 0 5" fill="#3F3F46" />
                  </marker>
                  <marker id="harrow-active" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
                    <polygon points="0 0, 5 2.5, 0 5" fill="#A1A1AA" />
                  </marker>
                </defs>

                {/* Grid background */}
                <rect width="100%" height="100%" fill="url(#hgrid)" />

                {/* Connection lines */}
                <line x1="112" y1="65" x2="170" y2="65" stroke="#2A2A2A" strokeWidth="1" markerEnd="url(#harrow)" />
                <line x1="272" y1="65" x2="330" y2="65" stroke="#2A2A2A" strokeWidth="1" markerEnd="url(#harrow)" />
                {/* Router → Fast */}
                <path d="M 432 65 C 460 65, 460 32, 488 32" stroke="#3F3F46" strokeWidth="1" fill="none" markerEnd="url(#harrow-active)" />
                {/* Router → Frontier */}
                <path d="M 432 65 C 460 65, 460 98, 488 98" stroke="#3F3F46" strokeWidth="1" fill="none" markerEnd="url(#harrow-active)" />

                {/* Traffic % labels */}
                <text x="462" y="28" fill="#71717A" fontSize="7.5" fontFamily="var(--font-mono)" fontWeight="500">{fastRouting}%</text>
                <text x="462" y="108" fill="#71717A" fontSize="7.5" fontFamily="var(--font-mono)" fontWeight="500">{frontierRouting}%</text>

                {/* Node: API Ingress */}
                <g transform="translate(12, 47)">
                  <rect width="100" height="36" rx="1" fill="#111114" stroke="#27272A" strokeWidth="1" />
                  <text x="8" y="13" fill="#52525B" fontSize="6.5" fontFamily="var(--font-mono)" letterSpacing="0.08em">GATEWAY</text>
                  <text x="8" y="26" fill="#D4D4D8" fontSize="9.5" fontFamily="var(--font-ui)" fontWeight="500">API Ingress</text>
                </g>

                {/* Node: Semantic Cache */}
                <g transform="translate(170, 47)">
                  <rect width="100" height="36" rx="1" fill="#111114" stroke="#27272A" strokeWidth="1" />
                  <text x="8" y="13" fill="#52525B" fontSize="6.5" fontFamily="var(--font-mono)" letterSpacing="0.08em">CACHE</text>
                  <text x="8" y="26" fill="#D4D4D8" fontSize="9.5" fontFamily="var(--font-ui)" fontWeight="500">Semantic Cache</text>
                </g>

                {/* Node: Complexity Router */}
                <g transform="translate(330, 47)">
                  <rect width="102" height="36" rx="1" fill="#111114" stroke="#27272A" strokeWidth="1" />
                  <text x="8" y="13" fill="#52525B" fontSize="6.5" fontFamily="var(--font-mono)" letterSpacing="0.08em">ROUTER</text>
                  <text x="8" y="26" fill="#D4D4D8" fontSize="9.5" fontFamily="var(--font-ui)" fontWeight="500">Complexity Router</text>
                </g>

                {/* Node: Fast Model */}
                <g transform="translate(488, 14)">
                  <rect width="110" height="36" rx="1" fill="#111114" stroke="#27272A" strokeWidth="1" />
                  <text x="8" y="13" fill="#52525B" fontSize="6.5" fontFamily="var(--font-mono)" letterSpacing="0.08em">FAST TIER</text>
                  <text x="8" y="26" fill="#D4D4D8" fontSize="9.5" fontFamily="var(--font-ui)" fontWeight="500">Fast Model</text>
                </g>

                {/* Node: Frontier Model (bottleneck) */}
                <g transform="translate(488, 80)">
                  <rect width="110" height="36" rx="1" fill="#111114" stroke="#FFFFFF" strokeWidth="1.5" />
                  {/* Bottleneck indicator */}
                  <rect x="68" y="3" width="38" height="10" rx="1" fill="#FFFFFF" />
                  <text x="87" y="10.5" textAnchor="middle" fill="#09090B" fontSize="6" fontFamily="var(--font-mono)" fontWeight="700" letterSpacing="0.04em">BOTTLENECK</text>
                  <text x="8" y="20" fill="#52525B" fontSize="6.5" fontFamily="var(--font-mono)" letterSpacing="0.08em">FRONTIER</text>
                  <text x="8" y="31" fill="#F4F4F5" fontSize="9.5" fontFamily="var(--font-ui)" fontWeight="500">Frontier Model</text>
                </g>

                {/* Traffic flow dots (subtle) */}
                <circle r="1.5" fill="#3F3F46" opacity="0.8">
                  <animateMotion dur="2.2s" repeatCount="indefinite" path="M 112 65 L 170 65" />
                </circle>
                <circle r="1.5" fill="#3F3F46" opacity="0.8">
                  <animateMotion dur="2.2s" repeatCount="indefinite" path="M 272 65 L 330 65" />
                </circle>
                <circle r="1.5" fill="#52525B">
                  <animateMotion dur="2.6s" repeatCount="indefinite" path="M 432 65 C 460 65, 460 32, 488 32" />
                </circle>
                <circle r="1.5" fill="#52525B">
                  <animateMotion dur="2.6s" repeatCount="indefinite" path="M 432 65 C 460 65, 460 98, 488 98" />
                </circle>
              </svg>
            </div>

            {/* Workload controls — Prominent 18-20px values */}
            <div className="instrument__controls">
              <div className="control-group">
                <div className="control-row">
                  <span className="control-label text-mono">WORKLOAD VOLUME</span>
                  <span className="control-value text-mono">
                    {formatNumber(monthlyRequests)} <span className="control-unit">REQ / MO</span>
                  </span>
                </div>
                <input
                  type="range" min={200_000} max={15_000_000} step={100_000}
                  value={monthlyRequests}
                  onChange={e => setMonthlyRequests(Number(e.target.value))}
                  className="hero-slider"
                  aria-label={`Workload volume: ${formatNumber(monthlyRequests)} requests per month`}
                />
              </div>

              <div className="control-group">
                <div className="control-row">
                  <span className="control-label text-mono">CACHE HIT RATE</span>
                  <span className="control-value text-mono">
                    {Math.round(cacheHitRate * 100)}%
                  </span>
                </div>
                <input
                  type="range" min={0} max={0.85} step={0.05}
                  value={cacheHitRate}
                  onChange={e => setCacheHitRate(Number(e.target.value))}
                  className="hero-slider"
                  aria-label={`Cache hit rate: ${Math.round(cacheHitRate * 100)}%`}
                />
              </div>

              <div className="control-group">
                <div className="control-row">
                  <span className="control-label text-mono">ROUTING SPLIT</span>
                  <span className="control-value text-mono">
                    {fastRouting}% <span className="control-unit">FAST</span> / {frontierRouting}% <span className="control-unit">FRONTIER</span>
                  </span>
                </div>
                <input
                  type="range" min={0.1} max={0.9} step={0.05}
                  value={fastModelRouting}
                  onChange={e => setFastModelRouting(Number(e.target.value))}
                  className="hero-slider"
                  aria-label={`Routing split: ${fastRouting}% fast model, ${frontierRouting}% frontier model`}
                />
              </div>
            </div>

            {/* Modeled telemetry readouts — Economics as dominant visual anchor */}
            <div className="instrument__readouts">
              {/* Primary: Monthly cost anchor */}
              <div className="readout-primary">
                <div className="readout-primary__header">
                  <span className="text-mono readout-label">MODELED MONTHLY COST</span>
                  <span className="readout-primary__badge text-mono">DETERMINISTIC SIMULATION</span>
                </div>
                <div className="readout-primary__main">
                  <span className="readout-primary__value text-mono">{formatCurrency(sim.monthlyCost)}</span>
                  <span className="readout-primary__unit text-mono">/ MO</span>
                </div>
              </div>

              {/* Secondary telemetry rail */}
              <div className="readout-secondary">
                <div className="readout-cell">
                  <span className="text-mono readout-label">MODELED TAIL LATENCY</span>
                  <div className="readout-cell-value text-mono">
                    <span>{formatLatency(sim.p95Latency)}</span>
                    <span className="readout-cell-sub">est. P95</span>
                  </div>
                </div>
                <div className="readout-cell">
                  <span className="text-mono readout-label">COST / 1K REQ</span>
                  <div className="readout-cell-value text-mono">
                    <span>${(sim.costPerRequest * 1000).toFixed(3)}</span>
                    <span className="readout-cell-sub">per 1K req</span>
                  </div>
                </div>
                <div className="readout-cell">
                  <span className="text-mono readout-label">MODELED SAVINGS VS BASELINE</span>
                  <div className="readout-cell-value text-mono">
                    <span style={{ color: '#FAFAFA' }}>−{formatCurrency(estimatedSavings)}/MO</span>
                    <span className="readout-cell-sub">vs 0% cache</span>
                  </div>
                </div>
              </div>

              {/* Causal Relationship Anchor (Section 6) */}
              <div className="readout-causal text-mono">
                <div className="causal-row">
                  <span className="causal-tag">CAUSAL IMPACT</span>
                  <span className="causal-bottleneck">PRIMARY BOTTLENECK: {sim.bottleneck.componentName.toUpperCase()} ({sim.bottleneck.impactPercentage}% COST SHARE)</span>
                </div>
                <div className="causal-text">
                  At {Math.round(cacheHitRate * 100)}% cache: {formatNumber(Math.round(monthlyRequests * cacheHitRate))} requests terminate at cache, saving {formatCurrency(estimatedSavings)}/mo vs direct frontier baseline ({formatCurrency(noCacheSim.monthlyCost)}/mo).
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        /* ── Hero Section ── */
        .hero {
          width: 100%;
          padding-top: calc(var(--nav-height) + 56px);
          padding-bottom: 72px;
          background: var(--color-bg);
          border-bottom: 1px solid var(--color-border);
        }

        /* ── Eyebrow ── */
        .hero__eyebrow {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 40px;
        }

        .hero__section-num {
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          font-weight: 500;
          color: var(--color-text-muted);
          letter-spacing: 0.08em;
          flex-shrink: 0;
        }

        .hero__rule {
          flex: 1;
          max-width: 40px;
          height: 1px;
          background: var(--color-border);
        }

        .hero__section-label {
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          color: var(--color-text-muted);
          letter-spacing: 0.08em;
        }

        /* ── Two-column grid ── */
        .hero__grid {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 64px;
          align-items: flex-start;
        }

        /* ── Narrative column ── */
        .hero__narrative {
          display: flex;
          flex-direction: column;
          gap: 28px;
          padding-top: 8px;
        }

        .hero__headline {
          margin: 0;
          font-family: var(--font-display);
          font-size: clamp(40px, 4.2vw, 64px);
          font-weight: 600;
          line-height: 1.02;
          letter-spacing: -0.03em;
          color: #FFFFFF;
        }

        .hero__headline-secondary {
          color: #A1A1AA;
        }

        .hero__body {
          font-family: var(--font-ui);
          font-size: 1.0625rem;
          line-height: 1.6;
          color: var(--color-text-secondary);
          margin: 0;
          max-width: 520px;
        }

        /* ── CTAs ── */
        .hero__actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .hero__cta {
          height: 42px;
          padding: 0 20px;
          font-family: var(--font-ui);
          font-size: 0.8125rem;
          font-weight: 600;
          letter-spacing: 0.02em;
          border-radius: 3px;
        }

        .hero__cta-secondary {
          height: 42px;
          padding: 0 18px;
          font-family: var(--font-ui);
          font-size: 0.8125rem;
          border-radius: 3px;
        }

        /* ── Technical provenance line ── */
        .hero__provenance {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-mono);
          font-size: 0.75rem;
          color: var(--color-text-muted);
          padding-top: 16px;
          border-top: 1px solid var(--color-border);
          flex-wrap: wrap;
        }

        .hero__provenance-sep {
          color: var(--color-border-strong);
        }

        /* ── Instrument shell ── */
        .hero__instrument {
          background: #0D0D10;
          border: 1px solid var(--color-border);
          border-radius: 3px;
          overflow: hidden;
        }

        /* ── Instrument header ── */
        .instrument__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 18px;
          background: #111114;
          border-bottom: 1px solid var(--color-border);
        }

        .instrument__title-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .instrument__arch-label {
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          color: #A1A1AA;
          letter-spacing: 0.06em;
          font-weight: 500;
        }

        .instrument__sep {
          color: var(--color-border-strong);
          font-size: 0.75rem;
        }

        .instrument__arch-name {
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          color: #FFFFFF;
          letter-spacing: 0.06em;
          font-weight: 600;
        }

        .instrument__open {
          background: none;
          border: 1px solid var(--color-border);
          border-radius: 2px;
          padding: 3px 9px;
          font-size: 0.5625rem;
          letter-spacing: 0.08em;
          color: var(--color-text-muted);
          cursor: pointer;
          transition: color 0.1s, border-color 0.1s;
        }

        .instrument__open:hover {
          color: var(--color-text-secondary);
          border-color: var(--color-border-strong);
        }

        /* ── Diagram ── */
        .instrument__diagram {
          background: var(--color-bg);
          padding: 14px 18px;
          border-bottom: 1px solid var(--color-border);
        }

        .instrument__svg {
          width: 100%;
          height: auto;
          display: block;
        }

        /* ── Controls (Prominent 18px Hierarchy) ── */
        .instrument__controls {
          padding: 18px 20px;
          background: #0D0D10;
          border-bottom: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .control-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .control-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }

        .control-label {
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          letter-spacing: 0.08em;
          color: var(--color-text-muted);
          text-transform: uppercase;
          font-weight: 500;
        }

        .control-value {
          font-family: var(--font-mono);
          font-size: 1.125rem;
          color: #FFFFFF;
          font-weight: 600;
          font-variant-numeric: tabular-nums;
          letter-spacing: -0.01em;
        }

        .control-unit {
          font-size: 0.75rem;
          color: var(--color-text-muted);
          font-weight: 400;
        }

        .hero-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 3px;
          background: #24242A;
          outline: none;
          border-radius: 1px;
        }

        .hero-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 12px;
          height: 12px;
          background: #FFFFFF;
          cursor: pointer;
          border-radius: 2px;
          border: 1px solid #09090B;
          box-shadow: 0 1px 3px rgba(0,0,0,0.5);
        }

        .hero-slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          background: #FFFFFF;
          cursor: pointer;
          border-radius: 2px;
          border: 1px solid #09090B;
          box-sizing: border-box;
        }

        .hero-slider:focus-visible {
          outline: 2px solid #FFFFFF;
          outline-offset: 2px;
        }

        /* ── Readouts (Dominant Economic Anchor) ── */
        .instrument__readouts {
          padding: 18px 20px;
          background: var(--color-bg);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .readout-label {
          font-family: var(--font-mono);
          font-size: 0.625rem;
          letter-spacing: 0.08em;
          color: var(--color-text-muted);
          text-transform: uppercase;
          display: block;
          margin-bottom: 4px;
          font-weight: 500;
        }

        .readout-primary {
          padding: 16px 18px;
          background: #141418;
          border: 1px solid #27272A;
          border-radius: 3px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .readout-primary__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .readout-primary__badge {
          font-size: 0.5625rem;
          letter-spacing: 0.08em;
          color: #71717A;
          border: 1px solid #27272A;
          padding: 2px 6px;
          border-radius: 2px;
        }

        .readout-primary__main {
          display: flex;
          align-items: baseline;
          gap: 6px;
        }

        .readout-primary__value {
          font-family: var(--font-mono);
          font-size: clamp(2.25rem, 3.8vw, 2.75rem);
          font-weight: 600;
          font-variant-numeric: tabular-nums;
          letter-spacing: -0.03em;
          color: #FFFFFF;
          line-height: 1;
        }

        .readout-primary__unit {
          font-size: 0.875rem;
          color: #A1A1AA;
          font-weight: 500;
        }

        .readout-secondary {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          padding: 0 4px;
        }

        .readout-cell {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .readout-cell-value {
          font-family: var(--font-mono);
          font-size: 1.0625rem;
          font-weight: 600;
          font-variant-numeric: tabular-nums;
          color: #FFFFFF;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .readout-cell-sub {
          font-size: 0.6875rem;
          color: #71717A;
          font-weight: 400;
          letter-spacing: 0.04em;
        }

        /* ── Causal Impact Bar ── */
        .readout-causal {
          padding: 12px 14px;
          background: #111114;
          border-left: 2px solid #52525B;
          border-radius: 0 2px 2px 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .causal-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .causal-tag {
          font-size: 0.5625rem;
          letter-spacing: 0.1em;
          color: #A1A1AA;
          font-weight: 600;
        }

        .causal-bottleneck {
          font-size: 0.625rem;
          color: #71717A;
          letter-spacing: 0.04em;
        }

        .causal-text {
          font-size: 0.75rem;
          color: #D4D4D8;
          line-height: 1.45;
        }

        /* ── Responsive ── */
        @media (max-width: 1100px) {
          .hero__grid {
            grid-template-columns: 1fr;
            gap: 40px;
          }
          .hero__headline {
            font-size: clamp(36px, 5vw, 56px);
          }
        }

        @media (max-width: 640px) {
          .hero {
            padding-top: calc(var(--nav-height) + 32px);
            padding-bottom: 48px;
          }
          .hero__provenance {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }
          .hero__provenance-sep {
            display: none;
          }
          .readout-secondary {
            grid-template-columns: 1fr;
            gap: 12px;
          }
        }
      `}</style>
    </section>
  );
}
