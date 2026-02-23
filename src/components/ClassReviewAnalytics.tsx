"use client";

import { useLocale, useTranslations } from "next-intl";
import { getIntlLocale } from "@/lib/formatUtils";
import type { StudentReviewData, StruggledCardData } from "@/lib/reviewAnalyticsUtils";

interface ClassReviewAnalyticsProps {
  stats: {
    avgCompletion: number;
    avgMastery: number;
    totalSessions: number;
    activeStudents: number;
  };
  students: StudentReviewData[];
  struggledCards: StruggledCardData[];
}

const rateColor = (rate: number) =>
  rate >= 70
    ? "text-green-600"
    : rate >= 40
      ? "text-yellow-600"
      : "text-red-600";

const ClassReviewAnalytics = ({
  stats,
  students,
  struggledCards,
}: ClassReviewAnalyticsProps) => {
  const t = useTranslations("spaced_repetition.analytics");
  const locale = useLocale();
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div>
        <h3 className="text-lg font-semibold mb-3">{t("reviewAnalytics")}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-3 rounded-md text-center">
            <span className={`text-2xl font-bold ${rateColor(stats.avgCompletion)}`}>
              {stats.avgCompletion}%
            </span>
            <p className="text-xs text-gray-400 mt-1">{t("avgCorrectRate")}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-md text-center">
            <span className={`text-2xl font-bold ${rateColor(stats.avgMastery)}`}>
              {stats.avgMastery}%
            </span>
            <p className="text-xs text-gray-400 mt-1">{t("avgMastery")}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-md text-center">
            <span className="text-2xl font-bold">{stats.totalSessions}</span>
            <p className="text-xs text-gray-400 mt-1">{t("totalSessions")}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-md text-center">
            <span className="text-2xl font-bold">{stats.activeStudents}</span>
            <p className="text-xs text-gray-400 mt-1">{t("activeStudents")}</p>
          </div>
        </div>
      </div>

      {/* Struggled Cards Table */}
      {struggledCards.length > 0 && (
        <div>
          <h4 className="text-md font-medium mb-2">{t("mostStruggledCards")}</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-2 pr-4">{t("cardFront")}</th>
                  <th className="py-2 pr-4 text-right">{t("hardRate")}</th>
                  <th className="py-2 pr-4 text-right">{t("hardCount")}</th>
                  <th className="py-2 text-right">{t("totalReviews")}</th>
                </tr>
              </thead>
              <tbody>
                {struggledCards.map((card) => (
                  <tr key={card.cardId} className="border-b last:border-0">
                    <td className="py-2 pr-4 max-w-[200px] truncate">
                      {card.front}
                    </td>
                    <td className={`py-2 pr-4 text-right font-medium ${rateColor(100 - card.hardRate)}`}>
                      {card.hardRate}%
                    </td>
                    <td className="py-2 pr-4 text-right">{card.hardCount}</td>
                    <td className="py-2 text-right">{card.totalReviews}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Per-Student Table */}
      {students.length > 0 && (
        <div>
          <h4 className="text-md font-medium mb-2">{t("studentReviewProgress")}</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-2 pr-4">{t("student")}</th>
                  <th className="py-2 pr-4 text-right">{t("sessions")}</th>
                  <th className="py-2 pr-4 text-right">{t("mastery")}</th>
                  <th className="py-2 pr-4 text-right">{t("correctRate")}</th>
                  <th className="py-2 text-right">{t("lastSession")}</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const masteryPct =
                    student.totalCards > 0
                      ? Math.round(
                          (student.masteredCards / student.totalCards) * 100
                        )
                      : 0;
                  return (
                    <tr
                      key={student.studentId}
                      className="border-b last:border-0"
                    >
                      <td className="py-2 pr-4">{student.studentName}</td>
                      <td className="py-2 pr-4 text-right">
                        {student.sessionsCompleted}
                      </td>
                      <td
                        className={`py-2 pr-4 text-right font-medium ${rateColor(masteryPct)}`}
                      >
                        {masteryPct}%
                      </td>
                      <td
                        className={`py-2 pr-4 text-right font-medium ${rateColor(student.averageCorrectRate)}`}
                      >
                        {Math.round(student.averageCorrectRate)}%
                      </td>
                      <td className="py-2 text-right text-gray-500">
                        {student.lastSessionDate
                          ? new Date(student.lastSessionDate).toLocaleDateString(getIntlLocale(locale))
                          : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassReviewAnalytics;
