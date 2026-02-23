import prisma from "@/lib/prisma";
import { formatTimeSpent } from "@/lib/lmsAnalyticsUtils";
import { getTranslations } from "next-intl/server";

const LmsProgressOverview = async ({
  studentId,
}: {
  studentId: string;
}) => {
  const t = await getTranslations("dashboard.student");

  // Fetch ACTIVE enrollments with course modules and lessons
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

  // Collect all lesson IDs across enrolled courses
  const allLessonIds = enrollments.flatMap((e) =>
    e.course.modules.flatMap((m) => m.lessons.map((l) => l.id))
  );

  // Fetch progress records for this student
  const progressRecords =
    allLessonIds.length > 0
      ? await prisma.lessonProgress.findMany({
          where: {
            studentId,
            lessonId: { in: allLessonIds },
          },
          select: {
            lessonId: true,
            status: true,
            timeSpentSeconds: true,
          },
        })
      : [];

  // Compute metrics
  const totalCourses = enrollments.length;
  const totalLessons = allLessonIds.length;
  const completedLessons = progressRecords.filter(
    (p) => p.status === "COMPLETED"
  ).length;
  const avgCompletion =
    totalLessons > 0
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0;
  const totalTimeSeconds = progressRecords.reduce(
    (acc, p) => acc + p.timeSpentSeconds,
    0
  );

  // Color coding for completion percentage
  const completionColor =
    avgCompletion >= 90
      ? "text-green-600"
      : avgCompletion >= 75
        ? "text-yellow-600"
        : "text-red-600";

  return (
    <div className="bg-white p-4 rounded-md">
      <h2 className="text-lg font-semibold mb-3">{t("learningProgress")}</h2>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Enrolled Courses */}
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">{totalCourses}</p>
          <p className="text-xs text-gray-500">{t("enrolledCourses")}</p>
        </div>

        {/* Avg Completion */}
        <div className="text-center">
          <p className={`text-2xl font-bold ${completionColor}`}>
            {avgCompletion}%
          </p>
          <p className="text-xs text-gray-500">{t("avgCompletion")}</p>
        </div>

        {/* Lessons Completed */}
        <div className="text-center">
          <p className="text-2xl font-bold text-purple-600">
            {completedLessons}
          </p>
          <p className="text-xs text-gray-500">{t("lessonsDone")}</p>
        </div>

        {/* Total Time Spent */}
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-700">
            {formatTimeSpent(totalTimeSeconds)}
          </p>
          <p className="text-xs text-gray-500">{t("timeSpent")}</p>
        </div>
      </div>
    </div>
  );
};

export default LmsProgressOverview;
