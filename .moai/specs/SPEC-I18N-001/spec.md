---
id: SPEC-I18N-001
title: "Multi-Language Support (English + Bahasa Malaysia)"
version: 1.0.0
status: draft
created: 2026-02-23
updated: 2026-02-23
author: MoAI
priority: high
tags: [i18n, localization, next-intl, bahasa-malaysia, multi-language]
blocks: [SPEC-GUIDE-001]
---

## History

| Date       | Version | Author | Description                          |
| ---------- | ------- | ------ | ------------------------------------ |
| 2026-02-23 | 1.0.0   | MoAI   | Initial SPEC creation for i18n setup |

---

## 1. Environment

### 1.1 System Context

The Hua Readwise school management system is a Next.js 16 App Router application with React 19, TypeScript 5, Tailwind v4, Prisma ORM, and Clerk authentication. The application serves four user roles (admin, teacher, student, parent) across 110+ components with 4 role dashboards, 17 entity list pages, 22 form components, and 66+ shared UI/widget components.

### 1.2 Current State

- All user-facing strings are hardcoded in English across all 110+ components
- No i18n infrastructure exists (no translation files, no locale detection, no language switching)
- Root layout (`src/app/layout.tsx`) wraps `ClerkProvider` with `<html lang="en">`
- Middleware (`src/proxy.ts`) handles Clerk auth with route matchers from `routeAccessMap`
- Navigation is defined in `Menu.tsx` with hardcoded `menuItems` array containing English labels
- Form validation schemas in `src/lib/formValidationSchemas.ts` use hardcoded English error messages
- Date displays use `moment` library without locale configuration
- No cookie-based or URL-based locale routing exists

### 1.3 Technology Stack

| Technology    | Version | Role                          |
| ------------- | ------- | ----------------------------- |
| Next.js       | 16      | App Router framework          |
| React         | 19      | UI library                    |
| TypeScript    | 5       | Type safety                   |
| Tailwind CSS  | 4       | Styling                       |
| Clerk         | 6.38+   | Authentication                |
| Prisma        | 5.19+   | ORM                           |
| next-intl     | latest  | i18n library (to be added)    |
| moment        | 2.30+   | Date formatting (existing)    |
| zod           | 3.23+   | Form validation (existing)    |
| recharts      | 3.7+    | Charts (existing)             |

### 1.4 Supported Locales

| Locale Code | Language        | Status  |
| ----------- | --------------- | ------- |
| `en`        | English         | Default |
| `ms`        | Bahasa Malaysia | New     |

---

## 2. Assumptions

- **A1**: The `next-intl` library supports Next.js 16 App Router with Server Components and Client Components without breaking changes.
- **A2**: Cookie-based locale routing (no URL prefix) is compatible with the existing Clerk middleware composition pattern in `src/proxy.ts`.
- **A3**: All existing Clerk authentication flows remain unaffected by the addition of next-intl middleware composition.
- **A4**: Bahasa Malaysia translations will be professionally accurate and contextually appropriate for a school management system (not machine-translated placeholders).
- **A5**: The `moment` library supports `ms` locale for Bahasa Malaysia date formatting out of the box.
- **A6**: All 110+ components can be migrated incrementally without requiring a full application rewrite.
- **A7**: Form validation error messages from `zod` schemas can be internationalized by passing translated strings at render time rather than modifying schema definitions.
- **A8**: The language preference cookie will persist across browser sessions and will not conflict with Clerk session cookies.

---

## 3. Requirements

### 3.1 Ubiquitous Requirements (Always Active)

- **REQ-U1**: The system shall always provide English as the default locale when no user preference is detected.
- **REQ-U2**: The system shall always render all user-facing text through the `next-intl` translation function (`useTranslations` or `getTranslations`) instead of hardcoded strings.
- **REQ-U3**: The system shall always persist the user's language preference in a cookie named `NEXT_LOCALE`.
- **REQ-U4**: The system shall always maintain the same URL structure regardless of the selected locale (no `/en/` or `/ms/` prefix).
- **REQ-U5**: The system shall always load translation messages from structured JSON files located in `messages/en.json` and `messages/ms.json`.

### 3.2 Event-Driven Requirements (Trigger-Response)

- **REQ-E1**: **When** the user clicks the LanguageSwitcher component, **then** the system shall update the `NEXT_LOCALE` cookie, reload translations, and re-render all visible text in the selected language without a full page reload.
- **REQ-E2**: **When** a new user visits the application for the first time without a `NEXT_LOCALE` cookie, **then** the system shall detect the browser's `Accept-Language` header and select the closest matching supported locale.
- **REQ-E3**: **When** the user submits a form with validation errors, **then** the system shall display validation error messages in the user's currently selected locale.
- **REQ-E4**: **When** the application loads a page containing date or number values, **then** the system shall format those values according to the active locale's conventions.
- **REQ-E5**: **When** a translation key is missing from the active locale's message file, **then** the system shall fall back to the English (`en`) translation for that key.

### 3.3 State-Driven Requirements (Conditional Behavior)

- **REQ-S1**: **While** the locale is set to `ms`, **then** all navigation menu items, sidebar labels, page headings, table column headers, button labels, and form field labels shall display Bahasa Malaysia text.
- **REQ-S2**: **While** the locale is set to `ms`, **then** all date displays shall use Bahasa Malaysia month names, day names, and date formatting conventions.
- **REQ-S3**: **While** the locale is set to `en`, **then** the system shall display all text in English using the existing content as the baseline.
- **REQ-S4**: **While** a Server Component renders, **then** the system shall use `getTranslations` from `next-intl/server` to load translations on the server side.
- **REQ-S5**: **While** a Client Component renders, **then** the system shall use `useTranslations` hook from `next-intl` wrapped in `NextIntlClientProvider`.

### 3.4 Unwanted Behavior Requirements (Prohibitions)

- **REQ-N1**: The system shall **not** modify any existing URL paths or route structures to accommodate locale prefixes.
- **REQ-N2**: The system shall **not** store language preferences in a database or user profile (cookie-only approach).
- **REQ-N3**: The system shall **not** display raw translation keys (e.g., `menu.home`) to end users under any circumstance.
- **REQ-N4**: The system shall **not** break existing Clerk authentication flows, session management, or role-based access control.
- **REQ-N5**: The system shall **not** introduce any TypeScript compilation errors or type regressions.

### 3.5 Optional Requirements (Enhancements)

- **REQ-O1**: **Where possible**, the system should provide locale-aware number formatting for numerical displays (grades, counts, statistics).
- **REQ-O2**: **Where possible**, the system should support RTL text direction detection for future locale additions.
- **REQ-O3**: **Where possible**, the LanguageSwitcher should display the language name in its native script (e.g., "Bahasa Malaysia" instead of "Malay").

---

## 4. Specifications

### 4.1 Architecture Overview

```
src/
  i18n/
    config.ts          -- Locale definitions and default locale
    request.ts         -- getRequestConfig with cookie-based locale detection
  app/
    layout.tsx         -- Updated with NextIntlClientProvider and dynamic lang
  proxy.ts             -- Updated to compose next-intl + Clerk middleware
  components/
    LanguageSwitcher.tsx  -- New component for locale switching
    Navbar.tsx            -- Updated to include LanguageSwitcher
    Menu.tsx              -- Updated to use translations
    ...                   -- All 110+ components updated
messages/
  en.json              -- English translation messages (namespaced)
  ms.json              -- Bahasa Malaysia translation messages (namespaced)
```

### 4.2 Translation Message Namespace Structure

```json
{
  "common": {
    "search": "Search...",
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "create": "Create",
    "update": "Update",
    "loading": "Loading...",
    "noResults": "No results found",
    "actions": "Actions",
    "confirm": "Are you sure?",
    "yes": "Yes",
    "no": "No",
    "back": "Back",
    "next": "Next",
    "previous": "Previous",
    "all": "All",
    "export": "Export",
    "print": "Print",
    "showing": "Showing",
    "of": "of",
    "page": "Page"
  },
  "menu": {
    "sectionMenu": "MENU",
    "sectionOther": "OTHER",
    "home": "Home",
    "teachers": "Teachers",
    "students": "Students",
    "parents": "Parents",
    "subjects": "Subjects",
    "classes": "Classes",
    "lessons": "Lessons",
    "courses": "Courses",
    "forums": "Forums",
    "enrollments": "Enrollments",
    "badges": "Badges",
    "achievements": "Achievements",
    "exams": "Exams",
    "assignments": "Assignments",
    "reviews": "Reviews",
    "results": "Results",
    "attendance": "Attendance",
    "events": "Events",
    "messages": "Messages",
    "announcements": "Announcements",
    "profile": "Profile",
    "settings": "Settings",
    "logout": "Logout"
  },
  "navbar": {
    "searchPlaceholder": "Search...",
    "role": "Role"
  },
  "dashboard": {
    "admin": { ... },
    "teacher": { ... },
    "student": { ... },
    "parent": { ... }
  },
  "forms": {
    "validation": { ... },
    "labels": { ... },
    "placeholders": { ... }
  },
  "entities": {
    "students": { ... },
    "teachers": { ... },
    "parents": { ... },
    "classes": { ... },
    "subjects": { ... },
    "lessons": { ... },
    "exams": { ... },
    "assignments": { ... },
    "results": { ... },
    "attendance": { ... },
    "events": { ... },
    "announcements": { ... }
  },
  "lms": {
    "courses": { ... },
    "modules": { ... },
    "quizzes": { ... },
    "enrollment": { ... },
    "analytics": { ... },
    "forums": { ... }
  },
  "gamification": {
    "achievements": { ... },
    "badges": { ... },
    "xp": { ... },
    "leaderboard": { ... },
    "streaks": { ... }
  },
  "spaced_repetition": {
    "reviews": { ... },
    "cards": { ... },
    "sessions": { ... },
    "analytics": { ... }
  },
  "notifications": {
    "title": "Notifications",
    "markAllRead": "Mark all as read",
    "noNotifications": "No new notifications"
  }
}
```

### 4.3 Middleware Composition

The `src/proxy.ts` file must compose `next-intl` middleware with the existing Clerk middleware. The next-intl middleware handles locale detection from the `NEXT_LOCALE` cookie and sets the locale for each request. The Clerk middleware continues to handle authentication and role-based routing.

### 4.4 Root Layout Integration

The `src/app/layout.tsx` must:
1. Import `NextIntlClientProvider` from `next-intl`
2. Import `getMessages` and `getLocale` from `next-intl/server`
3. Set `<html lang={locale}>` dynamically
4. Wrap children with `NextIntlClientProvider` passing `messages`

### 4.5 Component Migration Strategy

All 110+ components must be migrated from hardcoded strings to translation keys:
- **Server Components**: Use `getTranslations` from `next-intl/server`
- **Client Components**: Use `useTranslations` hook from `next-intl`
- **Shared Components**: Receive translated strings as props or use hooks based on render context

### 4.6 Constraints

- **C1**: No new database tables or schema changes required
- **C2**: No URL structure changes (cookie-based routing only)
- **C3**: Must be compatible with Next.js 16 App Router
- **C4**: Must not break existing Clerk auth flow in `src/proxy.ts`
- **C5**: All translation keys must be namespaced to prevent collisions
- **C6**: TypeScript must compile cleanly with zero errors after migration

---

## 5. Traceability

| Requirement | Plan TAG | Acceptance Scenario |
| ----------- | -------- | ------------------- |
| REQ-U1      | TAG-1    | AC-1                |
| REQ-U2      | TAG-3 to TAG-7 | AC-2, AC-4   |
| REQ-U3      | TAG-1, TAG-2   | AC-3          |
| REQ-U4      | TAG-1    | AC-1, AC-3          |
| REQ-U5      | TAG-1    | AC-1                |
| REQ-E1      | TAG-2    | AC-2                |
| REQ-E2      | TAG-1    | AC-7                |
| REQ-E3      | TAG-5    | AC-5                |
| REQ-E4      | TAG-9    | AC-6                |
| REQ-E5      | TAG-1    | AC-4                |
| REQ-S1      | TAG-2 to TAG-7 | AC-2, AC-8   |
| REQ-S2      | TAG-9    | AC-6                |
| REQ-S3      | TAG-3 to TAG-7 | AC-1          |
| REQ-S4      | TAG-1    | AC-1                |
| REQ-S5      | TAG-1    | AC-1                |
| REQ-N1      | TAG-1    | AC-1, AC-3          |
| REQ-N2      | TAG-1    | AC-3                |
| REQ-N3      | TAG-8    | AC-4                |
| REQ-N4      | TAG-1    | AC-1                |
| REQ-N5      | TAG-9    | AC-8                |
| REQ-O1      | TAG-9    | AC-6                |
| REQ-O3      | TAG-2    | AC-2                |
