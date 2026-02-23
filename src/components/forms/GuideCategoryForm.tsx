"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import {
  guideCategorySchema,
  GuideCategorySchema,
} from "@/lib/formValidationSchemas";
import { createCategory, updateCategory } from "@/lib/guideActions";
import { Dispatch, SetStateAction, useActionState, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

const GuideCategoryForm = ({
  type,
  data,
  setOpen,
}: {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: any;
}) => {
  const t = useTranslations("forms");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GuideCategorySchema>({
    resolver: zodResolver(guideCategorySchema),
  });

  const [state, formAction] = useActionState(
    type === "create" ? createCategory : updateCategory,
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
      toast(
        type === "create"
          ? t("messages.created", { entity: "Guide Category" })
          : t("messages.updated", { entity: "Guide Category" })
      );
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen, t]);

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create"
          ? t("guideCategories.createTitle")
          : t("guideCategories.updateTitle")}
      </h1>

      <div className="flex justify-between flex-wrap gap-4">
        {/* Hidden ID field for update */}
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

        {/* Slug */}
        <InputField
          label={t("guides.slug")}
          name="slug"
          defaultValue={data?.slug}
          register={register}
          error={errors?.slug}
        />

        {/* English Name */}
        <InputField
          label={t("guideCategories.nameEn")}
          name="nameEn"
          defaultValue={data?.nameEn}
          register={register}
          error={errors?.nameEn}
        />

        {/* Malay Name */}
        <InputField
          label={t("guideCategories.nameMs")}
          name="nameMs"
          defaultValue={data?.nameMs}
          register={register}
          error={errors?.nameMs}
        />

        {/* Order */}
        <InputField
          label={t("labels.order")}
          name="order"
          defaultValue={data?.order?.toString()}
          register={register}
          error={errors?.order}
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

export default GuideCategoryForm;
