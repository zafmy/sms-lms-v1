"use client";

import { useState } from "react";
import type { DailyEngagement } from "@/lib/lmsAnalyticsUtils";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

const getIntensityClass = (total: number): string => {
  if (total === 0) return "bg-gray-200";
  if (total <= 2) return "bg-green-200";
  if (total <= 5) return "bg-green-400";
  return "bg-green-600";
};

const LmsEngagementHeatmap = ({
  data,
}: {
  data: DailyEngagement[];
}) => {
  const [hoveredCell, setHoveredCell] = useState<DailyEngagement | null>(null);

  const hasData = data.some((d) => d.total > 0);

  if (!hasData) {
    return (
      <div className="bg-white rounded-md p-4 border border-gray-100">
        <h2 className="text-lg font-semibold mb-3">
          Engagement Heatmap (90 Days)
        </h2>
        <p className="text-gray-400 text-sm mt-4">
          No engagement activity recorded.
        </p>
      </div>
    );
  }

  // Build lookup map
  const dataMap = new Map<string, DailyEngagement>();
  for (const d of data) {
    dataMap.set(d.date, d);
  }

  // Build 90-day grid
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 89);

  // Build weeks (columns) from startDate to today
  // Each week is an array of 7 cells (Sun=0 to Sat=6)
  const weeks: (DailyEngagement | null)[][] = [];
  const current = new Date(startDate);

  // Align to start of week (Sunday)
  const startDayOfWeek = current.getDay();
  if (startDayOfWeek > 0) {
    // Add null cells for days before startDate in the first week
    const firstWeek: (DailyEngagement | null)[] = new Array(startDayOfWeek).fill(null);
    weeks.push(firstWeek);
  } else {
    weeks.push([]);
  }

  while (current <= today) {
    const dateStr = current.toISOString().slice(0, 10);
    const dayOfWeek = current.getDay();

    if (dayOfWeek === 0 && weeks[weeks.length - 1].length === 7) {
      weeks.push([]);
    }

    const engagement = dataMap.get(dateStr) ?? {
      date: dateStr,
      lessonCompletions: 0,
      quizSubmissions: 0,
      total: 0,
    };

    weeks[weeks.length - 1].push(engagement);
    current.setDate(current.getDate() + 1);
  }

  // Pad the last week with nulls
  const lastWeek = weeks[weeks.length - 1];
  while (lastWeek.length < 7) {
    lastWeek.push(null);
  }

  // Compute month labels for the top
  const monthLabels: { label: string; colIndex: number }[] = [];
  let lastMonth = -1;
  for (let colIdx = 0; colIdx < weeks.length; colIdx++) {
    // Find first non-null cell in this week
    const firstCell = weeks[colIdx].find((c) => c !== null);
    if (firstCell) {
      const month = parseInt(firstCell.date.split("-")[1], 10) - 1;
      if (month !== lastMonth) {
        monthLabels.push({ label: MONTH_NAMES[month], colIndex: colIdx });
        lastMonth = month;
      }
    }
  }

  return (
    <div className="bg-white rounded-md p-4 border border-gray-100">
      <h2 className="text-lg font-semibold mb-3">
        Engagement Heatmap (90 Days)
      </h2>

      <div className="flex gap-1">
        {/* Day labels column */}
        <div className="flex flex-col gap-1 mr-1">
          {DAY_LABELS.map((label, idx) => (
            <div
              key={idx}
              className="w-3 h-3 flex items-center justify-center text-[9px] text-gray-400"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Grid of weeks */}
        <div className="flex flex-col gap-0">
          {/* Month labels */}
          <div className="flex gap-1 mb-1">
            {weeks.map((_, colIdx) => {
              const monthLabel = monthLabels.find(
                (m) => m.colIndex === colIdx
              );
              return (
                <div
                  key={colIdx}
                  className="w-3 text-[9px] text-gray-400 text-center"
                >
                  {monthLabel?.label ?? ""}
                </div>
              );
            })}
          </div>

          {/* 7 rows (one for each day of week) */}
          {Array.from({ length: 7 }, (_, rowIdx) => (
            <div key={rowIdx} className="flex gap-1">
              {weeks.map((week, colIdx) => {
                const cell = week[rowIdx];
                if (cell === null) {
                  return (
                    <div key={colIdx} className="w-3 h-3" />
                  );
                }
                return (
                  <div
                    key={colIdx}
                    className={`w-3 h-3 rounded-xs cursor-pointer ${getIntensityClass(cell.total)}`}
                    title={`${cell.date}: ${cell.total} activities`}
                    onMouseEnter={() => setHoveredCell(cell)}
                    onMouseLeave={() => setHoveredCell(null)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {hoveredCell && (
        <div className="mt-2 text-xs text-gray-600">
          {hoveredCell.date}: {hoveredCell.lessonCompletions} lesson
          {hoveredCell.lessonCompletions !== 1 ? "s" : ""},{" "}
          {hoveredCell.quizSubmissions} quiz
          {hoveredCell.quizSubmissions !== 1 ? "zes" : ""} ({hoveredCell.total}{" "}
          total)
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
        <span className="text-xs text-gray-500">Less</span>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-xs bg-gray-200" />
          <div className="w-3 h-3 rounded-xs bg-green-200" />
          <div className="w-3 h-3 rounded-xs bg-green-400" />
          <div className="w-3 h-3 rounded-xs bg-green-600" />
        </div>
        <span className="text-xs text-gray-500">More</span>
      </div>
    </div>
  );
};

export default LmsEngagementHeatmap;
