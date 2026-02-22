import ForumReplyItem from "./ForumReplyItem";

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

const ForumReplyList = ({
  replies,
  threadId,
  threadAuthorId,
  courseId,
  role,
  userId,
  isLocked,
}: {
  replies: ReplyData[];
  threadId: number;
  threadAuthorId: string;
  courseId: number;
  role: string;
  userId: string;
  isLocked: boolean;
}) => {
  if (replies.length === 0) {
    return (
      <p className="text-sm text-gray-400 py-4">
        No replies yet. Be the first to respond!
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {replies.map((reply) => (
        <ForumReplyItem
          key={reply.id}
          reply={reply}
          threadId={threadId}
          threadAuthorId={threadAuthorId}
          courseId={courseId}
          role={role}
          userId={userId}
          isLocked={isLocked}
        />
      ))}
    </div>
  );
};

export default ForumReplyList;
