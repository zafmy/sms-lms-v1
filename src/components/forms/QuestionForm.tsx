"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import InputField from "../InputField";
import { questionSchema, QuestionSchema } from "@/lib/formValidationSchemas";
import { createQuestion, updateQuestion } from "@/lib/actions";
import { Dispatch, SetStateAction, useActionState, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

const QuestionForm = ({
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

  const defaultOptions = data?.options
    ? data.options.map((opt: any) => ({
        text: opt.text,
        isCorrect: opt.isCorrect,
        order: opt.order,
      }))
    : [
        { text: "", isCorrect: false, order: 1 },
        { text: "", isCorrect: false, order: 2 },
      ];

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<QuestionSchema>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      options: defaultOptions,
      type: data?.type || "MULTIPLE_CHOICE",
      points: data?.points || 1,
      order: data?.order || 1,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "options",
  });

  const questionType = watch("type");

  // When type changes, reset options accordingly
  useEffect(() => {
    if (questionType === "TRUE_FALSE") {
      setValue("options", [
        { text: t("common.true"), isCorrect: true, order: 1 },
        { text: t("common.false"), isCorrect: false, order: 2 },
      ]);
    } else if (questionType === "FILL_IN_BLANK") {
      setValue("options", [
        { text: "", isCorrect: true, order: 1 },
        { text: t("common.blank"), isCorrect: false, order: 2 },
      ]);
    }
  }, [questionType, setValue]);

  const [state, formAction] = useActionState(
    type === "create" ? createQuestion : updateQuestion,
    {
      success: false,
      error: false,
    }
  );

  const onSubmit = handleSubmit((formData) => {
    formAction(formData);
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(type === "create" ? t("messages.created", { entity: "Question" }) : t("messages.updated", { entity: "Question" }));
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  const { quizzes } = relatedData;

  const handleCorrectChange = (index: number) => {
    if (questionType === "MULTIPLE_CHOICE" || questionType === "TRUE_FALSE") {
      // Only one correct answer allowed
      fields.forEach((_, i) => {
        setValue(`options.${i}.isCorrect`, i === index);
      });
    }
  };

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? t("questions.createTitle") : t("questions.updateTitle")}
      </h1>

      <div className="flex justify-between flex-wrap gap-4">
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
        <div className="flex flex-col gap-2 w-full">
          <label className="text-xs text-gray-500">{t("labels.questionText")}</label>
          <textarea
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("text")}
            defaultValue={data?.text}
            rows={3}
          />
          {errors.text?.message && (
            <p className="text-xs text-red-400">
              {tv(errors.text.message.toString())}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">{t("labels.type")}</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("type")}
            defaultValue={data?.type || "MULTIPLE_CHOICE"}
          >
            <option value="MULTIPLE_CHOICE">{t("questions.multipleChoice")}</option>
            <option value="TRUE_FALSE">{t("questions.trueFalse")}</option>
            <option value="FILL_IN_BLANK">{t("questions.fillInBlank")}</option>
          </select>
          {errors.type?.message && (
            <p className="text-xs text-red-400">
              {tv(errors.type.message.toString())}
            </p>
          )}
        </div>
        <InputField
          label={t("labels.points")}
          name="points"
          type="number"
          defaultValue={data?.points || "1"}
          register={register}
          error={errors?.points}
        />
        <InputField
          label={t("labels.order")}
          name="order"
          type="number"
          defaultValue={data?.order || "1"}
          register={register}
          error={errors?.order}
        />
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">{t("labels.quiz")}</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("quizId")}
            defaultValue={data?.quizId}
          >
            {quizzes.map((quiz: { id: number; title: string }) => (
              <option value={quiz.id} key={quiz.id}>
                {quiz.title}
              </option>
            ))}
          </select>
          {errors.quizId?.message && (
            <p className="text-xs text-red-400">
              {tv(errors.quizId.message.toString())}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 w-full">
          <label className="text-xs text-gray-500">
            {t("labels.explanation")}
          </label>
          <textarea
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("explanation")}
            defaultValue={data?.explanation}
            rows={2}
          />
          {errors.explanation?.message && (
            <p className="text-xs text-red-400">
              {tv(errors.explanation.message.toString())}
            </p>
          )}
        </div>

        {/* ANSWER OPTIONS */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-gray-500 font-semibold">
              {t("common.answerOptions")}
            </label>
            {questionType === "MULTIPLE_CHOICE" && fields.length < 6 && (
              <button
                type="button"
                onClick={() =>
                  append({
                    text: "",
                    isCorrect: false,
                    order: fields.length + 1,
                  })
                }
                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
              >
                {t("common.addOption")}
              </button>
            )}
          </div>
          {errors.options?.message && (
            <p className="text-xs text-red-400 mb-2">
              {tv(errors.options.message.toString())}
            </p>
          )}

          {questionType === "FILL_IN_BLANK" ? (
            <div className="flex flex-col gap-2">
              <label className="text-xs text-gray-500">
                {t("common.correctAnswer")}
              </label>
              <input
                type="text"
                className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                {...register("options.0.text")}
              />
              <input type="hidden" {...register("options.0.isCorrect")} value="true" />
              <input type="hidden" {...register("options.0.order")} value="1" />
              <input type="hidden" {...register("options.1.text")} value={t("common.blank")} />
              <input type="hidden" {...register("options.1.isCorrect")} value="" />
              <input type="hidden" {...register("options.1.order")} value="2" />
              {errors.options?.[0]?.text?.message && (
                <p className="text-xs text-red-400">
                  {tv(errors.options[0].text.message.toString())}
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex items-center gap-2 border border-gray-200 rounded-md p-2"
                >
                  <input
                    type="radio"
                    name="correctOption"
                    checked={watch(`options.${index}.isCorrect`)}
                    onChange={() => handleCorrectChange(index)}
                    className="w-4 h-4"
                    title={t("common.markCorrect")}
                  />
                  <input type="hidden" {...register(`options.${index}.isCorrect`)} />
                  <input type="hidden" {...register(`options.${index}.order`)} value={index + 1} />
                  <input
                    type="text"
                    className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm flex-1"
                    {...register(`options.${index}.text`)}
                    placeholder={t("common.optionNum", { number: index + 1 })}
                    disabled={questionType === "TRUE_FALSE"}
                  />
                  {questionType === "MULTIPLE_CHOICE" && fields.length > 2 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="text-red-500 text-sm px-2"
                    >
                      X
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
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

export default QuestionForm;
