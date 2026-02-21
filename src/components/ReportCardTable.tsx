"use client";

import { useState, useMemo } from "react";
import { SubjectGradeRow } from "@/lib/gradeUtils";

type SortKey = keyof SubjectGradeRow;

const ReportCardTable = ({ data }: { data: SubjectGradeRow[] }) => {
  const [sortConfig, setSortConfig] = useState<{
    key: SortKey;
    direction: "asc" | "desc";
  }>({ key: "subjectName", direction: "asc" });

  const sortedData = useMemo(() => {
    const sorted = [...data].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      // Handle null values -- push nulls to the end
      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortConfig.direction === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });
    return sorted;
  }, [data, sortConfig]);

  const handleSort = (key: SortKey) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getSortIndicator = (key: SortKey) => {
    if (sortConfig.key !== key) return "";
    return sortConfig.direction === "asc" ? " \u25B2" : " \u25BC";
  };

  const getScoreColor = (score: number | null): string => {
    if (score === null) return "";
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  // Compute summary row values
  const summary = useMemo(() => {
    if (data.length === 0) {
      return {
        avgExam: null,
        avgAssignment: null,
        avgOverall: 0,
        totalAssessments: 0,
      };
    }

    const examRows = data.filter((r) => r.examAverage !== null);
    const assignmentRows = data.filter((r) => r.assignmentAverage !== null);

    const avgExam =
      examRows.length > 0
        ? Math.round(
            (examRows.reduce((sum, r) => sum + r.examAverage!, 0) /
              examRows.length) *
              10
          ) / 10
        : null;

    const avgAssignment =
      assignmentRows.length > 0
        ? Math.round(
            (assignmentRows.reduce((sum, r) => sum + r.assignmentAverage!, 0) /
              assignmentRows.length) *
              10
          ) / 10
        : null;

    const avgOverall =
      Math.round(
        (data.reduce((sum, r) => sum + r.overallAverage, 0) / data.length) * 10
      ) / 10;

    const totalAssessments = data.reduce(
      (sum, r) => sum + r.totalAssessments,
      0
    );

    return { avgExam, avgAssignment, avgOverall, totalAssessments };
  }, [data]);

  const columns: { key: SortKey; label: string }[] = [
    { key: "subjectName", label: "Subject Name" },
    { key: "examAverage", label: "Exam Average" },
    { key: "assignmentAverage", label: "Assignment Average" },
    { key: "overallAverage", label: "Overall Average" },
    { key: "totalAssessments", label: "Assessments" },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                onClick={() => handleSort(col.key)}
                className="bg-lamaSky text-left p-3 text-sm font-semibold cursor-pointer hover:bg-lamaSkyLight select-none"
              >
                {col.label}
                {getSortIndicator(col.key)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row) => (
            <tr
              key={row.subjectName}
              className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
            >
              <td className="p-3 font-medium">{row.subjectName}</td>
              <td className={`p-3 ${getScoreColor(row.examAverage)}`}>
                {row.examAverage === null ? "-" : row.examAverage}
              </td>
              <td className={`p-3 ${getScoreColor(row.assignmentAverage)}`}>
                {row.assignmentAverage === null ? "-" : row.assignmentAverage}
              </td>
              <td className={`p-3 ${getScoreColor(row.overallAverage)}`}>
                {row.overallAverage}
              </td>
              <td className="p-3">{row.totalAssessments}</td>
            </tr>
          ))}
          {/* Summary Row */}
          <tr className="font-bold bg-gray-50">
            <td className="p-3">Overall</td>
            <td className={`p-3 ${getScoreColor(summary.avgExam)}`}>
              {summary.avgExam === null ? "-" : summary.avgExam}
            </td>
            <td className={`p-3 ${getScoreColor(summary.avgAssignment)}`}>
              {summary.avgAssignment === null ? "-" : summary.avgAssignment}
            </td>
            <td className={`p-3 ${getScoreColor(summary.avgOverall)}`}>
              {summary.avgOverall}
            </td>
            <td className="p-3">{summary.totalAssessments}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default ReportCardTable;
