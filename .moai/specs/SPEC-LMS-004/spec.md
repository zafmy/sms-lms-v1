# SPEC-LMS-004: LMS Progress Tracking and Analytics

| Field     | Value                                                                 |
|-----------|-----------------------------------------------------------------------|
| ID        | SPEC-LMS-004                                                         |
| Version   | 1.0.0                                                                |
| Status    | Draft                                                                |
| Lifecycle | spec-anchored                                                        |
| Created   | 2026-02-21                                                           |
| Author    | MoAI (manager-spec)                                                  |
| Priority  | High                                                                 |
| Parent    | SPEC-LMS-001 (LMS Phase 1)                                          |
| Domain    | LMS - Analytics                                                      |
| Tags      | LMS, Analytics, Progress, Dashboard, Recharts, Heatmap, Quiz Stats   |
| Depends   | SPEC-LMS-001 (LMS Phase 1), SPEC-LMS-002 (Self-Enrollment)          |

---

## History

| Version | Date       | Author | Description                                                |
|---------|------------|--------|------------------------------------------------------------|
| 1.0.0   | 2026-02-21 | MoAI   | Initial SPEC: LMS Progress Tracking and Analytics          |

---

## Problem Statement

The Hua Readwise LMS was built to bridge the 12-day gap between bi-weekly school sessions. Phase 1 (SPEC-LMS-001) delivered courses, content, quizzes, and lesson progress tracking. Phase 2 (SPEC-LMS-002) added student self-enrollment. However, despite collecting rich engagement data (lesson completions with timestamps, quiz scores with per-question responses, time spent per lesson), none of this data is surfaced through analytics on any dashboard.

Critical blind spots exist across all four roles:

- **Students** see only a simple progress bar per course via `EnrolledCourses`. They have no aggregate view of their learning velocity, no quiz performance trends over time, and no engagement heatmap showing daily activity patterns.
- **Teachers** have zero LMS analytics. They cannot see which students engaged between sessions, cannot identify at-risk students who stopped engaging, cannot view aggregate quiz difficulty metrics, and have no pre-class engagement report -- the most critical piece for a bi-weekly school where teachers need to know WHO studied before Saturday class.
- **Parents** have no visibility into their children's LMS engagement whatsoever. The parent dashboard shows attendance and grades but nothing about course progress, quiz scores, or learning activity.
- **Admins** have no school-wide LMS adoption metrics -- no total enrollment counts, no average engagement rates, no teacher adoption tracking.

This SPEC addresses these gaps by building analytics views on top of existing data. No new Prisma models are introduced. All analytics are computed through JavaScript aggregation of existing `LessonProgress`, `QuizAttempt`, `QuestionResponse`, and `Enrollment` records, following the established architecture pattern.

---

## Environment

### Existing Models (No Schema Changes Required)

This SPEC introduces zero new Prisma models, fields, or migrations. All analytics are derived from existing data.

| Model             | Relevant Fields for Analytics                                                                         |
|-------------------|-------------------------------------------------------------------------------------------------------|
| LessonProgress    | `status` (NOT_STARTED, IN_PROGRESS, COMPLETED), `startedAt`, `completedAt`, `timeSpentSeconds`, `studentId`, `lessonId` |
| Enrollment        | `enrolledAt`, `status` (ACTIVE, DROPPED, COMPLETED), `studentId`, `courseId`                          |
| QuizAttempt       | `attemptNumber`, `startedAt`, `submittedAt`, `score`, `maxScore`, `percentage`, `passed`, `studentId`, `quizId` |
| QuestionResponse  | `selectedOptionId`, `textResponse`, `isCorrect`, `pointsEarned`, `timeTakenSeconds`, `questionId`, `attemptId` |
| Course            | `id`, `title`, `code`, `status` (DRAFT, ACTIVE, ARCHIVED), `teacherId`, `subjectId`, `modules[]`, `enrollments[]` |
| Module            | `id`, `title`, `order`, `courseId`, `lessons[]`                                                       |
| LmsLesson         | `id`, `title`, `contentType`, `order`, `moduleId`, `quizzes[]`                                        |
| Quiz              | `id`, `title`, `lessonId`, `passScore`, `maxAttempts`, `scoringPolicy` (BEST, LATEST, AVERAGE), `questions[]`, `attempts[]` |
| Question          | `id`, `text`, `type` (MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER, ESSAY), `points`, `order`, `quizId` |
| Student           | `id`, `name`, `surname`, `parentId`, `classId`, `enrollments[]`, `lessonProgress[]`, `quizAttempts[]` |
| Result            | `score`, `studentId`, `examId`, `assignmentId`                                                        |
| Attendance        | `date`, `present`, `studentId`, `lessonId`                                                            |

### Existing Components to Build Upon

| Component                  | File Path                                      | Lines | Reuse Pattern                                              |
|----------------------------|-------------------------------------------------|-------|-------------------------------------------------------------|
| `CourseProgressBar`        | `src/components/CourseProgressBar.tsx`           | 30    | Reuse for per-course completion in student overview          |
| `EnrolledCourses`          | `src/components/EnrolledCourses.tsx`             | 96    | Extend with aggregate stats (avg completion, total lessons)  |
| `AttendanceHeatmap`        | `src/components/AttendanceHeatmap.tsx`           | 112   | Adapt pattern for LMS engagement heatmap (calendar grid)     |
| `CountChart`               | `src/components/CountChart.tsx`                  | 55    | Reuse Recharts `RadialBarChart` pattern for distributions    |
| `ClassOccupancyChart`      | `src/components/ClassOccupancyChart.tsx`         | 47    | Reuse Recharts `BarChart` pattern for quiz/course analytics  |
| `ChildQuickStats`          | `src/components/ChildQuickStats.tsx`             | 94    | Extend with LMS metrics (courses, completion, days active)   |
| `ChildGradeOverview`       | `src/components/ChildGradeOverview.tsx`          | 81    | Pattern reference for parent per-child widget layout         |
| `ClassAttendanceOverview`  | `src/components/ClassAttendanceOverview.tsx`     | 88    | Pattern reference for teacher per-class analytics            |
| `gradeUtils.ts`            | `src/lib/gradeUtils.ts`                         | 157   | Pattern reference for pure aggregation functions             |
| `quizUtils.ts`             | `src/lib/quizUtils.ts`                          | -     | Scoring engine reference for quiz analytics calculations     |

### Existing Dashboard Layouts

| Dashboard | File Path                                          | Layout Pattern                                     | Current LMS Widgets |
|-----------|----------------------------------------------------|----------------------------------------------------|---------------------|
| Student   | `src/app/(dashboard)/student/page.tsx`             | Left 2/3: Calendar. Right 1/3: widget stack.       | `EnrolledCourses` only |
| Teacher   | `src/app/(dashboard)/teacher/page.tsx`             | Left 2/3: Calendar. Right 1/3: widget stack.       | None                |
| Parent    | `src/app/(dashboard)/parent/page.tsx`              | Left 2/3: per-child loop. Right 1/3: activity.     | None                |
| Admin     | `src/app/(dashboard)/admin/page.tsx`               | Left 2/3: cards + charts. Right 1/3: events + announcements. | None |

### Existing Architecture Patterns

- **Container Pattern**: Server Component `*Container.tsx` fetches data via Prisma, passes to Client Component `*.tsx` for Recharts rendering.
- **Color Coding**: green >= 90%, yellow >= 75%, red < 75% (used in `ChildQuickStats`, `ClassAttendanceOverview`, `ChildGradeOverview`).
- **JavaScript Aggregation**: All analytics use JS-level aggregation, not complex DB-level aggregation queries (consistent with `gradeUtils.ts` pattern).
- **Responsive Grids**: Dashboard widgets use `grid-cols-1 md:grid-cols-N` for responsive layout.

---

## Assumptions

1. **Data volumes are bounded**: Under 500 total users, with typical enrollment counts of 2-5 courses per student and 10-50 lessons per course. JavaScript aggregation will not create performance issues at this scale.

2. **`timeSpentSeconds` is tracked but never zero for started lessons**: The existing `LessonProgress` model tracks time spent. This SPEC assumes the value is reliably recorded by the existing lesson viewer implementation.

3. **`QuizAttempt.submittedAt` is non-null for completed attempts**: Only submitted quiz attempts (where `submittedAt` is not null) are included in analytics. In-progress attempts are excluded.

4. **Teacher-course ownership is authoritative**: A teacher's courses are identified via `Course.teacherId`. Teachers only see analytics for their own courses.

5. **"Between sessions" means the last 14 days**: For the pre-class engagement report, the engagement window is defined as the last 14 calendar days, covering the full gap between bi-weekly sessions.

6. **"At-risk" threshold is 7 days of inactivity**: A student with no LMS activity (no lesson progress changes, no quiz attempts) in the last 7 days is flagged as at-risk.

7. **Parent-student relationship is authoritative**: `Parent.students` relation is the single source of truth for parent access scoping.

8. **Course status ACTIVE is the operational state**: Analytics reference courses in ACTIVE status unless explicitly viewing historical data. DRAFT courses are excluded from teacher analytics. ARCHIVED courses are excluded from student/parent views.

---

## Requirements

### Student Dashboard Analytics

#### REQ-LMS-050: Student LMS Progress Overview Widget (Event-Driven)

**When** a student views their dashboard (`/student`), **then** the system **shall** display an `LmsProgressOverview` widget showing:

- Total number of ACTIVE enrolled courses.
- Average completion percentage across all enrolled courses (total completed lessons / total lessons).
- Total lessons completed across all courses.
- Total time spent on LMS content (sum of `timeSpentSeconds` from all `LessonProgress` records, displayed in hours and minutes).

The widget **shall** use the color coding convention: green >= 90%, yellow >= 75%, red < 75% for the average completion percentage.

#### REQ-LMS-051: Student Course Progress Detail (Event-Driven)

**When** a student views the `EnrolledCourses` widget on their dashboard, **then** the system **shall** display enhanced per-course information including:

- Per-module breakdown showing: module title, lessons completed / total lessons in that module.
- Per-module quiz score: average quiz percentage for quizzes within that module (using the course's `scoringPolicy` to determine canonical score per quiz).
- An overall course completion percentage with the existing `CourseProgressBar`.

#### REQ-LMS-052: Student Quiz Performance Trend Chart (Event-Driven)

**When** a student views their dashboard, **then** the system **shall** display a `QuizPerformanceTrend` chart widget showing:

- A Recharts `LineChart` plotting quiz score percentage (Y-axis) against submission date (X-axis).
- Data points represent each submitted `QuizAttempt` across all enrolled courses, ordered by `submittedAt`.
- Each data point shows quiz title on hover (via Recharts `Tooltip`).
- The chart includes a horizontal reference line at the passing score threshold (70% default).
- If the student has fewer than 2 quiz attempts, the chart **shall** display a message: "Take more quizzes to see your performance trend."

#### REQ-LMS-053: Student Learning Activity Heatmap (Event-Driven)

**When** a student views their dashboard, **then** the system **shall** display a `LearningActivityHeatmap` widget showing:

- A calendar-style heatmap (adapted from the `AttendanceHeatmap` pattern) covering the current year.
- Each day cell is colored based on the count of LMS engagement events on that day: lesson completions (`LessonProgress.completedAt`) and quiz submissions (`QuizAttempt.submittedAt`).
- Color intensity scale: no activity (gray), 1 event (light green), 2-3 events (medium green), 4+ events (dark green).
- A legend explaining the color scale.
- Hover tooltip showing the date and count of activities.

If the student has no LMS activity records, the heatmap **shall** display a message: "No learning activity recorded yet."

### Teacher Dashboard Analytics

#### REQ-LMS-054: Teacher Course Engagement Overview (Event-Driven)

**When** a teacher views their dashboard (`/teacher`), **then** the system **shall** display a `CourseEngagementOverview` widget showing a card per ACTIVE course taught by the teacher, with each card displaying:

- Course title and code.
- Number of students who had any LMS engagement in the last 7 days (at least one `LessonProgress` update or `QuizAttempt` submission).
- Overall course completion rate (average completion % across all ACTIVE enrolled students).
- Average quiz score across all submitted quiz attempts for the course.

If the teacher has no ACTIVE courses, the widget **shall** display: "No active courses."

#### REQ-LMS-055: Teacher Pre-Class Engagement Report (Event-Driven)

**When** a teacher views their dashboard, **then** the system **shall** display a `PreClassEngagementReport` widget showing per-course student engagement over the last 14 days:

- A list of all ACTIVE enrolled students for each of the teacher's ACTIVE courses.
- For each student: name, number of lessons completed in the last 14 days, number of quiz attempts in the last 14 days, last activity date.
- Students are visually categorized:
  - **Engaged** (green badge): At least 1 lesson completion or quiz attempt in the last 14 days.
  - **Inactive** (red badge): No LMS activity in the last 14 days.
- The report is sorted with inactive students first (most critical), then engaged students alphabetically.
- A summary line at the top: "X of Y students engaged in the last 14 days."

This is the most critical widget for the bi-weekly school model. Teachers **shall** be able to see at a glance who did and did not study between sessions.

#### REQ-LMS-056: Teacher At-Risk Students Alert (Event-Driven)

**When** a teacher views their dashboard, **then** the system **shall** display an `AtRiskStudentsAlert` widget listing students meeting at-risk criteria:

- **No LMS activity in the last 7 days**: No `LessonProgress` updates and no `QuizAttempt` submissions in the past 7 calendar days.
- **Failing quiz scores**: Average quiz percentage below the passing threshold (70%) across all quizzes in the teacher's courses.

Each at-risk student entry **shall** show: student name, course name, risk reason (Inactive / Failing Quizzes), and days since last activity.

If no students meet at-risk criteria, the widget **shall** display: "No at-risk students detected."

#### REQ-LMS-057: Teacher Class Quiz Analytics (Event-Driven)

**When** a teacher views their dashboard, **then** the system **shall** display a `ClassQuizAnalytics` widget showing per-quiz statistics for each of the teacher's ACTIVE courses:

- Quiz title.
- Number of students who attempted the quiz / total enrolled students.
- Average score percentage.
- Pass rate (percentage of students who passed).
- Most-missed question: the question with the lowest `isCorrect` rate across all attempts, showing the question text (truncated to 80 characters) and the incorrect rate percentage.

If a course has no quizzes, that course **shall** be omitted from the quiz analytics display.

### Parent Dashboard Analytics

#### REQ-LMS-058: Parent Child LMS Progress Card (Event-Driven)

**When** a parent views their dashboard (`/parent`), **then** the system **shall** display a `ChildLmsProgressCard` widget for each child, showing:

- Number of ACTIVE enrolled courses.
- Overall LMS completion percentage (total completed lessons / total lessons across all ACTIVE enrollments).
- Most recent quiz score: quiz title, percentage, pass/fail status.
- Days active this week: count of distinct days in the current calendar week (Monday-Sunday) where the child had any `LessonProgress` completion or `QuizAttempt` submission.
- A "View Courses" link navigating to `/list/courses?childId=[childId]`.

The widget **shall** appear in the per-child loop on the parent dashboard, after `ChildGradeOverview` and before the schedule calendar.

#### REQ-LMS-059: Parent Child Learning Activity Feed (Event-Driven)

**When** a parent views their dashboard, **then** the system **shall** display a `ChildLearningActivity` widget for each child, showing:

- The 10 most recent LMS events for the child, ordered by date descending.
- Event types:
  - "Completed lesson [Lesson Title] in [Course Title]" (from `LessonProgress.completedAt`).
  - "Took quiz [Quiz Title] - scored [percentage]% ([Pass/Fail])" (from `QuizAttempt.submittedAt`).
  - "Enrolled in [Course Title]" (from `Enrollment.enrolledAt`).
- Each event shows a relative timestamp (e.g., "2 days ago", "5 hours ago").

If the child has no LMS activity, the widget **shall** display: "No learning activity yet."

### Admin Dashboard Analytics (Optional/Lower Priority)

#### REQ-LMS-060: School-Wide LMS Adoption Metrics (Event-Driven)

**When** an admin views their dashboard (`/admin`), **then** the system **shall** display an `LmsAdoptionMetrics` widget showing aggregate metrics:

- Total ACTIVE courses.
- Total active enrollments (enrollments with status ACTIVE).
- Average engagement rate: percentage of students with at least one LMS activity in the last 14 days out of all students with ACTIVE enrollments.
- Teacher adoption rate: percentage of teachers who have at least one ACTIVE course out of all teachers in the system.

### Ubiquitous Requirements

#### REQ-LMS-061: Dashboard Load Performance (Ubiquitous)

The system **shall** render all dashboard analytics widgets within 2 seconds for typical data volumes (under 500 users, under 50 courses, under 500 quiz attempts).

#### REQ-LMS-062: Empty State Handling (Ubiquitous)

The system **shall** display meaningful empty state messages for every analytics widget when no data is available, including:

- No enrolled courses.
- No quiz attempts.
- No lesson progress records.
- No LMS activity in the measured period.

The system **shall not** display errors, broken charts, or division-by-zero artifacts when data is absent.

#### REQ-LMS-063: Color Coding Consistency (Ubiquitous)

The system **shall** apply the established color coding convention consistently across all analytics widgets:

- Green text/badge: metric >= 90%.
- Yellow text/badge: metric >= 75% and < 90%.
- Red text/badge: metric < 75%.

### Unwanted Behavior Requirements

#### REQ-LMS-064: No Cross-Role Data Leakage (Unwanted)

The system **shall not** allow:

- Students to view other students' analytics data.
- Teachers to view analytics for courses they do not own (where `Course.teacherId` does not match their userId).
- Parents to view analytics for students who are not their children (enforced via `Parent.students` relation).

#### REQ-LMS-065: No Write Operations from Analytics (Unwanted)

Analytics widgets **shall not** trigger any write operations. Viewing analytics **shall not** create, update, or delete any database records. All analytics are read-only views computed from existing data.

---

## Specifications

### No New Prisma Models

This SPEC requires zero Prisma schema changes. All analytics are computed through JavaScript aggregation of existing model data, following the established pattern in `gradeUtils.ts`.

### New Utility Module

#### S-01: LMS Analytics Utility Functions

**File**: `src/lib/lmsAnalyticsUtils.ts` (new)

A module of pure functions for computing LMS analytics, following the `gradeUtils.ts` pattern.

Functions:

| Function                     | Input                                           | Output                                             |
|------------------------------|-------------------------------------------------|----------------------------------------------------|
| `computeCourseCompletion`    | Enrollment with modules/lessons, LessonProgress[] | `{ totalLessons, completedLessons, percentage }`   |
| `computeModuleCompletion`    | Module with lessons, LessonProgress[]             | `{ moduleName, totalLessons, completedLessons, percentage }` |
| `computeAverageQuizScore`    | QuizAttempt[]                                    | `{ averagePercentage, totalAttempts, passRate }`   |
| `computeEngagementDays`      | LessonProgress[], QuizAttempt[], dateRange       | `{ daysActive, totalDays, activeDates: Date[] }`   |
| `computeQuizDifficulty`      | QuizAttempt[] with responses                     | `{ averageScore, passRate, mostMissedQuestion }`   |
| `formatTimeSpent`            | totalSeconds: number                             | `string` (e.g., "2h 15m")                         |
| `computeHeatmapData`         | LessonProgress[], QuizAttempt[]                  | `{ date: string, count: number }[]`               |
| `categorizeStudentEngagement`| LessonProgress[], QuizAttempt[], windowDays       | `"engaged" | "inactive"`                           |
| `computeAtRiskStatus`        | LessonProgress[], QuizAttempt[], averageQuizPct  | `{ isAtRisk: boolean, reasons: string[] }`         |

All functions are pure (no Prisma calls, no side effects), making them independently testable.

### Student Dashboard Components

#### S-02: LmsProgressOverview

| Field       | Value                                               |
|-------------|-----------------------------------------------------|
| Component   | `LmsProgressOverview`                               |
| Type        | Server Component                                    |
| File        | `src/components/LmsProgressOverview.tsx`             |
| Props       | `studentId: string`                                 |
| REQ         | REQ-LMS-050                                         |

Fetches ACTIVE enrollments with nested course/module/lesson structure and LessonProgress records. Computes aggregate metrics using `lmsAnalyticsUtils`. Renders a summary card with 4 metrics: courses enrolled, avg completion %, total lessons completed, total time spent.

#### S-03: EnrolledCoursesEnhanced

| Field       | Value                                               |
|-------------|-----------------------------------------------------|
| Component   | Enhanced `EnrolledCourses`                          |
| Type        | Server Component (modify existing)                  |
| File        | `src/components/EnrolledCourses.tsx` (modify)       |
| Props       | `studentId: string` (unchanged)                     |
| REQ         | REQ-LMS-051                                         |

Enhances the existing `EnrolledCourses` component to include per-module breakdown and quiz scores within each course card. The existing link and `CourseProgressBar` remain unchanged.

#### S-04: QuizPerformanceTrendContainer + QuizPerformanceTrend

| Field       | Value                                               |
|-------------|-----------------------------------------------------|
| Container   | `QuizPerformanceTrendContainer`                     |
| Chart       | `QuizPerformanceTrend`                              |
| Types       | Server Component (Container) + Client Component (Chart) |
| Files       | `src/components/QuizPerformanceTrendContainer.tsx` (new), `src/components/QuizPerformanceTrend.tsx` (new) |
| Props       | Container: `studentId: string`. Chart: `data: { date: string, percentage: number, quizTitle: string }[], passingScore: number` |
| REQ         | REQ-LMS-052                                         |

Container fetches all submitted QuizAttempts for the student, maps to chart data, and passes to the Client Component. Chart renders Recharts `LineChart` with `Line`, `XAxis`, `YAxis`, `Tooltip`, `ReferenceLine`, `ResponsiveContainer`.

#### S-05: LearningActivityHeatmapContainer + LearningActivityHeatmap

| Field       | Value                                               |
|-------------|-----------------------------------------------------|
| Container   | `LearningActivityHeatmapContainer`                  |
| Heatmap     | `LearningActivityHeatmap`                           |
| Types       | Server Component (Container) + Client Component (Heatmap) |
| Files       | `src/components/LearningActivityHeatmapContainer.tsx` (new), `src/components/LearningActivityHeatmap.tsx` (new) |
| Props       | Container: `studentId: string`. Heatmap: `data: { date: string, count: number }[]` |
| REQ         | REQ-LMS-053                                         |

Container fetches `LessonProgress` completions and `QuizAttempt` submissions for the current year, computes daily activity counts using `computeHeatmapData`, and passes to the Client Component. Heatmap renders a calendar grid adapting the `AttendanceHeatmap` month-row pattern with green intensity scale.

### Teacher Dashboard Components

#### S-06: CourseEngagementOverviewContainer + CourseEngagementOverview

| Field       | Value                                               |
|-------------|-----------------------------------------------------|
| Container   | `CourseEngagementOverviewContainer`                 |
| Card        | `CourseEngagementOverview`                          |
| Types       | Server Component (Container) + Client Component (optional for interactivity) |
| Files       | `src/components/CourseEngagementOverviewContainer.tsx` (new), `src/components/CourseEngagementOverview.tsx` (new) |
| Props       | Container: `teacherId: string`. Display: `courses: CourseEngagementData[]` |
| REQ         | REQ-LMS-054                                         |

Container fetches teacher's ACTIVE courses with enrollments, computes per-course engagement metrics (students active in last 7 days, completion rate, avg quiz score). Renders a card per course.

#### S-07: PreClassEngagementReport

| Field       | Value                                               |
|-------------|-----------------------------------------------------|
| Component   | `PreClassEngagementReport`                          |
| Type        | Server Component                                    |
| File        | `src/components/PreClassEngagementReport.tsx` (new) |
| Props       | `teacherId: string`                                 |
| REQ         | REQ-LMS-055                                         |

Fetches teacher's ACTIVE courses with all ACTIVE enrolled students. For each student, queries `LessonProgress` and `QuizAttempt` records from the last 14 days. Categorizes students as Engaged (green) or Inactive (red). Sorts inactive students first. Renders summary line and per-student rows with badges.

#### S-08: AtRiskStudentsAlert

| Field       | Value                                               |
|-------------|-----------------------------------------------------|
| Component   | `AtRiskStudentsAlert`                               |
| Type        | Server Component                                    |
| File        | `src/components/AtRiskStudentsAlert.tsx` (new)      |
| Props       | `teacherId: string`                                 |
| REQ         | REQ-LMS-056                                         |

Fetches students across teacher's ACTIVE courses. Applies at-risk criteria: no activity in 7 days OR average quiz percentage below 70%. Renders alert cards with student name, course, risk reason, and days since last activity.

#### S-09: ClassQuizAnalyticsContainer + ClassQuizAnalytics

| Field       | Value                                               |
|-------------|-----------------------------------------------------|
| Container   | `ClassQuizAnalyticsContainer`                       |
| Display     | `ClassQuizAnalytics`                                |
| Types       | Server Component (Container) + Client Component (optional) |
| Files       | `src/components/ClassQuizAnalyticsContainer.tsx` (new), `src/components/ClassQuizAnalytics.tsx` (new) |
| Props       | Container: `teacherId: string`. Display: `quizStats: QuizAnalyticsData[]` |
| REQ         | REQ-LMS-057                                         |

Container fetches all quizzes across teacher's ACTIVE courses with attempts and responses. Computes per-quiz: attempt count, avg score, pass rate, most-missed question. Renders a table or card list grouped by course.

### Parent Dashboard Components

#### S-10: ChildLmsProgressCard

| Field       | Value                                               |
|-------------|-----------------------------------------------------|
| Component   | `ChildLmsProgressCard`                              |
| Type        | Server Component                                    |
| File        | `src/components/ChildLmsProgressCard.tsx` (new)     |
| Props       | `studentId: string, studentName: string`            |
| REQ         | REQ-LMS-058                                         |

Fetches child's ACTIVE enrollments, lesson progress, and recent quiz attempts. Computes: course count, overall completion %, most recent quiz score, days active this week. Renders a compact card matching `ChildQuickStats` layout pattern.

#### S-11: ChildLearningActivity

| Field       | Value                                               |
|-------------|-----------------------------------------------------|
| Component   | `ChildLearningActivity`                             |
| Type        | Server Component                                    |
| File        | `src/components/ChildLearningActivity.tsx` (new)    |
| Props       | `studentId: string, studentName: string`            |
| REQ         | REQ-LMS-059                                         |

Fetches recent LMS events (lesson completions, quiz submissions, enrollments) for the child, ordered by date descending, limited to 10. Renders an activity feed with event descriptions and relative timestamps.

### Admin Dashboard Component

#### S-12: LmsAdoptionMetrics

| Field       | Value                                               |
|-------------|-----------------------------------------------------|
| Component   | `LmsAdoptionMetrics`                                |
| Type        | Server Component                                    |
| File        | `src/components/LmsAdoptionMetrics.tsx` (new)       |
| Props       | (none -- fetches all data directly)                 |
| REQ         | REQ-LMS-060                                         |

Fetches aggregate counts: ACTIVE courses, ACTIVE enrollments, students with recent activity, teachers with courses. Computes engagement rate and teacher adoption rate. Renders a 4-metric summary card.

### Dashboard Integration Points

#### S-13: Student Dashboard Integration

**File**: `src/app/(dashboard)/student/page.tsx` (modify)

Add to the right sidebar widget stack, after `EnrolledCourses` and before `StudentAttendanceCard`:

1. `LmsProgressOverview` (S-02)
2. `QuizPerformanceTrendContainer` (S-04) -- wrapped in a `div` with `h-[300px]`
3. `LearningActivityHeatmapContainer` (S-05)

#### S-14: Teacher Dashboard Integration

**File**: `src/app/(dashboard)/teacher/page.tsx` (modify)

Add to the right sidebar widget stack, after `TodaySchedule` and before `PendingGrading`:

1. `CourseEngagementOverviewContainer` (S-06)
2. `PreClassEngagementReport` (S-07)
3. `AtRiskStudentsAlert` (S-08)
4. `ClassQuizAnalyticsContainer` (S-09)

#### S-15: Parent Dashboard Integration

**File**: `src/app/(dashboard)/parent/page.tsx` (modify)

Add inside the existing `students.map()` loop, after `ChildGradeOverview` and before the schedule calendar:

1. `ChildLmsProgressCard` (S-10)
2. `ChildLearningActivity` (S-11)

#### S-16: Admin Dashboard Integration

**File**: `src/app/(dashboard)/admin/page.tsx` (modify)

Add `LmsAdoptionMetrics` (S-12) below the `UserCard` row and above the chart row, spanning full width.

---

## Constraints

1. **No new Prisma models**: All analytics are derived from existing models via JavaScript aggregation. No new tables, columns, or migrations.

2. **Read-only operations only**: Analytics widgets must not create, update, or delete any database records.

3. **Server Component data fetching**: All Prisma queries occur in Server Components (or Server Component containers). Client Components receive pre-computed data as props.

4. **Recharts for all charts**: New chart visualizations use Recharts (already a project dependency at v3.7.0). No additional charting libraries.

5. **Role-scoped queries**: Student analytics are scoped to their own data. Teacher analytics are scoped to their courses (`Course.teacherId`). Parent analytics are scoped through `Parent.students` relation.

6. **JavaScript aggregation**: Follow the `gradeUtils.ts` pattern of pure aggregation functions. No raw SQL or complex Prisma aggregate queries.

7. **Container pattern required for Recharts**: Any component using Recharts hooks or browser APIs must follow the `*Container.tsx` (Server) + `*.tsx` (Client) pattern.

8. **2-second load target**: Dashboard widgets should not introduce Prisma queries that significantly degrade page load. Queries should use `include` for eager loading and avoid N+1 patterns.

---

## Traceability Matrix

| Requirement   | Specification | Components Created/Modified                                     | Files Affected                                       |
|---------------|---------------|----------------------------------------------------------------|------------------------------------------------------|
| REQ-LMS-050   | S-02          | `LmsProgressOverview` (new)                                     | `LmsProgressOverview.tsx`, `lmsAnalyticsUtils.ts`    |
| REQ-LMS-051   | S-03          | `EnrolledCourses` (modify)                                      | `EnrolledCourses.tsx`                                |
| REQ-LMS-052   | S-04          | `QuizPerformanceTrendContainer`, `QuizPerformanceTrend` (new)   | 2 new component files                                |
| REQ-LMS-053   | S-05          | `LearningActivityHeatmapContainer`, `LearningActivityHeatmap`   | 2 new component files                                |
| REQ-LMS-054   | S-06          | `CourseEngagementOverviewContainer`, `CourseEngagementOverview`  | 2 new component files                                |
| REQ-LMS-055   | S-07          | `PreClassEngagementReport` (new)                                | 1 new component file                                 |
| REQ-LMS-056   | S-08          | `AtRiskStudentsAlert` (new)                                     | 1 new component file                                 |
| REQ-LMS-057   | S-09          | `ClassQuizAnalyticsContainer`, `ClassQuizAnalytics` (new)       | 2 new component files                                |
| REQ-LMS-058   | S-10          | `ChildLmsProgressCard` (new)                                    | 1 new component file                                 |
| REQ-LMS-059   | S-11          | `ChildLearningActivity` (new)                                   | 1 new component file                                 |
| REQ-LMS-060   | S-12          | `LmsAdoptionMetrics` (new)                                      | 1 new component file                                 |
| REQ-LMS-061   | All           | All analytics widgets                                           | All dashboard pages                                  |
| REQ-LMS-062   | All           | All analytics widgets                                           | All new component files                              |
| REQ-LMS-063   | All           | All analytics widgets with percentage metrics                   | All new component files                              |
| REQ-LMS-064   | All           | All analytics widgets                                           | All dashboard pages                                  |
| REQ-LMS-065   | All           | All analytics widgets                                           | All new component files                              |
| Integration   | S-13          | Student dashboard page (modify)                                 | `student/page.tsx`                                   |
| Integration   | S-14          | Teacher dashboard page (modify)                                 | `teacher/page.tsx`                                   |
| Integration   | S-15          | Parent dashboard page (modify)                                  | `parent/page.tsx`                                    |
| Integration   | S-16          | Admin dashboard page (modify)                                   | `admin/page.tsx`                                     |

---

## Out of Scope

- **Real-time updates / WebSocket**: Analytics are computed on page load. Live updating via WebSocket or polling is not included.
- **Data export (CSV/PDF)**: Exporting analytics data to CSV or PDF is not included in this SPEC.
- **Custom date range filters**: Analytics use fixed time windows (7 days, 14 days, current year). User-selectable date ranges are deferred.
- **Comparative analytics (student vs class average)**: Showing how a student compares to the class average is deferred to a future iteration.
- **Email/push notifications for at-risk students**: The at-risk alert is a dashboard widget only. Automated notifications are out of scope.
- **Caching or materialized views**: Analytics are computed fresh on each page load. Server-side caching is a future optimization.
- **Advanced chart interactivity**: Drill-down from aggregate to detailed views (e.g., clicking a quiz bar to see individual responses) is out of scope.
- **New Prisma models or schema changes**: This SPEC operates entirely on existing data.
- **Spaced repetition integration**: Spaced repetition features are a separate planned SPEC.

---

## Expert Consultation Recommendations

This SPEC involves frontend implementation requirements (Recharts chart components, responsive dashboard layouts, heatmap visualization) and backend data access patterns (multi-relation Prisma queries, JavaScript aggregation). The following expert consultations are recommended:

- **expert-frontend**: Consultation recommended for Recharts `LineChart` configuration (S-04), heatmap calendar grid implementation (S-05), responsive dashboard widget layout across 4 dashboard pages, and Client/Server Component boundary decisions.
- **expert-backend**: Consultation recommended for optimizing nested Prisma queries across the LessonProgress -> LmsLesson -> Module -> Course relation chain, ensuring no N+1 patterns in the teacher engagement report (S-07), and validating the pure function aggregation approach in `lmsAnalyticsUtils.ts`.
