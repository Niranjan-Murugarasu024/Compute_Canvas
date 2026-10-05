'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useArchitectureStore } from '@/lib/state/architectureStore';
import {
  type ArchNode,
  type ArchEdge,
  type Architecture,
  type SimulationResult,
  MODEL_PRICING,
  TEMPLATES_MAP,
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

const NODE_WIDTH = 224;
const NODE_HEIGHT = 86;

export default function SpatialCanvas({
  simulation,
  architecture: propArchitecture,
}: {
  simulation: SimulationResult;
  architecture?: Architecture;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const store = useArchitectureStore();
  const architecture = propArchitecture || store.architecture;

  const {
    selectedNodeId,
    selectedEdgeIndex,
    pan,
    zoom,
    canvasDimensions,
    setCanvasDimensions,
    history,
    setSelectedNode,
    setSelectedEdge,
    setNodePosition,
    addNode,
    addEdge,
    removeEdge,
    removeNode,
    updateNodeModel,
    updateEdgeShare,
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
      } else if (e.key === 'Escape') {
        setSelectedNode(null);
        setSelectedEdge(null);
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
  }, [selectedNodeId, selectedEdgeIndex, architecture.edges, removeNode, removeEdge, setSelectedNode, setSelectedEdge, fitToView, resetView, setZoom, undo, redo]);

  // Track canvas viewport size for deterministic center insertion and bounds
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setCanvasDimensions({ width, height });
        }
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [setCanvasDimensions]);

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

  const selectedNode = useMemo(
    () => architecture.nodes.find(n => n.id === selectedNodeId) || null,
    [architecture.nodes, selectedNodeId]
  );

  const selectedEdge = useMemo(
    () => (selectedEdgeIndex !== null ? architecture.edges[selectedEdgeIndex] || null : null),
    [architecture.edges, selectedEdgeIndex]
  );

  const FAST_MODELS = useMemo(
    () =>
      Object.entries(MODEL_PRICING)
        .filter(([_, p]) => p.category === 'fast')
        .map(([id, p]) => ({ id, name: p.product, cost: `$${p.inputPricePer1M}/M` })),
    []
  );

  const FRONTIER_MODELS = useMemo(
    () =>
      Object.entries(MODEL_PRICING)
        .filter(([_, p]) => p.category === 'frontier')
        .map(([id, p]) => ({ id, name: p.product, cost: `$${p.inputPricePer1M}/M` })),
    []
  );

  // Boundary-aware contextual node toolbar positioning (always remains within visible canvas)
  const nodeToolbarPos = useMemo(() => {
    if (!selectedNode || !containerRef.current) return null;
    const cw = containerRef.current.clientWidth || canvasDimensions?.width || 800;
    const ch = containerRef.current.clientHeight || canvasDimensions?.height || 600;

    const nx = selectedNode.x ?? 100;
    const ny = selectedNode.y ?? 100;
    const screenX = nx * zoom + pan.x;
    const screenY = ny * zoom + pan.y;
    const screenW = NODE_WIDTH * zoom;
    const screenH = NODE_HEIGHT * zoom;

    const isModel =
      selectedNode.type === 'fast-model' ||
      selectedNode.type === 'frontier-model' ||
      selectedNode.type === 'model';
    const tbWidth = isModel ? 410 : 310;
    const tbHeight = 36;

    let left = screenX + screenW / 2 - tbWidth / 2;
    let top = screenY - tbHeight - 10;

    // Flip below if inadequate space above node
    if (top < 10) {
      top = screenY + screenH + 10;
    }

    // Clamp within visible canvas boundaries
    left = Math.max(10, Math.min(cw - tbWidth - 10, left));
    top = Math.max(10, Math.min(ch - tbHeight - 10, top));

    return { left, top, isModel };
  }, [selectedNode, zoom, pan, canvasDimensions]);

  // Boundary-aware contextual edge toolbar positioning
  const edgeToolbarPos = useMemo(() => {
    if (!selectedEdge || !containerRef.current) return null;
    const from = nodeMap.get(selectedEdge.source);
    const to = nodeMap.get(selectedEdge.target);
    if (!from || !to) return null;

    const cw = containerRef.current.clientWidth || canvasDimensions?.width || 800;
    const ch = containerRef.current.clientHeight || canvasDimensions?.height || 600;

    const midX = ((from.x ?? 100) + (to.x ?? 100) + NODE_WIDTH) / 2;
    const midY = ((from.y ?? 100) + (to.y ?? 100) + NODE_HEIGHT) / 2;
    const screenX = midX * zoom + pan.x;
    const screenY = midY * zoom + pan.y;

    const tbWidth = 340;
    const tbHeight = 36;

    let left = screenX - tbWidth / 2;
    let top = screenY - tbHeight - 10;

    if (top < 10) {
      top = screenY + 12;
    }

    left = Math.max(10, Math.min(cw - tbWidth - 10, left));
    top = Math.max(10, Math.min(ch - tbHeight - 10, top));

    return { left, top };
  }, [selectedEdge, nodeMap, zoom, pan, canvasDimensions]);

  // Path Analysis: Compute full upstream & downstream transitive closure for selected node (Section 18)
  const { upstreamNodeIds, downstreamNodeIds, activePathNodeIds, activePathEdgeIndices } = useMemo(() => {
    if (!selectedNodeId) {
      return {
        upstreamNodeIds: new Set<string>(),
        downstreamNodeIds: new Set<string>(),
        activePathNodeIds: new Set<string>(),
        activePathEdgeIndices: new Set<number>(),
      };
    }

    const upstream = new Set<string>();
    const downstream = new Set<string>();
    const activeEdges = new Set<number>();

    // Traverse upstream (backwards)
    const queueUp = [selectedNodeId];
    while (queueUp.length > 0) {
      const curr = queueUp.shift()!;
      architecture.edges.forEach((edge, idx) => {
        if (edge.target === curr) {
          activeEdges.add(idx);
          if (!upstream.has(edge.source) && edge.source !== selectedNodeId) {
            upstream.add(edge.source);
            queueUp.push(edge.source);
          }
        }
      });
    }

    // Traverse downstream (forwards)
    const queueDown = [selectedNodeId];
    while (queueDown.length > 0) {
      const curr = queueDown.shift()!;
      architecture.edges.forEach((edge, idx) => {
        if (edge.source === curr) {
          activeEdges.add(idx);
          if (!downstream.has(edge.target) && edge.target !== selectedNodeId) {
            downstream.add(edge.target);
            queueDown.push(edge.target);
          }
        }
      });
    }

    const allPathNodes = new Set<string>([selectedNodeId, ...upstream, ...downstream]);

    return {
      upstreamNodeIds: upstream,
      downstreamNodeIds: downstream,
      activePathNodeIds: allPathNodes,
      activePathEdgeIndices: activeEdges,
    };
  }, [selectedNodeId, architecture.edges]);

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
          style={{ fontSize: '0.8125rem' }}
          title="Reset Zoom (0)"
          onClick={resetView}
        >
          1:1
        </button>
        <button
          className="canvas-tool-btn text-mono"
          style={{ fontSize: '0.8125rem' }}
          title="Fit Architecture (F)"
          onClick={fitToView}
        >
          Fit
        </button>
        <button
          className="canvas-tool-btn text-mono"
          style={{ fontSize: '0.8125rem', color: 'var(--color-accent)' }}
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
          {/* Subtle engineering grid pattern */}
          <pattern id="canvas-grid-pattern" width={32 * zoom} height={32 * zoom} patternUnits="userSpaceOnUse" x={pan.x % (32 * zoom)} y={pan.y % (32 * zoom)}>
            <path d={`M ${32 * zoom} 0 L 0 0 0 ${32 * zoom}`} fill="none" stroke="#161619" strokeWidth="0.5" />
            <circle cx="1" cy="1" r="0.75" fill="#24242A" />
          </pattern>

          {/* Edge arrow markers — fixed pixel size, tip at refX so it lands exactly on node border */}
          <marker id="edge-arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto" markerUnits="userSpaceOnUse">
            <path d="M 0 0 L 10 3.5 L 0 7 Z" fill="var(--color-border-strong)" stroke="none" />
          </marker>
          <marker id="edge-arrow-selected" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto" markerUnits="userSpaceOnUse">
            <path d="M 0 0 L 10 3.5 L 0 7 Z" fill="#FFFFFF" stroke="none" />
          </marker>
          <marker id="edge-arrow-dimmed" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto" markerUnits="userSpaceOnUse">
            <path d="M 0 0 L 10 3.5 L 0 7 Z" fill="#3A3A42" stroke="none" />
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

            const fx = from.x ?? 100;
            const fy = from.y ?? 100;
            const tx = to.x ?? 100;
            const ty = to.y ?? 100;

            // Smart port selection: pick exit/entry ports based on relative position
            // to avoid ugly U-curves when nodes are side-by-side
            const dx = tx - fx;
            const dy = ty - fy;
            const isHorizontal = Math.abs(dx) > Math.abs(dy) * 0.8;

            let fromX: number, fromY: number, toX: number, toY: number;
            let cp1x: number, cp1y: number, cp2x: number, cp2y: number;

            if (isHorizontal && dx > 0) {
              // Source is to the LEFT of target → exit right-center, enter left-center
              fromX = fx + NODE_WIDTH;
              fromY = fy + NODE_HEIGHT / 2;
              toX = tx;
              toY = ty + NODE_HEIGHT / 2;
              const dist = Math.max(60, Math.abs(dx) * 0.45);
              cp1x = fromX + dist; cp1y = fromY;
              cp2x = toX - dist;   cp2y = toY;
            } else if (isHorizontal && dx < 0) {
              // Source is to the RIGHT of target → exit left-center, enter right-center
              fromX = fx;
              fromY = fy + NODE_HEIGHT / 2;
              toX = tx + NODE_WIDTH;
              toY = ty + NODE_HEIGHT / 2;
              const dist = Math.max(60, Math.abs(dx) * 0.45);
              cp1x = fromX - dist; cp1y = fromY;
              cp2x = toX + dist;   cp2y = toY;
            } else {
              // Vertical / diagonal → classic bottom-center to top-center
              fromX = fx + NODE_WIDTH / 2;
              fromY = fy + NODE_HEIGHT;
              toX = tx + NODE_WIDTH / 2;
              toY = ty;
              const offset = Math.max(40, Math.abs(dy) * 0.45);
              cp1x = fromX; cp1y = fromY + offset;
              cp2x = toX;   cp2y = toY - offset;
            }

            const pathData = `M ${fromX} ${fromY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${toX} ${toY}`;

            // Accurate cubic bezier midpoint at t=0.5
            const t = 0.5;
            const mt = 1 - t;
            const midX = mt*mt*mt*fromX + 3*mt*mt*t*cp1x + 3*mt*t*t*cp2x + t*t*t*toX;
            const midY = mt*mt*mt*fromY + 3*mt*mt*t*cp1y + 3*mt*t*t*cp2y + t*t*t*toY;

            const isDirectlySelected = selectedEdgeIndex === idx;
            const isInActiveCausalPath = selectedNodeId !== null && activePathEdgeIndices.has(idx);
            const isHighlighted = isDirectlySelected || isInActiveCausalPath;
            const isDimmed = selectedNodeId !== null && !isHighlighted;

            const edgeColor = isHighlighted ? '#FFFFFF' : isDimmed ? '#2E2E35' : 'var(--color-border-strong)';
            const markerRef = isHighlighted ? 'url(#edge-arrow-selected)' : isDimmed ? 'url(#edge-arrow-dimmed)' : 'url(#edge-arrow)';

            return (
              <g
                key={`edge-${edge.source}-${edge.target}-${idx}`}
                className="canvas-edge-group"
                style={{ opacity: 1, transition: 'opacity 0.2s' }}
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
                  stroke={edgeColor}
                  strokeWidth={isHighlighted ? 2.5 : isDimmed ? 1 : 1.5}
                  fill="none"
                  markerEnd={markerRef}
                  style={{ transition: 'stroke 0.2s, stroke-width 0.2s, opacity 0.2s', opacity: isDimmed ? 0.2 : 1 }}
                />

                {/* Traffic share percentage badge — placed at actual bezier midpoint */}
                {edge.trafficShare !== undefined && (() => {
                  let badgeText = `${Math.round(edge.trafficShare * 100)}%`;
                  if (to.type === 'fast-model') badgeText = `${Math.round(edge.trafficShare * 100)}% FAST`;
                  else if (to.type === 'frontier-model') badgeText = `${Math.round(edge.trafficShare * 100)}% FRONTIER`;
                  else if (from.type === 'cache') badgeText = `${Math.round(edge.trafficShare * 100)}% MISS`;
                  else if (to.label) badgeText = `${Math.round(edge.trafficShare * 100)}% ROUTE`;

                  const charCount = badgeText.length;
                  const badgeWidth = Math.max(52, charCount * 7.4 + 18);
                  const badgeStroke = isHighlighted ? '#FFFFFF' : 'var(--color-border-strong)';
                  const badgeFill = isHighlighted ? '#1E1E28' : '#0E0E12';
                  const textFill = isHighlighted ? '#FFFFFF' : '#A0A0B0';

                  return (
                    <g
                      transform={`translate(${midX}, ${midY})`}
                      style={{ opacity: isDimmed ? 0.2 : 1, transition: 'opacity 0.2s' }}
                    >
                      <rect
                        x={-badgeWidth / 2}
                        y="-11"
                        width={badgeWidth}
                        height="22"
                        rx="3"
                        fill={badgeFill}
                        stroke={badgeStroke}
                        strokeWidth={isHighlighted ? 1.5 : 1}
                      />
                      <text
                        x="0"
                        y="4.5"
                        textAnchor="middle"
                        fill={textFill}
                        fontSize="12.5"
                        fontFamily="var(--font-mono)"
                        fontWeight="600"
                        letterSpacing="0.04em"
                      >
                        {badgeText}
                      </text>
                    </g>
                  );
                })()}
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

            const isUpstream = upstreamNodeIds.has(node.id);
            const isDownstream = downstreamNodeIds.has(node.id);
            const isInCausalPath = isSelected || isUpstream || isDownstream;
            const isDimmed = selectedNodeId !== null && !isInCausalPath;

            const costText = metric && metric.monthlyCost > 0 ? `${formatCurrency(metric.monthlyCost)}/mo` : '$0/mo';
            const latencyText = metric ? formatLatency(metric.latencyMs) : '0 ms';
            const costPctText = metric && metric.costPercentage > 0 ? `${metric.costPercentage}% cost share` : null;

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
                style={{
                  cursor: isDraggingThis ? 'grabbing' : 'grab',
                  outline: 'none',
                  opacity: isDimmed ? 0.28 : 1,
                  transition: 'opacity 0.2s',
                }}
              >
                {/* Node Card Background */}
                <rect
                  x="0"
                  y="0"
                  width={NODE_WIDTH}
                  height={NODE_HEIGHT}
                  rx="2"
                  fill={isSelected ? '#18181B' : '#111114'}
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
                  y="20"
                  fill="#A1A1AA"
                  fontSize="11"
                  fontFamily="var(--font-mono)"
                  letterSpacing="0.08em"
                  fontWeight="700"
                >
                  {styling.icon} {styling.tag}
                </text>

                {/* Monochrome Inverted Bottleneck Badge */}
                {isBottleneck && (
                  <g transform={`translate(${NODE_WIDTH - 86}, 7)`}>
                    <rect x="0" y="0" width="76" height="18" rx="2" fill="#FFFFFF" />
                    <text x="38" y="13" textAnchor="middle" fill="#09090B" fontSize="10" fontFamily="var(--font-mono)" fontWeight="800" letterSpacing="0.04em">
                      BOTTLENECK
                    </text>
                  </g>
                )}

                {/* Component Name */}
                <text
                  x="12"
                  y="45"
                  fill="#FFFFFF"
                  fontSize="14.5"
                  fontFamily="var(--font-ui)"
                  fontWeight="600"
                >
                  {node.label.length > 22 ? `${node.label.slice(0, 21)}…` : node.label}
                </text>

                {/* Metrics Row: Cost / Latency / Share */}
                <text
                  x="12"
                  y="70"
                  fill="#FFFFFF"
                  fontSize="13"
                  fontFamily="var(--font-mono)"
                  fontWeight="600"
                >
                  {costText}
                </text>

                <text
                  x={NODE_WIDTH - 12}
                  y="70"
                  textAnchor="end"
                  fill="#D4D4D8"
                  fontSize="12"
                  fontFamily="var(--font-mono)"
                  fontWeight="500"
                >
                  {latencyText}{costPctText ? ` · ${costPctText}` : ''}
                </text>

                {/* Input Port — Top Center */}
                <circle
                  cx={NODE_WIDTH / 2}
                  cy="0"
                  r="3.5"
                  className="connection-port port-input"
                  fill="#09090B"
                  stroke="#3F3F46"
                  strokeWidth="1.5"
                />

                {/* Output Port — Bottom Center (drag to connect) */}
                <circle
                  cx={NODE_WIDTH / 2}
                  cy={NODE_HEIGHT}
                  r="4"
                  className="connection-port port-output"
                  fill="#27272A"
                  stroke="#52525B"
                  strokeWidth="1.5"
                  onPointerDown={(e) => handlePortPointerDown(e, node)}
                />

                {/* Right Port — for horizontal connections */}
                <circle
                  cx={NODE_WIDTH}
                  cy={NODE_HEIGHT / 2}
                  r="3.5"
                  fill="#09090B"
                  stroke="#3F3F46"
                  strokeWidth="1.5"
                  style={{ pointerEvents: 'none' }}
                />

                {/* Left Port — for horizontal connections */}
                <circle
                  cx="0"
                  cy={NODE_HEIGHT / 2}
                  r="3.5"
                  fill="#09090B"
                  stroke="#3F3F46"
                  strokeWidth="1.5"
                  style={{ pointerEvents: 'none' }}
                />
              </g>
            );
          })}
        </g>
      </svg>

      {/* Empty State per Rule 20 */}
      {architecture.nodes.length === 0 && (
        <div className="canvas-empty-state" role="region" aria-label="Empty canvas — load a blueprint to begin">
          <div className="empty-state-badge text-mono">NO ARCHITECTURE</div>
          <div className="empty-state-title">Start with a component or load a canonical blueprint.</div>
          <div className="empty-state-actions">
            <button
              type="button"
              className="empty-state-btn text-mono"
              onClick={() => {
                const t = TEMPLATES_MAP['direct-llm'];
                if (t) store.loadArchitecture(t.architecture, t.defaultWorkload);
              }}
              title="Load Direct LLM baseline architecture"
            >
              [ DIRECT LLM ]
            </button>
            <button
              type="button"
              className="empty-state-btn text-mono"
              onClick={() => {
                const t = TEMPLATES_MAP['rag-pipeline'];
                if (t) store.loadArchitecture(t.architecture, t.defaultWorkload);
              }}
              title="Load RAG Pipeline architecture"
            >
              [ RAG ]
            </button>
            <button
              type="button"
              className="empty-state-btn text-mono"
              onClick={() => {
                const t = TEMPLATES_MAP['router-cache'];
                if (t) store.loadArchitecture(t.architecture, t.defaultWorkload);
              }}
              title="Load Router + Cache architecture"
            >
              [ ROUTER + CACHE ]
            </button>
          </div>
        </div>
      )}

      {/* Contextual Floating Node Toolbar (Boundary-Aware & Attached to Selected Node) */}
      {selectedNode && nodeToolbarPos && (
        <div
          className="contextual-node-toolbar"
          style={{
            left: `${nodeToolbarPos.left}px`,
            top: `${nodeToolbarPos.top}px`,
          }}
          role="toolbar"
          aria-label="Selected Component Controls"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="contextual-node-header">
            <span className="contextual-type-badge text-mono">
              {getTypeStyling(selectedNode.type).tag}
            </span>
            <span className="contextual-node-title">
              {selectedNode.label}
            </span>
          </div>

          {/* Model Switcher for Fast Models */}
          {(selectedNode.type === 'fast-model' || (selectedNode.type === 'model' && selectedNode.modelId === 'gpt-4o-mini')) && (
            <select
              className="contextual-select text-mono"
              value={selectedNode.modelId || 'gpt-4o-mini'}
              onChange={(e) => updateNodeModel(selectedNode.id, e.target.value)}
              aria-label="Select Fast Reasoning Model"
            >
              {FAST_MODELS.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.cost})
                </option>
              ))}
            </select>
          )}

          {/* Model Switcher for Frontier Models */}
          {(selectedNode.type === 'frontier-model' || (selectedNode.type === 'model' && selectedNode.modelId !== 'gpt-4o-mini')) && (
            <select
              className="contextual-select text-mono"
              value={selectedNode.modelId || 'gpt-4o'}
              onChange={(e) => updateNodeModel(selectedNode.id, e.target.value)}
              aria-label="Select Frontier Reasoning Model"
            >
              {FRONTIER_MODELS.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.cost})
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => removeNode(selectedNode.id)}
            className="contextual-btn-delete"
            title="Delete component (Delete / Backspace)"
          >
            Delete Node
          </button>

          <button
            onClick={() => setSelectedNode(null)}
            className="contextual-btn-close"
            title="Dismiss toolbar (Esc)"
          >
            Close
          </button>
        </div>
      )}

      {/* Contextual Floating Edge Toolbar (Attached to Selected Wire) */}
      {selectedEdge && edgeToolbarPos && (
        <div
          className="contextual-node-toolbar"
          style={{
            left: `${edgeToolbarPos.left}px`,
            top: `${edgeToolbarPos.top}px`,
          }}
          role="toolbar"
          aria-label="Selected Wire Controls"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="contextual-node-header">
            <span className="contextual-type-badge text-mono">WIRE</span>
            <span className="contextual-node-title text-mono" style={{ fontSize: '0.6875rem' }}>
              {selectedEdge.source} &rarr; {selectedEdge.target}
            </span>
          </div>

          <div className="contextual-traffic-control">
            <span className="contextual-traffic-label text-mono">Traffic:</span>
            <input
              type="range"
              min={0.1}
              max={1.0}
              step={0.05}
              value={selectedEdge.trafficShare ?? 1.0}
              onChange={(e) => updateEdgeShare(selectedEdge.source, selectedEdge.target, parseFloat(e.target.value))}
              className="contextual-slider"
            />
            <span className="contextual-traffic-val text-mono">
              {Math.round((selectedEdge.trafficShare ?? 1.0) * 100)}%
            </span>
          </div>

          <button
            onClick={() => removeEdge(selectedEdge.source, selectedEdge.target)}
            className="contextual-btn-delete"
            title="Remove connection"
          >
            Delete Wire
          </button>

          <button
            onClick={() => setSelectedEdge(null)}
            className="contextual-btn-close"
            title="Dismiss toolbar (Esc)"
          >
            Close
          </button>
        </div>
      )}

      <style>{`
        .spatial-canvas-container {
          position: relative;
          width: 100%;
          height: 100%;
          background: #09090B;
          overflow: hidden;
          user-select: none;
        }
        .spatial-canvas-svg {
          display: block;
          width: 100%;
          height: 100%;
        }
        .canvas-floating-toolbar {
          position: absolute;
          top: 16px;
          left: 16px;
          z-index: 50;
          display: flex;
          align-items: center;
          gap: 4px;
          background: #0B0B0D;
          border: 1px solid #252529;
          border-radius: 4px;
          padding: 3px 6px;
          box-shadow: none;
        }
        .canvas-tool-btn {
          background: none;
          border: none;
          color: #A1A1AA;
          width: 30px;
          height: 30px;
          border-radius: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 0.9375rem;
          font-family: var(--font-mono);
          transition: background-color 0.15s, color 0.15s;
        }
        .canvas-tool-btn:hover:not(:disabled) {
          background: #18181B;
          color: #FFFFFF;
        }
        .canvas-tool-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        .canvas-zoom-label {
          font-size: 0.8125rem;
          color: #D4D4D8;
          padding: 0 4px;
          min-width: 42px;
          text-align: center;
          font-variant-numeric: tabular-nums;
        }
        .canvas-tool-divider {
          width: 1px;
          height: 18px;
          background: #252529;
          margin: 0 3px;
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
          stroke: #FFFFFF;
        }
        .cursor-grab {
          cursor: grab !important;
        }
        .cursor-grabbing {
          cursor: grabbing !important;
        }

        /* Contextual Floating Toolbars */
        .contextual-node-toolbar {
          position: absolute;
          z-index: 40;
          display: flex;
          align-items: center;
          gap: 8px;
          background: #0E0E12;
          border: 1px solid #3F3F46;
          border-radius: 4px;
          padding: 6px 12px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.85);
          pointer-events: auto;
          user-select: none;
          white-space: nowrap;
        }
        .contextual-node-header {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .contextual-type-badge {
          font-size: 0.6875rem;
          font-weight: 700;
          color: #09090B;
          background: #FFFFFF;
          padding: 2px 6px;
          border-radius: 2px;
          letter-spacing: 0.05em;
        }
        .contextual-node-title {
          font-family: var(--font-ui);
          font-size: 0.875rem;
          font-weight: 600;
          color: #FFFFFF;
          max-width: 160px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .contextual-select {
          background: #18181B;
          border: 1px solid #3F3F46;
          border-radius: 2px;
          color: #FFFFFF;
          font-size: 0.8125rem;
          padding: 4px 8px;
          outline: none;
          cursor: pointer;
        }
        .contextual-select:focus {
          border-color: #FFFFFF;
        }
        .contextual-traffic-control {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .contextual-traffic-label {
          font-size: 0.78125rem;
          color: #A1A1AA;
        }
        .contextual-slider {
          width: 76px;
          accent-color: #FFFFFF;
          cursor: pointer;
        }
        .contextual-traffic-val {
          font-size: 0.875rem;
          font-weight: 600;
          color: #FFFFFF;
          min-width: 36px;
          font-variant-numeric: tabular-nums;
        }
        .contextual-btn-delete {
          background: none;
          border: 1px solid #3F3F46;
          border-radius: 2px;
          color: #F43F5E;
          font-family: var(--font-mono);
          font-size: 0.75rem;
          font-weight: 600;
          padding: 4px 10px;
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
        }
        .contextual-btn-delete:hover {
          background: #F43F5E;
          color: #FFFFFF;
          border-color: #F43F5E;
        }
        .contextual-btn-close {
          background: #18181B;
          border: 1px solid #3F3F46;
          border-radius: 2px;
          color: #E4E4E7;
          font-family: var(--font-mono);
          font-size: 0.75rem;
          padding: 4px 10px;
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
        }
        .contextual-btn-close:hover {
          background: #27272A;
          color: #FFFFFF;
        }

        /* Canvas Empty State */
        .canvas-empty-state {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          pointer-events: auto;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 32px 40px;
          background: #0B0B0D;
          border: 1px solid #27272A;
          border-radius: 4px;
          max-width: 520px;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6);
        }
        .empty-state-badge {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: #A1A1AA;
          background: #18181B;
          padding: 3px 10px;
          border-radius: 2px;
          border: 1px solid #27272A;
        }
        .empty-state-title {
          font-family: var(--font-display);
          font-size: 0.9375rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: #FFFFFF;
        }
        .empty-state-subtitle {
          font-family: var(--font-ui);
          font-size: 0.8125rem;
          color: #A1A1AA;
          line-height: 1.45;
          margin-bottom: 4px;
        }
        .empty-state-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .empty-state-btn {
          background: #18181B;
          border: 1px solid #3F3F46;
          color: #FFFFFF;
          font-size: 0.78125rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          padding: 7px 14px;
          border-radius: 2px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .empty-state-btn:hover {
          background: #27272A;
          border-color: #FFFFFF;
        }
        .empty-state-btn:focus-visible {
          outline: 2px solid #FFFFFF;
          outline-offset: 1px;
        }
      `}</style>
    </div>
  );
}
