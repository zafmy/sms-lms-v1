import QuizResults from "@/components/QuizResults";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound } from "next/navigation";

const QuizResultsPage = async ({
  params,
}: {
  params: Promise<{ id: string; quizId: string }>;
}) => {
  const { id, quizId } = await params;
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  const quiz = await prisma.quiz.findUnique({
    where: { id: parseInt(quizId) },
    include: {
      lesson: {
        include: {
          module: {
            include: {
              course: {
                include: {
                  teacher: { select: { id: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!quiz) {
    return notFound();
  }

  const course = quiz.lesson.module.course;

  // Access control
  if (role === "teacher" && course.teacher.id !== userId) {
    return notFound();
  }

  if (role === "student") {
    // Check enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: userId!,
          courseId: course.id,
        },
      },
    });
    if (!enrollment || enrollment.status !== "ACTIVE") {
      return notFound();
    }

    // Fetch student's attempts with responses
    const attempts = await prisma.quizAttempt.findMany({
      where: { quizId: quiz.id, studentId: userId! },
      orderBy: { startedAt: "desc" },
      include: {
        responses: {
          include: {
            question: {
              include: {
                options: { orderBy: { order: "asc" } },
              },
            },
          },
        },
      },
    });

    const latestAttempt = attempts.find((a) => a.submittedAt);

    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/list/courses" className="hover:text-lamaPurple">
            Courses
          </Link>
          <span>/</span>
          <Link
            href={`/list/courses/${course.id}`}
            className="hover:text-lamaPurple"
          >
            {course.title}
          </Link>
          <span>/</span>
          <Link
            href={`/list/courses/${id}/quiz/${quizId}`}
            className="hover:text-lamaPurple"
          >
            {quiz.title}
          </Link>
          <span>/</span>
          <span className="text-gray-700 font-medium">Results</span>
        </div>

        <h1 className="text-2xl font-semibold mb-6">
          {quiz.title} - Results
        </h1>

        {latestAttempt ? (
          <QuizResults
            attempt={{
              ...latestAttempt,
              submittedAt: latestAttempt.submittedAt?.toISOString() ?? null,
              responses: latestAttempt.responses.map((r) => ({
                ...r,
                question: {
                  ...r.question,
                },
              })),
            }}
          />
        ) : (
          <p className="text-gray-500">No submitted attempts found.</p>
        )}

        {/* Previous attempts */}
        {attempts.filter((a) => a.submittedAt).length > 1 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-3">All Attempts</h2>
            <div className="flex flex-col gap-2">
              {attempts
                .filter((a) => a.submittedAt)
                .map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between border border-gray-200 rounded-md p-3 text-sm"
                  >
                    <span>Attempt #{a.attemptNumber}</span>
                    <div className="flex items-center gap-3">
                      <span>
                        {a.score}/{a.maxScore}
                      </span>
                      <span>{a.percentage}%</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          a.passed
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {a.passed ? "PASSED" : "FAILED"}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Teacher/Admin view - aggregate results
  if (role !== "admin" && role !== "teacher") {
    return notFound();
  }

  const allAttempts = await prisma.quizAttempt.findMany({
    where: { quizId: quiz.id, submittedAt: { not: null } },
    include: {
      student: { select: { id: true, name: true, surname: true } },
    },
    orderBy: { submittedAt: "desc" },
  });

  const totalAttempts = allAttempts.length;
  const avgScore =
    totalAttempts > 0
      ? Math.round(
          (allAttempts.reduce((acc, a) => acc + (a.percentage ?? 0), 0) /
            totalAttempts) *
            10
        ) / 10
      : 0;
  const passCount = allAttempts.filter((a) => a.passed).length;
  const passRate =
    totalAttempts > 0
      ? Math.round((passCount / totalAttempts) * 100 * 10) / 10
      : 0;

  // Group by student for per-student breakdown
  const studentMap = new Map<
    string,
    {
      name: string;
      surname: string;
      attempts: typeof allAttempts;
    }
  >();
  for (const attempt of allAttempts) {
    const key = attempt.studentId;
    if (!studentMap.has(key)) {
      studentMap.set(key, {
        name: attempt.student.name,
        surname: attempt.student.surname,
        attempts: [],
      });
    }
    studentMap.get(key)!.attempts.push(attempt);
  }

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/list/courses" className="hover:text-lamaPurple">
          Courses
        </Link>
        <span>/</span>
        <Link
          href={`/list/courses/${course.id}`}
          className="hover:text-lamaPurple"
        >
          {course.title}
        </Link>
        <span>/</span>
        <Link
          href={`/list/courses/${id}/quiz/${quizId}`}
          className="hover:text-lamaPurple"
        >
          {quiz.title}
        </Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">Results</span>
      </div>

      <h1 className="text-2xl font-semibold mb-6">
        {quiz.title} - Results Overview
      </h1>

      {/* AGGREGATE STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-700">{avgScore}%</div>
          <div className="text-sm text-blue-600">Average Score</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-700">{passRate}%</div>
          <div className="text-sm text-green-600">Pass Rate</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-700">
            {totalAttempts}
          </div>
          <div className="text-sm text-purple-600">Total Attempts</div>
        </div>
      </div>

      {/* PER-STUDENT BREAKDOWN */}
      <h2 className="text-lg font-semibold mb-3">Student Results</h2>
      {studentMap.size === 0 ? (
        <p className="text-gray-400 text-sm">No attempts yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {Array.from(studentMap.entries()).map(
            ([studentId, studentData]) => {
              const bestAttempt = studentData.attempts.reduce((best, a) =>
                (a.percentage ?? 0) > (best.percentage ?? 0) ? a : best
              );

              return (
                <div
                  key={studentId}
                  className="flex items-center justify-between border border-gray-200 rounded-md p-3 text-sm"
                >
                  <span className="font-medium">
                    {studentData.name} {studentData.surname}
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-500">
                      {studentData.attempts.length} attempt
                      {studentData.attempts.length !== 1 ? "s" : ""}
                    </span>
                    <span>
                      Best: {bestAttempt.score}/{bestAttempt.maxScore} (
                      {bestAttempt.percentage}%)
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${
                        bestAttempt.passed
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {bestAttempt.passed ? "PASSED" : "FAILED"}
                    </span>
                  </div>
                </div>
              );
            }
          )}
        </div>
      )}
    </div>
  );
};

export default QuizResultsPage;
