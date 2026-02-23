---
id: SPEC-FIX-001
type: acceptance
version: "1.0.0"
created: "2026-02-21"
updated: "2026-02-21"
author: ZaF
---

# SPEC-FIX-001: Acceptance Criteria

## Quality Gate Criteria

- All acceptance scenarios pass
- Zero `console.log` statements in production code
- Zero critical or high vulnerabilities in `npm audit`
- All server actions enforce authentication and authorization
- No secrets present in version-controlled files
- All `revalidatePath()` calls active
- All delete actions mapped to correct entity types

---

## Scenario 1: Server Action Authorization

### Scenario 1.1: Unauthorized Role Rejection

```gherkin
Given a user with "student" role is authenticated via Clerk
When the user calls the createTeacher server action
Then the action should reject with an authorization error
And no teacher record should be created in the database
```

### Scenario 1.2: Valid Admin Action

```gherkin
Given a user with "admin" role is authenticated via Clerk
When the user calls the createTeacher server action with valid data
Then the action should execute successfully
And a new teacher record should be created in the database
```

### Scenario 1.3: Teacher Ownership Verification

```gherkin
Given a user with "teacher" role is authenticated via Clerk
And the teacher does not own the target exam
When the teacher calls the updateExam server action for that exam
Then the action should reject with an authorization error
And the exam record should remain unchanged
```

### Scenario 1.4: Unauthenticated Request

```gherkin
Given no user is authenticated (no valid session)
When any server action is called
Then the action should reject with an authentication error
And no database mutation should occur
```

### Scenario 1.5: Parent Role Restriction

```gherkin
Given a user with "parent" role is authenticated via Clerk
When the user calls the deleteStudent server action
Then the action should reject with an authorization error
And the student record should remain unchanged
```

---

## Scenario 2: Middleware Role Check

### Scenario 2.1: Missing Role Redirect

```gherkin
Given a user is authenticated with a valid userId via Clerk
And the user has no role in session metadata (role is undefined)
When the user attempts to access /admin
Then the user should be redirected to a safe page (e.g., /no-role)
And the user should not be granted access to the admin dashboard
```

### Scenario 2.2: Valid Role Access

```gherkin
Given a user is authenticated with "admin" role
When the user attempts to access /admin
Then the user should be granted access to the admin dashboard
```

### Scenario 2.3: Role Mismatch Redirect

```gherkin
Given a user is authenticated with "student" role
When the user attempts to access /admin
Then the user should be redirected to the student dashboard
And the user should not see admin content
```

---

## Scenario 3: Delete Action Correctness

### Scenario 3.1: Correct Entity Deletion

```gherkin
Given an admin clicks delete on an announcement record with ID 42
When the delete action executes
Then the correct announcement record (ID 42) should be deleted
And no subject record should be affected
And the announcements list should refresh without the deleted record
```

### Scenario 3.2: All Entity Types Mapped

```gherkin
Given the deleteActionMap in FormModal is rendered
When each entity type (subject, class, teacher, student, exam, parent, lesson, assignment, result, attendance, event, announcement) triggers a delete
Then each entity type should invoke its own specific delete action
And no entity type should fallback to deleteSubject
```

### Scenario 3.3: Transactional Delete - Prisma Failure

```gherkin
Given an admin deletes a teacher record
And the Clerk deletion succeeds
When the Prisma deletion fails due to a database error
Then an error should be logged with both the Clerk user ID and Prisma record ID
And an error response should be returned indicating partial failure
And the system should not silently succeed
```

---

## Scenario 4: Cache Revalidation

### Scenario 4.1: Create Student Revalidation

```gherkin
Given an admin creates a new student with valid data
When the creation succeeds
Then revalidatePath should be called for the students list page
And the new student should appear in the student list without manual browser refresh
```

### Scenario 4.2: Update Teacher Revalidation

```gherkin
Given an admin updates a teacher's information
When the update succeeds
Then revalidatePath should be called for the teachers list page
And the updated information should be visible on the next page load
```

### Scenario 4.3: All 15 Revalidation Points Active

```gherkin
Given the codebase is inspected
When searching for revalidatePath calls in src/lib/actions.ts
Then all 15 revalidatePath calls should be active (not commented out)
And each call should target the correct list page path for its entity
```

---

## Scenario 5: Results Page Null Safety

### Scenario 5.1: Null Entry Filtering

```gherkin
Given the results table contains entries where some have no associated exam or assignment
When the results list page renders
Then null or undefined entries should be filtered out before rendering
And the Table component should receive only valid, non-null entries
And the page should render without any runtime errors
```

### Scenario 5.2: All Valid Entries Displayed

```gherkin
Given the results table contains 10 entries, 3 of which map to null
When the results list page renders
Then exactly 7 entries should appear in the table
And all 7 entries should display correct data
```

---

## Scenario 6: Assignment Create Button Visibility

### Scenario 6.1: Admin Sees Create Button

```gherkin
Given a user with "admin" role views the assignments list page
When the page renders
Then the admin should see the create button for new assignments
And the button should be functional (opens FormModal)
```

### Scenario 6.2: Teacher Sees Create Button

```gherkin
Given a user with "teacher" role views the assignments list page
When the page renders
Then the teacher should see the create button for new assignments
```

### Scenario 6.3: Student Does Not See Create Button

```gherkin
Given a user with "student" role views the assignments list page
When the page renders
Then the student should not see the create button
```

---

## Scenario 7: Student Page Empty Class Handling

### Scenario 7.1: Graceful Empty Class

```gherkin
Given a student exists in the database
And the student is not enrolled in any class (class array is empty)
When the student dashboard page loads
Then the page should render gracefully without a runtime crash
And the page should display an appropriate message or empty state for class information
```

### Scenario 7.2: Student With Class

```gherkin
Given a student is enrolled in "Class 5A"
When the student dashboard page loads
Then the page should display the class schedule and information for "Class 5A"
```

---

## Scenario 8: No Secrets in Version Control

### Scenario 8.1: .env Excluded

```gherkin
Given the repository is cloned fresh
When checking for the presence of .env files
Then no .env file should be present in the working directory
And .gitignore should contain entries for .env and .env.*
```

### Scenario 8.2: .env.example Present

```gherkin
Given the repository is cloned fresh
When checking for environment configuration guidance
Then a .env.example file should be present
And it should contain all required environment variable names with placeholder values
And it should not contain any real secrets, credentials, or API keys
```

### Scenario 8.3: npm audit Clean

```gherkin
Given all dependencies are installed
When npm audit is executed
Then the audit should report zero critical vulnerabilities
And the audit should report zero high severity vulnerabilities
```

---

## Scenario 9: Code Hygiene

### Scenario 9.1: No Console.log in Production

```gherkin
Given the entire codebase is searched for console.log statements
When checking src/ directory recursively
Then zero console.log statements should be found in .ts and .tsx files
And console.error or console.warn used for legitimate error logging may remain
```

### Scenario 9.2: Correct Component Naming

```gherkin
Given the file src/components/BigCalendar.tsx exists (correct spelling)
When searching for imports containing "BigCalender" (misspelling)
Then zero import references to "BigCalender" should be found
And all imports should reference "BigCalendar" (correct spelling)
```

### Scenario 9.3: Correct Prisma Schema

```gherkin
Given the Prisma schema file is inspected
When checking for the typo "classess"
Then zero instances of "classess" should be found
And the correct field name "classes" should be used
```

### Scenario 9.4: Correct Docker Compose

```gherkin
Given the docker-compose.yml file is inspected
When checking for the typo "postgress"
Then zero instances of "postgress" should be found
And the correct name "postgres" should be used
```

### Scenario 9.5: Correct Validation Messages

```gherkin
Given the class form is submitted with an empty name field
When validation runs
Then the error message should read "Class name is required!"
And it should not display "Subject name is required!"
```

---

## Definition of Done

- [ ] All 9 scenario groups pass verification
- [ ] All server actions include auth() checks with role validation
- [ ] Middleware handles undefined roles with redirect (no implicit allow)
- [ ] `.env` excluded from VCS; `.env.example` present with placeholders
- [ ] All 15 `revalidatePath()` calls uncommented and active
- [ ] All 12 entity types in deleteActionMap invoke correct delete actions
- [ ] Results page filters null entries before Table rendering
- [ ] Admin and teacher roles see assignment create button correctly
- [ ] Student page handles empty class array without crash
- [ ] Zero `console.log` statements in production code
- [ ] BigCalendar correctly spelled in filename and all imports
- [ ] Prisma schema uses `classes` (not `classess`)
- [ ] Docker Compose uses `postgres` (not `postgress`)
- [ ] Form validation shows "Class name is required!" (not "Subject name")
- [ ] Next.js upgraded to patched version with zero critical/high CVEs
- [ ] `npm audit` reports zero critical and zero high vulnerabilities
- [ ] Clerk+Prisma deletes handle partial failure with logging
