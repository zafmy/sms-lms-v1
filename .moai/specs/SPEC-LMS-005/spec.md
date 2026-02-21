# SPEC-LMS-005: LMS Analytics Dashboard

| Field    | Value                                                       |
| -------- | ----------------------------------------------------------- |
| ID       | SPEC-LMS-005                                                |
| Title    | LMS Analytics Dashboard with Student Progress, Teacher Overview, and Engagement Metrics |
| Version  | 1.0.0                                                       |
| Status   | Completed                                                   |
| Created  | 2026-02-21                                                  |
| Author   | MoAI                                                        |
| Priority | Medium                                                      |

---

## History

| Version | Date       | Author | Change Description           |
| ------- | ---------- | ------ | ---------------------------- |
| 1.0.0   | 2026-02-21 | MoAI   | Initial SPEC creation        |
| 1.1.0   | 2026-02-22 | MoAI   | Implementation completed with scope reduction |

---

## Problem Statement

Teachers and administrators currently have no visibility into LMS engagement patterns. Despite Phase 1 delivering a complete course, content, and quiz system (SPEC-LMS-001), the platform lacks any analytics layer to surface how students interact with digital learning materials between bi-weekly school sessions.

Specifically:

- **Teachers** cannot identify which students are falling behind in their courses. There is no way to see completion rates, quiz performance distributions, or daily engagement patterns for a course. Before a Saturday session, a teacher has no pre-class report showing who engaged during the gap and who did not.
- **Students** have no aggregated view of their own LMS progress across all enrolled courses. The existing `EnrolledCourses` widget shows enrollment status but not completion percentage, average quiz score, or per-course progress bars.
- **Administrators** cannot assess the overall health of the LMS deployment. There is no school-wide view of total enrollments, quiz pass rates, most active courses, or enrollment status breakdowns.

The 12-day gap between school sessions makes this visibility critical. Without analytics, the LMS data collected during the gap goes unused, and the primary value proposition of the LMS (bridging sessions through engagement) cannot be measured or optimized.

---

## Environment

### Existing Chart Patterns

The project uses a **Container/Client split** pattern for all Recharts visualizations:

- `AttendanceChartContainer.tsx` (Server Component) fetches data from Prisma, then passes props to `AttendanceChart.tsx` (Client Component) which renders the Recharts chart.
- `CountChartContainer.tsx` / `CountChart.tsx` follows the same pattern for radial bar charts.
- `ClassOccupancyChartContainer.tsx` / `ClassOccupancyChart.tsx` follows the same pattern for bar charts.

All chart Client Components use `"use client"` directive and import from `recharts`. Server Components use `prisma` directly.

### Existing Heatmap Pattern

`AttendanceHeatmap.tsx` is a **Server Component** that renders a calendar-based heatmap showing attendance density by month. It fetches directly from Prisma, groups records by month, and renders colored squares (green for present, red for absent). This pattern will be adapted for the LMS engagement heatmap, but the engagement heatmap will use a Client Component for interactivity (tooltips showing activity counts per day).

### Existing Utility Pattern

- `quizUtils.ts`: Pure functions that accept typed data and return results. No database calls, no side effects. Accepts `QuestionWithOptions[]` and `SubmittedResponse[]`, returns `GradingResult`.
- `gradeUtils.ts`: Contains both pure computation functions (`computeSubjectGrades`, `computeGradeSummary`) and a data-fetching function (`fetchStudentResults`). The new `analyticsUtils.ts` should follow the pure-function-only pattern of `quizUtils.ts`.

### Existing Dashboard Widget Pattern

Dashboard pages (`student/page.tsx`, `teacher/page.tsx`, `admin/page.tsx`) import Server Component widgets directly and render them in a two-column layout (LEFT: 2/3 width main content, RIGHT: 1/3 width widget sidebar). Widgets receive entity IDs as props and fetch their own data internally.

### Existing Data Sources (LMS Models)

| Model           | Key Fields for Analytics                                    |
| --------------- | ----------------------------------------------------------- |
| Course          | id, status, createdAt, teacherId, subjectId                 |
| Enrollment      | enrolledAt, status (ACTIVE/DROPPED/COMPLETED), studentId, courseId |
| LessonProgress  | status (NOT_STARTED/IN_PROGRESS/COMPLETED), startedAt, completedAt, timeSpentSeconds, studentId, lessonId |
| QuizAttempt     | attemptNumber, startedAt, submittedAt, score, maxScore, percentage, passed, studentId, quizId |
| Module          | order, courseId, lessons[]                                   |
| LmsLesson       | order, moduleId, quizzes[]                                  |
| Quiz            | passScore, scoringPolicy, lessonId                          |

### Existing Route Access

`settings.ts` defines `routeAccessMap` for middleware-level route protection. The new analytics route `/list/courses/[id]/analytics` must be added here.

### Technology Stack

- Next.js 16 (App Router, Server Components, Server Actions)
- React 19 (`Suspense`, Server Components default)
- TypeScript 5 (strict mode)
- Prisma 5 + PostgreSQL
- Recharts 3.7+ (already installed)
- Tailwind CSS v4
- Clerk authentication (4 roles: admin, teacher, student, parent)

---

## Assumptions

1. **LMS Phase 1 is complete and deployed.** All LMS models (Course, Module, LmsLesson, LessonProgress, Enrollment, Quiz, QuizAttempt) contain production data. Analytics queries rely on these tables being populated.

2. **No schema changes are required.** All analytics can be computed from existing LMS model fields. No new Prisma models, enums, or migrations are needed.

3. **Analytics are computed at request time.** There is no caching layer, materialized views, or background aggregation jobs. All metrics are calculated from live Prisma queries plus pure utility functions. This is acceptable for the current scale (under 500 users).

4. **The at-risk threshold of 7 days is appropriate.** Given the bi-weekly schedule (school sessions only on Saturday and Sunday), a student with no LMS activity for 7 days during a 12-day gap represents concerning disengagement. This threshold is configurable to allow adjustment.

5. **Teachers can only view analytics for courses they own.** The `Course.teacherId` field determines ownership. Admins can view analytics for all courses. Students and parents do not have access to the course analytics page.

6. **The engagement heatmap covers a 90-day rolling window.** This window captures approximately 6-7 bi-weekly cycles, providing sufficient historical context without excessive data loading.

7. **Recharts 3.7+ is sufficient for all chart types.** Bar charts (completion rates), distribution charts (quiz scores), and timeline charts (engagement) are all supported by the existing Recharts installation. No additional charting libraries are needed.

8. **The `analyticsUtils.ts` module follows the `quizUtils.ts` pure-function pattern.** All computation functions accept data as arguments and return results. No Prisma imports, no side effects. Data fetching occurs in Server Components, which then call utility functions for computation.

---

## Requirements

### REQ-LMS-043: Student Progress View (Event-Driven)

**When** a student views their dashboard, **then** the system **shall** display an LMS progress widget showing:
- Total number of courses the student is currently enrolled in (status = ACTIVE)
- Overall completion percentage across all active enrollments (ratio of COMPLETED lessons to total lessons)
- Average quiz score across all quiz attempts for enrolled courses
- A list of active courses, each with an individual progress bar showing per-course completion percentage

### REQ-LMS-044: Teacher Course Analytics (Event-Driven)

**When** a teacher navigates to `/list/courses/[id]/analytics` for a course they own, **then** the system **shall** display:
- Total count of enrolled students (by enrollment status: ACTIVE, COMPLETED, DROPPED)
- Average completion rate across all active enrollments
- Quiz score distribution chart (Recharts bar chart showing score ranges: 0-20%, 21-40%, 41-60%, 61-80%, 81-100%)
- List of at-risk students (no lesson completion or quiz submission in 7+ days for this course)
- Per-module completion breakdown bar chart (Recharts, showing completion percentage per module)

### REQ-LMS-045: Teacher Dashboard LMS Summary (Event-Driven)

**When** a teacher views their dashboard, **then** the system **shall** display an LMS summary widget showing:
- Total number of students enrolled across all courses owned by the teacher
- Average completion rate across all teacher's courses
- Count of students needing attention (no activity in 7+ days in any enrolled course)
- Count of courses with pending manual quiz reviews (quizzes containing SHORT_ANSWER or ESSAY questions with ungraded attempts)

### REQ-LMS-046: Admin LMS Overview (Event-Driven)

**When** an admin views their dashboard, **then** the system **shall** display an LMS overview widget showing:
- Total courses grouped by status (DRAFT, PUBLISHED, ARCHIVED)
- Total enrollments grouped by status (ACTIVE, COMPLETED, DROPPED)
- Average quiz pass rate across all quiz attempts system-wide
- Most active course (highest count of lesson completions + quiz submissions in the last 30 days)
- Least active course (lowest count of lesson completions + quiz submissions in the last 30 days, excluding courses with zero enrollments)

### REQ-LMS-047: Engagement Heatmap (Event-Driven)

**When** a teacher views the course analytics page (`/list/courses/[id]/analytics`), **then** the system **shall** display an engagement heatmap showing:
- Daily LMS activity counts (lesson completions + quiz submissions) for the course
- Rolling 90-day view from the current date
- Color intensity proportional to daily activity count (no activity = gray, low = light green, medium = green, high = dark green)
- Tooltip on hover showing the date and exact activity count
- The heatmap follows the calendar grid layout pattern adapted from the existing `AttendanceHeatmap` component

### REQ-LMS-048: At-Risk Detection (State-Driven)

**While** an enrolled student (enrollment status = ACTIVE) has not completed any lesson or submitted any quiz attempt in a course for 7 or more consecutive days, the system **shall** flag the student as "at-risk" in:
- The teacher course analytics page (REQ-LMS-044)
- The teacher dashboard LMS summary widget (REQ-LMS-045)

The at-risk threshold **shall** be configurable via a constant in `analyticsUtils.ts` (default: 7 days).

### REQ-LMS-049: Analytics Utility Module (Ubiquitous)

The system **shall** calculate all analytics metrics using pure functions in `src/lib/analyticsUtils.ts`. No analytics computations **shall** occur in page components or Server Components. Server Components **shall** fetch raw data from Prisma and pass it to `analyticsUtils.ts` functions for all metric calculations. The module **shall** follow the pattern of `quizUtils.ts`: typed inputs, typed outputs, no imports from `@/lib/prisma`, no side effects.

---

## Specifications

### New Route

| Route                              | Purpose                          | Access              |
| ---------------------------------- | -------------------------------- | ------------------- |
| `/list/courses/[id]/analytics`     | Per-course analytics dashboard   | admin, teacher (own) |

The route access must be added to `routeAccessMap` in `src/lib/settings.ts`. The route pattern `/list/courses/(.*)` already grants access to admin and teacher roles. If this pattern does not cover the `/analytics` sub-route, an explicit entry must be added.

### New Components

#### Server Components

| Component                         | Location                                                              | Purpose                                      |
| --------------------------------- | --------------------------------------------------------------------- | -------------------------------------------- |
| Course Analytics Page             | `src/app/(dashboard)/list/courses/[id]/analytics/page.tsx`            | Full course analytics dashboard page         |
| CourseAnalyticsContainer          | `src/components/CourseAnalyticsContainer.tsx`                         | Fetches all analytics data for a course, computes metrics via `analyticsUtils.ts`, passes props to child components |
| StudentLmsProgress                | `src/components/StudentLmsProgress.tsx`                               | Student dashboard widget: enrolled courses count, completion %, quiz avg, active course list with progress bars |
| TeacherLmsOverview                | `src/components/TeacherLmsOverview.tsx`                               | Teacher dashboard widget: total students, avg completion, attention-needed count, pending reviews count |
| AdminLmsOverview                  | `src/components/AdminLmsOverview.tsx`                                 | Admin dashboard widget: courses by status, enrollments by status, quiz pass rate, most/least active courses |
| AtRiskStudentsList                | `src/components/AtRiskStudentsList.tsx`                               | Renders table of at-risk students with student name, last activity date, days inactive |
| LmsEngagementHeatmapContainer     | `src/components/LmsEngagementHeatmapContainer.tsx`                   | Fetches lesson completion and quiz submission data for the past 90 days, computes daily activity via `analyticsUtils.ts`, passes data to `LmsEngagementHeatmap` |

#### Client Components

| Component                         | Location                                                              | Purpose                                      |
| --------------------------------- | --------------------------------------------------------------------- | -------------------------------------------- |
| CompletionRateChart               | `src/components/CompletionRateChart.tsx`                             | Recharts `BarChart` showing per-module completion percentages |
| QuizScoreDistribution             | `src/components/QuizScoreDistribution.tsx`                           | Recharts `BarChart` showing quiz score distribution across ranges (0-20%, 21-40%, etc.) |
| LmsEngagementHeatmap              | `src/components/LmsEngagementHeatmap.tsx`                            | Calendar heatmap with tooltips (adapted from `AttendanceHeatmap` pattern, Client Component for interactivity) |
| CourseActivityTimeline            | `src/components/CourseActivityTimeline.tsx`                          | Recharts `LineChart` showing daily engagement over time |

### Analytics Utility Module

**File**: `src/lib/analyticsUtils.ts`

All functions are pure: typed inputs, typed outputs, no Prisma imports, no side effects.

```typescript
// --- Types ---

export interface CourseCompletionResult {
  totalLessons: number;
  completedLessons: number;
  completionRate: number; // 0-100 percentage
}

export interface StudentProgressResult {
  studentId: string;
  courseId: number;
  completedLessons: number;
  totalLessons: number;
  completionRate: number; // 0-100
}

export interface ScoreDistributionBucket {
  range: string;     // e.g., "0-20%", "21-40%"
  count: number;
}

export interface AtRiskStudent {
  studentId: string;
  studentName: string;
  lastActivityDate: Date | null;
  daysInactive: number;
}

export interface DailyEngagement {
  date: string;      // ISO date string (YYYY-MM-DD)
  lessonCompletions: number;
  quizSubmissions: number;
  total: number;
}

export interface PreClassReportEntry {
  studentId: string;
  studentName: string;
  lessonsCompleted: number;
  quizzesTaken: number;
  engaged: boolean;
}

// --- Constants ---

export const AT_RISK_THRESHOLD_DAYS = 7;

// --- Functions ---

/**
 * Calculate overall completion rate for a set of enrollments in a course.
 * @param lessonProgressRecords - All LessonProgress records for the course's lessons
 * @param totalLessons - Total number of lessons in the course
 * @param enrolledStudentCount - Number of actively enrolled students
 */
export function calculateCourseCompletionRate(
  lessonProgressRecords: Array<{ status: string; studentId: string }>,
  totalLessons: number,
  enrolledStudentCount: number
): CourseCompletionResult;

/**
 * Calculate a single student's progress in a specific course.
 * @param studentId - The student ID
 * @param lessonProgressRecords - LessonProgress records for this student in this course
 * @param totalLessons - Total lessons in the course
 */
export function calculateStudentProgress(
  studentId: string,
  lessonProgressRecords: Array<{ status: string; lessonId: number }>,
  totalLessons: number
): StudentProgressResult;

/**
 * Compute quiz score distribution across defined buckets.
 * @param attempts - All QuizAttempt records with percentage scores
 */
export function calculateQuizScoreDistribution(
  attempts: Array<{ percentage: number | null }>
): ScoreDistributionBucket[];

/**
 * Identify students who have not completed any lesson or taken any quiz
 * in a course for the specified number of days.
 * @param enrollments - Active enrollments with student info
 * @param lessonProgressRecords - LessonProgress records for the course
 * @param quizAttempts - QuizAttempt records for the course
 * @param thresholdDays - Number of days of inactivity (default: AT_RISK_THRESHOLD_DAYS)
 * @param referenceDate - Current date for comparison (default: new Date())
 */
export function identifyAtRiskStudents(
  enrollments: Array<{ studentId: string; studentName: string }>,
  lessonProgressRecords: Array<{ studentId: string; completedAt: Date | null; startedAt: Date | null }>,
  quizAttempts: Array<{ studentId: string; submittedAt: Date | null; startedAt: Date }>,
  thresholdDays?: number,
  referenceDate?: Date
): AtRiskStudent[];

/**
 * Compute daily engagement totals for a date range.
 * @param lessonProgressRecords - Completed lesson records with completedAt dates
 * @param quizAttempts - Quiz attempts with submittedAt dates
 * @param startDate - Beginning of date range
 * @param endDate - End of date range
 */
export function calculateEngagementByDay(
  lessonProgressRecords: Array<{ completedAt: Date | null }>,
  quizAttempts: Array<{ submittedAt: Date | null }>,
  startDate: Date,
  endDate: Date
): DailyEngagement[];

/**
 * Generate a pre-class report showing which students engaged since a given date.
 * @param enrollments - Active enrollments with student names
 * @param lessonProgressRecords - LessonProgress with timestamps
 * @param quizAttempts - QuizAttempt with timestamps
 * @param sinceDate - The date of the last school session
 */
export function generatePreClassReport(
  enrollments: Array<{ studentId: string; studentName: string }>,
  lessonProgressRecords: Array<{ studentId: string; completedAt: Date | null }>,
  quizAttempts: Array<{ studentId: string; submittedAt: Date | null }>,
  sinceDate: Date
): PreClassReportEntry[];
```

### Recharts Chart Specifications

**CompletionRateChart (Bar Chart)**:
- X-axis: Module names (ordered by `Module.order`)
- Y-axis: Completion percentage (0-100%)
- Bar color: Tailwind blue-500 (`#3b82f6`)
- Tooltip: Module name and exact percentage
- Wrapped in `ResponsiveContainer` at 100% width, 300px height

**QuizScoreDistribution (Bar Chart)**:
- X-axis: Score range labels ("0-20%", "21-40%", "41-60%", "61-80%", "81-100%")
- Y-axis: Number of attempts in each range
- Bar color: Tailwind purple-500 (`#a855f7`)
- Tooltip: Range label and count
- Wrapped in `ResponsiveContainer` at 100% width, 300px height

**LmsEngagementHeatmap (Calendar Grid)**:
- Grid: 7 columns (days of week) x ~13 rows (weeks in 90 days)
- Cell size: 12x12px with 2px gap
- Color scale: gray-200 (0 activity), green-200 (1-2), green-400 (3-5), green-600 (6+)
- Tooltip on hover: Date and activity count
- Month labels along the top
- Client Component (`"use client"`) for tooltip interactivity

**CourseActivityTimeline (Line Chart)**:
- X-axis: Dates (daily, past 90 days)
- Y-axis: Activity count
- Line color: Tailwind emerald-500 (`#10b981`)
- Tooltip: Date and count breakdown (lessons + quizzes)
- Wrapped in `ResponsiveContainer` at 100% width, 250px height

### Modified Files

| File                                            | Change Description                                          |
| ----------------------------------------------- | ----------------------------------------------------------- |
| `src/app/(dashboard)/student/page.tsx`          | Import and add `StudentLmsProgress` widget to the RIGHT column, after `EnrolledCourses` |
| `src/app/(dashboard)/teacher/page.tsx`          | Import and add `TeacherLmsOverview` widget to the RIGHT column, after `PendingGrading` |
| `src/app/(dashboard)/admin/page.tsx`            | Import and add `AdminLmsOverview` widget to the LEFT column, after the CLASS OCCUPANCY CHART section |
| `src/lib/settings.ts`                           | Add `/list/courses/(.*/analytics)` entry to `routeAccessMap` with `["admin", "teacher"]` if the existing `/list/courses` pattern does not already cover it |

---

## Constraints

1. **No new Prisma models or migrations.** All analytics are derived from existing LMS models. No schema changes.
2. **No database-level aggregation (views, materialized views, stored procedures).** All computation happens in TypeScript via `analyticsUtils.ts`.
3. **No real-time updates.** Analytics are computed on page load. No WebSocket, polling, or Server-Sent Events.
4. **No external analytics services.** No Mixpanel, Amplitude, Google Analytics, or similar integrations.
5. **Page load performance.** The course analytics page must load within 2 seconds on a standard connection. Prisma queries must use appropriate `select` clauses to avoid over-fetching.
6. **Access control.** Teachers can only view analytics for courses where `Course.teacherId` matches their authenticated user ID. Admins can view all. Students and parents cannot access the analytics route.
7. **Pure function constraint.** `analyticsUtils.ts` must contain zero Prisma imports. All data is passed as function arguments.

---

## Traceability Matrix

| Requirement   | Component(s)                                                | Utility Function(s)                              | Acceptance Criteria |
| ------------- | ----------------------------------------------------------- | ------------------------------------------------ | ------------------- |
| REQ-LMS-043   | StudentLmsProgress                                          | calculateStudentProgress, calculateCourseCompletionRate | AC-043-01, AC-043-02 |
| REQ-LMS-044   | CourseAnalyticsContainer, CompletionRateChart, QuizScoreDistribution, AtRiskStudentsList | calculateCourseCompletionRate, calculateQuizScoreDistribution, identifyAtRiskStudents | AC-044-01, AC-044-02, AC-044-03 |
| REQ-LMS-045   | TeacherLmsOverview                                          | calculateCourseCompletionRate, identifyAtRiskStudents | AC-045-01, AC-045-02 |
| REQ-LMS-046   | AdminLmsOverview                                            | calculateQuizScoreDistribution                   | AC-046-01, AC-046-02 |
| REQ-LMS-047   | LmsEngagementHeatmapContainer, LmsEngagementHeatmap         | calculateEngagementByDay                         | AC-047-01, AC-047-02 |
| REQ-LMS-048   | AtRiskStudentsList, TeacherLmsOverview                      | identifyAtRiskStudents                           | AC-048-01, AC-048-02 |
| REQ-LMS-049   | (all components)                                            | (all functions in analyticsUtils.ts)             | AC-049-01            |

---

## Implementation Notes

### Scope Reduction
SPEC-LMS-004 (implemented prior) already delivered Milestone 2 (Dashboard Widgets): LmsProgressOverview, QuizPerformanceTrend, LearningActivityHeatmap (student); PreClassEngagementReport, AtRiskStudentsAlert, CourseEngagementOverview, ClassQuizAnalytics (teacher); LmsAdoptionMetrics (admin). The existing `lmsAnalyticsUtils.ts` utility module was also created by SPEC-LMS-004.

Therefore, only Milestone 1 (utility extensions) and Milestone 3 (Course Analytics Page) were implemented:
- Extended `lmsAnalyticsUtils.ts` with 3 new functions (12 total)
- Created the per-course analytics page with 7 new components
- Added route access and Analytics link on course detail page

### Implementation Deviations
- `analyticsUtils.ts` was not created as a separate file; functions were added to the existing `lmsAnalyticsUtils.ts` for consistency
- `StudentLmsProgress`, `TeacherLmsOverview`, `AdminLmsOverview` widgets were not created as they already existed under different names from SPEC-LMS-004
- The engagement heatmap component was named `LmsEngagementHeatmap` (course-level) to differentiate from the existing `LearningActivityHeatmap` (student-level)

### Commits
- `60a82d3` feat(analytics): add score distribution, daily engagement, and at-risk utility functions (TAG-1)
- `db00b76` feat(analytics): add course analytics page with charts, heatmap, and at-risk detection (TAG-2)

---

## Out of Scope

The following features are explicitly excluded from this SPEC and deferred to future work:

- **Exportable reports (PDF/CSV):** Analytics data cannot be downloaded in this iteration.
- **Real-time analytics updates:** No live dashboard refresh or streaming data.
- **Predictive analytics or ML-based recommendations:** No machine learning models for predicting student outcomes.
- **Comparative analytics between courses/cohorts:** No side-by-side course comparison views.
- **Custom date range filtering:** Analytics use fixed time windows (90 days for heatmap, 30 days for active course detection). User-configurable date ranges are deferred.
- **Per-question difficulty analysis:** No analytics on individual question performance across students.
- **Parent dashboard analytics:** Parents do not receive LMS analytics in this iteration. Parent-facing analytics are deferred.
- **Email/push notifications for at-risk students:** At-risk flagging is display-only; automated alerting is deferred.
