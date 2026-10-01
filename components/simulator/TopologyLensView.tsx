'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useArchitectureStore } from '@/lib/state/architectureStore';
import {
  REGIONS,
  INTER_REGION_LATENCY_MS,
  simulateMultiRegion,
} from '@/lib/simulation/multiRegion';
import { formatCurrency, formatLatency } from '@/lib/simulation/engine';

export default function TopologyLensView() {
  const {
    architecture,
    workload,
    regionalDeployments,
    setRegionalDeployment,
    activeFailure,
    setActiveFailure,
  } = useArchitectureStore();

  const multiRegionSim = useMemo(() => {
    return simulateMultiRegion(
      workload,
      architecture,
      regionalDeployments,
      activeFailure?.regionId
    );
  }, [workload, architecture, regionalDeployments, activeFailure]);

  const activeRegions = regionalDeployments.filter(d => d.regionId !== activeFailure?.regionId);

  return (
    <div className="topology-lens">
      {/* Top Topology Status Bar */}
      <div className="topology-status-bar">
        <div className="status-kpis">
          <div className="status-kpi">
            <span className="text-caption text-mono" style={{ color: 'var(--color-text-muted)' }}>REDUNDANCY TIER</span>
            <span className="text-mono status-kpi__val" style={{ color: 'var(--color-success)' }}>
              {multiRegionSim.redundancyLevel}
            </span>
          </div>

          <div className="status-kpi">
            <span className="text-caption text-mono" style={{ color: 'var(--color-text-muted)' }}>RESILIENCE SCORE</span>
            <span className="text-mono status-kpi__val" style={{ color: multiRegionSim.resilienceScore >= 75 ? 'var(--color-success)' : 'var(--color-warning)' }}>
              {multiRegionSim.resilienceScore} / 100
            </span>
          </div>

          <div className="status-kpi">
            <span className="text-caption text-mono" style={{ color: 'var(--color-text-muted)' }}>EFFECTIVE P95 LATENCY</span>
            <span className="text-mono status-kpi__val" style={{ color: 'var(--color-performance)' }}>
              {formatLatency(multiRegionSim.effectiveP95Latency)}
            </span>
          </div>

          <div className="status-kpi">
            <span className="text-caption text-mono" style={{ color: 'var(--color-text-muted)' }}>TOTAL MONTHLY SPEND</span>
            <span className="text-mono status-kpi__val" style={{ color: 'var(--color-cost)' }}>
              {formatCurrency(multiRegionSim.effectiveMonthlyCost)}
            </span>
          </div>

          <div className="status-kpi">
            <span className="text-caption text-mono" style={{ color: 'var(--color-text-muted)' }}>CROSS-REGION EGRESS</span>
            <span className="text-mono status-kpi__val">
              {formatCurrency(multiRegionSim.crossRegionEgressCost)}/mo
            </span>
          </div>
        </div>

        {/* Failure Simulation Action */}
        <div className="failure-actions">
          {activeFailure?.regionId ? (
            <button
              className="btn btn-secondary"
              style={{ borderColor: 'var(--color-warning)', color: 'var(--color-warning)' }}
              onClick={() => setActiveFailure(null)}
            >
              Restore All Regions
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="text-caption text-mono" style={{ color: 'var(--color-text-muted)' }}>Simulate Outage:</span>
              <button
                className="btn btn-ghost"
                style={{ fontSize: '0.75rem', padding: '4px 8px', color: 'var(--color-critical)' }}
                onClick={() => setActiveFailure({ regionId: 'us-east' })}
              >
                Fail US-East
              </button>
              <button
                className="btn btn-ghost"
                style={{ fontSize: '0.75rem', padding: '4px 8px', color: 'var(--color-critical)' }}
                onClick={() => setActiveFailure({ regionId: 'eu-west' })}
              >
                Fail EU-West
              </button>
            </div>
          )}
        </div>
      </div>

      {/* World Map SVG Canvas */}
      <div className="topology-canvas-wrap">
        <svg viewBox="0 0 1000 520" className="topology-svg">
          <defs>
            {/* Grid Pattern */}
            <pattern id="topo-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            </pattern>
            {/* Traffic Pulse Filter */}
            <filter id="glow-pulse" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Grid */}
          <rect width="1000" height="520" fill="var(--color-bg)" />
          <rect width="1000" height="520" fill="url(#topo-grid)" />

          {/* Faint World Landmass Outline Contours */}
          <g opacity="0.12" fill="none" stroke="var(--color-text)" strokeWidth="1">
            {/* North America approximation */}
            <path d="M 120 120 C 180 90, 280 100, 320 160 C 340 220, 260 280, 200 290 C 160 300, 140 250, 120 200 Z" />
            {/* Europe approximation */}
            <path d="M 460 110 C 530 100, 580 130, 560 190 C 520 210, 480 200, 460 160 Z" />
            {/* Asia Pacific approximation */}
            <path d="M 640 140 C 780 120, 850 200, 820 320 C 760 360, 680 320, 640 220 Z" />
            {/* South America approximation */}
            <path d="M 280 320 C 330 340, 350 420, 310 470 C 270 450, 260 380, 280 320 Z" />
          </g>

          {/* Cross-Region Network Arcs */}
          {activeRegions.map((sourceDep, i) => {
            const sourceReg = REGIONS[sourceDep.regionId];
            if (!sourceReg) return null;

            return activeRegions.slice(i + 1).map(targetDep => {
              const targetReg = REGIONS[targetDep.regionId];
              if (!targetReg) return null;

              const x1 = (sourceReg.x / 100) * 1000;
              const y1 = (sourceReg.y / 100) * 520;
              const x2 = (targetReg.x / 100) * 1000;
              const y2 = (targetReg.y / 100) * 520;
              const midX = (x1 + x2) / 2;
              const midY = Math.min(y1, y2) - 40; // Curve upward

              const latency = INTER_REGION_LATENCY_MS[sourceReg.id]?.[targetReg.id] || 75;
              const arcPath = `M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`;

              return (
                <g key={`${sourceReg.id}-${targetReg.id}`}>
                  {/* Static Arc Line */}
                  <path
                    d={arcPath}
                    fill="none"
                    stroke="var(--color-border-strong)"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    opacity="0.6"
                  />

                  {/* Animated Data Flow Pulse */}
                  <circle r="3.5" fill="var(--color-accent)" filter="url(#glow-pulse)">
                    <animateMotion
                      dur={`${Math.max(1.2, latency / 40)}s`}
                      repeatCount="indefinite"
                      path={arcPath}
                    />
                  </circle>

                  {/* Latency Tag at midpoint */}
                  <rect
                    x={midX - 24}
                    y={midY - 10}
                    width="48"
                    height="18"
                    rx="3"
                    fill="var(--color-bg-elevated)"
                    stroke="var(--color-border)"
                  />
                  <text
                    x={midX}
                    y={midY + 3}
                    textAnchor="middle"
                    fill="var(--color-text-secondary)"
                    fontSize="9"
                    fontFamily="var(--font-mono)"
                  >
                    {latency}ms
                  </text>
                </g>
              );
            });
          })}

          {/* Regional Cluster Nodes */}
          {Object.values(REGIONS).map(reg => {
            const dep = regionalDeployments.find(d => d.regionId === reg.id);
            const isOffline = activeFailure?.regionId === reg.id;
            const trafficShare = dep ? Math.round(dep.trafficShare * 100) : 0;
            const cx = (reg.x / 100) * 1000;
            const cy = (reg.y / 100) * 520;

            return (
              <g key={reg.id} transform={`translate(${cx}, ${cy})`}>
                {/* Glow ring */}
                {!isOffline && (
                  <circle
                    r="28"
                    fill="none"
                    stroke="var(--color-accent)"
                    strokeWidth="1"
                    opacity="0.25"
                  >
                    <animate attributeName="r" values="24;34;24" dur="3s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.3;0.05;0.3" dur="3s" repeatCount="indefinite" />
                  </circle>
                )}

                {/* Node Box */}
                <rect
                  x="-75"
                  y="-40"
                  width="150"
                  height="80"
                  rx="8"
                  fill="var(--color-bg-surface)"
                  stroke={isOffline ? 'var(--color-critical)' : 'var(--color-accent)'}
                  strokeWidth={isOffline ? '2' : '1.5'}
                  strokeDasharray={isOffline ? '6 4' : 'none'}
                />

                {/* Status Dot */}
                <circle
                  cx="-58"
                  cy="-24"
                  r="4"
                  fill={isOffline ? 'var(--color-critical)' : 'var(--color-success)'}
                />

                {/* Region Title */}
                <text
                  x="-48"
                  y="-20"
                  fill="var(--color-text)"
                  fontSize="11"
                  fontWeight="600"
                  fontFamily="var(--font-mono)"
                >
                  {reg.code.toUpperCase()}
                </text>

                {/* City */}
                <text
                  x="-58"
                  y="-4"
                  fill="var(--color-text-secondary)"
                  fontSize="9.5"
                >
                  {reg.city}, {reg.country}
                </text>

                {/* Traffic Allocation & Status */}
                <text
                  x="-58"
                  y="16"
                  fill={isOffline ? 'var(--color-critical)' : 'var(--color-cost)'}
                  fontSize="10"
                  fontFamily="var(--font-mono)"
                  fontWeight="600"
                >
                  {isOffline ? 'OFFLINE (FAILED)' : `${trafficShare}% TRAFFIC`}
                </text>

                {/* Components summary */}
                <text
                  x="-58"
                  y="30"
                  fill="var(--color-text-muted)"
                  fontSize="8.5"
                  fontFamily="var(--font-mono)"
                >
                  {architecture.nodes.length} Components Active
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Regional Traffic Allocation Controls */}
      <div className="regional-controls-strip">
        <span className="text-label" style={{ color: 'var(--color-accent)' }}>REGIONAL TRAFFIC SPLIT:</span>
        <div className="regional-sliders">
          {regionalDeployments.map(dep => {
            const reg = REGIONS[dep.regionId];
            if (!reg) return null;
            const isOffline = activeFailure?.regionId === dep.regionId;

            return (
              <div key={dep.regionId} className="region-slider-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span className="text-caption text-mono" style={{ color: isOffline ? 'var(--color-critical)' : 'var(--color-text)' }}>
                    {reg.name} {isOffline ? '(FAILED)' : ''}
                  </span>
                  <span className="text-mono" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                    {Math.round(dep.trafficShare * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  disabled={isOffline}
                  value={Math.round(dep.trafficShare * 100)}
                  onChange={e => setRegionalDeployment(dep.regionId, Number(e.target.value) / 100)}
                  className="slider"
                />
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        .topology-lens {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--color-bg);
          position: relative;
        }
        .topology-status-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-3) var(--space-4);
          background: var(--color-bg-elevated);
          border-bottom: 1px solid var(--color-border);
          gap: var(--space-4);
          flex-wrap: wrap;
        }
        .status-kpis {
          display: flex;
          gap: var(--space-6);
          align-items: center;
          flex-wrap: wrap;
        }
        .status-kpi {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .status-kpi__val {
          font-size: 0.9375rem;
          font-weight: 600;
        }
        .failure-actions {
          display: flex;
          align-items: center;
        }
        .topology-canvas-wrap {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: var(--color-bg);
          position: relative;
        }
        .topology-svg {
          width: 100%;
          height: 100%;
          max-height: calc(100vh - 200px);
        }
        .regional-controls-strip {
          display: flex;
          align-items: center;
          gap: var(--space-4);
          padding: var(--space-3) var(--space-4);
          background: var(--color-bg-elevated);
          border-top: 1px solid var(--color-border);
          flex-wrap: wrap;
        }
        .regional-sliders {
          display: flex;
          flex: 1;
          gap: var(--space-4);
          flex-wrap: wrap;
        }
        .region-slider-item {
          flex: 1;
          min-width: 160px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
      `}</style>
    </div>
  );
}
