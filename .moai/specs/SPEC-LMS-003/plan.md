# SPEC-LMS-003: Implementation Plan

| Field | Value         |
| ----- | ------------- |
| id    | SPEC-LMS-003  |
| phase | plan          |
| tags  | forum, LMS    |

---

## Overview

This plan implements Course Discussion Forums with Threaded Replies and Teacher Moderation for the Hua Readwise school management system. The implementation follows the DDD (ANALYZE-PRESERVE-IMPROVE) methodology: first analyzing existing patterns, then preserving existing behavior with characterization awareness, then adding the new forum feature.

---

## Milestone 1: Database Schema and Migration (Priority High)

**Goal**: Add 3 new Prisma models, update Course model, extend NotificationType enum, and generate migration.

### Tasks

| # | Task | File | Depends On |
|---|------|------|------------|
| 1.1 | Add `ForumThread` model with indexes | `prisma/schema.prisma` | - |
| 1.2 | Add `ForumReply` model with self-relation and indexes | `prisma/schema.prisma` | 1.1 |
| 1.3 | Add `ForumVote` model with unique constraint | `prisma/schema.prisma` | 1.2 |
| 1.4 | Add `forumThreads ForumThread[]` relation to `Course` model | `prisma/schema.prisma` | 1.1 |
| 1.5 | Add `FORUM_REPLY` to `NotificationType` enum | `prisma/schema.prisma` | - |
| 1.6 | Run `npx prisma migrate dev --name add_forum_models` | CLI | 1.1-1.5 |
| 1.7 | Run `npx prisma generate` to regenerate client types | CLI | 1.6 |
| 1.8 | Verify existing models and relations are unaffected | CLI | 1.7 |

### Acceptance Gate

- Migration applies cleanly without errors
- `npx prisma validate` passes
- Existing LMS functionality unaffected (course detail page still renders)
- Prisma client types include `ForumThread`, `ForumReply`, `ForumVote`

---

## Milestone 2: Server Actions and Validation Schemas (Priority High)

**Goal**: Implement all 10 forum Server Actions with Zod validation and the authorization helper function.

### Tasks

| # | Task | File | Depends On |
|---|------|------|------------|
| 2.1 | Create Zod schemas for all forum operations | `src/lib/forumValidationSchemas.ts` | M1 |
| 2.2 | Implement `checkForumAccess()` authorization helper | `src/lib/forumActions.ts` | M1 |
| 2.3 | Implement `createThread` Server Action | `src/lib/forumActions.ts` | 2.1, 2.2 |
| 2.4 | Implement `updateThread` Server Action | `src/lib/forumActions.ts` | 2.2 |
| 2.5 | Implement `deleteThread` Server Action | `src/lib/forumActions.ts` | 2.2 |
| 2.6 | Implement `pinThread` Server Action | `src/lib/forumActions.ts` | 2.2 |
| 2.7 | Implement `lockThread` Server Action | `src/lib/forumActions.ts` | 2.2 |
| 2.8 | Implement `createReply` with notification logic | `src/lib/forumActions.ts` | 2.2 |
| 2.9 | Implement `updateReply` Server Action | `src/lib/forumActions.ts` | 2.2 |
| 2.10 | Implement `deleteReply` Server Action | `src/lib/forumActions.ts` | 2.2 |
| 2.11 | Implement `markReplyAccepted` with `$transaction` | `src/lib/forumActions.ts` | 2.2 |
| 2.12 | Implement `toggleVote` Server Action | `src/lib/forumActions.ts` | 2.2 |

### Acceptance Gate

- All 10 Server Actions compile without TypeScript errors
- Each action validates input with Zod before database access
- Each action checks authorization via `checkForumAccess()`
- `createReply` sends notification to thread author when appropriate
- `markReplyAccepted` uses Prisma `$transaction` for atomicity
- `toggleVote` correctly toggles between create and delete
- Locked thread check prevents reply creation

---

## Milestone 3: Forum Pages and Components (Priority High)

**Goal**: Build the forum thread list page, thread detail page, and all 8 UI components.

### Tasks

| # | Task | File | Depends On |
|---|------|------|------------|
| 3.1 | Create forum thread list page | `src/app/(dashboard)/list/courses/[id]/forum/page.tsx` | M2 |
| 3.2 | Create thread detail page | `src/app/(dashboard)/list/courses/[id]/forum/[threadId]/page.tsx` | M2 |
| 3.3 | Implement `ForumThreadList` (Server Component) | `src/components/ForumThreadList.tsx` | 3.1 |
| 3.4 | Implement `ForumThreadCard` (Server Component) | `src/components/ForumThreadCard.tsx` | 3.3 |
| 3.5 | Implement `ForumReplyList` (Server Component) | `src/components/ForumReplyList.tsx` | 3.2 |
| 3.6 | Implement `ForumReplyItem` (Client Component) | `src/components/ForumReplyItem.tsx` | 3.5 |
| 3.7 | Implement `ThreadForm` (Client Component) | `src/components/forms/ThreadForm.tsx` | M2 |
| 3.8 | Implement `ForumReplyForm` (Client Component) | `src/components/ForumReplyForm.tsx` | M2 |
| 3.9 | Implement `UpvoteButton` (Client Component) | `src/components/UpvoteButton.tsx` | M2 |
| 3.10 | Implement `ForumModeration` (Client Component) | `src/components/ForumModeration.tsx` | M2 |
| 3.11 | Add "Forum" link/button to course detail page | `src/app/(dashboard)/list/courses/[id]/page.tsx` | 3.1 |

### Acceptance Gate

- Forum thread list page renders with pagination and search
- Pinned threads appear at the top of the list
- Thread detail page shows thread content and all replies
- Reply form is disabled when thread is locked
- Anonymous threads/replies display "Anonymous" for student viewers
- Teachers and admins see actual author identity on anonymous posts
- Upvote button toggles with optimistic UI feedback
- Moderation controls visible only to teachers and admins
- Forum link accessible from course detail page

---

## Milestone 4: Moderation, Polish, and Integration (Priority Medium)

**Goal**: Complete moderation workflows, ensure consistent behavior across all edge cases, and integrate with existing navigation.

### Tasks

| # | Task | File | Depends On |
|---|------|------|------------|
| 4.1 | Add forum route to `routeAccessMap` in settings.ts | `src/lib/settings.ts` | M3 |
| 4.2 | Verify cascade delete behavior for threads | Test manually | M2 |
| 4.3 | Verify `markReplyAccepted` unsets previous accepted reply | Test manually | M2 |
| 4.4 | Test anonymous posting visibility rules for all roles | Test manually | M3 |
| 4.5 | Test locked thread prevents reply creation | Test manually | M3 |
| 4.6 | Test non-enrolled user access is blocked | Test manually | M3 |
| 4.7 | Verify notification delivery on new reply | Test manually | M2 |
| 4.8 | Add loading states for forum pages | `src/app/(dashboard)/list/courses/[id]/forum/loading.tsx` | M3 |
| 4.9 | Style forum components with Tailwind CSS v4 | All forum components | M3 |
| 4.10 | Test pagination on thread list with many threads | Test manually | M3 |

### Acceptance Gate

- All moderation actions (pin, lock, delete) work correctly
- Cascade deletes remove all child records
- Anonymous identity rules enforced correctly per role
- Locked threads block new replies but allow voting
- Non-enrolled users see an access denied state
- Notifications appear in the notification bell for thread authors
- Pages load with appropriate loading skeletons
- Forum pages are visually consistent with existing LMS design

---

## Dependency Analysis

```
Milestone 1 (Schema)
    |
    v
Milestone 2 (Server Actions)
    |
    v
Milestone 3 (UI Components)
    |
    v
Milestone 4 (Polish & Integration)
```

All milestones are sequential. Each depends on the previous milestone's completion.

### External Dependencies

| Dependency | Status | Impact |
|-----------|--------|--------|
| SPEC-LMS-001 (Course, Enrollment models) | Complete | Required for forum access checks and course relation |
| Clerk auth (`auth()`, `publicMetadata.role`) | Available | Required for all authorization checks |
| NotificationType enum | Exists | Must extend with `FORUM_REPLY` value |
| `createNotification()` function | Exists | Reused for reply notifications |
| `ITEM_PER_PAGE` from settings.ts | Exists | Used for forum pagination |
| `routeAccessMap` in settings.ts | Exists | Must add forum routes |

---

## Risk Assessment

### Risk 1: Schema Migration on Existing Data (Low)

**Description**: Adding new models and enum values to an existing production schema.
**Mitigation**: The 3 new models are purely additive (no existing table modifications). The `FORUM_REPLY` enum addition is non-destructive. The only existing model change is adding a relation field to `Course`, which requires no data migration.

### Risk 2: Authorization Complexity (Medium)

**Description**: Forum access requires checking enrollment status, course ownership, and admin override across 10 Server Actions.
**Mitigation**: Centralize authorization in the `checkForumAccess()` helper function. All actions use this single function, reducing duplication and inconsistency risk.

### Risk 3: Cascade Delete Data Loss (Low)

**Description**: Deleting a thread removes all replies and votes. Accidental deletion could lose valuable discussion content.
**Mitigation**: Delete actions require teacher/admin role. The UI includes a confirmation dialog before delete. Future phase could add soft-delete or archiving.

### Risk 4: N+1 Query on Author Name Resolution (Medium)

**Description**: Resolving author display names from Clerk user IDs requires looking up Student/Teacher/Admin models by `clerkId`. In a thread with many replies, this could cause N+1 queries.
**Mitigation**: Batch author resolution by collecting unique `authorId` values from all replies and executing a single query per role table. Implement this in the `ForumReplyList` Server Component before passing data to `ForumReplyItem`.

### Risk 5: Concurrent Vote Toggle Race Condition (Low)

**Description**: Two rapid clicks on the upvote button could create a race condition between the existence check and the create/delete operation.
**Mitigation**: The `@@unique([replyId, userId])` constraint prevents duplicate creation at the database level. The `toggleVote` action uses `useOptimistic` on the client to prevent double-click. A database-level constraint violation is caught and returned gracefully.

---

## Architecture Design Direction

### New Files

| File | Type | Purpose |
|------|------|---------|
| `src/lib/forumActions.ts` | Server Actions | All 10 forum-related Server Actions |
| `src/lib/forumValidationSchemas.ts` | Validation | Zod schemas for forum forms |
| `src/app/(dashboard)/list/courses/[id]/forum/page.tsx` | Page | Forum thread list |
| `src/app/(dashboard)/list/courses/[id]/forum/[threadId]/page.tsx` | Page | Thread detail with replies |
| `src/app/(dashboard)/list/courses/[id]/forum/loading.tsx` | Loading | Forum loading skeleton |
| `src/components/ForumThreadList.tsx` | Component | Paginated thread list |
| `src/components/ForumThreadCard.tsx` | Component | Thread summary card |
| `src/components/ForumReplyList.tsx` | Component | Reply list with nesting |
| `src/components/ForumReplyItem.tsx` | Component | Interactive reply item |
| `src/components/forms/ThreadForm.tsx` | Component | Thread create/edit form |
| `src/components/ForumReplyForm.tsx` | Component | Reply creation form |
| `src/components/ForumModeration.tsx` | Component | Moderation controls |
| `src/components/UpvoteButton.tsx` | Component | Vote toggle button |

### Modified Files

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add 3 models, 1 relation, 1 enum value |
| `src/lib/settings.ts` | Add forum routes to `routeAccessMap` |
| `src/app/(dashboard)/list/courses/[id]/page.tsx` | Add "Forum" navigation link |

### Patterns to Follow

- **Server Action return type**: `{ success: boolean; error: boolean; message?: string }` (existing pattern)
- **Page structure**: Async Server Component with search params for pagination (existing pattern)
- **Form pattern**: React Hook Form + Zod + `useActionState` (existing pattern)
- **Container/Client split**: Server Components fetch data, Client Components handle interactions
- **Notification reuse**: Use existing `createNotification()` from `src/lib/notificationActions.ts`
