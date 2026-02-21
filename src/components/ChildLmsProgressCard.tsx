import Link from "next/link";
import prisma from "@/lib/prisma";
import {
  computeCourseCompletion,
  computeEngagementDays,
} from "@/lib/lmsAnalyticsUtils";

// Get the Monday (start) and Sunday (end) of the current week in UTC
function getCurrentWeekRange(): { start: Date; end: Date } {
  const now = new Date();
  const day = now.getUTCDay();
  // Monday = 1, Sunday = 0 -> shift so Monday is 0
  const diffToMonday = day === 0 ? 6 : day - 1;

  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - diffToMonday);
  monday.setUTCHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  sunday.setUTCHours(23, 59, 59, 999);

  return { start: monday, end: sunday };
}

const ChildLmsProgressCard = async ({
  studentId,
  studentName,
}: {
  studentId: string;
  studentName: string;
}) => {
  // Fetch ACTIVE enrollments with course -> modules -> lessons
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId, status: "ACTIVE" },
    include: {
      course: {
        include: {
          modules: {
            include: {
              lessons: { select: { id: true } },
            },
          },
        },
      },
    },
  });

  if (enrollments.length === 0) {
    return (
      <div className="bg-white p-4 rounded-md">
        <h3 className="text-lg font-semibold">{studentName} - LMS Progress</h3>
        <p className="text-gray-400 mt-2 text-sm">No courses enrolled yet.</p>
      </div>
    );
  }

  // Fetch student progress records and most recent quiz attempt in parallel
  const [progressRecords, recentQuizAttempt] = await Promise.all([
    prisma.lessonProgress.findMany({
      where: { studentId },
      select: { lessonId: true, status: true, completedAt: true },
    }),
    prisma.quizAttempt.findFirst({
      where: { studentId, submittedAt: { not: null } },
      orderBy: { submittedAt: "desc" },
      include: {
        quiz: { select: { title: true } },
      },
    }),
  ]);

  // Compute overall completion across all enrolled courses
  let totalLessons = 0;
  let totalCompleted = 0;
  for (const enrollment of enrollments) {
    const result = computeCourseCompletion(enrollment.course, progressRecords);
    totalLessons += result.totalLessons;
    totalCompleted += result.completedLessons;
  }
  const overallPercentage =
    totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0;

  // Get engagement days for current week (Mon-Sun)
  const { start, end } = getCurrentWeekRange();
  const quizAttempts = await prisma.quizAttempt.findMany({
    where: { studentId, submittedAt: { not: null } },
    select: { submittedAt: true },
  });
  const engagement = computeEngagementDays(
    progressRecords,
    quizAttempts,
    start,
    end
  );

  // Color coding for completion percentage
  const completionColor =
    overallPercentage >= 90
      ? "text-green-600"
      : overallPercentage >= 75
        ? "text-yellow-600"
        : "text-red-600";

  // Recent quiz score display
  const recentQuizScore =
    recentQuizAttempt?.percentage != null
      ? `${Math.round(recentQuizAttempt.percentage)}%`
      : "-";
  const recentQuizTitle = recentQuizAttempt?.quiz?.title ?? "Latest Quiz";

  return (
    <div className="bg-white p-4 rounded-md">
      <h3 className="text-lg font-semibold">{studentName} - LMS Progress</h3>
      <div className="flex gap-4 mt-3">
        {/* Courses Enrolled */}
        <div className="flex-1 flex flex-col items-center">
          <span className="text-2xl font-bold">{enrollments.length}</span>
          <span className="text-xs text-gray-400">Courses</span>
        </div>
        {/* Overall Completion */}
        <div className="flex-1 flex flex-col items-center">
          <span className={`text-2xl font-bold ${completionColor}`}>
            {overallPercentage}%
          </span>
          <span className="text-xs text-gray-400">Completion</span>
        </div>
        {/* Recent Quiz Score */}
        <div className="flex-1 flex flex-col items-center">
          <span className="text-2xl font-bold">{recentQuizScore}</span>
          <span className="text-xs text-gray-400 truncate max-w-[100px] text-center">
            {recentQuizTitle}
          </span>
        </div>
        {/* Days Active This Week */}
        <div className="flex-1 flex flex-col items-center">
          <span className="text-2xl font-bold">
            {engagement.daysActive}/7
          </span>
          <span className="text-xs text-gray-400">Days Active</span>
        </div>
      </div>
      <Link
        href="/list/courses"
        className="text-sm text-blue-500 hover:underline mt-2 block"
      >
        View Courses
      </Link>
    </div>
  );
};

export default ChildLmsProgressCard;
