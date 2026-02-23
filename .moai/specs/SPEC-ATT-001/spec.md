---
id: SPEC-ATT-001
title: "Attendance List Page"
version: "1.0.0"
status: draft
priority: high
created: 2026-02-21
tags: [attendance, list-page, server-component, prisma, role-based-access, pagination]
related: [SPEC-FORM-001]
---

# SPEC-ATT-001: Attendance List Page

## 1. Problem Statement

The school management dashboard defines a route at `/list/attendance` accessible by admin, teacher, student, and parent roles (configured in `src/lib/settings.ts`). The Prisma `Attendance` model exists with full CRUD support (create/update/delete server actions, AttendanceForm component, FormContainer integration) delivered by SPEC-FORM-001. However, the actual list page component at `src/app/(dashboard)/list/attendance/page.tsx` does not exist. Navigating to `/list/attendance` results in a 404 error.

All other 11 entity list pages follow an established server component pattern. The attendance list page is the only missing page in the system.

## 2. Environment

- **Framework**: Next.js 14 with App Router (server components by default)
- **Authentication**: Clerk (`@clerk/nextjs/server` via `auth()`)
- **ORM**: Prisma with PostgreSQL
- **Styling**: Tailwind CSS with custom `lama*` color tokens
- **Shared Components**: Table, TableSearch, Pagination, FormContainer
- **Constants**: `ITEM_PER_PAGE = 10` from `src/lib/settings.ts`
- **Route Access**: `/list/attendance` is accessible by admin, teacher, student, parent

## 3. Assumptions

- A-1: The established list page pattern (exams, results, etc.) is the canonical template for all list pages. The attendance page shall follow this pattern exactly.
- A-2: The `AttendanceForm` component, `createAttendance`/`updateAttendance`/`deleteAttendance` server actions, and `FormContainer` attendance case all exist (delivered by SPEC-FORM-001).
- A-3: The Prisma `Attendance` model has the following fields: `id` (Int, autoincrement), `date` (DateTime), `present` (Boolean), `studentId` (String FK to Student), `lessonId` (Int FK to Lesson).
- A-4: Role-based data filtering follows the same patterns used in exams and results pages: admin sees all, teacher sees own lessons, student sees own records, parent sees children's records.
- A-5: No new shared components, Prisma models, or server actions are needed. This SPEC only creates one new file.

## 4. Requirements

### 4.1 Page Creation (Ubiquitous)

**REQ-ATT-001**: The system shall provide an attendance list page at `src/app/(dashboard)/list/attendance/page.tsx` as an async server component following the established list page pattern.

**REQ-ATT-002**: The system shall export the page as the default export named `AttendanceListPage`.

### 4.2 Column Definitions

**REQ-ATT-003**: The attendance list page shall display the following columns:

| Column       | Accessor      | Responsive Class       | Content                                          |
|-------------|---------------|------------------------|--------------------------------------------------|
| Student     | `student`     | (always visible)       | Student `name + " " + surname`                   |
| Lesson      | `lesson`      | (always visible)       | Lesson `name`                                    |
| Date        | `date`        | `hidden md:table-cell` | Formatted with `Intl.DateTimeFormat("en-US")`    |
| Status      | `present`     | (always visible)       | "Present" or "Absent" badge with color indicator |
| Actions     | `action`      | (conditional)          | Update + Delete buttons via FormContainer        |

**REQ-ATT-004**: **When** the authenticated user has role "admin" or "teacher", **then** the Actions column shall be included in the column definitions.

**REQ-ATT-005**: **If** the authenticated user has role "student" or "parent", **then** the Actions column shall not be displayed.

### 4.3 Row Rendering

**REQ-ATT-006**: The `renderRow` function shall render each attendance record as a table row with:
- Student full name (`student.name + " " + student.surname`) in the first cell
- Lesson name (`lesson.name`) in the second cell
- Formatted date using `new Intl.DateTimeFormat("en-US").format(item.date)` in the third cell (hidden on mobile)
- Present/Absent status badge in the fourth cell

**REQ-ATT-007**: **When** the `present` field is `true`, **then** the status cell shall display a green "Present" badge.

**REQ-ATT-008**: **When** the `present` field is `false`, **then** the status cell shall display a red "Absent" badge.

**REQ-ATT-009**: **When** the user has role "admin" or "teacher", **then** the row shall include update and delete action buttons rendered via `FormContainer` with `table="attendance"`.

### 4.4 Role-Based Data Filtering

**REQ-ATT-010**: **While** the user role is "admin", the system shall return all attendance records without additional filtering.

**REQ-ATT-011**: **While** the user role is "teacher", the system shall return only attendance records where `lesson.teacherId` matches the current user ID.

**REQ-ATT-012**: **While** the user role is "student", the system shall return only attendance records where `studentId` matches the current user ID.

**REQ-ATT-013**: **While** the user role is "parent", the system shall return only attendance records where `student.parentId` matches the current user ID.

### 4.5 Search and URL Parameter Filtering

**REQ-ATT-014**: **When** the URL contains a `search` query parameter, **then** the system shall filter attendance records where the student name contains the search value (case-insensitive).

**REQ-ATT-015**: **When** the URL contains a `lessonId` query parameter, **then** the system shall filter attendance records by the specified lesson ID.

### 4.6 Pagination

**REQ-ATT-016**: The system shall implement server-side pagination using `ITEM_PER_PAGE` (10) records per page.

**REQ-ATT-017**: The system shall use `prisma.$transaction` to execute both the data query and count query atomically.

**REQ-ATT-018**: **When** the URL contains a `page` query parameter, **then** the system shall display the corresponding page of results using `skip: ITEM_PER_PAGE * (page - 1)`.

### 4.7 Present/Absent Visual Indicator

**REQ-ATT-019**: The "Present" badge shall use a green background color (e.g., `bg-green-100 text-green-700` or equivalent Tailwind classes).

**REQ-ATT-020**: The "Absent" badge shall use a red background color (e.g., `bg-red-100 text-red-700` or equivalent Tailwind classes).

### 4.8 Page Header and Controls

**REQ-ATT-021**: The page shall display the heading "All Attendance" (hidden on mobile, visible on `md:` breakpoint).

**REQ-ATT-022**: The page shall include a `TableSearch` component for search functionality.

**REQ-ATT-023**: The page shall include filter and sort icon buttons matching the established pattern.

**REQ-ATT-024**: **When** the user has role "admin" or "teacher", **then** the page shall display a create button rendered via `<FormContainer table="attendance" type="create" />`.

### 4.9 Unwanted Behavior

**REQ-ATT-025**: The system shall not include any `console.log` statements in the attendance list page.

**REQ-ATT-026**: The system shall not expose attendance records to unauthenticated users.

## 5. Specifications

### 5.1 Type Definition

```typescript
type AttendanceList = {
  id: number;
  date: Date;
  present: boolean;
  student: {
    name: string;
    surname: string;
  };
  lesson: {
    name: string;
  };
};
```

### 5.2 Prisma Query Structure

```typescript
const query: Prisma.AttendanceWhereInput = {};

// URL Params Filtering
if (queryParams.lessonId) {
  query.lessonId = parseInt(queryParams.lessonId);
}
if (queryParams.search) {
  query.student = {
    name: { contains: queryParams.search, mode: "insensitive" },
  };
}

// Role-Based Filtering
switch (role) {
  case "admin":
    break;
  case "teacher":
    query.lesson = { teacherId: currentUserId! };
    break;
  case "student":
    query.studentId = currentUserId!;
    break;
  case "parent":
    query.student = { parentId: currentUserId! };
    break;
}

// Transaction Query
const [data, count] = await prisma.$transaction([
  prisma.attendance.findMany({
    where: query,
    include: {
      student: { select: { name: true, surname: true } },
      lesson: { select: { name: true } },
    },
    take: ITEM_PER_PAGE,
    skip: ITEM_PER_PAGE * (p - 1),
  }),
  prisma.attendance.count({ where: query }),
]);
```

### 5.3 Present/Absent Badge Specification

```tsx
<span className={`px-2 py-1 rounded-full text-xs font-medium ${
  item.present
    ? "bg-green-100 text-green-700"
    : "bg-red-100 text-red-700"
}`}>
  {item.present ? "Present" : "Absent"}
</span>
```

## 6. Files in Scope

| File                                                          | Action  | Description                                   |
|---------------------------------------------------------------|---------|-----------------------------------------------|
| `src/app/(dashboard)/list/attendance/page.tsx`                | Create  | Attendance list page server component         |

## 7. Traceability Matrix

| Requirement   | page.tsx |
|--------------|----------|
| REQ-ATT-001  | X        |
| REQ-ATT-002  | X        |
| REQ-ATT-003  | X        |
| REQ-ATT-004  | X        |
| REQ-ATT-005  | X        |
| REQ-ATT-006  | X        |
| REQ-ATT-007  | X        |
| REQ-ATT-008  | X        |
| REQ-ATT-009  | X        |
| REQ-ATT-010  | X        |
| REQ-ATT-011  | X        |
| REQ-ATT-012  | X        |
| REQ-ATT-013  | X        |
| REQ-ATT-014  | X        |
| REQ-ATT-015  | X        |
| REQ-ATT-016  | X        |
| REQ-ATT-017  | X        |
| REQ-ATT-018  | X        |
| REQ-ATT-019  | X        |
| REQ-ATT-020  | X        |
| REQ-ATT-021  | X        |
| REQ-ATT-022  | X        |
| REQ-ATT-023  | X        |
| REQ-ATT-024  | X        |
| REQ-ATT-025  | X        |
| REQ-ATT-026  | X        |

## 8. Out of Scope

- Creating or modifying the Prisma Attendance model or schema
- Creating or modifying server actions (createAttendance, updateAttendance, deleteAttendance)
- Creating or modifying the AttendanceForm component
- Creating or modifying FormContainer, FormModal, or any shared components
- Adding new middleware or route access rules (already configured)
- Implementing advanced filtering (by date range, by class)
- Adding export/download functionality for attendance records
- Adding bulk attendance creation (mark multiple students at once)
