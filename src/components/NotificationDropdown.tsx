"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/notificationActions";

type NotificationItem = {
  id: number;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
};

interface NotificationDropdownProps {
  notifications: NotificationItem[];
  unreadCount: number;
}

const typeColors: Record<string, string> = {
  GRADE: "bg-blue-500",
  ATTENDANCE: "bg-green-500",
  ANNOUNCEMENT: "bg-purple-500",
  ASSIGNMENT: "bg-orange-500",
  GENERAL: "bg-gray-500",
};

function timeAgo(dateStr: string, t: (key: string, params?: Record<string, number>) => string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return t("justNow");
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return t("minutesAgo", { minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("hoursAgo", { hours });
  const days = Math.floor(hours / 24);
  return t("daysAgo", { days });
}

const NotificationDropdown = ({
  notifications,
  unreadCount,
}: NotificationDropdownProps) => {
  const t = useTranslations("notifications");
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    router.refresh();
  };

  const handleNotificationClick = async (id: number) => {
    await markNotificationRead(id);
    router.refresh();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <div
        className="bg-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer relative"
        onClick={() => setOpen((prev) => !prev)}
      >
        <Image src="/announcement.png" alt="" width={20} height={20} />
        {unreadCount > 0 && (
          <div className="absolute -top-3 -right-3 w-5 h-5 flex items-center justify-center bg-purple-500 text-white rounded-full text-xs">
            {unreadCount}
          </div>
        )}
      </div>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white rounded-lg shadow-lg ring-1 ring-gray-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-700">
              {t("title")}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-purple-500 hover:text-purple-700"
              >
                {t("markAllRead")}
              </button>
            )}
          </div>

          {/* Notification List */}
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              {t("noNotifications")}
            </div>
          ) : (
            <div>
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() =>
                    !notification.read &&
                    handleNotificationClick(notification.id)
                  }
                  className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 ${
                    !notification.read ? "bg-purple-50/30" : ""
                  }`}
                >
                  {/* Type Color Dot */}
                  <div
                    className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      typeColors[notification.type] || "bg-gray-500"
                    }`}
                  />
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-xs leading-relaxed ${
                        notification.read ? "text-gray-500" : "text-gray-800"
                      }`}
                    >
                      {notification.message}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {timeAgo(notification.createdAt, t)}
                    </p>
                  </div>
                  {/* Unread Indicator */}
                  {!notification.read && (
                    <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
