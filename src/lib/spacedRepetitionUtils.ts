// Pure utility functions for spaced repetition computations.
// No Prisma imports, no side effects. All inputs are plain objects.

// Re-export review XP constants from gamificationUtils
export {
  XP_REVIEW_CORRECT,
  XP_REVIEW_HARD_BONUS,
  XP_REVIEW_SESSION_COMPLETE,
  XP_MASTERY_BONUS,
} from "./gamificationUtils";

// Types using string literals matching Prisma enums (do NOT import from @prisma/client)
export type ReviewRating = "HARD" | "OK" | "EASY";

export interface BoxPromotionResult {
  newBox: number;
  newEF: number;
  newConsecutiveCorrect: number;
}

export interface ReviewCardForQueue {
  id: number;
  nextReviewDate: Date;
  leitnerBox: number;
  reviewCount: number;
  isActive: boolean;
}

export interface SubjectMasteryEntry {
  subjectId: number;
  leitnerBox: number;
}

// Compute Leitner box promotion based on rating
export function computeBoxPromotion(
  currentBox: number,
  rating: ReviewRating,
  consecutiveCorrect: number,
  easinessFactor: number
): BoxPromotionResult {
  switch (rating) {
    case "HARD":
      return {
        newBox: 1,
        newEF: Math.max(1.3, easinessFactor - 0.3),
        newConsecutiveCorrect: 0,
      };

    case "OK": {
      const newConsecutiveCorrect = consecutiveCorrect + 1;
      const promoted =
        newConsecutiveCorrect >= 2
          ? Math.min(currentBox + 1, 5)
          : currentBox;
      return {
        newBox: promoted,
        newEF: Math.max(1.3, easinessFactor - 0.1),
        newConsecutiveCorrect,
      };
    }

    case "EASY": {
      const jump = easinessFactor >= 2.5 ? 2 : 1;
      return {
        newBox: Math.min(currentBox + jump, 5),
        newEF: easinessFactor + 0.15,
        newConsecutiveCorrect: 0,
      };
    }
  }
}

// Return the next Saturday after the given date.
// If the date IS a Saturday, return the NEXT Saturday (7 days later).
export function getNextSaturday(date: Date): Date {
  const result = new Date(date);
  const dayOfWeek = result.getDay(); // 0=Sun, 6=Sat
  const daysUntilSaturday = dayOfWeek === 6 ? 7 : (6 - dayOfWeek + 7) % 7 || 7;
  result.setDate(result.getDate() + daysUntilSaturday);
  result.setHours(0, 0, 0, 0);
  return result;
}

// Compute the next review date based on the Leitner box
// Box intervals mapped to weekend count:
// Box 1: 1st weekend, Box 2: 2nd weekend, Box 3: 4th weekend,
// Box 4: 8th weekend, Box 5: 24th weekend
export function computeNextReviewDate(box: number, referenceDate: Date): Date {
  const nextSat = getNextSaturday(referenceDate);

  const additionalDaysMap: Record<number, number> = {
    1: 0,     // 1st weekend
    2: 7,     // 2nd weekend
    3: 21,    // 4th weekend
    4: 49,    // 8th weekend
    5: 161,   // 24th weekend
  };

  const additionalDays = additionalDaysMap[box] ?? 0;
  const result = new Date(nextSat);
  result.setDate(result.getDate() + additionalDays);
  return result;
}

// Build a review queue from available cards, sorted by priority
export function buildReviewQueue(
  cards: ReviewCardForQueue[],
  maxCards: number = 15
): ReviewCardForQueue[] {
  const activeCards = cards.filter((c) => c.isActive);
  const now = new Date();
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const overdue: ReviewCardForQueue[] = [];
  const due: ReviewCardForQueue[] = [];
  const future: ReviewCardForQueue[] = [];

  for (const card of activeCards) {
    const cardDate = new Date(card.nextReviewDate);
    const cardDateStart = new Date(
      cardDate.getFullYear(),
      cardDate.getMonth(),
      cardDate.getDate()
    );

    if (cardDateStart.getTime() < todayStart.getTime()) {
      overdue.push(card);
    } else if (cardDateStart.getTime() === todayStart.getTime()) {
      due.push(card);
    } else if (card.reviewCount === 0) {
      // New cards (never reviewed) can fill remaining slots
      future.push(card);
    }
  }

  // Sort overdue by oldest first
  overdue.sort(
    (a, b) =>
      new Date(a.nextReviewDate).getTime() -
      new Date(b.nextReviewDate).getTime()
  );

  // Sort due by lowest box first
  due.sort((a, b) => a.leitnerBox - b.leitnerBox);

  // Sort future by nextReviewDate ascending
  future.sort(
    (a, b) =>
      new Date(a.nextReviewDate).getTime() -
      new Date(b.nextReviewDate).getTime()
  );

  const result: ReviewCardForQueue[] = [];
  for (const card of [...overdue, ...due, ...future]) {
    if (result.length >= maxCards) break;
    result.push(card);
  }

  return result;
}

// Compute mastery percentage per subject
// Mastery = cards in Box 4 or 5 / total cards * 100
export function computeSubjectMastery(
  cards: SubjectMasteryEntry[]
): Map<number, number> {
  const subjectTotals = new Map<number, { total: number; mastered: number }>();

  for (const card of cards) {
    const entry = subjectTotals.get(card.subjectId) ?? {
      total: 0,
      mastered: 0,
    };
    entry.total += 1;
    if (card.leitnerBox >= 4) {
      entry.mastered += 1;
    }
    subjectTotals.set(card.subjectId, entry);
  }

  const result = new Map<number, number>();
  for (const [subjectId, { total, mastered }] of subjectTotals) {
    result.set(subjectId, total > 0 ? (mastered / total) * 100 : 0);
  }

  return result;
}

// Compute card distribution across boxes [box1, box2, box3, box4, box5]
export function computeCardDistribution(
  cards: { leitnerBox: number }[]
): number[] {
  const distribution = [0, 0, 0, 0, 0];
  for (const card of cards) {
    const index = card.leitnerBox - 1;
    if (index >= 0 && index < 5) {
      distribution[index] += 1;
    }
  }
  return distribution;
}

// Estimate review time in seconds (45 seconds per card)
export function estimateReviewTime(cardCount: number): number {
  return cardCount * 45;
}
