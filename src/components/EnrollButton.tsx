"use client";

import { selfEnrollStudent, unenrollSelf } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useTransition } from "react";
import { toast } from "react-toastify";

type EnrollButtonProps = {
  courseId: number;
  enrollmentId: number | null;
  enrollmentStatus: "ACTIVE" | "DROPPED" | "COMPLETED" | null;
  isFull: boolean;
  courseName: string;
};

const EnrollButton = ({
  courseId,
  enrollmentId,
  enrollmentStatus,
  isFull,
  courseName,
}: EnrollButtonProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [enrollState, enrollAction] = useActionState(selfEnrollStudent, {
    success: false,
    error: false,
  });

  const [dropState, dropAction] = useActionState(unenrollSelf, {
    success: false,
    error: false,
  });

  useEffect(() => {
    if (enrollState.success) {
      toast(`Successfully enrolled in ${courseName}!`);
      router.refresh();
    } else if (enrollState.error) {
      toast(enrollState.message || "Failed to enroll. Please try again.");
    }
  }, [enrollState, courseName, router]);

  useEffect(() => {
    if (dropState.success) {
      toast(`Successfully dropped ${courseName}.`);
      router.refresh();
    } else if (dropState.error) {
      toast(dropState.message || "Failed to drop course. Please try again.");
    }
  }, [dropState, courseName, router]);

  const handleEnroll = () => {
    startTransition(() => {
      enrollAction({ courseId });
    });
  };

  const handleDrop = () => {
    if (!window.confirm(`Are you sure you want to drop "${courseName}"?`)) {
      return;
    }
    startTransition(() => {
      dropAction({ enrollmentId: enrollmentId! });
    });
  };

  // Completed enrollment
  if (enrollmentStatus === "COMPLETED") {
    return (
      <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-md text-sm">
        Completed
      </span>
    );
  }

  // Active enrollment - show drop button
  if (enrollmentStatus === "ACTIVE") {
    return (
      <button
        onClick={handleDrop}
        disabled={isPending}
        className={`bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm ${
          isPending ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {isPending ? "Dropping..." : "Drop Course"}
      </button>
    );
  }

  // Course is full and not enrolled
  if (isFull) {
    return (
      <span className="bg-gray-200 text-gray-500 px-4 py-2 rounded-md text-sm cursor-not-allowed">
        Full
      </span>
    );
  }

  // Not enrolled or DROPPED and not full - show enroll button
  return (
    <button
      onClick={handleEnroll}
      disabled={isPending}
      className={`bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm ${
        isPending ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      {isPending ? "Enrolling..." : "Enroll"}
    </button>
  );
};

export default EnrollButton;
