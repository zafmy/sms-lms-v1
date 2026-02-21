import FormContainer from "@/components/FormContainer";
import Link from "next/link";

type QuizCardProps = {
  quiz: {
    id: number;
    title: string;
    timeLimit: number | null;
    maxAttempts: number;
    passScore: number;
    scoringPolicy: string;
    _count: { questions: number };
    attempts?: Array<{
      score: number | null;
      maxScore: number | null;
      percentage: number | null;
      passed: boolean | null;
    }>;
  };
  courseId: number;
  role?: string;
};

const QuizCard = ({ quiz, courseId, role }: QuizCardProps) => {
  const canEdit = role === "admin" || role === "teacher";
  const attempts = quiz.attempts || [];

  const getDisplayScore = () => {
    const completedAttempts = attempts.filter(
      (a) => a.percentage !== null && a.percentage !== undefined
    );
    if (completedAttempts.length === 0) return null;

    switch (quiz.scoringPolicy) {
      case "BEST":
        return Math.max(
          ...completedAttempts.map((a) => a.percentage ?? 0)
        );
      case "LATEST":
        return completedAttempts[completedAttempts.length - 1]?.percentage ?? 0;
      case "AVERAGE": {
        const sum = completedAttempts.reduce(
          (acc, a) => acc + (a.percentage ?? 0),
          0
        );
        return Math.round((sum / completedAttempts.length) * 10) / 10;
      }
      default:
        return completedAttempts[0]?.percentage ?? 0;
    }
  };

  const displayScore = getDisplayScore();
  const hasPassed = attempts.some((a) => a.passed);

  return (
    <div className="flex items-center justify-between text-sm py-3 px-3 border border-gray-200 rounded-md hover:bg-gray-50">
      <Link
        href={`/list/courses/${courseId}/quiz/${quiz.id}`}
        className="flex items-center gap-3 flex-1"
      >
        <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-semibold">
          Q
        </span>
        <div className="flex flex-col">
          <span className="font-medium hover:text-lamaPurple">
            {quiz.title}
          </span>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span>{quiz._count.questions} questions</span>
            {quiz.timeLimit && <span>{quiz.timeLimit} min</span>}
            <span>
              {quiz.maxAttempts} attempt{quiz.maxAttempts !== 1 ? "s" : ""}
            </span>
            <span>Pass: {quiz.passScore}%</span>
          </div>
        </div>
      </Link>

      <div className="flex items-center gap-3">
        {role === "student" && (
          <>
            {displayScore !== null ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {attempts.length}/{quiz.maxAttempts}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    hasPassed
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {displayScore}%
                </span>
              </div>
            ) : (
              <span className="text-xs text-gray-400">Not attempted</span>
            )}
          </>
        )}
        {canEdit && (
          <div className="flex items-center gap-2">
            <FormContainer table="quiz" type="update" data={quiz} />
            <FormContainer table="quiz" type="delete" id={quiz.id} />
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizCard;
