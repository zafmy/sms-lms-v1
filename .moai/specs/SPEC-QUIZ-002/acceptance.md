---
id: SPEC-QUIZ-002
document: acceptance
version: "1.0.0"
created: 2026-02-25
updated: 2026-02-25
author: ZaF
---

# SPEC-QUIZ-002: Acceptance Criteria

## Table of Contents

1. [Bug Fix Scenarios](#1-bug-fix-scenarios)
2. [Shuffle Algorithm Scenarios](#2-shuffle-algorithm-scenarios)
3. [Persistence Scenarios](#3-persistence-scenarios)
4. [Pool Selection Scenarios](#4-pool-selection-scenarios)
5. [UI Configuration Scenarios](#5-ui-configuration-scenarios)
6. [Results Display Scenarios](#6-results-display-scenarios)
7. [Security Scenarios](#7-security-scenarios)
8. [Performance Criteria](#8-performance-criteria)
9. [Backward Compatibility Scenarios](#9-backward-compatibility-scenarios)
10. [i18n Scenarios](#10-i18n-scenarios)
11. [Spaced Repetition Integration Scenarios](#11-spaced-repetition-integration-scenarios)
12. [Quality Gate Criteria](#12-quality-gate-criteria)

---

## 1. Bug Fix Scenarios

### AC-FIX-01: Option randomization works correctly

```gherkin
Scenario: Options render in server-provided order, not re-sorted by .order field
  Given a quiz has randomizeOptions set to true
  And a question has options with order values [1, 2, 3, 4]
  And the server shuffles the options to order [3, 1, 4, 2]
  When the QuizQuestion component renders the options
  Then the options are displayed in the server-provided order [3, 1, 4, 2]
  And the options are NOT re-sorted by the .order field

Scenario: Options render in original order when randomization is disabled
  Given a quiz has randomizeOptions set to false
  And a question has options with order values [1, 2, 3, 4]
  When the QuizQuestion component renders the options
  Then the options are displayed in the order received from the server
```

### AC-FIX-02: Fisher-Yates shuffle produces uniform distribution

```gherkin
Scenario: Shuffle algorithm produces approximately uniform distribution
  Given an array of 4 elements [A, B, C, D]
  When the fisherYatesShuffle function is called 10,000 times
  Then each of the 24 possible permutations appears approximately 416 times
  And no permutation appears more than 550 times or fewer than 300 times
  And the original array is not mutated
```

### AC-FIX-03: Results display in the order student saw questions

```gherkin
Scenario: Results page shows questions in attempt order
  Given a student completed a quiz with randomizeQuestions enabled
  And the stored questionOrder is [5, 2, 8, 1, 3]
  When the student views the results page
  Then question with id 5 is displayed as "Q1"
  And question with id 2 is displayed as "Q2"
  And question with id 8 is displayed as "Q3"
  And question with id 1 is displayed as "Q4"
  And question with id 3 is displayed as "Q5"
```

---

## 2. Shuffle Algorithm Scenarios

### AC-SHUFFLE-01: Fisher-Yates utility function

```gherkin
Scenario: fisherYatesShuffle returns a new array
  Given an array [1, 2, 3, 4, 5]
  When fisherYatesShuffle is called with the array
  Then a new array is returned
  And the original array is unchanged (still [1, 2, 3, 4, 5])
  And the returned array contains exactly the same elements

Scenario: fisherYatesShuffle handles edge cases
  Given an empty array []
  When fisherYatesShuffle is called
  Then an empty array is returned

  Given an array with one element [42]
  When fisherYatesShuffle is called
  Then [42] is returned
```

### AC-SHUFFLE-02: Question order is shuffled when enabled

```gherkin
Scenario: Questions are shuffled when randomizeQuestions is true
  Given a quiz with randomizeQuestions set to true
  And the quiz has 10 questions with order values [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  When a student starts a new attempt
  Then the questions are presented in a shuffled order
  And the shuffled order is different from [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] (with high probability)
```

### AC-SHUFFLE-03: Option order is shuffled when enabled

```gherkin
Scenario: Options are shuffled independently per question
  Given a quiz with randomizeOptions set to true
  And each question has 4 options
  When a student starts a new attempt
  Then each question's options are presented in a shuffled order
  And the shuffle is independent per question (different questions can have different option orders)
  And the options are NOT re-sorted by the .order field on the client
```

---

## 3. Persistence Scenarios

### AC-PERSIST-01: Question order is stored per attempt

```gherkin
Scenario: questionOrder is saved to QuizAttempt on attempt start
  Given a quiz with randomizeQuestions set to true and 5 questions
  When a student starts a new quiz attempt
  Then the QuizAttempt record contains a questionOrder field
  And the questionOrder field is a JSON array of 5 question IDs
  And the array contains each question ID exactly once
```

### AC-PERSIST-02: Option order is stored per attempt

```gherkin
Scenario: optionOrder is saved to QuizAttempt on attempt start
  Given a quiz with randomizeOptions set to true
  And question 1 has options [A, B, C, D] and question 2 has options [X, Y, Z]
  When a student starts a new quiz attempt
  Then the QuizAttempt record contains an optionOrder field
  And the optionOrder field is a JSON object
  And the object has a key for question 1 with an array of 4 option IDs
  And the object has a key for question 2 with an array of 3 option IDs
```

### AC-PERSIST-03: Order is restored on page refresh

```gherkin
Scenario: Refreshing the quiz page preserves question order
  Given a student has an in-progress quiz attempt
  And the stored questionOrder is [5, 2, 8, 1, 3]
  And the stored optionOrder maps question 5 to [12, 10, 11, 13]
  When the student refreshes the browser page
  Then the questions are displayed in order [5, 2, 8, 1, 3]
  And question 5's options are displayed in order [12, 10, 11, 13]
  And no new random shuffle is computed

Scenario: Navigating away and returning preserves order
  Given a student has an in-progress quiz attempt with stored order
  When the student navigates to another page
  And the student returns to the quiz page
  Then the question and option order matches the stored order exactly
```

### AC-PERSIST-04: Legacy attempts use fallback ordering

```gherkin
Scenario: Attempt created before order persistence feature
  Given a QuizAttempt record exists with questionOrder set to null
  And optionOrder set to null
  When the student views this attempt
  Then questions are displayed in database order (by question.order field)
  And options are displayed in database order (by option.order field)
  And no error is thrown
```

---

## 4. Pool Selection Scenarios

### AC-POOL-01: Pool size field exists in database

```gherkin
Scenario: Quiz model includes poolSize field
  Given the database migration has been applied
  When a quiz is created with poolSize set to 10
  Then the quiz record in the database has poolSize equal to 10

Scenario: poolSize is nullable
  Given a quiz is created without specifying poolSize
  Then the quiz record in the database has poolSize equal to null
```

### AC-POOL-02: Pool selection at attempt start

```gherkin
Scenario: Student receives a subset of questions when pool size is set
  Given a quiz has 20 questions
  And poolSize is set to 10
  When a student starts a new quiz attempt
  Then exactly 10 questions are selected for the attempt
  And the selected question IDs are stored in questionOrder
  And only the selected questions are sent to the client

Scenario: Different attempts may receive different question subsets
  Given a quiz has 20 questions and poolSize is 10
  When student A starts an attempt
  And student B starts a separate attempt
  Then student A and student B may receive different question subsets
  And each student receives exactly 10 questions
```

### AC-POOL-03: All questions used when poolSize is null or exceeds count

```gherkin
Scenario: Null poolSize includes all questions
  Given a quiz has 15 questions
  And poolSize is null
  When a student starts an attempt
  Then all 15 questions are included in the attempt

Scenario: poolSize equal to total includes all questions
  Given a quiz has 15 questions
  And poolSize is set to 15
  When a student starts an attempt
  Then all 15 questions are included in the attempt

Scenario: poolSize greater than total includes all questions
  Given a quiz has 10 questions
  And poolSize is set to 20
  When a student starts an attempt
  Then all 10 questions are included in the attempt
```

### AC-POOL-04: Pool selection stored in questionOrder

```gherkin
Scenario: questionOrder reflects selected pool
  Given a quiz has questions with IDs [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  And poolSize is 5
  When a student starts an attempt
  Then questionOrder contains exactly 5 question IDs
  And all 5 IDs are from the set [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  And no duplicate IDs appear in questionOrder
```

### AC-POOL-05: Score based on selected pool only

```gherkin
Scenario: maxScore reflects selected questions
  Given a quiz has 20 questions worth 1 point each (total 20 points)
  And poolSize is 10
  When a student starts an attempt
  Then maxScore is 10 (sum of points for the 10 selected questions)
  And percentage is calculated relative to the 10-point maximum

Scenario: Mixed point values with pool selection
  Given a quiz has questions worth [1, 2, 3, 1, 2, 3, 1, 2, 3, 1] points
  And poolSize is 5
  And the selected questions have points [2, 3, 1, 2, 1]
  When the student answers all correctly
  Then the score is 9
  And the maxScore is 9
  And the percentage is 100
```

---

## 5. UI Configuration Scenarios

### AC-UI-01: Pool size input in QuizForm

```gherkin
Scenario: Teacher sees pool size configuration
  Given the teacher is on the quiz create/edit form
  Then there is a numeric input labeled "Questions per attempt"
  And there is helper text indicating "Leave empty to use all questions"
  And the input accepts positive integers

Scenario: Teacher configures pool size
  Given the teacher is editing a quiz with 20 questions
  When the teacher enters 10 in the pool size field
  And the teacher saves the quiz
  Then the quiz is saved with poolSize equal to 10
```

### AC-UI-02: Pool size validation

```gherkin
Scenario: Pool size accepts valid values
  Given the teacher is on the quiz form
  When the teacher enters 5 in the pool size field
  Then no validation error is displayed

Scenario: Pool size accepts empty value
  Given the teacher is on the quiz form
  When the teacher leaves the pool size field empty
  Then no validation error is displayed
  And poolSize is saved as null

Scenario: Pool size rejects non-integer values
  Given the teacher is on the quiz form
  When the teacher enters 3.5 in the pool size field
  Then a validation error is displayed
```

### AC-UI-03: Pool size displayed on quiz overview

```gherkin
Scenario: Quiz overview shows pool size when configured
  Given a quiz has 20 questions and poolSize set to 10
  When the quiz overview page is displayed
  Then the text "10 of 20 questions per attempt" is visible

Scenario: Quiz overview shows total when no pool size
  Given a quiz has 15 questions and poolSize is null
  When the quiz overview page is displayed
  Then the pool size line is not displayed or shows "All 15 questions"
```

---

## 6. Results Display Scenarios

### AC-RESULTS-01: Results reflect attempt question order

```gherkin
Scenario: Results page uses stored question order
  Given a student completed a quiz attempt
  And the stored questionOrder is [3, 1, 4, 2]
  When the student views the results page
  Then question 3 appears first as "Q1"
  And question 1 appears second as "Q2"
  And question 4 appears third as "Q3"
  And question 2 appears fourth as "Q4"
```

### AC-RESULTS-02: Results for pool-selected quiz

```gherkin
Scenario: Results show only selected questions
  Given a quiz has 20 questions and poolSize is 10
  And the student's attempt included questions [2, 5, 7, 11, 13, 15, 17, 19, 3, 9]
  When the student views the results page
  Then exactly 10 questions are displayed
  And only the selected questions appear (not all 20)
  And questions are displayed in the order stored in questionOrder
```

---

## 7. Security Scenarios

### AC-SEC-01: isCorrect not sent to client during quiz taking

```gherkin
Scenario: Options data during quiz taking omits isCorrect
  Given a student is taking a quiz
  When the quiz page sends question data to the client component
  Then the options objects do NOT contain an "isCorrect" field
  And the correct answer cannot be determined from client-side data

Scenario: isCorrect is available on results page
  Given a student has submitted a quiz attempt
  When the student views the results page
  Then the options objects DO contain the "isCorrect" field
  And correct and incorrect answers are highlighted
```

### AC-SEC-02: Pool selection does not leak unselected questions

```gherkin
Scenario: Only selected questions reach the client
  Given a quiz has 20 questions and poolSize is 10
  And the student's attempt selected questions [1, 3, 5, 7, 9, 11, 13, 15, 17, 19]
  When the quiz taking page renders
  Then only 10 question objects are sent to the client
  And the client receives NO data about questions [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]
```

### AC-SEC-03: Stored order does not reveal answers

```gherkin
Scenario: questionOrder and optionOrder contain only IDs
  Given a quiz attempt has stored questionOrder and optionOrder
  When the order data is included in the page render
  Then the questionOrder contains only integer IDs
  And the optionOrder contains only integer IDs per question
  And no isCorrect information is embedded in the order data
```

---

## 8. Performance Criteria

### AC-PERF-01: Shuffle performance

```gherkin
Scenario: Fisher-Yates shuffle completes in under 1ms
  Given an array of 200 elements
  When fisherYatesShuffle is called
  Then the function completes in under 1 millisecond
```

**Verification method:** `performance.now()` measurement in a unit test.

### AC-PERF-02: Stored order data size

```gherkin
Scenario: Order data is compact
  Given a quiz with 100 questions and 10 options each
  When questionOrder and optionOrder are serialized to JSON
  Then the combined JSON string is under 10KB
```

**Verification method:** Unit test that creates a worst-case order object and measures `JSON.stringify()` byte length.

---

## 9. Backward Compatibility Scenarios

### AC-COMPAT-01: Existing quizzes without pool size work

```gherkin
Scenario: Quiz with null poolSize behaves as before
  Given a quiz was created before the pool selection feature
  And poolSize is null
  When a student starts an attempt
  Then all questions are included (same as current behavior)
  And no error occurs
```

### AC-COMPAT-02: Existing attempts without stored order work

```gherkin
Scenario: Legacy attempt with null questionOrder
  Given a QuizAttempt was created before order persistence
  And questionOrder is null and optionOrder is null
  When the student revisits the quiz page
  Then questions are displayed in database order
  And options are displayed in database order
  And no error occurs

Scenario: Legacy attempt on results page
  Given a completed attempt with null questionOrder
  When the student views results
  Then questions are displayed in database insertion order
  And the results are correct and readable
```

### AC-COMPAT-03: Non-randomized quizzes still work

```gherkin
Scenario: Quiz with both randomize flags disabled
  Given a quiz with randomizeQuestions false and randomizeOptions false
  When a student starts an attempt
  Then questionOrder is stored as the natural question order
  And optionOrder is stored as the natural option order per question
  And questions display in the database order field sequence
```

---

## 10. i18n Scenarios

### AC-I18N-01: Pool size labels translated

```gherkin
Scenario: Pool size UI in English locale
  Given the application locale is set to "en"
  When the teacher views the quiz form
  Then the pool size label reads "Questions per attempt"
  And the helper text reads "Leave empty to use all questions"

Scenario: Pool size UI in Malay locale
  Given the application locale is set to "ms"
  When the teacher views the quiz form
  Then the pool size label is displayed in Malay
  And the helper text is displayed in Malay

Scenario: Pool size display on quiz overview in English
  Given the application locale is "en"
  And a quiz has poolSize 10 and 20 total questions
  When the quiz overview is displayed
  Then the text reads "10 of 20 questions per attempt"
```

---

## 11. Spaced Repetition Integration Scenarios

### AC-SR-01: Review cards generated correctly with randomized quiz

```gherkin
Scenario: Spaced repetition works with randomized question order
  Given a quiz has randomizeQuestions enabled
  And a student submits an attempt with 2 incorrect answers (question IDs 5 and 8)
  When the system generates review cards
  Then review cards are created for question IDs 5 and 8
  And the review cards reference the correct question content
  And question order does not affect review card generation
```

### AC-SR-02: Review cards generated correctly with pool selection

```gherkin
Scenario: Spaced repetition works with pool-selected quiz
  Given a quiz has poolSize 10 from 20 total questions
  And a student answers 3 questions incorrectly from the selected pool
  When the system generates review cards
  Then review cards are created only for the 3 incorrect questions
  And no review cards are created for questions not in the student's pool
```

---

## 12. Quality Gate Criteria

### Definition of Done

All of the following must be satisfied before SPEC-QUIZ-002 is considered complete:

#### Functional Completeness

- [ ] Option randomization bug fixed (QuizQuestion no longer re-sorts by .order)
- [ ] Fisher-Yates shuffle utility implemented and tested
- [ ] Biased shuffle replaced with Fisher-Yates in quiz page
- [ ] Question order persisted per attempt in QuizAttempt.questionOrder
- [ ] Option order persisted per attempt in QuizAttempt.optionOrder
- [ ] Stored order restored on page refresh for in-progress attempts
- [ ] Pool selection (poolSize field) added to Quiz model
- [ ] Pool selection logic implemented in startQuizAttempt
- [ ] Quiz form includes pool size input
- [ ] Results page displays questions in stored order

#### Backward Compatibility

- [ ] Existing quizzes without poolSize work correctly (null treated as "all questions")
- [ ] Existing attempts without questionOrder/optionOrder display in database order
- [ ] Non-randomized quizzes continue to work as before
- [ ] Grading is unaffected by randomization changes
- [ ] Spaced repetition is unaffected by randomization changes

#### Security

- [ ] isCorrect field stripped from client-side option data during quiz taking
- [ ] Pool selection only sends selected questions to client
- [ ] Stored order data contains only IDs, no answer information

#### Database

- [ ] poolSize Int? added to Quiz model
- [ ] questionOrder Json? added to QuizAttempt model
- [ ] optionOrder Json? added to QuizAttempt model
- [ ] Migration applies without data loss

#### i18n

- [ ] Translation keys added for pool size UI in en and ms locales

#### Code Quality (TRUST 5)

- [ ] **Tested**: Unit tests for shuffleUtils.ts, validation schemas; integration tests for startQuizAttempt with order persistence and pool selection; 85%+ coverage on new code
- [ ] **Readable**: Clear naming, English comments, code under 400 lines per file
- [ ] **Unified**: Consistent with existing project patterns (Server Components, Prisma, Zod, React Hook Form)
- [ ] **Secured**: isCorrect not leaked, pool selection does not expose unselected questions
- [ ] **Trackable**: Conventional commits referencing SPEC-QUIZ-002

#### Test Requirements

| Test Category      | Minimum Scenarios | Verification Method        |
|--------------------|-------------------|----------------------------|
| Unit tests         | 10+               | Vitest / Jest              |
| Integration tests  | 5+                | Server action testing      |
| E2E tests          | 3+                | Playwright                 |
| Security tests     | 3+                | Data inspection tests      |
| Performance checks | 2                 | Performance.now() in tests |

---

## Traceability Matrix

| Acceptance Criteria | SPEC Requirement(s)               | Phase |
|---------------------|-----------------------------------|-------|
| AC-FIX-01           | REQ-FIX-01                        | 1     |
| AC-FIX-02           | REQ-FIX-02, REQ-SHUFFLE-01        | 1     |
| AC-FIX-03           | REQ-FIX-03                        | 4     |
| AC-SHUFFLE-01       | REQ-SHUFFLE-01                    | 1     |
| AC-SHUFFLE-02       | REQ-SHUFFLE-02                    | 1     |
| AC-SHUFFLE-03       | REQ-SHUFFLE-03                    | 1     |
| AC-PERSIST-01       | REQ-PERSIST-01                    | 2     |
| AC-PERSIST-02       | REQ-PERSIST-02                    | 2     |
| AC-PERSIST-03       | REQ-PERSIST-03                    | 2     |
| AC-PERSIST-04       | REQ-PERSIST-04                    | 2     |
| AC-POOL-01          | REQ-POOL-01                       | 3     |
| AC-POOL-02          | REQ-POOL-02, REQ-POOL-04          | 3     |
| AC-POOL-03          | REQ-POOL-03                       | 3     |
| AC-POOL-04          | REQ-POOL-04                       | 3     |
| AC-POOL-05          | REQ-POOL-05                       | 3     |
| AC-UI-01            | REQ-UI-01                         | 3     |
| AC-UI-02            | REQ-UI-02                         | 3     |
| AC-UI-03            | REQ-UI-03                         | 4     |
| AC-RESULTS-01       | REQ-FIX-03                        | 4     |
| AC-RESULTS-02       | REQ-POOL-04, REQ-FIX-03           | 4     |
| AC-SEC-01           | REQ-SEC-01                        | 1     |
| AC-SEC-02           | REQ-SEC-02                        | 3     |
| AC-SEC-03           | REQ-SEC-03                        | 2     |
| AC-PERF-01          | REQ-PERF-01                       | 1     |
| AC-PERF-02          | REQ-PERF-02                       | 2     |
| AC-COMPAT-01        | REQ-POOL-03                       | 3     |
| AC-COMPAT-02        | REQ-PERSIST-04                    | 2     |
| AC-COMPAT-03        | REQ-PERSIST-04                    | 2     |
| AC-I18N-01          | REQ-I18N-01                       | 4     |
| AC-SR-01            | REQ-SHUFFLE-02                    | 2     |
| AC-SR-02            | REQ-POOL-02, REQ-POOL-05          | 3     |
