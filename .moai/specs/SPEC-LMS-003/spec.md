# SPEC-LMS-003: Course Discussion Forums with Threaded Replies and Teacher Moderation

| Field    | Value                                                                  |
| -------- | ---------------------------------------------------------------------- |
| id       | SPEC-LMS-003                                                           |
| version  | 1.0.0                                                                  |
| status   | draft                                                                  |
| created  | 2026-02-21                                                             |
| author   | MoAI                                                                   |
| priority | Medium                                                                 |
| parent   | LMS Feature Suite                                                      |
| depends  | SPEC-LMS-001 (Course, Enrollment, Notification models)                 |
| tags     | forum, discussion, threads, replies, moderation, LMS, course, upvoting |

---

## History

| Version | Date       | Author | Change Description             |
| ------- | ---------- | ------ | ------------------------------ |
| 1.0.0   | 2026-02-21 | MoAI   | Initial SPEC creation (draft). |

---

## Problem Statement

Hua Readwise is a bi-weekly school (Saturday and Sunday sessions only), creating a 12-day gap between consecutive school days. Students lose academic momentum and have no structured channel to continue subject discussions, ask questions about course material, or collaborate with peers during this gap.

The existing LMS (SPEC-LMS-001) provides courses, modules, lesson content, and quizzes for asynchronous learning. However, it lacks any mechanism for dialogue between students and teachers outside the classroom. Without discussion forums, students who encounter questions while studying during the 12-day gap have no way to seek help until the next Saturday session, compounding the retention problem.

Course Discussion Forums solve this by providing a threaded, moderated discussion space attached to each course. Students can post questions, share insights, and receive teacher guidance asynchronously. Teacher moderation (pinning, locking, deleting) ensures discussions remain productive and on-topic. Upvoting surfaces the most helpful replies, and anonymous posting lowers the barrier for students who might hesitate to ask questions publicly.

---

## Environment

- **Framework**: Next.js 16 with App Router, React 19 Server Components
- **Language**: TypeScript 5 (strict mode)
- **Database**: PostgreSQL 14+ via Prisma 5 ORM (singleton pattern at `src/lib/prisma.ts`)
- **Authentication**: Clerk v6 with 4 roles (admin, teacher, student, parent) via `publicMetadata.role`
- **Styling**: Tailwind CSS v4 (CSS-first configuration)
- **Forms**: React Hook Form v7 + Zod v3.23 + `useActionState`
- **Notifications**: Existing `NotificationType` enum with `createNotification()` in `src/lib/notificationActions.ts`
- **Existing LMS models**: Course, Module, LmsLesson, LessonProgress, Enrollment (24 models total, 8 enums)
- **Routing**: `(dashboard)/list/courses/[id]/` already exists as course detail page
- **Pagination**: `ITEM_PER_PAGE` constant from `src/lib/settings.ts`
- **Server Actions pattern**: Return `{ success: boolean; error: boolean; message?: string }`

---

## Assumptions

1. **Course-level forums only**: Each course implicitly has a forum. There is no separate `Forum` model; `ForumThread` records link directly to `Course` via `courseId`. A course's forum exists as soon as its first thread is created.

2. **Enrollment-gated access**: Only users who are enrolled in a course (active enrollment), the course teacher, or an admin can view, create, or interact with forum content for that course. The enrollment check uses the existing `Enrollment` model from SPEC-LMS-001.

3. **One-level nesting for replies**: Replies support an optional `parentId` for reply-to-reply, but nesting is limited to one level deep. A reply to a reply references the parent reply, but the UI renders them as a flat list grouped under the parent rather than deeply nested trees.

4. **Clerk user IDs as author identifiers**: `ForumThread.authorId` and `ForumReply.authorId` store Clerk user IDs (strings). The author's display name is resolved at render time by querying the appropriate Prisma model (Student, Teacher, or Admin) using the `clerkId` field, consistent with the existing pattern.

5. **Plain text content initially**: Thread and reply content is stored as plain text strings. Markdown rendering may be added in a future phase but is not part of this SPEC.

6. **Notification for thread author on new reply**: When a reply is posted to a thread, a notification is created for the thread author (unless the replier is the author). The existing `createNotification()` function is reused with a new `FORUM_REPLY` value added to the `NotificationType` enum.

7. **No real-time updates**: Forum pages use standard Server Component rendering with `revalidatePath` for cache invalidation after mutations. WebSocket/real-time push is out of scope.

8. **Admin has full moderation access**: Admins can perform all moderation actions (pin, lock, delete) on any thread in any course, regardless of enrollment status.

---

## Requirements

### REQ-LMS-029: Thread Creation (Event-Driven)

**When** an enrolled student or the course teacher creates a new thread in a course forum, **then** the system **shall** create a `ForumThread` record with the provided title, content, `courseId`, `authorId`, `authorRole`, and `isAnonymous` flag, set `lastActivityAt` to the current timestamp, and display the new thread in the forum thread list sorted by most recent activity. Pinned threads **shall** always appear before unpinned threads regardless of activity date.

### REQ-LMS-030: Reply to Thread (Event-Driven)

**When** a user submits a reply to a thread, **then** the system **shall**:
1. Create a `ForumReply` record with the provided content, `threadId`, optional `parentId`, `authorId`, `authorRole`, and `isAnonymous` flag.
2. Update the parent `ForumThread.lastActivityAt` to the current timestamp.
3. Send a notification of type `FORUM_REPLY` to the thread author, **unless** the replier is the thread author.

### REQ-LMS-031: Teacher Moderation Actions (Event-Driven)

**When** a teacher (who owns the course) or an admin performs a moderation action:
- **Pin thread**: The system **shall** set `ForumThread.isPinned = true`. Unpinning **shall** set it to `false`.
- **Lock thread**: The system **shall** set `ForumThread.isLocked = true`. Unlocking **shall** set it to `false`.
- **Delete thread**: The system **shall** delete the `ForumThread` record. All associated `ForumReply` and `ForumVote` records **shall** be cascade-deleted via the database foreign key constraint.
- **Delete reply**: The system **shall** delete a specific `ForumReply` record. All associated `ForumVote` records and child replies **shall** be cascade-deleted.

### REQ-LMS-032: Reply Upvoting (Event-Driven)

**When** an enrolled user upvotes a reply, **then** the system **shall** create a `ForumVote` record linking the `replyId` and `userId`. **If** the user has already voted on that reply, clicking the upvote again **shall** remove the existing `ForumVote` record (toggle behavior). The database **shall** enforce a unique constraint on `[replyId, userId]` to prevent duplicate votes.

### REQ-LMS-033: Mark Reply as Accepted (Event-Driven)

**When** the thread author or a teacher marks a reply as accepted, **then** the system **shall**:
1. Set `ForumReply.isAccepted = true` on the target reply.
2. If another reply in the same thread was previously accepted, set its `isAccepted = false` (only one accepted reply per thread at a time).
3. Display a visual indicator (e.g., checkmark badge) on the accepted reply.

### REQ-LMS-034: Locked Thread Behavior (State-Driven)

**While** a `ForumThread` has `isLocked = true`, the system **shall** prevent new replies from being created for that thread. The `createReply` Server Action **shall** return an error if the target thread is locked. The thread and all existing replies **shall** remain visible and readable. Voting on existing replies in a locked thread **shall** still be permitted.

### REQ-LMS-035: Anonymous Posting (State-Driven)

**While** a `ForumThread` or `ForumReply` has `isAnonymous = true`:
- The system **shall** display "Anonymous" as the author name to students.
- The actual author identity **shall** be visible only to users with the `teacher` or `admin` role.
- The anonymous flag is set at creation time and cannot be changed after submission.

### REQ-LMS-036: Forum Access Guards (Unwanted Behavior)

- The system **shall not** allow non-enrolled users (except admin) to view forum threads, create threads, or create replies in a course forum.
- The system **shall not** allow students to pin, lock, or delete threads authored by other users.
- The system **shall not** allow students to delete replies authored by other users.
- The system **shall not** allow duplicate votes on the same reply by the same user (enforced by `@@unique([replyId, userId])`).
- The system **shall not** allow replies to be created on locked threads.

---

## Specifications

### S1: Database Schema (3 New Models, 1 Enum Addition)

#### S1.1: ForumThread Model

```prisma
model ForumThread {
  id             Int          @id @default(autoincrement())
  title          String
  content        String
  isPinned       Boolean      @default(false)
  isLocked       Boolean      @default(false)
  isAnonymous    Boolean      @default(false)
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  lastActivityAt DateTime     @default(now())

  courseId   Int
  course     Course       @relation(fields: [courseId], references: [id], onDelete: Cascade)
  authorId   String       // Clerk user ID
  authorRole String       // "teacher", "student", "admin"

  replies ForumReply[]

  @@index([courseId, lastActivityAt])
  @@index([courseId, isPinned])
}
```

#### S1.2: ForumReply Model

```prisma
model ForumReply {
  id          Int          @id @default(autoincrement())
  content     String
  isAccepted  Boolean      @default(false)
  isAnonymous Boolean      @default(false)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  threadId Int
  thread   ForumThread @relation(fields: [threadId], references: [id], onDelete: Cascade)
  parentId Int?
  parent   ForumReply? @relation("ReplyToReply", fields: [parentId], references: [id])
  children ForumReply[] @relation("ReplyToReply")
  authorId   String       // Clerk user ID
  authorRole String       // "teacher", "student", "admin"

  votes ForumVote[]

  @@index([threadId, createdAt])
}
```

#### S1.3: ForumVote Model

```prisma
model ForumVote {
  id        Int      @id @default(autoincrement())
  createdAt DateTime @default(now())

  replyId Int
  reply   ForumReply @relation(fields: [replyId], references: [id], onDelete: Cascade)
  userId  String     // Clerk user ID

  @@unique([replyId, userId])
  @@index([replyId])
}
```

#### S1.4: Course Model Addition

Add to the existing `Course` model in `prisma/schema.prisma`:

```prisma
forumThreads ForumThread[]
```

#### S1.5: NotificationType Enum Addition

Add to the existing `NotificationType` enum:

```prisma
enum NotificationType {
  GRADE
  ATTENDANCE
  ANNOUNCEMENT
  ASSIGNMENT
  GENERAL
  ENROLLMENT
  FORUM_REPLY    // NEW
}
```

### S2: Routes

| Route                                          | Type           | Access                                         | Purpose                                         |
| ---------------------------------------------- | -------------- | ---------------------------------------------- | ----------------------------------------------- |
| `/list/courses/[id]/forum`                     | Server Page    | admin, teacher (own course), student (enrolled) | Forum thread list with pagination and search     |
| `/list/courses/[id]/forum/[threadId]`          | Server Page    | admin, teacher (own course), student (enrolled) | Thread detail page with replies and interactions |

Both routes are nested under the existing `(dashboard)/list/courses/[id]/` route structure.

### S3: Server Actions (10 Total)

All actions are defined in a new file: `src/lib/forumActions.ts`

All actions follow the established pattern:
- Import `auth()` from `@clerk/nextjs/server`
- Validate input with Zod `.safeParse()`
- Check authorization (role + enrollment)
- Perform Prisma operation
- Call `revalidatePath` on success
- Return `{ success: boolean; error: boolean; message?: string }`

#### S3.1: createThread

- **Input**: `{ title: string, content: string, courseId: number, isAnonymous: boolean }`
- **Auth**: Must be enrolled student OR course teacher OR admin
- **Logic**: Create `ForumThread` record. Set `authorId` from `auth().userId`, `authorRole` from `publicMetadata.role`, `lastActivityAt` to `new Date()`.
- **Revalidate**: `/list/courses/${courseId}/forum`

#### S3.2: updateThread

- **Input**: `{ id: number, title: string, content: string }`
- **Auth**: Must be the thread author OR admin
- **Logic**: Update title and content. Only the author can edit their own thread. Admins can edit any thread.
- **Revalidate**: `/list/courses/${courseId}/forum`, `/list/courses/${courseId}/forum/${threadId}`

#### S3.3: deleteThread

- **Input**: `{ id: number }`
- **Auth**: Must be thread author, course teacher, or admin
- **Logic**: Delete thread. Replies and votes cascade-delete via Prisma `onDelete: Cascade`.
- **Revalidate**: `/list/courses/${courseId}/forum`

#### S3.4: lockThread

- **Input**: `{ id: number, isLocked: boolean }`
- **Auth**: Must be course teacher or admin
- **Logic**: Toggle `isLocked` field on the thread.
- **Revalidate**: `/list/courses/${courseId}/forum`, `/list/courses/${courseId}/forum/${threadId}`

#### S3.5: pinThread

- **Input**: `{ id: number, isPinned: boolean }`
- **Auth**: Must be course teacher or admin
- **Logic**: Toggle `isPinned` field on the thread.
- **Revalidate**: `/list/courses/${courseId}/forum`, `/list/courses/${courseId}/forum/${threadId}`

#### S3.6: createReply

- **Input**: `{ content: string, threadId: number, parentId?: number, isAnonymous: boolean }`
- **Auth**: Must be enrolled student, course teacher, or admin. Thread must not be locked.
- **Logic**: Create `ForumReply`. Update `ForumThread.lastActivityAt`. If replier is not thread author, call `createNotification(thread.authorId, "FORUM_REPLY", message)`.
- **Revalidate**: `/list/courses/${courseId}/forum/${threadId}`

#### S3.7: updateReply

- **Input**: `{ id: number, content: string }`
- **Auth**: Must be the reply author OR admin
- **Logic**: Update reply content. Only the author can edit their own reply. Admins can edit any reply.
- **Revalidate**: `/list/courses/${courseId}/forum/${threadId}`

#### S3.8: deleteReply

- **Input**: `{ id: number }`
- **Auth**: Must be reply author, course teacher, or admin
- **Logic**: Delete reply. Child replies and votes cascade-delete.
- **Revalidate**: `/list/courses/${courseId}/forum/${threadId}`

#### S3.9: markReplyAccepted

- **Input**: `{ replyId: number, threadId: number }`
- **Auth**: Must be thread author or course teacher or admin
- **Logic**: In a Prisma `$transaction`: (1) set `isAccepted = false` on all replies in the thread, (2) set `isAccepted = true` on the target reply.
- **Revalidate**: `/list/courses/${courseId}/forum/${threadId}`

#### S3.10: toggleVote

- **Input**: `{ replyId: number }`
- **Auth**: Must be enrolled student, course teacher, or admin. Thread must not be locked (votes are still allowed on locked threads, see REQ-LMS-034; remove this restriction).
- **Auth (revised)**: Must be enrolled student, course teacher, or admin.
- **Logic**: Check if `ForumVote` exists for `(replyId, userId)`. If exists, delete it (unvote). If not, create it (upvote).
- **Revalidate**: `/list/courses/${courseId}/forum/${threadId}`

### S4: Zod Validation Schemas

Add to a new file `src/lib/forumValidationSchemas.ts`:

```typescript
import { z } from "zod";

export const threadSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be under 200 characters"),
  content: z.string().min(1, "Content is required").max(10000, "Content must be under 10,000 characters"),
  courseId: z.coerce.number().int().positive(),
  isAnonymous: z.boolean().default(false),
});

export const threadUpdateSchema = z.object({
  id: z.coerce.number().int().positive(),
  title: z.string().min(1, "Title is required").max(200, "Title must be under 200 characters"),
  content: z.string().min(1, "Content is required").max(10000, "Content must be under 10,000 characters"),
});

export const replySchema = z.object({
  content: z.string().min(1, "Reply cannot be empty").max(5000, "Reply must be under 5,000 characters"),
  threadId: z.coerce.number().int().positive(),
  parentId: z.coerce.number().int().positive().optional(),
  isAnonymous: z.boolean().default(false),
});

export const replyUpdateSchema = z.object({
  id: z.coerce.number().int().positive(),
  content: z.string().min(1, "Reply cannot be empty").max(5000, "Reply must be under 5,000 characters"),
});

export const moderationSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const pinSchema = z.object({
  id: z.coerce.number().int().positive(),
  isPinned: z.boolean(),
});

export const lockSchema = z.object({
  id: z.coerce.number().int().positive(),
  isLocked: z.boolean(),
});

export const acceptReplySchema = z.object({
  replyId: z.coerce.number().int().positive(),
  threadId: z.coerce.number().int().positive(),
});

export const voteSchema = z.object({
  replyId: z.coerce.number().int().positive(),
});

// Inferred types
export type ThreadFormData = z.infer<typeof threadSchema>;
export type ThreadUpdateFormData = z.infer<typeof threadUpdateSchema>;
export type ReplyFormData = z.infer<typeof replySchema>;
export type ReplyUpdateFormData = z.infer<typeof replyUpdateSchema>;
```

### S5: Components (8 New Components)

#### S5.1: ForumThreadList.tsx (Server Component)

- **Location**: `src/components/ForumThreadList.tsx`
- **Purpose**: Paginated list of forum threads for a course.
- **Data**: Fetches `ForumThread` records where `courseId` matches, ordered by `isPinned DESC, lastActivityAt DESC`. Includes reply count via `_count.replies`.
- **Props**: `courseId: number`, `searchParams: { page?: string, search?: string }`
- **Renders**: List of `ForumThreadCard` components, `Pagination` component, search input.
- **Auth check**: Verify user is enrolled, course teacher, or admin before rendering.

#### S5.2: ForumThreadCard.tsx (Server Component)

- **Location**: `src/components/ForumThreadCard.tsx`
- **Purpose**: Summary card for a single thread in the list.
- **Displays**: Title, author name (or "Anonymous"), reply count, last activity time, pinned badge, locked badge, accepted reply indicator.
- **Links to**: `/list/courses/[id]/forum/[threadId]`

#### S5.3: ForumReplyList.tsx (Server Component)

- **Location**: `src/components/ForumReplyList.tsx`
- **Purpose**: Renders all replies within a thread, grouped by parent (top-level replies first, then nested children).
- **Data**: Fetches `ForumReply` records where `threadId` matches, ordered by `createdAt ASC`. Includes vote count via `_count.votes` and current user vote status.
- **Renders**: List of `ForumReplyItem` components.

#### S5.4: ForumReplyItem.tsx (Client Component)

- **Location**: `src/components/ForumReplyItem.tsx`
- **Purpose**: Single reply with interactive controls.
- **Displays**: Content, author name (or "Anonymous" for students), created date, vote count, accepted badge.
- **Controls**: `UpvoteButton`, accept button (visible to thread author and teachers), edit/delete buttons (visible to reply author, teachers, admins).
- **Client**: Required for `useActionState` on vote toggle and moderation actions.

#### S5.5: ThreadForm.tsx (Client Component)

- **Location**: `src/components/forms/ThreadForm.tsx`
- **Purpose**: Create or edit a forum thread.
- **Pattern**: React Hook Form + Zod resolver using `threadSchema` or `threadUpdateSchema`.
- **Fields**: Title (text input), Content (textarea), Anonymous toggle (checkbox, visible to students only).
- **Submit**: Calls `createThread` or `updateThread` Server Action via `useActionState`.

#### S5.6: ForumReplyForm.tsx (Client Component)

- **Location**: `src/components/ForumReplyForm.tsx`
- **Purpose**: Reply to a thread or reply to a reply.
- **Pattern**: React Hook Form + Zod resolver using `replySchema`.
- **Fields**: Content (textarea), Anonymous toggle (checkbox, visible to students only).
- **Props**: `threadId: number`, `parentId?: number`, `isLocked: boolean` (disables form when locked).

#### S5.7: ForumModeration.tsx (Client Component)

- **Location**: `src/components/ForumModeration.tsx`
- **Purpose**: Moderation control panel for teachers and admins.
- **Controls**: Pin/Unpin toggle button, Lock/Unlock toggle button, Delete thread button (with confirmation).
- **Visibility**: Only rendered when `currentUser.role` is `teacher` (and owns course) or `admin`.

#### S5.8: UpvoteButton.tsx (Client Component)

- **Location**: `src/components/UpvoteButton.tsx`
- **Purpose**: Toggle upvote on a reply.
- **Props**: `replyId: number`, `voteCount: number`, `hasVoted: boolean`.
- **Behavior**: Calls `toggleVote` Server Action. Uses `useOptimistic` for instant UI feedback.

### S6: Authorization Helper

Create a reusable enrollment check function in `src/lib/forumActions.ts`:

```typescript
async function checkForumAccess(courseId: number, userId: string, role: string): Promise<boolean> {
  if (role === "admin") return true;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { teacherId: true },
  });

  if (!course) return false;
  if (role === "teacher" && course.teacherId === userId) return true;

  if (role === "student") {
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        courseId,
        student: { clerkId: userId },
        status: "ACTIVE",
      },
    });
    return !!enrollment;
  }

  return false;
}
```

---

## Constraints

1. **No file attachments**: Thread and reply content is text-only. File upload support is deferred to a future SPEC.
2. **No @mentions**: User tagging with notifications is deferred.
3. **No real-time updates**: Forum pages rely on standard page navigation and `revalidatePath`.
4. **No cross-course search**: Forum search is scoped to a single course at a time.
5. **No moderation audit log**: Moderation actions (pin, lock, delete) are not logged for audit purposes in this phase.
6. **No parent role access**: Parents cannot access course forums. Forum access for parents depends on a future SPEC (SPEC-LMS-004).
7. **Reply nesting depth**: Maximum one level of nesting (reply-to-reply). Deeper nesting is not supported.
8. **Anonymous identity immutability**: Once a thread or reply is created with `isAnonymous = true`, the flag cannot be changed.

---

## Traceability Matrix

| Requirement  | Schema       | Server Action(s)                     | Component(s)                               | Route(s)                                             |
| ------------ | ------------ | ------------------------------------ | ------------------------------------------ | ---------------------------------------------------- |
| REQ-LMS-029  | ForumThread  | createThread                         | ThreadForm, ForumThreadList                | `/list/courses/[id]/forum`                           |
| REQ-LMS-030  | ForumReply   | createReply                          | ForumReplyForm, ForumReplyList             | `/list/courses/[id]/forum/[threadId]`                |
| REQ-LMS-031  | ForumThread  | pinThread, lockThread, deleteThread  | ForumModeration                            | `/list/courses/[id]/forum/[threadId]`                |
| REQ-LMS-032  | ForumVote    | toggleVote                           | UpvoteButton                               | `/list/courses/[id]/forum/[threadId]`                |
| REQ-LMS-033  | ForumReply   | markReplyAccepted                    | ForumReplyItem                             | `/list/courses/[id]/forum/[threadId]`                |
| REQ-LMS-034  | ForumThread  | createReply (blocked)                | ForumReplyForm (disabled), ForumModeration | `/list/courses/[id]/forum/[threadId]`                |
| REQ-LMS-035  | ForumThread, ForumReply | createThread, createReply | ForumThreadCard, ForumReplyItem            | Both routes                                          |
| REQ-LMS-036  | All models   | All actions (auth checks)            | All components (conditional rendering)     | Both routes (middleware + action-level)               |

---

## Out of Scope

- Forum categories or tags beyond course-level organization
- File attachments in forum posts
- @mention system with user tagging
- Real-time updates / WebSocket live feed
- Cross-course forum search
- Forum moderation audit log
- Parent forum access (deferred to SPEC-LMS-004)
- Rich text editor or markdown rendering
- Email notifications for forum activity
- Forum analytics or engagement metrics dashboard
- Thread bookmarking or favorites
- Forum post edit history
