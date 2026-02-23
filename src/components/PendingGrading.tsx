import prisma from "@/lib/prisma";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

const PendingGrading = async ({ teacherId }: { teacherId: string }) => {
  const t = await getTranslations("dashboard.teacher");

  const exams = await prisma.exam.findMany({
    where: {
      lesson: { teacherId },
      endTime: { lt: new Date() },
    },
    include: {
      results: true,
      lesson: {
        include: {
          class: {
            include: {
              _count: { select: { students: true } },
            },
          },
        },
      },
    },
  });

  const assignments = await prisma.assignment.findMany({
    where: {
      lesson: { teacherId },
      dueDate: { lt: new Date() },
    },
    include: {
      results: true,
      lesson: {
        include: {
          class: {
            include: {
              _count: { select: { students: true } },
            },
          },
        },
      },
    },
  });

  const pendingExamsList = exams.filter(
    (exam) => exam.results.length < exam.lesson.class._count.students
  );

  const pendingAssignmentsList = assignments.filter(
    (assignment) =>
      assignment.results.length < assignment.lesson.class._count.students
  );

  const nothingPending =
    pendingExamsList.length === 0 && pendingAssignmentsList.length === 0;

  return (
    <div className="bg-white rounded-md p-4">
      <h1 className="text-xl font-semibold">{t("pendingGrading")}</h1>
      {nothingPending ? (
        <p className="text-sm text-green-600 mt-4">{t("allCaughtUp")}</p>
      ) : (
        <div className="flex flex-col gap-4 mt-4">
          {/* Pending Exams */}
          {pendingExamsList.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">
                  {t("exams")} ({pendingExamsList.length})
                </span>
              </div>
              {pendingExamsList.slice(0, 3).map((exam) => (
                <Link
                  key={exam.id}
                  href={`/list/results?examId=${exam.id}`}
                  className="flex items-center justify-between p-2 rounded-md bg-lamaSkyLight hover:bg-lamaSky transition-colors"
                >
                  <div>
                    <span className="text-sm font-medium">{exam.title}</span>
                    <span className="text-xs text-gray-400 ml-2">
                      {exam.lesson.class.name}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {exam.results.length}/
                    {exam.lesson.class._count.students}
                  </span>
                </Link>
              ))}
            </div>
          )}
          {/* Pending Assignments */}
          {pendingAssignmentsList.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">
                  {t("assignments")} ({pendingAssignmentsList.length})
                </span>
              </div>
              {pendingAssignmentsList.slice(0, 3).map((assignment) => (
                <Link
                  key={assignment.id}
                  href={`/list/results?assignmentId=${assignment.id}`}
                  className="flex items-center justify-between p-2 rounded-md bg-lamaYellowLight hover:bg-lamaYellow transition-colors"
                >
                  <div>
                    <span className="text-sm font-medium">
                      {assignment.title}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">
                      {assignment.lesson.class.name}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {assignment.results.length}/
                    {assignment.lesson.class._count.students}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PendingGrading;
