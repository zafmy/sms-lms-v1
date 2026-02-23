"use client";

import { useTranslations } from "next-intl";
import LearningActivityHeatmap from "./LearningActivityHeatmap";

interface ReviewStreakCalendarProps {
  data: Array<{ date: string; count: number }>;
}

const ReviewStreakCalendar = ({ data }: ReviewStreakCalendarProps) => {
  const t = useTranslations("spaced_repetition.reviews");
  return (
    <div>
      <h3 className="text-md font-medium mb-2">{t("reviewActivity")}</h3>
      <LearningActivityHeatmap data={data} />
    </div>
  );
};

export default ReviewStreakCalendar;
