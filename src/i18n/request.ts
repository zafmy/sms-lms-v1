// Server-side request configuration for next-intl
// Reads locale from NEXT_LOCALE cookie with Accept-Language header fallback
// per SPEC-I18N-001 REQ-U1, REQ-U3, REQ-E2, REQ-E5

import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { defaultLocale, locales, type Locale } from "./config";

function isValidLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

function detectLocaleFromAcceptLanguage(acceptLanguage: string): Locale {
  // Parse Accept-Language header to find the best matching locale
  // Example header: "ms-MY,ms;q=0.9,en-US;q=0.8,en;q=0.7"
  const preferred = acceptLanguage
    .split(",")
    .map((part) => {
      const [lang, q] = part.trim().split(";q=");
      return {
        lang: lang.trim().toLowerCase(),
        quality: q ? parseFloat(q) : 1.0,
      };
    })
    .sort((a, b) => b.quality - a.quality);

  for (const { lang } of preferred) {
    // Check exact match first (e.g., "ms" or "en")
    if (isValidLocale(lang)) {
      return lang;
    }
    // Check language prefix match (e.g., "ms-MY" -> "ms", "en-US" -> "en")
    const prefix = lang.split("-")[0];
    if (isValidLocale(prefix)) {
      return prefix;
    }
  }

  return defaultLocale;
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const headerStore = await headers();

  // Priority 1: Read from NEXT_LOCALE cookie (REQ-U3)
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;

  let locale: Locale = defaultLocale;

  if (cookieLocale && isValidLocale(cookieLocale)) {
    locale = cookieLocale;
  } else {
    // Priority 2: Detect from Accept-Language header for first visit (REQ-E2)
    const acceptLanguage = headerStore.get("accept-language") || "";
    if (acceptLanguage) {
      locale = detectLocaleFromAcceptLanguage(acceptLanguage);
    }
    // Priority 3: Fall back to default locale (REQ-U1)
  }

  return {
    locale,
    // Load messages for the resolved locale (REQ-U5)
    // Fallback to English for missing keys is handled by next-intl's
    // built-in fallback mechanism (REQ-E5)
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
