# SPEC-DASH-001: Acceptance Criteria

## Related SPEC

- SPEC ID: SPEC-DASH-001
- Title: Dashboard Analytics Overhaul

---

## AC-DASH-001: Class Occupancy Chart Replaces FinanceChart

**Requirement**: REQ-DASH-001

```gherkin
Feature: Admin dashboard displays Class Occupancy chart

  Scenario: Admin views class occupancy data
    Given the admin is logged in and viewing the admin dashboard
    And the database contains classes with capacity and enrolled students
    When the admin dashboard page loads
    Then the FinanceChart component is no longer rendered
    And a "Class Occupancy" horizontal BarChart is displayed
    And each class shows two bars: one for capacity and one for actual student count
    And the capacity bar uses color #C3EBFA
    And the student count bar uses color #FAE27C

  Scenario: Class occupancy with full class
    Given a class "5A" has capacity 30 and 30 enrolled students
    When the admin views the Class Occupancy chart
    Then the "5A" row shows equal-length bars for capacity and student count

  Scenario: Class occupancy with empty class
    Given a class "1B" has capacity 25 and 0 enrolled students
    When the admin views the Class Occupancy chart
    Then the "1B" row shows a capacity bar and no visible student count bar

  Scenario: No classes in database
    Given no classes exist in the database
    When the admin views the admin dashboard
    Then the Class Occupancy chart area displays an empty state
```

---

## AC-DASH-002: Performance.tsx Dead Code Removed

**Requirement**: REQ-DASH-002

```gherkin
Feature: Dead code cleanup

  Scenario: Performance component is deleted
    Given the file src/components/Performance.tsx exists in the codebase
    When the dashboard overhaul is implemented
    Then the file src/components/Performance.tsx no longer exists
    And no import references to Performance exist in the codebase
    And the application builds without errors
```

---

## AC-DASH-003: Teacher Today's Schedule Widget

**Requirement**: REQ-DASH-003

```gherkin
Feature: Teacher dashboard displays today's schedule

  Scenario: Teacher has lessons today
    Given the teacher is logged in
    And today is a weekday (Monday through Friday)
    And the teacher has 3 lessons scheduled for today
    When the teacher dashboard loads
    Then a "Today's Schedule" widget is displayed
    And the widget lists all 3 lessons ordered by start time ascending
    And each lesson shows the subject name, class name, and time range

  Scenario: Teacher has no lessons today
    Given the teacher is logged in
    And today is a weekday
    And the teacher has no lessons scheduled for today
    When the teacher dashboard loads
    Then the "Today's Schedule" widget displays "No lessons scheduled for today"

  Scenario: Today is a weekend
    Given the teacher is logged in
    And today is Saturday or Sunday
    When the teacher dashboard loads
    Then the "Today's Schedule" widget displays "No lessons on weekends"
```

---

## AC-DASH-004: Teacher Pending Grading Widget

**Requirement**: REQ-DASH-004

```gherkin
Feature: Teacher dashboard displays pending grading count

  Scenario: Teacher has ungraded exams and assignments
    Given the teacher is logged in
    And the teacher has 2 exams past their endTime with incomplete results
    And the teacher has 3 assignments past their dueDate with incomplete results
    When the teacher dashboard loads
    Then a "Pending Grading" card is displayed
    And the card shows a total count of 5
    And the card shows a breakdown of "2 Exams" and "3 Assignments"

  Scenario: All grading is complete
    Given the teacher is logged in
    And all past exams and assignments have complete results
    When the teacher dashboard loads
    Then the "Pending Grading" card shows a total count of 0

  Scenario: Teacher has no exams or assignments
    Given the teacher is logged in
    And the teacher has no exams or assignments at all
    When the teacher dashboard loads
    Then the "Pending Grading" card shows a total count of 0
```

---

## AC-DASH-005: Teacher Class Attendance Overview Widget

**Requirement**: REQ-DASH-005

```gherkin
Feature: Teacher dashboard displays class attendance overview

  Scenario: Teacher teaches multiple classes with attendance data
    Given the teacher is logged in
    And the teacher teaches classes "5A" and "6B"
    And class "5A" has 90% attendance this week
    And class "6B" has 75% attendance this week
    When the teacher dashboard loads
    Then a "Class Attendance Overview" widget is displayed
    And the widget shows "5A" with 90% attendance
    And the widget shows "6B" with 75% attendance

  Scenario: No attendance data for this week
    Given the teacher is logged in
    And no attendance records exist for the current week
    When the teacher dashboard loads
    Then the widget displays "No attendance data for this week"
```

---

## AC-DASH-006: Student Recent Grades Widget

**Requirement**: REQ-DASH-006

```gherkin
Feature: Student dashboard displays recent grades

  Scenario: Student has multiple grades
    Given the student is logged in
    And the student has 10 result records
    When the student dashboard loads
    Then a "Recent Grades" widget is displayed
    And the widget shows the 5 most recent results
    And each result shows the exam or assignment title and the score

  Scenario: Student has fewer than 5 grades
    Given the student is logged in
    And the student has 2 result records
    When the student dashboard loads
    Then the "Recent Grades" widget shows 2 results

  Scenario: Student has no grades
    Given the student is logged in
    And the student has no result records
    When the student dashboard loads
    Then the "Recent Grades" widget displays "No grades yet"
```

---

## AC-DASH-007: Student Upcoming Exams Widget

**Requirement**: REQ-DASH-007

```gherkin
Feature: Student dashboard displays upcoming exams

  Scenario: Student has exams in the next 7 days
    Given the student is logged in
    And the student's class has 2 exams scheduled within the next 7 days
    When the student dashboard loads
    Then an "Upcoming Exams" widget is displayed
    And the widget lists 2 exams ordered by start time ascending
    And each exam shows the title, subject name, and date/time

  Scenario: No upcoming exams
    Given the student is logged in
    And no exams are scheduled within the next 7 days for the student's class
    When the student dashboard loads
    Then the "Upcoming Exams" widget displays "No upcoming exams"
```

---

## AC-DASH-008: Student Attendance Card Integration

**Requirement**: REQ-DASH-008

```gherkin
Feature: Student dashboard integrates StudentAttendanceCard

  Scenario: Student views year-to-date attendance
    Given the student is logged in
    And the student has attendance records for the current year
    When the student dashboard loads
    Then the StudentAttendanceCard component is rendered
    And it displays the student's year-to-date attendance percentage

  Scenario: Student has no attendance records
    Given the student is logged in
    And the student has no attendance records for the current year
    When the student dashboard loads
    Then the StudentAttendanceCard displays "-%" or a dash
```

---

## AC-DASH-009: Student Assignments Due Widget

**Requirement**: REQ-DASH-009

```gherkin
Feature: Student dashboard displays assignments due soon

  Scenario: Student has assignments due in the next 7 days
    Given the student is logged in
    And the student's class has 3 assignments with dueDate within the next 7 days
    When the student dashboard loads
    Then an "Assignments Due" widget is displayed
    And the widget lists 3 assignments ordered by due date ascending
    And each assignment shows the title, subject name, and due date

  Scenario: No assignments due
    Given the student is logged in
    And no assignments are due within the next 7 days for the student's class
    When the student dashboard loads
    Then the "Assignments Due" widget displays "No assignments due this week"
```

---

## AC-DASH-010: Parent Quick Stats Per Child

**Requirement**: REQ-DASH-010

```gherkin
Feature: Parent dashboard displays quick stats per child

  Scenario: Parent has one child with full data
    Given the parent is logged in
    And the parent has one child "Alice Smith"
    And Alice has 95% attendance this semester
    And Alice's most recent grade is "Math Exam: 88"
    And Alice has 2 pending assignments
    When the parent dashboard loads
    Then a "Quick Stats" card for "Alice Smith" is displayed
    And the card shows attendance percentage as "95%"
    And the card shows most recent grade as "Math Exam: 88"
    And the card shows pending assignments as "2"

  Scenario: Parent has multiple children
    Given the parent is logged in
    And the parent has 3 children
    When the parent dashboard loads
    Then 3 "Quick Stats" cards are displayed, one for each child

  Scenario: Child has no data yet
    Given the parent is logged in
    And the parent has one child with no attendance, grades, or assignments
    When the parent dashboard loads
    Then the "Quick Stats" card shows "-" for attendance, grade, and assignments
```

---

## AC-DASH-011: Parent Recent Activity Feed

**Requirement**: REQ-DASH-011

```gherkin
Feature: Parent dashboard displays recent activity feed

  Scenario: Parent sees activity across multiple children
    Given the parent is logged in
    And the parent has 2 children
    And child 1 received a new grade yesterday
    And child 2 had attendance recorded today
    When the parent dashboard loads
    Then a "Recent Activity" feed is displayed
    And the feed shows the latest 5 events across all children
    And events are sorted by date descending (newest first)
    And each event shows the activity type, child name, and description

  Scenario: No recent activity
    Given the parent is logged in
    And no recent grades or attendance records exist for any children
    When the parent dashboard loads
    Then the "Recent Activity" feed displays "No recent activity"
```

---

## AC-DASH-012: Server Component Pattern

**Requirement**: REQ-DASH-012

```gherkin
Feature: All new widgets follow server/client component pattern

  Scenario: Chart components use server container pattern
    Given a new widget requires Recharts for rendering
    When the widget is implemented
    Then a server container component fetches data via Prisma
    And a separate client component renders the chart with "use client" directive
    And the server component passes data as props to the client component

  Scenario: Non-chart widgets are server components
    Given a new widget renders HTML without client-side JavaScript libraries
    When the widget is implemented
    Then the widget is a server component (no "use client" directive)
    And the widget queries Prisma directly within its async function body
```

---

## AC-DASH-013: Real Data Requirement

**Requirement**: REQ-DASH-013

```gherkin
Feature: All widgets use real Prisma data

  Scenario: Every new widget queries the database
    Given any new dashboard widget is rendered
    When the widget component executes
    Then it performs at least one Prisma query to fetch data
    And no hardcoded arrays or sample data objects exist in the component
    And all data is filtered by the authenticated user's role and ID
```

---

## AC-DASH-014: Consistent Card Styling

**Requirement**: REQ-DASH-014

```gherkin
Feature: All new widgets follow existing card styling

  Scenario: New widget styling matches existing components
    Given a new dashboard widget is created
    When the widget is rendered
    Then its outer container has a white background (bg-white)
    And its outer container has rounded corners (rounded-md or rounded-xl)
    And its outer container has padding (p-4)
    And its header uses text-xl font-semibold or text-lg font-semibold
```

---

## AC-DASH-015: No Hardcoded Data Remains

**Requirement**: REQ-DASH-015

```gherkin
Feature: No hardcoded chart data in production components

  Scenario: Codebase audit for hardcoded data
    Given the dashboard overhaul is complete
    When a search is performed for static data arrays in chart components
    Then no chart component files contain hardcoded data arrays
    And the deleted FinanceChart.tsx (hardcoded) no longer exists
    And the deleted Performance.tsx (hardcoded) no longer exists
    And all remaining chart components receive data from server-side queries
```

---

## Quality Gates

### Definition of Done

- [ ] All 15 requirements (REQ-DASH-001 through REQ-DASH-015) are implemented
- [ ] All acceptance scenarios pass manual verification
- [ ] Admin dashboard loads with ClassOccupancyChart showing real data
- [ ] Teacher dashboard shows TodaySchedule, PendingGrading, ClassAttendanceOverview
- [ ] Student dashboard shows RecentGrades, UpcomingExams, AssignmentsDue, StudentAttendanceCard
- [ ] Parent dashboard shows ChildQuickStats per child and RecentActivity feed
- [ ] FinanceChart.tsx and Performance.tsx are deleted
- [ ] No TypeScript compilation errors (`npx tsc --noEmit`)
- [ ] No new npm dependencies introduced
- [ ] All empty states are handled gracefully
- [ ] Application builds successfully (`npm run build`)
- [ ] Role-based data filtering verified (teacher sees only own data, student sees only own data, parent sees only own children's data)

### Verification Methods

| Method | Scope | Pass Criteria |
| ------ | ----- | ------------- |
| Manual browser testing | All 4 dashboards | Widgets render, data is correct, styling is consistent |
| TypeScript compilation | Full codebase | Zero errors |
| Build verification | Full application | `npm run build` succeeds |
| Import audit | Deleted files | No dangling imports for FinanceChart or Performance |
| Grep audit for hardcoded data | `src/components/` | No static data arrays in chart components |
| Role isolation testing | Each role's dashboard | Users see only their authorized data |
