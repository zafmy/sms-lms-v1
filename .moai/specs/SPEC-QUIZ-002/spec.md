---
id: SPEC-QUIZ-002
version: "1.0.0"
status: completed
created: 2026-02-25
updated: 2026-02-25
author: ZaF
priority: high
---

# SPEC-QUIZ-002: Question Randomization

## HISTORY

| Version | Date       | Author | Description                     |
|---------|------------|--------|---------------------------------|
| 1.0.0   | 2026-02-25 | ZaF    | Initial EARS specification      |

---

## 1. Environment

### 1.1 Project Context

Hua Readwise is a school management system built with Next.js 16 (App Router), React 19, Prisma ORM, and PostgreSQL. The quiz system (SPEC-LMS-001) supports multiple question types (MULTIPLE_CHOICE, TRUE_FALSE, FILL_IN_BLANK), timed attempts, auto-grading, and spaced repetition integration. Quiz configuration already includes `randomizeQuestions` and `randomizeOptions` boolean flags, but the implementation has critical bugs and lacks shuffle persistence and pool selection features.

### 1.2 Problem Statement

The quiz randomization system has four defects and one missing feature:

1. **Option randomization is broken**: `QuizQuestion.tsx` always re-sorts options by the `.order` field (line 44), completely undoing any server-side option shuffle. The `randomizeOptions` checkbox in QuizForm has no effect.

2. **Biased shuffle algorithm**: The server-side shuffle uses `Array.sort(() => Math.random() - 0.5)` instead of the Fisher-Yates algorithm. This produces non-uniform distributions -- some orderings are significantly more likely than others.

3. **No shuffle persistence**: The shuffled question/option order is computed on every server render. Refreshing the page during an in-progress attempt produces a new random order, which is disorienting for students and can lead to confusion about which question they were on.

4. **Results page disconnect**: `QuizResults.tsx` displays questions in database insertion order (via `attempt.responses.map`), not the order the student actually saw them. This makes it difficult for students to correlate their experience with the results.

5. **Missing pool selection**: Teachers cannot configure "pick N random questions from a total of M" per quiz. This is a common assessment feature that reduces cheating and increases question reuse value.

### 1.3 Technical Environment

| Component         | Version/Technology                           |
|-------------------|----------------------------------------------|
| Framework         | Next.js 16 (App Router, Server Components)   |
| UI Library        | React 19                                     |
| Language          | TypeScript 5 (strict mode)                   |
| Styling           | Tailwind CSS v4                              |
| Database          | PostgreSQL 14+ via Prisma ORM 5.19+          |
| Forms             | React Hook Form 7.52+ with Zod 3.23+        |
| Auth              | Clerk 6.38+                                  |

### 1.4 Affected Components

| Component | File | Role |
|-----------|------|------|
| Quiz page (server) | `src/app/(dashboard)/list/courses/[id]/quiz/[quizId]/page.tsx` | Shuffle logic, question preparation |
| QuizQuestion | `src/components/QuizQuestion.tsx` | Question/option renderer (has re-sort bug) |
| QuizTakingClient | `src/components/QuizTakingClient.tsx` | Client-side quiz interaction state |
| QuizResults | `src/components/QuizResults.tsx` | Results display (shows wrong order) |
| QuizForm | `src/components/forms/QuizForm.tsx` | Quiz configuration (randomize checkboxes) |
| Quiz schema | `src/lib/formValidationSchemas.ts:249-286` | Zod validation for quiz fields |
| Server actions | `src/lib/actions.ts` | `startQuizAttempt`, `submitQuizAttempt`, `createQuiz`, `updateQuiz` |
| Prisma schema | `prisma/schema.prisma:345-426` | Quiz, Question, QuizAttempt, QuestionResponse models |

---

## 2. Assumptions

### 2.1 Technical Assumptions

- **A-01**: Prisma supports `Json` type fields for storing shuffled order arrays in `QuizAttempt`. PostgreSQL `jsonb` type can efficiently store and retrieve arrays of integers.
- **A-02**: The Fisher-Yates shuffle algorithm produces sufficiently uniform randomization for educational assessments. No cryptographic randomness is required.
- **A-03**: Storing question/option order as JSON arrays (e.g., `[5, 2, 8, 1, 3]`) is compact enough that it does not materially impact database storage for typical quiz sizes (5-50 questions, 2-6 options each).
- **A-04**: The existing grading logic in `quizUtils.ts` matches responses by `questionId` and `selectedOptionId`, not by position. Therefore, randomization changes will not break grading.
- **A-05**: The existing spaced repetition system (`generateReviewCardsFromQuiz`) references questions by ID, not position. Randomization changes will not break review card generation.

### 2.2 Business Assumptions

- **A-06**: Teachers configure randomization and pool size at quiz creation/edit time. Students do not have control over these settings.
- **A-07**: Pool selection ("pick N from M") selects questions at the moment an attempt starts. The selected subset is fixed for the duration of that attempt.
- **A-08**: Different students (or different attempts by the same student) may receive different question subsets when pool selection is enabled. Scoring is based on the actual questions presented, not the full question set.
- **A-09**: The `poolSize` value must be less than or equal to the total number of questions in the quiz. If `poolSize` is null or zero, all questions are included (current behavior).

### 2.3 Constraint Assumptions

- **A-10**: The `QuizResults` page must show only the questions that were part of the student's specific attempt, displayed in the order the student saw them.
- **A-11**: Correct answers (`isCorrect` field on `AnswerOption`) must never be sent to the client during quiz taking. They are only revealed after submission on the results page.
- **A-12**: Existing quiz attempts (created before this feature) have no stored order data. The system must gracefully handle null `questionOrder` and `optionOrder` by falling back to database order.

---

## 3. Requirements

### 3.1 Bug Fix Requirements

#### REQ-FIX-01: Remove client-side option re-sorting

**When** the `QuizQuestion` component receives options from the server, **the system shall** render the options in the order they are received without re-sorting by the `.order` field.

*Rationale:* The current `.sort((a, b) => a.order - b.order)` on line 44 of `QuizQuestion.tsx` undoes the server-side option shuffle, making `randomizeOptions` non-functional.

#### REQ-FIX-02: Replace biased shuffle with Fisher-Yates

**When** the system needs to randomize question or option order, **the system shall** use the Fisher-Yates (Knuth) shuffle algorithm instead of `Array.sort(() => Math.random() - 0.5)`.

*Rationale:* The sort-based shuffle produces non-uniform distributions. Fisher-Yates guarantees each permutation is equally likely.

#### REQ-FIX-03: Display results in attempt order

**When** the QuizResults component renders a completed attempt, **the system shall** display questions in the order the student saw them during the attempt, not in database insertion order.

---

### 3.2 Shuffle Requirements

#### REQ-SHUFFLE-01: Fisher-Yates shuffle utility

The system shall provide a `fisherYatesShuffle<T>(array: T[]): T[]` utility function that:
- Returns a new array (does not mutate the input)
- Uses the Fisher-Yates algorithm for uniform random distribution
- Is exported from `src/lib/shuffleUtils.ts`

#### REQ-SHUFFLE-02: Question order randomization

**When** `quiz.randomizeQuestions` is true **and** a student starts or resumes a quiz attempt, **the system shall** present questions in a shuffled order determined by the Fisher-Yates algorithm.

#### REQ-SHUFFLE-03: Option order randomization

**When** `quiz.randomizeOptions` is true **and** a student starts or resumes a quiz attempt, **the system shall** present each question's answer options in a shuffled order determined by the Fisher-Yates algorithm.

---

### 3.3 Persistence Requirements

#### REQ-PERSIST-01: Store question order per attempt

**When** a quiz attempt begins (or when the shuffled order is first computed for an attempt), **the system shall** store the shuffled question ID order as a JSON array in the `QuizAttempt.questionOrder` field.

#### REQ-PERSIST-02: Store option order per attempt

**When** a quiz attempt begins (or when the shuffled order is first computed for an attempt), **the system shall** store the shuffled option ID order per question as a JSON object in the `QuizAttempt.optionOrder` field. The structure shall be `{ [questionId: string]: number[] }` mapping each question ID to its shuffled option ID array.

#### REQ-PERSIST-03: Restore order on page refresh

**While** a quiz attempt has stored `questionOrder` and `optionOrder` data, **when** the student refreshes or revisits the quiz page, **the system shall** restore the exact same question and option ordering from the stored data instead of computing a new shuffle.

#### REQ-PERSIST-04: Backward compatibility for existing attempts

**If** a `QuizAttempt` has null `questionOrder` or `optionOrder` fields (created before this feature), **then** **the system shall** fall back to displaying questions and options in database order (by `.order` field).

---

### 3.4 Pool Selection Requirements

#### REQ-POOL-01: Pool size database field

The `Quiz` model shall include an optional `poolSize` field of type `Int?` that specifies how many questions to randomly select from the quiz's total question set per attempt.

#### REQ-POOL-02: Question selection at attempt start

**When** a student starts a new quiz attempt **and** `quiz.poolSize` is a positive integer less than the total question count, **the system shall** randomly select exactly `poolSize` questions from the quiz's questions using the Fisher-Yates shuffle (take first N from shuffled array).

#### REQ-POOL-03: Full question set when pool size is null

**While** `quiz.poolSize` is null, zero, or greater than or equal to the total question count, **the system shall** include all questions in the attempt (current default behavior).

#### REQ-POOL-04: Pool selection stored per attempt

**When** pool selection determines a question subset for an attempt, **the system shall** store the selected question IDs in the `QuizAttempt.questionOrder` field. Only the selected questions are included in the order array.

#### REQ-POOL-05: Score calculation based on selected pool

**When** grading an attempt that used pool selection, **the system shall** calculate `maxScore` based on the sum of points for the selected questions only, not the full quiz question set.

---

### 3.5 UI Requirements

#### REQ-UI-01: Pool size configuration input

**Where** the QuizForm includes randomization settings, **the system shall** provide an optional numeric input for `poolSize` with a label indicating "Number of questions per attempt" and a helper text showing the total question count.

#### REQ-UI-02: Pool size validation in form

**When** a teacher enters a pool size value, **the system shall** validate that:
- The value is a positive integer or empty/zero (meaning "use all questions")
- The value does not exceed the total number of questions in the quiz

#### REQ-UI-03: Pool size display on quiz overview

**Where** the quiz overview page displays quiz settings, **the system shall** show the pool size configuration when it is set (e.g., "10 of 20 questions per attempt").

---

### 3.6 i18n Requirements

#### REQ-I18N-01: Translation keys for new UI elements

The system shall provide translation keys in both `en` and `ms` locales for:
- Pool size label and helper text
- Pool size validation error messages
- Quiz overview pool size display text

---

### 3.7 Security Requirements

#### Unwanted Behavior Requirements

- **REQ-SEC-01**: The system shall **not** include the `isCorrect` field of `AnswerOption` in the data sent to the client during quiz taking. The `isCorrect` field shall only be included in the results page data after submission.

- **REQ-SEC-02**: The system shall **not** expose the full question set to the client when pool selection is active. Only the selected subset of questions shall be sent to the quiz-taking client component.

- **REQ-SEC-03**: The system shall **not** include the `questionOrder` or `optionOrder` data in a format that reveals unselected questions or correct answer positions to the client during quiz taking.

---

### 3.8 Performance Requirements

#### Ubiquitous Requirements

- **REQ-PERF-01**: The Fisher-Yates shuffle operation shall complete in under 1ms for arrays of up to 200 elements (typical maximum for quiz questions and options).

- **REQ-PERF-02**: The stored `questionOrder` and `optionOrder` JSON data shall not exceed 10KB per attempt for quizzes with up to 100 questions and 10 options each.

---

## 4. Specifications

### 4.1 Database Changes

#### Quiz Model Addition

```prisma
model Quiz {
  // ... existing fields ...
  poolSize           Int?          // null = use all questions
}
```

#### QuizAttempt Model Additions

```prisma
model QuizAttempt {
  // ... existing fields ...
  questionOrder      Json?         // Array<number> - shuffled question IDs
  optionOrder        Json?         // Record<string, number[]> - per-question option order
}
```

### 4.2 Shuffle Utility

```
src/lib/shuffleUtils.ts
  fisherYatesShuffle<T>(array: T[]): T[]    // Pure function, returns new array
  selectPool<T>(array: T[], count: number): T[]  // Shuffle + take first N
```

### 4.3 Order Persistence Flow

**Attempt Start Flow:**
```
startQuizAttempt(quizId)
  -> Fetch quiz with questions and options
  -> If poolSize: selectPool(questions, poolSize) -> selectedQuestions
  -> If randomizeQuestions: fisherYatesShuffle(selectedQuestions) -> orderedQuestions
  -> If randomizeOptions: for each question, fisherYatesShuffle(options) -> orderedOptions
  -> Store questionOrder = orderedQuestions.map(q => q.id)
  -> Store optionOrder = { [questionId]: orderedOptions.map(o => o.id) }
  -> Return attempt with order data
```

**Quiz Taking Page Flow:**
```
Page render (server component)
  -> Fetch attempt with questionOrder and optionOrder
  -> If questionOrder exists: reorder questions to match stored order
  -> If optionOrder exists: reorder each question's options to match stored order
  -> If null (legacy attempt): fall back to question.order / option.order field sorting
  -> Strip isCorrect from options
  -> Pass to QuizTakingClient
```

**Results Page Flow:**
```
Results render
  -> Fetch attempt with responses, questionOrder
  -> If questionOrder exists: sort responses to match stored question order
  -> If null (legacy): display in database order (current behavior)
  -> Include isCorrect for post-submission display
```

### 4.4 Files Affected

**New files (1):**
- `src/lib/shuffleUtils.ts` -- Fisher-Yates shuffle utility

**Modified files (10):**
- `prisma/schema.prisma` -- Add `poolSize` to Quiz, `questionOrder` and `optionOrder` to QuizAttempt
- `src/components/QuizQuestion.tsx` -- Remove `.sort((a, b) => a.order - b.order)` bug
- `src/app/(dashboard)/list/courses/[id]/quiz/[quizId]/page.tsx` -- Replace shuffle logic, use stored order
- `src/components/QuizResults.tsx` -- Display in stored order
- `src/components/QuizTakingClient.tsx` -- Minor adjustments for order data
- `src/components/forms/QuizForm.tsx` -- Add poolSize input
- `src/lib/formValidationSchemas.ts` -- Add poolSize to quiz schema
- `src/lib/actions.ts` -- Update startQuizAttempt, createQuiz, updateQuiz
- `messages/en.json` -- Add pool size translation keys
- `messages/ms.json` -- Add pool size translation keys

---

## 5. Traceability

| Requirement    | Plan Phase | Acceptance Criteria |
|----------------|------------|---------------------|
| REQ-FIX-01     | Phase 1    | AC-FIX-01           |
| REQ-FIX-02     | Phase 1    | AC-FIX-02           |
| REQ-FIX-03     | Phase 4    | AC-FIX-03           |
| REQ-SHUFFLE-01 | Phase 1    | AC-SHUFFLE-01       |
| REQ-SHUFFLE-02 | Phase 1    | AC-SHUFFLE-02       |
| REQ-SHUFFLE-03 | Phase 1    | AC-SHUFFLE-03       |
| REQ-PERSIST-01 | Phase 2    | AC-PERSIST-01       |
| REQ-PERSIST-02 | Phase 2    | AC-PERSIST-02       |
| REQ-PERSIST-03 | Phase 2    | AC-PERSIST-03       |
| REQ-PERSIST-04 | Phase 2    | AC-PERSIST-04       |
| REQ-POOL-01    | Phase 3    | AC-POOL-01          |
| REQ-POOL-02    | Phase 3    | AC-POOL-02          |
| REQ-POOL-03    | Phase 3    | AC-POOL-03          |
| REQ-POOL-04    | Phase 3    | AC-POOL-04          |
| REQ-POOL-05    | Phase 3    | AC-POOL-05          |
| REQ-UI-01      | Phase 3    | AC-UI-01            |
| REQ-UI-02      | Phase 3    | AC-UI-02            |
| REQ-UI-03      | Phase 4    | AC-UI-03            |
| REQ-I18N-01    | Phase 4    | AC-I18N-01          |
| REQ-SEC-01     | Phase 1    | AC-SEC-01           |
| REQ-SEC-02     | Phase 3    | AC-SEC-02           |
| REQ-SEC-03     | Phase 2    | AC-SEC-03           |
| REQ-PERF-01    | Phase 1    | AC-PERF-01          |
| REQ-PERF-02    | Phase 2    | AC-PERF-02          |

---

## 6. Expert Consultation Recommendations

This SPEC involves frontend component fixes, database schema changes, and security considerations. The following consultations are recommended:

- **expert-backend**: Database migration strategy for adding `Json?` fields to QuizAttempt, server action refactoring for order persistence, pool selection query optimization.
- **expert-frontend**: QuizQuestion component fix verification, QuizResults order restoration, QuizForm pool size input UX.
- **expert-security**: Verification that `isCorrect` is never leaked to the client during quiz taking, especially with the new order persistence data structures.

---

## 7. Implementation Notes

### 7.1 Implementation Summary

All 24 requirements across 8 categories implemented successfully via DDD methodology (ANALYZE-PRESERVE-IMPROVE). Commit: `1bdac03`.

### 7.2 Files Created (3)

| File | Purpose |
|------|---------|
| `src/lib/shuffleUtils.ts` | Fisher-Yates shuffle and pool selection utilities |
| `src/lib/__tests__/quizUtils.test.ts` | Characterization tests for grading order-independence (10 tests) |
| `src/lib/__tests__/shuffleUtils.test.ts` | Shuffle utility unit tests (15 tests) |

### 7.3 Files Modified (15)

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Added `poolSize Int?` to Quiz, `questionOrder Json?` and `optionOrder Json?` to QuizAttempt |
| `prisma/migrations/manual/quiz_randomization_and_pool_selection.sql` | Manual migration SQL for new columns |
| `src/components/QuizQuestion.tsx` | Removed `.sort()` bug, removed `order` from option type |
| `src/components/QuizTakingClient.tsx` | Removed `order` from option type |
| `src/components/QuizResults.tsx` | Display questions in stored attempt order using Map-based O(n) reordering |
| `src/components/forms/QuizForm.tsx` | Added poolSize input field with helper text |
| `src/app/(dashboard)/list/courses/[id]/quiz/[quizId]/page.tsx` | Fisher-Yates shuffle, order restoration, pool size display, FILL_IN_BLANK handling |
| `src/app/(dashboard)/list/courses/[id]/quiz/[quizId]/results/page.tsx` | Passes questionOrder to QuizResults |
| `src/lib/actions.ts` | Updated startQuizAttempt (pool selection, order storage), submitQuizAttempt (pool-aware grading), createQuiz/updateQuiz (poolSize) |
| `src/lib/formValidationSchemas.ts` | Added poolSize field to QuizSchema |
| `messages/en.json` | Added pool size i18n keys |
| `messages/ms.json` | Added pool size i18n keys (Malay) |
| `package.json` | Added vitest dependency and test scripts |
| `package-lock.json` | Updated lockfile |
| `vitest.config.ts` | New Vitest configuration |

### 7.4 Scope Divergences from Plan

| Type | Description |
|------|-------------|
| Added | `vitest.config.ts` - Test framework configuration (not in original plan, needed for testing) |
| Added | `package.json` vitest dependency (prerequisite for tests) |
| Added | Test files (quizUtils.test.ts, shuffleUtils.test.ts) - DDD characterization tests |
| Added | Manual migration SQL file instead of `prisma migrate dev` (operational decision) |
| Combined | Phases 2+3 database migrations merged into single migration |
| Handled | FILL_IN_BLANK questions skip option randomization (edge case from Phase 4.3) |

### 7.5 Deployment Prerequisites

- Run manual migration: `prisma/migrations/manual/quiz_randomization_and_pool_selection.sql`
- Run `npx prisma generate` after migration to update Prisma client
- All new database fields are nullable -- zero risk to existing data

### 7.6 Test Coverage

- 25 tests total (10 characterization + 15 unit)
- gradeQuizAttempt order-independence verified
- Fisher-Yates uniformity, immutability, and edge cases covered
- Pool selection count and boundary conditions tested
