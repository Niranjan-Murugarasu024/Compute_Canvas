import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  type Architecture,
  type Workload,
  type ArchNode,
  type ArchEdge,
  type SimulationResult,
  type BillCalibration,
  DEFAULT_V1_ARCHITECTURE,
  DEFAULT_V1_WORKLOAD,
  DEFAULT_V1_CALIBRATION,
  DEFAULT_WORKLOAD,
  DEFAULT_SIMPLE_ARCHITECTURE,
  DEFAULT_OPTIMIZED_ARCHITECTURE,
  simulate,
} from '@/lib/simulation/engine';
import { type RegionalDeployment } from '@/lib/simulation/multiRegion';
import { type CommentItem, type ArchitectureVersion } from '@/lib/collaboration/types';

export type CanvasLens = 'architecture' | 'topology' | 'economics' | 'performance' | 'reliability';

export interface SavedArchitecture {
  id: string;
  name: string;
  updatedAt: string;
  architecture: Architecture;
  workload: Workload;
  monthlyCost: number;
  p95Latency: number;
  capacityUtilization: number;
  qualityEstimate: number;
}

export interface ScenarioItem {
  id: string;
  name: string;
  workload: Workload;
  architecture: Architecture;
}

export interface PreviousEconomicsState {
  arch: Architecture;
  workload: Workload;
  sim: SimulationResult;
}

interface ArchitectureState {
  // Current active architecture & workload
  architecture: Architecture;
  workload: Workload;
  calibration: BillCalibration;
  previousState: PreviousEconomicsState | null;

  selectedNodeId: string | null;
  selectedEdgeIndex: number | null;

  // Active Visual Lens
  activeLens: CanvasLens;
  setLens: (lens: CanvasLens) => void;

  // Presentation / Review Mode
  presentationMode: boolean;
  setPresentationMode: (active: boolean) => void;

  // Multi-Region State
  activeRegionId: string | null;
  setActiveRegionId: (id: string | null) => void;
  regionalDeployments: RegionalDeployment[];
  setRegionalDeployment: (regionId: string, share: number) => void;

  // Active Failure Simulation State
  activeFailure: { regionId?: string; nodeId?: string } | null;
  setActiveFailure: (failure: { regionId?: string; nodeId?: string } | null) => void;

  // Canvas viewport state
  pan: { x: number; y: number };
  zoom: number;

  // History for Undo/Redo
  history: {
    past: Architecture[];
    future: Architecture[];
  };

  // Scenarios
  scenarios: ScenarioItem[];

  // Saved architectures for Dashboard & Continuity
  savedArchitectures: SavedArchitecture[];

  // Collaboration: Comments & Threads
  comments: CommentItem[];
  addComment: (targetType: CommentItem['targetType'], targetId: string, targetLabel: string, text: string, author?: string) => string;
  addCommentReply: (commentId: string, text: string, author?: string) => void;
  toggleCommentResolved: (commentId: string) => void;

  // Version History & Architecture Diff
  versions: ArchitectureVersion[];
  createVersion: (label: string, note?: string) => string;
  restoreVersion: (versionId: string) => void;

  // Actions
  setNodePosition: (id: string, x: number, y: number, recordHistory?: boolean) => void;
  addNode: (type: ArchNode['type'], label: string, x?: number, y?: number) => string;
  removeNode: (id: string) => void;
  addEdge: (source: string, target: string, trafficShare?: number) => void;
  removeEdge: (source: string, target: string) => void;
  updateEdgeShare: (source: string, target: string, share: number) => void;
  updateNodeModel: (id: string, modelId: string) => void;
  setWorkload: (workload: Partial<Workload>) => void;
  setCalibration: (calibration: Partial<BillCalibration>) => void;
  applyCalibration: (actualBill: number, actualRequests: number, currentSimCost: number) => void;
  clearCalibration: () => void;
  setSelectedNode: (id: string | null) => void;
  setSelectedEdge: (index: number | null) => void;
  setPan: (pan: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => void;
  setZoom: (zoom: number | ((prev: number) => number)) => void;
  undo: () => void;
  redo: () => void;
  autoArrange: () => void;
  resetView: () => void;
  fitToView: () => void;
  saveCurrentArchitecture: (customName?: string) => string;
  loadArchitecture: (arch: Architecture, workload?: Workload, calibration?: BillCalibration) => void;
  deleteSavedArchitecture: (id: string) => void;
  addScenario: (name?: string) => void;
  removeScenario: (id: string) => void;
  applyAIProposal: (proposedArch: Architecture, targetWorkload?: Partial<Workload>) => void;
}

// Ensure default positions for initial nodes
function initializeNodePositions(arch: Architecture): Architecture {
  const nodes = arch.nodes.map((node, i) => {
    if (node.x !== undefined && node.y !== undefined) return node;
    const col = i % 3;
    const row = Math.floor(i / 3);
    return {
      ...node,
      x: 120 + col * 200,
      y: 80 + row * 130,
    };
  });
  return { ...arch, nodes };
}

const DEFAULT_ARCH = initializeNodePositions(DEFAULT_V1_ARCHITECTURE);

const DEFAULT_REGIONAL_DEPLOYMENTS: RegionalDeployment[] = [
  { regionId: 'us-east', trafficShare: 0.60, isPrimary: true, status: 'active' },
  { regionId: 'eu-west', trafficShare: 0.25, isPrimary: false, status: 'active' },
  { regionId: 'ap-southeast', trafficShare: 0.15, isPrimary: false, status: 'active' },
];

const INITIAL_COMMENTS: CommentItem[] = [
  {
    id: 'cmt-1',
    targetType: 'node',
    targetId: 'model',
    targetLabel: 'LLM Model',
    author: 'Arun M. (FinOps)',
    avatar: 'A',
    text: 'Frontier model represents 74% of our bill. Can we benchmark Gemini 2.0 Flash for low-complexity tier?',
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    resolved: false,
    replies: [
      {
        id: 'rep-1',
        author: 'Priya S. (AI Arch)',
        avatar: 'P',
        text: 'Ran the optimizer frontier. Flash handles 70% of support intents with <2% quality variance, cutting $4.8K/mo.',
        createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
      },
    ],
  },
  {
    id: 'cmt-2',
    targetType: 'node',
    targetId: 'cache',
    targetLabel: 'Semantic Cache',
    author: 'Elena R. (Infra)',
    avatar: 'E',
    text: 'Redis cluster TTL configured to 4 hours. Hit rate averages 38% under peak concurrency.',
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    resolved: true,
    replies: [],
  },
];

const INITIAL_VERSIONS: ArchitectureVersion[] = [
  {
    id: 'ver-1',
    versionNumber: 1,
    label: 'v1.0 Baseline (Single Model)',
    note: 'Initial prototype with direct API to GPT-4o.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    author: 'Arun M.',
    architecture: DEFAULT_SIMPLE_ARCHITECTURE,
    workload: DEFAULT_WORKLOAD,
    monthlyCost: 8420,
    p95Latency: 420,
    capacityUtilization: 68,
  },
  {
    id: 'ver-2',
    versionNumber: 2,
    label: 'v2.0 Cached RAG Pipeline',
    note: 'Added prompt cache tier and Pinecone vector cluster.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    author: 'Priya S.',
    architecture: DEFAULT_OPTIMIZED_ARCHITECTURE,
    workload: { ...DEFAULT_WORKLOAD, cacheHitRate: 0.35 },
    monthlyCost: 5210,
    p95Latency: 310,
    capacityUtilization: 52,
  },
];

const DEFAULT_SAVED_ARCHITECTURES: SavedArchitecture[] = [
  {
    id: 'customer-support-ai',
    name: 'Customer Support AI',
    updatedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    architecture: initializeNodePositions(DEFAULT_OPTIMIZED_ARCHITECTURE),
    workload: { ...DEFAULT_WORKLOAD, requestsPerMonth: 2_000_000, cacheHitRate: 0.3 },
    monthlyCost: 18420,
    p95Latency: 640,
    capacityUtilization: 74,
    qualityEstimate: 93,
  },
  {
    id: 'ai-coding-assistant',
    name: 'Code Assistant',
    updatedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    architecture: initializeNodePositions({
      name: 'Code Assistant',
      nodes: [
        { id: 'api', type: 'api', label: 'API Gateway', x: 120, y: 80 },
        { id: 'model', type: 'model', label: 'Claude 3.5 Sonnet', modelId: 'claude-3.5-sonnet', x: 320, y: 80 },
        { id: 'cache', type: 'cache', label: 'Prompt Cache', x: 220, y: 200 },
        { id: 'vectordb', type: 'vectordb', label: 'Code Base Embeddings', x: 420, y: 200 },
      ],
      edges: [
        { source: 'api', target: 'cache' },
        { source: 'cache', target: 'model' },
        { source: 'model', target: 'vectordb' },
      ],
    }),
    workload: { ...DEFAULT_WORKLOAD, requestsPerMonth: 500_000, avgInputTokens: 3000, avgOutputTokens: 800, cacheHitRate: 0.4 },
    monthlyCost: 7210,
    p95Latency: 340,
    capacityUtilization: 82,
    qualityEstimate: 95,
  },
  {
    id: 'rag-search',
    name: 'RAG Search & Retrieval',
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    architecture: initializeNodePositions({
      name: 'RAG Search & Retrieval',
      nodes: [
        { id: 'api', type: 'api', label: 'API', x: 100, y: 100 },
        { id: 'embedding', type: 'embedding', label: 'Embedding', x: 260, y: 100 },
        { id: 'vectordb', type: 'vectordb', label: 'Pinecone Vector DB', x: 420, y: 100 },
        { id: 'model', type: 'model', label: 'GPT-4o', modelId: 'gpt-4o', x: 580, y: 100 },
      ],
      edges: [
        { source: 'api', target: 'embedding' },
        { source: 'embedding', target: 'vectordb' },
        { source: 'vectordb', target: 'model' },
      ],
    }),
    workload: { ...DEFAULT_WORKLOAD, requestsPerMonth: 1_200_000, retrievalsPerRequest: 3 },
    monthlyCost: 3890,
    p95Latency: 520,
    capacityUtilization: 91,
    qualityEstimate: 91,
  },
];

export const useArchitectureStore = create<ArchitectureState>()(
  persist(
    (set, get) => ({
      architecture: DEFAULT_ARCH,
      workload: DEFAULT_V1_WORKLOAD,
      calibration: DEFAULT_V1_CALIBRATION,
      previousState: null,
      selectedNodeId: null,
      selectedEdgeIndex: null,

      activeLens: 'architecture',
      setLens: (activeLens) => set({ activeLens }),

      presentationMode: false,
      setPresentationMode: (presentationMode) => set({ presentationMode }),

      activeRegionId: null,
      setActiveRegionId: (activeRegionId) => set({ activeRegionId }),

      regionalDeployments: DEFAULT_REGIONAL_DEPLOYMENTS,
      setRegionalDeployment: (regionId, share) => set(state => ({
        regionalDeployments: state.regionalDeployments.map(d =>
          d.regionId === regionId ? { ...d, trafficShare: share } : d
        ),
      })),

      activeFailure: null,
      setActiveFailure: (activeFailure) => set({ activeFailure }),

      pan: { x: 0, y: 0 },
      zoom: 1,

      history: {
        past: [],
        future: [],
      },

      scenarios: [
        {
          id: 'sc-baseline',
          name: 'Baseline (Production)',
          workload: { ...DEFAULT_WORKLOAD },
          architecture: JSON.parse(JSON.stringify(DEFAULT_ARCH)),
        },
        {
          id: 'sc-2x-scale',
          name: '2× Growth Spike',
          workload: { ...DEFAULT_WORKLOAD, requestsPerMonth: DEFAULT_WORKLOAD.requestsPerMonth * 2, concurrency: (DEFAULT_WORKLOAD.concurrency || 50) * 2 },
          architecture: JSON.parse(JSON.stringify(DEFAULT_ARCH)),
        },
        {
          id: 'sc-10x-stress',
          name: '10× Black Friday Peak',
          workload: { ...DEFAULT_WORKLOAD, requestsPerMonth: DEFAULT_WORKLOAD.requestsPerMonth * 10, concurrency: (DEFAULT_WORKLOAD.concurrency || 50) * 8 },
          architecture: JSON.parse(JSON.stringify(DEFAULT_ARCH)),
        },
      ],

      savedArchitectures: DEFAULT_SAVED_ARCHITECTURES,

      comments: INITIAL_COMMENTS,

      addComment: (targetType, targetId, targetLabel, text, author = 'You') => {
        const id = `cmt-${Date.now()}`;
        const newComment: CommentItem = {
          id,
          targetType,
          targetId,
          targetLabel,
          author,
          avatar: author.charAt(0).toUpperCase(),
          text,
          createdAt: new Date().toISOString(),
          resolved: false,
          replies: [],
        };
        set(state => ({ comments: [newComment, ...state.comments] }));
        return id;
      },

      addCommentReply: (commentId, text, author = 'You') => {
        const replyId = `rep-${Date.now()}`;
        set(state => ({
          comments: state.comments.map(c => {
            if (c.id === commentId) {
              return {
                ...c,
                replies: [
                  ...c.replies,
                  {
                    id: replyId,
                    author,
                    avatar: author.charAt(0).toUpperCase(),
                    text,
                    createdAt: new Date().toISOString(),
                  },
                ],
              };
            }
            return c;
          }),
        }));
      },

      toggleCommentResolved: (commentId) => {
        set(state => ({
          comments: state.comments.map(c =>
            c.id === commentId ? { ...c, resolved: !c.resolved } : c
          ),
        }));
      },

      versions: INITIAL_VERSIONS,

      createVersion: (label, note = '') => {
        const state = get();
        const sim = simulate(state.workload, state.architecture);
        const newVersion: ArchitectureVersion = {
          id: `ver-${Date.now()}`,
          versionNumber: state.versions.length + 1,
          label,
          note,
          createdAt: new Date().toISOString(),
          author: 'You',
          architecture: JSON.parse(JSON.stringify(state.architecture)),
          workload: JSON.parse(JSON.stringify(state.workload)),
          monthlyCost: sim.monthlyCost,
          p95Latency: sim.p95Latency,
          capacityUtilization: sim.capacityUtilization,
        };
        set({ versions: [newVersion, ...state.versions] });
        return newVersion.id;
      },

      restoreVersion: (versionId) => {
        const state = get();
        const v = state.versions.find(x => x.id === versionId);
        if (!v) return;
        set({
          history: {
            past: [...state.history.past.slice(-20), JSON.parse(JSON.stringify(state.architecture))],
            future: [],
          },
          architecture: JSON.parse(JSON.stringify(v.architecture)),
          workload: JSON.parse(JSON.stringify(v.workload)),
          selectedNodeId: null,
          selectedEdgeIndex: null,
        });
      },

      setNodePosition: (id, x, y, recordHistory = false) => {
        const state = get();
        const prevArch = state.architecture;
        const newNodes = prevArch.nodes.map(n => n.id === id ? { ...n, x, y } : n);
        const newArch = { ...prevArch, nodes: newNodes };

        if (recordHistory) {
          set({
            history: {
              past: [...state.history.past.slice(-20), prevArch],
              future: [],
            },
            architecture: newArch,
          });
        } else {
          set({ architecture: newArch });
        }
      },

      addNode: (type, label, x, y) => {
        const state = get();
        const id = `${type}-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`;

        let modelId: string | undefined = undefined;
        if (type === 'fast-model') {
          modelId = 'gpt-4o-mini';
        } else if (type === 'frontier-model' || type === 'model') {
          modelId = 'gpt-4o';
        }

        const fallbackLabel =
          type === 'api' ? 'API Ingress' :
          type === 'cache' ? 'Semantic Cache' :
          type === 'router' ? 'Complexity Router' :
          type === 'vectordb' ? 'Vector Database' :
          type === 'fast-model' ? 'Fast Model' :
          type === 'frontier-model' ? 'Frontier Model' : 'Component';

        // Position near center or offset from existing nodes
        const posX = x !== undefined ? x : 180 + (state.architecture.nodes.length % 3) * 160;
        const posY = y !== undefined ? y : 100 + Math.floor(state.architecture.nodes.length / 3) * 120;

        const newNode: ArchNode = {
          id,
          type,
          label: label || fallbackLabel,
          modelId,
          x: posX,
          y: posY,
        };

        const prevSim = simulate(state.workload, state.architecture);
        const newArch: Architecture = {
          ...state.architecture,
          nodes: [...state.architecture.nodes, newNode],
        };

        set({
          previousState: {
            arch: state.architecture,
            workload: state.workload,
            sim: prevSim,
          },
          history: {
            past: [...state.history.past.slice(-20), state.architecture],
            future: [],
          },
          architecture: newArch,
          selectedNodeId: id,
          selectedEdgeIndex: null,
        });

        return id;
      },

      removeNode: (id) => {
        const state = get();
        const prevSim = simulate(state.workload, state.architecture);
        const newArch: Architecture = {
          ...state.architecture,
          nodes: state.architecture.nodes.filter(n => n.id !== id),
          edges: state.architecture.edges.filter(e => e.source !== id && e.target !== id),
        };

        set({
          previousState: {
            arch: state.architecture,
            workload: state.workload,
            sim: prevSim,
          },
          history: {
            past: [...state.history.past.slice(-20), state.architecture],
            future: [],
          },
          architecture: newArch,
          selectedNodeId: null,
          selectedEdgeIndex: null,
        });
      },

      addEdge: (source, target, trafficShare = 1) => {
        if (source === target) return;
        const state = get();

        // Avoid exact duplicate
        const exists = state.architecture.edges.some(e => e.source === source && e.target === target);
        if (exists) return;

        const prevSim = simulate(state.workload, state.architecture);
        const newArch: Architecture = {
          ...state.architecture,
          edges: [...state.architecture.edges, { source, target, trafficShare }],
        };

        set({
          previousState: {
            arch: state.architecture,
            workload: state.workload,
            sim: prevSim,
          },
          history: {
            past: [...state.history.past.slice(-20), state.architecture],
            future: [],
          },
          architecture: newArch,
        });
      },

      removeEdge: (source, target) => {
        const state = get();
        const prevSim = simulate(state.workload, state.architecture);
        const newArch: Architecture = {
          ...state.architecture,
          edges: state.architecture.edges.filter(e => !(e.source === source && e.target === target)),
        };

        set({
          previousState: {
            arch: state.architecture,
            workload: state.workload,
            sim: prevSim,
          },
          history: {
            past: [...state.history.past.slice(-20), state.architecture],
            future: [],
          },
          architecture: newArch,
          selectedEdgeIndex: null,
        });
      },

      updateEdgeShare: (source, target, share) => {
        const state = get();
        const prevSim = simulate(state.workload, state.architecture);
        const newArch: Architecture = {
          ...state.architecture,
          edges: state.architecture.edges.map(e =>
            e.source === source && e.target === target ? { ...e, trafficShare: share } : e
          ),
        };

        set({
          previousState: {
            arch: state.architecture,
            workload: state.workload,
            sim: prevSim,
          },
          history: {
            past: [...state.history.past.slice(-20), state.architecture],
            future: [],
          },
          architecture: newArch,
        });
      },

      updateNodeModel: (id, modelId) => {
        const state = get();
        const prevSim = simulate(state.workload, state.architecture);
        const newArch: Architecture = {
          ...state.architecture,
          nodes: state.architecture.nodes.map(n => n.id === id ? { ...n, modelId } : n),
        };

        set({
          previousState: {
            arch: state.architecture,
            workload: state.workload,
            sim: prevSim,
          },
          history: {
            past: [...state.history.past.slice(-20), state.architecture],
            future: [],
          },
          architecture: newArch,
        });
      },

      setWorkload: (workloadUpdate) => {
        const state = get();
        const prevSim = simulate(state.workload, state.architecture);
        set({
          previousState: {
            arch: state.architecture,
            workload: state.workload,
            sim: prevSim,
          },
          workload: { ...state.workload, ...workloadUpdate },
        });
      },

      setCalibration: (calibrationUpdate) => {
        set(state => ({
          calibration: { ...state.calibration, ...calibrationUpdate },
        }));
      },

      applyCalibration: (actualBill, actualRequests, currentSimCost) => {
        set({
          calibration: {
            enabled: true,
            actualBill: Math.max(0, actualBill),
            actualRequests: Math.max(1, actualRequests),
            baselineSimulatedCost: currentSimCost,
          },
        });
      },

      clearCalibration: () => {
        set(state => ({
          calibration: {
            ...state.calibration,
            enabled: false,
          },
        }));
      },

      setSelectedNode: (id) => {
        set({ selectedNodeId: id, selectedEdgeIndex: null });
      },

      setSelectedEdge: (index) => {
        set({ selectedEdgeIndex: index, selectedNodeId: null });
      },

      setPan: (pan) => {
        set(state => ({
          pan: typeof pan === 'function' ? pan(state.pan) : pan,
        }));
      },

      setZoom: (zoom) => {
        set(state => {
          const next = typeof zoom === 'function' ? zoom(state.zoom) : zoom;
          return { zoom: Math.min(2.5, Math.max(0.3, next)) };
        });
      },

      undo: () => {
        const state = get();
        if (state.history.past.length === 0) return;

        const previous = state.history.past[state.history.past.length - 1];
        const newPast = state.history.past.slice(0, -1);

        set({
          history: {
            past: newPast,
            future: [state.architecture, ...state.history.future],
          },
          architecture: previous,
          selectedNodeId: null,
          selectedEdgeIndex: null,
        });
      },

      redo: () => {
        const state = get();
        if (state.history.future.length === 0) return;

        const next = state.history.future[0];
        const newFuture = state.history.future.slice(1);

        set({
          history: {
            past: [...state.history.past, state.architecture],
            future: newFuture,
          },
          architecture: next,
          selectedNodeId: null,
          selectedEdgeIndex: null,
        });
      },

      autoArrange: () => {
        const state = get();
        const nodes = state.architecture.nodes;
        if (nodes.length === 0) return;

        // Clean topological layering (Ingress -> Cache -> Router / Vector -> Models)
        const typeOrder: Record<string, number> = {
          api: 0,
          cache: 1,
          vectordb: 2,
          router: 2,
          'fast-model': 3,
          'frontier-model': 3,
          model: 3,
          loadbalancer: 0,
          embedding: 2,
          reranker: 3,
          worker: 3,
          compute: 3,
          storage: 2,
          observability: 3,
        };

        const layerBuckets: Record<number, ArchNode[]> = {};
        nodes.forEach(node => {
          const layer = typeOrder[node.type] ?? 2;
          if (!layerBuckets[layer]) layerBuckets[layer] = [];
          layerBuckets[layer].push(node);
        });

        const arrangedNodes: ArchNode[] = [];
        const layerYCoordinates: Record<number, number> = {
          0: 60,
          1: 180,
          2: 300,
          3: 440,
        };

        Object.keys(layerBuckets).sort((a, b) => Number(a) - Number(b)).forEach(layerKey => {
          const lNum = Number(layerKey);
          const bucket = layerBuckets[lNum];
          const y = layerYCoordinates[lNum] ?? (80 + lNum * 120);
          const totalWidth = bucket.length * 190;
          const startX = Math.max(100, 360 - totalWidth / 2);

          bucket.forEach((node, idx) => {
            const x = startX + idx * 190;
            arrangedNodes.push({ ...node, x, y });
          });
        });

        const newArch: Architecture = { ...state.architecture, nodes: arrangedNodes };

        set({
          history: {
            past: [...state.history.past.slice(-20), state.architecture],
            future: [],
          },
          architecture: newArch,
        });
      },

      resetView: () => {
        set({ pan: { x: 0, y: 0 }, zoom: 1 });
      },

      fitToView: () => {
        const state = get();
        const nodes = state.architecture.nodes;
        if (nodes.length === 0) {
          set({ pan: { x: 0, y: 0 }, zoom: 1 });
          return;
        }

        const minX = Math.min(...nodes.map(n => n.x || 0));
        const maxX = Math.max(...nodes.map(n => (n.x || 0) + 140));
        const minY = Math.min(...nodes.map(n => n.y || 0));
        const maxY = Math.max(...nodes.map(n => (n.y || 0) + 70));

        const archWidth = maxX - minX || 600;
        const archHeight = maxY - minY || 400;

        const targetZoom = Math.min(1.2, Math.max(0.5, Math.min(700 / archWidth, 500 / archHeight)));
        const targetPanX = -minX * targetZoom + 60;
        const targetPanY = -minY * targetZoom + 60;

        set({ pan: { x: targetPanX, y: targetPanY }, zoom: targetZoom });
      },

      saveCurrentArchitecture: (customName) => {
        const state = get();
        const id = state.architecture.id || `arch-${Date.now().toString(36)}`;
        const name = customName || state.architecture.name || 'Architecture Spec';
        const sim = simulate(state.workload, state.architecture);

        const newSaved: SavedArchitecture = {
          id,
          name,
          updatedAt: new Date().toISOString(),
          architecture: { ...state.architecture, id, name },
          workload: { ...state.workload },
          monthlyCost: sim.monthlyCost,
          p95Latency: sim.p95Latency,
          capacityUtilization: sim.capacityUtilization,
          qualityEstimate: sim.qualityEstimate,
        };

        const existingIdx = state.savedArchitectures.findIndex(a => a.id === id);
        let updatedList: SavedArchitecture[];

        if (existingIdx >= 0) {
          updatedList = [...state.savedArchitectures];
          updatedList[existingIdx] = newSaved;
        } else {
          updatedList = [newSaved, ...state.savedArchitectures];
        }

        set({
          savedArchitectures: updatedList,
          architecture: { ...state.architecture, id, name },
        });

        return id;
      },

      loadArchitecture: (arch, workload, calibration) => {
        const state = get();
        const prepared = initializeNodePositions(JSON.parse(JSON.stringify(arch)));
        const prevSim = simulate(state.workload, state.architecture);

        set({
          previousState: {
            arch: state.architecture,
            workload: state.workload,
            sim: prevSim,
          },
          history: {
            past: [...state.history.past.slice(-20), state.architecture],
            future: [],
          },
          architecture: prepared,
          workload: workload ? { ...workload } : state.workload,
          calibration: calibration ? { ...calibration } : state.calibration,
          selectedNodeId: null,
          selectedEdgeIndex: null,
          pan: { x: 0, y: 0 },
          zoom: 1,
        });
      },

      deleteSavedArchitecture: (id) => {
        set(state => ({
          savedArchitectures: state.savedArchitectures.filter(a => a.id !== id),
        }));
      },

      addScenario: (name) => {
        const state = get();
        const id = `sc-${Date.now()}`;
        const scName = name || `Scenario ${state.scenarios.length + 1}`;
        const newScenario: ScenarioItem = {
          id,
          name: scName,
          workload: { ...state.workload },
          architecture: JSON.parse(JSON.stringify(state.architecture)),
        };

        set({
          scenarios: [...state.scenarios, newScenario],
        });
      },

      removeScenario: (id) => {
        set(state => ({
          scenarios: state.scenarios.filter(s => s.id !== id),
        }));
      },

      applyAIProposal: (proposedArch, targetWorkload) => {
        const state = get();
        const prepared = initializeNodePositions(JSON.parse(JSON.stringify(proposedArch)));

        set({
          history: {
            past: [...state.history.past.slice(-20), JSON.parse(JSON.stringify(state.architecture))],
            future: [],
          },
          architecture: prepared,
          workload: targetWorkload ? { ...state.workload, ...targetWorkload } : state.workload,
          selectedNodeId: null,
          selectedEdgeIndex: null,
        });
      },
    }),
    {
      name: 'computecanvas_architecture_store_v2',
      partialize: (state) => ({
        architecture: state.architecture,
        workload: state.workload,
        calibration: state.calibration,
        savedArchitectures: state.savedArchitectures,
        scenarios: state.scenarios,
        comments: state.comments,
        versions: state.versions,
        regionalDeployments: state.regionalDeployments,
      }),
    }
  )
);
