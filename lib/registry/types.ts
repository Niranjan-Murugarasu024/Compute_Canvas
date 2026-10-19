/**
 * ComputeCanvas — Module 2: Model & Pricing Intelligence Registry
 * Strongly Typed Domain Contracts
 * 
 * Defines schemas for:
 * - Model Capabilities & Lifecycle
 * - Multi-Tier Token & Unit Pricing
 * - Managed Infrastructure Tariffs
 * - Operational & Economic Assumptions
 * - Cryptographic Provenance & Snapshot Metadata
 */

export type ModelTier = 'fast' | 'frontier' | 'reasoning' | 'embedding';
export type Modality = 'text' | 'image' | 'audio' | 'video' | 'embedding';
export type LifecycleStatus = 'ACTIVE' | 'PREVIEW' | 'DEPRECATED' | 'DISCONTINUED';
export type VerificationStatus = 'VERIFIED' | 'CURATED' | 'PROVISIONAL' | 'UNVERIFIED';

export type BillingUnit = 
  | 'USD / 1M tokens'
  | 'USD / 1K tokens'
  | 'USD / instance-month'
  | 'USD / cluster-month'
  | 'USD / 1M requests'
  | 'USD / GB-hour'
  | 'USD / GB-storage';

export type Currency = 'USD';

export interface ModelLatencyProfile {
  p50BaselineMs: number;
  p95BaselineMs: number;
  ttftMs?: number;
  tokensPerSecond?: number;
}

export interface ModelRecord {
  id: string;                         // Canonical stable ID (e.g. 'gpt-4o', 'gemini-2.0-flash')
  legacyAlias?: string;               // Historical compatibility alias
  provider: string;                   // 'OpenAI' | 'Google' | 'Anthropic' | etc.
  product: string;                    // 'GPT-4o Mini', 'Gemini 2.0 Flash', etc.
  category: 'fast' | 'frontier';      // Engine 4.0 tier classification
  capabilityTier: string;             // Human-readable capability tier (e.g. 'Fast Utility')
  capabilityDescription: string;      // Functional role description
  contextWindowTokens: number;        // Total input context window
  maxOutputTokens?: number;           // Maximum output generation tokens
  baselineLatencyMs: number;          // P95 latency baseline (Engine 4.0 compatible)
  latencyProfile?: ModelLatencyProfile;
  qualityScore: number;               // 0-100 benchmark score
  qualityBenchmark?: string;          // Specific benchmark citation (e.g. Artificial Analysis / LMSYS)
  qualitySource?: string;             // Source domain
  status: LifecycleStatus;
  releaseDate?: string;               // ISO YYYY-MM-DD
  deprecationDate?: string;           // ISO YYYY-MM-DD
  source: string;                     // Short source URL/domain (e.g. 'openai.com/pricing')
  sourceUrl?: string;                 // Full canonical URL
  notes?: string;
  assumptions?: string;
}

export interface PricingRecordV2 {
  id: string;                         // e.g. 'pricing/gpt-4o/standard'
  resourceId: string;                 // Foreign key to ModelRecord.id or InfrastructureRecord.id
  provider: string;
  currency: Currency;                 // Strictly 'USD' in Phase 1
  billingUnit: BillingUnit;           // e.g. 'USD / 1M tokens'
  // Standard on-demand pricing
  inputPricePer1M: number;            // Standard on-demand input cost in USD
  outputPricePer1M: number;           // Standard on-demand output cost in USD
  // Optional pricing modes (Informational in Phase 1 - DO NOT apply in Engine 4.0 calculations)
  cachedInputPricePer1M?: number | null; // Prompt caching input price
  batchInputPricePer1M?: number | null;  // Batch API input price
  batchOutputPricePer1M?: number | null; // Batch API output price
  effectiveFrom: string;              // ISO date or month string (e.g. '2026-03' or '2026-03-01')
  effectiveTo?: string | null;        // Sunset date if applicable
  isPublicListPrice: boolean;
  verificationStatus: VerificationStatus;
  sourceUrl: string;
  retrievedAt: string;                // ISO timestamp or snapshot label
}

export interface InfrastructureRecord {
  id: string;                         // e.g. 'vectorDb', 'cache', 'apiGateway', 'router'
  category: 'vectordb' | 'cache' | 'gateway' | 'router';
  resourceName: string;
  provider: string;                   // e.g. 'Pinecone / Qdrant', 'Redis Cloud', etc.
  unit: BillingUnit;
  baseMonthlyCost?: number;           // Fixed cluster base spend ($/mo)
  perMillionRequests?: number;        // Variable query/ingress cost ($ / 1M requests)
  perMillionQueries?: number;         // Vector search query fee
  perGBStorage?: number;              // Monthly storage fee ($/GB)
  perGBHour?: number;                 // RAM cache allocation fee ($/GB-hr)
  lookupLatencyMs: number;            // Critical path hop latency
  notes: string;
  sourceUrl?: string;
}

export interface AssumptionRecord {
  id: string;                         // e.g. 'gpt-4o-mini-in', 'redis-cache-base'
  name: string;
  value: number;
  unit: string;
  source: string;
  sourceType: 'PROVIDER' | 'INTERNAL REFERENCE' | 'INDUSTRY BENCHMARK';
  snapshot: string;                   // e.g. '2026-03'
  effectiveDate: string;              // e.g. 'March 2026'
  sourceUrl?: string;
  notes: string;
  category: 'pricing' | 'infrastructure' | 'latency' | 'workload';
  confidence?: 'HIGH' | 'MODERATE' | 'LOW';
}

export interface SnapshotMetadata {
  snapshotId: string;                 // Canonical SHA-256 hash or deterministic ID
  label: string;                      // Human-readable label (e.g. '2026-03-baseline')
  aliases: string[];                  // Legacy lookup aliases (e.g. ['2026-03', 'March 2026', 'v1.4'])
  createdAt: string;                  // ISO timestamp
  engineVersion: string;              // '4.0'
  modelRegistryVersion: string;       // 'v1.4'
  description: string;
  isImmutable: boolean;
  contentHash: string;                // SHA-256 of canonicalized payload
}

export interface RegistrySnapshot {
  metadata: SnapshotMetadata;
  models: ModelRecord[];
  pricing: PricingRecordV2[];
  infrastructure: InfrastructureRecord[];
  assumptions: AssumptionRecord[];
}

export interface ValidationViolation {
  field: string;
  message: string;
  severity: 'FATAL' | 'WARNING';
  recordId?: string;
  value?: unknown;
}

export interface ValidationResult {
  isValid: boolean;
  violations: ValidationViolation[];
  fatalCount: number;
  warningCount: number;
}
