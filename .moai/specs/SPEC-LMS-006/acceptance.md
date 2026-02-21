# SPEC-LMS-006: Acceptance Criteria

## Metadata

| Field   | Value          |
| ------- | -------------- |
| SPEC ID | SPEC-LMS-006   |
| Title   | LMS Gamification System - Acceptance Criteria |
| Status  | Planned        |

---

## XP Award Scenarios

### AC-001: Lesson Completion Awards XP

**Given** a student with 0 XP and no `StudentGamification` record
**When** the student completes a lesson (LessonProgress transitions to COMPLETED)
**Then** a `StudentGamification` record is created with `totalXp = 10` and `currentLevel = 1`
**And** an `XpTransaction` record is created with `amount = 10`, `source = LESSON`, and `sourceId` set to the lesson ID

### AC-002: Lesson Completion Increments Existing XP

**Given** a student with `totalXp = 40` in their `StudentGamification` record
**When** the student completes another lesson
**Then** `totalXp` is updated to `50`
**And** a new `XpTransaction` record with `amount = 10` and `source = LESSON` is created

### AC-003: Quiz Submission Awards Base XP

**Given** a student submits a quiz with a score of 55% (below the quiz's passScore of 70)
**When** the `processGamificationEvent` is called with event type `QUIZ_SUBMIT`
**Then** an `XpTransaction` with `amount = 15` and `source = QUIZ` is created
**And** `totalXp` is incremented by 15

### AC-004: Quiz Pass Awards Bonus XP

**Given** a student submits a quiz with a score of 80% (at or above the quiz's passScore of 70)
**When** the `processGamificationEvent` is called
**Then** two XP amounts are awarded: 15 (submission) + 25 (pass bonus) = 40 total
**And** `totalXp` is incremented by 40

### AC-005: Perfect Quiz Score Awards Maximum XP

**Given** a student submits a quiz with a score of 100%
**When** the `processGamificationEvent` is called
**Then** three XP amounts are awarded: 15 (submission) + 25 (pass) + 50 (perfect) = 90 total
**And** `totalXp` is incremented by 90

### AC-006: XP Counter Consistency

**Given** a student has 5 `XpTransaction` records with amounts [10, 15, 25, 5, 10]
**When** the `StudentGamification.totalXp` is read
**Then** it equals 65 (sum of all transactions)

---

## Streak Scenarios

### AC-010: First Activity Sets Streak to 1

**Given** a student has no `StudentGamification` record (or `lastActivityDate` is null)
**When** the student completes a lesson or submits a quiz
**Then** `currentStreak` is set to 1
**And** `longestStreak` is set to 1
**And** `lastActivityDate` is set to today's UTC date

### AC-011: Consecutive Day Activity Increments Streak

**Given** a student has `currentStreak = 3`, `longestStreak = 5`, and `lastActivityDate = yesterday (UTC)`
**When** the student completes an activity today
**Then** `currentStreak` is updated to 4
**And** `longestStreak` remains 5
**And** `lastActivityDate` is updated to today

### AC-012: Gap Greater Than 1 Day Resets Streak

**Given** a student has `currentStreak = 5` and `lastActivityDate = 3 days ago (UTC)`
**When** the student completes an activity today
**Then** `currentStreak` is reset to 1
**And** `longestStreak` is preserved at 5 (if it was already >= 5)
**And** `lastActivityDate` is updated to today

### AC-013: Multiple Activities on Same Day Do Not Increment Streak

**Given** a student has `currentStreak = 2` and `lastActivityDate = today (UTC)`
**When** the student completes a second lesson on the same day
**Then** `currentStreak` remains 2
**And** `lastActivityDate` remains today
**And** daily streak XP is NOT awarded again

### AC-014: Streak Increment Awards Daily XP

**Given** a student has `currentStreak = 2` and `lastActivityDate = yesterday`
**When** the student completes an activity today (streak increments to 3)
**Then** an `XpTransaction` with `amount = 5`, `source = STREAK` is created

### AC-015: 7-Day Streak Awards Bonus XP and Badge

**Given** a student has `currentStreak = 6` and `lastActivityDate = yesterday`
**When** the student completes an activity today (streak increments to 7)
**Then** an `XpTransaction` with `amount = 5` (daily) is created
**And** an `XpTransaction` with `amount = 30` (7-day bonus) is created
**And** the "Dedicated" badge is awarded (if not already held)

---

## Badge Scenarios

### AC-016: Badge Definitions in Database

**Given** the database has been seeded
**When** a query retrieves all `Badge` records
**Then** exactly 10 badges exist with the names: First Steps, Quiz Taker, Perfect Score, Consistent, Dedicated, Marathon, Scholar, Bookworm, Century, XP Master
**And** each badge has non-empty `name`, `description`, `category`, and `xpReward` fields

### AC-017: Badge Award on Meeting Criteria

**Given** a student has completed 0 lessons and the "First Steps" badge requires 1 lesson completion
**When** the student completes their first lesson
**Then** a `StudentBadge` record is created linking the student to the "First Steps" badge
**And** an `XpTransaction` with `amount = 10`, `source = BADGE` is created
**And** `totalXp` is incremented by the badge's XP reward

### AC-018: Duplicate Badge Prevention

**Given** a student already holds the "First Steps" badge
**When** the student completes another lesson (triggering badge evaluation)
**Then** no new `StudentBadge` record is created
**And** no `BADGE` type `XpTransaction` is created
**And** no error is thrown

### AC-019: Seed Data Idempotency

**Given** the seed script has already been run once
**When** the seed script is run again
**Then** the 10 default badges still exist (no duplicates)
**And** existing `StudentBadge` records are not affected

### AC-020: Badge Award Creates Notification

**Given** a student earns the "Consistent" badge (3-day streak)
**When** the badge is awarded
**Then** a `Notification` record is created with `type = GAMIFICATION` and `userId` set to the student's Clerk ID
**And** the `message` contains the badge name "Consistent"

---

## Level Scenarios

### AC-025: Level Threshold Accuracy

**Given** the level thresholds are [0, 50, 150, 300, 500, 750, 1050, 1400, 1800, 2250]
**When** a student has `totalXp = 0`, **then** `currentLevel = 1`
**When** a student has `totalXp = 49`, **then** `currentLevel = 1`
**When** a student has `totalXp = 50`, **then** `currentLevel = 2`
**When** a student has `totalXp = 149`, **then** `currentLevel = 2`
**When** a student has `totalXp = 150`, **then** `currentLevel = 3`
**When** a student has `totalXp = 2250`, **then** `currentLevel = 10`

### AC-026: Level Progress Percentage

**Given** a student has `totalXp = 100` (Level 2, threshold 50, next threshold 150)
**When** the level progress is computed
**Then** the percentage is `(100 - 50) / (150 - 50) * 100 = 50%`

### AC-007: Level-Up on XP Award

**Given** a student has `totalXp = 45` and `currentLevel = 1`
**When** the student earns 10 XP (new total: 55)
**Then** `currentLevel` is updated to 2

### AC-027: Level-Up Notification

**Given** a student levels up from Level 2 to Level 3
**When** the level-up is detected
**Then** a `Notification` record is created with `type = GAMIFICATION`
**And** the message indicates the new level

---

## Leaderboard Scenarios

### AC-021: Leaderboard Displays Correct Ranking

**Given** a class has 3 students with `totalXp` values of 500, 300, and 750
**And** the teacher has enabled the leaderboard for this class
**When** the "All Time" leaderboard is viewed
**Then** students are displayed in order: 750 XP (rank 1), 500 XP (rank 2), 300 XP (rank 3)

### AC-022: Anonymous Leaderboard Mode

**Given** the leaderboard is configured in anonymous mode for a class
**When** the leaderboard is viewed
**Then** ranks and XP values are displayed
**And** student names are NOT displayed (replaced with "Student #1", "Student #2", etc.)

### AC-023: Weekly Leaderboard

**Given** a class has students with various XP transactions over the last 14 days
**When** the "This Week" tab is selected on the leaderboard
**Then** only XP earned in the last 7 days is counted for ranking
**And** students are re-ranked based on weekly XP

### AC-024: Leaderboard Pagination

**Given** a class has more than 50 students with gamification records
**When** the leaderboard is viewed
**Then** only 50 students are shown per page
**And** pagination controls are displayed

---

## Dashboard Integration Scenarios

### AC-028: Student Dashboard Gamification Card

**Given** a student has `currentLevel = 3`, `totalXp = 200`, `currentStreak = 5`, `longestStreak = 12`
**When** the student dashboard loads
**Then** the gamification card displays: "Level 3", "200 XP", a progress bar showing 50% (200 is halfway between 150 and 300), streak flame icon with "5 days", and "Longest: 12 days"

### AC-029: Student Dashboard Recent Badges

**Given** a student has earned 5 badges, the 3 most recent being "Dedicated" (Feb 20), "Century" (Feb 18), "Consistent" (Feb 15)
**When** the student dashboard loads
**Then** the recent badges section shows these 3 badges in reverse chronological order
**And** each badge shows its icon, name, and earned date

### AC-030: Achievements Page Link

**Given** a student is viewing their dashboard
**When** they look at the gamification section
**Then** a "View All Achievements" link is visible
**And** clicking it navigates to `/list/achievements`

### AC-031: Achievements Page Full Content

**Given** a student has earned 4 out of 10 badges, has 350 XP at Level 4, and a current streak of 7
**When** the achievements page loads at `/list/achievements`
**Then** the badge gallery shows 4 badges in color and 6 badges grayed out with lock icons
**And** the XP transaction history shows a paginated list of transactions
**And** the streak calendar shows activity days highlighted
**And** the level progress section shows Level 4 with progress toward Level 5

### AC-032: Parent Dashboard Child Gamification

**Given** a parent has 2 children enrolled
**And** Child 1 has Level 3, 200 XP, streak 5
**And** Child 2 has Level 1, 30 XP, streak 0
**When** the parent dashboard loads
**Then** Child 1's section shows "Level 3 - 200 XP - 5 day streak"
**And** Child 2's section shows "Level 1 - 30 XP - No active streak"

### AC-033: Admin Dashboard Adoption Metrics

**Given** there are 50 students total
**And** 20 students have `currentStreak > 0`
**And** the average `totalXp` across all students is 175
**And** 85 total `StudentBadge` records exist
**When** the admin dashboard loads
**Then** the gamification metrics card shows: "Active Streaks: 20", "Avg XP: 175", "Badges Awarded: 85"

### AC-034: Admin Badge Creation

**Given** an admin opens the badge creation form
**When** they fill in Name: "Super Star", Description: "Complete 5 courses", Category: "course", Threshold: 5, XP Reward: 150
**And** submit the form
**Then** a new `Badge` record is created in the database
**And** the badge list page is revalidated
**And** a success toast is displayed

---

## Edge Case Scenarios

### EC-001: Student with No Gamification Record

**Given** a student has never triggered any gamification event
**When** the student dashboard loads
**Then** the gamification card shows "Level 1", "0 XP", progress bar at 0%, "No active streak"
**And** the recent badges section shows "No badges earned yet. Start learning!"

### EC-002: Course Completion Detection

**Given** a course has 3 modules with 2 lessons each (6 lessons total)
**And** a student has completed 5 of 6 lessons
**When** the student completes the 6th and final lesson
**Then** course completion XP (100 XP) is awarded in addition to the lesson completion XP (10 XP)
**And** the "Scholar" badge is evaluated (first course completion)

### EC-003: Multiple Level-Ups in Single Event

**Given** a student has `totalXp = 45` and `currentLevel = 1`
**When** the student earns 110 XP in a single event (e.g., perfect quiz 90 XP + badge 20 XP)
**Then** `totalXp` becomes 155
**And** `currentLevel` is updated to 3 (skipping Level 2)

### EC-004: Maximum Level Reached

**Given** a student has `currentLevel = 10` and `totalXp = 2300`
**When** the student earns more XP
**Then** `totalXp` increments correctly
**And** `currentLevel` remains 10 (no Level 11 defined)
**And** the progress bar shows 100% (or "Max Level")

### EC-005: Streak Across Weekend Sessions

**Given** the school operates on Saturday and Sunday
**And** a student is active on Saturday (day 1) and Sunday (day 2)
**And** the student is NOT active Monday through Friday (5-day gap)
**When** the student is active the following Saturday
**Then** `currentStreak` resets to 1 (gap > 1 day)

### EC-006: Badge with Zero XP Reward

**Given** an admin creates a badge with `xpReward = 0`
**When** a student earns this badge
**Then** a `StudentBadge` record is created
**And** no `XpTransaction` of type `BADGE` is created (no XP to award)
**And** a notification is still sent

### EC-007: Concurrent Quiz Submissions

**Given** a student has two browser tabs open on the same quiz
**When** both tabs submit the quiz at approximately the same time
**Then** the quiz attempt logic handles this per existing `maxAttempts` enforcement
**And** `processGamificationEvent` is called for each valid attempt
**And** the `@@unique([studentId, badgeId])` constraint prevents duplicate badge awards

### EC-008: Student Unenrolls from Course After Earning XP

**Given** a student has earned 60 XP from activities in a course
**When** the student unenrolls (drops) from the course
**Then** the earned XP and badges are NOT revoked (XP transactions are append-only)
**And** the `StudentGamification` record remains unchanged

### EC-009: Gamification Data When No Enrollment Exists

**Given** a student has no active enrollments
**When** the achievements page is viewed
**Then** the page renders with: badge gallery showing all badges as locked, empty XP transaction history with "No activity yet" message, streak calendar with no highlighted days

### EC-010: processGamificationEvent Transaction Failure

**Given** the gamification event processing encounters a database error mid-transaction
**When** the `prisma.$transaction` fails
**Then** all gamification writes in that transaction are rolled back
**And** the original action (lesson completion or quiz submission) that triggered the event remains committed (gamification runs as a separate post-write call)
**And** an error is logged but does not surface to the user as a blocking error

---

## Performance Criteria

### PC-001: Gamification Event Processing Time

The `processGamificationEvent` function (including all XP, streak, badge, and level operations) **shall** complete within 500ms for a single student.

### PC-002: Dashboard Load Time

The student dashboard with gamification widgets **shall** load within the existing page load budget (no more than 200ms additional server-side processing).

### PC-003: Leaderboard Query Time

The leaderboard query for a class of up to 50 students **shall** complete within 200ms.

### PC-004: Achievements Page Load

The achievements page (badge gallery + XP history + streak calendar) **shall** load within 1 second for a student with up to 500 XP transactions.

---

## Smoke Test Checklist

- [ ] Prisma migration applies without errors (`npx prisma migrate dev`)
- [ ] Seed script creates 10 default badges without errors (`npx prisma db seed`)
- [ ] Re-running seed script does not create duplicate badges
- [ ] `gamificationUtils.ts` functions return expected values for known inputs
- [ ] Completing a lesson awards XP and updates `StudentGamification`
- [ ] Submitting a quiz awards tiered XP (15/25/50 based on score)
- [ ] Streak increments correctly on consecutive days
- [ ] Streak resets after a gap of more than 1 day
- [ ] Same-day activity does not double-increment streak
- [ ] "First Steps" badge is awarded on first lesson completion
- [ ] "Perfect Score" badge is awarded on 100% quiz score
- [ ] Duplicate badge award is silently prevented
- [ ] Level-up occurs at correct XP thresholds
- [ ] Notifications are created for badge awards and level-ups
- [ ] Student dashboard shows gamification card with correct data
- [ ] Student dashboard shows recent badges
- [ ] Achievements page loads at `/list/achievements`
- [ ] Badge gallery shows earned (color) and locked (gray) states
- [ ] XP transaction history is paginated
- [ ] Leaderboard displays correct ranking per class
- [ ] Leaderboard weekly toggle filters XP correctly
- [ ] Anonymous leaderboard hides student names
- [ ] Parent dashboard shows per-child gamification stats
- [ ] Admin dashboard shows gamification adoption metrics
- [ ] Admin can create a new badge via the badge form
- [ ] All gamification writes are atomic (no partial state on error)

---

## Definition of Done

- [ ] All 31 requirements (REQ-LMS-070 through REQ-LMS-100) implemented
- [ ] All acceptance criteria scenarios pass
- [ ] All edge cases handled gracefully
- [ ] Performance criteria met
- [ ] All smoke tests pass
- [ ] `gamificationUtils.ts` has comprehensive unit tests (pure functions)
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] Database migration is reversible
- [ ] Seed data is idempotent
- [ ] No console.log statements in production code
- [ ] Code follows existing patterns (Container/Client, pure utils, Server Actions)
- [ ] Notification integration uses existing `createNotification` function
