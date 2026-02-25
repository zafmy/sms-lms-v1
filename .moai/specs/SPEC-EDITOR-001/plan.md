# SPEC-EDITOR-001: Implementation Plan

## Rich Text Editor with Lexical Across All Content Surfaces

**SPEC ID:** SPEC-EDITOR-001
**Status:** Planned
**Priority:** High (Phase 1 of v2 roadmap)
**Development Mode:** DDD (ANALYZE-PRESERVE-IMPROVE)

---

## 1. Technology Decisions

### Core Packages

| Package | Version | Purpose |
|---------|---------|---------|
| `lexical` | `^0.40.0` | Core editor engine |
| `@lexical/react` | `^0.40.0` | React bindings (LexicalComposer, plugins) |
| `@lexical/headless` | `^0.40.0` | Server-side rendering of editor state to HTML |
| `@lexical/rich-text` | `^0.40.0` | Rich text node types and plugin |
| `@lexical/list` | `^0.40.0` | Ordered/unordered list support |
| `@lexical/link` | `^0.40.0` | Link node and auto-link plugin |
| `@lexical/code` | `^0.40.0` | Code block highlighting |
| `@lexical/table` | `^0.40.0` | Table node and editing support |
| `@lexical/html` | `^0.40.0` | HTML import/export utilities |
| `@lexical/selection` | `^0.40.0` | Selection utilities for toolbar |
| `@lexical/utils` | `^0.40.0` | General utilities |
| `dompurify` | `^3.3.1` | HTML output sanitization (XSS prevention) |
| `@types/dompurify` | `^3.2.0` | TypeScript definitions for DOMPurify |

### Version Pinning Strategy

All `@lexical/*` packages MUST use the same version to avoid internal compatibility issues. Use a caret range (`^0.40.0`) pinned to the same minor version across all Lexical packages.

### Architectural Decisions

1. **Storage format:** Lexical JSON state string (not HTML). Enables full round-trip fidelity without lossy HTML conversion.
2. **Rendering strategy:** Convert JSON state to sanitized HTML at display time using `@lexical/headless` on the server side.
3. **Backward compatibility:** Detect whether stored content is Lexical JSON (starts with `{`) or plain text. Render plain text with `whitespace-pre-wrap` as before.
4. **Lazy loading:** Use Next.js `dynamic()` with `ssr: false` for the editor component. Lexical requires DOM APIs and must only run on the client.
5. **Component architecture:** One shared `RichTextEditor` component and one shared `RichTextRenderer` component used across all surfaces.
6. **Form integration:** The editor exposes its JSON state via an `onChange` callback. The parent form stores this in a hidden field or controlled state managed by React Hook Form.

---

## 2. Implementation Phases

### Phase 1: Foundation (Core Components + Database Prep)

**Goal:** Create the shared editor and renderer components, update database schema.

**Priority:** Primary Goal

#### Task 1.1: Install Dependencies

**Files modified:**
- `package.json`

**Actions:**
```
npm install lexical @lexical/react @lexical/headless @lexical/rich-text @lexical/list @lexical/link @lexical/code @lexical/table @lexical/html @lexical/selection @lexical/utils dompurify
npm install -D @types/dompurify
```

**Complexity:** Low

---

#### Task 1.2: Database Schema Changes

**Files modified:**
- `prisma/schema.prisma`

**Changes:**

1. Add `@db.Text` annotation to all content fields to ensure PostgreSQL `TEXT` type (unbounded) rather than `VARCHAR(191)`:
   - `LmsLesson.content` -- add `@db.Text`
   - `ForumThread.content` -- add `@db.Text`
   - `ForumReply.content` -- add `@db.Text`
   - `Announcement.description` -- add `@db.Text`

2. Add `description` field to `Assignment` model:
   ```prisma
   model Assignment {
     id          Int      @id @default(autoincrement())
     title       String
     description String?  @db.Text
     startDate   DateTime
     dueDate     DateTime
     lessonId    Int
     lesson      Lesson   @relation(fields: [lessonId], references: [id])
     results     Result[]
   }
   ```

**Migration command:** `npx prisma migrate dev --name add-rich-text-support`

**Complexity:** Low

**Risk:** Migration on production database requires backup first. The `@db.Text` annotation change on existing fields is a no-op for PostgreSQL (already unbounded `text` type), but Prisma may generate an `ALTER COLUMN` statement. Verify migration SQL before applying to production.

---

#### Task 1.3: Create RichTextEditor Component

**Files created:**
- `src/components/editor/RichTextEditor.tsx` (Client Component)
- `src/components/editor/EditorToolbar.tsx` (Client Component)
- `src/components/editor/plugins/ToolbarPlugin.tsx`
- `src/components/editor/plugins/ImagePlugin.tsx`
- `src/components/editor/plugins/YouTubePlugin.tsx`
- `src/components/editor/plugins/CodeHighlightPlugin.tsx`
- `src/components/editor/theme.ts` (Lexical theme configuration)
- `src/components/editor/nodes.ts` (Custom node registrations)
- `src/components/editor/index.ts` (Barrel export)

**Component API:**

```typescript
interface RichTextEditorProps {
  /** Initial content as Lexical JSON string or plain text */
  initialContent?: string;
  /** Callback fired on every content change with Lexical JSON string */
  onChange: (jsonString: string) => void;
  /** Placeholder text when editor is empty */
  placeholder?: string;
  /** Disable editing (read-only mode) */
  disabled?: boolean;
  /** Error message to display below editor */
  error?: string;
  /** Label text above editor */
  label?: string;
  /** Variant controlling available toolbar features */
  variant?: "full" | "compact";
}
```

**Variant behavior:**
- `full`: All features (headings, images, tables, code blocks, video embeds, lists, links). Used for LMS Lessons and Announcements.
- `compact`: Subset (bold, italic, underline, strikethrough, lists, links, code inline). Used for Forum Threads and Replies.

**Editor features by variant:**

| Feature | `full` | `compact` |
|---------|--------|-----------|
| Bold, Italic, Underline, Strikethrough | Yes | Yes |
| Headings (H1-H4) | Yes | No |
| Ordered/Unordered Lists | Yes | Yes |
| Links | Yes | Yes |
| Inline Images | Yes | No |
| Tables | Yes | No |
| Code Blocks | Yes | Yes (inline only) |
| YouTube Embeds | Yes | No |

**Lexical Plugin Stack:**
1. `RichTextPlugin` -- core rich text behavior
2. `HistoryPlugin` -- undo/redo
3. `ListPlugin` -- list formatting
4. `LinkPlugin` + `AutoLinkPlugin` -- link handling
5. `TablePlugin` -- table editing (full variant only)
6. `OnChangePlugin` -- emit JSON state on change
7. Custom `ToolbarPlugin` -- formatting toolbar
8. Custom `ImagePlugin` -- image insertion via URL (full variant only)
9. Custom `YouTubePlugin` -- YouTube embed via URL (full variant only)
10. Custom `CodeHighlightPlugin` -- code block syntax highlighting (full variant only)

**Complexity:** High

---

#### Task 1.4: Create RichTextRenderer Component

**Files created:**
- `src/components/editor/RichTextRenderer.tsx` (Server Component)
- `src/lib/lexicalRenderer.ts` (Server-side rendering utility)

**Component API:**

```typescript
interface RichTextRendererProps {
  /** Content string -- either Lexical JSON or plain text */
  content: string;
  /** CSS class name for the rendered HTML container */
  className?: string;
}
```

**Rendering logic in `lexicalRenderer.ts`:**

```typescript
export function renderContent(content: string): {
  html: string;
  isRichText: boolean;
} {
  // 1. Detect format: try JSON.parse, if it has "root" key -> Lexical JSON
  // 2. If Lexical JSON: use @lexical/headless to create editor,
  //    set state, export to HTML, sanitize with DOMPurify
  // 3. If plain text: return escaped text with <br> for newlines
}
```

**Security:** All HTML output passes through `DOMPurify.sanitize()` before rendering. The sanitizer strips all script tags, event handlers, and dangerous attributes. Configure DOMPurify to allow: `<b>`, `<i>`, `<u>`, `<s>`, `<h1>`-`<h4>`, `<ul>`, `<ol>`, `<li>`, `<a>`, `<img>`, `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`, `<pre>`, `<code>`, `<blockquote>`, `<br>`, `<p>`, `<div>`, `<span>`, `<iframe>` (YouTube only, allowlisted src pattern).

**Backward compatibility:** The `isRichText` flag allows the renderer to apply different CSS classes. Plain text content gets `whitespace-pre-wrap` styling. Rich text gets prose-style typography.

**Complexity:** Medium

---

#### Task 1.5: Dynamic Import Wrapper

**Files created:**
- `src/components/editor/RichTextEditorDynamic.tsx`

**Purpose:** Wrap `RichTextEditor` with `next/dynamic` and `ssr: false` to prevent server-side rendering of the Lexical editor (which requires DOM APIs).

```typescript
import dynamic from "next/dynamic";

const RichTextEditor = dynamic(
  () => import("./RichTextEditor").then((mod) => mod.RichTextEditor),
  {
    ssr: false,
    loading: () => (
      <div className="ring-[1.5px] ring-gray-300 rounded-md p-2 h-48 animate-pulse bg-gray-50" />
    ),
  }
);

export default RichTextEditor;
```

**Complexity:** Low

---

#### Task 1.6: Editor CSS / Tailwind Styling

**Files modified:**
- `src/app/globals.css`

**Actions:** Add Lexical editor theme styles. Lexical uses CSS class names mapped via a theme object. Define styles for:
- `.editor-container` -- outer wrapper
- `.editor-input` -- content editable area
- `.editor-placeholder` -- placeholder text
- `.editor-text-bold`, `.editor-text-italic`, `.editor-text-underline`, `.editor-text-strikethrough`
- `.editor-heading-h1` through `.editor-heading-h4`
- `.editor-list-ol`, `.editor-list-ul`, `.editor-listitem`
- `.editor-link`
- `.editor-code`, `.editor-code-highlight`
- `.editor-table`, `.editor-table-cell`, `.editor-table-cell-header`
- `.editor-image`
- `.editor-youtube` -- YouTube embed container (responsive 16:9 aspect ratio)
- `.rich-text-content` -- rendered output typography (prose-like styles)

**Complexity:** Medium

---

### Phase 2: LMS Lesson Integration

**Goal:** Replace the lesson content textarea with the Lexical editor and update display.

**Priority:** Primary Goal

#### Task 2.1: Update LmsLessonForm

**Files modified:**
- `src/components/forms/LmsLessonForm.tsx`

**Changes:**
1. Import `RichTextEditorDynamic` (the dynamic wrapper).
2. Replace the `<textarea {...register("content")}>` block (lines 159-170) with the `RichTextEditorDynamic` component.
3. Use React Hook Form's `setValue` to programmatically set the `content` field when the editor's `onChange` fires.
4. Pass `data?.content` as `initialContent` for edit mode.
5. Use `variant="full"` for lessons.

**Integration pattern with React Hook Form:**
```typescript
const { register, setValue, handleSubmit } = useForm<LmsLessonSchema>({
  resolver: zodResolver(lmsLessonSchema),
});

// Hidden input to carry the JSON value
<input type="hidden" {...register("content")} />

<RichTextEditorDynamic
  initialContent={data?.content}
  onChange={(json) => setValue("content", json, { shouldValidate: true })}
  label={t("labels.content")}
  error={errors.content?.message ? tv(errors.content.message.toString()) : undefined}
  variant="full"
/>
```

**Complexity:** Medium

---

#### Task 2.2: Update Lesson Display Page

**Files modified:**
- `src/app/(dashboard)/list/courses/[id]/lesson/[lessonId]/page.tsx`

**Changes:**
1. Import `RichTextRenderer`.
2. Replace the `<p className="whitespace-pre-wrap">` block (around line 188-190) with `<RichTextRenderer content={lesson.content} />`.
3. The renderer handles backward compatibility automatically (plain text vs JSON).

**Complexity:** Low

---

#### Task 2.3: Update LMS Lesson Validation Schema

**Files modified:**
- `src/lib/formValidationSchemas.ts`

**Changes:**
- Update `lmsLessonSchema.content` validation. Currently `z.string().min(1)`. Change to: `z.string().min(1, { message: "contentRequired" })` (validation remains a non-empty string check since Lexical JSON is stored as a string). Increase or remove any character-based max limit since JSON content is larger than visual text.

**Complexity:** Low

---

#### Task 2.4: Update LMS Lesson Server Actions

**Files modified:**
- `src/lib/actions.ts` (createLmsLesson, updateLmsLesson actions)

**Changes:**
- No structural changes needed. Server Actions already store `content` as a string via Prisma. The content will now be Lexical JSON instead of plain text, but the data flow is identical.
- Verify that the Zod schema on the server side accepts the Lexical JSON string (it will, since it validates as `z.string().min(1)`).

**Complexity:** Low (verification only)

---

### Phase 3: Forum Integration

**Goal:** Replace forum thread and reply textareas with the Lexical editor and update display.

**Priority:** Secondary Goal

#### Task 3.1: Update ThreadForm

**Files modified:**
- `src/components/forms/ThreadForm.tsx`

**Changes:**
1. Import `RichTextEditorDynamic`.
2. Replace the content `<textarea>` (around line 78-87) with `RichTextEditorDynamic`.
3. Use `variant="compact"` for forum posts.
4. Wire `onChange` to React Hook Form via `setValue`.
5. Pass existing content for edit mode.

**Complexity:** Medium

---

#### Task 3.2: Update ForumReplyForm

**Files modified:**
- `src/components/ForumReplyForm.tsx`

**Changes:**
1. Import `RichTextEditorDynamic`.
2. Replace the content `<textarea>` with `RichTextEditorDynamic`.
3. Use `variant="compact"` for replies.
4. Wire `onChange` to React Hook Form via `setValue`.
5. Consider a more minimal height for reply editor compared to thread editor.

**Complexity:** Medium

---

#### Task 3.3: Update Forum Thread Display

**Files modified:**
- `src/app/(dashboard)/list/courses/[id]/forum/[threadId]/page.tsx`

**Changes:**
1. Import `RichTextRenderer`.
2. Replace `<p className="whitespace-pre-wrap">` (around line 222-224) with `<RichTextRenderer content={thread.content} />`.

**Complexity:** Low

---

#### Task 3.4: Update ForumReplyItem Display

**Files modified:**
- `src/components/ForumReplyItem.tsx`

**Changes:**
1. Import `RichTextRenderer`.
2. Replace `<p className="whitespace-pre-wrap">` (around line 149-151) with `<RichTextRenderer content={reply.content} />`.

**Complexity:** Low

---

#### Task 3.5: Update Forum Validation Schemas

**Files modified:**
- `src/lib/forumValidationSchemas.ts`

**Changes:**
- Update character limits for `threadSchema.content` and `replySchema.content`. Lexical JSON is approximately 3-5x larger than the equivalent plain text. Increase limits:
  - Thread content: `10,000` -> `50,000` characters
  - Reply content: `5,000` -> `25,000` characters
- Same changes for `threadUpdateSchema.content` and `replyUpdateSchema.content`.
- Add a comment explaining the increased limits are due to Lexical JSON overhead.

**Complexity:** Low

---

#### Task 3.6: Update Forum Server Actions

**Files modified:**
- `src/lib/forumActions.ts` (createThread, updateThread, createReply, updateReply)

**Changes:**
- No structural changes needed. Actions already store content as a string.
- Verify updated Zod schemas are imported and the increased limits are applied server-side.

**Complexity:** Low (verification only)

---

### Phase 4: Announcement Integration

**Goal:** Upgrade announcement description from single-line InputField to rich text editor.

**Priority:** Secondary Goal

#### Task 4.1: Update AnnouncementForm

**Files modified:**
- `src/components/forms/AnnouncementForm.tsx`

**Changes:**
1. Import `RichTextEditorDynamic`.
2. Replace the `<InputField label={t("labels.description")} name="description" .../>` block (line 80-86) with `RichTextEditorDynamic`.
3. Use `variant="full"` for announcements (teachers may want headings, images, etc.).
4. Wire `onChange` to React Hook Form via `setValue`.
5. Add hidden input for `description` field.
6. This is the most significant UI upgrade since it converts a single-line text input to a multi-line rich text editor.

**Complexity:** Medium

---

#### Task 4.2: Update Announcement Display

**Files modified:**
- `src/components/Announcements.tsx`

**Changes:**
1. Import `RichTextRenderer`.
2. Replace plain text rendering (line 46, 57, 68) with `<RichTextRenderer content={announcement.description} />`.
3. May need to add a max-height with overflow for announcement cards to prevent excessively long rich content from breaking the layout. Use `max-h-32 overflow-hidden` with a "Read more" pattern or similar truncation.

**Complexity:** Medium (requires layout consideration)

---

#### Task 4.3: Update Announcement Validation Schema

**Files modified:**
- `src/lib/formValidationSchemas.ts`

**Changes:**
- Update `announcementSchema.description` to accept longer content (Lexical JSON). Currently `z.string().min(1)` with no max. No change strictly needed since there is no max limit, but add a reasonable max to prevent abuse: `z.string().min(1, { message: "descriptionRequired" }).max(100000)`.

**Complexity:** Low

---

### Phase 5: Assignment Description Integration

**Goal:** Add the new description field to Assignment model and integrate the editor.

**Priority:** Final Goal

**Prerequisite:** Phase 1 Task 1.2 (database migration) must be complete.

#### Task 5.1: Update AssignmentForm

**Files modified:**
- `src/components/forms/AssignmentForm.tsx`

**Changes:**
1. Import `RichTextEditorDynamic`.
2. Add a new `RichTextEditorDynamic` field for `description` after the title field.
3. Use `variant="full"` since assignment descriptions may include formatting, images, or tables.
4. Wire `onChange` to React Hook Form via `setValue`.
5. The field is optional (`description String? @db.Text` in schema), so the editor should allow empty content.

**Complexity:** Medium

---

#### Task 5.2: Update Assignment Validation Schema

**Files modified:**
- `src/lib/formValidationSchemas.ts`

**Changes:**
- Add `description` to `assignmentSchema`:
  ```typescript
  description: z.string().max(100000).optional().or(z.literal("")),
  ```

**Complexity:** Low

---

#### Task 5.3: Update Assignment Server Actions

**Files modified:**
- `src/lib/actions.ts` (createAssignment, updateAssignment)

**Changes:**
- Add `description` field to the Prisma `create` and `update` calls.
- Include `description` in the Zod parse.

**Complexity:** Low

---

#### Task 5.4: Update Assignment Display

**Files modified:**
- `src/app/(dashboard)/list/assignments/page.tsx` or related display component

**Changes:**
- Add `RichTextRenderer` to display the assignment description where assignments are viewed.
- Handle the optional nature: only render if `description` is truthy.

**Complexity:** Low

---

### Phase 6: Polish and Cross-Cutting Concerns

**Goal:** Final quality pass, edge cases, and performance optimization.

**Priority:** Final Goal

#### Task 6.1: Image Upload Integration

**Files modified:**
- `src/components/editor/plugins/ImagePlugin.tsx`

**Approach:** Two options for image insertion:
1. **URL-based (recommended for Phase 1):** User pastes an image URL. The plugin validates the URL and inserts an `<img>` node.
2. **Cloudinary upload (future enhancement):** Integrate `CldUploadWidget` into the image plugin for direct upload. This aligns with the existing Cloudinary pattern but adds complexity.

For this SPEC, implement URL-based image insertion. Cloudinary integration can be a follow-up enhancement.

**Complexity:** Medium

---

#### Task 6.2: YouTube Embed Plugin

**Files modified:**
- `src/components/editor/plugins/YouTubePlugin.tsx`

**Approach:** User pastes a YouTube URL. The plugin extracts the video ID and creates a custom `YouTubeNode` that renders as a responsive `<iframe>`.

**Security:** The DOMPurify configuration must allowlist `<iframe>` with `src` matching `https://www.youtube.com/embed/*` pattern only. All other iframe sources are stripped.

**Complexity:** Medium

---

#### Task 6.3: Content Truncation Utility

**Files created:**
- `src/lib/lexicalUtils.ts`

**Purpose:** Provide utilities for content preview (e.g., in list pages, announcement cards):
- `extractPlainText(jsonString: string): string` -- Extract plain text from Lexical JSON for search and preview purposes.
- `truncateContent(content: string, maxLength: number): string` -- Truncate either plain text or extract text from Lexical JSON, adding ellipsis.

**Usage:** List pages showing content previews (forum thread list, announcement cards) should show plain text excerpts, not rendered HTML.

**Complexity:** Medium

---

#### Task 6.4: Accessibility (a11y)

**Files modified:**
- `src/components/editor/RichTextEditor.tsx`
- `src/components/editor/EditorToolbar.tsx`

**Requirements:**
- Toolbar buttons have `aria-label` attributes.
- Toolbar buttons show `aria-pressed` state for active formatting.
- Editor content area has `role="textbox"` and `aria-multiline="true"`.
- Focus management: Tab key navigates toolbar buttons, Enter focuses the editor.
- All toolbar icons have tooltip text.

**Complexity:** Medium

---

#### Task 6.5: i18n Integration

**Files modified:**
- Translation files for en and ms locales

**Changes:**
- Add translation keys for editor toolbar labels, placeholder text, and error messages.
- Keys: `editor.placeholder`, `editor.bold`, `editor.italic`, `editor.underline`, `editor.strikethrough`, `editor.heading1`-`editor.heading4`, `editor.bulletList`, `editor.numberedList`, `editor.link`, `editor.image`, `editor.table`, `editor.code`, `editor.youtube`, `editor.undo`, `editor.redo`, `editor.insertLink`, `editor.insertImage`, `editor.insertVideo`, `editor.insertTable`.

**Complexity:** Low

---

## 3. Component Architecture

```
src/components/editor/
  index.ts                      # Barrel export
  RichTextEditor.tsx            # Main editor (Client Component, "use client")
  RichTextEditorDynamic.tsx     # next/dynamic wrapper (ssr: false)
  RichTextRenderer.tsx          # Display component (Server Component)
  EditorToolbar.tsx             # Formatting toolbar (Client Component)
  theme.ts                      # Lexical CSS theme mapping
  nodes.ts                      # Custom node type registrations
  plugins/
    ToolbarPlugin.tsx           # Toolbar state management
    ImagePlugin.tsx             # Image insertion via URL
    YouTubePlugin.tsx           # YouTube embed via URL
    CodeHighlightPlugin.tsx     # Code block formatting

src/lib/
  lexicalRenderer.ts            # Server-side JSON -> HTML conversion
  lexicalUtils.ts               # Content utilities (extract text, truncate)
```

**Data Flow:**

```
[Create/Edit Flow]
RichTextEditor (client)
  -> onChange(jsonString)
  -> React Hook Form setValue("content", jsonString)
  -> Form submit
  -> Server Action
  -> Zod validation (string check)
  -> Prisma store (String @db.Text)

[Display Flow]
Prisma query (String field)
  -> lexicalRenderer.renderContent(content)
  -> DOMPurify.sanitize(html)
  -> RichTextRenderer (dangerouslySetInnerHTML with sanitized output)
```

---

## 4. Migration Strategy

### Existing Content Compatibility

No data migration is needed. Existing plain text content remains in the database unchanged.

**Detection logic in `lexicalRenderer.ts`:**

```typescript
function isLexicalJSON(content: string): boolean {
  if (!content || !content.startsWith("{")) return false;
  try {
    const parsed = JSON.parse(content);
    return parsed.root !== undefined;
  } catch {
    return false;
  }
}
```

**Rendering behavior:**
- If `isLexicalJSON(content)` returns `true`: Parse with Lexical headless, export to HTML, sanitize, render as rich content.
- If `isLexicalJSON(content)` returns `false`: Render as plain text with `whitespace-pre-wrap` CSS, escaping HTML entities.

**Editor behavior with existing content:**
- When the editor receives plain text as `initialContent`, it initializes with that text as a single paragraph node. This converts legacy content to Lexical format on the next save.
- This is a gradual migration: content converts to Lexical JSON format only when a user edits and saves it.

---

## 5. Risk Analysis

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Lexical bundle size impacts page load** | Medium | Medium | Lazy-load via `next/dynamic` with `ssr: false`. Only loaded on pages with editor. Verify bundle size with `next build --analyze`. Target: editor chunk under 150KB gzipped. |
| **XSS via rendered HTML** | Low | Critical | DOMPurify sanitization on ALL HTML output. Allowlist-based tag filtering. No raw `dangerouslySetInnerHTML` without sanitization. |
| **Lexical JSON size exceeds DB limits** | Low | Medium | PostgreSQL `TEXT` type is unbounded. Added `@db.Text` annotation. Zod validation adds reasonable upper bounds (100KB for most fields). |
| **Forum character limits too restrictive** | High | Medium | Increase forum limits from 10K/5K to 50K/25K characters to account for Lexical JSON overhead (3-5x expansion). |
| **Plain text content breaks in editor** | Low | Medium | Editor initializes plain text as a paragraph node. Renderer detects plain text and applies `whitespace-pre-wrap`. Both paths tested. |
| **Lexical API breaking changes** | Low | Medium | Pin all `@lexical/*` packages to same minor version. Monitor Lexical changelog before upgrades. |
| **Editor accessibility gaps** | Medium | Medium | Implement ARIA attributes, keyboard navigation, focus management from the start. Follow WAI-ARIA authoring practices for rich text editors. |
| **Prisma migration fails on production** | Low | High | The `@db.Text` annotation change is generally a no-op on PostgreSQL. The `Assignment.description` field addition is a nullable column, which is always safe. Always review migration SQL before applying. |

---

## 6. Dependencies Graph

```
Phase 1 (Foundation)
  Task 1.1 (Install deps)    -- no dependency
  Task 1.2 (DB schema)       -- no dependency
  Task 1.3 (Editor component) -- depends on 1.1
  Task 1.4 (Renderer)         -- depends on 1.1
  Task 1.5 (Dynamic wrapper)  -- depends on 1.3
  Task 1.6 (CSS)              -- depends on 1.3

Phase 2 (LMS Lessons)         -- depends on Phase 1
  Task 2.1-2.4                 -- depends on 1.3, 1.4, 1.5

Phase 3 (Forums)               -- depends on Phase 1
  Task 3.1-3.6                 -- depends on 1.3, 1.4, 1.5

Phase 4 (Announcements)        -- depends on Phase 1
  Task 4.1-4.3                 -- depends on 1.3, 1.4, 1.5

Phase 5 (Assignments)          -- depends on Phase 1 (Task 1.2 specifically)
  Task 5.1-5.4                 -- depends on 1.2, 1.3, 1.4, 1.5

Phase 6 (Polish)               -- depends on Phases 1-5
  Task 6.1-6.5                 -- depends on all previous
```

**Parallelization:** Phases 2, 3, 4, and 5 are independent of each other and can be implemented in parallel once Phase 1 is complete.

---

## 7. Files Summary

### New Files (14)

| File | Type | Purpose |
|------|------|---------|
| `src/components/editor/index.ts` | Barrel export | Public API for editor components |
| `src/components/editor/RichTextEditor.tsx` | Client Component | Main Lexical editor with toolbar |
| `src/components/editor/RichTextEditorDynamic.tsx` | Client Component | Dynamic import wrapper (ssr: false) |
| `src/components/editor/RichTextRenderer.tsx` | Server Component | Renders Lexical JSON or plain text to HTML |
| `src/components/editor/EditorToolbar.tsx` | Client Component | Formatting toolbar with buttons |
| `src/components/editor/theme.ts` | Config | Lexical CSS class name theme |
| `src/components/editor/nodes.ts` | Config | Custom Lexical node registrations |
| `src/components/editor/plugins/ToolbarPlugin.tsx` | Plugin | Toolbar state and command dispatching |
| `src/components/editor/plugins/ImagePlugin.tsx` | Plugin | Image insertion via URL |
| `src/components/editor/plugins/YouTubePlugin.tsx` | Plugin | YouTube embed via URL |
| `src/components/editor/plugins/CodeHighlightPlugin.tsx` | Plugin | Code block formatting |
| `src/lib/lexicalRenderer.ts` | Utility | Server-side JSON to HTML conversion |
| `src/lib/lexicalUtils.ts` | Utility | Content extraction and truncation |
| `prisma/migrations/*_add_rich_text_support/` | Migration | DB schema changes |

### Modified Files (14)

| File | Change |
|------|--------|
| `package.json` | Add Lexical + DOMPurify dependencies |
| `prisma/schema.prisma` | Add `@db.Text` annotations, Assignment.description field |
| `src/app/globals.css` | Add Lexical editor theme styles + rich text content styles |
| `src/components/forms/LmsLessonForm.tsx` | Replace textarea with RichTextEditor |
| `src/components/forms/ThreadForm.tsx` | Replace textarea with RichTextEditor |
| `src/components/ForumReplyForm.tsx` | Replace textarea with RichTextEditor |
| `src/components/forms/AnnouncementForm.tsx` | Replace InputField with RichTextEditor |
| `src/components/forms/AssignmentForm.tsx` | Add RichTextEditor for description |
| `src/components/Announcements.tsx` | Replace plain text with RichTextRenderer |
| `src/components/ForumReplyItem.tsx` | Replace plain text with RichTextRenderer |
| `src/app/(dashboard)/list/courses/[id]/lesson/[lessonId]/page.tsx` | Replace plain text with RichTextRenderer |
| `src/app/(dashboard)/list/courses/[id]/forum/[threadId]/page.tsx` | Replace plain text with RichTextRenderer |
| `src/lib/formValidationSchemas.ts` | Update assignment schema with description, update announcement limits |
| `src/lib/forumValidationSchemas.ts` | Increase character limits for JSON content |
| `src/lib/actions.ts` | Add description to assignment create/update actions |

**Total files affected:** 28 (14 new + 14 modified)

---

## 8. Testing Strategy

### Unit Tests

| Test | Scope |
|------|-------|
| `lexicalRenderer.test.ts` | Verify JSON-to-HTML conversion, plain text detection, DOMPurify sanitization, XSS prevention |
| `lexicalUtils.test.ts` | Verify plain text extraction, content truncation, edge cases (empty, malformed JSON) |
| Validation schema tests | Verify updated Zod schemas accept Lexical JSON strings within new limits |

### Integration Tests

| Test | Scope |
|------|-------|
| Editor component render | Verify RichTextEditor mounts, accepts initial content, fires onChange |
| Editor + React Hook Form | Verify form submission includes Lexical JSON content |
| Renderer backward compat | Verify plain text content renders with whitespace-pre-wrap |
| Renderer rich content | Verify Lexical JSON renders as sanitized HTML |

### End-to-End Scenarios

| Scenario | Steps |
|----------|-------|
| Create lesson with rich content | Teacher creates lesson with bold text, heading, and image URL. Verify content saved and displayed correctly. |
| Edit legacy plain text lesson | Open existing plain text lesson for edit. Editor shows text. Save. Verify converted to Lexical JSON. Display still works. |
| Create forum thread | Student creates thread with bold text and list. Verify rendering on thread page. |
| Create announcement | Admin creates announcement with heading and formatted text. Verify display in announcement widget. |
| XSS prevention | Attempt to inject `<script>` tag via the editor content field. Verify it is stripped from rendered output. |

### Performance Checks

| Check | Target |
|-------|--------|
| Editor chunk size | Under 150KB gzipped |
| Initial page load (no editor) | No Lexical JavaScript loaded |
| Editor load time | Under 500ms from button click to interactive editor |
| Renderer execution time | Under 50ms for typical content |

---

## 9. Expert Consultation Recommendations

This SPEC involves frontend component architecture and would benefit from:

- **expert-frontend:** For Lexical plugin architecture, React 19 integration patterns, dynamic import optimization, and accessibility compliance.
- **expert-backend:** For database migration strategy verification, server-side rendering approach for `lexicalRenderer.ts`, and content validation patterns.
- **expert-security:** For DOMPurify configuration review, XSS prevention validation, and iframe allowlisting strategy for YouTube embeds.

---

## 10. Milestone Summary

| Milestone | Phases | Deliverable |
|-----------|--------|-------------|
| **Primary Goal** | Phase 1 + Phase 2 | Foundation components + LMS Lesson integration working end-to-end |
| **Secondary Goal** | Phase 3 + Phase 4 | Forum and Announcement surfaces integrated |
| **Final Goal** | Phase 5 + Phase 6 | Assignment description, polish, accessibility, i18n |
