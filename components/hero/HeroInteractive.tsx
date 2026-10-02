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
              <svg viewBox="0 0 680 176" className="instrument__svg" aria-hidden="true">
                <defs>
                  {/* Engineering grid */}
                  <pattern id="hgrid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1E1E22" strokeWidth="0.5" />
                  </pattern>
                  <marker id="harrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <polygon points="0 0, 6 3, 0 6" fill="#3F3F46" />
                  </marker>
                  <marker id="harrow-active" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <polygon points="0 0, 6 3, 0 6" fill="#A1A1AA" />
                  </marker>
                </defs>

                {/* Grid background */}
                <rect width="100%" height="100%" fill="url(#hgrid)" />

                {/* Connection lines */}
                <line x1="130" y1="88" x2="164" y2="88" stroke="#3F3F46" strokeWidth="1.5" markerEnd="url(#harrow)" />
                <line x1="288" y1="88" x2="322" y2="88" stroke="#3F3F46" strokeWidth="1.5" markerEnd="url(#harrow)" />
                {/* Router → Fast */}
                <path d="M 456 88 C 476 88, 484 46, 506 46" stroke="#52525B" strokeWidth="1.5" fill="none" markerEnd="url(#harrow-active)" />
                {/* Router → Frontier */}
                <path d="M 456 88 C 476 88, 484 130, 506 130" stroke="#FFFFFF" strokeWidth="2" fill="none" markerEnd="url(#harrow-active)" />

                {/* Traffic % badge labels */}
                <g transform="translate(458, 36)">
                  <rect x="-4" y="-12" width="76" height="22" rx="3" fill="#111114" stroke="#3F3F46" strokeWidth="1" />
                  <text x="34" y="3" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontFamily="var(--font-mono)" fontWeight="600">{fastRouting}% FAST</text>
                </g>
                <g transform="translate(458, 120)">
                  <rect x="-4" y="-12" width="94" height="22" rx="3" fill="#18181B" stroke="#FFFFFF" strokeWidth="1.5" />
                  <text x="43" y="3" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontFamily="var(--font-mono)" fontWeight="700">{frontierRouting}% FRONTIER</text>
                </g>

                {/* Node: API Ingress */}
                <g transform="translate(14, 60)">
                  <rect width="116" height="56" rx="3" fill="#111114" stroke="#27272A" strokeWidth="1" />
                  <text x="12" y="20" fill="#A1A1AA" fontSize="11" fontFamily="var(--font-mono)" fontWeight="600" letterSpacing="0.06em">GATEWAY</text>
                  <text x="12" y="42" fill="#FFFFFF" fontSize="14" fontFamily="var(--font-ui)" fontWeight="600">API Ingress</text>
                </g>

                {/* Node: Semantic Cache */}
                <g transform="translate(164, 60)">
                  <rect width="124" height="56" rx="3" fill="#111114" stroke="#27272A" strokeWidth="1" />
                  <text x="12" y="20" fill="#A1A1AA" fontSize="11" fontFamily="var(--font-mono)" fontWeight="600" letterSpacing="0.06em">CACHE</text>
                  <text x="12" y="42" fill="#FFFFFF" fontSize="14" fontFamily="var(--font-ui)" fontWeight="600">Semantic Cache</text>
                </g>

                {/* Node: Complexity Router */}
                <g transform="translate(322, 60)">
                  <rect width="134" height="56" rx="3" fill="#111114" stroke="#27272A" strokeWidth="1" />
                  <text x="12" y="20" fill="#A1A1AA" fontSize="11" fontFamily="var(--font-mono)" fontWeight="600" letterSpacing="0.06em">ROUTER</text>
                  <text x="12" y="42" fill="#FFFFFF" fontSize="14" fontFamily="var(--font-ui)" fontWeight="600">Complexity Router</text>
                </g>

                {/* Node: Fast Model */}
                <g transform="translate(506, 18)">
                  <rect width="158" height="56" rx="3" fill="#111114" stroke="#27272A" strokeWidth="1" />
                  <text x="12" y="20" fill="#A1A1AA" fontSize="11" fontFamily="var(--font-mono)" fontWeight="600" letterSpacing="0.06em">FAST TIER</text>
                  <text x="12" y="42" fill="#FFFFFF" fontSize="14" fontFamily="var(--font-ui)" fontWeight="600">Fast Model</text>
                </g>

                {/* Node: Frontier Model (bottleneck) */}
                <g transform="translate(506, 102)">
                  <rect width="158" height="56" rx="3" fill="#18181B" stroke="#FFFFFF" strokeWidth="2" />
                  {/* Bottleneck indicator */}
                  <rect x="76" y="7" width="74" height="16" rx="2" fill="#FFFFFF" />
                  <text x="113" y="19" textAnchor="middle" fill="#09090B" fontSize="10" fontFamily="var(--font-mono)" fontWeight="800" letterSpacing="0.04em">BOTTLENECK</text>
                  <text x="12" y="20" fill="#A1A1AA" fontSize="11" fontFamily="var(--font-mono)" fontWeight="600" letterSpacing="0.06em">FRONTIER</text>
                  <text x="12" y="42" fill="#FFFFFF" fontSize="14" fontFamily="var(--font-ui)" fontWeight="600">Frontier Model</text>
                </g>
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
          font-size: 0.8125rem; /* 13px */
          color: #A1A1AA;
          letter-spacing: 0.04em;
          font-weight: 600;
        }

        .instrument__sep {
          color: var(--color-border-strong);
          font-size: 0.8125rem;
        }

        .instrument__arch-name {
          font-family: var(--font-mono);
          font-size: 0.875rem; /* 14px */
          color: #FFFFFF;
          letter-spacing: 0.04em;
          font-weight: 700;
        }

        .instrument__open {
          background: #18181B;
          border: 1px solid var(--color-border-strong);
          border-radius: 3px;
          padding: 5px 12px;
          font-size: 0.75rem; /* 12px */
          letter-spacing: 0.04em;
          color: #FAFAFA;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.12s, border-color 0.12s;
        }

        .instrument__open:hover {
          color: #FFFFFF;
          background: #27272A;
          border-color: #FFFFFF;
        }

        /* ── Diagram ── */
        .instrument__diagram {
          background: var(--color-bg);
          padding: 16px 20px;
          border-bottom: 1px solid var(--color-border);
        }

        .instrument__svg {
          width: 100%;
          height: auto;
          display: block;
        }

        /* ── Controls (Prominent 18-20px Hierarchy) ── */
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
          font-size: 0.78125rem; /* 12.5px */
          letter-spacing: 0.05em;
          color: #A1A1AA;
          text-transform: uppercase;
          font-weight: 600;
        }

        .control-value {
          font-family: var(--font-mono);
          font-size: 1.25rem; /* 20px */
          color: #FFFFFF;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
          letter-spacing: -0.01em;
        }

        .control-unit {
          font-size: 0.8125rem; /* 13px */
          color: #A1A1AA;
          font-weight: 400;
        }

        .hero-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 44px; /* 44px effective touch target */
          background: transparent;
          outline: none;
          cursor: pointer;
          display: flex;
          align-items: center;
        }

        .hero-slider::-webkit-slider-runnable-track {
          width: 100%;
          height: 4px;
          background: #24242A;
          border-radius: 2px;
        }

        .hero-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          margin-top: -5px;
          background: #FFFFFF;
          cursor: pointer;
          border-radius: 2px;
          border: 1px solid #09090B;
          box-shadow: 0 1px 3px rgba(0,0,0,0.5);
        }

        .hero-slider::-moz-range-track {
          width: 100%;
          height: 4px;
          background: #24242A;
          border-radius: 2px;
        }

        .hero-slider::-moz-range-thumb {
          width: 14px;
          height: 14px;
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
          font-size: 0.75rem; /* 12px */
          letter-spacing: 0.05em;
          color: #A1A1AA;
          text-transform: uppercase;
          display: block;
          margin-bottom: 4px;
          font-weight: 600;
        }

        .readout-primary {
          padding: 16px 18px;
          background: #141418;
          border: 1px solid var(--color-border);
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
          font-size: 0.6875rem; /* 11px */
          letter-spacing: 0.05em;
          color: #A1A1AA;
          border: 1px solid var(--color-border-strong);
          padding: 3px 8px;
          border-radius: 2px;
          font-weight: 500;
        }

        .readout-primary__main {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }

        .readout-primary__value {
          font-family: var(--font-mono);
          font-size: clamp(2.5rem, 4vw, 3rem); /* 40-48px */
          font-weight: 700;
          font-variant-numeric: tabular-nums;
          letter-spacing: -0.03em;
          color: #FFFFFF;
          line-height: 1;
        }

        .readout-primary__unit {
          font-size: 0.9375rem; /* 15px */
          color: #D4D4D8;
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
          gap: 4px;
        }

        .readout-cell-value {
          font-family: var(--font-mono);
          font-size: 1.375rem; /* 22px */
          font-weight: 700;
          font-variant-numeric: tabular-nums;
          color: #FFFFFF;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .readout-cell-sub {
          font-size: 0.75rem; /* 12px */
          color: #A1A1AA;
          font-weight: 500;
          letter-spacing: 0.02em;
        }

        /* ── Causal Impact Bar ── */
        .readout-causal {
          padding: 12px 14px;
          background: #111114;
          border-left: 3px solid #71717A;
          border-radius: 0 3px 3px 0;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .causal-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .causal-tag {
          font-size: 0.6875rem; /* 11px */
          letter-spacing: 0.08em;
          color: #FFFFFF;
          font-weight: 700;
        }

        .causal-bottleneck {
          font-size: 0.75rem; /* 12px */
          color: #FFFFFF;
          letter-spacing: 0.02em;
          font-weight: 600;
        }

        .causal-text {
          font-size: 0.84375rem; /* 13.5px */
          color: #E4E4E7;
          line-height: 1.5;
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
