"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

const ReviewSummaryContent = () => {
  const searchParams = useSearchParams();
  const total = Number(searchParams.get("total") || 0);
  const correct = Number(searchParams.get("correct") || 0);
  const xp = Number(searchParams.get("xp") || 0);
  const incorrect = total - correct;

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <h1 className="text-2xl font-bold mb-2">Session Complete!</h1>
        <p className="text-gray-500 mb-6">Great work reviewing your cards</p>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 rounded-md p-3">
            <p className="text-2xl font-bold">{total}</p>
            <p className="text-xs text-gray-500">Cards Reviewed</p>
          </div>
          <div className="bg-green-50 rounded-md p-3">
            <p className="text-2xl font-bold text-green-600">{correct}</p>
            <p className="text-xs text-gray-500">Correct</p>
          </div>
          <div className="bg-red-50 rounded-md p-3">
            <p className="text-2xl font-bold text-red-600">{incorrect}</p>
            <p className="text-xs text-gray-500">Needs Work</p>
          </div>
        </div>

        <div className="bg-lamaPurpleLight rounded-md p-4 mb-6">
          <p className="text-3xl font-bold text-blue-700">+{xp} XP</p>
          <p className="text-xs text-gray-500">Experience earned</p>
        </div>

        <div className="flex gap-3 justify-center">
          <Link
            href="/list/reviews"
            className="bg-lamaSky text-gray-700 px-6 py-2 rounded-md hover:opacity-90 transition"
          >
            Back to Reviews
          </Link>
        </div>
      </div>
    </div>
  );
};

const ReviewSummaryPage = () => {
  return (
    <Suspense
      fallback={
        <div className="p-4 text-center">Loading summary...</div>
      }
    >
      <ReviewSummaryContent />
    </Suspense>
  );
};

export default ReviewSummaryPage;
