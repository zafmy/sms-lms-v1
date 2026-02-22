import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import ForumThreadCard from "./ForumThreadCard";
import Pagination from "./Pagination";
import NewThreadToggle from "./NewThreadToggle";

const ForumThreadList = async ({
  courseId,
  searchParams,
  role,
  userId,
}: {
  courseId: number;
  searchParams: { page?: string; search?: string };
  role: string;
  userId: string;
}) => {
  const page = parseInt(searchParams.page || "1");
  const search = searchParams.search || "";

  const whereClause = {
    courseId,
    ...(search
      ? { title: { contains: search, mode: "insensitive" as const } }
      : {}),
  };

  const [threads, count] = await Promise.all([
    prisma.forumThread.findMany({
      where: whereClause,
      orderBy: [{ isPinned: "desc" }, { lastActivityAt: "desc" }],
      skip: (page - 1) * ITEM_PER_PAGE,
      take: ITEM_PER_PAGE,
      select: {
        id: true,
        title: true,
        isPinned: true,
        isLocked: true,
        isAnonymous: true,
        lastActivityAt: true,
        authorId: true,
        authorRole: true,
        _count: { select: { replies: true } },
        replies: {
          where: { isAccepted: true },
          select: { id: true },
          take: 1,
        },
      },
    }),
    prisma.forumThread.count({ where: whereClause }),
  ]);

  // Batch resolve author names
  const authorIds = [...new Set(threads.map((t) => t.authorId))];
  const [teachers, students] = await Promise.all([
    prisma.teacher.findMany({
      where: { id: { in: authorIds } },
      select: { id: true, name: true, surname: true },
    }),
    prisma.student.findMany({
      where: { id: { in: authorIds } },
      select: { id: true, name: true, surname: true },
    }),
  ]);
  const authorMap = new Map<string, string>();
  teachers.forEach((t) => authorMap.set(t.id, `${t.name} ${t.surname}`));
  students.forEach((s) => authorMap.set(s.id, `${s.name} ${s.surname}`));

  const threadCards = threads.map((t) => ({
    id: t.id,
    title: t.title,
    isPinned: t.isPinned,
    isLocked: t.isLocked,
    isAnonymous: t.isAnonymous,
    lastActivityAt: t.lastActivityAt,
    authorId: t.authorId,
    authorRole: t.authorRole,
    authorName: authorMap.get(t.authorId) || "Unknown",
    replyCount: t._count.replies,
    hasAcceptedReply: t.replies.length > 0,
  }));

  return (
    <div>
      {/* Search and New Thread */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <form className="flex-1 max-w-sm">
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Search threads..."
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
          />
        </form>
        <NewThreadToggle courseId={courseId} role={role} />
      </div>

      {/* Thread List */}
      {threadCards.length === 0 ? (
        <p className="text-sm text-gray-400 py-8 text-center">
          No threads yet. Start a discussion!
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {threadCards.map((thread) => (
            <ForumThreadCard
              key={thread.id}
              thread={thread}
              courseId={courseId}
              role={role}
              userId={userId}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {count > 0 && <Pagination page={page} count={count} />}
    </div>
  );
};

export default ForumThreadList;
