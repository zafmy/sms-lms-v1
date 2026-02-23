# SPEC-DASH-001: Implementation Plan

## Overview

Dashboard Analytics Overhaul for a school management system. Replace hardcoded data, remove dead code, and add role-specific analytics widgets to all four dashboards (Admin, Teacher, Student, Parent).

**Development Mode**: DDD (ANALYZE-PRESERVE-IMPROVE)
**Related SPEC**: SPEC-DASH-001

---

## Milestone 1: Admin Dashboard (Replace FinanceChart, Cleanup)

**Priority**: High (foundational - removes technical debt)

### Goals

- Replace hardcoded FinanceChart with real-data ClassOccupancyChart
- Delete dead Performance.tsx component

### Tasks

| # | Task | Files | REQ |
|---|------|-------|-----|
| 1.1 | ANALYZE: Read admin/page.tsx, FinanceChart.tsx, CountChartContainer.tsx to understand existing patterns | Read-only | - |
| 1.2 | Create `ClassOccupancyChart.tsx` (client) - Recharts horizontal BarChart with vertical layout, two bars (capacity in #C3EBFA, students in #FAE27C) | `src/components/ClassOccupancyChart.tsx` (NEW) | REQ-DASH-001 |
| 1.3 | Create `ClassOccupancyChartContainer.tsx` (server) - Prisma query for class names, capacity, and student counts | `src/components/ClassOccupancyChartContainer.tsx` (NEW) | REQ-DASH-001 |
| 1.4 | Update admin/page.tsx - Replace FinanceChart import and usage with ClassOccupancyChartContainer | `src/app/(dashboard)/admin/page.tsx` (MODIFY) | REQ-DASH-001 |
| 1.5 | Delete FinanceChart.tsx | `src/components/FinanceChart.tsx` (DELETE) | REQ-DASH-001, REQ-DASH-015 |
| 1.6 | Delete Performance.tsx | `src/components/Performance.tsx` (DELETE) | REQ-DASH-002 |

### Technical Approach

- Follow CountChartContainer pattern: server component queries Prisma, transforms data, passes to client chart
- Prisma query: `prisma.class.findMany({ select: { name: true, capacity: true, _count: { select: { students: true } } } })`
- Transform to `{ name, capacity, studentCount }[]` before passing to client component
- BarChart with `layout="vertical"`, XAxis as number, YAxis as category (class name)

### Risks

- **Low**: Chart may need responsive height adjustment if many classes exist. Mitigation: Set minimum height and add scroll for overflow.

---

## Milestone 2: Teacher Dashboard (3 New Widgets)

**Priority**: High (teachers use dashboards daily for lesson management)

### Goals

- Add Today's Schedule widget showing daily lesson lineup
- Add Pending Grading widget showing ungraded exams/assignments
- Add Class Attendance Overview for the current week

### Tasks

| # | Task | Files | REQ |
|---|------|-------|-----|
| 2.1 | ANALYZE: Read teacher/page.tsx layout, understand Day enum, review existing auth pattern | Read-only | - |
| 2.2 | Create Day enum mapping utility (getTodayDayEnum) | `src/lib/utils.ts` (MODIFY or NEW) | REQ-DASH-003 |
| 2.3 | Create `TodaySchedule.tsx` (server) - Query teacher's lessons for today, display subject, class, time | `src/components/TodaySchedule.tsx` (NEW) | REQ-DASH-003 |
| 2.4 | Create `PendingGrading.tsx` (server) - Query overdue exams/assignments with missing results | `src/components/PendingGrading.tsx` (NEW) | REQ-DASH-004 |
| 2.5 | Create `ClassAttendanceOverview.tsx` (server) - Calculate per-class attendance percentages for current week | `src/components/ClassAttendanceOverview.tsx` (NEW) | REQ-DASH-005 |
| 2.6 | Update teacher/page.tsx - Add three new widgets to right sidebar | `src/app/(dashboard)/teacher/page.tsx` (MODIFY) | REQ-DASH-003/004/005 |

### Technical Approach

**TodaySchedule**:
- Map `new Date().getDay()` to Day enum (1=MONDAY...5=FRIDAY)
- Handle weekends (Saturday/Sunday) with "No lessons on weekends" message
- Query lessons with teacherId and day filter, include subject.name and class.name
- Sort by startTime ascending
- Format times with `Intl.DateTimeFormat` or `toLocaleTimeString`

**PendingGrading**:
- Find teacher's lessons first
- Query exams where `endTime < now` AND lesson is teacher's, include results count and class student count
- Query assignments where `dueDate < now` AND lesson is teacher's, include results count and class student count
- Filter to items where `results.length < expectedStudentCount`
- Display totals with exam/assignment breakdown

**ClassAttendanceOverview**:
- Get unique classIds from teacher's lessons
- For each class, count attendance records this week (Monday-Friday of current week)
- Calculate `present / total * 100` percentage
- Display as list with class name and percentage

### Risks

- **Medium**: PendingGrading query complexity. "Pending" means fewer results than students in the class. This requires joining across lessons -> class -> students and comparing with results count. Mitigation: Use two queries (one for expected count, one for actual results) and compute in TypeScript.
- **Low**: Weekend edge case for TodaySchedule. Mitigation: Check for null return from getTodayDayEnum and show appropriate message.

---

## Milestone 3: Student Dashboard (3 New Widgets + StudentAttendanceCard)

**Priority**: High (core student experience)

### Goals

- Add Recent Grades widget (latest 5 results)
- Add Upcoming Exams widget (next 7 days)
- Add Assignments Due widget (next 7 days)
- Integrate existing StudentAttendanceCard for year-to-date attendance

### Tasks

| # | Task | Files | REQ |
|---|------|-------|-----|
| 3.1 | ANALYZE: Read student/page.tsx, StudentAttendanceCard.tsx, understand classId resolution | Read-only | - |
| 3.2 | Create `RecentGrades.tsx` (server) - Query latest 5 results with exam/assignment titles | `src/components/RecentGrades.tsx` (NEW) | REQ-DASH-006 |
| 3.3 | Create `UpcomingExams.tsx` (server) - Query exams in next 7 days for student's class | `src/components/UpcomingExams.tsx` (NEW) | REQ-DASH-007 |
| 3.4 | Create `AssignmentsDue.tsx` (server) - Query assignments due in next 7 days for student's class | `src/components/AssignmentsDue.tsx` (NEW) | REQ-DASH-009 |
| 3.5 | Update student/page.tsx - Add RecentGrades, UpcomingExams, AssignmentsDue, and StudentAttendanceCard to right sidebar | `src/app/(dashboard)/student/page.tsx` (MODIFY) | REQ-DASH-006/007/008/009 |

### Technical Approach

**RecentGrades**:
- Simple query: `prisma.result.findMany({ where: { studentId }, take: 5, orderBy: { id: "desc" }, include: { exam, assignment } })`
- Display title from either exam or assignment (one will be null)
- Show score prominently

**UpcomingExams**:
- Requires student's classId (already resolved in student/page.tsx)
- Query: exams where lesson.classId matches and startTime is between now and now+7 days
- Include lesson.subject.name for subject display

**AssignmentsDue**:
- Same pattern as UpcomingExams but using assignment.dueDate
- Include lesson.subject.name

**StudentAttendanceCard Integration**:
- Component already exists and works with `{ id: string }` prop
- Simply import and render with `userId`

### Risks

- **Low**: Student might have no classId (unlikely but possible). Mitigation: Student/page.tsx already handles this with a conditional check.
- **Low**: Date range calculation for 7-day window. Mitigation: Use standard Date arithmetic with clear UTC handling.

---

## Milestone 4: Parent Dashboard (2 New Widgets)

**Priority**: Medium (parents check less frequently, but need overview of all children)

### Goals

- Add Quick Stats card per child (attendance, latest grade, pending assignments)
- Add Recent Activity feed across all children

### Tasks

| # | Task | Files | REQ |
|---|------|-------|-----|
| 4.1 | ANALYZE: Read parent/page.tsx, understand multi-child iteration pattern | Read-only | - |
| 4.2 | Create `ChildQuickStats.tsx` (server) - Aggregate attendance %, latest grade, pending assignments for one child | `src/components/ChildQuickStats.tsx` (NEW) | REQ-DASH-010 |
| 4.3 | Create `RecentActivity.tsx` (server) - Merge latest results and attendance across all children | `src/components/RecentActivity.tsx` (NEW) | REQ-DASH-011 |
| 4.4 | Update parent/page.tsx - Add ChildQuickStats per child, add RecentActivity to right sidebar | `src/app/(dashboard)/parent/page.tsx` (MODIFY) | REQ-DASH-010/011 |

### Technical Approach

**ChildQuickStats**:
- Three independent queries per child:
  1. Attendance: Same logic as StudentAttendanceCard (year-to-date, present/total * 100)
  2. Latest grade: `prisma.result.findFirst({ where: { studentId }, orderBy: { id: "desc" }, include: { exam, assignment } })`
  3. Pending assignments: Count assignments where dueDate > now AND lesson.classId = child.classId AND no result exists for this student
- Display as a compact card with child name header

**RecentActivity**:
- Query latest results for all children's studentIds
- Query latest attendance for all children's studentIds
- Merge, sort by date descending, take 5
- Display with type indicator (grade/attendance), child name, and description

### Risks

- **Medium**: Multiple children means multiple query sets in ChildQuickStats. Mitigation: Each ChildQuickStats component is independently rendered as a server component, leveraging React's streaming. For parents with many children (>5), consider pagination.
- **Low**: Merging results and attendance records requires a common date field. Results use `id` ordering (no explicit date), attendance uses `date`. Mitigation: For results, join through exam.endTime or assignment.dueDate as the effective date.

---

## Architecture Design Direction

### Component Hierarchy

```
Admin Dashboard
  |-- UserCard (x4) [existing]
  |-- CountChartContainer -> CountChart [existing]
  |-- AttendanceChartContainer -> AttendanceChart [existing]
  |-- ClassOccupancyChartContainer -> ClassOccupancyChart [NEW]
  |-- EventCalendarContainer [existing]
  |-- Announcements [existing]

Teacher Dashboard
  |-- BigCalendarContainer [existing]
  |-- TodaySchedule [NEW]
  |-- PendingGrading [NEW]
  |-- ClassAttendanceOverview [NEW]
  |-- Announcements [existing]

Student Dashboard
  |-- BigCalendarContainer [existing]
  |-- StudentAttendanceCard [existing, newly integrated]
  |-- RecentGrades [NEW]
  |-- UpcomingExams [NEW]
  |-- AssignmentsDue [NEW]
  |-- EventCalendar [existing]
  |-- Announcements [existing]

Parent Dashboard
  |-- ChildQuickStats (per child) [NEW]
  |-- BigCalendarContainer (per child) [existing]
  |-- RecentActivity [NEW]
  |-- Announcements [existing]
```

### File Organization

All new components go in `src/components/` following the flat structure convention of the existing codebase. Only ClassOccupancyChart requires a client/server split (Recharts). All other new widgets are pure server components rendering HTML without client-side JavaScript.

### Query Optimization Notes

- Teacher widgets (Milestone 2) make the most queries. Consider grouping related queries.
- Parent ChildQuickStats makes 3 queries per child. For a parent with 3 children, that is 9 queries. This is acceptable for the expected scale (<50 students per parent).
- All queries are scoped by authenticated userId, ensuring role-based data isolation.

---

## Summary

| Milestone | New Files | Modified Files | Deleted Files | Requirements Covered |
| --------- | --------- | -------------- | ------------- | -------------------- |
| 1 - Admin | 2 | 1 | 2 | REQ-DASH-001, 002, 015 |
| 2 - Teacher | 3 (+utility) | 1 | 0 | REQ-DASH-003, 004, 005 |
| 3 - Student | 3 | 1 | 0 | REQ-DASH-006, 007, 008, 009 |
| 4 - Parent | 2 | 1 | 0 | REQ-DASH-010, 011 |
| Cross-cutting | - | - | - | REQ-DASH-012, 013, 014 |
| **Total** | **10 (+1 utility)** | **4** | **2** | **15 requirements** |
