'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useArchitectureStore } from '@/lib/state/architectureStore';
import { generateArchitectureProposal, type AIProposal } from '@/lib/ai/assistantEngine';
import { formatCurrency, formatLatency } from '@/lib/simulation/engine';

export default function AIAssistantPanel({ onClose }: { onClose?: () => void }) {
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [proposal, setProposal] = useState<AIProposal | null>(null);

  const { architecture, workload, applyAIProposal } = useArchitectureStore();

  const handleGenerate = (customPrompt?: string) => {
    const text = customPrompt || prompt;
    if (!text.trim()) return;

    setIsProcessing(true);
    setTimeout(() => {
      const result = generateArchitectureProposal(text, workload, architecture);
      setProposal(result);
      setIsProcessing(false);
    }, 450);
  };

  const handleApply = () => {
    if (!proposal) return;
    applyAIProposal(proposal.architecture, proposal.workload);
    onClose?.();
  };

  const samplePrompts = [
    'Customer support handling 2M conversations/mo, under 800ms P95, budget $25K',
    'Reduce cost by 30% without increasing latency',
    'RAG pipeline with semantic cache for 1M technical queries',
    'AI agent with tool use and memory under $10K budget',
  ];

  return (
    <div className="ai-assistant">
      <div className="ai-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="ai-sparkle">✦</span>
          <span className="text-label" style={{ color: 'var(--color-accent)' }}>AI ARCHITECTURE COPILOT</span>
        </div>
        {onClose && (
          <button className="btn btn-ghost" style={{ padding: '2px 6px', fontSize: '0.75rem' }} onClick={onClose}>
            ✕
          </button>
        )}
      </div>

      <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>
        State your requirements in plain English. The AI parses constraints and proposes a mathematically verified architecture.
      </p>

      {/* Prompt Form */}
      <div className="ai-input-box">
        <textarea
          rows={3}
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="e.g. I need customer support AI for 2M conversations/month, under 800ms P95, with a $25K budget..."
          className="ai-textarea"
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleGenerate();
            }
          }}
        />
        <div className="ai-input-actions">
          <span className="text-caption text-mono" style={{ color: 'var(--color-text-muted)' }}>
            Deterministic simulation &bull; Zero hallucinations
          </span>
          <button
            className="btn btn-primary"
            style={{ fontSize: '0.75rem', padding: '6px 14px' }}
            disabled={isProcessing || !prompt.trim()}
            onClick={() => handleGenerate()}
          >
            {isProcessing ? 'Simulating...' : 'Synthesize Architecture →'}
          </button>
        </div>
      </div>

      {/* Quick Prompts */}
      <div className="ai-quick-prompts">
        <span className="text-caption" style={{ color: 'var(--color-text-muted)', display: 'block', marginBottom: '6px' }}>
          QUICK SCENARIOS:
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              className="quick-prompt-btn"
              onClick={() => {
                setPrompt(p);
                handleGenerate(p);
              }}
            >
              &ldquo;{p}&rdquo;
            </button>
          ))}
        </div>
      </div>

      {/* Generated Proposal */}
      <AnimatePresence>
        {proposal && (
          <motion.div
            className="proposal-card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <div className="proposal-header">
              <span className="badge badge--success">PROPOSAL READY</span>
              <span className="text-caption text-mono" style={{ color: 'var(--color-text-muted)' }}>
                {proposal.architecture.nodes.length} COMPONENTS
              </span>
            </div>

            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginTop: 'var(--space-2)', color: 'var(--color-text)' }}>
              {proposal.title}
            </h4>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
              {proposal.summary}
            </p>

            {/* Constraints Verification */}
            <div className="constraints-badges">
              <span className={`constraint-pill ${proposal.constraintsMet.budgetMet ? 'pass' : 'fail'}`}>
                {proposal.constraintsMet.budgetMet ? '✓ Within Budget' : '⚠ Over Target Budget'}
              </span>
              <span className={`constraint-pill ${proposal.constraintsMet.latencyMet ? 'pass' : 'fail'}`}>
                {proposal.constraintsMet.latencyMet ? '✓ Latency Satisfied' : '⚠ High Latency'}
              </span>
              <span className={`constraint-pill ${proposal.constraintsMet.capacityMet ? 'pass' : 'fail'}`}>
                {proposal.constraintsMet.capacityMet ? '✓ Healthy Capacity' : '⚠ Capacity Saturated'}
              </span>
            </div>

            {/* Calculated Metrics */}
            <div className="proposal-metrics">
              <div className="prop-metric">
                <span className="text-caption">EST. COST</span>
                <span className="text-mono" style={{ color: 'var(--color-cost)', fontWeight: 600 }}>
                  {formatCurrency(proposal.simulation.monthlyCost)}/mo
                </span>
              </div>
              <div className="prop-metric">
                <span className="text-caption">P95 LATENCY</span>
                <span className="text-mono" style={{ color: 'var(--color-performance)', fontWeight: 600 }}>
                  {formatLatency(proposal.simulation.p95Latency)}
                </span>
              </div>
              <div className="prop-metric">
                <span className="text-caption">CAPACITY</span>
                <span className="text-mono" style={{ color: 'var(--color-capacity)', fontWeight: 600 }}>
                  {proposal.simulation.capacityUtilization.toFixed(0)}%
                </span>
              </div>
              <div className="prop-metric">
                <span className="text-caption">QUALITY</span>
                <span className="text-mono" style={{ color: 'var(--color-success)', fontWeight: 600 }}>
                  {proposal.simulation.qualityEstimate}%
                </span>
              </div>
            </div>

            {/* Rationale */}
            <div className="proposal-section">
              <span className="text-label" style={{ fontSize: '0.6875rem' }}>WHY THIS ARCHITECTURE?</span>
              <ul className="rationale-list">
                {proposal.rationale.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>

            {/* Apply Action */}
            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '10px 16px', marginTop: 'var(--space-3)' }}
              onClick={handleApply}
            >
              Apply Architecture to Canvas &rarr;
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .ai-assistant {
          padding: var(--space-4);
          background: var(--color-bg);
          border-radius: var(--radius-lg);
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }
        .ai-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: var(--space-2);
          border-bottom: 1px solid var(--color-border-subtle);
        }
        .ai-sparkle {
          color: var(--color-accent);
          font-size: 1rem;
        }
        .ai-input-box {
          background: var(--color-bg-elevated);
          border: 1px solid var(--color-border-strong);
          border-radius: var(--radius-md);
          padding: var(--space-3);
        }
        .ai-textarea {
          width: 100%;
          background: none;
          border: none;
          outline: none;
          color: var(--color-text);
          font-family: var(--font-sans);
          font-size: 0.8125rem;
          resize: none;
          line-height: 1.5;
        }
        .ai-input-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: var(--space-2);
          padding-top: var(--space-2);
          border-top: 1px solid var(--color-border-subtle);
        }
        .ai-quick-prompts {
          margin: var(--space-2) 0;
        }
        .quick-prompt-btn {
          background: var(--color-bg-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          padding: 6px 10px;
          color: var(--color-text-secondary);
          font-size: 0.75rem;
          text-align: left;
          cursor: pointer;
          transition: all var(--duration-fast);
        }
        .quick-prompt-btn:hover {
          border-color: var(--color-accent);
          color: var(--color-text);
        }
        .proposal-card {
          background: var(--color-bg-elevated);
          border: 1px solid var(--color-border-strong);
          border-radius: var(--radius-md);
          padding: var(--space-4);
          margin-top: var(--space-2);
        }
        .proposal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .constraints-badges {
          display: flex;
          gap: var(--space-2);
          margin: var(--space-3) 0;
          flex-wrap: wrap;
        }
        .constraint-pill {
          font-size: 0.6875rem;
          font-family: var(--font-mono);
          padding: 2px 8px;
          border-radius: var(--radius-sm);
        }
        .constraint-pill.pass {
          background: var(--color-success-dim);
          color: var(--color-success);
        }
        .constraint-pill.fail {
          background: var(--color-warning-dim);
          color: var(--color-warning);
        }
        .proposal-metrics {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--space-2);
          background: var(--color-surface);
          border-radius: var(--radius-sm);
          padding: var(--space-2) var(--space-3);
          margin: var(--space-3) 0;
        }
        .prop-metric {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .proposal-section {
          margin-top: var(--space-3);
        }
        .rationale-list {
          margin-top: 4px;
          padding-left: var(--space-4);
          font-size: 0.75rem;
          color: var(--color-text-secondary);
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
}
