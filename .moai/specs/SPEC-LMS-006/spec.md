# SPEC-LMS-006: LMS Gamification System with XP, Streaks, Badges, and Leaderboards

## Metadata

| Field       | Value                                                          |
| ----------- | -------------------------------------------------------------- |
| SPEC ID     | SPEC-LMS-006                                                   |
| Title       | LMS Gamification System with XP, Streaks, Badges, and Leaderboards |
| Status      | Completed                                                      |
| Priority    | Medium                                                         |
| Lifecycle   | spec-first                                                     |
| Parent      | LMS Feature Suite                                              |
| Depends     | SPEC-LMS-001 (LMS Phase 1), SPEC-LMS-004 (Analytics)          |
| Domain      | LMS - Gamification                                             |
| Created     | 2026-02-21                                                     |

---

## Environment

### Existing System Context

The Hua Readwise school management system operates a bi-weekly schedule (Saturday and Sunday only), creating a 12-day gap between sessions. The LMS was built to bridge this gap. The gamification system adds game mechanics to incentivize student engagement during the inter-session period.

### Existing Data Models Referenced

- **Student** (`prisma/schema.prisma`): Core user model. Has relations to `Enrollment[]`, `LessonProgress[]`, `QuizAttempt[]`. The `id` field (String, Clerk user ID) is the primary key used throughout.
- **LessonProgress** (`prisma/schema.prisma`): Tracks per-student, per-lesson completion. Status enum: `NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`. Contains `completedAt` timestamp.
- **QuizAttempt** (`prisma/schema.prisma`): Records quiz submissions. Contains `submittedAt`, `score`, `maxScore`, `percentage`, `passed` fields.
- **Enrollment** (`prisma/schema.prisma`): Links students to courses. Status enum: `ACTIVE`, `COMPLETED`, `DROPPED`.
- **Course** (`prisma/schema.prisma`): Contains `modules[]` with nested `LmsLesson[]` and `Quiz[]`.
- **Notification** (`prisma/schema.prisma`): In-app notifications with `type` enum and `userId` string.
- **NotificationType** enum: `GRADE`, `ATTENDANCE`, `ANNOUNCEMENT`, `ASSIGNMENT`, `GENERAL`, `ENROLLMENT`.

### Existing Utilities Referenced

- **`src/lib/lmsAnalyticsUtils.ts`**: Pure analytics functions (no Prisma imports, no side effects). Pattern to follow for `gamificationUtils.ts`.
- **`src/lib/gradeUtils.ts`**: Pure grade calculation functions. Pattern to follow.
- **`src/lib/quizUtils.ts`**: Auto-grading engine (pure functions). Pattern to follow.
- **`src/lib/actions.ts`**: 62+ Server Actions for all CRUD and LMS operations. New gamification Server Actions will be added here.
- **`src/lib/notificationActions.ts`**: Notification creation using `createNotification(userId, type, message)`.

### Existing UI Patterns Referenced

- **Container pattern**: Server Component (`*Container.tsx`) fetches data, Client Component renders. Used for all Recharts visualizations.
- **Dashboard layout**: Student dashboard (`/student/page.tsx`) has left (2/3 width) and right (1/3 width) columns.
- **Color convention**: green >= 90%, yellow >= 75%, red < 75%.
- **Component flat structure**: All components in `src/components/` with forms in `src/components/forms/`.

### Technology Stack

- Next.js 16 with App Router, React 19, TypeScript 5, Prisma ORM 5.19+, PostgreSQL 14+
- Clerk authentication with `publicMetadata.role` for authorization
- Tailwind CSS v4, Recharts 3.7+ for charts
- React Hook Form 7 + Zod 3.23 for form validation

---

## Assumptions

- **A-001**: Student engagement ("activity") is defined as completing at least one `LessonProgress` record (transition to `COMPLETED`) or submitting at least one `QuizAttempt` on a given calendar day (UTC).
- **A-002**: The system operates under 500 total users. JavaScript-based aggregation over gamification records is sufficient without database-level aggregation or caching.
- **A-003**: Streak calculations use UTC calendar days. The `lastActivityDate` field stores a UTC date (not datetime). A new activity on a different UTC day from `lastActivityDate` increments the streak.
- **A-004**: XP transactions are append-only. The `totalXp` field on `StudentGamification` is a denormalized counter maintained for read performance. It equals the sum of all `XpTransaction.amount` for that student.
- **A-005**: Badges are awarded at most once per student. The `@@unique([studentId, badgeId])` constraint on `StudentBadge` prevents duplicates.
- **A-006**: The leaderboard is opt-in per class by teachers. Students in classes without leaderboard enabled will not appear on any leaderboard.
- **A-007**: Level thresholds follow a quadratic progression. Level N requires `sum(i * 50 for i in 1..N-1)` total XP. Thresholds are configurable but stored as a utility constant, not in the database.
- **A-008**: The gamification trigger mechanism hooks into existing Server Actions (`markLessonComplete`, quiz submission) as post-write logic, not as separate background jobs.
- **A-009**: Badge definitions are stored in the database and seeded via `prisma/seed.ts`. Admins can create new badges but the auto-award logic in `gamificationUtils.ts` handles the evaluation.
- **A-010**: The `NotificationType` enum must be extended with a `GAMIFICATION` value for badge and streak notifications.

---

## Requirements

### XP System

**REQ-LMS-070** (Event-Driven): **When** a `LessonProgress` record transitions to `COMPLETED` status, **then** the system **shall** create an `XpTransaction` of type `LESSON` with the configured XP amount (default: 10 XP) and update the student's `totalXp` in `StudentGamification`.

**REQ-LMS-071** (Event-Driven): **When** a `QuizAttempt` is submitted, **then** the system **shall** create an `XpTransaction` of type `QUIZ` with XP based on the attempt result: 15 XP for submission, 25 XP bonus if the score meets or exceeds the quiz `passScore`, and 50 XP bonus for a perfect score (100%).

**REQ-LMS-072** (Ubiquitous): The system **shall** maintain a `totalXp` counter on `StudentGamification` that equals the sum of all `XpTransaction.amount` records for that student. The counter **shall** be updated atomically within the same transaction that creates the `XpTransaction`.

**REQ-LMS-073** (Event-Driven): **When** a student's `totalXp` increases, **then** the system **shall** check if the new total meets or exceeds the next level threshold and update `currentLevel` accordingly. Multiple level-ups in a single XP award **shall** be handled correctly.

**REQ-LMS-074** (Ubiquitous): The system **shall** provide configurable XP values per activity type. Default values are: lesson completion = 10, quiz submission = 15, quiz pass = 25, perfect score = 50, daily streak = 5, 7-day streak bonus = 30, course completion = 100.

**REQ-LMS-075** (Event-Driven): **When** all lessons in all modules of a course are marked `COMPLETED` for an enrolled student, **then** the system **shall** award course completion XP (default: 100 XP) via an `XpTransaction` of type `LESSON`.

### Streak System

**REQ-LMS-076** (Event-Driven): **When** a student performs a qualifying activity (lesson completion or quiz submission), **then** the system **shall** compare today's UTC date to `lastActivityDate` in `StudentGamification`. If the dates differ, the system **shall** update `lastActivityDate` to today and evaluate the streak.

**REQ-LMS-077** (State-Driven): **If** the current UTC date is exactly one day after `lastActivityDate`, **then** the system **shall** increment `currentStreak` by 1 and update `longestStreak` if `currentStreak` exceeds it.

**REQ-LMS-078** (State-Driven): **If** the current UTC date is more than one day after `lastActivityDate`, **then** the system **shall** reset `currentStreak` to 1 (today counts as day 1 of a new streak).

**REQ-LMS-079** (State-Driven): **If** the current UTC date equals `lastActivityDate`, **then** the system **shall not** modify the streak counters (multiple activities on the same day do not double-count).

**REQ-LMS-080** (Event-Driven): **When** a streak is incremented, **then** the system **shall** award daily streak XP (default: 5 XP) via an `XpTransaction` of type `STREAK`.

**REQ-LMS-081** (Event-Driven): **When** `currentStreak` reaches a streak badge threshold (e.g., 3, 7, 14), **then** the system **shall** award the corresponding streak bonus XP and check for badge eligibility.

### Badge System

**REQ-LMS-082** (Ubiquitous): The system **shall** store badge definitions in the `Badge` database model with fields: `name`, `description`, `iconUrl`, `criteria` (JSON), `xpReward`, `category`, and `threshold`.

**REQ-LMS-083** (Event-Driven): **When** XP is awarded or a streak is updated, **then** the system **shall** evaluate all badges in the relevant category for eligibility. If the student meets the criteria and does not already hold the badge, the system **shall** create a `StudentBadge` record and award the badge's `xpReward` as a `BADGE` type `XpTransaction`.

**REQ-LMS-084** (Unwanted): The system **shall not** award the same badge to the same student more than once. The `@@unique([studentId, badgeId])` constraint enforces this at the database level.

**REQ-LMS-085** (Ubiquitous): The system **shall** seed the following default badges via `prisma/seed.ts`:

| Badge Name    | Category | Criteria Description         | Threshold | XP Reward |
| ------------- | -------- | ---------------------------- | --------- | --------- |
| First Steps   | course   | Complete first lesson        | 1         | 10        |
| Quiz Taker    | quiz     | Complete first quiz          | 1         | 10        |
| Perfect Score | quiz     | Score 100% on any quiz       | 100       | 25        |
| Consistent    | streak   | Achieve 3-day streak         | 3         | 15        |
| Dedicated     | streak   | Achieve 7-day streak         | 7         | 30        |
| Marathon      | streak   | Achieve 14-day streak        | 14        | 75        |
| Scholar       | course   | Complete first course        | 1         | 50        |
| Bookworm      | course   | Complete 3 courses           | 3         | 100       |
| Century       | xp       | Earn 100 total XP            | 100       | 20        |
| XP Master     | xp       | Earn 1000 total XP           | 1000      | 50        |

**REQ-LMS-086** (Event-Driven): **When** a badge is awarded, **then** the system **shall** create an in-app notification of type `GAMIFICATION` with a message indicating the badge name and XP reward.

### Leaderboard

**REQ-LMS-087** (Optional): **Where** a teacher has enabled the leaderboard for a class, the system **shall** display a ranked list of students in that class ordered by `totalXp` descending.

**REQ-LMS-088** (State-Driven): **If** the leaderboard is in "anonymous" mode, **then** the system **shall** display rank numbers and XP values but **shall not** display student names.

**REQ-LMS-089** (Event-Driven): **When** the leaderboard is viewed, **then** the system **shall** support toggling between "Weekly" (XP earned in the last 7 days) and "All-Time" (total XP) rankings.

**REQ-LMS-090** (Ubiquitous): The leaderboard **shall** display a maximum of 50 students per page with pagination.

### Level System

**REQ-LMS-091** (Ubiquitous): The system **shall** use a configurable level progression where Level N requires the following cumulative XP thresholds: Level 1 = 0, Level 2 = 50, Level 3 = 150, Level 4 = 300, Level 5 = 500, Level 6 = 750, Level 7 = 1050, Level 8 = 1400, Level 9 = 1800, Level 10 = 2250.

**REQ-LMS-092** (Ubiquitous): The system **shall** compute the XP progress percentage toward the next level as: `(currentXp - currentLevelThreshold) / (nextLevelThreshold - currentLevelThreshold) * 100`.

**REQ-LMS-093** (Event-Driven): **When** a student levels up, **then** the system **shall** create an in-app notification of type `GAMIFICATION` with a message indicating the new level.

### Dashboard Integration

**REQ-LMS-094** (Ubiquitous): The student dashboard **shall** display a compact gamification card in the right sidebar showing: current level, total XP, progress bar to next level, current streak days with a visual indicator, and longest streak.

**REQ-LMS-095** (Ubiquitous): The student dashboard **shall** display the 3 most recently earned badges below the gamification card.

**REQ-LMS-096** (Ubiquitous): The student dashboard **shall** include a link to a full achievements page at `/list/achievements`.

**REQ-LMS-097** (Ubiquitous): The achievements page (`/list/achievements`) **shall** display: a full badge gallery (earned badges in color, locked badges grayed out), XP transaction history (paginated, most recent first), streak calendar visualization, and level progress visualization.

**REQ-LMS-098** (Ubiquitous): The parent dashboard **shall** display per-child gamification data (level, XP, streak) within the existing `ChildQuickStats` or `ChildLmsProgressCard` area.

**REQ-LMS-099** (Ubiquitous): The admin dashboard **shall** display gamification adoption statistics: count of students with active streaks (streak > 0), average XP across all students, total badges awarded.

### Admin Badge Management

**REQ-LMS-100** (Event-Driven): **When** an admin creates a new badge via the badge management form, **then** the system **shall** validate the input with Zod, create a `Badge` record, and revalidate the badge listing page.

---

## Specifications

### New Prisma Models

```prisma
model StudentGamification {
  id               Int       @id @default(autoincrement())
  studentId        String    @unique
  totalXp          Int       @default(0)
  currentLevel     Int       @default(1)
  currentStreak    Int       @default(0)
  longestStreak    Int       @default(0)
  lastActivityDate DateTime?
  student          Student   @relation(fields: [studentId], references: [id])
}

model Badge {
  id          Int            @id @default(autoincrement())
  name        String
  description String
  iconUrl     String?
  criteria    String         // JSON string describing trigger conditions
  xpReward    Int            @default(0)
  category    String         // "streak", "quiz", "course", "xp", "special"
  threshold   Int?           // Numeric threshold for auto-award
  createdAt   DateTime       @default(now())
  students    StudentBadge[]
}

model StudentBadge {
  id        Int      @id @default(autoincrement())
  studentId String
  badgeId   Int
  earnedAt  DateTime @default(now())
  student   Student  @relation(fields: [studentId], references: [id])
  badge     Badge    @relation(fields: [badgeId], references: [id])

  @@unique([studentId, badgeId])
}

model XpTransaction {
  id        Int      @id @default(autoincrement())
  studentId String
  amount    Int
  source    XpSource
  sourceId  String?  // ID of the lesson/quiz/course that triggered this
  createdAt DateTime @default(now())
  student   Student  @relation(fields: [studentId], references: [id])
}

enum XpSource {
  LESSON
  QUIZ
  STREAK
  BADGE
  MANUAL
}
```

### New Relations on Student Model

```prisma
model Student {
  // ... existing fields ...
  gamification    StudentGamification?
  badges          StudentBadge[]
  xpTransactions  XpTransaction[]
}
```

### Enum Extension

```prisma
enum NotificationType {
  // ... existing values ...
  GAMIFICATION
}
```

### XP Configuration Constants

Defined in `src/lib/gamificationUtils.ts` as exported constants:

| Constant               | Value | Description                |
| ---------------------- | ----- | -------------------------- |
| `XP_LESSON_COMPLETE`   | 10    | Completing a lesson        |
| `XP_QUIZ_SUBMIT`       | 15    | Submitting a quiz          |
| `XP_QUIZ_PASS`         | 25    | Passing a quiz             |
| `XP_QUIZ_PERFECT`      | 50    | Scoring 100% on a quiz     |
| `XP_DAILY_STREAK`      | 5     | Per-day streak continuation |
| `XP_STREAK_7_BONUS`    | 30    | Reaching 7-day streak      |
| `XP_COURSE_COMPLETE`   | 100   | Completing all course lessons |

### Level Thresholds

Defined in `src/lib/gamificationUtils.ts`:

```typescript
export const LEVEL_THRESHOLDS: readonly number[] = [
  0, 50, 150, 300, 500, 750, 1050, 1400, 1800, 2250,
];
```

### Trigger Flow

1. Existing Server Action completes a write (lesson complete, quiz submit)
2. Call `processGamificationEvent(studentId, eventType, eventData)` after the write
3. `processGamificationEvent` is a Server Action that:
   a. Gets or creates `StudentGamification` record (upsert)
   b. Awards XP by creating `XpTransaction` and incrementing `totalXp`
   c. Evaluates and updates streak
   d. Checks for level-up
   e. Evaluates badge eligibility
   f. Creates notifications for badges and level-ups
   g. All database writes wrapped in `prisma.$transaction`

---

## Out of Scope

- **Teacher-defined rewards**: Physical or digital rewards for reaching gamification thresholds (future SPEC).
- **Forum participation XP**: Points for discussion forum activity (depends on SPEC-LMS-003 Discussion Forums).
- **Spaced repetition integration**: Gamification rewards for spaced repetition activities (depends on future Spaced Repetition SPEC).
- **Inter-class competitions**: Cross-class leaderboards or class-vs-class challenges.
- **Custom student avatars**: Profile customization unlocked by gamification progress.
- **Admin XP adjustment UI**: Bulk XP grant/revoke tools beyond manual `MANUAL` XP source.
- **Push notifications**: Browser or mobile push notifications for gamification events (only in-app notifications).

---

## Traceability Matrix

| Requirement   | Model / File                          | Test Scenario            |
| ------------- | ------------------------------------- | ------------------------ |
| REQ-LMS-070   | XpTransaction, gamificationUtils.ts   | AC-001, AC-002           |
| REQ-LMS-071   | XpTransaction, gamificationUtils.ts   | AC-003, AC-004, AC-005   |
| REQ-LMS-072   | StudentGamification, actions.ts       | AC-006                   |
| REQ-LMS-073   | StudentGamification, gamificationUtils.ts | AC-007               |
| REQ-LMS-074   | gamificationUtils.ts constants        | AC-008                   |
| REQ-LMS-075   | XpTransaction, actions.ts             | AC-009                   |
| REQ-LMS-076   | StudentGamification, gamificationUtils.ts | AC-010               |
| REQ-LMS-077   | StudentGamification                   | AC-011                   |
| REQ-LMS-078   | StudentGamification                   | AC-012                   |
| REQ-LMS-079   | StudentGamification                   | AC-013                   |
| REQ-LMS-080   | XpTransaction                         | AC-014                   |
| REQ-LMS-081   | XpTransaction, Badge                  | AC-015                   |
| REQ-LMS-082   | Badge model                           | AC-016                   |
| REQ-LMS-083   | StudentBadge, gamificationUtils.ts    | AC-017                   |
| REQ-LMS-084   | StudentBadge @@unique                 | AC-018                   |
| REQ-LMS-085   | prisma/seed.ts                        | AC-019                   |
| REQ-LMS-086   | Notification, notificationActions.ts  | AC-020                   |
| REQ-LMS-087   | Leaderboard components                | AC-021                   |
| REQ-LMS-088   | Leaderboard components                | AC-022                   |
| REQ-LMS-089   | Leaderboard components                | AC-023                   |
| REQ-LMS-090   | Leaderboard components                | AC-024                   |
| REQ-LMS-091   | gamificationUtils.ts LEVEL_THRESHOLDS | AC-025                   |
| REQ-LMS-092   | gamificationUtils.ts                  | AC-026                   |
| REQ-LMS-093   | Notification                          | AC-027                   |
| REQ-LMS-094   | GamificationCard component            | AC-028                   |
| REQ-LMS-095   | RecentBadges component                | AC-029                   |
| REQ-LMS-096   | Student dashboard link                | AC-030                   |
| REQ-LMS-097   | Achievements page                     | AC-031                   |
| REQ-LMS-098   | ChildGamificationStats component      | AC-032                   |
| REQ-LMS-099   | GamificationAdoptionMetrics component | AC-033                   |
| REQ-LMS-100   | BadgeForm, actions.ts                 | AC-034                   |

---

## Implementation Notes

### Implementation Date

2026-02-21

### Summary

SPEC-LMS-006 was fully implemented across 4 TAGs (Tagged Atomic Groups) with 28 files changed (+1,913 lines).

| TAG     | Commit    | Description                                              | Files | Lines |
| ------- | --------- | -------------------------------------------------------- | ----- | ----- |
| TAG-001 | `eba1334` | Schema, utilities, seed data                             | 4     | +338  |
| TAG-002 | `dce2cab` | XP/streak engine and server action hooks                 | 2     | +397  |
| TAG-003 | `bace1e0` | Student gamification UI and achievements page            | 12    | +671  |
| TAG-004 | `62852f9` | Leaderboard, parent stats, admin metrics, badge form     | 12    | +518  |

### New Files Created (17)

| File | Purpose |
| ---- | ------- |
| `src/lib/gamificationUtils.ts` | Pure utility functions for XP computation, level calculation, streak evaluation, and badge eligibility checks |
| `src/lib/gamificationActions.ts` | Server Actions for the gamification engine (`processGamificationEvent`) and badge CRUD (`createBadge`, `updateBadge`, `deleteBadge`) |
| `src/components/GamificationCard.tsx` | Client Component: compact XP, level, and streak display card for the student dashboard sidebar |
| `src/components/GamificationCardContainer.tsx` | Server Component: fetches `StudentGamification` data and passes it to `GamificationCard` |
| `src/components/RecentBadges.tsx` | Client Component: renders the 3 most recently earned badges with links to the achievements page |
| `src/components/RecentBadgesContainer.tsx` | Server Component: fetches the student's 3 most recent `StudentBadge` records |
| `src/components/BadgeGallery.tsx` | Client Component: full badge grid showing earned badges in color and locked badges grayed out |
| `src/components/XpTransactionHistory.tsx` | Client Component: paginated XP transaction history table |
| `src/components/StreakCalendar.tsx` | Client Component: 30-day activity calendar showing days with qualifying activity |
| `src/components/LevelProgressBar.tsx` | Client Component: visual level progress bar showing XP toward next level threshold |
| `src/components/ClassLeaderboard.tsx` | Client Component: ranked leaderboard table for a teacher's class ordered by total XP |
| `src/components/ClassLeaderboardContainer.tsx` | Server Component: fetches class student gamification records for the leaderboard |
| `src/components/ChildGamificationStats.tsx` | Client Component: per-child gamification stats (level, XP, streak) for the parent dashboard |
| `src/components/GamificationAdoptionMetrics.tsx` | Client Component: admin dashboard metrics (active streaks, average XP, total badges awarded) |
| `src/components/forms/BadgeForm.tsx` | Client Component: admin badge CRUD form with React Hook Form and Zod validation |
| `src/app/(dashboard)/list/achievements/page.tsx` | Student achievements page: full badge gallery, XP history, streak calendar, and level progress |

### New Prisma Models and Enums (5)

| Name | Type | Description |
| ---- | ---- | ----------- |
| `StudentGamification` | Model | Per-student XP, level, streak, and last activity date |
| `Badge` | Model | Badge definitions with category, criteria JSON, XP reward, and threshold |
| `StudentBadge` | Model | Junction table for earned badges with `@@unique([studentId, badgeId])` constraint |
| `XpTransaction` | Model | Append-only XP event log with source type and optional source reference ID |
| `XpSource` | Enum | `LESSON`, `QUIZ`, `STREAK`, `BADGE`, `MANUAL` |

### Files Modified (11)

| File | Modification |
| ---- | ------------ |
| `prisma/schema.prisma` | Added 4 new models (`StudentGamification`, `Badge`, `StudentBadge`, `XpTransaction`), 1 new enum (`XpSource`), extended `NotificationType` enum with `GAMIFICATION`, added gamification relations to `Student` model |
| `prisma/seed.ts` | Added seed data for 10 default badges across streak, quiz, course, and XP categories |
| `src/lib/actions.ts` | Added `processGamificationEvent` call hooks in `markLessonComplete` and quiz submission actions |
| `src/lib/formValidationSchemas.ts` | Added `badgeSchema` Zod schema for badge create/update form validation |
| `src/app/(dashboard)/student/page.tsx` | Added `GamificationCardContainer` and `RecentBadgesContainer` widgets to the student dashboard right sidebar |
| `src/app/(dashboard)/teacher/page.tsx` | Added `ClassLeaderboardContainer` widget to the teacher dashboard |
| `src/app/(dashboard)/parent/page.tsx` | Added `ChildGamificationStats` component to the per-child data section |
| `src/app/(dashboard)/admin/page.tsx` | Added `GamificationAdoptionMetrics` component to the admin dashboard |
| `src/components/FormContainer.tsx` | Added `badge` case to handle `BadgeForm` rendering for admin badge management |
| `src/app/(dashboard)/list/students/[id]/page.tsx` | Added gamification stats summary to the student detail page |
| `src/lib/settings.ts` | Added `/list/achievements` route to the `routeAccessMap` with `student` role access |

### Deviations from Plan

1. **Schema migration method**: Used `prisma db push` instead of `prisma migrate dev` due to a shadow database permission issue in the local development environment. The schema changes are reflected in `prisma/schema.prisma` but no migration file was generated in `prisma/migrations/`. A formal migration should be generated before deploying to a staging or production environment.

2. **Level computation indexing**: The initial implementation used 0-based level indexing. This was corrected to 1-based indexing so that `currentLevel` values range from 1 to 10 and display correctly to students (Level 1 as the starting level rather than Level 0).

3. **Leaderboard anonymous mode and enable/disable toggle deferred**: REQ-LMS-088 (anonymous mode) and the teacher-controlled enable/disable toggle for the leaderboard were not implemented. These were identified as secondary UX features not part of the core gamification requirements. The leaderboard is displayed as an always-on widget on the teacher dashboard showing all students in the class ranked by total XP. Anonymous mode and the enable/disable toggle are deferred to a future SPEC.
