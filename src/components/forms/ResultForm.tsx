"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import {
  resultSchema,
  ResultSchema,
} from "@/lib/formValidationSchemas";
import {
  createResult,
  updateResult,
} from "@/lib/actions";
import { Dispatch, SetStateAction, useActionState, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

const ResultForm = ({
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
  } = useForm<ResultSchema>({
    resolver: zodResolver(resultSchema),
  });

  // AFTER REACT 19 IT'LL BE USEACTIONSTATE

  const [state, formAction] = useActionState(
    type === "create" ? createResult : updateResult,
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
      toast(type === "create" ? t("messages.created", { entity: "Result" }) : t("messages.updated", { entity: "Result" }));
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  const { students, exams, assignments } = relatedData;

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? t("results.createTitle") : t("results.updateTitle")}
      </h1>

      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label={t("labels.score")}
          name="score"
          defaultValue={data?.score}
          register={register}
          error={errors?.score}
          type="number"
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
          <label className="text-xs text-gray-500">{t("labels.exam")}</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("examId")}
            defaultValue={data?.examId}
          >
            <option value="">{t("common.none")}</option>
            {exams.map((exam: { id: number; title: string }) => (
              <option value={exam.id} key={exam.id}>
                {exam.title}
              </option>
            ))}
          </select>
          {errors.examId?.message && (
            <p className="text-xs text-red-400">
              {tv(errors.examId.message.toString())}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">{t("labels.assignment")}</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("assignmentId")}
            defaultValue={data?.assignmentId}
          >
            <option value="">{t("common.none")}</option>
            {assignments.map((assignment: { id: number; title: string }) => (
              <option value={assignment.id} key={assignment.id}>
                {assignment.title}
              </option>
            ))}
          </select>
          {errors.assignmentId?.message && (
            <p className="text-xs text-red-400">
              {tv(errors.assignmentId.message.toString())}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">{t("labels.student")}</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("studentId")}
            defaultValue={data?.studentId}
          >
            {students.map(
              (student: { id: string; name: string; surname: string }) => (
                <option value={student.id} key={student.id}>
                  {student.name} {student.surname}
                </option>
              )
            )}
          </select>
          {errors.studentId?.message && (
            <p className="text-xs text-red-400">
              {tv(errors.studentId.message.toString())}
            </p>
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

export default ResultForm;
