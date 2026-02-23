import prisma from "@/lib/prisma";
import { getLocale, getTranslations } from "next-intl/server";
import { getIntlLocale } from "@/lib/formatUtils";

const bgColors = [
  "bg-lamaSkyLight",
  "bg-lamaPurpleLight",
  "bg-lamaYellowLight",
  "bg-lamaSkyLight",
  "bg-lamaPurpleLight",
];

const RecentActivity = async ({
  studentIds,
}: {
  studentIds: string[];
}) => {
  const t = await getTranslations("dashboard.parent");
  const locale = await getLocale();

  if (studentIds.length === 0) {
    return (
      <div className="bg-white rounded-md p-4">
        <h1 className="text-xl font-semibold">{t("recentActivity")}</h1>
        <p className="text-gray-400 mt-4">{t("noRecentActivity")}</p>
      </div>
    );
  }

  // Query recent results for all children
  const results = await prisma.result.findMany({
    where: { studentId: { in: studentIds } },
    take: 5,
    orderBy: { id: "desc" },
    include: {
      student: { select: { name: true } },
      exam: { select: { title: true } },
      assignment: { select: { title: true } },
    },
  });

  // Query recent attendance for all children
  const attendanceRecords = await prisma.attendance.findMany({
    where: { studentId: { in: studentIds } },
    take: 5,
    orderBy: { date: "desc" },
    include: {
      student: { select: { name: true } },
      lesson: { select: { name: true } },
    },
  });

  // Merge into a single array with a common shape
  type ActivityItem = {
    type: "grade" | "attendance";
    studentName: string;
    description: string;
    date: Date;
    present?: boolean;
    id: string;
  };

  const gradeActivities: ActivityItem[] = results.map((r) => {
    const title = r.exam?.title || r.assignment?.title || "Unknown";
    return {
      type: "grade",
      studentName: r.student.name,
      description: `${t("scored")} ${r.score} on ${title}`,
      date: new Date(),
      id: `grade-${r.id}`,
    };
  });

  const attendanceActivities: ActivityItem[] = attendanceRecords.map((a) => ({
    type: "attendance",
    studentName: a.student.name,
    description: `${a.present ? t("present") : t("absent")} in ${a.lesson.name}`,
    date: a.date,
    present: a.present,
    id: `attendance-${a.id}`,
  }));

  // Merge, sort by date desc, take top 5
  const allActivities = [...gradeActivities, ...attendanceActivities]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 5);

  if (allActivities.length === 0) {
    return (
      <div className="bg-white rounded-md p-4">
        <h1 className="text-xl font-semibold">{t("recentActivity")}</h1>
        <p className="text-gray-400 mt-4">{t("noRecentActivity")}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-md p-4">
      <h1 className="text-xl font-semibold">{t("recentActivity")}</h1>
      <div className="flex flex-col gap-4 mt-4">
        {allActivities.map((activity, index) => (
          <div
            key={activity.id}
            className={`${bgColors[index % bgColors.length]} rounded-md p-4`}
          >
            <div className="flex items-center gap-2">
              {/* Type indicator dot */}
              {activity.type === "grade" ? (
                <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
              ) : activity.present ? (
                <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
              )}
              <span className="font-medium">{activity.studentName}</span>
            </div>
            <p className="text-sm text-gray-400 mt-1">
              {activity.description}
            </p>
            <span className="text-xs text-gray-400">
              {new Intl.DateTimeFormat(getIntlLocale(locale)).format(activity.date)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentActivity;
