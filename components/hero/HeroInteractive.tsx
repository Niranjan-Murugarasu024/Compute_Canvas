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
        {/* Editorial Header Row */}
        <div className="hero__eyebrow">
          <span className="hero__section-num text-mono">01</span>
          <span className="hero__rule" aria-hidden="true" />
          <span className="hero__section-label text-mono">ARCHITECTURE ECONOMICS</span>
        </div>

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

            {/* Engine metadata strip */}
            <div className="hero__meta">
              <div className="hero__meta-item">
                <span className="text-mono" style={{ fontSize: '0.5625rem', color: 'var(--color-text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Engine</span>
                <span className="text-mono" style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Deterministic</span>
              </div>
              <span className="hero__meta-sep" aria-hidden="true" />
              <div className="hero__meta-item">
                <span className="text-mono" style={{ fontSize: '0.5625rem', color: 'var(--color-text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Pricing</span>
                <span className="text-mono" style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Snapshot 2026-03</span>
              </div>
              <span className="hero__meta-sep" aria-hidden="true" />
              <div className="hero__meta-item">
                <span className="text-mono" style={{ fontSize: '0.5625rem', color: 'var(--color-text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Calibration</span>
                <span className="text-mono" style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Optional</span>
              </div>
              <span className="hero__meta-sep" aria-hidden="true" />
              <div className="hero__meta-item">
                <span className="text-mono" style={{ fontSize: '0.5625rem', color: 'var(--color-text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Latency</span>
                <span className="text-mono" style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Model-derived</span>
              </div>
            </div>
          </div>

          {/* Right: Live Architecture Instrument */}
          <div className="hero__instrument">
            {/* Instrument header */}
            <div className="instrument__header">
              <div className="instrument__title-row">
                <span className="instrument__live text-mono">● LIVE SYSTEM</span>
                <span className="instrument__sep text-mono" aria-hidden="true">/</span>
                <span className="instrument__arch-id text-mono">001 ROUTER + CACHE</span>
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

            {/* Workload controls */}
            <div className="instrument__controls">
              <div className="control-row">
                <span className="control-label text-mono">WORKLOAD VOLUME</span>
                <span className="control-value text-mono">{formatNumber(monthlyRequests)} REQ/MO</span>
              </div>
              <input
                type="range" min={200_000} max={15_000_000} step={100_000}
                value={monthlyRequests}
                onChange={e => setMonthlyRequests(Number(e.target.value))}
                className="hero-slider"
                aria-label={`Workload volume: ${formatNumber(monthlyRequests)} requests per month`}
              />

              <div className="control-row" style={{ marginTop: '12px' }}>
                <span className="control-label text-mono">CACHE HIT RATE</span>
                <span className="control-value text-mono">{Math.round(cacheHitRate * 100)}%</span>
              </div>
              <input
                type="range" min={0} max={0.85} step={0.05}
                value={cacheHitRate}
                onChange={e => setCacheHitRate(Number(e.target.value))}
                className="hero-slider"
                aria-label={`Cache hit rate: ${Math.round(cacheHitRate * 100)}%`}
              />

              <div className="control-row" style={{ marginTop: '12px' }}>
                <span className="control-label text-mono">ROUTING SPLIT</span>
                <span className="control-value text-mono">{fastRouting}% FAST / {frontierRouting}% FRONTIER</span>
              </div>
              <input
                type="range" min={0.1} max={0.9} step={0.05}
                value={fastModelRouting}
                onChange={e => setFastModelRouting(Number(e.target.value))}
                className="hero-slider"
                aria-label={`Routing split: ${fastRouting}% fast model, ${frontierRouting}% frontier model`}
              />
            </div>

            {/* Modeled telemetry readouts */}
            <div className="instrument__readouts">
              {/* Primary: Monthly cost */}
              <div className="readout-primary">
                <div className="readout-primary__left">
                  <span className="text-mono readout-label">MODELED MONTHLY COST</span>
                  <span className="text-mono" style={{ fontSize: '0.5625rem', color: 'var(--color-text-muted)', letterSpacing: '0.06em' }}>USD / MONTH</span>
                </div>
                <span className="readout-primary__value text-mono">{formatCurrency(sim.monthlyCost)}</span>
              </div>

              {/* Secondary: Three metrics */}
              <div className="readout-secondary">
                <div className="readout-cell">
                  <span className="text-mono readout-label">COST / 1K REQ</span>
                  <span className="text-mono readout-cell-value">${(sim.costPerRequest * 1000).toFixed(3)}</span>
                </div>
                <div className="readout-cell">
                  <span className="text-mono readout-label">MODELED TAIL LATENCY</span>
                  <span className="text-mono readout-cell-value">{formatLatency(sim.p95Latency)}</span>
                </div>
                <div className="readout-cell">
                  <span className="text-mono readout-label">MODELED SAVINGS VS BASELINE</span>
                  <span className="text-mono readout-cell-value">−{formatCurrency(estimatedSavings)}/MO</span>
                </div>
              </div>

              {/* Baseline context */}
              <div className="readout-footnote text-mono">
                <span>
                  BASELINE (0% CACHE): {formatCurrency(noCacheSim.monthlyCost)}/MO → WITH {Math.round(cacheHitRate * 100)}% CACHE: {formatCurrency(sim.monthlyCost)}/MO · MODELED DIFFERENCE: −{formatCurrency(estimatedSavings)}/MO
                </span>
                <span>
                  PRIMARY BOTTLENECK: {sim.bottleneck.componentName.toUpperCase()} — {sim.bottleneck.impactPercentage}% COST SHARE
                </span>
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

        /* ── Engine metadata strip ── */
        .hero__meta {
          display: flex;
          align-items: center;
          gap: 0;
          padding-top: 20px;
          border-top: 1px solid var(--color-border);
          flex-wrap: wrap;
          row-gap: 12px;
        }

        .hero__meta-item {
          display: flex;
          flex-direction: column;
          gap: 3px;
          padding: 0 20px 0 0;
          margin-right: 20px;
        }

        .hero__meta-sep {
          width: 1px;
          height: 28px;
          background: var(--color-border);
          margin-right: 20px;
          flex-shrink: 0;
        }

        .hero__meta-sep:last-of-type {
          display: none;
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
          gap: 10px;
        }

        .instrument__live {
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          color: #FFFFFF;
          letter-spacing: 0.06em;
          font-weight: 600;
        }

        .instrument__sep {
          color: var(--color-border-strong);
          font-size: 0.75rem;
        }

        .instrument__arch-id {
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          color: var(--color-text-muted);
          letter-spacing: 0.06em;
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

        /* ── Controls ── */
        .instrument__controls {
          padding: 16px 18px;
          background: #0D0D10;
          border-bottom: 1px solid var(--color-border);
        }

        .control-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }

        .control-label {
          font-family: var(--font-mono);
          font-size: 0.5625rem;
          letter-spacing: 0.08em;
          color: var(--color-text-muted);
          text-transform: uppercase;
        }

        .control-value {
          font-family: var(--font-mono);
          font-size: 0.75rem;
          color: #FFFFFF;
          font-weight: 500;
          font-variant-numeric: tabular-nums;
        }

        .hero-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 2px;
          background: #1E1E22;
          outline: none;
          border-radius: 1px;
        }

        .hero-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 10px;
          height: 10px;
          background: #FFFFFF;
          cursor: pointer;
          border-radius: 1px;
          border: 1px solid #09090B;
        }

        .hero-slider::-moz-range-thumb {
          width: 10px;
          height: 10px;
          background: #FFFFFF;
          cursor: pointer;
          border-radius: 1px;
          border: 1px solid #09090B;
          box-sizing: border-box;
        }

        .hero-slider:focus-visible {
          outline: 2px solid #FFFFFF;
          outline-offset: 2px;
        }

        /* ── Readouts ── */
        .instrument__readouts {
          padding: 16px 18px;
          background: var(--color-bg);
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .readout-label {
          font-family: var(--font-mono);
          font-size: 0.5625rem;
          letter-spacing: 0.08em;
          color: var(--color-text-muted);
          text-transform: uppercase;
          display: block;
          margin-bottom: 3px;
        }

        .readout-primary {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--color-border);
        }

        .readout-primary__left {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .readout-primary__value {
          font-family: var(--font-mono);
          font-size: 1.875rem;
          font-weight: 500;
          font-variant-numeric: tabular-nums;
          letter-spacing: -0.02em;
          color: #FFFFFF;
          line-height: 1;
        }

        .readout-secondary {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .readout-cell {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .readout-cell-value {
          font-family: var(--font-mono);
          font-size: 0.9375rem;
          font-weight: 500;
          font-variant-numeric: tabular-nums;
          color: var(--color-text);
        }

        .readout-footnote {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding-top: 10px;
          border-top: 1px solid var(--color-border);
          font-family: var(--font-mono);
          font-size: 0.5625rem;
          color: var(--color-text-muted);
          letter-spacing: 0.04em;
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
          .hero__eyebrow {
            margin-bottom: 28px;
          }
          .hero__rule {
            display: none;
          }
          .readout-secondary {
            grid-template-columns: 1fr;
            gap: 10px;
          }
          .hero__meta-sep {
            display: none;
          }
          .hero__meta {
            flex-direction: column;
            align-items: flex-start;
          }
          .hero__meta-item {
            padding: 0;
            margin: 0;
            flex-direction: row;
            align-items: center;
            gap: 12px;
          }
        }
      `}</style>
    </section>
  );
}
