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
    <div className="container">
      <div style={{ maxWidth: 640, marginBottom: 'var(--space-12)' }}>
        <p className="text-label" style={{ marginBottom: 'var(--space-3)', color: 'var(--color-accent)' }}>
          TEMPLATES
        </p>
        <h1 className="text-headline">Start from proven architectures.</h1>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-3)', fontSize: '1.0625rem' }}>
          Each template is a working architecture with real simulation outputs. Click to open in the simulator.
        </p>
      </div>

      {/* Category filters */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-8)', flexWrap: 'wrap' }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`btn ${category === cat ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '0.8125rem' }}
            onClick={() => setCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Templates grid */}
      <div className="templates-page-grid">
        {filtered.map((template, i) => {
          const result = simulate(template.defaultWorkload, template.architecture);
          return (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <Link href={`/simulator?template=${template.id}`} className="template-page-card">
                <div style={{ marginBottom: 'var(--space-3)' }}>
                  <span className="text-label" style={{ color: 'var(--color-accent)' }}>
                    {template.category.toUpperCase()}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                  {template.name}
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-6)', lineHeight: 1.6 }}>
                  {template.description}
                </p>

                {/* Mini architecture preview */}
                <div className="template-page-card__nodes">
                  {template.architecture.nodes.map(node => (
                    <span key={node.id} className="template-page-card__node">
                      {node.label.toUpperCase()}
                    </span>
                  ))}
                </div>

                <div className="template-page-card__metrics">
                  <div>
                    <span className="text-label">EST. COST</span>
                    <span className="text-mono" style={{ color: 'var(--color-cost)' }}>
                      {formatCurrency(result.monthlyCost, true)}/mo
                    </span>
                  </div>
                  <div>
                    <span className="text-label">P95 LATENCY</span>
                    <span className="text-mono" style={{ color: 'var(--color-performance)' }}>
                      {formatLatency(result.p95Latency)}
                    </span>
                  </div>
                  <div>
                    <span className="text-label">COMPONENTS</span>
                    <span className="text-mono">{template.architecture.nodes.length}</span>
                  </div>
                  <div>
                    <span className="text-label">QUALITY</span>
                    <span className="text-mono" style={{ color: 'var(--color-quality)' }}>
                      {result.qualityEstimate}%
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      <style jsx global>{`
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
          border-radius: var(--radius-lg);
          text-decoration: none;
          color: var(--color-text);
          transition: all var(--duration-fast) var(--ease-out);
          height: 100%;
        }
        .template-page-card:hover {
          border-color: var(--color-accent);
          transform: translateY(-2px);
          box-shadow: var(--shadow-glow);
        }
        .template-page-card__nodes {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-1);
          margin-bottom: var(--space-4);
        }
        .template-page-card__node {
          padding: 3px 8px;
          background: var(--color-bg-surface);
          border: 1px solid var(--color-border-subtle);
          border-radius: var(--radius-sm);
          font-family: var(--font-mono);
          font-size: 0.5625rem;
          font-weight: 500;
          letter-spacing: 0.04em;
          color: var(--color-text-muted);
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
