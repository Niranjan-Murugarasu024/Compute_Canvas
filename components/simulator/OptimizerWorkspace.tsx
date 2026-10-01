'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useArchitectureStore } from '@/lib/state/architectureStore';
import {
  generateTradeoffFrontier,
  type FrontierCandidate,
} from '@/lib/simulation/optimizer';
import { formatCurrency, formatLatency } from '@/lib/simulation/engine';

export default function OptimizerWorkspace({ onClose }: { onClose?: () => void }) {
  const { architecture, workload, loadArchitecture } = useArchitectureStore();
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('balanced');
  const [appliedToast, setAppliedToast] = useState(false);

  const frontierResult = useMemo(() => {
    return generateTradeoffFrontier(workload, architecture);
  }, [workload, architecture]);

  const activeCandidate = frontierResult.candidates.find(c => c.id === selectedCandidateId) || frontierResult.candidates[0];

  const handleApply = (candidate: FrontierCandidate) => {
    loadArchitecture(candidate.architecture, candidate.workload);
    setAppliedToast(true);
    setTimeout(() => {
      setAppliedToast(false);
      onClose?.();
    }, 1200);
  };

  return (
    <div className="optimizer-workspace">
      {/* Header */}
      <div className="optimizer-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge--neutral text-mono" style={{ fontSize: '0.6875rem' }}>PARETO TRADEOFF FRONTIER</span>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem', marginTop: '2px' }}>
            Deterministic architectural optimization. Never a single opaque answer — choose your optimal point along the Pareto frontier.
          </p>
        </div>
        {onClose && (
          <button className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={onClose}>
            ✕
          </button>
        )}
      </div>

      {/* Candidates Grid */}
      <div className="candidates-tabs">
        {frontierResult.candidates.map(c => {
          const isSelected = selectedCandidateId === c.id;
          return (
            <button
              key={c.id}
              className={`candidate-tab-card ${isSelected ? 'active' : ''}`}
              onClick={() => setSelectedCandidateId(c.id)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="badge badge--neutral text-mono" style={{ fontSize: '0.625rem' }}>{c.badge}</span>
                <span className="text-caption text-mono" style={{ color: c.deltaCost <= 0 ? 'var(--color-success)' : 'var(--color-cost)' }}>
                  {c.deltaCost >= 0 ? '+' : ''}{formatCurrency(c.deltaCost)}
                </span>
              </div>
              <h4 className="candidate-title">{c.title}</h4>
              <div className="candidate-mini-metrics">
                <span>{formatCurrency(c.simulation.monthlyCost)}/mo</span>
                <span>&bull;</span>
                <span>{formatLatency(c.simulation.p95Latency)}</span>
                <span>&bull;</span>
                <span>{c.simulation.qualityEstimate}% Qual</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Candidate Detailed Inspection */}
      <div className="candidate-detail-box">
        <div className="detail-top-row">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{activeCandidate.title}</h3>
              <span className="badge badge--success text-mono">{activeCandidate.objective.toUpperCase()}</span>
            </div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
              {activeCandidate.tradeoffSummary}
            </p>
          </div>

          <button
            onClick={() => handleApply(activeCandidate)}
            className="btn btn-primary"
            style={{ flexShrink: 0, padding: '8px 20px' }}
          >
            {appliedToast ? 'Applied to Canvas!' : 'Apply Candidate to Canvas &rarr;'}
          </button>
        </div>

        {/* Metric Comparison Strip */}
        <div className="metrics-compare-strip">
          <div className="metric-compare-col">
            <span className="text-caption" style={{ color: 'var(--color-text-muted)' }}>EST. MONTHLY SPEND</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span className="text-mono" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-cost)' }}>
                {formatCurrency(activeCandidate.simulation.monthlyCost)}
              </span>
              <span className="text-mono" style={{ fontSize: '0.75rem', color: activeCandidate.deltaCost <= 0 ? 'var(--color-success)' : 'var(--color-cost)' }}>
                ({activeCandidate.deltaCost >= 0 ? '+' : ''}{formatCurrency(activeCandidate.deltaCost)})
              </span>
            </div>
            <span className="text-caption text-mono" style={{ fontSize: '0.6875rem', opacity: 0.7 }}>
              ${(activeCandidate.simulation.costPerRequest * 1000).toFixed(3)}/1K req
            </span>
          </div>

          <div className="metric-compare-col">
            <span className="text-caption" style={{ color: 'var(--color-text-muted)' }}>P95 LATENCY</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span className="text-mono" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-performance)' }}>
                {formatLatency(activeCandidate.simulation.p95Latency)}
              </span>
              <span className="text-mono" style={{ fontSize: '0.75rem', color: activeCandidate.deltaLatency <= 0 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                ({activeCandidate.deltaLatency >= 0 ? '+' : ''}{activeCandidate.deltaLatency}ms)
              </span>
            </div>
            <span className="text-caption text-mono" style={{ fontSize: '0.6875rem', opacity: 0.7 }}>
              {activeCandidate.simulation.throughputRPS} RPS throughput
            </span>
          </div>

          <div className="metric-compare-col">
            <span className="text-caption" style={{ color: 'var(--color-text-muted)' }}>CAPACITY UTILIZATION</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span className="text-mono" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-capacity)' }}>
                {activeCandidate.simulation.capacityUtilization.toFixed(0)}%
              </span>
              <span className="text-mono" style={{ fontSize: '0.75rem', color: activeCandidate.deltaCapacity <= 0 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                ({activeCandidate.deltaCapacity >= 0 ? '+' : ''}{activeCandidate.deltaCapacity.toFixed(0)}%)
              </span>
            </div>
            <span className="text-caption text-mono" style={{ fontSize: '0.6875rem', opacity: 0.7 }}>
              Operating buffer: {(100 - activeCandidate.simulation.capacityUtilization).toFixed(0)}%
            </span>
          </div>

          <div className="metric-compare-col">
            <span className="text-caption" style={{ color: 'var(--color-text-muted)' }} title="Artificial Analysis Intelligence Index & LMSYS Arena">QUALITY BENCHMARK [AA]</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span className="text-mono" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-quality)' }}>
                {activeCandidate.simulation.qualityEstimate}%
              </span>
            </div>
            <span className="text-caption text-mono" style={{ fontSize: '0.6875rem', opacity: 0.7 }}>
              Artificial Analysis Index
            </span>
          </div>
        </div>

        {/* Architectural Changes List & Engineering Rationale */}
        <div className="detail-bottom-grid">
          <div className="detail-card">
            <span className="text-label" style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)', display: 'block' }}>
              CONCRETE ARCHITECTURAL CHANGES ({activeCandidate.changes.length})
            </span>
            <ul className="changes-list">
              {activeCandidate.changes.map((ch, idx) => (
                <li key={idx} className="change-item">
                  <span style={{ color: 'var(--color-accent)', marginRight: '6px' }}>&bull;</span>
                  <span>{ch}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="detail-card">
            <span className="text-label" style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)', display: 'block' }}>
              ENGINEERING TRADEOFF RATIONALE
            </span>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.45 }}>
              {activeCandidate.rationale}
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .optimizer-workspace {
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
        .optimizer-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-bottom: var(--space-4);
          border-bottom: 1px solid var(--color-border);
        }
        .candidates-tabs {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--space-3);
        }
        .candidate-tab-card {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: var(--space-3) var(--space-4);
          background: var(--color-bg-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          text-align: left;
          cursor: pointer;
          transition: all var(--duration-fast);
        }
        .candidate-tab-card:hover {
          border-color: var(--color-border-strong);
        }
        .candidate-tab-card.active {
          border-color: var(--color-border-strong);
          background: var(--color-bg);
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
        }
        .candidate-title {
          font-family: var(--font-ui);
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--color-text);
          margin: 2px 0;
        }
        .candidate-mini-metrics {
          display: flex;
          gap: 4px;
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          color: var(--color-text-muted);
        }
        .candidate-detail-box {
          background: var(--color-bg-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          padding: var(--space-6);
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
        }
        .detail-top-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: var(--space-4);
          padding-bottom: var(--space-4);
          border-bottom: 1px solid var(--color-border-subtle);
        }
        .metrics-compare-strip {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--space-4);
          padding-bottom: var(--space-4);
          border-bottom: 1px solid var(--color-border-subtle);
        }
        .metric-compare-col {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .detail-bottom-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-4);
        }
        .detail-card {
          background: var(--color-bg);
          border: 1px solid var(--color-border-subtle);
          border-radius: var(--radius-sm);
          padding: var(--space-4);
        }
        .changes-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .change-item {
          font-size: 0.8125rem;
          color: var(--color-text-secondary);
        }
        @media (max-width: 860px) {
          .candidates-tabs {
            grid-template-columns: repeat(2, 1fr);
          }
          .detail-top-row {
            flex-direction: column;
          }
          .metrics-compare-strip {
            grid-template-columns: repeat(2, 1fr);
          }
          .detail-bottom-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
