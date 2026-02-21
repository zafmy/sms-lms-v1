"use client";

import { useEffect, useState } from "react";

type QuizTimerProps = {
  timeLimitMinutes: number;
  onExpire: () => void;
};

const QuizTimer = ({ timeLimitMinutes, onExpire }: QuizTimerProps) => {
  const [secondsLeft, setSecondsLeft] = useState(timeLimitMinutes * 60);

  useEffect(() => {
    if (secondsLeft <= 0) {
      onExpire();
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft, onExpire]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const isWarning = secondsLeft < 60;

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-mono text-sm ${
        isWarning
          ? "bg-red-100 text-red-700 font-bold"
          : "bg-gray-100 text-gray-700"
      }`}
    >
      <span>
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </span>
    </div>
  );
};

export default QuizTimer;
