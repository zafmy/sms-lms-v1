import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import NotificationDropdown from "./NotificationDropdown";

const NotificationBell = async () => {
  const { userId } = await auth();
  if (!userId) return null;

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const serialized = notifications.map((n) => ({
    id: n.id,
    type: n.type,
    message: n.message,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
  }));

  return (
    <NotificationDropdown notifications={serialized} unreadCount={unreadCount} />
  );
};

export default NotificationBell;
