# SPEC-DASH-001: Dashboard Analytics Overhaul

## Metadata

| Field       | Value                             |
| ----------- | --------------------------------- |
| SPEC ID     | SPEC-DASH-001                     |
| Title       | Dashboard Analytics Overhaul      |
| Created     | 2026-02-21                        |
| Status      | Completed                         |
| Priority    | High                              |
| Lifecycle   | spec-first                        |
| Related     | SPEC-ATT-001 (attendance)         |

---

## 1. Environment

### 1.1 Technology Stack

- **Framework**: Next.js 14 (App Router, Server Components)
- **Language**: TypeScript
- **ORM**: Prisma with PostgreSQL
- **Authentication**: Clerk (role-based: admin, teacher, student, parent)
- **Styling**: Tailwind CSS with custom color tokens (lamaSky, lamaYellow, lamaPurple, etc.)
- **Charts**: Recharts (RadialBarChart, BarChart, LineChart, PieChart)
- **Calendar**: react-big-calendar (weekly schedule), react-calendar (date picker)

### 1.2 Database Models

The following Prisma models are directly relevant:

- **Class**: id (Int), name (String), capacity (Int), supervisorId, students[], lessons[]
- **Lesson**: id (Int), name, day (Day enum: MONDAY-FRIDAY), startTime, endTime, subjectId, classId, teacherId, exams[], assignments[], attendances[]
- **Exam**: id (Int), title, startTime, endTime, lessonId, results[]
- **Assignment**: id (Int), title, startDate, dueDate, lessonId, results[]
- **Result**: id (Int), score (Int), examId?, assignmentId?, studentId
- **Attendance**: id (Int), date (DateTime), present (Boolean), studentId, lessonId
- **Student**: id (String), name, surname, parentId, classId, gradeId, attendances[], results[]
- **Teacher**: id (String), name, surname, lessons[], classes[], subjects[]
- **Parent**: id (String), students[]

### 1.3 Day Enum

```
enum Day { MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY }
```

### 1.4 Current Dashboard State

| Dashboard | Current Widgets | Data Source |
| --------- | --------------- | ----------- |
| Admin     | 4x UserCard, CountChart, AttendanceChart, FinanceChart, EventCalendar, Announcements | All REAL except FinanceChart (HARDCODED) |
| Teacher   | BigCalendar, Announcements | REAL |
| Student   | BigCalendar, EventCalendar, Announcements | REAL |
| Parent    | BigCalendar (per child), Announcements | REAL |

### 1.5 Existing Component Patterns

- **Server/Client split**: Server container fetches data via Prisma, passes props to client chart component (e.g., `CountChartContainer` -> `CountChart`)
- **Card styling**: `bg-white p-4 rounded-md` (Announcements pattern) or `bg-white rounded-xl w-full h-full p-4` (chart pattern)
- **Auth access**: `auth()` from `@clerk/nextjs/server` returns `{ userId, sessionClaims }`, role extracted from `sessionClaims.metadata.role`

---

## 2. Assumptions

- **ASM-001**: Clerk authentication provides a stable `userId` that matches the `id` field in Teacher, Student, and Parent Prisma models.
- **ASM-002**: The `Day` enum values (MONDAY-FRIDAY) can be mapped to JavaScript `Date.getDay()` output (0=Sunday through 6=Saturday) for "today" queries.
- **ASM-003**: The `Class.capacity` field is populated for all classes in the database.
- **ASM-004**: The existing Recharts library is sufficient for all new charts; no new charting dependencies are needed.
- **ASM-005**: The `StudentAttendanceCard` component (currently unused) is functional and can be integrated as-is into the student dashboard.
- **ASM-006**: "This week" means the current calendar week (Monday-Friday) for attendance queries.
- **ASM-007**: "This semester" for parent attendance percentage means the current calendar year (same as StudentAttendanceCard logic using January 1st).
- **ASM-008**: Server Components can perform multiple Prisma queries without performance issues for the expected data volumes (< 1000 records per query).

---

## 3. Requirements

### 3.1 Admin Dashboard

**REQ-DASH-001** (Ubiquitous - Replace Hardcoded Chart):
The admin dashboard shall display a "Class Occupancy" horizontal BarChart showing each class name on the Y-axis, with two bars per class: one for capacity and one for actual student count. This replaces the hardcoded FinanceChart.

- Data source: `prisma.class.findMany({ include: { _count: { select: { students: true } } } })`
- Chart type: Recharts horizontal `BarChart` with `layout="vertical"`
- Bar colors: capacity bar uses `#C3EBFA` (lamaSky), student count bar uses `#FAE27C` (lamaYellow)

**REQ-DASH-002** (Ubiquitous - Dead Code Removal):
The `Performance.tsx` component file shall be deleted from the codebase as it contains only hardcoded sample data and is not imported by any page.

### 3.2 Teacher Dashboard

**REQ-DASH-003** (Event-Driven - Today's Schedule):
**When** a teacher loads their dashboard, **then** the system shall display a "Today's Schedule" widget listing all lessons where `teacherId` equals the current user's ID and `day` equals today's Day enum value. Each lesson entry shall show: subject name, class name, and formatted start/end time.

- Query: `prisma.lesson.findMany({ where: { teacherId, day: todayDayEnum }, include: { subject: { select: { name: true } }, class: { select: { name: true } } }, orderBy: { startTime: "asc" } })`
- Display: Ordered list with time range, subject, and class
- Empty state: "No lessons scheduled for today"

**REQ-DASH-004** (Event-Driven - Pending Grading):
**When** a teacher loads their dashboard, **then** the system shall display a "Pending Grading" card showing:
- Count of exams past their `endTime` (endTime < now) that belong to the teacher's lessons and have fewer results than the class student count
- Count of assignments past their `dueDate` (dueDate < now) that belong to the teacher's lessons and have fewer results than the class student count
- Total pending items as a combined count

- Query approach: Find teacher's lessons, then find exams/assignments that are past due and have `results.length < class.students.length`
- Display: Card with total count prominently shown, with exam/assignment breakdown below

**REQ-DASH-005** (Event-Driven - Class Attendance Overview):
**When** a teacher loads their dashboard, **then** the system shall display a "Class Attendance Overview" widget showing the attendance percentage for each class the teacher teaches, based on attendance records from the current week (Monday-Friday).

- Query: For each unique classId from teacher's lessons, count attendance records where `present === true` vs total records this week
- Display: List of class names with attendance percentage bars or text
- Empty state: "No attendance data for this week"

### 3.3 Student Dashboard

**REQ-DASH-006** (Event-Driven - Recent Grades):
**When** a student loads their dashboard, **then** the system shall display a "Recent Grades" widget showing the student's latest 5 results, including the associated exam or assignment title and the score.

- Query: `prisma.result.findMany({ where: { studentId }, take: 5, orderBy: { id: "desc" }, include: { exam: { select: { title: true } }, assignment: { select: { title: true } } } })`
- Display: List with title (exam or assignment), score, and type indicator
- Empty state: "No grades yet"

**REQ-DASH-007** (Event-Driven - Upcoming Exams):
**When** a student loads their dashboard, **then** the system shall display an "Upcoming Exams" widget listing exams with `startTime` within the next 7 days, filtered to exams belonging to lessons in the student's class.

- Query: `prisma.exam.findMany({ where: { lesson: { classId: studentClassId }, startTime: { gte: now, lte: now + 7 days } }, include: { lesson: { select: { subject: { select: { name: true } } } } }, orderBy: { startTime: "asc" } })`
- Display: Exam title, subject name, date/time
- Empty state: "No upcoming exams"

**REQ-DASH-008** (Ubiquitous - Integrate Existing Component):
The student dashboard shall integrate the existing `StudentAttendanceCard` component, passing the current user's ID, to display year-to-date attendance percentage.

**REQ-DASH-009** (Event-Driven - Assignments Due):
**When** a student loads their dashboard, **then** the system shall display an "Assignments Due" widget listing assignments with `dueDate` within the next 7 days, filtered to assignments belonging to lessons in the student's class.

- Query: `prisma.assignment.findMany({ where: { lesson: { classId: studentClassId }, dueDate: { gte: now, lte: now + 7 days } }, include: { lesson: { select: { subject: { select: { name: true } } } } }, orderBy: { dueDate: "asc" } })`
- Display: Assignment title, subject name, due date
- Empty state: "No assignments due this week"

### 3.4 Parent Dashboard

**REQ-DASH-010** (Event-Driven - Quick Stats Per Child):
**When** a parent loads their dashboard, **then** the system shall display a "Quick Stats" card for each child showing:
- Attendance percentage this semester (year-to-date using January 1 cutoff)
- Most recent grade (latest Result with exam/assignment title and score)
- Count of pending assignments (assignments with dueDate in the future that have no Result for this student)

- Query: For each student belonging to the parent, aggregate attendance, latest result, and pending assignments
- Display: Card per child with name, three stat lines
- Empty state per stat: dash character "-" if no data

**REQ-DASH-011** (Event-Driven - Recent Activity Feed):
**When** a parent loads their dashboard, **then** the system shall display a "Recent Activity" feed showing the latest 5 events across all children, including:
- New grades (Results with exam/assignment title)
- Attendance records (date and present/absent status)

- Query: Union of latest results and attendance records for all parent's children, sorted by date descending, limited to 5
- Display: Chronological feed with activity type icon/label, child name, description, and relative date
- Empty state: "No recent activity"

### 3.5 Cross-Cutting Requirements

**REQ-DASH-012** (Ubiquitous - Server Component Pattern):
All new widgets shall follow the existing server/client component pattern. Widgets that require only server-rendered HTML shall be server components. Widgets that require Recharts (client-side rendering) shall use a server container component that fetches data and a client component that renders the chart.

**REQ-DASH-013** (Ubiquitous - Real Data):
All new widgets shall query real data from the Prisma database with proper role-based filtering. The system shall not use hardcoded or sample data.

**REQ-DASH-014** (Ubiquitous - Consistent Styling):
All new widgets shall follow the existing card styling pattern: white background (`bg-white`), rounded corners (`rounded-md` or `rounded-xl`), and padding (`p-4`). Section headers shall use `text-xl font-semibold` or `text-lg font-semibold` consistent with existing widgets.

**REQ-DASH-015** (Unwanted - No Hardcoded Data):
The system shall not contain any hardcoded chart data in production components after this overhaul is complete.

---

## 4. Specifications

### 4.1 New Components

| Component | Type | Role Dashboard | Props |
| --------- | ---- | -------------- | ----- |
| `ClassOccupancyChart.tsx` | Client ("use client") | Admin | `data: { name: string; capacity: number; studentCount: number }[]` |
| `ClassOccupancyChartContainer.tsx` | Server | Admin | None (fetches own data) |
| `TodaySchedule.tsx` | Server | Teacher | `teacherId: string` |
| `PendingGrading.tsx` | Server | Teacher | `teacherId: string` |
| `ClassAttendanceOverview.tsx` | Server | Teacher | `teacherId: string` |
| `RecentGrades.tsx` | Server | Student | `studentId: string` |
| `UpcomingExams.tsx` | Server | Student | `classId: number` |
| `AssignmentsDue.tsx` | Server | Student | `classId: number` |
| `ChildQuickStats.tsx` | Server | Parent | `studentId: string` |
| `RecentActivity.tsx` | Server | Parent | `studentIds: string[]` |

### 4.2 Modified Files

| File | Changes |
| ---- | ------- |
| `src/app/(dashboard)/admin/page.tsx` | Replace `FinanceChart` import/usage with `ClassOccupancyChartContainer` |
| `src/app/(dashboard)/teacher/page.tsx` | Add TodaySchedule, PendingGrading, ClassAttendanceOverview to right sidebar |
| `src/app/(dashboard)/student/page.tsx` | Add RecentGrades, UpcomingExams, AssignmentsDue to right sidebar; integrate StudentAttendanceCard |
| `src/app/(dashboard)/parent/page.tsx` | Add ChildQuickStats per child; add RecentActivity to right sidebar |

### 4.3 Deleted Files

| File | Reason |
| ---- | ------ |
| `src/components/FinanceChart.tsx` | Replaced by ClassOccupancyChart; contained only hardcoded data |
| `src/components/Performance.tsx` | Dead code; hardcoded pie chart never imported by any page |

### 4.4 Day Enum Mapping Utility

A helper function is needed to convert JavaScript `Date.getDay()` (0-6) to the Prisma `Day` enum:

```typescript
const dayMap: Record<number, Day> = {
  1: "MONDAY",
  2: "TUESDAY",
  3: "WEDNESDAY",
  4: "THURSDAY",
  5: "FRIDAY",
};

function getTodayDayEnum(): Day | null {
  return dayMap[new Date().getDay()] || null;
}
```

This utility should be placed in `src/lib/utils.ts` or a similar shared location.

### 4.5 Constraints

- **CON-001**: No new npm dependencies shall be introduced. All charts use the existing Recharts library.
- **CON-002**: All Prisma queries must be performed in server components or server-side functions, never in client components.
- **CON-003**: The `auth()` call from Clerk must be used for role-based data filtering; no data from other users' dashboards should leak.
- **CON-004**: Components must handle empty/null data gracefully with appropriate empty state messages.
- **CON-005**: Weekend days (Saturday, Sunday) have no Day enum value; the TodaySchedule widget must handle this with "No lessons on weekends" message.

---

## 5. Traceability

| Requirement   | Component(s)                                    | Acceptance Test    |
| ------------- | ----------------------------------------------- | ------------------ |
| REQ-DASH-001  | ClassOccupancyChart, ClassOccupancyChartContainer, admin/page.tsx | AC-DASH-001 |
| REQ-DASH-002  | (deletion of Performance.tsx)                   | AC-DASH-002        |
| REQ-DASH-003  | TodaySchedule, teacher/page.tsx                 | AC-DASH-003        |
| REQ-DASH-004  | PendingGrading, teacher/page.tsx                | AC-DASH-004        |
| REQ-DASH-005  | ClassAttendanceOverview, teacher/page.tsx        | AC-DASH-005        |
| REQ-DASH-006  | RecentGrades, student/page.tsx                  | AC-DASH-006        |
| REQ-DASH-007  | UpcomingExams, student/page.tsx                  | AC-DASH-007        |
| REQ-DASH-008  | StudentAttendanceCard, student/page.tsx          | AC-DASH-008        |
| REQ-DASH-009  | AssignmentsDue, student/page.tsx                | AC-DASH-009        |
| REQ-DASH-010  | ChildQuickStats, parent/page.tsx                | AC-DASH-010        |
| REQ-DASH-011  | RecentActivity, parent/page.tsx                 | AC-DASH-011        |
| REQ-DASH-012  | All new components                              | AC-DASH-012        |
| REQ-DASH-013  | All new components                              | AC-DASH-013        |
| REQ-DASH-014  | All new components                              | AC-DASH-014        |
| REQ-DASH-015  | (codebase-wide)                                 | AC-DASH-015        |
