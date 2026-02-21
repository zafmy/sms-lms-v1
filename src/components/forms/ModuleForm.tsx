"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { moduleSchema, ModuleSchema } from "@/lib/formValidationSchemas";
import { createModule, updateModule } from "@/lib/actions";
import { Dispatch, SetStateAction, useActionState, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const ModuleForm = ({
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
  } = useForm<ModuleSchema>({
    resolver: zodResolver(moduleSchema),
  });

  const [state, formAction] = useActionState(
    type === "create" ? createModule : updateModule,
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
      toast(`Module has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  const { courses } = relatedData;

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new module" : "Update the module"}
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
          <label className="text-xs text-gray-500">Description</label>
          <textarea
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("description")}
            defaultValue={data?.description}
            rows={3}
          />
          {errors.description?.message && (
            <p className="text-xs text-red-400">
              {errors.description.message.toString()}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Locked</label>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              className="w-4 h-4"
              {...register("isLocked")}
              defaultChecked={data?.isLocked}
            />
            <span className="text-sm text-gray-500">Lock this module</span>
          </div>
          {errors.isLocked?.message && (
            <p className="text-xs text-red-400">
              {errors.isLocked.message.toString()}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Course</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("courseId")}
            defaultValue={data?.courseId}
          >
            {courses.map(
              (course: { id: number; title: string }) => (
                <option value={course.id} key={course.id}>
                  {course.title}
                </option>
              )
            )}
          </select>
          {errors.courseId?.message && (
            <p className="text-xs text-red-400">
              {errors.courseId.message.toString()}
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

export default ModuleForm;
