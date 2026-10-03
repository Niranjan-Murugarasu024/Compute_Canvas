/* ──────────────────────────────────────────────
   COMPUTECANVAS — DETERMINISTIC DECISION ENGINE 4.0
   Deterministic Architecture Graph & Workload Validation
   ────────────────────────────────────────────── */

import {
  type Architecture,
  type ArchitectureValidation,
  type ComponentType,
} from './types';

/**
 * Validates the directed graph structure and routing parameters of an architecture.
 * Side-effect free, deterministic, and returns structured errors and warnings.
 */
export function validateArchitecture(arch: Architecture): ArchitectureValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!arch || !Array.isArray(arch.nodes)) {
    return {
      isValid: false,
      errors: ['Architecture is missing or contains an invalid node collection.'],
      warnings: [],
      reachableNodeIds: new Set<string>(),
      hasModel: false,
      hasApi: false,
    };
  }

  const nodes = arch.nodes;
  const edges = Array.isArray(arch.edges) ? arch.edges : [];

  // Check for duplicate node IDs
  const nodeIds = new Set<string>();
  const duplicateNodeIds = new Set<string>();
  for (const n of nodes) {
    if (!n.id) {
      errors.push('Architecture contains a component with a missing or empty ID.');
      continue;
    }
    if (nodeIds.has(n.id)) {
      duplicateNodeIds.add(n.id);
    }
    nodeIds.add(n.id);
  }
  if (duplicateNodeIds.size > 0) {
    errors.push(`Duplicate component ID detected: ${Array.from(duplicateNodeIds).join(', ')}. Component IDs must be unique.`);
  }

  // 1. Must have at least one API Ingress node
  const apiNodes = nodes.filter(n => n.type === 'api');
  const hasApi = apiNodes.length > 0;
  if (!hasApi) {
    errors.push('Architecture requires an API Ingress component to receive incoming requests.');
  }

  // 2. Check for missing edge endpoints, self-loops & duplicate connections
  const seenEdges = new Set<string>();
  for (const edge of edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      errors.push('Architecture contains broken connections pointing to missing components.');
      break;
    }
    if (edge.source === edge.target) {
      const node = nodes.find(n => n.id === edge.source);
      errors.push(`Architecture contains a self-loop on "${node?.label || edge.source}". Self-referential connections are not permitted.`);
      break;
    }
    const edgeKey = `${edge.source}->${edge.target}`;
    if (seenEdges.has(edgeKey)) {
      warnings.push(`Duplicate connection from "${edge.source}" to "${edge.target}" detected. Redundant connection ignored.`);
    }
    seenEdges.add(edgeKey);
  }

  // 3. Cycle Detection (DFS)
  const adjacency = new Map<string, string[]>();
  nodes.forEach(n => adjacency.set(n.id, []));
  edges.forEach(e => {
    if (adjacency.has(e.source) && e.source !== e.target) {
      adjacency.get(e.source)!.push(e.target);
    }
  });

  const visited = new Map<string, 'unvisited' | 'visiting' | 'visited'>();
  nodes.forEach(n => visited.set(n.id, 'unvisited'));
  let hasCycle = false;

  function dfs(nodeId: string): boolean {
    visited.set(nodeId, 'visiting');
    const neighbors = adjacency.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (visited.get(neighbor) === 'visiting') {
        return true;
      }
      if (visited.get(neighbor) === 'unvisited') {
        if (dfs(neighbor)) return true;
      }
    }
    visited.set(nodeId, 'visited');
    return false;
  }

  for (const node of nodes) {
    if (visited.get(node.id) === 'unvisited') {
      if (dfs(node.id)) {
        hasCycle = true;
        break;
      }
    }
  }

  if (hasCycle) {
    errors.push('Architecture contains a circular dependency loop. Data flow must be directed acyclic.');
  }

  // 4. Reachability from API Ingress (BFS)
  const reachableNodeIds = new Set<string>();
  const queue = apiNodes.map(n => n.id);
  queue.forEach(id => reachableNodeIds.add(id));

  let head = 0;
  while (head < queue.length) {
    const curr = queue[head++];
    const targets = adjacency.get(curr) || [];
    for (const t of targets) {
      if (!reachableNodeIds.has(t)) {
        reachableNodeIds.add(t);
        queue.push(t);
      }
    }
  }

  // Check if any model is reachable
  const isModelType = (t: ComponentType) =>
    t === 'fast-model' || t === 'frontier-model' || t === 'model';

  const reachableModels = nodes.filter(n => reachableNodeIds.has(n.id) && isModelType(n.type));
  const hasModel = reachableModels.length > 0;
  if (hasApi && !hasModel) {
    errors.push('Connect the API Ingress to at least one reasoning model to simulate economics.');
  }

  // Check unreachable nodes
  const unreachableCount = nodes.length - reachableNodeIds.size;
  if (hasApi && unreachableCount > 0) {
    warnings.push(`${unreachableCount} disconnected component${unreachableCount > 1 ? 's' : ''} not in the request path.`);
  }

  // Check router outbound splits
  const routers = nodes.filter(n => reachableNodeIds.has(n.id) && n.type === 'router');
  for (const r of routers) {
    const outbound = edges.filter(e => e.source === r.id);
    if (outbound.length > 1) {
      const sum = outbound.reduce((acc, e) => acc + (e.trafficShare !== undefined ? e.trafficShare : 1 / outbound.length), 0);
      if (sum > 1.01) {
        errors.push(`INVALID ROUTING: Router "${r.label}" outbound allocations total ${Math.round(sum * 100)}% (exceeds 100% capacity). Reduce allocations to 100% or less to simulate.`);
      } else if (sum < 0.99) {
        warnings.push(`UNALLOCATED TRAFFIC: Router "${r.label}" outbound allocations total ${Math.round(sum * 100)}% (${Math.round((1 - sum) * 100)}% unallocated/dropped traffic).`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    reachableNodeIds,
    hasModel,
    hasApi,
  };
}
