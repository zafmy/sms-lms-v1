"use client";

import { useTranslations } from "next-intl";

const StreakCalendar = ({
  activityDates,
  currentStreak,
}: {
  activityDates: string[];
  currentStreak: number;
}) => {
  const t = useTranslations("gamification.streaks");
  const activitySet = new Set(activityDates);

  // Build last 30 days
  const today = new Date();
  const days: { dateStr: string; isActive: boolean }[] = [];

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    days.push({
      dateStr,
      isActive: activitySet.has(dateStr),
    });
  }

  return (
    <div className="bg-white p-4 rounded-md">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">{t("activityStreak")}</h2>
        <div className="flex items-center gap-1">
          <span className="text-orange-500 text-lg">&#128293;</span>
          <span className="text-sm font-bold">{currentStreak}</span>
          <span className="text-xs text-gray-500">
            {currentStreak !== 1 ? t("days") : t("day")}
          </span>
        </div>
      </div>

      {/* Calendar grid - 30 days in rows of 7 */}
      <div className="grid grid-cols-7 gap-1">
        {days.map(({ dateStr, isActive }) => (
          <div
            key={dateStr}
            className={`w-full aspect-square rounded-sm ${
              isActive ? "bg-green-400" : "bg-gray-100"
            }`}
            title={`${dateStr}${isActive ? " - Active" : ""}`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-green-400" />
          <span className="text-xs text-gray-500">{t("active")}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-gray-100" />
          <span className="text-xs text-gray-500">{t("inactive")}</span>
        </div>
        <span className="text-xs text-gray-400 ml-auto">{t("last30Days")}</span>
      </div>
    </div>
  );
};

export default StreakCalendar;
