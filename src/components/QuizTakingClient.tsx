"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import QuizQuestion from "./QuizQuestion";
import QuizTimer from "./QuizTimer";
import { submitQuizAttempt } from "@/lib/actions";

type QuizTakingClientProps = {
  attemptId: number;
  courseId: number;
  quizId: number;
  timeLimit: number | null;
  questions: Array<{
    id: number;
    text: string;
    type: string;
    points: number;
    options: Array<{ id: number; text: string; order: number }>;
  }>;
};

const QuizTakingClient = ({
  attemptId,
  courseId,
  quizId,
  timeLimit,
  questions,
}: QuizTakingClientProps) => {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<
    Record<number, { selectedOptionId?: number; textResponse?: string }>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleAnswerChange = (
    questionId: number,
    answer: { selectedOptionId?: number; textResponse?: string }
  ) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmit = useCallback(async () => {
    if (isSubmitting || submitted) return;
    setIsSubmitting(true);

    const responses = questions.map((q) => ({
      questionId: q.id,
      selectedOptionId: answers[q.id]?.selectedOptionId,
      textResponse: answers[q.id]?.textResponse,
    }));

    try {
      await submitQuizAttempt(attemptId, responses);
      setSubmitted(true);
      router.push(`/list/courses/${courseId}/quiz/${quizId}/results`);
    } catch {
      setIsSubmitting(false);
    }
  }, [
    isSubmitting,
    submitted,
    questions,
    answers,
    attemptId,
    courseId,
    quizId,
    router,
  ]);

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;

  if (submitted) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold">Quiz Submitted!</h2>
        <p className="text-gray-500 mt-2">Redirecting to results...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {answeredCount} of {questions.length} answered
        </div>
        {timeLimit && (
          <QuizTimer timeLimitMinutes={timeLimit} onExpire={handleSubmit} />
        )}
      </div>

      {/* QUESTION INDICATORS */}
      <div className="flex flex-wrap gap-2">
        {questions.map((q, i) => (
          <button
            key={q.id}
            onClick={() => setCurrentIndex(i)}
            className={`w-8 h-8 rounded-full text-xs font-medium flex items-center justify-center border transition-colors ${
              i === currentIndex
                ? "bg-blue-500 text-white border-blue-500"
                : answers[q.id]
                ? "bg-green-100 text-green-700 border-green-300"
                : "bg-gray-100 text-gray-500 border-gray-200"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* QUESTION */}
      {currentQuestion && (
        <QuizQuestion
          question={currentQuestion}
          questionNumber={currentIndex + 1}
          totalQuestions={questions.length}
          currentAnswer={answers[currentQuestion.id]}
          onChange={(answer) =>
            handleAnswerChange(currentQuestion.id, answer)
          }
        />
      )}

      {/* NAVIGATION */}
      <div className="flex items-center justify-between mt-4">
        <button
          onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
          className="px-4 py-2 rounded-md border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Previous
        </button>

        {currentIndex < questions.length - 1 ? (
          <button
            onClick={() =>
              setCurrentIndex((prev) =>
                Math.min(questions.length - 1, prev + 1)
              )
            }
            className="px-4 py-2 rounded-md bg-blue-500 text-white text-sm hover:bg-blue-600"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 rounded-md bg-green-500 text-white text-sm hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting..." : "Submit Quiz"}
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizTakingClient;
