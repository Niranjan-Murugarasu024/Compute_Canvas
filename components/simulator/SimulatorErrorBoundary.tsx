'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class SimulatorErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('SimulatorErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReset = () => {
    try {
      if (typeof window !== 'undefined') {
        Object.keys(localStorage).forEach(k => {
          if (k.startsWith('computecanvas')) {
            localStorage.removeItem(k);
          }
        });
      }
    } catch {
      // Ignore localStorage errors
    }
    if (typeof window !== 'undefined') {
      window.location.href = '/simulator';
    } else {
      this.setState({ hasError: false, error: null });
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="simulator-error-fallback">
          <div className="simulator-error-card">
            <div className="error-icon-pill">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                  stroke="#f59e0b"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <h2 className="error-title">Unable to Load Architecture Simulator</h2>
            <p className="error-description">
              A temporary runtime issue occurred while evaluating this architecture graph. You can retry with current parameters or reset to the default architecture.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="error-debug-box text-mono">
                {this.state.error.message}
              </div>
            )}

            <div className="error-actions">
              <button onClick={this.handleRetry} className="btn btn-primary">
                Retry Simulation
              </button>
              <button onClick={this.handleReset} className="btn btn-secondary">
                Start with Clean Architecture
              </button>
            </div>
          </div>

          <style>{`
            .simulator-error-fallback {
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              background: var(--color-bg, #09090b);
              padding: var(--space-4, 16px);
              color: var(--color-text, #f4f4f5);
            }
            .simulator-error-card {
              max-width: 520px;
              width: 100%;
              background: var(--color-bg-elevated, #18181b);
              border: 1px solid var(--color-border-strong, #27272a);
              border-radius: var(--radius-lg, 12px);
              padding: var(--space-8, 32px);
              text-align: center;
              box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
            }
            .error-icon-pill {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 48px;
              height: 48px;
              border-radius: 50%;
              background: rgba(245, 158, 11, 0.12);
              border: 1px solid rgba(245, 158, 11, 0.3);
              margin-bottom: var(--space-4, 16px);
            }
            .error-title {
              font-size: 1.25rem;
              font-weight: 700;
              margin: 0 0 var(--space-2, 8px) 0;
            }
            .error-description {
              font-size: 0.875rem;
              color: var(--color-text-secondary, #a1a1aa);
              line-height: 1.5;
              margin: 0 0 var(--space-6, 24px) 0;
            }
            .error-debug-box {
              background: #000;
              border: 1px solid #27272a;
              border-radius: 6px;
              padding: 8px 12px;
              font-size: 0.75rem;
              color: #ef4444;
              text-align: left;
              margin-bottom: var(--space-6, 24px);
              word-break: break-all;
            }
            .error-actions {
              display: flex;
              gap: var(--space-3, 12px);
              justify-content: center;
              flex-wrap: wrap;
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}
