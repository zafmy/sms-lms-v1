"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { locales, localeCookieName, type Locale } from "@/i18n/config";

// Native display names for each locale
const localeNames: Record<Locale, string> = {
  en: "English",
  ms: "Bahasa Malaysia",
};

// Short display codes for toggle button
const localeShortNames: Record<Locale, string> = {
  en: "EN",
  ms: "BM",
};

function setLocaleCookie(locale: Locale) {
  document.cookie = `${localeCookieName}=${locale};path=/;max-age=${60 * 60 * 24 * 365}`;
}

const LanguageSwitcher = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLocaleChange = (newLocale: Locale) => {
    setLocaleCookie(newLocale);
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <div className="flex items-center gap-1">
      {locales.map((locale) => (
        <button
          key={locale}
          onClick={() => handleLocaleChange(locale)}
          disabled={isPending}
          title={localeNames[locale]}
          className="px-2 py-1 text-xs rounded-md hover:bg-lamaSkyLight transition-colors disabled:opacity-50"
        >
          {localeShortNames[locale]}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
