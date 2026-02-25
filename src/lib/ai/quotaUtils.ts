// Quota management utilities for AI generation.
// Pure functions only -- no Prisma imports, no side effects.
// @MX:NOTE: [AUTO] Pure quota calculation functions (SPEC-AI-001 Phase 2)
// @MX:SPEC: SPEC-AI-001

import type { QuotaCheckResult } from "./types";

// Check if teacher has available quota for AI generation
export function checkQuotaAvailable(
  currentMonthUsage: number,
  monthlyQuota: number
): QuotaCheckResult {
  const remaining = Math.max(0, monthlyQuota - currentMonthUsage);
  return {
    available: remaining > 0,
    remaining,
    used: currentMonthUsage,
  };
}

// Calculate remaining quota for the current month
export function calculateRemainingQuota(
  currentMonthUsage: number,
  monthlyQuota: number
): number {
  return Math.max(0, monthlyQuota - currentMonthUsage);
}

// Check if teacher is approaching quota limit (80% threshold)
export function isApproachingQuotaLimit(
  currentMonthUsage: number,
  monthlyQuota: number
): boolean {
  if (monthlyQuota <= 0) {
    return false;
  }
  return currentMonthUsage / monthlyQuota >= 0.8;
}

// Get the start of the current month (UTC) for query filtering
export function getMonthStartDate(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}
