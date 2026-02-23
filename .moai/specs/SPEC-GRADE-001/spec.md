# SPEC-GRADE-001: Grade Reports & Performance Tracking

## Metadata

| Field       | Value                                       |
| ----------- | ------------------------------------------- |
| SPEC ID     | SPEC-GRADE-001                              |
| Title       | Grade Reports & Performance Tracking        |
| Version     | 1.0.0                                       |
| Created     | 2026-02-21                                  |
| Status      | Planned                                     |
| Priority    | High                                        |
| Lifecycle   | spec-first                                  |
| Related     | SPEC-DASH-001 (dashboard analytics), SPEC-ATT-001 (attendance) |

---

## 1. Problem Statement

The school management system stores individual `Result` records (exam and assignment scores) but provides no aggregated academic performance view. Students, parents, and teachers lack per-subject averages, overall academic summaries, and a consolidated report card page. The existing student detail page shows shortcuts to raw result lists but offers no computed grade analytics. Parents must manually browse each child's results to understand academic standing.

This SPEC introduces grade computation widgets, a dedicated report card page, and parent-facing grade overviews to surface meaningful academic performance data from existing `Result` records.

---

## 2. Environment

### 2.1 Technology Stack

- **Framework**: Next.js 14 (App Router, Server Components)
- **Language**: TypeScript
- **ORM**: Prisma with PostgreSQL
- **Authentication**: Clerk (role-based: admin, teacher, student, parent)
- **Styling**: Tailwind CSS with custom color tokens (lamaSky=#C3EBFA, lamaYellow=#FAE27C, lamaPurple, lamaPurpleLight, lamaSkyLight, lamaYellowLight)
- **Charts**: Recharts (RadialBarChart, BarChart, LineChart)
- **Calendar**: react-big-calendar (weekly schedule), react-calendar (date picker)

### 2.2 Database Models

The following Prisma models are directly relevant:

- **Result**: id (Int), score (Int), examId? (Int), assignmentId? (Int), studentId (String). A Result belongs to either an Exam OR an Assignment (one FK will be null).
- **Exam**: id (Int), title, startTime, endTime, lessonId -> Lesson -> Subject, Class, Teacher. Has results[].
- **Assignment**: id (Int), title, startDate, dueDate, lessonId -> Lesson -> Subject, Class, Teacher. Has results[].
- **Student**: id (String), name, surname, parentId -> Parent, classId -> Class -> Grade, gradeId -> Grade. Has results[], attendances[].
- **Subject**: id (Int), name (unique), teachers[], lessons[].
- **Class**: id (Int), name (unique), capacity, gradeId -> Grade, supervisor, lessons[], students[].
- **Grade**: id (Int), level (unique Int), students[], classes[].
- **Lesson**: id (Int), name, day (Day enum), startTime, endTime, subjectId, classId, teacherId.
- **Parent**: id (String), students[].

### 2.3 Score-to-Subject Resolution Path

```
Result -> Exam -> Lesson -> Subject
Result -> Assignment -> Lesson -> Subject
```

A Result's subject is determined by traversing through the associated Exam or Assignment to its Lesson, then to the Subject. This join path is critical for per-subject grade aggregation.

### 2.4 Existing Components (Relevant)

| Component | Location | Purpose |
| --------- | -------- | ------- |
| `RecentGrades.tsx` | `src/components/` | Student dashboard: latest 5 results with blue (Exam) / purple (Assignment) badges |
| `ChildQuickStats.tsx` | `src/components/` | Parent dashboard: per-child attendance%, latest grade, pending assignments |
| `PendingGrading.tsx` | `src/components/` | Teacher dashboard: ungraded exams/assignments count |
| `StudentAttendanceCard.tsx` | `src/components/` | Year-to-date attendance percentage for a student |
| Student detail page | `src/app/(dashboard)/list/students/[id]/page.tsx` | Student info, schedule, shortcuts to filtered lists |
| Results list page | `src/app/(dashboard)/list/results/` | Paginated list of all results |

### 2.5 Existing Patterns

- **Server/Client split**: Server container queries Prisma, passes data to "use client" Chart component
- **Pure server widgets**: Most dashboard widgets are server components rendering HTML with no client JS
- **Auth**: `const { userId, sessionClaims } = auth()` from `@clerk/nextjs/server`; role via `(sessionClaims?.metadata as { role?: string })?.role`
- **Card styling**: `bg-white p-4 rounded-md` or `bg-white rounded-xl w-full h-full p-4`
- **Badge colors**: green for positive, red for negative, blue for exams, purple for assignments
- **Color tokens**: bg-lamaSky, bg-lamaYellow, bg-lamaPurple, bg-lamaPurpleLight, bg-lamaSkyLight, bg-lamaYellowLight
- **Utility functions** in `src/lib/utils.ts`: getLatestMonday(), adjustScheduleToCurrentWeek(), getTodayDayEnum()

---

## 3. Assumptions

- **ASM-GRADE-001**: All Result records have a non-negative integer `score` field. Score range is 0-100 (standard percentage grading), though no maximum is enforced at the database level.
- **ASM-GRADE-002**: Every Result has either an `examId` or an `assignmentId` (never both, never neither). This is enforced by the application layer.
- **ASM-GRADE-003**: The Exam/Assignment -> Lesson -> Subject join chain is always complete (no orphaned Exams or Assignments without a valid lessonId, and no Lessons without a valid subjectId).
- **ASM-GRADE-004**: The student detail page at `/list/students/[id]/page.tsx` already resolves the student record and provides access to `studentId`, `classId`, and related data.
- **ASM-GRADE-005**: The Recharts library (already installed) is sufficient for any chart needed on the report card page. No new npm dependencies are required.
- **ASM-GRADE-006**: Average scores are calculated as simple arithmetic means (sum of scores / count of results) rounded to one decimal place.
- **ASM-GRADE-007**: Role-based access to the report card page follows existing patterns: admin sees any student, teacher sees students in classes they teach, student sees only self, parent sees only own children.
- **ASM-GRADE-008**: The existing `ChildQuickStats.tsx` component can be extended or a sibling `ChildGradeOverview.tsx` can be added without breaking the parent dashboard layout.

---

## 4. Requirements

### 4.1 Student Performance Widgets

**REQ-GRADE-001** (Event-Driven - Subject Grades):
**When** a student detail page loads, **then** the system shall display a "Subject Grades" widget showing per-subject average scores for that student. For each subject, the widget shall display: the subject name, the average score (rounded to 1 decimal), the number of exam results, and the number of assignment results. Subjects shall be sorted alphabetically by name.

- Data source: All Results for the student, grouped by subject via Result -> Exam/Assignment -> Lesson -> Subject
- Calculation: `average = sum(scores) / count(results)` per subject
- Display: Card list with subject name, average score, exam/assignment count breakdown
- Empty state: "No grades recorded yet"

**REQ-GRADE-002** (Event-Driven - Grade Summary):
**When** a student detail page loads, **then** the system shall display a "Grade Summary" card showing overall academic statistics: total number of results, overall average score, highest score, lowest score, exam average, and assignment average.

- Data source: All Results for the student
- Calculation: Overall average, exam-only average, assignment-only average, min, max
- Display: Compact card with labeled statistics
- Empty state: "No grades recorded yet"

### 4.2 Student Detail Page Enhancement

**REQ-GRADE-003** (Ubiquitous - Student Page Integration):
The student detail page at `/list/students/[id]/page.tsx` shall render the SubjectGrades component in the left column below the existing schedule section, and the GradeSummary component in the right sidebar above or below the existing content.

### 4.3 Report Card Page

**REQ-GRADE-004** (Event-Driven - Report Card Page):
**When** a user navigates to `/list/students/[id]/report-card`, **then** the system shall display a comprehensive report card page containing: a student information header (name, class, grade level), a per-subject grades table, and overall statistics.

- Page route: `src/app/(dashboard)/list/students/[id]/report-card/page.tsx`
- Layout: Clean, print-friendly design with no interactive elements
- Data: All Result records for the student, aggregated by subject

**REQ-GRADE-005** (State-Driven - Report Card Access Control):
**While** a user's role is "admin", the report card page shall be accessible for any student.
**While** a user's role is "teacher", the report card page shall be accessible only for students in classes the teacher teaches.
**While** a user's role is "student", the report card page shall be accessible only for the student's own record.
**While** a user's role is "parent", the report card page shall be accessible only for the parent's own children.

- If access is denied, redirect to the student list page.

**REQ-GRADE-006** (Event-Driven - Report Card Table):
**When** the report card page loads, **then** the system shall display a `ReportCardTable` component with columns: Subject Name, Exam Average, Assignment Average, Overall Average, Number of Assessments. Rows shall be sorted alphabetically by subject name.

- Exam Average: average of all exam-type results for that subject (or "-" if no exams)
- Assignment Average: average of all assignment-type results for that subject (or "-" if no assignments)
- Overall Average: average of all results for that subject
- Number of Assessments: total count of results for that subject

**REQ-GRADE-007** (Ubiquitous - Report Card Link):
The student detail page shortcuts section shall include a link to the report card page at `/list/students/[id]/report-card` with the label "Report Card".

**REQ-GRADE-008** (Ubiquitous - Print-Friendly Layout):
The report card page shall use a print-friendly layout: no sidebar navigation visible in print, clean typography, adequate spacing, and a white background. The page shall render correctly when using the browser's Print function.

### 4.4 Parent Dashboard Enhancement

**REQ-GRADE-009** (Event-Driven - Child Grade Overview):
**When** a parent loads their dashboard, **then** the system shall display a "Grade Overview" section for each child showing: the child's name, overall average score across all subjects, a compact per-subject average list (subject name and average), and a link to the child's full report card.

- Data source: All Results for each child of the parent
- Display: One card per child with overall average prominently shown, then subject averages below
- Link: Each card links to `/list/students/[childId]/report-card`
- Empty state per child: "No grades recorded" if no results exist

### 4.5 Cross-Cutting Requirements

**REQ-GRADE-010** (Ubiquitous - Server Component Pattern):
All new grade computation components (SubjectGrades, GradeSummary, report card page, ChildGradeOverview) shall be server components that query Prisma directly. The ReportCardTable shall be a client component only if sorting or interactivity is needed; otherwise it shall remain a server component.

**REQ-GRADE-011** (Ubiquitous - Consistent Styling):
All new components shall follow the existing card styling pattern: white background (`bg-white`), rounded corners (`rounded-md` or `rounded-xl`), padding (`p-4`). Badge colors shall use blue for exam-related items and purple for assignment-related items. The custom lama* color tokens shall be used for accents and highlights.

**REQ-GRADE-012** (Unwanted - No Model Changes):
The system shall not modify the existing Prisma schema. No new models, fields, or migrations shall be introduced. All grade calculations shall be computed at query time from existing Result records.

**REQ-GRADE-013** (Unwanted - No New Dependencies):
The system shall not introduce any new npm packages. All functionality shall use existing libraries (Recharts for any charts, Prisma for queries, Tailwind for styling).

---

## 5. Specifications

### 5.1 New Components

| Component | Type | Location | Props |
| --------- | ---- | -------- | ----- |
| `SubjectGrades.tsx` | Server | `src/components/SubjectGrades.tsx` | `studentId: string` |
| `GradeSummary.tsx` | Server | `src/components/GradeSummary.tsx` | `studentId: string` |
| `ReportCardTable.tsx` | Client ("use client") | `src/components/ReportCardTable.tsx` | `data: SubjectGradeRow[]` |

### 5.2 New Pages

| Page | Route | Location |
| ---- | ----- | -------- |
| Report Card | `/list/students/[id]/report-card` | `src/app/(dashboard)/list/students/[id]/report-card/page.tsx` |

### 5.3 New/Modified Components (Parent Dashboard)

| Component | Type | Location | Props |
| --------- | ---- | -------- | ----- |
| `ChildGradeOverview.tsx` | Server | `src/components/ChildGradeOverview.tsx` | `studentId: string, studentName: string` |

### 5.4 Modified Files

| File | Changes |
| ---- | ------- |
| `src/app/(dashboard)/list/students/[id]/page.tsx` | Add SubjectGrades to left column, GradeSummary to right sidebar, "Report Card" link to shortcuts |
| `src/app/(dashboard)/parent/page.tsx` | Add ChildGradeOverview component per child |

### 5.5 Files In Scope

| # | File | Action | Milestone |
|---|------|--------|-----------|
| 1 | `src/components/SubjectGrades.tsx` | NEW | M1 |
| 2 | `src/components/GradeSummary.tsx` | NEW | M1 |
| 3 | `src/app/(dashboard)/list/students/[id]/page.tsx` | MODIFY | M2 |
| 4 | `src/app/(dashboard)/list/students/[id]/report-card/page.tsx` | NEW | M3 |
| 5 | `src/components/ReportCardTable.tsx` | NEW | M3 |
| 6 | `src/components/ChildGradeOverview.tsx` | NEW | M4 |
| 7 | `src/app/(dashboard)/parent/page.tsx` | MODIFY | M4 |

### 5.6 Data Types

```typescript
// Shared type for grade aggregation
interface SubjectGradeRow {
  subjectName: string;
  examAverage: number | null;    // null if no exam results
  assignmentAverage: number | null; // null if no assignment results
  overallAverage: number;
  examCount: number;
  assignmentCount: number;
  totalAssessments: number;
}

// Grade summary statistics
interface GradeSummaryData {
  totalResults: number;
  overallAverage: number;
  highestScore: number;
  lowestScore: number;
  examAverage: number | null;
  assignmentAverage: number | null;
}
```

### 5.7 Grade Calculation Logic

```typescript
// Per-subject grade aggregation (server-side)
// 1. Query all results for student with exam/assignment -> lesson -> subject
// 2. Group results by subject name
// 3. For each subject:
//    - examResults = results where examId is not null
//    - assignmentResults = results where assignmentId is not null
//    - examAverage = examResults.length > 0 ? sum(scores) / count : null
//    - assignmentAverage = assignmentResults.length > 0 ? sum(scores) / count : null
//    - overallAverage = sum(all scores) / count(all results)
// 4. Sort by subject name alphabetically
```

### 5.8 Query Patterns

**SubjectGrades/ReportCardTable data query:**
```typescript
const results = await prisma.result.findMany({
  where: { studentId },
  select: {
    score: true,
    exam: {
      select: {
        title: true,
        lesson: { select: { subject: { select: { name: true } } } },
      },
    },
    assignment: {
      select: {
        title: true,
        lesson: { select: { subject: { select: { name: true } } } },
      },
    },
  },
});
```

**GradeSummary statistics query:**
```typescript
const results = await prisma.result.findMany({
  where: { studentId },
  select: {
    score: true,
    examId: true,
    assignmentId: true,
  },
});
// Compute: total, average, min, max, exam avg, assignment avg in TypeScript
```

### 5.9 Constraints

- **CON-GRADE-001**: No new npm dependencies shall be introduced. All computation uses existing libraries.
- **CON-GRADE-002**: All Prisma queries must be performed in server components or server-side functions, never in client components.
- **CON-GRADE-003**: The `auth()` call from Clerk must be used for role-based access control on the report card page. Unauthorized access shall redirect, not throw errors.
- **CON-GRADE-004**: Components must handle empty/null data gracefully with appropriate empty state messages.
- **CON-GRADE-005**: No modifications to the Prisma schema or database migrations.
- **CON-GRADE-006**: Average scores shall be rounded to 1 decimal place using `Math.round(value * 10) / 10`.
- **CON-GRADE-007**: The ReportCardTable client component receives pre-computed data; it shall not perform Prisma queries.

---

## 6. Traceability

| Requirement    | Component(s)                                              | Acceptance Test    |
| -------------- | --------------------------------------------------------- | ------------------ |
| REQ-GRADE-001  | SubjectGrades.tsx, students/[id]/page.tsx                 | AC-GRADE-001       |
| REQ-GRADE-002  | GradeSummary.tsx, students/[id]/page.tsx                  | AC-GRADE-002       |
| REQ-GRADE-003  | students/[id]/page.tsx                                    | AC-GRADE-003       |
| REQ-GRADE-004  | students/[id]/report-card/page.tsx                        | AC-GRADE-004       |
| REQ-GRADE-005  | students/[id]/report-card/page.tsx                        | AC-GRADE-005       |
| REQ-GRADE-006  | ReportCardTable.tsx, report-card/page.tsx                 | AC-GRADE-006       |
| REQ-GRADE-007  | students/[id]/page.tsx                                    | AC-GRADE-007       |
| REQ-GRADE-008  | students/[id]/report-card/page.tsx                        | AC-GRADE-008       |
| REQ-GRADE-009  | ChildGradeOverview.tsx, parent/page.tsx                   | AC-GRADE-009       |
| REQ-GRADE-010  | All new components                                        | AC-GRADE-010       |
| REQ-GRADE-011  | All new components                                        | AC-GRADE-011       |
| REQ-GRADE-012  | (codebase-wide - no schema changes)                       | AC-GRADE-012       |
| REQ-GRADE-013  | (codebase-wide - no new dependencies)                     | AC-GRADE-013       |

---

## 7. Out of Scope

- **PDF export**: Report card PDF generation is deferred to a future sprint.
- **Class ranking/comparison**: No student-to-student ranking or class-wide percentile calculations.
- **Grade trends over time**: No time-series charts showing score progression. Deferred to future sprint.
- **Teacher class-wide performance view**: Aggregate class performance analytics for teachers. Deferred to future sprint.
- **GPA calculation**: No weighted GPA model or GPA scale. This SPEC uses simple arithmetic averages.
- **Result model changes**: No new fields (e.g., weight, grade letter) on the Result model.
- **Grading policies**: No configurable grading scales (A-F mapping) or pass/fail thresholds.
