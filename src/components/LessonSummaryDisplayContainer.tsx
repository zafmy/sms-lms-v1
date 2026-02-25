// Server component that fetches the latest APPROVED summary for a lesson.
// Passes it to the LessonSummaryDisplay client component.
// Visible to all roles (students can view approved summaries).

import prisma from "@/lib/prisma";
import LessonSummaryDisplay from "./LessonSummaryDisplay";

const LessonSummaryDisplayContainer = async ({
  lessonId,
}: {
  lessonId: number;
}) => {
  const summary = await prisma.lessonSummary.findFirst({
    where: {
      lessonId,
      status: "APPROVED",
    },
    orderBy: { createdAt: "desc" },
    select: {
      content: true,
      createdAt: true,
    },
  });

  if (!summary) {
    return null;
  }

  return (
    <LessonSummaryDisplay
      summary={{
        content: summary.content,
        createdAt: summary.createdAt.toISOString(),
      }}
    />
  );
};

export default LessonSummaryDisplayContainer;
