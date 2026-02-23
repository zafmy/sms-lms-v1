"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { submitCardReview, completeReviewSession } from "@/lib/reviewActions";

interface Card {
  id: number;
  front: string;
  back: string;
  leitnerBox: number;
  cardType: string;
  subjectName: string;
}

interface ReviewSessionClientProps {
  sessionId: number;
  cards: Card[];
}

const ReviewSessionClient = ({
  sessionId,
  cards,
}: ReviewSessionClientProps) => {
  const router = useRouter();
  const t = useTranslations("spaced_repetition.cards");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [totalXp, setTotalXp] = useState(0);
  const [results, setResults] = useState<
    Array<{ cardId: number; rating: string }>
  >([]);

  const currentCard = cards[currentIndex];
  const progress = currentIndex;
  const total = cards.length;

  // Reset timer when card changes
  useEffect(() => {
    setStartTime(Date.now());
  }, [currentIndex]);

  const handleFlip = useCallback(() => {
    if (!isFlipped && !isSubmitting) {
      setIsFlipped(true);
    }
  }, [isFlipped, isSubmitting]);

  const handleRate = useCallback(
    async (rating: "HARD" | "OK" | "EASY") => {
      if (isSubmitting) return;
      setIsSubmitting(true);

      const responseTimeMs = Date.now() - startTime;

      try {
        await submitCardReview(
          currentCard.id,
          sessionId,
          rating,
          responseTimeMs
        );

        const newResult = { cardId: currentCard.id, rating };
        const updatedResults = [...results, newResult];
        setResults(updatedResults);

        // Estimate XP earned
        const xpGain =
          rating !== "HARD"
            ? 10 + (currentCard.leitnerBox === 1 ? 5 : 0)
            : 0;
        const newTotalXp = totalXp + xpGain;
        setTotalXp(newTotalXp);

        if (currentIndex < cards.length - 1) {
          setCurrentIndex((prev) => prev + 1);
          setIsFlipped(false);
        } else {
          // Last card - complete session
          await completeReviewSession(sessionId);
          const correctCount = updatedResults.filter(
            (r) => r.rating !== "HARD"
          ).length;
          // Session completion bonus
          const finalXp = newTotalXp + 50;
          const params = new URLSearchParams({
            total: String(total),
            correct: String(correctCount),
            xp: String(finalXp),
          });
          router.push(
            `/list/reviews/session/summary?${params.toString()}`
          );
        }
      } catch {
        // Allow retry on error
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      isSubmitting,
      startTime,
      currentCard,
      currentIndex,
      cards.length,
      sessionId,
      results,
      totalXp,
      total,
      router,
    ]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      if (!isFlipped) {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          handleFlip();
        }
      } else {
        if (e.key === "1" || e.key.toLowerCase() === "h") {
          e.preventDefault();
          handleRate("HARD");
        } else if (e.key === "2" || e.key.toLowerCase() === "o") {
          e.preventDefault();
          handleRate("OK");
        } else if (e.key === "3" || e.key.toLowerCase() === "e") {
          e.preventDefault();
          handleRate("EASY");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFlipped, handleFlip, handleRate]);

  return (
    <div className="p-4 max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-500 mb-1">
          <span>
            {t("cardOfTotal", { current: progress + 1, total })}
          </span>
          <span>{currentCard.subjectName}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-lamaSky h-2 rounded-full transition-all duration-300"
            style={{ width: `${(progress / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <div
        className={`bg-white rounded-lg shadow-md p-8 min-h-[300px] flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
          !isFlipped ? "hover:shadow-lg" : ""
        }`}
        onClick={handleFlip}
        role="button"
        tabIndex={0}
        aria-label={
          isFlipped ? t("cardAnswerShown") : t("clickToReveal")
        }
      >
        {!isFlipped ? (
          <>
            <span className="text-xs text-gray-400 mb-4 uppercase">
              {currentCard.cardType.replace("_", " ")}
            </span>
            <p className="text-lg text-center">{currentCard.front}</p>
            <p className="text-sm text-gray-400 mt-6">
              {t("clickOrPressSpace")}
            </p>
          </>
        ) : (
          <>
            <span className="text-xs text-gray-400 mb-2">{t("question")}</span>
            <p className="text-sm text-gray-500 mb-4 text-center">
              {currentCard.front}
            </p>
            <hr className="w-full mb-4" />
            <span className="text-xs text-gray-400 mb-2">{t("answer")}</span>
            <p className="text-lg text-center">{currentCard.back}</p>
          </>
        )}
      </div>

      {/* Rating buttons */}
      {isFlipped && (
        <div className="flex gap-3 mt-4 justify-center">
          <button
            onClick={() => handleRate("HARD")}
            disabled={isSubmitting}
            className="px-6 py-3 rounded-md bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 transition font-medium"
          >
            {t("hard")}
          </button>
          <button
            onClick={() => handleRate("OK")}
            disabled={isSubmitting}
            className="px-6 py-3 rounded-md bg-yellow-100 text-yellow-700 hover:bg-yellow-200 disabled:opacity-50 transition font-medium"
          >
            {t("ok")}
          </button>
          <button
            onClick={() => handleRate("EASY")}
            disabled={isSubmitting}
            className="px-6 py-3 rounded-md bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 transition font-medium"
          >
            {t("easy")}
          </button>
        </div>
      )}

      {/* Keyboard hints */}
      <p className="text-xs text-gray-400 text-center mt-3">
        {!isFlipped
          ? t("keyboardFlip")
          : t("keyboardRate")}
      </p>
    </div>
  );
};

export default ReviewSessionClient;
