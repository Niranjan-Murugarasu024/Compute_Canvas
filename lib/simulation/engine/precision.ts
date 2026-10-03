/* ──────────────────────────────────────────────
   COMPUTECANVAS — DETERMINISTIC DECISION ENGINE 4.0
   Precision & Monetary Arithmetic Infrastructure
   ────────────────────────────────────────────── */

export const CENTS_FACTOR = 100;
export const MICROCENTS_FACTOR = 1_000_000;

/**
 * Standard commercial round to 2 decimal places (cents).
 * Uses Number.EPSILON to avoid floating-point representation drift.
 */
export function roundCurrency(amount: number): number {
  if (!isFinite(amount) || isNaN(amount)) return 0;
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * High precision monetary rounding for per-request / per-token unit rates.
 */
export function roundMicroCurrency(amount: number, decimals = 4): number {
  if (!isFinite(amount) || isNaN(amount)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round((amount + Number.EPSILON) * factor) / factor;
}

/**
 * Rounded percentage integer (e.g. 0.72 -> 72).
 */
export function roundPercent(ratio: number): number {
  if (!isFinite(ratio) || isNaN(ratio)) return 0;
  return Math.round((ratio + Number.EPSILON) * 100);
}

/**
 * Numerical bounds clamping with NaN protection.
 */
export function clamp(val: number, min: number, max: number): number {
  if (isNaN(val)) return min;
  return Math.max(min, Math.min(max, val));
}

/**
 * Safe division protecting against division-by-zero, NaN, and Infinity.
 */
export function safeDivide(numerator: number, denominator: number, fallback = 0): number {
  if (!isFinite(numerator) || !isFinite(denominator) || denominator === 0 || isNaN(numerator) || isNaN(denominator)) {
    return fallback;
  }
  const result = numerator / denominator;
  return isFinite(result) ? result : fallback;
}

/**
 * Safe product of multiple factors.
 */
export function safeMultiply(...factors: number[]): number {
  let product = 1;
  for (const factor of factors) {
    if (!isFinite(factor) || isNaN(factor)) return 0;
    product *= factor;
  }
  return product;
}

/**
 * Canonical integer number formatter with US locale grouping.
 */
export function formatNumber(n: number): string {
  if (!isFinite(n) || isNaN(n)) return '0';
  return Math.round(n).toLocaleString('en-US');
}

/**
 * Canonical currency formatter preserving exact ComputeCanvas 3.x rules.
 */
export function formatCurrency(n: number, compact = false): string {
  if (!isFinite(n) || isNaN(n)) return '$0';
  const isNegative = n < 0;
  const absN = Math.abs(n);
  const prefix = isNegative ? '-$' : '$';

  if (compact && absN >= 1_000_000) {
    return `${prefix}${(absN / 1_000_000).toFixed(2)}M`;
  }
  if (compact && absN >= 1_000) {
    return `${prefix}${(absN / 1_000).toFixed(1)}K`;
  }
  // Sub-cent pricing (e.g. per-request unit cost $0.0025)
  if (absN < 0.01 && absN > 0) {
    return `${prefix}${absN.toFixed(4)}`;
  }
  // Sub-dollar pricing (e.g. router infra cost $0.50/mo)
  if (absN < 1 && absN > 0) {
    return `${prefix}${absN.toFixed(2)}`;
  }
  return `${prefix}${Math.round(absN).toLocaleString('en-US')}`;
}

/**
 * Canonical latency formatter preserving exact ComputeCanvas 3.x rules.
 */
export function formatLatency(ms: number): string {
  if (!isFinite(ms) || isNaN(ms)) return '0 ms';
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(2)}s`;
  }
  return `${Math.round(ms)} ms`;
}
