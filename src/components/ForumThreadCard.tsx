import Link from "next/link";
import { getTranslations } from "next-intl/server";

type ThreadCardData = {
  id: number;
  title: string;
  isPinned: boolean;
  isLocked: boolean;
  isAnonymous: boolean;
  lastActivityAt: Date;
  authorId: string;
  authorRole: string;
  authorName: string;
  replyCount: number;
  hasAcceptedReply: boolean;
};

const timeAgo = (
  date: Date,
  t: (key: string, params?: Record<string, number>) => string
): string => {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return t("justNow");
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return t("minutesAgo", { minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("hoursAgo", { hours });
  const days = Math.floor(hours / 24);
  return t("daysAgo", { days });
};

const ForumThreadCard = async ({
  thread,
  courseId,
  role,
  userId,
}: {
  thread: ThreadCardData;
  courseId: number;
  role: string;
  userId: string;
}) => {
  const t = await getTranslations("lms.forums");

  // Anonymous handling: show "Anonymous" to students unless they are the author
  const displayName =
    thread.isAnonymous && role === "student" && thread.authorId !== userId
      ? t("anonymous")
      : thread.authorName;

  return (
    <Link
      href={`/list/courses/${courseId}/forum/${thread.id}`}
      className="block border border-gray-200 rounded-md p-4 hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {thread.isPinned && (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-medium">
                {t("pinned")}
              </span>
            )}
            {thread.isLocked && (
              <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-medium">
                {t("locked")}
              </span>
            )}
            {thread.hasAcceptedReply && (
              <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">
                {t("answered")}
              </span>
            )}
            <h3 className="text-sm font-semibold text-gray-800 truncate">
              {thread.title}
            </h3>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>{displayName}</span>
            {thread.authorRole === "teacher" && (
              <span className="bg-blue-50 text-blue-600 px-1 py-0.5 rounded">
                {t("teacher")}
              </span>
            )}
            <span>{timeAgo(thread.lastActivityAt, t)}</span>
          </div>
        </div>
        <div className="text-xs text-gray-400 whitespace-nowrap flex items-center gap-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {thread.replyCount}
        </div>
      </div>
    </Link>
  );
};

export default ForumThreadCard;
