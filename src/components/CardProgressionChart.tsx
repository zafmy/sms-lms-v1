"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface CardProgressionChartProps {
  distribution: number[];
}

const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#10b981"];

const CardProgressionChart = ({
  distribution,
}: CardProgressionChartProps) => {
  const data = distribution.map((count, i) => ({
    name: `Box ${i + 1}`,
    cards: count,
  }));

  const total = distribution.reduce((a, b) => a + b, 0);

  if (total === 0) {
    return (
      <div className="bg-white p-4 rounded-md">
        <h3 className="text-md font-medium mb-2">Card Progression</h3>
        <p className="text-gray-400 text-sm">No cards yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-md">
      <h3 className="text-md font-medium mb-3">Card Progression</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="cards" radius={[4, 4, 0, 0]}>
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CardProgressionChart;
