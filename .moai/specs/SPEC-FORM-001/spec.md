---
id: SPEC-FORM-001
title: "Missing CRUD Forms for School Management Dashboard"
version: "1.0.0"
status: completed
priority: high
created: 2026-02-21
tags: [forms, crud, frontend, react-hook-form, zod, server-actions]
related: [SPEC-FIX-001]
---

# SPEC-FORM-001: Missing CRUD Forms

## 1. Problem Statement

The school management dashboard defines 12 entity types in the Prisma schema but only 5 entities (Subject, Class, Teacher, Student, Exam) have create/update form components. The remaining 7 entities (Assignment, Event, Announcement, Result, Lesson, Parent, Attendance) have delete actions and are referenced in list pages, but clicking "create" or "update" renders "Form not found!" because no form component exists in the `forms` object in `FormModal.tsx`.

Additionally, the assignments list page (`src/app/(dashboard)/list/assignments/page.tsx`) imports `FormModal` directly instead of using `FormContainer`, which means it bypasses the server-side `relatedData` loading and passes no relatedData to the form.

## 2. Environment

- **Framework**: Next.js 14 with App Router
- **Authentication**: Clerk (`@clerk/nextjs/server`)
- **ORM**: Prisma with PostgreSQL
- **Form Library**: react-hook-form with `@hookform/resolvers/zod`
- **Validation**: Zod
- **Notifications**: react-toastify
- **Dynamic Imports**: `next/dynamic` for lazy loading form components
- **State Pattern**: `useFormState` from `react-dom` (pre-React 19 pattern)

## 3. Assumptions

- A-1: All 7 missing forms follow the same architectural pattern as the existing 5 forms (SubjectForm, ClassForm, TeacherForm, StudentForm, ExamForm).
- A-2: Each form component is a `"use client"` component using react-hook-form + Zod resolver.
- A-3: Server actions use the `CurrentState` pattern: `(currentState: CurrentState, data: Schema) => Promise<CurrentState>`.
- A-4: Auth guards already exist for delete actions (from SPEC-FIX-001); create/update actions follow the same role-based guard pattern.
- A-5: The `InputField` component is reused for text and datetime-local inputs; select dropdowns are inlined in the form JSX.
- A-6: The `FormContainer` server component is the single entry point for loading relatedData before passing to `FormModal`.
- A-7: The `Day` enum (MONDAY-FRIDAY) from Prisma maps to string values in the form select.

## 4. Requirements

### 4.1 Zod Validation Schemas (Infrastructure)

**REQ-FORM-001**: The system shall provide Zod validation schemas for all 7 missing entity types in `src/lib/formValidationSchemas.ts`.

**REQ-FORM-002**: Each schema shall export both the schema object and its inferred TypeScript type (e.g., `assignmentSchema` and `AssignmentSchema`).

**REQ-FORM-003**: Each schema shall include an optional `id` field for update operations, using `z.coerce.number().optional()` for auto-increment entities and `z.string().optional()` for string-ID entities (Parent).

### 4.2 Server Actions (Infrastructure)

**REQ-FORM-004**: The system shall provide `createXxx` and `updateXxx` server actions for all 7 entities in `src/lib/actions.ts`.

**REQ-FORM-005**: **When** a create or update server action is invoked, **then** the system shall verify the user is authenticated and has the correct role before performing the database operation.

- Assignment, Result: admin or teacher
- Event, Announcement, Lesson, Attendance: admin only
- Parent: admin only (with Clerk user creation for create, similar to Teacher/Student)

**REQ-FORM-006**: **When** a teacher invokes createAssignment or updateAssignment, **then** the system shall verify the teacher owns the specified lesson (same pattern as `createExam`).

**REQ-FORM-007**: Each server action shall call `revalidatePath("/list/{entity}")` on success and return `{ success: true, error: false }`.

### 4.3 Form Components (High Priority)

**REQ-FORM-008**: The system shall provide an `AssignmentForm` component at `src/components/forms/AssignmentForm.tsx` with fields: title (text), startDate (datetime-local), dueDate (datetime-local), lessonId (select from relatedData.lessons). Hidden id field for updates.

**REQ-FORM-009**: The system shall provide an `EventForm` component at `src/components/forms/EventForm.tsx` with fields: title (text), description (text), startTime (datetime-local), endTime (datetime-local), classId (select from relatedData.classes, optional). Hidden id field for updates.

**REQ-FORM-010**: The system shall provide an `AnnouncementForm` component at `src/components/forms/AnnouncementForm.tsx` with fields: title (text), description (text), date (datetime-local), classId (select from relatedData.classes, optional). Hidden id field for updates.

### 4.4 Form Components (Medium Priority)

**REQ-FORM-011**: The system shall provide a `ResultForm` component at `src/components/forms/ResultForm.tsx` with fields: score (number), examId (select, optional), assignmentId (select, optional), studentId (select). Hidden id field for updates. RelatedData: students, exams, assignments.

**REQ-FORM-012**: The system shall provide a `LessonForm` component at `src/components/forms/LessonForm.tsx` with fields: name (text), day (select from Day enum: MONDAY-FRIDAY), startTime (datetime-local), endTime (datetime-local), subjectId (select), classId (select), teacherId (select). Hidden id field for updates. RelatedData: subjects, classes, teachers.

### 4.5 Form Components (Low Priority)

**REQ-FORM-013**: The system shall provide a `ParentForm` component at `src/components/forms/ParentForm.tsx` with fields: username (text), name (text), surname (text), email (text, optional), phone (text), address (text). For create: password field. Hidden id field for updates. The create action shall create a Clerk user with `role: "parent"` metadata (same pattern as Teacher/Student create).

**REQ-FORM-014**: The system shall provide an `AttendanceForm` component at `src/components/forms/AttendanceForm.tsx` with fields: date (datetime-local), present (checkbox), studentId (select), lessonId (select). Hidden id field for updates. RelatedData: students, lessons.

### 4.6 FormModal Integration

**REQ-FORM-015**: The system shall register all 7 new form components in `src/components/FormModal.tsx` using `next/dynamic` lazy loading with a `<h1>Loading...</h1>` fallback, matching the existing pattern.

**REQ-FORM-016**: The `forms` object in `FormModal.tsx` shall include entries for: assignment, event, announcement, result, lesson, parent, attendance -- each mapping to the corresponding form component with the standard `(setOpen, type, data, relatedData) => JSX.Element` signature.

### 4.7 FormContainer RelatedData

**REQ-FORM-017**: The `FormContainer` server component shall load relatedData for each of the 7 new entity types via `switch` cases:

| Entity       | relatedData                                         | Role Filter                                        |
|-------------|-----------------------------------------------------|---------------------------------------------------|
| assignment  | `{ lessons }` - id, name                            | Teacher: filter by teacherId                       |
| event       | `{ classes }` - id, name                            | None                                               |
| announcement| `{ classes }` - id, name                            | None                                               |
| result      | `{ students, exams, assignments }` - id + display   | Teacher: filter exams/assignments by teacherId     |
| lesson      | `{ subjects, classes, teachers }` - id + display    | None                                               |
| parent      | `{}` (no FK relatedData needed)                     | None                                               |
| attendance  | `{ students, lessons }` - id + display              | Teacher: filter by teacherId                       |

### 4.8 Assignments Page Fix

**REQ-FORM-018**: **When** the assignments list page renders create/update/delete buttons, **then** it shall use `FormContainer` instead of importing `FormModal` directly, ensuring relatedData (lessons list) is loaded server-side.

### 4.9 Ubiquitous Requirements

**REQ-FORM-019**: Every form component shall follow the existing pattern: `"use client"` directive, react-hook-form with zodResolver, `useFormState` from react-dom, toast notification on success, `router.refresh()` after success, `setOpen(false)` to close modal.

**REQ-FORM-020**: The system shall not display any console.log statements in production form components.

**REQ-FORM-021**: Every form component shall display `"Something went wrong!"` in red text when `state.error` is true.

## 5. Specifications

### 5.1 Zod Schema Specifications

```typescript
// assignmentSchema
{
  id: z.coerce.number().optional(),
  title: z.string().min(1, { message: "Title is required!" }),
  startDate: z.coerce.date({ message: "Start date is required!" }),
  dueDate: z.coerce.date({ message: "Due date is required!" }),
  lessonId: z.coerce.number({ message: "Lesson is required!" }),
}

// eventSchema
{
  id: z.coerce.number().optional(),
  title: z.string().min(1, { message: "Title is required!" }),
  description: z.string().min(1, { message: "Description is required!" }),
  startTime: z.coerce.date({ message: "Start time is required!" }),
  endTime: z.coerce.date({ message: "End time is required!" }),
  classId: z.coerce.number().optional(), // nullable in Prisma
}

// announcementSchema
{
  id: z.coerce.number().optional(),
  title: z.string().min(1, { message: "Title is required!" }),
  description: z.string().min(1, { message: "Description is required!" }),
  date: z.coerce.date({ message: "Date is required!" }),
  classId: z.coerce.number().optional(), // nullable in Prisma
}

// resultSchema
{
  id: z.coerce.number().optional(),
  score: z.coerce.number().min(0, { message: "Score must be at least 0!" }),
  examId: z.coerce.number().optional(),
  assignmentId: z.coerce.number().optional(),
  studentId: z.string().min(1, { message: "Student is required!" }),
}

// lessonSchema
{
  id: z.coerce.number().optional(),
  name: z.string().min(1, { message: "Lesson name is required!" }),
  day: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"], { message: "Day is required!" }),
  startTime: z.coerce.date({ message: "Start time is required!" }),
  endTime: z.coerce.date({ message: "End time is required!" }),
  subjectId: z.coerce.number({ message: "Subject is required!" }),
  classId: z.coerce.number({ message: "Class is required!" }),
  teacherId: z.string().min(1, { message: "Teacher is required!" }),
}

// parentSchema
{
  id: z.string().optional(),
  username: z.string().min(3, { message: "Username must be at least 3 characters long!" }).max(20, { message: "Username must be at most 20 characters long!" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters long!" }).optional().or(z.literal("")),
  name: z.string().min(1, { message: "First name is required!" }),
  surname: z.string().min(1, { message: "Last name is required!" }),
  email: z.string().email({ message: "Invalid email address!" }).optional().or(z.literal("")),
  phone: z.string().min(1, { message: "Phone is required!" }),
  address: z.string().min(1, { message: "Address is required!" }),
}

// attendanceSchema
{
  id: z.coerce.number().optional(),
  date: z.coerce.date({ message: "Date is required!" }),
  present: z.coerce.boolean(),
  studentId: z.string().min(1, { message: "Student is required!" }),
  lessonId: z.coerce.number({ message: "Lesson is required!" }),
}
```

### 5.2 Server Action Authorization Matrix

| Action             | admin | teacher | student | parent |
|--------------------|-------|---------|---------|--------|
| createAssignment   | Yes   | Yes*    | No      | No     |
| updateAssignment   | Yes   | Yes*    | No      | No     |
| createEvent        | Yes   | No      | No      | No     |
| updateEvent        | Yes   | No      | No      | No     |
| createAnnouncement | Yes   | No      | No      | No     |
| updateAnnouncement | Yes   | No      | No      | No     |
| createResult       | Yes   | Yes*    | No      | No     |
| updateResult       | Yes   | Yes*    | No      | No     |
| createLesson       | Yes   | No      | No      | No     |
| updateLesson       | Yes   | No      | No      | No     |
| createParent       | Yes   | No      | No      | No     |
| updateParent       | Yes   | No      | No      | No     |
| createAttendance   | Yes   | No      | No      | No     |
| updateAttendance   | Yes   | No      | No      | No     |

*Teacher: must verify ownership of the related lesson.

## 6. Files in Scope

| File                                                         | Action   | Description                                   |
|--------------------------------------------------------------|----------|-----------------------------------------------|
| `src/lib/formValidationSchemas.ts`                           | Modify   | Add 7 Zod schemas + type exports              |
| `src/lib/actions.ts`                                         | Modify   | Add 14 server actions (create + update x 7)   |
| `src/components/forms/AssignmentForm.tsx`                     | Create   | Assignment CRUD form component                |
| `src/components/forms/EventForm.tsx`                          | Create   | Event CRUD form component                     |
| `src/components/forms/AnnouncementForm.tsx`                   | Create   | Announcement CRUD form component              |
| `src/components/forms/ResultForm.tsx`                         | Create   | Result CRUD form component                    |
| `src/components/forms/LessonForm.tsx`                         | Create   | Lesson CRUD form component                    |
| `src/components/forms/ParentForm.tsx`                         | Create   | Parent CRUD form component                    |
| `src/components/forms/AttendanceForm.tsx`                     | Create   | Attendance CRUD form component                |
| `src/components/FormModal.tsx`                                | Modify   | Add 7 dynamic imports + forms object entries  |
| `src/components/FormContainer.tsx`                            | Modify   | Add 7 switch cases for relatedData loading    |
| `src/app/(dashboard)/list/assignments/page.tsx`              | Modify   | Replace FormModal with FormContainer          |

## 7. Traceability Matrix

| Requirement   | Schema | Action | Form Component | FormModal | FormContainer | Assignments Page |
|--------------|--------|--------|----------------|-----------|---------------|-----------------|
| REQ-FORM-001 | X      |        |                |           |               |                 |
| REQ-FORM-002 | X      |        |                |           |               |                 |
| REQ-FORM-003 | X      |        |                |           |               |                 |
| REQ-FORM-004 |        | X      |                |           |               |                 |
| REQ-FORM-005 |        | X      |                |           |               |                 |
| REQ-FORM-006 |        | X      |                |           |               |                 |
| REQ-FORM-007 |        | X      |                |           |               |                 |
| REQ-FORM-008 |        |        | X              |           |               |                 |
| REQ-FORM-009 |        |        | X              |           |               |                 |
| REQ-FORM-010 |        |        | X              |           |               |                 |
| REQ-FORM-011 |        |        | X              |           |               |                 |
| REQ-FORM-012 |        |        | X              |           |               |                 |
| REQ-FORM-013 |        |        | X              |           |               |                 |
| REQ-FORM-014 |        |        | X              |           |               |                 |
| REQ-FORM-015 |        |        |                | X         |               |                 |
| REQ-FORM-016 |        |        |                | X         |               |                 |
| REQ-FORM-017 |        |        |                |           | X             |                 |
| REQ-FORM-018 |        |        |                |           |               | X               |
| REQ-FORM-019 |        |        | X              |           |               |                 |
| REQ-FORM-020 |        |        | X              |           |               |                 |
| REQ-FORM-021 |        |        | X              |           |               |                 |

## 8. Out of Scope

- Modifying existing form components (SubjectForm, ClassForm, TeacherForm, StudentForm, ExamForm)
- Adding new Prisma models or modifying the schema
- Adding new list pages (all list pages already exist)
- Image upload functionality for ParentForm
- Automated test creation (covered separately in implementation phase)
- Other list pages that may also directly import FormModal instead of FormContainer
