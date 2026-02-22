"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { replySchema, type ReplyFormData } from "@/lib/forumValidationSchemas";
import { createReply } from "@/lib/forumActions";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

const ForumReplyForm = ({
  threadId,
  parentId,
  isLocked,
  role,
  onSuccess,
}: {
  threadId: number;
  parentId?: number;
  isLocked: boolean;
  role: string;
  onSuccess?: () => void;
}) => {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReplyFormData>({
    resolver: zodResolver(replySchema),
    defaultValues: {
      content: "",
      threadId,
      parentId: parentId ?? undefined,
      isAnonymous: false,
    },
  });

  const [state, formAction] = useActionState(createReply, {
    success: false,
    error: false,
  });

  const onSubmit = handleSubmit((data) => {
    formAction(data);
  });

  useEffect(() => {
    if (state.success) {
      reset();
      router.refresh();
      onSuccess?.();
    }
  }, [state, router, reset, onSuccess]);

  if (isLocked) {
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-md p-3 text-sm text-orange-700">
        This thread is locked. No new replies can be posted.
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={onSubmit}>
      <input type="hidden" {...register("threadId")} value={threadId} />
      {parentId && (
        <input type="hidden" {...register("parentId")} value={parentId} />
      )}

      <div className="flex flex-col gap-2">
        <textarea
          {...register("content")}
          rows={3}
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full resize-y"
          placeholder={parentId ? "Write a reply..." : "Write your reply..."}
        />
        {errors.content && (
          <p className="text-xs text-red-400">{errors.content.message}</p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {role === "student" && (
            <>
              <input
                type="checkbox"
                {...register("isAnonymous")}
                id={`reply-anonymous-${parentId ?? "root"}`}
                className="w-4 h-4"
              />
              <label
                htmlFor={`reply-anonymous-${parentId ?? "root"}`}
                className="text-sm text-gray-600"
              >
                Post anonymously
              </label>
            </>
          )}
        </div>

        <button
          type="submit"
          className="bg-lamaSky text-white py-1.5 px-4 rounded-md text-sm hover:opacity-90"
        >
          Reply
        </button>
      </div>

      {state.error && (
        <p className="text-sm text-red-500">
          {state.message || "Failed to post reply."}
        </p>
      )}
    </form>
  );
};

export default ForumReplyForm;
