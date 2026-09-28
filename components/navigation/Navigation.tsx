'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const isSimulator = pathname === '/simulator';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <motion.nav
        className={`nav ${scrolled ? 'nav--scrolled' : ''} ${isSimulator ? 'nav--simulator' : ''}`}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="nav__inner container">
          <Link href="/" className="nav__logo" aria-label="ComputeCanvas Home">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <rect x="2" y="2" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.9" />
              <rect x="11" y="2" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.5" />
              <rect x="2" y="11" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.5" />
              <rect x="11" y="11" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.3" />
            </svg>
            <span>ComputeCanvas</span>
          </Link>

          <div className="nav__links">
            <Link href="/simulator" className={`nav__link ${pathname === '/simulator' ? 'nav__link--active' : ''}`}>
              Simulator
            </Link>
            <Link href="/templates" className={`nav__link ${pathname === '/templates' ? 'nav__link--active' : ''}`}>
              Templates
            </Link>
            <Link href="/assumptions" className={`nav__link ${pathname === '/assumptions' ? 'nav__link--active' : ''}`}>
              Assumptions
            </Link>
            <Link href="/pricing" className={`nav__link ${pathname === '/pricing' ? 'nav__link--active' : ''}`}>
              Pricing
            </Link>
            <Link href="/docs" className={`nav__link ${pathname === '/docs' ? 'nav__link--active' : ''}`}>
              Documentation
            </Link>
          </div>

          <div className="nav__actions">
            {!isSimulator ? (
              <Link href="/simulator" className="btn btn-primary nav__cta">
                Open Simulator
              </Link>
            ) : (
              <span className="badge badge--success text-mono" style={{ fontSize: '0.6875rem' }}>
                LIVE V1
              </span>
            )}
          </div>

          <button
            className="nav__mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            <span className={`nav__hamburger ${mobileMenuOpen ? 'open' : ''}`}>
              <span />
              <span />
            </span>
          </button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="nav__mobile-menu"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Link href="/simulator" className="nav__mobile-link" onClick={() => setMobileMenuOpen(false)}>Simulator</Link>
            <Link href="/simulator?template=rag-pipeline" className="nav__mobile-link" onClick={() => setMobileMenuOpen(false)}>Templates</Link>
            <Link href="/pricing" className="nav__mobile-link" onClick={() => setMobileMenuOpen(false)}>Pricing Assumptions</Link>
            <Link href="/docs" className="nav__mobile-link" onClick={() => setMobileMenuOpen(false)}>Documentation</Link>
            <div className="nav__mobile-divider" />
            <Link href="/simulator" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }} onClick={() => setMobileMenuOpen(false)}>
              Open Simulator
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          padding: 16px 0;
          transition: all var(--duration-normal) var(--ease-out);
        }
        .nav--scrolled {
          background: var(--color-bg-overlay);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--color-border-subtle);
          padding: 12px 0;
        }
        .nav__inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-8);
        }
        .nav__logo {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-weight: 600;
          font-size: 0.9375rem;
          color: var(--color-text);
          text-decoration: none;
          letter-spacing: -0.01em;
          flex-shrink: 0;
        }
        .nav__links {
          display: flex;
          align-items: center;
          gap: var(--space-1);
        }
        .nav__actions {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }
        .nav__link--subtle {
          color: var(--color-text-secondary) !important;
        }
        .nav__cta {
          padding: 10px 20px !important;
          font-size: 0.8125rem !important;
        }
        .nav__mobile-toggle {
          display: none;
          background: none;
          border: none;
          padding: var(--space-2);
          cursor: pointer;
          color: var(--color-text);
        }
        .nav__hamburger {
          display: flex;
          flex-direction: column;
          gap: 5px;
          width: 18px;
        }
        .nav__hamburger span {
          display: block;
          height: 1.5px;
          background: currentColor;
          border-radius: 1px;
          transition: all var(--duration-fast) var(--ease-out);
        }
        .nav__hamburger.open span:first-child {
          transform: rotate(45deg) translate(2.5px, 2.5px);
        }
        .nav__hamburger.open span:last-child {
          transform: rotate(-45deg) translate(2.5px, -2.5px);
        }
        .nav__mobile-menu {
          display: none;
          position: fixed;
          top: 60px;
          left: 0;
          right: 0;
          z-index: 99;
          background: var(--color-bg-elevated);
          border-bottom: 1px solid var(--color-border);
          padding: var(--space-6) var(--grid-gutter);
        }
        .nav__mobile-link {
          display: block;
          padding: var(--space-3) 0;
          color: var(--color-text);
          text-decoration: none;
          font-size: 1rem;
          font-weight: 500;
          border-bottom: 1px solid var(--color-border-subtle);
        }
        .nav__mobile-divider {
          height: 1px;
          background: var(--color-border);
          margin: var(--space-2) 0;
        }

        @media (max-width: 768px) {
          .nav__links,
          .nav__actions {
            display: none;
          }
          .nav__mobile-toggle {
            display: flex;
          }
          .nav__mobile-menu {
            display: flex;
            flex-direction: column;
          }
        }
      `}</style>

      {/* Global nav link styles */}
      <style jsx global>{`
        .nav__link {
          display: inline-flex;
          align-items: center;
          padding: 6px 12px;
          color: var(--color-text-secondary);
          text-decoration: none;
          font-size: 0.8125rem;
          font-weight: 450;
          border-radius: var(--radius-md);
          transition: all var(--duration-fast) var(--ease-out);
        }
        .nav__link:hover {
          color: var(--color-text);
          background: rgba(255, 255, 255, 0.04);
        }
        .nav__link--active {
          color: var(--color-accent) !important;
          background: var(--color-accent-dim) !important;
          font-weight: 600;
        }
      `}</style>
    </>
  );
}
