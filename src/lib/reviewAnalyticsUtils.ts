// Pure utility functions for review analytics computations.
// No Prisma imports, no side effects.

export interface ReviewSessionData {
  id: number;
  completedAt: Date | null;
  totalCards: number;
  correctCards: number;
  xpEarned: number;
}

export interface StudentReviewData {
  studentId: string;
  studentName: string;
  sessionsCompleted: number;
  totalCards: number;
  masteredCards: number; // Box 4-5
  averageCorrectRate: number;
  lastSessionDate: Date | null;
}

export interface StruggledCardData {
  cardId: number;
  front: string;
  hardCount: number;
  totalReviews: number;
  hardRate: number;
}

export interface ReviewHeatmapEntry {
  date: string; // YYYY-MM-DD
  count: number;
}

// Completion rate: completed sessions / expected sessions in date range
export function computeReviewCompletionRate(
  sessions: ReviewSessionData[],
  startDate: Date,
  endDate: Date
): number {
  const completed = sessions.filter(
    (s) =>
      s.completedAt &&
      s.completedAt >= startDate &&
      s.completedAt <= endDate
  ).length;
  // Expected = number of weekends in range
  const totalDays = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const expectedWeekends = Math.max(1, Math.ceil(totalDays / 7));
  return completed > 0
    ? Math.min(100, Math.round((completed / expectedWeekends) * 100))
    : 0;
}

// Class-level review stats
export function computeClassReviewStats(students: StudentReviewData[]): {
  avgCompletion: number;
  avgMastery: number;
  totalSessions: number;
  activeStudents: number;
} {
  if (students.length === 0) {
    return { avgCompletion: 0, avgMastery: 0, totalSessions: 0, activeStudents: 0 };
  }

  const totalSessions = students.reduce((s, st) => s + st.sessionsCompleted, 0);
  const activeStudents = students.filter((s) => s.sessionsCompleted > 0).length;

  const avgMastery =
    students.reduce((s, st) => {
      const total = st.totalCards;
      return s + (total > 0 ? (st.masteredCards / total) * 100 : 0);
    }, 0) / students.length;

  const avgCompletion =
    students.reduce((s, st) => s + st.averageCorrectRate, 0) / students.length;

  return {
    avgCompletion: Math.round(avgCompletion),
    avgMastery: Math.round(avgMastery),
    totalSessions,
    activeStudents,
  };
}

// Cards sorted by HARD rating frequency
export function identifyStruggledCards(
  logs: Array<{
    reviewCardId: number;
    rating: string;
    reviewCard?: { front: string };
  }>
): StruggledCardData[] {
  const cardMap = new Map<
    number,
    { front: string; hardCount: number; totalReviews: number }
  >();

  for (const log of logs) {
    const existing = cardMap.get(log.reviewCardId) ?? {
      front: log.reviewCard?.front ?? "",
      hardCount: 0,
      totalReviews: 0,
    };
    existing.totalReviews++;
    if (log.rating === "HARD") {
      existing.hardCount++;
    }
    cardMap.set(log.reviewCardId, existing);
  }

  return Array.from(cardMap.entries())
    .map(([cardId, data]) => ({
      cardId,
      front: data.front,
      hardCount: data.hardCount,
      totalReviews: data.totalReviews,
      hardRate:
        data.totalReviews > 0
          ? Math.round((data.hardCount / data.totalReviews) * 100)
          : 0,
    }))
    .filter((c) => c.hardCount > 0)
    .sort((a, b) => b.hardRate - a.hardRate)
    .slice(0, 10);
}

// Daily review counts for heatmap
export function computeReviewHeatmapData(
  logs: Array<{ reviewedAt: Date }>
): ReviewHeatmapEntry[] {
  const dateMap = new Map<string, number>();

  for (const log of logs) {
    const d = new Date(log.reviewedAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    dateMap.set(key, (dateMap.get(key) ?? 0) + 1);
  }

  return Array.from(dateMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// School-wide metrics
export function computeSchoolWideReviewMetrics(
  students: StudentReviewData[]
): {
  adoptionRate: number;
  avgMastery: number;
  totalSessions: number;
  totalStudents: number;
  activeStudents: number;
} {
  const totalStudents = students.length;
  const activeStudents = students.filter(
    (s) => s.sessionsCompleted > 0
  ).length;
  const adoptionRate =
    totalStudents > 0
      ? Math.round((activeStudents / totalStudents) * 100)
      : 0;
  const stats = computeClassReviewStats(students);

  return {
    adoptionRate,
    avgMastery: stats.avgMastery,
    totalSessions: stats.totalSessions,
    totalStudents,
    activeStudents,
  };
}
