"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { RichTextEditorDynamic } from "@/components/editor";
import { replySchema, type ReplyFormData } from "@/lib/forumValidationSchemas";
import { createReply } from "@/lib/forumActions";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("lms.forums");
  const [editorKey, setEditorKey] = useState(0);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
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
      setEditorKey((prev) => prev + 1);
      router.refresh();
      onSuccess?.();
    }
  }, [state, router, reset, onSuccess]);

  if (isLocked) {
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-md p-3 text-sm text-orange-700">
        {t("threadLocked")}
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={onSubmit}>
      <input type="hidden" {...register("threadId")} value={threadId} />
      {parentId && (
        <input type="hidden" {...register("parentId")} value={parentId} />
      )}

      <input type="hidden" {...register("content")} />
      <RichTextEditorDynamic
        key={editorKey}
        variant="compact"
        placeholder={parentId ? t("writeReply") : t("writeYourReply")}
        onChange={(json) =>
          setValue("content", json, { shouldValidate: true })
        }
        error={errors.content?.message}
      />

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
                {t("postAnonymously")}
              </label>
            </>
          )}
        </div>

        <button
          type="submit"
          className="bg-lamaSky text-white py-1.5 px-4 rounded-md text-sm hover:opacity-90"
        >
          {t("reply")}
        </button>
      </div>

      {state.error && (
        <p className="text-sm text-red-500">
          {state.message || t("failedToPostReply")}
        </p>
      )}
    </form>
  );
};

export default ForumReplyForm;
