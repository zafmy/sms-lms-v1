# SPEC-LMS-001: Acceptance Criteria

## Related SPEC

- SPEC ID: SPEC-LMS-001
- Title: LMS Phase 1 - Course Structure, Content Delivery & Basic Quizzes

---

## AC-LMS-001: Course CRUD

**Requirement**: REQ-LMS-001

```gherkin
Feature: Course create, read, update, delete operations

  Scenario: Admin creates a new course
    Given the user is logged in as an admin
    And the course form is opened with type "create"
    When the admin fills in title "Mathematics 101", code "MATH-101", description "Intro to Math", status "DRAFT", selects a teacher and subject
    And submits the form
    Then a new Course record is created in the database
    And the course list page is revalidated
    And a success toast notification is shown

  Scenario: Teacher creates a course they own
    Given the user is logged in as a teacher
    And the course form is opened with type "create"
    When the teacher fills in valid course data
    And submits the form
    Then a new Course record is created with teacherId matching the logged-in teacher
    And a success toast notification is shown

  Scenario: Teacher updates their own course
    Given the user is logged in as a teacher
    And the teacher owns course "MATH-101"
    When the teacher opens the edit form for "MATH-101" and changes the title
    And submits the form
    Then the course title is updated in the database
    And the list page is revalidated

  Scenario: Teacher cannot update another teacher's course
    Given the user is logged in as a teacher with ID "T001"
    And course "ENG-201" is owned by teacher "T002"
    When the update action is called for "ENG-201" with teacher "T001" credentials
    Then the action returns { success: false, error: true }
    And the course record is unchanged

  Scenario: Admin deletes a course
    Given the user is logged in as an admin
    And course "MATH-101" exists with 3 modules and 5 enrollments
    When the admin deletes "MATH-101"
    Then the course record is removed
    And all associated modules, lessons, and enrollments are cascade deleted

  Scenario: Student cannot create a course
    Given the user is logged in as a student
    When the createCourse action is called
    Then the action returns { success: false, error: true }

  Scenario: Course code uniqueness validation
    Given a course with code "MATH-101" already exists
    When a user tries to create another course with code "MATH-101"
    Then the action returns { success: false, error: true, message: containing "unique" or "already exists" }

  Scenario: Course code format validation
    Given the course form is submitted with code "math 101" (lowercase with space)
    When the Zod schema validates the input
    Then validation fails with a code format error
```

---

## AC-LMS-002: Course List Page

**Requirement**: REQ-LMS-002

```gherkin
Feature: Paginated course list with search and filter

  Scenario: Admin views all courses
    Given the user is logged in as an admin
    And 25 courses exist in the database
    When the admin navigates to /list/courses
    Then the page displays 10 courses (ITEM_PER_PAGE)
    And pagination shows 3 pages
    And each row shows Code, Title, Teacher name, Subject name, Status, Module count, Enrollment count

  Scenario: Teacher views only their courses
    Given the user is logged in as a teacher
    And the teacher owns 3 courses out of 25 total
    When the teacher navigates to /list/courses
    Then only 3 courses are displayed
    And all displayed courses have the teacher as the owner

  Scenario: Search by title
    Given 25 courses exist, 3 containing "Math" in the title
    When the user searches for "Math"
    Then only 3 courses matching "Math" (case-insensitive) are displayed

  Scenario: Search by code
    Given courses with codes "MATH-101", "MATH-201", "ENG-101" exist
    When the user searches for "MATH"
    Then "MATH-101" and "MATH-201" are displayed

  Scenario: Filter by status
    Given courses with statuses DRAFT (5), ACTIVE (15), ARCHIVED (5)
    When the user filters by status "ACTIVE"
    Then only 15 courses with ACTIVE status are displayed

  Scenario: Filter by subject
    Given courses linked to subjects "Mathematics" (10), "English" (8), "Science" (7)
    When the user filters by subject "Mathematics"
    Then only 10 courses linked to Mathematics are displayed

  Scenario: Empty state
    Given no courses exist (or no courses match filters)
    When the page renders
    Then an appropriate empty state message is displayed
```

---

## AC-LMS-003: Course Status Access Control

**Requirement**: REQ-LMS-003

```gherkin
Feature: Course content visibility based on status

  Scenario: DRAFT course visible only to owner and admin
    Given course "DRAFT-101" has status DRAFT and is owned by teacher "T001"
    When teacher "T001" navigates to the course detail page
    Then the course content (modules, lessons) is visible
    When admin navigates to the course detail page
    Then the course content is visible
    When student "S001" (enrolled) navigates to the course detail page
    Then the student is denied access or sees a "course not available" message

  Scenario: ACTIVE course accessible to enrolled students
    Given course "ACTIVE-101" has status ACTIVE
    And student "S001" has an ACTIVE enrollment
    When student "S001" navigates to the course detail page
    Then modules and lessons are visible
    And the student can access lesson content

  Scenario: ARCHIVED course is read-only
    Given course "ARCHIVED-101" has status ARCHIVED
    When any user views the course
    Then content is visible but no edit/create/delete buttons are shown
    When an admin attempts to create a new enrollment for this course
    Then the action returns an error indicating the course is archived
```

---

## AC-LMS-004: Module CRUD

**Requirement**: REQ-LMS-004

```gherkin
Feature: Module create, read, update, delete within a course

  Scenario: Teacher creates a module in their course
    Given the user is logged in as a teacher who owns course "MATH-101"
    When the teacher opens the module form and fills in title "Algebra Basics", order 1
    And submits the form
    Then a new Module record is created linked to "MATH-101"

  Scenario: Teacher cannot create a module in another teacher's course
    Given teacher "T001" does not own course "ENG-201"
    When the createModule action is called for "ENG-201" by teacher "T001"
    Then the action returns { success: false, error: true }

  Scenario: Admin creates a module in any course
    Given the user is logged in as an admin
    When the admin creates a module in any course
    Then the module is created successfully

  Scenario: Module deletion cascades to lessons
    Given module "Algebra Basics" contains 5 lessons with progress records
    When the module is deleted
    Then all 5 lessons and their progress records are cascade deleted

  Scenario: Module order is maintained
    Given course "MATH-101" has modules with orders 1, 2, 3
    When a new module is created with order 2
    Then the module list displays modules sorted by order field
```

---

## AC-LMS-005: Module Management UI

**Requirement**: REQ-LMS-005

```gherkin
Feature: Module display within course detail page

  Scenario: Modules displayed in order
    Given course "MATH-101" has 3 modules with orders 1, 2, 3
    When the course detail page loads
    Then modules are displayed in order: 1, 2, 3
    And each module shows its title, description, lesson count, and locked status

  Scenario: Locked module display
    Given module "Advanced Topics" has isLocked = true
    When the module list renders
    Then the locked module shows a lock icon or badge
    And the module title is still visible

  Scenario: Module with lessons
    Given module "Algebra Basics" has 4 lessons
    When the module card is expanded or viewed
    Then 4 lesson titles are visible within the module section
```

---

## AC-LMS-006: LmsLesson CRUD

**Requirement**: REQ-LMS-006

```gherkin
Feature: Lesson create, read, update, delete within a module

  Scenario: Teacher creates a lesson
    Given teacher "T001" owns course containing module "Algebra Basics"
    When the teacher creates a lesson with title "Introduction to Variables", content "Variables are...", contentType TEXT, order 1
    And submits the form
    Then a new LmsLesson record is created linked to "Algebra Basics"

  Scenario: Lesson with external URL
    Given the lesson form is filled with externalUrl "https://www.youtube.com/watch?v=abc123"
    When submitted
    Then the lesson record stores the URL
    And the URL passes Zod URL validation

  Scenario: Invalid external URL rejected
    Given the lesson form is filled with externalUrl "not-a-url"
    When the Zod schema validates the input
    Then validation fails with a URL format error

  Scenario: Lesson deletion
    Given lesson "Introduction to Variables" has 10 LessonProgress records
    When the lesson is deleted
    Then the lesson and all progress records are cascade deleted
```

---

## AC-LMS-007: Lesson Viewer

**Requirement**: REQ-LMS-007

```gherkin
Feature: Lesson content viewer for enrolled students

  Scenario: Student views a text lesson
    Given student "S001" is enrolled in a course containing lesson "Intro to Variables"
    And the lesson has contentType TEXT and content "Variables are symbols..."
    When the student navigates to the lesson viewer page
    Then the lesson title "Intro to Variables" is displayed
    And the content "Variables are symbols..." is rendered
    And estimated reading time is shown (if set)
    And a "Mark as Completed" button is visible

  Scenario: Student views a lesson with YouTube embed
    Given lesson "Video Lecture" has externalUrl "https://www.youtube.com/watch?v=abc123"
    When the student views the lesson
    Then a YouTube iframe embed is rendered
    And the iframe has proper sandbox attributes

  Scenario: Student views a lesson with non-YouTube URL
    Given lesson "Reading" has externalUrl "https://docs.google.com/document/d/xxx"
    When the student views the lesson
    Then the URL is rendered as a clickable link (not an iframe)

  Scenario: Unenrolled student cannot view lesson
    Given student "S002" is NOT enrolled in the course containing lesson "Intro to Variables"
    When student "S002" navigates to the lesson viewer URL
    Then access is denied (redirect or error message)

  Scenario: Breadcrumb navigation
    Given the lesson viewer page loads
    Then a breadcrumb trail shows: Course Name > Module Name > Lesson Name
    And each breadcrumb segment is clickable
```

---

## AC-LMS-008: Lesson Progress Tracking

**Requirement**: REQ-LMS-008

```gherkin
Feature: Tracking student progress through lessons

  Scenario: Student opens a lesson for the first time
    Given student "S001" has never opened lesson "Intro to Variables"
    When the student navigates to the lesson viewer
    Then a LessonProgress record is created with status IN_PROGRESS and startedAt = current time

  Scenario: Student marks a lesson as completed
    Given student "S001" has an IN_PROGRESS progress record for lesson "Intro to Variables"
    When the student clicks "Mark as Completed"
    Then the LessonProgress status is updated to COMPLETED
    And completedAt is set to the current timestamp
    And the "Mark as Completed" button changes to "Completed" (disabled)

  Scenario: Student revisits a completed lesson
    Given student "S001" has a COMPLETED progress record for lesson "Intro to Variables"
    When the student opens the lesson again
    Then the content is displayed
    And the button shows "Completed" (already marked)
    And no new progress record is created (unique constraint)

  Scenario: Progress record uniqueness
    Given student "S001" has a progress record for lesson "Intro to Variables"
    When the startLessonProgress action is called again for the same student+lesson
    Then no duplicate record is created (upsert behavior)
```

---

## AC-LMS-009: Module Progression Display

**Requirement**: REQ-LMS-009

```gherkin
Feature: Visual progress indicators for module and course completion

  Scenario: Module shows lesson completion count
    Given module "Algebra Basics" has 4 lessons
    And student "S001" has completed 2 out of 4
    When the course detail page loads for student "S001"
    Then the module shows "2/4 completed" or a progress bar at 50%

  Scenario: Lesson completion indicators
    Given module "Algebra Basics" has lessons L1 (completed), L2 (in progress), L3 (not started), L4 (not started)
    When the module lessons are displayed
    Then L1 shows a checkmark icon (completed)
    And L2 shows a half-filled icon (in progress)
    And L3 and L4 show an empty circle icon (not started)

  Scenario: Course-level progress
    Given a course has 3 modules with a total of 10 lessons
    And the student has completed 7 out of 10
    When the course detail page loads
    Then a course progress bar shows 70%

  Scenario: Teacher or admin views progress
    Given the user is logged in as a teacher or admin
    When they view a course detail page
    Then progress indicators are not shown (teacher/admin are not enrolled)
    And instead the total lesson count per module is shown
```

---

## AC-LMS-010: Enrollment Management

**Requirement**: REQ-LMS-010

```gherkin
Feature: Admin manages student enrollments

  Scenario: Admin enrolls a student in a course
    Given the user is logged in as an admin
    And student "S001" is not enrolled in course "MATH-101"
    When the admin opens the enrollment form, selects student "S001" and course "MATH-101"
    And submits the form
    Then an Enrollment record is created with ACTIVE status
    And a notification is sent to student "S001"
    And the enrollment list is revalidated

  Scenario: Duplicate enrollment prevented
    Given student "S001" is already enrolled in course "MATH-101"
    When the admin tries to enroll "S001" in "MATH-101" again
    Then the action returns an error indicating duplicate enrollment
    And no new record is created

  Scenario: Admin drops an enrollment
    Given student "S001" has an ACTIVE enrollment in course "MATH-101"
    When the admin drops the enrollment
    Then the enrollment status is updated to DROPPED
    And the student can no longer access the course content

  Scenario: Teacher cannot manage enrollments
    Given the user is logged in as a teacher
    When the enrollStudent action is called
    Then the action returns { success: false, error: true }

  Scenario: Student cannot manage enrollments
    Given the user is logged in as a student
    When the enrollStudent action is called
    Then the action returns { success: false, error: true }

  Scenario: Enrollment in archived course rejected
    Given course "ARCHIVED-101" has status ARCHIVED
    When the admin tries to enroll a student in "ARCHIVED-101"
    Then the action returns an error indicating the course is archived
```

---

## AC-LMS-011: Enrolled Courses View

**Requirement**: REQ-LMS-011

```gherkin
Feature: Student views their enrolled courses

  Scenario: Student with multiple enrollments
    Given student "S001" is enrolled in 3 courses with ACTIVE status
    When the student views their course browser
    Then 3 course cards are displayed
    And each card shows course title, teacher name, subject, and progress percentage

  Scenario: Student with no enrollments
    Given student "S002" has no ACTIVE enrollments
    When the student views their course browser
    Then an empty state message is shown: "No courses enrolled"

  Scenario: Dropped enrollment not shown
    Given student "S001" has 2 ACTIVE enrollments and 1 DROPPED enrollment
    When the student views their course browser
    Then only 2 courses are displayed (DROPPED is excluded)

  Scenario: Progress percentage accuracy
    Given student "S001" is enrolled in a course with 10 total lessons across all modules
    And the student has completed 6 lessons
    When the course card renders
    Then the progress shows 60%
```

---

## AC-LMS-012: Quiz CRUD

**Requirement**: REQ-LMS-012

```gherkin
Feature: Quiz create, read, update, delete

  Scenario: Teacher creates a quiz for a lesson in their course
    Given teacher "T001" owns a course with lesson "Intro to Variables"
    When the teacher creates a quiz with title "Variables Quiz", timeLimit 15, maxAttempts 3, passScore 70, scoringPolicy BEST
    And submits the form
    Then a Quiz record is created linked to "Intro to Variables"

  Scenario: Quiz with randomization options
    Given a teacher creates a quiz with randomizeQuestions true and randomizeOptions true
    When saved
    Then the quiz record has both randomization flags set to true

  Scenario: Teacher cannot create quiz in another teacher's course
    Given teacher "T001" does not own the course containing lesson "Poetry Analysis"
    When the createQuiz action is called by teacher "T001" for that lesson
    Then the action returns { success: false, error: true }

  Scenario: Quiz deletion cascades
    Given quiz "Variables Quiz" has 5 questions and 10 attempts
    When the quiz is deleted
    Then all questions, answer options, attempts, and responses are cascade deleted
```

---

## AC-LMS-013: Question Management

**Requirement**: REQ-LMS-013

```gherkin
Feature: Question creation with answer options

  Scenario: Create MULTIPLE_CHOICE question
    Given a quiz exists
    When the teacher creates a question with type MULTIPLE_CHOICE, text "What is 2+2?", and 4 answer options where option "4" is marked correct
    Then a Question record is created with type MULTIPLE_CHOICE
    And 4 AnswerOption records are created
    And exactly one option has isCorrect = true

  Scenario: Create TRUE_FALSE question
    Given a quiz exists
    When the teacher creates a question with type TRUE_FALSE, text "The earth is flat"
    Then a Question record is created with type TRUE_FALSE
    And 2 AnswerOption records are created: "True" (isCorrect: false) and "False" (isCorrect: true)

  Scenario: Create FILL_IN_BLANK question
    Given a quiz exists
    When the teacher creates a question with type FILL_IN_BLANK, text "The capital of France is ___"
    Then a Question record is created with type FILL_IN_BLANK
    And an AnswerOption record is created with text "Paris" and isCorrect true

  Scenario: Question with explanation
    Given a teacher creates a question with explanation "This is because..."
    When the question is saved
    Then the explanation field is stored and available for display in quiz results

  Scenario: Question must have at least 2 options
    Given a question form is submitted with only 1 answer option
    When the Zod schema validates
    Then validation fails requiring minimum 2 options
```

---

## AC-LMS-014: Question Bank

**Requirement**: REQ-LMS-014

```gherkin
Feature: Question bank management

  Scenario: Teacher creates a question bank
    Given teacher "T001" teaches Mathematics
    When the teacher creates a question bank named "Algebra Question Pool" for Mathematics
    Then a QuestionBank record is created linked to the teacher and subject

  Scenario: Question belongs to both bank and quiz
    Given a question exists in question bank "Algebra Question Pool"
    When the teacher adds the question to quiz "Variables Quiz"
    Then the question has both quizId and questionBankId set
```

---

## AC-LMS-015: Quiz Taking

**Requirement**: REQ-LMS-015

```gherkin
Feature: Student takes a quiz with auto-grading

  Scenario: Student starts a quiz attempt
    Given student "S001" is enrolled in the course containing quiz "Variables Quiz"
    And the student has not reached maxAttempts
    When the student clicks "Start Quiz"
    Then a QuizAttempt record is created with attemptNumber incremented
    And the quiz questions are displayed

  Scenario: Answering a MULTIPLE_CHOICE question
    Given the student is taking a quiz with a MULTIPLE_CHOICE question "What is 2+2?" with options A: 3, B: 4, C: 5, D: 6
    When the student selects option B: 4
    Then the selection is recorded in the quiz state

  Scenario: Answering a TRUE_FALSE question
    Given the student is taking a quiz with a TRUE_FALSE question
    When the student selects "True"
    Then the selection is recorded

  Scenario: Answering a FILL_IN_BLANK question
    Given the student is taking a quiz with a FILL_IN_BLANK question "Capital of France is ___"
    When the student types "Paris"
    Then the text response is recorded

  Scenario: Submit quiz and auto-grade
    Given the student has answered all questions
    When the student clicks "Submit Quiz"
    Then the submitQuizAttempt action processes all responses
    And each response is graded:
      - MULTIPLE_CHOICE: selectedOptionId compared to correct option
      - TRUE_FALSE: selectedOptionId compared to correct option
      - FILL_IN_BLANK: textResponse compared case-insensitively to correct option text
    And QuestionResponse records are created for each question
    And the QuizAttempt is updated with score, maxScore, percentage, passed status

  Scenario: FILL_IN_BLANK case-insensitive grading
    Given the correct answer is "Paris"
    When the student types "paris" (lowercase)
    Then the answer is graded as correct

  Scenario: FILL_IN_BLANK with whitespace
    Given the correct answer is "Paris"
    When the student types "  Paris  " (with leading/trailing spaces)
    Then the answer is graded as correct (trimmed comparison)

  Scenario: Unanswered question scores zero
    Given a quiz has 5 questions and the student answers only 3
    When the quiz is submitted
    Then the 2 unanswered questions receive 0 points
    And the total score reflects only the 3 answered questions

  Scenario: Randomized questions
    Given quiz "Random Quiz" has randomizeQuestions = true
    When two different students start the quiz
    Then question order may differ between attempts
```

---

## AC-LMS-016: Attempt Limits

**Requirement**: REQ-LMS-016

```gherkin
Feature: Quiz attempt limits enforcement

  Scenario: Student has attempts remaining
    Given quiz "Variables Quiz" has maxAttempts = 3
    And student "S001" has completed 2 attempts
    When the student navigates to the quiz page
    Then the "Start Quiz" button is enabled
    And a message shows "2 of 3 attempts used"

  Scenario: Student has reached max attempts
    Given quiz "Variables Quiz" has maxAttempts = 3
    And student "S001" has completed 3 attempts
    When the student navigates to the quiz page
    Then the "Start Quiz" button is disabled
    And a message shows "Maximum attempts reached"
    And the student's score is displayed based on scoring policy

  Scenario: BEST scoring policy display
    Given quiz scoring policy is BEST
    And student has attempts with scores 70, 85, 60
    When the quiz page shows the student's score
    Then it displays 85 (the highest score)

  Scenario: LATEST scoring policy display
    Given quiz scoring policy is LATEST
    And student has attempts with scores 70, 85, 60 (in chronological order)
    When the quiz page shows the student's score
    Then it displays 60 (the most recent score)

  Scenario: AVERAGE scoring policy display
    Given quiz scoring policy is AVERAGE
    And student has attempts with scores 70, 85, 60
    When the quiz page shows the student's score
    Then it displays 71.7 (average of all attempts, rounded to 1 decimal)
```

---

## AC-LMS-017: Quiz Results

**Requirement**: REQ-LMS-017

```gherkin
Feature: Quiz results display after submission

  Scenario: Student views results after submission
    Given student "S001" has just submitted a quiz
    When the results page loads
    Then the page shows total score (e.g., "8/10")
    And percentage (e.g., "80%")
    And pass/fail status (e.g., "Passed" with green or "Failed" with red)
    And per-question breakdown showing:
      - Question text
      - Student's answer
      - Correct answer
      - Points earned
      - Explanation (if available)

  Scenario: Results for incorrect answers show correct answer
    Given the student answered "3" for "What is 2+2?" (correct answer: "4")
    When the results page renders
    Then the question shows the student's answer "3" highlighted as incorrect
    And the correct answer "4" is shown

  Scenario: Results for unanswered questions
    Given the student left question 5 unanswered
    When the results page renders
    Then question 5 shows "No answer" and 0 points earned
```

---

## AC-LMS-018: Teacher Quiz Results View

**Requirement**: REQ-LMS-018

```gherkin
Feature: Teacher views aggregate quiz results

  Scenario: Teacher views quiz summary for their course
    Given teacher "T001" owns a course with quiz "Variables Quiz"
    And 20 students have taken the quiz with various scores
    When the teacher navigates to the quiz results page
    Then the page shows:
      - Average score across all attempts
      - Pass rate (percentage of attempts that passed)
      - Total number of attempts
      - Per-student breakdown with student name and their score (based on scoring policy)

  Scenario: Teacher views results for quiz with no attempts
    Given quiz "New Quiz" has 0 attempts
    When the teacher views the results
    Then the page shows "No attempts yet"
```

---

## AC-LMS-019: Performance Requirements

**Requirement**: REQ-LMS-019

```gherkin
Feature: Performance targets

  Scenario: Course list page load time
    Given up to 100 courses exist in the database
    When the course list page loads
    Then the page renders within 2 seconds

  Scenario: Quiz auto-grading speed
    Given a quiz with 20 questions is submitted
    When the auto-grading runs
    Then grading completes and results are available within 1 second

  Scenario: Lesson content page load
    Given a lesson with 5000 characters of content
    When the lesson viewer page loads
    Then the page renders within 1.5 seconds
```

---

## AC-LMS-020: Security - Role-Based Access

**Requirement**: REQ-LMS-020

```gherkin
Feature: Role-based access control at route and action levels

  Scenario: Route access for /list/courses
    Given the routeAccessMap includes "/list/courses": ["admin", "teacher"]
    When a student navigates to /list/courses
    Then the middleware redirects the student (access denied)

  Scenario: Server Action auth check
    Given a createCourse Server Action is called
    When the caller does not have admin or teacher role
    Then the action returns { success: false, error: true }

  Scenario: Teacher scoped to own courses
    Given teacher "T001" calls updateCourse for a course owned by "T002"
    When the action verifies ownership
    Then the action returns { success: false, error: true }

  Scenario: Student scoped to enrolled courses
    Given student "S001" has ACTIVE enrollment only in "MATH-101"
    When student "S001" tries to access lesson content in "ENG-201"
    Then access is denied
```

---

## AC-LMS-021: Data Isolation

**Requirement**: REQ-LMS-021

```gherkin
Feature: Student data isolation

  Scenario: Student cannot see other students' quiz attempts
    Given student "S001" and "S002" have both taken quiz "Variables Quiz"
    When student "S001" views quiz results
    Then only "S001"'s own attempts are visible
    And "S002"'s attempts are not visible

  Scenario: Student cannot see other students' lesson progress
    Given student "S001" views a course detail page
    When progress indicators render
    Then only "S001"'s own progress is shown

  Scenario: Student cannot view enrollment list
    Given the user is logged in as a student
    When navigating to /list/enrollments
    Then access is denied by middleware
```

---

## AC-LMS-022: Pattern Consistency

**Requirement**: REQ-LMS-022

```gherkin
Feature: All new code follows existing patterns

  Scenario: Server Action return type
    Given any new Server Action is implemented
    When inspecting the return statements
    Then all return values match { success: boolean; error: boolean; message?: string }

  Scenario: Form component pattern
    Given any new form component in src/components/forms/
    When inspecting the source code
    Then the component uses "use client" directive
    And uses React Hook Form with zodResolver
    And uses useActionState for action handling
    And uses InputField component for text inputs
    And follows the same structure as existing forms (e.g., StudentForm.tsx)

  Scenario: List page pattern
    Given any new list page
    When inspecting the source code
    Then the page is an async Server Component
    And uses ITEM_PER_PAGE for pagination
    And reads URL search params for search and filter
    And uses Promise.all for parallel data fetching
    And uses the Table component for data display
```

---

## Edge Case Scenarios

```gherkin
Feature: Edge cases for LMS Phase 1

  Scenario: Course with no modules
    Given course "EMPTY-101" has no modules
    When the course detail page loads
    Then an empty state message "No modules yet" is displayed
    And the "Add Module" button is available for authorized users

  Scenario: Module with no lessons
    Given module "Empty Module" has no lessons
    When the module section renders in the course detail page
    Then the module shows "No lessons yet"
    And the "Add Lesson" button is available

  Scenario: Quiz with no questions
    Given quiz "Empty Quiz" has no questions
    When a student tries to start the quiz
    Then the system shows a message "This quiz has no questions yet"
    And the quiz cannot be started

  Scenario: Student unenrolled mid-progress
    Given student "S001" has IN_PROGRESS lessons and quiz attempts in course "MATH-101"
    When the admin drops "S001"'s enrollment
    Then the enrollment status changes to DROPPED
    And the student can no longer access the course content
    And existing progress and attempt records are preserved (not deleted)

  Scenario: Very long lesson content
    Given a lesson has 50,000 characters of content
    When the lesson viewer renders
    Then the content renders without truncation
    And the page remains scrollable

  Scenario: Quiz timer reaches zero
    Given a student is taking a timed quiz with 5 minutes
    When the timer reaches 0:00
    Then the quiz is auto-submitted with current answers
    And unanswered questions receive 0 points

  Scenario: Concurrent quiz submissions
    Given a student submits a quiz
    And the submit button is clicked a second time before the action completes
    Then only one submission is processed
    And the second click is ignored (button disabled during submission)

  Scenario: Course code with special characters
    Given the course form is submitted with code "MATH@101"
    When the Zod schema validates
    Then validation fails because "@" is not in the allowed pattern [A-Z0-9-]

  Scenario: Enrollment in non-existent course
    Given courseId 999 does not exist
    When the enrollStudent action is called with courseId 999
    Then the action returns { success: false, error: true }

  Scenario: Question with all options marked incorrect
    Given a MULTIPLE_CHOICE question has 4 options, all with isCorrect = false
    When the question form is submitted
    Then validation warns that at least one correct answer is required
```

---

## Quality Gates

### Definition of Done

- [ ] 11 Prisma models and 6 enums created with proper relations and constraints
- [ ] Day enum extended with SATURDAY and SUNDAY
- [ ] Migration applied successfully without data loss
- [ ] 22 Server Actions implemented following existing pattern
- [ ] All Server Actions have auth() checks with role-based access
- [ ] 7 Zod schemas added to formValidationSchemas.ts
- [ ] 7 form components created following React Hook Form + Zod pattern
- [ ] FormContainer updated to handle all new table types
- [ ] routeAccessMap updated with /list/courses and /list/enrollments
- [ ] Course list page with search, filter, pagination
- [ ] Course detail page with module list and management
- [ ] Lesson viewer with content rendering and external embeds
- [ ] Lesson progress tracking (start, complete) with UI indicators
- [ ] Student enrolled courses view with progress percentage
- [ ] Enrollment list page for admin
- [ ] Quiz creation UI with question type support (MC, TF, FITB)
- [ ] Question creation with dynamic answer options
- [ ] Quiz taking interface with timer and navigation
- [ ] Auto-grading engine for all three question types
- [ ] Quiz results view for students (per-question breakdown)
- [ ] Teacher quiz results summary (aggregate view)
- [ ] Attempt tracking with max attempts and scoring policies (BEST, LATEST, AVERAGE)
- [ ] Notification sent on enrollment
- [ ] Sidebar menu updated with Course and Enrollment links
- [ ] No TypeScript compilation errors (`npx tsc --noEmit`)
- [ ] Application builds successfully (`npm run build`)
- [ ] All empty states handled gracefully
- [ ] Role-based access verified for all routes and actions

### Verification Methods

| Method | Scope | Pass Criteria |
| ------ | ----- | ------------- |
| Manual browser testing | All new pages and forms | CRUD operations work, navigation correct, data displays properly |
| TypeScript compilation | Full codebase | Zero errors |
| Build verification | Full application | `npm run build` succeeds |
| Role isolation testing | All new routes and actions | Each role only accesses authorized resources |
| Enrollment flow testing | Enrollment list, student course browser | Admin can enroll/drop, student sees only active enrollments |
| Quiz flow testing | Quiz creation, taking, results | Full quiz lifecycle from creation to grading to results |
| Auto-grading accuracy | Quiz submission | MC, TF, FITB all grade correctly including edge cases |
| Progress tracking | Lesson viewer, course detail | Progress updates correctly on lesson completion |
| Schema audit | schema.prisma | 11 new models, 6 enums, 3 model relation updates |
| Pattern compliance | All new files | Server Action pattern, form pattern, list page pattern |
| Empty state verification | All new pages | Appropriate messages when no data exists |

### Smoke Test Checklist

- [ ] Navigate to /list/courses as admin - page loads with table
- [ ] Create a course via form modal
- [ ] Navigate to course detail page
- [ ] Create a module within the course
- [ ] Create a lesson within the module
- [ ] Enroll a student in the course via /list/enrollments
- [ ] Switch to student role - see enrolled course in course browser
- [ ] Navigate to lesson viewer - content displays
- [ ] Mark lesson as completed - progress indicator updates
- [ ] Create a quiz with 3 questions (one MC, one TF, one FITB)
- [ ] Switch to student - take the quiz
- [ ] Submit the quiz - results display with correct grading
- [ ] Attempt quiz again - attempt counter increments
- [ ] Reach max attempts - start button disabled
- [ ] Switch to teacher - view quiz results summary
- [ ] Delete the course - cascade deletes modules, lessons, quizzes
