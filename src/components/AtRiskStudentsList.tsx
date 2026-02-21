"use client";

import type { AtRiskStudent } from "@/lib/lmsAnalyticsUtils";

const formatDate = (date: Date | null): string => {
  if (!date) return "No activity";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getDaysColor = (days: number): string => {
  if (days >= 14) return "text-red-600 font-semibold";
  if (days >= 7) return "text-yellow-600 font-semibold";
  return "text-gray-700";
};

const AtRiskStudentsList = ({
  students,
}: {
  students: AtRiskStudent[];
}) => {
  if (students.length === 0) {
    return (
      <div className="bg-white rounded-md p-4 border border-gray-100">
        <h2 className="text-lg font-semibold mb-3">At-Risk Students</h2>
        <p className="text-gray-400 text-sm mt-4">
          No at-risk students detected.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-md p-4 border border-gray-100">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-semibold">At-Risk Students</h2>
        <span className="bg-red-100 text-red-700 text-xs font-medium px-2 py-0.5 rounded-full">
          {students.length}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-3 text-gray-500 font-medium">
                Student Name
              </th>
              <th className="text-left py-2 px-3 text-gray-500 font-medium">
                Last Activity
              </th>
              <th className="text-left py-2 px-3 text-gray-500 font-medium">
                Days Inactive
              </th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr
                key={student.studentId}
                className="border-b border-gray-100 last:border-b-0"
              >
                <td className="py-2 px-3 text-gray-800">
                  {student.studentName}
                </td>
                <td className="py-2 px-3 text-gray-600">
                  {formatDate(student.lastActivityDate)}
                </td>
                <td className={`py-2 px-3 ${getDaysColor(student.daysInactive)}`}>
                  {student.daysInactive >= 999
                    ? "Never active"
                    : `${student.daysInactive} days`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AtRiskStudentsList;
