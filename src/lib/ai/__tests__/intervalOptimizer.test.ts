import { describe, it, expect } from "vitest";
import {
  analyzeStudentPerformance,
  computeOptimalInterval,
  calculateRetentionProbability,
  computeAIEnhancedReviewDate,
} from "../intervalOptimizer";
import type {
  ReviewLogEntry,
  StudentPerformanceProfile,
} from "../intervalTypes";

// Helper: create a ReviewLogEntry with defaults
function makeLog(
  overrides: Partial<ReviewLogEntry> & { rating: "HARD" | "OK" | "EASY" }
): ReviewLogEntry {
  return {
    previousBox: 1,
    newBox: 2,
    responseTimeMs: 5000,
    reviewedAt: new Date("2026-01-15"),
    ...overrides,
  };
}

// Helper: create N logs with a specific rating pattern
function makeLogSequence(
  ratings: Array<"HARD" | "OK" | "EASY">,
  startDate: Date = new Date("2026-01-01")
): ReviewLogEntry[] {
  return ratings.map((rating, i) => {
    const reviewedAt = new Date(startDate);
    reviewedAt.setDate(reviewedAt.getDate() + i);
    return makeLog({ rating, reviewedAt });
  });
}

// ---------------------------------------------------------------------------
// analyzeStudentPerformance
// ---------------------------------------------------------------------------

describe("analyzeStudentPerformance", () => {
  it("returns neutral profile for empty input", () => {
    const profile = analyzeStudentPerformance([]);
    expect(profile.averageRatingTrend).toBe("stable");
    expect(profile.responseTimeTrend).toBe("stable");
    expect(profile.retentionRate).toBe(0.5);
    expect(profile.lapseFrequency).toBe(0);
    expect(profile.totalReviews).toBe(0);
    expect(profile.averageResponseTimeMs).toBeNull();
  });

  it("returns neutral profile for fewer than 5 entries", () => {
    const logs = makeLogSequence(["OK", "OK", "HARD", "EASY"]);
    const profile = analyzeStudentPerformance(logs);
    expect(profile.averageRatingTrend).toBe("stable");
    expect(profile.retentionRate).toBe(0.5);
    expect(profile.lapseFrequency).toBe(0);
    expect(profile.totalReviews).toBe(4);
  });

  it("detects improving trend when later ratings are higher", () => {
    // First half: HARD, HARD, HARD (avg 1.0)
    // Second half: EASY, EASY, EASY (avg 3.0)
    const logs = makeLogSequence([
      "HARD",
      "HARD",
      "HARD",
      "EASY",
      "EASY",
      "EASY",
    ]);
    const profile = analyzeStudentPerformance(logs);
    expect(profile.averageRatingTrend).toBe("improving");
  });

  it("detects declining trend when later ratings are lower", () => {
    // First half: EASY, EASY, EASY (avg 3.0)
    // Second half: HARD, HARD, HARD (avg 1.0)
    const logs = makeLogSequence([
      "EASY",
      "EASY",
      "EASY",
      "HARD",
      "HARD",
      "HARD",
    ]);
    const profile = analyzeStudentPerformance(logs);
    expect(profile.averageRatingTrend).toBe("declining");
  });

  it("detects stable trend when ratings are consistent", () => {
    const logs = makeLogSequence(["OK", "OK", "OK", "OK", "OK"]);
    const profile = analyzeStudentPerformance(logs);
    expect(profile.averageRatingTrend).toBe("stable");
  });

  it("calculates retention rate correctly", () => {
    // 4 OK + 1 HARD out of 5 => 0.8
    const logs = makeLogSequence(["OK", "OK", "HARD", "OK", "OK"]);
    const profile = analyzeStudentPerformance(logs);
    expect(profile.retentionRate).toBe(0.8);
  });

  it("calculates lapse frequency from last 10 reviews", () => {
    // 12 reviews total, last 10 contain 3 HARD
    const ratings: Array<"HARD" | "OK" | "EASY"> = [
      "OK",
      "OK", // first 2 (outside last 10)
      "HARD",
      "OK",
      "OK",
      "EASY",
      "HARD",
      "OK",
      "EASY",
      "OK",
      "HARD",
      "OK",
    ];
    const logs = makeLogSequence(ratings);
    const profile = analyzeStudentPerformance(logs);
    expect(profile.lapseFrequency).toBe(0.3); // 3 HARD in last 10
  });

  it("calculates average response time from non-null entries", () => {
    const logs: ReviewLogEntry[] = [
      makeLog({ rating: "OK", responseTimeMs: 2000, reviewedAt: new Date("2026-01-01") }),
      makeLog({ rating: "OK", responseTimeMs: 4000, reviewedAt: new Date("2026-01-02") }),
      makeLog({ rating: "OK", responseTimeMs: null, reviewedAt: new Date("2026-01-03") }),
      makeLog({ rating: "OK", responseTimeMs: 6000, reviewedAt: new Date("2026-01-04") }),
      makeLog({ rating: "OK", responseTimeMs: 8000, reviewedAt: new Date("2026-01-05") }),
    ];
    const profile = analyzeStudentPerformance(logs);
    expect(profile.averageResponseTimeMs).toBe(5000); // (2000+4000+6000+8000)/4
  });

  it("detects improving response time trend (faster over time)", () => {
    // Response times decrease: 10000, 9000, 8000 -> 3000, 2000, 1000
    const logs: ReviewLogEntry[] = [
      makeLog({ rating: "OK", responseTimeMs: 10000, reviewedAt: new Date("2026-01-01") }),
      makeLog({ rating: "OK", responseTimeMs: 9000, reviewedAt: new Date("2026-01-02") }),
      makeLog({ rating: "OK", responseTimeMs: 8000, reviewedAt: new Date("2026-01-03") }),
      makeLog({ rating: "OK", responseTimeMs: 3000, reviewedAt: new Date("2026-01-04") }),
      makeLog({ rating: "OK", responseTimeMs: 2000, reviewedAt: new Date("2026-01-05") }),
      makeLog({ rating: "OK", responseTimeMs: 1000, reviewedAt: new Date("2026-01-06") }),
    ];
    const profile = analyzeStudentPerformance(logs);
    expect(profile.responseTimeTrend).toBe("improving");
  });

  it("returns null averageResponseTimeMs when all entries have null response times", () => {
    const logs = makeLogSequence(["OK", "OK", "OK", "OK", "OK"]).map((l) => ({
      ...l,
      responseTimeMs: null,
    }));
    const profile = analyzeStudentPerformance(logs);
    expect(profile.averageResponseTimeMs).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// computeOptimalInterval
// ---------------------------------------------------------------------------

describe("computeOptimalInterval", () => {
  const stableProfile: StudentPerformanceProfile = {
    averageRatingTrend: "stable",
    responseTimeTrend: "stable",
    retentionRate: 0.7,
    lapseFrequency: 0.2,
    totalReviews: 20,
    averageResponseTimeMs: 5000,
  };

  it("returns base interval unchanged with confidence 0 for insufficient data", () => {
    const profile: StudentPerformanceProfile = {
      ...stableProfile,
      totalReviews: 3,
    };
    const result = computeOptimalInterval(profile, 14);
    expect(result.adjustedIntervalDays).toBe(14);
    expect(result.confidence).toBe(0);
    expect(result.reason).toBe("insufficient data");
  });

  it("shortens interval for declining performance with high lapse", () => {
    const profile: StudentPerformanceProfile = {
      ...stableProfile,
      averageRatingTrend: "declining",
      lapseFrequency: 0.5,
    };
    const result = computeOptimalInterval(profile, 14);
    // 14 * 0.65 = 9.1 -> rounded to 9
    expect(result.adjustedIntervalDays).toBe(9);
    expect(result.confidence).toBe(0.7);
  });

  it("shortens interval moderately for declining performance with moderate lapse", () => {
    const profile: StudentPerformanceProfile = {
      ...stableProfile,
      averageRatingTrend: "declining",
      lapseFrequency: 0.3,
    };
    const result = computeOptimalInterval(profile, 14);
    // 14 * 0.8 = 11.2 -> rounded to 11
    expect(result.adjustedIntervalDays).toBe(11);
    expect(result.confidence).toBe(0.6);
  });

  it("extends interval for improving performance with low lapse", () => {
    const profile: StudentPerformanceProfile = {
      ...stableProfile,
      averageRatingTrend: "improving",
      lapseFrequency: 0.1,
    };
    const result = computeOptimalInterval(profile, 14);
    // 14 * 1.25 = 17.5 -> rounded to 18
    expect(result.adjustedIntervalDays).toBe(18);
    expect(result.confidence).toBe(0.7);
  });

  it("extends interval slightly for improving performance with moderate lapse", () => {
    const profile: StudentPerformanceProfile = {
      ...stableProfile,
      averageRatingTrend: "improving",
      lapseFrequency: 0.25,
    };
    const result = computeOptimalInterval(profile, 14);
    // 14 * 1.1 = 15.4 -> rounded to 15
    expect(result.adjustedIntervalDays).toBe(15);
    expect(result.confidence).toBe(0.5);
  });

  it("returns base interval unchanged for stable performance", () => {
    const result = computeOptimalInterval(stableProfile, 14);
    expect(result.adjustedIntervalDays).toBe(14);
    expect(result.confidence).toBe(0.5);
    expect(result.reason).toBe("stable performance");
  });

  it("never returns interval less than 1 day", () => {
    const profile: StudentPerformanceProfile = {
      ...stableProfile,
      averageRatingTrend: "declining",
      lapseFrequency: 0.9,
    };
    const result = computeOptimalInterval(profile, 1);
    // 1 * 0.65 = 0.65 -> rounded to 1 (clamped)
    expect(result.adjustedIntervalDays).toBeGreaterThanOrEqual(1);
  });

  it("never returns interval more than 365 days", () => {
    const profile: StudentPerformanceProfile = {
      ...stableProfile,
      averageRatingTrend: "improving",
      lapseFrequency: 0.0,
    };
    const result = computeOptimalInterval(profile, 400);
    // 400 * 1.25 = 500 -> clamped to 365
    expect(result.adjustedIntervalDays).toBeLessThanOrEqual(365);
  });

  it("rounds to nearest whole day", () => {
    const profile: StudentPerformanceProfile = {
      ...stableProfile,
      averageRatingTrend: "improving",
      lapseFrequency: 0.1,
    };
    const result = computeOptimalInterval(profile, 7);
    // 7 * 1.25 = 8.75 -> rounded to 9
    expect(result.adjustedIntervalDays).toBe(9);
    expect(Number.isInteger(result.adjustedIntervalDays)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// calculateRetentionProbability
// ---------------------------------------------------------------------------

describe("calculateRetentionProbability", () => {
  it("returns probability ~1.0 for 0 days since review", () => {
    const result = calculateRetentionProbability(0, 10);
    expect(result.probability).toBeCloseTo(1.0, 5);
    expect(result.daysSinceReview).toBe(0);
    expect(result.stability).toBe(10);
  });

  it("returns value between 0 and 1 for normal inputs", () => {
    const result = calculateRetentionProbability(5, 10);
    expect(result.probability).toBeGreaterThan(0);
    expect(result.probability).toBeLessThan(1);
    // exp(-5/10) = exp(-0.5) ~ 0.6065
    expect(result.probability).toBeCloseTo(0.6065, 3);
  });

  it("returns probability 0 for stability <= 0", () => {
    const result = calculateRetentionProbability(5, 0);
    expect(result.probability).toBe(0);
  });

  it("returns probability 0 for negative stability", () => {
    const result = calculateRetentionProbability(5, -3);
    expect(result.probability).toBe(0);
  });

  it("handles very large daysSinceReview (probability approaches 0)", () => {
    const result = calculateRetentionProbability(10000, 10);
    expect(result.probability).toBeCloseTo(0, 5);
    expect(result.probability).toBeGreaterThanOrEqual(0);
  });

  it("returns higher probability for higher stability", () => {
    const lowStability = calculateRetentionProbability(10, 5);
    const highStability = calculateRetentionProbability(10, 50);
    expect(highStability.probability).toBeGreaterThan(lowStability.probability);
  });
});

// ---------------------------------------------------------------------------
// computeAIEnhancedReviewDate
// ---------------------------------------------------------------------------

describe("computeAIEnhancedReviewDate", () => {
  const baseDate = new Date("2026-02-01T00:00:00Z");

  it("returns wasAdjusted: false for fewer than 5 review logs", () => {
    const logs = makeLogSequence(["OK", "OK", "HARD"]);
    const result = computeAIEnhancedReviewDate(baseDate, logs, 14);
    expect(result.wasAdjusted).toBe(false);
    expect(result.confidence).toBe(0);
    // Should be baseDate + 14 days
    const expectedDate = new Date(baseDate);
    expectedDate.setDate(expectedDate.getDate() + 14);
    expect(result.adjustedDate.getTime()).toBe(expectedDate.getTime());
  });

  it("returns wasAdjusted: true for improving student with enough data", () => {
    // HARD first, then EASY -- improving trend
    const logs = makeLogSequence([
      "HARD",
      "HARD",
      "HARD",
      "EASY",
      "EASY",
      "EASY",
    ]);
    const result = computeAIEnhancedReviewDate(baseDate, logs, 14);
    expect(result.wasAdjusted).toBe(true);
    expect(result.confidence).toBeGreaterThan(0);
  });

  it("returns later date for improving student", () => {
    const logs = makeLogSequence([
      "HARD",
      "HARD",
      "HARD",
      "EASY",
      "EASY",
      "EASY",
    ]);
    const result = computeAIEnhancedReviewDate(baseDate, logs, 14);
    const baseEndDate = new Date(baseDate);
    baseEndDate.setDate(baseEndDate.getDate() + 14);
    expect(result.adjustedDate.getTime()).toBeGreaterThan(baseEndDate.getTime());
  });

  it("returns earlier date for declining student", () => {
    const logs = makeLogSequence([
      "EASY",
      "EASY",
      "EASY",
      "HARD",
      "HARD",
      "HARD",
    ]);
    const result = computeAIEnhancedReviewDate(baseDate, logs, 14);
    const baseEndDate = new Date(baseDate);
    baseEndDate.setDate(baseEndDate.getDate() + 14);
    expect(result.adjustedDate.getTime()).toBeLessThan(baseEndDate.getTime());
    expect(result.wasAdjusted).toBe(true);
  });

  it("returns base interval date for stable student", () => {
    const logs = makeLogSequence(["OK", "OK", "OK", "OK", "OK"]);
    const result = computeAIEnhancedReviewDate(baseDate, logs, 14);
    const expectedDate = new Date(baseDate);
    expectedDate.setDate(expectedDate.getDate() + 14);
    expect(result.adjustedDate.getTime()).toBe(expectedDate.getTime());
    // Stable performance still counts as adjusted (confidence > 0)
    expect(result.confidence).toBe(0.5);
  });

  it("does not mutate the input baseDate", () => {
    const originalTime = baseDate.getTime();
    const logs = makeLogSequence(["OK", "OK", "OK", "OK", "OK"]);
    computeAIEnhancedReviewDate(baseDate, logs, 14);
    expect(baseDate.getTime()).toBe(originalTime);
  });
});
