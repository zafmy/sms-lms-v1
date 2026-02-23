---
id: SPEC-I18N-001
title: "Multi-Language Support - Acceptance Criteria"
version: 1.0.0
status: draft
created: 2026-02-23
updated: 2026-02-23
author: MoAI
---

## Acceptance Criteria

### AC-1: Default Locale Loading (English)

**Given** a user visits the application for the first time
**And** no `NEXT_LOCALE` cookie exists in the browser
**And** the browser's `Accept-Language` header does not include `ms`
**When** the application loads any page (e.g., `/admin`, `/list/students`)
**Then** all text shall display in English
**And** the `<html lang="en">` attribute shall be set
**And** the `NEXT_LOCALE` cookie shall be set to `en`
**And** the URL shall not contain any locale prefix (e.g., no `/en/admin`)
**And** Clerk authentication shall function correctly (login/logout/role display)

**Tags**: REQ-U1, REQ-U4, REQ-U5, REQ-N1, REQ-N4

---

### AC-2: Language Switching to Bahasa Malaysia

**Given** a user is viewing the application in English
**And** the LanguageSwitcher component is visible in the Navbar
**When** the user clicks the LanguageSwitcher and selects "Bahasa Malaysia"
**Then** the `NEXT_LOCALE` cookie shall be updated to `ms`
**And** all visible text shall change to Bahasa Malaysia without a full page reload
**And** the `<html lang="ms">` attribute shall be updated
**And** the sidebar menu items shall display:
  - "Laman Utama" (Home)
  - "Guru" (Teachers)
  - "Pelajar" (Students)
  - "Ibu Bapa" (Parents)
  - "Mata Pelajaran" (Subjects)
  - "Kelas" (Classes)
  - "Pelajaran" (Lessons)
  - "Kursus" (Courses)
  - "Peperiksaan" (Exams)
  - "Tugasan" (Assignments)
  - "Keputusan" (Results)
  - "Kehadiran" (Attendance)
  - "Acara" (Events)
  - "Pengumuman" (Announcements)
**And** the Navbar search placeholder shall display "Cari..."
**And** the LanguageSwitcher shall display "Bahasa Malaysia" as the active language
**And** the URL shall not change (no locale prefix added)

**Tags**: REQ-E1, REQ-S1, REQ-O3

---

### AC-3: Language Persistence Across Navigation

**Given** a user has selected Bahasa Malaysia as their language
**And** the `NEXT_LOCALE` cookie is set to `ms`
**When** the user navigates to different pages:
  - From `/admin` to `/list/students`
  - From `/list/students` to `/list/exams`
  - From `/list/exams` back to `/admin`
**Then** all pages shall continue to display in Bahasa Malaysia
**And** the `NEXT_LOCALE` cookie shall remain set to `ms`
**And** no URL prefix shall be added to any route

**Given** the user closes the browser and reopens it
**When** the user returns to the application
**Then** the application shall load in Bahasa Malaysia (persisted from cookie)
**And** the `<html lang="ms">` attribute shall be set

**Tags**: REQ-U3, REQ-U4, REQ-N1, REQ-N2

---

### AC-4: Fallback Behavior for Missing Translations

**Given** the application locale is set to `ms` (Bahasa Malaysia)
**And** a translation key exists in `messages/en.json` but is missing from `messages/ms.json`
**When** the application renders a component that uses that translation key
**Then** the system shall display the English translation as a fallback
**And** the system shall not display a raw translation key (e.g., shall not show `menu.home`)
**And** the system shall not display an empty string
**And** the system shall not throw a runtime error

**Tags**: REQ-E5, REQ-N3

---

### AC-5: Form Validation Messages in Both Locales

**Given** a user is on the "Create Student" form
**And** the locale is set to `en` (English)
**When** the user submits the form with an empty "First Name" field
**Then** a validation error message shall display in English (e.g., "First name is required")

**Given** a user is on the "Create Student" form
**And** the locale is set to `ms` (Bahasa Malaysia)
**When** the user submits the form with an empty "First Name" field
**Then** a validation error message shall display in Bahasa Malaysia (e.g., "Nama pertama diperlukan")

**Given** a user is on any form (Teacher, Parent, Class, Subject, etc.)
**When** the user submits with invalid data in either locale
**Then** all validation error messages shall display in the active locale
**And** field labels shall match the active locale
**And** the submit button text shall match the active locale

**Tags**: REQ-E3

---

### AC-6: Date and Number Formatting in Both Locales

**Given** the locale is set to `en` (English)
**When** a date is displayed on any page (e.g., event date, student birthday, exam date)
**Then** the date shall be formatted in English conventions
**And** month names shall be in English (e.g., "February 23, 2026")
**And** the BigCalendar toolbar shall display English month and day names

**Given** the locale is set to `ms` (Bahasa Malaysia)
**When** a date is displayed on any page
**Then** the date shall be formatted in Bahasa Malaysia conventions
**And** month names shall be in Bahasa Malaysia (e.g., "23 Februari 2026")
**And** the BigCalendar toolbar shall display Bahasa Malaysia month and day names:
  - Months: Januari, Februari, Mac, April, Mei, Jun, Julai, Ogos, September, Oktober, November, Disember
  - Days: Isn, Sel, Rab, Kha, Jum, Sab, Ahd

**Given** a numerical value (grade, percentage, count) is displayed
**When** the locale is `ms`
**Then** the number shall be formatted according to `ms` locale conventions

**Tags**: REQ-E4, REQ-S2, REQ-O1

---

### AC-7: New User First Visit with Accept-Language Header

**Given** a new user visits the application for the first time
**And** no `NEXT_LOCALE` cookie exists
**And** the browser's `Accept-Language` header is set to `ms,en;q=0.9`
**When** the application loads
**Then** the system shall detect `ms` from the `Accept-Language` header
**And** the application shall load in Bahasa Malaysia
**And** the `NEXT_LOCALE` cookie shall be set to `ms`

**Given** a new user visits the application for the first time
**And** no `NEXT_LOCALE` cookie exists
**And** the browser's `Accept-Language` header is set to `fr,de;q=0.9`
**When** the application loads
**Then** the system shall fall back to English (default locale)
**And** the `NEXT_LOCALE` cookie shall be set to `en`

**Tags**: REQ-E2, REQ-U1

---

### AC-8: All Dashboard Pages Display Correct Translations

**Given** the locale is set to `ms` (Bahasa Malaysia)

**When** the admin navigates to `/admin`
**Then** all dashboard widget titles shall display in Bahasa Malaysia:
  - User cards: "Pelajar", "Guru", "Ibu Bapa", "Kakitangan"
  - Chart titles: translated chart headings
  - Attendance chart legends: translated labels
  - Announcements section: "Pengumuman"
  - Events section: "Acara"

**When** the teacher navigates to `/teacher`
**Then** all teacher dashboard widgets shall display in Bahasa Malaysia:
  - Schedule: "Jadual Hari Ini"
  - Pending grading: "Pemarkahan Tertangguh"
  - Student overview: translated labels
  - Class attendance: translated labels

**When** the student navigates to `/student`
**Then** all student dashboard widgets shall display in Bahasa Malaysia:
  - Recent grades: "Gred Terkini"
  - Upcoming exams: "Peperiksaan Akan Datang"
  - Assignments due: "Tugasan Perlu Dihantar"
  - Attendance card: translated labels
  - Gamification widgets: translated XP, badges, streak labels
  - LMS widgets: translated course progress labels

**When** the parent navigates to `/parent`
**Then** all parent dashboard widgets shall display in Bahasa Malaysia:
  - Child stats: "Statistik Anak"
  - Grade overview: translated labels
  - Activity feed: translated labels
  - LMS progress: translated labels

**And** zero hardcoded English strings shall be visible on any dashboard page

**Tags**: REQ-U2, REQ-S1, REQ-N5

---

### AC-9: LMS and Gamification Components Fully Translated

**Given** the locale is set to `ms` (Bahasa Malaysia)

**When** the user navigates to the course list page (`/list/courses`)
**Then** all course card labels, enrollment buttons, and progress indicators shall display in Bahasa Malaysia

**When** the user views a course detail page with modules and lessons
**Then** all module titles, lesson labels, navigation buttons, and completion indicators shall display in Bahasa Malaysia

**When** the user starts a quiz
**Then** the quiz interface shall display in Bahasa Malaysia:
  - Timer label: "Masa Berbaki"
  - Submit button: "Hantar"
  - Results: "Markah", "Lulus"/"Gagal"

**When** the student views the achievements page (`/list/achievements`)
**Then** all gamification labels shall display in Bahasa Malaysia:
  - "Pencapaian", "Lencana", "Mata XP", "Papan Pendahulu", "Tahap"

**When** the student accesses the spaced repetition review page (`/list/reviews`)
**Then** all review interface labels shall display in Bahasa Malaysia:
  - "Ulangkaji Berjarak", "Mula Ulangkaji", "Dikuasai", "Sedang Belajar", "Baharu"

**Tags**: REQ-U2, REQ-S1

---

### AC-10: TypeScript Compilation and Build Verification

**Given** all i18n changes have been completed across all TAGs
**When** `npm run build` is executed
**Then** the build shall complete successfully with zero TypeScript errors
**And** zero type regressions shall be introduced

**When** `npm run lint` is executed
**Then** the linting shall pass with zero errors

**When** all pages are accessed in both `en` and `ms` locales
**Then** the browser console shall show zero errors related to:
  - Missing translation keys
  - next-intl configuration issues
  - Hydration mismatches
  - Runtime type errors

**Tags**: REQ-N5

---

## Quality Gate Criteria

### Definition of Done

- [ ] All 110+ components migrated from hardcoded strings to `useTranslations` / `getTranslations`
- [ ] Complete `messages/en.json` with all namespaced translation keys
- [ ] Complete `messages/ms.json` with professional Bahasa Malaysia translations
- [ ] LanguageSwitcher component functional in Navbar
- [ ] Cookie-based locale persistence working across sessions
- [ ] Middleware composition (next-intl + Clerk) working without auth regressions
- [ ] Date formatting locale-aware across all date displays
- [ ] `npm run build` passes with zero errors
- [ ] `npm run lint` passes with zero errors
- [ ] All 4 dashboards verified in both locales
- [ ] All 17 entity list pages verified in both locales
- [ ] All 22 form components verified in both locales
- [ ] No hardcoded English strings remaining (verified by codebase grep)
- [ ] No raw translation keys visible to end users
- [ ] No text overflow or layout issues in Bahasa Malaysia locale

### Test Coverage Requirements

| Test Type | Requirement |
| --------- | ----------- |
| Manual UI verification | All pages in both locales |
| Translation completeness | 100% key parity between en.json and ms.json |
| Build verification | Zero TypeScript errors |
| Lint verification | Zero ESLint errors |
| Console error check | Zero i18n-related console errors |
| Layout regression | No text overflow in ms locale |
