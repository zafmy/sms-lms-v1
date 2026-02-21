import prisma from "@/lib/prisma";
import {
  computeModuleCompletion,
  calculateQuizScoreDistribution,
  calculateEngagementByDay,
  identifyAtRiskStudents,
  computeAverageQuizScore,
} from "@/lib/lmsAnalyticsUtils";
import CompletionRateChart from "@/components/CompletionRateChart";
import QuizScoreDistribution from "@/components/QuizScoreDistribution";
import LmsEngagementHeatmap from "@/components/LmsEngagementHeatmap";
import CourseActivityTimeline from "@/components/CourseActivityTimeline";
import AtRiskStudentsList from "@/components/AtRiskStudentsList";

const CourseAnalyticsContainer = async ({
  courseId,
}: {
  courseId: number;
}) => {
  // 1. Course with modules, lessons, and quiz IDs
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              quizzes: { select: { id: true } },
            },
          },
        },
      },
    },
  });

  if (!course) {
    return (
      <p className="text-gray-400 text-sm">Course not found.</p>
    );
  }

  // Collect all lesson and quiz IDs
  const lessonIds = course.modules.flatMap((m) =>
    m.lessons.map((l) => l.id)
  );
  const quizIds = course.modules.flatMap((m) =>
    m.lessons.flatMap((l) => l.quizzes.map((q) => q.id))
  );

  // 2-4. Parallel data fetching
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 89);
  ninetyDaysAgo.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const [enrollments, progressRecords, quizAttempts] = await Promise.all([
    // 2. Enrollments with student names
    prisma.enrollment.findMany({
      where: { courseId },
      select: {
        studentId: true,
        status: true,
        student: { select: { name: true, surname: true } },
      },
    }),
    // 3. Lesson progress for all lessons
    lessonIds.length > 0
      ? prisma.lessonProgress.findMany({
          where: { lessonId: { in: lessonIds } },
          select: {
            studentId: true,
            lessonId: true,
            status: true,
            completedAt: true,
            startedAt: true,
          },
        })
      : Promise.resolve([]),
    // 4. Quiz attempts for all quizzes
    quizIds.length > 0
      ? prisma.quizAttempt.findMany({
          where: { quizId: { in: quizIds } },
          select: {
            studentId: true,
            percentage: true,
            passed: true,
            submittedAt: true,
            startedAt: true,
          },
        })
      : Promise.resolve([]),
  ]);

  // Enrollment status counts
  const activeEnrollments = enrollments.filter((e) => e.status === "ACTIVE");
  const completedCount = enrollments.filter(
    (e) => e.status === "COMPLETED"
  ).length;
  const droppedCount = enrollments.filter(
    (e) => e.status === "DROPPED"
  ).length;

  // Overall completion rate
  const totalLessons = lessonIds.length;
  const totalCompletedProgress = progressRecords.filter(
    (p) => p.status === "COMPLETED"
  ).length;
  const avgCompletionRate =
    totalLessons > 0 && activeEnrollments.length > 0
      ? Math.round(
          (totalCompletedProgress /
            (totalLessons * activeEnrollments.length)) *
            100
        )
      : 0;

  // Per-module completion rates
  const moduleCompletionData = course.modules.map((m) =>
    computeModuleCompletion(
      { id: m.id, title: m.title, lessons: m.lessons },
      progressRecords
    )
  );
  const moduleChartData = moduleCompletionData.map((m) => ({
    moduleTitle: m.moduleTitle,
    percentage: m.percentage,
  }));

  // Quiz score distribution
  const quizAttemptsWithNumber = quizAttempts.map((a) => ({
    ...a,
    percentage: a.percentage !== null ? Number(a.percentage) : null,
  }));
  const distributionData = calculateQuizScoreDistribution(
    quizAttemptsWithNumber
  );

  // Average quiz score
  const quizScoreResult = computeAverageQuizScore(
    quizAttemptsWithNumber.map((a) => ({
      percentage: a.percentage,
      passed: a.passed,
    }))
  );

  // Daily engagement data (90 days)
  const dailyData = calculateEngagementByDay(
    progressRecords.map((p) => ({ completedAt: p.completedAt })),
    quizAttempts.map((a) => ({ submittedAt: a.submittedAt })),
    ninetyDaysAgo,
    today
  );

  // At-risk students (from active enrollments only)
  const activeStudentEnrollments = activeEnrollments.map((e) => ({
    studentId: e.studentId,
    studentName: `${e.student.name} ${e.student.surname}`,
  }));
  const atRiskStudents = identifyAtRiskStudents(
    activeStudentEnrollments,
    progressRecords.map((p) => ({
      studentId: p.studentId,
      completedAt: p.completedAt,
      startedAt: p.startedAt,
    })),
    quizAttempts.map((a) => ({
      studentId: a.studentId,
      submittedAt: a.submittedAt,
      startedAt: a.startedAt,
    }))
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <h1 className="text-2xl font-semibold">
        Course Analytics: {course.title}
      </h1>

      {/* Summary stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-md p-4">
          <p className="text-xs text-gray-500">Active Enrollments</p>
          <p className="text-2xl font-bold text-blue-700">
            {activeEnrollments.length}
          </p>
        </div>
        <div className="bg-green-50 rounded-md p-4">
          <p className="text-xs text-gray-500">Completed</p>
          <p className="text-2xl font-bold text-green-700">
            {completedCount}
          </p>
        </div>
        <div className="bg-red-50 rounded-md p-4">
          <p className="text-xs text-gray-500">Dropped</p>
          <p className="text-2xl font-bold text-red-700">
            {droppedCount}
          </p>
        </div>
        <div className="bg-purple-50 rounded-md p-4">
          <p className="text-xs text-gray-500">Avg Completion Rate</p>
          <p className="text-2xl font-bold text-purple-700">
            {avgCompletionRate}%
          </p>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CompletionRateChart data={moduleChartData} />
        <QuizScoreDistribution data={distributionData} />
      </div>

      {/* Engagement heatmap */}
      <LmsEngagementHeatmap data={dailyData} />

      {/* Activity timeline */}
      <CourseActivityTimeline data={dailyData} />

      {/* At-risk students */}
      <AtRiskStudentsList students={atRiskStudents} />
    </div>
  );
};

export default CourseAnalyticsContainer;
