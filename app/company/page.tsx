'use client';

import Navigation from '@/components/navigation/Navigation';
import { Footer } from '@/components/sections/LandingSections';
import Link from 'next/link';

export default function CompanyPage() {
  return (
    <>
      <Navigation />
      <main className="company-page">
        <div className="container">
          <div className="company-content" style={{ maxWidth: '960px', margin: 0 }}>
            <div className="section-header-block" style={{ marginBottom: 'var(--space-8)' }}>
              <span className="section-label">[COMPANY_MISSION]</span>
              <h1 className="section-heading">
                Interactive Pre-Deployment Decision Intelligence
              </h1>
              <p className="section-lead">
                Most teams discover their AI architecture is uneconomical after deploying to production. We built ComputeCanvas to let engineers and founders simulate systems before committing engineering cycles.
              </p>
            </div>

            <div className="company-grid">
              <div className="company-card">
                <h3 className="card-heading">The Problem</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
                  AI infrastructure decisions are made blind. Spreadsheets cannot model non-linear queuing, multi-agent fan-out, and caching hit rates. By the time bills arrive, refactoring distributed systems costs months.
                </p>
              </div>

              <div className="company-card">
                <h3 className="card-heading">The Differentiator</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
                  <strong>Interactive pre-deployment architecture decision-making</strong>. Change one slider and discover where your system breaks. Morph the architecture and see costs drop 41% deterministically.
                </p>
              </div>

              <div className="company-card">
                <h3 className="card-heading">Design Philosophy</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
                  <strong>Computational Editorial</strong>. Scientific precision meets editorial craftsmanship. No decorative particles, no fake AI gradient blobs. Every visual element communicates system behavior.
                </p>
              </div>

              <div className="company-card">
                <h3 className="card-heading">The Builder</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
                  Built by a systems engineer and software craftsman focused on making distributed AI architectures transparent, mathematically deterministic, and visually intelligible before production deployment.
                </p>
              </div>
            </div>

            <div className="company-footer-cta">
              <div>
                <h3 style={{ fontSize: '1.125rem', fontFamily: 'var(--font-display)', fontWeight: 600 }}>Ready to experience the platform?</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
                  Start simulating AI systems without committing engineering resources.
                </p>
              </div>
              <Link href="/simulator" className="btn btn-primary">
                Open Simulator &rarr;
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      <style jsx>{`
        .company-page {
          min-height: 100vh;
          padding-top: calc(var(--nav-height) + 40px);
          padding-bottom: var(--space-16);
          background: var(--color-bg);
        }
        .company-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-6);
          margin-bottom: var(--space-8);
        }
        .company-card {
          background: var(--color-bg-elevated);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          padding: var(--space-6);
        }
        .card-heading {
          font-family: var(--font-display);
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--color-text);
          margin-bottom: var(--space-3);
        }
        .company-footer-cta {
          background: var(--color-bg-elevated);
          border: 1px solid var(--color-border-strong);
          border-radius: var(--radius-sm);
          padding: var(--space-6) var(--space-8);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: var(--space-6);
          flex-wrap: wrap;
        }
        @media (max-width: 768px) {
          .company-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
