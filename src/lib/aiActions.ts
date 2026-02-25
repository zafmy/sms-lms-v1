// Server actions for AI question generation and review workflows.
// Follows the same auth-check -> ownership-verify -> prisma -> revalidate pattern as actions.ts.
// @MX:ANCHOR: [AUTO] AI question generation entry point -- called by AIQuestionGenerator component
// @MX:REASON: High fan_in; primary server action interface for AI generation features
// @MX:SPEC: SPEC-AI-001

"use server";

import prisma from "./prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { NotificationType } from "@prisma/client";
import { createNotification } from "./notificationActions";
import { generateQuestions, generateSummary } from "./ai/aiService";
import { extractPlainText } from "./lexicalUtils";
import {
  checkQuotaAvailable,
  isApproachingQuotaLimit,
  getMonthStartDate,
} from "./ai/quotaUtils";
import {
  aiQuestionGenerationSchema,
  aiSummaryGenerationSchema,
  aiSettingsSchema,
  AISettingsSchema,
} from "./formValidationSchemas";

type CurrentState = { success: boolean; error: boolean; message?: string };

// Verify the teacher owns the course containing the lesson.
// Returns the lesson with module and course data, or null if not found or not owned.
async function verifyLessonOwnership(
  lessonId: number,
  userId: string,
  role: string
): Promise<{
  lesson: {
    id: number;
    title: string;
    content: string | null;
    module: {
      course: {
        id: number;
        teacherId: string;
      };
    };
    quizzes: Array<{ id: number }>;
  };
} | null> {
  const lesson = await prisma.lmsLesson.findUnique({
    where: { id: lessonId },
    include: {
      module: {
        include: {
          course: {
            select: { id: true, teacherId: true },
          },
        },
      },
      quizzes: {
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!lesson) {
    return null;
  }

  // Admin has access to all; teacher must own the course
  if (role === "teacher" && lesson.module.course.teacherId !== userId) {
    return null;
  }

  return { lesson };
}

// Verify the teacher owns the course containing the question.
// Returns the question with its ownership chain, or null.
async function verifyQuestionOwnership(
  questionId: number,
  userId: string,
  role: string
): Promise<{
  question: {
    id: number;
    aiStatus: string | null;
    quiz: {
      lesson: {
        module: {
          course: {
            teacherId: string;
          };
        };
      };
    } | null;
  };
} | null> {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: {
      id: true,
      aiStatus: true,
      quiz: {
        select: {
          lesson: {
            select: {
              module: {
                select: {
                  course: {
                    select: { teacherId: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!question || !question.quiz) {
    return null;
  }

  if (
    role === "teacher" &&
    question.quiz.lesson.module.course.teacherId !== userId
  ) {
    return null;
  }

  return { question };
}

// Generate AI questions for a lesson.
// Validates quota, extracts content, calls AI service, and creates Question records.
export async function generateAIQuestions(
  data: {
    lessonId: number;
    questionCount: number;
    questionTypes: Array<"MULTIPLE_CHOICE" | "TRUE_FALSE">;
    targetQuizId?: number;
  }
): Promise<CurrentState & { questionCount?: number }> {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (!userId || (role !== "admin" && role !== "teacher")) {
    return { success: false, error: true, message: "Unauthorized" };
  }

  // Validate input
  const parsed = aiQuestionGenerationSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: true, message: "Invalid input" };
  }

  const { lessonId, questionCount, questionTypes, targetQuizId } = parsed.data;

  try {
    // Verify ownership
    const ownership = await verifyLessonOwnership(lessonId, userId, role);
    if (!ownership) {
      return { success: false, error: true, message: "Lesson not found" };
    }

    const { lesson } = ownership;

    // Check AI settings
    const settings = await prisma.aISettings.findFirst();
    if (!settings || !settings.enabled) {
      return {
        success: false,
        error: true,
        message: "AI generation is disabled",
      };
    }

    // Check monthly quota
    const monthlyUsage = await prisma.aIGenerationLog.count({
      where: {
        teacherId: userId,
        createdAt: { gte: getMonthStartDate() },
      },
    });

    const quotaCheck = checkQuotaAvailable(
      monthlyUsage,
      settings.monthlyQuotaPerTeacher
    );

    if (!quotaCheck.available) {
      return {
        success: false,
        error: true,
        message: "Monthly quota exceeded",
      };
    }

    // Extract lesson text and validate minimum length
    const text = extractPlainText(lesson.content ?? "");
    if (text.trim().length < 50) {
      return {
        success: false,
        error: true,
        message: "Lesson content is too short for AI generation (minimum 50 characters)",
      };
    }

    // Create pending log entry
    const logEntry = await prisma.aIGenerationLog.create({
      data: {
        teacherId: userId,
        lessonId,
        generationType: "QUESTIONS",
        status: "PENDING",
      },
    });

    // Call AI service
    const aiResult = await generateQuestions({
      lessonContent: text,
      lessonTitle: lesson.title,
      questionCount,
      questionTypes,
    });

    // Handle AI failure
    if (!aiResult.result) {
      await prisma.aIGenerationLog.update({
        where: { id: logEntry.id },
        data: {
          status: "FAILED",
          errorMessage: "AI validation failed: could not parse response",
          provider: aiResult.provider,
          model: aiResult.model,
          inputTokens: aiResult.inputTokens,
          outputTokens: aiResult.outputTokens,
        },
      });
      return {
        success: false,
        error: true,
        message: "AI generation failed. Please try again.",
      };
    }

    // Determine the target quiz ID
    const quizId = targetQuizId ?? lesson.quizzes[0]?.id ?? null;

    // Get the current max order for the target quiz (or globally for the lesson)
    const maxOrderResult = await prisma.question.aggregate({
      _max: { order: true },
      where: quizId ? { quizId } : { quiz: { lessonId } },
    });
    const startOrder = (maxOrderResult._max.order ?? 0) + 1;

    // Create questions with their options
    const createdQuestions = await Promise.all(
      aiResult.result.questions.map(async (q, index) => {
        return prisma.question.create({
          data: {
            text: q.text,
            type: q.type,
            explanation: q.explanation,
            points: q.points,
            order: startOrder + index,
            quizId,
            isAIGenerated: true,
            aiStatus: "DRAFT",
            aiGenerationLogId: logEntry.id,
            options: {
              create: q.options.map((opt) => ({
                text: opt.text,
                isCorrect: opt.isCorrect,
                order: opt.order,
              })),
            },
          },
        });
      })
    );

    // Update log to completed
    const estimatedCost =
      ((aiResult.inputTokens * 0.15) / 1_000_000) +
      ((aiResult.outputTokens * 0.6) / 1_000_000);

    await prisma.aIGenerationLog.update({
      where: { id: logEntry.id },
      data: {
        status: "COMPLETED",
        provider: aiResult.provider,
        model: aiResult.model,
        inputTokens: aiResult.inputTokens,
        outputTokens: aiResult.outputTokens,
        estimatedCost,
      },
    });

    // Send notification about generated questions
    await createNotification(
      userId,
      NotificationType.AI_CONTENT,
      `AI generated ${createdQuestions.length} questions for "${lesson.title}". Review them.`
    );

    // Warn if approaching quota limit
    if (
      isApproachingQuotaLimit(
        monthlyUsage + 1,
        settings.monthlyQuotaPerTeacher
      )
    ) {
      await createNotification(
        userId,
        NotificationType.AI_CONTENT,
        `You are approaching your monthly AI generation quota (${monthlyUsage + 1}/${settings.monthlyQuotaPerTeacher}).`
      );
    }

    revalidatePath("/list/courses");

    return {
      success: true,
      error: false,
      questionCount: createdQuestions.length,
    };
  } catch (err) {
    console.error("generateAIQuestions error:", err);
    return {
      success: false,
      error: true,
      message: "An unexpected error occurred",
    };
  }
}

// Approve a single AI-generated question (DRAFT -> APPROVED)
export async function approveAIQuestion(
  questionId: number
): Promise<CurrentState> {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (!userId || (role !== "admin" && role !== "teacher")) {
    return { success: false, error: true };
  }

  try {
    const ownership = await verifyQuestionOwnership(questionId, userId, role);
    if (!ownership) {
      return { success: false, error: true, message: "Question not found" };
    }

    if (ownership.question.aiStatus !== "DRAFT") {
      return { success: false, error: true, message: "Question is not a draft" };
    }

    await prisma.question.update({
      where: { id: questionId },
      data: { aiStatus: "APPROVED" },
    });

    revalidatePath("/list/courses");
    return { success: true, error: false };
  } catch (err) {
    console.error("approveAIQuestion error:", err);
    return { success: false, error: true };
  }
}

// Reject a single AI-generated question (DRAFT -> REJECTED)
export async function rejectAIQuestion(
  questionId: number
): Promise<CurrentState> {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (!userId || (role !== "admin" && role !== "teacher")) {
    return { success: false, error: true };
  }

  try {
    const ownership = await verifyQuestionOwnership(questionId, userId, role);
    if (!ownership) {
      return { success: false, error: true, message: "Question not found" };
    }

    if (ownership.question.aiStatus !== "DRAFT") {
      return { success: false, error: true, message: "Question is not a draft" };
    }

    await prisma.question.update({
      where: { id: questionId },
      data: { aiStatus: "REJECTED" },
    });

    revalidatePath("/list/courses");
    return { success: true, error: false };
  } catch (err) {
    console.error("rejectAIQuestion error:", err);
    return { success: false, error: true };
  }
}

// Bulk approve multiple AI-generated questions
export async function bulkApproveAIQuestions(
  questionIds: ReadonlyArray<number>
): Promise<CurrentState & { count?: number }> {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (!userId || (role !== "admin" && role !== "teacher")) {
    return { success: false, error: true };
  }

  try {
    // Verify all questions exist, are DRAFT, and belong to courses the teacher owns
    const questions = await prisma.question.findMany({
      where: {
        id: { in: [...questionIds] },
        isAIGenerated: true,
        aiStatus: "DRAFT",
      },
      select: {
        id: true,
        quiz: {
          select: {
            lesson: {
              select: {
                module: {
                  select: {
                    course: {
                      select: { teacherId: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // Filter to only questions the teacher owns
    const ownedIds = questions
      .filter((q) => {
        if (role === "admin") return true;
        return q.quiz?.lesson.module.course.teacherId === userId;
      })
      .map((q) => q.id);

    if (ownedIds.length === 0) {
      return { success: false, error: true, message: "No valid questions found" };
    }

    const result = await prisma.question.updateMany({
      where: { id: { in: ownedIds } },
      data: { aiStatus: "APPROVED" },
    });

    revalidatePath("/list/courses");
    return { success: true, error: false, count: result.count };
  } catch (err) {
    console.error("bulkApproveAIQuestions error:", err);
    return { success: false, error: true };
  }
}

// Fetch DRAFT AI questions for a given lesson
export async function getAIDraftQuestions(
  lessonId: number
): Promise<
  Array<{
    id: number;
    text: string;
    type: string;
    explanation: string | null;
    points: number;
    aiStatus: string | null;
    options: Array<{
      id: number;
      text: string;
      isCorrect: boolean;
      order: number;
    }>;
  }>
> {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (!userId || (role !== "admin" && role !== "teacher")) {
    return [];
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

  return questions.map((q) => ({
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
}

// Get the teacher's current AI quota usage
export async function getTeacherAIQuota(): Promise<{
  quota: number;
  used: number;
  remaining: number;
  approaching: boolean;
} | null> {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (!userId || (role !== "admin" && role !== "teacher")) {
    return null;
  }

  const settings = await prisma.aISettings.findFirst();
  const monthlyQuota = settings?.monthlyQuotaPerTeacher ?? 100;

  const monthlyUsage = await prisma.aIGenerationLog.count({
    where: {
      teacherId: userId,
      createdAt: { gte: getMonthStartDate() },
    },
  });

  const remaining = Math.max(0, monthlyQuota - monthlyUsage);

  return {
    quota: monthlyQuota,
    used: monthlyUsage,
    remaining,
    approaching: isApproachingQuotaLimit(monthlyUsage, monthlyQuota),
  };
}

// ---------------------------------------------------------------------------
// AI Summary Generation and Review
// @MX:NOTE: [AUTO] Summary generation follows the same auth-ownership-quota-AI-persist pattern as questions
// @MX:SPEC: SPEC-AI-001
// ---------------------------------------------------------------------------

// Generate an AI summary for a lesson.
// Validates quota, extracts content, calls AI service, and creates a LessonSummary record.
export async function generateAISummary(
  data: {
    lessonId: number;
    summaryLength: "brief" | "standard" | "detailed";
  }
): Promise<CurrentState> {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (!userId || (role !== "admin" && role !== "teacher")) {
    return { success: false, error: true, message: "Unauthorized" };
  }

  // Validate input
  const parsed = aiSummaryGenerationSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: true, message: "Invalid input" };
  }

  const { lessonId, summaryLength } = parsed.data;

  try {
    // Verify ownership (reuse existing helper)
    const ownership = await verifyLessonOwnership(lessonId, userId, role);
    if (!ownership) {
      return { success: false, error: true, message: "Lesson not found" };
    }

    const { lesson } = ownership;

    // Check AI settings
    const settings = await prisma.aISettings.findFirst();
    if (!settings || !settings.enabled) {
      return {
        success: false,
        error: true,
        message: "AI generation is disabled",
      };
    }

    // Check monthly quota
    const monthlyUsage = await prisma.aIGenerationLog.count({
      where: {
        teacherId: userId,
        createdAt: { gte: getMonthStartDate() },
      },
    });

    const quotaCheck = checkQuotaAvailable(
      monthlyUsage,
      settings.monthlyQuotaPerTeacher
    );

    if (!quotaCheck.available) {
      return {
        success: false,
        error: true,
        message: "Monthly quota exceeded",
      };
    }

    // Extract lesson text and validate minimum length
    const text = extractPlainText(lesson.content ?? "");
    if (text.trim().length < 50) {
      return {
        success: false,
        error: true,
        message: "Lesson content is too short for AI generation (minimum 50 characters)",
      };
    }

    // Check for existing APPROVED summary (REQ-S-005 metadata note)
    const existingApproved = await prisma.lessonSummary.findFirst({
      where: { lessonId, status: "APPROVED" },
      select: { id: true },
    });

    // Create pending log entry
    const logEntry = await prisma.aIGenerationLog.create({
      data: {
        teacherId: userId,
        lessonId,
        generationType: "SUMMARY",
        status: "PENDING",
        metadata: existingApproved
          ? { replacesApprovedSummaryId: existingApproved.id }
          : undefined,
      },
    });

    // Call AI service
    const aiResult = await generateSummary({
      lessonContent: text,
      lessonTitle: lesson.title,
      summaryLength,
    });

    // Handle AI failure
    if (!aiResult.result) {
      await prisma.aIGenerationLog.update({
        where: { id: logEntry.id },
        data: {
          status: "FAILED",
          errorMessage: "AI validation failed: could not parse response",
          provider: aiResult.provider,
          model: aiResult.model,
          inputTokens: aiResult.inputTokens,
          outputTokens: aiResult.outputTokens,
        },
      });
      return {
        success: false,
        error: true,
        message: "AI generation failed. Please try again.",
      };
    }

    // Build content: summary text followed by key points
    const keyPointsList = aiResult.result.keyPoints
      .map((point) => `- ${point}`)
      .join("\n");
    const fullContent = keyPointsList
      ? `${aiResult.result.summary}\n\nKey Points:\n${keyPointsList}`
      : aiResult.result.summary;

    // Create LessonSummary record
    await prisma.lessonSummary.create({
      data: {
        lessonId,
        content: fullContent,
        status: "DRAFT",
        generatedByTeacherId: userId,
        aiGenerationLogId: logEntry.id,
      },
    });

    // Update log to completed
    const estimatedCost =
      ((aiResult.inputTokens * 0.15) / 1_000_000) +
      ((aiResult.outputTokens * 0.6) / 1_000_000);

    await prisma.aIGenerationLog.update({
      where: { id: logEntry.id },
      data: {
        status: "COMPLETED",
        provider: aiResult.provider,
        model: aiResult.model,
        inputTokens: aiResult.inputTokens,
        outputTokens: aiResult.outputTokens,
        estimatedCost,
      },
    });

    // Send notification
    await createNotification(
      userId,
      NotificationType.AI_CONTENT,
      `AI summary generated for "${lesson.title}". Review it.`
    );

    // Warn if approaching quota limit
    if (
      isApproachingQuotaLimit(
        monthlyUsage + 1,
        settings.monthlyQuotaPerTeacher
      )
    ) {
      await createNotification(
        userId,
        NotificationType.AI_CONTENT,
        `You are approaching your monthly AI generation quota (${monthlyUsage + 1}/${settings.monthlyQuotaPerTeacher}).`
      );
    }

    revalidatePath("/list/courses");

    return { success: true, error: false };
  } catch (err) {
    console.error("generateAISummary error:", err);
    return {
      success: false,
      error: true,
      message: "An unexpected error occurred",
    };
  }
}

// Approve a DRAFT AI summary.
// If an existing APPROVED summary exists for the same lesson, it is set to REJECTED (replace behavior per REQ-S-005).
// Notifies enrolled students that a new summary is available (REQ-E-009).
export async function approveAISummary(
  summaryId: number
): Promise<CurrentState> {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (!userId || (role !== "admin" && role !== "teacher")) {
    return { success: false, error: true, message: "Unauthorized" };
  }

  try {
    // Fetch summary with ownership chain
    const summary = await prisma.lessonSummary.findUnique({
      where: { id: summaryId },
      include: {
        lesson: {
          include: {
            module: {
              include: {
                course: {
                  select: {
                    id: true,
                    teacherId: true,
                    title: true,
                    enrollments: {
                      where: { status: "ACTIVE" },
                      select: { studentId: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!summary) {
      return { success: false, error: true, message: "Summary not found" };
    }

    // Verify ownership
    const courseTeacherId = summary.lesson.module.course.teacherId;
    if (role === "teacher" && courseTeacherId !== userId) {
      return { success: false, error: true, message: "Summary not found" };
    }

    if (summary.status !== "DRAFT") {
      return {
        success: false,
        error: true,
        message: "Summary is not a draft",
      };
    }

    // Replace existing APPROVED summary for the same lesson (REQ-S-005)
    await prisma.lessonSummary.updateMany({
      where: {
        lessonId: summary.lessonId,
        status: "APPROVED",
        id: { not: summaryId },
      },
      data: { status: "REJECTED" },
    });

    // Approve this summary
    await prisma.lessonSummary.update({
      where: { id: summaryId },
      data: {
        status: "APPROVED",
        approvedByTeacherId: userId,
      },
    });

    // Notify enrolled students (REQ-E-009)
    const enrolledStudentIds =
      summary.lesson.module.course.enrollments.map((e) => e.studentId);

    await Promise.all(
      enrolledStudentIds.map((studentId) =>
        createNotification(
          studentId,
          NotificationType.AI_CONTENT,
          `New summary available for "${summary.lesson.title}".`
        )
      )
    );

    revalidatePath("/list/courses");
    return { success: true, error: false };
  } catch (err) {
    console.error("approveAISummary error:", err);
    return { success: false, error: true };
  }
}

// Reject a DRAFT AI summary.
export async function rejectAISummary(
  summaryId: number
): Promise<CurrentState> {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (!userId || (role !== "admin" && role !== "teacher")) {
    return { success: false, error: true, message: "Unauthorized" };
  }

  try {
    const summary = await prisma.lessonSummary.findUnique({
      where: { id: summaryId },
      include: {
        lesson: {
          include: {
            module: {
              include: {
                course: { select: { teacherId: true } },
              },
            },
          },
        },
      },
    });

    if (!summary) {
      return { success: false, error: true, message: "Summary not found" };
    }

    if (role === "teacher" && summary.lesson.module.course.teacherId !== userId) {
      return { success: false, error: true, message: "Summary not found" };
    }

    if (summary.status !== "DRAFT") {
      return {
        success: false,
        error: true,
        message: "Summary is not a draft",
      };
    }

    await prisma.lessonSummary.update({
      where: { id: summaryId },
      data: { status: "REJECTED" },
    });

    revalidatePath("/list/courses");
    return { success: true, error: false };
  } catch (err) {
    console.error("rejectAISummary error:", err);
    return { success: false, error: true };
  }
}

// Fetch DRAFT AI summaries for a given lesson (admin/teacher only).
export async function getAIDraftSummaries(
  lessonId: number
): Promise<
  ReadonlyArray<{
    id: number;
    content: string;
    createdAt: string;
  }>
> {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (!userId || (role !== "admin" && role !== "teacher")) {
    return [];
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

  return summaries.map((s) => ({
    id: s.id,
    content: s.content,
    createdAt: s.createdAt.toISOString(),
  }));
}

// Fetch the latest APPROVED summary for a lesson (visible to all roles).
export async function getApprovedSummary(
  lessonId: number
): Promise<{
  id: number;
  content: string;
  createdAt: string;
} | null> {
  const summary = await prisma.lessonSummary.findFirst({
    where: {
      lessonId,
      status: "APPROVED",
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      content: true,
      createdAt: true,
    },
  });

  if (!summary) {
    return null;
  }

  return {
    id: summary.id,
    content: summary.content,
    createdAt: summary.createdAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Admin AI Settings & Usage Dashboard (SPEC-AI-001, Phase 6)
// @MX:NOTE: [AUTO] Admin-only server actions for AI settings CRUD and usage analytics
// @MX:SPEC: SPEC-AI-001
// ---------------------------------------------------------------------------

// Default settings returned when no AISettings row exists yet.
const DEFAULT_AI_SETTINGS = {
  provider: "openai",
  modelId: "gpt-4o-mini",
  monthlyQuotaPerTeacher: 100,
  maxTokensPerRequest: 4000,
  enabled: false,
} as const;

// Fetch current AI settings (admin only).
export async function getAISettings(): Promise<{
  provider: string;
  modelId: string;
  monthlyQuotaPerTeacher: number;
  maxTokensPerRequest: number;
  enabled: boolean;
}> {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (!userId || role !== "admin") {
    return { ...DEFAULT_AI_SETTINGS };
  }

  const settings = await prisma.aISettings.findFirst();
  if (!settings) {
    return { ...DEFAULT_AI_SETTINGS };
  }

  return {
    provider: settings.provider,
    modelId: settings.modelId,
    monthlyQuotaPerTeacher: settings.monthlyQuotaPerTeacher,
    maxTokensPerRequest: settings.maxTokensPerRequest,
    enabled: settings.enabled,
  };
}

// Update AI settings (admin only). Upserts the single AISettings row.
export async function updateAISettings(
  data: AISettingsSchema
): Promise<CurrentState> {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (!userId || role !== "admin") {
    return { success: false, error: true, message: "Unauthorized" };
  }

  const parsed = aiSettingsSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: true, message: "Invalid input" };
  }

  try {
    await prisma.aISettings.upsert({
      where: { id: 1 },
      update: parsed.data,
      create: parsed.data,
    });

    revalidatePath("/list/ai-settings");
    return { success: true, error: false };
  } catch (err) {
    console.error("updateAISettings error:", err);
    return { success: false, error: true, message: "Failed to save settings" };
  }
}

// Teacher usage row returned by getAIUsageStats.
export type TeacherUsageRow = {
  teacherId: string;
  teacherName: string;
  requestCount: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  estimatedCost: number;
};

// Monthly trend row returned by getAIUsageStats.
export type MonthlyTrendRow = {
  month: string;
  requests: number;
  tokens: number;
  cost: number;
};

// Fetch AI usage statistics for the admin dashboard (admin only).
// @MX:NOTE: [AUTO] Aggregates AIGenerationLog per teacher for current month and monthly trends for last 6 months
export async function getAIUsageStats(): Promise<{
  teachers: ReadonlyArray<TeacherUsageRow>;
  monthlyTrends: ReadonlyArray<MonthlyTrendRow>;
  quota: number;
}> {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (!userId || role !== "admin") {
    return { teachers: [], monthlyTrends: [], quota: 100 };
  }

  // Fetch settings for quota
  const settings = await prisma.aISettings.findFirst();
  const quota = settings?.monthlyQuotaPerTeacher ?? 100;

  // Current month start
  const monthStart = getMonthStartDate();

  // Per-teacher usage for current month
  const currentMonthLogs = await prisma.aIGenerationLog.findMany({
    where: {
      createdAt: { gte: monthStart },
    },
    select: {
      teacherId: true,
      inputTokens: true,
      outputTokens: true,
      estimatedCost: true,
    },
  });

  // Aggregate per teacher
  const teacherMap = new Map<
    string,
    { requestCount: number; inputTokens: number; outputTokens: number; cost: number }
  >();

  for (const log of currentMonthLogs) {
    const existing = teacherMap.get(log.teacherId) ?? {
      requestCount: 0,
      inputTokens: 0,
      outputTokens: 0,
      cost: 0,
    };
    teacherMap.set(log.teacherId, {
      requestCount: existing.requestCount + 1,
      inputTokens: existing.inputTokens + (log.inputTokens ?? 0),
      outputTokens: existing.outputTokens + (log.outputTokens ?? 0),
      cost: existing.cost + (log.estimatedCost ?? 0),
    });
  }

  // Fetch teacher names
  const teacherIds = [...teacherMap.keys()];
  const teacherRecords =
    teacherIds.length > 0
      ? await prisma.teacher.findMany({
          where: { id: { in: teacherIds } },
          select: { id: true, name: true, surname: true },
        })
      : [];

  const teacherNameMap = new Map(
    teacherRecords.map((t) => [t.id, `${t.name} ${t.surname}`])
  );

  const teachers: ReadonlyArray<TeacherUsageRow> = teacherIds.map((tid) => {
    const stats = teacherMap.get(tid)!;
    return {
      teacherId: tid,
      teacherName: teacherNameMap.get(tid) ?? tid,
      requestCount: stats.requestCount,
      totalInputTokens: stats.inputTokens,
      totalOutputTokens: stats.outputTokens,
      estimatedCost: stats.cost,
    };
  });

  // Monthly trends for last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const trendLogs = await prisma.aIGenerationLog.findMany({
    where: {
      createdAt: { gte: sixMonthsAgo },
    },
    select: {
      createdAt: true,
      inputTokens: true,
      outputTokens: true,
      estimatedCost: true,
    },
  });

  // Aggregate by month
  const monthMap = new Map<
    string,
    { requests: number; tokens: number; cost: number }
  >();

  for (const log of trendLogs) {
    const key = `${log.createdAt.getFullYear()}-${String(log.createdAt.getMonth() + 1).padStart(2, "0")}`;
    const existing = monthMap.get(key) ?? { requests: 0, tokens: 0, cost: 0 };
    monthMap.set(key, {
      requests: existing.requests + 1,
      tokens:
        existing.tokens +
        (log.inputTokens ?? 0) +
        (log.outputTokens ?? 0),
      cost: existing.cost + (log.estimatedCost ?? 0),
    });
  }

  const monthlyTrends: ReadonlyArray<MonthlyTrendRow> = [...monthMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      requests: data.requests,
      tokens: data.tokens,
      cost: data.cost,
    }));

  return { teachers, monthlyTrends, quota };
}
