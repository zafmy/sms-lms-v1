import ForumReplyList from "@/components/ForumReplyList";
import ForumReplyForm from "@/components/ForumReplyForm";
import ForumModeration from "@/components/ForumModeration";
import { RichTextRenderer } from "@/components/editor";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

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

const ThreadDetailPage = async ({
  params,
}: {
  params: Promise<{ id: string; threadId: string }>;
}) => {
  const { id, threadId } = await params;
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const courseId = parseInt(id);
  const threadIdNum = parseInt(threadId);
  const t = await getTranslations("lms.forums");

  if (!userId || !role) return notFound();

  // Verify course access
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, title: true, teacherId: true },
  });
  if (!course) return notFound();

  if (role === "teacher" && course.teacherId !== userId) return notFound();

  if (role === "student") {
    const enrollment = await prisma.enrollment.findFirst({
      where: { courseId, studentId: userId, status: "ACTIVE" },
    });
    if (!enrollment) return notFound();
  }

  if (role === "parent") return notFound();

  // Fetch thread
  const thread = await prisma.forumThread.findUnique({
    where: { id: threadIdNum, courseId },
    select: {
      id: true,
      title: true,
      content: true,
      isPinned: true,
      isLocked: true,
      isAnonymous: true,
      createdAt: true,
      authorId: true,
      authorRole: true,
    },
  });
  if (!thread) return notFound();

  // Fetch all replies with vote counts and current user vote status
  const replies = await prisma.forumReply.findMany({
    where: { threadId: threadIdNum },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      content: true,
      isAccepted: true,
      isAnonymous: true,
      createdAt: true,
      authorId: true,
      authorRole: true,
      parentId: true,
      _count: { select: { votes: true } },
      votes: {
        where: { userId },
        select: { id: true },
      },
    },
  });

  // Batch resolve author names for thread + replies
  const allAuthorIds = [
    thread.authorId,
    ...replies.map((r) => r.authorId),
  ];
  const uniqueAuthorIds = [...new Set(allAuthorIds)];

  const [teachers, students] = await Promise.all([
    prisma.teacher.findMany({
      where: { id: { in: uniqueAuthorIds } },
      select: { id: true, name: true, surname: true },
    }),
    prisma.student.findMany({
      where: { id: { in: uniqueAuthorIds } },
      select: { id: true, name: true, surname: true },
    }),
  ]);

  const authorMap = new Map<string, string>();
  teachers.forEach((tc) => authorMap.set(tc.id, `${tc.name} ${tc.surname}`));
  students.forEach((s) => authorMap.set(s.id, `${s.name} ${s.surname}`));

  // Thread author display name
  const threadAuthorName =
    thread.isAnonymous && role === "student" && thread.authorId !== userId
      ? t("anonymous")
      : authorMap.get(thread.authorId) || t("unknown");

  // Build reply tree: top-level replies with their children
  type ReplyData = {
    id: number;
    content: string;
    isAccepted: boolean;
    isAnonymous: boolean;
    createdAt: string;
    authorId: string;
    authorRole: string;
    authorName: string;
    voteCount: number;
    hasVoted: boolean;
    children: ReplyData[];
  };

  const replyMap = new Map<number, ReplyData>();
  const topLevelReplies: ReplyData[] = [];

  // First pass: create all reply data objects
  for (const r of replies) {
    const replyData: ReplyData = {
      id: r.id,
      content: r.content,
      isAccepted: r.isAccepted,
      isAnonymous: r.isAnonymous,
      createdAt: r.createdAt.toISOString(),
      authorId: r.authorId,
      authorRole: r.authorRole,
      authorName: authorMap.get(r.authorId) || t("unknown"),
      voteCount: r._count.votes,
      hasVoted: r.votes.length > 0,
      children: [],
    };
    replyMap.set(r.id, replyData);
  }

  // Second pass: build tree
  for (const r of replies) {
    const replyData = replyMap.get(r.id)!;
    if (r.parentId && replyMap.has(r.parentId)) {
      replyMap.get(r.parentId)!.children.push(replyData);
    } else {
      topLevelReplies.push(replyData);
    }
  }

  const isModerator =
    role === "admin" ||
    (role === "teacher" && course.teacherId === userId);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* Navigation */}
      <div className="mb-4">
        <Link
          href={`/list/courses/${courseId}/forum`}
          className="text-sm text-gray-500 hover:underline"
        >
          &larr; {t("backToForum")}
        </Link>
      </div>

      {/* Thread Header */}
      <div className="border-b border-gray-200 pb-4 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
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
              <h1 className="text-xl font-semibold text-gray-900">
                {thread.title}
              </h1>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span className="font-medium">{threadAuthorName}</span>
              {thread.authorRole === "teacher" && (
                <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                  {t("teacher")}
                </span>
              )}
              {thread.authorRole === "admin" && (
                <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                  {t("admin")}
                </span>
              )}
              <span>{timeAgo(thread.createdAt, t)}</span>
            </div>
          </div>
        </div>

        {/* Thread Content */}
        <div className="mt-4">
          <RichTextRenderer
            content={thread.content}
            className="text-sm text-gray-700"
          />
        </div>

        {/* Moderation Controls */}
        {isModerator && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <ForumModeration
              threadId={thread.id}
              courseId={courseId}
              isPinned={thread.isPinned}
              isLocked={thread.isLocked}
            />
          </div>
        )}
      </div>

      {/* Locked Banner */}
      {thread.isLocked && (
        <div className="bg-orange-50 border border-orange-200 rounded-md p-3 mb-4 text-sm text-orange-700">
          {t("threadLocked")}
        </div>
      )}

      {/* Replies */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">
          {t("repliesCount", { count: replies.length })}
        </h2>
        <ForumReplyList
          replies={topLevelReplies}
          threadId={thread.id}
          threadAuthorId={thread.authorId}
          courseId={courseId}
          role={role}
          userId={userId}
          isLocked={thread.isLocked}
        />
      </div>

      {/* Reply Form */}
      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-sm font-semibold mb-3">{t("postReply")}</h3>
        <ForumReplyForm
          threadId={thread.id}
          isLocked={thread.isLocked}
          role={role}
        />
      </div>
    </div>
  );
};

export default ThreadDetailPage;
