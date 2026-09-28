'use client';

import { use, useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Navigation from '@/components/navigation/Navigation';
import {
  TEMPLATES,
  simulate,
  formatCurrency,
  formatLatency,
  type Architecture,
  type Workload,
  DEFAULT_WORKLOAD,
} from '@/lib/simulation/engine';
import { decodeArchitectureState } from '@/lib/simulation/sharing';
import { useArchitectureStore } from '@/lib/state/architectureStore';

export default function SharedArchitecturePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const { savedArchitectures, loadArchitecture } = useArchitectureStore();

  // Resolve architecture from template, query param, or saved architectures
  const resolved = useMemo<{ arch: Architecture; workload: Workload; name: string; description: string }>(() => {
    // 1. Try URL encoded base64 state data
    const queryData = searchParams.get('data');
    if (queryData) {
      const decoded = decodeArchitectureState(queryData);
      if (decoded.success && decoded.data) {
        return {
          arch: decoded.data.architecture,
          workload: decoded.data.workload,
          name: decoded.data.architecture.name || 'Shared Architecture',
          description: 'Custom architecture snapshot shared from ComputeCanvas Simulator.',
        };
      }
    }

    // 2. Try saved architectures from store
    const saved = savedArchitectures.find(s => s.id === id);
    if (saved) {
      return {
        arch: saved.architecture,
        workload: saved.workload,
        name: saved.name,
        description: 'Persistent workspace architecture shared from ComputeCanvas.',
      };
    }

    // 3. Match template
    const template = TEMPLATES.find(t => t.id === id || t.id.includes(id)) || TEMPLATES[0];
    return {
      arch: template.architecture,
      workload: template.defaultWorkload,
      name: template.name,
      description: template.description,
    };
  }, [id, searchParams, savedArchitectures]);

  const sim = useMemo(() => simulate(resolved.workload, resolved.arch), [resolved]);

  const handleFork = () => {
    loadArchitecture(resolved.arch, resolved.workload);
    router.push('/simulator');
  };

  return (
    <>
      <Navigation />
      <main className="share-page">
        <div className="container" style={{ maxWidth: '1040px' }}>
          {/* Top banner: Public shared artifact */}
          <div className="share-header">
            <div className="share-header-left">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                <span className="badge badge--neutral">SHARED ARTIFACT</span>
                <span className="text-caption text-mono" style={{ color: 'var(--color-text-muted)' }}>
                  computecanvas.io/s/{id}
                </span>
              </div>
              <h1 className="text-headline" style={{ fontSize: '2.25rem' }}>
                {resolved.name}
              </h1>
              <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-2)', fontSize: '1rem', maxWidth: '640px' }}>
                {resolved.description}
              </p>
            </div>

            <div className="share-header-actions">
              <button onClick={handleFork} className="btn btn-primary">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginRight: '6px' }}>
                  <path d="M4 2v4a2 2 0 002 2h2m0 0l-2-2m2 2l-2 2M10 2v2a2 2 0 01-2 2H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Fork architecture
              </button>
              <Link href="/simulator" className="btn btn-secondary">
                Open Simulator
              </Link>
            </div>
          </div>

          {/* Primary Metrics Strip */}
          <div className="share-metrics-strip">
            <div className="share-metric-card">
              <span className="metric-tag">ESTIMATED MONTHLY COST</span>
              <span className="metric-number text-mono" style={{ color: 'var(--color-cost)' }}>
                {formatCurrency(sim.monthlyCost)}
              </span>
              <span className="metric-subtext text-mono">
                ${(sim.costPerRequest * 1000).toFixed(3)} / 1K requests
              </span>
            </div>

            <div className="share-metric-card">
              <span className="metric-tag">P95 LATENCY</span>
              <span className="metric-number text-mono" style={{ color: 'var(--color-performance)' }}>
                {formatLatency(sim.p95Latency)}
              </span>
              <span className="metric-subtext text-mono">
                {Math.round(sim.p95Latency * 0.65)}ms P50 est.
              </span>
            </div>

            <div className="share-metric-card">
              <span className="metric-tag">CAPACITY UTILIZATION</span>
              <span className="metric-number text-mono" style={{ color: sim.capacityUtilization > 90 ? 'var(--color-warning)' : 'var(--color-capacity)' }}>
                {sim.capacityUtilization.toFixed(0)}%
              </span>
              <span className="metric-subtext text-mono">
                {sim.capacityUtilization > 100 ? 'Exceeds capacity' : 'Healthy operating window'}
              </span>
            </div>

            <div className="share-metric-card">
              <span className="metric-tag">QUALITY BENCHMARK</span>
              <span className="metric-number text-mono" style={{ color: 'var(--color-success)' }}>
                {sim.qualityEstimate}%
              </span>
              <span className="metric-subtext text-mono">
                Reasoning &amp; reliability
              </span>
            </div>
          </div>

          {/* Architecture Visual Topology Preview */}
          <div className="share-canvas-box">
            <div className="share-canvas-header">
              <span className="text-label text-mono" style={{ color: 'var(--color-text-muted)' }}>
                ARCHITECTURE TOPOLOGY &bull; {resolved.arch.nodes.length} COMPONENTS &bull; {resolved.arch.edges.length} WIRES
              </span>
              <span className="badge badge--success">DETERMINISTIC SIMULATION</span>
            </div>

            <div className="share-nodes-flow">
              {resolved.arch.nodes.map((node, i) => (
                <div key={node.id} className="share-node-step">
                  <div className="share-node-card">
                    <div className="share-node-type text-mono">{node.type.toUpperCase()}</div>
                    <div className="share-node-label">{node.label}</div>
                    <div className="share-node-provider text-mono">{node.modelId || 'Active'}</div>
                  </div>
                  {i < resolved.arch.nodes.length - 1 && (
                    <div className="share-node-arrow">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M5 12h14m-5-5l5 5-5 5" stroke="var(--color-border-strong)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Cost Breakdown in this architecture */}
            <div className="share-breakdown-row">
              <div className="share-breakdown-col">
                <span className="text-caption text-mono" style={{ color: 'var(--color-text-muted)' }}>COST BREAKDOWN</span>
                <div className="breakdown-bars">
                  <div className="breakdown-bar-item">
                    <span>Model Inference</span>
                    <span className="text-mono">{formatCurrency(sim.costBreakdown.models)}</span>
                  </div>
                  <div className="breakdown-bar-item">
                    <span>Vector DB / Search</span>
                    <span className="text-mono">{formatCurrency(sim.costBreakdown.vectorDb)}</span>
                  </div>
                  <div className="breakdown-bar-item">
                    <span>Semantic Cache</span>
                    <span className="text-mono">{formatCurrency(sim.costBreakdown.cache)}</span>
                  </div>
                  <div className="breakdown-bar-item">
                    <span>API Ingress</span>
                    <span className="text-mono">{formatCurrency(sim.costBreakdown.ingress)}</span>
                  </div>
                </div>
              </div>

              <div className="share-breakdown-col">
                <span className="text-caption text-mono" style={{ color: 'var(--color-text-muted)' }}>WORKLOAD ASSUMPTIONS</span>
                <div className="assumptions-list">
                  <div className="assumption-item">
                    <span style={{ color: 'var(--color-text-secondary)' }}>Traffic</span>
                    <span className="text-mono">{(resolved.workload.requestsPerMonth / 1_000_000).toFixed(1)}M req/mo</span>
                  </div>
                  <div className="assumption-item">
                    <span style={{ color: 'var(--color-text-secondary)' }}>Avg Input Tokens</span>
                    <span className="text-mono">{resolved.workload.avgInputTokens.toLocaleString()} tokens</span>
                  </div>
                  <div className="assumption-item">
                    <span style={{ color: 'var(--color-text-secondary)' }}>Avg Output Tokens</span>
                    <span className="text-mono">{resolved.workload.avgOutputTokens.toLocaleString()} tokens</span>
                  </div>
                  <div className="assumption-item">
                    <span style={{ color: 'var(--color-text-secondary)' }}>Cache Hit Rate</span>
                    <span className="text-mono">{Math.round(resolved.workload.cacheHitRate * 100)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Viral CTA */}
          <div className="share-cta-banner">
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Want to simulate this architecture under your traffic?</h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
                Fork this system into the ComputeCanvas simulator to change models, adjust cache hit rates, or add load-balancers.
              </p>
            </div>
            <button onClick={handleFork} className="btn btn-primary" style={{ flexShrink: 0 }}>
              Fork &amp; Edit Architecture
            </button>
          </div>
        </div>
      </main>

      <style jsx>{`
        .share-page {
          min-height: 100vh;
          padding-top: 100px;
          padding-bottom: var(--space-16);
          background: var(--color-bg);
        }
        .share-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-bottom: var(--space-8);
          border-bottom: 1px solid var(--color-border);
          margin-bottom: var(--space-8);
          gap: var(--space-6);
          flex-wrap: wrap;
        }
        .share-header-actions {
          display: flex;
          gap: var(--space-3);
          align-items: center;
        }
        .share-metrics-strip {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--space-4);
          margin-bottom: var(--space-8);
        }
        .share-metric-card {
          background: var(--color-bg-elevated);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-5);
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
        }
        .metric-tag {
          font-size: 0.6875rem;
          font-family: var(--font-mono);
          color: var(--color-text-muted);
          letter-spacing: 0.04em;
        }
        .metric-number {
          font-size: 1.5rem;
          font-weight: 600;
        }
        .metric-subtext {
          font-size: 0.75rem;
          color: var(--color-text-secondary);
        }
        .share-canvas-box {
          background: var(--color-bg-elevated);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-6);
          margin-bottom: var(--space-8);
        }
        .share-canvas-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: var(--space-4);
          border-bottom: 1px solid var(--color-border);
          margin-bottom: var(--space-6);
        }
        .share-nodes-flow {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          overflow-x: auto;
          padding-bottom: var(--space-6);
          border-bottom: 1px solid var(--color-border-subtle);
          margin-bottom: var(--space-6);
        }
        .share-node-step {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }
        .share-node-card {
          background: var(--color-bg-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: var(--space-3) var(--space-4);
          min-width: 140px;
        }
        .share-node-type {
          font-size: 0.625rem;
          color: var(--color-accent);
          font-weight: 600;
          letter-spacing: 0.05em;
        }
        .share-node-label {
          font-size: 0.875rem;
          font-weight: 500;
          margin: 2px 0;
          white-space: nowrap;
        }
        .share-node-provider {
          font-size: 0.6875rem;
          color: var(--color-text-muted);
        }
        .share-node-arrow {
          color: var(--color-border-strong);
        }
        .share-breakdown-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-8);
        }
        .share-breakdown-col {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }
        .breakdown-bars, .assumptions-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }
        .breakdown-bar-item, .assumption-item {
          display: flex;
          justify-content: space-between;
          font-size: 0.8125rem;
          padding: var(--space-1) 0;
          border-bottom: 1px solid var(--color-border-subtle);
        }
        .share-cta-banner {
          background: linear-gradient(135deg, rgba(234, 88, 12, 0.08) 0%, rgba(20, 20, 20, 0.8) 100%);
          border: 1px solid var(--color-accent);
          border-radius: var(--radius-lg);
          padding: var(--space-8);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: var(--space-6);
        }

        @media (max-width: 768px) {
          .share-metrics-strip {
            grid-template-columns: repeat(2, 1fr);
          }
          .share-breakdown-row {
            grid-template-columns: 1fr;
          }
          .share-cta-banner {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </>
  );
}
