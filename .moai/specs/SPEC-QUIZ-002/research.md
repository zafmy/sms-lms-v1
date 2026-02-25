# SPEC-QUIZ-002 Research: Question Randomization

## Research Summary

Deep codebase analysis of the quiz randomization system, identifying existing infrastructure, bugs, and gaps for the pool selection feature.

---

## Existing Infrastructure

### 1. Database Schema (Quiz Model)

| Aspect | Detail |
|--------|--------|
| **Model** | `Quiz` (prisma/schema.prisma:345-360) |
| **Fields** | `randomizeQuestions Boolean @default(false)`, `randomizeOptions Boolean @default(false)` |
| **Related** | `questions Question[]`, `attempts QuizAttempt[]` |
| **Missing** | No `poolSize` field for "pick N from M" functionality |

### 2. Question Model

| Aspect | Detail |
|--------|--------|
| **Model** | `Question` (prisma/schema.prisma:362-376) |
| **Key Fields** | `order Int` (persistent ordering), `quizId Int?`, `questionBankId Int?` |
| **Relation** | Belongs to `Quiz?` and `QuestionBank?` (dual ownership) |
| **Options** | `AnswerOption[]` with `order Int` field |

### 3. QuestionBank Model

| Aspect | Detail |
|--------|--------|
| **Model** | `QuestionBank` (prisma/schema.prisma:378-388) |
| **Fields** | `name`, `description`, `subjectId`, `teacherId`, `questions Question[]` |
| **Status** | Exists in schema but NOT connected to quizzes for pool selection |
| **Gap** | No mechanism to pull questions from bank into a quiz attempt |

### 4. QuizAttempt Model

| Aspect | Detail |
|--------|--------|
| **Model** | `QuizAttempt` (prisma/schema.prisma:399-413) |
| **Fields** | `attemptNumber`, `startedAt`, `submittedAt`, `score`, `maxScore`, `percentage`, `passed`, `studentId`, `quizId` |
| **Missing** | No `questionOrder` or `optionOrder` field to persist shuffled order |
| **Responses** | `QuestionResponse[]` stores per-question answers |

### 5. QuestionResponse Model

| Aspect | Detail |
|--------|--------|
| **Model** | `QuestionResponse` (prisma/schema.prisma:415-426) |
| **Fields** | `selectedOptionId`, `textResponse`, `isCorrect`, `pointsEarned`, `timeTakenSeconds`, `questionId`, `attemptId` |
| **Note** | Stores which question was answered but NOT the order it was presented in |

---

## Current Randomization Implementation

### Server-Side Shuffle (Quiz Taking Page)

**File:** `src/app/(dashboard)/list/courses/[id]/quiz/[quizId]/page.tsx:180-198`

```typescript
// Prepare questions (randomize if needed)
let preparedQuestions = [...quiz.questions];
if (quiz.randomizeQuestions) {
  preparedQuestions = preparedQuestions.sort(() => Math.random() - 0.5);
}

const questionsForClient = preparedQuestions.map((q) => {
  let options = [...q.options];
  if (quiz.randomizeOptions) {
    options = options.sort(() => Math.random() - 0.5);
  }
  return {
    id: q.id,
    text: q.text,
    type: q.type,
    points: q.points,
    options,
  };
});
```

**Issues identified:**
1. Uses `Math.random() - 0.5` for sorting -- biased, non-uniform distribution (not Fisher-Yates)
2. Shuffle happens on every server render -- page refresh produces a new question order for in-progress attempts
3. No persistence of shuffled order -- the order is ephemeral and lost between renders

### Client-Side Re-Sort Bug (QuizQuestion Component)

**File:** `src/components/QuizQuestion.tsx:43-44`

```typescript
{question.options
  .sort((a, b) => a.order - b.order)
  .map((option) => (
```

**Bug:** Even though the server shuffles options when `randomizeOptions` is true, the client component **always** re-sorts options by their `.order` field. This completely undoes the server-side option randomization. The `randomizeOptions` feature is effectively broken.

### Quiz Taking Client Component

**File:** `src/components/QuizTakingClient.tsx`

- Receives `questions` array as props from the server page component
- Maintains `currentIndex` and `answers` in local state
- Does NOT persist the question order -- a page refresh triggers a new server render with a new random order
- Does NOT strip the `order` field from options before passing to `QuizQuestion`

### Quiz Results Display

**File:** `src/components/QuizResults.tsx:78`

```typescript
{attempt.responses.map((response, index) => {
```

- Iterates over `attempt.responses` in database order (insertion order)
- Displays questions as "Q1, Q2, Q3..." based on array index
- Does NOT reflect the randomized order the student actually saw
- Student sees questions in one order during the quiz, but a different order on the results page

---

## Form & Validation Infrastructure

### QuizForm

**File:** `src/components/forms/QuizForm.tsx:165-181`

- Already has checkbox inputs for `randomizeQuestions` and `randomizeOptions`
- Uses `register("randomizeQuestions")` and `register("randomizeOptions")`
- Both fields have `defaultChecked={data?.randomizeQuestions}` / `data?.randomizeOptions`
- No pool size configuration UI exists

### Validation Schema

**File:** `src/lib/formValidationSchemas.ts:257-258`

```typescript
randomizeQuestions: z.coerce.boolean().default(false),
randomizeOptions: z.coerce.boolean().default(false),
```

- Schema correctly handles boolean coercion from form checkboxes
- No `poolSize` field in schema

### Server Actions

**File:** `src/lib/actions.ts`

- `createQuiz` (line ~2093): Stores `randomizeQuestions` and `randomizeOptions` fields
- `updateQuiz` (line ~2134): Updates both randomize fields
- `startQuizAttempt` (line 2411): Creates `QuizAttempt` record -- does NOT store question order
- `submitQuizAttempt` (line 2463): Calls `gradeQuizAttempt` from `quizUtils.ts`, then triggers `generateReviewCardsFromQuiz` for spaced repetition

### Grading and Spaced Repetition

**File:** `src/lib/quizUtils.ts`

- `gradeQuizAttempt` receives questions and responses, grades by matching `selectedOptionId`
- Grading is order-independent (matches by questionId/optionId, not by position)
- **No impact from randomization** -- grading will continue to work correctly with shuffled orders

**File:** `src/lib/reviewActions.ts`

- `generateReviewCardsFromQuiz` creates spaced repetition review cards for incorrect answers
- Uses `questionId` to create review cards, not position-based
- **No impact from randomization** -- review cards reference questions by ID

---

## i18n Keys

**File:** `messages/en.json:269-270`

```json
"randomizeQuestions": "Randomize Questions",
"randomizeOptions": "Randomize Options"
```

**File:** `messages/ms.json:269-270`

```json
"randomizeQuestions": "Rawakkan Soalan",
"randomizeOptions": "Rawakkan Pilihan"
```

- Translation keys exist for current randomize toggles
- No keys exist for pool size configuration

---

## Bug Summary

| # | Bug | Location | Severity | Root Cause |
|---|-----|----------|----------|------------|
| 1 | `randomizeOptions` is completely broken | `QuizQuestion.tsx:44` | High | Client re-sorts by `.order` field, undoing server shuffle |
| 2 | Biased shuffle algorithm | `quiz/[quizId]/page.tsx:183,189` | Medium | Uses `Math.random() - 0.5` sort instead of Fisher-Yates |
| 3 | No shuffle persistence | `quiz/[quizId]/page.tsx:180-198` | Medium | Shuffle computed on every server render, lost on refresh |
| 4 | Results page order mismatch | `QuizResults.tsx:78` | Low | Results display in DB order, not the order student saw |

---

## Files Affected

### Files to Modify

| File | Change Needed |
|------|---------------|
| `prisma/schema.prisma` | Add `poolSize Int?` to Quiz, add `questionOrder Json?` and `optionOrder Json?` to QuizAttempt |
| `src/components/QuizQuestion.tsx` | Remove `.sort((a, b) => a.order - b.order)` re-sort bug |
| `src/app/(dashboard)/list/courses/[id]/quiz/[quizId]/page.tsx` | Replace biased shuffle with Fisher-Yates, persist order, restore order on refresh |
| `src/components/QuizResults.tsx` | Display questions in the order student saw them (from stored order) |
| `src/components/QuizTakingClient.tsx` | May need to accept/forward persisted order data |
| `src/components/forms/QuizForm.tsx` | Add pool size input field |
| `src/lib/formValidationSchemas.ts` | Add `poolSize` to quiz schema |
| `src/lib/actions.ts` | Update `createQuiz`, `updateQuiz` for `poolSize`; update `startQuizAttempt` to store order and select pool |
| `messages/en.json` | Add pool size translation keys |
| `messages/ms.json` | Add pool size translation keys |

### New Files

| File | Purpose |
|------|---------|
| `src/lib/shuffleUtils.ts` | Fisher-Yates shuffle utility, seeded RNG |

---

## Recommendations

1. **Immediate bug fix**: Remove the `.sort((a, b) => a.order - b.order)` in `QuizQuestion.tsx` to unblock option randomization
2. **Replace shuffle algorithm**: Implement Fisher-Yates in a utility module for uniform distribution
3. **Persist order**: Store shuffled question/option order as JSON in `QuizAttempt` so refresh restores the same order
4. **Pool selection**: Add `poolSize` field to Quiz model; at attempt start, randomly select N questions from the quiz's total questions
5. **Results alignment**: Use stored order from `QuizAttempt` to display questions in the correct order on the results page
6. **Security**: Ensure the client never receives `isCorrect` field on options during quiz taking -- only after submission
