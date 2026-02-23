"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

const TOOLTIP_DISMISSED_KEY = "help-tooltip-dismissed";

const HelpFloatingButton = () => {
  const router = useRouter();
  const t = useTranslations("guides");
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(TOOLTIP_DISMISSED_KEY);
    if (dismissed !== "true") {
      setShowTooltip(true);
    }
  }, []);

  const handleDismissTooltip = useCallback(() => {
    setShowTooltip(false);
    localStorage.setItem(TOOLTIP_DISMISSED_KEY, "true");
  }, []);

  const handleClick = useCallback(() => {
    handleDismissTooltip();
    router.push("/list/guides");
  }, [router, handleDismissTooltip]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-end gap-2">
      {showTooltip && (
        <div className="relative bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm text-gray-700 max-w-[200px] mb-1">
          <p>{t("helpTooltip")}</p>
          <button
            onClick={handleDismissTooltip}
            className="absolute -top-2 -right-2 w-5 h-5 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-500 text-xs leading-none"
            aria-label="Dismiss"
          >
            x
          </button>
          {/* Tooltip arrow */}
          <div className="absolute right-4 -bottom-1.5 w-3 h-3 bg-white border-r border-b border-gray-200 transform rotate-45" />
        </div>
      )}
      <button
        onClick={handleClick}
        className="w-12 h-12 bg-lamaPurple hover:bg-lamaPurple/90 text-white rounded-full shadow-lg flex items-center justify-center text-xl font-bold transition-all duration-200 hover:scale-105"
        aria-label={t("helpButton")}
        title={t("helpButton")}
      >
        ?
      </button>
    </div>
  );
};

export default HelpFloatingButton;
