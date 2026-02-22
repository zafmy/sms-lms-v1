"use client";

import { toggleVote } from "@/lib/forumActions";
import { useOptimistic, useTransition } from "react";

const UpvoteButton = ({
  replyId,
  voteCount,
  hasVoted,
}: {
  replyId: number;
  voteCount: number;
  hasVoted: boolean;
}) => {
  const [isPending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(
    { count: voteCount, voted: hasVoted },
    (_current, _action: null) => ({
      count: _current.voted ? _current.count - 1 : _current.count + 1,
      voted: !_current.voted,
    })
  );

  const handleVote = () => {
    startTransition(async () => {
      setOptimistic(null);
      await toggleVote({ success: false, error: false }, { replyId });
    });
  };

  return (
    <button
      onClick={handleVote}
      disabled={isPending}
      className={`flex items-center gap-1 text-sm px-2 py-1 rounded-md transition-colors ${
        optimistic.voted
          ? "text-blue-600 bg-blue-50"
          : "text-gray-500 hover:bg-gray-100"
      } disabled:opacity-50`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill={optimistic.voted ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
      <span>{optimistic.count}</span>
    </button>
  );
};

export default UpvoteButton;
