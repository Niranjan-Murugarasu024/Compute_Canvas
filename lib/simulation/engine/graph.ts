/* ──────────────────────────────────────────────
   COMPUTECANVAS — DETERMINISTIC DECISION ENGINE 4.0
   Graph Resolution & Topological Ordering
   ────────────────────────────────────────────── */

import { type Architecture, type ArchNode, type ComponentType } from './types';

export interface ResolvedGraph {
  ingressNodes: ArchNode[];
  reachableNodes: ArchNode[];
  disconnectedNodes: ArchNode[];
  topologicalOrder: ArchNode[];
  executionPaths: string[][];
  hasCache: boolean;
  hasVectorDb: boolean;
  hasRouter: boolean;
  modelNodes: ArchNode[];
  cacheNodes: ArchNode[];
  vectorNodes: ArchNode[];
  routerNodes: ArchNode[];
  apiNodes: ArchNode[];
}

const isModelType = (t: ComponentType) =>
  t === 'fast-model' || t === 'frontier-model' || t === 'model';

/**
 * Resolves graph topology, reachability, and topological ordering.
 * Deterministic, loop-safe, and independent of simulation economics.
 */
export function resolveGraph(
  architecture: Architecture,
  reachableNodeIds: Set<string>
): ResolvedGraph {
  const nodes = architecture.nodes || [];
  const edges = architecture.edges || [];

  const apiNodes = nodes.filter(n => n.type === 'api' && reachableNodeIds.has(n.id));
  const ingressNodes = apiNodes;
  const reachableNodes = nodes.filter(n => reachableNodeIds.has(n.id));
  const disconnectedNodes = nodes.filter(n => !reachableNodeIds.has(n.id));

  const cacheNodes = reachableNodes.filter(n => n.type === 'cache');
  const vectorNodes = reachableNodes.filter(n => n.type === 'vectordb');
  const routerNodes = reachableNodes.filter(n => n.type === 'router');
  const modelNodes = reachableNodes.filter(n => isModelType(n.type));

  const hasCache = cacheNodes.length > 0;
  const hasVectorDb = vectorNodes.length > 0;
  const hasRouter = routerNodes.length > 0;

  // Topological Sort of Reachable Nodes using Kahn's Algorithm
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  reachableNodes.forEach(n => {
    inDegree.set(n.id, 0);
    adjacency.set(n.id, []);
  });

  edges.forEach(e => {
    if (reachableNodeIds.has(e.source) && reachableNodeIds.has(e.target) && e.source !== e.target) {
      adjacency.get(e.source)?.push(e.target);
      inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
    }
  });

  // Start with nodes having in-degree 0 (ingress nodes)
  const queue: string[] = [];
  reachableNodes.forEach(n => {
    if (inDegree.get(n.id) === 0) {
      queue.push(n.id);
    }
  });

  const sortedIds: string[] = [];
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    sortedIds.push(currentId);

    const neighbors = adjacency.get(currentId) || [];
    for (const neighbor of neighbors) {
      const remainingDegree = (inDegree.get(neighbor) || 1) - 1;
      inDegree.set(neighbor, remainingDegree);
      if (remainingDegree === 0) {
        queue.push(neighbor);
      }
    }
  }

  // Fallback to reachableNodes order if cycle or unvisited in Kahn's
  const nodeMap = new Map<string, ArchNode>();
  reachableNodes.forEach(n => nodeMap.set(n.id, n));
  const topologicalOrder = sortedIds.length === reachableNodes.length
    ? sortedIds.map(id => nodeMap.get(id)!).filter(Boolean)
    : reachableNodes;

  // Find execution paths from Ingress to terminal nodes (DFS, max depth limit to prevent pathological execution)
  const executionPaths: string[][] = [];
  const maxPaths = 32;

  function findPaths(currentId: string, currentPath: string[]) {
    if (executionPaths.length >= maxPaths) return;
    const neighbors = adjacency.get(currentId) || [];
    if (neighbors.length === 0) {
      executionPaths.push([...currentPath, currentId]);
      return;
    }
    for (const neighbor of neighbors) {
      if (!currentPath.includes(neighbor)) {
        findPaths(neighbor, [...currentPath, currentId]);
      }
    }
  }

  ingressNodes.forEach(ingress => {
    findPaths(ingress.id, []);
  });

  return {
    ingressNodes,
    reachableNodes,
    disconnectedNodes,
    topologicalOrder,
    executionPaths,
    hasCache,
    hasVectorDb,
    hasRouter,
    modelNodes,
    cacheNodes,
    vectorNodes,
    routerNodes,
    apiNodes,
  };
}
