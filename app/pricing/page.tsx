import { Metadata } from 'next';
import Navigation from '@/components/navigation/Navigation';
import { Footer } from '@/components/sections/LandingSections';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Pricing — ComputeCanvas',
  description: 'Simple, transparent pricing for ComputeCanvas. Free to explore, Pro to build, Team to collaborate.',
};

const PLANS = [
  {
    name: 'Free',
    tagline: 'Explore',
    price: '$0',
    period: '',
    features: [
      '3 architectures',
      'Basic simulation',
      'Public templates',
      'Community support',
    ],
    cta: 'Start exploring',
    ctaStyle: 'btn-secondary',
    highlighted: false,
  },
  {
    name: 'Pro',
    tagline: 'Build',
    price: '$39',
    period: '/mo',
    features: [
      'Unlimited architectures',
      'Advanced scenarios',
      'AI assistant',
      'Export (JSON, PNG, SVG)',
      'Shareable links',
      'Priority support',
    ],
    cta: 'Start building',
    ctaStyle: 'btn-primary',
    highlighted: true,
  },
  {
    name: 'Team',
    tagline: 'Collaborate',
    price: '$149',
    period: '/mo',
    features: [
      'Everything in Pro',
      'Shared workspaces',
      'Team scenarios',
      'Governance controls',
      'Analytics dashboard',
      'SSO',
      'Dedicated support',
    ],
    cta: 'Contact us',
    ctaStyle: 'btn-secondary',
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <>
      <Navigation />
      <main style={{ paddingTop: 100 }}>
        <div className="container section" style={{ textAlign: 'center' }}>
          <p className="text-label" style={{ marginBottom: 'var(--space-3)', color: 'var(--color-accent)' }}>
            PRICING
          </p>
          <h1 className="text-display" style={{ marginBottom: 'var(--space-4)', maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' }}>
            Start free. <span style={{ color: 'var(--color-text-secondary)' }}>Scale when ready.</span>
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', maxWidth: 480, margin: '0 auto var(--space-12)', fontSize: '1.0625rem' }}>
            Every plan includes access to the simulation engine with real pricing data.
          </p>

          <div className="pricing-grid">
            {PLANS.map(plan => (
              <div
                key={plan.name}
                className={`pricing-card ${plan.highlighted ? 'pricing-card--highlighted' : ''}`}
              >
                <div className="pricing-card__header">
                  <p className="text-label" style={{ marginBottom: 'var(--space-1)' }}>{plan.tagline.toUpperCase()}</p>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: 'var(--space-3)' }}>{plan.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4 }}>
                    <span className="text-metric">{plan.price}</span>
                    {plan.period && <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{plan.period}</span>}
                  </div>
                </div>

                <ul className="pricing-card__features">
                  {plan.features.map(f => (
                    <li key={f}>
                      <span style={{ color: 'var(--color-success)', marginRight: 'var(--space-2)' }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link href="/simulator" className={`btn ${plan.ctaStyle}`} style={{ width: '100%', padding: '12px' }}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <p style={{ color: 'var(--color-text-muted)', marginTop: 'var(--space-8)', fontSize: '0.8125rem' }}>
            All prices in USD. Pricing is subject to change. Enterprise plans available on request.
          </p>
        </div>
      </main>
      <Footer />

      <style>{`
        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: var(--color-border);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          overflow: hidden;
          max-width: 960px;
          margin: 0 auto;
          text-align: left;
        }
        .pricing-card {
          padding: var(--space-8);
          background: var(--color-bg-elevated);
          display: flex;
          flex-direction: column;
        }
        .pricing-card--highlighted {
          background: var(--color-bg-surface);
          position: relative;
        }
        .pricing-card--highlighted::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--color-accent);
        }
        .pricing-card__header {
          text-align: center;
          margin-bottom: var(--space-6);
          padding-bottom: var(--space-6);
          border-bottom: 1px solid var(--color-border-subtle);
        }
        .pricing-card__features {
          list-style: none;
          padding: 0;
          margin: 0 0 var(--space-6) 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }
        .pricing-card__features li {
          font-size: 0.875rem;
          color: var(--color-text-secondary);
          display: flex;
          align-items: start;
        }
        @media (max-width: 768px) {
          .pricing-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
