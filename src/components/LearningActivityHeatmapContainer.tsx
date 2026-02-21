import prisma from "@/lib/prisma";
import { computeHeatmapData } from "@/lib/lmsAnalyticsUtils";
import LearningActivityHeatmap from "@/components/LearningActivityHeatmap";

const LearningActivityHeatmapContainer = async ({
  studentId,
}: {
  studentId: string;
}) => {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);

  // Fetch lesson progress with completedAt in current year
  const progressRecords = await prisma.lessonProgress.findMany({
    where: {
      studentId,
      completedAt: { gte: yearStart },
    },
    select: { completedAt: true },
  });

  // Fetch quiz attempts with submittedAt in current year
  const quizAttempts = await prisma.quizAttempt.findMany({
    where: {
      studentId,
      submittedAt: { gte: yearStart },
    },
    select: { submittedAt: true },
  });

  const heatmapData = computeHeatmapData(progressRecords, quizAttempts);

  return <LearningActivityHeatmap data={heatmapData} />;
};

export default LearningActivityHeatmapContainer;
