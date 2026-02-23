import prisma from "@/lib/prisma";
import { getLocale, getTranslations } from "next-intl/server";
import { getIntlLocale } from "@/lib/formatUtils";

const ChildGamificationStats = async ({
  studentId,
  studentName,
}: {
  studentId: string;
  studentName: string;
}) => {
  const t = await getTranslations("dashboard.parent");
  const locale = await getLocale();

  const gamification = await prisma.studentGamification.findUnique({
    where: { studentId },
  });

  // Fetch latest earned badge name
  const latestBadge = await prisma.studentBadge.findFirst({
    where: { studentId },
    orderBy: { earnedAt: "desc" },
    include: { badge: { select: { name: true } } },
  });

  if (!gamification) {
    return (
      <div className="bg-white rounded-md p-4">
        <h2 className="text-lg font-semibold border-b pb-2">
          {studentName} - {t("gamification")}
        </h2>
        <p className="text-gray-400 text-sm mt-3">{t("notStarted")}</p>
      </div>
    );
  }

  const streakColor = gamification.currentStreak > 0 ? "text-orange-500" : "text-gray-400";

  return (
    <div className="bg-white rounded-md p-4">
      <h2 className="text-lg font-semibold border-b pb-2">
        {studentName} - {t("gamification")}
      </h2>
      <div className="flex gap-4 mt-3">
        {/* Level */}
        <div className="flex-1 flex flex-col items-center">
          <span className="text-2xl font-bold text-blue-500">
            Lv.{gamification.currentLevel}
          </span>
          <span className="text-xs text-gray-400">{t("levelLabel")}</span>
        </div>
        {/* Total XP */}
        <div className="flex-1 flex flex-col items-center">
          <span className="text-2xl font-bold">
            {gamification.totalXp.toLocaleString(getIntlLocale(locale))}
          </span>
          <span className="text-xs text-gray-400">{t("totalXp")}</span>
        </div>
        {/* Current Streak */}
        <div className="flex-1 flex flex-col items-center">
          <span className={`text-2xl font-bold ${streakColor}`}>
            {gamification.currentStreak > 0
              ? `${gamification.currentStreak} \u{1F525}`
              : "0"}
          </span>
          <span className="text-xs text-gray-400">{t("streakLabel")}</span>
        </div>
        {/* Latest Badge */}
        <div className="flex-1 flex flex-col items-center">
          <span className="text-2xl font-bold truncate max-w-[100px] text-center">
            {latestBadge ? latestBadge.badge.name : "-"}
          </span>
          <span className="text-xs text-gray-400">{t("latestBadge")}</span>
        </div>
      </div>
    </div>
  );
};

export default ChildGamificationStats;
