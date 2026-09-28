import {
  type Architecture,
  type Workload,
  type ArchNode,
  simulate,
} from '@/lib/simulation/engine';

export interface CommentReply {
  id: string;
  author: string;
  avatar: string;
  text: string;
  createdAt: string;
}

export interface CommentItem {
  id: string;
  targetType: 'node' | 'edge' | 'region' | 'canvas';
  targetId: string;
  targetLabel: string;
  author: string;
  avatar: string;
  text: string;
  createdAt: string;
  resolved: boolean;
  replies: CommentReply[];
}

export interface ArchitectureVersion {
  id: string;
  versionNumber: number;
  label: string;
  note: string;
  createdAt: string;
  author: string;
  architecture: Architecture;
  workload: Workload;
  monthlyCost: number;
  p95Latency: number;
  capacityUtilization: number;
}

export interface ArchitectureDiff {
  baseVersionLabel: string;
  targetVersionLabel: string;
  addedNodes: ArchNode[];
  removedNodes: ArchNode[];
  modifiedNodes: { node: ArchNode; changes: string[] }[];
  addedEdgesCount: number;
  removedEdgesCount: number;
  costDelta: number;
  costDeltaPercent: number;
  latencyDelta: number;
  latencyDeltaPercent: number;
  capacityDelta: number;
}

export function computeArchitectureDiff(
  baseArch: Architecture,
  targetArch: Architecture,
  baseWorkload: Workload,
  targetWorkload: Workload,
  baseLabel: string = 'vPrevious',
  targetLabel: string = 'vCurrent'
): ArchitectureDiff {
  const baseSim = simulate(baseWorkload, baseArch);
  const targetSim = simulate(targetWorkload, targetArch);

  const baseNodeMap = new Map(baseArch.nodes.map(n => [n.id, n]));
  const targetNodeMap = new Map(targetArch.nodes.map(n => [n.id, n]));

  const addedNodes: ArchNode[] = [];
  const removedNodes: ArchNode[] = [];
  const modifiedNodes: { node: ArchNode; changes: string[] }[] = [];

  targetArch.nodes.forEach(tn => {
    const bn = baseNodeMap.get(tn.id);
    if (!bn) {
      addedNodes.push(tn);
    } else {
      const changes: string[] = [];
      if (bn.label !== tn.label) changes.push(`Renamed from "${bn.label}" to "${tn.label}"`);
      if (bn.type !== tn.type) changes.push(`Type changed from ${bn.type} to ${tn.type}`);
      if (bn.modelId !== tn.modelId) changes.push(`Model updated from ${bn.modelId || 'default'} to ${tn.modelId}`);
      if (changes.length > 0) {
        modifiedNodes.push({ node: tn, changes });
      }
    }
  });

  baseArch.nodes.forEach(bn => {
    if (!targetNodeMap.has(bn.id)) {
      removedNodes.push(bn);
    }
  });

  const costDelta = targetSim.monthlyCost - baseSim.monthlyCost;
  const costDeltaPercent = baseSim.monthlyCost > 0 ? (costDelta / baseSim.monthlyCost) * 100 : 0;
  const latencyDelta = targetSim.p95Latency - baseSim.p95Latency;
  const latencyDeltaPercent = baseSim.p95Latency > 0 ? (latencyDelta / baseSim.p95Latency) * 100 : 0;
  const capacityDelta = targetSim.capacityUtilization - baseSim.capacityUtilization;

  return {
    baseVersionLabel: baseLabel,
    targetVersionLabel: targetLabel,
    addedNodes,
    removedNodes,
    modifiedNodes,
    addedEdgesCount: Math.max(0, targetArch.edges.length - baseArch.edges.length),
    removedEdgesCount: Math.max(0, baseArch.edges.length - targetArch.edges.length),
    costDelta,
    costDeltaPercent,
    latencyDelta,
    latencyDeltaPercent,
    capacityDelta,
  };
}
