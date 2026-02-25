// @MX:NOTE: [AUTO] Pure type definitions for AI-enhanced interval optimization (SPEC-AI-001 Phase 5)
// @MX:SPEC: SPEC-AI-001

export interface ReviewLogEntry {
  readonly rating: "HARD" | "OK" | "EASY";
  readonly previousBox: number;
  readonly newBox: number;
  readonly responseTimeMs: number | null;
  readonly reviewedAt: Date;
}

export type PerformanceTrend = "improving" | "stable" | "declining";

export interface StudentPerformanceProfile {
  readonly averageRatingTrend: PerformanceTrend;
  readonly responseTimeTrend: PerformanceTrend;
  readonly retentionRate: number; // 0-1: fraction of reviews rated OK or EASY
  readonly lapseFrequency: number; // 0-1: fraction of HARD ratings in last N reviews
  readonly totalReviews: number;
  readonly averageResponseTimeMs: number | null;
}

export interface IntervalAdjustment {
  readonly adjustedIntervalDays: number;
  readonly confidence: number; // 0-1
  readonly reason: string;
}

export interface RetentionMetrics {
  readonly probability: number; // 0-1
  readonly stability: number;
  readonly daysSinceReview: number;
}

export interface AIEnhancedReviewResult {
  readonly adjustedDate: Date;
  readonly confidence: number;
  readonly wasAdjusted: boolean;
}
