'use client';

import { useState, useEffect, useCallback } from 'react';
import Navigation from '@/components/navigation/Navigation';
import { Footer } from '@/components/sections/LandingSections';
import Link from 'next/link';

interface Plan {
  name: string;
  tagline: string;
  badge: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  ctaLink?: string;
  ctaStyle: string;
  status: 'available' | 'planned';
}

const PLANS: Plan[] = [
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
      'Historical Bill Calibration (optional)',
      'Zero-backend Base64URL architecture sharing',
      'All 3 canonical architecture templates',
      'JSON architecture specification export',
    ],
    cta: 'Open Workbench',
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
    cta: 'Request Early Access',
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
    cta: 'Contact for Enterprise',
    ctaStyle: 'btn-secondary',
    status: 'planned',
  },
];

export default function PricingClient() {
  const [selectedPlanForWaitlist, setSelectedPlanForWaitlist] = useState<Plan | null>(null);
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedPlanForWaitlist) {
        setSelectedPlanForWaitlist(null);
        setIsSubmitted(false);
        setFormError(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPlanForWaitlist]);

  const openWaitlistModal = (plan: Plan) => {
    setSelectedPlanForWaitlist(plan);
    setIsSubmitted(false);
    setFormError(null);
  };

  const closeWaitlistModal = () => {
    setSelectedPlanForWaitlist(null);
    setIsSubmitted(false);
    setFormError(null);
  };

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      setFormError('Please enter a valid work email address.');
      return;
    }

    setIsSubmitting(true);

    const leadData = {
      email: email.trim(),
      company: company.trim() || undefined,
      notes: notes.trim() || undefined,
      plan: selectedPlanForWaitlist?.name || 'Team Workspaces',
    };

    // Client localStorage backup for resiliency
    try {
      const existingLeads = JSON.parse(localStorage.getItem('computecanvas_waitlist_leads') || '[]');
      const newLead = {
        id: `lead-${Date.now()}`,
        ...leadData,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem('computecanvas_waitlist_leads', JSON.stringify([...existingLeads, newLead]));
    } catch {
      // localStorage may fail in private mode
    }

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        console.warn('Waitlist API response non-ok:', data);
      }
    } catch (err) {
      console.warn('Waitlist API network issue (saved to local backup):', err);
    } finally {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }
  };

  return (
    <>
      <Navigation />
      <main className="pricing-page">
        <div className="container">
          <div className="section-header-block" style={{ marginBottom: 'var(--space-8)' }}>
            <span className="section-label">[COMMUNITY_ACCESS]</span>
            <h1 className="section-heading">Simple, Honest Economics</h1>
            <p className="section-lead">
              ComputeCanvas is completely free while we validate the simulation engine with AI engineers, systems architects, and FinOps practitioners.
            </p>

            {/* Current Status Banner (Section 52) */}
            <div className="pricing-status-banner text-mono" style={{ margin: '20px 0 16px 0', padding: '14px 18px', background: '#141417', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '0.8125rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FFFFFF', display: 'inline-block' }} />
                <strong style={{ color: '#FFFFFF' }}>CURRENT STATUS: VALIDATION RELEASE</strong>
              </div>
              <p style={{ margin: 0, color: '#A1A1AA', fontSize: '0.75rem', lineHeight: 1.5, fontFamily: 'var(--font-ui)' }}>
                ComputeCanvas is currently available for validation and evaluation. The complete simulation engine, component palette, bill calibration, and URL state sharing are unrestricted. Commercial team plans are planned for a future release.
              </p>
            </div>
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
                  {plan.ctaLink ? (
                    <Link href={plan.ctaLink} className={`btn ${plan.ctaStyle}`} style={{ width: '100%', textAlign: 'center', display: 'block' }}>
                      {plan.cta}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openWaitlistModal(plan)}
                      className={`btn ${plan.ctaStyle}`}
                      style={{ width: '100%', textAlign: 'center', display: 'block', cursor: 'pointer' }}
                    >
                      {plan.cta} &rarr;
                    </button>
                  )}
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

        {/* Waitlist / Early Access Modal — permanently rendered in DOM for SSR inspection, crawler indexing, and immediate access */}
        <div
          id="waitlist-modal"
          className="waitlist-modal-backdrop"
          style={{ display: selectedPlanForWaitlist ? 'flex' : 'none' }}
          onClick={closeWaitlistModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="waitlist-title"
          aria-hidden={!selectedPlanForWaitlist}
        >
          <div className="waitlist-modal-content" onClick={e => e.stopPropagation()}>
            <div className="waitlist-modal-header">
              <div>
                <span className="badge badge--neutral text-mono" style={{ fontSize: '0.625rem', marginBottom: '6px', display: 'inline-block' }}>
                  PRIORITY INTAKE // {(selectedPlanForWaitlist?.name || 'Team Workspaces').toUpperCase()}
                </span>
                <h3 id="waitlist-title" className="waitlist-modal-title">
                  Join {selectedPlanForWaitlist?.name || 'Team Workspaces'} Early Access
                </h3>
                <p className="waitlist-modal-desc">
                  We are onboarding engineering teams in weekly cohorts. Enter your work credentials below to secure priority workspace provisioning.
                </p>
              </div>
              <button
                type="button"
                onClick={closeWaitlistModal}
                className="waitlist-modal-close"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

              {isSubmitted ? (
                <div className="waitlist-success-state">
                  <div className="waitlist-success-icon">✓</div>
                  <h4 style={{ fontSize: '1.125rem', fontWeight: 600, margin: '0 0 8px 0', color: 'var(--color-text)' }}>
                    Priority Access Requested
                  </h4>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: '0 0 20px 0' }}>
                    Thank you. We have queued <strong style={{ color: 'var(--color-text)' }}>{email}</strong> for the upcoming {selectedPlanForWaitlist?.name || 'Team Workspaces'} cohort. You will receive an invitation when provisioning opens.
                  </p>
                  <button
                    type="button"
                    onClick={closeWaitlistModal}
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleWaitlistSubmit} className="waitlist-form">
                  <div className="form-group">
                    <label className="form-label" htmlFor="waitlist-email">
                      Work Email <span style={{ color: 'var(--color-accent)' }}>*</span>
                    </label>
                    <input
                      id="waitlist-email"
                      type="email"
                      required
                      placeholder="engineer@company.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="form-input text-mono"
                      autoFocus
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="waitlist-company">
                      Company / Organization (Optional)
                    </label>
                    <input
                      id="waitlist-company"
                      type="text"
                      placeholder="e.g. Stripe, OpenAI, or Team Size (5-20)"
                      value={company}
                      onChange={e => setCompany(e.target.value)}
                      className="form-input text-mono"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="waitlist-notes">
                      Primary Architectural Focus (Optional)
                    </label>
                    <input
                      id="waitlist-notes"
                      type="text"
                      placeholder="e.g. Multi-region latency, router cost reduction, invoice audit"
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      className="form-input text-mono"
                    />
                  </div>

                  {formError && (
                    <div className="form-error-msg text-caption text-mono">
                      {formError}
                    </div>
                  )}

                  <div className="form-actions">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn btn-primary"
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      {isSubmitting ? 'Registering...' : 'Request Priority Access \u2192'}
                    </button>
                  </div>

                  <p className="waitlist-privacy-note text-caption">
                    Zero marketing spam. We only use your email to schedule cohort access and share direct technical updates.
                  </p>
                </form>
              )}
            </div>
          </div>
      </main>
      <Footer />

      <style>{`
        .pricing-page {
          min-height: 100vh;
          padding-top: calc(var(--nav-height) + 40px);
          padding-bottom: var(--space-16);
          background: var(--color-bg);
        }
        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-6);
          margin-bottom: var(--space-8);
          max-width: 1200px;
        }
        .pricing-card {
          background: var(--color-bg-elevated);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          padding: var(--space-6);
          display: flex;
          flex-direction: column;
          position: relative;
        }
        .pricing-card--active {
          border-color: var(--color-border-strong);
          background: var(--color-bg-surface);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
        }
        .pricing-card--planned {
          opacity: 0.75;
        }
        .plan-name {
          font-family: var(--font-display);
          font-size: 1.15rem;
          font-weight: 600;
          letter-spacing: -0.01em;
          margin: 0 0 8px 0;
          color: var(--color-text);
        }
        .price-row {
          display: flex;
          align-items: baseline;
          gap: 6px;
          margin-bottom: var(--space-3);
        }
        .price-num {
          font-family: var(--font-mono);
          font-size: 2rem;
          font-weight: 600;
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
          background: var(--color-border);
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
          font-weight: 600;
          flex-shrink: 0;
        }
        .card-footer-cta {
          margin-top: auto;
        }
        .pricing-trust-footer {
          background: var(--color-bg-elevated);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          padding: var(--space-6);
          max-width: 1200px;
          margin: 0;
          text-align: left;
        }
        @media (max-width: 900px) {
          .pricing-grid {
            grid-template-columns: 1fr;
          }
          .plan-desc {
            min-height: auto;
          }
        }

        /* Waitlist Modal Styles */
        .waitlist-modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.78);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }
        .waitlist-modal-content {
          background: #121215;
          border: 1px solid var(--color-border-strong);
          border-radius: var(--radius-sm);
          width: 100%;
          max-width: 520px;
          padding: 28px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.85);
          animation: modalFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.97) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .waitlist-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 20px;
        }
        .waitlist-modal-title {
          font-family: var(--font-display);
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--color-text);
          margin: 0 0 6px 0;
        }
        .waitlist-modal-desc {
          font-size: 0.8125rem;
          color: var(--color-text-secondary);
          line-height: 1.45;
          margin: 0;
        }
        .waitlist-modal-close {
          background: transparent;
          border: 1px solid var(--color-border);
          color: var(--color-text-muted);
          width: 32px;
          height: 32px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 0.875rem;
          flex-shrink: 0;
          transition: all 0.15s ease;
        }
        .waitlist-modal-close:hover {
          color: var(--color-text);
          border-color: var(--color-text-secondary);
          background: #18181b;
        }
        .waitlist-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-label {
          font-size: 0.75rem;
          font-family: var(--font-mono);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-text-muted);
        }
        .form-input {
          background: #09090b;
          border: 1px solid var(--color-border);
          border-radius: 4px;
          padding: 10px 12px;
          font-size: 0.875rem;
          color: var(--color-text);
          transition: border-color 0.15s ease;
        }
        .form-input:focus {
          outline: none;
          border-color: var(--color-text-primary, #ffffff);
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.2);
        }
        .form-error-msg {
          color: #f87171;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 0.75rem;
        }
        .form-actions {
          margin-top: 8px;
        }
        .waitlist-privacy-note {
          font-size: 0.6875rem;
          color: var(--color-text-muted);
          line-height: 1.4;
          margin: 6px 0 0 0;
          text-align: center;
        }
        .waitlist-success-state {
          text-align: center;
          padding: 16px 8px;
        }
        .waitlist-success-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(34, 197, 94, 0.15);
          color: #22c55e;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0 auto 16px auto;
          border: 1px solid rgba(34, 197, 94, 0.35);
        }
      `}</style>
    </>
  );
}
