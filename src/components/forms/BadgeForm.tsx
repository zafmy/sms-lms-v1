"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { badgeSchema, BadgeSchema } from "@/lib/formValidationSchemas";
import { createBadge, updateBadge } from "@/lib/gamificationActions";
import {
  Dispatch,
  SetStateAction,
  useActionState,
  useEffect,
} from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

const BadgeForm = ({
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
  } = useForm<BadgeSchema>({
    resolver: zodResolver(badgeSchema),
  });

  const [state, formAction] = useActionState(
    type === "create" ? createBadge : updateBadge,
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
      toast(type === "create" ? t("messages.created", { entity: "Badge" }) : t("messages.updated", { entity: "Badge" }));
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? t("badges.createTitle") : t("badges.updateTitle")}
      </h1>

      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label={t("labels.badgeName")}
          name="name"
          defaultValue={data?.name}
          register={register}
          error={errors?.name}
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
          label={t("labels.iconUrl")}
          name="iconUrl"
          defaultValue={data?.iconUrl}
          register={register}
          error={errors?.iconUrl}
        />
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">{t("labels.category")}</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("category")}
            defaultValue={data?.category}
          >
            <option value="">{t("common.selectCategory")}</option>
            <option value="streak">{t("badges.streak")}</option>
            <option value="quiz">{t("badges.quiz")}</option>
            <option value="course">{t("badges.course")}</option>
            <option value="xp">{t("badges.xp")}</option>
            <option value="special">{t("badges.special")}</option>
          </select>
          {errors.category?.message && (
            <p className="text-xs text-red-400">
              {tv(errors.category.message.toString())}
            </p>
          )}
        </div>
        <InputField
          label={t("labels.threshold")}
          name="threshold"
          defaultValue={data?.threshold}
          register={register}
          error={errors?.threshold}
          type="number"
        />
        <InputField
          label={t("labels.xpReward")}
          name="xpReward"
          defaultValue={data?.xpReward}
          register={register}
          error={errors?.xpReward}
          type="number"
        />
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

export default BadgeForm;
