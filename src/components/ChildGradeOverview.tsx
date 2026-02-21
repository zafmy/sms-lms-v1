import Link from "next/link";
import {
  fetchStudentResults,
  computeSubjectGrades,
  computeGradeSummary,
} from "@/lib/gradeUtils";

const ChildGradeOverview = async ({
  studentId,
  studentName,
}: {
  studentId: string;
  studentName: string;
}) => {
  const results = await fetchStudentResults(studentId);
  const subjectGrades = computeSubjectGrades(results);
  const summary = computeGradeSummary(results);

  if (summary.totalResults === 0) {
    return (
      <div className="bg-white p-4 rounded-md">
        <h3 className="text-lg font-semibold">{studentName} - Grades</h3>
        <p className="text-gray-400 mt-2 text-sm">No grades recorded</p>
      </div>
    );
  }

  // Color-code overall average
  const averageColor =
    summary.overallAverage >= 80
      ? "text-green-600"
      : summary.overallAverage >= 60
        ? "text-yellow-600"
        : "text-red-600";

  // Show max 5 subjects
  const displayedSubjects = subjectGrades.slice(0, 5);
  const remainingCount = subjectGrades.length - displayedSubjects.length;

  return (
    <div className="bg-white p-4 rounded-md">
      <h3 className="text-lg font-semibold">{studentName} - Grades</h3>
      <div className="mt-3 flex items-center gap-4">
        {/* Overall average with accent background */}
        <div className="bg-lamaSkyLight rounded-md px-4 py-2 flex flex-col items-center">
          <span className={`text-3xl font-bold ${averageColor}`}>
            {summary.overallAverage}
          </span>
          <span className="text-xs text-gray-400">Overall Avg</span>
        </div>
        {/* Per-subject compact list */}
        <div className="flex-1">
          <ul className="text-sm space-y-1">
            {displayedSubjects.map((subject) => (
              <li
                key={subject.subjectName}
                className="flex items-center justify-between"
              >
                <span className="text-gray-600">{subject.subjectName}</span>
                <span className="font-medium">{subject.overallAverage}</span>
              </li>
            ))}
          </ul>
          {remainingCount > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              and {remainingCount} more...
            </p>
          )}
        </div>
      </div>
      <Link
        href={`/list/students/${studentId}/report-card`}
        className="text-sm text-blue-500 hover:underline mt-2 block"
      >
        View Report Card
      </Link>
    </div>
  );
};

export default ChildGradeOverview;
