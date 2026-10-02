'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { href: '/simulator', label: 'Workbench', description: 'Architecture & economics workbench' },
  { href: '/templates', label: 'Blueprints', description: 'Canonical architecture patterns' },
  { href: '/assumptions', label: 'Models', description: 'Model assumption registry' },
  { href: '/docs', label: 'Docs', description: 'Methodology & documentation' },
] as const;

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const isWorkbench = pathname === '/simulator';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <header
        className={`cc-nav ${scrolled ? 'cc-nav--scrolled' : ''} ${isWorkbench ? 'cc-nav--workbench' : ''}`}
        role="banner"
      >
        <div className="cc-nav__inner container">
          {/* Brand */}
          <Link href="/" className="cc-nav__brand" aria-label="ComputeCanvas — Return to homepage">
            <svg className="cc-nav__mark" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <rect x="0" y="0" width="7" height="7" fill="currentColor" opacity="1" />
              <rect x="9" y="0" width="7" height="7" fill="currentColor" opacity="0.4" />
              <rect x="0" y="9" width="7" height="7" fill="currentColor" opacity="0.4" />
              <rect x="9" y="9" width="7" height="7" fill="currentColor" opacity="1" />
            </svg>
            <span className="cc-nav__wordmark">COMPUTECANVAS</span>
            <span className="cc-nav__divider" aria-hidden="true">/</span>
            <span className="cc-nav__engine text-mono">ENGINE v1</span>
          </Link>

          {/* Central Navigation */}
          <nav className="cc-nav__links" aria-label="Primary navigation">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`cc-nav__link ${pathname === href || (href === '/simulator' && pathname?.startsWith('/simulator')) ? 'cc-nav__link--active' : ''}`}
                aria-current={pathname === href ? 'page' : undefined}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="cc-nav__actions">
            {!isWorkbench ? (
              <Link href="/simulator" className="cc-nav__cta btn btn-primary btn-sm">
                OPEN WORKBENCH →
              </Link>
            ) : (
              <div className="cc-nav__status text-mono" aria-label="Workbench status: online">
                <span className="cc-nav__status-dot" aria-hidden="true" />
                <span>WORKBENCH / READY</span>
              </div>
            )}

            <button
              className="cc-nav__toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="cc-mobile-drawer"
            >
              <span className={`cc-nav__burger ${mobileMenuOpen ? 'cc-nav__burger--open' : ''}`} aria-hidden="true">
                <span />
                <span />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <div
        id="cc-mobile-drawer"
        className={`cc-mobile-drawer ${mobileMenuOpen ? 'cc-mobile-drawer--open' : ''}`}
        aria-hidden={!mobileMenuOpen}
      >
        <div className="cc-mobile-drawer__header">
          <span className="text-mono" style={{ fontSize: '0.6875rem', letterSpacing: '0.08em', color: 'var(--color-text-muted)' }}>
            NAVIGATION
          </span>
          <span className="text-mono" style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
            ENGINE v1
          </span>
        </div>

        {NAV_LINKS.map(({ href, label, description }) => (
          <Link
            key={href}
            href={href}
            className={`cc-mobile-link ${pathname === href ? 'cc-mobile-link--active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="cc-mobile-link__label">{label}</span>
            <span className="cc-mobile-link__desc">{description}</span>
          </Link>
        ))}

        <div className="cc-mobile-drawer__footer">
          <Link
            href="/simulator"
            className="btn btn-primary"
            style={{ width: '100%', textAlign: 'center', justifyContent: 'center' }}
            onClick={() => setMobileMenuOpen(false)}
          >
            OPEN WORKBENCH →
          </Link>
        </div>
      </div>

      <style>{`
        /* ── Navigation Shell ── */
        .cc-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          height: var(--nav-height, 54px);
          background: var(--color-bg);
          border-bottom: 1px solid var(--color-border);
          transition: border-color 0.2s ease;
        }

        .cc-nav--scrolled {
          border-bottom-color: var(--color-border-strong);
        }

        .cc-nav__inner {
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          height: 100%;
          gap: 40px;
        }

        /* ── Brand ── */
        .cc-nav__brand {
          display: flex;
          align-items: center;
          gap: 9px;
          text-decoration: none;
          color: var(--color-text);
          flex-shrink: 0;
        }

        .cc-nav__mark {
          color: var(--color-text);
          flex-shrink: 0;
        }

        .cc-nav__wordmark {
          font-family: var(--font-display);
          font-size: 0.875rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          color: var(--color-text);
          line-height: 1;
        }

        .cc-nav__divider {
          color: var(--color-border-strong);
          font-size: 0.75rem;
          line-height: 1;
          margin: 0 -2px;
        }

        .cc-nav__engine {
          font-family: var(--font-mono);
          font-size: 0.625rem;
          color: var(--color-text-muted);
          letter-spacing: 0.08em;
          line-height: 1;
        }

        /* ── Links ── */
        .cc-nav__links {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 24px;
          height: 100%;
        }

        .cc-nav__link {
          display: inline-flex;
          align-items: center;
          height: 100%;
          padding: 0 2px;
          font-family: var(--font-ui);
          font-size: 0.75rem;
          font-weight: 500;
          letter-spacing: 0.04em;
          color: var(--color-text-muted);
          text-decoration: none;
          border-bottom: 1.5px solid transparent;
          transition: color 0.12s ease, border-color 0.12s ease;
          white-space: nowrap;
        }

        .cc-nav__link:hover {
          color: var(--color-text-secondary);
        }

        .cc-nav__link--active {
          color: var(--color-text);
          border-bottom-color: var(--color-text);
        }

        /* ── Actions ── */
        .cc-nav__actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
        }

        .cc-nav__cta {
          font-family: var(--font-ui);
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.03em;
          height: 34px;
          padding: 0 14px;
        }

        .cc-nav__status {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 3px 9px;
          background: var(--color-bg-elevated);
          border: 1px solid var(--color-border);
          border-radius: 2px;
          font-size: 0.5625rem;
          letter-spacing: 0.08em;
          color: var(--color-text-muted);
        }

        .cc-nav__status-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #FFFFFF;
          flex-shrink: 0;
        }

        /* ── Mobile Toggle ── */
        .cc-nav__toggle {
          display: none;
          background: none;
          border: 1px solid var(--color-border);
          border-radius: 2px;
          padding: 7px 8px;
          cursor: pointer;
          color: var(--color-text);
          align-items: center;
          justify-content: center;
        }

        .cc-nav__toggle:hover {
          border-color: var(--color-border-strong);
        }

        .cc-nav__burger {
          display: flex;
          flex-direction: column;
          gap: 4px;
          width: 14px;
        }

        .cc-nav__burger span {
          display: block;
          height: 1.5px;
          background: currentColor;
          transition: transform 0.15s ease, opacity 0.15s ease;
        }

        .cc-nav__burger--open span:first-child {
          transform: translateY(2.75px) rotate(45deg);
        }

        .cc-nav__burger--open span:last-child {
          transform: translateY(-2.75px) rotate(-45deg);
        }

        /* ── Mobile Drawer ── */
        .cc-mobile-drawer {
          display: none;
          position: fixed;
          top: var(--nav-height, 54px);
          left: 0;
          right: 0;
          z-index: 99;
          background: var(--color-bg-elevated);
          border-bottom: 1px solid var(--color-border);
          padding: 0 var(--grid-gutter);
          transform: translateY(-4px);
          opacity: 0;
          transition: transform 0.15s ease, opacity 0.15s ease;
          pointer-events: none;
        }

        .cc-mobile-drawer--open {
          transform: translateY(0);
          opacity: 1;
          pointer-events: all;
        }

        .cc-mobile-drawer__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid var(--color-border-subtle);
        }

        .cc-mobile-link {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 14px 0;
          text-decoration: none;
          border-bottom: 1px solid var(--color-border-subtle);
          transition: opacity 0.1s;
        }

        .cc-mobile-link:hover {
          opacity: 0.85;
        }

        .cc-mobile-link__label {
          font-family: var(--font-ui);
          font-size: 0.875rem;
          font-weight: 600;
          letter-spacing: 0.03em;
          color: var(--color-text-secondary);
        }

        .cc-mobile-link--active .cc-mobile-link__label {
          color: var(--color-text);
        }

        .cc-mobile-link__desc {
          font-family: var(--font-ui);
          font-size: 0.75rem;
          color: var(--color-text-muted);
        }

        .cc-mobile-drawer__footer {
          padding: 16px 0 20px;
        }

        /* ── Responsive breakpoint ── */
        @media (max-width: 820px) {
          .cc-nav__links {
            display: none;
          }
          .cc-nav__toggle {
            display: flex;
          }
          .cc-mobile-drawer {
            display: block;
          }
          .cc-nav__inner {
            grid-template-columns: auto auto;
            gap: 0;
          }
          .cc-nav__actions {
            gap: 8px;
          }
          .cc-nav__cta {
            display: none;
          }
        }

        @media (max-width: 480px) {
          .cc-nav__engine {
            display: none;
          }
          .cc-nav__divider {
            display: none;
          }
        }
      `}</style>
    </>
  );
}
