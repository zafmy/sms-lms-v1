---
id: SPEC-LMS-007
title: "Spaced Repetition System - Acceptance Criteria"
version: "1.0.0"
status: draft
created: 2026-02-22
tags:
  - SPEC-LMS-007
  - acceptance-criteria
  - gherkin
---

# SPEC-LMS-007: Acceptance Criteria

## Quality Gate Criteria

- All EARS requirements (REQ-LMS-050 through REQ-LMS-132) implemented
- Pure utility functions have unit tests with 85%+ coverage
- All Prisma transactions use `$transaction` for atomicity
- No Prisma imports in pure utility files
- All new routes have access control enforced at both middleware and Server Action levels
- Keyboard navigation works for card flip interaction
- Empty states handled for all new pages and widgets

---

## TAG-1: Database Schema

### ACC-001: ReviewCard Model Exists

```gherkin
Given the Prisma schema has been migrated
When I inspect the database schema
Then a "ReviewCard" table exists with columns:
  | Column             | Type     | Constraint           |
  | id                 | Int      | Primary Key, Auto    |
  | studentId          | String   | FK to Student        |
  | courseId            | Int      | FK to Course         |
  | subjectId          | Int      | FK to Subject        |
  | cardType           | Enum     | ReviewCardType       |
  | front              | String   | Not Null             |
  | back               | String   | Not Null             |
  | sourceQuestionId   | Int      | Nullable, FK         |
  | sourceLessonId     | Int      | Nullable, FK         |
  | leitnerBox         | Int      | Default 1            |
  | easinessFactor     | Float    | Default 2.5          |
  | consecutiveCorrect | Int      | Default 0            |
  | nextReviewDate     | DateTime | Not Null             |
  | lastReviewedAt     | DateTime | Nullable             |
  | reviewCount        | Int      | Default 0            |
  | stability          | Float    | Nullable (FSRS)      |
  | difficulty         | Float    | Nullable (FSRS)      |
  | retrievability     | Float    | Nullable (FSRS)      |
  | isActive           | Boolean  | Default true         |
  | createdAt          | DateTime | Default now          |
  | updatedAt          | DateTime | Auto-update          |
And an index exists on [studentId, isActive, nextReviewDate]
```

### ACC-002: ReviewLog Model Exists

```gherkin
Given the Prisma schema has been migrated
When I inspect the database schema
Then a "ReviewLog" table exists with columns:
  | Column           | Type     | Constraint          |
  | id               | Int      | Primary Key, Auto   |
  | reviewCardId     | Int      | FK to ReviewCard    |
  | studentId        | String   | FK to Student       |
  | rating           | Enum     | ReviewRating        |
  | previousBox      | Int      | Not Null            |
  | newBox           | Int      | Not Null            |
  | previousEF       | Float    | Not Null            |
  | newEF            | Float    | Not Null            |
  | responseTimeMs   | Int      | Nullable            |
  | reviewedAt       | DateTime | Default now         |
And an index exists on [studentId, reviewedAt]
```

### ACC-003: ReviewSession Model Exists

```gherkin
Given the Prisma schema has been migrated
When I inspect the database schema
Then a "ReviewSession" table exists with columns:
  | Column       | Type     | Constraint          |
  | id           | Int      | Primary Key, Auto   |
  | studentId    | String   | FK to Student       |
  | startedAt    | DateTime | Default now         |
  | completedAt  | DateTime | Nullable            |
  | totalCards   | Int      | Not Null            |
  | correctCards | Int      | Default 0           |
  | xpEarned     | Int      | Default 0           |
```

### ACC-004: New Enums Exist

```gherkin
Given the Prisma schema has been migrated
When I inspect the enum definitions
Then the following enums exist:
  - ReviewCardType with values: QUIZ_QUESTION, VOCABULARY, CONCEPT, FLASHCARD
  - ReviewRating with values: HARD, OK, EASY
And the XpSource enum includes REVIEW
And the NotificationType enum includes REVIEW
```

### ACC-005: LmsLesson Has flagForReview Field

```gherkin
Given the Prisma schema has been migrated
When I inspect the LmsLesson model
Then a "flagForReview" Boolean column exists with default value false
```

### ACC-006: Review Badges Are Seeded

```gherkin
Given the database has been seeded
When I query the Badge table for review-related badges
Then exactly 4 badges exist:
  | name              | category       | threshold |
  | First Review      | review         | 1         |
  | Review Streak 4   | review_streak  | 4         |
  | Master 50 Cards   | mastery        | 50        |
  | Perfect Session   | review_perfect | 1         |
```

---

## TAG-2: Spaced Repetition Engine

### ACC-010: HARD Rating Demotes to Box 1

```gherkin
Given a ReviewCard in Box 3 with easinessFactor 2.5 and consecutiveCorrect 4
When the student rates the card as HARD
Then the card is moved to Box 1
And easinessFactor is decreased to 2.2
And consecutiveCorrect is reset to 0
And nextReviewDate is set to the next Saturday
```

### ACC-011: OK Rating Stays or Promotes

```gherkin
Given a ReviewCard in Box 2 with consecutiveCorrect 1
When the student rates the card as OK
Then the card remains in Box 2
And consecutiveCorrect is incremented to 2

Given a ReviewCard in Box 2 with consecutiveCorrect 2
When the student rates the card as OK
Then the card is promoted to Box 3
And consecutiveCorrect is incremented to 3
```

### ACC-012: EASY Rating Promotes by 1-2 Boxes

```gherkin
Given a ReviewCard in Box 2 with easinessFactor 2.5
When the student rates the card as EASY
Then the card is promoted to Box 4 (2-box jump because EF >= 2.5)
And easinessFactor is increased to 2.65

Given a ReviewCard in Box 2 with easinessFactor 2.0
When the student rates the card as EASY
Then the card is promoted to Box 3 (1-box jump because EF < 2.5)
And easinessFactor is increased to 2.15
```

### ACC-013: Box 5 Cap

```gherkin
Given a ReviewCard in Box 4 with easinessFactor 2.7
When the student rates the card as EASY
Then the card is promoted to Box 5 (capped, not Box 6)
And nextReviewDate is set approximately 24 weekends from now
```

### ACC-014: Next Review Date Anchored to Saturday

```gherkin
Given today is Wednesday 2026-02-25
When a card is assigned to Box 1
Then nextReviewDate is Saturday 2026-02-28

Given today is Wednesday 2026-02-25
When a card is assigned to Box 2
Then nextReviewDate is Saturday 2026-03-14 (2nd weekend)

Given today is Wednesday 2026-02-25
When a card is assigned to Box 3
Then nextReviewDate is Saturday 2026-03-28 (4th weekend)
```

### ACC-015: EF Never Falls Below 1.3

```gherkin
Given a ReviewCard with easinessFactor 1.4
When the student rates the card as HARD (EF -= 0.3 would be 1.1)
Then easinessFactor is set to 1.3 (clamped at minimum)
```

### ACC-016: Review Queue Ordering

```gherkin
Given a student has the following active review cards:
  | Card | nextReviewDate | leitnerBox | reviewCount |
  | A    | 2026-02-15     | 2          | 5           |
  | B    | 2026-02-22     | 1          | 3           |
  | C    | 2026-02-22     | 3          | 2           |
  | D    | 2026-03-01     | 1          | 0           |
When the review queue is built on 2026-02-22 with maxCards 15
Then the queue order is [A, B, C, D]
  - A: overdue (Feb 15 < Feb 22), sorted first
  - B: due today, Box 1 (lowest box first)
  - C: due today, Box 3
  - D: future, but fills remaining slots as new card (reviewCount 0)
```

### ACC-020: Auto-Generate Cards from Quiz Incorrect Answers

```gherkin
Given a student submits a quiz with 5 questions
And questions 2 and 4 are answered incorrectly
When the quiz is graded
Then 2 ReviewCards are created:
  - Card for Q2: type QUIZ_QUESTION, front = Q2 text, back = correct answer + explanation
  - Card for Q4: type QUIZ_QUESTION, front = Q4 text, back = correct answer + explanation
And both cards have leitnerBox 1, nextReviewDate set to next Saturday
And courseId and subjectId are derived from the quiz's lesson -> module -> course chain
```

### ACC-021: No Duplicate Cards for Same Question

```gherkin
Given a student already has a ReviewCard for Question #42
And the card is in Box 3 with isActive true
When the student answers Question #42 incorrectly on a retake
Then no new ReviewCard is created
And the existing card is reset to Box 1 and reactivated
```

### ACC-022: Auto-Generate Card from Flagged Lesson

```gherkin
Given a lesson "Photosynthesis Basics" has flagForReview = true
When a student marks this lesson as completed
Then a ReviewCard of type CONCEPT is created:
  - front: "What are the key concepts from: Photosynthesis Basics?"
  - back: First 500 characters of lesson content
  - sourceLessonId: the lesson's ID
And the card has leitnerBox 1
```

### ACC-023: Unflagged Lesson Does Not Generate Card

```gherkin
Given a lesson "Introduction" has flagForReview = false
When a student marks this lesson as completed
Then no ReviewCard is created
```

### ACC-024: Teacher Creates Flashcard for Enrolled Students

```gherkin
Given a teacher owns a course with 15 enrolled students
When the teacher creates a FLASHCARD review card with front "What is H2O?" and back "Water"
Then 15 ReviewCard records are created (one per enrolled student)
And all cards have cardType FLASHCARD, leitnerBox 1
And courseId matches the course, subjectId matches the course's subject
```

---

## TAG-3: Student Review UI

### ACC-030: Review Queue Page Displays Due Cards

```gherkin
Given a student has 8 active review cards due today
And 3 overdue cards from last week
When the student navigates to /list/reviews
Then the page shows "11 cards due for review"
And estimated time shows "~8 minutes" (11 * 45 seconds / 60)
And a subject breakdown shows cards per subject
And a "Start Review" button is enabled
```

### ACC-031: Empty State When No Cards Due

```gherkin
Given a student has no active review cards due
When the student navigates to /list/reviews
Then the page shows an empty state message: "No reviews due. Great job staying on top of your studies!"
And the "Start Review" button is disabled or hidden
```

### ACC-032: Card Flip Interaction

```gherkin
Given a review session is active with 10 cards
When the student sees the first card
Then only the front (question) is visible
When the student clicks the card (or presses Space)
Then the back (answer) is revealed
And three rating buttons appear: Hard, OK, Easy
When the student clicks "OK"
Then the next card is shown with only the front visible
And the progress bar advances from 1/10 to 2/10
```

### ACC-033: Keyboard Navigation

```gherkin
Given a review session is active and a card is showing its front
When the student presses Space or Enter
Then the card flips to show the back

Given the back is visible with rating buttons
When the student presses "1" or "H"
Then the card is rated as HARD
When the student presses "2" or "O"
Then the card is rated as OK
When the student presses "3" or "E"
Then the card is rated as EASY
```

### ACC-034: Session Summary After Completion

```gherkin
Given a student completes a review session of 10 cards
And they rated 3 as HARD, 5 as OK, 2 as EASY
When the session summary page is displayed
Then it shows:
  - Cards reviewed: 10
  - Correct (OK + EASY): 7
  - Incorrect (HARD): 3
  - XP earned: calculated total (7 * 10 base + bonuses + 50 session)
  - Streak status: current streak count
  - Mastery per subject: updated percentages
```

### ACC-040: Review Session is Capped at 15 Cards

```gherkin
Given a student has 25 cards due for review
When a review session is started
Then exactly 15 cards are loaded into the session
And the remaining 10 cards stay for the next session
```

### ACC-041: Rating Updates Card in Database

```gherkin
Given a ReviewCard in Box 2 with EF 2.5
When the student rates it as EASY in a review session
Then a ReviewLog record is created with:
  - previousBox: 2, newBox: 4
  - previousEF: 2.5, newEF: 2.65
  - rating: EASY
And the ReviewCard record is updated with:
  - leitnerBox: 4, easinessFactor: 2.65
  - lastReviewedAt: now
  - reviewCount: incremented by 1
  - nextReviewDate: 8th weekend from now
```

### ACC-042: Review Session Atomic Transaction

```gherkin
Given a review session is in progress
When the student rates a card
Then the following operations occur in a single Prisma $transaction:
  1. ReviewCard update (box, EF, nextReviewDate, reviewCount)
  2. ReviewLog creation
  3. ReviewSession counter update
And if any operation fails, all are rolled back
```

### ACC-043: Review History Shows Card Distribution

```gherkin
Given a student has 50 active review cards distributed as:
  - Box 1: 10, Box 2: 15, Box 3: 12, Box 4: 8, Box 5: 5
When the student views their review history section
Then a bar chart shows the distribution across all 5 boxes
And mastery meters show per-subject percentage (Box 4-5 / total)
```

### ACC-044: Subject Mastery Calculation

```gherkin
Given a student has review cards for "Mathematics":
  - 5 cards in Box 1, 3 in Box 2, 2 in Box 3, 6 in Box 4, 4 in Box 5
When subject mastery is computed
Then Mathematics mastery = (6 + 4) / 20 = 50%
```

---

## TAG-4: Teacher Review Management

### ACC-050: Teacher Creates Review Card

```gherkin
Given a teacher navigates to /list/courses/5/reviews/create
When they fill in front "What is the capital of France?" and back "Paris"
And select card type "FLASHCARD"
And select target "All enrolled students"
And submit the form
Then ReviewCard records are created for all actively enrolled students
And a success toast is displayed
And the teacher is redirected to /list/courses/5/reviews
```

### ACC-051: Lesson flagForReview Toggle

```gherkin
Given a teacher is editing a lesson
When they check the "Flag for Review" checkbox
And save the lesson
Then the LmsLesson record has flagForReview = true

Given a teacher unchecks "Flag for Review"
And saves the lesson
Then the LmsLesson record has flagForReview = false
```

### ACC-052: Pre-Class Report Shows Engagement

```gherkin
Given a teacher's class has 12 students
And 8 students completed reviews in the past 2 weeks
And 4 students completed zero reviews
When the teacher views the pre-class review report
Then 12 rows are displayed:
  - 8 students show their completion count in normal text
  - 4 students show "0 reviews" highlighted in red
And the class average completion rate shows "67%"
```

### ACC-053: Teacher Sees Review Cards for Course

```gherkin
Given a teacher owns a course with 30 review cards created (both auto and manual)
When they navigate to /list/courses/5/reviews
Then a table shows all 30 cards with:
  - Card type (QUIZ_QUESTION, FLASHCARD, etc.)
  - Front text (truncated preview)
  - Number of students assigned
  - Average box level across students
```

---

## TAG-5: Gamification Integration

### ACC-070: XP for Correct Review

```gherkin
Given a student rates a review card as OK
When the gamification event is processed
Then 10 XP (XP_REVIEW_CORRECT) is awarded
And an XpTransaction record is created with source REVIEW
```

### ACC-071: Hard Bonus XP for Box 1 Card

```gherkin
Given a student correctly answers (rates OK or EASY) a card that was in Box 1
When the gamification event is processed
Then 15 XP is awarded (10 base + 5 hard bonus)
```

### ACC-072: Session Completion XP

```gherkin
Given a student completes all cards in a review session
When the session is marked complete
Then 50 XP (XP_REVIEW_SESSION_COMPLETE) is awarded
And total session XP includes base per-card XP plus session bonus
```

### ACC-073: Mastery Bonus When Card Reaches Box 5

```gherkin
Given a student rates a card in Box 4 as EASY (promoting to Box 5)
When the card update is processed
Then 25 XP (XP_MASTERY_BONUS) is awarded
And the total cards mastered count is updated for badge evaluation
```

### ACC-074: First Review Badge

```gherkin
Given a student has never completed a review session
When they complete their first review session
Then the "First Review" badge is awarded
And a GAMIFICATION notification is created: 'You earned the "First Review" badge!'
```

### ACC-075: Perfect Session Badge

```gherkin
Given a student completes a review session
And all cards were rated OK or EASY (zero HARD ratings)
When the session is completed
Then the "Perfect Session" badge is awarded
```

---

## TAG-6: Analytics Dashboard

### ACC-080: Student Mastery Meter

```gherkin
Given a student has review cards in 3 subjects:
  - Math: 20 cards, 10 in Box 4-5 (50% mastery)
  - Science: 15 cards, 12 in Box 4-5 (80% mastery)
  - English: 10 cards, 3 in Box 4-5 (30% mastery)
When the student views their review analytics
Then 3 mastery meters are displayed:
  - Math: 50% (yellow)
  - Science: 80% (green)
  - English: 30% (red)
```

### ACC-081: Review Streak Calendar

```gherkin
Given a student completed reviews on the following dates:
  - 2026-02-01, 2026-02-08, 2026-02-15, 2026-02-22
When the review streak calendar is displayed
Then those 4 dates show activity markers
And the current streak shows 4 weekends
```

### ACC-082: Teacher Class Review Analytics

```gherkin
Given a teacher views course analytics
And the course has 20 enrolled students
When the review analytics section loads
Then it shows:
  - Class review completion rate for the past 4 weekends (LineChart)
  - Most struggled cards: top 5 cards by HARD rating count
  - Per-student engagement table with completion rates
  - Pre-class readiness score
```

### ACC-083: Admin School-Wide Metrics

```gherkin
Given the school has 200 students total
And 120 have completed at least one review in the past 4 weeks
When the admin views review adoption metrics
Then it shows:
  - Active reviewers: 120 / 200 (60%)
  - Average mastery: computed across all subjects
  - Total review sessions completed
```

---

## TAG-7: Parent View and Menu/Route Integration

### ACC-060: Parent Sees Child Review Activity

```gherkin
Given a parent has a child enrolled in 3 courses
And the child completed 6 out of 8 expected review sessions
When the parent views the dashboard
Then a review activity widget shows:
  - Completion rate: 75%
  - Current streak: number of consecutive weekends
  - Subjects being reviewed with mastery indicators
```

### ACC-061: Menu Shows Reviews for Students

```gherkin
Given a user is logged in as a student
When they view the sidebar menu
Then a "Reviews" menu item is visible
And clicking it navigates to /list/reviews

Given a user is logged in as a teacher
When they view the sidebar menu
Then the "Reviews" menu item is not visible
```

### ACC-062: Route Access Control

```gherkin
Given a teacher attempts to access /list/reviews directly
Then the route is blocked by middleware (not in their allowed routes)

Given a student attempts to access /list/courses/5/reviews
Then the route is blocked by middleware (teacher/admin only)

Given an admin accesses /list/courses/5/reviews
Then the page loads successfully
```

---

## Definition of Done

- [ ] All ACC scenarios pass manual verification
- [ ] Pure utility functions have unit tests with 85%+ coverage
- [ ] Prisma migration applies cleanly to a fresh database
- [ ] All Server Actions validate auth and role before execution
- [ ] Card flip UI works with mouse and keyboard
- [ ] All Recharts visualizations render correctly with empty and populated data
- [ ] Empty states display meaningful messages on all new pages
- [ ] No console errors in browser during normal review flow
- [ ] Fire-and-forget gamification calls do not break primary review operations
- [ ] FSRS fields (stability, difficulty, retrievability) exist in schema but are nullable
