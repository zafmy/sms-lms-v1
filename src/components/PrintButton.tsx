"use client";

import { useTranslations } from "next-intl";

const PrintButton = () => {
  const t = useTranslations("common");
  return (
    <button
      onClick={() => window.print()}
      className="print:hidden bg-lamaSky text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-lamaSkyLight transition-colors"
    >
      {t("printReportCard")}
    </button>
  );
};

export default PrintButton;
