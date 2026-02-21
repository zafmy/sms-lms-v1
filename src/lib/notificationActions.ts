"use server";

import prisma from "./prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { NotificationType } from "@prisma/client";

// Create a notification for a specific user
export const createNotification = async (
  userId: string,
  type: NotificationType,
  message: string
) => {
  await prisma.notification.create({
    data: { userId, type, message },
  });
};

// Mark a single notification as read
export const markNotificationRead = async (id: number) => {
  const { userId } = await auth();
  if (!userId) return;

  // Verify ownership before marking read
  await prisma.notification.updateMany({
    where: { id, userId },
    data: { read: true },
  });
  revalidatePath("/");
};

// Mark all notifications as read for the authenticated user
export const markAllNotificationsRead = async () => {
  const { userId } = await auth();
  if (!userId) return;

  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
  revalidatePath("/");
};
