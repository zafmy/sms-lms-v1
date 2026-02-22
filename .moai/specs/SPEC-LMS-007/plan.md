---
id: SPEC-LMS-007
title: "Spaced Repetition System - Implementation Plan"
version: "1.0.0"
status: completed
created: 2026-02-22
tags:
  - SPEC-LMS-007
  - spaced-repetition
  - implementation-plan
---

# SPEC-LMS-007: Implementation Plan

## Overview

This plan organizes the Spaced Repetition System implementation into 7 TAGs (milestones) with clear dependencies. Each TAG is self-contained and delivers testable functionality. No time estimates are provided; TAGs are ordered by dependency and priority.

---

## TAG-1: Database Schema (Prisma Models and Migration)

**Priority**: Primary Goal (all other TAGs depend on this)
**Dependency**: None (builds on existing schema)

### Deliverables

1. **Extend `prisma/schema.prisma`** with new models and enums:

   - Add `ReviewCardType` enum: `QUIZ_QUESTION`, `VOCABULARY`, `CONCEPT`, `FLASHCARD`
   - Add `ReviewRating` enum: `HARD`, `OK`, `EASY`
   - Add `REVIEW` value to existing `XpSource` enum
   - Add `REVIEW` value to existing `NotificationType` enum
   - Add `ReviewCard` model with all fields from REQ-LMS-050 including FSRS-ready nullable fields (`stability`, `difficulty`, `retrievability`)
   - Add `ReviewLog` model from REQ-LMS-051
   - Add `ReviewSession` model from REQ-LMS-052
   - Add `flagForReview Boolean @default(false)` field to `LmsLesson` model (REQ-LMS-054)
   - Add relation fields on `Student` model: `reviewCards ReviewCard[]`, `reviewLogs ReviewLog[]`, `reviewSessions ReviewSession[]`
   - Add relation fields on `Course` model: `reviewCards ReviewCard[]`
   - Add relation fields on `Subject` model: `reviewCards ReviewCard[]`

2. **Add database indexes**:
   - `ReviewCard`: `@@index([studentId, isActive, nextReviewDate])`
   - `ReviewCard`: `@@unique([studentId, sourceQuestionId])` (conditional, for non-null sourceQuestionId)
   - `ReviewLog`: `@@index([studentId, reviewedAt])`
   - `ReviewLog`: `@@index([reviewCardId])`
   - `ReviewSession`: `@@index([studentId, startedAt])`

3. **Generate and apply migration**:
   - `npx prisma migrate dev --name add-spaced-repetition-models`
   - `npx prisma generate`

4. **Update seed script** (`prisma/seed.ts`):
   - Add 4 new review-related badges:
     - "First Review" (category: `review`, threshold: 1)
     - "Review Streak 4" (category: `review_streak`, threshold: 4)
     - "Master 50 Cards" (category: `mastery`, threshold: 50)
     - "Perfect Session" (category: `review_perfect`, threshold: 1)

### Files Modified

| File | Action | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Edit | Add 3 new models, 2 new enums, extend 2 existing enums, add field to LmsLesson |
| `prisma/seed.ts` | Edit | Add 4 review-related badge seeds |

### Verification

- Migration applies without errors
- `npx prisma generate` produces updated client
- New models appear in Prisma Studio
- Seed script creates 4 new badges

---

## TAG-2: Spaced Repetition Engine (Pure Utility Functions, Card Generation, Scheduling)

**Priority**: Primary Goal
**Dependency**: TAG-1

### Deliverables

1. **Create `src/lib/spacedRepetitionUtils.ts`** (pure functions, no Prisma):

   - `computeBoxPromotion(currentBox: number, rating: ReviewRating, consecutiveCorrect: number, easinessFactor: number)`: Returns `{ newBox, newEF, newConsecutiveCorrect }`
     - HARD: Box 1, EF -= 0.3 (min 1.3), consecutiveCorrect = 0
     - OK: Stay or promote by 1 (promote if consecutiveCorrect >= 2), EF -= 0.1 (min 1.3), consecutiveCorrect + 1
     - EASY: Promote by 1-2 (2 if EF >= 2.5), EF += 0.15, consecutiveCorrect = 0
   - `computeNextReviewDate(box: number, referenceDate: Date)`: Returns next Saturday aligned to Leitner interval
     - Box 1: Next weekend (find next Saturday)
     - Box 2: 2nd weekend from reference
     - Box 3: 4th weekend from reference
     - Box 4: 8th weekend from reference
     - Box 5: 24th weekend from reference
   - `getNextSaturday(date: Date)`: Returns the next Saturday after a given date
   - `buildReviewQueue(cards: ReviewCard[], maxCards: number)`: Returns sorted array (overdue first, then due, then new)
   - `computeSubjectMastery(cards: { subjectId: number, leitnerBox: number }[])`: Returns Map of subjectId to mastery percentage (Box 4-5 = mastered)
   - `computeCardDistribution(cards: { leitnerBox: number }[])`: Returns array of counts per box [box1, box2, box3, box4, box5]
   - `estimateReviewTime(cardCount: number)`: Returns estimated seconds (cardCount * 45)

   XP constants for review:
   - `XP_REVIEW_CORRECT = 10`
   - `XP_REVIEW_HARD_BONUS = 5`
   - `XP_REVIEW_SESSION_COMPLETE = 50`
   - `XP_MASTERY_BONUS = 25`

2. **Create `src/lib/reviewActions.ts`** (Server Actions):

   - `startReviewSession(studentId: string)`: Build queue from ReviewCard records, create ReviewSession, return session ID and cards
   - `submitCardReview(reviewCardId: number, sessionId: number, rating: ReviewRating, responseTimeMs: number)`: Atomic Prisma `$transaction`:
     - Compute new box/EF via `computeBoxPromotion`
     - Update ReviewCard (box, EF, nextReviewDate, lastReviewedAt, reviewCount)
     - Create ReviewLog
     - Update ReviewSession counters
     - Call `processGamificationEvent` for XP (fire-and-forget)
     - If card reaches Box 5, award mastery bonus XP
   - `completeReviewSession(sessionId: number)`: Mark session completed, award session completion XP
   - `generateReviewCardsFromQuiz(studentId: string, quizAttemptId: number)`: Query incorrect responses, create ReviewCards (skip duplicates via upsert pattern)
   - `generateReviewCardFromLesson(studentId: string, lessonId: number)`: Create CONCEPT ReviewCard from flagged lesson
   - `createTeacherReviewCard(data: FormData)`: Teacher creates FLASHCARD/VOCABULARY cards for enrolled students
   - `toggleLessonReviewFlag(lessonId: number, flag: boolean)`: Update LmsLesson.flagForReview

3. **Integrate card generation into existing Server Actions**:

   - Extend quiz submission in `src/lib/actions.ts`: After successful quiz grading, call `generateReviewCardsFromQuiz` (fire-and-forget)
   - Extend `markLessonComplete` in `src/lib/actions.ts`: After successful completion, if `lesson.flagForReview === true`, call `generateReviewCardFromLesson` (fire-and-forget)

### Files Created

| File | Description |
|------|-------------|
| `src/lib/spacedRepetitionUtils.ts` | Pure utility functions for Leitner algorithm and scheduling |
| `src/lib/reviewActions.ts` | Server Actions for review operations |

### Files Modified

| File | Action | Description |
|------|--------|-------------|
| `src/lib/actions.ts` | Edit | Add fire-and-forget calls to card generation after quiz submission and lesson completion |
| `src/lib/gamificationUtils.ts` | Edit | Add review XP constants (`XP_REVIEW_CORRECT`, etc.) |

### Verification

- Unit tests for all pure functions in `spacedRepetitionUtils.ts`
- Box promotion logic matches REQ-LMS-061, REQ-LMS-062, REQ-LMS-063
- `computeNextReviewDate` returns correct Saturdays for all 5 boxes
- Review queue sorts correctly: overdue, due, new
- Integration: Quiz submission creates ReviewCards for incorrect answers
- Integration: Lesson completion with flagForReview creates CONCEPT card

---

## TAG-3: Student Review UI (Queue Page, Card Flip Component, Session Summary)

**Priority**: Primary Goal
**Dependency**: TAG-1, TAG-2

### Deliverables

1. **Review Queue Page** (`src/app/(dashboard)/list/reviews/page.tsx`):
   - Server Component fetching student's due cards via Prisma
   - Display: total due cards, estimated time, subject breakdown
   - "Start Review" button linking to session page
   - Empty state when no cards are due

2. **Review Session Page** (`src/app/(dashboard)/list/reviews/session/page.tsx`):
   - `ReviewSessionContainer.tsx` (Server): Start session via `startReviewSession`, pass cards and session ID
   - `ReviewSessionClient.tsx` (Client): Card flip interaction
     - Front side: question/prompt text
     - Click/tap to flip and reveal back (answer)
     - Three rating buttons: Hard (red), OK (yellow), Easy (green)
     - Progress bar showing cards completed / total
     - Keyboard support: Space to flip, H/O/E or 1/2/3 to rate
     - Each rating calls `submitCardReview` Server Action
     - On final card, redirect to summary page

3. **Session Summary Page** (`src/app/(dashboard)/list/reviews/session/summary/page.tsx`):
   - `ReviewSummary.tsx` (Client): Display session results
     - Cards reviewed count
     - Correct/incorrect breakdown
     - XP earned in this session
     - Streak status
     - Per-subject mastery progress bars

4. **Review History Section** (on reviews page):
   - Card distribution chart (cards per box, Recharts BarChart)
   - Subject mastery meters
   - Recent review sessions list

5. **Supporting Components**:
   - `SubjectMasteryMeter.tsx`: Horizontal progress bar per subject (Box 4-5 %)
   - `ReviewStreakCalendar.tsx`: Calendar heatmap (reuse pattern from `LearningActivityHeatmap`)
   - `CardProgressionChart.tsx`: Stacked BarChart showing cards per box over time

### Files Created

| File | Description |
|------|-------------|
| `src/app/(dashboard)/list/reviews/page.tsx` | Review queue page (student) |
| `src/app/(dashboard)/list/reviews/session/page.tsx` | Active review session |
| `src/app/(dashboard)/list/reviews/session/summary/page.tsx` | Session completion summary |
| `src/components/ReviewSessionContainer.tsx` | Server: fetch session data |
| `src/components/ReviewSessionClient.tsx` | Client: card flip interaction |
| `src/components/ReviewSummary.tsx` | Client: session summary display |
| `src/components/ReviewQueueContainer.tsx` | Server: fetch queue data |
| `src/components/ReviewQueue.tsx` | Client: queue overview display |
| `src/components/SubjectMasteryMeter.tsx` | Client: per-subject mastery gauge |
| `src/components/ReviewStreakCalendar.tsx` | Client: review activity calendar |
| `src/components/CardProgressionChart.tsx` | Client: cards per box chart |

### Verification

- Review queue page shows due cards with correct count
- Card flip works with click and keyboard (Space)
- Rating buttons trigger correct Server Action
- Progress bar advances after each card
- Session summary shows accurate XP and card counts
- Empty state renders when no cards are due

---

## TAG-4: Teacher Review Management (Card Creation, Pre-Class Report, Concept Flagging)

**Priority**: Secondary Goal
**Dependency**: TAG-1, TAG-2

### Deliverables

1. **Review Card Creation Form** (`src/components/forms/ReviewCardForm.tsx`):
   - Client Component using React Hook Form + Zod
   - Fields: front text, back text, card type (FLASHCARD or VOCABULARY), target (all enrolled or select students)
   - Calls `createTeacherReviewCard` Server Action

2. **Teacher Review Card Management Page** (`src/app/(dashboard)/list/courses/[id]/reviews/page.tsx`):
   - Server Component: List existing review cards for the course
   - Create new card button linking to creation form
   - Table of existing cards with type, front preview, student count, average box level

3. **Review Card Creation Page** (`src/app/(dashboard)/list/courses/[id]/reviews/create/page.tsx`):
   - Server Component: Render `ReviewCardForm` with course context

4. **Lesson flagForReview Toggle**:
   - Edit `src/components/forms/LmsLessonForm.tsx`: Add checkbox for `flagForReview`
   - Edit `src/lib/formValidationSchemas.ts`: Add `flagForReview` to lesson schema

5. **Pre-Class Review Report**:
   - `PreClassReviewReportContainer.tsx` (Server): Fetch review session data for teacher's students
   - `PreClassReviewReport.tsx` (Client): Display per-student completion table
     - Columns: Student Name, Reviews Completed (last 2 weeks), Completion Rate, Average Score
     - Highlight students with 0 reviews in red
     - Summary row: class average completion rate

6. **Zod Schema Updates**:
   - Add `reviewCardSchema` to `src/lib/formValidationSchemas.ts`
   - Update `lmsLessonSchema` with `flagForReview` field

### Files Created

| File | Description |
|------|-------------|
| `src/components/forms/ReviewCardForm.tsx` | Teacher review card creation form |
| `src/app/(dashboard)/list/courses/[id]/reviews/page.tsx` | Teacher: course review cards list |
| `src/app/(dashboard)/list/courses/[id]/reviews/create/page.tsx` | Teacher: create review card |
| `src/components/PreClassReviewReportContainer.tsx` | Server: fetch pre-class review data |
| `src/components/PreClassReviewReport.tsx` | Client: pre-class engagement report |

### Files Modified

| File | Action | Description |
|------|--------|-------------|
| `src/components/forms/LmsLessonForm.tsx` | Edit | Add flagForReview checkbox |
| `src/lib/formValidationSchemas.ts` | Edit | Add reviewCardSchema, update lmsLessonSchema |

### Verification

- Teacher can create flashcard review cards for a course
- Cards are assigned to all enrolled students
- flagForReview toggle appears on lesson form
- Pre-class report shows correct completion rates
- Students with zero reviews are highlighted

---

## TAG-5: Gamification Integration (XP for Reviews, New Badges, Mastery Tracking)

**Priority**: Secondary Goal
**Dependency**: TAG-1, TAG-2

### Deliverables

1. **Extend Gamification Engine**:
   - Edit `src/lib/gamificationActions.ts`: Add handling for new event types:
     - `REVIEW_CORRECT`: Award XP_REVIEW_CORRECT (10), plus XP_REVIEW_HARD_BONUS (5) if card was in Box 1
     - `REVIEW_SESSION_COMPLETE`: Award XP_REVIEW_SESSION_COMPLETE (50)
     - `MASTERY_ACHIEVED`: Award XP_MASTERY_BONUS (25) when card reaches Box 5
   - Add badge evaluation for categories: `review`, `review_streak`, `mastery`, `review_perfect`

2. **Extend gamificationUtils.ts**:
   - Add `computeReviewXp(rating: ReviewRating, previousBox: number)` pure function
   - Add review XP constants to exports

3. **Ensure fire-and-forget pattern**:
   - Review XP processing in `submitCardReview` follows the same try/catch pattern as existing gamification integration
   - Errors logged but not surfaced to student

### Files Modified

| File | Action | Description |
|------|--------|-------------|
| `src/lib/gamificationActions.ts` | Edit | Add REVIEW event handling, new badge categories |
| `src/lib/gamificationUtils.ts` | Edit | Add review XP computation function and constants |

### Verification

- Correct review card awards 10 XP
- Box 1 correct card awards additional 5 XP
- Session completion awards 50 XP
- Card reaching Box 5 awards 25 XP
- "First Review" badge awarded after first session
- "Perfect Session" badge awarded when all cards correct
- Gamification errors do not break review flow

---

## TAG-6: Analytics Dashboard (Student Mastery Charts, Teacher Class Analytics, Admin Metrics)

**Priority**: Secondary Goal
**Dependency**: TAG-1, TAG-2, TAG-3

### Deliverables

1. **Create `src/lib/reviewAnalyticsUtils.ts`** (pure functions):
   - `computeReviewCompletionRate(sessions, startDate, endDate)`: Percentage of expected sessions completed
   - `computeClassReviewStats(studentReviewData[])`: Aggregated class metrics (avg completion, avg mastery, total sessions)
   - `identifyStruggledCards(reviewLogs[])`: Cards sorted by HARD rating frequency
   - `computeReviewHeatmapData(reviewLogs[])`: Daily review activity counts for calendar heatmap
   - `computeMasteryTrend(snapshots[])`: Mastery percentage over time for trend chart
   - `computeSchoolWideReviewMetrics(allStudentData)`: Admin-level aggregation

2. **Student Analytics Components**:
   - `SubjectMasteryMeterContainer.tsx` (Server): Fetch student's review cards, compute mastery per subject
   - Wire `SubjectMasteryMeter.tsx` to display mastery gauges
   - `ReviewStreakCalendarContainer.tsx` (Server): Fetch review logs for heatmap
   - Wire `ReviewStreakCalendar.tsx` with computed heatmap data
   - `CardProgressionChartContainer.tsx` (Server): Fetch card box distribution
   - Wire `CardProgressionChart.tsx` with Recharts StackedBarChart

3. **Teacher Analytics Components**:
   - `ClassReviewAnalyticsContainer.tsx` (Server): Fetch review data for course students
   - `ClassReviewAnalytics.tsx` (Client): Display class-level review metrics
     - Completion rate per weekend (Recharts LineChart)
     - Most struggled cards table
     - Per-student engagement summary table
     - Pre-class readiness score percentage

4. **Admin Analytics Components**:
   - `ReviewAdoptionMetricsContainer.tsx` (Server): Fetch school-wide review data
   - `ReviewAdoptionMetrics.tsx` (Client): Display adoption rate, avg mastery, total sessions

5. **Integration with existing analytics pages**:
   - Add student review analytics to student dashboard
   - Add teacher review analytics to course analytics page (`/list/courses/[id]/analytics`)
   - Add admin review metrics to admin dashboard

### Files Created

| File | Description |
|------|-------------|
| `src/lib/reviewAnalyticsUtils.ts` | Pure analytics functions for review data |
| `src/components/SubjectMasteryMeterContainer.tsx` | Server: fetch mastery data |
| `src/components/ReviewStreakCalendarContainer.tsx` | Server: fetch review heatmap data |
| `src/components/CardProgressionChartContainer.tsx` | Server: fetch card distribution data |
| `src/components/ClassReviewAnalyticsContainer.tsx` | Server: fetch class review data |
| `src/components/ClassReviewAnalytics.tsx` | Client: class review analytics display |
| `src/components/ReviewAdoptionMetricsContainer.tsx` | Server: fetch school-wide data |
| `src/components/ReviewAdoptionMetrics.tsx` | Client: admin review metrics |

### Files Modified

| File | Action | Description |
|------|--------|-------------|
| `src/app/(dashboard)/student/page.tsx` | Edit | Add review mastery and streak widgets |
| `src/app/(dashboard)/list/courses/[id]/analytics/page.tsx` | Edit | Add class review analytics section |
| `src/app/(dashboard)/admin/page.tsx` | Edit | Add review adoption metrics widget |

### Verification

- Student mastery meters show correct Box 4-5 percentages
- Review heatmap shows correct daily activity counts
- Card progression chart renders stacked bars per box
- Teacher analytics shows class completion and struggled cards
- Admin metrics reflect school-wide adoption rates
- All charts use Recharts and follow Container/Client pattern

---

## TAG-7: Parent View and Menu/Route Integration

**Priority**: Final Goal
**Dependency**: TAG-1, TAG-3, TAG-6

### Deliverables

1. **Parent Dashboard Widget**:
   - `ChildReviewActivityContainer.tsx` (Server): Fetch child's review data
   - `ChildReviewActivity.tsx` (Client): Display per-child review info
     - Review completion rate (sessions completed / expected)
     - Current review streak (weekends with reviews)
     - Subjects being reviewed with mastery indicators

2. **Menu Integration**:
   - Edit `src/components/Menu.tsx`: Add "Reviews" menu item
     - `{ icon: "/result.png", label: "Reviews", href: "/list/reviews", visible: ["student"] }`
   - Add "Review Cards" in teacher section or accessible from course detail page

3. **Route Access Integration**:
   - Edit `src/lib/settings.ts`: Add route access entries
     - `"/list/reviews"`: `["student"]`
     - `"/list/reviews/session"`: `["student"]`
     - `"/list/reviews/session/summary"`: `["student"]`
     - `"/list/courses/(.*/reviews)"`: `["admin", "teacher"]`

4. **Parent Dashboard Integration**:
   - Edit `src/app/(dashboard)/parent/page.tsx`: Add `ChildReviewActivity` widget alongside existing `ChildLmsProgressCard` and `ChildGamificationStats`

### Files Created

| File | Description |
|------|-------------|
| `src/components/ChildReviewActivityContainer.tsx` | Server: fetch child review data |
| `src/components/ChildReviewActivity.tsx` | Client: parent per-child review widget |

### Files Modified

| File | Action | Description |
|------|--------|-------------|
| `src/components/Menu.tsx` | Edit | Add Reviews menu item for students |
| `src/lib/settings.ts` | Edit | Add review route access entries |
| `src/app/(dashboard)/parent/page.tsx` | Edit | Add child review activity widget |

### Verification

- "Reviews" appears in student sidebar menu
- Students can navigate to /list/reviews
- Teachers can access /list/courses/[id]/reviews
- Parent dashboard shows child review activity
- Route access prevents unauthorized access

---

## Dependency Graph

```
TAG-1 (Database Schema)
  |
  +--> TAG-2 (Spaced Repetition Engine)
  |      |
  |      +--> TAG-3 (Student Review UI)
  |      |      |
  |      |      +--> TAG-6 (Analytics Dashboard)
  |      |      |
  |      |      +--> TAG-7 (Parent View + Routes)
  |      |
  |      +--> TAG-4 (Teacher Management)
  |      |
  |      +--> TAG-5 (Gamification Integration)
```

## Implementation Order

1. **TAG-1** (Database Schema) - Foundation, must be first
2. **TAG-2** (Engine) - Core algorithm, enables all UI and integration work
3. **TAG-3** and **TAG-4** and **TAG-5** (Student UI, Teacher Management, Gamification) - Can be developed in parallel after TAG-2
4. **TAG-6** (Analytics) - Depends on TAG-3 for review data to exist
5. **TAG-7** (Parent View + Routes) - Final integration and polish

## Expert Consultation Recommendations

- **expert-backend**: Recommended for TAG-1 (schema design) and TAG-2 (algorithm implementation, Server Action patterns, Prisma transaction design)
- **expert-frontend**: Recommended for TAG-3 (card flip interaction, keyboard accessibility, Recharts integration) and TAG-6 (analytics charts)
