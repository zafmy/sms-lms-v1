# Implementation Plan: SPEC-LMS-004

## SPEC Reference

| Field    | Value                                                     |
|----------|-----------------------------------------------------------|
| SPEC ID  | SPEC-LMS-004                                             |
| Title    | LMS Progress Tracking and Analytics                      |
| Priority | High                                                     |
| Tags     | LMS, Analytics, Progress, Dashboard, Recharts, Heatmap   |

---

## TAG-001: Student Dashboard Analytics (Widgets 1-4)

### Objective

Surface LMS progress metrics, quiz performance trends, and learning activity patterns on the student dashboard.

### Task 1.1: Create LMS Analytics Utility Module

- **File**: `src/lib/lmsAnalyticsUtils.ts` (new)
- **Type**: Pure utility functions (no Prisma, no side effects)
- **Functions to implement**:
  - `computeCourseCompletion(enrollmentWithModules, progressRecords)` -- returns `{ totalLessons, completedLessons, percentage }`
  - `computeModuleCompletion(moduleWithLessons, progressRecords)` -- returns per-module stats
  - `computeAverageQuizScore(attempts)` -- returns `{ averagePercentage, totalAttempts, passRate }`
  - `computeEngagementDays(progressRecords, quizAttempts, startDate, endDate)` -- returns `{ daysActive, totalDays, activeDates }`
  - `computeQuizDifficulty(attemptsWithResponses)` -- returns `{ averageScore, passRate, mostMissedQuestion }`
  - `formatTimeSpent(totalSeconds)` -- returns formatted string like "2h 15m"
  - `computeHeatmapData(progressRecords, quizAttempts)` -- returns `{ date, count }[]` for calendar year
  - `categorizeStudentEngagement(progressRecords, quizAttempts, windowDays)` -- returns "engaged" or "inactive"
  - `computeAtRiskStatus(progressRecords, quizAttempts, averageQuizPct)` -- returns `{ isAtRisk, reasons }`
- **Pattern**: Follow `gradeUtils.ts` -- exported pure functions with typed inputs/outputs.
- **Complexity**: Medium. 9 pure functions with clear inputs/outputs.
- **Dependencies**: None (pure functions).

### Task 1.2: Create LmsProgressOverview Component

- **File**: `src/components/LmsProgressOverview.tsx` (new)
- **Type**: Server Component
- **Props**: `studentId: string`
- **Behavior**:
  - Fetch ACTIVE enrollments with nested course -> modules -> lessons.
  - Fetch all LessonProgress records for the student.
  - Compute: total enrolled courses, avg completion %, total lessons completed, total time spent.
  - Use `formatTimeSpent` from `lmsAnalyticsUtils.ts`.
  - Apply color coding (green/yellow/red) to completion percentage.
- **Query pattern**:
  ```
  prisma.enrollment.findMany({
    where: { studentId, status: "ACTIVE" },
    include: { course: { include: { modules: { include: { lessons: { select: { id: true } } } } } } }
  })
  prisma.lessonProgress.findMany({
    where: { studentId },
    select: { lessonId: true, status: true, timeSpentSeconds: true }
  })
  ```
- **Layout**: 4-metric grid (2x2 on mobile, 4x1 on desktop) in a white rounded card.
- **Complexity**: Low-Medium. Straightforward data fetch + aggregation.
- **Dependencies**: Task 1.1.

### Task 1.3: Enhance EnrolledCourses with Module Breakdown

- **File**: `src/components/EnrolledCourses.tsx` (modify)
- **Changes**:
  1. Extend the existing enrollment query to include quiz data:
     - Add `modules.lessons.quizzes.attempts` (filtered to student's attempts) to the include chain.
  2. For each course card, add a collapsible module breakdown section below the `CourseProgressBar`:
     - Module name + "X/Y lessons completed" per module.
     - If the module has quizzes with submitted attempts, show average quiz percentage.
  3. Keep the existing layout (link wrapper, course title, teacher/subject, progress bar).
  4. Add a toggle to expand/collapse module details (default: collapsed).
- **Impact**: Modifies an existing component. Must preserve all current behavior.
- **Complexity**: Medium. Adding state for collapse/expand requires converting part of the card to a Client Component, or creating a small `ModuleBreakdown` Client Component for the expandable section.
- **Dependencies**: Task 1.1.

### Task 1.4: Create QuizPerformanceTrend Components

- **Files**:
  - `src/components/QuizPerformanceTrendContainer.tsx` (new, Server Component)
  - `src/components/QuizPerformanceTrend.tsx` (new, Client Component)
- **Container behavior**:
  - Fetch all submitted `QuizAttempt` records for the student (where `submittedAt` is not null).
  - Map to `{ date: submittedAt.toISOString(), percentage, quizTitle }[]`, sorted by date.
  - Pass data array and `passingScore: 70` to the chart component.
- **Chart behavior**:
  - Recharts `LineChart` with:
    - `XAxis` (date, formatted as "MMM DD").
    - `YAxis` (0-100, percentage).
    - `Line` (dataKey: "percentage", stroke: "#8884d8").
    - `ReferenceLine` (y: passingScore, stroke: "red", strokeDasharray: "3 3", label: "Pass").
    - `Tooltip` (custom content showing quiz title + score).
    - `ResponsiveContainer` (width: "100%", height: "100%").
  - If fewer than 2 data points: render "Take more quizzes to see your performance trend."
- **Complexity**: Medium. Standard Recharts pattern following `ClassOccupancyChart` but with LineChart.
- **Dependencies**: None (can be built in parallel with Task 1.3).

### Task 1.5: Create LearningActivityHeatmap Components

- **Files**:
  - `src/components/LearningActivityHeatmapContainer.tsx` (new, Server Component)
  - `src/components/LearningActivityHeatmap.tsx` (new, Client Component)
- **Container behavior**:
  - Fetch `LessonProgress` records with `completedAt` in the current year.
  - Fetch `QuizAttempt` records with `submittedAt` in the current year.
  - Use `computeHeatmapData` to aggregate into `{ date: "YYYY-MM-DD", count: number }[]`.
- **Heatmap behavior**:
  - Adapt the `AttendanceHeatmap` month-row layout pattern.
  - Instead of green/red for present/absent, use a 4-level green intensity scale:
    - No activity: `bg-gray-100`
    - 1 event: `bg-green-200`
    - 2-3 events: `bg-green-400`
    - 4+ events: `bg-green-600`
  - Month labels on the left (Jan, Feb, ...).
  - Day cells in a flex-wrap row per month.
  - Hover tooltip: date + activity count.
  - Legend at bottom.
- **Complexity**: Medium. Adapting existing `AttendanceHeatmap` pattern significantly reduces implementation effort.
- **Dependencies**: Task 1.1 (for `computeHeatmapData`).

### Task 1.6: Integrate Student Dashboard

- **File**: `src/app/(dashboard)/student/page.tsx` (modify)
- **Changes**:
  1. Import `LmsProgressOverview`, `QuizPerformanceTrendContainer`, `LearningActivityHeatmapContainer`.
  2. Add to the right sidebar (after `EnrolledCourses`, before `StudentAttendanceCard`):
     ```tsx
     <LmsProgressOverview studentId={userId!} />
     <div className="bg-white p-4 rounded-md h-[300px]">
       <h2 className="text-lg font-semibold mb-2">Quiz Performance Trend</h2>
       <QuizPerformanceTrendContainer studentId={userId!} />
     </div>
     <LearningActivityHeatmapContainer studentId={userId!} />
     ```
- **Complexity**: Low. Import + JSX insertion.
- **Dependencies**: Tasks 1.2, 1.3, 1.4, 1.5.

### Files Summary (TAG-001)

| File | Action | Component |
|------|--------|-----------|
| `src/lib/lmsAnalyticsUtils.ts` | Create | Utility functions |
| `src/components/LmsProgressOverview.tsx` | Create | Server Component |
| `src/components/EnrolledCourses.tsx` | Modify | Add module breakdown |
| `src/components/QuizPerformanceTrendContainer.tsx` | Create | Server Component |
| `src/components/QuizPerformanceTrend.tsx` | Create | Client Component (Recharts) |
| `src/components/LearningActivityHeatmapContainer.tsx` | Create | Server Component |
| `src/components/LearningActivityHeatmap.tsx` | Create | Client Component |
| `src/app/(dashboard)/student/page.tsx` | Modify | Dashboard integration |

---

## TAG-002: Teacher Dashboard Analytics (Widgets 5-8)

### Objective

Provide teachers with course engagement insights, pre-class reports, at-risk student alerts, and quiz difficulty analytics.

### Task 2.1: Create CourseEngagementOverview Components

- **Files**:
  - `src/components/CourseEngagementOverviewContainer.tsx` (new, Server Component)
  - `src/components/CourseEngagementOverview.tsx` (new, Client or Server Component)
- **Container behavior**:
  - Fetch teacher's ACTIVE courses with enrollments.
  - For each course, compute:
    - Students with any LMS activity in the last 7 days.
    - Average completion rate across all ACTIVE enrolled students.
    - Average quiz score across all submitted attempts.
  - Use `computeCourseCompletion` and `computeAverageQuizScore` from `lmsAnalyticsUtils.ts`.
- **Display**: Card per course showing title, code, engaged students count, completion rate, avg quiz score.
- **Complexity**: Medium. Multiple queries per course, but bounded by teacher's course count (typically 2-5).
- **Dependencies**: Task 1.1 (utility functions).

### Task 2.2: Create PreClassEngagementReport Component

- **File**: `src/components/PreClassEngagementReport.tsx` (new, Server Component)
- **Props**: `teacherId: string`
- **Behavior**:
  - Fetch teacher's ACTIVE courses with ACTIVE enrolled students.
  - For each student in each course, query `LessonProgress` and `QuizAttempt` records from the last 14 days.
  - Categorize each student as Engaged (green) or Inactive (red) using `categorizeStudentEngagement`.
  - Sort: inactive students first, then engaged alphabetically.
  - Render summary: "X of Y students engaged in the last 14 days."
  - Render per-student rows: name, lessons completed (14d), quiz attempts (14d), last activity date, Engaged/Inactive badge.
- **Query optimization**: Batch fetch all LessonProgress and QuizAttempt records for all enrolled students in a single query each, then filter in JavaScript. Avoid per-student queries.
- **Complexity**: High. This is the most complex widget. Requires careful query design to avoid N+1.
- **Dependencies**: Task 1.1.

### Task 2.3: Create AtRiskStudentsAlert Component

- **File**: `src/components/AtRiskStudentsAlert.tsx` (new, Server Component)
- **Props**: `teacherId: string`
- **Behavior**:
  - Fetch all students across teacher's ACTIVE courses with ACTIVE enrollments.
  - For each student, compute:
    - Days since last LMS activity (max of `LessonProgress.completedAt` and `QuizAttempt.submittedAt`).
    - Average quiz percentage.
  - Flag as at-risk if: no activity in 7 days OR average quiz score < 70%.
  - Use `computeAtRiskStatus` from `lmsAnalyticsUtils.ts`.
  - Render alert cards with student name, course, risk reasons, days since last activity.
  - If no at-risk students: "No at-risk students detected."
- **Query optimization**: Reuse the same batch query pattern from Task 2.2. If both widgets are on the same page, consider a shared data-fetching parent component to avoid duplicate queries.
- **Complexity**: Medium. Logic is straightforward; query overlap with Task 2.2.
- **Dependencies**: Task 1.1.

### Task 2.4: Create ClassQuizAnalytics Components

- **Files**:
  - `src/components/ClassQuizAnalyticsContainer.tsx` (new, Server Component)
  - `src/components/ClassQuizAnalytics.tsx` (new, Client or Server Component)
- **Container behavior**:
  - Fetch all quizzes across teacher's ACTIVE courses, including attempts and responses.
  - For each quiz, compute:
    - Students attempted / total enrolled.
    - Average score percentage.
    - Pass rate.
    - Most-missed question (question with lowest `isCorrect` rate).
  - Use `computeQuizDifficulty` from `lmsAnalyticsUtils.ts`.
- **Display**: Grouped by course. Per-quiz row: title, attempt count, avg score, pass rate, most-missed question (truncated to 80 chars).
- **Complexity**: Medium-High. The most-missed question calculation requires aggregating across `QuestionResponse` records.
- **Dependencies**: Task 1.1.

### Task 2.5: Integrate Teacher Dashboard

- **File**: `src/app/(dashboard)/teacher/page.tsx` (modify)
- **Changes**:
  1. Import all 4 new components/containers.
  2. Add to the right sidebar, after `TodaySchedule` and before `PendingGrading`:
     ```tsx
     <PreClassEngagementReport teacherId={userId!} />
     <AtRiskStudentsAlert teacherId={userId!} />
     <CourseEngagementOverviewContainer teacherId={userId!} />
     <ClassQuizAnalyticsContainer teacherId={userId!} />
     ```
  3. Note: `PreClassEngagementReport` is placed first because it is the most critical widget for the bi-weekly model.
- **Complexity**: Low. Import + JSX insertion.
- **Dependencies**: Tasks 2.1, 2.2, 2.3, 2.4.

### Files Summary (TAG-002)

| File | Action | Component |
|------|--------|-----------|
| `src/components/CourseEngagementOverviewContainer.tsx` | Create | Server Component |
| `src/components/CourseEngagementOverview.tsx` | Create | Display Component |
| `src/components/PreClassEngagementReport.tsx` | Create | Server Component |
| `src/components/AtRiskStudentsAlert.tsx` | Create | Server Component |
| `src/components/ClassQuizAnalyticsContainer.tsx` | Create | Server Component |
| `src/components/ClassQuizAnalytics.tsx` | Create | Display Component |
| `src/app/(dashboard)/teacher/page.tsx` | Modify | Dashboard integration |

---

## TAG-003: Parent Dashboard Analytics (Widgets 9-10) + Admin Widget

### Objective

Give parents visibility into children's LMS engagement and provide admins with school-wide adoption metrics.

### Task 3.1: Create ChildLmsProgressCard Component

- **File**: `src/components/ChildLmsProgressCard.tsx` (new, Server Component)
- **Props**: `studentId: string, studentName: string`
- **Behavior**:
  - Fetch child's ACTIVE enrollments with course -> modules -> lessons.
  - Fetch child's LessonProgress records.
  - Fetch child's most recent submitted QuizAttempt (limit 1, orderBy submittedAt desc).
  - Compute: courses count, overall completion %, most recent quiz score, days active this week.
  - Use `computeCourseCompletion`, `computeEngagementDays` from `lmsAnalyticsUtils.ts`.
  - Render compact card matching `ChildQuickStats` layout (flex row with centered metrics).
  - Include "View Courses" link to `/list/courses?childId=[studentId]`.
- **Complexity**: Low-Medium. Similar to `ChildQuickStats` pattern.
- **Dependencies**: Task 1.1.

### Task 3.2: Create ChildLearningActivity Component

- **File**: `src/components/ChildLearningActivity.tsx` (new, Server Component)
- **Props**: `studentId: string, studentName: string`
- **Behavior**:
  - Fetch 10 most recent LMS events for the child:
    - `LessonProgress` where `status === "COMPLETED"` and `completedAt` is not null, include lesson -> module -> course title.
    - `QuizAttempt` where `submittedAt` is not null, include quiz title + course title via quiz -> lesson -> module -> course.
    - `Enrollment` recent enrollments, include course title.
  - Merge all events into a single array, sort by date descending, take first 10.
  - Format each event with descriptive text and relative timestamp.
- **Relative timestamp logic**: Use a simple utility function computing difference from now (e.g., "2 days ago", "5 hours ago", "just now").
- **Complexity**: Medium. Merging 3 data sources requires careful date handling.
- **Dependencies**: None (standalone data fetching).

### Task 3.3: Create LmsAdoptionMetrics Component (Admin)

- **File**: `src/components/LmsAdoptionMetrics.tsx` (new, Server Component)
- **Props**: (none)
- **Behavior**:
  - Count ACTIVE courses: `prisma.course.count({ where: { status: "ACTIVE" } })`.
  - Count active enrollments: `prisma.enrollment.count({ where: { status: "ACTIVE" } })`.
  - Count students with recent activity (14 days): Count distinct studentIds from `LessonProgress` and `QuizAttempt` in last 14 days vs total students with ACTIVE enrollments.
  - Count teachers with ACTIVE courses: Count distinct teacherIds from ACTIVE courses vs total teachers.
  - Render 4-metric card: Total Courses, Total Enrollments, Engagement Rate %, Teacher Adoption Rate %.
- **Complexity**: Low-Medium. Straightforward aggregate counts.
- **Dependencies**: None.

### Task 3.4: Integrate Parent Dashboard

- **File**: `src/app/(dashboard)/parent/page.tsx` (modify)
- **Changes**:
  1. Import `ChildLmsProgressCard` and `ChildLearningActivity`.
  2. Inside the `students.map()` loop, after `ChildGradeOverview` and before the schedule calendar:
     ```tsx
     <div className="mt-4">
       <ChildLmsProgressCard
         studentId={student.id}
         studentName={student.name + " " + student.surname}
       />
     </div>
     <div className="mt-4">
       <ChildLearningActivity
         studentId={student.id}
         studentName={student.name + " " + student.surname}
       />
     </div>
     ```
- **Complexity**: Low. Import + JSX insertion.
- **Dependencies**: Tasks 3.1, 3.2.

### Task 3.5: Integrate Admin Dashboard

- **File**: `src/app/(dashboard)/admin/page.tsx` (modify)
- **Changes**:
  1. Import `LmsAdoptionMetrics`.
  2. Add below the `UserCard` row and above the chart row:
     ```tsx
     <div className="w-full">
       <LmsAdoptionMetrics />
     </div>
     ```
- **Complexity**: Low. Import + JSX insertion.
- **Dependencies**: Task 3.3.

### Files Summary (TAG-003)

| File | Action | Component |
|------|--------|-----------|
| `src/components/ChildLmsProgressCard.tsx` | Create | Server Component |
| `src/components/ChildLearningActivity.tsx` | Create | Server Component |
| `src/components/LmsAdoptionMetrics.tsx` | Create | Server Component |
| `src/app/(dashboard)/parent/page.tsx` | Modify | Dashboard integration |
| `src/app/(dashboard)/admin/page.tsx` | Modify | Dashboard integration |

---

## Technical Approach

### Aggregation Architecture

All LMS analytics follow a three-layer architecture:

```
Layer 1: Prisma Queries (Server Components)
  ↓ Raw data with eager-loaded relations via include
Layer 2: Pure Aggregation Functions (lmsAnalyticsUtils.ts)
  ↓ Computed metrics (percentages, counts, categorizations)
Layer 3: Presentation Components (Server or Client Components)
  ↓ Rendered HTML / Recharts charts
```

This architecture ensures:
- Testability: Layer 2 functions are pure and unit-testable.
- Separation of concerns: Data fetching, computation, and rendering are isolated.
- Consistency: The same utility functions are reused across student, teacher, parent, and admin views.

### Query Optimization Strategy

**Batch fetching over per-entity queries**:

For teacher widgets (TAG-002), multiple widgets need similar data (enrolled students, their progress, their attempts). Rather than each widget querying independently:

1. The dashboard page or a shared Container component fetches the common data set.
2. Data is passed as props to individual widgets.

Alternatively, since Next.js 16 Server Components run on the server and Prisma queries are de-duplicated within a single render pass, the framework's built-in request deduplication may handle overlap without explicit optimization.

**Eager loading with `include`**:

All queries use Prisma `include` to eager-load related data in a single query rather than lazy-loading in loops.

**Bounded result sets**:

- Activity feeds are limited to 10 entries.
- Heatmap data covers 1 year (bounded).
- At-risk calculations use 7-day and 14-day windows (bounded).

### Reuse Strategy

| Existing Asset            | How It Is Reused                                                    |
|---------------------------|---------------------------------------------------------------------|
| `CourseProgressBar`       | Reused in `EnrolledCourses` enhanced module breakdown               |
| `AttendanceHeatmap` pattern | Layout and month-row rendering adapted for `LearningActivityHeatmap` |
| `ChildQuickStats` layout  | Card layout pattern replicated in `ChildLmsProgressCard`            |
| `ClassAttendanceOverview` | Per-class iteration pattern replicated in teacher analytics         |
| `gradeUtils.ts` structure | Pure function module pattern replicated in `lmsAnalyticsUtils.ts`   |
| Color coding convention   | Applied to all new widgets (green/yellow/red at 90%/75% thresholds) |

---

## Risk Assessment

| Risk                                         | Likelihood | Impact | Mitigation                                                                |
|----------------------------------------------|------------|--------|---------------------------------------------------------------------------|
| N+1 queries in teacher widgets               | Medium     | Medium | Batch fetch pattern; monitor query count in dev mode; Prisma `include`    |
| Dashboard load time exceeds 2s               | Low        | Medium | Bounded data volumes; lazy loading for below-fold widgets                 |
| `EnrolledCourses` modification breaks existing behavior | Medium | High | Careful preserve-first approach; run existing tests before modifying      |
| Heatmap rendering performance with 365 cells | Low        | Low    | Lightweight DOM elements (divs, not SVG); matches AttendanceHeatmap scale |
| Teacher pre-class report slow for large classes | Low     | Medium | Batch query with single `findMany` per data type, filter in JS           |
| Division by zero in percentage calculations  | Medium     | Low    | All utility functions guard against zero divisors (return 0)              |
| Inconsistent scoring policy application      | Low        | Medium | Reuse `quizUtils.ts` scoring logic for canonical score computation       |

---

## Dependencies

| Dependency       | Type     | Status       | Impact if Missing                                          |
|------------------|----------|--------------|-------------------------------------------------------------|
| SPEC-LMS-001    | SPEC     | Implemented  | LMS models, enrollment, lesson progress, quiz engine        |
| SPEC-LMS-002    | SPEC     | Implemented  | Self-enrollment, enrollment status management               |
| Recharts 3.7.0  | Library  | Installed    | Required for LineChart (quiz trend) and chart components     |
| LessonProgress data | Data | Available    | timeSpentSeconds must be recorded by existing lesson viewer |
| QuizAttempt data | Data     | Available    | submittedAt, score, percentage must be populated            |

---

## Implementation Order

```
TAG-001 (Student Analytics):
  Task 1.1 (lmsAnalyticsUtils.ts) ──────────────────────────────────────┐
  Task 1.2 (LmsProgressOverview) ◄──────────────────────────────────────┤
  Task 1.3 (EnrolledCourses enhance) ◄─────────────────────────────────┤
  Task 1.4 (QuizPerformanceTrend) ◄──── (can parallel with 1.2, 1.3) ──┤
  Task 1.5 (LearningActivityHeatmap) ◄─────────────────────────────────┤
  Task 1.6 (Student dashboard integration) ◄── all above ──────────────┘

TAG-002 (Teacher Analytics):
  Task 2.1 (CourseEngagementOverview) ──┐
  Task 2.2 (PreClassEngagementReport) ──┤── can run in parallel
  Task 2.3 (AtRiskStudentsAlert) ───────┤   (all depend on Task 1.1)
  Task 2.4 (ClassQuizAnalytics) ────────┤
  Task 2.5 (Teacher dashboard integration) ◄── all above

TAG-003 (Parent + Admin Analytics):
  Task 3.1 (ChildLmsProgressCard) ──────┐
  Task 3.2 (ChildLearningActivity) ─────┤── can run in parallel
  Task 3.3 (LmsAdoptionMetrics) ────────┤
  Task 3.4 (Parent dashboard integration) ◄── 3.1, 3.2
  Task 3.5 (Admin dashboard integration) ◄── 3.3
```

**Critical path**: Task 1.1 (utility module) is the foundation for all subsequent tasks. It should be implemented and tested first.

**Parallel opportunities**:
- Within TAG-001: Tasks 1.2, 1.3, 1.4, 1.5 can run in parallel after Task 1.1 completes.
- Within TAG-002: Tasks 2.1, 2.2, 2.3, 2.4 can run in parallel after Task 1.1 completes.
- TAG-003 can start in parallel with TAG-002 (both depend only on Task 1.1).

**Total files**: 1 utility module + 14 component files (10 new, 1 modified) + 4 dashboard page modifications = 19 files.
