import prisma from "@/lib/prisma";
import { getTranslations } from "next-intl/server";

const ChildQuickStats = async ({
  studentId,
  studentName,
}: {
  studentId: string;
  studentName: string;
}) => {
  const t = await getTranslations("dashboard.parent");

  // 1. Attendance (year-to-date)
  const attendance = await prisma.attendance.findMany({
    where: {
      studentId,
      date: { gte: new Date(new Date().getFullYear(), 0, 1) },
    },
  });
  const totalDays = attendance.length;
  const presentDays = attendance.filter((a) => a.present).length;
  const attendancePercentage =
    totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  // 2. Latest grade
  const latestResult = await prisma.result.findFirst({
    where: { studentId },
    orderBy: { id: "desc" },
    include: {
      exam: { select: { title: true } },
      assignment: { select: { title: true } },
    },
  });

  // 3. Pending assignments (due in future, no result yet)
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { classId: true },
  });

  let pendingAssignments = 0;
  if (student) {
    pendingAssignments = await prisma.assignment.count({
      where: {
        dueDate: { gte: new Date() },
        lesson: { classId: student.classId },
        NOT: { results: { some: { studentId } } },
      },
    });
  }

  // Attendance color coding
  const attendanceColor =
    attendancePercentage >= 90
      ? "text-green-600"
      : attendancePercentage >= 75
        ? "text-yellow-600"
        : "text-red-600";

  // Latest grade display
  const latestScore = latestResult ? latestResult.score : null;
  const latestTitle =
    latestResult?.exam?.title ||
    latestResult?.assignment?.title ||
    null;

  return (
    <div className="bg-white rounded-md p-4">
      <h2 className="text-lg font-semibold border-b pb-2">{studentName}</h2>
      <div className="flex gap-4 mt-3">
        {/* Attendance */}
        <div className="flex-1 flex flex-col items-center">
          <span className={`text-2xl font-bold ${attendanceColor}`}>
            {totalDays > 0 ? `${attendancePercentage}%` : "-"}
          </span>
          <span className="text-xs text-gray-400">{t("attendanceLabel")}</span>
        </div>
        {/* Latest Grade */}
        <div className="flex-1 flex flex-col items-center">
          <span className="text-2xl font-bold">
            {latestScore !== null ? latestScore : "-"}
          </span>
          <span className="text-xs text-gray-400 truncate max-w-[100px] text-center">
            {latestTitle || t("latestGrade")}
          </span>
        </div>
        {/* Pending Assignments */}
        <div className="flex-1 flex flex-col items-center">
          <span className="text-2xl font-bold">{pendingAssignments}</span>
          <span className="text-xs text-gray-400">{t("dueSoon")}</span>
        </div>
      </div>
    </div>
  );
};

export default ChildQuickStats;
