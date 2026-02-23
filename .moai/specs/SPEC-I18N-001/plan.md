---
id: SPEC-I18N-001
title: "Multi-Language Support - Implementation Plan"
version: 1.0.0
status: draft
created: 2026-02-23
updated: 2026-02-23
author: MoAI
---

## Implementation Plan

### Overview

This plan migrates the entire Hua Readwise school management system from hardcoded English strings to a fully internationalized application supporting English (`en`) and Bahasa Malaysia (`ms`). The migration is organized into 9 TAGs (milestones) executed sequentially, with each TAG building on the previous one.

### Technology Decision

- **Library**: `next-intl` (latest stable)
- **Routing Strategy**: Cookie-based (`NEXT_LOCALE` cookie), no URL prefix
- **Message Format**: Namespaced JSON files in `messages/` directory
- **Middleware**: Composed with existing Clerk middleware in `src/proxy.ts`

---

## TAG-1: Core Infrastructure

**Priority**: Primary Goal
**Dependencies**: None
**Objective**: Install next-intl, configure i18n infrastructure, compose middleware, and update root layout without breaking any existing functionality.

### Files to Create

| File                   | Purpose                                              |
| ---------------------- | ---------------------------------------------------- |
| `src/i18n/config.ts`   | Locale definitions, default locale, supported locales |
| `src/i18n/request.ts`  | `getRequestConfig` with cookie-based locale detection |
| `messages/en.json`     | English translation messages (initial namespace scaffold) |
| `messages/ms.json`     | Bahasa Malaysia translation messages (initial scaffold, empty values) |

### Files to Modify

| File                   | Change Description                                   |
| ---------------------- | ---------------------------------------------------- |
| `package.json`         | Add `next-intl` dependency                           |
| `src/proxy.ts`         | Compose `createMiddleware` from next-intl with Clerk middleware |
| `src/app/layout.tsx`   | Add `NextIntlClientProvider`, dynamic `lang` attribute, import `getMessages`/`getLocale` |
| `next.config.ts` (or `.mjs`) | Add next-intl plugin configuration if required |

### Implementation Details

**src/i18n/config.ts**:
```typescript
export const locales = ['en', 'ms'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';
```

**src/i18n/request.ts**:
```typescript
import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { defaultLocale, locales, type Locale } from './config';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value;
  const locale: Locale = locales.includes(cookieLocale as Locale)
    ? (cookieLocale as Locale)
    : defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
```

**messages/en.json** (initial scaffold):
```json
{
  "common": {},
  "menu": {},
  "navbar": {},
  "dashboard": { "admin": {}, "teacher": {}, "student": {}, "parent": {} },
  "forms": { "validation": {}, "labels": {}, "placeholders": {} },
  "entities": {},
  "lms": {},
  "gamification": {},
  "spaced_repetition": {},
  "notifications": {}
}
```

**Middleware Composition** (src/proxy.ts):
- Import `createIntlMiddleware` from `next-intl/middleware`
- Configure with `locales`, `defaultLocale`, and `localeDetection: true`
- Compose: next-intl middleware runs first for locale detection, then Clerk middleware handles auth

**Root Layout** (src/app/layout.tsx):
- Import `NextIntlClientProvider` and `getMessages`, `getLocale` from `next-intl/server`
- Await `getLocale()` and `getMessages()`
- Set `<html lang={locale}>` dynamically
- Wrap children: `<NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>`

### Verification Criteria

- [ ] `npm run build` succeeds with zero errors
- [ ] Application loads at `http://localhost:3000` without regressions
- [ ] `NEXT_LOCALE` cookie is set on first visit
- [ ] Clerk authentication continues to work (login, logout, role-based routing)
- [ ] `next-intl` provider is active (verify via React DevTools)

---

## TAG-2: Language Switcher and Navigation

**Priority**: Primary Goal
**Dependencies**: TAG-1
**Objective**: Create the LanguageSwitcher component, integrate it into the Navbar, and translate all sidebar navigation items.

### Files to Create

| File                            | Purpose                              |
| ------------------------------- | ------------------------------------ |
| `src/components/LanguageSwitcher.tsx` | Client component for locale switching |

### Files to Modify

| File                        | Change Description                        |
| --------------------------- | ----------------------------------------- |
| `src/components/Navbar.tsx` | Add LanguageSwitcher, translate labels     |
| `src/components/Menu.tsx`   | Replace hardcoded menuItems labels with translation keys |
| `messages/en.json`          | Add `menu.*` and `navbar.*` keys with English values |
| `messages/ms.json`          | Add `menu.*` and `navbar.*` keys with Bahasa Malaysia values |

### Implementation Details

**LanguageSwitcher.tsx**:
- Client component (`"use client"`)
- Displays current locale flag/name
- Dropdown or toggle between EN and BM
- On click: sets `NEXT_LOCALE` cookie via `document.cookie` or server action
- Calls `useRouter().refresh()` to reload with new locale
- Display native language names: "English" / "Bahasa Malaysia"

**Menu.tsx**:
- Convert from async Server Component to use `getTranslations('menu')`
- Replace `menuItems[].title` with `t('sectionMenu')`, `t('sectionOther')`
- Replace each `item.label` with `t('home')`, `t('teachers')`, etc.
- Keep `href` and `visible` arrays unchanged

**Navbar.tsx**:
- Add `LanguageSwitcher` next to `UserButton`
- Translate `placeholder="Search..."` to `t('searchPlaceholder')`

### Bahasa Malaysia Translations (menu namespace)

| Key             | English        | Bahasa Malaysia    |
| --------------- | -------------- | ------------------ |
| sectionMenu     | MENU           | MENU               |
| sectionOther    | OTHER          | LAIN-LAIN          |
| home            | Home           | Laman Utama        |
| teachers        | Teachers       | Guru               |
| students        | Students       | Pelajar            |
| parents         | Parents        | Ibu Bapa           |
| subjects        | Subjects       | Mata Pelajaran     |
| classes         | Classes        | Kelas              |
| lessons         | Lessons        | Pelajaran          |
| courses         | Courses        | Kursus             |
| forums          | Forums         | Forum              |
| enrollments     | Enrollments    | Pendaftaran        |
| badges          | Badges         | Lencana            |
| achievements    | Achievements   | Pencapaian         |
| exams           | Exams          | Peperiksaan        |
| assignments     | Assignments    | Tugasan            |
| reviews         | Reviews        | Ulangkaji          |
| results         | Results        | Keputusan          |
| attendance      | Attendance     | Kehadiran          |
| events          | Events         | Acara              |
| messages        | Messages       | Mesej              |
| announcements   | Announcements  | Pengumuman         |
| profile         | Profile        | Profil             |
| settings        | Settings       | Tetapan            |
| logout          | Logout         | Log Keluar         |

### Verification Criteria

- [ ] LanguageSwitcher renders in the Navbar
- [ ] Clicking "Bahasa Malaysia" sets `NEXT_LOCALE=ms` cookie
- [ ] All sidebar menu items change to Bahasa Malaysia
- [ ] Clicking "English" reverts all text to English
- [ ] Navigation links still route correctly
- [ ] Clerk auth unaffected by language switch

---

## TAG-3: Dashboard Pages Translation

**Priority**: Primary Goal
**Dependencies**: TAG-2
**Objective**: Translate all 4 role-specific dashboard pages and their widget components.

### Files to Modify

| File | Change Description |
| ---- | ------------------ |
| `src/app/(dashboard)/admin/page.tsx` | Use translations for dashboard headings, widget titles |
| `src/app/(dashboard)/teacher/page.tsx` | Translate teacher dashboard widgets |
| `src/app/(dashboard)/student/page.tsx` | Translate student dashboard widgets |
| `src/app/(dashboard)/parent/page.tsx` | Translate parent dashboard widgets |
| `src/components/UserCard.tsx` | Translate card labels (e.g., "Students", "Teachers") |
| `src/components/Announcements.tsx` | Translate headings and labels |
| `src/components/EventList.tsx` | Translate event-related labels |
| `src/components/EventCalendar.tsx` | Translate calendar labels |
| `src/components/EventCalendarContainer.tsx` | Pass translations if needed |
| `src/components/AttendanceChart.tsx` | Translate chart labels and legends |
| `src/components/AttendanceChartContainer.tsx` | Pass translations |
| `src/components/CountChart.tsx` | Translate chart labels |
| `src/components/CountChartContainer.tsx` | Pass translations |
| `src/components/BigCalendar.tsx` | Translate calendar toolbar labels |
| `src/components/BigCalendarContainer.tsx` | Pass translations |
| `src/components/ClassOccupancyChart.tsx` | Translate labels |
| `src/components/ClassOccupancyChartContainer.tsx` | Pass translations |
| `src/components/ClassAttendanceOverview.tsx` | Translate labels |
| `src/components/RecentGrades.tsx` | Translate headings |
| `src/components/UpcomingExams.tsx` | Translate headings |
| `src/components/AssignmentsDue.tsx` | Translate headings |
| `src/components/TodaySchedule.tsx` | Translate headings |
| `src/components/PendingGrading.tsx` | Translate headings |
| `src/components/MyStudentsOverview.tsx` | Translate labels |
| `src/components/ChildQuickStats.tsx` | Translate labels |
| `src/components/RecentActivity.tsx` | Translate labels |
| `src/components/ChildGradeOverview.tsx` | Translate labels |
| `src/components/StudentAttendanceCard.tsx` | Translate labels |
| `src/components/SubjectGrades.tsx` | Translate labels |
| `src/components/GradeSummary.tsx` | Translate labels |
| `src/components/AttendanceHeatmap.tsx` | Translate labels |
| `messages/en.json` | Add `dashboard.*` keys |
| `messages/ms.json` | Add `dashboard.*` translations |

### Verification Criteria

- [ ] Admin dashboard displays all widget titles in Bahasa Malaysia when locale is `ms`
- [ ] Teacher dashboard fully translated
- [ ] Student dashboard fully translated
- [ ] Parent dashboard fully translated
- [ ] Chart labels and legends display in the active locale
- [ ] No hardcoded English strings remain on any dashboard page

---

## TAG-4: Common UI Components Translation

**Priority**: Secondary Goal
**Dependencies**: TAG-2
**Objective**: Translate all shared UI components used across entity list pages.

### Files to Modify

| File | Change Description |
| ---- | ------------------ |
| `src/components/Table.tsx` | Translate table headers, empty state messages |
| `src/components/Pagination.tsx` | Translate "Page X of Y", "Previous", "Next" |
| `src/components/TableSearch.tsx` | Translate search placeholder |
| `src/components/FormModal.tsx` | Translate modal titles ("Create", "Update", "Delete"), button labels, confirmation messages |
| `src/components/FormContainer.tsx` | Pass translation context to form modals |
| `src/components/InputField.tsx` | Translate generic labels if any |
| `src/components/ListFilter.tsx` | Translate filter labels and options |
| `src/components/ExportButton.tsx` | Translate "Export" label and options |
| `src/components/PrintButton.tsx` | Translate "Print" label |
| `src/components/NotificationBell.tsx` | Translate notification count label |
| `src/components/NotificationDropdown.tsx` | Translate "Notifications", "Mark all as read", "No new notifications" |
| `src/components/ReportCardTable.tsx` | Translate table headers |
| `messages/en.json` | Add `common.*` and `notifications.*` keys |
| `messages/ms.json` | Add `common.*` and `notifications.*` translations |

### Bahasa Malaysia Translations (common namespace, key examples)

| Key          | English             | Bahasa Malaysia       |
| ------------ | ------------------- | --------------------- |
| search       | Search...           | Cari...               |
| save         | Save                | Simpan                |
| cancel       | Cancel              | Batal                 |
| delete       | Delete              | Padam                 |
| edit         | Edit                | Sunting               |
| create       | Create              | Cipta                 |
| update       | Update              | Kemaskini             |
| loading      | Loading...          | Memuatkan...          |
| noResults    | No results found    | Tiada keputusan ditemui |
| actions      | Actions             | Tindakan              |
| confirm      | Are you sure?       | Adakah anda pasti?    |
| yes          | Yes                 | Ya                    |
| no           | No                  | Tidak                 |
| previous     | Previous            | Sebelumnya            |
| next         | Next                | Seterusnya            |
| export       | Export              | Eksport               |
| print        | Print               | Cetak                 |
| showing      | Showing             | Menunjukkan           |
| of           | of                  | daripada              |
| page         | Page                | Halaman               |

### Verification Criteria

- [ ] Pagination component displays "Halaman X daripada Y" in Bahasa Malaysia
- [ ] Table empty state shows "Tiada keputusan ditemui" in Bahasa Malaysia
- [ ] Modal buttons show "Simpan" / "Batal" in Bahasa Malaysia
- [ ] Notification dropdown fully translated
- [ ] Export and Print buttons translated
- [ ] Search placeholder translated

---

## TAG-5: Entity List Pages and Forms Translation

**Priority**: Secondary Goal
**Dependencies**: TAG-4
**Objective**: Translate all 17 entity list pages, 22 form components, and form validation error messages.

### Files to Modify

| Category | Files | Count |
| -------- | ----- | ----- |
| Entity List Pages | `src/app/(dashboard)/list/{students,teachers,parents,classes,subjects,lessons,exams,assignments,results,attendance,events,announcements,courses,enrollments,achievements,reviews,forums}/page.tsx` | 17 |
| Base Entity Forms | `src/components/forms/{StudentForm,TeacherForm,ParentForm,ClassForm,SubjectForm,LessonForm,ExamForm,AssignmentForm,ResultForm,AttendanceForm,EventForm,AnnouncementForm}.tsx` | 12 |
| LMS Forms | `src/components/forms/{CourseForm,ModuleForm,LmsLessonForm,EnrollmentForm,QuizForm,QuestionForm,QuestionBankForm}.tsx` | 7 |
| Other Forms | `src/components/forms/{BadgeForm,ReviewCardForm,ThreadForm}.tsx` | 3 |
| Validation | `src/lib/formValidationSchemas.ts` | 1 |
| Messages | `messages/en.json`, `messages/ms.json` | 2 |

### Implementation Details

**Entity List Pages**:
- Each page has table column definitions with hardcoded header labels
- Translate column headers: "Name", "Email", "Phone", "Grade", etc.
- Translate page titles: "All Students", "All Teachers", etc.
- Translate filter labels and options

**Form Components**:
- Each form has field labels, placeholders, and submit button text
- Use `useTranslations('forms')` in client-side form components
- Translate field labels: "First Name", "Last Name", "Email Address", etc.
- Translate select option labels: "Select a subject", "Choose grade", etc.
- Translate submit buttons: "Create Student", "Update Teacher", etc.

**Form Validation** (`formValidationSchemas.ts`):
- Zod schemas currently use hardcoded English error messages
- Strategy: Keep schemas language-neutral, translate error messages at the component level using `t()` function
- Example: `z.string().min(1)` produces generic error; component maps error key to translated message

### Bahasa Malaysia Translations (entities namespace, key examples)

| Key (entities.students.) | English           | Bahasa Malaysia       |
| ------------------------ | ----------------- | --------------------- |
| title                    | All Students      | Semua Pelajar         |
| name                     | Name              | Nama                  |
| email                    | Email             | E-mel                 |
| phone                    | Phone             | Telefon               |
| grade                    | Grade             | Gred                  |
| class                    | Class             | Kelas                 |
| address                  | Address           | Alamat                |
| birthday                 | Birthday          | Hari Lahir            |
| bloodType                | Blood Type        | Jenis Darah           |
| sex                      | Sex               | Jantina               |

### Verification Criteria

- [ ] All 17 entity list pages display translated column headers in Bahasa Malaysia
- [ ] All page titles translated (e.g., "Semua Pelajar", "Semua Guru")
- [ ] All form field labels translated in both locales
- [ ] Form validation error messages display in active locale
- [ ] Select dropdowns show translated option labels
- [ ] Submit buttons display translated text

---

## TAG-6: LMS Components Translation

**Priority**: Secondary Goal
**Dependencies**: TAG-5
**Objective**: Translate all LMS (Learning Management System) components including courses, modules, quizzes, and analytics.

### Files to Modify

| Category | Files | Count |
| -------- | ----- | ----- |
| Course Pages | `src/app/(dashboard)/list/courses/page.tsx`, `[id]/page.tsx`, `[id]/[lessonId]/page.tsx`, `[id]/quiz/[quizId]/page.tsx`, `[id]/analytics/page.tsx` | ~5 |
| LMS Components | `CourseProgressBar`, `EnrollButton`, `ModuleList`, `LessonCard`, `LessonCompleteButton`, `QuizCard`, `QuizTimer`, `QuizResults`, `QuizQuestion`, `QuizTakingClient`, `EnrolledCourses` | 11 |
| LMS Analytics | `LmsProgressOverview`, `QuizPerformanceTrend(Container)`, `LearningActivityHeatmap(Container)`, `CourseEngagementOverview(Container)`, `ClassQuizAnalytics(Container)`, `LmsAdoptionMetrics`, `LmsEngagementHeatmap`, `CourseAnalyticsContainer`, `CompletionRateChart`, `QuizScoreDistribution`, `CourseActivityTimeline`, `AtRiskStudentsAlert`, `AtRiskStudentsList`, `PreClassEngagementReport` | ~16 |
| LMS Parent Widgets | `ChildLmsProgressCard`, `ChildLearningActivity` | 2 |
| Forum Components | `src/app/(dashboard)/list/forums/page.tsx` and related components | ~3 |
| Messages | `messages/en.json`, `messages/ms.json` | 2 |

### Bahasa Malaysia Translations (lms namespace, key examples)

| Key               | English                | Bahasa Malaysia          |
| ----------------- | ---------------------- | ------------------------ |
| courses.title     | Courses                | Kursus                   |
| courses.enroll    | Enroll                 | Daftar                   |
| courses.progress  | Progress               | Kemajuan                 |
| modules.title     | Modules                | Modul                    |
| quizzes.title     | Quizzes                | Kuiz                     |
| quizzes.start     | Start Quiz             | Mula Kuiz                |
| quizzes.submit    | Submit                 | Hantar                   |
| quizzes.timeLeft  | Time Left              | Masa Berbaki             |
| quizzes.score     | Score                  | Markah                   |
| quizzes.passed    | Passed                 | Lulus                    |
| quizzes.failed    | Failed                 | Gagal                    |
| analytics.title   | Analytics              | Analitik                 |
| analytics.atRisk  | At-Risk Students       | Pelajar Berisiko         |
| enrollment.status | Enrollment Status      | Status Pendaftaran       |
| forums.title      | Discussion Forums      | Forum Perbincangan       |
| forums.newThread  | New Thread             | Topik Baharu             |
| forums.reply      | Reply                  | Balas                    |

### Verification Criteria

- [ ] Course list page fully translated
- [ ] Course detail page (modules, lessons, quizzes) fully translated
- [ ] Quiz interface (timer, questions, results) fully translated
- [ ] LMS analytics dashboards fully translated
- [ ] Forum pages and thread components fully translated
- [ ] Enroll/Unenroll buttons show correct locale text
- [ ] Progress bars and completion indicators use translated labels

---

## TAG-7: Gamification, Spaced Repetition, and Remaining Components

**Priority**: Secondary Goal
**Dependencies**: TAG-6
**Objective**: Translate all remaining components including gamification, spaced repetition, and any untranslated components.

### Files to Modify

| Category | Files | Count |
| -------- | ----- | ----- |
| Gamification Components | `GamificationCard(Container)`, `RecentBadges(Container)`, `BadgeGallery`, `XpTransactionHistory`, `StreakCalendar`, `LevelProgressBar`, `ClassLeaderboard(Container)`, `ChildGamificationStats`, `GamificationAdoptionMetrics` | ~11 |
| Gamification Pages | `src/app/(dashboard)/list/achievements/page.tsx`, `src/app/(dashboard)/list/badges/page.tsx` | 2 |
| Spaced Repetition | `ReviewQueue`, `ReviewSessionClient`, `ReviewSessionContainer`, `SubjectMasteryMeter(Container)`, `CardProgressionChart(Container)`, `ReviewStreakCalendar(Container)`, `ClassReviewAnalytics(Container)`, `ReviewAdoptionMetrics(Container)`, `ChildReviewActivity(Container)`, `PreClassReviewReport(Container)` | ~14 |
| Spaced Repetition Pages | `src/app/(dashboard)/list/reviews/page.tsx` and subpages | ~3 |
| Messages | `messages/en.json`, `messages/ms.json` | 2 |

### Bahasa Malaysia Translations (gamification namespace, key examples)

| Key              | English             | Bahasa Malaysia       |
| ---------------- | ------------------- | --------------------- |
| achievements     | Achievements        | Pencapaian            |
| badges           | Badges              | Lencana               |
| xp.points        | XP Points           | Mata XP               |
| xp.history       | XP History          | Sejarah XP            |
| leaderboard      | Leaderboard         | Papan Pendahulu       |
| streaks.current  | Current Streak      | Streak Semasa         |
| streaks.longest  | Longest Streak      | Streak Terpanjang     |
| level            | Level               | Tahap                 |

### Bahasa Malaysia Translations (spaced_repetition namespace, key examples)

| Key              | English               | Bahasa Malaysia         |
| ---------------- | --------------------- | ----------------------- |
| reviews.title    | Spaced Repetition     | Ulangkaji Berjarak      |
| reviews.start    | Start Review          | Mula Ulangkaji          |
| cards.mastered   | Mastered              | Dikuasai                |
| cards.learning   | Learning              | Sedang Belajar          |
| cards.new        | New                   | Baharu                  |
| sessions.summary | Session Summary       | Ringkasan Sesi          |
| analytics.mastery| Subject Mastery       | Penguasaan Mata Pelajaran |

### Verification Criteria

- [ ] Achievements page fully translated in both locales
- [ ] Badge gallery and admin badge management translated
- [ ] XP transaction history displays in active locale
- [ ] Leaderboard component fully translated
- [ ] Spaced repetition review interface fully translated
- [ ] Review analytics dashboards fully translated
- [ ] Zero hardcoded English strings remain in any component
- [ ] Full component audit completed (grep for remaining hardcoded strings)

---

## TAG-8: Bahasa Malaysia Professional Translation Review

**Priority**: Final Goal
**Dependencies**: TAG-7
**Objective**: Review, complete, and professionally polish all Bahasa Malaysia translations for accuracy, context, and natural reading.

### Tasks

| Task | Description |
| ---- | ----------- |
| Completeness Audit | Verify every key in `en.json` has a corresponding entry in `ms.json` |
| Context Review | Ensure translations are contextually appropriate for school/education domain |
| Consistency Check | Verify consistent use of terminology across all namespaces |
| Natural Language | Ensure translations read naturally in Bahasa Malaysia (not word-for-word translations) |
| Layout Testing | Test all pages in `ms` locale for text overflow, truncation, or layout breaking |
| Educational Terms | Verify correct Bahasa Malaysia educational terminology (e.g., "peperiksaan" not "ujian" for formal exams) |

### Translation Quality Checklist

- [ ] All keys in `en.json` have corresponding translations in `ms.json`
- [ ] No empty string values in `ms.json`
- [ ] Educational terminology is accurate (use Malaysian Ministry of Education standards)
- [ ] UI labels are concise and fit within their containers
- [ ] Plural forms handled correctly where applicable
- [ ] Button labels are action-oriented in Bahasa Malaysia
- [ ] Error messages are clear and helpful in Bahasa Malaysia
- [ ] Formal tone used throughout (not colloquial Bahasa Malaysia)

### Verification Criteria

- [ ] Professional review of all translations completed
- [ ] All pages tested visually in Bahasa Malaysia locale
- [ ] No text overflow or truncation issues in `ms` locale
- [ ] Consistent terminology across the entire application
- [ ] Natural, professional Bahasa Malaysia reading experience

---

## TAG-9: Date/Number Formatting and Final Polish

**Priority**: Final Goal
**Dependencies**: TAG-8
**Objective**: Implement locale-aware date and number formatting, perform final cross-browser testing, and ensure TypeScript compilation is clean.

### Files to Modify

| File | Change Description |
| ---- | ------------------ |
| All components displaying dates | Use `useFormatter` or `Intl.DateTimeFormat` with active locale |
| All components displaying numbers | Use `useFormatter` or `Intl.NumberFormat` with active locale |
| `messages/en.json` | Final review and completion |
| `messages/ms.json` | Final review and completion |

### Implementation Details

**Date Formatting**:
- Use `next-intl`'s `useFormatter` hook for client components
- Use `getFormatter` from `next-intl/server` for server components
- Format patterns: short date, long date, relative time
- Configure `moment` locale to match active locale (for BigCalendar compatibility)

**Number Formatting**:
- Grades, scores, percentages: Use `Intl.NumberFormat` with locale
- Student counts, statistics: Use `useFormatter().number()` from next-intl

**Final Testing Matrix**:

| Test Area | en Locale | ms Locale |
| --------- | --------- | --------- |
| Date display (short) | 02/23/2026 | 23/02/2026 |
| Date display (long) | February 23, 2026 | 23 Februari 2026 |
| Number formatting | 1,234.56 | 1,234.56 |
| Calendar month names | January, February... | Januari, Februari... |
| Calendar day names | Mon, Tue, Wed... | Isn, Sel, Rab... |

### Verification Criteria

- [ ] All date displays use locale-aware formatting
- [ ] Calendar components (BigCalendar, EventCalendar) show localized month/day names
- [ ] Number formatting follows locale conventions
- [ ] `npm run build` succeeds with zero TypeScript errors
- [ ] `npm run lint` passes with zero errors
- [ ] All pages render correctly in both locales across Chrome, Firefox, Safari
- [ ] No console errors related to missing translations or i18n configuration
- [ ] Full regression test: all 4 dashboards, all 17 list pages, all forms

---

## Risks and Mitigation

| Risk | Impact | Mitigation |
| ---- | ------ | ---------- |
| next-intl incompatibility with Next.js 16 | Blocks entire SPEC | Verify compatibility before TAG-1; fallback to `next-intl@latest` canary if needed |
| Clerk middleware conflict | Auth breaks | Test middleware composition thoroughly in TAG-1; keep rollback branch |
| Server/Client component boundary issues | Runtime errors | Follow next-intl docs for Server vs Client translation patterns |
| Translation key mismatches | Missing text | Implement JSON key validation script; use fallback to English (REQ-E5) |
| Text overflow in BM locale | Layout breaking | Test layouts in TAG-8; BM text is generally similar length to English |
| Performance impact of loading all messages | Slow page load | Use next-intl's message splitting if bundle size becomes an issue |

---

## Architecture Decision Records

### ADR-1: Cookie-Based Routing vs URL Prefix

**Decision**: Cookie-based routing with `NEXT_LOCALE` cookie
**Rationale**: No URL structure changes required, simpler migration, no impact on existing route access control
**Trade-off**: URL sharing does not include locale (users cannot share locale-specific URLs)
**Status**: Confirmed by user

### ADR-2: next-intl vs react-intl vs next-translate

**Decision**: next-intl
**Rationale**: Best Next.js App Router support, Server Component compatibility, active maintenance, TypeScript-first
**Status**: Confirmed by user

### ADR-3: Translation File Structure

**Decision**: Single `en.json` and `ms.json` with namespaced keys
**Rationale**: Simpler to manage than per-namespace files; namespace prefixes prevent key collisions
**Trade-off**: Larger file size per locale (mitigated by message splitting if needed)
**Status**: Decided
