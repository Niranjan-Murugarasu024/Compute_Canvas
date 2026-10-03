/* ──────────────────────────────────────────────
   COMPUTECANVAS — DETERMINISTIC DECISION ENGINE 4.0
   Throughput Model & Monthly Rate Calculation
   ────────────────────────────────────────────── */

export const CANONICAL_DAYS_PER_MONTH = 30;
export const SECONDS_PER_DAY = 86400; // 24 * 3600
export const SECONDS_PER_MONTH = CANONICAL_DAYS_PER_MONTH * SECONDS_PER_DAY; // 2,592,000s

/**
 * Calculates modeled average throughput in Requests Per Second (RPS).
 * Preserves exact ComputeCanvas 3.x baseline formula.
 */
export function calculateThroughputRPS(requestsPerMonth: number): number {
  if (!isFinite(requestsPerMonth) || isNaN(requestsPerMonth) || requestsPerMonth <= 0) {
    return 0;
  }
  return Math.max(1, Math.round(requestsPerMonth / SECONDS_PER_MONTH));
}
