import prisma from "@/lib/prisma";
import { computeAtRiskStatus, computeAverageQuizScore } from "@/lib/lmsAnalyticsUtils";
import { getTranslations } from "next-intl/server";

interface AtRiskStudent {
  studentId: string;
  name: string;
  surname: string;
  courseName: string;
  reasons: string[];
  daysSinceLastActivity: number | null;
}

const AtRiskStudentsAlert = async ({ teacherId }: { teacherId: string }) => {
  const t = await getTranslations("dashboard.teacher");
  const now = new Date();

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
        <h1 className="text-xl font-semibold">{t("atRiskStudents")}</h1>
        <p className="text-sm text-gray-400 mt-4">{t("noActiveCourses")}</p>
      </div>
    );
  }

  const allStudentIds = [...new Set(courses.flatMap((c) => c.enrollments.map((e) => e.studentId)))];

  const [allProgress, allAttempts] = await Promise.all([
    prisma.lessonProgress.findMany({
      where: { studentId: { in: allStudentIds } },
      select: { studentId: true, lessonId: true, completedAt: true },
    }),
    prisma.quizAttempt.findMany({
      where: { studentId: { in: allStudentIds }, submittedAt: { not: null } },
      select: {
        studentId: true, quizId: true, submittedAt: true,
        percentage: true, passed: true, quiz: { select: { lessonId: true } },
      },
    }),
  ]);

  const progressByStudent = new Map<string, { lessonId: number; completedAt: Date | null }[]>();
  for (const p of allProgress) {
    const arr = progressByStudent.get(p.studentId) ?? [];
    arr.push({ lessonId: p.lessonId, completedAt: p.completedAt });
    progressByStudent.set(p.studentId, arr);
  }

  type AttemptRecord = { lessonId: number; submittedAt: Date | null; percentage: number | null; passed: boolean | null };
  const attemptsByStudent = new Map<string, AttemptRecord[]>();
  for (const a of allAttempts) {
    const arr = attemptsByStudent.get(a.studentId) ?? [];
    arr.push({ lessonId: a.quiz.lessonId, submittedAt: a.submittedAt, percentage: a.percentage, passed: a.passed });
    attemptsByStudent.set(a.studentId, arr);
  }

  const atRiskStudents: AtRiskStudent[] = [];
  for (const course of courses) {
    const lessonIds = new Set(course.modules.flatMap((m) => m.lessons.map((l) => l.id)));
    for (const enrollment of course.enrollments) {
      const sid = enrollment.studentId;
      const sp = (progressByStudent.get(sid) ?? []).filter((p) => lessonIds.has(p.lessonId));
      const sa = (attemptsByStudent.get(sid) ?? []).filter((a) => lessonIds.has(a.lessonId));
      const quizScore = computeAverageQuizScore(sa);
      const risk = computeAtRiskStatus(
        sp.map((p) => ({ completedAt: p.completedAt })),
        sa.map((a) => ({ submittedAt: a.submittedAt, passed: a.passed })),
        quizScore.averagePercentage
      );
      if (!risk.isAtRisk) continue;
      const dates: Date[] = [];
      for (const p of sp) { if (p.completedAt) dates.push(new Date(p.completedAt)); }
      for (const a of sa) { if (a.submittedAt) dates.push(new Date(a.submittedAt)); }
      const last = dates.length > 0 ? dates.reduce((a, b) => (a > b ? a : b)) : null;
      const daysSince = last ? Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)) : null;
      atRiskStudents.push({
        studentId: sid, name: enrollment.student.name, surname: enrollment.student.surname,
        courseName: course.title, reasons: risk.reasons, daysSinceLastActivity: daysSince,
      });
    }
  }

  if (atRiskStudents.length === 0) {
    return (
      <div className="bg-white rounded-md p-4">
        <h1 className="text-xl font-semibold">{t("atRiskStudents")}</h1>
        <p className="text-sm text-gray-400 mt-4">{t("noAtRisk")}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-md p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t("atRiskStudents")}</h1>
        <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
          {t("alerts", { count: atRiskStudents.length })}
        </span>
      </div>
      <div className="flex flex-col gap-3 mt-4 max-h-72 overflow-y-auto">
        {atRiskStudents.map((s) => (
          <div key={`${s.studentId}-${s.courseName}`} className="border border-red-200 bg-red-50 rounded-md p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">{s.name} {s.surname}</span>
              <span className="text-xs text-orange-600 font-bold">
                {s.daysSinceLastActivity !== null ? t("daysAgo", { days: s.daysSinceLastActivity }) : t("noActivity")}
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-1">{s.courseName}</p>
            <ul className="list-disc list-inside">
              {s.reasons.map((reason, idx) => (
                <li key={idx} className="text-xs text-red-700">{reason}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AtRiskStudentsAlert;
