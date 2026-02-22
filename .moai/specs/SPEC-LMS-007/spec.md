---
id: SPEC-LMS-007
title: "Spaced Repetition System for Knowledge Retention"
version: "1.1.0"
status: completed
created: 2026-02-22
author: manager-spec
priority: High
parent: SPEC-LMS-001
depends:
  - SPEC-LMS-001  # Course/Module/Lesson/Quiz models
  - SPEC-LMS-004  # LMS Analytics utilities
  - SPEC-LMS-006  # Gamification engine
tags:
  - spaced-repetition
  - leitner-system
  - knowledge-retention
  - review-cards
  - analytics
  - gamification
---

# SPEC-LMS-007: Spaced Repetition System for Knowledge Retention

## History

| Version | Date       | Author       | Changes                                   |
|---------|------------|--------------|-------------------------------------------|
| 1.0.0   | 2026-02-22 | manager-spec | Initial draft with full feature scope     |
| 1.1.0   | 2026-02-22 | moai-sync    | Implementation completed, status updated  |

---

## 1. Overview

### 1.1 Problem Statement

Hua Readwise operates as a bi-weekly school with sessions only on Saturday and Sunday. This creates a 12-day gap between consecutive school weekends. Research on the forgetting curve (Ebbinghaus, 1885) demonstrates that without reinforcement, learners lose 60-80% of newly acquired knowledge within days. Students arrive at each Saturday session having forgotten the majority of what was taught the previous weekend, forcing teachers to spend significant time re-establishing context rather than advancing the curriculum.

### 1.2 Proposed Solution

A spaced repetition system using a Modified Leitner System (5-box model mapped to session frequency) combined with SM-2-style difficulty scoring (3-button Hard/OK/Easy rating). The system generates review cards automatically from quiz performance and lesson completion, and allows teachers to create flashcard-style review cards manually. Review scheduling is anchored to school session dates rather than calendar days.

The architecture includes FSRS (Free Spaced Repetition Scheduler) data fields stored from day one to enable future ML-based optimization without schema migration.

### 1.3 Target Metrics

- Reduce re-teaching time at Saturday session start by 40-60%
- Achieve 70%+ student review completion rate between sessions
- Improve quiz pass rates by 15-25% through systematic review
- Move 50%+ of active review cards to Box 3 or higher within one semester

---

## 2. Stakeholders

| Role    | Primary Needs                                                                 |
|---------|-------------------------------------------------------------------------------|
| Student | Review queue with due cards, card flip interaction, session summary, mastery tracking |
| Teacher | Pre-class engagement report, manual card creation, concept flagging, class analytics   |
| Parent  | Child's review activity visibility, completion rate, streak data                       |
| Admin   | School-wide review adoption metrics, total cards, average mastery                      |

---

## 3. Environment

### 3.1 Existing Infrastructure

- **Database**: PostgreSQL via Prisma ORM with 28 existing models including Course, Module, LmsLesson, LessonProgress, Quiz, Question, QuestionBank, AnswerOption, QuizAttempt, QuestionResponse
- **Auth**: Clerk with `publicMetadata.role` for admin/teacher/student/parent
- **Gamification**: StudentGamification, Badge, StudentBadge, XpTransaction models with `processGamificationEvent` engine
- **Analytics**: 12 pure functions in `lmsAnalyticsUtils.ts` following no-Prisma, no-side-effect pattern
- **UI Pattern**: Server Component Container (`*Container.tsx`) fetches data, Client Component (`*.tsx`) renders interactive UI
- **Charts**: Recharts for all data visualization
- **Routes**: Next.js 16 App Router under `src/app/(dashboard)/list/`

### 3.2 School Calendar Context

- School sessions: Saturday and Sunday only
- Gap between sessions: 12 days (Monday through Friday x2 + weekdays)
- Academic year: approximately 40 weekends (80 session days)
- Student population: under 500 across all roles

---

## 4. Assumptions

- A-1: Students have internet access during the 12-day gap between sessions to complete reviews on personal devices.
- A-2: The existing `QuestionResponse` data from quiz attempts provides sufficient signal to identify which concepts a student struggles with.
- A-3: Teachers will flag key lesson concepts for review card generation as part of their course authoring workflow.
- A-4: The Leitner 5-box system is appropriate for the bi-weekly session cadence; future FSRS optimization may replace the box model.
- A-5: A maximum of 15 cards per review session balances learning effectiveness with student attention spans (research: diminishing returns beyond 15 per session).
- A-6: The current JavaScript aggregation pattern (no materialized views) will perform adequately for review analytics with under 500 students.

---

## 5. Requirements

### 5.1 Database Models

**REQ-LMS-050**: The system **shall** provide a `ReviewCard` Prisma model with the following fields:
- `id` (Int, autoincrement, primary key)
- `studentId` (String, FK to Student)
- `courseId` (Int, FK to Course)
- `subjectId` (Int, FK to Subject)
- `cardType` (ReviewCardType enum: `QUIZ_QUESTION`, `VOCABULARY`, `CONCEPT`, `FLASHCARD`)
- `front` (String, the question or prompt side)
- `back` (String, the answer or explanation side)
- `sourceQuestionId` (Int?, optional FK to Question for quiz-generated cards)
- `sourceLessonId` (Int?, optional FK to LmsLesson for lesson-generated cards)
- `leitnerBox` (Int, default 1, range 1-5)
- `easinessFactor` (Float, default 2.5, minimum 1.3, SM-2 EF)
- `consecutiveCorrect` (Int, default 0)
- `nextReviewDate` (DateTime, next scheduled review)
- `lastReviewedAt` (DateTime?)
- `reviewCount` (Int, default 0)
- `stability` (Float?, FSRS field, null initially)
- `difficulty` (Float?, FSRS field, range 1-10, null initially)
- `retrievability` (Float?, FSRS field, range 0-1, null initially)
- `isActive` (Boolean, default true)
- `createdAt` (DateTime, default now)
- `updatedAt` (DateTime, updatedAt)

**REQ-LMS-051**: The system **shall** provide a `ReviewLog` Prisma model to record every individual card review event:
- `id` (Int, autoincrement, primary key)
- `reviewCardId` (Int, FK to ReviewCard)
- `studentId` (String, FK to Student)
- `rating` (ReviewRating enum: `HARD`, `OK`, `EASY`)
- `previousBox` (Int)
- `newBox` (Int)
- `previousEF` (Float)
- `newEF` (Float)
- `responseTimeMs` (Int?, time taken to respond)
- `reviewedAt` (DateTime, default now)

**REQ-LMS-052**: The system **shall** provide a `ReviewSession` Prisma model to group card reviews into a session:
- `id` (Int, autoincrement, primary key)
- `studentId` (String, FK to Student)
- `startedAt` (DateTime, default now)
- `completedAt` (DateTime?)
- `totalCards` (Int)
- `correctCards` (Int, default 0)
- `xpEarned` (Int, default 0)

**REQ-LMS-053**: The system **shall** provide the following enums:
- `ReviewCardType`: `QUIZ_QUESTION`, `VOCABULARY`, `CONCEPT`, `FLASHCARD`
- `ReviewRating`: `HARD`, `OK`, `EASY`

**REQ-LMS-054**: The system **shall** add a `flagForReview` Boolean field (default false) to the `LmsLesson` model to allow teachers to flag lessons whose concepts should auto-generate review cards.

**REQ-LMS-055**: The system **shall** add `XpSource` enum value `REVIEW` for tracking review-related XP transactions.

### 5.2 Spaced Repetition Engine

**REQ-LMS-060**: The system **shall** implement a Modified Leitner box progression algorithm as pure functions in `src/lib/spacedRepetitionUtils.ts` with no Prisma imports:
- Box 1: Review every weekend session (both Saturday and Sunday)
- Box 2: Review once per weekend (every 2 weeks effectively)
- Box 3: Review every other weekend (approximately 4 weeks)
- Box 4: Review once per month (approximately 8 weeks)
- Box 5: Mastered, review once per semester

**REQ-LMS-061**: **When** a student rates a card as `HARD`, **then** the system **shall** demote the card to Box 1, reset `consecutiveCorrect` to 0, and decrease `easinessFactor` by 0.3 (minimum 1.3).

**REQ-LMS-062**: **When** a student rates a card as `OK`, **then** the system **shall** keep the card in the current box or promote by 1 box (promote if `consecutiveCorrect >= 2`), increment `consecutiveCorrect`, and decrease `easinessFactor` by 0.1 (minimum 1.3).

**REQ-LMS-063**: **When** a student rates a card as `EASY`, **then** the system **shall** promote the card by 1-2 boxes (2 if `easinessFactor >= 2.5`), reset `consecutiveCorrect` to 0, and increase `easinessFactor` by 0.15.

**REQ-LMS-064**: **When** a card's box level changes, **then** the system **shall** compute `nextReviewDate` based on the next school session date that aligns with the box interval, anchored to the school's Saturday/Sunday schedule.

**REQ-LMS-065**: The system **shall** implement a `computeNextSessionDate` function that calculates the next Saturday given a reference date, supporting the Leitner box intervals mapped to weekend sessions:
- Box 1: Next weekend (0-6 days)
- Box 2: 2nd weekend from now (approximately 14 days)
- Box 3: 4th weekend from now (approximately 28 days)
- Box 4: 8th weekend from now (approximately 56 days)
- Box 5: 24th weekend from now (approximately 168 days)

### 5.3 Review Card Generation

**REQ-LMS-070**: **When** a student submits a quiz and a `QuestionResponse` has `isCorrect === false`, **then** the system **shall** auto-generate a `ReviewCard` of type `QUIZ_QUESTION` with:
- `front`: The question text
- `back`: The correct answer option text plus the question explanation (if present)
- `sourceQuestionId`: The question ID
- `courseId` and `subjectId` derived from the quiz's parent lesson, module, and course chain

**REQ-LMS-071**: The system **shall not** create duplicate `ReviewCard` records for the same student and source question. **If** a `ReviewCard` already exists for that student-question pair, **then** the system **shall** reactivate it (set `isActive = true`) and reset it to Box 1 if it was previously deactivated.

**REQ-LMS-072**: **When** a student completes a lesson that has `flagForReview === true`, **then** the system **shall** auto-generate a `ReviewCard` of type `CONCEPT` with:
- `front`: A prompt derived from the lesson title (e.g., "What are the key concepts from: [lesson title]?")
- `back`: A summary extracted from the first 500 characters of the lesson content
- `sourceLessonId`: The lesson ID

**REQ-LMS-073**: **Where** teacher review card creation exists, the system **shall** allow teachers to create `FLASHCARD` or `VOCABULARY` type `ReviewCard` records for any course they own, specifying custom front and back text, and assigning them to all enrolled students or specific students.

### 5.4 Session-Based Review Queue

**REQ-LMS-080**: **When** a student navigates to the review page, **then** the system **shall** build a review queue containing:
1. Overdue cards (`nextReviewDate < today`) sorted by oldest first
2. Due cards (`nextReviewDate === today`) sorted by lowest box first
3. New cards (Box 1, never reviewed) limited to fill remaining slots

**REQ-LMS-081**: The system **shall** limit each review session to a maximum of 15 cards.

**REQ-LMS-082**: The system **shall** display the estimated review time calculated as `totalCards * 45 seconds` (average per card).

**REQ-LMS-083**: **When** a student completes all cards in a review session, **then** the system **shall** display a session summary showing: cards reviewed, correct/incorrect count, XP earned, current streak status, and mastery progress by subject.

### 5.5 Student Review UI

**REQ-LMS-090**: The system **shall** provide a review queue page at `/list/reviews` accessible to students showing:
- Total cards due for review with a count badge
- Estimated review time
- Subject breakdown of due cards
- "Start Review" button to begin the session

**REQ-LMS-091**: The system **shall** provide a card flip interaction:
- Front side shows the question/prompt
- Student clicks to reveal the back (answer)
- Three rating buttons appear: Hard (red), OK (yellow), Easy (green)
- Progress bar shows cards completed out of total

**REQ-LMS-092**: **When** a student rates a card, **then** the system **shall** create a `ReviewLog` record, update the `ReviewCard` (box, EF, nextReviewDate), advance to the next card, and update the `ReviewSession` counters atomically via Prisma `$transaction`.

**REQ-LMS-093**: The system **shall** provide a review history page or section showing the student's card progression over time, including: total cards, cards per box distribution, mastery percentage per subject, and review streak data.

### 5.6 Teacher Review Management

**REQ-LMS-100**: **Where** teacher card creation exists, the system **shall** provide a review card creation form accessible from the course detail page, allowing teachers to:
- Enter front text (question/prompt) and back text (answer/explanation)
- Select card type (`FLASHCARD` or `VOCABULARY`)
- Choose target audience (all enrolled students or specific students)

**REQ-LMS-101**: **Where** lesson concept flagging exists, the system **shall** add a toggle control to the `LmsLessonForm` allowing teachers to set `flagForReview = true` on any lesson.

**REQ-LMS-102**: The system **shall** provide a pre-class engagement report accessible from the teacher dashboard showing:
- Per-student review completion rate for the past 2 weeks
- Students who have not completed any reviews since the last session (flagged in red)
- Average review session score across the class
- Total cards reviewed class-wide

### 5.7 Parent and Admin Views

**REQ-LMS-110**: **Where** parent dashboard exists, the system **shall** display per-child review activity:
- Review completion rate (sessions completed / sessions expected)
- Current review streak (weekends with completed reviews)
- Subjects currently being reviewed with mastery indication

**REQ-LMS-111**: **Where** admin dashboard exists, the system **shall** display school-wide review metrics:
- Active reviewers count (students who completed at least one review session in the past 4 weeks)
- Average mastery percentage across all subjects
- Total review cards in the system
- Review session completion trend

### 5.8 Gamification Integration

**REQ-LMS-120**: **When** a student correctly answers a review card (rates `OK` or `EASY`), **then** the system **shall** award `XP_REVIEW_CORRECT = 10` XP via `processGamificationEvent` with source `REVIEW`.

**REQ-LMS-121**: **When** a student correctly answers a card that is in Box 1 (hardest cards), **then** the system **shall** award an additional `XP_REVIEW_HARD_BONUS = 5` XP.

**REQ-LMS-122**: **When** a student completes an entire review session (all cards rated), **then** the system **shall** award `XP_REVIEW_SESSION_COMPLETE = 50` XP.

**REQ-LMS-123**: **When** a review card reaches Box 5 (mastered), **then** the system **shall** award `XP_MASTERY_BONUS = 25` XP.

**REQ-LMS-124**: The system **shall** support the following badge criteria hooks:
- "First Review" badge: First review session completed (category: `review`, threshold: 1)
- "Review Streak 4" badge: 4 consecutive weekends with completed review sessions (category: `review_streak`, threshold: 4)
- "Master 50 Cards" badge: 50 cards reach Box 5 (category: `mastery`, threshold: 50)
- "Perfect Session" badge: All cards rated `OK` or `EASY` in a single session (category: `review_perfect`, threshold: 1)

### 5.9 Analytics Dashboard

**REQ-LMS-130**: The system **shall** provide student-facing analytics:
- Mastery meter per subject: percentage of cards in Box 4 or Box 5
- Review streak calendar: similar to existing `LearningActivityHeatmap` showing review activity per day
- Card progression chart: stacked bar chart showing card count per box over time (Recharts)

**REQ-LMS-131**: The system **shall** provide teacher-facing analytics accessible from the course analytics page:
- Class review completion rate per weekend
- Most struggled cards: cards with the highest number of `HARD` ratings across all students
- Per-student review engagement summary table
- Pre-class readiness score: percentage of assigned reviews completed by each student before the session

**REQ-LMS-132**: The system **shall** provide admin-facing analytics on the admin dashboard:
- School-wide review adoption rate (active reviewers / total students)
- Average mastery across all subjects
- Total review sessions completed school-wide

---

## 6. Technical Approach

### 6.1 New Prisma Models

```
ReviewCard
  - Relations: Student, Course, Subject, Question? (source), LmsLesson? (source)
  - Unique constraint: @@unique([studentId, sourceQuestionId]) where sourceQuestionId is not null
  - Index: @@index([studentId, isActive, nextReviewDate])

ReviewLog
  - Relations: ReviewCard, Student
  - Index: @@index([studentId, reviewedAt])

ReviewSession
  - Relations: Student
  - Index: @@index([studentId, startedAt])
```

### 6.2 Pure Utility Functions

`src/lib/spacedRepetitionUtils.ts` (following `gamificationUtils.ts` pattern):
- `computeBoxPromotion(currentBox, rating, consecutiveCorrect, easinessFactor)` returns new box, new EF, new consecutiveCorrect
- `computeNextReviewDate(box, referenceDate)` returns next Saturday aligned to box interval
- `buildReviewQueue(cards, maxCards)` returns sorted array of max 15 cards
- `computeSubjectMastery(cards)` returns mastery percentage per subject
- `computeCardDistribution(cards)` returns count of cards per box

`src/lib/reviewAnalyticsUtils.ts` (following `lmsAnalyticsUtils.ts` pattern):
- `computeReviewCompletionRate(sessions, startDate, endDate)` returns completion percentage
- `computeClassReviewStats(studentReviewData[])` returns aggregated class metrics
- `identifyStruggledCards(reviewLogs[])` returns cards sorted by HARD rating count
- `computeReviewHeatmapData(reviewLogs[])` returns heatmap data array
- `computeMasteryTrend(cards[], snapshotDates[])` returns mastery over time

### 6.3 Server Actions

`src/lib/reviewActions.ts`:
- `submitCardReview(reviewCardId, rating)` - Atomic card update + log creation + gamification
- `startReviewSession(studentId)` - Build queue and create ReviewSession
- `completeReviewSession(sessionId)` - Finalize session, award XP
- `createTeacherReviewCard(data)` - Teacher creates flashcard for enrolled students
- `toggleLessonReviewFlag(lessonId, flag)` - Toggle flagForReview on lesson
- `generateReviewCardsFromQuiz(studentId, quizAttemptId)` - Auto-generate from incorrect answers
- `generateReviewCardFromLesson(studentId, lessonId)` - Auto-generate from flagged lesson

### 6.4 Component Architecture

**Student Review Flow:**
- `ReviewQueueContainer.tsx` (Server) -> `ReviewQueue.tsx` (Client): Queue overview page
- `ReviewSessionContainer.tsx` (Server) -> `ReviewSessionClient.tsx` (Client): Card flip interaction
- `ReviewSummary.tsx` (Client): Session completion summary
- `SubjectMasteryMeter.tsx` (Client): Per-subject mastery gauge
- `ReviewStreakCalendar.tsx` (Client): Calendar heatmap for review activity
- `CardProgressionChart.tsx` (Client): Stacked bar chart of cards per box

**Teacher Review Management:**
- `ReviewCardForm.tsx` (Client, in `forms/`): Create/edit review cards
- `PreClassReviewReportContainer.tsx` (Server) -> `PreClassReviewReport.tsx` (Client): Engagement report
- `ClassReviewAnalyticsContainer.tsx` (Server) -> `ClassReviewAnalytics.tsx` (Client): Course-level analytics

**Parent and Admin:**
- `ChildReviewActivity.tsx` (Client): Parent per-child review data
- `ReviewAdoptionMetrics.tsx` (Client): Admin school-wide metrics

### 6.5 Route Structure

```
src/app/(dashboard)/list/reviews/
  page.tsx                        # Student review queue page
  session/
    page.tsx                      # Active review session (card flip UI)
    summary/
      page.tsx                    # Session completion summary
src/app/(dashboard)/list/courses/[id]/
  reviews/
    page.tsx                      # Teacher: review card management for course
    create/
      page.tsx                    # Teacher: create new review card form
```

### 6.6 Integration Points

- **Quiz Submission**: Extend quiz submission Server Action to call `generateReviewCardsFromQuiz` after grading (fire-and-forget pattern, same as gamification)
- **Lesson Completion**: Extend `markLessonComplete` to call `generateReviewCardFromLesson` when `flagForReview === true` (fire-and-forget)
- **Gamification Engine**: Extend `processGamificationEvent` to handle `REVIEW_CORRECT`, `REVIEW_SESSION_COMPLETE`, and `MASTERY_ACHIEVED` event types with the new XP constants
- **Menu**: Add "Reviews" menu item visible to students
- **Route Access**: Add `/list/reviews` for students, `/list/courses/(.*/reviews)` for teachers and admins

---

## 7. Non-Functional Requirements

**NFR-1: Performance**
- Review queue build time: under 200ms for a student with up to 500 active cards
- Card rating submission: under 300ms including gamification processing
- Analytics computation: under 1 second for class-level aggregations

**NFR-2: Accessibility**
- Card flip interaction must be keyboard-navigable (Space/Enter to flip, 1/2/3 or H/O/E for ratings)
- Color coding must not be the sole indicator of rating difficulty (include text labels)
- Review progress must be announced to screen readers

**NFR-3: Data Integrity**
- All card rating operations must use Prisma `$transaction` to prevent partial updates
- Duplicate review card prevention via unique constraints
- FSRS fields stored as nullable to allow future population without migration

**NFR-4: Scalability**
- FSRS-ready data fields (stability, difficulty, retrievability) stored but not computed, enabling future ML integration without schema changes
- Review analytics follow the pure-function pattern for testability and potential server-side caching

---

## 8. Risks and Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Students do not engage with reviews during the 12-day gap | Medium | High | Gamification XP rewards, badge incentives, parent visibility, teacher pre-class reports |
| Review card volume grows faster than expected | Low | Medium | Active card limit per student, archive mechanism for mastered cards, pagination on all queries |
| Session-based scheduling misaligns with school calendar changes | Low | Medium | `computeNextSessionDate` accepts reference dates, making it configurable for holiday weeks |
| Teacher adoption of concept flagging is low | Medium | Medium | Default `flagForReview = false`, auto-generation from quiz errors provides baseline cards without teacher effort |
| Performance degradation with growing ReviewLog table | Low | Medium | Index on `[studentId, reviewedAt]`, potential future archival of old logs beyond one semester |

---

## 9. Dependencies

| Dependency | Status | Required For |
|------------|--------|--------------|
| SPEC-LMS-001: Course/Module/Lesson/Quiz models | Implemented | ReviewCard source references, quiz-based card generation |
| SPEC-LMS-004: LMS Analytics utilities | Implemented | Pattern reference for pure analytics functions |
| SPEC-LMS-006: Gamification engine | Implemented | XP award processing, badge evaluation, streak tracking |
| Prisma schema (28 models) | Stable | New model additions, enum extensions |
| `processGamificationEvent` | Stable | Integration for review XP and badge awards |
| `quizUtils.ts` grading engine | Stable | Quiz result data for review card generation |

---

## 10. Traceability

| Requirement | TAG | Component | Test Scenario |
|-------------|-----|-----------|---------------|
| REQ-LMS-050-055 | TAG-1 | Prisma schema, migration | ACC-001 through ACC-006 |
| REQ-LMS-060-065 | TAG-2 | spacedRepetitionUtils.ts | ACC-010 through ACC-016 |
| REQ-LMS-070-073 | TAG-2 | reviewActions.ts | ACC-020 through ACC-024 |
| REQ-LMS-080-083 | TAG-3 | ReviewQueue, ReviewSession | ACC-030 through ACC-034 |
| REQ-LMS-090-093 | TAG-3 | Review pages, components | ACC-040 through ACC-044 |
| REQ-LMS-100-102 | TAG-4 | ReviewCardForm, reports | ACC-050 through ACC-053 |
| REQ-LMS-110-111 | TAG-7 | Parent/Admin widgets | ACC-060 through ACC-062 |
| REQ-LMS-120-124 | TAG-5 | Gamification integration | ACC-070 through ACC-075 |
| REQ-LMS-130-132 | TAG-6 | Analytics components | ACC-080 through ACC-083 |

---

## 11. Implementation Notes

### Completion Summary

Implementation completed on 2026-02-22 across 7 TAGs with 37 files changed (+3,059 lines).

### TAG Execution Order

| TAG | Commit | Scope | Files |
|-----|--------|-------|-------|
| TAG-1 | `eae6c23` | Database schema: 3 models (ReviewCard, ReviewLog, ReviewSession), 2 enums, LmsLesson.flagForReview, 4 review badges | 2 |
| TAG-2 | `b3bd8d4` | Spaced repetition engine: spacedRepetitionUtils.ts (7 pure functions), reviewActions.ts (7 server actions), quiz/lesson integration | 4 |
| TAG-3 | `84eb446` | Student review UI: queue page, card flip session, session summary, mastery meter, streak calendar, progression chart | 11 |
| TAG-4 | `71cfd37` | Teacher management: ReviewCardForm, pre-class report, lesson flagForReview toggle, course review pages | 7 |
| TAG-5 | `27596cf` | Gamification: REVIEW event handling, 4 badge categories (review, review_streak, mastery, review_perfect), XP constants | 2 |
| TAG-6 | `cbe172c` | Analytics: reviewAnalyticsUtils.ts (6 pure functions), student/teacher/admin dashboard widgets, Container/Client pairs | 11 |
| TAG-7 | `e11eedf` | Integration: parent ChildReviewActivity widget, Reviews menu item, route access configuration | 5 |

### Divergence from Original Plan

- **Unique constraint approach**: Plan specified `@@unique([studentId, sourceQuestionId])` partial constraint. Implementation used `@@index([studentId, sourceQuestionId])` with application-level upsert logic instead, due to Prisma limitations on conditional unique constraints with nullable fields.
- **No deviations in scope**: All planned features were implemented. No unplanned additions or deferred items.

### Quality Status

- TypeScript: Zero errors
- All requirements (REQ-LMS-050 through REQ-LMS-132) implemented
- FSRS-ready fields (stability, difficulty, retrievability) stored as nullable for future ML optimization
- Fire-and-forget pattern maintained for all gamification integrations
