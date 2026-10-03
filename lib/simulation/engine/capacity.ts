/* ──────────────────────────────────────────────
   COMPUTECANVAS — DETERMINISTIC DECISION ENGINE 4.0
   Capacity & Saturation Modeling
   ────────────────────────────────────────────── */

import { type ComponentCapacity, type Workload } from './types';
import { calculateThroughputRPS, SECONDS_PER_MONTH } from './throughput';
import { clamp, safeDivide } from './precision';

export const BASELINE_MONTHLY_CAPACITY = 5_000_000; // 5M requests/month standard cluster baseline

/**
 * Computes deterministic capacity utilization and saturation states.
 */
export function calculateCapacity(workload: Workload): {
  capacityUtilization: number;
  capacity: ComponentCapacity;
} {
  const requests = Math.max(0, workload.requestsPerMonth);
  const rawUtilization = safeDivide(requests, BASELINE_MONTHLY_CAPACITY) * 100;
  const capacityUtilization = clamp(Math.round(rawUtilization), 0, 100);

  const capacityRPS = Math.round(BASELINE_MONTHLY_CAPACITY / SECONDS_PER_MONTH);
  const requestsPerSecond = calculateThroughputRPS(requests);

  let saturationState: 'UNDER_CAPACITY' | 'NEAR_CAPACITY' | 'SATURATED' = 'UNDER_CAPACITY';
  if (capacityUtilization >= 95) {
    saturationState = 'SATURATED';
  } else if (capacityUtilization >= 70) {
    saturationState = 'NEAR_CAPACITY';
  }

  // Model-derived queue depth estimate under concurrency pressure
  const concurrency = workload.concurrency || 1;
  const queueDepth = saturationState === 'SATURATED'
    ? Math.round(concurrency * (rawUtilization / 100))
    : 0;

  const capacity: ComponentCapacity = {
    capacityPerSecond: capacityRPS,
    requestsPerSecond,
    utilization: capacityUtilization,
    queueDepth,
    saturationState,
  };

  return {
    capacityUtilization,
    capacity,
  };
}
