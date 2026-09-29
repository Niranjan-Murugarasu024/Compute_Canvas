import { Metadata } from 'next';
import Navigation from '@/components/navigation/Navigation';
import { Footer } from '@/components/sections/LandingSections';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy — ComputeCanvas',
  description: 'ComputeCanvas client-side architecture simulation privacy policy. Zero server storage, zero cookies.',
};

export default function PrivacyPage() {
  return (
    <>
      <Navigation />
      <main className="privacy-page">
        <div className="container" style={{ maxWidth: '820px' }}>
          <div className="policy-header">
            <span className="badge badge--neutral text-mono">LEGAL SPECIFICATION</span>
            <h1 className="text-display" style={{ marginTop: 'var(--space-3)', fontSize: '2.25rem' }}>
              Privacy Policy
            </h1>
            <p className="text-caption text-mono" style={{ color: 'var(--color-text-muted)', marginTop: 'var(--space-2)' }}>
              LAST REVISED: Q1 2026 // VERSION 1.2
            </p>
          </div>

          <div className="policy-content">
            <section className="policy-section">
              <h2 className="policy-heading text-mono">01 // ZERO-BACKEND CLIENT SIMULATION</h2>
              <p>
                ComputeCanvas is an entirely client-side simulator. When you design an architecture, adjust token volumes, configure cache hit rates, or anchor to your monthly cloud invoice, all calculations execute strictly in your local browser runtime via pure TypeScript functions.
              </p>
              <p>
                No architecture specifications, prompt volumes, or financial billing records are transmitted to or stored on any ComputeCanvas server or remote database.
              </p>
            </section>

            <section className="policy-section">
              <h2 className="policy-heading text-mono">02 // ARCHITECTURE LINK SHARING</h2>
              <p>
                When you click <strong>Share Architecture</strong>, your architecture graph, workload parameters, and calibration settings are serialized into a versioned JSON schema and compressed into a URL-safe Base64URL string.
              </p>
              <p>
                This string exists solely within the link copied to your clipboard. No server-side database record or permalink lookup table is generated. Anyone with access to the generated URL can reconstruct the corresponding architecture directly within their own browser.
              </p>
            </section>

            <section className="policy-section">
              <h2 className="policy-heading text-mono">03 // COOKIES &amp; TRACKING</h2>
              <p>
                ComputeCanvas does not use tracking cookies, advertising pixels, or invasive telemetry beacons. Local state persistence uses standard browser <code>localStorage</code> solely to preserve your active workbench canvas across page reloads. You can clear this state at any time through your browser settings or by clicking &ldquo;Clear Architecture&rdquo; within the simulator.
              </p>
            </section>

            <section className="policy-section">
              <h2 className="policy-heading text-mono">04 // OPEN SOURCE &amp; VERIFIABILITY</h2>
              <p>
                ComputeCanvas is developed openly. You can inspect the complete source code, mathematical simulation formulas, and sharing mechanics on GitHub at{' '}
                <a
                  href="https://github.com/Niranjan-Murugarasu024/Compute_Canvas"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--color-text)', textDecoration: 'underline' }}
                >
                  github.com/Niranjan-Murugarasu024/Compute_Canvas
                </a>.
              </p>
            </section>
          </div>

          <div className="policy-footer-nav">
            <Link href="/simulator" className="btn btn-primary">
              Open Simulator &rarr;
            </Link>
            <Link href="/terms" className="btn btn-secondary">
              Terms &amp; Disclaimers
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
