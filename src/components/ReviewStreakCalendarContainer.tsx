import prisma from "@/lib/prisma";
import { computeReviewHeatmapData } from "@/lib/reviewAnalyticsUtils";
import ReviewStreakCalendar from "./ReviewStreakCalendar";

interface ReviewStreakCalendarContainerProps {
  studentId: string;
}

const ReviewStreakCalendarContainer = async ({
  studentId,
}: ReviewStreakCalendarContainerProps) => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const reviewLogs = await prisma.reviewLog.findMany({
    where: {
      studentId,
      reviewedAt: { gte: sixMonthsAgo },
    },
    select: { reviewedAt: true },
  });

  const heatmapData = computeReviewHeatmapData(reviewLogs);

  return <ReviewStreakCalendar data={heatmapData} />;
};

export default ReviewStreakCalendarContainer;
