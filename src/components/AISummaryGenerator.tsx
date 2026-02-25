// Client component for AI summary generation.
// Provides UI for selecting summary length and triggering generation.
// @MX:NOTE: [AUTO] Client-side AI summary generation trigger with quota display
// @MX:SPEC: SPEC-AI-001

"use client";

import { generateAISummary, getTeacherAIQuota } from "@/lib/aiActions";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type SummaryLength = "brief" | "standard" | "detailed";

const SUMMARY_LENGTH_OPTIONS: ReadonlyArray<{
  readonly value: SummaryLength;
  readonly label: string;
}> = [
  { value: "brief", label: "Brief" },
  { value: "standard", label: "Standard" },
  { value: "detailed", label: "Detailed" },
] as const;

const AISummaryGenerator = ({
  lessonId,
  lessonTitle,
  hasContent,
  hasApprovedSummary,
}: {
  lessonId: number;
  lessonTitle: string;
  hasContent: boolean;
  hasApprovedSummary: boolean;
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [summaryLength, setSummaryLength] = useState<SummaryLength>("standard");
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

  const handleGenerate = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const result = await generateAISummary({
        lessonId,
        summaryLength,
      });

      if (result.success) {
        setMessage({
          type: "success",
          text: `AI summary generated for "${lessonTitle}". Review it below.`,
        });
        await loadQuota();
        router.refresh();
      } else {
        setMessage({
          type: "error",
          text: result.message ?? "Failed to generate summary.",
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
    <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-md font-semibold text-purple-800">
          AI Summary Generator
        </h3>
        {quota && (
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              quota.approaching
                ? "bg-amber-100 text-amber-700"
                : "bg-purple-100 text-purple-700"
            }`}
          >
            Quota: {quota.remaining}/{quota.quota} remaining
          </span>
        )}
      </div>

      {/* Summary Length */}
      <div className="mb-3">
        <label className="text-sm text-gray-600 block mb-1">
          Summary length
        </label>
        <div className="flex gap-2">
          {SUMMARY_LENGTH_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setSummaryLength(option.value)}
              className={`px-3 py-1 rounded-md text-sm ${
                summaryLength === option.value
                  ? "bg-purple-600 text-white"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Warnings */}
      {hasApprovedSummary && (
        <p className="text-sm text-amber-600 mb-3">
          An approved summary already exists. Approving a new one will replace it.
        </p>
      )}
      {!hasContent && (
        <p className="text-sm text-amber-600 mb-3">
          This lesson has no content. Add content before generating a summary.
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
        className="w-full bg-purple-600 text-white py-2 px-4 rounded-md text-sm font-medium
          hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed
          flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Generating...
          </>
        ) : (
          "Generate Summary with AI"
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

export default AISummaryGenerator;
