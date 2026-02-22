"use server";

import prisma from "./prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import {
  buildReviewQueue,
  computeBoxPromotion,
  computeNextReviewDate,
  XP_REVIEW_CORRECT,
  XP_REVIEW_HARD_BONUS,
  XP_MASTERY_BONUS,
} from "./spacedRepetitionUtils";

// Start a review session for a student
export const startReviewSession = async (studentId: string) => {
  const { userId } = await auth();
  if (!userId || userId !== studentId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const activeCards = await prisma.reviewCard.findMany({
      where: {
        studentId,
        isActive: true,
        nextReviewDate: { lte: today },
      },
      include: {
        subject: { select: { id: true, name: true } },
      },
      orderBy: { nextReviewDate: "asc" },
    });

    // Use buildReviewQueue for ordering/filtering, then map back to full cards
    const queueOrder = buildReviewQueue(activeCards);
    const cardMap = new Map(activeCards.map((c) => [c.id, c]));
    const queuedCards = queueOrder
      .map((q) => cardMap.get(q.id))
      .filter((c): c is NonNullable<typeof c> => c != null);

    const session = await prisma.reviewSession.create({
      data: {
        studentId,
        totalCards: queuedCards.length,
      },
    });

    return {
      success: true,
      sessionId: session.id,
      cards: queuedCards,
    };
  } catch {
    return { success: false, error: "Failed to start review session" };
  }
};

// Submit a single card review within a session
export const submitCardReview = async (
  reviewCardId: number,
  sessionId: number,
  rating: "HARD" | "OK" | "EASY",
  responseTimeMs?: number
) => {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const card = await prisma.reviewCard.findFirst({
      where: { id: reviewCardId, studentId: userId },
    });

    if (!card) {
      return { success: false, error: "Card not found" };
    }

    const previousBox = card.leitnerBox;
    const previousEF = card.easinessFactor;

    const { newBox, newEF, newConsecutiveCorrect } = computeBoxPromotion(
      card.leitnerBox,
      rating,
      card.consecutiveCorrect,
      card.easinessFactor
    );

    const nextReviewDate = computeNextReviewDate(newBox, new Date());

    await prisma.$transaction(async (tx) => {
      // 1. Update the ReviewCard
      await tx.reviewCard.update({
        where: { id: reviewCardId },
        data: {
          leitnerBox: newBox,
          easinessFactor: newEF,
          consecutiveCorrect: newConsecutiveCorrect,
          nextReviewDate,
          lastReviewedAt: new Date(),
          reviewCount: { increment: 1 },
        },
      });

      // 2. Create ReviewLog
      await tx.reviewLog.create({
        data: {
          reviewCardId,
          studentId: userId,
          rating,
          previousBox,
          newBox,
          previousEF,
          newEF,
          responseTimeMs: responseTimeMs ?? null,
        },
      });

      // 3. Update ReviewSession
      const isCorrect = rating !== "HARD";
      let xpForThisReview = 0;
      if (isCorrect) {
        xpForThisReview += XP_REVIEW_CORRECT;
      }
      if (previousBox === 1 && isCorrect) {
        xpForThisReview += XP_REVIEW_HARD_BONUS;
      }
      if (newBox === 5) {
        xpForThisReview += XP_MASTERY_BONUS;
      }

      await tx.reviewSession.update({
        where: { id: sessionId },
        data: {
          correctCards: isCorrect ? { increment: 1 } : undefined,
          xpEarned: { increment: xpForThisReview },
        },
      });
    });

    // Fire-and-forget gamification events
    if (rating !== "HARD") {
      import("./gamificationActions").then(({ processGamificationEvent }) => {
        processGamificationEvent(userId, "REVIEW_CORRECT", {
          reviewCardId,
          rating,
        }).catch(() => {});
      });
    }
    if (newBox === 5) {
      import("./gamificationActions").then(({ processGamificationEvent }) => {
        processGamificationEvent(userId, "MASTERY_ACHIEVED", {
          reviewCardId,
        }).catch(() => {});
      });
    }

    return { success: true, newBox, newEF };
  } catch {
    return { success: false, error: "Failed to submit review" };
  }
};

// Complete a review session
export const completeReviewSession = async (sessionId: number) => {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const session = await prisma.reviewSession.findFirst({
      where: { id: sessionId, studentId: userId },
    });

    if (!session) {
      return { success: false, error: "Session not found" };
    }

    await prisma.reviewSession.update({
      where: { id: sessionId },
      data: { completedAt: new Date() },
    });

    // Fire-and-forget gamification event
    import("./gamificationActions").then(({ processGamificationEvent }) => {
      processGamificationEvent(userId, "REVIEW_SESSION_COMPLETE", {
        sessionId,
        correctCards: session.correctCards,
        totalCards: session.totalCards,
      }).catch(() => {});
    });

    revalidatePath("/list/courses");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to complete session" };
  }
};

// Generate review cards from incorrect quiz answers
export const generateReviewCardsFromQuiz = async (
  studentId: string,
  quizAttemptId: number
) => {
  try {
    const attempt = await prisma.quizAttempt.findFirst({
      where: { id: quizAttemptId, studentId },
      include: {
        responses: {
          where: { isCorrect: false },
          include: {
            question: {
              include: { options: true },
            },
          },
        },
        quiz: {
          include: {
            lesson: {
              include: {
                module: {
                  include: {
                    course: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!attempt) return;

    const courseId = attempt.quiz.lesson.module.course.id;
    const subjectId = attempt.quiz.lesson.module.course.subjectId;

    for (const response of attempt.responses) {
      const question = response.question;
      const correctOption = question.options.find((o) => o.isCorrect);
      const backText = correctOption
        ? `${correctOption.text}${question.explanation ? `\n\n${question.explanation}` : ""}`
        : question.explanation ?? "";

      const existingCard = await prisma.reviewCard.findFirst({
        where: {
          studentId,
          sourceQuestionId: question.id,
        },
      });

      if (existingCard && existingCard.isActive) {
        // Reset active card to Box 1
        await prisma.reviewCard.update({
          where: { id: existingCard.id },
          data: {
            leitnerBox: 1,
            consecutiveCorrect: 0,
            nextReviewDate: computeNextReviewDate(1, new Date()),
          },
        });
      } else if (existingCard && !existingCard.isActive) {
        // Reactivate and reset to Box 1
        await prisma.reviewCard.update({
          where: { id: existingCard.id },
          data: {
            isActive: true,
            leitnerBox: 1,
            consecutiveCorrect: 0,
            nextReviewDate: computeNextReviewDate(1, new Date()),
          },
        });
      } else {
        // Create new card
        await prisma.reviewCard.create({
          data: {
            studentId,
            courseId,
            subjectId,
            cardType: "QUIZ_QUESTION",
            front: question.text,
            back: backText,
            sourceQuestionId: question.id,
            nextReviewDate: computeNextReviewDate(1, new Date()),
          },
        });
      }
    }
  } catch {
    // Silent failure -- fire-and-forget pattern
  }
};

// Generate a review card from a flagged lesson
export const generateReviewCardFromLesson = async (
  studentId: string,
  lessonId: number
) => {
  try {
    const lesson = await prisma.lmsLesson.findFirst({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!lesson || !lesson.flagForReview) return;

    const courseId = lesson.module.course.id;
    const subjectId = lesson.module.course.subjectId;

    const existingCard = await prisma.reviewCard.findFirst({
      where: {
        studentId,
        sourceLessonId: lesson.id,
      },
    });

    if (existingCard) return;

    await prisma.reviewCard.create({
      data: {
        studentId,
        courseId,
        subjectId,
        cardType: "CONCEPT",
        front: `What are the key concepts from: ${lesson.title}?`,
        back: lesson.content.substring(0, 500),
        sourceLessonId: lesson.id,
        nextReviewDate: computeNextReviewDate(1, new Date()),
      },
    });
  } catch {
    // Silent failure -- fire-and-forget pattern
  }
};

// Create teacher-authored review cards for students
export const createTeacherReviewCard = async (formData: FormData) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || (role !== "admin" && role !== "teacher")) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const front = formData.get("front") as string;
    const back = formData.get("back") as string;
    const cardType = (formData.get("cardType") as string) || "FLASHCARD";
    const courseId = Number(formData.get("courseId"));
    const targetStudentsRaw = formData.get("targetStudents") as string | null;

    if (!front || !back || !courseId) {
      return { success: false, error: "Missing required fields" };
    }

    const course = await prisma.course.findFirst({
      where: { id: courseId },
      include: {
        enrollments: {
          where: { status: "ACTIVE" },
        },
      },
    });

    if (!course) {
      return { success: false, error: "Course not found" };
    }

    const subjectId = course.subjectId;

    let studentIds: string[];
    if (targetStudentsRaw) {
      studentIds = JSON.parse(targetStudentsRaw) as string[];
    } else {
      studentIds = course.enrollments.map((e) => e.studentId);
    }

    const reviewCards = studentIds.map((sid) => ({
      studentId: sid,
      courseId,
      subjectId,
      cardType: cardType as "QUIZ_QUESTION" | "VOCABULARY" | "CONCEPT" | "FLASHCARD",
      front,
      back,
      nextReviewDate: computeNextReviewDate(1, new Date()),
    }));

    await prisma.reviewCard.createMany({ data: reviewCards });

    revalidatePath("/list/courses");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to create review cards" };
  }
};

// Toggle the flagForReview on a lesson
export const toggleLessonReviewFlag = async (
  lessonId: number,
  flag: boolean
) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || (role !== "admin" && role !== "teacher")) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await prisma.lmsLesson.update({
      where: { id: lessonId },
      data: { flagForReview: flag },
    });

    revalidatePath("/list/courses");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update lesson" };
  }
};
