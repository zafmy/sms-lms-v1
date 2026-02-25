// Server component that fetches DRAFT AI summaries for a lesson.
// Passes them to the AISummaryReview client component.

import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import AISummaryReview from "./AISummaryReview";

const AISummaryReviewContainer = async ({
  lessonId,
}: {
  lessonId: number;
}) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (!userId || (role !== "admin" && role !== "teacher")) {
    return null;
  }

  const summaries = await prisma.lessonSummary.findMany({
    where: {
      lessonId,
      status: "DRAFT",
      lesson: {
        module: {
          course: role === "teacher" ? { teacherId: userId } : {},
        },
      },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      content: true,
      createdAt: true,
    },
  });

  if (summaries.length === 0) {
    return null;
  }

  const serializedSummaries = summaries.map((s) => ({
    id: s.id,
    content: s.content,
    createdAt: s.createdAt.toISOString(),
  }));

  return <AISummaryReview summaries={serializedSummaries} />;
};

export default AISummaryReviewContainer;
