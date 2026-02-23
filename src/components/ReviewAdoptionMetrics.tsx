"use client";

import { useTranslations } from "next-intl";

interface ReviewAdoptionMetricsProps {
  metrics: {
    adoptionRate: number;
    avgMastery: number;
    totalSessions: number;
    totalStudents: number;
    activeStudents: number;
  };
}

const rateColor = (rate: number) =>
  rate >= 90
    ? "text-green-600"
    : rate >= 75
      ? "text-yellow-600"
      : "text-red-600";

const ReviewAdoptionMetrics = ({ metrics }: ReviewAdoptionMetricsProps) => {
  const t = useTranslations("dashboard.admin");

  return (
    <div className="bg-white p-4 rounded-md">
      <h3 className="text-lg font-semibold">{t("reviewAdoption")}</h3>
      <div className="flex gap-4 mt-3">
        {/* Adoption Rate */}
        <div className="flex-1 flex flex-col items-center">
          <span className={`text-2xl font-bold ${rateColor(metrics.adoptionRate)}`}>
            {metrics.adoptionRate}%
          </span>
          <span className="text-xs text-gray-400">{t("adoptionRate")}</span>
        </div>
        {/* Avg Mastery */}
        <div className="flex-1 flex flex-col items-center">
          <span className={`text-2xl font-bold ${rateColor(metrics.avgMastery)}`}>
            {metrics.avgMastery}%
          </span>
          <span className="text-xs text-gray-400">{t("avgMastery")}</span>
        </div>
        {/* Total Sessions */}
        <div className="flex-1 flex flex-col items-center">
          <span className="text-2xl font-bold">{metrics.totalSessions}</span>
          <span className="text-xs text-gray-400">{t("totalSessions")}</span>
        </div>
        {/* Active / Total Students */}
        <div className="flex-1 flex flex-col items-center">
          <span className="text-2xl font-bold">
            {metrics.activeStudents}/{metrics.totalStudents}
          </span>
          <span className="text-xs text-gray-400">{t("activeStudents")}</span>
        </div>
      </div>
    </div>
  );
};

export default ReviewAdoptionMetrics;
