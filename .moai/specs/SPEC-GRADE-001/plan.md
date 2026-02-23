# SPEC-GRADE-001: Implementation Plan

## Overview

Grade Reports & Performance Tracking for a school management system. Compute per-subject grade averages from existing Result records, create performance widgets for the student detail page, build a dedicated report card page with role-based access, and enhance the parent dashboard with grade overviews.

**Development Mode**: DDD (ANALYZE-PRESERVE-IMPROVE)
**Related SPEC**: SPEC-GRADE-001

---

## Milestone 1: Student Performance Widgets

**Priority**: High (foundational - computation logic reused by Milestones 3 and 4)

### Goals

- Create SubjectGrades widget computing per-subject averages for a student
- Create GradeSummary widget showing overall academic statistics
- Establish the shared grade aggregation pattern reused in later milestones

### Tasks

| # | Task | Files | REQ |
|---|------|-------|-----|
| 1.1 | ANALYZE: Read student detail page, RecentGrades.tsx, Result model relations, existing query patterns | Read-only | - |
| 1.2 | Create `SubjectGrades.tsx` (server) - Query all results for a student, group by subject via Exam/Assignment -> Lesson -> Subject, compute per-subject exam average, assignment average, overall average, and assessment counts | `src/components/SubjectGrades.tsx` (NEW) | REQ-GRADE-001 |
| 1.3 | Create `GradeSummary.tsx` (server) - Query all results for a student, compute total count, overall average, highest score, lowest score, exam average, assignment average | `src/components/GradeSummary.tsx` (NEW) | REQ-GRADE-002 |

### Technical Approach

**SubjectGrades**:
- Query: `prisma.result.findMany({ where: { studentId }, select: { score, exam: { select: { lesson: { select: { subject: { select: { name } } } } } }, assignment: { select: { lesson: { select: { subject: { select: { name } } } } } } } })`
- Group results by subject name using a Map or object accumulator
- For each subject, separate exam vs assignment results and compute averages
- Round averages to 1 decimal place using `Math.round(value * 10) / 10`
- Sort subjects alphabetically
- Display as card list: subject name, overall average (with color coding), exam count, assignment count
- Use blue badge for exam count, purple badge for assignment count (matching existing RecentGrades pattern)
- Empty state: "No grades recorded yet" message

**GradeSummary**:
- Query: `prisma.result.findMany({ where: { studentId }, select: { score, examId, assignmentId } })`
- Compute all statistics in TypeScript: total, overall avg, min, max, exam avg, assignment avg
- Display as a compact card with labeled stat rows
- Use lamaSkyLight or lamaYellowLight background accents for visual grouping
- Empty state: "No grades recorded yet" message

### Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Result -> Exam/Assignment -> Lesson -> Subject join returns null for orphaned records | Low | Add null checks in grouping logic; skip results without a resolvable subject |
| Large number of results for a single student causes slow query | Low | Expected scale is <500 results per student. No pagination needed at this stage |

---

## Milestone 2: Student Detail Page Enhancement

**Priority**: High (integrates M1 widgets into existing page)

### Goals

- Add SubjectGrades component below the schedule section in the left column
- Add GradeSummary component in the right sidebar
- Add "Report Card" link to the shortcuts section

### Tasks

| # | Task | Files | REQ |
|---|------|-------|-----|
| 2.1 | ANALYZE: Read students/[id]/page.tsx to understand layout structure, column arrangement, and existing shortcuts pattern | Read-only | - |
| 2.2 | PRESERVE: Verify existing page renders correctly before changes | Manual verification | - |
| 2.3 | Update students/[id]/page.tsx - Import and render SubjectGrades in left column below schedule | `src/app/(dashboard)/list/students/[id]/page.tsx` (MODIFY) | REQ-GRADE-003 |
| 2.4 | Update students/[id]/page.tsx - Import and render GradeSummary in right sidebar | `src/app/(dashboard)/list/students/[id]/page.tsx` (MODIFY) | REQ-GRADE-003 |
| 2.5 | Update students/[id]/page.tsx - Add "Report Card" link to shortcuts section | `src/app/(dashboard)/list/students/[id]/page.tsx` (MODIFY) | REQ-GRADE-007 |

### Technical Approach

- Follow the existing layout pattern in the student detail page
- SubjectGrades goes in the left column (`div` that contains BigCalendarContainer/schedule)
- GradeSummary goes in the right sidebar (`div` that contains shortcuts, attendance card, etc.)
- The "Report Card" link follows the same pattern as existing shortcuts (anchor element with `href={/list/students/${studentId}/report-card}`)
- All additions are server components; no layout restructuring needed

### Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Page becomes too long with additional widgets | Low | SubjectGrades and GradeSummary are compact. If needed, add a collapsible section |
| Shortcut section styling inconsistency | Low | Follow exact same pattern (Link component, same Tailwind classes) as existing shortcuts |

---

## Milestone 3: Report Card Page

**Priority**: High (core deliverable - comprehensive grade view)

### Goals

- Create a new route at `/list/students/[id]/report-card`
- Implement role-based access control (admin, teacher, student, parent)
- Build ReportCardTable with per-subject grade breakdown
- Print-friendly layout

### Tasks

| # | Task | Files | REQ |
|---|------|-------|-----|
| 3.1 | ANALYZE: Read existing student detail page for auth pattern, understand role-based access control flow | Read-only | - |
| 3.2 | Create `ReportCardTable.tsx` (client) - Table component receiving pre-computed SubjectGradeRow[] data, rendering columns: Subject Name, Exam Avg, Assignment Avg, Overall Avg, # Assessments. Client component for potential sort interactivity | `src/components/ReportCardTable.tsx` (NEW) | REQ-GRADE-006 |
| 3.3 | Create report card page - Server component with student info header, role-based access control, data aggregation, ReportCardTable rendering, and overall statistics footer | `src/app/(dashboard)/list/students/[id]/report-card/page.tsx` (NEW) | REQ-GRADE-004, REQ-GRADE-005, REQ-GRADE-008 |

### Technical Approach

**Report Card Page (`report-card/page.tsx`)**:
- Server component: async function with `params: { id: string }`
- Auth check: Extract role from `auth()` sessionClaims
  - Admin: access granted for all students
  - Teacher: query `prisma.lesson.findFirst({ where: { teacherId, class: { students: { some: { id: studentId } } } } })` to verify student is in teacher's class
  - Student: verify `userId === studentId`
  - Parent: query `prisma.student.findFirst({ where: { id: studentId, parentId: userId } })` to verify child belongs to parent
  - If unauthorized: `redirect("/list/students")`
- Query all results for the student with exam/assignment -> lesson -> subject (same pattern as SubjectGrades)
- Compute SubjectGradeRow[] for the table
- Compute overall statistics (total, overall avg, exam avg, assignment avg)
- Render: student info header, ReportCardTable, statistics footer

**ReportCardTable**:
- Client component ("use client") to support column header click sorting
- Receives `data: SubjectGradeRow[]` as props
- Default sort: alphabetical by subject name
- Columns: Subject Name, Exam Avg (display "-" if null), Assignment Avg (display "-" if null), Overall Avg, # Assessments
- Styling: table with alternating row backgrounds, headers in lamaSky background
- Overall average row at the bottom as a summary

**Print-Friendly Design**:
- Add `@media print` styles: hide sidebar nav, maximize content width, clean typography
- Use Tailwind `print:` modifier classes where applicable
- Ensure adequate margins and readable font sizes for printed output

### Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Role-based access logic complexity for teacher verification | Medium | Use a simple Prisma query to check if any of the teacher's lessons are in the student's class. Fallback to redirect if query fails |
| Print styling conflicts with existing dashboard layout | Low | Scope print styles to the report card page using a wrapper class. Use `print:hidden` on dashboard navigation |
| Large number of subjects creates long table | Low | Expected subject count is <20 per student. No pagination needed |

---

## Milestone 4: Parent Dashboard Enhancement

**Priority**: Medium (enhances parent experience with grade overviews)

### Goals

- Create ChildGradeOverview component showing per-subject averages for one child
- Integrate into parent dashboard alongside existing ChildQuickStats
- Include link to full report card

### Tasks

| # | Task | Files | REQ |
|---|------|-------|-----|
| 4.1 | ANALYZE: Read parent/page.tsx to understand multi-child iteration pattern, existing ChildQuickStats integration | Read-only | - |
| 4.2 | Create `ChildGradeOverview.tsx` (server) - Query all results for a child, compute per-subject averages, display compact list with overall average and report card link | `src/components/ChildGradeOverview.tsx` (NEW) | REQ-GRADE-009 |
| 4.3 | Update parent/page.tsx - Add ChildGradeOverview component per child in the dashboard layout | `src/app/(dashboard)/parent/page.tsx` (MODIFY) | REQ-GRADE-009 |

### Technical Approach

**ChildGradeOverview**:
- Reuses the same grade aggregation pattern from SubjectGrades (M1)
- Query all results for the child, group by subject, compute averages
- Display: child name header, overall average prominently, compact subject list below (subject name + average)
- Show top 5 subjects with a "View full report card" link if more exist
- Link: `<Link href={/list/students/${studentId}/report-card}>View Report Card</Link>`
- Empty state: "No grades recorded" if no results exist for the child

**Parent Page Integration**:
- Follow the same per-child iteration pattern used for ChildQuickStats
- Place ChildGradeOverview below or alongside ChildQuickStats in the per-child section
- Each ChildGradeOverview is an independent server component, leveraging React streaming

### Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Multiple children means multiple grade aggregation queries | Medium | Each ChildGradeOverview runs independently as a server component. For parents with >5 children, queries remain fast at expected data volumes (<500 results per child) |
| Layout crowding with ChildQuickStats + ChildGradeOverview per child | Low | ChildGradeOverview uses compact design (single card with subject list). Consider grid layout if space is tight |

---

## Architecture Design Direction

### Component Hierarchy

```
Student Detail Page (/list/students/[id])
  |-- Student Info Card [existing]
  |-- Performance Section [existing]
  |-- BigCalendarContainer / Schedule [existing]
  |-- SubjectGrades [NEW - M1]
  |-- Shortcuts [existing, add Report Card link - M2]
  |-- GradeSummary [NEW - M1, placed in sidebar - M2]
  |-- StudentAttendanceCard [existing]

Report Card Page (/list/students/[id]/report-card)
  |-- Student Info Header [NEW - M3]
  |-- ReportCardTable [NEW - M3]
  |-- Overall Statistics Footer [NEW - M3]

Parent Dashboard
  |-- Per-Child Section [existing]
      |-- ChildQuickStats [existing]
      |-- ChildGradeOverview [NEW - M4]
  |-- BigCalendarContainer [existing]
  |-- Announcements [existing]
```

### Shared Computation Pattern

The grade aggregation logic (grouping results by subject, computing exam/assignment/overall averages) is repeated in:
1. `SubjectGrades.tsx` (M1)
2. `report-card/page.tsx` (M3)
3. `ChildGradeOverview.tsx` (M4)

**Recommendation**: Extract a shared utility function in `src/lib/utils.ts` or a new `src/lib/gradeUtils.ts`:

```typescript
// src/lib/gradeUtils.ts
export function computeSubjectGrades(results: ResultWithRelations[]): SubjectGradeRow[] { ... }
export function computeGradeSummary(results: ResultWithScore[]): GradeSummaryData { ... }
```

This keeps components thin (query + render) and consolidates business logic.

### File Organization

All new components go in `src/components/` following the flat structure convention of the existing codebase. The report card page follows the existing nested route pattern under `students/[id]/`. A utility file (`src/lib/gradeUtils.ts`) may optionally be created for shared computation logic.

### Query Optimization Notes

- SubjectGrades and GradeSummary both query the same student's results but with different `select` clauses. On the student detail page, consider a single query that satisfies both, passed as props.
- Report card page aggregates all data in one query for the full table plus statistics.
- ChildGradeOverview queries are independent per child, enabling React streaming for parallel rendering.
- All queries are scoped by authenticated userId for role-based data isolation.

---

## Summary

| Milestone | New Files | Modified Files | Requirements Covered |
| --------- | --------- | -------------- | -------------------- |
| 1 - Performance Widgets | 2 | 0 | REQ-GRADE-001, 002 |
| 2 - Student Page Enhancement | 0 | 1 | REQ-GRADE-003, 007 |
| 3 - Report Card Page | 2 | 0 | REQ-GRADE-004, 005, 006, 008 |
| 4 - Parent Dashboard | 1 | 1 | REQ-GRADE-009 |
| Cross-cutting | - | - | REQ-GRADE-010, 011, 012, 013 |
| **Total** | **5** | **2** | **13 requirements** |
