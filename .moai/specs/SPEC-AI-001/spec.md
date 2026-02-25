# SPEC-AI-001: AI-Powered Learning Engine

## Metadata

| Field | Value |
|-------|-------|
| SPEC ID | SPEC-AI-001 |
| Title | AI-Powered Learning Engine |
| Created | 2026-02-25 |
| Status | Completed |
| Priority | High |
| Domain | AI |
| Lifecycle | spec-anchored |

## Environment

- **Platform**: Next.js 16, React 19, TypeScript 5, Prisma ORM, PostgreSQL
- **Authentication**: Clerk (admin, teacher, student, parent roles)
- **School Type**: Bi-weekly (Saturday/Sunday only) with 12-day gap between sessions
- **Scale**: Under 500 users across all roles
- **Existing LMS**: Courses, modules, lessons (Lexical JSON content), quizzes (MCQ/TF/SA/Essay), spaced repetition (5-box Leitner), gamification (XP/badges/streaks)
- **Content Format**: Lexical JSON AST stored in `LmsLesson.content`; extraction via `extractPlainText()` in `src/components/editor/lexicalUtils.ts`
- **Spaced Repetition**: SM-2 Leitner boxes with weekend-based scheduling in `src/lib/spacedRepetitionUtils.ts`
- **No existing external API integration layer**: Clerk and Cloudinary use SDK patterns; the AI adapter will be the first custom external API integration

## Assumptions

1. Teachers will use AI-generated content as a starting point and will review/approve before students see it
2. AI providers (OpenAI, Anthropic, Google) offer stable chat/completion APIs with structured JSON output capabilities
3. The school administration will configure and fund AI API access at the deployment level
4. Student ReviewLog data (rating, responseTimeMs, box transitions) provides sufficient signal for personalized interval adjustment
5. AI-generated questions can conform to the existing Question + AnswerOption schema without structural changes
6. Monthly usage quotas per teacher are sufficient to prevent runaway costs
7. Lesson content extracted via `extractPlainText()` provides adequate context for question and summary generation
8. Server Actions are the appropriate execution context for AI API calls (no streaming to client required for v1)

## Requirements

### Ubiquitous Requirements

- [REQ-U-001] The system shall store all AI-generated content with a traceable link to the generation request that produced it.
- [REQ-U-002] The system shall enforce authentication and role-based authorization on all AI-related Server Actions (admin, teacher only for generation; student read-only for approved content).
- [REQ-U-003] The system shall log every AI generation request with provider, model, token usage, and cost metadata in the AIGenerationLog model.
- [REQ-U-004] The system shall validate all AI-generated output against existing Zod schemas before persisting to the database.

### Event-Driven Requirements

- [REQ-E-001] **WHEN** a teacher requests AI question generation for a lesson, **THEN** the system shall extract lesson text via `extractPlainText()`, send it to the configured AI provider, validate the structured response against the Question schema, and create Question records in DRAFT status with `isAIGenerated: true`.
- [REQ-E-002] **WHEN** a teacher approves a DRAFT AI-generated question, **THEN** the system shall update the question status to APPROVED and make it available in the associated quiz or question bank.
- [REQ-E-003] **WHEN** a teacher rejects a DRAFT AI-generated question, **THEN** the system shall update the question status to REJECTED and exclude it from student-facing views.
- [REQ-E-004] **WHEN** a teacher requests AI summary generation for a lesson, **THEN** the system shall extract lesson text, send it to the AI provider, and create a LessonSummary record in DRAFT status.
- [REQ-E-005] **WHEN** a teacher approves a DRAFT lesson summary, **THEN** the system shall update the summary status to APPROVED and make it visible to enrolled students.
- [REQ-E-006] **WHEN** a student completes a review session, **THEN** the system shall analyze the student's ReviewLog history and compute personalized next review intervals using the AI-enhanced algorithm, updating `nextReviewDate` on affected ReviewCard records.
- [REQ-E-007] **WHEN** AI-generated questions are created, **THEN** the system shall create a notification for the teacher: "AI generated N questions for [Lesson]. Review them."
- [REQ-E-008] **WHEN** an AI-generated summary is created, **THEN** the system shall create a notification for the teacher: "AI summary generated for [Lesson]. Review it."
- [REQ-E-009] **WHEN** a summary is approved by a teacher, **THEN** the system shall create notifications for enrolled students: "New summary available for [Lesson]."
- [REQ-E-010] **WHEN** a teacher's monthly AI usage exceeds 80% of their quota, **THEN** the system shall create a notification warning the teacher of approaching limits.

### State-Driven Requirements

- [REQ-S-001] **IF** the AI provider is not configured (missing API key or provider setting), **THEN** all AI generation features shall be hidden from the UI and AI Server Actions shall return a descriptive error.
- [REQ-S-002] **IF** a teacher has exceeded their monthly AI generation quota, **THEN** the system shall reject new generation requests with a user-friendly message indicating remaining quota and reset date.
- [REQ-S-003] **IF** a lesson has no text content (empty or video-only), **THEN** the AI generation buttons shall be disabled with a tooltip explaining that text content is required.
- [REQ-S-004] **IF** the AI provider returns an error or malformed response, **THEN** the system shall log the failure in AIGenerationLog with status FAILED, and display a user-friendly error message to the teacher.
- [REQ-S-005] **IF** a lesson already has an APPROVED summary, **THEN** the system shall offer to replace or supplement the existing summary rather than creating a duplicate.

### Unwanted Behavior Requirements

- [REQ-N-001] The system shall NOT expose AI-generated content to students before teacher approval (DRAFT content must be invisible to student and parent roles).
- [REQ-N-002] The system shall NOT send AI API keys or provider configuration to the client; all AI communication must occur server-side via Server Actions.
- [REQ-N-003] The system shall NOT allow students or parents to trigger AI generation requests.
- [REQ-N-004] The system shall NOT modify spaced repetition intervals without preserving the student's ReviewLog history for auditability.
- [REQ-N-005] The system shall NOT allow a single AI generation request to exceed the configured maximum token limit per request.

### Optional Requirements

- [REQ-O-001] Where possible, the system should provide a "regenerate" option for teachers dissatisfied with AI output, counting toward their monthly quota.
- [REQ-O-002] Where possible, the system should display estimated AI credit cost before a teacher confirms a generation request.
- [REQ-O-003] Where possible, the system should support batch question generation for multiple lessons within a module.

## Specifications

### 1. Provider-Agnostic AI Adapter Architecture

The system shall implement a pluggable adapter pattern at `src/lib/ai/`:

```
src/lib/ai/
  types.ts              -- Shared types and interfaces (AIProvider, AIResponse, GenerationConfig)
  aiService.ts          -- Main orchestrator (provider-agnostic facade)
  prompts.ts            -- Prompt templates for question generation, summary generation
  validation.ts         -- AI output validation against Question/Summary schemas
  adapters/
    openai.ts           -- OpenAI adapter (gpt-4o-mini, gpt-4o)
    anthropic.ts        -- Anthropic adapter (claude-3-haiku, claude-3-sonnet)
    index.ts            -- Adapter factory (reads AI_PROVIDER env var)
```

**AIProvider interface**: `generateCompletion(prompt: string, config: GenerationConfig) => Promise<AIResponse>`

### 2. Database Schema Extensions

**New Models:**

- `AIGenerationLog`: Tracks all AI generation requests (teacherId, lessonId, generationType enum [QUESTIONS, SUMMARY, INTERVAL_ADJUSTMENT], status enum [PENDING, COMPLETED, FAILED], provider, model, inputTokens, outputTokens, estimatedCost, metadata JSON, createdAt)
- `LessonSummary`: Stores AI-generated summaries (lessonId, content as Text, status enum [DRAFT, APPROVED, REJECTED], generatedByTeacherId, approvedByTeacherId, aiGenerationLogId, createdAt, updatedAt)
- `AISettings`: Deployment-wide AI configuration (provider, modelId, monthlyQuotaPerTeacher, maxTokensPerRequest, enabled boolean, createdAt, updatedAt) -- single row, admin-managed

**Schema Extensions to Existing Models:**

- `Question`: Add `isAIGenerated: Boolean @default(false)`, `aiStatus: AIContentStatus?`, `aiGenerationLogId: Int?`
- `ReviewCard`: Add `aiAdjustedInterval: Boolean @default(false)`, `aiConfidence: Float?`

**New Enums:**

- `AIGenerationType`: QUESTIONS, SUMMARY, INTERVAL_ADJUSTMENT
- `AIGenerationStatus`: PENDING, COMPLETED, FAILED
- `AIContentStatus`: DRAFT, APPROVED, REJECTED

**NotificationType Extension:**

- Add `AI_CONTENT` value to existing NotificationType enum

### 3. Smart Spaced Repetition Enhancement

Enhance the existing Leitner box algorithm with AI-driven interval personalization:

- Analyze student ReviewLog data: rating patterns, response time trends, box transition history
- Compute a confidence-weighted interval adjustment factor per student per subject
- Apply adjustment to `computeNextReviewDate()` output, shortening intervals for struggling students and extending for mastered material
- Store adjustment metadata on ReviewCard (`aiAdjustedInterval: true`, `aiConfidence: 0.0-1.0`)
- Algorithm operates without AI API calls for v1 (local statistical analysis of ReviewLog data); AI provider used only if advanced pattern recognition is needed in future iterations
- No teacher approval required (algorithm-driven, transparent)

### 4. Cost Management

- Monthly quota tracked per teacher via AIGenerationLog aggregation (COUNT + SUM of tokens per calendar month)
- Admin configures default quota in AISettings
- Quota enforcement checked before every AI generation request
- Admin dashboard displays usage per teacher with visual progress bars

### 5. Integration Points

| Integration | Pattern | Reference |
|-------------|---------|-----------|
| Content Extraction | `extractPlainText()` from Lexical JSON | `src/components/editor/lexicalUtils.ts:41-56` |
| Question Creation | Existing `createQuestion` Server Action pattern | `src/lib/actions.ts:2182-2227` |
| Notification | Existing `createNotification` function | `src/lib/notificationActions.ts:8-42` |
| Gamification | Fire-and-forget `processGamificationEvent` | `src/lib/gamificationActions.ts:28-136` |
| Auth Pattern | `auth()` + role check from Clerk | Standard Server Action pattern |
| Validation | Zod schemas from `formValidationSchemas.ts` | `src/lib/formValidationSchemas.ts` |

## Traceability

| Requirement | Plan Phase | Acceptance Criteria |
|-------------|------------|---------------------|
| REQ-U-001 | Phase 1, 3, 4 | AC-001 |
| REQ-U-002 | Phase 3, 4, 5, 6, 7 | AC-002 |
| REQ-U-003 | Phase 1, 2 | AC-003 |
| REQ-U-004 | Phase 2, 3, 4 | AC-004 |
| REQ-E-001 | Phase 3 | AC-005 |
| REQ-E-002 | Phase 3 | AC-006 |
| REQ-E-003 | Phase 3 | AC-007 |
| REQ-E-004 | Phase 4 | AC-008 |
| REQ-E-005 | Phase 4 | AC-009 |
| REQ-E-006 | Phase 5 | AC-010 |
| REQ-E-007 | Phase 3 | AC-011 |
| REQ-E-008 | Phase 4 | AC-012 |
| REQ-E-009 | Phase 4 | AC-013 |
| REQ-E-010 | Phase 6 | AC-014 |
| REQ-S-001 | Phase 2, 6 | AC-015 |
| REQ-S-002 | Phase 6 | AC-016 |
| REQ-S-003 | Phase 3, 4 | AC-017 |
| REQ-S-004 | Phase 2 | AC-018 |
| REQ-S-005 | Phase 4 | AC-019 |
| REQ-N-001 | Phase 3, 4 | AC-020 |
| REQ-N-002 | Phase 2 | AC-021 |
| REQ-N-003 | Phase 3, 4, 5 | AC-022 |
| REQ-N-004 | Phase 5 | AC-023 |
| REQ-N-005 | Phase 2 | AC-024 |
| REQ-O-001 | Phase 3, 4 | AC-025 |
| REQ-O-002 | Phase 3, 4 | AC-026 |
| REQ-O-003 | Phase 3 | AC-027 |

## Implementation Notes

**Completed**: 2026-02-26
**Commit**: 0aafbf7

### Implementation Summary

All 27 EARS-format requirements (REQ-U-001 through REQ-O-003) were implemented across 8 phases. The implementation follows the DDD methodology (ANALYZE-PRESERVE-IMPROVE).

### Key Architecture Decisions

- **Separate aiActions.ts**: Created a dedicated Server Actions file (1216 lines) instead of extending the existing 2581-line actions.ts, to maintain file cohesion
- **Pure function pattern**: Quota utilities, validation parsing, interval optimizer, and prompt builders are all pure functions with zero external dependencies, enabling fast unit testing (125 tests in 191ms)
- **Provider adapter pattern**: OpenAI and Anthropic adapters implement a unified AIProvider interface, enabling runtime provider switching via environment configuration
- **Content truncation**: Lesson content exceeding 8000 characters is truncated before AI processing; content under 50 characters is rejected
- **Graceful degradation**: AI-enhanced spaced repetition falls back to base Leitner intervals on error or insufficient data (<5 review logs)
- **Draft/Approval workflow**: All AI-generated content (questions and summaries) starts as DRAFT and requires teacher approval before student visibility

### Deferred Items

None. All planned requirements were implemented.

### Test Coverage

- quotaUtils: 17 tests (quota availability, threshold warnings, month boundaries)
- validation: 22 tests (question/summary parsing, malformed data rejection)
- intervalOptimizer: 31 tests (performance analysis, interval clamping, retention probability)
- prompts: 21 tests (prompt construction, truncation, optional fields)
- aiService: 9 tests (provider orchestration, config merging, error handling)
- Pre-existing: 25 tests (quizUtils, shuffleUtils) — zero regressions
