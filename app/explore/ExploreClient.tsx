'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { TEMPLATES, simulate, formatCurrency, formatLatency } from '@/lib/simulation/engine';

const STORIES = [
  {
    id: 'rag-economics',
    title: 'RAG',
    subtitle: 'Explore how retrieval changes the economics of an AI request.',
    templateId: 'rag',
    accent: 'var(--color-performance)',
  },
  {
    id: 'agent-complexity',
    title: 'AI Agents',
    subtitle: 'See how tool use and multi-step reasoning multiply cost and latency.',
    templateId: 'ai-agent',
    accent: 'var(--color-accent)',
  },
  {
    id: 'support-scale',
    title: 'Customer Support',
    subtitle: 'Model routing reduces cost by 60% at 2M conversations/month.',
    templateId: 'customer-support',
    accent: 'var(--color-cost)',
  },
  {
    id: 'code-quality',
    title: 'Code Assistant',
    subtitle: 'Context-aware retrieval improves quality but increases token consumption.',
    templateId: 'code-assistant',
    accent: 'var(--color-quality)',
  },
  {
    id: 'classification-speed',
    title: 'Classification API',
    subtitle: 'High throughput classification with aggressive caching.',
    templateId: 'classification',
    accent: 'var(--color-success)',
  },
  {
    id: 'recommendation-cost',
    title: 'Recommendation Engine',
    subtitle: 'Embedding-based search at scale with reranking.',
    templateId: 'recommendation',
    accent: 'var(--color-capacity)',
  },
];

export default function ExploreClient() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="container" style={{ paddingTop: 'calc(var(--nav-height) + 40px)', paddingBottom: 'var(--space-16)' }}>
      <div className="section-header-block" style={{ marginBottom: 'var(--space-8)' }}>
        <span className="section-label">[SYSTEM_STORIES]</span>
        <h1 className="section-heading">Architecture stories.</h1>
        <p className="section-lead">
          Each architecture tells a story about tradeoffs. Explore how different systems balance cost, speed, and quality.
        </p>
      </div>

      <div className="explore-grid" style={{ maxWidth: '1240px', margin: 0 }}>
        {STORIES.map((story, i) => {
          const template = TEMPLATES.find(t => t.id === story.templateId);
          if (!template) return null;
          const result = simulate(template.defaultWorkload, template.architecture);
          const isHovered = hoveredId === story.id;

          return (
            <motion.div
              key={story.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
            >
              <Link
                href={`/simulator?template=${story.templateId}`}
                className="explore-card"
                onMouseEnter={() => setHoveredId(story.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{ '--card-accent': story.accent } as React.CSSProperties}
              >
                <div className="explore-card__top">
                  <h3 className="text-title">{story.title}</h3>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem', marginTop: 'var(--space-2)', lineHeight: 1.6 }}>
                    {story.subtitle}
                  </p>
                </div>

                {/* Mini architecture nodes */}
                <div className="explore-card__arch">
                  {template.architecture.nodes.slice(0, 5).map((node, ni) => (
                    <motion.span
                      key={node.id}
                      className="explore-card__node"
                      animate={isHovered ? { y: -2, opacity: 1 } : { y: 0, opacity: 0.7 }}
                      transition={{ delay: ni * 0.03, duration: 0.2 }}
                    >
                      {node.label.toUpperCase()}
                    </motion.span>
                  ))}
                  {template.architecture.nodes.length > 5 && (
                    <span className="explore-card__node" style={{ opacity: 0.4 }}>
                      +{template.architecture.nodes.length - 5}
                    </span>
                  )}
                </div>

                <div className="explore-card__metrics">
                  <div>
                    <span className="text-label">COST</span>
                    <span className="text-mono" style={{ color: 'var(--color-cost)', fontSize: '0.875rem' }}>
                      {formatCurrency(result.monthlyCost, true)}/mo
                    </span>
                  </div>
                  <div>
                    <span className="text-label">LATENCY</span>
                    <span className="text-mono" style={{ color: 'var(--color-performance)', fontSize: '0.875rem' }}>
                      {formatLatency(result.p95Latency)}
                    </span>
                  </div>
                  <div>
                    <span className="text-label">QUALITY</span>
                    <span className="text-mono" style={{ color: 'var(--color-quality)', fontSize: '0.875rem' }}>
                      {result.qualityEstimate}%
                    </span>
                  </div>
                </div>

                <div className="explore-card__cta">
                  <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                    Open architecture →
                  </span>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      <style>{`
        .explore-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
          gap: var(--space-4);
        }
        .explore-card {
          display: flex;
          flex-direction: column;
          padding: var(--space-8);
          background: var(--color-bg-elevated);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          text-decoration: none;
          color: var(--color-text);
          transition: all var(--duration-normal) var(--ease-out);
          height: 100%;
          position: relative;
          overflow: hidden;
        }
        .explore-card::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--card-accent, var(--color-accent));
          opacity: 0;
          transition: opacity var(--duration-fast);
        }
        .explore-card:hover {
          border-color: var(--color-border-strong);
          transform: translateY(-3px);
          box-shadow: var(--shadow-lg);
        }
        .explore-card:hover::after {
          opacity: 1;
        }
        .explore-card__top {
          margin-bottom: var(--space-6);
        }
        .explore-card__arch {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-1);
          margin-bottom: var(--space-6);
        }
        .explore-card__node {
          padding: 3px 8px;
          background: var(--color-bg-surface);
          border: 1px solid var(--color-border-subtle);
          border-radius: var(--radius-sm);
          font-family: var(--font-mono);
          font-size: 0.75rem;
          font-weight: 500;
          letter-spacing: 0.02em;
          color: var(--color-text-muted);
        }
        .explore-card__metrics {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-4);
          padding-top: var(--space-4);
          border-top: 1px solid var(--color-border-subtle);
          margin-top: auto;
        }
        .explore-card__metrics > div {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .explore-card__cta {
          margin-top: var(--space-4);
          padding-top: var(--space-4);
          border-top: 1px solid var(--color-border-subtle);
          color: var(--color-accent);
        }
        @media (max-width: 640px) {
          .explore-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
