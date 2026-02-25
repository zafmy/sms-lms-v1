---
id: SPEC-EDITOR-001
document: acceptance
version: "1.0.0"
created: 2026-02-25
updated: 2026-02-25
author: ZaF
---

# SPEC-EDITOR-001: Acceptance Criteria

## Table of Contents

1. [Editor Component Scenarios](#1-editor-component-scenarios)
2. [LMS Lesson Scenarios](#2-lms-lesson-scenarios)
3. [Forum Thread Scenarios](#3-forum-thread-scenarios)
4. [Forum Reply Scenarios](#4-forum-reply-scenarios)
5. [Announcement Scenarios](#5-announcement-scenarios)
6. [Assignment Scenarios](#6-assignment-scenarios)
7. [Backward Compatibility Scenarios](#7-backward-compatibility-scenarios)
8. [Security Scenarios](#8-security-scenarios)
9. [Performance Criteria](#9-performance-criteria)
10. [Accessibility Scenarios](#10-accessibility-scenarios)
11. [i18n Scenarios](#11-i18n-scenarios)
12. [Quality Gate Criteria](#12-quality-gate-criteria)

---

## 1. Editor Component Scenarios

### AC-EDITOR-01: Editor emits Lexical JSON on content change

```gherkin
Scenario: Editor emits JSON state on typing
  Given the RichTextEditor component is mounted with variant "full"
  And the editor is empty
  When the user types "Hello World"
  Then the onChange callback is invoked with a valid JSON string
  And the JSON string contains a "root" key at the top level
  And the JSON string includes a text node containing "Hello World"
```

### AC-EDITOR-02: Toolbar formatting toggles work

```gherkin
Scenario: Bold formatting toggle
  Given the RichTextEditor component is mounted with variant "full"
  And the user has typed "some text"
  When the user selects "some text"
  And the user clicks the Bold toolbar button
  Then the selected text is rendered with bold formatting
  And the Bold toolbar button shows aria-pressed="true"
  And the onChange callback emits JSON containing a bold format marker

Scenario: Italic formatting toggle
  Given the RichTextEditor component is mounted with variant "compact"
  And the user has typed "some text"
  When the user selects "some text"
  And the user clicks the Italic toolbar button
  Then the selected text is rendered with italic formatting
  And the onChange callback emits JSON containing an italic format marker
```

### AC-EDITOR-03: Heading insertion in full variant

```gherkin
Scenario: Insert H2 heading
  Given the RichTextEditor component is mounted with variant "full"
  And the cursor is on an empty line
  When the user selects "Heading 2" from the heading dropdown
  Then the current block is converted to an H2 heading node
  And the onChange callback emits JSON containing a heading node with tag "h2"
```

### AC-EDITOR-04: List creation

```gherkin
Scenario: Create unordered list
  Given the RichTextEditor component is mounted with variant "compact"
  And the cursor is on a paragraph line
  When the user clicks the Unordered List toolbar button
  Then the current block is converted to an unordered list item
  And the onChange callback emits JSON containing a list node of type "bullet"
```

### AC-EDITOR-05: Undo and redo

```gherkin
Scenario: Undo restores previous state
  Given the RichTextEditor has content "First line"
  When the user types " Second line"
  And the user clicks the Undo button
  Then the editor content reverts to "First line"
  And the onChange callback emits the previous JSON state
```

### AC-EDITOR-06: Compact variant restricts features

```gherkin
Scenario: Compact variant hides heading controls
  Given the RichTextEditor component is mounted with variant "compact"
  Then the toolbar does not display heading selection controls
  And the toolbar does not display an image insertion button
  And the toolbar does not display a table insertion button
  And the toolbar does not display a YouTube embed button
  And the toolbar does display bold, italic, underline, strikethrough buttons
  And the toolbar does display ordered list and unordered list buttons
  And the toolbar does display a link insertion button
```

### AC-EDITOR-07: Disabled state

```gherkin
Scenario: Editor in disabled mode
  Given the RichTextEditor component is mounted with disabled set to true
  When the user attempts to type in the editor
  Then the editor does not accept input
  And the toolbar buttons are disabled or hidden
```

---

## 2. LMS Lesson Scenarios

### AC-LESSON-01: Create lesson with rich text content

```gherkin
Scenario: Teacher creates a lesson with formatted content
  Given the teacher is on the LMS Lesson create form
  And the RichTextEditor is displayed with variant "full"
  When the teacher types a heading "Introduction"
  And the teacher adds bold text "Key concept"
  And the teacher inserts an unordered list with 3 items
  And the teacher submits the form
  Then the lesson is saved to the database with Lexical JSON in the content field
  And the content field contains a valid JSON string with a "root" key
  And the server action returns a success response
```

### AC-LESSON-02: Edit existing lesson with rich content

```gherkin
Scenario: Teacher edits a lesson that was previously saved with rich text
  Given a lesson exists with Lexical JSON content containing a heading and bold text
  When the teacher opens the lesson edit form
  Then the RichTextEditor is initialized with the existing Lexical JSON content
  And the heading and bold text are displayed correctly in the editor
  When the teacher adds an image via URL
  And the teacher submits the form
  Then the updated Lexical JSON is saved to the database
  And the image node is present in the stored JSON
```

### AC-LESSON-03: Display lesson with rich content

```gherkin
Scenario: Student views a lesson with rich text content
  Given a lesson exists with Lexical JSON content containing headings, bold text, and a list
  When the student navigates to the lesson page
  Then the content is rendered as formatted HTML
  And headings appear as <h1> through <h4> elements
  And bold text appears as <b> elements
  And the list appears as <ul> with <li> elements
  And no raw JSON is visible to the student
```

---

## 3. Forum Thread Scenarios

### AC-FORUM-01: Create forum thread with compact editor

```gherkin
Scenario: Student creates a forum thread with formatted content
  Given the student is on the forum thread create form
  And the RichTextEditor is displayed with variant "compact"
  When the student types "My question about the lesson"
  And the student makes "question" bold
  And the student adds a numbered list
  And the student submits the form
  Then the thread is saved with Lexical JSON in the content field
  And the content string length is validated against the 50,000 character limit
  And the server action returns a success response
```

### AC-FORUM-02: Display forum thread with rich content

```gherkin
Scenario: User views a forum thread with rich text content
  Given a forum thread exists with Lexical JSON content containing bold text and a list
  When the user navigates to the thread page
  Then the thread content is rendered as formatted HTML via RichTextRenderer
  And bold text is rendered as <b> elements
  And the list is rendered as <ol> with <li> elements
```

### AC-FORUM-03: Forum thread character limit enforcement

```gherkin
Scenario: Thread content exceeds maximum length
  Given the student is on the forum thread create form
  When the student enters content that produces Lexical JSON exceeding 50,000 characters
  And the student submits the form
  Then the form displays a validation error about content length
  And the thread is not saved to the database
```

---

## 4. Forum Reply Scenarios

### AC-REPLY-01: Create forum reply with compact editor

```gherkin
Scenario: Student creates a reply with formatted text
  Given the student is viewing a forum thread
  And the reply form is displayed with RichTextEditor variant "compact"
  When the student types a reply with italic emphasis and a link
  And the student submits the reply form
  Then the reply is saved with Lexical JSON in the content field
  And the content string length is validated against the 25,000 character limit
  And the reply appears on the thread page with formatted content
```

### AC-REPLY-02: Display forum reply with rich content

```gherkin
Scenario: User views forum replies with rich text
  Given a forum thread has replies with Lexical JSON content
  When the user views the thread page
  Then each reply's content is rendered as formatted HTML via RichTextRenderer
  And formatting (bold, italic, links) is preserved in the rendered output
```

---

## 5. Announcement Scenarios

### AC-ANN-01: Create announcement with rich text description

```gherkin
Scenario: Admin creates an announcement with formatted description
  Given the admin is on the announcement create form
  And the description field displays a RichTextEditor with variant "full"
  When the admin types a heading "Important Update"
  And the admin adds formatted body text with bold emphasis
  And the admin submits the form
  Then the announcement is saved with Lexical JSON in the description field
  And the server action returns a success response
```

### AC-ANN-02: Display announcement with rich content in card layout

```gherkin
Scenario: User views announcements feed with rich text descriptions
  Given announcements exist with Lexical JSON descriptions containing headings and lists
  When the user views the announcements feed on the dashboard
  Then each announcement description is rendered as formatted HTML
  And the content is truncated or limited in height to prevent layout breakage
  And the formatted content is sanitized through DOMPurify
```

### AC-ANN-03: Edit existing announcement

```gherkin
Scenario: Admin edits an announcement with existing rich text
  Given an announcement exists with Lexical JSON description
  When the admin opens the announcement edit form
  Then the RichTextEditor loads with the existing Lexical JSON content
  And the formatted content is displayed correctly in the editor
  When the admin modifies the content and submits
  Then the updated Lexical JSON is saved to the database
```

---

## 6. Assignment Scenarios

### AC-ASSIGN-01: Create assignment with optional description

```gherkin
Scenario: Teacher creates an assignment with a rich text description
  Given the teacher is on the assignment create form
  And a RichTextEditor with variant "full" is displayed for the description field
  When the teacher types assignment instructions with formatting
  And the teacher submits the form
  Then the assignment is saved with Lexical JSON in the description field
  And the server action includes the description in the Prisma create call
```

### AC-ASSIGN-02: Create assignment without description

```gherkin
Scenario: Teacher creates an assignment without providing a description
  Given the teacher is on the assignment create form
  And the description RichTextEditor is empty
  When the teacher fills in other required fields and submits the form
  Then the assignment is saved with a null or empty description field
  And the server action returns a success response
```

### AC-ASSIGN-03: Display assignment description

```gherkin
Scenario: Student views an assignment with a description
  Given an assignment exists with a Lexical JSON description
  When the student navigates to the assignment display
  Then the description is rendered as formatted HTML via RichTextRenderer

Scenario: Student views an assignment without a description
  Given an assignment exists with a null description field
  When the student navigates to the assignment display
  Then no description section is rendered
```

---

## 7. Backward Compatibility Scenarios

### AC-COMPAT-01: Plain text content renders correctly

```gherkin
Scenario: Existing plain text lesson renders unchanged
  Given a lesson exists with plain text content "This is a plain text lesson.\nWith line breaks."
  And the content was saved before the Lexical editor was introduced
  When the student navigates to the lesson page
  Then the content is rendered with whitespace-pre-wrap CSS
  And line breaks are preserved as visual line breaks
  And no error is thrown during rendering
```

### AC-COMPAT-02: Plain text content initializes in editor

```gherkin
Scenario: Editing existing plain text content in the Lexical editor
  Given a lesson exists with plain text content "Legacy lesson text"
  When the teacher opens the lesson edit form
  Then the RichTextEditor initializes with "Legacy lesson text" as a paragraph node
  And the teacher can edit and add formatting
  When the teacher saves the form
  Then the content is stored as Lexical JSON
  And viewing the lesson displays the formatted content correctly
```

### AC-COMPAT-03: Empty content handling

```gherkin
Scenario: Empty content string
  Given a content field contains an empty string ""
  When the RichTextRenderer receives the empty string
  Then no content is rendered
  And no error is thrown

Scenario: Null content value
  Given a content field is null (optional field like Assignment.description)
  When the display component checks the field value
  Then the content section is not rendered
  And no error is thrown
```

### AC-COMPAT-04: Malformed JSON handling

```gherkin
Scenario: Corrupted JSON in content field
  Given a content field contains "{invalid json}"
  When the RichTextRenderer attempts to render the content
  Then the content is treated as plain text
  And the raw string "{invalid json}" is displayed with whitespace-pre-wrap
  And no unhandled exception is thrown
```

---

## 8. Security Scenarios

### AC-SEC-01: DOMPurify sanitizes all rendered HTML

```gherkin
Scenario: HTML output passes through DOMPurify
  Given Lexical JSON content containing a heading and bold text
  When the lexicalRenderer converts the JSON to HTML
  Then the output HTML is passed through DOMPurify.sanitize()
  And the sanitized HTML contains only allowlisted tags
  And the sanitized HTML is safe for dangerouslySetInnerHTML
```

### AC-SEC-02: Script tag injection prevented

```gherkin
Scenario: XSS via script tag in content
  Given a content field contains Lexical JSON that has been manually tampered
  And the tampered JSON includes an HTML node with "<script>alert('xss')</script>"
  When the RichTextRenderer renders the content
  Then the <script> tag is stripped from the output
  And the alert function is never executed
  And the remaining content renders normally
```

### AC-SEC-03: Iframe restricted to YouTube only

```gherkin
Scenario: YouTube iframe is preserved
  Given Lexical JSON content containing a YouTubeNode with src "https://www.youtube.com/embed/dQw4w9WgXcQ"
  When the content is rendered through the renderer and DOMPurify
  Then the <iframe> element is preserved in the output
  And the src attribute points to the YouTube embed URL

Scenario: Non-YouTube iframe is stripped
  Given a content field contains HTML with an <iframe> pointing to "https://evil.example.com/payload"
  When the content is rendered through DOMPurify
  Then the <iframe> element is stripped from the output
  And no external content from evil.example.com is loaded
```

### AC-SEC-04: Event handler attributes stripped

```gherkin
Scenario: Inline event handlers removed
  Given a content field contains HTML with <img src="x" onerror="alert('xss')">
  When the content is rendered through DOMPurify
  Then the onerror attribute is stripped
  And the img element may be rendered (if src is valid) or stripped (if src is invalid)
  And no JavaScript is executed
```

### AC-SEC-05: JavaScript URL prevention

```gherkin
Scenario: javascript: URL in link href
  Given a content field contains HTML with <a href="javascript:alert('xss')">Click</a>
  When the content is rendered through DOMPurify
  Then the href attribute value is removed or the link is stripped
  And no JavaScript is executed when interacting with the rendered content
```

---

## 9. Performance Criteria

### AC-PERF-01: Editor bundle size

```gherkin
Scenario: Editor JavaScript bundle is under 150KB gzipped
  Given the application is built with "next build"
  When the build output is analyzed
  Then the Lexical editor chunk is under 150KB gzipped
```

**Verification method:** Run `npx next build` and inspect the build output. Optionally use `@next/bundle-analyzer` to verify chunk sizes.

### AC-PERF-02: Editor load time

```gherkin
Scenario: Editor becomes interactive within 500ms
  Given the user navigates to a page containing the RichTextEditor
  When the dynamic import of the editor begins
  Then the editor is fully interactive (accepts input) within 500ms of the import trigger
```

**Verification method:** Measure time from navigation to first input acceptance in Chrome DevTools Performance tab.

### AC-PERF-03: No editor JavaScript on non-editor pages

```gherkin
Scenario: List pages load without editor JavaScript
  Given the user navigates to a list page (e.g., /list/students)
  When the page JavaScript bundles are inspected
  Then no Lexical-related JavaScript chunks are loaded
  And the page loads without editor overhead
```

**Verification method:** Check Network tab in Chrome DevTools; filter for `lexical` in chunk names.

### AC-PERF-04: Server-side rendering time

```gherkin
Scenario: Renderer completes within 50ms
  Given a Lexical JSON content string of 30KB (typical lesson content)
  When lexicalRenderer.renderContent() is called on the server
  Then the function returns the sanitized HTML in under 50ms
```

**Verification method:** Measure execution time of `renderContent` with `performance.now()` or `console.time()` in a test.

---

## 10. Accessibility Scenarios

### AC-A11Y-01: Editor ARIA attributes

```gherkin
Scenario: Editor content area has correct ARIA roles
  Given the RichTextEditor component is mounted
  Then the content editable area has role="textbox"
  And the content editable area has aria-multiline="true"
  And if a label prop is provided, the area has an associated aria-label or aria-labelledby
```

### AC-A11Y-02: Toolbar keyboard navigation

```gherkin
Scenario: Tab key navigates toolbar buttons
  Given the RichTextEditor component is mounted
  And the focus is on the first toolbar button
  When the user presses Tab
  Then the focus moves to the next toolbar button
  And the focused button has a visible focus indicator
```

### AC-A11Y-03: Toolbar button labels

```gherkin
Scenario: All toolbar buttons have accessible labels
  Given the RichTextEditor component is mounted with variant "full"
  Then every toolbar button has an aria-label attribute
  And the aria-label values are descriptive (e.g., "Bold", "Insert Image", "Heading 1")
```

---

## 11. i18n Scenarios

### AC-I18N-01: Editor uses translation keys

```gherkin
Scenario: Toolbar labels display in the active locale
  Given the application locale is set to "ms" (Malay)
  And the RichTextEditor component is mounted
  Then the toolbar button labels and tooltips are displayed in Malay
  And the placeholder text is displayed in Malay
  And error messages related to the editor are displayed in Malay

Scenario: Editor labels in English locale
  Given the application locale is set to "en"
  And the RichTextEditor component is mounted
  Then all toolbar labels, tooltips, and placeholder text are in English
```

---

## 12. Quality Gate Criteria

### Definition of Done

All of the following must be satisfied before SPEC-EDITOR-001 is considered complete:

#### Functional Completeness

- [ ] All 5 content surfaces (LMS Lesson, Forum Thread, Forum Reply, Announcement, Assignment) use the RichTextEditor for content creation
- [ ] All 5 content surfaces use the RichTextRenderer for content display
- [ ] Both editor variants (`full` and `compact`) are implemented and assigned to the correct surfaces
- [ ] All formatting features listed in Section 4.4 of the spec function correctly per variant

#### Backward Compatibility

- [ ] Existing plain text content renders correctly without data migration
- [ ] The format detection function (`isLexicalJSON`) correctly identifies Lexical JSON vs plain text
- [ ] Editing and saving existing plain text converts it to Lexical JSON (gradual migration)
- [ ] Empty and null content values are handled gracefully without errors

#### Security

- [ ] DOMPurify is applied to ALL HTML output before `dangerouslySetInnerHTML`
- [ ] Script tags and inline event handlers are stripped from rendered content
- [ ] Only YouTube iframe sources are permitted; all other iframe sources are stripped
- [ ] No `javascript:` URLs pass through the sanitizer

#### Performance

- [ ] Editor chunk under 150KB gzipped (verified via build output)
- [ ] Pages without editors load zero Lexical JavaScript (verified via network inspection)
- [ ] Editor interactive within 500ms of dynamic import trigger
- [ ] Server-side rendering under 50ms for typical content

#### Database

- [ ] `@db.Text` annotation applied to 4 existing content fields
- [ ] `Assignment.description` field added as `String? @db.Text`
- [ ] Forum character limits updated (thread: 50,000, reply: 25,000)
- [ ] Migration applies without data loss

#### Accessibility

- [ ] Editor content area has `role="textbox"` and `aria-multiline="true"`
- [ ] All toolbar buttons have `aria-label` attributes
- [ ] Toolbar formatting buttons display `aria-pressed` state
- [ ] Keyboard navigation (Tab) works across toolbar buttons

#### i18n

- [ ] Translation keys added for all editor labels, placeholders, and errors
- [ ] Translations provided for `en` and `ms` locales

#### Code Quality (TRUST 5)

- [ ] **Tested**: Unit tests for `lexicalRenderer.ts`, `lexicalUtils.ts`, and validation schemas; integration tests for editor + form; 85%+ coverage on new code
- [ ] **Readable**: Clear naming, English comments, code under 400 lines per file
- [ ] **Unified**: Consistent with existing project patterns (Container/Client, React Hook Form, Zod validation)
- [ ] **Secured**: DOMPurify sanitization verified, no raw `dangerouslySetInnerHTML` without sanitization
- [ ] **Trackable**: Conventional commits referencing SPEC-EDITOR-001

#### Test Requirements

| Test Category      | Minimum Scenarios | Verification Method        |
|--------------------|-------------------|----------------------------|
| Unit tests         | 15+               | Vitest / Jest              |
| Integration tests  | 8+                | React Testing Library      |
| E2E tests          | 5+                | Playwright                 |
| Security tests     | 5+                | Unit tests with XSS payloads |
| Performance checks | 4                 | Build analysis + profiling |

---

## Traceability Matrix

| Acceptance Criteria | SPEC Requirement(s)                          | Phase |
|---------------------|----------------------------------------------|-------|
| AC-EDITOR-01        | REQ-U-01, REQ-E-01                           | 1     |
| AC-EDITOR-02        | REQ-E-02, REQ-U-07                           | 1     |
| AC-EDITOR-03        | REQ-E-03                                     | 1     |
| AC-EDITOR-04        | REQ-E-08                                     | 1     |
| AC-EDITOR-05        | REQ-E-07                                     | 1     |
| AC-EDITOR-06        | REQ-S-01, REQ-S-02                           | 1     |
| AC-EDITOR-07        | REQ-S-03                                     | 1     |
| AC-LESSON-01        | REQ-FORM-E-01, REQ-U-01                      | 2     |
| AC-LESSON-02        | REQ-FORM-S-01, REQ-FORM-E-01                 | 2     |
| AC-LESSON-03        | REQ-S-04, REQ-U-02                           | 2     |
| AC-FORUM-01         | REQ-FORM-E-02, REQ-S-01, REQ-FORUM-E-01      | 3     |
| AC-FORUM-02         | REQ-S-04                                     | 3     |
| AC-FORUM-03         | REQ-FORUM-E-01                               | 3     |
| AC-REPLY-01         | REQ-FORM-E-03, REQ-FORUM-E-02               | 3     |
| AC-REPLY-02         | REQ-S-04                                     | 3     |
| AC-ANN-01           | REQ-FORM-E-04                                | 4     |
| AC-ANN-02           | REQ-ANN-E-01, REQ-U-02                       | 4     |
| AC-ANN-03           | REQ-FORM-S-01                                | 4     |
| AC-ASSIGN-01        | REQ-FORM-E-05, REQ-ASSIGN-E-01               | 5     |
| AC-ASSIGN-02        | REQ-ASSIGN-O-01                              | 5     |
| AC-ASSIGN-03        | REQ-ASSIGN-E-03, REQ-ASSIGN-O-01             | 5     |
| AC-COMPAT-01        | REQ-S-05                                     | 1     |
| AC-COMPAT-02        | REQ-S-06                                     | 1     |
| AC-COMPAT-03        | REQ-S-05                                     | 1     |
| AC-COMPAT-04        | REQ-S-05                                     | 1     |
| AC-SEC-01           | REQ-SEC-U-01, REQ-SEC-U-02                   | 1     |
| AC-SEC-02           | REQ-SEC-N-01                                 | 1     |
| AC-SEC-03           | REQ-SEC-U-03, REQ-SEC-N-02                   | 1     |
| AC-SEC-04           | REQ-SEC-N-01                                 | 1     |
| AC-SEC-05           | REQ-SEC-N-01                                 | 1     |
| AC-PERF-01          | REQ-PERF-U-01                                | 6     |
| AC-PERF-02          | REQ-PERF-E-01                                | 1     |
| AC-PERF-03          | REQ-PERF-U-02, REQ-U-03                      | 1     |
| AC-PERF-04          | REQ-PERF-E-02                                | 1     |
| AC-A11Y-01          | REQ-A11Y-U-01, REQ-U-06                      | 6     |
| AC-A11Y-02          | REQ-A11Y-U-02                                | 6     |
| AC-A11Y-03          | REQ-U-06                                     | 6     |
| AC-I18N-01          | REQ-I18N-U-01, REQ-I18N-U-02                 | 6     |
