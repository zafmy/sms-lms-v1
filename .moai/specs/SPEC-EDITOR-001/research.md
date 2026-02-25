# SPEC-EDITOR-001 Research: Rich Text Editor with Lexical

## Research Summary

Deep codebase analysis of all content surfaces where Lexical rich text editor will be integrated.

---

## Content Surface Analysis

### 1. LMS Lesson Content

| Aspect | Detail |
|--------|--------|
| **Model** | `LmsLesson.content` (prisma/schema.prisma:303) |
| **Type** | String, unbounded |
| **Form** | `LmsLessonForm.tsx:159-170` - textarea, 6 rows |
| **Validation** | min 1 char, no max (formValidationSchemas.ts:234) |
| **Display** | `whitespace-pre-wrap` plain text (lesson/[lessonId]/page.tsx:188-190) |
| **Action** | `createLmsLesson` (actions.ts:1834) |
| **Storage** | Direct plain text, no transformation |
| **Related** | ContentType enum (TEXT/VIDEO/LINK/MIXED) categorizes content approach |

### 2. Forum Threads

| Aspect | Detail |
|--------|--------|
| **Model** | `ForumThread.content` (prisma/schema.prisma:563) |
| **Type** | String, unbounded |
| **Form** | `ThreadForm.tsx:78-87` - textarea, 5 rows |
| **Validation** | min 1, max 10,000 chars (forumValidationSchemas.ts:8-11) |
| **Display** | `whitespace-pre-wrap` plain text (forum/[threadId]/page.tsx:222-224) |
| **Action** | `createThread` (forumActions.ts:80-118) |
| **Metadata** | title, isPinned, isLocked, isAnonymous, authorRole |

### 3. Forum Replies

| Aspect | Detail |
|--------|--------|
| **Model** | `ForumReply.content` (prisma/schema.prisma:584) |
| **Type** | String, unbounded |
| **Form** | `ForumReplyForm.tsx` - responsive textarea |
| **Validation** | min 1, max 5,000 chars (forumValidationSchemas.ts:29-32) |
| **Display** | `whitespace-pre-wrap` plain text (ForumReplyItem.tsx:149-151) |
| **Action** | `createReply` (forumActions.ts:311-377) |
| **Threading** | parentId for nested reply chains (self-relation) |

### 4. Announcements

| Aspect | Detail |
|--------|--------|
| **Model** | `Announcement.description` (prisma/schema.prisma:189) |
| **Type** | String, unbounded |
| **Form** | `AnnouncementForm.tsx:80-86` - **SINGLE LINE InputField** |
| **Validation** | min 1, no max (formValidationSchemas.ts:112) |
| **Display** | Plain text (Announcements.tsx:46, 57, 68) |
| **Action** | `createAnnouncement` (actions.ts:833) |
| **Limitation** | Currently limited to single-line input - must convert to rich text |

### 5. Assignment Descriptions (MISSING)

| Aspect | Detail |
|--------|--------|
| **Model** | Assignment model has NO description field |
| **Form** | `AssignmentForm.tsx` - no description input |
| **Required** | Schema migration + form update needed |
| **Prerequisite** | Must add `description` field before Lexical integration |

---

## Cross-Cutting Patterns

### Current Data Flow (All Surfaces)
```
Form (textarea/input) -> Zod Validation -> Server Action ->
Prisma create/update -> Plain text storage -> Display with whitespace-pre-wrap
```

### Content Validation Limits
- LMS Lesson: No max limit
- Forum Thread: 10,000 characters
- Forum Reply: 5,000 characters
- Announcement: No max limit
- Note: Rich text JSON will be larger than equivalent plain text

### Display Rendering
- All surfaces use `whitespace-pre-wrap` CSS
- Zero instances of `dangerouslySetInnerHTML`
- No sanitization libraries present
- No HTML rendering anywhere
- i18n applied to labels only, NOT to content fields

### Server Actions Location
- LMS & Announcements: `src/lib/actions.ts`
- Forum: `src/lib/forumActions.ts`
- All follow: validate -> store plain text -> revalidatePath

### Database Field Types
- All content fields are unbounded String
- `GuideTranslation` model uses `@db.Text` annotation (potential pattern for rich text)

---

## Implementation Readiness

### Ready (No Prerequisite Work)
- LMS Lesson content
- Forum Thread content
- Forum Reply content

### Needs Prerequisite Work
- **Announcement**: Convert single-line InputField to rich text area
- **Assignment**: Add `description` field to Prisma schema + migration + form update

---

## File Reference Map

| Surface | Form | Validation | Action | Display |
|---------|------|-----------|--------|---------|
| LMS Lesson | LmsLessonForm.tsx:159 | formValidationSchemas.ts:234 | actions.ts:1834 | lesson/[lessonId]/page.tsx:188 |
| Forum Thread | ThreadForm.tsx:78 | forumValidationSchemas.ts:3 | forumActions.ts:80 | forum/[threadId]/page.tsx:222 |
| Forum Reply | ForumReplyForm.tsx | forumValidationSchemas.ts:28 | forumActions.ts:311 | ForumReplyItem.tsx:149 |
| Announcement | AnnouncementForm.tsx:80 | formValidationSchemas.ts:112 | actions.ts:833 | Announcements.tsx:46 |

---

## Risks Identified

1. **Content migration**: Existing plain text content must remain readable when rendered through Lexical
2. **Validation limits**: Lexical JSON state is larger than equivalent plain text; forum limits may need adjustment
3. **Bundle size**: Lexical + plugins must be lazy-loaded to avoid impacting page load
4. **XSS surface**: Moving from plain text to rendered HTML introduces sanitization requirements
5. **No existing HTML infrastructure**: Zero prior art for rich text rendering in the codebase

## Recommendations

1. Store Lexical editor state as JSON string (not HTML) for full round-trip fidelity
2. Render to HTML only for display using Lexical's headless renderer
3. Use `@db.Text` annotation on content fields for PostgreSQL TEXT type
4. Implement DOMPurify or similar for output sanitization
5. Lazy-load the Lexical editor bundle via Next.js dynamic imports
6. Create a shared `RichTextEditor` component used across all surfaces
7. Create a shared `RichTextRenderer` component for displaying content
8. Handle backward compatibility: detect plain text vs JSON and render accordingly
