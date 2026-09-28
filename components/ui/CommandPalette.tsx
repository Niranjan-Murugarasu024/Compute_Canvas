'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useArchitectureStore } from '@/lib/state/architectureStore';
import { TEMPLATES } from '@/lib/simulation/engine';

interface CommandItem {
  id: string;
  category: 'Components' | 'Canvas & Layout' | 'Visual Lenses' | 'Simulate & Optimize' | 'Collaboration & Review' | 'File & Share';
  label: string;
  detail?: string;
  shortcut?: string;
  action: () => void;
}

export default function CommandPalette({
  isOpen,
  onClose,
  onOpenAI,
  onOpenOptimizer,
  onOpenWhatIf,
  onOpenReview,
  onOpenVersions,
  onOpenComments,
}: {
  isOpen: boolean;
  onClose: () => void;
  onOpenAI?: () => void;
  onOpenOptimizer?: () => void;
  onOpenWhatIf?: () => void;
  onOpenReview?: () => void;
  onOpenVersions?: () => void;
  onOpenComments?: () => void;
}) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    addNode,
    autoArrange,
    fitToView,
    resetView,
    undo,
    redo,
    setLens,
    saveCurrentArchitecture,
    loadArchitecture,
    history,
  } = useArchitectureStore();

  const commands: CommandItem[] = useMemo(() => [
    // Visual Lenses
    { id: 'lens-arch', category: 'Visual Lenses', label: 'Lens: Component Architecture', detail: 'Crisp node-to-node topology wiring', action: () => { setLens('architecture'); onClose(); } },
    { id: 'lens-topo', category: 'Visual Lenses', label: 'Lens: Multi-Region Topology Map', detail: 'World map, cross-region latency arcs & failover', action: () => { setLens('topology'); onClose(); } },
    { id: 'lens-econ', category: 'Visual Lenses', label: 'Lens: Economics Heatmap', detail: 'Cost allocation & node spend intensity', action: () => { setLens('economics'); onClose(); } },
    { id: 'lens-perf', category: 'Visual Lenses', label: 'Lens: Performance & Bottlenecks', detail: 'Latency waterfall & critical path highlights', action: () => { setLens('performance'); onClose(); } },
    { id: 'lens-rel', category: 'Visual Lenses', label: 'Lens: Reliability & Outages', detail: 'Failure domains & chaos outage toggles', action: () => { setLens('reliability'); onClose(); } },

    // Simulate & Optimize
    { id: 'opt-frontier', category: 'Simulate & Optimize', label: 'Open Pareto Tradeoff Optimizer', detail: 'Deterministic candidate frontier (Cost vs Latency vs Quality)', action: () => { onClose(); onOpenOptimizer?.(); } },
    { id: 'what-if-sim', category: 'Simulate & Optimize', label: 'Open What-If Simulation Matrix', detail: 'Traffic surges, cache drops, 12-month compounding growth', action: () => { onClose(); onOpenWhatIf?.(); } },
    { id: 'ai-prompt', category: 'Simulate & Optimize', label: 'Open AI Architecture Copilot', detail: 'Synthesize architecture from natural language requirements', shortcut: 'AI', action: () => { onClose(); onOpenAI?.(); } },

    // Collaboration & Review
    { id: 'collab-review', category: 'Collaboration & Review', label: 'Enter Architecture Review Deck', detail: 'Cinema-grade 6-step walkthrough for leadership reviews', shortcut: 'P', action: () => { onClose(); onOpenReview?.(); } },
    { id: 'collab-versions', category: 'Collaboration & Review', label: 'View Version History & Visual Diff', detail: 'Snapshot timeline and delta comparisons', action: () => { onClose(); onOpenVersions?.(); } },
    { id: 'collab-comments', category: 'Collaboration & Review', label: 'Open Spatial Comments & Annotations', detail: 'Threaded team discussion anchored to nodes', action: () => { onClose(); onOpenComments?.(); } },

    // Components
    { id: 'add-llm', category: 'Components', label: 'Add LLM (GPT-4o-mini)', detail: 'Fast modern reasoning model', action: () => { addNode('model', 'GPT-4o-mini'); onClose(); } },
    { id: 'add-claude', category: 'Components', label: 'Add Claude 3.5 Sonnet', detail: 'High quality reasoning', action: () => { const id = addNode('model', 'Claude 3.5 Sonnet'); useArchitectureStore.getState().updateNodeModel(id, 'claude-3.5-sonnet'); onClose(); } },
    { id: 'add-router', category: 'Components', label: 'Add Complexity Router', detail: 'Route between fast & large models', action: () => { addNode('router', 'Router'); onClose(); } },
    { id: 'add-cache', category: 'Components', label: 'Add Semantic Cache', detail: 'Redis / Prompt caching tier', action: () => { addNode('cache', 'Cache'); onClose(); } },
    { id: 'add-vectordb', category: 'Components', label: 'Add Vector Database', detail: 'Pinecone / Qdrant cluster', action: () => { addNode('vectordb', 'Vector DB'); onClose(); } },
    { id: 'add-api', category: 'Components', label: 'Add API Gateway', detail: 'Request validation & rate limiting', action: () => { addNode('api', 'API Gateway'); onClose(); } },
    { id: 'add-compute', category: 'Components', label: 'Add Worker Compute', detail: 'Background task processor', action: () => { addNode('compute', 'Compute'); onClose(); } },

    // Canvas
    { id: 'canvas-auto', category: 'Canvas & Layout', label: 'Auto Arrange Architecture', detail: 'Organize into layered topology', shortcut: 'Ctrl+L', action: () => { autoArrange(); onClose(); } },
    { id: 'canvas-fit', category: 'Canvas & Layout', label: 'Fit to View', detail: 'Center all nodes on canvas', shortcut: 'F', action: () => { fitToView(); onClose(); } },
    { id: 'canvas-reset', category: 'Canvas & Layout', label: 'Reset Zoom (100%)', shortcut: '0', action: () => { resetView(); onClose(); } },
    { id: 'canvas-undo', category: 'Canvas & Layout', label: 'Undo', shortcut: 'Ctrl+Z', action: () => { undo(); onClose(); } },
    { id: 'canvas-redo', category: 'Canvas & Layout', label: 'Redo', shortcut: 'Ctrl+Shift+Z', action: () => { redo(); onClose(); } },

    // Templates
    { id: 'load-rag', category: 'Simulate & Optimize', label: 'Load Template: RAG Pipeline', detail: 'Retrieval augmented generation', action: () => { const t = TEMPLATES.find(x => x.id === 'rag'); if (t) loadArchitecture(t.architecture, t.defaultWorkload); onClose(); } },
    { id: 'load-support', category: 'Simulate & Optimize', label: 'Load Template: Customer Support AI', detail: 'High-volume support with router & cache', action: () => { const t = TEMPLATES.find(x => x.id === 'customer-support'); if (t) loadArchitecture(t.architecture, t.defaultWorkload); onClose(); } },
    { id: 'load-agent', category: 'Simulate & Optimize', label: 'Load Template: AI Agent', detail: 'Autonomous multi-step tool reasoning', action: () => { const t = TEMPLATES.find(x => x.id === 'ai-agent'); if (t) loadArchitecture(t.architecture, t.defaultWorkload); onClose(); } },

    // File
    { id: 'file-save', category: 'File & Share', label: 'Save Architecture to Workspace', shortcut: 'Ctrl+S', action: () => { saveCurrentArchitecture(); onClose(); } },
  ], [addNode, autoArrange, fitToView, resetView, undo, redo, setLens, saveCurrentArchitecture, loadArchitecture, onOpenAI, onOpenOptimizer, onOpenWhatIf, onOpenReview, onOpenVersions, onOpenComments, onClose]);

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(c => c.label.toLowerCase().includes(q) || c.category.toLowerCase().includes(q) || c.detail?.toLowerCase().includes(q));
  }, [commands, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggle
      }
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => Math.min(filtered.length - 1, i + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => Math.max(0, i - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action();
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, filtered, selectedIndex]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="cmd-backdrop" onClick={onClose}>
        <motion.div
          className="cmd-modal"
          onClick={e => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="cmd-search-row">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ color: 'var(--color-text-muted)' }}>
              <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M12.5 12.5L16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              placeholder="Search components, actions, or AI optimizations..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="cmd-input"
            />
            <span className="text-caption text-mono cmd-badge">ESC</span>
          </div>

          <div className="cmd-list">
            {filtered.length === 0 ? (
              <div className="cmd-empty">No commands match &ldquo;{query}&rdquo;</div>
            ) : (
              filtered.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <div
                    key={item.id}
                    className={`cmd-item ${isSelected ? 'active' : ''}`}
                    onClick={() => {
                      item.action();
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <div className="cmd-item-left">
                      <span className="cmd-cat text-mono">{item.category}</span>
                      <span className="cmd-label">{item.label}</span>
                      {item.detail && <span className="cmd-detail">{item.detail}</span>}
                    </div>
                    {item.shortcut && <span className="cmd-shortcut text-mono">{item.shortcut}</span>}
                  </div>
                );
              })
            )}
          </div>

          <div className="cmd-footer text-mono">
            <span>&uarr;&darr; Navigate</span>
            <span>&crarr; Execute</span>
            <span>ESC Close</span>
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        .cmd-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 200;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 14vh;
        }
        .cmd-modal {
          width: 100%;
          max-width: 620px;
          background: var(--color-bg-elevated);
          border: 1px solid var(--color-border-strong);
          border-radius: var(--radius-lg);
          box-shadow: 0 20px 48px rgba(0, 0, 0, 0.7);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .cmd-search-row {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-4) var(--space-5);
          border-bottom: 1px solid var(--color-border);
        }
        .cmd-input {
          flex: 1;
          background: none;
          border: none;
          outline: none;
          color: var(--color-text);
          font-size: 0.9375rem;
          font-family: var(--font-sans);
        }
        .cmd-badge {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          padding: 2px 6px;
          font-size: 0.6875rem;
        }
        .cmd-list {
          max-height: 380px;
          overflow-y: auto;
          padding: var(--space-2);
        }
        .cmd-empty {
          padding: var(--space-8);
          text-align: center;
          color: var(--color-text-secondary);
          font-size: 0.875rem;
        }
        .cmd-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: background var(--duration-fast);
        }
        .cmd-item.active {
          background: var(--color-surface-hover, rgba(255, 255, 255, 0.08));
        }
        .cmd-item-left {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          overflow: hidden;
        }
        .cmd-cat {
          font-size: 0.625rem;
          color: var(--color-text-muted);
          width: 80px;
          flex-shrink: 0;
          text-transform: uppercase;
        }
        .cmd-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--color-text);
        }
        .cmd-detail {
          font-size: 0.75rem;
          color: var(--color-text-secondary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .cmd-shortcut {
          font-size: 0.6875rem;
          color: var(--color-text-muted);
          background: var(--color-bg);
          border: 1px solid var(--color-border-subtle);
          padding: 2px 6px;
          border-radius: var(--radius-sm);
          flex-shrink: 0;
        }
        .cmd-footer {
          display: flex;
          align-items: center;
          gap: var(--space-4);
          padding: var(--space-3) var(--space-5);
          background: var(--color-bg-surface);
          border-top: 1px solid var(--color-border-subtle);
          font-size: 0.6875rem;
          color: var(--color-text-muted);
        }
      `}</style>
    </AnimatePresence>
  );
}
