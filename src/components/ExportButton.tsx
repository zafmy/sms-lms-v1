"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { useState } from "react";

const ExportButton = ({ table }: { table: string }) => {
  const t = useTranslations("common");
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      // Pass current URL search params for filtered export (exclude page)
      const params = new URLSearchParams(window.location.search);
      params.delete("page");

      const response = await fetch(
        `/api/export/${table}?${params.toString()}`
      );
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${table}-export.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      // Silently fail - user sees the button return to normal state
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow disabled:opacity-50"
      title={t("exportCsv")}
    >
      {loading ? (
        <span className="text-xs">...</span>
      ) : (
        <Image src="/sort.png" alt="Export" width={14} height={14} />
      )}
    </button>
  );
};

export default ExportButton;
