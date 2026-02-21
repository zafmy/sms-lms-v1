// Pure utility functions for gamification computations.
// No Prisma imports, no side effects. All inputs are plain objects.

// XP reward constants
export const XP_LESSON_COMPLETE = 10;
export const XP_QUIZ_SUBMIT = 15;
export const XP_QUIZ_PASS = 25;
export const XP_QUIZ_PERFECT = 50;
export const XP_DAILY_STREAK = 5;
export const XP_STREAK_7_BONUS = 30;
export const XP_COURSE_COMPLETE = 100;

// Level thresholds: index = level, value = minimum XP required
export const LEVEL_THRESHOLDS: readonly number[] = [
  0, 50, 150, 300, 500, 750, 1050, 1400, 1800, 2250,
];

// Find the highest level whose threshold is <= totalXp
// Returns 1-based levels (Level 1 through Level 10)
export function computeLevel(totalXp: number): number {
  let level = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (totalXp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  return level;
}

// Calculate progress toward the next level
export function computeLevelProgress(totalXp: number): {
  level: number;
  currentXp: number;
  nextLevelXp: number;
  percentage: number;
} {
  const level = computeLevel(totalXp);
  const maxLevel = LEVEL_THRESHOLDS.length; // 10 (1-based)
  const levelIndex = level - 1; // Convert to 0-based for array access

  if (level >= maxLevel) {
    return {
      level,
      currentXp: totalXp - LEVEL_THRESHOLDS[levelIndex],
      nextLevelXp: 0,
      percentage: 100,
    };
  }

  const currentThreshold = LEVEL_THRESHOLDS[levelIndex];
  const nextThreshold = LEVEL_THRESHOLDS[levelIndex + 1];
  const xpIntoLevel = totalXp - currentThreshold;
  const xpNeeded = nextThreshold - currentThreshold;

  return {
    level,
    currentXp: xpIntoLevel,
    nextLevelXp: xpNeeded,
    percentage: Math.round((xpIntoLevel / xpNeeded) * 100 * 10) / 10,
  };
}

// Calculate total XP earned for a quiz attempt
// Base XP (15) + pass bonus (25 if passed) + perfect bonus (50 if 100%)
export function computeQuizXp(percentage: number, passScore: number): number {
  let xp = XP_QUIZ_SUBMIT;

  if (percentage >= passScore) {
    xp += XP_QUIZ_PASS;
  }

  if (percentage >= 100) {
    xp += XP_QUIZ_PERFECT;
  }

  return xp;
}

// Evaluate streak based on UTC date comparison
export function evaluateStreak(
  lastActivityDate: Date | null,
  today: Date,
  currentStreak: number
): {
  newStreak: number;
  streakIncremented: boolean;
  isNewDay: boolean;
} {
  if (lastActivityDate === null) {
    return { newStreak: 1, streakIncremented: true, isNewDay: true };
  }

  const todayUTC = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  );
  const lastUTC = new Date(
    Date.UTC(
      lastActivityDate.getUTCFullYear(),
      lastActivityDate.getUTCMonth(),
      lastActivityDate.getUTCDate()
    )
  );

  const diffMs = todayUTC.getTime() - lastUTC.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  // Same day
  if (diffDays === 0) {
    return { newStreak: currentStreak, streakIncremented: false, isNewDay: false };
  }

  // Consecutive day
  if (diffDays === 1) {
    return {
      newStreak: currentStreak + 1,
      streakIncremented: true,
      isNewDay: true,
    };
  }

  // Streak broken (gap > 1 day)
  return { newStreak: 1, streakIncremented: false, isNewDay: true };
}

// Return badges the student qualifies for but does not already have
export function evaluateBadgeEligibility(
  category: string,
  value: number,
  existingBadgeIds: number[],
  allBadges: Array<{ id: number; category: string; threshold: number | null }>
): Array<{ id: number; category: string; threshold: number | null }> {
  const existingSet = new Set(existingBadgeIds);

  return allBadges.filter(
    (badge) =>
      badge.category === category &&
      badge.threshold !== null &&
      value >= badge.threshold &&
      !existingSet.has(badge.id)
  );
}

// Sort students by totalXp descending and assign ranks
export function computeLeaderboardRanking(
  students: Array<{
    studentId: string;
    name: string;
    totalXp: number;
    currentLevel: number;
  }>
): Array<{
  rank: number;
  studentId: string;
  name: string;
  totalXp: number;
  currentLevel: number;
}> {
  const sorted = [...students].sort((a, b) => b.totalXp - a.totalXp);

  return sorted.map((student, index) => ({
    rank: index + 1,
    ...student,
  }));
}

// Sum transaction amounts created on or after weekStart
export function computeWeeklyXp(
  transactions: Array<{ amount: number; createdAt: Date }>,
  weekStart: Date
): number {
  return transactions
    .filter((tx) => tx.createdAt.getTime() >= weekStart.getTime())
    .reduce((sum, tx) => sum + tx.amount, 0);
}
