import {
  fetchStudentResults,
  computeGradeSummary,
} from "@/lib/gradeUtils";

const GradeSummary = async ({ studentId }: { studentId: string }) => {
  const results = await fetchStudentResults(studentId);
  const summary = computeGradeSummary(results);

  if (summary.totalResults === 0) {
    return (
      <div className="bg-white p-4 rounded-md">
        <h1 className="text-xl font-semibold">Grade Summary</h1>
        <p className="text-gray-400 mt-4">No grades recorded yet</p>
      </div>
    );
  }

  const averageColor =
    summary.overallAverage >= 80
      ? "text-green-600"
      : summary.overallAverage >= 60
        ? "text-yellow-600"
        : "text-red-600";

  return (
    <div className="bg-white p-4 rounded-md">
      <h1 className="text-xl font-semibold">Grade Summary</h1>
      <div className="flex flex-col items-center mt-4">
        <span className={`text-4xl font-bold ${averageColor}`}>
          {summary.overallAverage}
        </span>
        <span className="text-sm text-gray-400 mt-1">Overall Average</span>
      </div>
      <div className="grid grid-cols-3 gap-3 mt-4 text-center">
        <div>
          <span className="text-lg font-semibold">{summary.totalResults}</span>
          <p className="text-xs text-gray-400">Total</p>
        </div>
        <div>
          <span className="text-lg font-semibold">{summary.highestScore}</span>
          <p className="text-xs text-gray-400">Highest</p>
        </div>
        <div>
          <span className="text-lg font-semibold">{summary.lowestScore}</span>
          <p className="text-xs text-gray-400">Lowest</p>
        </div>
      </div>
      <div className="flex gap-3 mt-4">
        <div className="flex-1 bg-lamaSkyLight rounded-md p-3 text-center">
          <span className="text-lg font-semibold">
            {summary.examAverage ?? "-"}
          </span>
          <p className="text-xs text-gray-400">Exam Avg</p>
        </div>
        <div className="flex-1 bg-lamaYellowLight rounded-md p-3 text-center">
          <span className="text-lg font-semibold">
            {summary.assignmentAverage ?? "-"}
          </span>
          <p className="text-xs text-gray-400">Assignment Avg</p>
        </div>
      </div>
    </div>
  );
};

export default GradeSummary;
