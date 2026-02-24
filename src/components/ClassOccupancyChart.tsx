"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useTranslations } from "next-intl";

const ClassOccupancyChart = ({
  data,
}: {
  data: { name: string; capacity: number; students: number }[];
}) => {
  const t = useTranslations("dashboard.admin");

  const legendFormatter = (value: string) => {
    const labelMap: Record<string, string> = {
      capacity: t("capacity"),
      students: t("students"),
    };
    return labelMap[value] ?? value;
  };

  return (
    <ResponsiveContainer width="100%" height="90%">
      <BarChart layout="vertical" data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
        <YAxis
          dataKey="name"
          type="category"
          axisLine={false}
          tick={{ fill: "#d1d5db" }}
          tickLine={false}
          width={80}
        />
        <XAxis
          type="number"
          axisLine={false}
          tick={{ fill: "#d1d5db" }}
          tickLine={false}
        />
        <Tooltip formatter={(value, name) => [value, legendFormatter(name as string)]} />
        <Legend formatter={legendFormatter} />
        <Bar dataKey="capacity" fill="#C3EBFA" />
        <Bar dataKey="students" fill="#FAE27C" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default ClassOccupancyChart;
