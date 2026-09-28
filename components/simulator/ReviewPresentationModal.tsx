'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useArchitectureStore } from '@/lib/state/architectureStore';
import { simulate, formatCurrency, formatLatency, formatNumber } from '@/lib/simulation/engine';

export default function ReviewPresentationModal({ onClose }: { onClose: () => void }) {
  const { architecture, workload, comments } = useArchitectureStore();
  const [currentStep, setCurrentStep] = useState(0);

  const sim = simulate(workload, architecture);

  const steps = [
    { id: 'arch', title: '1. Architecture Topology' },
    { id: 'assumptions', title: '2. Workload & Assumptions' },
    { id: 'economics', title: '3. Economic Model & Cost' },
    { id: 'performance', title: '4. Performance Profile' },
    { id: 'risks', title: '5. Bottlenecks & Resilience' },
    { id: 'decisions', title: '6. Decisions & Open Questions' },
  ];

  // Arrow key navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        setCurrentStep(s => Math.min(steps.length - 1, s + 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentStep(s => Math.max(0, s - 1));
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [steps.length, onClose]);

  return (
    <div className="presentation-backdrop">
      <div className="presentation-container">
        {/* Presentation Header */}
        <header className="presentation-header">
          <div className="header-left">
            <span className="badge badge--neutral text-mono">ARCHITECTURE REVIEW DECK</span>
            <h2 className="deck-title">{architecture.name || 'System Architecture Review'}</h2>
          </div>

          {/* Stepper Tabs */}
          <div className="deck-stepper">
            {steps.map((st, idx) => (
              <button
                key={st.id}
                className={`step-tab ${currentStep === idx ? 'active' : ''}`}
                onClick={() => setCurrentStep(idx)}
              >
                {st.title}
              </button>
            ))}
          </div>

          <button className="btn btn-ghost" onClick={onClose} aria-label="Exit presentation mode">
            ✕ Exit
          </button>
        </header>

        {/* Slide Content */}
        <div className="presentation-slide-wrap">
          <AnimatePresence mode="wait">
            {currentStep === 0 && (
              <motion.div
                key="step-0"
                className="slide-content"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="slide-hero">
                  <span className="text-label" style={{ color: 'var(--color-accent)' }}>SECTION 1 &bull; TOPOLOGY OVERVIEW</span>
                  <h3 className="slide-title">System Topology &amp; Component Pipeline</h3>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', maxWidth: '680px' }}>
                    Constructed with {architecture.nodes.length} architectural nodes and {architecture.edges.length} directed wires.
                  </p>
                </div>

                <div className="slide-nodes-strip">
                  {architecture.nodes.map(n => (
                    <div key={n.id} className="review-node-card">
                      <span className="badge badge--neutral text-mono" style={{ fontSize: '0.625rem' }}>{n.type}</span>
                      <h4 style={{ fontSize: '0.9375rem', margin: '4px 0', fontWeight: 600 }}>{n.label}</h4>
                      <span className="text-caption text-mono" style={{ color: 'var(--color-text-muted)' }}>
                        {n.modelId || 'Managed Infra'}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="kpi-strip">
                  <div className="kpi-item">
                    <span className="kpi-label">TOTAL PROJECTED SPEND</span>
                    <span className="kpi-val" style={{ color: 'var(--color-cost)' }}>{formatCurrency(sim.monthlyCost)}/mo</span>
                  </div>
                  <div className="kpi-item">
                    <span className="kpi-label">P95 LATENCY TARGET</span>
                    <span className="kpi-val" style={{ color: 'var(--color-performance)' }}>{formatLatency(sim.p95Latency)}</span>
                  </div>
                  <div className="kpi-item">
                    <span className="kpi-label">QUALITY ESTIMATE</span>
                    <span className="kpi-val" style={{ color: 'var(--color-quality)' }}>{sim.qualityEstimate}%</span>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 1 && (
              <motion.div
                key="step-1"
                className="slide-content"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="slide-hero">
                  <span className="text-label" style={{ color: 'var(--color-accent)' }}>SECTION 2 &bull; OPERATIONAL PROFILE</span>
                  <h3 className="slide-title">Workload Specification &amp; Assumptions</h3>
                </div>

                <div className="assumptions-grid">
                  <div className="assumption-card">
                    <span className="assumption-label">MONTHLY REQUEST TRAFFIC</span>
                    <span className="assumption-num">{formatNumber(workload.requestsPerMonth)}</span>
                    <span className="text-caption">~{Math.round(workload.requestsPerMonth / (30 * 24 * 3600))} requests/sec average</span>
                  </div>
                  <div className="assumption-card">
                    <span className="assumption-label">AVERAGE PROMPT TOKENS</span>
                    <span className="assumption-num">{workload.avgInputTokens} tokens</span>
                    <span className="text-caption">{workload.avgOutputTokens} completion tokens</span>
                  </div>
                  <div className="assumption-card">
                    <span className="assumption-label">SEMANTIC CACHE HIT RATE</span>
                    <span className="assumption-num" style={{ color: 'var(--color-quality)' }}>{Math.round(workload.cacheHitRate * 100)}%</span>
                    <span className="text-caption">Redis / Prompt cache bypass rate</span>
                  </div>
                  <div className="assumption-card">
                    <span className="assumption-label">PEAK CONCURRENCY</span>
                    <span className="assumption-num">{workload.concurrency} concurrent req</span>
                    <span className="text-caption">Max in-flight parallel operations</span>
                  </div>
                </div>

                <div className="assumptions-table-wrap">
                  <table className="assumptions-table">
                    <thead>
                      <tr>
                        <th>Domain</th>
                        <th>Engine Specification Detail</th>
                        <th>Confidence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sim.assumptions.map((a, i) => (
                        <tr key={i}>
                          <td className="text-mono" style={{ color: 'var(--color-accent)' }}>{a.category}</td>
                          <td style={{ color: 'var(--color-text-secondary)' }}>{a.detail}</td>
                          <td className="text-mono" style={{ color: 'var(--color-success)' }}>High (Vendor SLA)</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step-2"
                className="slide-content"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="slide-hero">
                  <span className="text-label" style={{ color: 'var(--color-cost)' }}>SECTION 3 &bull; ECONOMIC DECOMPOSITION</span>
                  <h3 className="slide-title">Detailed Cost Decomposition</h3>
                </div>

                <div className="cost-review-wrap">
                  <div className="cost-total-banner">
                    <div>
                      <span className="text-label">ESTIMATED MONTHLY COMPUTE RUN-RATE</span>
                      <p className="text-mono cost-banner-val">{formatCurrency(sim.monthlyCost)}</p>
                      <span className="text-caption text-mono" style={{ color: 'var(--color-text-muted)' }}>
                        ${(sim.costPerRequest * 1000).toFixed(3)} per 1,000 inquiries
                      </span>
                    </div>
                  </div>

                  <div className="cost-breakdown-table">
                    {Object.entries(sim.costBreakdown)
                      .filter(([k, v]) => k !== 'total' && (v as number) > 0)
                      .map(([key, val]) => (
                        <div key={key} className="cost-review-row">
                          <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>
                            {key.replace(/([A-Z])/g, ' $1')}
                          </span>
                          <span className="text-mono" style={{ fontWeight: 600 }}>
                            {formatCurrency(val as number)} ({Math.round(((val as number) / sim.costBreakdown.total) * 100)}%)
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step-3"
                className="slide-content"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="slide-hero">
                  <span className="text-label" style={{ color: 'var(--color-performance)' }}>SECTION 4 &bull; LATENCY BUDGET</span>
                  <h3 className="slide-title">P95 &amp; P50 Latency Distribution</h3>
                </div>

                <div className="latency-review-grid">
                  <div className="latency-card">
                    <span className="text-caption">P50 MEDIAN LATENCY</span>
                    <span className="latency-num" style={{ color: 'var(--color-performance)' }}>
                      {Math.round(sim.p95Latency * 0.65)}ms
                    </span>
                    <span className="text-caption">Standard nominal response</span>
                  </div>

                  <div className="latency-card">
                    <span className="text-caption">P95 TAIL LATENCY</span>
                    <span className="latency-num" style={{ color: 'var(--color-performance)' }}>
                      {formatLatency(sim.p95Latency)}
                    </span>
                    <span className="text-caption">95th percentile under peak queuing</span>
                  </div>

                  <div className="latency-card">
                    <span className="text-caption">MAX THROUGHPUT</span>
                    <span className="latency-num">
                      {sim.throughputRPS} RPS
                    </span>
                    <span className="text-caption">Sustained system capacity</span>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 4 && (
              <motion.div
                key="step-4"
                className="slide-content"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="slide-hero">
                  <span className="text-label" style={{ color: 'var(--color-warning)' }}>SECTION 5 &bull; ARCHITECTURAL RESILIENCE</span>
                  <h3 className="slide-title">Bottlenecks &amp; Failure Modes</h3>
                </div>

                <div className="warnings-review-list">
                  {sim.warnings.length > 0 ? (
                    sim.warnings.map((w, i) => (
                      <div key={i} className={`warning-box warning-box--${w.severity}`}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span className="badge badge--warning text-mono">{w.severity.toUpperCase()}</span>
                          <span className="text-mono" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Identified Bottleneck #{i + 1}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.45 }}>{w.message}</p>
                      </div>
                    ))
                  ) : (
                    <div className="no-warnings-card">
                      <span style={{ color: 'var(--color-success)', fontSize: '1.25rem' }}>✓</span>
                      <p style={{ margin: 0, fontWeight: 500 }}>All architectural thresholds operating within safe capacity envelope.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {currentStep === 5 && (
              <motion.div
                key="step-5"
                className="slide-content"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="slide-hero">
                  <span className="text-label" style={{ color: 'var(--color-accent)' }}>SECTION 6 &bull; TEAM REVIEW RECORD</span>
                  <h3 className="slide-title">Architecture Decisions &amp; Open Questions</h3>
                </div>

                <div className="comments-review-list">
                  {comments.map(c => (
                    <div key={c.id} className="review-comment-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="comment-avatar">{c.avatar}</span>
                          <strong style={{ fontSize: '0.875rem' }}>{c.author}</strong>
                          <span className="badge badge--neutral text-mono" style={{ fontSize: '0.625rem' }}>on {c.targetLabel}</span>
                        </div>
                        <span className={`badge ${c.resolved ? 'badge--success' : 'badge--warning'}`}>
                          {c.resolved ? 'RESOLVED' : 'OPEN'}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: '6px 0' }}>{c.text}</p>
                      {c.replies.map(r => (
                        <div key={r.id} className="reply-block">
                          <strong style={{ fontSize: '0.8125rem' }}>{r.author}:</strong>{' '}
                          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{r.text}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Navigation */}
        <footer className="presentation-footer">
          <div className="keyboard-hints text-mono">
            <span>&larr; Previous</span>
            <span>&bull;</span>
            <span>&rarr; or Space: Next</span>
            <span>&bull;</span>
            <span>Esc: Exit</span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-secondary"
              disabled={currentStep === 0}
              onClick={() => setCurrentStep(s => Math.max(0, s - 1))}
            >
              &larr; Back
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                if (currentStep < steps.length - 1) {
                  setCurrentStep(s => s + 1);
                } else {
                  onClose();
                }
              }}
            >
              {currentStep < steps.length - 1 ? 'Next Slide &rarr;' : 'Finish Review'}
            </button>
          </div>
        </footer>
      </div>

      <style jsx>{`
        .presentation-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(8, 8, 8, 0.95);
          backdrop-filter: blur(12px);
          z-index: 200;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-4);
        }
        .presentation-container {
          background: var(--color-bg-elevated);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          width: 100%;
          max-width: 1100px;
          height: 85vh;
          display: flex;
          flex-direction: column;
          box-shadow: var(--shadow-xl);
          overflow: hidden;
        }
        .presentation-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-4) var(--space-6);
          border-bottom: 1px solid var(--color-border);
          gap: var(--space-4);
        }
        .deck-title {
          font-size: 1.125rem;
          font-weight: 600;
          margin-top: 2px;
        }
        .deck-stepper {
          display: flex;
          gap: 4px;
          background: var(--color-bg-surface);
          padding: 3px;
          border-radius: var(--radius-full);
          border: 1px solid var(--color-border);
        }
        .step-tab {
          padding: 6px 12px;
          font-size: 0.6875rem;
          font-family: var(--font-mono);
          border: none;
          background: transparent;
          color: var(--color-text-secondary);
          border-radius: var(--radius-full);
          cursor: pointer;
          transition: all var(--duration-fast);
        }
        .step-tab.active {
          background: var(--color-bg);
          color: var(--color-text);
          font-weight: 600;
        }
        .presentation-slide-wrap {
          flex: 1;
          padding: var(--space-8);
          overflow-y: auto;
        }
        .slide-hero {
          margin-bottom: var(--space-6);
        }
        .slide-title {
          font-size: 1.75rem;
          font-weight: 700;
          margin-top: 4px;
        }
        .slide-nodes-strip {
          display: flex;
          gap: var(--space-3);
          overflow-x: auto;
          padding-bottom: var(--space-4);
          margin-bottom: var(--space-6);
        }
        .review-node-card {
          background: var(--color-bg-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: var(--space-4);
          min-width: 160px;
        }
        .kpi-strip {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-4);
        }
        .kpi-item {
          background: var(--color-bg-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: var(--space-4);
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .kpi-label {
          font-size: 0.6875rem;
          font-family: var(--font-mono);
          color: var(--color-text-muted);
        }
        .kpi-val {
          font-size: 1.5rem;
          font-weight: 700;
        }
        .assumptions-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--space-4);
          margin-bottom: var(--space-6);
        }
        .assumption-card {
          background: var(--color-bg-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: var(--space-4);
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .assumption-label {
          font-size: 0.6875rem;
          font-family: var(--font-mono);
          color: var(--color-text-muted);
        }
        .assumption-num {
          font-size: 1.25rem;
          font-weight: 700;
        }
        .assumptions-table-wrap {
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          overflow: hidden;
          background: var(--color-bg-surface);
        }
        .assumptions-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.8125rem;
        }
        .assumptions-table th, .assumptions-table td {
          padding: var(--space-3) var(--space-4);
          text-align: left;
          border-bottom: 1px solid var(--color-border-subtle);
        }
        .assumptions-table th {
          background: var(--color-bg);
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          color: var(--color-text-muted);
        }
        .cost-total-banner {
          background: var(--color-bg-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: var(--space-5);
          margin-bottom: var(--space-4);
        }
        .cost-banner-val {
          font-size: 2.25rem;
          font-weight: 700;
          color: var(--color-cost);
          margin: 4px 0;
        }
        .cost-review-row {
          display: flex;
          justify-content: space-between;
          padding: var(--space-3) 0;
          border-bottom: 1px solid var(--color-border-subtle);
          font-size: 0.875rem;
        }
        .latency-review-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-4);
        }
        .latency-card {
          background: var(--color-bg-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: var(--space-5);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .latency-num {
          font-size: 2rem;
          font-weight: 700;
        }
        .warnings-review-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }
        .warning-box {
          padding: var(--space-4);
          border-radius: var(--radius-md);
        }
        .warning-box--critical {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fca5a5;
        }
        .warning-box--warning {
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.3);
          color: #fcd34d;
        }
        .no-warnings-card {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-5);
          background: rgba(34, 197, 94, 0.08);
          border: 1px solid rgba(34, 197, 94, 0.25);
          border-radius: var(--radius-md);
        }
        .comments-review-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }
        .review-comment-card {
          background: var(--color-bg-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: var(--space-4);
        }
        .comment-avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--color-accent);
          color: white;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.6875rem;
          font-weight: 600;
        }
        .reply-block {
          background: var(--color-bg);
          padding: 8px 12px;
          border-radius: var(--radius-sm);
          margin-top: 6px;
        }
        .presentation-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-4) var(--space-6);
          border-top: 1px solid var(--color-border);
          background: var(--color-bg-surface);
        }
        .keyboard-hints {
          font-size: 0.75rem;
          color: var(--color-text-muted);
          display: flex;
          gap: 8px;
        }
        @media (max-width: 860px) {
          .deck-stepper {
            display: none;
          }
          .assumptions-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .kpi-strip, .latency-review-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
