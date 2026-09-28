'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useArchitectureStore } from '@/lib/state/architectureStore';
import {
  calculateWhatIfDelta,
  calculateCapacityPlan,
  type WhatIfParameters,
} from '@/lib/simulation/scenarios';
import { formatCurrency, formatLatency, formatNumber, MODEL_PRICING } from '@/lib/simulation/engine';

export default function WhatIfPanel({ onClose }: { onClose?: () => void }) {
  const {
    architecture,
    workload,
    addScenario,
    setWorkload,
    updateNodeModel,
  } = useArchitectureStore();

  const [trafficMult, setTrafficMult] = useState<number>(1);
  const [cacheOverride, setCacheOverride] = useState<number | undefined>(undefined);
  const [modelOverride, setModelOverride] = useState<string | undefined>(undefined);
  const [growthRate, setGrowthRate] = useState<number>(25);

  const whatIfParams: WhatIfParameters = useMemo(() => ({
    trafficMultiplier: trafficMult,
    overrideCacheHitRate: cacheOverride,
    overrideModelId: modelOverride,
  }), [trafficMult, cacheOverride, modelOverride]);

  const deltaResult = useMemo(() => {
    return calculateWhatIfDelta(workload, architecture, whatIfParams);
  }, [workload, architecture, whatIfParams]);

  const capacityPlan = useMemo(() => {
    return calculateCapacityPlan(workload, architecture, growthRate);
  }, [workload, architecture, growthRate]);

  const handleApplyToCanvas = () => {
    if (trafficMult !== 1) {
      setWorkload({ requestsPerMonth: Math.round(workload.requestsPerMonth * trafficMult) });
    }
    if (cacheOverride !== undefined) {
      setWorkload({ cacheHitRate: cacheOverride });
    }
    if (modelOverride) {
      const modelNode = architecture.nodes.find(n => n.type === 'model');
      if (modelNode) {
        updateNodeModel(modelNode.id, modelOverride);
      }
    }
    onClose?.();
  };

  const handleSaveScenario = () => {
    let scTitle = `What-If: ${trafficMult}× Traffic`;
    if (cacheOverride === 0) scTitle = 'What-If: Cache Outage';
    if (modelOverride) scTitle = `What-If: ${MODEL_PRICING[modelOverride]?.product || modelOverride}`;
    addScenario(scTitle);
  };

  return (
    <div className="what-if-panel">
      {/* Header */}
      <div className="what-if-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--color-accent)', fontSize: '1rem' }}>⚡</span>
            <span className="text-label" style={{ color: 'var(--color-accent)' }}>WHAT-IF SIMULATION &amp; CAPACITY ENGINE</span>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem', marginTop: '2px' }}>
            Simulate perturbations, traffic spikes, and failure conditions against deterministic baseline economics.
          </p>
        </div>
        {onClose && (
          <button className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={onClose}>
            ✕
          </button>
        )}
      </div>

      <div className="what-if-body">
        {/* Left Column: Perturbation Controls */}
        <div className="what-if-controls">
          <div className="control-section">
            <span className="text-label" style={{ marginBottom: 'var(--space-2)', display: 'block' }}>
              TRAFFIC VOLUME MULTIPLIER
            </span>
            <div className="pills-grid">
              {[
                { label: '1× Baseline', mult: 1 },
                { label: '2× Growth', mult: 2 },
                { label: '5× Surge', mult: 5 },
                { label: '10× Peak', mult: 10 },
              ].map(item => (
                <button
                  key={item.mult}
                  className={`pill-btn ${trafficMult === item.mult ? 'active' : ''}`}
                  onClick={() => setTrafficMult(item.mult)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <span className="text-caption text-mono" style={{ color: 'var(--color-text-muted)', marginTop: '4px', display: 'block' }}>
              Projected: {formatNumber(Math.round(workload.requestsPerMonth * trafficMult))} req/mo
            </span>
          </div>

          <div className="control-section">
            <span className="text-label" style={{ marginBottom: 'var(--space-2)', display: 'block' }}>
              CACHE AVAILABILITY STRESS
            </span>
            <div className="pills-grid">
              <button
                className={`pill-btn ${cacheOverride === undefined ? 'active' : ''}`}
                onClick={() => setCacheOverride(undefined)}
              >
                Normal ({Math.round(workload.cacheHitRate * 100)}%)
              </button>
              <button
                className={`pill-btn ${cacheOverride === 0 ? 'active alert' : ''}`}
                onClick={() => setCacheOverride(0)}
              >
                0% Cache Outage
              </button>
              <button
                className={`pill-btn ${cacheOverride === 0.65 ? 'active' : ''}`}
                onClick={() => setCacheOverride(0.65)}
              >
                65% High Cache
              </button>
            </div>
          </div>

          <div className="control-section">
            <span className="text-label" style={{ marginBottom: 'var(--space-2)', display: 'block' }}>
              MODEL TIER MIGRATION
            </span>
            <div className="pills-grid">
              <button
                className={`pill-btn ${modelOverride === undefined ? 'active' : ''}`}
                onClick={() => setModelOverride(undefined)}
              >
                Current Model
              </button>
              <button
                className={`pill-btn ${modelOverride === 'gemini-2.0-flash' ? 'active' : ''}`}
                onClick={() => setModelOverride('gemini-2.0-flash')}
              >
                Gemini 2.0 Flash
              </button>
              <button
                className={`pill-btn ${modelOverride === 'claude-3.5-sonnet' ? 'active' : ''}`}
                onClick={() => setModelOverride('claude-3.5-sonnet')}
              >
                Claude 3.5 Sonnet
              </button>
              <button
                className={`pill-btn ${modelOverride === 'gpt-4o' ? 'active' : ''}`}
                onClick={() => setModelOverride('gpt-4o')}
              >
                OpenAI GPT-4o
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: 'var(--space-4)' }}>
            <button onClick={handleApplyToCanvas} className="btn btn-primary" style={{ flex: 1, fontSize: '0.8125rem' }}>
              Apply to Canvas
            </button>
            <button onClick={handleSaveScenario} className="btn btn-secondary" style={{ flex: 1, fontSize: '0.8125rem' }}>
              Save Scenario
            </button>
          </div>
        </div>

        {/* Right Column: Delta Matrix & Capacity Forecast */}
        <div className="what-if-results">
          {/* Side-by-Side Delta Matrix */}
          <div className="delta-matrix-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
              <span className="text-label">SIMULATED WHAT-IF DELTA</span>
              <span className={`badge badge--${deltaResult.riskAssessment === 'Critical' ? 'critical' : deltaResult.riskAssessment === 'High' ? 'warning' : 'neutral'}`}>
                Risk: {deltaResult.riskAssessment}
              </span>
            </div>

            <div className="delta-grid">
              <div className="delta-col">
                <span className="text-caption text-mono" style={{ color: 'var(--color-text-muted)' }}>METRIC</span>
                <span className="delta-cell-label">Monthly Cost</span>
                <span className="delta-cell-label">P95 Latency</span>
                <span className="delta-cell-label">Capacity Util.</span>
              </div>

              <div className="delta-col">
                <span className="text-caption text-mono" style={{ color: 'var(--color-text-muted)' }}>CURRENT</span>
                <span className="delta-cell-val text-mono">{formatCurrency(deltaResult.baseline.monthlyCost)}</span>
                <span className="delta-cell-val text-mono">{formatLatency(deltaResult.baseline.p95Latency)}</span>
                <span className="delta-cell-val text-mono">{deltaResult.baseline.capacityUtilization.toFixed(0)}%</span>
              </div>

              <div className="delta-col">
                <span className="text-caption text-mono" style={{ color: 'var(--color-text-muted)' }}>PROJECTED</span>
                <span className="delta-cell-val text-mono" style={{ color: 'var(--color-cost)' }}>
                  {formatCurrency(deltaResult.projected.monthlyCost)}
                </span>
                <span className="delta-cell-val text-mono" style={{ color: 'var(--color-performance)' }}>
                  {formatLatency(deltaResult.projected.p95Latency)}
                </span>
                <span className="delta-cell-val text-mono" style={{ color: deltaResult.projected.capacityUtilization > 100 ? 'var(--color-critical)' : 'var(--color-capacity)' }}>
                  {deltaResult.projected.capacityUtilization.toFixed(0)}%
                </span>
              </div>

              <div className="delta-col">
                <span className="text-caption text-mono" style={{ color: 'var(--color-text-muted)' }}>DELTA</span>
                <span className="delta-cell-val text-mono" style={{ color: deltaResult.deltaCost <= 0 ? 'var(--color-success)' : 'var(--color-cost)' }}>
                  {deltaResult.deltaCost >= 0 ? '+' : ''}{formatCurrency(deltaResult.deltaCost)} ({deltaResult.deltaCostPercent >= 0 ? '+' : ''}{deltaResult.deltaCostPercent.toFixed(0)}%)
                </span>
                <span className="delta-cell-val text-mono" style={{ color: deltaResult.deltaLatency <= 0 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                  {deltaResult.deltaLatency >= 0 ? '+' : ''}{deltaResult.deltaLatency}ms
                </span>
                <span className="delta-cell-val text-mono" style={{ color: deltaResult.deltaCapacity <= 0 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                  {deltaResult.deltaCapacity >= 0 ? '+' : ''}{deltaResult.deltaCapacity.toFixed(0)}%
                </span>
              </div>
            </div>

            <div className="explanation-callout">
              <span className="text-mono" style={{ color: 'var(--color-accent)', marginRight: '6px' }}>✦</span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.45 }}>
                {deltaResult.explanation}
              </span>
            </div>
          </div>

          {/* 12-Month Compounding Capacity Planning Forecast */}
          <div className="capacity-forecast-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
              <div>
                <span className="text-label">12-MONTH COMPOUNDING CAPACITY FORECAST</span>
                <p className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
                  Predicts runway and month of saturation under compound monthly traffic growth
                </p>
              </div>

              <div className="growth-selector">
                {[10, 25, 50].map(rate => (
                  <button
                    key={rate}
                    className={`growth-btn ${growthRate === rate ? 'active' : ''}`}
                    onClick={() => setGrowthRate(rate)}
                  >
                    +{rate}%/mo
                  </button>
                ))}
              </div>
            </div>

            {/* Run-Rate Alert Banner */}
            <div className={`saturation-alert ${capacityPlan.monthsToSaturation !== null ? 'alert--warning' : 'alert--healthy'}`}>
              <span className="text-caption text-mono" style={{ fontWeight: 600 }}>
                {capacityPlan.monthsToSaturation !== null
                  ? `SATURATION IN ${capacityPlan.monthsToSaturation} MONTHS (LIMITER: ${capacityPlan.limitingComponent.toUpperCase()})`
                  : 'HEALTHY CAPACITY RUNWAY (>12 MONTHS)'}
              </span>
              <p style={{ fontSize: '0.75rem', marginTop: '2px', color: 'var(--color-text-secondary)' }}>
                {capacityPlan.recommendation}
              </p>
            </div>

            {/* Monthly Capacity Histogram Bars */}
            <div className="forecast-bars-grid">
              {capacityPlan.forecastPoints.map(pt => (
                <div key={pt.month} className="forecast-bar-item">
                  <div className="forecast-bar-track">
                    <div
                      className="forecast-bar-fill"
                      style={{
                        height: `${Math.min(100, (pt.capacityUtilization / 150) * 100)}%`,
                        background: pt.isSaturated ? 'var(--color-critical)' : pt.capacityUtilization > 85 ? 'var(--color-warning)' : 'var(--color-capacity)',
                      }}
                    />
                  </div>
                  <span className="forecast-month-label text-mono">M{pt.month}</span>
                  <span className="forecast-cap-val text-mono">{pt.capacityUtilization}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .what-if-panel {
          background: var(--color-bg-elevated);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-6);
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
          max-height: 85vh;
          overflow-y: auto;
        }
        .what-if-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-bottom: var(--space-4);
          border-bottom: 1px solid var(--color-border);
        }
        .what-if-body {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: var(--space-6);
        }
        .what-if-controls {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
          border-right: 1px solid var(--color-border);
          padding-right: var(--space-6);
        }
        .control-section {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .pills-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 6px;
        }
        .pill-btn {
          padding: 8px 10px;
          background: var(--color-bg-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          color: var(--color-text-secondary);
          font-size: 0.75rem;
          cursor: pointer;
          transition: all var(--duration-fast);
        }
        .pill-btn:hover {
          border-color: var(--color-border-strong);
          color: var(--color-text);
        }
        .pill-btn.active {
          border-color: var(--color-accent);
          background: var(--color-bg);
          color: var(--color-text);
          font-weight: 500;
        }
        .pill-btn.alert {
          border-color: var(--color-critical);
          color: var(--color-critical);
        }
        .what-if-results {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }
        .delta-matrix-card, .capacity-forecast-card {
          background: var(--color-bg-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: var(--space-4);
        }
        .delta-grid {
          display: grid;
          grid-template-columns: 120px 1fr 1fr 1.3fr;
          gap: var(--space-3);
          padding: var(--space-3) 0;
          border-bottom: 1px solid var(--color-border-subtle);
        }
        .delta-col {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .delta-cell-label {
          font-size: 0.8125rem;
          color: var(--color-text-secondary);
        }
        .delta-cell-val {
          font-size: 0.875rem;
          font-weight: 500;
        }
        .explanation-callout {
          margin-top: var(--space-3);
          padding: 8px 12px;
          background: var(--color-bg);
          border-radius: var(--radius-sm);
        }
        .growth-selector {
          display: flex;
          gap: 4px;
        }
        .growth-btn {
          padding: 4px 8px;
          font-size: 0.6875rem;
          font-family: var(--font-mono);
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-full);
          color: var(--color-text-secondary);
          cursor: pointer;
        }
        .growth-btn.active {
          border-color: var(--color-accent);
          color: var(--color-text);
        }
        .saturation-alert {
          padding: 8px 12px;
          border-radius: var(--radius-sm);
          margin-bottom: var(--space-4);
        }
        .alert--warning {
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.3);
          color: #fcd34d;
        }
        .alert--healthy {
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.3);
          color: #86efac;
        }
        .forecast-bars-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 6px;
          height: 120px;
          align-items: flex-end;
          padding-top: var(--space-2);
        }
        .forecast-bar-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          height: 100%;
          justify-content: flex-end;
        }
        .forecast-bar-track {
          width: 100%;
          height: 80px;
          background: var(--color-bg);
          border-radius: 2px;
          display: flex;
          align-items: flex-end;
          overflow: hidden;
        }
        .forecast-bar-fill {
          width: 100%;
          transition: height 0.3s ease;
        }
        .forecast-month-label {
          font-size: 0.625rem;
          color: var(--color-text-muted);
        }
        .forecast-cap-val {
          font-size: 0.5625rem;
          color: var(--color-text-secondary);
        }
        @media (max-width: 860px) {
          .what-if-body {
            grid-template-columns: 1fr;
          }
          .what-if-controls {
            border-right: none;
            padding-right: 0;
            border-bottom: 1px solid var(--color-border);
            padding-bottom: var(--space-4);
          }
        }
      `}</style>
    </div>
  );
}
