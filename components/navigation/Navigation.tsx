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
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <header
        className={`tech-nav ${scrolled ? 'tech-nav--scrolled' : ''} ${isSimulator ? 'tech-nav--simulator' : ''}`}
      >
        <div className="tech-nav__inner container">
          {/* Brand & System Tag */}
          <Link href="/" className="tech-nav__brand" aria-label="ComputeCanvas Home">
            <span className="tech-nav__symbol" aria-hidden="true">■</span>
            <span className="tech-nav__title">COMPUTECANVAS</span>
            <span className="tech-nav__slash">/</span>
            <span className="tech-nav__version text-mono">V1.2</span>
          </Link>

          {/* Central Technical Navigation */}
          <nav className="tech-nav__links" aria-label="Main Navigation">
            <Link
              href="/simulator"
              className={`tech-nav__link ${pathname === '/simulator' ? 'active' : ''}`}
            >
              SIMULATOR
            </Link>
            <Link
              href="/templates"
              className={`tech-nav__link ${pathname === '/templates' ? 'active' : ''}`}
            >
              TEMPLATES
            </Link>
            <Link
              href="/assumptions"
              className={`tech-nav__link ${pathname === '/assumptions' ? 'active' : ''}`}
            >
              ASSUMPTIONS
            </Link>
            <Link
              href="/pricing"
              className={`tech-nav__link ${pathname === '/pricing' ? 'active' : ''}`}
            >
              PRICING
            </Link>
            <Link
              href="/docs"
              className={`tech-nav__link ${pathname === '/docs' ? 'active' : ''}`}
            >
              DOCS
            </Link>
          </nav>

          {/* Action Header */}
          <div className="tech-nav__actions">
            {!isSimulator ? (
              <Link href="/simulator" className="btn btn-primary btn-sm tech-nav__cta">
                OPEN SIMULATOR &rarr;
              </Link>
            ) : (
              <div className="tech-nav__status-pill text-mono">
                <span className="status-indicator-dot" />
                <span>ONLINE // READY</span>
              </div>
            )}

            <button
              className="tech-nav__toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              <span className={`tech-nav__burger ${mobileMenuOpen ? 'open' : ''}`}>
                <span />
                <span />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="tech-nav__mobile-drawer"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            <div className="mobile-drawer-header">
              <span className="text-label">SYSTEM NAVIGATION</span>
            </div>
            <Link
              href="/simulator"
              className={`mobile-drawer-link ${pathname === '/simulator' ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              SIMULATOR
            </Link>
            <Link
              href="/templates"
              className={`mobile-drawer-link ${pathname === '/templates' ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              TEMPLATES
            </Link>
            <Link
              href="/assumptions"
              className={`mobile-drawer-link ${pathname === '/assumptions' ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              PRICING ASSUMPTIONS
            </Link>
            <Link
              href="/pricing"
              className={`mobile-drawer-link ${pathname === '/pricing' ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              TIERS &amp; FREE V1
            </Link>
            <Link
              href="/docs"
              className={`mobile-drawer-link ${pathname === '/docs' ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              DOCUMENTATION
            </Link>
            <div className="mobile-drawer-footer">
              <Link
                href="/simulator"
                className="btn btn-primary"
                style={{ width: '100%', textAlign: 'center' }}
                onClick={() => setMobileMenuOpen(false)}
              >
                OPEN SIMULATOR &rarr;
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .tech-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          height: var(--nav-height, 58px);
          background: #09090B;
          border-bottom: 1px solid var(--color-border);
          transition: background 0.2s ease, border-color 0.2s ease;
        }
        .tech-nav--scrolled {
          background: #09090B;
        }
        .tech-nav__inner {
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          height: 100%;
          gap: var(--space-6);
        }
        .tech-nav__brand {
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          color: var(--color-text);
          flex-shrink: 0;
        }
        .tech-nav__symbol {
          font-size: 10px;
          color: var(--color-text);
          line-height: 1;
        }
        .tech-nav__title {
          font-family: var(--font-display);
          font-size: 0.9375rem; /* 15px */
          font-weight: 600;
          letter-spacing: 0.05em;
          color: var(--color-text);
          line-height: 1;
        }
        .tech-nav__slash {
          color: var(--color-border-strong);
          font-size: 0.8125rem;
          font-weight: 400;
          line-height: 1;
        }
        .tech-nav__version {
          font-family: var(--font-mono);
          font-size: 0.6875rem; /* 11px */
          font-weight: 400;
          color: var(--color-text-muted);
          letter-spacing: 0.08em;
          line-height: 1;
        }
        .tech-nav__links {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 22px;
          height: 100%;
        }
        .tech-nav__link {
          display: inline-flex;
          align-items: center;
          height: 100%;
          padding: 0 2px;
          font-family: var(--font-ui);
          font-size: 0.8125rem; /* 13px */
          font-weight: 500;
          letter-spacing: 0.03em;
          color: var(--color-text-secondary);
          text-decoration: none;
          border-bottom: 2px solid transparent;
          transition: color 0.15s ease, border-color 0.15s ease;
        }
        .tech-nav__link:hover {
          color: var(--color-text);
        }
        .tech-nav__link.active {
          color: var(--color-text);
          border-bottom-color: var(--color-text);
        }
        .tech-nav__actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
        }
        .tech-nav__cta {
          height: 38px;
          padding: 0 16px;
          font-size: 0.8125rem;
          font-weight: 600;
          letter-spacing: 0.02em;
        }
        .tech-nav__status-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 3px 8px;
          background: #111114;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          font-size: 0.625rem;
          letter-spacing: 0.08em;
          color: var(--color-text-muted);
        }
        .status-indicator-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #FFFFFF;
        }
        .tech-nav__toggle {
          display: none;
          background: none;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          padding: 6px;
          cursor: pointer;
          color: var(--color-text);
        }
        .tech-nav__burger {
          display: flex;
          flex-direction: column;
          gap: 4px;
          width: 14px;
        }
        .tech-nav__burger span {
          display: block;
          height: 1.5px;
          background: currentColor;
          transition: transform 0.2s;
        }
        .tech-nav__burger.open span:first-child {
          transform: translateY(2.5px) rotate(45deg);
        }
        .tech-nav__burger.open span:last-child {
          transform: translateY(-2.5px) rotate(-45deg);
        }

        .tech-nav__mobile-drawer {
          display: none;
          position: fixed;
          top: var(--nav-height, 58px);
          left: 0;
          right: 0;
          z-index: 99;
          background: #111114;
          border-bottom: 1px solid var(--color-border);
          padding: 16px var(--grid-gutter);
        }
        .mobile-drawer-header {
          padding-bottom: 8px;
          border-bottom: 1px solid var(--color-border-subtle);
          margin-bottom: 8px;
        }
        .mobile-drawer-link {
          display: block;
          padding: 10px 0;
          color: var(--color-text-secondary);
          text-decoration: none;
          font-family: var(--font-ui);
          font-size: 0.875rem;
          font-weight: 500;
          letter-spacing: 0.02em;
          border-bottom: 1px solid var(--color-border-subtle);
        }
        .mobile-drawer-link.active {
          color: var(--color-text);
          font-weight: 600;
        }
        .mobile-drawer-footer {
          padding-top: 16px;
        }

        @media (max-width: 820px) {
          .tech-nav__links {
            display: none;
          }
          .tech-nav__toggle {
            display: flex;
          }
          .tech-nav__mobile-drawer {
            display: block;
          }
        }
      `}</style>
    </>
  );
}
