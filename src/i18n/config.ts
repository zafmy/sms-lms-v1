// Supported locales and default locale configuration for next-intl
// Cookie-based routing (no URL prefixes) per SPEC-I18N-001 REQ-U4, REQ-N1

export const locales = ["en", "ms"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

// Cookie name used by next-intl for locale persistence (REQ-U3)
export const localeCookieName = "NEXT_LOCALE";
