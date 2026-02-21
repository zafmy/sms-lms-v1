"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const QuizScoreDistribution = ({
  data,
}: {
  data: { range: string; count: number }[];
}) => {
  const hasData = data.some((d) => d.count > 0);

  if (!hasData) {
    return (
      <div className="bg-white rounded-md p-4 border border-gray-100">
        <h2 className="text-lg font-semibold mb-3">Quiz Score Distribution</h2>
        <p className="text-gray-400 text-sm mt-4">
          No quiz attempts recorded.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-md p-4 border border-gray-100">
      <h2 className="text-lg font-semibold mb-3">Quiz Score Distribution</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} barSize={32}>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#ddd"
          />
          <XAxis
            dataKey="range"
            axisLine={false}
            tick={{ fill: "#6b7280", fontSize: 12 }}
            tickLine={false}
          />
          <YAxis
            axisLine={false}
            tick={{ fill: "#6b7280", fontSize: 12 }}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{ borderRadius: "8px", borderColor: "lightgray" }}
            formatter={(value) => [value, "Attempts"]}
          />
          <Bar
            dataKey="count"
            fill="#a855f7"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default QuizScoreDistribution;
