'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { TEMPLATES, simulate, formatCurrency, formatLatency } from '@/lib/simulation/engine';

const CATEGORIES = ['All', 'Generative AI', 'Data', 'Infrastructure'];

export default function TemplatesClient() {
  const [category, setCategory] = useState('All');

  const filtered = category === 'All' ? TEMPLATES : TEMPLATES.filter(t => t.category === category);

  return (
    <div className="container" style={{ paddingTop: 'calc(var(--nav-height) + 40px)', paddingBottom: 'var(--space-16)' }}>
      <div className="section-header-block" style={{ marginBottom: 'var(--space-8)' }}>
        <span className="section-label">CANONICAL BLUEPRINTS</span>
        <h1 className="section-heading">Canonical architecture blueprints.</h1>
        <p className="section-lead">
          Each blueprint is a functional architectural topology with deterministic simulation outputs. Open in the workbench to adjust workload assumptions.
        </p>
      </div>

      {/* Category filters */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-8)', flexWrap: 'wrap' }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`btn ${category === cat ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Templates grid */}
      <div className="templates-page-grid" style={{ maxWidth: '1240px', margin: 0 }}>
        {filtered.map((template, i) => {
          const result = simulate(template.defaultWorkload, template.architecture);
          return (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.04 }}
            >
              <Link href={`/simulator?template=${template.id}`} className="template-page-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                  <span className="text-technical-label">
                    {template.category}
                  </span>
                  <span className="badge badge--neutral text-mono" style={{ fontSize: '0.5625rem' }}>
                    TEMPLATE DEFAULT
                  </span>
                </div>
                <h2 style={{ fontSize: '1.125rem', fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                  {template.name}
                </h2>
                <p style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-ui)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)', lineHeight: 1.55 }}>
                  {template.description}
                </p>

                {/* Structured Architectural Blueprint: When to Use / Optimizes / Tradeoff (Section 29) */}
                <div className="template-tradeoffs-box text-mono" style={{ margin: '8px 0 16px 0', padding: '10px 12px', background: '#141417', border: '1px solid var(--color-border)', borderRadius: '3px', fontSize: '0.6875rem', lineHeight: 1.5 }}>
                  <div style={{ marginBottom: '4px' }}>
                    <span style={{ color: '#71717A', fontWeight: 600 }}>WHEN TO USE: </span>
                    <span style={{ color: '#FAFAFA' }}>{template.whenToUse}</span>
                  </div>
                  <div style={{ marginBottom: '4px' }}>
                    <span style={{ color: '#71717A', fontWeight: 600 }}>OPTIMIZES: </span>
                    <span style={{ color: '#FFFFFF' }}>{template.whatItOptimizes}</span>
                  </div>
                  <div>
                    <span style={{ color: '#71717A', fontWeight: 600 }}>KEY TRADEOFF: </span>
                    <span style={{ color: '#A1A1AA' }}>{template.keyTradeoff}</span>
                  </div>
                </div>

                {/* Mini architecture preview */}
                <div className="template-page-card__nodes">
                  {template.architecture.nodes.map(node => (
                    <span key={node.id} className="template-page-card__node text-mono">
                      {node.label}
                    </span>
                  ))}
                </div>

                <div className="template-page-card__metrics">
                  <div>
                    <span className="text-technical-label">EST. SPEND</span>
                    <span className="text-mono" style={{ color: '#FFFFFF', fontWeight: 500 }}>
                      {formatCurrency(result.monthlyCost, true)}/MO
                    </span>
                  </div>
                  <div>
                    <span className="text-technical-label">MODELED P95</span>
                    <span className="text-mono" style={{ color: '#D4D4D8', fontWeight: 500 }}>
                      {formatLatency(result.p95Latency)}
                    </span>
                  </div>
                  <div>
                    <span className="text-technical-label">COMPONENTS</span>
                    <span className="text-mono" style={{ color: '#A1A1AA' }}>{template.architecture.nodes.length} NODES</span>
                  </div>
                  <div>
                    <span className="text-technical-label">CAPABILITY TIER</span>
                    <span className="text-mono" style={{ color: '#FAFAFA', fontWeight: 600, fontSize: '0.75rem' }}>
                      {template.capabilityTier || result.capabilityTier}
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      <style>{`
        .templates-page-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: var(--space-4);
        }
        .template-page-card {
          display: flex;
          flex-direction: column;
          padding: var(--space-6);
          background: var(--color-bg-elevated);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          text-decoration: none;
          color: var(--color-text);
          transition: all var(--duration-fast) var(--ease-out);
          height: 100%;
        }
        .template-page-card:hover {
          border-color: var(--color-border-strong);
          background: var(--color-bg-surface);
          transform: translateY(-1px);
        }
        .template-page-card__nodes {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-1);
          margin-bottom: var(--space-4);
        }
        .template-page-card__node {
          padding: 2px 6px;
          background: var(--color-bg-surface);
          border: 1px solid var(--color-border-subtle);
          border-radius: 2px;
          font-size: 0.625rem;
          color: var(--color-text-secondary);
        }
        .template-page-card__metrics {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--space-3);
          padding-top: var(--space-4);
          border-top: 1px solid var(--color-border-subtle);
          margin-top: auto;
        }
        .template-page-card__metrics > div {
          display: flex;
          flex-direction: column;
          gap: 2px;
          font-size: 0.8125rem;
        }
        @media (max-width: 640px) {
          .templates-page-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
