"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  reviewCardSchema,
  ReviewCardSchema,
} from "@/lib/formValidationSchemas";
import { createTeacherReviewCard } from "@/lib/reviewActions";
import { Dispatch, SetStateAction, useActionState, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

const ReviewCardForm = ({
  courseId,
  setOpen,
  enrolledStudents,
}: {
  courseId: number;
  setOpen: Dispatch<SetStateAction<boolean>>;
  enrolledStudents?: { id: string; name: string }[];
}) => {
  const t = useTranslations("forms");
  const tv = useTranslations("forms.validation");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReviewCardSchema>({
    resolver: zodResolver(reviewCardSchema),
    defaultValues: {
      courseId,
      cardType: "FLASHCARD",
    },
  });

  const [state, formAction] = useActionState(
    async (_prevState: { success: boolean; error: boolean }, data: ReviewCardSchema) => {
      const formData = new FormData();
      formData.append("front", data.front);
      formData.append("back", data.back);
      formData.append("cardType", data.cardType);
      formData.append("courseId", String(data.courseId));
      if (data.targetStudents) {
        formData.append("targetStudents", data.targetStudents);
      }
      const result = await createTeacherReviewCard(formData);
      return {
        success: result.success,
        error: !result.success,
      };
    },
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
      toast("Review card created successfully!");
      setOpen(false);
      router.refresh();
    }
  }, [state, router, setOpen]);

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">Create a Review Card</h1>

      <div className="flex justify-between flex-wrap gap-4">
        <input type="hidden" {...register("courseId")} value={courseId} />

        <div className="flex flex-col gap-2 w-full">
          <label className="text-xs text-gray-500">Front (Question)</label>
          <textarea
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("front")}
            rows={3}
            placeholder="Enter the question or term..."
          />
          {errors.front?.message && (
            <p className="text-xs text-red-400">
              {tv(errors.front.message.toString())}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 w-full">
          <label className="text-xs text-gray-500">Back (Answer)</label>
          <textarea
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("back")}
            rows={3}
            placeholder="Enter the answer or definition..."
          />
          {errors.back?.message && (
            <p className="text-xs text-red-400">
              {tv(errors.back.message.toString())}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Card Type</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("cardType")}
          >
            <option value="FLASHCARD">Flashcard</option>
            <option value="VOCABULARY">Vocabulary</option>
          </select>
          {errors.cardType?.message && (
            <p className="text-xs text-red-400">
              {tv(errors.cardType.message.toString())}
            </p>
          )}
        </div>

        {enrolledStudents && enrolledStudents.length > 0 && (
          <div className="flex flex-col gap-2 w-full">
            <label className="text-xs text-gray-500">
              Target Students (leave empty for all enrolled students)
            </label>
            <select
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
              multiple
              size={Math.min(enrolledStudents.length, 6)}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions).map(
                  (opt) => opt.value
                );
                const input = document.querySelector<HTMLInputElement>(
                  'input[name="targetStudents"]'
                );
                if (input) {
                  input.value =
                    selected.length > 0 ? JSON.stringify(selected) : "";
                }
              }}
            >
              {enrolledStudents.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>
            <input type="hidden" {...register("targetStudents")} />
          </div>
        )}
      </div>

      {state.error && (
        <span className="text-red-500">Something went wrong!</span>
      )}
      <button className="bg-blue-400 text-white p-2 rounded-md">Create</button>
    </form>
  );
};

export default ReviewCardForm;
