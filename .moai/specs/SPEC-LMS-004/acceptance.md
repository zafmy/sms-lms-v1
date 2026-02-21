# Acceptance Criteria: SPEC-LMS-004

## SPEC Reference

| Field    | Value                                                     |
|----------|-----------------------------------------------------------|
| SPEC ID  | SPEC-LMS-004                                             |
| Title    | LMS Progress Tracking and Analytics                      |
| Tags     | LMS, Analytics, Progress, Dashboard, Recharts, Heatmap   |

---

## AC-050: Student LMS Progress Overview Widget

### AC-050-01: Student sees aggregate LMS metrics

```
Given a student with 3 ACTIVE enrolled courses
And the student has completed 25 of 40 total lessons across all courses
And the student has accumulated 7200 timeSpentSeconds in LessonProgress records
When the student views the student dashboard
Then the LmsProgressOverview widget displays:
  - "3 Active Courses"
  - "63%" completion with yellow color coding (63% < 75%)
  - "25 Lessons Completed"
  - "2h 0m Total Time Spent"
```

### AC-050-02: Student with high completion sees green color

```
Given a student with 2 courses and 18/20 lessons completed (90%)
When the student views the student dashboard
Then the LmsProgressOverview widget shows "90%" with green color coding
```

### AC-050-03: Student with no enrollments sees empty state

```
Given a student with no ACTIVE enrollments
When the student views the student dashboard
Then the LmsProgressOverview widget displays:
  - "0 Active Courses"
  - "0%" completion
  - "0 Lessons Completed"
  - "0m Total Time Spent"
And no errors or broken layout occur
```

---

## AC-051: Student Course Progress Detail

### AC-051-01: Student sees per-module breakdown

```
Given a student enrolled in a course with 3 modules:
  - Module 1: 5 lessons (3 completed)
  - Module 2: 4 lessons (4 completed)
  - Module 3: 3 lessons (0 completed)
When the student views the EnrolledCourses widget
And expands the module breakdown for this course
Then the module breakdown shows:
  - "Module 1: 3/5 lessons"
  - "Module 2: 4/4 lessons"
  - "Module 3: 0/3 lessons"
And the CourseProgressBar shows 7/12 (58%)
```

### AC-051-02: Module with quiz scores displays average

```
Given a student enrolled in a course where Module 1 has 2 quizzes
And the student scored 80% and 90% on the two quizzes
When the student views the module breakdown
Then Module 1 shows an average quiz score of 85%
```

### AC-051-03: Module breakdown is collapsed by default

```
Given a student viewing the EnrolledCourses widget
Then each course card shows the existing CourseProgressBar
And the module breakdown section is collapsed (not visible by default)
When the student clicks to expand
Then the per-module details become visible
```

---

## AC-052: Student Quiz Performance Trend Chart

### AC-052-01: Student sees quiz score trend line

```
Given a student who has submitted 5 quiz attempts with scores:
  - Quiz A: 60% on Jan 15
  - Quiz B: 70% on Jan 22
  - Quiz C: 75% on Feb 5
  - Quiz D: 80% on Feb 12
  - Quiz E: 85% on Feb 19
When the student views the student dashboard
Then a LineChart displays 5 data points showing an upward trend
And a horizontal dashed reference line appears at 70% labeled "Pass"
And hovering over a data point shows the quiz title and score
```

### AC-052-02: Student with fewer than 2 attempts sees message

```
Given a student who has submitted only 1 quiz attempt
When the student views the student dashboard
Then the QuizPerformanceTrend widget displays:
  "Take more quizzes to see your performance trend."
And no chart is rendered
```

### AC-052-03: Student with zero attempts sees message

```
Given a student with no submitted quiz attempts
When the student views the student dashboard
Then the QuizPerformanceTrend widget displays:
  "Take more quizzes to see your performance trend."
```

---

## AC-053: Student Learning Activity Heatmap

### AC-053-01: Student sees activity density on calendar

```
Given a student with the following LMS activity in February:
  - Feb 1: 1 lesson completed
  - Feb 2: 2 lessons completed + 1 quiz submitted (total: 3)
  - Feb 5: 1 quiz submitted
  - Feb 10: 4 lessons completed + 1 quiz submitted (total: 5)
When the student views the student dashboard
Then the LearningActivityHeatmap shows:
  - Feb 1 cell: light green (1 event)
  - Feb 2 cell: medium green (2-3 events)
  - Feb 5 cell: light green (1 event)
  - Feb 10 cell: dark green (4+ events)
  - All other Feb cells: gray (no activity)
```

### AC-053-02: Heatmap hover shows date and count

```
Given a student viewing the heatmap
When the student hovers over a colored cell
Then a tooltip shows the date and number of activities
  Example: "Feb 10 - 5 activities"
```

### AC-053-03: Student with no activity sees empty state

```
Given a student with no LessonProgress completions and no QuizAttempt submissions
When the student views the student dashboard
Then the LearningActivityHeatmap displays:
  "No learning activity recorded yet."
```

### AC-053-04: Heatmap legend is displayed

```
Given a student viewing the heatmap widget
Then a legend row appears below the calendar showing:
  - Gray square: "No activity"
  - Light green square: "1 activity"
  - Medium green square: "2-3 activities"
  - Dark green square: "4+ activities"
```

---

## AC-054: Teacher Course Engagement Overview

### AC-054-01: Teacher sees per-course engagement cards

```
Given a teacher with 2 ACTIVE courses:
  - Course A: 15 enrolled students, 10 had LMS activity in the last 7 days, avg completion 65%, avg quiz score 78%
  - Course B: 8 enrolled students, 3 had LMS activity in the last 7 days, avg completion 40%, avg quiz score 62%
When the teacher views the teacher dashboard
Then the CourseEngagementOverview widget shows 2 cards:
  - Course A: "10 of 15 students active this week", "65% avg completion", "78% avg quiz score"
  - Course B: "3 of 8 students active this week", "40% avg completion", "62% avg quiz score"
```

### AC-054-02: Teacher with no ACTIVE courses sees empty state

```
Given a teacher with no ACTIVE courses (only DRAFT courses)
When the teacher views the teacher dashboard
Then the CourseEngagementOverview widget displays: "No active courses."
```

### AC-054-03: Course with no enrolled students shows zero metrics

```
Given a teacher with an ACTIVE course that has 0 enrollments
When the teacher views the teacher dashboard
Then the course card shows: "0 of 0 students active", "0% avg completion", "N/A avg quiz score"
```

---

## AC-055: Teacher Pre-Class Engagement Report

### AC-055-01: Teacher sees engaged vs inactive students

```
Given a teacher with an ACTIVE course with 5 enrolled students:
  - Alice: completed 3 lessons in the last 14 days (Engaged)
  - Bob: submitted 1 quiz in the last 14 days (Engaged)
  - Charlie: no activity in the last 14 days (Inactive)
  - Diana: completed 1 lesson 10 days ago (Engaged)
  - Eve: no activity in the last 14 days (Inactive)
When the teacher views the PreClassEngagementReport
Then the summary shows: "3 of 5 students engaged in the last 14 days"
And the student list shows:
  1. Charlie - Inactive badge (red) - No activity
  2. Eve - Inactive badge (red) - No activity
  3. Alice - Engaged badge (green) - 3 lessons, 0 quizzes, last activity: [date]
  4. Bob - Engaged badge (green) - 0 lessons, 1 quiz, last activity: [date]
  5. Diana - Engaged badge (green) - 1 lesson, 0 quizzes, last activity: [date]
```

### AC-055-02: All students engaged shows positive summary

```
Given a teacher with a course where all 10 students had activity in the last 14 days
When the teacher views the PreClassEngagementReport
Then the summary shows: "10 of 10 students engaged in the last 14 days"
And all students show green Engaged badges
And no students appear in the "inactive first" section
```

### AC-055-03: Course with no enrolled students shows empty state

```
Given a teacher with an ACTIVE course with 0 enrolled students
When the teacher views the PreClassEngagementReport
Then the course section shows: "No enrolled students."
```

---

## AC-056: Teacher At-Risk Students Alert

### AC-056-01: Inactive student is flagged

```
Given a student with no LessonProgress updates and no QuizAttempt submissions in the last 7 days
And the student is enrolled in a teacher's ACTIVE course
When the teacher views the AtRiskStudentsAlert widget
Then the student appears with:
  - Student name
  - Course name
  - Risk reason: "Inactive"
  - Days since last activity (e.g., "12 days")
```

### AC-056-02: Student with failing quiz average is flagged

```
Given a student with average quiz percentage of 55% (below 70% threshold)
And the student had recent activity (within 7 days)
When the teacher views the AtRiskStudentsAlert widget
Then the student appears with:
  - Risk reason: "Failing Quizzes (55%)"
```

### AC-056-03: Student meeting both criteria shows both reasons

```
Given a student with no activity in 10 days AND average quiz score of 45%
When the teacher views the AtRiskStudentsAlert
Then the student appears with reasons: "Inactive" and "Failing Quizzes (45%)"
```

### AC-056-04: No at-risk students shows positive message

```
Given all students in the teacher's courses are active and passing
When the teacher views the AtRiskStudentsAlert
Then the widget displays: "No at-risk students detected."
```

---

## AC-057: Teacher Class Quiz Analytics

### AC-057-01: Teacher sees per-quiz statistics

```
Given a teacher's ACTIVE course has 2 quizzes:
  - Quiz 1: 10 of 15 students attempted, avg score 82%, pass rate 80%
  - Quiz 2: 8 of 15 students attempted, avg score 65%, pass rate 50%
When the teacher views the ClassQuizAnalytics widget
Then it shows for the course:
  - Quiz 1: "10/15 attempted", "82% avg", "80% pass rate"
  - Quiz 2: "8/15 attempted", "65% avg", "50% pass rate"
```

### AC-057-02: Most-missed question is identified

```
Given Quiz 1 has 5 questions
And Question 3 has the lowest isCorrect rate at 30% (7 of 10 students answered incorrectly)
When the teacher views quiz analytics for Quiz 1
Then the most-missed question shows: "Q3: [question text truncated to 80 chars] (70% incorrect)"
```

### AC-057-03: Course with no quizzes is omitted

```
Given a teacher has 2 ACTIVE courses
And Course A has 3 quizzes
And Course B has 0 quizzes
When the teacher views the ClassQuizAnalytics widget
Then only Course A appears in the quiz analytics
And Course B is not shown
```

### AC-057-04: Quiz with no attempts shows zero metrics

```
Given a quiz that no students have attempted
When the teacher views the ClassQuizAnalytics widget
Then the quiz row shows: "0/15 attempted", "N/A avg", "N/A pass rate"
And no most-missed question is displayed
```

---

## AC-058: Parent Child LMS Progress Card

### AC-058-01: Parent sees child's LMS summary

```
Given a parent with a child enrolled in 2 ACTIVE courses
And the child has completed 10 of 20 total lessons (50%)
And the child's most recent quiz attempt scored 85% (passed)
And the child had LMS activity on 3 distinct days this week
When the parent views the parent dashboard
Then the ChildLmsProgressCard for the child shows:
  - "2 Active Courses"
  - "50% Completion" with yellow color coding
  - "Latest Quiz: 85% - Passed"
  - "3 days active this week"
  - "View Courses" link
```

### AC-058-02: Parent sees card for child with no enrollments

```
Given a parent with a child who has no ACTIVE enrollments
When the parent views the parent dashboard
Then the ChildLmsProgressCard for the child shows:
  - "0 Active Courses"
  - "No courses enrolled"
  - No quiz score section (or "No quizzes taken")
```

### AC-058-03: Widget appears in correct position

```
Given a parent with children enrolled in courses
When the parent views the parent dashboard
Then for each child, the widgets appear in order:
  1. ChildQuickStats (attendance)
  2. ChildGradeOverview (grades)
  3. ChildLmsProgressCard (LMS progress) -- NEW
  4. ChildLearningActivity (LMS activity) -- NEW
  5. BigCalendarContainer (schedule)
```

### AC-058-04: View Courses link includes childId parameter

```
Given a parent viewing the ChildLmsProgressCard for child with id "user_abc"
When the parent clicks the "View Courses" link
Then the browser navigates to /list/courses?childId=user_abc
```

---

## AC-059: Parent Child Learning Activity Feed

### AC-059-01: Parent sees child's recent LMS events

```
Given a parent's child has the following recent LMS activity:
  - Completed lesson "Variables" in "Intro to Python" on Feb 20
  - Took quiz "Python Basics" - scored 90% (Passed) on Feb 19
  - Enrolled in "Advanced Math" on Feb 15
When the parent views the parent dashboard
Then the ChildLearningActivity widget shows:
  1. "Completed lesson Variables in Intro to Python" - "1 day ago"
  2. "Took quiz Python Basics - scored 90% (Passed)" - "2 days ago"
  3. "Enrolled in Advanced Math" - "6 days ago"
```

### AC-059-02: Activity feed limited to 10 events

```
Given a child with 25 LMS events
When the parent views the ChildLearningActivity widget
Then only the 10 most recent events are displayed
And no pagination or "load more" button is shown
```

### AC-059-03: Child with no LMS activity sees empty state

```
Given a child with no lesson completions, no quiz submissions, and no enrollments
When the parent views the ChildLearningActivity widget
Then it displays: "No learning activity yet."
```

### AC-059-04: Events show relative timestamps

```
Given an event that occurred 5 hours ago
Then the timestamp shows "5 hours ago"
Given an event that occurred 3 days ago
Then the timestamp shows "3 days ago"
Given an event that occurred less than 1 minute ago
Then the timestamp shows "just now"
```

---

## AC-060: Admin School-Wide LMS Adoption Metrics

### AC-060-01: Admin sees aggregate LMS metrics

```
Given the school has:
  - 8 ACTIVE courses
  - 120 active enrollments
  - 45 out of 80 enrolled students had LMS activity in the last 14 days
  - 6 out of 10 teachers have at least 1 ACTIVE course
When the admin views the admin dashboard
Then the LmsAdoptionMetrics widget displays:
  - "8 Active Courses"
  - "120 Active Enrollments"
  - "56% Engagement Rate" (45/80)
  - "60% Teacher Adoption" (6/10)
```

### AC-060-02: Admin sees metrics with no LMS data

```
Given no courses exist in the system (or all are DRAFT)
When the admin views the admin dashboard
Then the LmsAdoptionMetrics widget displays:
  - "0 Active Courses"
  - "0 Active Enrollments"
  - "0% Engagement Rate"
  - "0% Teacher Adoption"
And no errors occur
```

---

## AC-061: Dashboard Load Performance

### AC-061-01: Student dashboard loads within 2 seconds

```
Given a student with 5 enrolled courses, 50 completed lessons, and 15 quiz attempts
When the student navigates to the student dashboard
Then all analytics widgets render within 2 seconds
And no loading spinners persist beyond 2 seconds
```

### AC-061-02: Teacher dashboard loads within 2 seconds

```
Given a teacher with 3 ACTIVE courses, 40 enrolled students, and 20 quiz attempts per course
When the teacher navigates to the teacher dashboard
Then all analytics widgets render within 2 seconds
```

### AC-061-03: Parent dashboard loads within 2 seconds

```
Given a parent with 2 children, each enrolled in 3 courses
When the parent navigates to the parent dashboard
Then all analytics widgets (including LMS widgets) render within 2 seconds
```

---

## AC-062: Empty State Handling

### AC-062-01: No division by zero in percentage calculations

```
Given a course with 0 total lessons (modules exist but no lessons added)
When computing course completion percentage
Then the result is 0% (not NaN, Infinity, or an error)
```

### AC-062-02: All widgets handle zero data gracefully

```
Given a freshly created system with no LMS activity data
When any user visits their dashboard
Then all analytics widgets display appropriate empty states
And no JavaScript errors appear in the browser console
And no server-side rendering errors occur
```

---

## AC-063: Color Coding Consistency

### AC-063-01: Color thresholds applied correctly

```
Given a metric value of 92%
Then the metric is displayed in green text/badge

Given a metric value of 80%
Then the metric is displayed in yellow text/badge

Given a metric value of 60%
Then the metric is displayed in red text/badge

Given a metric value of exactly 90%
Then the metric is displayed in green text/badge (>= 90%)

Given a metric value of exactly 75%
Then the metric is displayed in yellow text/badge (>= 75%)
```

---

## AC-064: No Cross-Role Data Leakage

### AC-064-01: Student cannot view other students' analytics

```
Given student A viewing their dashboard
Then all analytics widgets show only student A's data
And no data from student B is visible anywhere
```

### AC-064-02: Teacher only sees their own courses' analytics

```
Given teacher A who teaches Course 1 and Course 2
And teacher B who teaches Course 3
When teacher A views the teacher dashboard
Then analytics are shown for Course 1 and Course 2 only
And Course 3 data is not visible
```

### AC-064-03: Parent only sees their children's data

```
Given parent A with child X
And parent B with child Y
When parent A views the parent dashboard
Then ChildLmsProgressCard and ChildLearningActivity show only child X's data
And no data about child Y is visible
```

---

## AC-065: No Write Operations from Analytics

### AC-065-01: Viewing analytics creates no database records

```
Given a student viewing their dashboard with all analytics widgets
When the page fully loads
Then no INSERT, UPDATE, or DELETE queries are executed
And the count of LessonProgress records remains unchanged
And the count of QuizAttempt records remains unchanged
And the count of Enrollment records remains unchanged
```

---

## Edge Cases

### EC-01: Course with modules but no lessons

```
Given a student enrolled in a course that has 3 modules but 0 lessons
When the student views the LmsProgressOverview widget
Then the course contributes 0 to total lessons and 0 to completed lessons
And the CourseProgressBar for this course shows "0/0 lessons completed" with 0%
And no division-by-zero error occurs
```

### EC-02: Quiz with all questions answered correctly by all students

```
Given a quiz where every student scored 100%
When the teacher views ClassQuizAnalytics
Then the most-missed question shows the question with the lowest correct rate
If all questions have 100% correct rate, no most-missed question is highlighted
```

### EC-03: Student with only in-progress quiz attempts (none submitted)

```
Given a student who started 3 quizzes but submitted none (submittedAt is null for all)
When computing quiz performance trend
Then the chart shows "Take more quizzes to see your performance trend."
And the LmsProgressOverview shows 0 for quiz-related metrics
```

### EC-04: Teacher with many courses (boundary test)

```
Given a teacher with 10 ACTIVE courses, each with 30 enrolled students
When the teacher views the dashboard
Then all teacher analytics widgets render without timeout
And data is accurate across all courses
```

### EC-05: Student enrolled in a DRAFT course

```
Given a student with ACTIVE enrollment in a course with status DRAFT
When computing analytics
Then the DRAFT course enrollment IS included in the student's metrics
Because the enrollment status is ACTIVE regardless of course status
(Note: The enrollment exists; course status does not affect enrollment-based analytics)
```

### EC-06: Multiple quiz attempts with different scoring policies

```
Given a student with 3 attempts on a quiz with BEST scoring policy:
  - Attempt 1: 60%
  - Attempt 2: 85%
  - Attempt 3: 70%
When computing the quiz performance trend chart
Then ALL 3 attempts appear as data points (60%, 85%, 70%)
And the trend shows the actual submission scores, not the canonical BEST score
Because the trend shows attempt-level data, not quiz-level canonical scores
```

### EC-07: Parent with multiple children, one has no enrollments

```
Given a parent with 2 children:
  - Child A: enrolled in 3 courses with activity
  - Child B: no enrollments at all
When the parent views the dashboard
Then Child A shows full LMS analytics
And Child B shows empty state messages for both ChildLmsProgressCard and ChildLearningActivity
```

### EC-08: Heatmap at year boundary

```
Given a student viewing the heatmap in January
Then only January cells are shown (Jan through current month)
And no December/previous year cells appear
```

### EC-09: At-risk student who became active today

```
Given a student with no activity for 8 days (at-risk threshold is 7)
And the student completed a lesson today
When the teacher views the AtRiskStudentsAlert
Then the student no longer appears as at-risk for inactivity
Because their last activity is within 7 days
```

---

## Smoke Test Checklist

| # | Test                                                              | Expected Result                                         |
|---|-------------------------------------------------------------------|---------------------------------------------------------|
| 1 | Log in as student, view dashboard                                 | See LmsProgressOverview with course count and completion |
| 2 | View EnrolledCourses, expand module breakdown                     | See per-module lesson counts and quiz scores             |
| 3 | View QuizPerformanceTrend chart (with 3+ attempts)                | See LineChart with score trend and passing threshold     |
| 4 | View LearningActivityHeatmap                                      | See calendar with colored cells on active days           |
| 5 | Hover over heatmap cell                                           | See tooltip with date and activity count                 |
| 6 | Log in as teacher, view dashboard                                 | See PreClassEngagementReport with engaged/inactive split |
| 7 | View AtRiskStudentsAlert                                          | See flagged students (or "No at-risk" message)           |
| 8 | View CourseEngagementOverview cards                                | See per-course engagement metrics                        |
| 9 | View ClassQuizAnalytics                                           | See per-quiz stats with most-missed question             |
| 10 | Log in as parent, view dashboard                                  | See ChildLmsProgressCard for each child                  |
| 11 | View ChildLearningActivity feed                                   | See recent events with relative timestamps               |
| 12 | Log in as admin, view dashboard                                   | See LmsAdoptionMetrics with school-wide stats            |
| 13 | Student with no enrollments visits dashboard                      | See appropriate empty states on all LMS widgets          |
| 14 | Teacher with no active courses visits dashboard                   | See "No active courses" messages                         |
| 15 | Verify no console errors on any dashboard                         | Clean browser console                                    |
| 16 | Verify TypeScript compilation: `npx tsc --noEmit`                 | No type errors                                           |
| 17 | Verify ESLint: `npm run lint`                                     | No lint errors                                           |

---

## Definition of Done

- [ ] All requirements (REQ-LMS-050 through REQ-LMS-065) implemented and verified
- [ ] `lmsAnalyticsUtils.ts` created with all 9 pure utility functions
- [ ] All acceptance criteria scenarios pass
- [ ] All edge cases handled without errors
- [ ] All smoke tests pass manually
- [ ] No TypeScript errors (`npx tsc --noEmit` clean)
- [ ] No ESLint errors (`npm run lint` clean)
- [ ] All dashboard pages load within 2 seconds with reasonable data volumes
- [ ] Empty states display appropriate messages (no blank sections or errors)
- [ ] Color coding convention applied consistently (green >= 90%, yellow >= 75%, red < 75%)
- [ ] Container pattern used for all Recharts components (Server Container + Client Chart)
- [ ] No write operations triggered by any analytics widget
- [ ] Role-scoped data access enforced (student sees own data, teacher sees own courses, parent sees children only)
- [ ] No N+1 query patterns observable in development mode
- [ ] Code follows existing project patterns (Server Components, Prisma singleton, pure utility functions)
