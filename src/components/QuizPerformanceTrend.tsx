"use client";

import { useTranslations } from "next-intl";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

interface DataPoint {
  date: string;
  percentage: number;
  quizTitle: string;
}

const QuizPerformanceTrend = ({
  data,
  passingScore,
}: {
  data: DataPoint[];
  passingScore: number;
}) => {
  const t = useTranslations("dashboard");
  const monthKeys = [
    "common.jan", "common.feb", "common.mar", "common.apr",
    "common.may", "common.jun", "common.jul", "common.aug",
    "common.sep", "common.oct", "common.nov", "common.dec",
  ] as const;

  const formatDate = (dateStr: string): string => {
    const d = new Date(dateStr);
    return `${t(monthKeys[d.getMonth()])} ${d.getDate()}`;
  };

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: { payload: DataPoint }[];
  }) => {
    if (!active || !payload || payload.length === 0) return null;

    const point = payload[0].payload;
    return (
      <div className="bg-white border border-gray-200 rounded-md p-2 shadow-sm text-sm">
        <p className="font-semibold">{point.quizTitle}</p>
        <p className="text-gray-600">
          {t("student.score")}: {point.percentage}%
        </p>
        <p className="text-gray-400 text-xs">{point.date}</p>
      </div>
    );
  };

  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400 text-sm">
          {t("student.takeMoreQuizzes")}
        </p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          axisLine={false}
          tick={{ fill: "#d1d5db", fontSize: 12 }}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          axisLine={false}
          tick={{ fill: "#d1d5db", fontSize: 12 }}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine
          y={passingScore}
          stroke="#f87171"
          strokeDasharray="5 5"
          label={{
            value: `${t("student.pass")} (${passingScore}%)`,
            position: "right",
            fill: "#f87171",
            fontSize: 11,
          }}
        />
        <Line
          type="monotone"
          dataKey="percentage"
          stroke="#8b5cf6"
          strokeWidth={2}
          dot={{ r: 4, fill: "#8b5cf6" }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default QuizPerformanceTrend;
