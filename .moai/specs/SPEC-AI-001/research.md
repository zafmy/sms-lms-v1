# SPEC-AI-001 Research: AI-Powered Learning Engine

## Research Summary

Deep codebase analysis of the Hua Readwise school management system (Next.js 16 + Prisma + PostgreSQL) to identify integration points for three AI capabilities: auto-generated questions, smart spaced repetition, and auto-summary of lessons.

---

## 1. LMS Lesson Content System

### 1.1 Lesson Model Structure

**Location:** `prisma/schema.prisma` — LmsLesson model

Key fields:
- `content: String @db.Text` — Stores lesson content (plain text or Lexical JSON)
- `contentType: ContentType` — Enum: TEXT, VIDEO, LINK, MIXED
- `flagForReview: Boolean @default(false)` — Exists but underutilized

### 1.2 Content Storage Format

Two formats detected:
- **Lexical JSON AST:** Stored as JSON string with `root` property (from SPEC-EDITOR-001). Contains nested node tree with type, children, text properties.
- **Plain Text:** Fallback format

**Critical utility:** `src/components/editor/lexicalUtils.ts:41-56` provides `extractPlainText(jsonString)` that:
- Detects Lexical JSON vs plain text
- Recursively walks the JSON tree
- Extracts plain text from leaf nodes
- Preserves paragraph/block structure with newlines

### 1.3 Server Actions

- `createLmsLesson` at `src/lib/actions.ts:1836-1875` — standard pattern (auth, validate, create, revalidate)
- `updateLmsLesson` at `src/lib/actions.ts:1877-1915` — identical pattern

### 1.4 Validation Schema

**Location:** `src/lib/formValidationSchemas.ts:235-245`

```
lmsLessonSchema: {
  title: string (1-200 chars),
  content: string (min 1 char),
  contentType: enum,
  externalUrl: optional url,
  order: int (min 1),
  estimatedMinutes: optional int,
  moduleId: int,
  flagForReview: boolean
}
```

---

## 2. Quiz and Question System

### 2.1 Question Model

**Location:** `prisma/schema.prisma` — Question model

Key fields:
- `text: String` — Question text (max 1000 chars per validation)
- `type: QuestionType` — MULTIPLE_CHOICE, TRUE_FALSE, FILL_IN_BLANK
- `explanation: String?` — Optional explanation
- `points: Int @default(1)`
- `quizId: Int?` — Direct quiz assignment
- `questionBankId: Int?` — Question bank assignment
- `options: AnswerOption[]` — Answer choices

### 2.2 Answer Option Model

```
AnswerOption {
  text: String,
  isCorrect: Boolean,
  order: Int,
  questionId: Int
}
```

### 2.3 Question Bank System

- `QuestionBank` model: reusable question library per teacher per subject
- Fields: name, description, subjectId, teacherId
- Questions can belong to either a quiz or a question bank

### 2.4 Question Validation Schema

**Location:** `src/lib/formValidationSchemas.ts:270-284`

Constraints:
- Question text: min 1, max 1000 chars
- Type: enum validation
- Explanation: max 500 chars, optional
- Points: int, min 1
- Options: min 2 required, each with text + isCorrect + order

### 2.5 Server Action Pattern

`createQuestion` at `src/lib/actions.ts:2182-2227`:
1. Auth check (admin/teacher)
2. Verify quiz/bank ownership if teacher
3. Create Question + nested AnswerOptions in single Prisma call
4. Revalidate paths
5. Return success/error

### 2.6 Auto-Grading Engine

**Location:** `src/lib/quizUtils.ts:28-85`

`gradeQuizAttempt()` pure function:
- MULTIPLE_CHOICE/TRUE_FALSE: Compare selectedOptionId with correct option
- FILL_IN_BLANK: Compare textResponse (trimmed, case-insensitive) with correct option text
- Returns: score, maxScore, percentage, passed, questionResults[]

---

## 3. Spaced Repetition System

### 3.1 Review Card Model

**Location:** `prisma/schema.prisma` — ReviewCard model

Key fields:
- `leitnerBox: Int @default(1)` — Current box (1-5)
- `easinessFactor: Float @default(2.5)` — SM-2 parameter
- `consecutiveCorrect: Int @default(0)`
- `nextReviewDate: DateTime` — When card should be reviewed
- `stability/difficulty/retrievability: Float?` — FSRS parameters (optional, prepared for future)
- `sourceQuestionId/sourceLessonId: Int?` — Links to source content
- `cardType: ReviewCardType` — QUIZ_QUESTION, VOCABULARY, CONCEPT, FLASHCARD

### 3.2 Leitner Box Algorithm

**Location:** `src/lib/spacedRepetitionUtils.ts:34-71`

| Rating | Action | New Box | EF Change | Consecutive |
|--------|--------|---------|-----------|-------------|
| HARD | Reset | 1 | EF - 0.3 (min 1.3) | 0 |
| OK | Conditional | +1 if >= 2 correct | EF - 0.1 (min 1.3) | +1 |
| EASY | Jump | +2 (if EF >= 2.5) or +1 | EF + 0.15 | 0 |

### 3.3 Review Schedule (Weekend-Based)

**Location:** `src/lib/spacedRepetitionUtils.ts:84-103`

- Box 1: 1st Saturday (0 additional days)
- Box 2: 2nd Saturday (7 days)
- Box 3: 4th Saturday (21 days)
- Box 4: 8th Saturday (49 days)
- Box 5: 24th Saturday (161 days)

### 3.4 Review Queue

Priority: Overdue cards → Due today cards → New cards. Default max: 15 cards per session.

### 3.5 AI Enhancement Point

The `nextReviewDate` field on ReviewCard is the primary target. AI can adjust this based on:
- Historical performance patterns (ReviewLog data)
- Response time trends
- Subject-specific difficulty analysis
- Individual student learning curve

---

## 4. Gamification Integration

### 4.1 Event Processing

**Location:** `src/lib/gamificationActions.ts:28-136`

`processGamificationEvent(studentId, eventType, eventData)`:
- Uses `prisma.$transaction` for atomicity
- Existing event types: LESSON_COMPLETE, QUIZ_SUBMIT, REVIEW_CORRECT, REVIEW_SESSION_COMPLETE, MASTERY_ACHIEVED
- Fire-and-forget pattern (errors logged, not propagated)

### 4.2 AI Events to Add

Potential new gamification events for AI features:
- Teacher: XP for reviewing AI content (encourages review)
- Student: Bonus XP for completing AI-adjusted review sessions

---

## 5. Notification System

### 5.1 Model

NotificationType enum includes: GRADE, ATTENDANCE, ANNOUNCEMENT, ASSIGNMENT, GENERAL, ENROLLMENT, GAMIFICATION, REVIEW, FORUM_REPLY

### 5.2 Actions

`createNotification(userId, type, message)` at `src/lib/notificationActions.ts:8-42`

### 5.3 AI Notifications Needed

- Teacher: "AI generated N questions for [Lesson]. Review them."
- Teacher: "AI summary generated for [Lesson]. Review it."
- Student: "New summary available for [Lesson]."
- Admin: "Teacher X has used N/M AI quota this month."

---

## 6. Authentication and Authorization

### 6.1 Pattern

```typescript
const { userId, sessionClaims } = await auth();
const role = (sessionClaims?.metadata as { role?: string })?.role;
```

### 6.2 Roles

- admin: Full access
- teacher: Own content only (verified via course/module ownership)
- student: Read-only for AI features (consume summaries, take AI quizzes)
- parent: No AI interaction

### 6.3 AI Implication

All AI generation must be teacher-initiated. Content auto-assigned to authenticated teacher's ID.

---

## 7. Environment Variables

### 7.1 Current Pattern

Via `.env` / `.env.local` files, loaded by Next.js:
- DATABASE_URL, CLERK keys, CLOUDINARY cloud name

### 7.2 New Variables Needed

- `AI_PROVIDER` — openai | anthropic | google
- `AI_API_KEY` — Provider API key (server-side only)
- `AI_MODEL_ID` — Model identifier (e.g., gpt-4o-mini, claude-3-haiku)
- `AI_MAX_TOKENS_PER_REQUEST` — Token limit per AI call
- `AI_MONTHLY_QUOTA_PER_TEACHER` — Monthly generation limit

---

## 8. Schema Gaps for AI

### 8.1 Missing from Current Schema

1. **AI Generation Status:** No draft/approved/rejected state for AI content
2. **AI-Generated Flag:** No way to distinguish human vs AI questions
3. **AI Settings:** No per-teacher AI preferences
4. **Usage Tracking:** No quota/limit tracking for AI features
5. **Summary Storage:** No dedicated field or model for lesson summaries

### 8.2 Proposed New Models

```
AIGenerationLog — Track all AI generation requests
  id, teacherId, lessonId, generationType (QUESTIONS/SUMMARY/INTERVAL),
  status (PENDING/COMPLETED/FAILED), provider, model, inputTokens,
  outputTokens, cost, createdAt

AISettings — Per-deployment AI configuration
  id, provider, modelId, monthlyQuota, maxTokensPerRequest, enabled

LessonSummary — Store AI-generated summaries
  id, lessonId, content, status (DRAFT/APPROVED/REJECTED),
  generatedBy (teacherId), approvedBy, createdAt, updatedAt
```

### 8.3 Proposed Schema Extensions

```
Question model:
  + isAIGenerated: Boolean @default(false)
  + aiGenerationLogId: Int?

ReviewCard model:
  + aiAdjustedInterval: Boolean @default(false)
  + aiConfidence: Float? (AI confidence in interval recommendation)
```

---

## 9. Content Pipeline for AI

### 9.1 Question Generation Flow

```
Teacher selects lesson → Extract text via extractPlainText()
  → Send to AI with prompt template
  → AI returns structured JSON (questions + options)
  → Validate against Question schema
  → Create Questions in DRAFT state
  → Teacher reviews/edits/approves
  → Questions become available to students
```

### 9.2 Summary Generation Flow

```
Teacher selects lesson → Extract text via extractPlainText()
  → Send to AI with summarization prompt
  → AI returns summary text
  → Store as LessonSummary in DRAFT
  → Teacher reviews/edits/approves
  → Summary visible to enrolled students
```

### 9.3 Smart Interval Flow

```
System collects student ReviewLog data
  → Analyze patterns (response time, ratings, retention)
  → AI recommends adjusted nextReviewDate
  → Update ReviewCard.nextReviewDate
  → No teacher approval needed (algorithm-driven)
```

---

## 10. Reference Implementations

### 10.1 Existing Patterns to Follow

- **Pure utility functions:** Follow `quizUtils.ts` and `gamificationUtils.ts` pattern — no Prisma imports, testable
- **Server Actions:** Follow `actions.ts` pattern — auth, validate, mutate, revalidate
- **Container/Client:** Follow `*Container.tsx` pattern for any AI status dashboards
- **Fire-and-forget:** Follow gamification pattern for non-critical AI operations

### 10.2 No Existing Adapter Pattern

The codebase has no external API integrations beyond Clerk and Cloudinary (both use SDK patterns, not custom adapters). The AI adapter will be the first custom external API integration layer.

Recommended structure:
```
src/lib/ai/
  ├── types.ts              — Shared types and interfaces
  ├── aiService.ts          — Main orchestrator (provider-agnostic)
  ├── prompts.ts            — Prompt templates for each capability
  ├── validation.ts         — AI output validation against schemas
  └── adapters/
      ├── openai.ts         — OpenAI adapter
      ├── anthropic.ts      — Anthropic adapter
      └── index.ts          — Adapter factory
```

---

## 11. Implementation Readiness

### Ready Components
- Lesson content extraction: `extractPlainText()` exists
- Question creation: Full Question + AnswerOption workflow exists
- Question Bank: Dedicated model for reusable collections
- Spaced Repetition: Leitner boxes implemented, ready for interval adjustment
- Notification: Infrastructure in place
- Auth & Permissions: Teacher ownership verification established
- Gamification: Event processing pipeline ready for new event types

### Components Needing Addition
- AI Provider Adapters: New directory and architecture
- Draft/Approval Workflow: Status enum for AI content lifecycle
- AI Settings Model: Deployment and teacher preferences
- Usage Tracking: Quota/limit tracking
- AI Response Validation: Validate AI output conforms to Question schema
- Summary Model: New model or field for lesson summaries
- Admin AI Dashboard: Usage monitoring and configuration

---

Research completed: 2026-02-25
Researcher: MoAI Explore Agent
