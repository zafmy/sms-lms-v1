# Brainstorming Session: Learning Management System (LMS)

**Date:** 2026-02-21
**Facilitator:** MoAI (Strategic Orchestrator)
**Participants:** ZaF (Project Owner)
**Feature:** Full LMS platform integrated with existing School Management System

---

## 1. Context

| Factor | Value |
|--------|-------|
| **Stage** | Post-launch enhancement, extending existing SMS |
| **Scale** | Single school, K-12 + Secondary, under 500 users |
| **Audience** | Teachers, Students (mixed ages), Parents, Admin |
| **Schedule** | Bi-weekly school (Saturday & Sunday only) |
| **Core Problem** | 12-day gap between sessions causes knowledge loss |
| **Stack** | Next.js 16, React 19, TypeScript, Prisma, PostgreSQL, Clerk, Tailwind CSS v4 |

### Current School Management System

- 12+ database entities with full CRUD (36+ server actions)
- 4 role-based dashboards (admin, teacher, student, parent)
- Attendance tracking with heatmap visualization
- Lessons, Exams, Assignments management with conflict detection
- Grade reports with CSV export and advanced filtering
- BigCalendar weekly schedules
- Clerk authentication with role-based routing
- In-app notification system

### The Critical Problem

This school operates on a **bi-weekly schedule** (Saturday and Sunday only), creating a **12-day gap** between learning sessions. This leads to:

1. **Knowledge Decay**: Students forget 60-80% of material within the 12-day gap (Ebbinghaus forgetting curve)
2. **Wasted Class Time**: Teachers spend 30-50% of precious Saturday time on revision instead of new material
3. **Limited Contact Hours**: Only ~8 hours of face-to-face time per month (vs ~80 hours in traditional schools)
4. **No Continuity**: No mechanism to maintain learning momentum between sessions
5. **Parent Blindness**: Parents have no visibility into what was taught or what to reinforce at home

### Strategic Insight

The LMS is not a supplementary tool -- it is **essential infrastructure** that bridges the 12-day gap. The design philosophy should be:

> **"The LMS IS the school during the week. Saturday/Sunday is where you practice and ask questions."**

This aligns with the **Flipped Classroom** model combined with **Spaced Repetition** science.

---

## 2. Recommended Strategy: "Bridge Learning" Architecture

### Design Philosophy

| Principle | Description |
|-----------|-------------|
| **Flipped Classroom** | Students learn content BETWEEN sessions; class time for practice, discussion, and projects |
| **Spaced Repetition** | Automated review prompts at scientifically optimal intervals (Day 1, 3, 7, 12) |
| **Micro-Learning** | Short, digestible content chunks (5-15 min) students engage with daily |
| **Progress Transparency** | Teachers see who engaged before class; parents see weekly summaries |
| **Gamification** | Badges, streaks, points to motivate K-12 students during the gap |

### Weekly Learning Cycle

```
SAT/SUN (In-Class)          WEEK 1 (Mon-Fri)          WEEK 2 (Mon-Fri)          SAT/SUN (Next Class)
+-------------------+       +------------------+       +------------------+       +-------------------+
| - New lesson      |  -->  | Day 1: Review    |  -->  | Day 8: Deep quiz |  -->  | - Quick check-in  |
| - Hands-on work   |       | Day 3: Mini quiz |       | Day 10: Preview  |       | - Advanced topics |
| - Q&A session     |       | Day 5: Practice  |       | Day 12: Prep     |       | - Projects/Labs   |
| - Post-class quiz |       | Day 7: Recap     |       |                  |       | - New lesson      |
+-------------------+       +------------------+       +------------------+       +-------------------+
```

---

## 3. Feature Breakdown

### Module 1: Course & Content Management

**Purpose:** Structured content delivery organized by subject, class, and topic.

| Feature | Description | Priority |
|---------|-------------|----------|
| **Course Structure** | Courses linked to existing Subject + Class entities. Each course has modules/topics | MUST |
| **Content Modules** | Sequential learning modules within a course. Lock/unlock based on progress | MUST |
| **Content Types** | Text lessons (rich text), external links (YouTube, Google Drive, etc.), embedded media | MUST |
| **Learning Paths** | Ordered sequence of modules with prerequisites. Students progress linearly | SHOULD |
| **Content Scheduling** | Auto-release content on specific days (e.g., Day 1 post-class, Day 3, Day 7) | SHOULD |
| **Teacher Content Library** | Reusable content bank. Teachers share/reuse materials across classes and years | COULD |
| **Direct File Upload** | Upload PDFs, images, audio directly to platform (Phase 2, requires storage infra) | COULD |

**MVP Approach:** External links only (YouTube, Google Drive, websites). Rich text editor for lesson notes. No direct file upload initially.

### Module 2: Assessment & Quiz Engine

**Purpose:** Full assessment suite with auto-grading and spaced repetition quizzes.

| Feature | Description | Priority |
|---------|-------------|----------|
| **Question Bank** | Repository of questions per subject/topic. Reusable across quizzes and exams | MUST |
| **Question Types** | Multiple choice, true/false, fill-in-blank, matching, ordering | MUST |
| **Auto-Grading** | Instant results for objective questions. Score calculation and feedback | MUST |
| **Timed Quizzes** | Optional time limits per quiz or per question | MUST |
| **Attempt Management** | Configurable max attempts, best/latest/average score policy | MUST |
| **Randomization** | Randomize question order and answer options per attempt | SHOULD |
| **Short Answer / Essay** | Free-text responses requiring teacher grading | SHOULD |
| **Rubric-Based Grading** | Structured rubrics for subjective assessments | SHOULD |
| **Spaced Repetition Quizzes** | Auto-generated review quizzes at Day 1, 3, 7, 12 intervals post-lesson | SHOULD |
| **Quiz Analytics** | Per-question difficulty analysis, common wrong answers, time-per-question | COULD |
| **File Submission** | Students submit documents/images as assessment responses (Phase 2) | COULD |

### Module 3: Discussion Forums

**Purpose:** Peer-to-peer and teacher-student knowledge sharing between sessions.

| Feature | Description | Priority |
|---------|-------------|----------|
| **Course Forums** | Threaded discussions per course. Students ask questions, peers/teachers respond | MUST |
| **Topic Threads** | Discussions organized by module/topic for easy navigation | MUST |
| **Teacher Moderation** | Pin, lock, delete threads. Mark answers as "accepted" | MUST |
| **Notifications** | Notify when someone replies to your thread or mentions you | SHOULD |
| **Rich Text Replies** | Format text, add links, basic formatting in forum posts | SHOULD |
| **Anonymous Mode** | Optional anonymous posting for shy younger students | COULD |
| **Upvoting** | Students upvote helpful answers. Promotes quality contributions | COULD |

### Module 4: Gamification & Motivation

**Purpose:** Keep K-12 students engaged during the 12-day gap through game mechanics.

| Feature | Description | Priority |
|---------|-------------|----------|
| **Learning Streaks** | Track consecutive days of engagement. Visual streak counter on dashboard | MUST |
| **XP Points** | Earn points for completing lessons, quizzes, forum participation | MUST |
| **Badges/Achievements** | Unlock badges for milestones (first quiz, 7-day streak, perfect score, etc.) | MUST |
| **Progress Bar** | Visual course completion percentage per student | MUST |
| **Leaderboard** | Class-level leaderboard (opt-in). Weekly/monthly rankings | SHOULD |
| **Level System** | Students level up as they accumulate XP. Visible level indicator | SHOULD |
| **Rewards** | Teacher-defined rewards for reaching point thresholds | COULD |

### Module 5: Progress Tracking & Analytics

**Purpose:** Give teachers, parents, and students visibility into learning engagement.

| Feature | Description | Priority |
|---------|-------------|----------|
| **Student Progress Dashboard** | Per-student: courses enrolled, modules completed, quiz scores, engagement timeline | MUST |
| **Teacher Class Overview** | Per-class: completion rates, average scores, who hasn't engaged, at-risk students | MUST |
| **Parent Dashboard** | Per-child: weekly summary, courses progress, recent quiz scores, teacher feedback | MUST |
| **Engagement Heatmap** | Calendar heatmap showing daily learning activity (similar to existing attendance heatmap) | SHOULD |
| **Pre-Class Report** | Auto-generated report for teachers before Saturday class: who reviewed, who didn't | SHOULD |
| **Learning Analytics** | Trends over time, subject difficulty comparison, class performance benchmarks | COULD |
| **Admin Overview** | School-wide LMS usage, teacher adoption rates, student engagement metrics | COULD |

### Module 6: Notifications & Reminders

**Purpose:** Proactive reminders to keep students engaged during the 12-day gap.

| Feature | Description | Priority |
|---------|-------------|----------|
| **In-App Notifications** | Extend existing notification system for LMS events | MUST |
| **Scheduled Reminders** | Auto-remind students on Day 1, 3, 7, 12 to review material | SHOULD |
| **Assignment Deadlines** | Notification before quiz/assignment due dates | SHOULD |
| **Parent Digest** | Weekly email/notification summary for parents | COULD |
| **Push Notifications** | Browser push notifications for time-sensitive reminders | COULD |

---

## 4. Recommended Phasing Strategy

Based on the bi-weekly school constraint and the need to solve the **retention problem first**, here is the recommended phasing:

### Phase 1: "Bridge the Gap" (Sprint 7-9) -- Core Foundation

**Goal:** Establish the basic content delivery and review mechanism that solves the 12-day retention problem.

| Sprint | Focus | Key Deliverables |
|--------|-------|-------------------|
| Sprint 7 | Database & Course Structure | Course, Module, Lesson, Enrollment models. Course CRUD. Teacher course management |
| Sprint 8 | Content Delivery | Lesson viewer with rich text + external links. Module progression. Student enrollment |
| Sprint 9 | Basic Quizzes | Question bank, MCQ/TF/Fill-blank quizzes, auto-grading, attempt tracking |

**Phase 1 Outcome:** Teachers can create courses with structured modules, students access content between sessions, basic quizzes verify understanding.

### Phase 2: "Smart Review" (Sprint 10-11) -- Retention Engine

**Goal:** Add spaced repetition and progress tracking to directly address the forgetting problem.

| Sprint | Focus | Key Deliverables |
|--------|-------|-------------------|
| Sprint 10 | Spaced Repetition + Progress | Auto-scheduled review quizzes (Day 1,3,7,12). Student progress dashboard. Completion tracking |
| Sprint 11 | Teacher Analytics + Pre-class Report | Class overview dashboard. Pre-class engagement report. At-risk student identification |

**Phase 2 Outcome:** System actively combats forgetting with scheduled reviews. Teachers know who engaged before class.

### Phase 3: "Engage & Motivate" (Sprint 12-13) -- Gamification

**Goal:** Drive student participation through game mechanics, especially for younger students.

| Sprint | Focus | Key Deliverables |
|--------|-------|-------------------|
| Sprint 12 | Gamification Core | XP points, learning streaks, badges, progress bars, level system |
| Sprint 13 | Forums + Social | Discussion forums per course, teacher moderation, notifications |

**Phase 3 Outcome:** Students are motivated to engage daily. Peer learning through forums.

### Phase 4: "Complete Platform" (Sprint 14-15) -- Full LMS

**Goal:** Advanced features for a comprehensive learning platform.

| Sprint | Focus | Key Deliverables |
|--------|-------|-------------------|
| Sprint 14 | Advanced Assessments | Short answer/essay, rubrics, randomization, quiz analytics, file submissions |
| Sprint 15 | Parent Dashboard + Admin | Full parent LMS view, parent digest, admin analytics, school-wide metrics |

**Phase 4 Outcome:** Feature-complete LMS with full assessment suite and stakeholder visibility.

### Phase 5: "Scale Up" (Future) -- Infrastructure

**Goal:** Infrastructure for growth.

| Sprint | Focus | Key Deliverables |
|--------|-------|-------------------|
| Future | Direct File Upload | Cloud storage integration (S3/Cloudinary), direct video/PDF upload |
| Future | Mobile Optimization | PWA or responsive optimization for mobile-first access |
| Future | AI Features | AI-generated review questions, personalized learning paths, auto-summary |

---

## 5. Database Design Sketch

### New Entities (extends existing Prisma schema)

```
Course
  - id, name, description, subjectId, teacherId
  - startDate, endDate, status (draft/active/archived)
  - relations: Subject, Teacher, Module[], Enrollment[], Forum[]

Module
  - id, courseId, title, description, order, isLocked
  - prerequisiteModuleId (optional)
  - relations: Course, Lesson[], Quiz[]

Lesson (LMS Lesson - separate from existing timetable Lesson)
  - id, moduleId, title, content (rich text), order
  - contentType (text/video/link/mixed)
  - externalUrl (YouTube, Drive, etc.)
  - estimatedMinutes, publishedAt
  - relations: Module, LessonProgress[]

LessonProgress
  - id, lessonId, studentId, status (not_started/in_progress/completed)
  - startedAt, completedAt, timeSpentSeconds
  - relations: Lesson, Student

Enrollment
  - id, courseId, studentId, enrolledAt, status
  - completionPercentage, lastAccessedAt
  - relations: Course, Student

Quiz
  - id, moduleId, title, type (practice/graded/spaced_review)
  - timeLimit, maxAttempts, scoringPolicy (best/latest/average)
  - scheduledDay (for spaced repetition: 1, 3, 7, 12)
  - randomizeQuestions, randomizeOptions
  - relations: Module, Question[], QuizAttempt[]

Question
  - id, quizId (optional), questionBankId (optional)
  - type (mcq/true_false/fill_blank/matching/ordering/short_answer/essay)
  - content, explanation, points, difficulty (easy/medium/hard)
  - relations: Quiz, QuestionBank, AnswerOption[]

QuestionBank
  - id, subjectId, teacherId, name
  - relations: Subject, Teacher, Question[]

AnswerOption
  - id, questionId, content, isCorrect, order
  - relations: Question

QuizAttempt
  - id, quizId, studentId, attemptNumber
  - startedAt, submittedAt, score, maxScore, percentage
  - relations: Quiz, Student, QuestionResponse[]

QuestionResponse
  - id, attemptId, questionId, selectedOptionId, textResponse
  - isCorrect, pointsEarned, timeTakenSeconds
  - relations: QuizAttempt, Question, AnswerOption

ForumThread
  - id, courseId, moduleId (optional), studentId, title, content
  - isPinned, isLocked, isAnonymous, createdAt
  - relations: Course, Module, Student, ForumReply[]

ForumReply
  - id, threadId, authorId, authorRole, content
  - isAccepted, createdAt
  - relations: ForumThread

StudentGamification
  - id, studentId, totalXP, currentLevel, currentStreak
  - longestStreak, lastActivityDate
  - relations: Student, Badge[]

Badge
  - id, name, description, iconUrl, criteria
  - xpReward

StudentBadge
  - id, studentId, badgeId, earnedAt
  - relations: Student, Badge

XPTransaction
  - id, studentId, amount, source (lesson/quiz/forum/streak)
  - sourceId, createdAt
  - relations: Student
```

### Integration with Existing Entities

- `Course` links to existing `Subject` and `Teacher`
- `Enrollment` links to existing `Student`
- `QuestionBank` links to existing `Subject`
- Existing `Exam` and `Assignment` entities remain for administrative tracking
- LMS `Quiz` is for learning/assessment within courses (complementary, not replacement)

---

## 6. Technical Considerations

### Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Rich Text Editor** | TipTap or Lexical | Modern, extensible, React-native. For lesson content creation |
| **Quiz Rendering** | Custom React components | Full control over question types, timing, and UX |
| **Content Storage (MVP)** | External URLs only | No infrastructure overhead. YouTube embeds, Google Drive links |
| **Content Storage (Phase 5)** | Uploadthing or S3 | When ready for direct uploads |
| **Real-time Features** | Not in MVP | No live chat or WebSocket needed initially |
| **Spaced Repetition** | Cron job or Next.js scheduled functions | Auto-generate review quizzes based on lesson completion dates |
| **Gamification State** | Prisma/PostgreSQL | Simple XP/badge tracking, no need for Redis |

### Naming Conflict Resolution

The existing schema has a `Lesson` entity for timetable scheduling. The LMS also has "lessons" (learning content). Options:

| Approach | Pros | Cons |
|----------|------|------|
| **LmsLesson** (Recommended) | Clear distinction, no migration needed | Slightly verbose |
| **Content** | Generic, no conflict | Less intuitive |
| **Rename existing to ClassSession** | Clean naming | Requires migration + code changes |

**Recommendation:** Use `LmsLesson` for LMS content entity. Keep existing `Lesson` for timetable. Consider renaming in a future refactor.

### Existing Component Reuse

| Existing Component | LMS Reuse |
|-------------------|-----------|
| `Pagination` | Quiz question navigation, course/module lists |
| `Table` | Leaderboards, grade tables, progress tables |
| `ListFilter` | Course filtering, forum filtering |
| `ExportButton` | Export quiz results, progress reports |
| `AttendanceHeatmap` | Adapt for learning engagement heatmap |
| `BigCalendar` | Show quiz due dates, content release schedule |
| `FormModal` | Create/edit courses, modules, questions |
| Notification system | LMS notifications (new content, quiz due, replies) |

---

## 7. Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Scope creep** | High | High | Strict MVP phasing. Phase 1 solves core problem only |
| **Low student adoption** | High | Medium | Gamification in Phase 3. Make it fun, not mandatory initially |
| **Teacher content creation burden** | Medium | High | Reusable content library. Simple UI. Start with external links |
| **Parent overwhelm** | Low | Medium | Summary-only parent view. No information overload |
| **Database complexity** | Medium | Medium | Clean entity design. Incremental schema additions per phase |
| **Naming conflict (Lesson)** | Low | Certain | Use LmsLesson entity name. Plan future rename |
| **Performance with quizzes** | Medium | Low | Efficient query design. Pagination. Consider caching for leaderboards |

---

## 8. Success Metrics

| Metric | Target | When |
|--------|--------|------|
| **Student engagement between sessions** | 60%+ students access LMS at least 3 days between classes | Phase 2 |
| **Revision time reduction** | Reduce in-class revision from ~50% to ~15% of class time | Phase 2 |
| **Quiz completion rate** | 70%+ students complete spaced repetition quizzes | Phase 2 |
| **Course content coverage** | 80%+ of subjects have active courses with content | Phase 1 |
| **Parent visibility** | 50%+ parents check weekly progress | Phase 4 |
| **Learning streak engagement** | Average streak of 4+ days per bi-weekly cycle | Phase 3 |
| **Forum participation** | 30%+ students post or reply at least once per cycle | Phase 3 |

---

## 9. Action Items & Next Steps

| # | Action | Owner | Priority | Sprint |
|---|--------|-------|----------|--------|
| 1 | Create SPEC for Phase 1: Course & Content Foundation | MoAI | P0 | Next |
| 2 | Design Prisma schema additions (Course, Module, LmsLesson, Enrollment) | Backend | P0 | Sprint 7 |
| 3 | Design course/module UI wireframes | Frontend | P0 | Sprint 7 |
| 4 | Evaluate rich text editor options (TipTap vs Lexical) | Research | P1 | Sprint 7 |
| 5 | Plan spaced repetition algorithm (intervals, quiz generation) | Backend | P1 | Sprint 10 |
| 6 | Design gamification point system and badge criteria | Design | P1 | Sprint 12 |
| 7 | Plan parent dashboard LMS integration | Frontend | P2 | Sprint 15 |

---

## 10. Session Summary

### Key Decisions Made

1. **Full LMS platform** with all major modules (content, assessments, forums, gamification, parent dashboard)
2. **Flipped Classroom + Spaced Repetition** as the core design philosophy to solve the 12-day gap problem
3. **External links only for MVP** storage -- no file upload infrastructure initially
4. **5-phase rollout** starting with the retention-solving features first
5. **LmsLesson** naming to avoid conflict with existing Lesson timetable entity
6. **K-12 friendly UI** with gamification to drive engagement for younger students

### The Big Insight

> The LMS should not be designed as a supplementary tool. For a bi-weekly school, **the LMS IS the primary learning environment**. Face-to-face Saturday/Sunday sessions become the place for practice, questions, and human connection -- not the primary content delivery mechanism.

This inversion of the traditional model (where classroom = learning, homework = practice) is the key to solving the retention problem. The spaced repetition engine ensures students encounter material at scientifically optimal intervals during the 12-day gap, dramatically reducing the forgetting curve.
