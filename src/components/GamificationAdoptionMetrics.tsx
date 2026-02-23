import prisma from "@/lib/prisma";
import { getTranslations } from "next-intl/server";

const GamificationAdoptionMetrics = async () => {
  const t = await getTranslations("dashboard.admin");

  const [activeStreaks, avgXpResult, badgesAwarded, totalStudents] =
    await Promise.all([
      prisma.studentGamification.count({
        where: { currentStreak: { gt: 0 } },
      }),
      prisma.studentGamification.aggregate({
        _avg: { totalXp: true },
      }),
      prisma.studentBadge.count(),
      prisma.studentGamification.count(),
    ]);

  const avgXp = avgXpResult._avg.totalXp ?? 0;

  return (
    <div className="bg-white p-4 rounded-md">
      <h3 className="text-lg font-semibold">{t("gamificationMetrics")}</h3>
      <div className="flex gap-4 mt-3">
        {/* Active Streaks */}
        <div className="flex-1 flex flex-col items-center">
          <span className="text-2xl font-bold">{activeStreaks}</span>
          <span className="text-xs text-gray-400">{t("activeStreaks")}</span>
        </div>
        {/* Avg XP */}
        <div className="flex-1 flex flex-col items-center">
          <span className="text-2xl font-bold">{Math.round(avgXp)}</span>
          <span className="text-xs text-gray-400">{t("avgXp")}</span>
        </div>
        {/* Badges Awarded */}
        <div className="flex-1 flex flex-col items-center">
          <span className="text-2xl font-bold">{badgesAwarded}</span>
          <span className="text-xs text-gray-400">{t("badgesEarned")}</span>
        </div>
        {/* Total Students */}
        <div className="flex-1 flex flex-col items-center">
          <span className="text-2xl font-bold">{totalStudents}</span>
          <span className="text-xs text-gray-400">{t("activeStudents")}</span>
        </div>
      </div>
    </div>
  );
};

export default GamificationAdoptionMetrics;
