// Client component for reviewing AI-generated draft summaries.
// Provides approve/reject per summary with content preview.
// @MX:NOTE: [AUTO] Client-side review UI for AI-generated summaries
// @MX:SPEC: SPEC-AI-001

"use client";

import { approveAISummary, rejectAISummary } from "@/lib/aiActions";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ReviewSummary {
  readonly id: number;
  readonly content: string;
  readonly createdAt: string;
}

// Parse content to separate summary text from key points section.
function parseSummaryContent(content: string): {
  summaryText: string;
  keyPoints: ReadonlyArray<string>;
} {
  const keyPointsMarker = "\n\nKey Points:\n";
  const markerIndex = content.indexOf(keyPointsMarker);

  if (markerIndex === -1) {
    return { summaryText: content, keyPoints: [] };
  }

  const summaryText = content.slice(0, markerIndex);
  const keyPointsRaw = content.slice(markerIndex + keyPointsMarker.length);
  const keyPoints = keyPointsRaw
    .split("\n")
    .map((line) => line.replace(/^-\s*/, "").trim())
    .filter((line) => line.length > 0);

  return { summaryText, keyPoints };
}

const AISummaryReview = ({
  summaries: initialSummaries,
}: {
  summaries: ReadonlyArray<ReviewSummary>;
}) => {
  const router = useRouter();
  const [summaries, setSummaries] =
    useState<ReadonlyArray<ReviewSummary>>(initialSummaries);
  const [loadingIds, setLoadingIds] = useState<ReadonlySet<number>>(new Set());

  if (summaries.length === 0) {
    return null;
  }

  const handleApprove = async (id: number) => {
    setLoadingIds((prev) => new Set([...prev, id]));

    const result = await approveAISummary(id);
    if (result.success) {
      setSummaries((prev) => prev.filter((s) => s.id !== id));
      router.refresh();
    }

    setLoadingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleReject = async (id: number) => {
    setLoadingIds((prev) => new Set([...prev, id]));

    const result = await rejectAISummary(id);
    if (result.success) {
      setSummaries((prev) => prev.filter((s) => s.id !== id));
      router.refresh();
    }

    setLoadingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  return (
    <div className="border border-amber-200 rounded-lg p-4 bg-amber-50">
      <h3 className="text-md font-semibold text-amber-800 mb-4">
        AI Summaries Pending Review ({summaries.length})
      </h3>

      <div className="flex flex-col gap-4">
        {summaries.map((summary) => {
          const isLoading = loadingIds.has(summary.id);
          const { summaryText, keyPoints } = parseSummaryContent(
            summary.content
          );

          return (
            <div
              key={summary.id}
              className="bg-white rounded-md p-4 border border-gray-200"
            >
              {/* Timestamp */}
              <p className="text-xs text-gray-400 mb-2">
                Generated{" "}
                {new Date(summary.createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>

              {/* Summary Text */}
              <div className="prose prose-sm max-w-none text-gray-700 mb-3">
                <p>{summaryText}</p>
              </div>

              {/* Key Points */}
              {keyPoints.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-gray-600 mb-1">
                    Key Points
                  </p>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-0.5">
                    {keyPoints.map((point, index) => (
                      <li key={index}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => handleReject(summary.id)}
                  disabled={isLoading}
                  className="px-3 py-1 text-xs rounded-md border border-red-300 text-red-600
                    hover:bg-red-50 disabled:opacity-50"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => handleApprove(summary.id)}
                  disabled={isLoading}
                  className="px-3 py-1 text-xs rounded-md bg-green-600 text-white
                    hover:bg-green-700 disabled:opacity-50"
                >
                  Approve
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AISummaryReview;
