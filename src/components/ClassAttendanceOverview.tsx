import prisma from "@/lib/prisma";

const ClassAttendanceOverview = async ({
  teacherId,
}: {
  teacherId: string;
}) => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  monday.setHours(0, 0, 0, 0);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  friday.setHours(23, 59, 59, 999);

  const teacherClasses = await prisma.lesson.findMany({
    where: { teacherId },
    select: {
      classId: true,
      class: { select: { name: true } },
    },
    distinct: ["classId"],
  });

  const classAttendance = await Promise.all(
    teacherClasses.map(async (cls) => {
      const attendance = await prisma.attendance.groupBy({
        by: ["present"],
        where: {
          lesson: { classId: cls.classId },
          date: { gte: monday, lte: friday },
        },
        _count: true,
      });

      const presentCount =
        attendance.find((a) => a.present === true)?._count ?? 0;
      const absentCount =
        attendance.find((a) => a.present === false)?._count ?? 0;
      const total = presentCount + absentCount;
      const percentage = total > 0 ? (presentCount / total) * 100 : -1;

      return {
        className: cls.class.name,
        percentage,
      };
    })
  );

  const hasData = classAttendance.some((c) => c.percentage >= 0);

  return (
    <div className="bg-white rounded-md p-4">
      <h1 className="text-xl font-semibold">Class Attendance (This Week)</h1>
      {!hasData ? (
        <p className="text-sm text-gray-400 mt-4">
          No attendance data this week.
        </p>
      ) : (
        <div className="flex flex-col gap-4 mt-4">
          {classAttendance.map((cls) => (
            <div key={cls.className} className="flex items-center justify-between">
              <span className="text-sm font-medium">{cls.className}</span>
              {cls.percentage < 0 ? (
                <span className="text-sm text-gray-400">No data</span>
              ) : (
                <span
                  className={`text-sm font-bold ${
                    cls.percentage >= 90
                      ? "text-green-600"
                      : cls.percentage >= 75
                        ? "text-yellow-600"
                        : "text-red-600"
                  }`}
                >
                  {cls.percentage.toFixed(1)}%
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClassAttendanceOverview;
