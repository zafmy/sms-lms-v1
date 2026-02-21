import prisma from "@/lib/prisma";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const AttendanceHeatmap = async ({ studentId }: { studentId: string }) => {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const attendance = await prisma.attendance.findMany({
    where: {
      studentId,
      date: { gte: yearStart },
    },
    select: { date: true, present: true },
    orderBy: { date: "asc" },
  });

  if (attendance.length === 0) {
    return (
      <div className="bg-white rounded-md p-4">
        <h1 className="text-xl font-semibold">Attendance Overview</h1>
        <p className="text-gray-400 mt-4">No attendance records yet</p>
      </div>
    );
  }

  // Group attendance records by month
  const monthGroups: Record<number, { date: Date; present: boolean }[]> = {};
  for (const record of attendance) {
    const month = record.date.getMonth();
    if (!monthGroups[month]) {
      monthGroups[month] = [];
    }
    monthGroups[month].push(record);
  }

  // Compute overall stats
  const totalDays = attendance.length;
  const presentDays = attendance.filter((r) => r.present).length;
  const percentage =
    totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  // Determine which months to show (Jan to current month)
  const currentMonth = now.getMonth();
  const monthsToShow = Array.from({ length: currentMonth + 1 }, (_, i) => i);

  return (
    <div className="bg-white rounded-md p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Attendance Overview</h1>
        <span className="text-sm text-gray-500">
          {presentDays}/{totalDays} days ({percentage}%)
        </span>
      </div>
      <div className="flex flex-col gap-2 mt-4">
        {monthsToShow.map((month) => {
          const records = monthGroups[month] || [];
          return (
            <div key={month} className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-8 shrink-0">
                {MONTH_NAMES[month]}
              </span>
              <div className="flex flex-wrap gap-1">
                {records.map((record, idx) => (
                  <div
                    key={idx}
                    className={`w-3 h-3 rounded-xs ${
                      record.present ? "bg-green-400" : "bg-red-400"
                    }`}
                    title={`${new Intl.DateTimeFormat("en-GB").format(record.date)} - ${
                      record.present ? "Present" : "Absent"
                    }`}
                  />
                ))}
                {records.length === 0 && (
                  <span className="text-xs text-gray-300">-</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-xs bg-green-400" />
          <span className="text-xs text-gray-500">Present</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-xs bg-red-400" />
          <span className="text-xs text-gray-500">Absent</span>
        </div>
      </div>
    </div>
  );
};

export default AttendanceHeatmap;
