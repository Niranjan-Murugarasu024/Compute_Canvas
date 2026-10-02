/* ──────────────────────────────────────────────
   COMPUTECANVAS — STATE SHARING & SERIALIZATION (V1)
   Deterministic, zero-database URL state encoding.
   ────────────────────────────────────────────── */

import {
  type Architecture,
  type Workload,
  type BillCalibration,
  validateArchitecture,
} from './engine';

export interface V1ShareState {
  version: 1;
  schemaVersion?: string;
  registryVersion?: string;
  pricingSnapshot?: string;
  architecture: Architecture;
  workload: Workload;
  calibration?: BillCalibration;
  timestamp?: number;
}

// Convert byte array to Base64URL string (RFC 4648 § 5)
function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Convert Base64URL string to byte array
function base64UrlToBytes(base64url: string): Uint8Array {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Encodes full architecture state into a compact Base64URL payload.
 */
export function encodeArchitectureState(state: {
  architecture: Architecture;
  workload: Workload;
  calibration?: BillCalibration;
}): string {
  const sharePayload: V1ShareState = {
    version: 1,
    schemaVersion: '1.0',
    registryVersion: 'v1.4',
    pricingSnapshot: '2026-03',
    architecture: {
      id: state.architecture.id || 'custom',
      name: state.architecture.name || 'Custom Architecture',
      nodes: state.architecture.nodes.map(n => ({
        id: n.id,
        type: n.type,
        label: n.label,
        modelId: n.modelId,
        x: Math.round(n.x ?? 100),
        y: Math.round(n.y ?? 100),
        config: n.config,
      })),
      edges: state.architecture.edges.map(e => ({
        source: e.source,
        target: e.target,
        trafficShare: e.trafficShare !== undefined ? Math.round(e.trafficShare * 100) / 100 : undefined,
      })),
    },
    workload: {
      requestsPerMonth: Math.max(0, Math.round(state.workload.requestsPerMonth)),
      avgInputTokens: Math.max(0, Math.round(state.workload.avgInputTokens)),
      avgOutputTokens: Math.max(0, Math.round(state.workload.avgOutputTokens)),
      cacheHitRate: Math.max(0, Math.min(1, Math.round(state.workload.cacheHitRate * 100) / 100)),
    },
    calibration: state.calibration ? {
      enabled: Boolean(state.calibration.enabled),
      actualBill: Number(state.calibration.actualBill) || 0,
      actualRequests: Number(state.calibration.actualRequests) || 0,
      baselineSimulatedCost: Number(state.calibration.baselineSimulatedCost) || 0,
    } : undefined,
    timestamp: Date.now(),
  };

  const json = JSON.stringify(sharePayload);
  const encoder = new TextEncoder();
  const bytes = encoder.encode(json);
  return bytesToBase64Url(bytes);
}

/**
 * Decodes and validates a Base64URL share payload.
 * Returns a typed result with graceful error recovery on invalid inputs.
 */
export function decodeArchitectureState(encoded: string): {
  success: boolean;
  data?: V1ShareState;
  error?: string;
} {
  if (!encoded || typeof encoded !== 'string') {
    return { success: false, error: 'Empty share payload' };
  }

  try {
    const bytes = base64UrlToBytes(encoded.trim());
    const decoder = new TextDecoder();
    const json = decoder.decode(bytes);
    const parsed = JSON.parse(json) as Partial<V1ShareState>;

    // Schema version check
    if (!parsed || parsed.version !== 1) {
      return { success: false, error: 'Unsupported or missing schema version' };
    }

    if (!parsed.architecture || !Array.isArray(parsed.architecture.nodes) || !Array.isArray(parsed.architecture.edges)) {
      return { success: false, error: 'Invalid architecture graph structure' };
    }

    if (!parsed.workload || typeof parsed.workload.requestsPerMonth !== 'number') {
      return { success: false, error: 'Invalid workload parameters' };
    }

    // Sanitize workload numbers
    const sanitizedWorkload: Workload = {
      requestsPerMonth: Math.max(1, Number(parsed.workload.requestsPerMonth) || 1_000_000),
      avgInputTokens: Math.max(1, Number(parsed.workload.avgInputTokens) || 1000),
      avgOutputTokens: Math.max(1, Number(parsed.workload.avgOutputTokens) || 500),
      cacheHitRate: Math.max(0, Math.min(1, Number(parsed.workload.cacheHitRate) || 0)),
    };

    // Sanitize nodes
    const sanitizedNodes = parsed.architecture.nodes.map(n => ({
      id: String(n.id),
      type: n.type,
      label: String(n.label || n.type),
      modelId: n.modelId ? String(n.modelId) : undefined,
      x: Number(n.x) || 120,
      y: Number(n.y) || 100,
      config: n.config,
    }));

    // Sanitize edges
    const sanitizedEdges = parsed.architecture.edges.map(e => ({
      source: String(e.source),
      target: String(e.target),
      trafficShare: e.trafficShare !== undefined ? Number(e.trafficShare) : undefined,
    }));

    const sanitizedArch: Architecture = {
      id: parsed.architecture.id || 'shared-architecture',
      name: parsed.architecture.name || 'Shared Architecture',
      nodes: sanitizedNodes,
      edges: sanitizedEdges,
    };

    return {
      success: true,
      data: {
        version: 1,
        schemaVersion: parsed.schemaVersion || '1.0',
        registryVersion: parsed.registryVersion || 'v1.4',
        pricingSnapshot: parsed.pricingSnapshot || '2026-03',
        architecture: sanitizedArch,
        workload: sanitizedWorkload,
        calibration: parsed.calibration ? {
          enabled: Boolean(parsed.calibration.enabled),
          actualBill: Math.max(0, Number(parsed.calibration.actualBill) || 0),
          actualRequests: Math.max(0, Number(parsed.calibration.actualRequests) || 0),
          baselineSimulatedCost: Math.max(0, Number(parsed.calibration.baselineSimulatedCost) || 0),
        } : undefined,
        timestamp: parsed.timestamp,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Corrupted payload';
    return { success: false, error: `Unable to restore architecture: ${message}` };
  }
}
