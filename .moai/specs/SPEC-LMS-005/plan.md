# SPEC-LMS-005: Implementation Plan

| Field    | Value         |
| -------- | ------------- |
| SPEC     | SPEC-LMS-005  |
| Title    | LMS Analytics Dashboard |
| Priority | Medium        |

---

## Overview

This implementation plan is organized into 3 milestones, ordered by dependency. Milestone 1 creates the foundational analytics utility module and data-fetching patterns. Milestone 2 adds dashboard widgets to all three role dashboards. Milestone 3 builds the full course analytics page with charts and heatmap.

### Dependencies

- **LMS Phase 1 (SPEC-LMS-001) must be complete.** All LMS models must exist in the schema and contain data. The implementation queries Course, Enrollment, LessonProgress, QuizAttempt, Module, LmsLesson, and Quiz tables.
- **Recharts 3.7+ must be installed.** Confirmed present in the project (`"recharts": "^3.7.0"` in package.json).
- **No new Prisma migrations required.** All analytics are computed from existing model fields.

---

## Milestone 1: Analytics Utility Module + Data Layer

**Priority**: Primary Goal (must complete first; all other milestones depend on this)

### Objective

Create the `analyticsUtils.ts` pure-function module and establish the data-fetching patterns that all analytics components will use.

### Tasks

| # | Task | File(s) | REQ |
|---|------|---------|-----|
| 1.1 | Create `analyticsUtils.ts` with all type definitions and the `AT_RISK_THRESHOLD_DAYS` constant | `src/lib/analyticsUtils.ts` | REQ-LMS-049 |
| 1.2 | Implement `calculateCourseCompletionRate` | `src/lib/analyticsUtils.ts` | REQ-LMS-043, REQ-LMS-044 |
| 1.3 | Implement `calculateStudentProgress` | `src/lib/analyticsUtils.ts` | REQ-LMS-043 |
| 1.4 | Implement `calculateQuizScoreDistribution` with 5 fixed buckets (0-20%, 21-40%, 41-60%, 61-80%, 81-100%) | `src/lib/analyticsUtils.ts` | REQ-LMS-044, REQ-LMS-046 |
| 1.5 | Implement `identifyAtRiskStudents` with configurable threshold and reference date parameters | `src/lib/analyticsUtils.ts` | REQ-LMS-048 |
| 1.6 | Implement `calculateEngagementByDay` producing daily totals for a date range | `src/lib/analyticsUtils.ts` | REQ-LMS-047 |
| 1.7 | Implement `generatePreClassReport` determining which students engaged since a given date | `src/lib/analyticsUtils.ts` | REQ-LMS-044 |
| 1.8 | Write unit tests for all `analyticsUtils.ts` functions covering normal cases, empty data, edge cases (threshold boundaries, zero lessons, zero attempts) | `src/lib/__tests__/analyticsUtils.test.ts` | REQ-LMS-049 |

### Key Design Decisions

- **Pure functions only.** `analyticsUtils.ts` does not import Prisma. All data arrives as typed function arguments.
- **Follow `quizUtils.ts` pattern.** Each function accepts typed arrays and returns typed result objects. No async, no side effects.
- **Configurable threshold.** `identifyAtRiskStudents` accepts an optional `thresholdDays` parameter (default: 7) and an optional `referenceDate` parameter (default: `new Date()`) to enable deterministic testing.

---

## Milestone 2: Dashboard Widgets

**Priority**: Secondary Goal (depends on Milestone 1)

### Objective

Add LMS analytics summary widgets to the student, teacher, and admin dashboards.

### Tasks

| # | Task | File(s) | REQ |
|---|------|---------|-----|
| 2.1 | Create `StudentLmsProgress.tsx` Server Component: fetch active enrollments, lesson progress, quiz attempts; compute metrics via `analyticsUtils.ts`; render card with stats and per-course progress bars | `src/components/StudentLmsProgress.tsx` | REQ-LMS-043 |
| 2.2 | Add `StudentLmsProgress` to student dashboard RIGHT column, after `EnrolledCourses` | `src/app/(dashboard)/student/page.tsx` | REQ-LMS-043 |
| 2.3 | Create `TeacherLmsOverview.tsx` Server Component: fetch teacher's courses, enrollments, progress, quiz data; compute total students, avg completion, at-risk count, pending reviews | `src/components/TeacherLmsOverview.tsx` | REQ-LMS-045 |
| 2.4 | Add `TeacherLmsOverview` to teacher dashboard RIGHT column, after `PendingGrading` | `src/app/(dashboard)/teacher/page.tsx` | REQ-LMS-045 |
| 2.5 | Create `AdminLmsOverview.tsx` Server Component: fetch all courses, enrollments, quiz attempts; compute status breakdowns, pass rate, most/least active courses | `src/components/AdminLmsOverview.tsx` | REQ-LMS-046 |
| 2.6 | Add `AdminLmsOverview` to admin dashboard LEFT column, after CLASS OCCUPANCY CHART section | `src/app/(dashboard)/admin/page.tsx` | REQ-LMS-046 |

### Key Design Decisions

- **Widgets are self-contained Server Components.** Each widget fetches its own data from Prisma and computes metrics via `analyticsUtils.ts` before rendering. This follows the existing dashboard widget pattern.
- **Progress bars use Tailwind.** Per-course progress bars in `StudentLmsProgress` use `div` elements with Tailwind `bg-*` classes and width percentages. No additional library needed.
- **Empty state handling.** Each widget must handle the case where no LMS data exists (no enrollments, no courses) with a meaningful message.

---

## Milestone 3: Course Analytics Page

**Priority**: Final Goal (depends on Milestones 1 and 2)

### Objective

Build the full per-course analytics page at `/list/courses/[id]/analytics` with charts, heatmap, and at-risk student list.

### Tasks

| # | Task | File(s) | REQ |
|---|------|---------|-----|
| 3.1 | Create `CompletionRateChart.tsx` Client Component: Recharts BarChart for per-module completion rates | `src/components/CompletionRateChart.tsx` | REQ-LMS-044 |
| 3.2 | Create `QuizScoreDistribution.tsx` Client Component: Recharts BarChart for quiz score distribution buckets | `src/components/QuizScoreDistribution.tsx` | REQ-LMS-044 |
| 3.3 | Create `LmsEngagementHeatmap.tsx` Client Component: calendar grid with color-coded daily activity, tooltips | `src/components/LmsEngagementHeatmap.tsx` | REQ-LMS-047 |
| 3.4 | Create `LmsEngagementHeatmapContainer.tsx` Server Component: fetch and compute 90-day engagement data | `src/components/LmsEngagementHeatmapContainer.tsx` | REQ-LMS-047 |
| 3.5 | Create `CourseActivityTimeline.tsx` Client Component: Recharts LineChart for daily engagement trend | `src/components/CourseActivityTimeline.tsx` | REQ-LMS-044 |
| 3.6 | Create `AtRiskStudentsList.tsx` Server Component: render at-risk students table with name, last activity, days inactive | `src/components/AtRiskStudentsList.tsx` | REQ-LMS-048 |
| 3.7 | Create `CourseAnalyticsContainer.tsx` Server Component: fetch all course data, delegate to child components | `src/components/CourseAnalyticsContainer.tsx` | REQ-LMS-044 |
| 3.8 | Create course analytics page at `src/app/(dashboard)/list/courses/[id]/analytics/page.tsx`: authorization check (teacher must own course, or admin), render `CourseAnalyticsContainer` | `src/app/(dashboard)/list/courses/[id]/analytics/page.tsx` | REQ-LMS-044 |
| 3.9 | Update `src/lib/settings.ts` to add analytics route to `routeAccessMap` if needed | `src/lib/settings.ts` | REQ-LMS-044 |
| 3.10 | Add "Analytics" link to course detail page (`/list/courses/[id]/page.tsx`) for teachers and admins | `src/app/(dashboard)/list/courses/[id]/page.tsx` | REQ-LMS-044 |

### Key Design Decisions

- **Reuse `AttendanceHeatmap` pattern.** The `LmsEngagementHeatmap` is a Client Component adaptation of the existing heatmap, using color intensity instead of binary present/absent. The Container fetches data; the heatmap renders it.
- **Authorization in page component.** The analytics page component checks `auth()` and verifies the teacher owns the course (or user is admin). Unauthorized access renders `notFound()` or redirects.
- **Layout.** The analytics page uses a responsive grid: summary stats at top, charts in a 2-column grid below, heatmap full-width, at-risk list below.

---

## Technical Approach

### Data Fetching Strategy

All Server Components use Prisma with targeted `select` clauses to minimize data transfer:

```
CourseAnalyticsContainer fetches:
  - Course with modules and lesson counts
  - Enrollments with student names
  - LessonProgress for all students in the course
  - QuizAttempts for all quizzes in the course
```

Each query uses `select` to return only the fields needed by `analyticsUtils.ts` functions. No `findMany` without `select`.

### Component Architecture

```
analytics/page.tsx (authorization + layout)
  └── CourseAnalyticsContainer (data fetching + computation)
        ├── Summary Stats (inline: enrolled count, completion rate)
        ├── CompletionRateChart (Client, per-module bars)
        ├── QuizScoreDistribution (Client, score range bars)
        ├── LmsEngagementHeatmapContainer (Server, fetches data)
        │     └── LmsEngagementHeatmap (Client, renders grid)
        ├── CourseActivityTimeline (Client, line chart)
        └── AtRiskStudentsList (Server, renders table)
```

### Performance Considerations

- **Prisma query optimization.** Use `select` and `where` clauses to load only analytics-relevant fields. For the engagement heatmap, filter to the 90-day window in the Prisma query, not in TypeScript.
- **Avoid N+1 queries.** The `CourseAnalyticsContainer` should batch-load all related data (enrollments, progress, attempts) in a small number of queries rather than looping per student.
- **Suspense boundaries.** Wrap each major section of the analytics page in a `Suspense` boundary with a loading skeleton so the page streams progressively.

---

## Risks and Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Slow analytics page load with many students | Medium | High | Use Prisma `select` to minimize data, add Suspense boundaries for progressive loading. Defer to database-level aggregation in a future SPEC if needed. |
| At-risk threshold too aggressive or too lenient | Low | Medium | Threshold is configurable via `AT_RISK_THRESHOLD_DAYS` constant. Teachers can request adjustment. |
| Empty state confusion (no LMS data yet) | Medium | Low | All widgets must handle zero-data state with clear messaging: "No courses available", "No enrollments yet". |
| Recharts bundle size impact on client | Low | Low | Chart components are already in the project. No new libraries. Code-splitting via dynamic imports if needed. |

---

## File Summary

### New Files (12-14)

| File | Type | Size Estimate |
|------|------|---------------|
| `src/lib/analyticsUtils.ts` | Utility | 200-300 lines |
| `src/lib/__tests__/analyticsUtils.test.ts` | Test | 300-400 lines |
| `src/components/StudentLmsProgress.tsx` | Server Component | 80-120 lines |
| `src/components/TeacherLmsOverview.tsx` | Server Component | 100-150 lines |
| `src/components/AdminLmsOverview.tsx` | Server Component | 100-150 lines |
| `src/components/CourseAnalyticsContainer.tsx` | Server Component | 120-180 lines |
| `src/components/AtRiskStudentsList.tsx` | Server Component | 60-100 lines |
| `src/components/LmsEngagementHeatmapContainer.tsx` | Server Component | 60-80 lines |
| `src/components/CompletionRateChart.tsx` | Client Component | 40-60 lines |
| `src/components/QuizScoreDistribution.tsx` | Client Component | 40-60 lines |
| `src/components/LmsEngagementHeatmap.tsx` | Client Component | 80-120 lines |
| `src/components/CourseActivityTimeline.tsx` | Client Component | 40-60 lines |
| `src/app/(dashboard)/list/courses/[id]/analytics/page.tsx` | Page | 40-60 lines |

### Modified Files (4)

| File | Change |
|------|--------|
| `src/app/(dashboard)/student/page.tsx` | Add `StudentLmsProgress` import and component |
| `src/app/(dashboard)/teacher/page.tsx` | Add `TeacherLmsOverview` import and component |
| `src/app/(dashboard)/admin/page.tsx` | Add `AdminLmsOverview` import and component |
| `src/lib/settings.ts` | Add analytics route to `routeAccessMap` (if needed) |

### Total Estimated Scope

- New files: 12-14
- Modified files: 4
- New utility functions: 6
- New components: 11
- New page routes: 1
