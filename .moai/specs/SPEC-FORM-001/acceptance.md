---
id: SPEC-FORM-001
type: acceptance
format: gherkin
---

# Acceptance Criteria: SPEC-FORM-001

## 1. Assignment Form

### AC-FORM-001: Create Assignment (Happy Path)

```gherkin
Given an admin user is authenticated
  And the assignments list page is open
  And there is at least one lesson in the database
When the user clicks the create button for assignments
  And the FormContainer loads lessons as relatedData
  And the user fills in title "Math Homework"
  And the user selects startDate "2026-03-01T09:00"
  And the user selects dueDate "2026-03-08T17:00"
  And the user selects a lesson from the dropdown
  And the user clicks "Create"
Then the assignment is created in the database
  And a toast notification displays "Assignment has been created!"
  And the modal closes
  And the assignments list refreshes
```

### AC-FORM-002: Update Assignment

```gherkin
Given an admin user is authenticated
  And an assignment with id 1 exists
When the user clicks the update button for assignment 1
  And the form is pre-populated with the assignment data
  And the user changes the title to "Updated Homework"
  And the user clicks "Update"
Then the assignment is updated in the database
  And a toast notification displays "Assignment has been updated!"
  And the modal closes
```

### AC-FORM-003: Teacher Creates Assignment (Ownership Check)

```gherkin
Given a teacher user is authenticated
  And the teacher owns lesson 5
  And the teacher does not own lesson 10
When the teacher attempts to create an assignment with lessonId 5
Then the assignment is created successfully

When the teacher attempts to create an assignment with lessonId 10
Then the server action returns { success: false, error: true }
  And the form displays "Something went wrong!"
```

### AC-FORM-004: Assignment Validation Errors

```gherkin
Given a user is on the create assignment form
When the user submits the form with an empty title
Then a validation error "Title is required!" is displayed under the title field
  And the form is not submitted to the server
```

---

## 2. Event Form

### AC-FORM-005: Create Event (Happy Path)

```gherkin
Given an admin user is authenticated
When the user opens the create event form
  And fills in title "Science Fair"
  And fills in description "Annual science fair event"
  And selects startTime "2026-04-15T10:00"
  And selects endTime "2026-04-15T16:00"
  And optionally selects a class from the dropdown (or leaves as "None")
  And clicks "Create"
Then the event is created in the database
  And classId is null if no class was selected
  And a toast notification displays "Event has been created!"
```

### AC-FORM-006: Update Event

```gherkin
Given an admin user is authenticated
  And an event with id 3 exists
When the user clicks update on event 3
  And the form is pre-populated with event data
  And the user changes the description to "Updated description"
  And clicks "Update"
Then the event is updated in the database
  And a toast notification displays "Event has been updated!"
```

### AC-FORM-007: Event Validation Errors

```gherkin
Given a user is on the create event form
When the user submits the form with an empty description
Then a validation error "Description is required!" is displayed
  And the form is not submitted
```

---

## 3. Announcement Form

### AC-FORM-008: Create Announcement (Happy Path)

```gherkin
Given an admin user is authenticated
When the user opens the create announcement form
  And fills in title "Holiday Notice"
  And fills in description "School will be closed on Friday"
  And selects date "2026-03-20T08:00"
  And optionally selects a class (or leaves as "None")
  And clicks "Create"
Then the announcement is created in the database
  And a toast notification displays "Announcement has been created!"
```

### AC-FORM-009: Update Announcement

```gherkin
Given an admin user is authenticated
  And an announcement with id 2 exists
When the user clicks update on announcement 2
  And changes the title to "Updated Notice"
  And clicks "Update"
Then the announcement is updated in the database
  And a toast notification displays "Announcement has been updated!"
```

---

## 4. Result Form

### AC-FORM-010: Create Result (Happy Path)

```gherkin
Given an admin user is authenticated
  And there are students, exams, and assignments in the database
When the user opens the create result form
  And enters score 85
  And selects a student from the dropdown
  And selects an exam from the dropdown (optional)
  And leaves assignment as unselected
  And clicks "Create"
Then the result is created with score 85, the selected studentId, the selected examId, and null assignmentId
  And a toast notification displays "Result has been created!"
```

### AC-FORM-011: Update Result

```gherkin
Given an admin user is authenticated
  And a result with id 5 exists with score 70
When the user clicks update on result 5
  And the form is pre-populated with score 70
  And the user changes score to 90
  And clicks "Update"
Then the result is updated with score 90
  And a toast notification displays "Result has been updated!"
```

### AC-FORM-012: Result Validation - Score Minimum

```gherkin
Given a user is on the create result form
When the user enters score -5
Then a validation error "Score must be at least 0!" is displayed
  And the form is not submitted
```

---

## 5. Lesson Form

### AC-FORM-013: Create Lesson (Happy Path)

```gherkin
Given an admin user is authenticated
  And there are subjects, classes, and teachers in the database
When the user opens the create lesson form
  And enters name "Advanced Mathematics"
  And selects day "WEDNESDAY"
  And selects startTime "2026-03-01T09:00"
  And selects endTime "2026-03-01T10:30"
  And selects a subject from the dropdown
  And selects a class from the dropdown
  And selects a teacher from the dropdown
  And clicks "Create"
Then the lesson is created in the database
  And a toast notification displays "Lesson has been created!"
```

### AC-FORM-014: Update Lesson

```gherkin
Given an admin user is authenticated
  And a lesson with id 10 exists
When the user clicks update on lesson 10
  And the form is pre-populated with all lesson fields
  And the user changes the day to "FRIDAY"
  And clicks "Update"
Then the lesson is updated with day FRIDAY
  And a toast notification displays "Lesson has been updated!"
```

### AC-FORM-015: Lesson Validation - All Required Fields

```gherkin
Given a user is on the create lesson form
When the user submits with empty name
Then a validation error "Lesson name is required!" is displayed

When the user submits without selecting a subject
Then a validation error "Subject is required!" is displayed

When the user submits without selecting a class
Then a validation error "Class is required!" is displayed

When the user submits without selecting a teacher
Then a validation error "Teacher is required!" is displayed
```

---

## 6. Parent Form

### AC-FORM-016: Create Parent (Happy Path)

```gherkin
Given an admin user is authenticated
When the user opens the create parent form
  And enters username "john_parent"
  And enters password "securePassword123"
  And enters name "John"
  And enters surname "Doe"
  And enters email "john@example.com"
  And enters phone "+1234567890"
  And enters address "123 Main St"
  And clicks "Create"
Then a Clerk user is created with username "john_parent" and publicMetadata { role: "parent" }
  And a Parent record is created in the database with the Clerk user ID
  And a toast notification displays "Parent has been created!"
```

### AC-FORM-017: Update Parent

```gherkin
Given an admin user is authenticated
  And a parent with id "clerk_abc123" exists
When the user clicks update on that parent
  And the form is pre-populated (username, name, surname, email, phone, address)
  And the user changes the phone to "+9876543210"
  And clicks "Update"
Then the Clerk user is updated (username, name, surname)
  And the Parent record is updated in the database
  And a toast notification displays "Parent has been updated!"
```

### AC-FORM-018: Parent Validation - Username Length

```gherkin
Given a user is on the create parent form
When the user enters username "ab" (less than 3 chars)
Then a validation error "Username must be at least 3 characters long!" is displayed

When the user enters username "a_very_long_username_exceeding_max" (more than 20 chars)
Then a validation error "Username must be at most 20 characters long!" is displayed
```

---

## 7. Attendance Form

### AC-FORM-019: Create Attendance (Happy Path)

```gherkin
Given an admin user is authenticated
  And there are students and lessons in the database
When the user opens the create attendance form
  And selects date "2026-03-15T00:00"
  And checks the "Present" checkbox (true)
  And selects a student from the dropdown
  And selects a lesson from the dropdown
  And clicks "Create"
Then the attendance record is created with present: true
  And a toast notification displays "Attendance has been created!"
```

### AC-FORM-020: Update Attendance

```gherkin
Given an admin user is authenticated
  And an attendance record with id 7 exists with present: true
When the user clicks update on attendance 7
  And unchecks the "Present" checkbox (false)
  And clicks "Update"
Then the attendance is updated with present: false
  And a toast notification displays "Attendance has been updated!"
```

---

## 8. Auth Guard Verification

### AC-FORM-021: Unauthorized User Cannot Create

```gherkin
Given a student user is authenticated
When the student somehow triggers createAssignment server action
Then the action returns { success: false, error: true }
  And no database record is created

Given an unauthenticated request
When any create/update server action is invoked
Then the action returns { success: false, error: true }
```

### AC-FORM-022: Teacher Cannot Create Admin-Only Entities

```gherkin
Given a teacher user is authenticated
When the teacher triggers createEvent server action
Then the action returns { success: false, error: true }

When the teacher triggers createLesson server action
Then the action returns { success: false, error: true }

When the teacher triggers createAnnouncement server action
Then the action returns { success: false, error: true }
```

---

## 9. FormModal Integration

### AC-FORM-023: All 12 Entity Types Render Forms

```gherkin
Given an admin user is authenticated
When the user clicks create on any of the 12 entity types
Then a form is rendered inside the modal (not "Form not found!")
  And the form contains the correct fields for that entity type
```

### AC-FORM-024: Dynamic Import Loading State

```gherkin
Given a slow network connection
When the user clicks create on any entity type
  And the form component has not loaded yet
Then "Loading..." is displayed in the modal
  And once loaded, the form replaces the loading message
```

---

## 10. FormContainer RelatedData

### AC-FORM-025: Assignment Form Receives Lessons

```gherkin
Given the FormContainer renders with table="assignment" and type="create"
When the server component loads relatedData
Then relatedData contains { lessons: [...] } with lesson id and name
  And if the user is a teacher, only lessons owned by that teacher are returned
```

### AC-FORM-026: Lesson Form Receives Multiple RelatedData

```gherkin
Given the FormContainer renders with table="lesson" and type="create"
When the server component loads relatedData
Then relatedData contains { subjects: [...], classes: [...], teachers: [...] }
  And subjects have id and name
  And classes have id and name
  And teachers have id, name, and surname
```

### AC-FORM-027: Parent Form Has No RelatedData

```gherkin
Given the FormContainer renders with table="parent" and type="create"
When the server component loads relatedData
Then relatedData is an empty object {}
```

---

## 11. Assignments Page Fix

### AC-FORM-028: Assignments Page Uses FormContainer

```gherkin
Given the assignments list page is loaded
When the page renders create/update/delete buttons
Then FormContainer is used (not FormModal directly)
  And clicking create opens a form with lesson dropdown populated
  And clicking update opens a pre-populated form with lesson dropdown
  And clicking delete opens the delete confirmation
```

---

## 12. Cross-Cutting Concerns

### AC-FORM-029: Toast Notification Pattern

```gherkin
Given any form submission succeeds
Then a toast notification displays "{Entity} has been {created|updated}!"
  And the modal closes via setOpen(false)
  And the page refreshes via router.refresh()
```

### AC-FORM-030: Error State Pattern

```gherkin
Given any form submission fails (server action returns error: true)
Then "Something went wrong!" is displayed in red text within the form
  And the modal remains open
  And the user can try again
```

---

## 13. Definition of Done

- [ ] All 7 Zod schemas added to `formValidationSchemas.ts` with type exports
- [ ] All 14 server actions (create + update) added to `actions.ts` with auth guards
- [ ] All 7 form components created in `src/components/forms/`
- [ ] All 7 dynamic imports added to `FormModal.tsx`
- [ ] All 7 entries added to the `forms` object in `FormModal.tsx`
- [ ] All 7 switch cases added to `FormContainer.tsx` for relatedData loading
- [ ] Assignments page uses `FormContainer` instead of `FormModal`
- [ ] All 12 entity types render forms (no "Form not found!" messages)
- [ ] TypeScript compilation passes with zero errors
- [ ] All forms follow the existing pattern (useFormState, toast, router.refresh, setOpen)
- [ ] Teacher ownership checks implemented for assignment and result actions
- [ ] Parent create action creates Clerk user with parent role
- [ ] No console.log statements in any form component
- [ ] Optional classId fields handle empty selection correctly (null in database)
