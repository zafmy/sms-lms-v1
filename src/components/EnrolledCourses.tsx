import CourseProgressBar from "@/components/CourseProgressBar";
import prisma from "@/lib/prisma";
import Link from "next/link";

const EnrolledCourses = async ({ studentId }: { studentId: string }) => {
  const enrollments = await prisma.enrollment.findMany({
    where: {
      studentId,
      status: "ACTIVE",
    },
    include: {
      course: {
        include: {
          teacher: { select: { name: true, surname: true } },
          subject: { select: { name: true } },
          modules: {
            orderBy: { order: "asc" },
            include: {
              lessons: {
                select: {
                  id: true,
                  quizzes: {
                    include: {
                      attempts: {
                        where: { studentId, submittedAt: { not: null } },
                        select: { percentage: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  // Fetch all lesson progress for this student across enrolled courses
  const allLessonIds = enrollments.flatMap((e) =>
    e.course.modules.flatMap((m) => m.lessons.map((l) => l.id))
  );

  const progressRecords =
    allLessonIds.length > 0
      ? await prisma.lessonProgress.findMany({
          where: {
            studentId,
            lessonId: { in: allLessonIds },
            status: "COMPLETED",
          },
          select: { lessonId: true },
        })
      : [];

  const completedLessonIds = new Set(progressRecords.map((p) => p.lessonId));

  return (
    <div className="bg-white p-4 rounded-md">
      <h2 className="text-lg font-semibold mb-4">My Courses</h2>
      {enrollments.length === 0 ? (
        <p className="text-gray-400 text-sm">No courses enrolled yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {enrollments.map((enrollment) => {
            const totalLessons = enrollment.course.modules.reduce(
              (acc, m) => acc + m.lessons.length,
              0
            );
            const completedLessons = enrollment.course.modules.reduce(
              (acc, m) =>
                acc +
                m.lessons.filter((l) => completedLessonIds.has(l.id)).length,
              0
            );

            return (
              <div
                key={enrollment.id}
                className="border border-gray-200 rounded-md p-4 hover:shadow-md transition-shadow"
              >
                <Link
                  href={`/list/courses/${enrollment.course.id}`}
                  className="block"
                >
                  <h3 className="font-semibold text-md mb-1">
                    {enrollment.course.title}
                  </h3>
                  <div className="flex gap-3 text-xs text-gray-500 mb-3">
                    <span>
                      {enrollment.course.teacher.name}{" "}
                      {enrollment.course.teacher.surname}
                    </span>
                    <span>{enrollment.course.subject.name}</span>
                  </div>
                  <CourseProgressBar
                    completed={completedLessons}
                    total={totalLessons}
                  />
                </Link>

                {/* Collapsible module breakdown */}
                {enrollment.course.modules.length > 0 && (
                  <details className="mt-3">
                    <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 select-none">
                      Module breakdown ({enrollment.course.modules.length}{" "}
                      module{enrollment.course.modules.length !== 1 ? "s" : ""})
                    </summary>
                    <div className="mt-2 space-y-2 pl-2 border-l-2 border-gray-100">
                      {enrollment.course.modules.map((mod) => {
                        const modTotal = mod.lessons.length;
                        const modCompleted = mod.lessons.filter((l) =>
                          completedLessonIds.has(l.id)
                        ).length;

                        // Compute avg quiz % for this module
                        const moduleAttempts = mod.lessons.flatMap((l) =>
                          l.quizzes.flatMap((q) => q.attempts)
                        );
                        const hasQuizData = moduleAttempts.length > 0;
                        const avgQuizPct = hasQuizData
                          ? Math.round(
                              moduleAttempts.reduce(
                                (acc, a) => acc + (a.percentage ?? 0),
                                0
                              ) / moduleAttempts.length
                            )
                          : null;

                        return (
                          <div key={mod.id} className="text-xs">
                            <p className="font-medium text-gray-700">
                              {mod.title}
                            </p>
                            <p className="text-gray-500">
                              {modCompleted}/{modTotal} lessons completed
                              {avgQuizPct !== null && (
                                <span className="ml-2 text-purple-600">
                                  Quiz avg: {avgQuizPct}%
                                </span>
                              )}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </details>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EnrolledCourses;
