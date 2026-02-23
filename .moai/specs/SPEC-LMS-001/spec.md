# SPEC-LMS-001: LMS Phase 1 - Course Structure, Content Delivery & Basic Quizzes

## Metadata

| Field       | Value                                                              |
| ----------- | ------------------------------------------------------------------ |
| SPEC ID     | SPEC-LMS-001                                                       |
| Title       | LMS Phase 1 - Course Structure, Content Delivery & Basic Quizzes   |
| Version     | 1.0.0                                                              |
| Created     | 2026-02-21                                                         |
| Status      | Completed                                                          |
| Priority    | High                                                               |
| Lifecycle   | spec-first                                                         |
| Related     | SPEC-GRADE-001 (grade reports), SPEC-DASH-001 (dashboard analytics)|

---

## 1. Problem Statement

Hua Readwise is a school management system serving a bi-weekly school that operates on Saturdays and Sundays only. A 12-day gap exists between sessions, creating measurable knowledge retention challenges. Students lose momentum between sessions. Teachers must re-establish context at the start of each Saturday session. Parents have no visibility into what their children are learning between sessions.

The existing system handles scheduling, attendance, grades, and announcements but provides no mechanism for asynchronous learning between school days. There is no way for teachers to publish course materials, no content delivery system for students to review lessons at home, and no assessment tools for knowledge checks between sessions.

This SPEC introduces the foundational LMS layer: a course and module structure for organizing content, a lesson content delivery system with progress tracking, student enrollment management, and a basic quiz engine with auto-grading. Together, these features bridge the 12-day gap by enabling digital engagement between physical school sessions.

---

## 2. Environment

### 2.1 Technology Stack

- **Framework**: Next.js 16 (App Router, Server Components, Server Actions)
- **Language**: TypeScript 5 (strict mode)
- **UI Library**: React 19 (Server Components, useActionState, use hook)
- **ORM**: Prisma 5.19+ with PostgreSQL
- **Authentication**: Clerk 6.38+ (role-based: admin, teacher, student, parent)
- **Styling**: Tailwind CSS v4 (CSS-first configuration in globals.css)
- **Charts**: Recharts 3.7+ (for potential quiz analytics)
- **Forms**: React Hook Form 7.52+ with Zod 3.23+ validation
- **Notifications**: React Toastify 10+ for user feedback

### 2.2 Existing Database Models (Relevant)

- **Student**: id (String, Clerk ID), name, surname, parentId -> Parent, classId -> Class, gradeId -> Grade. Has results[], attendances[].
- **Teacher**: id (String, Clerk ID), name, surname, subjects[], lessons[], classes[].
- **Subject**: id (Int), name (unique), teachers[], lessons[].
- **Parent**: id (String, Clerk ID), students[].
- **Admin**: id (String, Clerk ID), username.
- **Notification**: id (Int), type (enum), message, read, createdAt, userId.

### 2.3 New Database Models

The following Prisma models will be added to `prisma/schema.prisma`:

**Course**: id (Int, autoincrement), title (String), description (String?), code (String, unique), status (CourseStatus enum: DRAFT/ACTIVE/ARCHIVED, default DRAFT), createdAt, updatedAt, teacherId -> Teacher, subjectId -> Subject, modules[], enrollments[].

**Module**: id (Int, autoincrement), title (String), description (String?), order (Int), isLocked (Boolean, default false), courseId -> Course (onDelete: Cascade), lessons[].

**LmsLesson**: id (Int, autoincrement), title (String), content (String, rich text), contentType (ContentType enum: TEXT/VIDEO/LINK/MIXED, default TEXT), externalUrl (String?, YouTube/Drive links), order (Int), estimatedMinutes (Int?), createdAt, updatedAt, moduleId -> Module (onDelete: Cascade), quizzes[], progress[].

**LessonProgress**: id (Int, autoincrement), status (ProgressStatus enum: NOT_STARTED/IN_PROGRESS/COMPLETED, default NOT_STARTED), startedAt (DateTime?), completedAt (DateTime?), timeSpentSeconds (Int, default 0), studentId -> Student, lessonId -> LmsLesson (onDelete: Cascade). Unique constraint on [studentId, lessonId].

**Enrollment**: id (Int, autoincrement), enrolledAt (DateTime, default now), status (EnrollmentStatus enum: ACTIVE/COMPLETED/DROPPED, default ACTIVE), studentId -> Student, courseId -> Course (onDelete: Cascade). Unique constraint on [studentId, courseId].

**Quiz**: id (Int, autoincrement), title (String), description (String?), timeLimit (Int?, minutes), maxAttempts (Int, default 1), passScore (Int, default 70), scoringPolicy (ScoringPolicy enum: BEST/LATEST/AVERAGE, default BEST), randomizeQuestions (Boolean, default false), randomizeOptions (Boolean, default false), createdAt, lessonId -> LmsLesson (onDelete: Cascade), questions[], attempts[].

**Question**: id (Int, autoincrement), text (String), type (QuestionType enum: MULTIPLE_CHOICE/TRUE_FALSE/FILL_IN_BLANK), explanation (String?), points (Int, default 1), order (Int), quizId -> Quiz? (onDelete: Cascade), questionBankId -> QuestionBank?, options[], responses[].

**QuestionBank**: id (Int, autoincrement), name (String), description (String?), subjectId -> Subject, teacherId -> Teacher, createdAt, questions[].

**AnswerOption**: id (Int, autoincrement), text (String), isCorrect (Boolean), order (Int), questionId -> Question (onDelete: Cascade).

**QuizAttempt**: id (Int, autoincrement), attemptNumber (Int), startedAt (DateTime, default now), submittedAt (DateTime?), score (Int?), maxScore (Int?), percentage (Float?), passed (Boolean?), studentId -> Student, quizId -> Quiz (onDelete: Cascade), responses[].

**QuestionResponse**: id (Int, autoincrement), selectedOptionId (Int?), textResponse (String?), isCorrect (Boolean?), pointsEarned (Int, default 0), timeTakenSeconds (Int?), questionId -> Question, attemptId -> QuizAttempt (onDelete: Cascade).

### 2.4 New Enums

- **CourseStatus**: DRAFT, ACTIVE, ARCHIVED
- **ContentType**: TEXT, VIDEO, LINK, MIXED
- **ProgressStatus**: NOT_STARTED, IN_PROGRESS, COMPLETED
- **EnrollmentStatus**: ACTIVE, COMPLETED, DROPPED
- **QuestionType**: MULTIPLE_CHOICE, TRUE_FALSE, FILL_IN_BLANK
- **ScoringPolicy**: BEST, LATEST, AVERAGE

### 2.5 Existing Model Relations to Add

- **Student**: Add `enrollments Enrollment[]`, `lessonProgress LessonProgress[]`, `quizAttempts QuizAttempt[]`
- **Teacher**: Add `courses Course[]`, `questionBanks QuestionBank[]`
- **Subject**: Add `courses Course[]`, `questionBanks QuestionBank[]`

### 2.6 Existing Patterns (Must Follow)

| Pattern | Description | Reference |
| ------- | ----------- | --------- |
| Server Action return type | `{ success: boolean; error: boolean; message?: string }` | `src/lib/actions.ts` |
| Auth check | `const { userId, sessionClaims } = await auth(); const role = (sessionClaims?.metadata as { role?: string })?.role;` | `src/lib/actions.ts` |
| Form components | React Hook Form + Zod + useActionState (React 19), Client Components in `src/components/forms/` | `src/components/forms/*.tsx` |
| List pages | Async Server Components, ITEM_PER_PAGE pagination, search/filter via URL params, role-based rendering | `src/app/(dashboard)/list/*/page.tsx` |
| FormContainer | Server Component resolving form type + fetching related data | `src/components/FormContainer.tsx` |
| FormModal | Client Component modal wrapper for create/update/delete | `src/components/FormModal.tsx` |
| Route access | `routeAccessMap` in `src/lib/settings.ts` | `src/lib/settings.ts` |
| Notification creation | `src/lib/notificationActions.ts` | Enrollment events |
| Cache invalidation | `revalidatePath()` after mutations | All Server Actions |
| Day enum | Existing Day enum only has MONDAY-FRIDAY | `prisma/schema.prisma` |

---

## 3. Assumptions

- **ASM-LMS-001**: The Day enum currently includes only MONDAY through FRIDAY. This SPEC does not modify the Day enum. SATURDAY and SUNDAY values should be added to support the bi-weekly schedule if not already present.
- **ASM-LMS-002**: Course codes are unique short identifiers entered by the course creator (e.g., "MATH-101", "ENG-201"). Validation enforces uppercase alphanumeric with hyphens.
- **ASM-LMS-003**: A course belongs to exactly one teacher and one subject. Multi-teacher courses are out of scope for Phase 1.
- **ASM-LMS-004**: Student enrollment is managed exclusively by admins in Phase 1. Self-enrollment is deferred to a future phase.
- **ASM-LMS-005**: Lesson content is stored as a rich text string in the database. No file upload to the database; external content is referenced via URL (YouTube embeds, Google Drive links).
- **ASM-LMS-006**: The "LmsLesson" model name avoids conflict with the existing "Lesson" model (which represents scheduled class periods).
- **ASM-LMS-007**: Quiz auto-grading applies only to MULTIPLE_CHOICE and TRUE_FALSE question types. FILL_IN_BLANK questions use exact string matching (case-insensitive, trimmed).
- **ASM-LMS-008**: The existing `InputField` component and form patterns are sufficient for all new form UIs. No new form primitives are needed.
- **ASM-LMS-009**: Module ordering and lesson ordering are integer-based. Drag-and-drop reordering is deferred to a future phase; order is set manually in forms.
- **ASM-LMS-010**: Quiz time limits are enforced client-side only in Phase 1. Server-side enforcement is deferred.
- **ASM-LMS-011**: The Notification model's userId field stores Clerk user IDs. Enrollment notifications can be sent using the existing notification system.

---

## 4. Requirements

### 4.1 Course Management

**REQ-LMS-001** (Ubiquitous - Course CRUD):
The system shall provide full create, read, update, and delete operations for Course records. Each course shall have a unique code, a title, an optional description, a status (DRAFT/ACTIVE/ARCHIVED), and shall be linked to exactly one teacher and one subject.

- Admin can create, update, and delete any course
- Teacher can create courses and update/delete only courses they own
- Students and parents cannot create, update, or delete courses

**REQ-LMS-002** (Event-Driven - Course List Page):
**When** a user navigates to `/list/courses`, **then** the system shall display a paginated list of courses with search by title/code, filter by teacher, subject, and status. Admin sees all courses. Teacher sees only their own courses.

- Pagination: ITEM_PER_PAGE (10)
- Search: by title or code (case-insensitive partial match)
- Filters: teacher (dropdown), subject (dropdown), status (dropdown)
- Columns: Code, Title, Teacher, Subject, Status, Modules count, Enrollments count

**REQ-LMS-003** (State-Driven - Course Status Rules):
**While** a course status is DRAFT, only the owning teacher and admin can view its content.
**While** a course status is ACTIVE, enrolled students can access its content.
**While** a course status is ARCHIVED, the course is read-only for all users and no new enrollments are accepted.

### 4.2 Module Management

**REQ-LMS-004** (Event-Driven - Module CRUD):
**When** a user with appropriate permissions accesses a course, **then** the system shall allow creating, reading, updating, and deleting modules within that course. Each module has a title, optional description, display order, and locked/unlocked state.

- Admin can manage modules in any course
- Teacher can manage modules only in courses they own
- Module deletion cascades to all lessons within the module

**REQ-LMS-005** (Event-Driven - Module Management UI):
**When** a user views a course detail or management page, **then** the system shall display all modules in order with their lesson count, locked status, and options to create/edit/delete modules.

### 4.3 Content Delivery

**REQ-LMS-006** (Event-Driven - LmsLesson CRUD):
**When** a user with appropriate permissions accesses a module, **then** the system shall allow creating, reading, updating, and deleting lessons within that module. Each lesson has a title, rich text content, content type, optional external URL, display order, and optional estimated reading time.

- Admin can manage lessons in any course
- Teacher can manage lessons only in courses they own

**REQ-LMS-007** (Event-Driven - Lesson Viewer):
**When** an enrolled student navigates to a lesson, **then** the system shall display the lesson content (rich text) and any external links (rendered as embedded iframes for YouTube or clickable links for other URLs). The viewer shall show the lesson title, estimated reading time, and a "Mark as Completed" button.

**REQ-LMS-008** (Event-Driven - Lesson Progress Tracking):
**When** a student marks a lesson as completed, **then** the system shall create or update a LessonProgress record setting the status to COMPLETED and recording the completedAt timestamp. **When** a student opens a lesson for the first time, **then** the system shall create a LessonProgress record with status IN_PROGRESS and record the startedAt timestamp.

**REQ-LMS-009** (State-Driven - Module Progression Display):
**While** viewing a course detail page, the system shall display per-module progress for enrolled students showing the count of completed lessons vs total lessons. Each lesson shall show a completion indicator (checkmark for completed, empty circle for not started, half-circle for in progress).

### 4.4 Student Enrollment

**REQ-LMS-010** (Event-Driven - Enrollment Management):
**When** an admin enrolls a student in a course, **then** the system shall create an Enrollment record with ACTIVE status and send a notification to the student. **When** an admin removes an enrollment, **then** the status shall be set to DROPPED.

- Only admin can manage enrollments in Phase 1
- Duplicate enrollment (same student + course) is prevented by unique constraint
- Enrollment creation triggers a notification to the student

**REQ-LMS-011** (Event-Driven - Enrolled Courses View):
**When** a student navigates to their course browser page, **then** the system shall display all courses in which they have an ACTIVE enrollment, showing course title, teacher name, subject, and overall progress percentage.

### 4.5 Quiz Engine

**REQ-LMS-012** (Event-Driven - Quiz CRUD):
**When** a teacher or admin creates a quiz, **then** the system shall associate it with a specific LmsLesson and allow configuration of: title, description, time limit, max attempts, pass score, scoring policy (BEST/LATEST/AVERAGE), and randomization options.

- Admin can manage quizzes in any course
- Teacher can manage quizzes only in courses they own

**REQ-LMS-013** (Event-Driven - Question Management):
**When** a user creates questions for a quiz, **then** the system shall support three question types: MULTIPLE_CHOICE (multiple answer options, one or more correct), TRUE_FALSE (two options: True/False), and FILL_IN_BLANK (text input with exact match). Each question has text, type, optional explanation, point value, display order, and answer options.

**REQ-LMS-014** (Event-Driven - Question Bank):
**When** a teacher creates a question bank, **then** the system shall store questions grouped by subject. Questions in a bank can be added to quizzes. A question may belong to a quiz, a question bank, or both.

**REQ-LMS-015** (Event-Driven - Quiz Taking):
**When** an enrolled student starts a quiz, **then** the system shall create a QuizAttempt record. The student sees questions (optionally randomized) and submits answers. Upon submission, the system auto-grades objective questions:
- MULTIPLE_CHOICE: Compare selectedOptionId against the correct AnswerOption
- TRUE_FALSE: Compare selectedOptionId against the correct AnswerOption
- FILL_IN_BLANK: Compare textResponse (trimmed, case-insensitive) against the correct AnswerOption text

**REQ-LMS-016** (State-Driven - Attempt Limits):
**While** a student has reached the maxAttempts for a quiz, the system shall prevent the student from starting a new attempt. The quiz interface shall display a message indicating maximum attempts reached and show the student's best/latest/average score based on the scoring policy.

**REQ-LMS-017** (Event-Driven - Quiz Results):
**When** a quiz attempt is submitted, **then** the system shall display the results showing: total score, max possible score, percentage, pass/fail status, and per-question breakdown (selected answer, correct answer, points earned, explanation if available).

**REQ-LMS-018** (Event-Driven - Teacher Quiz Results View):
**When** a teacher views quiz results for a quiz in their course, **then** the system shall display a summary showing: average score across all attempts, pass rate, number of attempts, and a per-student breakdown with their best/latest score.

### 4.6 Non-Functional Requirements

**REQ-LMS-019** (Ubiquitous - Performance):
The system shall load course list pages within 2 seconds for datasets up to 100 courses. Quiz submission and auto-grading shall complete within 1 second. Lesson content pages shall render within 1.5 seconds.

**REQ-LMS-020** (Ubiquitous - Security):
The system shall enforce role-based access control at both the route level (via routeAccessMap) and the Server Action level (via auth() checks). Students shall only access courses in which they are enrolled. Teachers shall only manage courses they own. All form inputs shall be validated with Zod schemas on both client and server.

**REQ-LMS-021** (Unwanted - Data Isolation):
The system shall not allow students to view other students' quiz attempts, lesson progress, or enrollment records. The system shall not allow teachers to access courses they do not own (except for admin role).

**REQ-LMS-022** (Ubiquitous - Consistent Patterns):
All new Server Actions, form components, list pages, and validation schemas shall follow the existing patterns documented in Section 2.6. No new architectural patterns shall be introduced.

---

## 5. Specifications

### 5.1 New Prisma Models

11 new models: Course, Module, LmsLesson, LessonProgress, Enrollment, Quiz, Question, QuestionBank, AnswerOption, QuizAttempt, QuestionResponse.

6 new enums: CourseStatus, ContentType, ProgressStatus, EnrollmentStatus, QuestionType, ScoringPolicy.

3 existing models modified: Student (3 new relation fields), Teacher (2 new relation fields), Subject (2 new relation fields).

### 5.2 New Routes

| Route | Purpose | Access |
| ----- | ------- | ------ |
| `/list/courses` | Course list with search/filter/pagination | admin, teacher |
| `/list/courses/[id]` | Course detail with modules and lessons | admin, teacher (own), student (enrolled) |
| `/list/courses/[id]/quiz/[quizId]` | Quiz taking interface | student (enrolled) |
| `/list/courses/[id]/quiz/[quizId]/results` | Quiz results view | student (own attempts), teacher (own course), admin |
| `/list/courses/[id]/lesson/[lessonId]` | Lesson viewer | student (enrolled), teacher (own), admin |
| `/list/enrollments` | Enrollment management | admin |

### 5.3 Route Access Map Additions

```typescript
// Add to routeAccessMap in src/lib/settings.ts
"/list/courses": ["admin", "teacher"],
"/list/enrollments": ["admin"],
```

### 5.4 New Server Actions

| Action | File | REQ |
| ------ | ---- | --- |
| `createCourse` | `src/lib/actions.ts` | REQ-LMS-001 |
| `updateCourse` | `src/lib/actions.ts` | REQ-LMS-001 |
| `deleteCourse` | `src/lib/actions.ts` | REQ-LMS-001 |
| `createModule` | `src/lib/actions.ts` | REQ-LMS-004 |
| `updateModule` | `src/lib/actions.ts` | REQ-LMS-004 |
| `deleteModule` | `src/lib/actions.ts` | REQ-LMS-004 |
| `createLmsLesson` | `src/lib/actions.ts` | REQ-LMS-006 |
| `updateLmsLesson` | `src/lib/actions.ts` | REQ-LMS-006 |
| `deleteLmsLesson` | `src/lib/actions.ts` | REQ-LMS-006 |
| `enrollStudent` | `src/lib/actions.ts` | REQ-LMS-010 |
| `dropEnrollment` | `src/lib/actions.ts` | REQ-LMS-010 |
| `markLessonComplete` | `src/lib/actions.ts` | REQ-LMS-008 |
| `startLessonProgress` | `src/lib/actions.ts` | REQ-LMS-008 |
| `createQuiz` | `src/lib/actions.ts` | REQ-LMS-012 |
| `updateQuiz` | `src/lib/actions.ts` | REQ-LMS-012 |
| `deleteQuiz` | `src/lib/actions.ts` | REQ-LMS-012 |
| `createQuestion` | `src/lib/actions.ts` | REQ-LMS-013 |
| `updateQuestion` | `src/lib/actions.ts` | REQ-LMS-013 |
| `deleteQuestion` | `src/lib/actions.ts` | REQ-LMS-013 |
| `createQuestionBank` | `src/lib/actions.ts` | REQ-LMS-014 |
| `startQuizAttempt` | `src/lib/actions.ts` | REQ-LMS-015 |
| `submitQuizAttempt` | `src/lib/actions.ts` | REQ-LMS-015, REQ-LMS-017 |

### 5.5 New Form Components

| Component | Location | Purpose |
| --------- | -------- | ------- |
| `CourseForm.tsx` | `src/components/forms/` | Create/update course with title, code, description, status, teacher, subject |
| `ModuleForm.tsx` | `src/components/forms/` | Create/update module with title, description, order, locked state |
| `LmsLessonForm.tsx` | `src/components/forms/` | Create/update lesson with title, content, type, URL, order, estimated time |
| `EnrollmentForm.tsx` | `src/components/forms/` | Enroll student into a course (student select, course select) |
| `QuizForm.tsx` | `src/components/forms/` | Create/update quiz with title, time limit, attempts, pass score, policy |
| `QuestionForm.tsx` | `src/components/forms/` | Create/update question with type, text, explanation, points, answer options |
| `QuestionBankForm.tsx` | `src/components/forms/` | Create/update question bank with name, description, subject |

### 5.6 New Page Components

| Component | Location | Purpose |
| --------- | -------- | ------- |
| Course List Page | `src/app/(dashboard)/list/courses/page.tsx` | Paginated course list |
| Course Detail Page | `src/app/(dashboard)/list/courses/[id]/page.tsx` | Course overview with modules and lessons |
| Lesson Viewer Page | `src/app/(dashboard)/list/courses/[id]/lesson/[lessonId]/page.tsx` | Lesson content viewer with progress |
| Quiz Taking Page | `src/app/(dashboard)/list/courses/[id]/quiz/[quizId]/page.tsx` | Quiz interface for students |
| Quiz Results Page | `src/app/(dashboard)/list/courses/[id]/quiz/[quizId]/results/page.tsx` | Quiz results display |
| Enrollment List Page | `src/app/(dashboard)/list/enrollments/page.tsx` | Admin enrollment management |

### 5.7 New Widget Components

| Component | Type | Location | Purpose |
| --------- | ---- | -------- | ------- |
| `ModuleList.tsx` | Server | `src/components/` | Display modules with lessons and progress within course detail |
| `LessonCard.tsx` | Server | `src/components/` | Individual lesson card with completion status |
| `QuizCard.tsx` | Server | `src/components/` | Quiz summary card with attempt info |
| `CourseProgressBar.tsx` | Client | `src/components/` | Visual progress bar for module/course completion |
| `QuizQuestion.tsx` | Client | `src/components/` | Single question renderer during quiz taking |
| `QuizResults.tsx` | Client | `src/components/` | Quiz results display with per-question breakdown |
| `QuizTimer.tsx` | Client | `src/components/` | Countdown timer for timed quizzes |
| `EnrolledCourses.tsx` | Server | `src/components/` | Student course browser showing enrolled courses |

### 5.8 New Zod Schemas

Add to `src/lib/formValidationSchemas.ts`:

```typescript
// Course validation
const courseSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  code: z.string().min(2).max(20).regex(/^[A-Z0-9-]+$/),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
  teacherId: z.string().min(1),
  subjectId: z.coerce.number().min(1),
});

// Module validation
const moduleSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  order: z.coerce.number().int().min(1),
  isLocked: z.boolean().default(false),
  courseId: z.coerce.number().min(1),
});

// LmsLesson validation
const lmsLessonSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  contentType: z.enum(["TEXT", "VIDEO", "LINK", "MIXED"]),
  externalUrl: z.string().url().optional().or(z.literal("")),
  order: z.coerce.number().int().min(1),
  estimatedMinutes: z.coerce.number().int().min(1).optional(),
  moduleId: z.coerce.number().min(1),
});

// Enrollment validation
const enrollmentSchema = z.object({
  studentId: z.string().min(1),
  courseId: z.coerce.number().min(1),
});

// Quiz validation
const quizSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  timeLimit: z.coerce.number().int().min(1).optional(),
  maxAttempts: z.coerce.number().int().min(1).default(1),
  passScore: z.coerce.number().int().min(0).max(100).default(70),
  scoringPolicy: z.enum(["BEST", "LATEST", "AVERAGE"]),
  randomizeQuestions: z.boolean().default(false),
  randomizeOptions: z.boolean().default(false),
  lessonId: z.coerce.number().min(1),
});

// Question validation
const questionSchema = z.object({
  id: z.coerce.number().optional(),
  text: z.string().min(1).max(1000),
  type: z.enum(["MULTIPLE_CHOICE", "TRUE_FALSE", "FILL_IN_BLANK"]),
  explanation: z.string().max(500).optional(),
  points: z.coerce.number().int().min(1).default(1),
  order: z.coerce.number().int().min(1),
  quizId: z.coerce.number().optional(),
  questionBankId: z.coerce.number().optional(),
  options: z.array(z.object({
    text: z.string().min(1),
    isCorrect: z.boolean(),
    order: z.coerce.number().int().min(1),
  })).min(2),
});

// QuestionBank validation
const questionBankSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  subjectId: z.coerce.number().min(1),
});
```

### 5.9 Auto-Grading Algorithm

```typescript
// Auto-grading logic for submitQuizAttempt
function gradeQuizAttempt(
  questions: QuestionWithOptions[],
  responses: SubmittedResponse[]
): GradingResult {
  let totalPoints = 0;
  let earnedPoints = 0;

  for (const question of questions) {
    totalPoints += question.points;
    const response = responses.find(r => r.questionId === question.id);
    if (!response) continue;

    let isCorrect = false;

    switch (question.type) {
      case "MULTIPLE_CHOICE":
      case "TRUE_FALSE": {
        const correctOption = question.options.find(o => o.isCorrect);
        isCorrect = response.selectedOptionId === correctOption?.id;
        break;
      }
      case "FILL_IN_BLANK": {
        const correctOption = question.options.find(o => o.isCorrect);
        isCorrect = response.textResponse?.trim().toLowerCase()
          === correctOption?.text.trim().toLowerCase();
        break;
      }
    }

    if (isCorrect) earnedPoints += question.points;
  }

  const percentage = totalPoints > 0
    ? Math.round((earnedPoints / totalPoints) * 100 * 10) / 10
    : 0;

  return {
    score: earnedPoints,
    maxScore: totalPoints,
    percentage,
    passed: percentage >= quiz.passScore,
  };
}
```

### 5.10 Constraints

- **CON-LMS-001**: All new Server Actions must follow the existing return type pattern: `{ success: boolean; error: boolean; message?: string }`.
- **CON-LMS-002**: All new form components must use React Hook Form with Zod resolver and useActionState.
- **CON-LMS-003**: All new list pages must use the ITEM_PER_PAGE constant for pagination.
- **CON-LMS-004**: All Prisma queries in page components must use Server Components (no "use client").
- **CON-LMS-005**: Teacher access must be scoped to their own courses in all Server Actions (query for course.teacherId === userId).
- **CON-LMS-006**: Student access must be scoped to their enrolled courses (query via Enrollment with ACTIVE status).
- **CON-LMS-007**: The existing "Lesson" model is not modified. The new model is named "LmsLesson" to avoid conflict.
- **CON-LMS-008**: External URLs for lessons must be validated as proper URLs. YouTube and Google Drive embeds must be rendered as iframes with proper sandbox attributes.
- **CON-LMS-009**: Quiz auto-grading is atomic: all questions are graded in a single transaction when the attempt is submitted.
- **CON-LMS-010**: Day enum must be extended to include SATURDAY and SUNDAY to reflect the bi-weekly school schedule.

---

## 6. Traceability

| Requirement     | Component(s)                                                      | Acceptance Test     |
| --------------- | ----------------------------------------------------------------- | ------------------- |
| REQ-LMS-001     | CourseForm, createCourse/updateCourse/deleteCourse actions         | AC-LMS-001          |
| REQ-LMS-002     | courses/page.tsx, ListFilter, Pagination                          | AC-LMS-002          |
| REQ-LMS-003     | Course detail page, Server Actions auth checks                    | AC-LMS-003          |
| REQ-LMS-004     | ModuleForm, createModule/updateModule/deleteModule actions         | AC-LMS-004          |
| REQ-LMS-005     | ModuleList, course detail page                                    | AC-LMS-005          |
| REQ-LMS-006     | LmsLessonForm, createLmsLesson/updateLmsLesson/deleteLmsLesson    | AC-LMS-006          |
| REQ-LMS-007     | Lesson viewer page, iframe embeds                                 | AC-LMS-007          |
| REQ-LMS-008     | markLessonComplete, startLessonProgress actions, LessonProgress   | AC-LMS-008          |
| REQ-LMS-009     | CourseProgressBar, ModuleList, LessonCard                         | AC-LMS-009          |
| REQ-LMS-010     | EnrollmentForm, enrollStudent/dropEnrollment actions              | AC-LMS-010          |
| REQ-LMS-011     | EnrolledCourses, student course browser page                      | AC-LMS-011          |
| REQ-LMS-012     | QuizForm, createQuiz/updateQuiz/deleteQuiz actions                | AC-LMS-012          |
| REQ-LMS-013     | QuestionForm, createQuestion/updateQuestion/deleteQuestion        | AC-LMS-013          |
| REQ-LMS-014     | QuestionBankForm, createQuestionBank action                       | AC-LMS-014          |
| REQ-LMS-015     | Quiz taking page, startQuizAttempt/submitQuizAttempt actions      | AC-LMS-015          |
| REQ-LMS-016     | Quiz taking page, attempt limit check                             | AC-LMS-016          |
| REQ-LMS-017     | Quiz results page, QuizResults component                          | AC-LMS-017          |
| REQ-LMS-018     | Quiz results page (teacher view)                                  | AC-LMS-018          |
| REQ-LMS-019     | All pages (performance target)                                    | AC-LMS-019          |
| REQ-LMS-020     | All Server Actions, routeAccessMap                                | AC-LMS-020          |
| REQ-LMS-021     | All Server Actions, page auth checks                              | AC-LMS-021          |
| REQ-LMS-022     | All new files (pattern compliance)                                | AC-LMS-022          |

---

## 7. Out of Scope

- **Self-enrollment**: Students enrolling themselves in courses (Phase 2)
- **Discussion forums**: Peer and teacher-moderated forums (Phase 2)
- **Gamification**: XP, badges, streaks, leaderboards (Phase 3)
- **Spaced repetition**: Algorithmically-timed review material (Phase 3)
- **File uploads**: Direct file upload for lesson content (external URLs only in Phase 1)
- **Rich text editor**: WYSIWYG editor integration (plain textarea with markdown support in Phase 1)
- **Drag-and-drop ordering**: Module and lesson reordering via drag-and-drop
- **Multi-teacher courses**: Courses with multiple assigned teachers
- **Subjective grading**: Manual grading for essay or open-ended questions
- **Course categories/tags**: Categorization beyond the subject link
- **Course duplication**: Cloning an existing course with all modules and lessons
- **Analytics dashboard**: Detailed LMS analytics with charts (deferred to Phase 2)
- **Email notifications**: Email alerts for enrollment or quiz events
- **Mobile-optimized quiz UI**: Responsive quiz interface for mobile devices (basic responsiveness only)
- **Parent LMS access**: Parents viewing course content or quiz results (Phase 2)

## 8. Implementation Notes

### Implementation Summary
- **Completed**: 2026-02-21
- **Commit**: 4201f3c on main
- **Files Changed**: 32 files (+5,126 lines)
- **Development Mode**: DDD (ANALYZE-PRESERVE-IMPROVE)

### Scope Delivered
All 22 requirements (REQ-LMS-001 through REQ-LMS-022) implemented across 3 milestones:
- **Milestone 1**: Database schema (11 models, 6 enums), Course/Module/Enrollment CRUD, 3 form components, 3 list pages, navigation integration
- **Milestone 2**: LmsLesson CRUD, lesson content viewer with YouTube embed support, progress tracking (LessonProgress), CourseProgressBar widget, EnrolledCourses student dashboard widget
- **Milestone 3**: Quiz/Question/QuestionBank CRUD, auto-grading engine (quizUtils.ts) supporting MC/TF/FILL_IN_BLANK, quiz taking interface with timer, quiz results views (student per-question breakdown, teacher aggregate summary)

### Deviations from Plan
- Day enum extended with SATURDAY and SUNDAY (noted in ASM-LMS-001 as conditional)
- NotificationType enum extended with ENROLLMENT for enrollment notifications
- actions.ts grew by ~979 lines (consider splitting to lmsActions.ts in future)

### Known Limitations
- Quiz timer is client-side only (server-side enforcement deferred)
- Rich text content uses plain text rendering (DOMPurify needed for HTML in future)
- Parent role has no explicit LMS access (Phase 2 scope)
- No drag-and-drop reordering for modules/lessons (deferred)
