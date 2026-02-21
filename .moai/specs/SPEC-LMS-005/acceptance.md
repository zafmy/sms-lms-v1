# SPEC-LMS-005: Acceptance Criteria

| Field    | Value         |
| -------- | ------------- |
| SPEC     | SPEC-LMS-005  |
| Title    | LMS Analytics Dashboard |

---

## REQ-LMS-043: Student Progress View

### AC-043-01: Student sees LMS progress summary

```gherkin
Given a student is authenticated and has 3 active course enrollments
  And the student has completed 5 out of 10 total lessons across all courses
  And the student has an average quiz score of 78%
When the student views their dashboard at /student
Then the dashboard displays an LMS Progress widget showing:
  | Metric                  | Value |
  | Courses Enrolled        | 3     |
  | Overall Completion      | 50%   |
  | Average Quiz Score      | 78%   |
And the widget displays a list of 3 active courses, each with a progress bar
```

### AC-043-02: Student sees per-course progress bars

```gherkin
Given a student is enrolled in "Introduction to Math" with 4 of 8 lessons completed
  And the student is enrolled in "English Literature" with 6 of 6 lessons completed
  And the student is enrolled in "Science Basics" with 0 of 5 lessons completed
When the student views their dashboard
Then the LMS Progress widget shows:
  | Course               | Progress |
  | Introduction to Math | 50%      |
  | English Literature   | 100%     |
  | Science Basics       | 0%       |
And each progress bar visually reflects the completion percentage
```

### AC-043-03: Student with no enrollments

```gherkin
Given a student is authenticated
  And the student has zero active enrollments
When the student views their dashboard
Then the LMS Progress widget displays a message: "No active course enrollments"
  And no progress bars or statistics are shown
```

### AC-043-04: Student with enrollments but no quiz attempts

```gherkin
Given a student has 2 active enrollments
  And the student has completed some lessons
  And the student has taken zero quizzes
When the student views their dashboard
Then the LMS Progress widget shows:
  | Metric             | Value |
  | Average Quiz Score | N/A   |
And the courses enrolled count and completion percentage display correctly
```

---

## REQ-LMS-044: Teacher Course Analytics

### AC-044-01: Teacher views full course analytics

```gherkin
Given a teacher owns "Introduction to Math" with course ID 5
  And the course has 15 active enrollments, 3 completed, and 2 dropped
  And the course has 4 modules with 12 total lessons
  And the average completion rate across active enrollments is 62%
When the teacher navigates to /list/courses/5/analytics
Then the page displays:
  | Metric                   | Value           |
  | Active Enrollments       | 15              |
  | Completed Enrollments    | 3               |
  | Dropped Enrollments      | 2               |
  | Average Completion Rate  | 62%             |
And a per-module completion bar chart is rendered with 4 bars
And a quiz score distribution chart is rendered with 5 score ranges
```

### AC-044-02: Teacher sees at-risk students on analytics page

```gherkin
Given "Introduction to Math" has 15 active enrollments
  And student "Alice" last completed a lesson 10 days ago and has no quiz submissions since
  And student "Bob" last submitted a quiz 8 days ago and has no lesson completions since
  And student "Charlie" completed a lesson 2 days ago
When the teacher views the course analytics page
Then the at-risk students list shows:
  | Student | Last Activity | Days Inactive |
  | Alice   | 10 days ago   | 10            |
  | Bob     | 8 days ago    | 8             |
And "Charlie" does not appear in the at-risk list
```

### AC-044-03: Teacher cannot access analytics for another teacher's course

```gherkin
Given teacher "Mr. Smith" owns course ID 5
  And teacher "Ms. Jones" does not own course ID 5
When "Ms. Jones" navigates to /list/courses/5/analytics
Then the system returns a 404 Not Found response
  And no analytics data is displayed
```

### AC-044-04: Course with no enrollments

```gherkin
Given a teacher owns "Advanced Physics" with 0 enrollments
When the teacher navigates to the course analytics page
Then the page displays:
  | Metric                  | Value |
  | Active Enrollments      | 0     |
  | Average Completion Rate | 0%    |
And the at-risk students list shows "No enrolled students"
And the charts show empty states with "No data available" labels
```

---

## REQ-LMS-045: Teacher Dashboard LMS Summary

### AC-045-01: Teacher sees LMS summary on dashboard

```gherkin
Given a teacher owns 3 courses
  And the 3 courses have a combined 45 active student enrollments
  And the average completion rate across all courses is 58%
  And 7 students have been inactive for 7+ days across all courses
  And 2 courses have quizzes with SHORT_ANSWER or ESSAY questions that have ungraded attempts
When the teacher views their dashboard at /teacher
Then the TeacherLmsOverview widget displays:
  | Metric                 | Value |
  | Total LMS Students     | 45    |
  | Average Completion     | 58%   |
  | Students At Risk       | 7     |
  | Pending Quiz Reviews   | 2     |
```

### AC-045-02: Teacher with no courses

```gherkin
Given a teacher owns zero courses
When the teacher views their dashboard
Then the TeacherLmsOverview widget displays "No courses created yet"
  And no statistics are shown
```

---

## REQ-LMS-046: Admin LMS Overview

### AC-046-01: Admin sees school-wide LMS overview

```gherkin
Given the school has:
  | Metric                | Value |
  | Published Courses     | 8     |
  | Draft Courses         | 3     |
  | Archived Courses      | 1     |
  | Active Enrollments    | 120   |
  | Completed Enrollments | 30    |
  | Dropped Enrollments   | 15    |
  And the overall quiz pass rate is 72%
  And "Introduction to Math" has the highest activity in the last 30 days
  And "Advanced Physics" has the lowest activity in the last 30 days
When the admin views their dashboard at /admin
Then the AdminLmsOverview widget displays:
  | Metric              | Value                |
  | Courses (Published) | 8                    |
  | Courses (Draft)     | 3                    |
  | Courses (Archived)  | 1                    |
  | Active Enrollments  | 120                  |
  | Quiz Pass Rate      | 72%                  |
  | Most Active Course  | Introduction to Math |
  | Least Active Course | Advanced Physics     |
```

### AC-046-02: Admin sees LMS overview with no data

```gherkin
Given no courses exist in the system
When the admin views their dashboard
Then the AdminLmsOverview widget displays "No LMS data available"
  And all counters show 0
```

---

## REQ-LMS-047: Engagement Heatmap

### AC-047-01: Heatmap renders 90-day activity

```gherkin
Given "Introduction to Math" has the following activity in the past 90 days:
  | Date       | Lesson Completions | Quiz Submissions |
  | 2026-02-20 | 3                  | 2                |
  | 2026-02-19 | 0                  | 0                |
  | 2026-02-18 | 1                  | 0                |
When the teacher views the course analytics page
Then the engagement heatmap displays a calendar grid covering the past 90 days
  And the cell for 2026-02-20 shows dark green (5 total activities)
  And the cell for 2026-02-19 shows gray (0 activities)
  And the cell for 2026-02-18 shows light green (1 activity)
```

### AC-047-02: Heatmap tooltip shows details

```gherkin
Given the engagement heatmap is rendered for a course
  And 2026-02-20 has 3 lesson completions and 2 quiz submissions
When the teacher hovers over the cell for 2026-02-20
Then a tooltip displays:
  | Field               | Value       |
  | Date                | Feb 20, 2026|
  | Lesson Completions  | 3           |
  | Quiz Submissions    | 2           |
  | Total               | 5           |
```

### AC-047-03: Heatmap for course with no activity

```gherkin
Given a newly published course with zero lesson completions and zero quiz submissions
When the teacher views the course analytics page
Then the engagement heatmap renders with all cells in gray
  And a message below the heatmap states "No engagement activity recorded"
```

---

## REQ-LMS-048: At-Risk Detection

### AC-048-01: Student flagged at exactly 7 days

```gherkin
Given student "Alice" is actively enrolled in "Introduction to Math"
  And Alice's last lesson completion was exactly 7 days ago
  And Alice has no quiz submissions in the past 7 days
  And the AT_RISK_THRESHOLD_DAYS is set to 7
When the identifyAtRiskStudents function is called with today's date as reference
Then Alice is included in the at-risk results
  And Alice's daysInactive value is 7
```

### AC-048-02: Student NOT flagged at 6 days

```gherkin
Given student "Bob" is actively enrolled in "Introduction to Math"
  And Bob's last quiz submission was exactly 6 days ago
  And the AT_RISK_THRESHOLD_DAYS is set to 7
When the identifyAtRiskStudents function is called with today's date as reference
Then Bob is NOT included in the at-risk results
```

### AC-048-03: Student with no activity at all

```gherkin
Given student "Charlie" enrolled in "Introduction to Math" 14 days ago
  And Charlie has zero lesson completions and zero quiz attempts
When the identifyAtRiskStudents function is called
Then Charlie is included in the at-risk results
  And Charlie's lastActivityDate is null
  And Charlie's daysInactive is 14 (based on enrollment date)
```

### AC-048-04: Dropped student is not flagged

```gherkin
Given student "Diana" was enrolled in "Introduction to Math" but has status DROPPED
  And Diana has no activity in the past 30 days
When the identifyAtRiskStudents function is called
Then Diana is NOT included in the at-risk results
  (Only ACTIVE enrollments are evaluated)
```

---

## REQ-LMS-049: Analytics Utility Module

### AC-049-01: analyticsUtils.ts is pure

```gherkin
Given the file src/lib/analyticsUtils.ts exists
When the file contents are inspected
Then the file does NOT contain any import from "@/lib/prisma"
  And the file does NOT contain any import from "@prisma/client"
  And the file does NOT contain any async function declarations
  And the file does NOT contain any database query calls
  And every exported function accepts typed parameters and returns a typed result
```

### AC-049-02: All analytics computations use analyticsUtils

```gherkin
Given the following Server Components exist:
  | Component                     |
  | StudentLmsProgress            |
  | TeacherLmsOverview            |
  | AdminLmsOverview              |
  | CourseAnalyticsContainer      |
  | LmsEngagementHeatmapContainer |
When the source code of each component is inspected
Then each component imports at least one function from "@/lib/analyticsUtils"
  And no component performs inline analytics calculations (no manual percentage, average, or threshold computations)
```

---

## Edge Cases

### EC-01: Course with modules but no lessons

```gherkin
Given a course has 3 modules but all modules have 0 lessons
When the calculateCourseCompletionRate function is called with totalLessons = 0
Then the function returns completionRate of 0 (not NaN or Infinity)
  And no division-by-zero error occurs
```

### EC-02: Quiz with all null percentage scores

```gherkin
Given a quiz has 5 attempts but all have percentage = null (ungraded)
When calculateQuizScoreDistribution is called
Then the function returns all buckets with count = 0
  And no error is thrown for null values
```

### EC-03: Single student, single course, single lesson

```gherkin
Given a course has exactly 1 module with exactly 1 lesson
  And 1 student is enrolled and has completed the lesson
When analytics are computed
Then completion rate is 100%
  And the student does not appear in the at-risk list
  And the per-module completion chart shows a single bar at 100%
```

### EC-04: Engagement heatmap at year boundary

```gherkin
Given the current date is January 15
When the 90-day engagement heatmap is rendered
Then the heatmap includes dates from mid-October of the previous year
  And month labels correctly span across the year boundary
```

### EC-05: Large number of enrollments (performance)

```gherkin
Given a course has 200 active enrollments
  And each student has progress records for 20 lessons
  And each student has at least 1 quiz attempt
When the teacher navigates to the course analytics page
Then the page loads completely within 2 seconds
  And all charts render without timeout or error
```

---

## Performance Criteria

| Metric | Target | Measurement |
|--------|--------|-------------|
| Course analytics page load time | Under 2 seconds | Browser DevTools network waterfall (DOMContentLoaded) |
| Dashboard widget render time | Under 500ms per widget | Server Component execution time |
| analyticsUtils function execution | Under 50ms per function call | For datasets with up to 500 students |
| Prisma query count per analytics page | Maximum 5 queries | Count distinct Prisma calls in CourseAnalyticsContainer |

---

## Smoke Test Checklist

### Student Dashboard

- [ ] Student dashboard loads without errors
- [ ] LMS Progress widget appears in the RIGHT column
- [ ] Widget shows correct enrolled courses count
- [ ] Widget shows overall completion percentage
- [ ] Widget shows average quiz score (or N/A)
- [ ] Per-course progress bars render with correct widths
- [ ] Widget handles zero enrollments gracefully

### Teacher Dashboard

- [ ] Teacher dashboard loads without errors
- [ ] TeacherLmsOverview widget appears in the RIGHT column
- [ ] Widget shows total student count across courses
- [ ] Widget shows average completion rate
- [ ] Widget shows at-risk student count
- [ ] Widget shows pending review count
- [ ] Widget handles teacher with no courses gracefully

### Admin Dashboard

- [ ] Admin dashboard loads without errors
- [ ] AdminLmsOverview widget appears in the LEFT column
- [ ] Widget shows course counts by status
- [ ] Widget shows enrollment counts by status
- [ ] Widget shows quiz pass rate
- [ ] Widget shows most and least active courses
- [ ] Widget handles empty LMS data gracefully

### Course Analytics Page

- [ ] Page loads at /list/courses/[id]/analytics for teacher who owns the course
- [ ] Page loads for admin for any course
- [ ] Page returns 404 for teacher who does not own the course
- [ ] Page returns 404 for student role
- [ ] Page returns 404 for parent role
- [ ] Enrolled student count displays correctly
- [ ] Completion rate displays correctly
- [ ] Per-module completion bar chart renders with correct number of bars
- [ ] Quiz score distribution chart renders with 5 buckets
- [ ] Engagement heatmap renders 90 days of data
- [ ] Heatmap tooltips show on hover with correct data
- [ ] At-risk students list shows students with 7+ days inactivity
- [ ] Course activity timeline line chart renders
- [ ] All charts handle empty data without errors
- [ ] Page loads within 2 seconds

### Analytics Utility Module

- [ ] `analyticsUtils.ts` contains no Prisma imports
- [ ] `analyticsUtils.ts` contains no async functions
- [ ] All 6 exported functions accept typed inputs and return typed outputs
- [ ] `calculateCourseCompletionRate` handles totalLessons = 0
- [ ] `calculateQuizScoreDistribution` handles null percentages
- [ ] `identifyAtRiskStudents` correctly evaluates 7-day threshold boundary
- [ ] `identifyAtRiskStudents` excludes non-ACTIVE enrollments
- [ ] `calculateEngagementByDay` produces entries for all dates in range (including zero-activity days)
- [ ] `generatePreClassReport` correctly flags engaged vs not-engaged students

---

## Definition of Done

- [ ] All 6 `analyticsUtils.ts` functions implemented and passing unit tests
- [ ] Unit tests cover normal cases, empty data, and boundary conditions
- [ ] StudentLmsProgress widget added to student dashboard and rendering correctly
- [ ] TeacherLmsOverview widget added to teacher dashboard and rendering correctly
- [ ] AdminLmsOverview widget added to admin dashboard and rendering correctly
- [ ] Course analytics page accessible at `/list/courses/[id]/analytics`
- [ ] Authorization enforced: teacher owns course or admin role
- [ ] All 4 Recharts chart components rendering correctly
- [ ] Engagement heatmap rendering 90-day view with correct color coding
- [ ] At-risk students list correctly identifies students with 7+ day inactivity
- [ ] All empty/edge states handled with meaningful UI messages
- [ ] No TypeScript errors (`npx tsc --noEmit` passes)
- [ ] No ESLint errors (`npm run lint` passes)
- [ ] Course analytics page loads within 2 seconds
- [ ] `analyticsUtils.ts` contains zero Prisma imports (pure functions only)
