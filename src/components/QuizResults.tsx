"use client";

import { useLocale, useTranslations } from "next-intl";
import { getIntlLocale } from "@/lib/formatUtils";

type QuizResultsProps = {
  attempt: {
    id: number;
    attemptNumber: number;
    score: number | null;
    maxScore: number | null;
    percentage: number | null;
    passed: boolean | null;
    submittedAt: string | null;
    responses: Array<{
      id: number;
      isCorrect: boolean | null;
      pointsEarned: number;
      selectedOptionId: number | null;
      textResponse: string | null;
      question: {
        id: number;
        text: string;
        type: string;
        points: number;
        explanation: string | null;
        options: Array<{
          id: number;
          text: string;
          isCorrect: boolean;
          order: number;
        }>;
      };
    }>;
  };
};

const QuizResults = ({ attempt }: QuizResultsProps) => {
  const t = useTranslations("lms.quizzes");
  const locale = useLocale();

  return (
    <div className="flex flex-col gap-6">
      {/* SCORE SUMMARY */}
      <div className="bg-gray-50 rounded-lg p-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            {t("attemptNum", { number: attempt.attemptNumber })}
          </h2>
          {attempt.submittedAt && (
            <p className="text-sm text-gray-500">
              {t("submitted")}{" "}
              {new Date(attempt.submittedAt).toLocaleString(getIntlLocale(locale))}
            </p>
          )}
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold">
            {attempt.score ?? 0} / {attempt.maxScore ?? 0}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-lg">{attempt.percentage ?? 0}%</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                attempt.passed
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {attempt.passed ? t("passed") : t("failed")}
            </span>
          </div>
        </div>
      </div>

      {/* PER-QUESTION BREAKDOWN */}
      <div className="flex flex-col gap-4">
        {attempt.responses.map((response, index) => {
          const correctOption = response.question.options.find(
            (o) => o.isCorrect
          );
          const selectedOption = response.question.options.find(
            (o) => o.id === response.selectedOptionId
          );

          return (
            <div
              key={response.id}
              className={`border rounded-lg p-4 ${
                response.isCorrect
                  ? "border-green-200 bg-green-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium">
                  Q{index + 1}. {response.question.text}
                </h3>
                <span className="text-sm font-medium whitespace-nowrap ml-4">
                  {response.pointsEarned} / {response.question.points}
                </span>
              </div>

              <div className="flex flex-col gap-1 text-sm">
                {response.question.type === "FILL_IN_BLANK" ? (
                  <>
                    <p>
                      <span className="text-gray-500">{t("yourAnswer")} </span>
                      <span
                        className={
                          response.isCorrect
                            ? "text-green-700 font-medium"
                            : "text-red-700 font-medium"
                        }
                      >
                        {response.textResponse || t("noAnswer")}
                      </span>
                    </p>
                    {!response.isCorrect && correctOption && (
                      <p>
                        <span className="text-gray-500">{t("correctAnswer")} </span>
                        <span className="text-green-700 font-medium">
                          {correctOption.text}
                        </span>
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p>
                      <span className="text-gray-500">{t("yourAnswer")} </span>
                      <span
                        className={
                          response.isCorrect
                            ? "text-green-700 font-medium"
                            : "text-red-700 font-medium"
                        }
                      >
                        {selectedOption?.text || t("noAnswer")}
                      </span>
                    </p>
                    {!response.isCorrect && correctOption && (
                      <p>
                        <span className="text-gray-500">{t("correctAnswer")} </span>
                        <span className="text-green-700 font-medium">
                          {correctOption.text}
                        </span>
                      </p>
                    )}
                  </>
                )}

                {response.question.explanation && (
                  <p className="mt-2 text-gray-600 italic">
                    {response.question.explanation}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QuizResults;
