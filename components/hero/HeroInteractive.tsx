'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import {
  simulate,
  formatCurrency,
  formatLatency,
  formatNumber,
  DEFAULT_SIMPLE_ARCHITECTURE,
  DEFAULT_OPTIMIZED_ARCHITECTURE,
  type Workload,
  type Architecture,
  type SimulationResult,
} from '@/lib/simulation/engine';

// ── Traffic Presets ──
const TRAFFIC_STOPS = [100_000, 500_000, 1_000_000, 2_000_000, 5_000_000, 10_000_000, 20_000_000];

function trafficToPercent(traffic: number): number {
  for (let i = 0; i < TRAFFIC_STOPS.length - 1; i++) {
    if (traffic <= TRAFFIC_STOPS[i + 1]) {
      const range = TRAFFIC_STOPS[i + 1] - TRAFFIC_STOPS[i];
      const segWidth = 100 / (TRAFFIC_STOPS.length - 1);
      return segWidth * i + segWidth * ((traffic - TRAFFIC_STOPS[i]) / range);
    }
  }
  return 100;
}

function percentToTraffic(pct: number): number {
  const segWidth = 100 / (TRAFFIC_STOPS.length - 1);
  const seg = Math.min(Math.floor(pct / segWidth), TRAFFIC_STOPS.length - 2);
  const segPct = (pct - seg * segWidth) / segWidth;
  const val = TRAFFIC_STOPS[seg] + segPct * (TRAFFIC_STOPS[seg + 1] - TRAFFIC_STOPS[seg]);
  // Round to nearest 10K
  return Math.round(val / 10_000) * 10_000;
}

function formatTraffic(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

// ── Animated Number ──
function AnimatedMetric({ value, prefix = '', suffix = '', className = '' }: {
  value: number; prefix?: string; suffix?: string; className?: string;
}) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    const start = prev.current;
    const end = value;
    if (start === end) return;

    const duration = 350;
    const startTime = performance.now();

    function step(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + (end - start) * eased);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
    prev.current = end;
  }, [value]);

  const formatted = prefix === '$'
    ? formatCurrency(Math.round(display))
    : suffix === 'ms' || suffix === 's'
      ? formatLatency(Math.round(display))
      : `${Math.round(display * 10) / 10}${suffix}`;

  return (
    <span className={`text-metric-sm ${className}`} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {prefix === '$' ? formatted : prefix}{prefix !== '$' ? formatted : ''}
    </span>
  );
}

// ── Architecture Visualization (SVG) ──
function ArchitectureGraph({ architecture, result, traffic }: {
  architecture: Architecture; result: SimulationResult; traffic: number;
}) {
  const isSimple = architecture.nodes.length <= 4;

  // Layout the nodes
  const nodePositions = useMemo(() => {
    const positions: Record<string, { x: number; y: number }> = {};

    if (isSimple) {
      // Simple: vertical stack
      const api = architecture.nodes.find(n => n.type === 'api');
      const model = architecture.nodes.find(n => n.type === 'model');
      const vectordb = architecture.nodes.find(n => n.type === 'vectordb');
      if (api) positions[api.id] = { x: 200, y: 40 };
      if (model) positions[model.id] = { x: 200, y: 140 };
      if (vectordb) positions[vectordb.id] = { x: 200, y: 240 };
    } else {
      // Optimized: tree layout
      const api = architecture.nodes.find(n => n.type === 'api');
      const cache = architecture.nodes.find(n => n.type === 'cache');
      const router = architecture.nodes.find(n => n.type === 'router');
      const models = architecture.nodes.filter(n => n.type === 'model');
      const vectordb = architecture.nodes.find(n => n.type === 'vectordb');
      const embedding = architecture.nodes.find(n => n.type === 'embedding');

      if (api) positions[api.id] = { x: 200, y: 30 };
      if (cache) positions[cache.id] = { x: 200, y: 100 };
      if (router) positions[router.id] = { x: 200, y: 170 };
      if (models[0]) positions[models[0].id] = { x: 115, y: 250 };
      if (models[1]) positions[models[1].id] = { x: 285, y: 250 };
      if (vectordb) positions[vectordb.id] = { x: 200, y: 330 };
      if (embedding) positions[embedding.id] = { x: 50, y: 330 };
    }

    return positions;
  }, [architecture, isSimple]);

  // Flow speed based on traffic
  const flowSpeed = Math.max(0.5, Math.min(4, traffic / 2_000_000));
  const isOverCapacity = result.capacityUtilization > 100;
  const isNearCapacity = result.capacityUtilization > 80;

  return (
    <svg
      viewBox="0 0 400 380"
      className="arch-svg"
      role="img"
      aria-label={`Architecture diagram with ${architecture.nodes.length} components`}
    >
      <defs>
        <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
          <polygon points="0 0, 6 2, 0 4" fill="var(--color-text-muted)" />
        </marker>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Edges */}
      {architecture.edges.map((edge, i) => {
        const from = nodePositions[edge.source];
        const to = nodePositions[edge.target];
        if (!from || !to) return null;

        return (
          <g key={`edge-${i}`}>
            <line
              x1={from.x} y1={from.y + 20}
              x2={to.x} y2={to.y - 20}
              stroke={isOverCapacity ? 'var(--color-critical)' : 'var(--color-border-strong)'}
              strokeWidth={isNearCapacity ? 2 : 1.5}
              strokeDasharray={isOverCapacity ? '4 4' : 'none'}
              markerEnd="url(#arrowhead)"
            />
            {/* Animated flow dot */}
            <circle r={isOverCapacity ? 3.5 : 2.5} fill={isOverCapacity ? 'var(--color-critical)' : 'var(--color-accent)'} filter={isOverCapacity ? 'url(#glow)' : undefined}>
              <animateMotion
                dur={`${2 / flowSpeed}s`}
                repeatCount="indefinite"
                path={`M${from.x},${from.y + 20} L${to.x},${to.y - 20}`}
              />
            </circle>
          </g>
        );
      })}

      {/* Nodes */}
      {architecture.nodes.map(node => {
        const pos = nodePositions[node.id];
        if (!pos) return null;

        const nodeColor = node.type === 'model'
          ? 'var(--color-accent)'
          : node.type === 'cache'
            ? 'var(--color-quality)'
            : node.type === 'vectordb'
              ? 'var(--color-performance)'
              : node.type === 'router'
                ? 'var(--color-cost)'
                : 'var(--color-border-strong)';

        return (
          <g key={node.id}>
            <rect
              x={pos.x - 52}
              y={pos.y - 16}
              width={104}
              height={32}
              rx={6}
              fill="var(--color-bg-surface)"
              stroke={nodeColor}
              strokeWidth={1}
              opacity={0.95}
            />
            <text
              x={pos.x}
              y={pos.y + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="var(--color-text)"
              fontSize="10"
              fontFamily="var(--font-mono)"
              fontWeight="500"
              letterSpacing="0.05em"
            >
              {node.label.toUpperCase()}
            </text>
            {/* Active indicator */}
            <circle
              cx={pos.x + 47}
              cy={pos.y - 11}
              r={3}
              fill={isOverCapacity ? 'var(--color-critical)' : 'var(--color-success)'}
            >
              <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />
            </circle>
          </g>
        );
      })}
    </svg>
  );
}

// ── Main Hero Component ──
export default function HeroInteractive() {
  const [traffic, setTraffic] = useState(1_000_000);
  const [isOptimized, setIsOptimized] = useState(false);
  const [showCapacityWarning, setShowCapacityWarning] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const architecture = isOptimized ? DEFAULT_OPTIMIZED_ARCHITECTURE : DEFAULT_SIMPLE_ARCHITECTURE;

  const workload: Workload = useMemo(() => ({
    requestsPerMonth: traffic,
    avgInputTokens: 1200,
    avgOutputTokens: 400,
    concurrency: 50,
    cacheHitRate: isOptimized ? 0.30 : 0,
    retrievalsPerRequest: 1,
    toolCallsPerRequest: 0,
  }), [traffic, isOptimized]);

  const result = useMemo(() => simulate(workload, architecture), [workload, architecture]);

  // Check capacity warning
  useEffect(() => {
    if (result.capacityUtilization > 100 && !isOptimized) {
      setShowCapacityWarning(true);
    } else {
      setShowCapacityWarning(false);
    }
  }, [result.capacityUtilization, isOptimized]);

  // Optimized result for comparison
  const optimizedResult = useMemo(() => {
    if (!isOptimized) {
      const optWorkload = { ...workload, cacheHitRate: 0.30 };
      return simulate(optWorkload, DEFAULT_OPTIMIZED_ARCHITECTURE);
    }
    return null;
  }, [workload, isOptimized]);

  // Slider interaction
  const handleSliderInteraction = useCallback((clientX: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setTraffic(percentToTraffic(pct));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    handleSliderInteraction(e.clientX);
    const handleMove = (e: MouseEvent) => {
      if (isDragging.current) handleSliderInteraction(e.clientX);
    };
    const handleUp = () => {
      isDragging.current = false;
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  }, [handleSliderInteraction]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    isDragging.current = true;
    handleSliderInteraction(e.touches[0].clientX);
    const handleMove = (e: TouchEvent) => {
      if (isDragging.current) handleSliderInteraction(e.touches[0].clientX);
    };
    const handleUp = () => {
      isDragging.current = false;
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
    window.addEventListener('touchmove', handleMove, { passive: true });
    window.addEventListener('touchend', handleUp);
  }, [handleSliderInteraction]);

  const sliderPercent = trafficToPercent(traffic);

  const handleOptimize = useCallback(() => {
    setIsOptimized(true);
    setShowCapacityWarning(false);
  }, []);

  const handleReset = useCallback(() => {
    setIsOptimized(false);
    setTraffic(1_000_000);
  }, []);

  return (
    <section className="hero" id="hero">
      <div className="hero__container container">
        {/* Opening copy */}
        <motion.div
          className="hero__intro"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '999px', background: 'var(--color-accent-dim)', border: '1px solid var(--color-accent-glow)', marginBottom: 'var(--space-4)' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-accent)' }} />
            <span className="text-caption text-mono" style={{ color: 'var(--color-text)', fontWeight: 600 }}>COMPUTECANVAS V1</span>
          </div>
          <h1 className="text-display" style={{ letterSpacing: '-0.02em' }}>
            Design your AI architecture.<br />
            <span style={{ color: 'var(--color-text-secondary)' }}>See the cost before you build it.</span>
          </h1>
          <p className="hero__subtitle" style={{ maxWidth: '620px' }}>
            Map your AI pipeline, simulate monthly spend and latency, calibrate against your real bill, and share the architecture with your team.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-6)', flexWrap: 'wrap' }}>
            <Link href="/simulator" className="btn btn-primary btn-lg" style={{ minWidth: '160px' }}>
              Open Simulator
            </Link>
            <Link href="/simulator?template=rag-pipeline" className="btn btn-secondary btn-lg">
              Explore Templates
            </Link>
          </div>
        </motion.div>

        {/* Interactive demo */}
        <motion.div
          className="hero__demo"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
        >
          <div className="hero__demo-inner">
            {/* Architecture visualization */}
            <div className="hero__graph">
              <div className="hero__graph-header">
                <span className="text-label">ARCHITECTURE</span>
                {isOptimized && (
                  <button className="btn-ghost" onClick={handleReset} style={{ fontSize: '0.75rem' }}>
                    Reset
                  </button>
                )}
              </div>
              <ArchitectureGraph architecture={architecture} result={result} traffic={traffic} />
            </div>

            {/* Controls + Metrics */}
            <div className="hero__panel">
              {/* Traffic slider */}
              <div className="hero__traffic">
                <div className="hero__traffic-header">
                  <span className="text-label">TRAFFIC</span>
                  <span className="text-mono" style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                    {formatTraffic(traffic)} <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>req/month</span>
                  </span>
                </div>
                <div
                  className="slider-track"
                  ref={sliderRef}
                  onMouseDown={handleMouseDown}
                  onTouchStart={handleTouchStart}
                  role="slider"
                  aria-label="Traffic requests per month"
                  aria-valuemin={100000}
                  aria-valuemax={20000000}
                  aria-valuenow={traffic}
                  aria-valuetext={`${formatTraffic(traffic)} requests per month`}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                      e.preventDefault();
                      setTraffic(t => Math.min(20_000_000, percentToTraffic(trafficToPercent(t) + 5)));
                    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                      e.preventDefault();
                      setTraffic(t => Math.max(100_000, percentToTraffic(trafficToPercent(t) - 5)));
                    } else if (e.key === 'Home') {
                      e.preventDefault();
                      setTraffic(100_000);
                    } else if (e.key === 'End') {
                      e.preventDefault();
                      setTraffic(20_000_000);
                    }
                  }}
                >
                  <div className="slider-fill" style={{ width: `${sliderPercent}%` }} />
                  <div className="slider-thumb" style={{ left: `${sliderPercent}%` }} />
                </div>
                <div className="hero__traffic-labels">
                  <span>100K</span>
                  <span>1M</span>
                  <span>10M</span>
                  <span>20M</span>
                </div>
              </div>

              {/* Metrics */}
              <div className="hero__metrics">
                <div className="hero__metric" data-type="cost">
                  <span className="text-label">MONTHLY COST</span>
                  <AnimatedMetric value={result.monthlyCost} prefix="$" className="hero__metric-value" />
                </div>
                <div className="hero__metric" data-type="latency">
                  <span className="text-label">P95 LATENCY</span>
                  <AnimatedMetric value={result.p95Latency} suffix="ms" className="hero__metric-value" />
                </div>
                <div className="hero__metric" data-type="capacity">
                  <span className="text-label">CAPACITY</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <AnimatedMetric value={result.capacityUtilization} suffix="%" className="hero__metric-value" />
                    {result.capacityUtilization > 100 && (
                      <span className="warning-badge critical">⚠</span>
                    )}
                    {result.capacityUtilization > 80 && result.capacityUtilization <= 100 && (
                      <span className="warning-badge warn">!</span>
                    )}
                  </div>
                </div>
                <div className="hero__metric" data-type="quality">
                  <span className="text-label">QUALITY</span>
                  <AnimatedMetric value={result.qualityEstimate} suffix="%" className="hero__metric-value" />
                </div>
              </div>

              {/* Capacity warning */}
              <AnimatePresence>
                {showCapacityWarning && (
                  <motion.div
                    className="hero__warning"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="hero__warning-inner">
                      <p className="text-label" style={{ color: 'var(--color-critical)', marginBottom: 'var(--space-2)' }}>
                        CAPACITY LIMIT REACHED
                      </p>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
                        Your current architecture is projected to exceed recommended capacity at {formatTraffic(traffic)} requests/month.
                      </p>
                      <button className="btn btn-primary" onClick={handleOptimize} style={{ fontSize: '0.8125rem' }}>
                        Optimize architecture
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Optimization result */}
              <AnimatePresence>
                {isOptimized && optimizedResult === null && (
                  <motion.div
                    className="hero__optimized"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                  >
                    <p className="text-label" style={{ color: 'var(--color-success)', marginBottom: 'var(--space-3)' }}>
                      ARCHITECTURE OPTIMIZED
                    </p>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>
                      Added routing, caching, and multi-model inference to handle load efficiently.
                    </p>
                    <a href="/simulator" className="btn btn-secondary" style={{ fontSize: '0.8125rem' }}>
                      Open in simulator →
                    </a>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Assumptions link */}
          <div className="hero__assumptions">
            <details>
              <summary className="text-caption" style={{ cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                View assumptions
              </summary>
              <div className="hero__assumptions-list">
                {result.assumptions.map((a, i) => (
                  <div key={i} className="hero__assumption">
                    <span style={{ color: 'var(--color-text-muted)' }}>{a.category}</span>
                    <span>{a.detail}</span>
                  </div>
                ))}
              </div>
            </details>
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        .hero {
          min-height: 100vh;
          display: flex;
          align-items: center;
          padding: 120px 0 var(--space-16);
          position: relative;
          overflow: hidden;
        }
        .hero::before {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 600px;
          height: 600px;
          background: radial-gradient(ellipse, var(--color-accent-dim) 0%, transparent 70%);
          pointer-events: none;
          opacity: 0.5;
        }
        .hero__container {
          position: relative;
          z-index: 1;
        }
        .hero__intro {
          text-align: center;
          max-width: 800px;
          margin: 0 auto var(--space-12);
        }
        .hero__subtitle {
          font-size: clamp(1rem, 1.5vw, 1.25rem);
          color: var(--color-text-secondary);
          margin-top: var(--space-4);
          max-width: 520px;
          margin-left: auto;
          margin-right: auto;
        }
        .hero__demo {
          max-width: 960px;
          margin: 0 auto;
        }
        .hero__demo-inner {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1px;
          background: var(--color-border);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }
        .hero__graph {
          background: var(--color-bg-elevated);
          padding: var(--space-6);
          display: flex;
          flex-direction: column;
        }
        .hero__graph-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-4);
        }
        .hero__panel {
          background: var(--color-bg-elevated);
          padding: var(--space-6);
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
        }
        .hero__traffic {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }
        .hero__traffic-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }
        .hero__traffic-labels {
          display: flex;
          justify-content: space-between;
          font-family: var(--font-mono);
          font-size: 0.625rem;
          color: var(--color-text-muted);
          margin-top: var(--space-1);
        }
        .hero__metrics {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-4);
        }
        .hero__metric {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
        }
        .hero__metric[data-type="cost"] .hero__metric-value { color: var(--color-cost); }
        .hero__metric[data-type="latency"] .hero__metric-value { color: var(--color-performance); }
        .hero__metric[data-type="capacity"] .hero__metric-value { color: var(--color-capacity); }
        .hero__metric[data-type="quality"] .hero__metric-value { color: var(--color-quality); }
        .hero__warning {
          overflow: hidden;
        }
        .hero__warning-inner {
          padding: var(--space-4);
          background: var(--color-critical-dim);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: var(--radius-md);
        }
        .hero__optimized {
          padding: var(--space-4);
          background: var(--color-success-dim);
          border: 1px solid rgba(34, 197, 94, 0.2);
          border-radius: var(--radius-md);
        }
        .hero__assumptions {
          margin-top: var(--space-4);
          text-align: center;
        }
        .hero__assumptions-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: var(--space-2);
          margin-top: var(--space-3);
          padding: var(--space-4);
          background: var(--color-bg-elevated);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          text-align: left;
        }
        .hero__assumption {
          display: flex;
          flex-direction: column;
          gap: 2px;
          font-size: 0.75rem;
          font-family: var(--font-mono);
        }

        @media (max-width: 768px) {
          .hero {
            padding: 100px 0 var(--space-12);
          }
          .hero__demo-inner {
            grid-template-columns: 1fr;
          }
          .hero__metrics {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>

      <style jsx global>{`
        .arch-svg {
          width: 100%;
          max-height: 360px;
          flex: 1;
        }
      `}</style>
    </section>
  );
}
