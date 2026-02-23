"use client";

import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";

interface FilterOption {
  value: string;
  label: string;
}

interface ListFilterProps {
  paramKey: string;
  label: string;
  options: FilterOption[];
}

const ListFilter = ({ paramKey, label, options }: ListFilterProps) => {
  const t = useTranslations("common");
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentValue = searchParams.get(paramKey) || "";

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const params = new URLSearchParams(searchParams.toString());

    if (value === "") {
      params.delete(paramKey);
    } else {
      params.set(paramKey, value);
    }

    // Reset to page 1 when filter changes
    params.delete("page");

    router.push(`${window.location.pathname}?${params.toString()}`);
  };

  return (
    <select
      value={currentValue}
      onChange={handleChange}
      className="bg-white border border-gray-300 text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lamaSky"
    >
      <option value="">{t("allLabel", { label })}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default ListFilter;
