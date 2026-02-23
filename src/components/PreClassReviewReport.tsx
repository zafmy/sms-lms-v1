"use client";

import { useTranslations } from "next-intl";

type StudentReviewData = {
  name: string;
  reviewsCompleted: number;
  completionRate: number;
  averageScore: number;
};

const PreClassReviewReport = ({
  students,
}: {
  students: StudentReviewData[];
}) => {
  const t = useTranslations("spaced_repetition.analytics");
  if (students.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-lg mb-2">{t("noEnrolledStudents")}</p>
        <p className="text-sm">
          {t("enrollStudentsMessage")}
        </p>
      </div>
    );
  }

  const classAverages = {
    reviewsCompleted:
      students.length > 0
        ? Math.round(
            students.reduce((sum, s) => sum + s.reviewsCompleted, 0) /
              students.length
          )
        : 0,
    completionRate:
      students.length > 0
        ? Math.round(
            students.reduce((sum, s) => sum + s.completionRate, 0) /
              students.length
          )
        : 0,
    averageScore:
      students.length > 0
        ? Math.round(
            students.reduce((sum, s) => sum + s.averageScore, 0) /
              students.length
          )
        : 0,
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">
        {t("preClassReviewEngagement")}
      </h2>
      <table className="w-full">
        <thead>
          <tr className="text-left text-sm text-gray-500 border-b">
            <th className="pb-2 px-2">{t("studentName")}</th>
            <th className="pb-2 px-2">{t("reviewsCompleted")}</th>
            <th className="pb-2 px-2">{t("completionRate")}</th>
            <th className="pb-2 px-2">{t("averageScore")}</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr
              key={student.name}
              className={`border-b ${
                student.reviewsCompleted === 0
                  ? "bg-red-50 text-red-700"
                  : "hover:bg-gray-50"
              }`}
            >
              <td className="py-3 px-2 text-sm font-medium">{student.name}</td>
              <td className="py-3 px-2 text-sm">{student.reviewsCompleted}</td>
              <td className="py-3 px-2 text-sm">{student.completionRate}%</td>
              <td className="py-3 px-2 text-sm">{student.averageScore}%</td>
            </tr>
          ))}
          <tr className="bg-gray-100 font-semibold">
            <td className="py-3 px-2 text-sm">{t("classAverage")}</td>
            <td className="py-3 px-2 text-sm">
              {classAverages.reviewsCompleted}
            </td>
            <td className="py-3 px-2 text-sm">
              {classAverages.completionRate}%
            </td>
            <td className="py-3 px-2 text-sm">
              {classAverages.averageScore}%
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default PreClassReviewReport;
