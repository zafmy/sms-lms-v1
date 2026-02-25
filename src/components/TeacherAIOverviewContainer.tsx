// Server component that fetches AI quota and pending review data for TeacherAIOverview.
// Follows the same server-component-with-prisma pattern as PreClassEngagementReport.
// @MX:NOTE: [AUTO] Server component for teacher AI overview data fetching
// @MX:SPEC: SPEC-AI-001

import prisma from "@/lib/prisma";
import { getMonthStartDate } from "@/lib/ai/quotaUtils";
import TeacherAIOverview from "./TeacherAIOverview";

const TeacherAIOverviewContainer = async ({
  teacherId,
}: {
  teacherId: string;
}) => {
  const monthStart = getMonthStartDate();

  // Parallel queries for quota usage, settings, and pending counts
  const [monthlyUsage, settings, pendingQuestions, pendingSummaries] =
    await Promise.all([
      prisma.aIGenerationLog.count({
        where: {
          teacherId,
          createdAt: { gte: monthStart },
        },
      }),
      prisma.aISettings.findFirst(),
      prisma.question.count({
        where: {
          isAIGenerated: true,
          aiStatus: "DRAFT",
          quiz: {
            lesson: {
              module: {
                course: { teacherId },
              },
            },
          },
        },
      }),
      prisma.lessonSummary.count({
        where: {
          status: "DRAFT",
          generatedByTeacherId: teacherId,
        },
      }),
    ]);

  const quota = settings?.monthlyQuotaPerTeacher ?? 100;

  return (
    <TeacherAIOverview
      quota={quota}
      used={monthlyUsage}
      pendingQuestions={pendingQuestions}
      pendingSummaries={pendingSummaries}
      recentGenerations={monthlyUsage}
    />
  );
};

export default TeacherAIOverviewContainer;
