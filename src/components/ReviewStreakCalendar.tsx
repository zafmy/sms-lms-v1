"use client";

import LearningActivityHeatmap from "./LearningActivityHeatmap";

interface ReviewStreakCalendarProps {
  data: Array<{ date: string; count: number }>;
}

const ReviewStreakCalendar = ({ data }: ReviewStreakCalendarProps) => {
  return (
    <div>
      <h3 className="text-md font-medium mb-2">Review Activity</h3>
      <LearningActivityHeatmap data={data} />
    </div>
  );
};

export default ReviewStreakCalendar;
