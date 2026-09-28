'use client';

import Navigation from '@/components/navigation/Navigation';
import { Footer } from '@/components/sections/LandingSections';
import Link from 'next/link';

const PLANS = [
  {
    name: 'Community V1',
    tagline: 'FREE DURING VALIDATION',
    badge: 'ACTIVE NOW',
    price: '$0',
    period: '',
    description: 'Full, unrestricted access to the deterministic simulation engine, all 6 building blocks, and zero-backend link sharing.',
    features: [
      'Interactive architecture canvas',
      'All 6 primary components (API, Cache, Router, Vector DB, Fast & Frontier Models)',
      'Deterministic monthly cost & P95 latency models',
      'Real-time token and cache workload controls',
      'Anchor to My Bill invoice calibration',
      'Zero-backend Base64URL architecture sharing',
      'All 3 canonical architecture templates',
      'JSON architecture specification export',
    ],
    cta: 'Open Simulator Now',
    ctaLink: '/simulator',
    ctaStyle: 'btn-primary',
    status: 'available',
  },
  {
    name: 'Team Workspaces',
    tagline: 'COLLABORATIVE ARCHITECTURES',
    badge: 'PLANNED',
    price: '$49',
    period: '/mo (target)',
    description: 'Designed for engineering and FinOps teams seeking shared architectural governance and history.',
    features: [
      'Everything in Free V1',
      'Shared team organization workspaces',
      'Architecture revision diffing & versioning',
      'Multi-stakeholder review presentations',
      'Saved architecture catalog',
      'Targeted for post-V1 rollout',
    ],
    cta: 'Planned for Future',
    ctaLink: '/simulator',
    ctaStyle: 'btn-secondary',
    status: 'planned',
  },
  {
    name: 'Enterprise FinOps',
    tagline: 'ORGANIZATIONAL GOVERNANCE',
    badge: 'PLANNED',
    price: 'Custom',
    period: '',
    description: 'Direct integration with enterprise cloud billing APIs (AWS, GCP, Azure, OpenAI) for automated invoice calibration.',
    features: [
      'Automated billing API invoice ingest',
      'Custom proprietary model pricing curves',
      'Single Sign-On (SAML / Okta)',
      'Enterprise SLA & dedicated support',
      'Targeted for post-V1 rollout',
    ],
    cta: 'Planned for Future',
    ctaLink: '/simulator',
    ctaStyle: 'btn-secondary',
    status: 'planned',
  },
];

export default function PricingClient() {
  return (
    <>
      <Navigation />
      <main className="pricing-page">
        <div className="container" style={{ maxWidth: '1040px' }}>
          <div className="pricing-header">
            <span className="badge badge--success text-mono">100% FREE DURING V1</span>
            <h1 className="text-display" style={{ marginTop: 'var(--space-2)' }}>
              Simple, Honest Economics
            </h1>
            <p className="pricing-subtitle">
              ComputeCanvas is completely free while we validate the simulation engine with AI engineers, systems architects, and FinOps practitioners.
            </p>
          </div>

          <div className="pricing-grid">
            {PLANS.map(plan => (
              <div
                key={plan.name}
                className={`pricing-card ${plan.status === 'available' ? 'pricing-card--active' : 'pricing-card--planned'}`}
              >
                <div className="pricing-card-header">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                    <span className="text-caption text-mono" style={{ color: plan.status === 'available' ? 'var(--color-accent)' : 'var(--color-text-muted)' }}>
                      {plan.tagline}
                    </span>
                    <span className={`badge ${plan.status === 'available' ? 'badge--primary' : 'badge--neutral'} text-mono`} style={{ fontSize: '0.625rem' }}>
                      {plan.badge}
                    </span>
                  </div>

                  <h2 className="plan-name">{plan.name}</h2>
                  <div className="price-row">
                    <span className="price-num text-mono">{plan.price}</span>
                    {plan.period && <span className="price-period">{plan.period}</span>}
                  </div>
                  <p className="plan-desc">{plan.description}</p>
                </div>

                <div className="features-divider" />

                <ul className="plan-features-list">
                  {plan.features.map(f => (
                    <li key={f}>
                      <span className="feature-check" style={{ color: plan.status === 'available' ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                        ✓
                      </span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="card-footer-cta">
                  <Link href={plan.ctaLink} className={`btn ${plan.ctaStyle}`} style={{ width: '100%', textAlign: 'center', display: 'block' }}>
                    {plan.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="pricing-trust-footer">
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '6px' }}>
              Why is V1 free?
            </h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
              Our core objective in V1 is to ensure our deterministic token and latency formulas accurately model real-world architecture trade-offs. We are validating the product directly with engineering teams before introducing paid tiers.
            </p>
          </div>
        </div>
      </main>
      <Footer />

      <style jsx>{`
        .pricing-page {
          min-height: 100vh;
          padding-top: 100px;
          padding-bottom: var(--space-16);
          background: var(--color-bg);
        }
        .pricing-header {
          text-align: center;
          max-width: 680px;
          margin: 0 auto var(--space-12) auto;
        }
        .pricing-subtitle {
          color: var(--color-text-secondary);
          font-size: 1.0625rem;
          margin-top: var(--space-3);
          line-height: 1.5;
        }
        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-6);
          margin-bottom: var(--space-12);
        }
        .pricing-card {
          background: var(--color-bg-elevated);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-6);
          display: flex;
          flex-direction: column;
          position: relative;
        }
        .pricing-card--active {
          border-color: var(--color-accent);
          background: var(--color-bg-surface);
          box-shadow: 0 0 24px rgba(99, 102, 241, 0.12);
        }
        .pricing-card--planned {
          opacity: 0.85;
        }
        .plan-name {
          font-size: 1.25rem;
          font-weight: 700;
          margin: 0 0 8px 0;
        }
        .price-row {
          display: flex;
          align-items: baseline;
          gap: 6px;
          margin-bottom: var(--space-3);
        }
        .price-num {
          font-size: 2rem;
          font-weight: 800;
          color: var(--color-text);
        }
        .price-period {
          font-size: 0.8125rem;
          color: var(--color-text-muted);
        }
        .plan-desc {
          font-size: 0.8125rem;
          color: var(--color-text-secondary);
          line-height: 1.4;
          margin: 0;
          min-height: 48px;
        }
        .features-divider {
          height: 1px;
          background: var(--color-border-subtle);
          margin: var(--space-4) 0;
        }
        .plan-features-list {
          list-style: none;
          padding: 0;
          margin: 0 0 var(--space-6) 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex: 1;
        }
        .plan-features-list li {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 0.8125rem;
          color: var(--color-text-secondary);
          line-height: 1.4;
        }
        .feature-check {
          font-weight: 700;
          flex-shrink: 0;
        }
        .card-footer-cta {
          margin-top: auto;
        }
        .pricing-trust-footer {
          background: var(--color-bg-elevated);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: var(--space-6);
          max-width: 780px;
          margin: 0 auto;
          text-align: center;
        }
        @media (max-width: 900px) {
          .pricing-grid {
            grid-template-columns: 1fr;
          }
          .plan-desc {
            min-height: auto;
          }
        }
      `}</style>
    </>
  );
}
