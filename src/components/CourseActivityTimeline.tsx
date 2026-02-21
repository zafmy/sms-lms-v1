"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { DailyEngagement } from "@/lib/lmsAnalyticsUtils";

const formatDate = (dateStr: string): string => {
  const parts = dateStr.split("-");
  return `${parts[1]}/${parts[2]}`;
};

const CourseActivityTimeline = ({
  data,
}: {
  data: DailyEngagement[];
}) => {
  const hasData = data.some((d) => d.total > 0);

  if (!hasData) {
    return (
      <div className="bg-white rounded-md p-4 border border-gray-100">
        <h2 className="text-lg font-semibold mb-3">Daily Engagement Trend</h2>
        <p className="text-gray-400 text-sm mt-4">
          No engagement data available.
        </p>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    label: formatDate(d.date),
  }));

  return (
    <div className="bg-white rounded-md p-4 border border-gray-100">
      <h2 className="text-lg font-semibold mb-3">Daily Engagement Trend</h2>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={chartData}>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#ddd"
          />
          <XAxis
            dataKey="label"
            axisLine={false}
            tick={{ fill: "#6b7280", fontSize: 11 }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            axisLine={false}
            tick={{ fill: "#6b7280", fontSize: 12 }}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{ borderRadius: "8px", borderColor: "lightgray" }}
            labelFormatter={(label) => `Date: ${label}`}
            formatter={(value, name) => {
              const labelMap: Record<string, string> = {
                lessonCompletions: "Lesson Completions",
                quizSubmissions: "Quiz Submissions",
                total: "Total",
              };
              return [value, labelMap[name as string] ?? name];
            }}
          />
          <Line
            type="monotone"
            dataKey="total"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CourseActivityTimeline;
