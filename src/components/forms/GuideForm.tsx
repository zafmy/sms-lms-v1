"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { guideSchema, GuideSchema } from "@/lib/formValidationSchemas";
import { createGuide, updateGuide } from "@/lib/guideActions";
import { Dispatch, SetStateAction, useActionState, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

const ROLES = ["admin", "teacher", "student", "parent"] as const;

const GuideForm = ({
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

  // For update mode, extract translations by locale
  const enTranslation = data?.translations?.find(
    (tr: any) => tr.locale === "en"
  );
  const msTranslation = data?.translations?.find(
    (tr: any) => tr.locale === "ms"
  );

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<GuideSchema>({
    resolver: zodResolver(guideSchema),
    defaultValues: {
      ...(data?.id && { id: data.id }),
      slug: data?.slug || "",
      categoryId: data?.categoryId || "",
      roleAccess: data?.roleAccess || [],
      isPublished: data?.isPublished || false,
      order: data?.order || 0,
      tourSteps: data?.tourSteps ? JSON.stringify(data.tourSteps, null, 2) : "",
      translations: {
        en: {
          title: enTranslation?.title || "",
          excerpt: enTranslation?.excerpt || "",
          content: enTranslation?.content || "",
        },
        ms: {
          title: msTranslation?.title || "",
          excerpt: msTranslation?.excerpt || "",
          content: msTranslation?.content || "",
        },
      },
    },
  });

  const [state, formAction] = useActionState(
    type === "create" ? createGuide : updateGuide,
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
          ? t("messages.created", { entity: "Guide" })
          : t("messages.updated", { entity: "Guide" })
      );
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen, t]);

  // Local state for active translation tab
  const [activeLocale, setActiveLocale] = useState<"en" | "ms">("en");

  // Handle roleAccess checkboxes
  const [selectedRoles, setSelectedRoles] = useState<string[]>(
    data?.roleAccess || []
  );

  const handleRoleToggle = (role: string) => {
    const updated = selectedRoles.includes(role)
      ? selectedRoles.filter((r) => r !== role)
      : [...selectedRoles, role];
    setSelectedRoles(updated);
    setValue("roleAccess", updated as GuideSchema["roleAccess"], {
      shouldValidate: true,
    });
  };

  const categories = relatedData?.categories || [];

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create"
          ? t("guides.createTitle")
          : t("guides.updateTitle")}
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

        {/* Category */}
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">
            {t("labels.category")}
          </label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("categoryId")}
            defaultValue={data?.categoryId}
          >
            <option value="">{t("common.selectCategory")}</option>
            {categories.map(
              (cat: { id: string; nameEn: string; nameMs: string }) => (
                <option value={cat.id} key={cat.id}>
                  {cat.nameEn}
                </option>
              )
            )}
          </select>
          {errors.categoryId?.message && (
            <p className="text-xs text-red-400">
              {tv(errors.categoryId.message.toString())}
            </p>
          )}
        </div>

        {/* Order */}
        <InputField
          label={t("labels.order")}
          name="order"
          defaultValue={data?.order?.toString()}
          register={register}
          error={errors?.order}
          type="number"
        />

        {/* Role Access Checkboxes */}
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">
            {t("guides.roleAccess")}
          </label>
          <div className="flex flex-wrap gap-3">
            {ROLES.map((role) => (
              <label
                key={role}
                className="flex items-center gap-1 text-sm cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedRoles.includes(role)}
                  onChange={() => handleRoleToggle(role)}
                  className="w-4 h-4"
                />
                <span className="capitalize">{role}</span>
              </label>
            ))}
          </div>
          {errors.roleAccess?.message && (
            <p className="text-xs text-red-400">
              {tv(errors.roleAccess.message.toString())}
            </p>
          )}
        </div>

        {/* Published Checkbox */}
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">
            {t("guides.isPublished")}
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              {...register("isPublished")}
              defaultChecked={data?.isPublished}
              className="w-4 h-4"
            />
            <span>{t("guides.published")}</span>
          </label>
        </div>
      </div>

      {/* Translation Tabs */}
      <div className="flex flex-col gap-4">
        <div className="flex gap-2 border-b">
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium ${
              activeLocale === "en"
                ? "border-b-2 border-blue-400 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveLocale("en")}
          >
            {t("guides.english")}
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium ${
              activeLocale === "ms"
                ? "border-b-2 border-blue-400 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveLocale("ms")}
          >
            {t("guides.malay")}
          </button>
        </div>

        {/* English translations */}
        <div className={activeLocale === "en" ? "flex flex-col gap-4" : "hidden"}>
          <div className="flex flex-col gap-2 w-full">
            <label className="text-xs text-gray-500">
              {t("guides.titleEn")}
            </label>
            <input
              type="text"
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
              {...register("translations.en.title")}
            />
            {errors.translations?.en?.title?.message && (
              <p className="text-xs text-red-400">
                {tv(errors.translations.en.title.message.toString())}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2 w-full">
            <label className="text-xs text-gray-500">
              {t("guides.excerptEn")}
            </label>
            <textarea
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
              {...register("translations.en.excerpt")}
              rows={2}
            />
            {errors.translations?.en?.excerpt?.message && (
              <p className="text-xs text-red-400">
                {tv(errors.translations.en.excerpt.message.toString())}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2 w-full">
            <label className="text-xs text-gray-500">
              {t("guides.contentEn")}
            </label>
            <textarea
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
              {...register("translations.en.content")}
              rows={6}
            />
            {errors.translations?.en?.content?.message && (
              <p className="text-xs text-red-400">
                {tv(errors.translations.en.content.message.toString())}
              </p>
            )}
          </div>
        </div>

        {/* Malay translations */}
        <div className={activeLocale === "ms" ? "flex flex-col gap-4" : "hidden"}>
          <div className="flex flex-col gap-2 w-full">
            <label className="text-xs text-gray-500">
              {t("guides.titleMs")}
            </label>
            <input
              type="text"
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
              {...register("translations.ms.title")}
            />
            {errors.translations?.ms?.title?.message && (
              <p className="text-xs text-red-400">
                {tv(errors.translations.ms.title.message.toString())}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2 w-full">
            <label className="text-xs text-gray-500">
              {t("guides.excerptMs")}
            </label>
            <textarea
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
              {...register("translations.ms.excerpt")}
              rows={2}
            />
            {errors.translations?.ms?.excerpt?.message && (
              <p className="text-xs text-red-400">
                {tv(errors.translations.ms.excerpt.message.toString())}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2 w-full">
            <label className="text-xs text-gray-500">
              {t("guides.contentMs")}
            </label>
            <textarea
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
              {...register("translations.ms.content")}
              rows={6}
            />
            {errors.translations?.ms?.content?.message && (
              <p className="text-xs text-red-400">
                {tv(errors.translations.ms.content.message.toString())}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tour Steps (optional) */}
      <div className="flex flex-col gap-2 w-full">
        <label className="text-xs text-gray-500">
          {t("guides.tourSteps")}
        </label>
        <textarea
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full font-mono"
          {...register("tourSteps")}
          rows={3}
          placeholder='[{"target": "#element", "content": "..."}]'
        />
        {errors.tourSteps?.message && (
          <p className="text-xs text-red-400">
            {tv(errors.tourSteps.message.toString())}
          </p>
        )}
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

export default GuideForm;
