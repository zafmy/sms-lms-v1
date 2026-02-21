"use server";

import prisma from "./prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import {
  computeLevel,
  computeQuizXp,
  evaluateStreak,
  evaluateBadgeEligibility,
  XP_LESSON_COMPLETE,
  XP_DAILY_STREAK,
  XP_STREAK_7_BONUS,
  XP_COURSE_COMPLETE,
} from "./gamificationUtils";
import { createNotification } from "./notificationActions";
import { BadgeSchema, badgeSchema } from "./formValidationSchemas";

type CurrentState = { success: boolean; error: boolean; message?: string };

// Main gamification event processing engine.
// Runs XP awards, streak evaluation, badge checks inside a transaction,
// then sends notifications outside the transaction.
export const processGamificationEvent = async (
  studentId: string,
  eventType: string,
  eventData: Record<string, unknown>
): Promise<void> => {
  const earnedBadges: Array<{ name: string; xpReward: number }> = [];
  let leveledUp = false;
  let newLevel = 1;

  await prisma.$transaction(async (tx) => {
    // a. Upsert StudentGamification record
    let gamification = await tx.studentGamification.upsert({
      where: { studentId },
      create: { studentId, totalXp: 0, currentLevel: 1, currentStreak: 0, longestStreak: 0 },
      update: {},
    });

    const oldLevel = gamification.currentLevel;
    let runningXp = gamification.totalXp;

    // b. Calculate XP based on eventType
    let eventXp = 0;
    let xpSource: "LESSON" | "QUIZ" = "LESSON";
    let sourceId: string | null = null;

    if (eventType === "LESSON_COMPLETE") {
      eventXp = XP_LESSON_COMPLETE;
      xpSource = "LESSON";
      sourceId = String(eventData.lessonId ?? "");
    } else if (eventType === "QUIZ_SUBMIT") {
      const percentage = Number(eventData.percentage ?? 0);
      const passScore = Number(eventData.passScore ?? 70);
      eventXp = computeQuizXp(percentage, passScore);
      xpSource = "QUIZ";
      sourceId = String(eventData.quizId ?? "");
    }

    // c. Create XpTransaction for the event
    if (eventXp > 0) {
      await tx.xpTransaction.create({
        data: { studentId, amount: eventXp, source: xpSource, sourceId },
      });
    }

    // d. Increment totalXp
    runningXp += eventXp;

    // e. Evaluate streak
    const today = new Date();
    const streakResult = evaluateStreak(
      gamification.lastActivityDate,
      today,
      gamification.currentStreak
    );

    if (streakResult.streakIncremented) {
      // Daily streak XP
      await tx.xpTransaction.create({
        data: { studentId, amount: XP_DAILY_STREAK, source: "STREAK" },
      });
      runningXp += XP_DAILY_STREAK;

      // 7-day streak bonus
      if (streakResult.newStreak === 7) {
        await tx.xpTransaction.create({
          data: { studentId, amount: XP_STREAK_7_BONUS, source: "STREAK" },
        });
        runningXp += XP_STREAK_7_BONUS;
      }
    }

    // f. Update streak fields on StudentGamification
    const updatedLongestStreak = Math.max(
      gamification.longestStreak,
      streakResult.newStreak
    );

    await tx.studentGamification.update({
      where: { studentId },
      data: {
        currentStreak: streakResult.newStreak,
        longestStreak: updatedLongestStreak,
        lastActivityDate: today,
      },
    });

    // Course completion detection (for LESSON_COMPLETE events)
    if (eventType === "LESSON_COMPLETE" && eventData.lessonId) {
      const lessonId = Number(eventData.lessonId);
      const lesson = await tx.lmsLesson.findUnique({
        where: { id: lessonId },
        include: {
          module: {
            include: {
              course: {
                include: {
                  modules: {
                    include: {
                      lessons: { select: { id: true } },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (lesson) {
        const course = lesson.module.course;
        const allLessonIds = course.modules.flatMap((m) =>
          m.lessons.map((l) => l.id)
        );
        const totalLessons = allLessonIds.length;

        if (totalLessons > 0) {
          const completedCount = await tx.lessonProgress.count({
            where: {
              studentId,
              lessonId: { in: allLessonIds },
              status: "COMPLETED",
            },
          });

          if (completedCount >= totalLessons) {
            // Award course completion XP
            await tx.xpTransaction.create({
              data: {
                studentId,
                amount: XP_COURSE_COMPLETE,
                source: "LESSON",
                sourceId: String(course.id),
              },
            });
            runningXp += XP_COURSE_COMPLETE;
          }
        }
      }
    }

    // h. Evaluate badge eligibility
    const existingBadges = await tx.studentBadge.findMany({
      where: { studentId },
      select: { badgeId: true },
    });
    const existingBadgeIds = existingBadges.map((sb) => sb.badgeId);

    const allBadges = await tx.badge.findMany({
      select: { id: true, category: true, threshold: true, xpReward: true, name: true },
    });

    const badgesToCheck: Array<{ category: string; value: number }> = [];

    if (eventType === "LESSON_COMPLETE") {
      // Count completed lessons for "course" badges
      const completedLessons = await tx.lessonProgress.count({
        where: { studentId, status: "COMPLETED" },
      });
      badgesToCheck.push({ category: "course", value: completedLessons });
      badgesToCheck.push({ category: "xp", value: runningXp });
    } else if (eventType === "QUIZ_SUBMIT") {
      // Count passed quizzes for "quiz" badges
      const passedQuizzes = await tx.quizAttempt.count({
        where: { studentId, passed: true },
      });
      badgesToCheck.push({ category: "quiz", value: passedQuizzes });
      badgesToCheck.push({ category: "xp", value: runningXp });
    }

    if (streakResult.streakIncremented) {
      badgesToCheck.push({ category: "streak", value: streakResult.newStreak });
    }

    const badgesForDb = allBadges.map((b) => ({
      id: b.id,
      category: b.category,
      threshold: b.threshold,
    }));

    for (const check of badgesToCheck) {
      const eligible = evaluateBadgeEligibility(
        check.category,
        check.value,
        existingBadgeIds,
        badgesForDb
      );

      for (const badge of eligible) {
        // Badge deduplication: catch unique constraint violation
        try {
          await tx.studentBadge.create({
            data: { studentId, badgeId: badge.id },
          });

          const fullBadge = allBadges.find((b) => b.id === badge.id);
          const badgeXp = fullBadge?.xpReward ?? 0;

          if (badgeXp > 0) {
            await tx.xpTransaction.create({
              data: {
                studentId,
                amount: badgeXp,
                source: "BADGE",
                sourceId: String(badge.id),
              },
            });
            runningXp += badgeXp;
          }

          earnedBadges.push({
            name: fullBadge?.name ?? "Badge",
            xpReward: badgeXp,
          });
          existingBadgeIds.push(badge.id);
        } catch (err: unknown) {
          // P2002 = unique constraint violation, badge already earned
          const prismaError = err as { code?: string };
          if (prismaError.code !== "P2002") {
            throw err;
          }
        }
      }
    }

    // i. Update final totalXp and currentLevel
    newLevel = computeLevel(runningXp);
    leveledUp = newLevel > oldLevel;

    await tx.studentGamification.update({
      where: { studentId },
      data: {
        totalXp: runningXp,
        currentLevel: newLevel,
      },
    });
  });

  // Notifications are sent AFTER the transaction (non-transactional)
  for (const badge of earnedBadges) {
    await createNotification(
      studentId,
      "GAMIFICATION",
      `You earned the "${badge.name}" badge!${badge.xpReward > 0 ? ` (+${badge.xpReward} XP)` : ""}`
    ).catch(() => {});
  }

  if (leveledUp) {
    await createNotification(
      studentId,
      "GAMIFICATION",
      `Congratulations! You reached Level ${newLevel}!`
    ).catch(() => {});
  }
};

// Admin CRUD actions for Badge management

export const createBadge = async (
  currentState: CurrentState,
  data: BadgeSchema
): Promise<CurrentState> => {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "admin") {
    return { success: false, error: true };
  }

  try {
    const parsed = badgeSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: true, message: "Validation failed" };
    }

    await prisma.badge.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        iconUrl: parsed.data.iconUrl ?? null,
        category: parsed.data.category,
        threshold: parsed.data.threshold ?? null,
        xpReward: parsed.data.xpReward,
        criteria: `${parsed.data.category}:${parsed.data.threshold ?? 0}`,
      },
    });

    revalidatePath("/list/badges");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true };
  }
};

export const updateBadge = async (
  currentState: CurrentState,
  data: BadgeSchema
): Promise<CurrentState> => {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "admin") {
    return { success: false, error: true };
  }

  try {
    const parsed = badgeSchema.safeParse(data);
    if (!parsed.success || !parsed.data.id) {
      return { success: false, error: true, message: "Validation failed" };
    }

    await prisma.badge.update({
      where: { id: parsed.data.id },
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        iconUrl: parsed.data.iconUrl ?? null,
        category: parsed.data.category,
        threshold: parsed.data.threshold ?? null,
        xpReward: parsed.data.xpReward,
        criteria: `${parsed.data.category}:${parsed.data.threshold ?? 0}`,
      },
    });

    revalidatePath("/list/badges");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true };
  }
};

export const deleteBadge = async (
  currentState: CurrentState,
  data: FormData
): Promise<CurrentState> => {
  const id = data.get("id") as string;
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "admin") {
    return { success: false, error: true };
  }

  try {
    await prisma.badge.delete({
      where: { id: parseInt(id) },
    });

    revalidatePath("/list/badges");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true };
  }
};
