---
id: SPEC-ATT-001
type: acceptance
format: gherkin
---

# Acceptance Criteria: SPEC-ATT-001

## 1. Page Rendering

### AC-ATT-001: Attendance Page Renders Successfully

```gherkin
Given an admin user is authenticated
When the user navigates to /list/attendance
Then the page renders without errors
  And the heading "All Attendance" is visible on desktop
  And the TableSearch component is visible
  And the filter and sort icon buttons are visible
  And the create button is visible (FormContainer with table="attendance" type="create")
```

### AC-ATT-002: Page Renders with Empty State

```gherkin
Given an admin user is authenticated
  And there are no attendance records in the database
When the user navigates to /list/attendance
Then the page renders without errors
  And the Table component displays with no rows
  And the Pagination component shows count 0
```

---

## 2. Column Display

### AC-ATT-003: All Columns Visible for Admin/Teacher

```gherkin
Given an admin user is authenticated
When the user views the attendance list page
Then the following columns are visible:
  | Column   | Responsive Behavior    |
  | Student  | Always visible         |
  | Lesson   | Always visible         |
  | Date     | Hidden on mobile, visible on md+ |
  | Status   | Always visible         |
  | Actions  | Always visible         |
```

### AC-ATT-004: Actions Column Hidden for Student/Parent

```gherkin
Given a student user is authenticated
When the user views the attendance list page
Then the following columns are visible:
  | Column   | Responsive Behavior    |
  | Student  | Always visible         |
  | Lesson   | Always visible         |
  | Date     | Hidden on mobile, visible on md+ |
  | Status   | Always visible         |
And the Actions column is not rendered
```

---

## 3. Row Rendering

### AC-ATT-005: Attendance Row Displays Correct Data

```gherkin
Given an attendance record exists with:
  | Field     | Value            |
  | id        | 1                |
  | date      | 2026-03-15       |
  | present   | true             |
  | student   | John Doe         |
  | lesson    | Mathematics      |
When the attendance list page renders this record
Then the row displays:
  | Cell     | Content                              |
  | Student  | "John Doe"                           |
  | Lesson   | "Mathematics"                        |
  | Date     | Formatted via Intl.DateTimeFormat     |
  | Status   | "Present" with green badge            |
```

### AC-ATT-006: Present Badge Styling

```gherkin
Given an attendance record with present = true
When the row is rendered
Then the Status cell contains a span element
  And the span text is "Present"
  And the span has green background styling (bg-green-100 or similar)
  And the span has green text color (text-green-700 or similar)
  And the span has rounded-full or similar pill shape
```

### AC-ATT-007: Absent Badge Styling

```gherkin
Given an attendance record with present = false
When the row is rendered
Then the Status cell contains a span element
  And the span text is "Absent"
  And the span has red background styling (bg-red-100 or similar)
  And the span has red text color (text-red-700 or similar)
  And the span has rounded-full or similar pill shape
```

---

## 4. Role-Based Data Filtering

### AC-ATT-008: Admin Sees All Attendance Records

```gherkin
Given an admin user is authenticated
  And there are 25 attendance records across multiple students, lessons, and teachers
When the admin views the attendance list page
Then all 25 attendance records are accessible (10 per page, 3 pages)
  And the pagination shows the correct total count
```

### AC-ATT-009: Teacher Sees Only Own Lesson Attendance

```gherkin
Given a teacher user is authenticated with ID "teacher_001"
  And teacher_001 owns Lesson 5 (Mathematics) and Lesson 8 (Physics)
  And there are 10 attendance records for Lesson 5
  And there are 5 attendance records for Lesson 8
  And there are 20 attendance records for other lessons
When the teacher views the attendance list page
Then only 15 attendance records are returned (Lesson 5 + Lesson 8)
  And no attendance records from other teachers' lessons are visible
```

### AC-ATT-010: Student Sees Only Own Attendance

```gherkin
Given a student user is authenticated with ID "student_001"
  And student_001 has 12 attendance records
  And other students have 30 attendance records
When the student views the attendance list page
Then only 12 attendance records are returned (student_001's records)
  And no other students' attendance records are visible
```

### AC-ATT-011: Parent Sees Only Children's Attendance

```gherkin
Given a parent user is authenticated with ID "parent_001"
  And parent_001 has two children: student_A and student_B
  And student_A has 8 attendance records
  And student_B has 6 attendance records
  And unrelated students have 40 attendance records
When the parent views the attendance list page
Then only 14 attendance records are returned (student_A + student_B)
  And no unrelated students' attendance records are visible
```

---

## 5. Search and Filtering

### AC-ATT-012: Search by Student Name

```gherkin
Given an admin user is authenticated
  And there are attendance records for students "John Doe", "Jane Smith", "Johnny Walker"
When the user searches with query "john"
Then the results include attendance records for "John Doe" and "Johnny Walker"
  And the results do not include attendance records for "Jane Smith"
  And the search is case-insensitive
```

### AC-ATT-013: Filter by Lesson ID

```gherkin
Given an admin user is authenticated
  And there are attendance records for Lesson 5 and Lesson 10
When the URL contains ?lessonId=5
Then only attendance records for Lesson 5 are displayed
  And attendance records for Lesson 10 are not displayed
```

### AC-ATT-014: Combined Search and Lesson Filter

```gherkin
Given an admin user is authenticated
  And Lesson 5 has attendance records for "John Doe" and "Jane Smith"
When the URL contains ?lessonId=5&search=john
Then only attendance records for "John Doe" in Lesson 5 are displayed
```

---

## 6. Pagination

### AC-ATT-015: First Page Displays Correctly

```gherkin
Given an admin user is authenticated
  And there are 25 attendance records
When the user views the attendance list page without a page parameter
Then 10 attendance records are displayed (page 1)
  And the Pagination component shows page 1 of 3
```

### AC-ATT-016: Page Navigation Works

```gherkin
Given an admin user is authenticated
  And there are 25 attendance records
When the URL contains ?page=2
Then 10 attendance records are displayed (records 11-20)
  And the Pagination component shows page 2 of 3

When the URL contains ?page=3
Then 5 attendance records are displayed (records 21-25)
  And the Pagination component shows page 3 of 3
```

### AC-ATT-017: Pagination with Filters

```gherkin
Given an admin user is authenticated
  And there are 15 attendance records for Lesson 5
When the URL contains ?lessonId=5&page=2
Then 5 attendance records are displayed (filtered records 11-15)
  And the Pagination component reflects the filtered count (15)
```

---

## 7. Action Buttons

### AC-ATT-018: Admin Can Update and Delete

```gherkin
Given an admin user is authenticated
  And an attendance record with id 1 exists
When the admin views the attendance list page
Then the row for attendance 1 has an update button (FormContainer table="attendance" type="update" data={item})
  And the row has a delete button (FormContainer table="attendance" type="delete" id={1})
```

### AC-ATT-019: Teacher Can Update and Delete

```gherkin
Given a teacher user is authenticated
  And the teacher owns a lesson with attendance records
When the teacher views the attendance list page
Then each visible row has update and delete buttons
  And clicking update opens the AttendanceForm pre-populated with data
  And clicking delete opens the delete confirmation
```

### AC-ATT-020: Student Cannot See Action Buttons

```gherkin
Given a student user is authenticated
When the student views the attendance list page
Then no update or delete buttons are displayed on any row
  And no create button is displayed in the header
```

### AC-ATT-021: Parent Cannot See Action Buttons

```gherkin
Given a parent user is authenticated
When the parent views the attendance list page
Then no update or delete buttons are displayed on any row
  And no create button is displayed in the header
```

---

## 8. Date Formatting

### AC-ATT-022: Date Uses Intl.DateTimeFormat

```gherkin
Given an attendance record with date "2026-03-15T00:00:00.000Z"
When the row is rendered
Then the Date cell displays the date formatted by Intl.DateTimeFormat("en-US")
  And the formatted output matches the locale pattern (e.g., "3/15/2026")
```

---

## 9. Cross-Cutting Concerns

### AC-ATT-023: No Console.log Statements

```gherkin
Given the attendance list page source code at src/app/(dashboard)/list/attendance/page.tsx
When the file is inspected
Then there are no console.log, console.warn, or console.error statements
```

### AC-ATT-024: TypeScript Compilation

```gherkin
Given the attendance list page is created
When TypeScript compilation runs (npx tsc --noEmit)
Then zero type errors are reported for the attendance page
```

### AC-ATT-025: Pattern Consistency

```gherkin
Given the attendance list page and the exams list page
When the structural patterns are compared
Then the attendance page follows the same:
  - Import organization
  - Type definition pattern
  - Async component signature with searchParams
  - Auth extraction via auth()
  - Column definition array structure
  - renderRow function structure
  - URL params parsing pattern
  - Role-based switch/case pattern
  - Prisma $transaction pattern
  - JSX layout (TOP, LIST, PAGINATION)
```

---

## 10. Definition of Done

- [ ] File `src/app/(dashboard)/list/attendance/page.tsx` exists and exports `AttendanceListPage`
- [ ] Page renders at `/list/attendance` without errors for all four roles
- [ ] Columns display: Student, Lesson, Date, Status, Actions (admin/teacher only)
- [ ] Present badge shows green "Present" styling
- [ ] Absent badge shows red "Absent" styling
- [ ] Admin sees all attendance records
- [ ] Teacher sees only attendance for own lessons
- [ ] Student sees only own attendance records
- [ ] Parent sees only children's attendance records
- [ ] Search by student name works (case-insensitive)
- [ ] Filter by lessonId URL param works
- [ ] Pagination works with ITEM_PER_PAGE = 10
- [ ] Prisma $transaction used for data + count queries
- [ ] Create button visible for admin/teacher only
- [ ] Update/Delete action buttons visible for admin/teacher only
- [ ] Date formatted with Intl.DateTimeFormat("en-US")
- [ ] No console.log statements in the file
- [ ] TypeScript compilation passes with zero errors
- [ ] Pattern matches the established list page structure (exams, results, etc.)
