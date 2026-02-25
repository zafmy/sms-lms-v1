// @MX:NOTE: [AUTO] Pure functions for AI-enhanced spaced repetition interval optimization (SPEC-AI-001 Phase 5)
// @MX:SPEC: SPEC-AI-001
// No Prisma imports, no side effects. All inputs are plain objects.

import type {
  ReviewLogEntry,
  PerformanceTrend,
  StudentPerformanceProfile,
  IntervalAdjustment,
  RetentionMetrics,
  AIEnhancedReviewResult,
} from "./intervalTypes";

// @MX:NOTE: [AUTO] Rating numerical mapping for trend computation: HARD=1, OK=2, EASY=3
const RATING_VALUES: Record<"HARD" | "OK" | "EASY", number> = {
  HARD: 1,
  OK: 2,
  EASY: 3,
};

// @MX:NOTE: [AUTO] Trend detection threshold -- difference of 0.3 between halves triggers trend change
const TREND_THRESHOLD = 0.3;

const MIN_INTERVAL_DAYS = 1;
const MAX_INTERVAL_DAYS = 365;
const MIN_DATA_POINTS = 5;

/**
 * Compute the average of a numeric array.
 * Returns null if the array is empty.
 */
function computeAverage(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sum = values.reduce((acc, v) => acc + v, 0);
  return sum / values.length;
}

/**
 * Determine performance trend by comparing first-half average to second-half average.
 * If secondHalf > firstHalf + threshold: "improving"
 * If secondHalf < firstHalf - threshold: "declining"
 * Otherwise: "stable"
 */
function detectTrend(
  values: readonly number[],
  threshold: number
): PerformanceTrend {
  if (values.length < 2) return "stable";

  const midpoint = Math.floor(values.length / 2);
  const firstHalf = values.slice(0, midpoint);
  const secondHalf = values.slice(midpoint);

  const firstAvg = computeAverage(firstHalf);
  const secondAvg = computeAverage(secondHalf);

  if (firstAvg === null || secondAvg === null) return "stable";

  if (secondAvg > firstAvg + threshold) return "improving";
  if (secondAvg < firstAvg - threshold) return "declining";
  return "stable";
}

/**
 * Analyze student performance from review log history.
 *
 * If fewer than MIN_DATA_POINTS entries, returns a neutral profile
 * with stable trends and default metrics.
 */
export function analyzeStudentPerformance(
  reviewLogs: readonly ReviewLogEntry[]
): StudentPerformanceProfile {
  if (reviewLogs.length < MIN_DATA_POINTS) {
    return {
      averageRatingTrend: "stable",
      responseTimeTrend: "stable",
      retentionRate: 0.5,
      lapseFrequency: 0,
      totalReviews: reviewLogs.length,
      averageResponseTimeMs: null,
    };
  }

  // Compute rating trend from chronological order (oldest first)
  const chronological = [...reviewLogs].sort(
    (a, b) => a.reviewedAt.getTime() - b.reviewedAt.getTime()
  );

  const ratingValues = chronological.map((l) => RATING_VALUES[l.rating]);
  const averageRatingTrend = detectTrend(ratingValues, TREND_THRESHOLD);

  // Compute response time trend (only for entries with response time data)
  // For response time: lower is better, so we invert the trend detection
  const responseTimes = chronological
    .filter((l) => l.responseTimeMs !== null)
    .map((l) => l.responseTimeMs as number);

  let responseTimeTrend: PerformanceTrend = "stable";
  if (responseTimes.length >= 2) {
    const rawTrend = detectTrend(responseTimes, 500);
    // Invert: faster response times (declining numbers) = improving
    if (rawTrend === "declining") responseTimeTrend = "improving";
    else if (rawTrend === "improving") responseTimeTrend = "declining";
    else responseTimeTrend = "stable";
  }

  // Retention rate: fraction of OK or EASY ratings
  const successCount = reviewLogs.filter(
    (l) => l.rating === "OK" || l.rating === "EASY"
  ).length;
  const retentionRate = successCount / reviewLogs.length;

  // Lapse frequency: fraction of HARD ratings in the last 10 reviews
  const recentLogs = chronological.slice(-10);
  const hardCount = recentLogs.filter((l) => l.rating === "HARD").length;
  const lapseFrequency = hardCount / recentLogs.length;

  // Average response time
  const averageResponseTimeMs = computeAverage(responseTimes);

  return {
    averageRatingTrend,
    responseTimeTrend,
    retentionRate,
    lapseFrequency,
    totalReviews: reviewLogs.length,
    averageResponseTimeMs,
  };
}

// @MX:ANCHOR: [AUTO] Core interval adjustment logic -- called by computeAIEnhancedReviewDate
// @MX:REASON: Central decision function for AI-enhanced scheduling; changes affect all review intervals
/**
 * Compute optimal interval adjustment based on student performance profile.
 *
 * Returns the base interval unchanged (with confidence 0) if the student
 * has fewer than MIN_DATA_POINTS reviews.
 *
 * Adjustment rules:
 * - Declining + high lapse (>= 0.4): shorten by 35% (multiply by 0.65)
 * - Declining + moderate lapse (< 0.4): shorten by 20% (multiply by 0.8)
 * - Improving + low lapse (< 0.2): extend by 25% (multiply by 1.25)
 * - Improving + moderate lapse (>= 0.2): extend by 10% (multiply by 1.1)
 * - Stable: no change
 *
 * Interval is clamped to [1, 365] days and rounded to nearest whole day.
 */
export function computeOptimalInterval(
  profile: StudentPerformanceProfile,
  baseIntervalDays: number
): IntervalAdjustment {
  if (profile.totalReviews < MIN_DATA_POINTS) {
    return {
      adjustedIntervalDays: baseIntervalDays,
      confidence: 0,
      reason: "insufficient data",
    };
  }

  let multiplier = 1.0;
  let confidence = 0.5;
  let reason = "stable performance";

  if (profile.averageRatingTrend === "declining") {
    if (profile.lapseFrequency >= 0.4) {
      multiplier = 0.65;
      confidence = 0.7;
      reason = "declining performance with high lapse frequency";
    } else {
      multiplier = 0.8;
      confidence = 0.6;
      reason = "declining performance with moderate lapse frequency";
    }
  } else if (profile.averageRatingTrend === "improving") {
    if (profile.lapseFrequency < 0.2) {
      multiplier = 1.25;
      confidence = 0.7;
      reason = "improving performance with low lapse frequency";
    } else {
      multiplier = 1.1;
      confidence = 0.5;
      reason = "improving performance with moderate lapse frequency";
    }
  }

  const rawInterval = baseIntervalDays * multiplier;
  const clampedInterval = Math.min(
    MAX_INTERVAL_DAYS,
    Math.max(MIN_INTERVAL_DAYS, Math.round(rawInterval))
  );

  return {
    adjustedIntervalDays: clampedInterval,
    confidence,
    reason,
  };
}

/**
 * Calculate retention probability using FSRS-like exponential decay.
 *
 * Formula: probability = exp(-daysSinceReview / stability)
 * - If stability <= 0: returns probability 0
 * - Result is clamped to [0, 1]
 */
export function calculateRetentionProbability(
  daysSinceReview: number,
  stability: number
): RetentionMetrics {
  if (stability <= 0) {
    return {
      probability: 0,
      stability,
      daysSinceReview,
    };
  }

  const rawProbability = Math.exp(-daysSinceReview / stability);
  const probability = Math.min(1, Math.max(0, rawProbability));

  return {
    probability,
    stability,
    daysSinceReview,
  };
}

// @MX:ANCHOR: [AUTO] Main entry point for AI-enhanced review date computation
// @MX:REASON: Called from submitCardReview in reviewActions.ts; orchestrates profile analysis and interval optimization
/**
 * Compute an AI-enhanced review date by analyzing student performance history.
 *
 * This is the main entry point called from submitCardReview.
 * It analyzes the student's review log history, computes an optimal interval,
 * and returns an adjusted date if there is sufficient data.
 *
 * Falls back gracefully: if confidence is 0 (insufficient data),
 * returns the base interval date with wasAdjusted: false.
 */
export function computeAIEnhancedReviewDate(
  baseDate: Date,
  reviewLogs: readonly ReviewLogEntry[],
  baseIntervalDays: number
): AIEnhancedReviewResult {
  const profile = analyzeStudentPerformance(reviewLogs);
  const adjustment = computeOptimalInterval(profile, baseIntervalDays);

  if (adjustment.confidence === 0) {
    const fallbackDate = new Date(baseDate);
    fallbackDate.setDate(fallbackDate.getDate() + baseIntervalDays);
    return {
      adjustedDate: fallbackDate,
      confidence: 0,
      wasAdjusted: false,
    };
  }

  const adjustedDate = new Date(baseDate);
  adjustedDate.setDate(adjustedDate.getDate() + adjustment.adjustedIntervalDays);

  return {
    adjustedDate,
    confidence: adjustment.confidence,
    wasAdjusted: true,
  };
}
