"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

type CategoryOption = {
  id: string;
  name: string;
};

const GuideCategoryFilter = ({
  categories,
  currentCategoryId,
}: {
  categories: CategoryOption[];
  currentCategoryId?: string;
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const t = useTranslations("guides");

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set("categoryId", value);
    } else {
      params.delete("categoryId");
    }

    // Reset to page 1 when changing category
    params.delete("page");

    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <select
      value={currentCategoryId || ""}
      onChange={handleChange}
      className="text-xs rounded-md ring-[1.5px] ring-gray-300 px-2 py-2 bg-transparent outline-none cursor-pointer"
    >
      <option value="">{t("allCategories")}</option>
      {categories.map((cat) => (
        <option key={cat.id} value={cat.id}>
          {cat.name}
        </option>
      ))}
    </select>
  );
};

export default GuideCategoryFilter;
