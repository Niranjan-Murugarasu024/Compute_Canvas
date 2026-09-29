'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Navigation from '@/components/navigation/Navigation';
import { useArchitectureStore, type SavedArchitecture } from '@/lib/state/architectureStore';
import { simulate, formatCurrency, formatLatency } from '@/lib/simulation/engine';

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'all' | 'production' | 'staging'>('all');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const {
    savedArchitectures,
    scenarios,
    comments,
    versions,
    loadArchitecture,
    deleteSavedArchitecture,
    saveCurrentArchitecture,
  } = useArchitectureStore();

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Compute live aggregates across saved architectures
  const architecturesWithSim = savedArchitectures.map(item => {
    const sim = simulate(item.workload, item.architecture);
    return {
      ...item,
      sim,
      status: sim.capacityUtilization > 95 ? ('warning' as const) : ('healthy' as const),
      tag: item.id.includes('support') ? 'Production' : item.id.includes('code') ? 'Staging' : 'Development',
    };
  });

  const totalMonthlyCost = architecturesWithSim.reduce((acc, a) => acc + a.sim.monthlyCost, 0);
  const totalCapacityAlerts = architecturesWithSim.filter(a => a.sim.capacityUtilization > 90).length;

  const handleOpenInSimulator = (arch: SavedArchitecture) => {
    loadArchitecture(arch.architecture, arch.workload);
    router.push('/simulator');
  };

  const handleDuplicate = (arch: SavedArchitecture) => {
    loadArchitecture({
      ...arch.architecture,
      id: `copy-${Date.now().toString(36)}`,
      name: `${arch.name} (Copy)`,
    }, arch.workload);
    saveCurrentArchitecture(`${arch.name} (Copy)`);
    showToast(`Duplicated "${arch.name}"`);
  };

  const handleShare = (arch: SavedArchitecture) => {
    const stateObj = { architecture: arch.architecture, workload: arch.workload };
    const serialized = btoa(encodeURIComponent(JSON.stringify(stateObj)));
    const shareUrl = `${window.location.origin}/s/${arch.id}?data=${serialized}`;
    navigator.clipboard.writeText(shareUrl);
    showToast('Public share link copied to clipboard!');
  };

  const filteredArchitectures = architecturesWithSim.filter(arch => {
    if (activeTab === 'production') return arch.tag === 'Production';
    if (activeTab === 'staging') return arch.tag === 'Staging';
    return true;
  });

  return (
    <>
      <Navigation />
      <main className="dashboard-page">
        <div className="container">
          {/* Header */}
          <div className="dashboard-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                <span className="live-indicator" />
                <span className="text-caption text-mono" style={{ color: 'var(--color-text-muted)' }}>
                  TEAM WORKSPACE &bull; COMPUTECANVAS CLOUD
                </span>
              </div>
              <h1 className="text-display" style={{ fontSize: '2rem' }}>
                Architecture Portfolio
              </h1>
              <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)', fontSize: '0.9375rem' }}>
                {savedArchitectures.length} saved architectures &bull; {formatCurrency(totalMonthlyCost)}/mo total projected compute &bull; {totalCapacityAlerts} capacity alert{totalCapacityAlerts !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="dashboard-header-actions">
              <Link href="/simulator" className="btn btn-secondary text-mono" style={{ fontSize: '0.8125rem' }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginRight: '6px' }}>
                  <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                New Architecture
              </Link>
              <Link href="/simulator" className="btn btn-primary text-mono" style={{ fontSize: '0.8125rem' }}>
                Open Spatial Simulator
              </Link>
            </div>
          </div>

          {/* Main Grid: 2 Columns */}
          <div className="dashboard-grid">
            {/* Left Column: Architectures */}
            <div className="dashboard-main-col">
              <div className="section-title-row">
                <h2 className="text-title" style={{ fontSize: '1.125rem' }}>Saved Architectures</h2>
                <div className="filter-pills">
                  <button 
                    className={`filter-pill ${activeTab === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveTab('all')}
                  >
                    All ({savedArchitectures.length})
                  </button>
                  <button 
                    className={`filter-pill ${activeTab === 'production' ? 'active' : ''}`}
                    onClick={() => setActiveTab('production')}
                  >
                    Production
                  </button>
                  <button 
                    className={`filter-pill ${activeTab === 'staging' ? 'active' : ''}`}
                    onClick={() => setActiveTab('staging')}
                  >
                    Staging
                  </button>
                </div>
              </div>

              <div className="architectures-list">
                {filteredArchitectures.map((arch) => (
                  <motion.div 
                    key={arch.id} 
                    className="arch-card"
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="arch-card-header">
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <h3 className="arch-card-title">{arch.name}</h3>
                          <span className={`badge ${arch.status === 'warning' ? 'badge--warning' : 'badge--neutral'}`}>
                            {arch.tag}
                          </span>
                        </div>
                        <span className="text-caption text-mono" style={{ color: 'var(--color-text-muted)' }}>
                          {arch.architecture.nodes.length} components &bull; {arch.architecture.edges.length} wires &bull; Updated {new Date(arch.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="arch-card-actions">
                        <button
                          className="btn btn-ghost"
                          title="Share Architecture Link"
                          onClick={() => handleShare(arch)}
                        >
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M9 2h3v3M12 2L6 8M10 7v5H2V4h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                        <button
                          className="btn btn-ghost"
                          title="Duplicate Architecture"
                          onClick={() => handleDuplicate(arch)}
                        >
                          <span style={{ fontSize: '0.875rem' }}>⧉</span>
                        </button>
                        <button
                          className="btn btn-ghost"
                          title="Delete Architecture"
                          style={{ color: 'var(--color-critical)' }}
                          onClick={() => {
                            if (confirm(`Delete "${arch.name}"?`)) {
                              deleteSavedArchitecture(arch.id);
                              showToast(`Deleted ${arch.name}`);
                            }
                          }}
                        >
                          ✕
                        </button>
                        <button
                          onClick={() => handleOpenInSimulator(arch)}
                          className="btn btn-secondary text-mono"
                          style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                        >
                          Simulate &rarr;
                        </button>
                      </div>
                    </div>

                    <div className="arch-metrics-grid">
                      <div className="arch-metric">
                        <span className="metric-label">MONTHLY COST</span>
                        <span className="metric-val text-mono" style={{ color: 'var(--color-cost)' }}>
                          {formatCurrency(arch.sim.monthlyCost)}
                        </span>
                      </div>
                      <div className="arch-metric">
                        <span className="metric-label">LATENCY</span>
                        <span className="metric-val text-mono" style={{ color: 'var(--color-performance)' }}>
                          {formatLatency(arch.sim.p95Latency)}
                        </span>
                      </div>
                      <div className="arch-metric">
                        <span className="metric-label">CAPACITY</span>
                        <span className="metric-val text-mono" style={{ color: arch.sim.capacityUtilization > 95 ? 'var(--color-warning)' : 'var(--color-capacity)' }}>
                          {arch.sim.capacityUtilization.toFixed(0)}%
                        </span>
                      </div>
                      <div className="arch-metric">
                        <span className="metric-label">QUALITY</span>
                        <span className="metric-val text-mono" style={{ color: 'var(--color-success)' }}>
                          {arch.sim.qualityEstimate}%
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {filteredArchitectures.length === 0 && (
                  <div className="empty-state">
                    <p className="text-caption">No architectures in this view.</p>
                  </div>
                )}
              </div>

              {/* Scenarios Comparison Section */}
              <div className="section-title-row" style={{ marginTop: 'var(--space-8)' }}>
                <h2 className="text-title" style={{ fontSize: '1.125rem' }}>Growth &amp; Stress Scenarios</h2>
                <Link href="/simulator" className="text-caption text-mono" style={{ color: 'var(--color-accent)' }}>
                  + Open Simulator Matrix
                </Link>
              </div>

              <div className="scenarios-table-wrapper">
                <table className="scenarios-table">
                  <thead>
                    <tr>
                      <th>Scenario</th>
                      <th>Workload Scale</th>
                      <th>Monthly Spend</th>
                      <th>P95 Latency</th>
                      <th>Capacity Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scenarios.map((sc) => {
                      const sim = simulate(sc.workload, sc.architecture);
                      return (
                        <tr key={sc.id}>
                          <td className="text-mono" style={{ fontWeight: 500, color: 'var(--color-text)' }}>{sc.name}</td>
                          <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>
                            {(sc.workload.requestsPerMonth / 1_000_000).toFixed(1)}M req/mo
                          </td>
                          <td className="text-mono" style={{ color: 'var(--color-cost)' }}>{formatCurrency(sim.monthlyCost)}</td>
                          <td className="text-mono" style={{ color: 'var(--color-performance)' }}>{formatLatency(sim.p95Latency)}</td>
                          <td>
                            <span className={`badge ${sim.capacityUtilization > 100 ? 'badge--critical' : sim.capacityUtilization > 85 ? 'badge--warning' : 'badge--success'}`}>
                              {sim.capacityUtilization > 100 ? 'Saturated' : `${sim.capacityUtilization.toFixed(0)}% Utilized`}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Column: Warnings & Activity */}
            <div className="dashboard-side-col">
              {/* Warnings / Alerts Box */}
              <div className="side-card">
                <div className="side-card-header">
                  <span className="text-label" style={{ color: 'var(--color-warning)' }}>
                    ARCHITECTURAL ALERTS ({totalCapacityAlerts})
                  </span>
                </div>
                <div className="alerts-list">
                  {architecturesWithSim.filter(a => a.sim.capacityUtilization > 90).map((a) => (
                    <div key={a.id} className="alert-item alert-item--warning">
                      <div className="alert-item-header">
                        <span className="text-mono" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{a.name}</span>
                        <span className="text-caption text-mono" style={{ color: 'var(--color-text-muted)' }}>Live</span>
                      </div>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '4px', lineHeight: 1.45 }}>
                        High capacity saturation ({a.sim.capacityUtilization.toFixed(0)}% utilization at {a.workload.requestsPerMonth.toLocaleString()} req/mo). Consider sharding or deploying semantic caching.
                      </p>
                      <button
                        onClick={() => handleOpenInSimulator(a)}
                        className="alert-action-link text-mono"
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                      >
                        Run Optimization in Simulator &rarr;
                      </button>
                    </div>
                  ))}

                  <div className="alert-item alert-item--info">
                    <div className="alert-item-header">
                      <span className="text-mono" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>Provider Updates</span>
                      <span className="text-caption text-mono" style={{ color: 'var(--color-text-muted)' }}>Latest</span>
                    </div>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '4px', lineHeight: 1.45 }}>
                      Deterministic model pricing reflects Q1 2026 tiers across Anthropic, OpenAI, Google Gemini, and Meta Llama 3.3.
                    </p>
                  </div>
                </div>
              </div>

              {/* Active Reviews & Spatial Comments */}
              <div className="side-card" style={{ marginTop: 'var(--space-6)' }}>
                <div className="side-card-header">
                  <span className="text-label" style={{ color: 'var(--color-text-muted)' }}>
                    ACTIVE ARCHITECTURAL REVIEWS ({comments.length})
                  </span>
                </div>
                <div className="activity-list">
                  {comments.slice(0, 3).map(c => (
                    <div key={c.id} className="activity-item">
                      <div className="activity-avatar">{c.avatar}</div>
                      <div className="activity-content">
                        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text)' }}>
                          <strong>{c.author}</strong> on <em>{c.targetLabel}</em>: &ldquo;{c.text.length > 55 ? `${c.text.slice(0, 52)}…` : c.text}&rdquo;
                        </p>
                        <span className="text-caption text-mono" style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                          {c.replies.length} repl{c.replies.length === 1 ? 'y' : 'ies'} &bull; {c.resolved ? 'Resolved' : 'Open Thread'}
                        </span>
                      </div>
                    </div>
                  ))}
                  <Link href="/simulator" className="alert-action-link text-mono" style={{ fontSize: '0.75rem', marginTop: '6px', display: 'inline-block' }}>
                    Open Discussion Drawer in Simulator &rarr;
                  </Link>
                </div>
              </div>

              {/* Version History Snapshots */}
              <div className="side-card" style={{ marginTop: 'var(--space-6)' }}>
                <div className="side-card-header">
                  <span className="text-label" style={{ color: 'var(--color-text-muted)' }}>
                    SAVED VERSION SNAPSHOTS ({versions.length})
                  </span>
                </div>
                <div className="activity-list">
                  {versions.slice(0, 3).map(v => (
                    <div key={v.id} className="activity-item">
                      <div className="activity-avatar" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', fontSize: '0.6875rem' }}>
                        v{v.versionNumber}
                      </div>
                      <div className="activity-content">
                        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text)' }}>
                          <strong>{v.label}</strong>
                        </p>
                        <span className="text-caption text-mono" style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                          {formatCurrency(v.monthlyCost)}/mo &bull; {formatLatency(v.p95Latency)}
                        </span>
                      </div>
                    </div>
                  ))}
                  <Link href="/simulator" className="alert-action-link text-mono" style={{ fontSize: '0.75rem', marginTop: '6px', display: 'inline-block' }}>
                    Inspect Visual Diffs in Simulator &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Toast */}
        <AnimatePresence>
          {toastMsg && (
            <motion.div
              className="dashboard-toast"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
            >
              <span>{toastMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <style jsx>{`
        .dashboard-page {
          padding-top: calc(var(--nav-height) + 40px);
          padding-bottom: var(--space-16);
          min-height: 100vh;
          background: var(--color-bg);
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-bottom: var(--space-8);
          border-bottom: 1px solid var(--color-border);
          margin-bottom: var(--space-8);
          gap: var(--space-4);
          flex-wrap: wrap;
        }

        .dashboard-header-actions {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .live-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--color-success);
          box-shadow: 0 0 8px rgba(34, 197, 94, 0.4);
          display: inline-block;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: var(--space-8);
          align-items: start;
        }

        .section-title-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-4);
        }

        .filter-pills {
          display: flex;
          gap: var(--space-1);
          background: var(--color-bg-elevated);
          padding: 3px;
          border-radius: var(--radius-full);
          border: 1px solid var(--color-border);
        }

        .filter-pill {
          padding: 4px 12px;
          font-size: 0.75rem;
          font-family: var(--font-mono);
          border: none;
          background: transparent;
          color: var(--color-text-secondary);
          border-radius: var(--radius-full);
          cursor: pointer;
          transition: all var(--duration-fast);
        }

        .filter-pill.active {
          background: var(--color-bg-surface);
          color: var(--color-text);
          font-weight: 500;
        }

        .architectures-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .arch-card {
          background: var(--color-bg-elevated);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: var(--space-5);
          transition: border-color var(--duration-fast);
        }

        .arch-card:hover {
          border-color: var(--color-border-strong);
        }

        .arch-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--space-4);
          gap: var(--space-2);
        }

        .arch-card-title {
          font-size: 1.125rem;
          font-weight: 600;
        }

        .arch-card-actions {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .arch-metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--space-3);
          background: var(--color-bg-surface);
          padding: var(--space-3) var(--space-4);
          border-radius: var(--radius-sm);
        }

        .arch-metric {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .metric-label {
          font-size: 0.6875rem;
          font-family: var(--font-mono);
          color: var(--color-text-muted);
          letter-spacing: 0.04em;
        }

        .metric-val {
          font-size: 0.9375rem;
          font-weight: 600;
        }

        /* Scenarios Table */
        .scenarios-table-wrapper {
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          overflow: hidden;
          background: var(--color-bg-elevated);
        }

        .scenarios-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.8125rem;
          text-align: left;
        }

        .scenarios-table th {
          padding: var(--space-3) var(--space-4);
          background: var(--color-bg-surface);
          color: var(--color-text-muted);
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          font-weight: 500;
          letter-spacing: 0.04em;
          border-bottom: 1px solid var(--color-border);
        }

        .scenarios-table td {
          padding: var(--space-3) var(--space-4);
          border-bottom: 1px solid var(--color-border-subtle);
        }

        .scenarios-table tr:last-child td {
          border-bottom: none;
        }

        /* Side Column */
        .side-card {
          background: var(--color-bg-elevated);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: var(--space-5);
        }

        .side-card-header {
          margin-bottom: var(--space-4);
        }

        .alerts-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .alert-item {
          padding: var(--space-3);
          border-radius: var(--radius-sm);
          font-size: 0.8125rem;
        }

        .alert-item--warning {
          background: rgba(245, 158, 11, 0.08);
          border: 1px solid rgba(245, 158, 11, 0.25);
        }

        .alert-item--info {
          background: rgba(59, 130, 246, 0.08);
          border: 1px solid rgba(59, 130, 246, 0.25);
        }

        .alert-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .alert-action-link {
          display: inline-block;
          margin-top: var(--space-2);
          font-size: 0.75rem;
          color: var(--color-accent);
          text-decoration: underline;
        }

        /* Activity */
        .activity-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .activity-item {
          display: flex;
          gap: var(--space-3);
          align-items: flex-start;
        }

        .activity-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--color-bg-surface);
          border: 1px solid var(--color-border);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-mono);
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--color-accent);
          flex-shrink: 0;
        }

        .dashboard-toast {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--color-bg-surface);
          border: 1px solid var(--color-accent);
          color: var(--color-text);
          padding: 8px 16px;
          border-radius: var(--radius-full);
          font-size: 0.8125rem;
          font-family: var(--font-mono);
          box-shadow: var(--shadow-lg);
          z-index: 100;
        }

        @media (max-width: 900px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
          .arch-metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </>
  );
}
