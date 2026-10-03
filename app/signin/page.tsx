'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Navigation from '@/components/navigation/Navigation';

export default function SignInPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push('/dashboard');
    }, 600);
  };

  const handleDemoAccess = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push('/dashboard');
    }, 400);
  };

  return (
    <>
      <Navigation />
      <main className="signin-page">
        <div className="signin-container">
          {/* Left / Top Banner: Product Value Transition (Prompt Section 38) */}
          <motion.div 
            className="signin-preview-card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="signin-badge">
              <span className="badge badge--success">READY TO SAVE</span>
            </div>
            <p className="text-caption text-mono" style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' }}>
              SIMULATED ARCHITECTURE
            </p>
            <h2 className="text-title" style={{ fontSize: '1.5rem', marginBottom: 'var(--space-4)' }}>
              Customer Support AI
            </h2>

            <div className="signin-metrics-grid">
              <div className="signin-metric">
                <span className="text-caption" style={{ color: 'var(--color-text-muted)' }}>MODELED MONTHLY COST</span>
                <span className="text-mono" style={{ color: 'var(--color-cost)', fontSize: '1.25rem', fontWeight: 600 }}>$18,420<span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>/mo</span></span>
              </div>
              <div className="signin-metric">
                <span className="text-caption" style={{ color: 'var(--color-text-muted)' }}>MODELED TAIL LATENCY</span>
                <span className="text-mono" style={{ color: 'var(--color-performance)', fontSize: '1.25rem', fontWeight: 600 }}>640ms</span>
              </div>
              <div className="signin-metric">
                <span className="text-caption" style={{ color: 'var(--color-text-muted)' }}>RECOMMENDED CAPACITY</span>
                <span className="text-mono" style={{ color: 'var(--color-capacity)', fontSize: '1.25rem', fontWeight: 600 }}>74%</span>
              </div>
              <div className="signin-metric">
                <span className="text-caption" style={{ color: 'var(--color-text-muted)' }}>QUALITY BENCHMARK</span>
                <span className="text-mono" style={{ color: 'var(--color-success)', fontSize: '1.25rem', fontWeight: 600 }}>93%</span>
              </div>
            </div>

            <div className="signin-preview-footer">
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                Save this architecture to your private team workspace. Run multi-region scenarios, invite architects, and track cost drifts against live cloud rates.
              </p>
            </div>
          </motion.div>

          {/* Right / Main Form */}
          <motion.div 
            className="signin-form-box"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="signin-tabs">
              <button 
                className={`signin-tab ${mode === 'signin' ? 'active' : ''}`}
                onClick={() => setMode('signin')}
                type="button"
              >
                Sign in
              </button>
              <button 
                className={`signin-tab ${mode === 'signup' ? 'active' : ''}`}
                onClick={() => setMode('signup')}
                type="button"
              >
                Create workspace
              </button>
            </div>

            <form onSubmit={handleSubmit} className="signin-form">
              {mode === 'signup' && (
                <div className="form-group">
                  <label htmlFor="orgName" className="form-label">Organization or Team Name</label>
                  <input
                    id="orgName"
                    type="text"
                    required
                    placeholder="Acme AI Systems"
                    className="form-input"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                  />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="email" className="form-label">Work Email</label>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="architect@company.com"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-1)' }}>
                  <label htmlFor="password" className="form-label" style={{ marginBottom: 0 }}>Password</label>
                  {mode === 'signin' && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                      Forgot password?
                    </span>
                  )}
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  placeholder="••••••••••••"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px 20px', marginTop: 'var(--space-2)' }}
              >
                {isLoading ? (
                  <span className="text-mono">AUTHENTICATING...</span>
                ) : mode === 'signin' ? (
                  'Sign in to ComputeCanvas'
                ) : (
                  'Create your workspace'
                )}
              </button>

              <div className="signin-divider">
                <span>OR</span>
              </div>

              <button
                type="button"
                onClick={handleDemoAccess}
                disabled={isLoading}
                className="btn btn-secondary"
                style={{ width: '100%', padding: '12px 20px' }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginRight: '8px' }}>
                  <path d="M8 2a6 6 0 100 12A6 6 0 008 2zM9 5H7v4h4V7H9V5z" fill="currentColor"/>
                </svg>
                Enter Demo Workspace directly
              </button>
            </form>

            <div className="signin-disclaimer">
              <span>Deterministic calculations &bull; SOC2 compliant architecture storage &bull; No credit card required</span>
            </div>
          </motion.div>
        </div>
      </main>

      <style>{`
        .signin-page {
          min-height: 100vh;
          padding-top: calc(var(--nav-height) + 40px);
          padding-bottom: var(--space-16);
          display: flex;
          align-items: center;
          justify-content: center;
          background: #09090B;
        }
        .signin-container {
          max-width: 980px;
          width: 100%;
          margin: 0 auto;
          padding: 0 var(--grid-gutter);
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-8);
          align-items: center;
        }
        .signin-preview-card {
          background: var(--color-bg-elevated);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          padding: var(--space-8);
          position: relative;
        }
        .signin-badge {
          margin-bottom: var(--space-4);
        }
        .signin-metrics-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-4);
          background: var(--color-surface);
          border: 1px solid var(--color-border-subtle);
          border-radius: var(--radius-sm);
          padding: var(--space-4);
          margin-bottom: var(--space-6);
        }
        .signin-metric {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
        }
        .signin-preview-footer {
          border-top: 1px solid var(--color-border-subtle);
          padding-top: var(--space-4);
        }
        .signin-form-box {
          background: var(--color-bg-elevated);
          border: 1px solid var(--color-border-strong);
          border-radius: var(--radius-sm);
          padding: var(--space-8);
        }
        .signin-tabs {
          display: flex;
          border-bottom: 1px solid var(--color-border);
          margin-bottom: var(--space-6);
        }
        .signin-tab {
          flex: 1;
          padding: var(--space-3) 0;
          background: none;
          border: none;
          color: var(--color-text-secondary);
          font-size: 0.9375rem;
          font-weight: 500;
          cursor: pointer;
          position: relative;
          transition: color var(--duration-fast);
        }
        .signin-tab.active {
          color: var(--color-text);
        }
        .signin-tab.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--color-text);
        }
        .signin-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
        }
        .form-label {
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--color-text-secondary);
        }
        .form-input {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 10px 14px;
          color: var(--color-text);
          font-size: 0.875rem;
          outline: none;
          transition: border-color var(--duration-fast);
        }
        .form-input:focus {
          border-color: var(--color-text);
        }
        .signin-divider {
          display: flex;
          align-items: center;
          text-align: center;
          margin: var(--space-2) 0;
          color: var(--color-text-muted);
          font-size: 0.75rem;
          font-family: var(--font-mono);
        }
        .signin-divider::before,
        .signin-divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid var(--color-border-subtle);
        }
        .signin-divider span {
          padding: 0 var(--space-3);
        }
        .signin-disclaimer {
          margin-top: var(--space-6);
          text-align: center;
          font-size: 0.6875rem;
          color: var(--color-text-muted);
          line-height: 1.4;
        }
        @media (max-width: 820px) {
          .signin-container {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
