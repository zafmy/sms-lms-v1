// Client component for displaying an approved AI-generated summary.
// Renders the summary text with key points as a list.
// @MX:NOTE: [AUTO] Student-facing display for teacher-approved AI summaries
// @MX:SPEC: SPEC-AI-001

"use client";

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

const LessonSummaryDisplay = ({
  summary,
}: {
  summary: { content: string; createdAt: string };
}) => {
  const { summaryText, keyPoints } = parseSummaryContent(summary.content);

  return (
    <div className="border border-green-200 rounded-lg p-4 bg-green-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-md font-semibold text-green-800">
          Lesson Summary
        </h3>
        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
          AI-generated, teacher-approved
        </span>
      </div>

      {/* Summary Text */}
      <div className="prose prose-sm max-w-none text-gray-700 mb-3">
        <p>{summaryText}</p>
      </div>

      {/* Key Points */}
      {keyPoints.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-600 mb-1">
            Key Points
          </p>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-0.5">
            {keyPoints.map((point, index) => (
              <li key={index}>{point}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Timestamp */}
      <p className="text-xs text-gray-400 mt-3">
        Generated{" "}
        {new Date(summary.createdAt).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
      </p>
    </div>
  );
};

export default LessonSummaryDisplay;
