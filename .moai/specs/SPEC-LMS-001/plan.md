# SPEC-LMS-001: Implementation Plan

## Overview

LMS Phase 1 for a bi-weekly school management system. Build the foundational LMS layer: course structure with modules, content delivery with lesson progress tracking, student enrollment management, and a basic quiz engine with auto-grading. This bridges the 12-day gap between Saturday/Sunday sessions through asynchronous digital engagement.

**Development Mode**: DDD (ANALYZE-PRESERVE-IMPROVE)
**Related SPEC**: SPEC-LMS-001

---

## Milestone 1: Database Schema & Course Structure (Sprint 7)

**Priority**: High (foundational - all subsequent milestones depend on the schema)

### Goals

- Add 11 new Prisma models, 6 enums, and relation updates to existing models
- Create Course CRUD Server Actions with role-based access
- Create Module CRUD Server Actions with course ownership validation
- Build course list page with search, filter, and pagination
- Build module management UI within course detail page
- Create enrollment management for admins

### Tasks

| # | Task | Files | REQ |
|---|------|-------|-----|
| 1.1 | ANALYZE: Read existing schema.prisma, actions.ts patterns, FormContainer.tsx, list page patterns, settings.ts | Read-only | - |
| 1.2 | Add 11 new models, 6 enums, and relation fields to existing Student/Teacher/Subject models. Extend Day enum with SATURDAY and SUNDAY. | `prisma/schema.prisma` (MODIFY) | All |
| 1.3 | Run `npx prisma migrate dev` to generate and apply migration | Migration files (NEW) | All |
| 1.4 | Run `npx prisma generate` to regenerate Prisma client | Auto-generated | All |
| 1.5 | Add Course, Module, Enrollment Zod schemas | `src/lib/formValidationSchemas.ts` (MODIFY) | REQ-LMS-001, 004, 010 |
| 1.6 | Create `createCourse`, `updateCourse`, `deleteCourse` Server Actions | `src/lib/actions.ts` (MODIFY) | REQ-LMS-001 |
| 1.7 | Create `createModule`, `updateModule`, `deleteModule` Server Actions | `src/lib/actions.ts` (MODIFY) | REQ-LMS-004 |
| 1.8 | Create `enrollStudent`, `dropEnrollment` Server Actions with notification | `src/lib/actions.ts` (MODIFY) | REQ-LMS-010 |
| 1.9 | Add `/list/courses` and `/list/enrollments` to routeAccessMap | `src/lib/settings.ts` (MODIFY) | REQ-LMS-002, 020 |
| 1.10 | Create `CourseForm.tsx` (Client Component, React Hook Form + Zod) | `src/components/forms/CourseForm.tsx` (NEW) | REQ-LMS-001 |
| 1.11 | Create `ModuleForm.tsx` (Client Component) | `src/components/forms/ModuleForm.tsx` (NEW) | REQ-LMS-004 |
| 1.12 | Create `EnrollmentForm.tsx` (Client Component) | `src/components/forms/EnrollmentForm.tsx` (NEW) | REQ-LMS-010 |
| 1.13 | Update `FormContainer.tsx` to handle "course", "module", "enrollment" table types | `src/components/FormContainer.tsx` (MODIFY) | REQ-LMS-001, 004, 010 |
| 1.14 | Create course list page with search/filter/pagination | `src/app/(dashboard)/list/courses/page.tsx` (NEW) | REQ-LMS-002 |
| 1.15 | Create course detail page with module list and management | `src/app/(dashboard)/list/courses/[id]/page.tsx` (NEW) | REQ-LMS-003, 005 |
| 1.16 | Create enrollment list page for admin | `src/app/(dashboard)/list/enrollments/page.tsx` (NEW) | REQ-LMS-010 |
| 1.17 | Create `ModuleList.tsx` server component for course detail | `src/components/ModuleList.tsx` (NEW) | REQ-LMS-005 |
| 1.18 | Add Menu items for Courses and Enrollments in sidebar | `src/lib/data.ts` or `src/components/Menu.tsx` (MODIFY) | REQ-LMS-002 |

### Technical Approach

**Schema Design**:
- Follow existing autoincrement Int ID pattern for new models (Course, Module, etc.)
- Use String IDs for foreign keys referencing Clerk-based models (Student, Teacher)
- Cascade deletes: Course -> Modules -> LmsLessons -> Progress/Quizzes
- Unique constraints on [studentId, lessonId] and [studentId, courseId]
- The Day enum extension adds SATURDAY and SUNDAY for bi-weekly schedule support

**Server Actions**:
- Follow exact pattern from existing actions: auth() check, role extraction, try/catch, revalidatePath, CurrentState return
- Teacher ownership check: `await prisma.course.findFirst({ where: { id: courseId, teacherId: userId } })`
- Enrollment notification: reuse `createNotification` from notificationActions.ts

**Course List Page**:
- Follow existing list page patterns (students/page.tsx as reference)
- URL params: `?page=1&search=math&teacherId=xxx&subjectId=1&status=ACTIVE`
- Server Component with Promise.all for parallel data + count queries
- Display columns: Code, Title, Teacher Name, Subject Name, Status badge, Module count, Enrollment count

### Dependencies

- Task 1.2 must complete before all other tasks (schema is foundational)
- Tasks 1.3 and 1.4 must run sequentially after 1.2
- Tasks 1.5-1.9 can proceed in parallel after 1.4
- Tasks 1.10-1.18 depend on 1.5-1.9

### Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Schema migration conflicts with existing data | Medium | Run migration on a clean dev database first. Test with seed data. Back up before migrating |
| Large actions.ts file becomes unwieldy with 20+ new actions | Medium | Consider splitting into `src/lib/lmsActions.ts` if actions.ts exceeds 800 lines, but import and re-export from actions.ts for consistency |
| Day enum extension requires migration with existing Lesson data | Low | SATURDAY/SUNDAY are new values only; existing data uses MONDAY-FRIDAY and remains valid |

---

## Milestone 2: Content Delivery & Progress Tracking (Sprint 8)

**Priority**: High (core LMS functionality - lesson viewing and progress)

### Goals

- Create LmsLesson CRUD Server Actions
- Build lesson viewer page with rich text content and external embeds
- Implement lesson progress tracking (start, complete)
- Build student course browser (enrolled courses view)
- Add progress display to course detail page

### Tasks

| # | Task | Files | REQ |
|---|------|-------|-----|
| 2.1 | ANALYZE: Read existing course detail page, BigCalendar patterns for content display | Read-only | - |
| 2.2 | Add LmsLesson Zod schema | `src/lib/formValidationSchemas.ts` (MODIFY) | REQ-LMS-006 |
| 2.3 | Create `createLmsLesson`, `updateLmsLesson`, `deleteLmsLesson` Server Actions | `src/lib/actions.ts` (MODIFY) | REQ-LMS-006 |
| 2.4 | Create `markLessonComplete`, `startLessonProgress` Server Actions | `src/lib/actions.ts` (MODIFY) | REQ-LMS-008 |
| 2.5 | Create `LmsLessonForm.tsx` (Client Component) | `src/components/forms/LmsLessonForm.tsx` (NEW) | REQ-LMS-006 |
| 2.6 | Update `FormContainer.tsx` to handle "lmsLesson" table type | `src/components/FormContainer.tsx` (MODIFY) | REQ-LMS-006 |
| 2.7 | Create lesson viewer page with content rendering and progress | `src/app/(dashboard)/list/courses/[id]/lesson/[lessonId]/page.tsx` (NEW) | REQ-LMS-007, 008 |
| 2.8 | Create `LessonCard.tsx` server component | `src/components/LessonCard.tsx` (NEW) | REQ-LMS-009 |
| 2.9 | Create `CourseProgressBar.tsx` client component | `src/components/CourseProgressBar.tsx` (NEW) | REQ-LMS-009 |
| 2.10 | Update course detail page to show lessons within modules with progress indicators | `src/app/(dashboard)/list/courses/[id]/page.tsx` (MODIFY) | REQ-LMS-009 |
| 2.11 | Create `EnrolledCourses.tsx` server component for student dashboard | `src/components/EnrolledCourses.tsx` (NEW) | REQ-LMS-011 |
| 2.12 | Add EnrolledCourses widget to student dashboard | `src/app/(dashboard)/student/page.tsx` (MODIFY) | REQ-LMS-011 |
| 2.13 | Update ModuleList to show lesson cards with completion status | `src/components/ModuleList.tsx` (MODIFY) | REQ-LMS-005, 009 |

### Technical Approach

**Lesson Viewer**:
- Server Component page that fetches lesson with module and course data
- Enrollment check: verify student has ACTIVE enrollment in the course
- Render lesson.content as rich text (dangerouslySetInnerHTML with sanitization, or plain text with line breaks)
- External URL rendering: detect YouTube URLs and render as iframe with `sandbox="allow-scripts allow-same-origin"`, other URLs as clickable links
- Progress buttons: "Mark as Completed" button calls markLessonComplete action
- Breadcrumb navigation: Course > Module > Lesson

**Progress Tracking**:
- startLessonProgress: upsert LessonProgress with status IN_PROGRESS, startedAt = now()
- markLessonComplete: update LessonProgress with status COMPLETED, completedAt = now()
- Progress display: percentage = (completed lessons / total lessons) per module and per course

**Student Course Browser**:
- Query enrollments with ACTIVE status for the current student
- Include course, teacher, subject data in the query
- Calculate per-course progress: count of COMPLETED LessonProgress / total LmsLessons across all modules
- Display as a grid of course cards with progress bar

### Dependencies

- Milestone 1 must be complete (schema, course CRUD)
- Tasks 2.2-2.4 can proceed in parallel
- Tasks 2.5-2.13 depend on 2.2-2.4

### Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Rich text content injection (XSS) | High | Sanitize HTML content before rendering. Consider DOMPurify or render as plain text with markdown in Phase 1 |
| External URL iframe embedding blocked by CSP | Medium | Add YouTube and Google Drive domains to Content Security Policy. Test iframe rendering in development |
| Progress calculation performance with many lessons | Low | Expected scale is < 50 lessons per course. Simple count queries are sufficient |

---

## Milestone 3: Quiz Engine (Sprint 9)

**Priority**: High (core assessment functionality)

### Goals

- Create Quiz, Question, QuestionBank, AnswerOption CRUD
- Build quiz creation UI for teachers
- Build question creation with answer options
- Build quiz taking interface for students
- Implement auto-grading engine
- Build quiz results view for students and teachers
- Implement attempt tracking with max attempts and scoring policy

### Tasks

| # | Task | Files | REQ |
|---|------|-------|-----|
| 3.1 | ANALYZE: Read existing form patterns, quiz schema, auto-grading algorithm from spec | Read-only | - |
| 3.2 | Add Quiz, Question, QuestionBank, AnswerOption Zod schemas | `src/lib/formValidationSchemas.ts` (MODIFY) | REQ-LMS-012, 013, 014 |
| 3.3 | Create `createQuiz`, `updateQuiz`, `deleteQuiz` Server Actions | `src/lib/actions.ts` (MODIFY) | REQ-LMS-012 |
| 3.4 | Create `createQuestion`, `updateQuestion`, `deleteQuestion` Server Actions | `src/lib/actions.ts` (MODIFY) | REQ-LMS-013 |
| 3.5 | Create `createQuestionBank` Server Action | `src/lib/actions.ts` (MODIFY) | REQ-LMS-014 |
| 3.6 | Create `startQuizAttempt` Server Action with attempt limit check | `src/lib/actions.ts` (MODIFY) | REQ-LMS-015, 016 |
| 3.7 | Create `submitQuizAttempt` Server Action with auto-grading | `src/lib/actions.ts` (MODIFY) | REQ-LMS-015, 017 |
| 3.8 | Create auto-grading utility function | `src/lib/quizUtils.ts` (NEW) | REQ-LMS-015 |
| 3.9 | Create `QuizForm.tsx` (Client Component) | `src/components/forms/QuizForm.tsx` (NEW) | REQ-LMS-012 |
| 3.10 | Create `QuestionForm.tsx` (Client Component with dynamic answer options) | `src/components/forms/QuestionForm.tsx` (NEW) | REQ-LMS-013 |
| 3.11 | Create `QuestionBankForm.tsx` (Client Component) | `src/components/forms/QuestionBankForm.tsx` (NEW) | REQ-LMS-014 |
| 3.12 | Update `FormContainer.tsx` to handle "quiz", "question", "questionBank" table types | `src/components/FormContainer.tsx` (MODIFY) | REQ-LMS-012, 013, 014 |
| 3.13 | Create quiz taking page (Client Component with state management) | `src/app/(dashboard)/list/courses/[id]/quiz/[quizId]/page.tsx` (NEW) | REQ-LMS-015, 016 |
| 3.14 | Create `QuizQuestion.tsx` client component (single question renderer) | `src/components/QuizQuestion.tsx` (NEW) | REQ-LMS-015 |
| 3.15 | Create `QuizTimer.tsx` client component (countdown timer) | `src/components/QuizTimer.tsx` (NEW) | REQ-LMS-015 |
| 3.16 | Create quiz results page | `src/app/(dashboard)/list/courses/[id]/quiz/[quizId]/results/page.tsx` (NEW) | REQ-LMS-017 |
| 3.17 | Create `QuizResults.tsx` client component (results display) | `src/components/QuizResults.tsx` (NEW) | REQ-LMS-017 |
| 3.18 | Create `QuizCard.tsx` server component (quiz summary in lesson view) | `src/components/QuizCard.tsx` (NEW) | REQ-LMS-012 |
| 3.19 | Update lesson viewer to show attached quizzes | `src/app/(dashboard)/list/courses/[id]/lesson/[lessonId]/page.tsx` (MODIFY) | REQ-LMS-012 |
| 3.20 | Create teacher quiz results summary view | Quiz results page (teacher view logic) | REQ-LMS-018 |

### Technical Approach

**Quiz Creation UI**:
- QuizForm: standard form for quiz metadata (title, time limit, attempts, pass score, policy)
- QuestionForm: dynamic form with type selector. When type changes, the answer options section adapts:
  - MULTIPLE_CHOICE: 2-6 answer option inputs with checkboxes for correct answers
  - TRUE_FALSE: fixed 2 options (True, False) with radio for correct answer
  - FILL_IN_BLANK: single text input for the correct answer text
- Use React Hook Form's `useFieldArray` for dynamic answer options

**Quiz Taking Interface**:
- Client Component page with state for current question index, selected answers, and timer
- On mount: fetch quiz data with questions (randomized if configured), start timer if time limit set
- Display one question at a time (or all at once based on UI preference)
- Question navigation: Previous/Next buttons, question number indicators
- Submit button: collect all responses, call submitQuizAttempt action

**Auto-Grading**:
- Extracted to `src/lib/quizUtils.ts` for testability
- Grade all questions in a single pass
- Create QuestionResponse records for each question
- Calculate total score, percentage, pass/fail
- Apply scoring policy for attempts: BEST (keep highest), LATEST (use most recent), AVERAGE (compute mean)
- All grading in a Prisma transaction: create responses + update attempt atomically

**Attempt Tracking**:
- Before starting: count existing attempts for the student + quiz combination
- If count >= maxAttempts: reject with error message
- Scoring policy applies when displaying results on the quiz card/results page:
  - BEST: `SELECT MAX(score)` from attempts
  - LATEST: most recent attempt's score
  - AVERAGE: `SELECT AVG(score)` from attempts

### Dependencies

- Milestone 1 must be complete (schema)
- Milestone 2 should be complete (lesson viewer for quiz attachment)
- Tasks 3.2-3.8 can proceed in parallel
- Tasks 3.9-3.20 depend on 3.2-3.8

### Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Complex QuestionForm with dynamic answer options | High | Use useFieldArray for dynamic option management. Test with all three question types |
| Quiz state management complexity (timer, navigation, answers) | Medium | Use a single state reducer for quiz state. Consider Zustand if React state becomes unwieldy |
| Auto-grading edge cases (empty answers, null values) | Medium | Default unanswered questions to 0 points. Add null checks in grading logic |
| Race condition on quiz submission (double-submit) | Medium | Disable submit button during action execution. Use useActionState pending state |
| FILL_IN_BLANK grading accuracy (typos, variations) | Low | Phase 1 uses exact match only. Document this limitation for teachers |

---

## Architecture Design Direction

### Component Hierarchy

```
Course List Page (/list/courses)
  |-- Table (reuse existing Table component)
  |-- ListFilter (reuse existing filter component)
  |-- Pagination (reuse existing)
  |-- FormModal > CourseForm (create/update/delete)

Course Detail Page (/list/courses/[id])
  |-- Course Info Header
  |-- CourseProgressBar [NEW - Client]
  |-- ModuleList [NEW - Server]
  |     |-- Module Card (title, description, locked badge, lesson count)
  |     |-- LessonCard [NEW - Server] per lesson
  |     |     |-- Completion indicator
  |     |     |-- QuizCard [NEW - Server] if quiz attached
  |     |-- FormModal > ModuleForm (create/update/delete)
  |     |-- FormModal > LmsLessonForm (create/update/delete)

Lesson Viewer (/list/courses/[id]/lesson/[lessonId])
  |-- Breadcrumb (Course > Module > Lesson)
  |-- Lesson Content (rich text + external embeds)
  |-- Mark as Completed button
  |-- QuizCard [NEW] per attached quiz

Quiz Taking (/list/courses/[id]/quiz/[quizId])
  |-- QuizTimer [NEW - Client]
  |-- QuizQuestion [NEW - Client] per question
  |-- Navigation (Previous/Next/Submit)

Quiz Results (/list/courses/[id]/quiz/[quizId]/results)
  |-- Score Summary (total, percentage, pass/fail)
  |-- Per-question breakdown (QuizResults component)
  |-- Teacher view: class-wide summary

Enrollment List Page (/list/enrollments)
  |-- Table
  |-- FormModal > EnrollmentForm

Student Dashboard
  |-- EnrolledCourses [NEW - Server]
```

### File Organization

All new components follow the existing flat structure in `src/components/`. New form components go in `src/components/forms/`. New pages follow the existing route group pattern under `src/app/(dashboard)/list/courses/`.

A new utility file `src/lib/quizUtils.ts` isolates the auto-grading algorithm for testability and reuse.

### Query Optimization Notes

- Course list page uses `Promise.all` for parallel count + data queries (following existing pattern)
- Course detail page prefetches modules with their lessons and the student's progress in a single query using nested includes
- Quiz taking page loads all questions in a single query (expected < 50 questions per quiz)
- Student course browser calculates progress in the query using `_count` aggregation on LessonProgress

---

## Summary

| Milestone | Sprint | New Files | Modified Files | Requirements Covered |
| --------- | ------ | --------- | -------------- | -------------------- |
| 1 - Database & Course Structure | 7 | 7 | 5 | REQ-LMS-001-005, 010, 020, 022 |
| 2 - Content Delivery | 8 | 5 | 4 | REQ-LMS-006-009, 011 |
| 3 - Quiz Engine | 9 | 10 | 3 | REQ-LMS-012-018 |
| Cross-cutting | All | - | - | REQ-LMS-019-022 |
| **Total** | **3 sprints** | **22** | **12** | **22 requirements** |

### Files Created/Modified Summary

**New Files (22)**:
1. `src/components/forms/CourseForm.tsx`
2. `src/components/forms/ModuleForm.tsx`
3. `src/components/forms/EnrollmentForm.tsx`
4. `src/components/forms/LmsLessonForm.tsx`
5. `src/components/forms/QuizForm.tsx`
6. `src/components/forms/QuestionForm.tsx`
7. `src/components/forms/QuestionBankForm.tsx`
8. `src/components/ModuleList.tsx`
9. `src/components/LessonCard.tsx`
10. `src/components/CourseProgressBar.tsx`
11. `src/components/EnrolledCourses.tsx`
12. `src/components/QuizCard.tsx`
13. `src/components/QuizQuestion.tsx`
14. `src/components/QuizTimer.tsx`
15. `src/components/QuizResults.tsx`
16. `src/lib/quizUtils.ts`
17. `src/app/(dashboard)/list/courses/page.tsx`
18. `src/app/(dashboard)/list/courses/[id]/page.tsx`
19. `src/app/(dashboard)/list/courses/[id]/lesson/[lessonId]/page.tsx`
20. `src/app/(dashboard)/list/courses/[id]/quiz/[quizId]/page.tsx`
21. `src/app/(dashboard)/list/courses/[id]/quiz/[quizId]/results/page.tsx`
22. `src/app/(dashboard)/list/enrollments/page.tsx`

**Modified Files (12)**:
1. `prisma/schema.prisma` (11 models, 6 enums, 3 relation updates)
2. `src/lib/formValidationSchemas.ts` (7 new schemas)
3. `src/lib/actions.ts` (22 new Server Actions)
4. `src/lib/settings.ts` (2 new route entries)
5. `src/components/FormContainer.tsx` (6 new table type cases)
6. `src/app/(dashboard)/student/page.tsx` (EnrolledCourses widget)
7. `src/components/Menu.tsx` or `src/lib/data.ts` (sidebar menu items)
8. `src/app/(dashboard)/list/courses/[id]/page.tsx` (module progress)
9. `src/app/(dashboard)/list/courses/[id]/lesson/[lessonId]/page.tsx` (quiz cards)
10. `src/components/ModuleList.tsx` (lesson cards with progress)
11. `prisma/migrations/` (new migration)
12. `next.config.mjs` (if CSP headers needed for iframe embeds)
