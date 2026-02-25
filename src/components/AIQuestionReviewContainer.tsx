// Server component that fetches DRAFT AI questions for a lesson.
// Passes them to the AIQuestionReview client component.

import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import AIQuestionReview from "./AIQuestionReview";

const AIQuestionReviewContainer = async ({
  lessonId,
}: {
  lessonId: number;
}) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (!userId || (role !== "admin" && role !== "teacher")) {
    return null;
  }

  const questions = await prisma.question.findMany({
    where: {
      isAIGenerated: true,
      aiStatus: "DRAFT",
      quiz: {
        lessonId,
        lesson: {
          module: {
            course: role === "teacher" ? { teacherId: userId } : {},
          },
        },
      },
    },
    include: {
      options: {
        orderBy: { order: "asc" },
      },
    },
    orderBy: { order: "asc" },
  });

  if (questions.length === 0) {
    return null;
  }

  const serializedQuestions = questions.map((q) => ({
    id: q.id,
    text: q.text,
    type: q.type,
    explanation: q.explanation,
    points: q.points,
    aiStatus: q.aiStatus,
    options: q.options.map((o) => ({
      id: o.id,
      text: o.text,
      isCorrect: o.isCorrect,
      order: o.order,
    })),
  }));

  return <AIQuestionReview questions={serializedQuestions} />;
};

export default AIQuestionReviewContainer;
