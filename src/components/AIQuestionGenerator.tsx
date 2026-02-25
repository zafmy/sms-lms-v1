// Client component for AI question generation.
// Provides UI for selecting question count, types, and triggering generation.
// @MX:NOTE: [AUTO] Client-side AI generation trigger with quota display
// @MX:SPEC: SPEC-AI-001

"use client";

import { generateAIQuestions, getTeacherAIQuota } from "@/lib/aiActions";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type QuestionType = "MULTIPLE_CHOICE" | "TRUE_FALSE";

const QUESTION_COUNT_OPTIONS = [3, 5, 10] as const;

const AIQuestionGenerator = ({
  lessonId,
  lessonTitle,
  hasContent,
  quizId,
}: {
  lessonId: number;
  lessonTitle: string;
  hasContent: boolean;
  quizId?: number;
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [questionTypes, setQuestionTypes] = useState<ReadonlyArray<QuestionType>>([
    "MULTIPLE_CHOICE",
    "TRUE_FALSE",
  ]);
  const [quota, setQuota] = useState<{
    quota: number;
    used: number;
    remaining: number;
    approaching: boolean;
  } | null>(null);

  const loadQuota = useCallback(async () => {
    const result = await getTeacherAIQuota();
    if (result) {
      setQuota(result);
    }
  }, []);

  useEffect(() => {
    loadQuota();
  }, [loadQuota]);

  const handleTypeToggle = (type: QuestionType) => {
    setQuestionTypes((prev) => {
      if (prev.includes(type)) {
        // Do not allow deselecting the last type
        if (prev.length <= 1) return prev;
        return prev.filter((t) => t !== type);
      }
      return [...prev, type];
    });
  };

  const handleGenerate = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const result = await generateAIQuestions({
        lessonId,
        questionCount,
        questionTypes: [...questionTypes],
        targetQuizId: quizId,
      });

      if (result.success) {
        setMessage({
          type: "success",
          text: `Successfully generated ${result.questionCount ?? questionCount} questions for "${lessonTitle}".`,
        });
        await loadQuota();
        router.refresh();
      } else {
        setMessage({
          type: "error",
          text: result.message ?? "Failed to generate questions.",
        });
      }
    } catch {
      setMessage({
        type: "error",
        text: "An unexpected error occurred.",
      });
    } finally {
      setLoading(false);
    }
  };

  const isDisabled =
    loading || !hasContent || (quota !== null && quota.remaining <= 0);

  return (
    <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-md font-semibold text-blue-800">
          AI Question Generator
        </h3>
        {quota && (
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              quota.approaching
                ? "bg-amber-100 text-amber-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            Quota: {quota.remaining}/{quota.quota} remaining
          </span>
        )}
      </div>

      {/* Question Count */}
      <div className="mb-3">
        <label className="text-sm text-gray-600 block mb-1">
          Number of questions
        </label>
        <div className="flex gap-2">
          {QUESTION_COUNT_OPTIONS.map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => setQuestionCount(count)}
              className={`px-3 py-1 rounded-md text-sm ${
                questionCount === count
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {count}
            </button>
          ))}
        </div>
      </div>

      {/* Question Types */}
      <div className="mb-4">
        <label className="text-sm text-gray-600 block mb-1">
          Question types
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleTypeToggle("MULTIPLE_CHOICE")}
            className={`px-3 py-1 rounded-md text-sm ${
              questionTypes.includes("MULTIPLE_CHOICE")
                ? "bg-blue-600 text-white"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            Multiple Choice
          </button>
          <button
            type="button"
            onClick={() => handleTypeToggle("TRUE_FALSE")}
            className={`px-3 py-1 rounded-md text-sm ${
              questionTypes.includes("TRUE_FALSE")
                ? "bg-blue-600 text-white"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            True / False
          </button>
        </div>
      </div>

      {/* Warnings */}
      {!hasContent && (
        <p className="text-sm text-amber-600 mb-3">
          This lesson has no content. Add content before generating questions.
        </p>
      )}
      {quota && quota.remaining <= 0 && (
        <p className="text-sm text-red-600 mb-3">
          Monthly AI generation quota has been reached.
        </p>
      )}

      {/* Generate Button */}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={isDisabled}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium
          hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
          flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Generating...
          </>
        ) : (
          "Generate Questions with AI"
        )}
      </button>

      {/* Result Message */}
      {message && (
        <p
          className={`mt-3 text-sm ${
            message.type === "success" ? "text-green-600" : "text-red-600"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
};

export default AIQuestionGenerator;
