import QuizTakingClient from "@/components/QuizTakingClient";
import prisma from "@/lib/prisma";
import { startQuizAttempt } from "@/lib/actions";
import { fisherYatesShuffle } from "@/lib/shuffleUtils";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

/**
 * Reorder items to match a stored ID order.
 * When strict is false (default), items not in the order array are appended at the end.
 * When strict is true, only items present in the order array are returned (pool filtering).
 */
function reorderByIds<T extends { id: number }>(
  items: T[],
  order: number[],
  strict = false
): T[] {
  const map = new Map(items.map((item) => [item.id, item]));
  const ordered: T[] = [];
  for (const id of order) {
    const item = map.get(id);
    if (item) {
      ordered.push(item);
      map.delete(id);
    }
  }
  if (!strict) {
    // Append any items not in the stored order (backward compatibility)
    for (const item of map.values()) {
      ordered.push(item);
    }
  }
  return ordered;
}

const QuizPage = async ({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; quizId: string }>;
  searchParams: Promise<{ attempt?: string }>;
}) => {
  const { id, quizId } = await params;
  const { attempt: attemptParam } = await searchParams;
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const tc = await getTranslations("lms.courses");
  const tq = await getTranslations("lms.quizzes");

  const quiz = await prisma.quiz.findUnique({
    where: { id: parseInt(quizId) },
    include: {
      questions: {
        orderBy: { order: "asc" },
        include: {
          options: {
            orderBy: { order: "asc" },
            select: { id: true, text: true, order: true },
          },
        },
      },
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
      attempts: {
        where: { studentId: userId! },
        orderBy: { startedAt: "desc" },
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

  if (role === "admin" || role === "teacher") {
    // Teachers/admin see quiz info and can manage questions
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/list/courses" className="hover:text-lamaPurple">
            {tc("breadcrumbCourses")}
          </Link>
          <span>/</span>
          <Link
            href={`/list/courses/${course.id}`}
            className="hover:text-lamaPurple"
          >
            {course.title}
          </Link>
          <span>/</span>
          <span className="text-gray-700 font-medium">{quiz.title}</span>
        </div>

        <h1 className="text-2xl font-semibold mb-2">{quiz.title}</h1>
        {quiz.description && (
          <p className="text-gray-600 mb-4">{quiz.description}</p>
        )}

        <div className="flex gap-6 text-sm text-gray-500 mb-6">
          <span>{tq("questionsCount", { count: quiz.questions.length })}</span>
          {quiz.poolSize && quiz.poolSize > 0 && quiz.poolSize < quiz.questions.length && (
            <span>
              {tq("poolSizeDisplay", { count: quiz.poolSize, total: quiz.questions.length })}
            </span>
          )}
          {quiz.timeLimit && <span>{tq("timeLimitLabel", { minutes: quiz.timeLimit })}</span>}
          <span>{tq("maxAttemptsLabel", { count: quiz.maxAttempts })}</span>
          <span>{tq("passScoreLabel", { score: quiz.passScore })}</span>
          <span>{tq("scoringLabel", { policy: quiz.scoringPolicy })}</span>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <Link
            href={`/list/courses/${course.id}/quiz/${quiz.id}/results`}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md text-sm hover:bg-blue-200"
          >
            {tq("viewResults")}
          </Link>
        </div>

        <h2 className="text-lg font-semibold mb-3">{tq("questionsHeading")}</h2>
        {quiz.questions.length === 0 ? (
          <p className="text-gray-400 text-sm">{tq("noQuestionsYet")}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {quiz.questions.map((q, i) => (
              <div
                key={q.id}
                className="border border-gray-200 rounded-md p-3"
              >
                <div className="flex items-start justify-between">
                  <span className="text-sm">
                    <span className="text-gray-400 mr-2">#{i + 1}</span>
                    {q.text}
                  </span>
                  <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                    {tq("ptAbbrev", { points: q.points, suffix: q.points !== 1 ? "s" : "" })} | {q.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Student flow
  if (role !== "student") {
    return notFound();
  }

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

  const studentAttempts = quiz.attempts;
  const maxReached = studentAttempts.length >= quiz.maxAttempts;

  // Check if student is in an active attempt (started but not submitted)
  const activeAttempt = studentAttempts.find((a) => !a.submittedAt);

  // If attemptParam=start, start a new attempt
  if (attemptParam === "start" && !maxReached && !activeAttempt) {
    const result = await startQuizAttempt(quiz.id);
    if (result.success && result.message) {
      redirect(
        `/list/courses/${id}/quiz/${quizId}?attempt=${result.message}`
      );
    }
  }

  // If attemptParam is a number, show the quiz-taking interface
  if (attemptParam && attemptParam !== "start") {
    const currentAttempt = await prisma.quizAttempt.findFirst({
      where: {
        id: parseInt(attemptParam),
        studentId: userId!,
        submittedAt: null,
      },
    });

    if (currentAttempt) {
      // Prepare questions using stored order or compute new shuffle
      let preparedQuestions = [...quiz.questions];

      const storedQuestionOrder = currentAttempt.questionOrder as number[] | null;
      const storedOptionOrder = currentAttempt.optionOrder as Record<string, number[]> | null;

      if (storedQuestionOrder) {
        // Restore persisted question order (also filters to pool-selected questions only)
        preparedQuestions = reorderByIds(preparedQuestions, storedQuestionOrder, true);
      } else if (quiz.randomizeQuestions) {
        preparedQuestions = fisherYatesShuffle(preparedQuestions);
      }

      const questionsForClient = preparedQuestions.map((q) => {
        let options = [...q.options];

        if (storedOptionOrder && storedOptionOrder[String(q.id)]) {
          // Restore persisted option order
          options = reorderByIds(options, storedOptionOrder[String(q.id)]);
        } else if (quiz.randomizeOptions && q.type !== "FILL_IN_BLANK") {
          options = fisherYatesShuffle(options);
        }

        return {
          id: q.id,
          text: q.text,
          type: q.type,
          points: q.points,
          options: options.map((o) => ({ id: o.id, text: o.text })),
        };
      });

      return (
        <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
            <Link href="/list/courses" className="hover:text-lamaPurple">
              {tc("breadcrumbCourses")}
            </Link>
            <span>/</span>
            <Link
              href={`/list/courses/${course.id}`}
              className="hover:text-lamaPurple"
            >
              {course.title}
            </Link>
            <span>/</span>
            <span className="text-gray-700 font-medium">{quiz.title}</span>
          </div>

          <h1 className="text-2xl font-semibold mb-6">{quiz.title}</h1>

          <QuizTakingClient
            attemptId={currentAttempt.id}
            courseId={course.id}
            quizId={quiz.id}
            timeLimit={quiz.timeLimit}
            questions={questionsForClient}
          />
        </div>
      );
    }
  }

  // Default: show quiz overview / start page
  const getDisplayScore = () => {
    const completed = studentAttempts.filter((a) => a.percentage !== null);
    if (completed.length === 0) return null;

    switch (quiz.scoringPolicy) {
      case "BEST":
        return Math.max(...completed.map((a) => a.percentage ?? 0));
      case "LATEST":
        return completed[0]?.percentage ?? 0;
      case "AVERAGE": {
        const sum = completed.reduce(
          (acc, a) => acc + (a.percentage ?? 0),
          0
        );
        return Math.round((sum / completed.length) * 10) / 10;
      }
      default:
        return null;
    }
  };

  const displayScore = getDisplayScore();

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/list/courses" className="hover:text-lamaPurple">
          {tc("breadcrumbCourses")}
        </Link>
        <span>/</span>
        <Link
          href={`/list/courses/${course.id}`}
          className="hover:text-lamaPurple"
        >
          {course.title}
        </Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">{quiz.title}</span>
      </div>

      <h1 className="text-2xl font-semibold mb-2">{quiz.title}</h1>
      {quiz.description && (
        <p className="text-gray-600 mb-4">{quiz.description}</p>
      )}

      <div className="flex gap-6 text-sm text-gray-500 mb-6">
        <span>{tq("questionsCount", { count: quiz.questions.length })}</span>
        {quiz.poolSize && quiz.poolSize > 0 && quiz.poolSize < quiz.questions.length && (
          <span>
            {tq("poolSizeDisplay", { count: quiz.poolSize, total: quiz.questions.length })}
          </span>
        )}
        {quiz.timeLimit && <span>{tq("timeLimitLabel", { minutes: quiz.timeLimit })}</span>}
        <span>{tq("passScoreLabel", { score: quiz.passScore })}</span>
      </div>

      {/* Previous attempts info */}
      {studentAttempts.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">{tq("yourAttempts")}</h2>
          <div className="flex flex-col gap-2">
            {studentAttempts
              .filter((a) => a.submittedAt)
              .map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between border border-gray-200 rounded-md p-3 text-sm"
                >
                  <span>{tq("attemptNum", { number: a.attemptNumber })}</span>
                  <div className="flex items-center gap-3">
                    <span>{a.percentage}%</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${
                        a.passed
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {a.passed ? tq("passed") : tq("failed")}
                    </span>
                  </div>
                </div>
              ))}
          </div>
          {displayScore !== null && (
            <p className="text-sm text-gray-500 mt-2">
              {tq("scorePolicy", { policy: quiz.scoringPolicy.toLowerCase() })}{" "}
              <span className="font-medium">{displayScore}%</span>
            </p>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-4">
        {maxReached ? (
          <p className="text-sm text-gray-500">
            {tq("maxAttemptsReached", { used: quiz.maxAttempts, max: quiz.maxAttempts })}
          </p>
        ) : activeAttempt ? (
          <Link
            href={`/list/courses/${id}/quiz/${quizId}?attempt=${activeAttempt.id}`}
            className="px-6 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
          >
            {tq("continueQuiz")}
          </Link>
        ) : (
          <Link
            href={`/list/courses/${id}/quiz/${quizId}?attempt=start`}
            className="px-6 py-2 bg-green-500 text-white rounded-md text-sm hover:bg-green-600"
          >
            {tq("startQuiz", { current: studentAttempts.length + 1, max: quiz.maxAttempts })}
          </Link>
        )}

        {studentAttempts.some((a) => a.submittedAt) && (
          <Link
            href={`/list/courses/${id}/quiz/${quizId}/results`}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200"
          >
            {tq("viewResults")}
          </Link>
        )}
      </div>
    </div>
  );
};

export default QuizPage;
