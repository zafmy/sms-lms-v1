"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { useTranslations } from "next-intl";

const ReviewSummaryContent = () => {
  const searchParams = useSearchParams();
  const tSessions = useTranslations("spaced_repetition.sessions");
  const tXp = useTranslations("gamification.xp");
  const total = Number(searchParams.get("total") || 0);
  const correct = Number(searchParams.get("correct") || 0);
  const xp = Number(searchParams.get("xp") || 0);
  const incorrect = total - correct;

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <h1 className="text-2xl font-bold mb-2">{tSessions("sessionComplete")}</h1>
        <p className="text-gray-500 mb-6">{tSessions("greatWorkReviewing")}</p>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 rounded-md p-3">
            <p className="text-2xl font-bold">{total}</p>
            <p className="text-xs text-gray-500">{tSessions("cardsReviewed")}</p>
          </div>
          <div className="bg-green-50 rounded-md p-3">
            <p className="text-2xl font-bold text-green-600">{correct}</p>
            <p className="text-xs text-gray-500">{tSessions("correct")}</p>
          </div>
          <div className="bg-red-50 rounded-md p-3">
            <p className="text-2xl font-bold text-red-600">{incorrect}</p>
            <p className="text-xs text-gray-500">{tSessions("needsWork")}</p>
          </div>
        </div>

        <div className="bg-lamaPurpleLight rounded-md p-4 mb-6">
          <p className="text-3xl font-bold text-blue-700">{tXp("xpEarned", { xp })}</p>
          <p className="text-xs text-gray-500">{tXp("experienceEarned")}</p>
        </div>

        <div className="flex gap-3 justify-center">
          <Link
            href="/list/reviews"
            className="bg-lamaSky text-gray-700 px-6 py-2 rounded-md hover:opacity-90 transition"
          >
            {tSessions("backToReviews")}
          </Link>
        </div>
      </div>
    </div>
  );
};

const ReviewSummaryPage = () => {
  const tSessions = useTranslations("spaced_repetition.sessions");
  return (
    <Suspense
      fallback={
        <div className="p-4 text-center">{tSessions("loadingSummary")}</div>
      }
    >
      <ReviewSummaryContent />
    </Suspense>
  );
};

export default ReviewSummaryPage;
