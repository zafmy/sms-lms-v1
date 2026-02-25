# SPEC-QUIZ-002: Implementation Plan

## Question Randomization -- Bug Fixes, Shuffle Persistence, and Pool Selection

**SPEC ID:** SPEC-QUIZ-002
**Status:** Planned
**Priority:** High
**Development Mode:** DDD (ANALYZE-PRESERVE-IMPROVE)

---

## 1. Technology Decisions

### Core Approach

No new dependencies are required. All changes use existing project infrastructure (Prisma, Zod, React Hook Form, Next.js Server Components).

### Key Design Decisions

1. **Shuffle algorithm:** Fisher-Yates (Knuth) shuffle implemented as a pure utility function. Returns new array, never mutates input.
2. **Order persistence:** Store shuffled order as Prisma `Json?` fields on `QuizAttempt`. PostgreSQL `jsonb` type is compact and queryable.
3. **Pool selection timing:** Questions are selected and order is determined at attempt start (`startQuizAttempt`), not at page render. This ensures consistency across page refreshes.
4. **Backward compatibility:** Null `questionOrder`/`optionOrder` falls back to `.order` field sorting (current behavior for legacy attempts).
5. **Security model:** Strip `isCorrect` from options at the server component level before passing to client. Pool selection only sends the selected subset.

---

## 2. Implementation Phases

### Phase 1: Bug Fixes and Shuffle Utility

**Goal:** Fix the three existing bugs and create the Fisher-Yates shuffle utility.

**Priority:** Primary Goal

#### Task 1.1: Create Fisher-Yates Shuffle Utility

**Files created:**
- `src/lib/shuffleUtils.ts`

**Functions:**

```typescript
/**
 * Fisher-Yates (Knuth) shuffle. Returns a new array with elements in random order.
 * Does not mutate the input array.
 */
export function fisherYatesShuffle<T>(array: readonly T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Select a random pool of `count` items from `array`.
 * Returns the selected items in random order.
 */
export function selectPool<T>(array: readonly T[], count: number): T[] {
  const shuffled = fisherYatesShuffle(array);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
```

**Complexity:** Low

---

#### Task 1.2: Fix Option Re-Sort Bug in QuizQuestion

**Files modified:**
- `src/components/QuizQuestion.tsx`

**Changes:**

Remove the `.sort((a, b) => a.order - b.order)` call on line 44. Options should render in the order they are received from the server.

**Before (line 43-44):**
```typescript
{question.options
  .sort((a, b) => a.order - b.order)
  .map((option) => (
```

**After:**
```typescript
{question.options
  .map((option) => (
```

Also remove the `order` property from the `QuizQuestionProps` options type since it is no longer needed by this component.

**Complexity:** Low

**Risk:** None. The server component is responsible for ordering. The client component should render in received order.

---

#### Task 1.3: Replace Biased Shuffle in Quiz Page

**Files modified:**
- `src/app/(dashboard)/list/courses/[id]/quiz/[quizId]/page.tsx`

**Changes:**

Replace the biased `sort(() => Math.random() - 0.5)` calls (lines 183 and 189) with `fisherYatesShuffle` from the new utility.

**Before (lines 182-189):**
```typescript
if (quiz.randomizeQuestions) {
  preparedQuestions = preparedQuestions.sort(() => Math.random() - 0.5);
}
// ...
if (quiz.randomizeOptions) {
  options = options.sort(() => Math.random() - 0.5);
}
```

**After:**
```typescript
import { fisherYatesShuffle } from "@/lib/shuffleUtils";

if (quiz.randomizeQuestions) {
  preparedQuestions = fisherYatesShuffle(preparedQuestions);
}
// ...
if (quiz.randomizeOptions) {
  options = fisherYatesShuffle(options);
}
```

**Complexity:** Low

---

#### Task 1.4: Verify isCorrect is Not Leaked to Client

**Files modified:**
- `src/app/(dashboard)/list/courses/[id]/quiz/[quizId]/page.tsx`

**Changes:**

Verify that the `questionsForClient` mapping (lines 191-198) does NOT include `isCorrect` in the options. Currently it passes the full option object -- ensure `isCorrect` is stripped:

```typescript
return {
  id: q.id,
  text: q.text,
  type: q.type,
  points: q.points,
  options: options.map(o => ({
    id: o.id,
    text: o.text,
    // isCorrect intentionally omitted
  })),
};
```

**Complexity:** Low

---

### Phase 2: Shuffle Persistence

**Goal:** Store shuffled order per attempt and restore it on page refresh.

**Priority:** Primary Goal

#### Task 2.1: Database Schema Migration

**Files modified:**
- `prisma/schema.prisma`

**Changes:**

Add fields to `QuizAttempt`:

```prisma
model QuizAttempt {
  // ... existing fields ...
  questionOrder      Json?    // Array<number> - ordered question IDs for this attempt
  optionOrder        Json?    // Record<string, number[]> - per-question ordered option IDs
}
```

**Migration command:** `npx prisma migrate dev --name add-quiz-attempt-order-fields`

**Complexity:** Low

**Risk:** This adds nullable columns, which is always safe for existing data. Existing attempts will have null values and fall back to the `.order` field sorting.

---

#### Task 2.2: Compute and Store Order at Attempt Start

**Files modified:**
- `src/lib/actions.ts` (startQuizAttempt function, line ~2411)

**Changes:**

After creating the `QuizAttempt` record, compute and store the shuffled order:

1. Fetch quiz questions with options (already done in the function)
2. If `randomizeQuestions`: shuffle question array with Fisher-Yates
3. If `randomizeOptions`: for each question, shuffle its options with Fisher-Yates
4. Store `questionOrder` as `questions.map(q => q.id)` (the order of question IDs)
5. Store `optionOrder` as `{ [questionId]: question.options.map(o => o.id) }` (per-question option ID order)
6. Update the attempt record with the computed order via `prisma.quizAttempt.update`

```typescript
import { fisherYatesShuffle } from "@/lib/shuffleUtils";

// After creating the attempt...
let orderedQuestions = [...quiz.questions];
if (quiz.randomizeQuestions) {
  orderedQuestions = fisherYatesShuffle(orderedQuestions);
}

const optionOrderMap: Record<string, number[]> = {};
for (const q of orderedQuestions) {
  let orderedOptions = [...q.options];
  if (quiz.randomizeOptions) {
    orderedOptions = fisherYatesShuffle(orderedOptions);
  }
  optionOrderMap[String(q.id)] = orderedOptions.map(o => o.id);
}

await prisma.quizAttempt.update({
  where: { id: attempt.id },
  data: {
    questionOrder: orderedQuestions.map(q => q.id),
    optionOrder: optionOrderMap,
  },
});
```

**Complexity:** Medium

---

#### Task 2.3: Restore Stored Order on Quiz Page

**Files modified:**
- `src/app/(dashboard)/list/courses/[id]/quiz/[quizId]/page.tsx`

**Changes:**

Replace the current shuffle-on-every-render logic with order restoration from the attempt:

1. Fetch the current attempt's `questionOrder` and `optionOrder` fields
2. If `questionOrder` exists: reorder the questions array to match the stored ID order
3. If `optionOrder` exists: for each question, reorder its options to match the stored order
4. If either is null (legacy attempt): fall back to current behavior (shuffle on render, or use `.order` field)

```typescript
function reorderByIds<T extends { id: number }>(items: T[], order: number[]): T[] {
  const itemMap = new Map(items.map(item => [item.id, item]));
  return order.map(id => itemMap.get(id)).filter(Boolean) as T[];
}

// In the page component:
if (currentAttempt.questionOrder) {
  preparedQuestions = reorderByIds(quiz.questions, currentAttempt.questionOrder as number[]);
} else if (quiz.randomizeQuestions) {
  preparedQuestions = fisherYatesShuffle(preparedQuestions);
  // Optionally store this order (backfill)
}

const questionsForClient = preparedQuestions.map((q) => {
  let options = [...q.options];
  const storedOptionOrder = (currentAttempt.optionOrder as Record<string, number[]>)?.[String(q.id)];
  if (storedOptionOrder) {
    options = reorderByIds(options, storedOptionOrder);
  } else if (quiz.randomizeOptions) {
    options = fisherYatesShuffle(options);
  }
  return {
    id: q.id,
    text: q.text,
    type: q.type,
    points: q.points,
    options: options.map(o => ({ id: o.id, text: o.text })),
  };
});
```

**Complexity:** Medium

---

#### Task 2.4: Update QuizResults to Use Stored Order

**Files modified:**
- `src/components/QuizResults.tsx`

**Changes:**

The results component receives attempt data including responses. To display questions in the order the student saw them:

1. Accept `questionOrder` as an optional prop (or include it in the attempt data)
2. If `questionOrder` exists: sort `attempt.responses` to match the stored question ID order
3. If null: render in current order (backward compatible)

```typescript
// Sort responses by stored question order
const orderedResponses = attempt.questionOrder
  ? (attempt.questionOrder as number[]).map(
      (qId) => attempt.responses.find(r => r.question.id === qId)
    ).filter(Boolean)
  : attempt.responses;
```

**Complexity:** Medium

---

### Phase 3: Pool Selection

**Goal:** Allow teachers to configure "pick N from M" questions per quiz attempt.

**Priority:** Secondary Goal

#### Task 3.1: Add poolSize to Database Schema

**Files modified:**
- `prisma/schema.prisma`

**Changes:**

Add `poolSize` field to `Quiz` model:

```prisma
model Quiz {
  // ... existing fields ...
  poolSize           Int?          // null = use all questions
}
```

**Note:** This can be combined with the Phase 2 migration if implemented together.

**Migration command:** `npx prisma migrate dev --name add-quiz-pool-size`

**Complexity:** Low

---

#### Task 3.2: Update Quiz Validation Schema

**Files modified:**
- `src/lib/formValidationSchemas.ts`

**Changes:**

Add `poolSize` to the quiz schema:

```typescript
poolSize: z.coerce.number().int().min(0).optional().nullable()
  .transform(val => (val === 0 ? null : val)),
```

**Complexity:** Low

---

#### Task 3.3: Update QuizForm UI

**Files modified:**
- `src/components/forms/QuizForm.tsx`

**Changes:**

Add a numeric input for pool size in the quiz configuration section, near the randomize checkboxes:

1. Add an `InputField` for `poolSize` with type "number"
2. Add helper text showing total question count (when editing) or a note about adding questions first (when creating)
3. Validate that poolSize does not exceed total question count

**Complexity:** Medium

---

#### Task 3.4: Update Quiz Server Actions

**Files modified:**
- `src/lib/actions.ts`

**Changes:**

1. In `createQuiz`: include `poolSize` in the Prisma create data
2. In `updateQuiz`: include `poolSize` in the Prisma update data
3. In `startQuizAttempt`: add pool selection logic before computing order

```typescript
// In startQuizAttempt, after fetching quiz:
let questionsForAttempt = [...quiz.questions];

if (quiz.poolSize && quiz.poolSize > 0 && quiz.poolSize < questionsForAttempt.length) {
  questionsForAttempt = selectPool(questionsForAttempt, quiz.poolSize);
}

// Then apply randomizeQuestions if enabled...
if (quiz.randomizeQuestions) {
  questionsForAttempt = fisherYatesShuffle(questionsForAttempt);
}
```

4. Update `maxScore` calculation: if pool selection is active, `maxScore` = sum of points for selected questions only

**Complexity:** Medium

---

### Phase 4: Polish

**Goal:** i18n, results page improvements, edge cases, and analytics considerations.

**Priority:** Final Goal

#### Task 4.1: Add i18n Translation Keys

**Files modified:**
- `messages/en.json`
- `messages/ms.json`

**Changes:**

Add translation keys for pool size UI:

```json
{
  "lms": {
    "quizzes": {
      "poolSize": "Questions per attempt",
      "poolSizeHelper": "Leave empty to use all questions",
      "poolSizeDisplay": "{count} of {total} questions per attempt",
      "poolSizeError": "Pool size must not exceed total question count"
    }
  }
}
```

**Complexity:** Low

---

#### Task 4.2: Update Quiz Overview Display

**Files modified:**
- `src/app/(dashboard)/list/courses/[id]/quiz/[quizId]/page.tsx`

**Changes:**

In the quiz overview section (before starting an attempt), display the pool size configuration:
- Show "10 of 20 questions per attempt" when poolSize is set
- Show total question count when poolSize is not set

**Complexity:** Low

---

#### Task 4.3: Edge Case Handling

**Files modified:**
- `src/lib/actions.ts`
- `src/app/(dashboard)/list/courses/[id]/quiz/[quizId]/page.tsx`

**Edge cases:**

1. **poolSize > total questions**: Treat as "use all questions" (already handled by REQ-POOL-03)
2. **poolSize = 0**: Treat as "use all questions" (transform in schema)
3. **Quiz with 0 questions + pool selection**: Prevent attempt start, show error
4. **Teacher reduces question count below poolSize**: Validation in updateQuiz should handle this (cap poolSize or warn)
5. **Fill-in-blank questions with randomizeOptions**: No options to randomize; skip option randomization for FILL_IN_BLANK type

**Complexity:** Low

---

## 3. Dependencies Graph

```
Phase 1 (Bug Fixes + Shuffle Utility)
  Task 1.1 (Shuffle utility)           -- no dependency
  Task 1.2 (Fix option re-sort)        -- no dependency
  Task 1.3 (Replace biased shuffle)    -- depends on 1.1
  Task 1.4 (Verify isCorrect)          -- no dependency

Phase 2 (Shuffle Persistence)           -- depends on Phase 1
  Task 2.1 (DB migration)              -- no dependency
  Task 2.2 (Store order at start)      -- depends on 1.1, 2.1
  Task 2.3 (Restore order on page)     -- depends on 2.1, 2.2
  Task 2.4 (Results in stored order)   -- depends on 2.1

Phase 3 (Pool Selection)                -- depends on Phase 1, Phase 2
  Task 3.1 (DB migration)              -- can combine with 2.1
  Task 3.2 (Validation schema)         -- no dependency
  Task 3.3 (QuizForm UI)              -- depends on 3.2
  Task 3.4 (Server actions)           -- depends on 1.1, 3.1

Phase 4 (Polish)                        -- depends on Phase 1-3
  Task 4.1 (i18n)                     -- no dependency
  Task 4.2 (Quiz overview)            -- depends on 3.1
  Task 4.3 (Edge cases)              -- depends on 3.4
```

**Parallelization:** Tasks 1.1, 1.2, and 1.4 are independent and can be implemented in parallel. Phase 2 and Phase 3 database migrations can be combined into a single migration.

---

## 4. Risk Analysis

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Existing attempts break with new fields** | Low | Medium | New fields are nullable. Null values trigger graceful fallback to `.order` field sorting. |
| **Pool selection creates unfair scoring** | Medium | Medium | Score is always relative to presented questions. `maxScore` reflects only the selected pool. |
| **Large JSON in questionOrder/optionOrder** | Low | Low | For 100 questions with 10 options each, JSON is under 5KB. Well within PostgreSQL limits. |
| **Fisher-Yates randomness concerns** | Low | Low | `Math.random()` provides sufficient entropy for educational assessments. Cryptographic randomness is not required. |
| **Spaced repetition regression** | Low | High | Review card generation uses `questionId`, not position. Verify with test that review cards are still created correctly for pool-selected quizzes. |
| **Migration fails on production** | Low | Medium | All new fields are nullable with no constraints. Migration is purely additive. Review SQL before applying. |

---

## 5. Files Summary

### New Files (1)

| File | Type | Purpose |
|------|------|---------|
| `src/lib/shuffleUtils.ts` | Utility | Fisher-Yates shuffle and pool selection functions |

### Modified Files (10)

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `poolSize Int?` to Quiz; add `questionOrder Json?`, `optionOrder Json?` to QuizAttempt |
| `src/components/QuizQuestion.tsx` | Remove `.sort((a, b) => a.order - b.order)` bug |
| `src/app/(dashboard)/list/courses/[id]/quiz/[quizId]/page.tsx` | Replace biased shuffle, restore stored order, strip isCorrect, show pool size |
| `src/components/QuizResults.tsx` | Display questions in stored order |
| `src/components/QuizTakingClient.tsx` | Remove `order` from option type |
| `src/components/forms/QuizForm.tsx` | Add poolSize input field |
| `src/lib/formValidationSchemas.ts` | Add poolSize to quiz schema |
| `src/lib/actions.ts` | Update startQuizAttempt (store order, pool selection), createQuiz/updateQuiz (poolSize) |
| `messages/en.json` | Add pool size and related translation keys |
| `messages/ms.json` | Add pool size and related translation keys |

**Total files affected:** 11 (1 new + 10 modified)

---

## 6. Testing Strategy

### Unit Tests

| Test | Scope |
|------|-------|
| `shuffleUtils.test.ts` | Fisher-Yates produces all permutations with approximately equal probability (chi-squared test over many runs), selectPool returns correct count, immutability verification |
| Validation schema tests | Verify poolSize accepts valid values, rejects invalid values, transforms 0 to null |

### Integration Tests

| Test | Scope |
|------|-------|
| startQuizAttempt with randomization | Verify questionOrder and optionOrder are stored in the attempt record |
| startQuizAttempt with pool selection | Verify only poolSize questions are selected, maxScore reflects selected questions |
| Quiz page order restoration | Verify page uses stored order instead of computing new shuffle |

### End-to-End Scenarios

| Scenario | Steps |
|----------|-------|
| Option randomization works | Teacher enables randomizeOptions, student takes quiz, options are NOT in .order field order |
| Question order persists | Student starts quiz with randomizeQuestions, refreshes page, question order is the same |
| Pool selection | Teacher creates quiz with 20 questions, sets poolSize to 10. Student sees exactly 10 questions. Different attempts may show different questions. |
| Results show correct order | Student takes randomized quiz, views results, questions appear in the order they saw them |
| Security: isCorrect not leaked | Inspect client-side data during quiz taking, verify no isCorrect field in options |

---

## 7. Expert Consultation Recommendations

- **expert-backend:** Database migration strategy for `Json?` fields, `startQuizAttempt` refactoring, pool selection query and scoring logic.
- **expert-frontend:** QuizQuestion component fix, QuizResults order restoration, QuizForm pool size input with validation UX.
- **expert-security:** Verification that `isCorrect` is stripped from client data, pool selection does not leak unselected questions.

---

## 8. Milestone Summary

| Milestone | Phases | Deliverable |
|-----------|--------|-------------|
| **Primary Goal** | Phase 1 + Phase 2 | All bugs fixed, Fisher-Yates shuffle, order persistence working |
| **Secondary Goal** | Phase 3 | Pool selection feature with teacher UI |
| **Final Goal** | Phase 4 | i18n, quiz overview display, edge case handling |
