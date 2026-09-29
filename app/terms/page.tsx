import { Metadata } from 'next';
import Navigation from '@/components/navigation/Navigation';
import { Footer } from '@/components/sections/LandingSections';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms & Disclaimers — ComputeCanvas',
  description: 'ComputeCanvas simulation terms, mathematical disclaimer, and validation guidelines.',
};

export default function TermsPage() {
  return (
    <>
      <Navigation />
      <main className="terms-page">
        <div className="container" style={{ maxWidth: '820px' }}>
          <div className="terms-header">
            <span className="badge badge--neutral text-mono">LEGAL SPECIFICATION</span>
            <h1 className="text-display" style={{ marginTop: 'var(--space-3)', fontSize: '2.25rem' }}>
              Terms &amp; Disclaimers
            </h1>
            <p className="text-caption text-mono" style={{ color: 'var(--color-text-muted)', marginTop: 'var(--space-2)' }}>
              LAST REVISED: Q1 2026 // VERSION 1.2
            </p>
          </div>

          <div className="terms-content">
            <section className="terms-section">
              <h2 className="terms-heading text-mono">01 // PRE-DEPLOYMENT SIMULATION PURPOSE</h2>
              <p>
                ComputeCanvas is an interactive architecture planning tool designed to help systems architects, AI engineers, and FinOps practitioners model theoretical cost curves, P95 latency profiles, and topological bottlenecks prior to writing production code.
              </p>
              <p>
                The outputs produced by the simulator are <strong>deterministic engineering approximations</strong> based on configurable pricing tables, token distributions, and network latency assumptions.
              </p>
            </section>

            <section className="terms-section">
              <h2 className="terms-heading text-mono">02 // NO INVOICE GUARANTEE</h2>
              <p>
                ComputeCanvas is not a cloud provider and does not issue invoices. Cloud service providers (such as OpenAI, Anthropic, Google Cloud, AWS, Pinecone, and Redis) may alter their API pricing, tiered discounts, minimum spend commitments, and egress tariffs at any time without notice.
              </p>
              <p>
                Real-world bills may additionally reflect network retries, unexpected prompt token explosion, preamble overhead, and data egress that cannot be anticipated in a static or heuristic model. Consequently, ComputeCanvas simulations should never be treated as legal, contractual, or financial guarantees of future cloud expenditure.
              </p>
            </section>

            <section className="terms-section">
              <h2 className="terms-heading text-mono">03 // INVOICE CALIBRATION INTEGRITY</h2>
              <p>
                The &ldquo;Anchor to My Bill&rdquo; calibration feature computes an empirical scalar between historical invoices and modeled baselines. It provides a grounded adjustment for unmodeled background tokens, but does not claim to reconstruct itemized provider ledger lines.
              </p>
            </section>

            <section className="terms-section">
              <h2 className="terms-heading text-mono">04 // VALIDATION V1 AVAILABILITY</h2>
              <p>
                ComputeCanvas V1 is provided free of charge without warranty of any kind. You are free to export architecture specifications, copy link-sharing payloads, and use simulation findings within your engineering reviews.
              </p>
            </section>
          </div>

          <div className="terms-footer-nav">
            <Link href="/simulator" className="btn btn-primary">
              Open Simulator &rarr;
            </Link>
            <Link href="/assumptions" className="btn btn-secondary">
              View Assumptions &rarr;
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
