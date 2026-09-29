'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useArchitectureStore } from '@/lib/state/architectureStore';
import {
  type ArchNode,
  type ArchEdge,
  type SimulationResult,
  formatCurrency,
  formatLatency,
} from '@/lib/simulation/engine';

interface DragState {
  nodeId: string;
  startX: number;
  startY: number;
  initialNodeX: number;
  initialNodeY: number;
}

interface WireDraft {
  sourceId: string;
  sourceX: number;
  sourceY: number;
  currentX: number;
  currentY: number;
}

const NODE_WIDTH = 204;
const NODE_HEIGHT = 82;

export default function SpatialCanvas({ simulation }: { simulation: SimulationResult }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    architecture,
    selectedNodeId,
    selectedEdgeIndex,
    pan,
    zoom,
    history,
    setSelectedNode,
    setSelectedEdge,
    setNodePosition,
    addNode,
    addEdge,
    removeEdge,
    removeNode,
    setPan,
    setZoom,
    undo,
    redo,
    autoArrange,
    fitToView,
    resetView,
  } = useArchitectureStore();

  const [dragState, setDragState] = useState<DragState | null>(null);
  const [wireDraft, setWireDraft] = useState<WireDraft | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [spacePressed, setSpacePressed] = useState(false);
  const panStartRef = useRef<{ clientX: number; clientY: number; panX: number; panY: number } | null>(null);

  // Convert screen coordinates to canvas space
  const screenToCanvas = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const x = (clientX - rect.left - pan.x) / zoom;
    const y = (clientY - rect.top - pan.y) / zoom;
    return { x, y };
  }, [pan, zoom]);

  // Handle Drag & Drop from palette onto canvas
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('application/computecanvas-type') as ArchNode['type'];
    const label = e.dataTransfer.getData('application/computecanvas-label');
    if (!type) return;

    const pt = screenToCanvas(e.clientX, e.clientY);
    const dropX = Math.round(pt.x - NODE_WIDTH / 2);
    const dropY = Math.round(pt.y - NODE_HEIGHT / 2);

    addNode(type, label || '', dropX, dropY);
  };

  // Spacebar and keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setSpacePressed(true);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeId) {
          e.preventDefault();
          removeNode(selectedNodeId);
        } else if (selectedEdgeIndex !== null && architecture.edges[selectedEdgeIndex]) {
          e.preventDefault();
          const edge = architecture.edges[selectedEdgeIndex];
          removeEdge(edge.source, edge.target);
        }
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        fitToView();
      } else if (e.key === '0') {
        e.preventDefault();
        resetView();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        setZoom(z => Math.min(2.5, z + 0.15));
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        setZoom(z => Math.max(0.4, z - 0.15));
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedNodeId, selectedEdgeIndex, architecture.edges, removeNode, removeEdge, fitToView, resetView, setZoom, undo, redo]);

  // Mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;

    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setZoom(currentZoom => {
      const newZoom = Math.max(0.4, Math.min(2.5, currentZoom * zoomFactor));
      setPan(currentPan => ({
        x: mouseX - (mouseX - currentPan.x) * (newZoom / currentZoom),
        y: mouseY - (mouseY - currentPan.y) * (newZoom / currentZoom),
      }));
      return newZoom;
    });
  }, [setZoom, setPan]);

  // Node Drag Handlers
  const handleNodePointerDown = (e: React.PointerEvent, node: ArchNode) => {
    if (spacePressed || e.button !== 0) return;
    e.stopPropagation();

    setSelectedNode(node.id);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);

    setDragState({
      nodeId: node.id,
      startX: e.clientX,
      startY: e.clientY,
      initialNodeX: node.x ?? 100,
      initialNodeY: node.y ?? 100,
    });
  };

  // Port Wire Creation Drag (from bottom output port)
  const handlePortPointerDown = (e: React.PointerEvent, node: ArchNode) => {
    e.stopPropagation();
    const sourceX = (node.x ?? 100) + NODE_WIDTH / 2;
    const sourceY = (node.y ?? 100) + NODE_HEIGHT;
    const canvasPt = screenToCanvas(e.clientX, e.clientY);

    setWireDraft({
      sourceId: node.id,
      sourceX,
      sourceY,
      currentX: canvasPt.x,
      currentY: canvasPt.y,
    });
  };

  // Canvas Pan Handlers
  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    if (e.button === 1 || spacePressed || e.target === svgRef.current || (e.target as HTMLElement).tagName === 'svg') {
      e.preventDefault();
      setIsPanning(true);
      panStartRef.current = {
        clientX: e.clientX,
        clientY: e.clientY,
        panX: pan.x,
        panY: pan.y,
      };
      setSelectedNode(null);
      setSelectedEdge(null);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isPanning && panStartRef.current) {
      const dx = e.clientX - panStartRef.current.clientX;
      const dy = e.clientY - panStartRef.current.clientY;
      setPan({
        x: panStartRef.current.panX + dx,
        y: panStartRef.current.panY + dy,
      });
      return;
    }

    if (dragState) {
      const dx = (e.clientX - dragState.startX) / zoom;
      const dy = (e.clientY - dragState.startY) / zoom;
      const newX = Math.round(dragState.initialNodeX + dx);
      const newY = Math.round(dragState.initialNodeY + dy);
      setNodePosition(dragState.nodeId, newX, newY, false);
      return;
    }

    if (wireDraft) {
      const canvasPt = screenToCanvas(e.clientX, e.clientY);
      setWireDraft(prev => prev ? { ...prev, currentX: canvasPt.x, currentY: canvasPt.y } : null);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isPanning) {
      setIsPanning(false);
      panStartRef.current = null;
    }

    if (dragState) {
      const dx = (e.clientX - dragState.startX) / zoom;
      const dy = (e.clientY - dragState.startY) / zoom;
      const finalX = Math.round(dragState.initialNodeX + dx);
      const finalY = Math.round(dragState.initialNodeY + dy);
      setNodePosition(dragState.nodeId, finalX, finalY, true);
      setDragState(null);
    }

    if (wireDraft) {
      const canvasPt = screenToCanvas(e.clientX, e.clientY);
      const targetNode = architecture.nodes.find(n => {
        const nx = n.x ?? 100;
        const ny = n.y ?? 100;
        return (
          n.id !== wireDraft.sourceId &&
          canvasPt.x >= nx - 20 &&
          canvasPt.x <= nx + NODE_WIDTH + 20 &&
          canvasPt.y >= ny - 20 &&
          canvasPt.y <= ny + NODE_HEIGHT + 20
        );
      });

      if (targetNode) {
        addEdge(wireDraft.sourceId, targetNode.id);
      }
      setWireDraft(null);
    }
  };

  const nodeMap = useMemo(() => {
    const map = new Map<string, ArchNode>();
    architecture.nodes.forEach(n => map.set(n.id, n));
    return map;
  }, [architecture.nodes]);

  // Monochrome styling by component type
  const getTypeStyling = (type: ArchNode['type']) => {
    switch (type) {
      case 'api':
        return { color: '#E4E4E7', tag: 'INGRESS', icon: '◇', label: 'API INGRESS' };
      case 'cache':
        return { color: '#D4D4D8', tag: 'CACHE', icon: '▤', label: 'SEMANTIC CACHE' };
      case 'router':
        return { color: '#D4D4D8', tag: 'ROUTER', icon: '⬡', label: 'COMPLEXITY ROUTER' };
      case 'vectordb':
        return { color: '#D4D4D8', tag: 'RETRIEVAL', icon: '▣', label: 'VECTOR DATABASE' };
      case 'fast-model':
        return { color: '#F4F4F5', tag: 'FAST LLM', icon: '⚡', label: 'FAST REASONING' };
      case 'frontier-model':
      case 'model':
        return { color: '#FFFFFF', tag: 'FRONTIER', icon: '◈', label: 'FRONTIER MODEL' };
      default:
        return { color: '#A1A1AA', tag: 'BLOCK', icon: '◇', label: 'COMPONENT' };
    }
  };

  return (
    <div
      ref={containerRef}
      className={`spatial-canvas-container ${isPanning || spacePressed ? 'cursor-grab' : ''} ${dragState ? 'cursor-grabbing' : ''}`}
      onPointerDown={handleCanvasPointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onWheel={handleWheel}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{ touchAction: 'none' }}
    >
      {/* Floating Canvas Toolbar */}
      <div className="canvas-floating-toolbar" role="toolbar" aria-label="Canvas controls">
        <button
          className="canvas-tool-btn"
          title="Zoom In (+)"
          onClick={() => setZoom(z => Math.min(2.5, z + 0.15))}
          aria-label="Zoom in"
        >
          +
        </button>
        <span className="canvas-zoom-label text-mono">
          {Math.round(zoom * 100)}%
        </span>
        <button
          className="canvas-tool-btn"
          title="Zoom Out (-)"
          onClick={() => setZoom(z => Math.max(0.4, z - 0.15))}
          aria-label="Zoom out"
        >
          −
        </button>
        <div className="canvas-tool-divider" />
        <button
          className="canvas-tool-btn text-mono"
          style={{ fontSize: '0.75rem' }}
          title="Reset Zoom (0)"
          onClick={resetView}
        >
          1:1
        </button>
        <button
          className="canvas-tool-btn text-mono"
          style={{ fontSize: '0.75rem' }}
          title="Fit Architecture (F)"
          onClick={fitToView}
        >
          Fit
        </button>
        <button
          className="canvas-tool-btn text-mono"
          style={{ fontSize: '0.75rem', color: 'var(--color-accent)' }}
          title="Auto Arrange Layout"
          onClick={autoArrange}
        >
          Auto
        </button>
        <div className="canvas-tool-divider" />
        <button
          className="canvas-tool-btn"
          disabled={history.past.length === 0}
          title="Undo (Ctrl+Z)"
          onClick={undo}
          aria-label="Undo"
        >
          ↺
        </button>
        <button
          className="canvas-tool-btn"
          disabled={history.future.length === 0}
          title="Redo (Ctrl+Shift+Z)"
          onClick={redo}
          aria-label="Redo"
        >
          ↻
        </button>
      </div>

      {/* SVG Canvas Stage */}
      <svg
        ref={svgRef}
        className="spatial-canvas-svg"
        width="100%"
        height="100%"
      >
        <defs>
          {/* Subtle grid pattern */}
          <pattern id="canvas-grid-pattern" width={32 * zoom} height={32 * zoom} patternUnits="userSpaceOnUse" x={pan.x % (32 * zoom)} y={pan.y % (32 * zoom)}>
            <circle cx="1" cy="1" r="1" fill="var(--color-border-subtle)" />
          </pattern>

          {/* Edge arrow marker */}
          <marker id="edge-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <polygon points="0 0, 6 3, 0 6" fill="var(--color-border-strong)" />
          </marker>
          <marker id="edge-arrow-selected" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <polygon points="0 0, 6 3, 0 6" fill="var(--color-accent)" />
          </marker>
        </defs>

        {/* Background Grid */}
        <rect width="100%" height="100%" fill="url(#canvas-grid-pattern)" />

        {/* Scaled & Translated Canvas Content */}
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* 1. Edges / Connections */}
          {architecture.edges.map((edge, idx) => {
            const from = nodeMap.get(edge.source);
            const to = nodeMap.get(edge.target);
            if (!from || !to) return null;

            const fromX = (from.x ?? 100) + NODE_WIDTH / 2;
            const fromY = (from.y ?? 100) + NODE_HEIGHT;
            const toX = (to.x ?? 100) + NODE_WIDTH / 2;
            const toY = (to.y ?? 100);

            // Smooth cubic bezier curve
            const dy = Math.max(36, Math.abs(toY - fromY) / 2);
            const pathData = `M ${fromX} ${fromY} C ${fromX} ${fromY + dy}, ${toX} ${toY - dy}, ${toX} ${toY}`;

            const isSelected = selectedEdgeIndex === idx;

            return (
              <g
                key={`edge-${edge.source}-${edge.target}-${idx}`}
                className="canvas-edge-group"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedEdge(idx);
                }}
              >
                {/* Thick invisible click track */}
                <path d={pathData} stroke="transparent" strokeWidth="18" fill="none" style={{ cursor: 'pointer' }} />

                {/* Visible connection path */}
                <path
                  d={pathData}
                  stroke={isSelected ? 'var(--color-accent)' : 'var(--color-border-strong)'}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                  fill="none"
                  markerEnd={isSelected ? 'url(#edge-arrow-selected)' : 'url(#edge-arrow)'}
                  style={{ transition: 'stroke 0.2s' }}
                />

                {/* Traffic share percentage badge */}
                {edge.trafficShare !== undefined && (
                  <g transform={`translate(${(fromX + toX) / 2}, ${(fromY + toY) / 2})`}>
                    <rect x="-20" y="-10" width="40" height="20" rx="4" fill="var(--color-bg-elevated)" stroke="var(--color-border-strong)" strokeWidth="1" />
                    <text x="0" y="4" textAnchor="middle" fill="var(--color-text)" fontSize="10" fontFamily="var(--font-mono)" fontWeight="600">
                      {Math.round(edge.trafficShare * 100)}%
                    </text>
                  </g>
                )}

                {/* Subtle animated traffic particle */}
                <circle r={2.5} fill="var(--color-accent)">
                  <animateMotion dur="2.4s" repeatCount="indefinite" path={pathData} />
                </circle>
              </g>
            );
          })}

          {/* 2. Interactive Wire Draft (while connecting nodes) */}
          {wireDraft && (
            <path
              d={`M ${wireDraft.sourceX} ${wireDraft.sourceY} C ${wireDraft.sourceX} ${wireDraft.sourceY + 50}, ${wireDraft.currentX} ${wireDraft.currentY - 50}, ${wireDraft.currentX} ${wireDraft.currentY}`}
              stroke="var(--color-accent)"
              strokeWidth="2"
              strokeDasharray="5 3"
              fill="none"
              style={{ pointerEvents: 'none' }}
            />
          )}

          {/* 3. Nodes */}
          {architecture.nodes.map(node => {
            const x = node.x ?? 100;
            const y = node.y ?? 100;
            const isSelected = selectedNodeId === node.id;
            const isDraggingThis = dragState?.nodeId === node.id;

            const metric = simulation.nodeMetrics?.get(node.id);
            const isBottleneck = metric?.isBottleneck || simulation.bottleneck?.nodeId === node.id;
            const styling = getTypeStyling(node.type);

            const costText = metric && metric.monthlyCost > 0 ? `${formatCurrency(metric.monthlyCost)}/mo` : '$0/mo';
            const latencyText = metric ? formatLatency(metric.latencyMs) : '0 ms';
            const costPctText = metric && metric.costPercentage > 0 ? `${metric.costPercentage}% spend` : null;

            return (
              <g
                key={node.id}
                transform={`translate(${x}, ${y})`}
                className={`spatial-node-group ${isSelected ? 'selected' : ''}`}
                onPointerDown={(e) => handleNodePointerDown(e, node)}
                tabIndex={0}
                role="button"
                aria-label={`${styling.label} ${node.label}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedNode(node.id);
                  } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    setNodePosition(node.id, x + (e.shiftKey ? 20 : 5), y, true);
                  } else if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    setNodePosition(node.id, x - (e.shiftKey ? 20 : 5), y, true);
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setNodePosition(node.id, x, y - (e.shiftKey ? 20 : 5), true);
                  } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setNodePosition(node.id, x, y + (e.shiftKey ? 20 : 5), true);
                  }
                }}
                style={{ cursor: isDraggingThis ? 'grabbing' : 'grab', outline: 'none' }}
              >
                {/* Node Card Background */}
                <rect
                  x="0"
                  y="0"
                  width={NODE_WIDTH}
                  height={NODE_HEIGHT}
                  rx="2"
                  fill="#141417"
                  stroke={isBottleneck ? '#FFFFFF' : isSelected ? '#FFFFFF' : '#27272A'}
                  strokeWidth={isBottleneck ? 2 : isSelected ? 1.5 : 1}
                  className="spatial-node-rect"
                />

                {/* Focus indicator for selected node */}
                {isSelected && !isBottleneck && (
                  <rect
                    x="-3"
                    y="-3"
                    width={NODE_WIDTH + 6}
                    height={NODE_HEIGHT + 6}
                    rx="3"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    opacity="0.8"
                  />
                )}

                {/* Top Header: Category Tag */}
                <text
                  x="12"
                  y="18"
                  fill="#71717A"
                  fontSize="8"
                  fontFamily="var(--font-mono)"
                  letterSpacing="0.1em"
                  fontWeight="700"
                >
                  {styling.icon} {styling.tag}
                </text>

                {/* Monochrome Inverted Bottleneck Badge */}
                {isBottleneck && (
                  <g transform={`translate(${NODE_WIDTH - 76}, 6)`}>
                    <rect x="0" y="0" width="68" height="15" rx="1" fill="#FFFFFF" />
                    <text x="34" y="11" textAnchor="middle" fill="#09090B" fontSize="7.5" fontFamily="var(--font-mono)" fontWeight="800" letterSpacing="0.04em">
                      BOTTLENECK
                    </text>
                  </g>
                )}

                {/* Component Name */}
                <text
                  x="12"
                  y="38"
                  fill="#F4F4F5"
                  fontSize="12"
                  fontFamily="var(--font-ui)"
                  fontWeight="500"
                >
                  {node.label.length > 22 ? `${node.label.slice(0, 21)}…` : node.label}
                </text>

                {/* Metrics Row: Cost / Latency / Share */}
                <text
                  x="12"
                  y="62"
                  fill="#FFFFFF"
                  fontSize="11"
                  fontFamily="var(--font-mono)"
                  fontWeight="500"
                >
                  {costText}
                </text>

                <text
                  x={NODE_WIDTH - 12}
                  y="62"
                  textAnchor="end"
                  fill="#A1A1AA"
                  fontSize="10"
                  fontFamily="var(--font-mono)"
                  fontWeight="400"
                >
                  {latencyText}{costPctText ? ` · ${costPctText}` : ''}
                </text>

                {/* Input Port (Top Center) */}
                <circle
                  cx={NODE_WIDTH / 2}
                  cy="0"
                  r="4.5"
                  className="connection-port port-input"
                  fill="#09090B"
                  stroke="#3F3F46"
                  strokeWidth="1.5"
                />

                {/* Output Port (Bottom Center) - Drag to connect */}
                <circle
                  cx={NODE_WIDTH / 2}
                  cy={NODE_HEIGHT}
                  r="5"
                  className="connection-port port-output"
                  fill="#FFFFFF"
                  stroke="#09090B"
                  strokeWidth="1.5"
                  onPointerDown={(e) => handlePortPointerDown(e, node)}
                />

                {/* Delete button when node is selected */}
                {isSelected && (
                  <g
                    transform={`translate(${NODE_WIDTH - 16}, -8)`}
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNode(node.id);
                    }}
                  >
                    <circle r="8" fill="var(--color-bg-elevated)" stroke="var(--color-border-strong)" strokeWidth="1" />
                    <text x="0" y="3" textAnchor="middle" fill="var(--color-text-muted)" fontSize="9" fontWeight="700">
                      ✕
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      <style jsx>{`
        .spatial-canvas-container {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 520px;
          background: var(--color-bg);
          overflow: hidden;
          user-select: none;
        }
        .spatial-canvas-svg {
          display: block;
        }
        .canvas-floating-toolbar {
          position: absolute;
          top: var(--space-4);
          left: var(--space-4);
          z-index: 20;
          display: flex;
          align-items: center;
          gap: 4px;
          background: var(--color-bg-elevated);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 3px 6px;
          box-shadow: var(--shadow-md);
        }
        .canvas-tool-btn {
          background: none;
          border: none;
          color: var(--color-text-secondary);
          width: 28px;
          height: 28px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 1rem;
          transition: all var(--duration-fast);
        }
        .canvas-tool-btn:hover:not(:disabled) {
          background: var(--color-surface);
          color: var(--color-text);
        }
        .canvas-tool-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
        .canvas-zoom-label {
          font-size: 0.75rem;
          color: var(--color-text-muted);
          padding: 0 4px;
        }
        .canvas-tool-divider {
          width: 1px;
          height: 18px;
          background: var(--color-border);
          margin: 0 2px;
        }
        .spatial-node-rect {
          transition: stroke 0.15s, fill 0.15s;
        }
        .connection-port {
          cursor: crosshair;
          transition: r 0.15s, stroke 0.15s;
        }
        .connection-port:hover {
          r: 7.5;
          stroke: var(--color-text);
        }
        .cursor-grab {
          cursor: grab !important;
        }
        .cursor-grabbing {
          cursor: grabbing !important;
        }
      `}</style>
    </div>
  );
}
