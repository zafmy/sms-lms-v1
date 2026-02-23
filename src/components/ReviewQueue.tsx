"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { getIntlLocale } from "@/lib/formatUtils";

interface ReviewQueueProps {
  totalDue: number;
  estimatedMinutes: number;
  subjectBreakdown: Record<string, number>;
  distribution: number[];
  masteryData: Array<{
    subjectId: number;
    subjectName: string;
    percentage: number;
  }>;
  recentSessions: Array<{
    id: number;
    completedAt: string;
    totalCards: number;
    correctCards: number;
    xpEarned: number;
  }>;
}

const ReviewQueue = ({
  totalDue,
  estimatedMinutes,
  subjectBreakdown,
  distribution,
  masteryData,
  recentSessions,
}: ReviewQueueProps) => {
  const tReviews = useTranslations("spaced_repetition.reviews");
  const tCards = useTranslations("spaced_repetition.cards");
  const tSessions = useTranslations("spaced_repetition.sessions");
  const tAnalytics = useTranslations("spaced_repetition.analytics");
  const tXp = useTranslations("gamification.xp");
  const locale = useLocale();
  const maxDistribution = Math.max(...distribution, 1);

  if (totalDue === 0) {
    return (
      <div className="bg-white p-6 rounded-md shadow-sm text-center">
        <h2 className="text-lg font-semibold mb-2">{tReviews("noReviewsDue")}</h2>
        <p className="text-gray-500">
          {tReviews("greatJob")}
        </p>
        {/* Show card distribution and mastery even when no cards are due */}
        {distribution.some((d) => d > 0) && (
          <div className="mt-6 text-left">
            <h3 className="text-md font-medium mb-2">{tCards("yourCardCollection")}</h3>
            <div className="flex gap-2 items-end h-24">
              {distribution.map((count, i) => (
                <div key={i} className="flex flex-col items-center flex-1">
                  <div
                    className={`w-full rounded-t ${
                      i < 2
                        ? "bg-red-300"
                        : i < 4
                          ? "bg-yellow-300"
                          : "bg-green-400"
                    }`}
                    style={{
                      height: `${count > 0 ? Math.max(20, (count / maxDistribution) * 80) : 4}px`,
                    }}
                  />
                  <span className="text-xs mt-1">{count}</span>
                  <span className="text-xs text-gray-500">{tCards("box", { number: i + 1 })}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Due card summary */}
      <div className="bg-white p-6 rounded-md shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">
              {tReviews("cardsDueForReview", { count: totalDue })}
            </h2>
            <p className="text-gray-500 text-sm">
              {tReviews("minutesEstimated", { minutes: estimatedMinutes })}
            </p>
          </div>
          <Link
            href="/list/reviews/session"
            className="bg-lamaSky text-gray-700 px-6 py-2 rounded-md hover:opacity-90 transition font-medium"
          >
            {tReviews("startReview")}
          </Link>
        </div>

        {/* Subject breakdown */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(subjectBreakdown).map(([subject, count]) => (
            <span
              key={subject}
              className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
            >
              {subject}: {count}
            </span>
          ))}
        </div>
      </div>

      {/* Card distribution */}
      <div className="bg-white p-4 rounded-md shadow-sm">
        <h3 className="text-md font-medium mb-3">{tCards("cardDistribution")}</h3>
        <div className="flex gap-2 items-end h-24">
          {distribution.map((count, i) => (
            <div key={i} className="flex flex-col items-center flex-1">
              <div
                className={`w-full rounded-t ${
                  i < 2
                    ? "bg-red-300"
                    : i < 4
                      ? "bg-yellow-300"
                      : "bg-green-400"
                }`}
                style={{
                  height: `${count > 0 ? Math.max(20, (count / maxDistribution) * 80) : 4}px`,
                }}
              />
              <span className="text-xs mt-1">{count}</span>
              <span className="text-xs text-gray-500">{tCards("box", { number: i + 1 })}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Subject mastery */}
      {masteryData.length > 0 && (
        <div className="bg-white p-4 rounded-md shadow-sm">
          <h3 className="text-md font-medium mb-3">{tAnalytics("subjectMastery")}</h3>
          <div className="space-y-2">
            {masteryData.map(({ subjectId, subjectName, percentage }) => (
              <div key={subjectId}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{subjectName}</span>
                  <span className="text-gray-500">
                    {Math.round(percentage)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      percentage >= 70
                        ? "bg-green-500"
                        : percentage >= 40
                          ? "bg-yellow-500"
                          : "bg-red-400"
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent sessions */}
      {recentSessions.length > 0 && (
        <div className="bg-white p-4 rounded-md shadow-sm">
          <h3 className="text-md font-medium mb-3">{tSessions("recentSessions")}</h3>
          <div className="space-y-2">
            {recentSessions.map((session) => (
              <div
                key={session.id}
                className="flex justify-between text-sm border-b pb-2"
              >
                <span>
                  {new Date(session.completedAt).toLocaleDateString(getIntlLocale(locale))}
                </span>
                <span>
                  {tSessions("correctOfTotal", { correct: session.correctCards, total: session.totalCards })}
                </span>
                <span className="text-blue-600">{tXp("xpEarned", { xp: session.xpEarned })}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewQueue;
