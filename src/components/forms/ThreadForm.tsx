"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  threadSchema,
  type ThreadFormData,
} from "@/lib/forumValidationSchemas";
import { createThread } from "@/lib/forumActions";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

type ThreadFormProps = {
  courseId: number;
  role: string;
  onSuccess?: () => void;
};

const ThreadForm = ({ courseId, role, onSuccess }: ThreadFormProps) => {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ThreadFormData>({
    resolver: zodResolver(threadSchema),
    defaultValues: {
      title: "",
      content: "",
      courseId,
      isAnonymous: false,
    },
  });

  const [state, formAction] = useActionState(createThread, {
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

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <h2 className="text-lg font-semibold">New Thread</h2>

      <input type="hidden" {...register("courseId")} value={courseId} />

      <div className="flex flex-col gap-2">
        <label className="text-xs text-gray-500">Title</label>
        <input
          type="text"
          {...register("title")}
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
          placeholder="Thread title..."
        />
        {errors.title && (
          <p className="text-xs text-red-400">{errors.title.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs text-gray-500">Content</label>
        <textarea
          {...register("content")}
          rows={5}
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full resize-y"
          placeholder="Write your discussion content..."
        />
        {errors.content && (
          <p className="text-xs text-red-400">{errors.content.message}</p>
        )}
      </div>

      {role === "student" && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            {...register("isAnonymous")}
            id="thread-anonymous"
            className="w-4 h-4"
          />
          <label htmlFor="thread-anonymous" className="text-sm text-gray-600">
            Post anonymously
          </label>
        </div>
      )}

      {state.error && (
        <p className="text-sm text-red-500">
          {state.message || "Something went wrong."}
        </p>
      )}

      <button
        type="submit"
        className="bg-lamaSky text-white py-2 px-4 rounded-md text-sm hover:opacity-90 self-end"
      >
        Create Thread
      </button>
    </form>
  );
};

export default ThreadForm;
