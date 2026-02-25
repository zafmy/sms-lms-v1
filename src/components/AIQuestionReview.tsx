// Client component for reviewing AI-generated draft questions.
// Provides approve/reject per question and bulk approve.
// @MX:NOTE: [AUTO] Client-side review UI for AI-generated questions
// @MX:SPEC: SPEC-AI-001

"use client";

import {
  approveAIQuestion,
  rejectAIQuestion,
  bulkApproveAIQuestions,
} from "@/lib/aiActions";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ReviewQuestion {
  readonly id: number;
  readonly text: string;
  readonly type: string;
  readonly explanation: string | null;
  readonly points: number;
  readonly aiStatus: string | null;
  readonly options: ReadonlyArray<{
    readonly id: number;
    readonly text: string;
    readonly isCorrect: boolean;
    readonly order: number;
  }>;
}

const TYPE_LABELS: Record<string, string> = {
  MULTIPLE_CHOICE: "MCQ",
  TRUE_FALSE: "T/F",
};

const AIQuestionReview = ({
  questions: initialQuestions,
}: {
  questions: ReadonlyArray<ReviewQuestion>;
}) => {
  const router = useRouter();
  const [questions, setQuestions] = useState<ReadonlyArray<ReviewQuestion>>(initialQuestions);
  const [loadingIds, setLoadingIds] = useState<ReadonlySet<number>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  if (questions.length === 0) {
    return null;
  }

  const handleApprove = async (questionId: number) => {
    setLoadingIds((prev) => new Set([...prev, questionId]));

    const result = await approveAIQuestion(questionId);
    if (result.success) {
      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
      router.refresh();
    }

    setLoadingIds((prev) => {
      const next = new Set(prev);
      next.delete(questionId);
      return next;
    });
  };

  const handleReject = async (questionId: number) => {
    setLoadingIds((prev) => new Set([...prev, questionId]));

    const result = await rejectAIQuestion(questionId);
    if (result.success) {
      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
      router.refresh();
    }

    setLoadingIds((prev) => {
      const next = new Set(prev);
      next.delete(questionId);
      return next;
    });
  };

  const handleBulkApprove = async () => {
    setBulkLoading(true);
    const ids = questions.map((q) => q.id);
    const result = await bulkApproveAIQuestions(ids);

    if (result.success) {
      setQuestions([]);
      router.refresh();
    }

    setBulkLoading(false);
  };

  return (
    <div className="border border-amber-200 rounded-lg p-4 bg-amber-50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-md font-semibold text-amber-800">
          AI Questions Pending Review ({questions.length})
        </h3>
        <button
          type="button"
          onClick={handleBulkApprove}
          disabled={bulkLoading}
          className="bg-green-600 text-white px-3 py-1 rounded-md text-sm
            hover:bg-green-700 disabled:opacity-50"
        >
          {bulkLoading ? "Approving..." : "Approve All"}
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {questions.map((question) => {
          const isLoading = loadingIds.has(question.id);
          const typeLabel = TYPE_LABELS[question.type] ?? question.type;

          return (
            <div
              key={question.id}
              className="bg-white rounded-md p-3 border border-gray-200"
            >
              {/* Question Header */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-mono">
                      {typeLabel}
                    </span>
                    <span className="text-xs text-gray-400">
                      {question.points} pt{question.points !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800">{question.text}</p>
                </div>
              </div>

              {/* Options */}
              <div className="ml-2 mb-2">
                {question.options.map((option) => (
                  <div
                    key={option.id}
                    className={`text-xs py-0.5 flex items-center gap-1.5 ${
                      option.isCorrect
                        ? "text-green-700 font-medium"
                        : "text-gray-600"
                    }`}
                  >
                    <span>
                      {option.isCorrect ? "\u2713" : "\u2022"}
                    </span>
                    {option.text}
                  </div>
                ))}
              </div>

              {/* Explanation */}
              {question.explanation && (
                <p className="text-xs text-gray-500 italic mb-2 ml-2">
                  Explanation: {question.explanation}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => handleReject(question.id)}
                  disabled={isLoading}
                  className="px-3 py-1 text-xs rounded-md border border-red-300 text-red-600
                    hover:bg-red-50 disabled:opacity-50"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => handleApprove(question.id)}
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

export default AIQuestionReview;
