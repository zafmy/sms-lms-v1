# SPEC-LMS-002: Acceptance Criteria

## Metadata

| Field    | Value            |
|----------|------------------|
| SPEC     | SPEC-LMS-002     |
| Version  | 1.0.0            |
| Created  | 2026-02-21       |
| Format   | Given-When-Then  |

---

## REQ-LMS-023: Student Course Catalog

### AC-023-01: Student sees published courses

```gherkin
Given a student is authenticated and has navigated to /list/courses
  And there are 3 courses: "Math 101" (PUBLISHED), "Physics 201" (PUBLISHED), "History 301" (DRAFT)
When the page loads
Then the student sees exactly 2 courses: "Math 101" and "Physics 201"
  And "History 301" is not visible
  And each course card displays: title, teacher name, subject, description, enrollment count, and enrollment status
```

### AC-023-02: Student sees enrollment count and capacity

```gherkin
Given a student is authenticated and has navigated to /list/courses
  And "Math 101" has maxEnrollments = 30 and 25 ACTIVE enrollments
  And "Physics 201" has maxEnrollments = null and 10 ACTIVE enrollments
When the page loads
Then "Math 101" displays "25 / 30 enrolled"
  And "Physics 201" displays "10 enrolled" with no capacity limit shown (or "Unlimited")
```

### AC-023-03: Student sees own enrollment status

```gherkin
Given a student is authenticated and has navigated to /list/courses
  And the student has an ACTIVE enrollment in "Math 101"
  And the student has no enrollment in "Physics 201"
When the page loads
Then "Math 101" shows an enrollment status indicator of "Enrolled"
  And "Math 101" shows a "Drop Course" button
  And "Physics 201" shows an "Enroll" button
```

### AC-023-04: Admin and teacher view is unchanged

```gherkin
Given an admin is authenticated and has navigated to /list/courses
When the page loads
Then the admin sees all courses regardless of status (DRAFT, PUBLISHED, ARCHIVED)
  And the admin sees the existing admin course management controls
  And the EnrollButton component is not rendered for admin users
```

---

## REQ-LMS-024: Self-Enrollment

### AC-024-01: Successful enrollment

```gherkin
Given a student is authenticated and viewing /list/courses
  And "Math 101" is PUBLISHED with maxEnrollments = 30 and 20 ACTIVE enrollments
  And the student is not enrolled in "Math 101"
When the student clicks the "Enroll" button on "Math 101"
Then an Enrollment record is created with status = ACTIVE, studentId = current student, courseId = Math 101
  And the student receives a notification: "You have enrolled in Math 101"
  And the teacher of "Math 101" receives a notification: "[Student Name] has enrolled in your course Math 101"
  And the "Enroll" button changes to "Drop Course"
  And the enrollment count updates to "21 / 30 enrolled"
  And a success toast message is displayed
```

### AC-024-02: Enrollment in unlimited capacity course

```gherkin
Given a student is authenticated and viewing /list/courses
  And "Open Course" is PUBLISHED with maxEnrollments = null and 100 ACTIVE enrollments
  And the student is not enrolled in "Open Course"
When the student clicks the "Enroll" button on "Open Course"
Then an Enrollment record is created with status = ACTIVE
  And the enrollment succeeds regardless of the current enrollment count
  And the enrollment count updates to "101 enrolled"
```

### AC-024-03: Re-enrollment after dropping

```gherkin
Given a student is authenticated and viewing /list/courses
  And the student previously had a DROPPED enrollment in "Math 101"
  And "Math 101" has available capacity
When the student clicks the "Enroll" button on "Math 101"
Then a new Enrollment record is created with status = ACTIVE
  Or the existing DROPPED enrollment is updated to ACTIVE
  And the student receives an enrollment confirmation notification
```

---

## REQ-LMS-025: Self-Unenrollment

### AC-025-01: Successful course drop

```gherkin
Given a student is authenticated and viewing /list/courses
  And the student has an ACTIVE enrollment in "Math 101"
When the student clicks the "Drop Course" button on "Math 101"
  And the student confirms the drop action in the confirmation dialog
Then the Enrollment status is updated from ACTIVE to DROPPED
  And the teacher of "Math 101" receives a notification: "[Student Name] has dropped your course Math 101"
  And the "Drop Course" button changes to "Enroll"
  And the enrollment count decreases by 1
  And a success toast message is displayed
```

### AC-025-02: Drop cancellation

```gherkin
Given a student is authenticated and viewing /list/courses
  And the student has an ACTIVE enrollment in "Math 101"
When the student clicks the "Drop Course" button on "Math 101"
  And the student cancels in the confirmation dialog
Then the Enrollment status remains ACTIVE
  And no notification is sent
  And the button remains "Drop Course"
```

---

## REQ-LMS-026: Capacity Enforcement

### AC-026-01: Full course display

```gherkin
Given a student is authenticated and viewing /list/courses
  And "Math 101" has maxEnrollments = 30 and 30 ACTIVE enrollments
  And the student is not enrolled in "Math 101"
When the page loads
Then "Math 101" displays a "Full" badge
  And the "Enroll" button is disabled or not shown
  And the enrollment count shows "30 / 30 enrolled"
```

### AC-026-02: Server-side capacity rejection

```gherkin
Given a student is authenticated
  And "Math 101" has maxEnrollments = 30 and 30 ACTIVE enrollments
When the student attempts to call selfEnrollStudent with courseId = Math 101 (via direct action invocation)
Then the action returns { success: false, error: true, message: "Course is full" }
  And no Enrollment record is created
```

### AC-026-03: Capacity freed by drop

```gherkin
Given "Math 101" has maxEnrollments = 30 and 30 ACTIVE enrollments
  And Student A is enrolled in "Math 101"
When Student A drops "Math 101" (status changes to DROPPED)
Then the ACTIVE enrollment count for "Math 101" becomes 29
  And other students now see "Math 101" with an active "Enroll" button instead of "Full"
```

---

## REQ-LMS-027: Enrollment Guards

### AC-027-01: Cannot enroll in DRAFT course

```gherkin
Given a student is authenticated
  And "Draft Course" has status = DRAFT
When the student attempts to call selfEnrollStudent with courseId = Draft Course
Then the action returns { success: false, error: true, message: "Course is not available for enrollment" }
  And no Enrollment record is created
```

### AC-027-02: Cannot enroll in ARCHIVED course

```gherkin
Given a student is authenticated
  And "Old Course" has status = ARCHIVED
When the student attempts to call selfEnrollStudent with courseId = Old Course
Then the action returns { success: false, error: true, message: "Course is not available for enrollment" }
  And no Enrollment record is created
```

### AC-027-03: Cannot create duplicate enrollment

```gherkin
Given a student is authenticated
  And the student already has an ACTIVE enrollment in "Math 101"
When the student attempts to call selfEnrollStudent with courseId = Math 101
Then the action returns { success: false, error: true, message: "You are already enrolled in this course" }
  And no duplicate Enrollment record is created
```

### AC-027-04: Cannot drop completed enrollment

```gherkin
Given a student is authenticated
  And the student has an enrollment in "Math 101" with status = COMPLETED
When the student attempts to call unenrollSelf with the enrollment id
Then the action returns { success: false, error: true, message: "Cannot drop a completed course" }
  And the Enrollment status remains COMPLETED
```

---

## REQ-LMS-028: Access Control Update

### AC-028-01: Student can access course list

```gherkin
Given a student is authenticated
When the student navigates to /list/courses
Then the page loads successfully (HTTP 200)
  And the student is not redirected to an unauthorized page
```

### AC-028-02: Unauthenticated user cannot access course list

```gherkin
Given a user is not authenticated
When the user navigates to /list/courses
Then the user is redirected to the sign-in page
```

### AC-028-03: Student cannot access course detail without enrollment

```gherkin
Given a student is authenticated
  And the student is NOT enrolled in course with id = 5
When the student navigates to /list/courses/5
Then the student is shown a "not found" or "access denied" page
  And the course content is not rendered
```

### AC-028-04: Student can access course detail with ACTIVE enrollment

```gherkin
Given a student is authenticated
  And the student has an ACTIVE enrollment in course with id = 5
When the student navigates to /list/courses/5
Then the course detail page loads successfully
  And the student can see modules, lessons, and quizzes
```

---

## Edge Case Scenarios

### EC-01: Concurrent enrollment race condition

```gherkin
Given "Math 101" has maxEnrollments = 1 and 0 ACTIVE enrollments
  And Student A and Student B both attempt to enroll simultaneously
When both selfEnrollStudent actions execute
Then exactly 1 enrollment is created successfully
  And the other student receives an error: "Course is full"
  And the database has at most 1 ACTIVE enrollment for "Math 101"
```

### EC-02: Student with no database record

```gherkin
Given a user is authenticated with Clerk role = "student"
  And no Student record exists in the database for this Clerk user
When the student attempts to enroll in any course
Then the action returns { success: false, error: true, message: "Student record not found" }
  And no Enrollment record is created
```

### EC-03: Enrollment button loading state

```gherkin
Given a student clicks the "Enroll" button on "Math 101"
When the selfEnrollStudent action is executing
Then the button displays a loading spinner
  And the button is disabled to prevent double-clicks
  And the student cannot click other enrollment buttons on the page
```

### EC-04: Course status changes after page load

```gherkin
Given a student is viewing the course catalog
  And "Math 101" was PUBLISHED when the page loaded
  And an admin changes "Math 101" status to ARCHIVED before the student clicks Enroll
When the student clicks the "Enroll" button on "Math 101"
Then the action returns { success: false, error: true, message: "Course is not available for enrollment" }
  And the page is revalidated to reflect the current course status
```

### EC-05: Course with maxEnrollments = 0

```gherkin
Given "Restricted Course" has maxEnrollments = 0
When a student views the course catalog
Then "Restricted Course" displays a "Full" badge
  And the "Enroll" button is disabled
```

---

## Performance Criteria

| Metric                          | Target                     |
|---------------------------------|----------------------------|
| Course catalog page load time   | < 500ms for 50 courses     |
| selfEnrollStudent action time   | < 300ms                    |
| unenrollSelf action time        | < 200ms                    |
| Enrollment count query          | < 50ms per course          |
| Concurrent enrollment handling  | Correct under 10 simultaneous requests |

---

## Security Test Cases

### SEC-01: Role enforcement on selfEnrollStudent

```gherkin
Given a user is authenticated with role = "teacher"
When the user calls selfEnrollStudent
Then the action returns { success: false, error: true, message: "Unauthorized" }
```

### SEC-02: Role enforcement on unenrollSelf

```gherkin
Given a user is authenticated with role = "admin"
When the user calls unenrollSelf
Then the action returns { success: false, error: true, message: "Unauthorized" }
```

### SEC-03: Student cannot drop another student's enrollment

```gherkin
Given Student A is authenticated
  And Student B has an ACTIVE enrollment with id = 42
When Student A calls unenrollSelf with enrollmentId = 42
Then the action returns { success: false, error: true, message: "Enrollment not found" }
  And Student B's enrollment remains ACTIVE
```

### SEC-04: Student cannot enroll via manipulated data

```gherkin
Given Student A is authenticated
When Student A calls selfEnrollStudent with a manipulated studentId belonging to Student B
Then the action ignores the manipulated studentId
  And uses the authenticated student's own ID from auth() lookup
  And the enrollment is created for Student A, not Student B
```

---

## Smoke Test Checklist

A manual verification sequence to confirm end-to-end functionality after implementation:

### Setup

- [ ] Run `npx prisma migrate dev` to apply the maxEnrollments migration
- [ ] Run `npx prisma generate` to regenerate the Prisma client
- [ ] Verify the dev server starts without errors (`npm run dev`)

### Route Access

- [ ] Log in as a student and navigate to `/list/courses` -- page loads without redirect
- [ ] Log in as an admin and navigate to `/list/courses` -- existing behavior preserved
- [ ] Log in as a teacher and navigate to `/list/courses` -- existing behavior preserved

### Course Catalog (Student View)

- [ ] Verify only PUBLISHED courses appear for student users
- [ ] Verify DRAFT and ARCHIVED courses are hidden from student view
- [ ] Verify each course card shows title, teacher name, subject, description, enrollment count
- [ ] Verify courses with `maxEnrollments` show "X / Y enrolled"
- [ ] Verify courses without `maxEnrollments` show "X enrolled" (no capacity limit)

### Enrollment Flow

- [ ] Click "Enroll" on a course with available capacity -- enrollment succeeds
- [ ] Verify button changes to "Drop Course" after enrollment
- [ ] Verify enrollment count increases by 1
- [ ] Verify student receives a notification confirming enrollment
- [ ] Verify teacher receives a notification about the new enrollment
- [ ] Verify a success toast message appears

### Unenrollment Flow

- [ ] Click "Drop Course" on an enrolled course -- confirmation dialog appears
- [ ] Cancel the dialog -- nothing changes
- [ ] Confirm the dialog -- enrollment status changes to DROPPED
- [ ] Verify button changes back to "Enroll"
- [ ] Verify enrollment count decreases by 1
- [ ] Verify teacher receives a notification about the drop

### Capacity Enforcement

- [ ] Set a course to maxEnrollments = 1 and enroll 1 student
- [ ] Verify another student sees the course as "Full" with disabled button
- [ ] Drop the enrollment and verify the course becomes available again

### Guard Validation

- [ ] Attempt to enroll in a course where you already have an ACTIVE enrollment -- error displayed
- [ ] Attempt to drop a COMPLETED enrollment -- error displayed
- [ ] Verify admin/teacher course list is completely unchanged

### CourseForm Update

- [ ] As admin, open the CourseForm for editing a course
- [ ] Verify the maxEnrollments field is present and optional
- [ ] Set maxEnrollments to 50, save, and verify the value persists
- [ ] Clear maxEnrollments, save, and verify it becomes null (unlimited)

---

## Definition of Done

- [ ] All 6 requirements (REQ-LMS-023 through REQ-LMS-028) are implemented
- [ ] All acceptance criteria pass (AC-023 through AC-028)
- [ ] All edge cases handled (EC-01 through EC-05)
- [ ] All security test cases pass (SEC-01 through SEC-04)
- [ ] Prisma migration applied cleanly with no data loss
- [ ] Existing admin/teacher course management functionality is unaffected
- [ ] Existing student course detail access checks remain intact
- [ ] No TypeScript compilation errors (`npx tsc --noEmit`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] Application builds successfully (`npm run build`)
