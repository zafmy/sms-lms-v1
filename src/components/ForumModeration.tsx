"use client";

import {
  pinThread,
  lockThread,
  deleteThread,
} from "@/lib/forumActions";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

const ForumModeration = ({
  threadId,
  courseId,
  isPinned,
  isLocked,
}: {
  threadId: number;
  courseId: number;
  isPinned: boolean;
  isLocked: boolean;
}) => {
  const router = useRouter();
  const t = useTranslations("lms.forums");

  const [pinState, pinAction] = useActionState(pinThread, {
    success: false,
    error: false,
  });

  const [lockState, lockAction] = useActionState(lockThread, {
    success: false,
    error: false,
  });

  const [deleteState, deleteAction] = useActionState(deleteThread, {
    success: false,
    error: false,
  });

  useEffect(() => {
    if (pinState.success || lockState.success) {
      router.refresh();
    }
  }, [pinState, lockState, router]);

  useEffect(() => {
    if (deleteState.success) {
      router.push(`/list/courses/${courseId}/forum`);
    }
  }, [deleteState, courseId, router]);

  const handlePin = () => {
    pinAction({ id: threadId, isPinned: !isPinned });
  };

  const handleLock = () => {
    lockAction({ id: threadId, isLocked: !isLocked });
  };

  const handleDelete = () => {
    if (window.confirm(t("deleteThreadConfirm"))) {
      deleteAction({ id: threadId });
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={handlePin}
        className={`px-3 py-1 text-sm rounded-md border ${
          isPinned
            ? "bg-yellow-50 border-yellow-300 text-yellow-700"
            : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
        }`}
      >
        {isPinned ? t("unpin") : t("pin")}
      </button>
      <button
        onClick={handleLock}
        className={`px-3 py-1 text-sm rounded-md border ${
          isLocked
            ? "bg-orange-50 border-orange-300 text-orange-700"
            : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
        }`}
      >
        {isLocked ? t("unlock") : t("lock")}
      </button>
      <button
        onClick={handleDelete}
        className="px-3 py-1 text-sm rounded-md border border-red-300 text-red-600 hover:bg-red-50"
      >
        {t("delete")}
      </button>
      {pinState.error && (
        <span className="text-xs text-red-500">{pinState.message}</span>
      )}
      {lockState.error && (
        <span className="text-xs text-red-500">{lockState.message}</span>
      )}
      {deleteState.error && (
        <span className="text-xs text-red-500">{deleteState.message}</span>
      )}
    </div>
  );
};

export default ForumModeration;
