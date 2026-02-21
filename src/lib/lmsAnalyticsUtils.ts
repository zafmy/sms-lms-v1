// Pure utility functions for LMS analytics computations.
// No Prisma imports, no side effects. All inputs are plain objects.

export interface CourseCompletionResult {
  totalLessons: number;
  completedLessons: number;
  percentage: number;
}

export interface ModuleCompletionResult {
  moduleId: number;
  moduleTitle: string;
  totalLessons: number;
  completedLessons: number;
  percentage: number;
}

export interface QuizScoreResult {
  averagePercentage: number;
  totalAttempts: number;
  passRate: number;
}

export interface EngagementDaysResult {
  daysActive: number;
  totalDays: number;
  activeDates: string[];
}

export interface QuizDifficultyResult {
  averageScore: number;
  passRate: number;
  mostMissedQuestion: string | null;
}

export interface HeatmapDatum {
  date: string;
  count: number;
}

export interface AtRiskResult {
  isAtRisk: boolean;
  reasons: string[];
}

export interface ScoreDistributionBucket {
  range: string;
  count: number;
}

export interface DailyEngagement {
  date: string;
  lessonCompletions: number;
  quizSubmissions: number;
  total: number;
}

export interface AtRiskStudent {
  studentId: string;
  studentName: string;
  lastActivityDate: Date | null;
  daysInactive: number;
}

export const AT_RISK_THRESHOLD_DAYS = 7;

// Compute overall course completion from enrollment modules and progress records
export function computeCourseCompletion(
  enrollmentWithModules: {
    modules: { lessons: { id: number }[] }[];
  },
  progressRecords: { lessonId: number; status: string }[]
): CourseCompletionResult {
  const totalLessons = enrollmentWithModules.modules.reduce(
    (acc, m) => acc + m.lessons.length,
    0
  );

  if (totalLessons === 0) {
    return { totalLessons: 0, completedLessons: 0, percentage: 0 };
  }

  const allLessonIds = new Set(
    enrollmentWithModules.modules.flatMap((m) => m.lessons.map((l) => l.id))
  );

  const completedLessons = progressRecords.filter(
    (p) => p.status === "COMPLETED" && allLessonIds.has(p.lessonId)
  ).length;

  const percentage = Math.round((completedLessons / totalLessons) * 100);

  return { totalLessons, completedLessons, percentage };
}

// Compute per-module completion stats
export function computeModuleCompletion(
  moduleWithLessons: { id: number; title: string; lessons: { id: number }[] },
  progressRecords: { lessonId: number; status: string }[]
): ModuleCompletionResult {
  const totalLessons = moduleWithLessons.lessons.length;

  if (totalLessons === 0) {
    return {
      moduleId: moduleWithLessons.id,
      moduleTitle: moduleWithLessons.title,
      totalLessons: 0,
      completedLessons: 0,
      percentage: 0,
    };
  }

  const lessonIds = new Set(moduleWithLessons.lessons.map((l) => l.id));
  const completedLessons = progressRecords.filter(
    (p) => p.status === "COMPLETED" && lessonIds.has(p.lessonId)
  ).length;

  const percentage = Math.round((completedLessons / totalLessons) * 100);

  return {
    moduleId: moduleWithLessons.id,
    moduleTitle: moduleWithLessons.title,
    totalLessons,
    completedLessons,
    percentage,
  };
}

// Compute average quiz score from submitted attempts
export function computeAverageQuizScore(
  attempts: { percentage: number | null; passed: boolean | null }[]
): QuizScoreResult {
  const submitted = attempts.filter((a) => a.percentage !== null);

  if (submitted.length === 0) {
    return { averagePercentage: 0, totalAttempts: 0, passRate: 0 };
  }

  const total = submitted.reduce((acc, a) => acc + (a.percentage ?? 0), 0);
  const passedCount = submitted.filter((a) => a.passed === true).length;

  return {
    averagePercentage: Math.round(total / submitted.length),
    totalAttempts: submitted.length,
    passRate: Math.round((passedCount / submitted.length) * 100),
  };
}

// Compute number of days with learning activity within a date range
export function computeEngagementDays(
  progressRecords: { completedAt: Date | string | null }[],
  quizAttempts: { submittedAt: Date | string | null }[],
  startDate: Date,
  endDate: Date
): EngagementDaysResult {
  const activeDateSet = new Set<string>();

  for (const p of progressRecords) {
    if (p.completedAt) {
      const d = new Date(p.completedAt);
      if (d >= startDate && d <= endDate) {
        activeDateSet.add(d.toISOString().slice(0, 10));
      }
    }
  }

  for (const a of quizAttempts) {
    if (a.submittedAt) {
      const d = new Date(a.submittedAt);
      if (d >= startDate && d <= endDate) {
        activeDateSet.add(d.toISOString().slice(0, 10));
      }
    }
  }

  const totalDays = Math.max(
    1,
    Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1
  );

  const activeDates = Array.from(activeDateSet).sort();

  return {
    daysActive: activeDates.length,
    totalDays,
    activeDates,
  };
}

// Compute quiz difficulty metrics from attempts with responses
export function computeQuizDifficulty(
  attemptsWithResponses: {
    percentage: number | null;
    passed: boolean | null;
    responses: {
      isCorrect: boolean | null;
      question: { id: number; text: string };
    }[];
  }[]
): QuizDifficultyResult {
  if (attemptsWithResponses.length === 0) {
    return { averageScore: 0, passRate: 0, mostMissedQuestion: null };
  }

  const submitted = attemptsWithResponses.filter(
    (a) => a.percentage !== null
  );

  if (submitted.length === 0) {
    return { averageScore: 0, passRate: 0, mostMissedQuestion: null };
  }

  const avgScore = Math.round(
    submitted.reduce((acc, a) => acc + (a.percentage ?? 0), 0) /
      submitted.length
  );

  const passedCount = submitted.filter((a) => a.passed === true).length;
  const passRate = Math.round((passedCount / submitted.length) * 100);

  // Find most missed question
  const missCountMap = new Map<number, { text: string; misses: number }>();
  for (const attempt of submitted) {
    for (const r of attempt.responses) {
      if (r.isCorrect === false) {
        const existing = missCountMap.get(r.question.id);
        if (existing) {
          existing.misses += 1;
        } else {
          missCountMap.set(r.question.id, {
            text: r.question.text,
            misses: 1,
          });
        }
      }
    }
  }

  let mostMissedQuestion: string | null = null;
  let maxMisses = 0;
  for (const entry of missCountMap.values()) {
    if (entry.misses > maxMisses) {
      maxMisses = entry.misses;
      mostMissedQuestion = entry.text;
    }
  }

  return { averageScore: avgScore, passRate, mostMissedQuestion };
}

// Format seconds into human-readable time string
export function formatTimeSpent(totalSeconds: number): string {
  if (totalSeconds <= 0) {
    return "0m";
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h`;
  }
  return `${minutes}m`;
}

// Compute heatmap data for a calendar year from progress and quiz activity
export function computeHeatmapData(
  progressRecords: { completedAt: Date | string | null }[],
  quizAttempts: { submittedAt: Date | string | null }[]
): HeatmapDatum[] {
  const countMap = new Map<string, number>();

  for (const p of progressRecords) {
    if (p.completedAt) {
      const key = new Date(p.completedAt).toISOString().slice(0, 10);
      countMap.set(key, (countMap.get(key) ?? 0) + 1);
    }
  }

  for (const a of quizAttempts) {
    if (a.submittedAt) {
      const key = new Date(a.submittedAt).toISOString().slice(0, 10);
      countMap.set(key, (countMap.get(key) ?? 0) + 1);
    }
  }

  return Array.from(countMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Categorize student engagement based on recent activity
export function categorizeStudentEngagement(
  progressRecords: { completedAt: Date | string | null }[],
  quizAttempts: { submittedAt: Date | string | null }[],
  windowDays: number = 14
): "engaged" | "inactive" {
  const now = new Date();
  const cutoff = new Date(
    now.getTime() - windowDays * 24 * 60 * 60 * 1000
  );

  const hasRecentProgress = progressRecords.some((p) => {
    if (!p.completedAt) return false;
    return new Date(p.completedAt) >= cutoff;
  });

  const hasRecentQuiz = quizAttempts.some((a) => {
    if (!a.submittedAt) return false;
    return new Date(a.submittedAt) >= cutoff;
  });

  return hasRecentProgress || hasRecentQuiz ? "engaged" : "inactive";
}

// Determine if a student is at risk based on activity and quiz performance
export function computeAtRiskStatus(
  progressRecords: { completedAt: Date | string | null }[],
  quizAttempts: {
    submittedAt: Date | string | null;
    passed: boolean | null;
  }[],
  averageQuizPct: number
): AtRiskResult {
  const reasons: string[] = [];

  // Check inactivity (no activity in 14 days)
  const engagement = categorizeStudentEngagement(
    progressRecords,
    quizAttempts,
    14
  );
  if (engagement === "inactive") {
    reasons.push("No learning activity in the past 14 days");
  }

  // Check low quiz performance
  if (averageQuizPct > 0 && averageQuizPct < 60) {
    reasons.push(`Average quiz score is ${averageQuizPct}%, below 60% threshold`);
  }

  // Check repeated quiz failures
  const submittedAttempts = quizAttempts.filter((a) => a.submittedAt !== null);
  if (submittedAttempts.length >= 3) {
    const failedCount = submittedAttempts.filter(
      (a) => a.passed === false
    ).length;
    const failRate =
      submittedAttempts.length > 0
        ? Math.round((failedCount / submittedAttempts.length) * 100)
        : 0;
    if (failRate >= 50) {
      reasons.push(
        `Failed ${failRate}% of quiz attempts (${failedCount}/${submittedAttempts.length})`
      );
    }
  }

  return {
    isAtRisk: reasons.length > 0,
    reasons,
  };
}

// Bucket quiz attempt scores into 5 percentage ranges
export function calculateQuizScoreDistribution(
  attempts: { percentage: number | null }[]
): ScoreDistributionBucket[] {
  const buckets: ScoreDistributionBucket[] = [
    { range: "0-20%", count: 0 },
    { range: "21-40%", count: 0 },
    { range: "41-60%", count: 0 },
    { range: "61-80%", count: 0 },
    { range: "81-100%", count: 0 },
  ];

  for (const attempt of attempts) {
    if (attempt.percentage === null) {
      continue;
    }

    const pct = attempt.percentage;
    if (pct <= 20) {
      buckets[0].count += 1;
    } else if (pct <= 40) {
      buckets[1].count += 1;
    } else if (pct <= 60) {
      buckets[2].count += 1;
    } else if (pct <= 80) {
      buckets[3].count += 1;
    } else {
      buckets[4].count += 1;
    }
  }

  return buckets;
}

// Calculate daily engagement totals for a date range
export function calculateEngagementByDay(
  lessonProgressRecords: { completedAt: Date | null }[],
  quizAttempts: { submittedAt: Date | null }[],
  startDate: Date,
  endDate: Date
): DailyEngagement[] {
  const dayMap = new Map<string, { lessons: number; quizzes: number }>();

  // Initialize every day in the range
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  while (current <= end) {
    const key = current.toISOString().slice(0, 10);
    dayMap.set(key, { lessons: 0, quizzes: 0 });
    current.setDate(current.getDate() + 1);
  }

  // Count lesson completions
  for (const record of lessonProgressRecords) {
    if (record.completedAt) {
      const key = new Date(record.completedAt).toISOString().slice(0, 10);
      const entry = dayMap.get(key);
      if (entry) {
        entry.lessons += 1;
      }
    }
  }

  // Count quiz submissions
  for (const attempt of quizAttempts) {
    if (attempt.submittedAt) {
      const key = new Date(attempt.submittedAt).toISOString().slice(0, 10);
      const entry = dayMap.get(key);
      if (entry) {
        entry.quizzes += 1;
      }
    }
  }

  return Array.from(dayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, counts]) => ({
      date,
      lessonCompletions: counts.lessons,
      quizSubmissions: counts.quizzes,
      total: counts.lessons + counts.quizzes,
    }));
}

// Identify students who have been inactive for N or more days
export function identifyAtRiskStudents(
  enrollments: { studentId: string; studentName: string }[],
  lessonProgressRecords: {
    studentId: string;
    completedAt: Date | null;
    startedAt: Date | null;
  }[],
  quizAttempts: {
    studentId: string;
    submittedAt: Date | null;
    startedAt: Date;
  }[],
  thresholdDays: number = AT_RISK_THRESHOLD_DAYS,
  referenceDate: Date = new Date()
): AtRiskStudent[] {
  const lastActivityMap = new Map<string, Date | null>();

  // Initialize all enrolled students with null
  for (const enrollment of enrollments) {
    lastActivityMap.set(enrollment.studentId, null);
  }

  // Find most recent activity from lesson progress
  for (const record of lessonProgressRecords) {
    if (!lastActivityMap.has(record.studentId)) {
      continue;
    }

    const dates: Date[] = [];
    if (record.completedAt) {
      dates.push(new Date(record.completedAt));
    }

    for (const d of dates) {
      const current = lastActivityMap.get(record.studentId) ?? null;
      if (current === null || d > current) {
        lastActivityMap.set(record.studentId, d);
      }
    }
  }

  // Find most recent activity from quiz attempts
  for (const attempt of quizAttempts) {
    if (!lastActivityMap.has(attempt.studentId)) {
      continue;
    }

    const dates: Date[] = [];
    if (attempt.submittedAt) {
      dates.push(new Date(attempt.submittedAt));
    }

    for (const d of dates) {
      const current = lastActivityMap.get(attempt.studentId) ?? null;
      if (current === null || d > current) {
        lastActivityMap.set(attempt.studentId, d);
      }
    }
  }

  // Build results
  const results: AtRiskStudent[] = [];
  const refTime = referenceDate.getTime();

  for (const enrollment of enrollments) {
    const lastActivity = lastActivityMap.get(enrollment.studentId) ?? null;

    let daysInactive: number;
    if (lastActivity === null) {
      daysInactive = 999;
    } else {
      daysInactive = Math.floor(
        (refTime - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    if (daysInactive >= thresholdDays) {
      results.push({
        studentId: enrollment.studentId,
        studentName: enrollment.studentName,
        lastActivityDate: lastActivity,
        daysInactive,
      });
    }
  }

  // Sort by daysInactive descending
  results.sort((a, b) => b.daysInactive - a.daysInactive);

  return results;
}
