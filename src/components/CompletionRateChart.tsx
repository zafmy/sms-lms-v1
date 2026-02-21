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

const CompletionRateChart = ({
  data,
}: {
  data: { moduleTitle: string; percentage: number }[];
}) => {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-md p-4 border border-gray-100">
        <h2 className="text-lg font-semibold mb-3">Module Completion Rates</h2>
        <p className="text-gray-400 text-sm mt-4">
          No module data available.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-md p-4 border border-gray-100">
      <h2 className="text-lg font-semibold mb-3">Module Completion Rates</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} barSize={32}>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#ddd"
          />
          <XAxis
            dataKey="moduleTitle"
            axisLine={false}
            tick={{ fill: "#6b7280", fontSize: 12 }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            axisLine={false}
            tick={{ fill: "#6b7280", fontSize: 12 }}
            tickLine={false}
            tickFormatter={(value: number) => `${value}%`}
          />
          <Tooltip
            contentStyle={{ borderRadius: "8px", borderColor: "lightgray" }}
            formatter={(value) => [`${value}%`, "Completion"]}
          />
          <Bar
            dataKey="percentage"
            fill="#3b82f6"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CompletionRateChart;
