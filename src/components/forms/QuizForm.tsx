"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { quizSchema, QuizSchema } from "@/lib/formValidationSchemas";
import { createQuiz, updateQuiz } from "@/lib/actions";
import { Dispatch, SetStateAction, useActionState, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

const QuizForm = ({
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
    formState: { errors },
  } = useForm<QuizSchema>({
    resolver: zodResolver(quizSchema),
  });

  const [state, formAction] = useActionState(
    type === "create" ? createQuiz : updateQuiz,
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
      toast(type === "create" ? t("messages.created", { entity: "Quiz" }) : t("messages.updated", { entity: "Quiz" }));
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  const { lessons } = relatedData;

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? t("quizzes.createTitle") : t("quizzes.updateTitle")}
      </h1>

      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label={t("labels.title")}
          name="title"
          defaultValue={data?.title}
          register={register}
          error={errors?.title}
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
          <label className="text-xs text-gray-500">{t("labels.description")}</label>
          <textarea
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("description")}
            defaultValue={data?.description}
            rows={3}
          />
          {errors.description?.message && (
            <p className="text-xs text-red-400">
              {tv(errors.description.message.toString())}
            </p>
          )}
        </div>
        <InputField
          label={t("labels.timeLimit")}
          name="timeLimit"
          type="number"
          defaultValue={data?.timeLimit}
          register={register}
          error={errors?.timeLimit}
        />
        <InputField
          label={t("labels.maxAttempts")}
          name="maxAttempts"
          type="number"
          defaultValue={data?.maxAttempts || "1"}
          register={register}
          error={errors?.maxAttempts}
        />
        <InputField
          label={t("labels.passScore")}
          name="passScore"
          type="number"
          defaultValue={data?.passScore || "70"}
          register={register}
          error={errors?.passScore}
        />
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">{t("labels.scoringPolicy")}</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("scoringPolicy")}
            defaultValue={data?.scoringPolicy || "BEST"}
          >
            <option value="BEST">{t("quizzes.bestScore")}</option>
            <option value="LATEST">{t("quizzes.latestScore")}</option>
            <option value="AVERAGE">{t("quizzes.averageScore")}</option>
          </select>
          {errors.scoringPolicy?.message && (
            <p className="text-xs text-red-400">
              {tv(errors.scoringPolicy.message.toString())}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">{t("labels.lesson")}</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("lessonId")}
            defaultValue={data?.lessonId}
          >
            {lessons.map(
              (lesson: {
                id: number;
                title: string;
                module: { course: { title: string } };
              }) => (
                <option value={lesson.id} key={lesson.id}>
                  {lesson.module.course.title} - {lesson.title}
                </option>
              )
            )}
          </select>
          {errors.lessonId?.message && (
            <p className="text-xs text-red-400">
              {tv(errors.lessonId.message.toString())}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4 w-full md:w-1/4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              {...register("randomizeQuestions")}
              defaultChecked={data?.randomizeQuestions}
            />
            {t("common.randomizeQuestions")}
          </label>
        </div>
        <div className="flex items-center gap-4 w-full md:w-1/4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              {...register("randomizeOptions")}
              defaultChecked={data?.randomizeOptions}
            />
            {t("common.randomizeOptions")}
          </label>
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

export default QuizForm;
