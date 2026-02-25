# SPEC-AI-001: Implementation Plan

## Overview

AI-Powered Learning Engine for Hua Readwise. Three capabilities: auto-generated questions, auto-summary of lessons, and smart spaced repetition. Provider-agnostic architecture with teacher approval workflow and cost management.

**SPEC ID**: SPEC-AI-001
**Development Mode**: DDD (ANALYZE-PRESERVE-IMPROVE)
**Methodology**: Analyze existing spaced repetition, quiz, and lesson systems. Preserve their behavior with characterization tests. Improve by adding AI generation layer, draft/approval workflow, and interval personalization.

---

## Phase 1: Database Schema Changes

**Priority**: Primary Goal (all other phases depend on this)
**Complexity**: Medium
**Dependencies**: None

### Objective

Add new Prisma models and extend existing ones to support AI generation tracking, content approval workflow, and lesson summaries.

### New Models

**AIGenerationLog**
```
model AIGenerationLog {
  id              Int                 @id @default(autoincrement())
  teacherId       String
  teacher         Teacher             @relation(fields: [teacherId], references: [id])
  lessonId        Int?
  lesson          LmsLesson?          @relation(fields: [lessonId], references: [id])
  generationType  AIGenerationType
  status          AIGenerationStatus  @default(PENDING)
  provider        String?
  model           String?
  inputTokens     Int?
  outputTokens    Int?
  estimatedCost   Float?
  metadata        Json?
  errorMessage    String?
  createdAt       DateTime            @default(now())

  questions       Question[]
  summaries       LessonSummary[]

  @@index([teacherId, createdAt])
  @@index([teacherId, generationType, createdAt])
}
```

**LessonSummary**
```
model LessonSummary {
  id                  Int              @id @default(autoincrement())
  lessonId            Int
  lesson              LmsLesson        @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  content             String           @db.Text
  status              AIContentStatus  @default(DRAFT)
  generatedByTeacherId String
  generatedByTeacher   Teacher         @relation("GeneratedSummaries", fields: [generatedByTeacherId], references: [id])
  approvedByTeacherId  String?
  approvedByTeacher    Teacher?        @relation("ApprovedSummaries", fields: [approvedByTeacherId], references: [id])
  aiGenerationLogId   Int?
  aiGenerationLog     AIGenerationLog? @relation(fields: [aiGenerationLogId], references: [id])
  createdAt           DateTime         @default(now())
  updatedAt           DateTime         @updatedAt

  @@index([lessonId, status])
}
```

**AISettings** (single-row configuration)
```
model AISettings {
  id                    Int      @id @default(1)
  provider              String   @default("openai")
  modelId               String   @default("gpt-4o-mini")
  monthlyQuotaPerTeacher Int     @default(100)
  maxTokensPerRequest   Int      @default(4000)
  enabled               Boolean  @default(false)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

### New Enums

```
enum AIGenerationType {
  QUESTIONS
  SUMMARY
  INTERVAL_ADJUSTMENT
}

enum AIGenerationStatus {
  PENDING
  COMPLETED
  FAILED
}

enum AIContentStatus {
  DRAFT
  APPROVED
  REJECTED
}
```

### Schema Extensions to Existing Models

**Question model**: Add fields
- `isAIGenerated Boolean @default(false)`
- `aiStatus AIContentStatus?`
- `aiGenerationLogId Int?`
- `aiGenerationLog AIGenerationLog? @relation(fields: [aiGenerationLogId], references: [id])`

**ReviewCard model**: Add fields
- `aiAdjustedInterval Boolean @default(false)`
- `aiConfidence Float?`

**NotificationType enum**: Add value `AI_CONTENT`

### Relations to Update

- `Teacher` model: Add `aiGenerationLogs AIGenerationLog[]`, `generatedSummaries LessonSummary[] @relation("GeneratedSummaries")`, `approvedSummaries LessonSummary[] @relation("ApprovedSummaries")`
- `LmsLesson` model: Add `aiGenerationLogs AIGenerationLog[]`, `summaries LessonSummary[]`

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Modify | Add 3 new models, 3 new enums, extend Question + ReviewCard + NotificationType |
| `prisma/migrations/` | Create | New migration via `npx prisma migrate dev` |
| `src/lib/formValidationSchemas.ts` | Modify | Add Zod schemas for LessonSummary, AISettings, AI question generation params |

### Reference Implementation

Follow the pattern established by gamification models (SPEC-LMS-006): new models with relations to existing Teacher/Student/Course models, new enums, and corresponding Zod validation schemas.

---

## Phase 2: AI Adapter Layer

**Priority**: Primary Goal
**Complexity**: High
**Dependencies**: Phase 1 (needs AIGenerationLog model for logging)

### Objective

Create the provider-agnostic AI service layer that abstracts OpenAI, Anthropic, and other providers behind a unified interface.

### Files to Create

| File | Action | Description |
|------|--------|-------------|
| `src/lib/ai/types.ts` | Create | Shared types: AIProvider interface, AIResponse, GenerationConfig, PromptTemplate, QuestionGenerationResult, SummaryGenerationResult |
| `src/lib/ai/adapters/openai.ts` | Create | OpenAI adapter implementing AIProvider interface using `openai` npm package |
| `src/lib/ai/adapters/anthropic.ts` | Create | Anthropic adapter implementing AIProvider interface using `@anthropic-ai/sdk` npm package |
| `src/lib/ai/adapters/index.ts` | Create | Factory function: reads AI_PROVIDER env var, returns configured adapter instance |
| `src/lib/ai/prompts.ts` | Create | Prompt templates for question generation (MCQ, TF) and summary generation |
| `src/lib/ai/validation.ts` | Create | Zod schemas for parsing AI JSON responses; validate against Question/AnswerOption structure |
| `src/lib/ai/aiService.ts` | Create | Main orchestrator: accepts generation request, selects adapter, calls provider, validates output, logs to AIGenerationLog |
| `src/lib/ai/quotaUtils.ts` | Create | Pure functions for quota calculation: getMonthlyUsage, checkQuotaAvailable, calculateRemainingQuota |

### Architecture

```
Teacher triggers generation
  -> Server Action (auth + quota check)
    -> aiService.generateQuestions(lessonId, config)
      -> adapters/index.ts selects provider
      -> adapter.generateCompletion(prompt, config)
      -> validation.ts validates AI response
      -> Return structured result
    -> Server Action persists to DB
```

### Key Interfaces (in types.ts)

```typescript
interface AIProvider {
  generateCompletion(prompt: string, config: GenerationConfig): Promise<AIResponse>;
}

interface GenerationConfig {
  maxTokens: number;
  temperature: number;
  responseFormat: 'json';
}

interface AIResponse {
  content: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
  provider: string;
}

interface QuestionGenerationResult {
  questions: Array<{
    text: string;
    type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
    explanation: string;
    points: number;
    options: Array<{
      text: string;
      isCorrect: boolean;
      order: number;
    }>;
  }>;
}

interface SummaryGenerationResult {
  summary: string;
  keyPoints: string[];
}
```

### npm Packages to Add

- `openai` (OpenAI Node SDK)
- `@anthropic-ai/sdk` (Anthropic Node SDK)

### Environment Variables

```
AI_PROVIDER=openai          # openai | anthropic
AI_API_KEY=sk-...           # Provider API key (server-side only, no NEXT_PUBLIC_ prefix)
AI_MODEL_ID=gpt-4o-mini    # Model identifier
AI_MAX_TOKENS_PER_REQUEST=4000
AI_MONTHLY_QUOTA_PER_TEACHER=100
```

### Error Handling Strategy

- Network errors: Catch, log to AIGenerationLog with status FAILED, return user-friendly message
- Malformed AI response: Log raw response in AIGenerationLog metadata, return validation error
- Rate limiting: Catch 429 errors, suggest retry with exponential backoff message
- Missing API key: Return descriptive error; UI hides AI features when provider is not configured

### Reference Implementation

No existing adapter pattern in the codebase. This is the first custom external API integration. Follow the pure function pattern from `quizUtils.ts` for validation logic, and the Server Action pattern from `actions.ts` for the action layer.

---

## Phase 3: Auto-Question Generation

**Priority**: Primary Goal
**Complexity**: High
**Dependencies**: Phase 1 (schema), Phase 2 (AI adapter)

### Objective

Enable teachers to generate quiz questions from lesson content using AI, with a draft/review/approve workflow.

### Files to Create

| File | Action | Description |
|------|--------|-------------|
| `src/lib/aiActions.ts` | Create | Server Actions: `generateAIQuestions`, `approveAIQuestion`, `rejectAIQuestion`, `bulkApproveAIQuestions` |
| `src/components/AIQuestionGenerator.tsx` | Create | Client Component: lesson selector, generation config (count, types), trigger button, loading state |
| `src/components/AIQuestionReview.tsx` | Create | Client Component: review interface for DRAFT questions with approve/reject/edit actions per question |
| `src/components/AIQuestionReviewContainer.tsx` | Create | Server Component: fetches DRAFT AI questions for a lesson/quiz |

### Server Action: `generateAIQuestions`

1. Auth check (admin or teacher)
2. Verify teacher owns the course containing the lesson
3. Check teacher's monthly quota via `quotaUtils.checkQuotaAvailable()`
4. Extract lesson text: `extractPlainText(lesson.content)`
5. Validate text is non-empty (REQ-S-003)
6. Create AIGenerationLog entry with status PENDING
7. Call `aiService.generateQuestions(text, config)`
8. Validate AI response via `validation.ts`
9. Create Question records with `isAIGenerated: true`, `aiStatus: DRAFT`, linked to AIGenerationLog
10. Create AnswerOption records for each question
11. Update AIGenerationLog to COMPLETED with token counts
12. Create notification for teacher (REQ-E-007)
13. Revalidate paths
14. Return success with question count

### Server Action: `approveAIQuestion`

1. Auth check (admin or teacher)
2. Verify ownership
3. Update `Question.aiStatus` from DRAFT to APPROVED
4. Revalidate paths

### Server Action: `rejectAIQuestion`

1. Auth check (admin or teacher)
2. Verify ownership
3. Update `Question.aiStatus` from DRAFT to REJECTED
4. Revalidate paths

### UI Flow

```
Lesson Detail Page -> "Generate Questions with AI" button
  -> AIQuestionGenerator modal/panel
    -> Select question count (3, 5, 10)
    -> Select question types (MCQ, TF, or mix)
    -> Select target (quiz or question bank)
    -> "Generate" button with quota display
    -> Loading spinner during generation
  -> AIQuestionReview panel appears
    -> Each question shown with text, options, explanation
    -> Per-question: Approve / Reject / Edit buttons
    -> Bulk Approve All button
    -> Teacher can edit question text/options before approving
```

### Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `src/app/(dashboard)/list/courses/[id]/lesson/[lessonId]/page.tsx` | Modify | Add "Generate Questions" button for teachers |
| `src/lib/formValidationSchemas.ts` | Modify | Add `aiQuestionGenerationSchema` for generation params |

### Visibility Rules

- DRAFT questions: Visible only to the teacher who generated them (and admins)
- APPROVED questions: Visible to students (same as regular questions)
- REJECTED questions: Hidden from all views (soft delete behavior)

### Reference Implementation

Follow `createQuestion` pattern at `src/lib/actions.ts:2182-2227` for the question creation flow. Follow `QuestionForm.tsx` pattern for the review UI.

---

## Phase 4: Auto-Summary Generation

**Priority**: Secondary Goal
**Complexity**: Medium
**Dependencies**: Phase 1 (schema), Phase 2 (AI adapter)

### Objective

Enable teachers to generate concise lesson summaries using AI, with a draft/approval workflow. Approved summaries are visible to enrolled students to help bridge the 12-day gap between sessions.

### Files to Create

| File | Action | Description |
|------|--------|-------------|
| `src/lib/aiActions.ts` | Modify | Add Server Actions: `generateAISummary`, `approveAISummary`, `rejectAISummary`, `updateAISummary` |
| `src/components/AISummaryGenerator.tsx` | Create | Client Component: trigger button, summary length preference, generation |
| `src/components/AISummaryReview.tsx` | Create | Client Component: review interface for DRAFT summary with approve/reject/edit |
| `src/components/AISummaryReviewContainer.tsx` | Create | Server Component: fetches DRAFT summaries for a lesson |
| `src/components/LessonSummaryDisplay.tsx` | Create | Client Component: renders approved summary for students |
| `src/components/LessonSummaryDisplayContainer.tsx` | Create | Server Component: fetches approved summary for enrolled students |

### Server Action: `generateAISummary`

1. Auth check (admin or teacher)
2. Verify teacher owns the course
3. Check monthly quota
4. Extract lesson text via `extractPlainText()`
5. Check for existing APPROVED summary (REQ-S-005): offer replace or supplement
6. Create AIGenerationLog entry with status PENDING
7. Call `aiService.generateSummary(text, config)`
8. Create LessonSummary record with status DRAFT
9. Update AIGenerationLog to COMPLETED
10. Create notification for teacher (REQ-E-008)
11. Revalidate paths

### Server Action: `approveAISummary`

1. Auth check (admin or teacher)
2. Verify ownership
3. Update `LessonSummary.status` to APPROVED, set `approvedByTeacherId`
4. If replacing existing approved summary, set previous to REJECTED
5. Create notifications for enrolled students (REQ-E-009)
6. Revalidate paths

### UI Flow

**Teacher View (Lesson Detail Page):**
```
Lesson Detail -> "Generate Summary with AI" button
  -> AISummaryGenerator: summary length (brief/standard/detailed)
  -> Loading state during generation
  -> AISummaryReview: shows generated summary
    -> Approve / Reject / Edit / Regenerate
    -> Edit allows inline text modification before approval
```

**Student View (Lesson Detail Page):**
```
Lesson Detail -> "Summary" section (if approved summary exists)
  -> LessonSummaryDisplay: rendered summary with key points
  -> Labeled as "AI-generated, teacher-approved"
```

### Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `src/app/(dashboard)/list/courses/[id]/lesson/[lessonId]/page.tsx` | Modify | Add summary generation button for teachers, summary display for students |

### Reference Implementation

Follow the `Container/Client` pattern used by `CourseAnalyticsContainer.tsx` / chart components. Follow the notification pattern from `createNotification()` in `notificationActions.ts`.

---

## Phase 5: Smart Spaced Repetition

**Priority**: Secondary Goal
**Complexity**: High
**Dependencies**: Phase 1 (schema extensions on ReviewCard)

### Objective

Enhance the existing Leitner box algorithm with personalized interval adjustment based on student performance patterns analyzed from ReviewLog data.

### Files to Create

| File | Action | Description |
|------|--------|-------------|
| `src/lib/ai/intervalOptimizer.ts` | Create | Pure functions: analyzeStudentPerformance, computeOptimalInterval, calculateRetentionProbability |
| `src/lib/ai/intervalTypes.ts` | Create | Types for interval optimization: StudentPerformanceProfile, IntervalAdjustment, RetentionMetrics |

### Algorithm Design

**Input Data (per student per subject):**
- ReviewLog records: rating history, responseTimeMs trends, box transitions
- ReviewCard metadata: current box, easinessFactor, consecutiveCorrect
- Time gaps between review sessions

**Analysis Functions (pure, no Prisma):**

1. `analyzeStudentPerformance(reviewLogs: ReviewLogEntry[])`: Computes:
   - Average rating trend (improving, stable, declining)
   - Response time trend (faster = mastering, slower = struggling)
   - Retention rate: % of reviews at or above OK rating
   - Lapse frequency: % of HARD ratings in last N reviews

2. `computeOptimalInterval(profile: StudentPerformanceProfile, baseInterval: number)`: Returns:
   - Adjusted interval (days) with confidence score
   - For struggling students (declining trend, high lapse rate): shorten interval by 20-40%
   - For mastering students (improving trend, low lapse rate): extend interval by 10-30%
   - For stable students: use base Leitner interval unchanged

3. `calculateRetentionProbability(daysSinceReview: number, stability: number)`: Uses FSRS-like exponential decay model to estimate probability of recall

**Integration with Existing System:**

The `computeNextReviewDate()` function in `spacedRepetitionUtils.ts` will NOT be modified. Instead, a new wrapper function `computeAIEnhancedReviewDate()` will:
1. Call existing `computeNextReviewDate()` to get the base Leitner interval
2. Fetch student's ReviewLog data for the subject
3. Call `analyzeStudentPerformance()` to build a profile
4. Call `computeOptimalInterval()` to get adjustment
5. Apply adjustment to the base date
6. Return the adjusted date + confidence score

### Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `src/lib/actions.ts` | Modify | Update review submission action to use `computeAIEnhancedReviewDate()` when AI interval adjustment is enabled |
| `src/lib/spacedRepetitionUtils.ts` | No change | Preserve existing Leitner algorithm unchanged |

### Key Design Decisions

- **No AI API calls in v1**: The interval optimizer uses local statistical analysis of ReviewLog data, not AI provider calls. This keeps the algorithm fast, free, and deterministic.
- **Graceful degradation**: If a student has fewer than 5 ReviewLog entries for a subject, the optimizer returns the base Leitner interval unchanged.
- **Transparency**: The `aiAdjustedInterval` flag on ReviewCard indicates which cards have AI-adjusted scheduling. The `aiConfidence` field records the optimizer's confidence (0.0-1.0).
- **Preserve auditability**: All ReviewLog entries are preserved. The optimizer adds metadata but never deletes or modifies historical log entries (REQ-N-004).

### Reference Implementation

Follow `spacedRepetitionUtils.ts` pattern: pure functions, no Prisma imports, typed inputs and outputs. The existing `computeBoxPromotion()` and `computeNextReviewDate()` functions serve as the architectural model.

---

## Phase 6: Admin AI Dashboard

**Priority**: Secondary Goal
**Complexity**: Medium
**Dependencies**: Phase 1 (schema), Phase 2 (AI adapter), Phase 3 (question generation creates usage data)

### Objective

Admin interface for configuring AI settings and monitoring usage across the deployment.

### Files to Create

| File | Action | Description |
|------|--------|-------------|
| `src/lib/aiActions.ts` | Modify | Add: `getAISettings`, `updateAISettings`, `getAIUsageStats` |
| `src/components/AISettingsForm.tsx` | Create | Client Component: form for AISettings (provider, model, quota, enabled toggle) |
| `src/components/AIUsageDashboard.tsx` | Create | Client Component: usage charts per teacher, monthly trends |
| `src/components/AIUsageDashboardContainer.tsx` | Create | Server Component: fetches AIGenerationLog aggregation data |
| `src/app/(dashboard)/list/ai-settings/page.tsx` | Create | Admin-only page for AI configuration and usage monitoring |

### Admin Settings Page Features

- Toggle AI features on/off for the entire deployment
- Select AI provider (OpenAI, Anthropic) and model
- Set monthly quota per teacher (default: 100 requests)
- Set max tokens per request
- View per-teacher usage table: teacher name, requests this month, tokens used, estimated cost
- View monthly trend chart (total requests, total tokens, total cost)
- Quota alert: highlight teachers approaching 80% usage

### Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `src/lib/settings.ts` | Modify | Add `/list/ai-settings` to routeAccessMap for admin role |
| `src/components/Menu.tsx` | Modify | Add "AI Settings" menu item under admin section |
| `src/lib/formValidationSchemas.ts` | Modify | Add `aiSettingsSchema` for the settings form |

### Reference Implementation

Follow the `BadgeForm.tsx` pattern for the settings form (admin-only CRUD). Follow the `LmsAdoptionMetrics.tsx` pattern for the usage dashboard (Server/Client container pattern with Recharts).

---

## Phase 7: Teacher AI Controls

**Priority**: Final Goal
**Complexity**: Low
**Dependencies**: Phase 3, Phase 4, Phase 6

### Objective

Teacher-facing UI enhancements showing AI generation status, quota usage, and review queue.

### Files to Create

| File | Action | Description |
|------|--------|-------------|
| `src/components/TeacherAIOverview.tsx` | Create | Client Component: quota usage bar, pending reviews count, recent generations |
| `src/components/TeacherAIOverviewContainer.tsx` | Create | Server Component: fetches teacher-specific AI data |
| `src/components/AIContentReviewQueue.tsx` | Create | Client Component: unified queue showing all DRAFT AI content (questions + summaries) |
| `src/components/AIContentReviewQueueContainer.tsx` | Create | Server Component: fetches all DRAFT content for teacher |

### Teacher Dashboard Additions

- **AI Overview Widget**: Shows monthly quota usage (N/M requests), pending review count, link to review queue
- **AI Content Review Queue Page**: Unified list of all DRAFT questions and summaries pending teacher review, sorted by creation date
- Quick approve/reject actions from the queue

### Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `src/app/(dashboard)/teacher/page.tsx` | Modify | Add TeacherAIOverview widget to teacher dashboard |
| `src/lib/settings.ts` | Modify | Add AI review queue route to teacher access map |

### Reference Implementation

Follow the `PreClassEngagementReport.tsx` and `AtRiskStudentsAlert.tsx` patterns for teacher dashboard widgets. Follow the Container/Client pattern used throughout.

---

## Phase 8: Polish and Integration Testing

**Priority**: Final Goal
**Complexity**: Medium
**Dependencies**: All previous phases

### Objective

End-to-end integration verification, error handling polish, and edge case coverage.

### Tasks

1. **End-to-End Flow Testing**
   - Teacher generates questions for a lesson -> reviews -> approves -> student sees questions in quiz
   - Teacher generates summary -> reviews -> approves -> student sees summary on lesson page
   - Student completes review session -> AI adjusts next review intervals
   - Admin configures AI settings -> teacher sees updated quota -> generates content within quota

2. **Error Handling Verification**
   - AI provider returns error -> graceful failure with user message, AIGenerationLog updated
   - AI returns malformed JSON -> validation catches, logs raw response, shows error
   - Teacher exceeds quota -> rejection with clear message
   - No API key configured -> AI features hidden, buttons disabled
   - Empty lesson content -> generation button disabled with tooltip

3. **Edge Cases**
   - Lesson with only video content (no extractable text)
   - Very short lesson content (< 50 characters)
   - Very long lesson content (> 10,000 characters) -- truncation strategy
   - Teacher generating for a lesson they do not own
   - Concurrent generation requests from same teacher
   - Approving content that was already approved

4. **Notification Verification**
   - All 4 notification types fire correctly (questions ready, summary ready, summary approved, quota warning)

5. **Performance Check**
   - AI generation response time is acceptable (< 30 seconds for typical requests)
   - Interval optimizer handles students with 100+ ReviewLog entries efficiently
   - Admin usage dashboard queries are not N+1

### Files to Modify

| File | Action | Description |
|------|--------|-------------|
| Various | Review | All files from Phases 1-7: error handling, loading states, edge cases |
| `src/lib/ai/prompts.ts` | Refine | Tune prompt templates based on output quality testing |

---

## Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| AI output quality varies (irrelevant or incorrect questions) | High | Medium | Teacher review workflow catches all issues; regenerate option available |
| AI provider API downtime | Medium | Medium | Graceful error handling; log failures; features degrade without breaking core LMS |
| Token cost exceeds expectations | Medium | High | Monthly quota per teacher; admin monitoring dashboard; token counting in logs |
| AI response format changes between model versions | Low | Medium | Validation layer catches malformed responses; adapter pattern isolates changes |
| Students see DRAFT content before approval | Low | High | Strict authorization in Server Actions + UI visibility rules; DRAFT status excludes from student queries |
| Spaced repetition interval adjustments too aggressive | Medium | Medium | Conservative defaults (20-40% adjustment range); confidence threshold; graceful fallback to base Leitner |
| Large lesson content exceeds AI token limits | Medium | Low | Truncation strategy in prompts.ts; configurable max tokens per request |
| Concurrent generation requests cause quota race condition | Low | Low | Use Prisma transaction for quota check + AIGenerationLog creation |

---

## New File Summary

### Files to Create (20 new files)

| File | Phase | Type |
|------|-------|------|
| `src/lib/ai/types.ts` | 2 | Utility |
| `src/lib/ai/adapters/openai.ts` | 2 | Adapter |
| `src/lib/ai/adapters/anthropic.ts` | 2 | Adapter |
| `src/lib/ai/adapters/index.ts` | 2 | Factory |
| `src/lib/ai/prompts.ts` | 2 | Utility |
| `src/lib/ai/validation.ts` | 2 | Utility |
| `src/lib/ai/aiService.ts` | 2 | Service |
| `src/lib/ai/quotaUtils.ts` | 2 | Utility |
| `src/lib/ai/intervalOptimizer.ts` | 5 | Utility |
| `src/lib/ai/intervalTypes.ts` | 5 | Types |
| `src/lib/aiActions.ts` | 3 | Server Actions |
| `src/components/AIQuestionGenerator.tsx` | 3 | Client Component |
| `src/components/AIQuestionReview.tsx` | 3 | Client Component |
| `src/components/AIQuestionReviewContainer.tsx` | 3 | Server Component |
| `src/components/AISummaryGenerator.tsx` | 4 | Client Component |
| `src/components/AISummaryReview.tsx` | 4 | Client Component |
| `src/components/AISummaryReviewContainer.tsx` | 4 | Server Component |
| `src/components/LessonSummaryDisplay.tsx` | 4 | Client Component |
| `src/components/LessonSummaryDisplayContainer.tsx` | 4 | Server Component |
| `src/components/AISettingsForm.tsx` | 6 | Client Component |
| `src/components/AIUsageDashboard.tsx` | 6 | Client Component |
| `src/components/AIUsageDashboardContainer.tsx` | 6 | Server Component |
| `src/app/(dashboard)/list/ai-settings/page.tsx` | 6 | Page |
| `src/components/TeacherAIOverview.tsx` | 7 | Client Component |
| `src/components/TeacherAIOverviewContainer.tsx` | 7 | Server Component |
| `src/components/AIContentReviewQueue.tsx` | 7 | Client Component |
| `src/components/AIContentReviewQueueContainer.tsx` | 7 | Server Component |

### Files to Modify (8 existing files)

| File | Phase | Change |
|------|-------|--------|
| `prisma/schema.prisma` | 1 | Add 3 models, 3 enums, extend Question + ReviewCard + NotificationType |
| `src/lib/formValidationSchemas.ts` | 1, 3, 6 | Add Zod schemas for AI generation params, AI settings |
| `src/lib/actions.ts` | 5 | Update review submission to use AI-enhanced interval |
| `src/lib/settings.ts` | 6, 7 | Add AI routes to routeAccessMap |
| `src/components/Menu.tsx` | 6 | Add AI Settings menu item |
| `src/app/(dashboard)/list/courses/[id]/lesson/[lessonId]/page.tsx` | 3, 4 | Add AI generation buttons and summary display |
| `src/app/(dashboard)/teacher/page.tsx` | 7 | Add AI overview widget |
| `package.json` | 2 | Add openai and @anthropic-ai/sdk dependencies |

---

## Dependency Graph

```
Phase 1 (Schema) ─────────┬──────────────┬──────────────┐
                           │              │              │
                     Phase 2 (Adapter)    │        Phase 5 (Repetition)
                           │              │
                    ┌──────┴──────┐       │
              Phase 3 (Questions)  Phase 4 (Summary)
                    │              │
                    └──────┬──────┘
                           │
                     Phase 6 (Admin Dashboard)
                           │
                     Phase 7 (Teacher Controls)
                           │
                     Phase 8 (Polish)
```

**Parallel Execution Opportunities:**
- Phase 3 and Phase 4 can run in parallel (both depend on Phase 1 + 2, independent of each other)
- Phase 5 can run in parallel with Phase 3/4 (depends only on Phase 1)
- Phase 6 depends on Phase 3 or 4 (needs usage data to display)
- Phase 7 depends on Phase 3, 4, and 6
- Phase 8 depends on all previous phases
