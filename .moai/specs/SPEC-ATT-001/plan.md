---
id: SPEC-ATT-001
type: plan
methodology: ddd
note: "DDD for this SPEC since it follows an established pattern from existing list pages. ANALYZE existing exams/results pages, PRESERVE patterns, IMPROVE by adding attendance-specific logic."
---

# Implementation Plan: SPEC-ATT-001

## 1. Overview

Create the missing attendance list page at `src/app/(dashboard)/list/attendance/page.tsx`. This is a single-file implementation that follows the exact pattern established by the other 11 list pages. The exams page (`/list/exams/page.tsx`) and results page (`/list/results/page.tsx`) serve as the primary reference templates.

## 2. Dependency Graph

```
Existing Infrastructure (No Changes):
  - Prisma Attendance model (schema.prisma)
  - Server actions: createAttendance, updateAttendance, deleteAttendance (actions.ts)
  - AttendanceForm component (forms/AttendanceForm.tsx)
  - FormContainer attendance case (FormContainer.tsx)
  - FormModal attendance registration (FormModal.tsx)
  - Route access config (settings.ts)
  - Shared components: Table, TableSearch, Pagination, FormContainer

New File:
  src/app/(dashboard)/list/attendance/page.tsx
    - Depends on: prisma, auth(), Table, TableSearch, Pagination, FormContainer, ITEM_PER_PAGE
    - No downstream dependencies
```

## 3. Milestones

### Milestone 1: Attendance List Page (Primary Goal)

**Scope**: Create the complete attendance list page following the established pattern.

**File Created**:
- `src/app/(dashboard)/list/attendance/page.tsx`

**Tasks**:

1.1. ANALYZE the existing exams page pattern:
  - Identify the exact import set (FormContainer, Pagination, Table, TableSearch, prisma, ITEM_PER_PAGE, Prisma types, Image, auth)
  - Map the type definition pattern (ExamList type with nested relations)
  - Map the column definitions pattern (header, accessor, optional className, conditional Actions)
  - Map the renderRow pattern (tr with key, className, td cells)
  - Map the URL params parsing pattern (page extraction, queryParams iteration, switch/case)
  - Map the role-based conditions pattern (switch on role: admin/teacher/student/parent)
  - Map the Prisma $transaction pattern (findMany + count)
  - Map the JSX layout pattern (TOP header/search/buttons, LIST Table, PAGINATION)

1.2. PRESERVE the established pattern by creating the attendance page with identical structure:
  - Same import organization
  - Same async server component signature with searchParams
  - Same auth() and role extraction
  - Same column definition array with spread for conditional Actions
  - Same renderRow function structure
  - Same URL params parsing with switch/case
  - Same role conditions switch/case
  - Same $transaction for data + count
  - Same JSX layout (TOP, LIST, PAGINATION)

1.3. IMPROVE with attendance-specific logic:
  - Define `AttendanceList` type with: id, date, present, student { name, surname }, lesson { name }
  - Columns: Student Name (always visible), Lesson (always visible), Date (hidden md:table-cell), Status/Present (always visible), Actions (conditional)
  - renderRow: student full name, lesson name, formatted date, Present/Absent colored badge
  - URL params: `lessonId` filter (parseInt), `search` filter (student name contains, insensitive)
  - Role conditions:
    - admin: no filter (empty)
    - teacher: `query.lesson = { teacherId: currentUserId! }`
    - student: `query.studentId = currentUserId!`
    - parent: `query.student = { parentId: currentUserId! }`
  - Prisma include: `student: { select: { name, surname } }`, `lesson: { select: { name } }`
  - Present/Absent badge: green `bg-green-100 text-green-700` for Present, red `bg-red-100 text-red-700` for Absent
  - Page heading: "All Attendance"
  - Create button: `<FormContainer table="attendance" type="create" />` for admin/teacher

**Verification**: Page renders at /list/attendance, shows attendance records, filtering works for all roles, pagination works, Present/Absent badges display correctly.

---

## 4. Technical Approach

### 4.1 Page Component Template

The page follows this exact structure (matching all other list pages):

```
Imports: FormContainer, Pagination, Table, TableSearch, prisma, ITEM_PER_PAGE, Prisma types, Image, auth

Type: AttendanceList (with nested student and lesson)

Component: async server component with searchParams prop
  - auth() for userId and role
  - Column definitions array (conditional Actions column)
  - renderRow function (JSX for each table row)
  - URL params parsing (page, lessonId, search)
  - Role-based query conditions (switch/case)
  - Prisma $transaction (findMany + count)
  - JSX return (TOP header area, LIST table, PAGINATION)

Export: default AttendanceListPage
```

### 4.2 Role-Based Query Mapping

| Role    | Filter                                         | Pattern Source  |
|---------|------------------------------------------------|-----------------|
| admin   | No additional filter                           | exams page      |
| teacher | `query.lesson = { teacherId: currentUserId! }` | exams page      |
| student | `query.studentId = currentUserId!`             | results page    |
| parent  | `query.student = { parentId: currentUserId! }` | results page    |

### 4.3 Search Implementation

The search parameter filters by student name. This differs from the exams page (which searches by subject name) but follows a similar Prisma pattern:

```typescript
case "search":
  query.student = {
    name: { contains: value, mode: "insensitive" },
  };
  break;
```

### 4.4 Present/Absent Badge

The badge is a new visual element not present in other list pages. Implementation uses a simple conditional Tailwind class:

```tsx
<span className={`px-2 py-1 rounded-full text-xs font-medium ${
  item.present
    ? "bg-green-100 text-green-700"
    : "bg-red-100 text-red-700"
}`}>
  {item.present ? "Present" : "Absent"}
</span>
```

## 5. Risk Analysis

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Prisma query conflict between search and parent role filter (both set `query.student`) | Data not returned correctly | Medium | Merge student conditions using spread or AND operator |
| Attendance model lacks relations needed for teacher/parent filtering | Query fails | Low | Verified: Lesson has teacherId, Student has parentId in schema |
| FormContainer attendance case missing | Create/Update/Delete buttons fail | Low | Verified: FormContainer already has attendance case (SPEC-FORM-001) |
| Type mismatch between Prisma query result and AttendanceList type | TypeScript error | Low | Use Prisma include with explicit select to match type |

## 6. Architecture Notes

- Only 1 new file is created. No existing files are modified.
- The page follows an identical pattern to the 11 existing list pages.
- The Attendance model's relations (Student, Lesson) provide all data needed for display and filtering.
- The teacher role filter uses `lesson.teacherId` (Lesson belongs to Teacher) rather than a direct teacher-student relationship.
- The student role filter uses `studentId` directly on the Attendance model.
- The parent role filter uses `student.parentId` through the Student relation.
