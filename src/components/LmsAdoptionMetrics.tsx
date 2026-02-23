import prisma from "@/lib/prisma";
import { getTranslations } from "next-intl/server";

const LmsAdoptionMetrics = async () => {
  const t = await getTranslations("dashboard.admin");

  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  // Run all 6 queries in parallel
  const [
    activeCourses,
    activeEnrollments,
    recentProgressStudents,
    recentQuizStudents,
    totalEnrolledStudents,
    teachersWithCourses,
    totalTeachers,
  ] = await Promise.all([
    // 1. Total ACTIVE courses
    prisma.course.count({ where: { status: "ACTIVE" } }),

    // 2. Total active enrollments
    prisma.enrollment.count({ where: { status: "ACTIVE" } }),

    // 3a. Distinct students with lesson progress in last 14 days
    prisma.lessonProgress.findMany({
      where: { completedAt: { gte: fourteenDaysAgo } },
      select: { studentId: true },
      distinct: ["studentId"],
    }),

    // 3b. Distinct students with quiz activity in last 14 days
    prisma.quizAttempt.findMany({
      where: { submittedAt: { gte: fourteenDaysAgo } },
      select: { studentId: true },
      distinct: ["studentId"],
    }),

    // 3c. Total distinct students with ACTIVE enrollments
    prisma.enrollment.findMany({
      where: { status: "ACTIVE" },
      select: { studentId: true },
      distinct: ["studentId"],
    }),

    // 4a. Distinct teachers with ACTIVE courses
    prisma.course.findMany({
      where: { status: "ACTIVE" },
      select: { teacherId: true },
      distinct: ["teacherId"],
    }),

    // 4b. Total teachers
    prisma.teacher.count(),
  ]);

  // Compute engagement rate
  const activeStudentIds = new Set([
    ...recentProgressStudents.map((r) => r.studentId),
    ...recentQuizStudents.map((r) => r.studentId),
  ]);
  const totalEnrolled = totalEnrolledStudents.length;
  const engagementRate =
    totalEnrolled > 0
      ? Math.round((activeStudentIds.size / totalEnrolled) * 100)
      : 0;

  // Compute teacher adoption rate
  const teacherAdoptionRate =
    totalTeachers > 0
      ? Math.round((teachersWithCourses.length / totalTeachers) * 100)
      : 0;

  // Color coding helper
  const rateColor = (rate: number) =>
    rate >= 90
      ? "text-green-600"
      : rate >= 75
        ? "text-yellow-600"
        : "text-red-600";

  return (
    <div className="bg-white p-4 rounded-md">
      <h3 className="text-lg font-semibold">{t("lmsAdoption")}</h3>
      <div className="flex gap-4 mt-3">
        {/* Active Courses */}
        <div className="flex-1 flex flex-col items-center">
          <span className="text-2xl font-bold">{activeCourses}</span>
          <span className="text-xs text-gray-400">{t("activeCourses")}</span>
        </div>
        {/* Active Enrollments */}
        <div className="flex-1 flex flex-col items-center">
          <span className="text-2xl font-bold">{activeEnrollments}</span>
          <span className="text-xs text-gray-400">{t("enrollments")}</span>
        </div>
        {/* Engagement Rate */}
        <div className="flex-1 flex flex-col items-center">
          <span className={`text-2xl font-bold ${rateColor(engagementRate)}`}>
            {engagementRate}%
          </span>
          <span className="text-xs text-gray-400">{t("engagement")}</span>
        </div>
        {/* Teacher Adoption */}
        <div className="flex-1 flex flex-col items-center">
          <span
            className={`text-2xl font-bold ${rateColor(teacherAdoptionRate)}`}
          >
            {teacherAdoptionRate}%
          </span>
          <span className="text-xs text-gray-400">{t("teacherAdoption")}</span>
        </div>
      </div>
    </div>
  );
};

export default LmsAdoptionMetrics;
