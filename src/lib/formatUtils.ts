import { type Locale } from "@/i18n/config";

// Map app locale codes to Intl locale codes
const intlLocaleMap: Record<Locale, string> = {
  en: "en-US",
  ms: "ms-MY",
};

export function getIntlLocale(locale: string): string {
  return intlLocaleMap[locale as Locale] || "en-US";
}

export function formatDate(
  date: Date | string,
  locale: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(getIntlLocale(locale), options).format(d);
}

export function formatTime(
  date: Date | string,
  locale: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const defaultOptions: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    ...options,
  };
  return d.toLocaleTimeString(getIntlLocale(locale), defaultOptions);
}

export function formatNumber(value: number, locale: string): string {
  return value.toLocaleString(getIntlLocale(locale));
}

export function formatPercent(
  value: number,
  locale: string,
  decimals: number = 1
): string {
  return value.toFixed(decimals) + "%";
}
