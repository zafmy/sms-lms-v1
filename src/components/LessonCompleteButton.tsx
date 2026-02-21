"use client";

import { markLessonComplete } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { useState } from "react";

const LessonCompleteButton = ({
  lessonId,
  isCompleted,
}: {
  lessonId: number;
  isCompleted: boolean;
}) => {
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(isCompleted);
  const router = useRouter();

  const handleComplete = async () => {
    setLoading(true);
    const result = await markLessonComplete(lessonId);
    if (result.success) {
      setCompleted(true);
      router.refresh();
    }
    setLoading(false);
  };

  if (completed) {
    return (
      <button
        disabled
        className="bg-green-500 text-white px-4 py-2 rounded-md"
      >
        Completed
      </button>
    );
  }

  return (
    <button
      onClick={handleComplete}
      disabled={loading}
      className="bg-lamaPurple text-white px-4 py-2 rounded-md disabled:opacity-50"
    >
      {loading ? "Saving..." : "Mark as Completed"}
    </button>
  );
};

export default LessonCompleteButton;
