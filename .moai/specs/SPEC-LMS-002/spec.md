# SPEC-LMS-002: Student Self-Enrollment

## Metadata

| Field     | Value                          |
|-----------|--------------------------------|
| ID        | SPEC-LMS-002                   |
| Version   | 1.1.0                         |
| Status    | Completed                      |
| Created   | 2026-02-21                     |
| Updated   | 2026-02-21                     |
| Author    | MoAI (manager-spec)            |
| Priority  | High                           |
| Lifecycle | spec-anchored                  |
| Parent    | SPEC-LMS-001 (LMS Phase 1)    |
| Domain    | LMS - Enrollment               |

## History

| Version | Date       | Author | Description                    |
|---------|------------|--------|--------------------------------|
| 1.0.0   | 2026-02-21 | MoAI   | Initial SPEC creation          |
| 1.1.0   | 2026-02-21 | MoAI   | Updated to reflect implementation; PUBLISHED→ACTIVE terminology; added re-enrollment and capacity guard details |

---

## Problem Statement

Students currently have no way to browse available courses or enroll themselves. The `/list/courses` route is restricted to admin and teacher roles, and the `/list/enrollments` route is admin-only. Enrollment is managed exclusively by administrators through the `EnrollmentForm` component. This creates a bottleneck where every enrollment request must pass through an admin, which is unsustainable for a growing course catalog. Students need a self-service enrollment experience that lets them discover active courses, enroll with a single click, and drop courses they no longer wish to take.

---

## Environment

### Technology Stack

| Technology   | Version  | Role                                     |
|-------------|----------|------------------------------------------|
| Next.js      | 16       | Full-stack framework, App Router         |
| React        | 19       | UI rendering, Server Components          |
| TypeScript   | 5        | Static type checking                     |
| Prisma       | 5.19.1+  | ORM with PostgreSQL                      |
| PostgreSQL   | 14+      | Primary relational database              |
| Clerk        | 6.38.1+  | Authentication and role management       |
| Tailwind CSS | 4.2.0+   | Utility-first styling                    |
| Zod          | 3.23.8+  | Schema validation                        |
| React Hook Form | 7.52.2+ | Form state management               |

### Existing Models (Relevant)

**Course** (from SPEC-LMS-001):
- Fields: `id`, `title`, `description`, `code`, `status` (DRAFT/ACTIVE/ARCHIVED), `createdAt`, `updatedAt`, `teacherId`, `subjectId`
- Relations: `teacher` (Teacher), `subject` (Subject), `modules` (Module[]), `enrollments` (Enrollment[])

**Enrollment** (from SPEC-LMS-001):
- Fields: `id`, `enrolledAt`, `status` (ACTIVE/DROPPED/COMPLETED), `studentId`, `courseId`
- Constraint: `@@unique([studentId, courseId])`
- Relations: `student` (Student), `course` (Course)

**Student**:
- Fields: `id` (String, Clerk ID mapped), `name`, `surname`, `email`, `phone`, `address`, `img`, `bloodType`, `sex`, `birthday`, `parentId`, `classId`, `gradeId`
- Relations: `enrollments` (Enrollment[])

### Existing Server Actions (Relevant)

- `createEnrollment` / `updateEnrollment` / `deleteEnrollment` in `src/lib/actions.ts` (admin-only)

### Existing Routes (Relevant)

- `/list/courses` - Currently admin + teacher only
- `/list/courses/[id]` - Course detail page
- `/list/enrollments` - Admin only

### Schema Change Required

Add `maxEnrollments` field to the Course model:

```prisma
model Course {
  // ... existing fields ...
  maxEnrollments Int?   // null = unlimited capacity
}
```

---

## Assumptions

1. **A-01**: Students have a valid Clerk session with `publicMetadata.role === "student"` and a corresponding Student record in the database linked via `clerkId`.

2. **A-02**: The existing notification system (`src/lib/notificationActions.ts`) is functional and supports creating notifications for any user role. No changes to the Notification model are needed.

3. **A-03**: Course status `ACTIVE` is the equivalent of "active/open for enrollment." Only courses with `status === "ACTIVE"` appear in the student-facing catalog.

4. **A-04**: The `EnrollmentStatus` enum already has the required values (`ACTIVE`, `DROPPED`, `COMPLETED`). No enum changes are needed.

5. **A-05**: The existing `@@unique([studentId, courseId])` constraint on the Enrollment model is sufficient to prevent duplicate enrollments at the database level. The Server Actions provide a user-friendly error before hitting this constraint.

6. **A-06**: The Prisma migration for adding `maxEnrollments` to Course is non-breaking since the field is nullable with no default, meaning all existing courses will have `maxEnrollments = null` (unlimited).

7. **A-07**: The teacher of a course can be resolved via `course.teacherId` to look up the teacher's `clerkId` for sending notifications.

---

## Requirements

### REQ-LMS-023: Student Course Catalog (Event-Driven)

**When** a student navigates to `/list/courses`, **then** the system **shall** display all courses with `ACTIVE` status, showing:
- Course title
- Teacher name (first name + last name)
- Subject name
- Description (truncated if necessary)
- Current enrollment count
- Maximum enrollment capacity (or "Unlimited" when `maxEnrollments` is null)
- The student's enrollment status for each course: "Enrolled" (has ACTIVE enrollment), "Not Enrolled" (no enrollment or DROPPED), or "Full" (course has reached `maxEnrollments` limit)

**Traceability**: REQ-LMS-023 -> `src/app/(dashboard)/list/courses/page.tsx` (student view branch)

---

### REQ-LMS-024: Self-Enrollment (Event-Driven)

**When** a student clicks the "Enroll" button on a course that has available capacity, **then** the system **shall**:
1. Create an `Enrollment` record with `status: ACTIVE` for the authenticated student and the selected course
2. Send a notification to the student confirming their enrollment with the course title
3. Send a notification to the course teacher informing them that the student has enrolled

**Traceability**: REQ-LMS-024 -> `selfEnrollStudent` action in `src/lib/actions.ts`, `EnrollButton.tsx`

---

### REQ-LMS-025: Self-Unenrollment (Event-Driven)

**When** an enrolled student clicks the "Drop Course" button, **then** the system **shall**:
1. Update the student's `Enrollment` status from `ACTIVE` to `DROPPED`
2. Send a notification to the course teacher informing them that the student has dropped the course

**Traceability**: REQ-LMS-025 -> `unenrollSelf` action in `src/lib/actions.ts`, `EnrollButton.tsx`

---

### REQ-LMS-026: Capacity Enforcement (State-Driven)

**While** a course has reached its `maxEnrollments` limit (when `maxEnrollments` is not null and the count of ACTIVE enrollments equals or exceeds `maxEnrollments`), the system **shall**:
- Display the course as "Full" in the catalog
- Disable the "Enroll" button for that course
- Reject any enrollment attempts via the `selfEnrollStudent` action with an appropriate error message

**While** `maxEnrollments` is null, the system **shall** allow unlimited enrollments with no capacity check.

**Traceability**: REQ-LMS-026 -> `selfEnrollStudent` action (capacity validation), `src/app/(dashboard)/list/courses/page.tsx` (UI state)

---

### REQ-LMS-027: Enrollment Guards (Unwanted Behavior)

The system **shall not** allow a student to:
1. Enroll in a course with `status` of `DRAFT` or `ARCHIVED`
2. Create a duplicate enrollment for the same student-course pair (when an ACTIVE enrollment already exists)
3. Drop a course where the enrollment `status` is `COMPLETED`

**Traceability**: REQ-LMS-027 -> `selfEnrollStudent` (guards 1, 2), `unenrollSelf` (guard 3), Prisma `@@unique` constraint (guard 2 at DB level)

---

### REQ-LMS-028: Access Control Update (Ubiquitous)

The system **shall** update the `routeAccessMap` in `src/lib/settings.ts` to grant the `"student"` role access to `/list/courses`.

Student access to course detail pages (`/list/courses/[id]`) **shall** remain scoped to courses in which the student has an `ACTIVE` enrollment.

**Traceability**: REQ-LMS-028 -> `src/lib/settings.ts` (routeAccessMap), `src/app/(dashboard)/list/courses/[id]/page.tsx` (access guard)

---

## Specifications

### S-01: Prisma Schema Change

Add `maxEnrollments` to the Course model:

```prisma
model Course {
  id             Int          @id @default(autoincrement())
  title          String
  description    String?
  code           String       @unique
  status         CourseStatus @default(DRAFT)
  maxEnrollments Int?         // null = unlimited
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  teacherId      String
  teacher        Teacher      @relation(fields: [teacherId], references: [id])
  subjectId      Int
  subject        Subject      @relation(fields: [subjectId], references: [id])
  modules        Module[]
  enrollments    Enrollment[]
}
```

Migration: `npx prisma db push` (shadow database permission issues prevented use of `npx prisma migrate dev`)

---

### S-02: Route Access Map Update

In `src/lib/settings.ts`, change:

```typescript
// Before
"/list/courses": ["admin", "teacher"],

// After
"/list/courses": ["admin", "teacher", "student"],
```

---

### S-03: Zod Validation Schema

In `src/lib/formValidationSchemas.ts`, add:

```typescript
export const selfEnrollmentSchema = z.object({
  courseId: z.coerce.number().int().positive(),
});
```

Update the existing course schema to include the optional `maxEnrollments` field:

```typescript
// Add to courseSchema
maxEnrollments: z.coerce.number().int().positive().nullable().optional(),
```

---

### S-04: Server Action - selfEnrollStudent

In `src/lib/actions.ts`:

```typescript
export const selfEnrollStudent = async (
  currentState: CurrentState,
  data: FormData | { courseId: number }
): Promise<CurrentState> => {
  // 1. Authenticate via auth() - extract userId and role
  // 2. Verify role === "student"
  // 3. Look up Student record by clerkId
  // 4. Parse courseId from data using selfEnrollmentSchema
  // 5. Fetch course and verify status === "ACTIVE"
  // 6. Check for existing enrollment record (any status)
  // 7. If existing enrollment is ACTIVE: return duplicate error
  // 8. If existing enrollment is COMPLETED: return COMPLETED guard error (cannot re-enroll in completed course)
  // 9. If existing enrollment is DROPPED: update status to ACTIVE (re-enrollment path)
  // 10. If no existing enrollment: if maxEnrollments is set, count ACTIVE enrollments atomically via $transaction and compare; create new Enrollment record with status: ACTIVE
  // 11. Send notification to student (confirmation) — wrapped in try/catch for resilience
  // 12. Send notification to teacher (new enrollment) — wrapped in try/catch for resilience
  // 13. revalidatePath("/list/courses")
  // 14. Return { success: true, error: false }
};
```

Return type: `{ success: boolean; error: boolean; message?: string }`

**Implementation notes (scope expansions from original SPEC)**:

- **Re-enrollment logic**: When a student previously dropped a course (enrollment status `DROPPED`), the `selfEnrollStudent` action updates the existing `Enrollment` record's status from `DROPPED` to `ACTIVE` instead of attempting to create a new record. This is required because the `@@unique([studentId, courseId])` constraint on the `Enrollment` model prevents duplicate student-course pairs at the database level.
- **COMPLETED enrollment guard**: If a student has a `COMPLETED` enrollment for a course, `selfEnrollStudent` returns an error with the message "You have already completed this course." This prevents re-enrollment in completed courses while still allowing re-enrollment in dropped courses.
- **Atomic capacity enforcement**: When `maxEnrollments` is set on a course, the capacity check (counting active enrollments) and the new enrollment creation are wrapped in a single `prisma.$transaction` call. This prevents race conditions where two concurrent requests could both pass the capacity check and both create enrollments, exceeding the limit. When `maxEnrollments` is null (unlimited), the transaction overhead is skipped as an optimization.
- **Notification resilience**: All calls to `createNotification` are wrapped in `try/catch` blocks. If a notification fails to create, the enrollment operation still succeeds and returns `{ success: true }`. Notification failures are logged but do not propagate to the user.

---

### S-05: Server Action - unenrollSelf

In `src/lib/actions.ts`:

```typescript
export const unenrollSelf = async (
  currentState: CurrentState,
  data: FormData | { enrollmentId: number }
): Promise<CurrentState> => {
  // 1. Authenticate via auth() - extract userId and role
  // 2. Verify role === "student"
  // 3. Look up Student record by clerkId
  // 4. Fetch enrollment by id, verify it belongs to this student
  // 5. Verify enrollment status === "ACTIVE" (cannot drop COMPLETED)
  // 6. Update enrollment status to DROPPED
  // 7. Send notification to teacher (student dropped) — wrapped in try/catch for resilience
  // 8. revalidatePath("/list/courses")
  // 9. Return { success: true, error: false }
};
```

Return type: `{ success: boolean; error: boolean; message?: string }`

**Implementation note**: The `createNotification` call is wrapped in a `try/catch` block. If the notification fails, the unenrollment still succeeds and returns `{ success: true }`. Notification failures are logged but do not propagate to the user.

---

### S-06: EnrollButton Component

New file: `src/components/EnrollButton.tsx`

```typescript
"use client";

// Props:
// - courseId: number
// - enrollmentId: number | null (null if not enrolled)
// - enrollmentStatus: "ACTIVE" | "DROPPED" | "COMPLETED" | null
// - isFull: boolean
// - courseName: string

// Behavior:
// - If enrollmentStatus === "ACTIVE": show "Drop Course" button (red)
// - If isFull: show "Full" badge (disabled, gray)
// - If not enrolled or DROPPED and not full: show "Enroll" button (green)
// - If COMPLETED: show "Completed" badge (blue, no action)
// - Uses useActionState with selfEnrollStudent or unenrollSelf
// - Shows loading spinner during action execution
// - Displays confirmation dialog before dropping
// - Shows toast notification on success/failure
```

---

### S-07: Course List Page - Student View

Modify `src/app/(dashboard)/list/courses/page.tsx`:

- Detect the authenticated user's role via `auth()`
- If role is `"student"`:
  - Query courses with `status: "ACTIVE"` (not DRAFT/ARCHIVED)
  - Include `_count: { enrollments: { where: { status: "ACTIVE" } } }` for enrollment count
  - Include the student's own enrollment for each course (to determine enrolled/not enrolled state)
  - Render course cards with: title, teacher name, subject, description excerpt, enrollment count/capacity, and `EnrollButton`
- If role is `"admin"` or `"teacher"`:
  - Preserve existing behavior (all statuses visible, admin/teacher controls)

---

### S-08: CourseForm Update

Modify `src/components/forms/CourseForm.tsx`:

- Add `maxEnrollments` field (optional numeric input)
- Label: "Max Enrollments (leave empty for unlimited)"
- Validate with updated Zod schema

Modify `src/components/FormContainer.tsx`:

- Ensure the course form data fetching includes `maxEnrollments` when editing

---

### S-09: Notification Integration

Use existing `createNotification` from `src/lib/notificationActions.ts`:

- **On enrollment**: Create notification for student ("You have enrolled in [Course Title]") and for teacher ("[Student Name] has enrolled in your course [Course Title]")
- **On unenrollment**: Create notification for teacher ("[Student Name] has dropped your course [Course Title]")

---

## Constraints

1. **C-01**: All Server Actions must call `auth()` from `@clerk/nextjs/server` and verify the user role before any database operation.

2. **C-02**: Server Actions must return the standard `{ success: boolean; error: boolean; message?: string }` response format used throughout the application.

3. **C-03**: The `selfEnrollStudent` action must handle race conditions for capacity-limited courses. Use a Prisma transaction to count active enrollments and create the enrollment atomically.

4. **C-04**: No changes to the existing admin enrollment management flow. The `createEnrollment`, `updateEnrollment`, and `deleteEnrollment` actions remain admin-only.

5. **C-05**: Student access to `/list/courses/[id]` (course detail), `/list/courses/[id]/lesson/[lessonId]` (lesson view), and `/list/courses/[id]/quiz/[quizId]` (quiz view) must continue to verify ACTIVE enrollment before rendering.

6. **C-06**: The maxEnrollments migration must be backward-compatible. Existing courses get `null` (unlimited) and continue to function without modification.

---

## Traceability Matrix

| Requirement  | Schema         | Server Action       | Component             | Route                   |
|-------------|----------------|---------------------|-----------------------|-------------------------|
| REQ-LMS-023 | -              | -                   | courses/page.tsx      | /list/courses           |
| REQ-LMS-024 | Enrollment     | selfEnrollStudent   | EnrollButton.tsx      | /list/courses           |
| REQ-LMS-025 | Enrollment     | unenrollSelf        | EnrollButton.tsx      | /list/courses           |
| REQ-LMS-026 | Course (maxEnrollments) | selfEnrollStudent | EnrollButton.tsx, courses/page.tsx | /list/courses |
| REQ-LMS-027 | Enrollment (unique), Course (status) | selfEnrollStudent, unenrollSelf | EnrollButton.tsx | /list/courses |
| REQ-LMS-028 | -              | -                   | -                     | settings.ts             |

---

## Implementation Notes

The following behaviors were added during implementation as scope expansions beyond the original SPEC. They are documented here per the `spec-anchored` lifecycle requirement.

### Re-enrollment for Previously Dropped Courses

**Original SPEC**: Did not specify handling for students who had previously dropped a course.

**Actual behavior**: The `selfEnrollStudent` action checks for any existing `Enrollment` record for the student-course pair (not just ACTIVE ones). If a `DROPPED` enrollment exists, the action updates its status to `ACTIVE` rather than creating a new record. This is required because the `@@unique([studentId, courseId])` database constraint prevents inserting a second enrollment row for the same student-course pair. The net result is that a student who dropped a course can re-enroll, and the system correctly handles this without constraint violations.

### COMPLETED Enrollment Guard

**Original SPEC**: REQ-LMS-027 guard 2 blocked duplicate active enrollments, and guard 3 blocked dropping a COMPLETED enrollment. Neither explicitly addressed re-enrollment after a COMPLETED status.

**Actual behavior**: The `selfEnrollStudent` action checks if an existing enrollment has status `COMPLETED`. If so, it returns an error: "You have already completed this course." This prevents students from re-enrolling in courses they have already finished, while still allowing re-enrollment in courses they have dropped. The `EnrollButton` component renders a blue "Completed" badge (no action) for COMPLETED enrollments.

### Notification Resilience via try/catch

**Original SPEC**: Notification calls were described as sequential steps in both `selfEnrollStudent` and `unenrollSelf`. The SPEC did not specify error handling for notification failures.

**Actual behavior**: All `createNotification` calls in both Server Actions are wrapped in `try/catch` blocks. If a notification fails (e.g., database error, missing teacher record), the enrollment or unenrollment operation still succeeds and returns `{ success: true, error: false }`. This prevents a notification system failure from blocking students from enrolling or dropping courses.

---

## Out of Scope

| Feature                              | Reason                                    |
|--------------------------------------|-------------------------------------------|
| Teacher approval for enrollment      | Deferred to future SPEC                   |
| Enrollment prerequisites             | Deferred to future SPEC                   |
| Waitlist when course is full         | Deferred to future SPEC                   |
| Course search by interest/keyword    | Deferred to future SPEC                   |
| Course recommendations               | Deferred to future SPEC                   |
| Enrollment history page for students | Can be added incrementally later          |
| Parent view of child enrollments     | Deferred; parents can view via student detail page |
| Bulk enrollment/unenrollment         | Admin-only, out of student self-service scope |
