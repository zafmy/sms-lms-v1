"use client";

import { markReplyAccepted, deleteReply } from "@/lib/forumActions";
import UpvoteButton from "./UpvoteButton";
import ForumReplyForm from "./ForumReplyForm";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

const timeAgo = (date: string) => {
  const seconds = Math.floor(
    (Date.now() - new Date(date).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const ForumReplyItem = ({
  reply,
  threadId,
  threadAuthorId,
  courseId,
  role,
  userId,
  isLocked,
  depth = 0,
}: {
  reply: ReplyData;
  threadId: number;
  threadAuthorId: string;
  courseId: number;
  role: string;
  userId: string;
  isLocked: boolean;
  depth?: number;
}) => {
  const router = useRouter();
  const [showReplyForm, setShowReplyForm] = useState(false);

  const [acceptState, acceptAction] = useActionState(markReplyAccepted, {
    success: false,
    error: false,
  });

  const [deleteState, deleteAction] = useActionState(deleteReply, {
    success: false,
    error: false,
  });

  useEffect(() => {
    if (acceptState.success || deleteState.success) {
      router.refresh();
    }
  }, [acceptState, deleteState, router]);

  const canAccept =
    userId === threadAuthorId ||
    role === "teacher" ||
    role === "admin";

  const canDelete =
    reply.authorId === userId ||
    role === "teacher" ||
    role === "admin";

  // Anonymous handling: show "Anonymous" to students, real name to teacher/admin
  const displayName =
    reply.isAnonymous && role === "student" && reply.authorId !== userId
      ? "Anonymous"
      : reply.authorName;

  const handleAccept = () => {
    acceptAction({ replyId: reply.id, threadId });
  };

  const handleDelete = () => {
    if (window.confirm("Delete this reply?")) {
      deleteAction({ id: reply.id });
    }
  };

  return (
    <div className={depth > 0 ? "ml-8 border-l-2 border-gray-100 pl-4" : ""}>
      <div className="bg-white border border-gray-200 rounded-md p-4 mb-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-800">
              {displayName}
            </span>
            {reply.authorRole === "teacher" && (
              <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                Teacher
              </span>
            )}
            {reply.authorRole === "admin" && (
              <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                Admin
              </span>
            )}
            {reply.isAccepted && (
              <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Accepted
              </span>
            )}
            <span className="text-xs text-gray-400">
              {timeAgo(reply.createdAt)}
            </span>
          </div>
        </div>

        {/* Content */}
        <p className="text-sm text-gray-700 whitespace-pre-wrap mb-3">
          {reply.content}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <UpvoteButton
            replyId={reply.id}
            voteCount={reply.voteCount}
            hasVoted={reply.hasVoted}
          />

          {!isLocked && depth === 0 && (
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Reply
            </button>
          )}

          {canAccept && !reply.isAccepted && (
            <button
              onClick={handleAccept}
              className="text-sm text-green-600 hover:text-green-700"
            >
              Accept
            </button>
          )}

          {canDelete && (
            <button
              onClick={handleDelete}
              className="text-sm text-red-500 hover:text-red-700"
            >
              Delete
            </button>
          )}
        </div>

        {acceptState.error && (
          <p className="text-xs text-red-500 mt-1">{acceptState.message}</p>
        )}
        {deleteState.error && (
          <p className="text-xs text-red-500 mt-1">{deleteState.message}</p>
        )}

        {/* Reply form for this reply */}
        {showReplyForm && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <ForumReplyForm
              threadId={threadId}
              parentId={reply.id}
              isLocked={isLocked}
              role={role}
              onSuccess={() => setShowReplyForm(false)}
            />
          </div>
        )}
      </div>

      {/* Nested children */}
      {reply.children.map((child) => (
        <ForumReplyItem
          key={child.id}
          reply={child}
          threadId={threadId}
          threadAuthorId={threadAuthorId}
          courseId={courseId}
          role={role}
          userId={userId}
          isLocked={isLocked}
          depth={depth + 1}
        />
      ))}
    </div>
  );
};

export default ForumReplyItem;
