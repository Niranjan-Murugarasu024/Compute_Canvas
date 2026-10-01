'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useArchitectureStore } from '@/lib/state/architectureStore';
import {
  computeArchitectureDiff,
  type ArchitectureVersion,
} from '@/lib/collaboration/types';
import { formatCurrency, formatLatency } from '@/lib/simulation/engine';

export default function VersionHistoryModal({ onClose }: { onClose: () => void }) {
  const {
    architecture,
    workload,
    versions,
    createVersion,
    restoreVersion,
  } = useArchitectureStore();

  const [selectedVersionId, setSelectedVersionId] = useState<string>(versions[0]?.id || '');
  const [newVersionLabel, setNewVersionLabel] = useState('');
  const [newVersionNote, setNewVersionNote] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const selectedVersion = versions.find(v => v.id === selectedVersionId) || versions[0];

  // Compute visual diff between selected historical version and current live architecture
  const diff = useMemo(() => {
    if (!selectedVersion) return null;
    return computeArchitectureDiff(
      selectedVersion.architecture,
      architecture,
      selectedVersion.workload,
      workload,
      selectedVersion.label,
      architecture.name || 'Current Live Architecture'
    );
  }, [selectedVersion, architecture, workload]);

  const handleCreateSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVersionLabel.trim()) return;
    createVersion(newVersionLabel.trim(), newVersionNote.trim());
    setNewVersionLabel('');
    setNewVersionNote('');
    setIsCreating(false);
  };

  const handleRestore = (ver: ArchitectureVersion) => {
    if (confirm(`Restore snapshot "${ver.label}" to active canvas?`)) {
      restoreVersion(ver.id);
      onClose();
    }
  };

  return (
    <div className="version-modal-backdrop">
      <div className="version-modal-container">
        {/* Header */}
        <div className="version-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="text-mono" style={{ color: '#FFFFFF', fontSize: '0.875rem' }}>⧉</span>
              <span className="text-technical-label" style={{ color: '#A1A1AA' }}>VERSION TIMELINE &amp; VISUAL ARCHITECTURE DIFF</span>
            </div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem', marginTop: '2px' }}>
              Track evolution, inspect component additions/deletions, and review metric drift across iterations.
            </p>
          </div>
          <button className="btn btn-ghost" onClick={onClose}>✕</button>
        </div>

        <div className="version-body">
          {/* Left Column: Version Timeline */}
          <div className="version-timeline-col">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
              <span className="text-label">SNAPSHOTS ({versions.length})</span>
              <button
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                onClick={() => setIsCreating(!isCreating)}
              >
                + Create Snapshot
              </button>
            </div>

            {isCreating && (
              <form onSubmit={handleCreateSnapshot} className="create-version-form">
                <input
                  type="text"
                  placeholder="Version label (e.g. v2.1 Routing)..."
                  className="input-field"
                  value={newVersionLabel}
                  onChange={e => setNewVersionLabel(e.target.value)}
                  required
                />
                <textarea
                  placeholder="Changelog notes..."
                  className="textarea-field"
                  value={newVersionNote}
                  onChange={e => setNewVersionNote(e.target.value)}
                  rows={2}
                />
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button type="submit" className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
                    Save
                  </button>
                  <button type="button" className="btn btn-ghost" style={{ fontSize: '0.75rem' }} onClick={() => setIsCreating(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="version-items-list">
              {versions.map(v => {
                const isSelected = selectedVersionId === v.id;
                return (
                  <div
                    key={v.id}
                    className={`version-card ${isSelected ? 'active' : ''}`}
                    onClick={() => setSelectedVersionId(v.id)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span className="version-badge text-mono">v{v.versionNumber}</span>
                      <span className="text-caption text-mono" style={{ color: 'var(--color-text-muted)', fontSize: '0.6875rem' }}>
                        {new Date(v.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <h4 className="version-label">{v.label}</h4>
                    {v.note && <p className="version-note">{v.note}</p>}

                    <div className="version-kpis text-mono">
                      <span>{formatCurrency(v.monthlyCost)}</span>
                      <span>&bull;</span>
                      <span>{formatLatency(v.p95Latency)}</span>
                      <span>&bull;</span>
                      <span>{v.capacityUtilization}% Cap</span>
                    </div>

                    <div style={{ marginTop: 'var(--space-2)' }}>
                      <button
                        className="btn btn-ghost"
                        style={{ fontSize: '0.6875rem', padding: '2px 6px', color: 'var(--color-accent)' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRestore(v);
                        }}
                      >
                        Restore to Canvas &rarr;
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Visual Architecture Diff View */}
          <div className="version-diff-col">
            {diff ? (
              <div className="diff-wrap">
                <div className="diff-header-row">
                  <div>
                    <span className="text-label" style={{ color: 'var(--color-text-muted)' }}>COMPARING SNAPSHOT VS LIVE</span>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: '2px 0' }}>
                      {diff.baseVersionLabel} &rarr; {diff.targetVersionLabel}
                    </h3>
                  </div>

                  {/* High Level Deltas */}
                  <div className="diff-deltas-strip">
                    <div className="delta-stat">
                      <span className="text-caption">COST DELTA</span>
                      <span className="text-mono delta-stat__num" style={{ color: diff.costDelta <= 0 ? 'var(--color-success)' : 'var(--color-cost)' }}>
                        {diff.costDelta >= 0 ? '+' : ''}{formatCurrency(diff.costDelta)} ({diff.costDeltaPercent >= 0 ? '+' : ''}{diff.costDeltaPercent.toFixed(0)}%)
                      </span>
                    </div>

                    <div className="delta-stat">
                      <span className="text-caption">P95 LATENCY</span>
                      <span className="text-mono delta-stat__num" style={{ color: diff.latencyDelta <= 0 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                        {diff.latencyDelta >= 0 ? '+' : ''}{diff.latencyDelta}ms
                      </span>
                    </div>

                    <div className="delta-stat">
                      <span className="text-caption">CAPACITY</span>
                      <span className="text-mono delta-stat__num" style={{ color: diff.capacityDelta <= 0 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                        {diff.capacityDelta >= 0 ? '+' : ''}{diff.capacityDelta.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Diff Categories */}
                <div className="diff-sections-list">
                  {/* Added Components */}
                  <div className="diff-section">
                    <div className="diff-section-title" style={{ color: 'var(--color-success)' }}>
                      <span>+ ADDED COMPONENTS ({diff.addedNodes.length})</span>
                    </div>
                    {diff.addedNodes.length > 0 ? (
                      <div className="diff-cards-grid">
                        {diff.addedNodes.map(n => (
                          <div key={n.id} className="diff-node-card diff-node-card--added">
                            <span className="badge badge--success text-mono" style={{ fontSize: '0.625rem' }}>+{n.type}</span>
                            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{n.label}</span>
                            <span className="text-caption text-mono">{n.modelId || 'Node'}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="diff-none-msg">No newly added components.</p>
                    )}
                  </div>

                  {/* Removed Components */}
                  <div className="diff-section">
                    <div className="diff-section-title" style={{ color: 'var(--color-critical)' }}>
                      <span>&minus; REMOVED COMPONENTS ({diff.removedNodes.length})</span>
                    </div>
                    {diff.removedNodes.length > 0 ? (
                      <div className="diff-cards-grid">
                        {diff.removedNodes.map(n => (
                          <div key={n.id} className="diff-node-card diff-node-card--removed">
                            <span className="badge badge--critical text-mono" style={{ fontSize: '0.625rem' }}>&minus;{n.type}</span>
                            <span style={{ fontWeight: 600, fontSize: '0.875rem', textDecoration: 'line-through' }}>{n.label}</span>
                            <span className="text-caption text-mono">{n.modelId || 'Node'}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="diff-none-msg">No components were removed.</p>
                    )}
                  </div>

                  {/* Modified Components */}
                  <div className="diff-section">
                    <div className="diff-section-title" style={{ color: 'var(--color-warning)' }}>
                      <span>~ MODIFIED CONFIGURATIONS ({diff.modifiedNodes.length})</span>
                    </div>
                    {diff.modifiedNodes.length > 0 ? (
                      <div className="diff-modified-list">
                        {diff.modifiedNodes.map((m, idx) => (
                          <div key={idx} className="diff-modified-item">
                            <strong style={{ fontSize: '0.875rem' }}>{m.node.label} ({m.node.type})</strong>
                            <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                              {m.changes.map((ch, i) => (
                                <li key={i} style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{ch}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="diff-none-msg">No modified configurations.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-diff-msg">Select a snapshot version on the left to inspect architectural differences.</div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .version-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(8px);
          z-index: 200;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-4);
        }
        .version-modal-container {
          background: var(--color-bg-elevated);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          width: 100%;
          max-width: 1040px;
          height: 85vh;
          display: flex;
          flex-direction: column;
          box-shadow: var(--shadow-xl);
          overflow: hidden;
        }
        .version-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: var(--space-4) var(--space-6);
          border-bottom: 1px solid var(--color-border);
        }
        .version-body {
          flex: 1;
          display: grid;
          grid-template-columns: 340px 1fr;
          overflow: hidden;
        }
        .version-timeline-col {
          border-right: 1px solid var(--color-border);
          padding: var(--space-4);
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }
        .create-version-form {
          background: var(--color-bg-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: var(--space-3);
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }
        .input-field, .textarea-field {
          width: 100%;
          padding: 6px 8px;
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          color: var(--color-text);
          font-size: 0.75rem;
          font-family: inherit;
        }
        .version-items-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }
        .version-card {
          background: var(--color-bg-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: var(--space-3);
          cursor: pointer;
          transition: all var(--duration-fast);
        }
        .version-card:hover {
          border-color: var(--color-border-strong);
        }
        .version-card.active {
          border-color: #FFFFFF;
          background: var(--color-bg);
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.08);
        }
        .version-badge {
          font-size: 0.6875rem;
          color: #FFFFFF;
          font-weight: 700;
        }
        .version-label {
          font-size: 0.875rem;
          font-weight: 600;
          margin: 4px 0 2px 0;
        }
        .version-note {
          font-size: 0.75rem;
          color: var(--color-text-secondary);
          margin-bottom: 4px;
        }
        .version-kpis {
          display: flex;
          gap: 6px;
          font-size: 0.6875rem;
          color: var(--color-text-muted);
        }
        .version-diff-col {
          padding: var(--space-6);
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }
        .diff-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-bottom: var(--space-4);
          border-bottom: 1px solid var(--color-border);
          gap: var(--space-4);
        }
        .diff-deltas-strip {
          display: flex;
          gap: var(--space-4);
        }
        .delta-stat {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .delta-stat__num {
          font-size: 1rem;
          font-weight: 700;
        }
        .diff-sections-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
          margin-top: var(--space-6);
        }
        .diff-section-title {
          font-family: var(--font-mono);
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          margin-bottom: var(--space-3);
        }
        .diff-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: var(--space-3);
        }
        .diff-node-card {
          padding: var(--space-3);
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .diff-node-card--added {
          background: rgba(34, 197, 94, 0.08);
          border: 1px solid rgba(34, 197, 94, 0.3);
        }
        .diff-node-card--removed {
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.3);
        }
        .diff-modified-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }
        .diff-modified-item {
          background: rgba(245, 158, 11, 0.08);
          border: 1px solid rgba(245, 158, 11, 0.25);
          padding: var(--space-3);
          border-radius: var(--radius-sm);
        }
        .diff-none-msg {
          font-size: 0.8125rem;
          color: var(--color-text-muted);
          font-style: italic;
        }
        @media (max-width: 860px) {
          .version-body {
            grid-template-columns: 1fr;
          }
          .version-timeline-col {
            border-right: none;
            border-bottom: 1px solid var(--color-border);
            max-height: 240px;
          }
        }
      `}</style>
    </div>
  );
}
