# SPEC-GRADE-001: Acceptance Criteria

## Related SPEC

- SPEC ID: SPEC-GRADE-001
- Title: Grade Reports & Performance Tracking

---

## AC-GRADE-001: Subject Grades Widget

**Requirement**: REQ-GRADE-001

```gherkin
Feature: Student detail page displays per-subject grade averages

  Scenario: Student has results across multiple subjects
    Given the student detail page is loaded for student "S001"
    And student "S001" has results in "Math" (3 exams, 2 assignments) and "English" (1 exam, 4 assignments)
    When the page renders
    Then a "Subject Grades" widget is displayed
    And the widget shows "English" before "Math" (alphabetical order)
    And each subject row shows the subject name, overall average rounded to 1 decimal, exam count, and assignment count
    And "Math" shows exam count 3 and assignment count 2
    And "English" shows exam count 1 and assignment count 4

  Scenario: Student has results in only one subject
    Given the student detail page is loaded for student "S002"
    And student "S002" has 5 results all in "Science"
    When the page renders
    Then the "Subject Grades" widget shows a single row for "Science"
    And the row displays the correct average, exam count, and assignment count

  Scenario: Student has no results
    Given the student detail page is loaded for student "S003"
    And student "S003" has no result records
    When the page renders
    Then the "Subject Grades" widget displays "No grades recorded yet"

  Scenario: Average calculation accuracy
    Given student "S004" has Math exam scores of 80, 90, and 100
    And student "S004" has Math assignment scores of 70 and 80
    When the Subject Grades widget computes the Math row
    Then the exam average is 90.0
    And the assignment average is 75.0
    And the overall average is 84.0
    And the total assessment count is 5
```

---

## AC-GRADE-002: Grade Summary Card

**Requirement**: REQ-GRADE-002

```gherkin
Feature: Student detail page displays overall grade summary statistics

  Scenario: Student has mixed exam and assignment results
    Given the student detail page is loaded for student "S001"
    And student "S001" has 10 results: 6 exams and 4 assignments
    And scores range from 55 to 98
    When the page renders
    Then a "Grade Summary" card is displayed
    And the card shows total results as 10
    And the card shows the overall average across all 10 scores
    And the card shows the highest score as 98
    And the card shows the lowest score as 55
    And the card shows the exam average (average of 6 exam scores)
    And the card shows the assignment average (average of 4 assignment scores)

  Scenario: Student has only exam results
    Given student "S005" has 3 exam results and 0 assignment results
    When the Grade Summary card renders
    Then the exam average shows the computed value
    And the assignment average shows "-"

  Scenario: Student has only assignment results
    Given student "S006" has 0 exam results and 5 assignment results
    When the Grade Summary card renders
    Then the exam average shows "-"
    And the assignment average shows the computed value

  Scenario: Student has no results
    Given student "S007" has no result records
    When the page renders
    Then the "Grade Summary" card displays "No grades recorded yet"
```

---

## AC-GRADE-003: Student Detail Page Integration

**Requirement**: REQ-GRADE-003

```gherkin
Feature: Student detail page includes grade widgets

  Scenario: Grade widgets are positioned correctly
    Given the student detail page is loaded for any student with results
    When the page renders
    Then the SubjectGrades widget appears in the left column below the schedule section
    And the GradeSummary widget appears in the right sidebar
    And the existing student info card, schedule, and shortcuts remain visible and functional

  Scenario: Existing functionality preserved
    Given the student detail page is loaded
    When the page renders
    Then all existing elements (student info, attendance percentage, grade level, lesson count, class name, schedule calendar, shortcuts) are still present and correctly rendered
```

---

## AC-GRADE-004: Report Card Page

**Requirement**: REQ-GRADE-004

```gherkin
Feature: Dedicated report card page for a student

  Scenario: Report card page loads with full data
    Given a user navigates to /list/students/S001/report-card
    And the user has appropriate access permissions
    And student "S001" has results across 5 subjects
    When the report card page loads
    Then the page displays a student information header with name, class name, and grade level
    And the page displays a per-subject grades table with 5 rows
    And the page displays overall statistics (total results, overall average, exam average, assignment average)

  Scenario: Report card page with no results
    Given a user navigates to /list/students/S008/report-card
    And student "S008" has no result records
    When the report card page loads
    Then the student information header is displayed
    And the grades table shows an empty state message
    And the overall statistics show zero or appropriate empty values
```

---

## AC-GRADE-005: Report Card Access Control

**Requirement**: REQ-GRADE-005

```gherkin
Feature: Role-based access control on report card page

  Scenario: Admin accesses any student's report card
    Given the user is logged in as an admin
    When the user navigates to /list/students/S001/report-card
    Then the report card page loads successfully

  Scenario: Teacher accesses own student's report card
    Given the user is logged in as a teacher
    And the teacher teaches a class containing student "S001"
    When the user navigates to /list/students/S001/report-card
    Then the report card page loads successfully

  Scenario: Teacher cannot access unrelated student's report card
    Given the user is logged in as a teacher
    And the teacher does not teach any class containing student "S099"
    When the user navigates to /list/students/S099/report-card
    Then the user is redirected to the student list page

  Scenario: Student accesses own report card
    Given the user is logged in as a student with ID "S001"
    When the user navigates to /list/students/S001/report-card
    Then the report card page loads successfully

  Scenario: Student cannot access another student's report card
    Given the user is logged in as a student with ID "S001"
    When the user navigates to /list/students/S002/report-card
    Then the user is redirected to the student list page

  Scenario: Parent accesses own child's report card
    Given the user is logged in as a parent
    And the parent has a child with student ID "S001"
    When the user navigates to /list/students/S001/report-card
    Then the report card page loads successfully

  Scenario: Parent cannot access unrelated student's report card
    Given the user is logged in as a parent
    And the parent has no children with student ID "S099"
    When the user navigates to /list/students/S099/report-card
    Then the user is redirected to the student list page
```

---

## AC-GRADE-006: Report Card Table

**Requirement**: REQ-GRADE-006

```gherkin
Feature: Report card table displays per-subject grade breakdown

  Scenario: Table displays all subjects with full data
    Given the report card page is loaded for a student with results in Math, English, and Science
    And Math has 3 exam results (avg 85.0) and 2 assignment results (avg 78.0)
    And English has 1 exam result (avg 92.0) and 4 assignment results (avg 88.5)
    And Science has 2 exam results (avg 76.0) and 0 assignment results
    When the ReportCardTable renders
    Then the table has 3 rows sorted alphabetically: English, Math, Science
    And each row shows: Subject Name, Exam Average, Assignment Average, Overall Average, Number of Assessments
    And the Science row shows "-" for Assignment Average
    And the Math row shows 5 for Number of Assessments

  Scenario: Table displays column headers
    Given the report card page is loaded
    When the ReportCardTable renders
    Then the table has column headers: Subject Name, Exam Avg, Assignment Avg, Overall Avg, Assessments

  Scenario: Table sorting by column
    Given the report card page is loaded with multiple subjects
    When the user clicks the "Overall Avg" column header
    Then the table rows are sorted by overall average (descending on first click, ascending on second click)

  Scenario: Subject with no exam results
    Given a subject "Art" has only assignment results
    When the table renders the Art row
    Then the Exam Avg column shows "-"
    And the Assignment Avg column shows the computed average
```

---

## AC-GRADE-007: Report Card Link in Shortcuts

**Requirement**: REQ-GRADE-007

```gherkin
Feature: Student detail page includes link to report card

  Scenario: Report Card link appears in shortcuts
    Given the student detail page is loaded for student "S001"
    When the shortcuts section renders
    Then a "Report Card" link is present
    And the link points to /list/students/S001/report-card

  Scenario: Clicking Report Card link navigates correctly
    Given the student detail page is loaded for student "S001"
    When the user clicks the "Report Card" link
    Then the browser navigates to /list/students/S001/report-card
```

---

## AC-GRADE-008: Print-Friendly Report Card

**Requirement**: REQ-GRADE-008

```gherkin
Feature: Report card page is print-friendly

  Scenario: Print layout removes navigation
    Given the report card page is loaded
    When the user triggers browser print (Ctrl+P or Cmd+P)
    Then the sidebar navigation is hidden in the print preview
    And the report card content fills the available width

  Scenario: Print layout uses clean typography
    Given the report card page is loaded
    When the user prints the page
    Then the printed output has a white background
    And text is legible with adequate font sizes
    And table borders and row backgrounds are visible in print
    And adequate margins are applied for readability
```

---

## AC-GRADE-009: Parent Child Grade Overview

**Requirement**: REQ-GRADE-009

```gherkin
Feature: Parent dashboard displays grade overview per child

  Scenario: Parent has one child with grades
    Given the parent is logged in
    And the parent has one child "Alice Smith" with results in Math (avg 85.0), English (avg 92.0), and Science (avg 78.0)
    When the parent dashboard loads
    Then a "Grade Overview" card for "Alice Smith" is displayed
    And the card shows the overall average prominently (e.g., 85.0)
    And the card shows a compact subject list: Math 85.0, English 92.0, Science 78.0
    And the card includes a link to Alice's report card page

  Scenario: Parent has multiple children
    Given the parent is logged in
    And the parent has 3 children
    When the parent dashboard loads
    Then 3 "Grade Overview" cards are displayed, one for each child

  Scenario: Child has no grades
    Given the parent is logged in
    And the parent has one child with no result records
    When the parent dashboard loads
    Then the "Grade Overview" card shows "No grades recorded"

  Scenario: Report card link navigation
    Given the parent dashboard shows a Grade Overview card for child "S001"
    When the parent clicks "View Report Card"
    Then the browser navigates to /list/students/S001/report-card
```

---

## AC-GRADE-010: Server Component Pattern

**Requirement**: REQ-GRADE-010

```gherkin
Feature: All new components follow server/client component pattern

  Scenario: Grade computation components are server components
    Given the SubjectGrades, GradeSummary, ChildGradeOverview, and report card page components are implemented
    When inspecting the source code
    Then none of these components have a "use client" directive
    And all of them perform Prisma queries directly within their async function body

  Scenario: ReportCardTable is a client component
    Given the ReportCardTable component is implemented
    When inspecting the source code
    Then the component has a "use client" directive
    And the component does not perform any Prisma queries
    And the component receives pre-computed data as props
```

---

## AC-GRADE-011: Consistent Styling

**Requirement**: REQ-GRADE-011

```gherkin
Feature: All new components follow existing styling patterns

  Scenario: Widget styling matches existing components
    Given any new grade widget is rendered
    When the component output is inspected
    Then its outer container has a white background (bg-white)
    And its outer container has rounded corners (rounded-md or rounded-xl)
    And its outer container has padding (p-4)
    And section headers use text-xl font-semibold or text-lg font-semibold

  Scenario: Badge colors match conventions
    Given a grade widget displays exam/assignment counts or labels
    When the component output is inspected
    Then exam-related badges or labels use blue styling
    And assignment-related badges or labels use purple styling
```

---

## AC-GRADE-012: No Schema Changes

**Requirement**: REQ-GRADE-012

```gherkin
Feature: No Prisma schema modifications

  Scenario: Schema remains unchanged
    Given the SPEC-GRADE-001 implementation is complete
    When the Prisma schema file is inspected
    Then no new models have been added
    And no new fields have been added to existing models
    And no new migration files have been generated
```

---

## AC-GRADE-013: No New Dependencies

**Requirement**: REQ-GRADE-013

```gherkin
Feature: No new npm packages introduced

  Scenario: Package list unchanged
    Given the SPEC-GRADE-001 implementation is complete
    When the package.json is compared to the pre-implementation version
    Then no new entries exist in the "dependencies" section
    And no new entries exist in the "devDependencies" section
```

---

## Edge Case Scenarios

```gherkin
Feature: Edge cases for grade calculations

  Scenario: Result with orphaned exam (no lesson/subject chain)
    Given a Result record exists with an exam that has no valid lesson -> subject chain
    When the SubjectGrades widget processes results
    Then the orphaned result is excluded from the subject grouping
    And no error is thrown

  Scenario: Student with only one result
    Given student "S010" has exactly 1 result (Math exam, score 75)
    When the SubjectGrades widget renders
    Then one subject row is shown: Math with average 75.0, exam count 1, assignment count 0
    When the GradeSummary card renders
    Then total results is 1, overall average is 75.0, highest is 75, lowest is 75, exam average is 75.0, assignment average is "-"

  Scenario: All results have the same score
    Given student "S011" has 5 results all with score 80
    When the GradeSummary card renders
    Then overall average is 80.0, highest is 80, lowest is 80

  Scenario: Score of zero
    Given student "S012" has a result with score 0 in a Math exam
    When the SubjectGrades widget computes the Math average
    Then the score of 0 is included in the average calculation (not treated as null)

  Scenario: Report card for student in no class
    Given a student record exists with classId as null
    When the report card page loads
    Then the student info header shows "-" for class name
    And the grades table still renders correctly based on result records
```

---

## Quality Gates

### Definition of Done

- [ ] All 13 requirements (REQ-GRADE-001 through REQ-GRADE-013) are implemented
- [ ] All acceptance scenarios pass manual verification
- [ ] SubjectGrades widget correctly computes per-subject averages with exam/assignment breakdown
- [ ] GradeSummary widget correctly computes overall statistics
- [ ] Student detail page displays both new widgets in correct positions
- [ ] Report card page loads with correct data and proper role-based access control
- [ ] ReportCardTable renders all columns with correct data and sorting
- [ ] Report card is print-friendly (sidebar hidden, clean layout)
- [ ] "Report Card" link present in student detail page shortcuts
- [ ] ChildGradeOverview shows per-child grades on parent dashboard with report card link
- [ ] No TypeScript compilation errors (`npx tsc --noEmit`)
- [ ] No new npm dependencies introduced (package.json unchanged)
- [ ] No Prisma schema changes (schema.prisma unchanged)
- [ ] All empty states are handled gracefully
- [ ] Application builds successfully (`npm run build`)
- [ ] Role-based access control verified: admin (any student), teacher (own students), student (self), parent (own children)

### Verification Methods

| Method | Scope | Pass Criteria |
| ------ | ----- | ------------- |
| Manual browser testing | Student detail page, report card page, parent dashboard | Widgets render, data is correct, styling is consistent |
| TypeScript compilation | Full codebase | Zero errors |
| Build verification | Full application | `npm run build` succeeds |
| Role isolation testing | Report card page | Each role only accesses authorized students |
| Print verification | Report card page | Browser print preview shows clean layout without nav |
| Average accuracy testing | SubjectGrades, GradeSummary, ReportCardTable | Manual calculation matches displayed averages |
| Empty state testing | All new components | Components display appropriate messages when no data exists |
| Schema audit | schema.prisma | File diff shows no changes |
| Package audit | package.json | File diff shows no new dependencies |
