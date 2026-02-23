import prisma from "@/lib/prisma";
import { categorizeStudentEngagement } from "@/lib/lmsAnalyticsUtils";
import { getLocale, getTranslations } from "next-intl/server";
import { getIntlLocale } from "@/lib/formatUtils";

interface StudentRow {
  studentId: string;
  name: string;
  surname: string;
  courseName: string;
  lessonsCompleted: number;
  quizAttemptCount: number;
  lastActivity: Date | null;
  status: "engaged" | "inactive";
}

const WINDOW_DAYS = 14;

const PreClassEngagementReport = async ({ teacherId }: { teacherId: string }) => {
  const t = await getTranslations("dashboard.teacher");
  const locale = await getLocale();

  const now = new Date();
  const cutoff = new Date(now.getTime() - WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const courses = await prisma.course.findMany({
    where: { teacherId, status: "ACTIVE" },
    select: {
      id: true, title: true,
      modules: { select: { lessons: { select: { id: true } } } },
      enrollments: {
        where: { status: "ACTIVE" },
        select: { studentId: true, student: { select: { id: true, name: true, surname: true } } },
      },
    },
  });

  if (courses.length === 0) {
    return (
      <div className="bg-white rounded-md p-4">
        <h1 className="text-xl font-semibold">{t("preClassEngagement")}</h1>
        <p className="text-sm text-gray-400 mt-4">{t("noActiveCourses")}</p>
      </div>
    );
  }

  const allStudentIds = [...new Set(courses.flatMap((c) => c.enrollments.map((e) => e.studentId)))];

  // Batch fetch ALL progress and attempts in single queries (no per-student queries)
  const [progressRecords, quizAttempts] = await Promise.all([
    prisma.lessonProgress.findMany({
      where: { studentId: { in: allStudentIds }, completedAt: { gte: cutoff } },
      select: { studentId: true, lessonId: true, completedAt: true },
    }),
    prisma.quizAttempt.findMany({
      where: { studentId: { in: allStudentIds }, submittedAt: { gte: cutoff } },
      select: { studentId: true, quizId: true, submittedAt: true, quiz: { select: { lessonId: true } } },
    }),
  ]);

  const progressByStudent = new Map<string, { lessonId: number; completedAt: Date | null }[]>();
  for (const p of progressRecords) {
    const arr = progressByStudent.get(p.studentId) ?? [];
    arr.push({ lessonId: p.lessonId, completedAt: p.completedAt });
    progressByStudent.set(p.studentId, arr);
  }

  const attemptsByStudent = new Map<string, { submittedAt: Date | null; lessonId: number }[]>();
  for (const a of quizAttempts) {
    const arr = attemptsByStudent.get(a.studentId) ?? [];
    arr.push({ submittedAt: a.submittedAt, lessonId: a.quiz.lessonId });
    attemptsByStudent.set(a.studentId, arr);
  }

  const rows: StudentRow[] = [];
  for (const course of courses) {
    const lessonIds = new Set(course.modules.flatMap((m) => m.lessons.map((l) => l.id)));
    for (const enrollment of course.enrollments) {
      const sid = enrollment.studentId;
      const sp = (progressByStudent.get(sid) ?? []).filter((p) => lessonIds.has(p.lessonId));
      const sa = (attemptsByStudent.get(sid) ?? []).filter((a) => lessonIds.has(a.lessonId));
      const status = categorizeStudentEngagement(
        sp.map((p) => ({ completedAt: p.completedAt })),
        sa.map((a) => ({ submittedAt: a.submittedAt })),
        WINDOW_DAYS
      );
      const dates: Date[] = [];
      for (const p of sp) { if (p.completedAt) dates.push(new Date(p.completedAt)); }
      for (const a of sa) { if (a.submittedAt) dates.push(new Date(a.submittedAt)); }
      const lastActivity = dates.length > 0 ? dates.reduce((a, b) => (a > b ? a : b)) : null;
      rows.push({
        studentId: sid, name: enrollment.student.name, surname: enrollment.student.surname,
        courseName: course.title, lessonsCompleted: sp.length, quizAttemptCount: sa.length,
        lastActivity, status,
      });
    }
  }

  rows.sort((a, b) => {
    if (a.status !== b.status) return a.status === "inactive" ? -1 : 1;
    return `${a.surname} ${a.name}`.toLowerCase().localeCompare(`${b.surname} ${b.name}`.toLowerCase());
  });

  const engagedCount = rows.filter((r) => r.status === "engaged").length;

  return (
    <div className="bg-white rounded-md p-4">
      <h1 className="text-xl font-semibold">{t("preClassEngagement")}</h1>
      <p className="text-sm text-gray-500 mt-1">
        {t("studentsEngaged", { count: engagedCount, total: rows.length, days: WINDOW_DAYS })}
      </p>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-400 mt-4">{t("noEnrolledStudents")}</p>
      ) : (
        <div className="flex flex-col gap-2 mt-4 max-h-80 overflow-y-auto">
          {rows.map((row) => (
            <div key={`${row.studentId}-${row.courseName}`} className="flex items-center justify-between p-2 rounded-md border border-gray-100">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{row.name} {row.surname}</p>
                <p className="text-xs text-gray-400 truncate">{row.courseName}</p>
              </div>
              <div className="flex items-center gap-3 ml-2 shrink-0">
                <div className="text-right">
                  <p className="text-xs text-gray-500">{row.lessonsCompleted}L / {row.quizAttemptCount}Q</p>
                  <p className="text-xs text-gray-400">
                    {row.lastActivity ? row.lastActivity.toLocaleDateString(getIntlLocale(locale)) : t("noActivity")}
                  </p>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${row.status === "engaged" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {row.status === "engaged" ? t("engaged") : t("inactive")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PreClassEngagementReport;
