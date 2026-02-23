"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface HeatmapDatum {
  date: string;
  count: number;
}

// Get intensity class based on activity count
const getIntensityClass = (count: number): string => {
  if (count === 0) return "bg-gray-100";
  if (count === 1) return "bg-green-200";
  if (count <= 3) return "bg-green-400";
  return "bg-green-600";
};

const LearningActivityHeatmap = ({
  data,
}: {
  data: HeatmapDatum[];
}) => {
  const t = useTranslations("dashboard");
  const [hoveredCell, setHoveredCell] = useState<{
    date: string;
    count: number;
  } | null>(null);

  const monthKeys = [
    "common.jan", "common.feb", "common.mar", "common.apr",
    "common.may", "common.jun", "common.jul", "common.aug",
    "common.sep", "common.oct", "common.nov", "common.dec",
  ] as const;

  if (data.length === 0) {
    return (
      <div className="bg-white p-4 rounded-md">
        <h2 className="text-lg font-semibold">{t("student.learningActivity")}</h2>
        <p className="text-gray-400 text-sm mt-4">
          {t("student.noLearningActivity")}
        </p>
      </div>
    );
  }

  // Build a lookup map for quick access
  const countMap = new Map<string, number>();
  for (const d of data) {
    countMap.set(d.date, d.count);
  }

  // Group data by month from Jan to current month
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const monthsToShow = Array.from({ length: currentMonth + 1 }, (_, i) => i);

  // Build day cells for each month
  const monthRows = monthsToShow.map((month) => {
    const daysInMonth = new Date(currentYear, month + 1, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dateStr = `${currentYear}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const count = countMap.get(dateStr) ?? 0;
      return { dateStr, count };
    });
    return { month, days };
  });

  return (
    <div className="bg-white p-4 rounded-md">
      <h2 className="text-lg font-semibold mb-3">{t("student.learningActivity")}</h2>
      <div className="flex flex-col gap-2">
        {monthRows.map(({ month, days }) => (
          <div key={month} className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-8 shrink-0">
              {t(monthKeys[month])}
            </span>
            <div className="flex flex-wrap gap-1">
              {days.map(({ dateStr, count }) => (
                <div
                  key={dateStr}
                  className={`w-3 h-3 rounded-xs ${getIntensityClass(count)}`}
                  title={t("common.heatmapTooltip", { date: dateStr, count })}
                  onMouseEnter={() =>
                    setHoveredCell({ date: dateStr, count })
                  }
                  onMouseLeave={() => setHoveredCell(null)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Tooltip */}
      {hoveredCell && (
        <div className="mt-2 text-xs text-gray-600">
          {t("common.heatmapTooltip", { date: hoveredCell.date, count: hoveredCell.count })}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
        <span className="text-xs text-gray-500">{t("student.less")}</span>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-xs bg-gray-100" />
          <div className="w-3 h-3 rounded-xs bg-green-200" />
          <div className="w-3 h-3 rounded-xs bg-green-400" />
          <div className="w-3 h-3 rounded-xs bg-green-600" />
        </div>
        <span className="text-xs text-gray-500">{t("student.more")}</span>
      </div>
    </div>
  );
};

export default LearningActivityHeatmap;
