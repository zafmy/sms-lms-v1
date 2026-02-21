import { CourseQuizGroup } from "./ClassQuizAnalyticsContainer";

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

function colorClass(value: number): string {
  if (value >= 90) return "text-green-600";
  if (value >= 75) return "text-yellow-600";
  return "text-red-600";
}

const ClassQuizAnalytics = ({
  courseGroups,
}: {
  courseGroups: CourseQuizGroup[];
}) => {
  if (courseGroups.length === 0) {
    return (
      <div className="bg-white rounded-md p-4">
        <h1 className="text-xl font-semibold">Quiz Analytics</h1>
        <p className="text-sm text-gray-400 mt-4">
          No quiz data available.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-md p-4">
      <h1 className="text-xl font-semibold">Quiz Analytics</h1>
      <div className="flex flex-col gap-4 mt-4">
        {courseGroups.map((group) => (
          <div key={group.courseId}>
            <h2 className="text-sm font-medium text-gray-600 mb-2">
              {group.courseTitle}
            </h2>
            <div className="flex flex-col gap-2">
              {group.quizzes.map((quiz) => (
                <div
                  key={quiz.quizId}
                  className="border border-gray-100 rounded-md p-3"
                >
                  <p className="text-sm font-medium mb-2">{quiz.title}</p>
                  <div className="grid grid-cols-3 gap-2 text-center mb-2">
                    <div>
                      <p className="text-xs text-gray-500">Attempts</p>
                      <p className="text-sm font-bold">
                        {quiz.studentsAttempted}/{quiz.totalEnrolled}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Avg Score</p>
                      <p
                        className={`text-sm font-bold ${colorClass(quiz.avgScore)}`}
                      >
                        {quiz.avgScore}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Pass Rate</p>
                      <p
                        className={`text-sm font-bold ${colorClass(quiz.passRate)}`}
                      >
                        {quiz.passRate}%
                      </p>
                    </div>
                  </div>
                  {quiz.mostMissedQuestion && (
                    <p className="text-xs text-gray-500">
                      <span className="font-medium text-orange-600">
                        Most missed:
                      </span>{" "}
                      {truncate(quiz.mostMissedQuestion, 80)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClassQuizAnalytics;
