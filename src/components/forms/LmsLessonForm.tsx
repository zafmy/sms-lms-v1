"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { lmsLessonSchema, LmsLessonSchema } from "@/lib/formValidationSchemas";
import { createLmsLesson, updateLmsLesson } from "@/lib/actions";
import { Dispatch, SetStateAction, useActionState, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

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
  const {
    register,
    handleSubmit,
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
      toast(`Lesson has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  const { modules } = relatedData;

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new lesson" : "Update the lesson"}
      </h1>

      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Title"
          name="title"
          defaultValue={data?.title}
          register={register}
          error={errors?.title}
        />
        <InputField
          label="Order"
          name="order"
          type="number"
          defaultValue={data?.order}
          register={register}
          error={errors?.order}
        />
        <InputField
          label="Estimated Minutes"
          name="estimatedMinutes"
          type="number"
          defaultValue={data?.estimatedMinutes}
          register={register}
          error={errors?.estimatedMinutes}
        />
        {data && (
          <InputField
            label="Id"
            name="id"
            defaultValue={data?.id}
            register={register}
            error={errors?.id}
            hidden
          />
        )}
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Content Type</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("contentType")}
            defaultValue={data?.contentType || "TEXT"}
          >
            <option value="TEXT">Text</option>
            <option value="VIDEO">Video</option>
            <option value="LINK">Link</option>
            <option value="MIXED">Mixed</option>
          </select>
          {errors.contentType?.message && (
            <p className="text-xs text-red-400">
              {errors.contentType.message.toString()}
            </p>
          )}
        </div>
        <InputField
          label="External URL"
          name="externalUrl"
          defaultValue={data?.externalUrl}
          register={register}
          error={errors?.externalUrl}
        />
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Module</label>
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
              {errors.moduleId.message.toString()}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 w-full">
          <label className="text-xs text-gray-500">Content</label>
          <textarea
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("content")}
            defaultValue={data?.content}
            rows={6}
          />
          {errors.content?.message && (
            <p className="text-xs text-red-400">
              {errors.content.message.toString()}
            </p>
          )}
        </div>
      </div>
      {state.error && (
        <span className="text-red-500">Something went wrong!</span>
      )}
      <button className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default LmsLessonForm;
