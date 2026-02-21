# SPEC-LMS-002: Implementation Plan

## Metadata

| Field    | Value            |
|----------|------------------|
| SPEC     | SPEC-LMS-002     |
| Version  | 1.0.0            |
| Created  | 2026-02-21       |
| Priority | High             |

---

## Scope Summary

| Category          | Count |
|-------------------|-------|
| Schema changes    | 1 (add maxEnrollments to Course) |
| New Server Actions| 2 (selfEnrollStudent, unenrollSelf) |
| New Components    | 1 (EnrollButton.tsx) |
| Modified Files    | 6-7 files |
| New Files         | 1-2 files |
| Migration         | 1 Prisma migration |

---

## Milestone 1: Schema and Access Control Foundation

**Priority**: Primary Goal (must complete first)

### Tasks

#### M1-T1: Add maxEnrollments to Course model

- **File**: `prisma/schema.prisma`
- **Action**: Add `maxEnrollments Int?` field to the Course model after the `status` field
- **Migration**: Run `npx prisma migrate dev --name add-course-max-enrollments`
- **Verification**: Run `npx prisma generate` and confirm the Prisma client includes the new field
- **Dependencies**: None

#### M1-T2: Update route access map

- **File**: `src/lib/settings.ts`
- **Action**: Add `"student"` to the `"/list/courses"` entry in `routeAccessMap`
- **Change**: `["admin", "teacher"]` becomes `["admin", "teacher", "student"]`
- **Dependencies**: None

#### M1-T3: Add Zod validation schemas

- **File**: `src/lib/formValidationSchemas.ts`
- **Action**: Add `selfEnrollmentSchema` with `courseId` field; update existing `courseSchema` to include optional `maxEnrollments`
- **Dependencies**: None

#### M1-T4: Update CourseForm for maxEnrollments

- **File**: `src/components/forms/CourseForm.tsx`
- **Action**: Add an optional numeric input field for `maxEnrollments` with label "Max Enrollments (leave empty for unlimited)"
- **File**: `src/components/FormContainer.tsx`
- **Action**: Ensure course form data fetching includes `maxEnrollments` in the select/include
- **Dependencies**: M1-T1 (schema), M1-T3 (Zod schema)

### Milestone 1 Deliverables

- Prisma schema updated and migration applied
- Student can navigate to `/list/courses` without being blocked by middleware
- CourseForm supports maxEnrollments field for admin/teacher use
- Zod schemas ready for server action validation

---

## Milestone 2: Server Actions and Enrollment Logic

**Priority**: Secondary Goal (depends on Milestone 1)

### Tasks

#### M2-T1: Implement selfEnrollStudent action

- **File**: `src/lib/actions.ts`
- **Action**: Create the `selfEnrollStudent` Server Action with the following logic:
  1. Authenticate via `auth()` and verify `role === "student"`
  2. Look up Student record by `clerkId`
  3. Parse and validate `courseId` using `selfEnrollmentSchema`
  4. Fetch the course and verify `status === "PUBLISHED"`
  5. Check for existing ACTIVE enrollment (prevent duplicates)
  6. If `maxEnrollments` is set, use a Prisma `$transaction` to atomically count ACTIVE enrollments and create the enrollment only if capacity is available
  7. Create the Enrollment record with `status: ACTIVE`
  8. Send confirmation notification to the student
  9. Send notification to the course teacher
  10. Call `revalidatePath("/list/courses")`
- **Dependencies**: M1-T1 (schema), M1-T3 (Zod schema)

#### M2-T2: Implement unenrollSelf action

- **File**: `src/lib/actions.ts`
- **Action**: Create the `unenrollSelf` Server Action with the following logic:
  1. Authenticate via `auth()` and verify `role === "student"`
  2. Look up Student record by `clerkId`
  3. Fetch enrollment by `enrollmentId` and verify it belongs to the student
  4. Verify enrollment `status === "ACTIVE"` (reject if COMPLETED)
  5. Update enrollment status to `DROPPED`
  6. Send notification to the course teacher
  7. Call `revalidatePath("/list/courses")`
- **Dependencies**: M1-T1 (schema)

### Milestone 2 Deliverables

- Both Server Actions operational with full validation
- Notification integration working
- Race condition handling via Prisma transaction for capacity-limited courses

---

## Milestone 3: UI Components and Page Integration

**Priority**: Final Goal (depends on Milestones 1 and 2)

### Tasks

#### M3-T1: Create EnrollButton component

- **File**: `src/components/EnrollButton.tsx` (new)
- **Action**: Create a Client Component with the following states:
  - "Enroll" button (green) when student is not enrolled and course has capacity
  - "Drop Course" button (red) when student has ACTIVE enrollment
  - "Full" badge (gray, disabled) when course is at capacity
  - "Completed" badge (blue, no action) when enrollment is COMPLETED
  - Loading spinner during action execution
  - Confirmation dialog before dropping a course
  - Toast notification on success/failure via React Toastify
- **Props**: `courseId`, `enrollmentId`, `enrollmentStatus`, `isFull`, `courseName`
- **Dependencies**: M2-T1, M2-T2 (Server Actions)

#### M3-T2: Update course list page for student view

- **File**: `src/app/(dashboard)/list/courses/page.tsx`
- **Action**: Add a role-based branch for the student view:
  - Detect role via `auth()`
  - For students: query only `PUBLISHED` courses with enrollment counts and the student's own enrollment status
  - Render each course with title, teacher name, subject, description, enrollment count vs. capacity, and `EnrollButton`
  - Preserve existing admin/teacher behavior in an else branch
  - Support pagination via `ITEM_PER_PAGE` and URL search params
  - Support search by course title
- **Dependencies**: M1-T2 (route access), M3-T1 (EnrollButton)

### Milestone 3 Deliverables

- Complete student-facing course catalog with enrollment/drop functionality
- Enrollment status clearly indicated on each course card
- All existing admin/teacher behavior preserved

---

## File Modification Sequence

The recommended order of file changes minimizes rework and ensures each change builds on stable foundations:

| Order | File                                          | Action   | Milestone |
|-------|-----------------------------------------------|----------|-----------|
| 1     | `prisma/schema.prisma`                        | Modify   | M1        |
| 2     | `src/lib/settings.ts`                         | Modify   | M1        |
| 3     | `src/lib/formValidationSchemas.ts`            | Modify   | M1        |
| 4     | `src/components/forms/CourseForm.tsx`          | Modify   | M1        |
| 5     | `src/components/FormContainer.tsx`            | Modify   | M1        |
| 6     | `src/lib/actions.ts`                          | Modify   | M2        |
| 7     | `src/components/EnrollButton.tsx`             | Create   | M3        |
| 8     | `src/app/(dashboard)/list/courses/page.tsx`   | Modify   | M3        |

---

## Dependency Analysis

```
M1-T1 (schema) ──────────┬──> M1-T4 (CourseForm)
                          ├──> M2-T1 (selfEnrollStudent)
                          └──> M2-T2 (unenrollSelf)

M1-T2 (route access) ────────> M3-T2 (course list page)

M1-T3 (Zod schemas) ─────┬──> M1-T4 (CourseForm)
                          └──> M2-T1 (selfEnrollStudent)

M2-T1 (selfEnrollStudent) ──> M3-T1 (EnrollButton)
M2-T2 (unenrollSelf) ───────> M3-T1 (EnrollButton)

M3-T1 (EnrollButton) ───────> M3-T2 (course list page)
```

Independent tasks (can be done in parallel):
- M1-T1, M1-T2, M1-T3 are all independent of each other
- M2-T1 and M2-T2 are independent of each other (both depend on M1)

---

## Risk Assessment

### R-01: Race Condition on Capacity-Limited Enrollment (Medium)

**Risk**: Two students enroll simultaneously in a course with 1 remaining slot, exceeding capacity.
**Mitigation**: Use Prisma `$transaction` with an isolation level or a count-then-create pattern inside a transaction to ensure atomicity. The `@@unique([studentId, courseId])` constraint provides a secondary safety net against duplicates.

### R-02: Existing Course Data Without maxEnrollments (Low)

**Risk**: All existing courses will have `maxEnrollments = null` after migration, meaning unlimited enrollment.
**Mitigation**: This is the intended behavior. Admin/teacher can update maxEnrollments via the CourseForm if capacity limits are needed. No data migration script required.

### R-03: Student Accessing Course Detail Without Enrollment (Low)

**Risk**: After adding students to the `/list/courses` route, students might attempt to navigate directly to course detail pages for courses they are not enrolled in.
**Mitigation**: The existing course detail page (`/list/courses/[id]/page.tsx`) already performs enrollment-based access checks for students. Verify this behavior during testing.

### R-04: Large Enrollment Counts Impacting Page Load (Low)

**Risk**: Counting ACTIVE enrollments per course on every page load could be slow with many courses.
**Mitigation**: Prisma `_count` aggregation is efficient. For the expected scale (under 500 users, under 100 courses), this is not a performance concern. Monitor if scale increases.

### R-05: Notification Delivery Failure (Low)

**Risk**: If notification creation fails, the enrollment still succeeds but the user is not notified.
**Mitigation**: Notification creation is non-blocking. Wrap notification calls in try/catch to prevent enrollment failures due to notification errors. Log notification failures for monitoring.

---

## Technical Approach

### Authentication Pattern

All new Server Actions follow the established pattern:

```typescript
const { userId, sessionClaims } = await auth();
const role = (sessionClaims?.metadata as { role?: string })?.role;
if (role !== "student") {
  return { success: false, error: true, message: "Unauthorized" };
}
```

### Data Fetching Pattern for Student Course Catalog

The course list page uses the standard async Server Component pattern with Prisma queries. For the student view:

```typescript
const courses = await prisma.course.findMany({
  where: { status: "PUBLISHED" },
  include: {
    teacher: { select: { name: true, surname: true } },
    subject: { select: { name: true } },
    _count: { select: { enrollments: { where: { status: "ACTIVE" } } } },
    enrollments: {
      where: { studentId: currentStudentId },
      select: { id: true, status: true },
    },
  },
  skip: (page - 1) * ITEM_PER_PAGE,
  take: ITEM_PER_PAGE,
});
```

### Capacity Check Pattern (Atomic)

To prevent race conditions on capacity-limited courses:

```typescript
await prisma.$transaction(async (tx) => {
  const activeCount = await tx.enrollment.count({
    where: { courseId, status: "ACTIVE" },
  });
  if (course.maxEnrollments !== null && activeCount >= course.maxEnrollments) {
    throw new Error("Course is full");
  }
  await tx.enrollment.create({
    data: { studentId, courseId, status: "ACTIVE" },
  });
});
```

---

## Expert Consultation Recommendations

This SPEC involves both backend server logic and frontend UI components:

- **expert-backend**: Recommended for implementing Server Actions (selfEnrollStudent, unenrollSelf) with proper transaction handling, race condition prevention, and notification integration.
- **expert-frontend**: Recommended for implementing the EnrollButton component with proper loading states, confirmation dialogs, and updating the course list page with the student view branch.
