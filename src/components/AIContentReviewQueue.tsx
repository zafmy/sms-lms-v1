// Unified review queue for all DRAFT AI content (questions and summaries).
// @MX:NOTE: [AUTO] Client component for reviewing and approving/rejecting AI-generated content
// @MX:SPEC: SPEC-AI-001

"use client";

import { useState } from "react";
import {
  approveAIQuestion,
  rejectAIQuestion,
  approveAISummary,
  rejectAISummary,
} from "@/lib/aiActions";
import { useRouter } from "next/navigation";

export interface ReviewQueueItem {
  readonly id: number;
  readonly type: "question" | "summary";
  readonly lessonTitle: string;
  readonly preview: string;
  readonly createdAt: string;
}

interface AIContentReviewQueueProps {
  readonly items: ReadonlyArray<ReviewQueueItem>;
}

const AIContentReviewQueue = ({ items }: AIContentReviewQueueProps) => {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<ReadonlyArray<string>>([]);

  const getItemKey = (item: ReviewQueueItem): string =>
    `${item.type}-${item.id}`;

  const handleApprove = async (item: ReviewQueueItem) => {
    const key = getItemKey(item);
    setLoadingId(key);
    try {
      const result =
        item.type === "question"
          ? await approveAIQuestion(item.id)
          : await approveAISummary(item.id);

      if (result.success) {
        setDismissedIds((prev) => [...prev, key]);
        router.refresh();
      }
    } finally {
      setLoadingId(null);
    }
  };

  const handleReject = async (item: ReviewQueueItem) => {
    const key = getItemKey(item);
    setLoadingId(key);
    try {
      const result =
        item.type === "question"
          ? await rejectAIQuestion(item.id)
          : await rejectAISummary(item.id);

      if (result.success) {
        setDismissedIds((prev) => [...prev, key]);
        router.refresh();
      }
    } finally {
      setLoadingId(null);
    }
  };

  const visibleItems = items.filter(
    (item) => !dismissedIds.includes(getItemKey(item))
  );

  return (
    <div className="bg-white rounded-md p-4">
      <h1 className="text-xl font-semibold">AI Content Review</h1>
      <p className="text-sm text-gray-500 mt-1">
        {visibleItems.length} item{visibleItems.length !== 1 ? "s" : ""}{" "}
        pending review
      </p>

      {visibleItems.length === 0 ? (
        <p className="text-sm text-gray-400 mt-4">
          No AI content pending review.
        </p>
      ) : (
        <div className="flex flex-col gap-2 mt-4 max-h-96 overflow-y-auto">
          {visibleItems.map((item) => {
            const key = getItemKey(item);
            const isLoading = loadingId === key;

            return (
              <div
                key={key}
                className="p-3 rounded-md border border-gray-100 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        item.type === "question"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      {item.type === "question" ? "Question" : "Summary"}
                    </span>
                    <span className="text-sm font-medium truncate">
                      {item.lessonTitle}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0 ml-2">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-sm text-gray-600 line-clamp-2">
                  {item.preview}
                </p>

                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => handleReject(item)}
                    disabled={isLoading}
                    className="text-xs px-3 py-1 rounded-md border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                  >
                    {isLoading ? "..." : "Reject"}
                  </button>
                  <button
                    onClick={() => handleApprove(item)}
                    disabled={isLoading}
                    className="text-xs px-3 py-1 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {isLoading ? "..." : "Approve"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AIContentReviewQueue;
