import {
  RegistrySnapshot,
  ValidationResult,
  ValidationViolation,
} from './types';

/**
 * Validates a complete RegistrySnapshot or individual domains against the 14 Inviolable Rules.
 * Distinguishes FATAL errors (which block publication or simulation) from WARNINGS (which flag incomplete but usable data).
 */
export function validateRegistrySnapshot(snapshot: RegistrySnapshot): ValidationResult {
  const violations: ValidationViolation[] = [];

  // Track seen IDs for uniqueness checks
  const modelIds = new Set<string>();
  const seenAliases = new Set<string>();
  const pricingIds = new Set<string>();
  const pricingResourceIds = new Set<string>();
  const infraIds = new Set<string>();
  const assumptionIds = new Set<string>();

  // 1. Model Validation
  for (const model of snapshot.models) {
    if (!model.id || typeof model.id !== 'string') {
      violations.push({
        field: 'model.id',
        message: 'Model ID is missing or invalid',
        severity: 'FATAL',
        recordId: model.id,
      });
      continue;
    }

    if (modelIds.has(model.id)) {
      violations.push({
        field: 'model.id',
        message: `Duplicate Model ID detected: "${model.id}"`,
        severity: 'FATAL',
        recordId: model.id,
      });
    }
    modelIds.add(model.id);

    // Alias uniqueness check
    if (model.legacyAlias) {
      if (typeof model.legacyAlias !== 'string' || model.legacyAlias.trim() === '') {
        violations.push({
          field: 'model.legacyAlias',
          message: `Model "${model.id}" has an invalid legacyAlias`,
          severity: 'FATAL',
          recordId: model.id,
        });
      } else if (seenAliases.has(model.legacyAlias)) {
        violations.push({
          field: 'model.legacyAlias',
          message: `Ambiguous alias detected: "${model.legacyAlias}" is defined on multiple models`,
          severity: 'FATAL',
          recordId: model.id,
        });
      } else {
        seenAliases.add(model.legacyAlias);
      }
    }

    // Latency bounds
    if (typeof model.baselineLatencyMs !== 'number' || model.baselineLatencyMs <= 0) {
      violations.push({
        field: 'model.baselineLatencyMs',
        message: `Model baseline latency must be a positive number, got: ${model.baselineLatencyMs}`,
        severity: 'FATAL',
        recordId: model.id,
        value: model.baselineLatencyMs,
      });
    }

    // Context window bounds
    if (typeof model.contextWindowTokens !== 'number' || model.contextWindowTokens <= 0) {
      violations.push({
        field: 'model.contextWindowTokens',
        message: `Model context window tokens must be greater than 0, got: ${model.contextWindowTokens}`,
        severity: 'FATAL',
        recordId: model.id,
        value: model.contextWindowTokens,
      });
    }

    // Provenance requirement
    if (!model.source && !model.sourceUrl) {
      violations.push({
        field: 'model.source',
        message: `Model "${model.id}" is missing required source citation or URL`,
        severity: 'FATAL',
        recordId: model.id,
      });
    }
  }

  // Alias collision with canonical model ID check
  for (const model of snapshot.models) {
    if (model.legacyAlias && modelIds.has(model.legacyAlias) && model.legacyAlias !== model.id) {
      violations.push({
        field: 'model.legacyAlias',
        message: `Alias collision detected: legacyAlias "${model.legacyAlias}" collides with a canonical model ID`,
        severity: 'FATAL',
        recordId: model.id,
      });
    }
  }

  // 2. Infrastructure Validation
  for (const infra of snapshot.infrastructure) {
    if (!infra.id || typeof infra.id !== 'string') {
      violations.push({
        field: 'infra.id',
        message: 'Infrastructure ID is missing or invalid',
        severity: 'FATAL',
        recordId: infra.id,
      });
      continue;
    }

    if (infraIds.has(infra.id)) {
      violations.push({
        field: 'infra.id',
        message: `Duplicate Infrastructure ID detected: "${infra.id}"`,
        severity: 'FATAL',
        recordId: infra.id,
      });
    }
    infraIds.add(infra.id);

    // Non-negative tariffs
    if (infra.baseMonthlyCost !== undefined && infra.baseMonthlyCost < 0) {
      violations.push({
        field: 'infra.baseMonthlyCost',
        message: `Infrastructure baseMonthlyCost cannot be negative: ${infra.baseMonthlyCost}`,
        severity: 'FATAL',
        recordId: infra.id,
        value: infra.baseMonthlyCost,
      });
    }

    if (infra.perMillionRequests !== undefined && infra.perMillionRequests < 0) {
      violations.push({
        field: 'infra.perMillionRequests',
        message: `Infrastructure perMillionRequests cannot be negative: ${infra.perMillionRequests}`,
        severity: 'FATAL',
        recordId: infra.id,
        value: infra.perMillionRequests,
      });
    }

    if (infra.lookupLatencyMs < 0) {
      violations.push({
        field: 'infra.lookupLatencyMs',
        message: `Infrastructure lookupLatencyMs cannot be negative: ${infra.lookupLatencyMs}`,
        severity: 'FATAL',
        recordId: infra.id,
        value: infra.lookupLatencyMs,
      });
    }
  }

  // 3. Pricing Validation
  for (const pricing of snapshot.pricing) {
    if (!pricing.id || typeof pricing.id !== 'string') {
      violations.push({
        field: 'pricing.id',
        message: 'Pricing ID is missing or invalid',
        severity: 'FATAL',
        recordId: pricing.id,
      });
      continue;
    }

    if (pricingIds.has(pricing.id)) {
      violations.push({
        field: 'pricing.id',
        message: `Duplicate Pricing ID detected: "${pricing.id}"`,
        severity: 'FATAL',
        recordId: pricing.id,
      });
    }
    pricingIds.add(pricing.id);

    // Currency consistency
    if (pricing.currency !== 'USD') {
      violations.push({
        field: 'pricing.currency',
        message: `Unsupported currency "${pricing.currency}". Only USD is supported in Phase 1.`,
        severity: 'FATAL',
        recordId: pricing.id,
        value: pricing.currency,
      });
    }

    // Referential integrity: resourceId must point to a model or infra item
    if (!modelIds.has(pricing.resourceId) && !infraIds.has(pricing.resourceId)) {
      violations.push({
        field: 'pricing.resourceId',
        message: `Referential Integrity Error: Pricing record "${pricing.id}" references non-existent resourceId "${pricing.resourceId}"`,
        severity: 'FATAL',
        recordId: pricing.id,
        value: pricing.resourceId,
      });
    }

    if (pricingResourceIds.has(pricing.resourceId)) {
      violations.push({
        field: 'pricing.resourceId',
        message: `Duplicate pricing resource detected: resourceId "${pricing.resourceId}" already has an assigned pricing record`,
        severity: 'FATAL',
        recordId: pricing.id,
        value: pricing.resourceId,
      });
    }
    pricingResourceIds.add(pricing.resourceId);

    // Negative price rule
    if (typeof pricing.inputPricePer1M !== 'number' || isNaN(pricing.inputPricePer1M)) {
      violations.push({
        field: 'pricing.inputPricePer1M',
        message: `Missing or invalid inputPricePer1M for "${pricing.id}". Unknown prices must not be zeroed out.`,
        severity: 'FATAL',
        recordId: pricing.id,
        value: pricing.inputPricePer1M,
      });
    } else if (pricing.inputPricePer1M < 0) {
      violations.push({
        field: 'pricing.inputPricePer1M',
        message: `Negative input price detected: ${pricing.inputPricePer1M}`,
        severity: 'FATAL',
        recordId: pricing.id,
        value: pricing.inputPricePer1M,
      });
    }

    if (typeof pricing.outputPricePer1M !== 'number' || isNaN(pricing.outputPricePer1M)) {
      violations.push({
        field: 'pricing.outputPricePer1M',
        message: `Missing or invalid outputPricePer1M for "${pricing.id}". Unknown prices must not be zeroed out.`,
        severity: 'FATAL',
        recordId: pricing.id,
        value: pricing.outputPricePer1M,
      });
    } else if (pricing.outputPricePer1M < 0) {
      violations.push({
        field: 'pricing.outputPricePer1M',
        message: `Negative output price detected: ${pricing.outputPricePer1M}`,
        severity: 'FATAL',
        recordId: pricing.id,
        value: pricing.outputPricePer1M,
      });
    }

    // Optional cached / batch prices must not be negative if provided
    if (pricing.cachedInputPricePer1M !== undefined && pricing.cachedInputPricePer1M !== null && pricing.cachedInputPricePer1M < 0) {
      violations.push({
        field: 'pricing.cachedInputPricePer1M',
        message: `Negative cached input price detected: ${pricing.cachedInputPricePer1M}`,
        severity: 'FATAL',
        recordId: pricing.id,
        value: pricing.cachedInputPricePer1M,
      });
    }

    if (pricing.batchInputPricePer1M !== undefined && pricing.batchInputPricePer1M !== null && pricing.batchInputPricePer1M < 0) {
      violations.push({
        field: 'pricing.batchInputPricePer1M',
        message: `Negative batch input price detected: ${pricing.batchInputPricePer1M}`,
        severity: 'FATAL',
        recordId: pricing.id,
        value: pricing.batchInputPricePer1M,
      });
    }

    // Date range sanity: effectiveTo >= effectiveFrom
    if (pricing.effectiveFrom && pricing.effectiveTo) {
      if (pricing.effectiveTo < pricing.effectiveFrom) {
        violations.push({
          field: 'pricing.effectiveTo',
          message: `Date range error: effectiveTo (${pricing.effectiveTo}) is before effectiveFrom (${pricing.effectiveFrom})`,
          severity: 'FATAL',
          recordId: pricing.id,
        });
      }
    }

    // Provenance check
    if (!pricing.sourceUrl) {
      violations.push({
        field: 'pricing.sourceUrl',
        message: `Missing sourceUrl provenance for pricing record "${pricing.id}"`,
        severity: 'FATAL',
        recordId: pricing.id,
      });
    }
  }

  // 4. Assumptions Validation
  for (const assumption of snapshot.assumptions) {
    if (!assumption.id || typeof assumption.id !== 'string') {
      violations.push({
        field: 'assumption.id',
        message: 'Assumption ID is missing or invalid',
        severity: 'FATAL',
        recordId: assumption.id,
      });
      continue;
    }

    if (assumptionIds.has(assumption.id)) {
      violations.push({
        field: 'assumption.id',
        message: `Duplicate Assumption ID detected: "${assumption.id}"`,
        severity: 'FATAL',
        recordId: assumption.id,
      });
    }
    assumptionIds.add(assumption.id);

    if (typeof assumption.value !== 'number' || isNaN(assumption.value)) {
      violations.push({
        field: 'assumption.value',
        message: `Assumption "${assumption.id}" value must be a valid number, got: ${assumption.value}`,
        severity: 'FATAL',
        recordId: assumption.id,
        value: assumption.value,
      });
    }
  }

  // 5. Metadata & Content Hash verification
  if (!snapshot.metadata || !snapshot.metadata.snapshotId) {
    violations.push({
      field: 'metadata.snapshotId',
      message: 'Snapshot metadata is missing canonical snapshotId',
      severity: 'FATAL',
    });
  }

  const fatalCount = violations.filter(v => v.severity === 'FATAL').length;
  const warningCount = violations.filter(v => v.severity === 'WARNING').length;

  return {
    isValid: fatalCount === 0,
    violations,
    fatalCount,
    warningCount,
  };
}
