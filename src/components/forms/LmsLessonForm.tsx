"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { RichTextEditorDynamic } from "@/components/editor";
import { lmsLessonSchema, LmsLessonSchema } from "@/lib/formValidationSchemas";
import { createLmsLesson, updateLmsLesson } from "@/lib/actions";
import { Dispatch, SetStateAction, useActionState, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

const LmsLessonForm = ({
  type,
  data,
  setOpen,
  relatedData,
}: {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: any;
}) => {
  const t = useTranslations("forms");
  const tv = useTranslations("forms.validation");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LmsLessonSchema>({
    resolver: zodResolver(lmsLessonSchema),
  });

  const [state, formAction] = useActionState(
    type === "create" ? createLmsLesson : updateLmsLesson,
    {
      success: false,
      error: false,
    }
  );

  const onSubmit = handleSubmit((data) => {
    formAction(data);
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(type === "create" ? t("messages.created", { entity: "Lesson" }) : t("messages.updated", { entity: "Lesson" }));
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  const { modules } = relatedData;

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? t("lmsLessons.createTitle") : t("lmsLessons.updateTitle")}
      </h1>

      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label={t("labels.title")}
          name="title"
          defaultValue={data?.title}
          register={register}
          error={errors?.title}
        />
        <InputField
          label={t("labels.order")}
          name="order"
          type="number"
          defaultValue={data?.order}
          register={register}
          error={errors?.order}
        />
        <InputField
          label={t("labels.estimatedMinutes")}
          name="estimatedMinutes"
          type="number"
          defaultValue={data?.estimatedMinutes}
          register={register}
          error={errors?.estimatedMinutes}
        />
        {data && (
          <InputField
            label={t("labels.id")}
            name="id"
            defaultValue={data?.id}
            register={register}
            error={errors?.id}
            hidden
          />
        )}
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">{t("labels.contentType")}</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("contentType")}
            defaultValue={data?.contentType || "TEXT"}
          >
            <option value="TEXT">{t("lmsLessons.text")}</option>
            <option value="VIDEO">{t("lmsLessons.video")}</option>
            <option value="LINK">{t("lmsLessons.link")}</option>
            <option value="MIXED">{t("lmsLessons.mixed")}</option>
          </select>
          {errors.contentType?.message && (
            <p className="text-xs text-red-400">
              {tv(errors.contentType.message.toString())}
            </p>
          )}
        </div>
        <InputField
          label={t("labels.externalUrl")}
          name="externalUrl"
          defaultValue={data?.externalUrl}
          register={register}
          error={errors?.externalUrl}
        />
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">{t("labels.module")}</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("moduleId")}
            defaultValue={data?.moduleId}
          >
            {modules.map(
              (mod: { id: number; title: string; course: { title: string } }) => (
                <option value={mod.id} key={mod.id}>
                  {mod.course.title} - {mod.title}
                </option>
              )
            )}
          </select>
          {errors.moduleId?.message && (
            <p className="text-xs text-red-400">
              {tv(errors.moduleId.message.toString())}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 w-full">
          <input
            type="checkbox"
            id="flagForReview"
            className="w-4 h-4"
            {...register("flagForReview")}
            defaultChecked={data?.flagForReview ?? false}
          />
          <label htmlFor="flagForReview" className="text-sm text-gray-600">
            {t("common.flagForReview")}
          </label>
        </div>
        <input type="hidden" {...register("content")} />
        <div className="flex flex-col gap-2 w-full">
          <RichTextEditorDynamic
            label={t("labels.content")}
            variant="full"
            initialContent={data?.content}
            onChange={(json) =>
              setValue("content", json, { shouldValidate: true })
            }
            error={
              errors.content?.message
                ? tv(errors.content.message.toString())
                : undefined
            }
          />
        </div>
      </div>
      {state.error && (
        <span className="text-red-500">{t("common.somethingWentWrong")}</span>
      )}
      <button className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? t("common.create") : t("common.update")}
      </button>
    </form>
  );
};

export default LmsLessonForm;
