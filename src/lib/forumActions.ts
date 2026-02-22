"use server";

import { revalidatePath } from "next/cache";
import prisma from "./prisma";
import { auth } from "@clerk/nextjs/server";
import { createNotification } from "./notificationActions";
import {
  threadSchema,
  threadUpdateSchema,
  replySchema,
  replyUpdateSchema,
  pinSchema,
  lockSchema,
  acceptReplySchema,
  voteSchema,
  moderationSchema,
} from "./forumValidationSchemas";
import type {
  ThreadFormData,
  ThreadUpdateFormData,
  ReplyFormData,
  ReplyUpdateFormData,
} from "./forumValidationSchemas";

type CurrentState = { success: boolean; error: boolean; message?: string };

// --- Authorization Helper ---

async function checkForumAccess(
  courseId: number,
  userId: string,
  role: string
): Promise<boolean> {
  if (role === "admin") return true;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { teacherId: true },
  });
  if (!course) return false;

  if (role === "teacher" && course.teacherId === userId) return true;

  if (role === "student") {
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        courseId,
        studentId: userId,
        status: "ACTIVE",
      },
    });
    return !!enrollment;
  }

  return false;
}

// --- Helper to check teacher/admin moderation access ---

async function checkModerationAccess(
  courseId: number,
  userId: string,
  role: string
): Promise<boolean> {
  if (role === "admin") return true;

  if (role === "teacher") {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { teacherId: true },
    });
    return !!course && course.teacherId === userId;
  }

  return false;
}

// --- 1. createThread ---

export const createThread = async (
  currentState: CurrentState,
  data: ThreadFormData
) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || !role) {
    return { success: false, error: true, message: "Not authenticated" };
  }

  const result = threadSchema.safeParse(data);
  if (!result.success) {
    return { success: false, error: true, message: "Invalid input" };
  }

  const hasAccess = await checkForumAccess(result.data.courseId, userId, role);
  if (!hasAccess) {
    return { success: false, error: true, message: "Access denied" };
  }

  try {
    await prisma.forumThread.create({
      data: {
        title: result.data.title,
        content: result.data.content,
        courseId: result.data.courseId,
        isAnonymous: result.data.isAnonymous,
        authorId: userId,
        authorRole: role,
        lastActivityAt: new Date(),
      },
    });

    revalidatePath(`/list/courses/${result.data.courseId}/forum`);
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true, message: "Failed to create thread" };
  }
};

// --- 2. updateThread ---

export const updateThread = async (
  currentState: CurrentState,
  data: ThreadUpdateFormData
) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || !role) {
    return { success: false, error: true, message: "Not authenticated" };
  }

  const result = threadUpdateSchema.safeParse(data);
  if (!result.success) {
    return { success: false, error: true, message: "Invalid input" };
  }

  try {
    const thread = await prisma.forumThread.findUnique({
      where: { id: result.data.id },
      select: { authorId: true, courseId: true },
    });
    if (!thread) {
      return { success: false, error: true, message: "Thread not found" };
    }

    // Only the author or admin can edit
    if (thread.authorId !== userId && role !== "admin") {
      return { success: false, error: true, message: "Access denied" };
    }

    await prisma.forumThread.update({
      where: { id: result.data.id },
      data: {
        title: result.data.title,
        content: result.data.content,
      },
    });

    revalidatePath(`/list/courses/${thread.courseId}/forum`);
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true, message: "Failed to update thread" };
  }
};

// --- 3. deleteThread ---

export const deleteThread = async (
  currentState: CurrentState,
  data: { id: number }
) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || !role) {
    return { success: false, error: true, message: "Not authenticated" };
  }

  const parsed = moderationSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: true, message: "Invalid input" };
  }

  try {
    const thread = await prisma.forumThread.findUnique({
      where: { id: parsed.data.id },
      select: { authorId: true, courseId: true },
    });
    if (!thread) {
      return { success: false, error: true, message: "Thread not found" };
    }

    // Author, course teacher, or admin can delete
    const isModerator = await checkModerationAccess(
      thread.courseId,
      userId,
      role
    );
    if (thread.authorId !== userId && !isModerator) {
      return { success: false, error: true, message: "Access denied" };
    }

    await prisma.forumThread.delete({
      where: { id: parsed.data.id },
    });

    revalidatePath(`/list/courses/${thread.courseId}/forum`);
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true, message: "Failed to delete thread" };
  }
};

// --- 4. pinThread ---

export const pinThread = async (
  currentState: CurrentState,
  data: { id: number; isPinned: boolean }
) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || !role) {
    return { success: false, error: true, message: "Not authenticated" };
  }

  const parsed = pinSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: true, message: "Invalid input" };
  }

  try {
    const thread = await prisma.forumThread.findUnique({
      where: { id: parsed.data.id },
      select: { courseId: true },
    });
    if (!thread) {
      return { success: false, error: true, message: "Thread not found" };
    }

    // Course teacher or admin only
    const isModerator = await checkModerationAccess(
      thread.courseId,
      userId,
      role
    );
    if (!isModerator) {
      return { success: false, error: true, message: "Access denied" };
    }

    await prisma.forumThread.update({
      where: { id: parsed.data.id },
      data: { isPinned: parsed.data.isPinned },
    });

    revalidatePath(`/list/courses/${thread.courseId}/forum`);
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true, message: "Failed to pin thread" };
  }
};

// --- 5. lockThread ---

export const lockThread = async (
  currentState: CurrentState,
  data: { id: number; isLocked: boolean }
) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || !role) {
    return { success: false, error: true, message: "Not authenticated" };
  }

  const parsed = lockSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: true, message: "Invalid input" };
  }

  try {
    const thread = await prisma.forumThread.findUnique({
      where: { id: parsed.data.id },
      select: { courseId: true },
    });
    if (!thread) {
      return { success: false, error: true, message: "Thread not found" };
    }

    // Course teacher or admin only
    const isModerator = await checkModerationAccess(
      thread.courseId,
      userId,
      role
    );
    if (!isModerator) {
      return { success: false, error: true, message: "Access denied" };
    }

    await prisma.forumThread.update({
      where: { id: parsed.data.id },
      data: { isLocked: parsed.data.isLocked },
    });

    revalidatePath(`/list/courses/${thread.courseId}/forum`);
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true, message: "Failed to lock thread" };
  }
};

// --- 6. createReply ---

export const createReply = async (
  currentState: CurrentState,
  data: ReplyFormData
) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || !role) {
    return { success: false, error: true, message: "Not authenticated" };
  }

  const result = replySchema.safeParse(data);
  if (!result.success) {
    return { success: false, error: true, message: "Invalid input" };
  }

  try {
    const thread = await prisma.forumThread.findUnique({
      where: { id: result.data.threadId },
      select: { isLocked: true, courseId: true, authorId: true },
    });
    if (!thread) {
      return { success: false, error: true, message: "Thread not found" };
    }

    if (thread.isLocked) {
      return { success: false, error: true, message: "Thread is locked" };
    }

    const hasAccess = await checkForumAccess(thread.courseId, userId, role);
    if (!hasAccess) {
      return { success: false, error: true, message: "Access denied" };
    }

    await prisma.forumReply.create({
      data: {
        content: result.data.content,
        threadId: result.data.threadId,
        parentId: result.data.parentId ?? null,
        isAnonymous: result.data.isAnonymous,
        authorId: userId,
        authorRole: role,
      },
    });

    // Update thread lastActivityAt
    await prisma.forumThread.update({
      where: { id: result.data.threadId },
      data: { lastActivityAt: new Date() },
    });

    // Send notification to thread author if replier is not the author
    if (thread.authorId !== userId) {
      await createNotification(
        thread.authorId,
        "FORUM_REPLY",
        "Someone replied to your forum thread."
      );
    }

    revalidatePath(
      `/list/courses/${thread.courseId}/forum/${result.data.threadId}`
    );
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true, message: "Failed to create reply" };
  }
};

// --- 7. updateReply ---

export const updateReply = async (
  currentState: CurrentState,
  data: ReplyUpdateFormData
) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || !role) {
    return { success: false, error: true, message: "Not authenticated" };
  }

  const result = replyUpdateSchema.safeParse(data);
  if (!result.success) {
    return { success: false, error: true, message: "Invalid input" };
  }

  try {
    const reply = await prisma.forumReply.findUnique({
      where: { id: result.data.id },
      select: {
        authorId: true,
        thread: { select: { courseId: true, id: true } },
      },
    });
    if (!reply) {
      return { success: false, error: true, message: "Reply not found" };
    }

    // Only the author or admin can edit
    if (reply.authorId !== userId && role !== "admin") {
      return { success: false, error: true, message: "Access denied" };
    }

    await prisma.forumReply.update({
      where: { id: result.data.id },
      data: { content: result.data.content },
    });

    revalidatePath(
      `/list/courses/${reply.thread.courseId}/forum/${reply.thread.id}`
    );
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true, message: "Failed to update reply" };
  }
};

// --- 8. deleteReply ---

export const deleteReply = async (
  currentState: CurrentState,
  data: { id: number }
) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || !role) {
    return { success: false, error: true, message: "Not authenticated" };
  }

  const parsed = moderationSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: true, message: "Invalid input" };
  }

  try {
    const reply = await prisma.forumReply.findUnique({
      where: { id: parsed.data.id },
      select: {
        authorId: true,
        thread: { select: { courseId: true, id: true } },
      },
    });
    if (!reply) {
      return { success: false, error: true, message: "Reply not found" };
    }

    // Author, course teacher, or admin can delete
    const isModerator = await checkModerationAccess(
      reply.thread.courseId,
      userId,
      role
    );
    if (reply.authorId !== userId && !isModerator) {
      return { success: false, error: true, message: "Access denied" };
    }

    await prisma.forumReply.delete({
      where: { id: parsed.data.id },
    });

    revalidatePath(
      `/list/courses/${reply.thread.courseId}/forum/${reply.thread.id}`
    );
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true, message: "Failed to delete reply" };
  }
};

// --- 9. markReplyAccepted ---

export const markReplyAccepted = async (
  currentState: CurrentState,
  data: { replyId: number; threadId: number }
) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || !role) {
    return { success: false, error: true, message: "Not authenticated" };
  }

  const parsed = acceptReplySchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: true, message: "Invalid input" };
  }

  try {
    const thread = await prisma.forumThread.findUnique({
      where: { id: parsed.data.threadId },
      select: { authorId: true, courseId: true },
    });
    if (!thread) {
      return { success: false, error: true, message: "Thread not found" };
    }

    // Thread author, course teacher, or admin
    const isModerator = await checkModerationAccess(
      thread.courseId,
      userId,
      role
    );
    if (thread.authorId !== userId && !isModerator) {
      return { success: false, error: true, message: "Access denied" };
    }

    await prisma.$transaction([
      // Unset all accepted replies in this thread
      prisma.forumReply.updateMany({
        where: { threadId: parsed.data.threadId, isAccepted: true },
        data: { isAccepted: false },
      }),
      // Set the target reply as accepted
      prisma.forumReply.update({
        where: { id: parsed.data.replyId },
        data: { isAccepted: true },
      }),
    ]);

    revalidatePath(
      `/list/courses/${thread.courseId}/forum/${parsed.data.threadId}`
    );
    return { success: true, error: false };
  } catch (err) {
    return {
      success: false,
      error: true,
      message: "Failed to mark reply as accepted",
    };
  }
};

// --- 10. toggleVote ---

export const toggleVote = async (
  currentState: CurrentState,
  data: { replyId: number }
) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || !role) {
    return { success: false, error: true, message: "Not authenticated" };
  }

  const parsed = voteSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: true, message: "Invalid input" };
  }

  try {
    const reply = await prisma.forumReply.findUnique({
      where: { id: parsed.data.replyId },
      select: {
        thread: { select: { courseId: true, id: true } },
      },
    });
    if (!reply) {
      return { success: false, error: true, message: "Reply not found" };
    }

    // Any enrolled user can vote
    const hasAccess = await checkForumAccess(
      reply.thread.courseId,
      userId,
      role
    );
    if (!hasAccess) {
      return { success: false, error: true, message: "Access denied" };
    }

    const existingVote = await prisma.forumVote.findUnique({
      where: {
        replyId_userId: {
          replyId: parsed.data.replyId,
          userId,
        },
      },
    });

    if (existingVote) {
      await prisma.forumVote.delete({
        where: { id: existingVote.id },
      });
    } else {
      await prisma.forumVote.create({
        data: {
          replyId: parsed.data.replyId,
          userId,
        },
      });
    }

    revalidatePath(
      `/list/courses/${reply.thread.courseId}/forum/${reply.thread.id}`
    );
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true, message: "Failed to toggle vote" };
  }
};
