---
id: SPEC-EDITOR-001
version: "1.0.0"
status: approved
created: 2026-02-25
updated: 2026-02-25
author: ZaF
priority: high
---

# SPEC-EDITOR-001: Rich Text Editor with Lexical

## HISTORY

| Version | Date       | Author | Description                     |
|---------|------------|--------|---------------------------------|
| 1.0.0   | 2026-02-25 | ZaF    | Initial EARS specification      |

---

## 1. Environment

### 1.1 Project Context

Hua Readwise is a school management system built with Next.js 16 (App Router), React 19, Prisma ORM, and PostgreSQL. The platform serves four roles (admin, teacher, student, parent) for a bi-weekly school. Content creation currently relies on plain text via `<textarea>` or `<InputField>` components with `whitespace-pre-wrap` display rendering.

### 1.2 Problem Statement

Five content surfaces across the application (LMS Lessons, Forum Threads, Forum Replies, Announcements, Assignment Descriptions) are limited to unformatted plain text. Teachers cannot use headings, bold text, lists, images, or code blocks in lesson content. Forum participants cannot format discussion posts. Announcement descriptions are constrained to a single-line text input. This limits the expressiveness of content authoring and reduces the educational value of published materials.

### 1.3 Technical Environment

| Component         | Version/Technology                           |
|-------------------|----------------------------------------------|
| Framework         | Next.js 16 (App Router, Server Components)   |
| UI Library        | React 19                                     |
| Language          | TypeScript 5 (strict mode)                   |
| Styling           | Tailwind CSS v4                              |
| Database          | PostgreSQL 14+ via Prisma ORM 5.19+          |
| Forms             | React Hook Form 7.52+ with Zod 3.23+        |
| Auth              | Clerk 6.38+                                  |
| Editor (new)      | Lexical ^0.40.0 (13 packages)               |
| Sanitization (new)| DOMPurify ^3.3.1                             |

### 1.4 Content Surfaces

| Surface                   | Prisma Model Field          | Current Input     | Target Variant |
|---------------------------|-----------------------------|-------------------|----------------|
| LMS Lesson content        | `LmsLesson.content`         | textarea (6 rows) | full           |
| Forum Thread content      | `ForumThread.content`       | textarea (5 rows) | compact        |
| Forum Reply content       | `ForumReply.content`        | textarea           | compact        |
| Announcement description  | `Announcement.description`  | InputField (1 line)| full           |
| Assignment description    | `Assignment.description`    | (new field)       | full           |

---

## 2. Assumptions

### 2.1 Technical Assumptions

- **A-01**: Lexical ^0.40.0 supports all required features (rich text, lists, links, tables, code blocks, images, custom nodes) and is compatible with React 19 and Next.js 16.
- **A-02**: Lexical JSON state can be serialized to a string and stored in PostgreSQL TEXT columns without size issues for typical educational content (under 100KB per document).
- **A-03**: `@lexical/headless` can render Lexical JSON to HTML on the server side without requiring a browser DOM environment.
- **A-04**: DOMPurify can sanitize HTML output from Lexical headless rendering to prevent XSS attacks while preserving all desired formatting elements.
- **A-05**: All `@lexical/*` packages at the same minor version are internally compatible.
- **A-06**: The existing PostgreSQL content fields (String type) can accept longer Lexical JSON content without schema-level issues. The `@db.Text` annotation ensures unbounded PostgreSQL `TEXT` type.
- **A-07**: The existing React Hook Form integration pattern (using `setValue` for programmatic field updates) works correctly with a controlled Lexical editor component.
- **A-08**: Server-side rendering of Lexical JSON via `@lexical/headless` completes in under 50ms for typical content, suitable for Server Component rendering.

### 2.2 Business Assumptions

- **A-09**: Teachers and administrators are the primary content authors. Students author content only in forum threads and replies.
- **A-10**: Image insertion via URL paste is sufficient for the initial implementation. Direct image upload (Cloudinary integration) is a future enhancement.
- **A-11**: YouTube is the only embedded video platform required. Other video platforms are out of scope.
- **A-12**: Existing plain text content must remain fully readable without any data migration. Content migrates to Lexical JSON format only when a user edits and saves it.

### 2.3 Constraint Assumptions

- **A-13**: The editor must not execute on the server side (requires DOM APIs). All editor rendering must use `next/dynamic` with `ssr: false`.
- **A-14**: The editor bundle should not impact initial page load for pages without an editor. Lazy loading via dynamic import ensures this.

---

## 3. Requirements

### 3.1 Editor Component Requirements

#### Ubiquitous Requirements

- **REQ-U-01**: The system shall store all rich text content as Lexical JSON state strings in the database.
- **REQ-U-02**: The system shall sanitize all HTML output from Lexical JSON rendering through DOMPurify before display.
- **REQ-U-03**: The system shall load the Lexical editor exclusively on the client side using `next/dynamic` with `ssr: false`.
- **REQ-U-04**: The RichTextEditor component shall expose an `onChange` callback that emits the current Lexical JSON state as a string.
- **REQ-U-05**: The RichTextRenderer component shall accept a content string and render either Lexical JSON as sanitized HTML or plain text with `whitespace-pre-wrap` styling.
- **REQ-U-06**: All toolbar buttons shall have `aria-label` attributes describing their function.
- **REQ-U-07**: All toolbar buttons for formatting toggles shall display `aria-pressed` state reflecting whether the format is currently active.

#### Event-Driven Requirements

- **REQ-E-01**: **When** a user types, formats, or modifies content in the editor, **the system shall** emit the updated Lexical JSON state string via the `onChange` callback.
- **REQ-E-02**: **When** a user clicks a formatting toolbar button (bold, italic, underline, strikethrough), **the system shall** toggle the corresponding text format on the current selection.
- **REQ-E-03**: **When** a user selects a heading level (H1-H4) from the toolbar in `full` variant, **the system shall** convert the current block to the selected heading type.
- **REQ-E-04**: **When** a user clicks the image insertion button and provides a valid URL, **the system shall** insert an inline image node at the current cursor position.
- **REQ-E-05**: **When** a user clicks the YouTube embed button and provides a valid YouTube URL, **the system shall** insert a responsive iframe embed node at the current cursor position.
- **REQ-E-06**: **When** a user clicks the table insertion button, **the system shall** insert a table with a configurable number of rows and columns at the current cursor position.
- **REQ-E-07**: **When** a user clicks undo or redo, **the system shall** revert or reapply the most recent content change using the Lexical HistoryPlugin.
- **REQ-E-08**: **When** a user clicks the ordered list or unordered list button, **the system shall** convert the current block or selection to the corresponding list type.
- **REQ-E-09**: **When** a user clicks the link button and provides a URL, **the system shall** wrap the current selection in a link node pointing to the provided URL.
- **REQ-E-10**: **When** a user clicks the code block button in `full` variant, **the system shall** convert the current block to a code block node.

#### State-Driven Requirements

- **REQ-S-01**: **While** the editor `variant` is set to `compact`, **the system shall** restrict available toolbar features to: bold, italic, underline, strikethrough, ordered list, unordered list, links, and inline code.
- **REQ-S-02**: **While** the editor `variant` is set to `full`, **the system shall** enable all toolbar features: text formatting, headings (H1-H4), ordered/unordered lists, links, inline images, tables, code blocks, and YouTube embeds.
- **REQ-S-03**: **While** the `disabled` prop is set to `true`, **the system shall** render the editor in read-only mode with the toolbar hidden or disabled.
- **REQ-S-04**: **While** the RichTextRenderer receives content that is valid Lexical JSON (a JSON string with a `root` key), **the system shall** render the content as sanitized HTML using `@lexical/headless` and DOMPurify.
- **REQ-S-05**: **While** the RichTextRenderer receives content that is plain text (not valid Lexical JSON), **the system shall** render the content with `whitespace-pre-wrap` CSS and HTML entity escaping.
- **REQ-S-06**: **While** the editor receives plain text as `initialContent`, **the system shall** initialize the content as a single paragraph node containing the text, converting it to Lexical format on the next save.

#### Optional Requirements

- **REQ-O-01**: **Where** the editor loading state is visible, **the system shall** display a skeleton placeholder matching the editor dimensions until the dynamic import completes.
- **REQ-O-02**: **Where** content preview is needed in list views (forum thread list, announcement cards), **the system shall** provide a `extractPlainText` utility that extracts readable text from Lexical JSON for truncated previews.
- **REQ-O-03**: **Where** toolbar tooltips are available, **the system shall** display descriptive tooltip text on hover for each toolbar button.

#### Complex Requirements

- **REQ-C-01**: **If** a YouTube URL is provided **while** the editor is in `full` variant, **when** the user confirms the embed, **the system shall** validate the URL against a YouTube pattern, extract the video ID, and insert a custom YouTubeNode that renders as a responsive 16:9 iframe.
- **REQ-C-02**: **If** an image URL is provided **while** the editor is in `full` variant, **when** the user confirms the insertion, **the system shall** validate the URL format and insert an ImageNode that renders as an `<img>` element with the provided source.

---

### 3.2 Database Requirements

#### Ubiquitous Requirements

- **REQ-DB-U-01**: The `LmsLesson.content`, `ForumThread.content`, `ForumReply.content`, and `Announcement.description` fields shall use `@db.Text` annotation to ensure PostgreSQL `TEXT` type.
- **REQ-DB-U-02**: The `Assignment` model shall include an optional `description` field of type `String?` with `@db.Text` annotation.

#### Event-Driven Requirements

- **REQ-DB-E-01**: **When** the database migration is applied, **the system shall** add the `@db.Text` annotation to 4 existing fields and add the `Assignment.description` field without data loss.

---

### 3.3 Form Integration Requirements

#### Event-Driven Requirements

- **REQ-FORM-E-01**: **When** the editor `onChange` fires in `LmsLessonForm`, **the system shall** update the React Hook Form `content` field value via `setValue("content", jsonString, { shouldValidate: true })`.
- **REQ-FORM-E-02**: **When** the editor `onChange` fires in `ThreadForm`, **the system shall** update the React Hook Form `content` field value via `setValue`.
- **REQ-FORM-E-03**: **When** the editor `onChange` fires in `ForumReplyForm`, **the system shall** update the React Hook Form `content` field value via `setValue`.
- **REQ-FORM-E-04**: **When** the editor `onChange` fires in `AnnouncementForm`, **the system shall** update the React Hook Form `description` field value via `setValue`.
- **REQ-FORM-E-05**: **When** the editor `onChange` fires in `AssignmentForm`, **the system shall** update the React Hook Form `description` field value via `setValue`.
- **REQ-FORM-E-06**: **When** a form is submitted, **the system shall** pass the Lexical JSON string through Zod validation as a non-empty string check.

#### State-Driven Requirements

- **REQ-FORM-S-01**: **While** a form is in edit mode and existing content is available, **the system shall** pass the existing content string as the `initialContent` prop to the editor.

---

### 3.4 Forum-Specific Requirements

#### Event-Driven Requirements

- **REQ-FORUM-E-01**: **When** a thread is created or updated with rich text content, **the system shall** validate the content string length against the increased limit of 50,000 characters.
- **REQ-FORUM-E-02**: **When** a reply is created or updated with rich text content, **the system shall** validate the content string length against the increased limit of 25,000 characters.

---

### 3.5 Announcement-Specific Requirements

#### Event-Driven Requirements

- **REQ-ANN-E-01**: **When** an announcement is displayed in a card layout, **the system shall** render the description using `RichTextRenderer` with appropriate truncation or max-height overflow handling to prevent layout breakage.

---

### 3.6 Assignment-Specific Requirements

#### Event-Driven Requirements

- **REQ-ASSIGN-E-01**: **When** an assignment is created with a description, **the system shall** include the `description` field in the Prisma `create` call.
- **REQ-ASSIGN-E-02**: **When** an assignment is updated with a description, **the system shall** include the `description` field in the Prisma `update` call.
- **REQ-ASSIGN-E-03**: **When** an assignment is displayed, **the system shall** render the description using `RichTextRenderer` only if the `description` field is truthy.

#### Optional Requirements

- **REQ-ASSIGN-O-01**: **Where** the `description` field is empty or null, **the system shall** omit the description section from the assignment display.

---

### 3.7 Security Requirements

#### Ubiquitous Requirements

- **REQ-SEC-U-01**: The system shall sanitize ALL HTML output from Lexical JSON rendering through DOMPurify before setting `dangerouslySetInnerHTML`.
- **REQ-SEC-U-02**: The DOMPurify configuration shall use an allowlist of permitted HTML tags: `<b>`, `<i>`, `<u>`, `<s>`, `<h1>` through `<h4>`, `<ul>`, `<ol>`, `<li>`, `<a>`, `<img>`, `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`, `<pre>`, `<code>`, `<blockquote>`, `<br>`, `<p>`, `<div>`, `<span>`, `<iframe>`.
- **REQ-SEC-U-03**: The DOMPurify configuration shall restrict `<iframe>` `src` attributes to URLs matching `https://www.youtube.com/embed/*` only.

#### Unwanted Behavior Requirements

- **REQ-SEC-N-01**: The system shall **not** render `<script>` tags, inline event handlers (`onclick`, `onerror`, etc.), or `javascript:` URLs from any content field.
- **REQ-SEC-N-02**: The system shall **not** allow `<iframe>` elements with `src` attributes pointing to domains other than `www.youtube.com`.
- **REQ-SEC-N-03**: The system shall **not** render unsanitized HTML content via `dangerouslySetInnerHTML` under any code path.

---

### 3.8 Performance Requirements

#### Ubiquitous Requirements

- **REQ-PERF-U-01**: The Lexical editor chunk shall be under 150KB gzipped.
- **REQ-PERF-U-02**: Pages without an editor shall load zero Lexical JavaScript (lazy loading via dynamic import).

#### Event-Driven Requirements

- **REQ-PERF-E-01**: **When** a page containing the editor is loaded, **the system shall** render the editor interactive within 500ms of the dynamic import trigger.
- **REQ-PERF-E-02**: **When** the RichTextRenderer renders Lexical JSON to HTML on the server, **the system shall** complete the rendering in under 50ms for typical content (under 50KB JSON).

---

### 3.9 i18n Requirements

#### Ubiquitous Requirements

- **REQ-I18N-U-01**: All editor toolbar labels, placeholder text, and error messages shall use translation keys from the project's i18n system.
- **REQ-I18N-U-02**: Translation keys shall be provided for both `en` and `ms` locales.

---

### 3.10 Accessibility Requirements

#### Ubiquitous Requirements

- **REQ-A11Y-U-01**: The editor content area shall have `role="textbox"` and `aria-multiline="true"` attributes.
- **REQ-A11Y-U-02**: Toolbar buttons shall support keyboard navigation via Tab key.

---

## 4. Specifications

### 4.1 Component Architecture

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

### 4.2 Storage Format

Content is stored as Lexical JSON state strings in PostgreSQL `TEXT` columns. The JSON structure follows Lexical's native `EditorState.toJSON()` output, which includes a `root` key at the top level. The detection function `isLexicalJSON(content)` checks for a valid JSON string with a `root` property to distinguish from plain text.

### 4.3 Rendering Pipeline

**Create/Edit Flow:**
```
RichTextEditor (client) -> onChange(jsonString) -> React Hook Form setValue
-> Form submit -> Server Action -> Zod validation (string check)
-> Prisma store (String @db.Text)
```

**Display Flow:**
```
Prisma query (String field) -> lexicalRenderer.renderContent(content)
-> Detect format (Lexical JSON vs plain text)
-> If JSON: @lexical/headless export to HTML -> DOMPurify.sanitize(html)
-> If plain text: escape HTML entities, apply whitespace-pre-wrap
-> RichTextRenderer (dangerouslySetInnerHTML with sanitized output)
```

### 4.4 Editor Variants

| Feature                              | `full` | `compact` |
|--------------------------------------|--------|-----------|
| Bold, Italic, Underline, Strikethrough | Yes  | Yes       |
| Headings (H1-H4)                    | Yes    | No        |
| Ordered/Unordered Lists             | Yes    | Yes       |
| Links                               | Yes    | Yes       |
| Inline Images                       | Yes    | No        |
| Tables                              | Yes    | No        |
| Code Blocks                         | Yes    | Yes (inline only) |
| YouTube Embeds                       | Yes    | No        |

### 4.5 Backward Compatibility

No data migration required. The detection logic:
1. Attempt `JSON.parse(content)` -- if it succeeds and the result has a `root` key, treat as Lexical JSON.
2. Otherwise, treat as plain text.
3. When a user edits existing plain text content, the editor initializes it as a paragraph node. On save, it is stored as Lexical JSON (gradual migration).

### 4.6 Dependencies

| Package              | Version   | Purpose                              |
|----------------------|-----------|--------------------------------------|
| `lexical`            | `^0.40.0` | Core editor engine                  |
| `@lexical/react`     | `^0.40.0` | React bindings                      |
| `@lexical/headless`  | `^0.40.0` | Server-side rendering               |
| `@lexical/rich-text` | `^0.40.0` | Rich text node types                |
| `@lexical/list`      | `^0.40.0` | List support                        |
| `@lexical/link`      | `^0.40.0` | Link node and auto-link             |
| `@lexical/code`      | `^0.40.0` | Code block highlighting             |
| `@lexical/table`     | `^0.40.0` | Table support                       |
| `@lexical/html`      | `^0.40.0` | HTML import/export                  |
| `@lexical/selection`  | `^0.40.0` | Selection utilities                 |
| `@lexical/utils`     | `^0.40.0` | General utilities                   |
| `dompurify`          | `^3.3.1`  | HTML sanitization                   |
| `@types/dompurify`   | `^3.2.0`  | TypeScript definitions (dev)        |

### 4.7 Database Changes

1. Add `@db.Text` to `LmsLesson.content`, `ForumThread.content`, `ForumReply.content`, `Announcement.description`.
2. Add `description String? @db.Text` to `Assignment` model.
3. Increase forum validation limits: Thread content 10,000 -> 50,000 chars; Reply content 5,000 -> 25,000 chars.

### 4.8 Files Affected

**New files (14):** `src/components/editor/index.ts`, `RichTextEditor.tsx`, `RichTextEditorDynamic.tsx`, `RichTextRenderer.tsx`, `EditorToolbar.tsx`, `theme.ts`, `nodes.ts`, `plugins/ToolbarPlugin.tsx`, `plugins/ImagePlugin.tsx`, `plugins/YouTubePlugin.tsx`, `plugins/CodeHighlightPlugin.tsx`, `src/lib/lexicalRenderer.ts`, `src/lib/lexicalUtils.ts`, Prisma migration file.

**Modified files (14):** `package.json`, `prisma/schema.prisma`, `src/app/globals.css`, `src/components/forms/LmsLessonForm.tsx`, `src/components/forms/ThreadForm.tsx`, `src/components/ForumReplyForm.tsx`, `src/components/forms/AnnouncementForm.tsx`, `src/components/forms/AssignmentForm.tsx`, `src/components/Announcements.tsx`, `src/components/ForumReplyItem.tsx`, lesson page, forum thread page, `src/lib/formValidationSchemas.ts`, `src/lib/forumValidationSchemas.ts`, `src/lib/actions.ts`.

---

## 5. Traceability

| Requirement    | Plan Phase | Acceptance Criteria |
|----------------|------------|---------------------|
| REQ-U-01       | Phase 1    | AC-STORE-01         |
| REQ-U-02       | Phase 1    | AC-SEC-01           |
| REQ-U-03       | Phase 1    | AC-PERF-03          |
| REQ-E-01       | Phase 1    | AC-EDITOR-01        |
| REQ-E-02       | Phase 1    | AC-EDITOR-02        |
| REQ-S-01       | Phase 3    | AC-FORUM-01         |
| REQ-S-04       | Phase 1    | AC-RENDER-01        |
| REQ-S-05       | Phase 1    | AC-RENDER-02        |
| REQ-S-06       | Phase 1    | AC-COMPAT-01        |
| REQ-DB-U-01    | Phase 1    | AC-DB-01            |
| REQ-DB-U-02    | Phase 1    | AC-DB-02            |
| REQ-FORM-E-01  | Phase 2    | AC-LESSON-01        |
| REQ-FORM-E-02  | Phase 3    | AC-FORUM-01         |
| REQ-FORM-E-04  | Phase 4    | AC-ANN-01           |
| REQ-FORM-E-05  | Phase 5    | AC-ASSIGN-01        |
| REQ-SEC-U-01   | Phase 1    | AC-SEC-01           |
| REQ-SEC-N-01   | Phase 1    | AC-SEC-02           |
| REQ-SEC-N-02   | Phase 1    | AC-SEC-03           |
| REQ-PERF-U-01  | Phase 6    | AC-PERF-01          |
| REQ-PERF-U-02  | Phase 1    | AC-PERF-03          |
| REQ-PERF-E-01  | Phase 1    | AC-PERF-02          |
| REQ-I18N-U-01  | Phase 6    | AC-I18N-01          |
| REQ-A11Y-U-01  | Phase 6    | AC-A11Y-01          |

---

## 6. Expert Consultation Recommendations

This SPEC involves frontend component architecture, database changes, and security concerns. The following consultations are recommended before implementation:

- **expert-frontend**: Lexical plugin architecture, React 19 integration patterns, dynamic import optimization, accessibility compliance (WCAG 2.1 AA for rich text editors).
- **expert-backend**: Database migration strategy verification, server-side rendering approach for `lexicalRenderer.ts`, content validation patterns for Lexical JSON.
- **expert-security**: DOMPurify configuration review, XSS prevention validation, iframe allowlisting strategy for YouTube embeds.
