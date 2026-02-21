import {
  fetchStudentResults,
  computeSubjectGrades,
} from "@/lib/gradeUtils";

const SubjectGrades = async ({ studentId }: { studentId: string }) => {
  const results = await fetchStudentResults(studentId);
  const subjectGrades = computeSubjectGrades(results);

  if (subjectGrades.length === 0) {
    return (
      <div className="bg-white p-4 rounded-md">
        <h1 className="text-xl font-semibold">Subject Grades</h1>
        <p className="text-gray-400 mt-4">No grades recorded yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-md">
      <h1 className="text-xl font-semibold">Subject Grades</h1>
      <div className="flex flex-col mt-4">
        {subjectGrades.map((row, index) => {
          const averageColor =
            row.overallAverage >= 80
              ? "text-green-600"
              : row.overallAverage >= 60
                ? "text-yellow-600"
                : "text-red-600";

          return (
            <div
              key={row.subjectName}
              className={`flex items-center justify-between py-3 ${
                index < subjectGrades.length - 1 ? "border-b" : ""
              }`}
            >
              <div className="flex flex-col gap-1">
                <span className="font-bold">{row.subjectName}</span>
                <div className="flex gap-2">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    {row.examCount} {row.examCount === 1 ? "Exam" : "Exams"}
                  </span>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                    {row.assignmentCount}{" "}
                    {row.assignmentCount === 1
                      ? "Assignment"
                      : "Assignments"}
                  </span>
                </div>
              </div>
              <span className={`text-2xl font-bold ${averageColor}`}>
                {row.overallAverage}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SubjectGrades;
