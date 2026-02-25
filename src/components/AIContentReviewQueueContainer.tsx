// Server component that fetches DRAFT AI content for the review queue.
// Follows the same server-component-with-prisma pattern as PreClassEngagementReport.
// @MX:NOTE: [AUTO] Server component for unified AI content review queue data fetching
// @MX:SPEC: SPEC-AI-001

import prisma from "@/lib/prisma";
import AIContentReviewQueue from "./AIContentReviewQueue";
import type { ReviewQueueItem } from "./AIContentReviewQueue";

const AIContentReviewQueueContainer = async ({
  teacherId,
}: {
  teacherId: string;
}) => {
  // Fetch DRAFT questions and summaries in parallel
  const [draftQuestions, draftSummaries] = await Promise.all([
    prisma.question.findMany({
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
      select: {
        id: true,
        text: true,
        aiGenerationLog: {
          select: { createdAt: true },
        },
        quiz: {
          select: {
            lesson: {
              select: { title: true },
            },
          },
        },
      },
      orderBy: { id: "desc" },
    }),
    prisma.lessonSummary.findMany({
      where: {
        status: "DRAFT",
        generatedByTeacherId: teacherId,
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        lesson: {
          select: { title: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Map to unified review queue items
  const questionItems: ReadonlyArray<ReviewQueueItem> = draftQuestions.map(
    (q) => ({
      id: q.id,
      type: "question" as const,
      lessonTitle: q.quiz?.lesson.title ?? "Unknown Lesson",
      preview: q.text,
      createdAt: q.aiGenerationLog?.createdAt.toISOString() ?? new Date().toISOString(),
    })
  );

  const summaryItems: ReadonlyArray<ReviewQueueItem> = draftSummaries.map(
    (s) => ({
      id: s.id,
      type: "summary" as const,
      lessonTitle: s.lesson.title,
      preview:
        s.content.length > 150 ? `${s.content.slice(0, 150)}...` : s.content,
      createdAt: s.createdAt.toISOString(),
    })
  );

  // Combine and sort by creation date descending
  const allItems = [...questionItems, ...summaryItems].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return <AIContentReviewQueue items={allItems} />;
};

export default AIContentReviewQueueContainer;
