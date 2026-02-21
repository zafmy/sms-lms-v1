# Project Structure: Hua Readwise

## Directory Tree

```
/hua-readwise-v1
├── src/
│   ├── app/                          # Next.js App Router root
│   │   ├── (dashboard)/              # Route group: protected dashboard routes
│   │   │   ├── admin/                # Admin role dashboard page
│   │   │   ├── teacher/              # Teacher role dashboard page
│   │   │   ├── student/              # Student role dashboard page
│   │   │   ├── parent/               # Parent role dashboard page
│   │   │   ├── list/                 # CRUD list pages (12 entity sub-routes)
│   │   │   │   ├── announcements/
│   │   │   │   ├── assignments/
│   │   │   │   ├── attendance/
│   │   │   │   ├── classes/
│   │   │   │   ├── events/
│   │   │   │   ├── exams/
│   │   │   │   ├── lessons/
│   │   │   │   ├── parents/
│   │   │   │   ├── results/
│   │   │   │   ├── students/
│   │   │   │   ├── subjects/
│   │   │   │   ├── teachers/
│   │   │   │   ├── courses/                      # LMS: course list and detail routes
│   │   │   │   │   ├── page.tsx                  # Course listing page
│   │   │   │   │   └── [id]/                     # Course detail and nested routes
│   │   │   │   │       ├── page.tsx              # Course detail: module/lesson tree
│   │   │   │   │       ├── lesson/
│   │   │   │   │       │   └── [lessonId]/
│   │   │   │   │       │       └── page.tsx      # Individual lesson view
│   │   │   │   │       └── quiz/
│   │   │   │   │           └── [quizId]/
│   │   │   │   │               ├── page.tsx      # Quiz-taking interface
│   │   │   │   │               └── results/
│   │   │   │   │                   └── page.tsx  # Quiz attempt results
│   │   │   │   ├── enrollments/                  # LMS: enrollment management
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── achievements/                 # Gamification: student achievements page
│   │   │   │   │   └── page.tsx                  # Badge gallery, XP history, streak calendar, level progress
│   │   │   │   └── loading.tsx       # Shared loading skeleton for list pages
│   │   │   └── layout.tsx            # Dashboard layout: sidebar + navbar wrapper
│   │   ├── [[...sign-in]]/           # Catch-all: Clerk authentication pages
│   │   ├── api/
│   │   │   └── export/               # CSV export API route handler
│   │   ├── favicon.ico
│   │   ├── globals.css               # Tailwind v4 CSS-first configuration
│   │   └── layout.tsx                # Root layout: ClerkProvider, ToastContainer
│   ├── components/                   # 59 React components
│   │   ├── forms/                    # 20 entity form components
│   │   │   ├── AnnouncementForm.tsx
│   │   │   ├── AssignmentForm.tsx
│   │   │   ├── AttendanceForm.tsx
│   │   │   ├── ClassForm.tsx
│   │   │   ├── EventForm.tsx
│   │   │   ├── ExamForm.tsx
│   │   │   ├── LessonForm.tsx
│   │   │   ├── ParentForm.tsx
│   │   │   ├── ResultForm.tsx
│   │   │   ├── StudentForm.tsx
│   │   │   ├── SubjectForm.tsx
│   │   │   ├── TeacherForm.tsx
│   │   │   ├── CourseForm.tsx        # LMS: course create/update form
│   │   │   ├── ModuleForm.tsx        # LMS: module create/update form
│   │   │   ├── LmsLessonForm.tsx     # LMS: lesson create/update form
│   │   │   ├── EnrollmentForm.tsx    # LMS: enrollment create form
│   │   │   ├── QuizForm.tsx          # LMS: quiz create/update form
│   │   │   ├── QuestionForm.tsx      # LMS: question create/update form
│   │   │   ├── QuestionBankForm.tsx  # LMS: question bank create form
│   │   │   └── BadgeForm.tsx         # Gamification: admin badge create/update form
│   │   ├── Announcements.tsx         # Announcements feed widget
│   │   ├── AssignmentsDue.tsx        # Student upcoming assignments widget
│   │   ├── AttendanceChart.tsx       # Bar chart for attendance data
│   │   ├── AttendanceChartContainer.tsx  # Server Component: fetches attendance data
│   │   ├── AttendanceHeatmap.tsx     # Calendar heatmap visualization
│   │   ├── BigCalendar.tsx           # React Big Calendar wrapper (Client Component)
│   │   ├── BigCalendarContainer.tsx  # Server Component: fetches lesson events
│   │   ├── ChildGradeOverview.tsx    # Parent dashboard: child grade summary
│   │   ├── ChildQuickStats.tsx       # Parent dashboard: child attendance stats
│   │   ├── ClassAttendanceOverview.tsx  # Teacher dashboard: class attendance
│   │   ├── ClassOccupancyChart.tsx   # Bar chart: class enrollment vs capacity
│   │   ├── ClassOccupancyChartContainer.tsx  # Server Component: fetches class data
│   │   ├── CountChart.tsx            # Radial bar chart: gender breakdown
│   │   ├── CountChartContainer.tsx   # Server Component: fetches count data
│   │   ├── EventCalendar.tsx         # Mini calendar with event markers
│   │   ├── EventCalendarContainer.tsx  # Server Component: fetches event data
│   │   ├── EventList.tsx             # Upcoming events list widget
│   │   ├── ExportButton.tsx          # CSV export trigger button (Client Component)
│   │   ├── FormContainer.tsx         # Server Component: resolves form type + data
│   │   ├── FormModal.tsx             # Client Component: modal wrapper for forms
│   │   ├── GradeSummary.tsx          # Student/teacher grade summary widget
│   │   ├── InputField.tsx            # Reusable controlled input with label
│   │   ├── ListFilter.tsx            # Multi-criteria filter UI (Client Component)
│   │   ├── Menu.tsx                  # Sidebar navigation menu
│   │   ├── MyStudentsOverview.tsx    # Teacher dashboard: assigned students list
│   │   ├── Navbar.tsx                # Top navigation bar with user info
│   │   ├── NotificationBell.tsx      # Notification icon with unread badge
│   │   ├── NotificationDropdown.tsx  # Notification list dropdown
│   │   ├── Pagination.tsx            # Page navigation component
│   │   ├── PendingGrading.tsx        # Teacher dashboard: ungraded items list
│   │   ├── PrintButton.tsx           # Browser print trigger (Client Component)
│   │   ├── RecentActivity.tsx        # Dashboard activity feed widget
│   │   ├── RecentGrades.tsx          # Student recent grades widget
│   │   ├── ReportCardTable.tsx       # Grade report table with averages
│   │   ├── StudentAttendanceCard.tsx # Student attendance rate card
│   │   ├── SubjectGrades.tsx         # Per-subject grade breakdown
│   │   ├── Table.tsx                 # Generic data table with column config
│   │   ├── TableSearch.tsx           # Search input bound to URL query params
│   │   ├── TodaySchedule.tsx         # Teacher/student today's lessons widget
│   │   ├── UpcomingExams.tsx         # Upcoming exam dates widget
│   │   ├── CourseProgressBar.tsx     # LMS: student course completion percentage bar
│   │   ├── EnrolledCourses.tsx       # LMS: student dashboard enrolled courses widget
│   │   ├── EnrollButton.tsx          # LMS: student self-enrollment action button
│   │   ├── ModuleList.tsx            # LMS: course detail module and lesson tree
│   │   ├── LessonCard.tsx            # LMS: lesson summary card in module list
│   │   ├── LessonCompleteButton.tsx  # LMS: button to mark a lesson as completed
│   │   ├── QuizCard.tsx              # LMS: quiz summary card with attempt info
│   │   ├── QuizQuestion.tsx          # LMS: individual question renderer in quiz
│   │   ├── QuizResults.tsx           # LMS: attempt result breakdown component
│   │   ├── QuizTakingClient.tsx      # LMS: client wrapper managing quiz attempt state
│   │   ├── QuizTimer.tsx             # LMS: countdown timer with auto-submit on expiry
│   │   ├── UserCard.tsx              # Dashboard stat card with icon
│   │   ├── LmsProgressOverview.tsx     # LMS: student progress overview (4-metric grid)
│   │   ├── QuizPerformanceTrendContainer.tsx  # LMS: server-side quiz data fetcher
│   │   ├── QuizPerformanceTrend.tsx    # LMS: quiz score line chart (Recharts)
│   │   ├── LearningActivityHeatmapContainer.tsx  # LMS: server-side heatmap data fetcher
│   │   ├── LearningActivityHeatmap.tsx # LMS: calendar-style activity heatmap
│   │   ├── CourseEngagementOverviewContainer.tsx  # LMS: teacher course engagement data fetcher
│   │   ├── CourseEngagementOverview.tsx # LMS: per-course engagement metrics display
│   │   ├── PreClassEngagementReport.tsx # LMS: teacher pre-class student activity report
│   │   ├── AtRiskStudentsAlert.tsx     # LMS: teacher at-risk students warning widget
│   │   ├── ClassQuizAnalyticsContainer.tsx  # LMS: teacher quiz difficulty data fetcher
│   │   ├── ClassQuizAnalytics.tsx      # LMS: per-quiz difficulty and most-missed questions
│   │   ├── ChildLmsProgressCard.tsx    # LMS: parent per-child LMS progress card
│   │   ├── ChildLearningActivity.tsx   # LMS: parent per-child activity feed
│   │   ├── LmsAdoptionMetrics.tsx      # LMS: admin school-wide adoption metrics
│   │   ├── GamificationCard.tsx        # Gamification: student XP/level/streak widget (Client)
│   │   ├── GamificationCardContainer.tsx  # Gamification: fetches StudentGamification data (Server)
│   │   ├── RecentBadges.tsx            # Gamification: 3 most recently earned badges widget (Client)
│   │   ├── RecentBadgesContainer.tsx   # Gamification: fetches recent StudentBadge records (Server)
│   │   ├── BadgeGallery.tsx            # Gamification: full badge grid (earned in color, locked grayed)
│   │   ├── XpTransactionHistory.tsx    # Gamification: paginated XP transaction history table
│   │   ├── StreakCalendar.tsx           # Gamification: 30-day activity calendar visualization
│   │   ├── LevelProgressBar.tsx        # Gamification: XP progress bar toward next level
│   │   ├── ClassLeaderboard.tsx        # Gamification: teacher class leaderboard ranked by XP (Client)
│   │   ├── ClassLeaderboardContainer.tsx  # Gamification: fetches class gamification records (Server)
│   │   ├── ChildGamificationStats.tsx  # Gamification: parent per-child level/XP/streak stats
│   │   └── GamificationAdoptionMetrics.tsx  # Gamification: admin adoption metrics widget
│   └── lib/                          # Utilities and business logic
│       ├── actions.ts                # 62+ Server Actions for all CRUD operations; includes selfEnrollStudent and unenrollSelf added for SPEC-LMS-002
│       ├── csvUtils.ts               # CSV generation utilities
│       ├── data.ts                   # Static data: menu items, calendar events
│       ├── formValidationSchemas.ts  # Zod schemas for all entity forms
│       ├── gradeUtils.ts             # Grade calculation and aggregation logic
│       ├── notificationActions.ts    # Notification creation and update actions
│       ├── prisma.ts                 # Singleton Prisma client instance
│       ├── quizUtils.ts              # LMS: auto-grading engine (pure functions)
│       ├── lmsAnalyticsUtils.ts    # LMS: pure analytics functions (9 functions, no Prisma)
│       ├── gamificationUtils.ts    # Gamification: pure utility functions (XP, level, streak, badge logic)
│       ├── gamificationActions.ts  # Gamification: processGamificationEvent engine and badge CRUD Server Actions
│       ├── settings.ts               # Route access config, pagination constants
│       └── utils.ts                  # Schedule and date utility functions
├── prisma/
│   ├── schema.prisma                 # 28 Prisma models, 8 enums (Day, UserSex, XpSource, + 5 LMS enums), NotificationType enum with GAMIFICATION
│   ├── seed.ts                       # Database seed script (includes 10 default gamification badges)
│   └── migrations/                   # Prisma migration history
├── public/                           # Static assets (43+ files)
│   └── [images, icons, avatars]
├── docs/                             # Project documentation
├── .moai/                            # MoAI configuration and SPEC files
│   ├── config/                       # Agent and quality configuration
│   ├── specs/                        # SPEC documents
│   └── project/                      # Project documentation (this directory)
├── .claude/                          # Claude Code configuration
│   ├── agents/                       # Custom agent definitions
│   ├── rules/                        # Project coding rules
│   └── skills/                       # Claude skills
├── docker-compose.yml                # Local development Docker setup
├── Dockerfile                        # Container build definition
├── eslint.config.mjs                 # ESLint v9 flat config
├── next.config.mjs                   # Next.js configuration
├── package.json                      # Dependencies and scripts
├── postcss.config.mjs                # PostCSS configuration for Tailwind v4
└── tsconfig.json                     # TypeScript compiler configuration
```

## Module Organization

### `src/app/` - Next.js App Router

The `app` directory follows Next.js App Router conventions. All routes are defined by their file-system path.

**`(dashboard)/`** is a route group that applies the dashboard `layout.tsx` to all nested routes without adding a URL segment. This layout renders the `Menu` sidebar on the left and the `Navbar` at the top, wrapping the page content. All routes within this group require authentication via Clerk middleware.

**`(dashboard)/[role]/`** directories each contain a single `page.tsx` that renders the role-specific dashboard. Each dashboard page is a Server Component that fetches data and renders the appropriate widget grid. The four roles each have distinct widget compositions suited to their use cases.

**`(dashboard)/list/`** contains 12 sub-directories, one per managed entity. Each entity directory contains a `page.tsx` with server-side data fetching, URL parameter parsing for search and filter, and a `[id]/` sub-directory for detail pages (students and teachers). The `loading.tsx` at the list level provides a shared loading skeleton.

**`[[...sign-in]]/`** is a catch-all segment that renders Clerk's authentication UI. The double brackets make it an optional catch-all, handling both `/` and `/sign-in` paths.

**`api/export/`** contains a single `route.ts` that handles GET requests for CSV export. It accepts query parameters to determine which data to export and streams the response as a downloadable file.

### `src/components/` - React Components

Components are organized at a single flat level, with the `forms/` subdirectory as the only grouping.

**`forms/`** contains one form component per entity (12 total). Each form component is a Client Component using React Hook Form with Zod validation. Forms are used inside `FormModal` and receive `type` (`create` or `update`) and optional `data` props. On submit, they call the appropriate Server Action from `actions.ts`.

**Dashboard widgets** are Server Components by default, fetching their own data from Prisma. The naming convention `[WidgetName]Container.tsx` indicates a Server Component wrapper that fetches data and passes it to a `[WidgetName].tsx` Client Component (used when the visualization requires client-side rendering, such as Recharts charts).

**Common UI components** (`Table`, `Pagination`, `TableSearch`, `InputField`, `FormModal`, `FormContainer`) are shared across all entity list pages and forms. `FormContainer` is a Server Component that resolves which form to render based on a `table` prop, fetching any required related data before rendering the appropriate form inside `FormModal`.

### `src/lib/` - Business Logic

**`actions.ts`** is the primary business logic file containing over 62 Server Actions. Each entity has `create[Entity]`, `update[Entity]`, and `delete[Entity]` actions. Actions validate input with Zod, perform authorization checks using Clerk's `auth()`, interact with Prisma, call `revalidatePath` to invalidate Next.js cache, and return typed state objects consumed by form components. The 22 LMS Server Actions added in SPEC-LMS-001 cover course, module, lesson, enrollment, quiz, and question management. Quiz submission uses Prisma `$transaction` for atomic writes. SPEC-LMS-002 added `selfEnrollStudent` and `unenrollSelf` for student self-service enrollment management. SPEC-LMS-006 added hooks in `markLessonComplete` and quiz submission to call `processGamificationEvent` from `gamificationActions.ts` after successful writes.

**`gamificationUtils.ts`** contains the gamification engine as pure functions with no Prisma imports or side effects. Exports include XP award calculation helpers, `computeLevel` for determining the current level from total XP using the `LEVEL_THRESHOLDS` array, `computeStreakUpdate` for evaluating streak continuation or reset based on UTC calendar dates, and `evaluateBadgeEligibility` for checking whether a student's current state meets badge award criteria. The file also exports XP amount constants and the `LEVEL_THRESHOLDS` array. Follows the same pattern as `lmsAnalyticsUtils.ts` and `gradeUtils.ts`.

**`gamificationActions.ts`** contains the `processGamificationEvent` Server Action that orchestrates all gamification side effects in a single `prisma.$transaction` call: upserting the `StudentGamification` record, creating `XpTransaction` records, updating streak counters, checking for level-ups, evaluating badge eligibility, creating `StudentBadge` records for newly earned badges, and creating in-app notifications for badge awards and level-ups. Also exports `createBadge`, `updateBadge`, and `deleteBadge` actions for admin badge management.

**`quizUtils.ts`** contains the LMS auto-grading engine as pure functions with no side effects. The primary export accepts a `QuizAttempt` with associated `QuestionResponse` records and returns a scored result. Multiple-choice and true/false questions are graded automatically by comparing selected `AnswerOption` correctness flags. Short answer and essay questions are flagged for manual review. The engine supports three scoring policies (`BEST`, `LATEST`, `AVERAGE`) applied at the `Quiz` level when computing the canonical score for a student's enrollment.

**`formValidationSchemas.ts`** exports Zod schemas for each of the 12 entity forms. Schemas are shared between client-side form validation (via `@hookform/resolvers/zod`) and server-side action validation to ensure consistent validation rules.

**`prisma.ts`** exports a singleton Prisma client using the standard Next.js pattern of storing the instance on `global` to prevent connection exhaustion during hot reloads in development.

**`settings.ts`** exports `routeAccessMap` (a map of URL patterns to allowed roles for middleware authorization), `ITEM_PER_PAGE` (pagination constant), and other configuration values used across the application.

**`gradeUtils.ts`** contains pure functions for calculating per-subject averages, overall student averages, letter grades, and grade trend data from raw `Result` records.

**`utils.ts`** contains schedule-related utilities, primarily for transforming Prisma `Lesson` records into the event format required by React Big Calendar.

### `prisma/` - Database Schema

**`schema.prisma`** defines 28 models: the original 13 (`Admin`, `Student`, `Teacher`, `Parent`, `Class`, `Subject`, `Lesson`, `Exam`, `Assignment`, `Result`, `Attendance`, `Event`, `Announcement`) plus 11 LMS models added in SPEC-LMS-001 (`Course`, `Module`, `LmsLesson`, `LessonProgress`, `Enrollment`, `Quiz`, `Question`, `QuestionBank`, `AnswerOption`, `QuizAttempt`, `QuestionResponse`) plus 4 gamification models added in SPEC-LMS-006 (`StudentGamification`, `Badge`, `StudentBadge`, `XpTransaction`). Nine enums are defined: the original two (`Day`, `UserSex`) plus six LMS enums (`CourseStatus`, `ContentType`, `ProgressStatus`, `EnrollmentStatus`, `QuestionType`, `ScoringPolicy`) plus one gamification enum (`XpSource`). The `NotificationType` enum was extended with a `GAMIFICATION` value. Clerk user IDs are stored as string fields on `Admin`, `Student`, `Teacher`, and `Parent` models for authorization lookups.

## Key File Locations

| File | Purpose |
|------|---------|
| `/src/lib/actions.ts` | All Server Actions for CRUD operations and business logic |
| `/src/lib/formValidationSchemas.ts` | Zod validation schemas for all entity forms |
| `/src/lib/prisma.ts` | Singleton Prisma client (import this, never instantiate directly) |
| `/src/lib/quizUtils.ts` | LMS auto-grading engine: pure functions for scoring quiz attempts |
| `/src/lib/lmsAnalyticsUtils.ts` | LMS analytics: 9 pure functions for progress, engagement, quiz, and heatmap computations |
| `/src/lib/gamificationUtils.ts` | Gamification: pure utility functions for XP awards, level computation, streak evaluation, and badge eligibility |
| `/src/lib/gamificationActions.ts` | Gamification: `processGamificationEvent` server action engine and badge CRUD actions (`createBadge`, `updateBadge`, `deleteBadge`) |
| `/src/lib/settings.ts` | Route access control map and pagination configuration |
| `/src/lib/gradeUtils.ts` | Grade calculation and report card aggregation functions |
| `/src/lib/notificationActions.ts` | In-app notification creation and management |
| `/src/app/globals.css` | Tailwind v4 CSS-first configuration and global styles |
| `/src/app/layout.tsx` | Root layout: ClerkProvider, ToastContainer setup |
| `/src/app/(dashboard)/layout.tsx` | Dashboard shell: Menu sidebar and Navbar |
| `/src/components/FormContainer.tsx` | Server Component resolving dynamic form rendering |
| `/prisma/schema.prisma` | Complete database schema: 24 models, 8 enums |
| `/next.config.mjs` | Next.js configuration including image domains |
| `/eslint.config.mjs` | ESLint v9 flat config with TypeScript and Next.js rules |

## Naming Conventions

**Files**: kebab-case for all non-component files (e.g., `form-validation-schemas.ts`, `grade-utils.ts`). Note: current files use camelCase (e.g., `gradeUtils.ts`) - new files should follow kebab-case per project standards.

**Components**: PascalCase for all React component files (e.g., `BigCalendar.tsx`, `ReportCardTable.tsx`).

**Server/Client split**: Files ending in `Container.tsx` are Server Components that fetch data. Files with the same base name without `Container` are Client Components that render the data. Example: `AttendanceChartContainer.tsx` (server, fetches) and `AttendanceChart.tsx` (client, renders Recharts).

**Forms**: All form files are in `src/components/forms/` and named `[Entity]Form.tsx` in PascalCase matching the Prisma model name.

**Actions**: Server Actions follow the pattern `create[Entity]`, `update[Entity]`, `delete[Entity]` in `actions.ts`.

## Architecture

### Rendering Model

The application defaults to **React Server Components** (RSC) for all pages and data-fetching components. Client Components are used only when browser APIs, event handlers, or React state are required (form submissions, charts, calendars, modals, notifications).

**Server Components** handle: data fetching from Prisma, access control checks, page-level layout, and passing data as props to Client Components.

**Client Components** handle: interactive forms (React Hook Form), data visualization (Recharts, React Big Calendar), modal state, notification interactions, and client-side filtering.

### Data Flow

1. User navigates to a list page (Server Component).
2. Server Component reads URL search params for filters, pagination, and search terms.
3. Server Component queries Prisma with the parsed parameters.
4. Data is passed as props to `Table` and other display components.
5. User interacts with a form (opens modal via `FormModal`).
6. `FormContainer` (Server Component) resolves the form type and fetches any required related data (e.g., available classes for a student form).
7. The appropriate form component (Client Component) renders inside the modal.
8. On submit, the form calls a Server Action.
9. The Server Action validates input, performs the database operation, calls `revalidatePath`, and returns a result state.
10. The form component displays success or error feedback via React Toastify.
