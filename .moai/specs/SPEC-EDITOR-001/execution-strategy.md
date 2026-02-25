# SPEC-EDITOR-001: Execution Strategy

**Created:** 2026-02-25
**Development Mode:** DDD (ANALYZE-PRESERVE-IMPROVE)
**SPEC Version:** 1.0.0
**Status:** Ready for Implementation

---

## 1. Plan Summary

### Overall Approach

Integrate a Lexical-based rich text editor across 5 content surfaces in the Hua Readwise school management system, following the DDD (ANALYZE-PRESERVE-IMPROVE) methodology. The implementation proceeds in 6 phases, with Phase 1 (Foundation) as the critical path that all subsequent phases depend on.

### DDD Methodology Application

Each phase follows the three-step DDD cycle:

1. **ANALYZE**: Read existing code for the target surface, map the current data flow (form -> validation -> server action -> Prisma -> display), identify all caller paths and side effects.
2. **PRESERVE**: Write characterization tests that capture current behavior -- form submission with plain text, content display with `whitespace-pre-wrap`, validation schema acceptance/rejection, server action data flow.
3. **IMPROVE**: Replace textarea/InputField with `RichTextEditorDynamic`, replace plain text display with `RichTextRenderer`, update validation schemas, and verify all characterization tests still pass with the new components.

### Key Architectural Principle

**One shared editor, one shared renderer** -- `RichTextEditor` (with `full`/`compact` variants) and `RichTextRenderer` (with automatic JSON/plain-text detection) are the only two new component APIs. All 5 content surfaces consume these same components, ensuring consistency and reducing maintenance surface.

---

## 2. Requirements

### Core Requirements (from spec.md)

| ID | Category | Description | Priority |
|----|----------|-------------|----------|
| REQ-U-01 | Storage | Store all rich text as Lexical JSON strings in DB | Must |
| REQ-U-02 | Security | Sanitize ALL HTML output through DOMPurify | Must |
| REQ-U-03 | Loading | Load editor client-side only via `next/dynamic` with `ssr: false` | Must |
| REQ-U-04 | API | Editor exposes `onChange` emitting Lexical JSON string | Must |
| REQ-U-05 | Rendering | Renderer handles both Lexical JSON and plain text | Must |
| REQ-S-01/S-02 | Variants | `compact` restricts features; `full` enables all | Must |
| REQ-S-04/S-05 | Compatibility | Auto-detect Lexical JSON vs plain text for rendering | Must |
| REQ-S-06 | Migration | Plain text initializes as paragraph node, converts on save | Must |
| REQ-DB-U-01 | Database | Add `@db.Text` to 4 existing content fields | Must |
| REQ-DB-U-02 | Database | Add `Assignment.description` as `String? @db.Text` | Must |
| REQ-SEC-U-01/N-01/N-02 | Security | DOMPurify allowlist, no scripts, YouTube-only iframes | Must |
| REQ-PERF-U-01 | Performance | Editor chunk under 150KB gzipped | Should |
| REQ-PERF-U-02 | Performance | Zero Lexical JS on pages without editor | Must |
| REQ-I18N-U-01 | i18n | Translation keys for `en` and `ms` locales | Should |
| REQ-A11Y-U-01 | Accessibility | `role="textbox"`, `aria-multiline="true"`, `aria-label` | Should |

### Derived Implementation Requirements

1. **Form Integration Pattern**: Every form must use `setValue("fieldName", json, { shouldValidate: true })` via React Hook Form to bridge the editor's `onChange` to the form state.
2. **Hidden Input Pattern**: A hidden `<input>` carries the JSON value for forms using `register()` (needed where `handleSubmit` directly passes data to server actions).
3. **Character Limit Increases**: Forum threads 10K -> 50K, forum replies 5K -> 25K to accommodate Lexical JSON expansion (3-5x factor).
4. **No Data Migration**: Backward compatibility via runtime detection (`JSON.parse` + `root` key check).

---

## 3. Success Criteria

### Functional Completeness

- [ ] All 5 content surfaces use RichTextEditor for content creation
- [ ] All 5 content surfaces use RichTextRenderer for content display
- [ ] Both `full` and `compact` variants work correctly on their assigned surfaces
- [ ] All formatting features per variant work as specified

### Backward Compatibility

- [ ] Existing plain text content renders correctly (no data migration)
- [ ] `isLexicalJSON()` detection function correctly classifies content
- [ ] Editing plain text converts to Lexical JSON on save (gradual migration)
- [ ] Empty/null/malformed content handled gracefully

### Security

- [ ] DOMPurify sanitizes ALL rendered HTML
- [ ] No `<script>` tags, event handlers, or `javascript:` URLs in output
- [ ] Only `youtube.com/embed/*` iframes permitted

### Performance

- [ ] Editor chunk < 150KB gzipped
- [ ] Zero Lexical JS on non-editor pages
- [ ] Editor interactive within 500ms of dynamic import
- [ ] Server-side rendering under 50ms for typical content

### Quality (TRUST 5)

- [ ] 85%+ test coverage on new code
- [ ] Characterization tests for all 5 modified content surfaces
- [ ] No TypeScript errors (strict mode)
- [ ] No ESLint violations
- [ ] Conventional commits referencing SPEC-EDITOR-001

---

## 4. Effort Estimate

### Complexity Assessment by Phase

| Phase | Name | New Files | Modified Files | Complexity | Estimated Effort |
|-------|------|-----------|---------------|------------|-----------------|
| 1 | Foundation | 14 | 3 | **High** | 40% of total work |
| 2 | LMS Lesson Integration | 0 | 4 | **Medium** | 12% |
| 3 | Forum Integration | 0 | 4 | **Medium** | 15% |
| 4 | Announcement Integration | 0 | 3 | **Medium** | 10% |
| 5 | Assignment Integration | 0 | 3 | **Medium** | 10% |
| 6 | Polish (a11y, i18n, plugins) | 0 | 4+ | **Medium** | 13% |

**Total:** 28 files affected (14 new + 14 modified)

### Complexity Drivers

- **Phase 1 is the hardest** because it involves building the entire Lexical editor from scratch (plugin architecture, toolbar, theme, custom nodes), the server-side renderer with headless Lexical, DOMPurify configuration, and the dynamic import wrapper. All other phases are pattern repetition.
- **Phases 2-5** follow an identical integration pattern: (1) import dynamic editor, (2) replace textarea/InputField, (3) wire onChange to setValue, (4) replace display with RichTextRenderer, (5) update validation schema. This is repetitive work with low novelty.
- **Phase 6** is polish work (i18n keys, accessibility attributes, image/YouTube plugins) that can be partially parallelized.

---

## 5. Implementation Order

### Recommended Execution Sequence

```
Phase 1: Foundation (MUST complete first)
  |
  |-- [1.1] Install dependencies (package.json)
  |-- [1.2] Database schema changes (prisma/schema.prisma + migration)
  |-- [1.3] Create RichTextEditor + EditorToolbar + plugins + theme + nodes
  |-- [1.4] Create RichTextRenderer + lexicalRenderer.ts
  |-- [1.5] Create RichTextEditorDynamic wrapper
  |-- [1.6] Add editor CSS to globals.css
  |-- [1.7] Create lexicalUtils.ts (extractPlainText, truncateContent)
  |-- [1.8] Create barrel export index.ts
  |
  v
Phase 2: LMS Lesson Integration (first integration surface)
  |-- [2.1] ANALYZE: Read LmsLessonForm, lesson display page, actions, schema
  |-- [2.2] PRESERVE: Characterization tests for lesson create/edit/display
  |-- [2.3] IMPROVE: Replace textarea in LmsLessonForm
  |-- [2.4] IMPROVE: Replace display in lesson page
  |-- [2.5] IMPROVE: Update lmsLessonSchema validation
  |
  v
Phase 3: Forum Integration (thread + reply)
  |-- [3.1] ANALYZE: Read ThreadForm, ForumReplyForm, thread page, ForumReplyItem
  |-- [3.2] PRESERVE: Characterization tests for thread/reply create/display
  |-- [3.3] IMPROVE: Replace textarea in ThreadForm (compact variant)
  |-- [3.4] IMPROVE: Replace textarea in ForumReplyForm (compact variant)
  |-- [3.5] IMPROVE: Replace display in thread page + ForumReplyItem
  |-- [3.6] IMPROVE: Update forumValidationSchemas (50K/25K limits)
  |
  v
Phase 4: Announcement Integration
  |-- [4.1] ANALYZE: Read AnnouncementForm, Announcements.tsx, actions
  |-- [4.2] PRESERVE: Characterization tests for announcement create/display
  |-- [4.3] IMPROVE: Replace InputField with RichTextEditor (full variant)
  |-- [4.4] IMPROVE: Replace plain text display in Announcements.tsx
  |-- [4.5] IMPROVE: Update announcementSchema (add max limit)
  |
  v
Phase 5: Assignment Integration
  |-- [5.1] ANALYZE: Read AssignmentForm, assignment display, actions
  |-- [5.2] PRESERVE: Characterization tests for assignment create/display
  |-- [5.3] IMPROVE: Add RichTextEditor for new description field
  |-- [5.4] IMPROVE: Add RichTextRenderer to assignment display
  |-- [5.5] IMPROVE: Update assignmentSchema (add description field)
  |-- [5.6] IMPROVE: Update createAssignment/updateAssignment server actions
  |
  v
Phase 6: Polish and Cross-Cutting
  |-- [6.1] Image plugin refinement (URL-based insertion)
  |-- [6.2] YouTube embed plugin (URL validation, responsive iframe)
  |-- [6.3] Accessibility: aria-label, aria-pressed, role, keyboard nav
  |-- [6.4] i18n: Add translation keys to en.json and ms.json
  |-- [6.5] Bundle size verification and optimization
```

### Rationale for Sequence

1. **Phase 1 first**: All other phases depend on the foundation components.
2. **LMS Lesson second**: It is the most representative surface (full variant, existing textarea, standard form pattern). Validates the integration pattern before applying it to other surfaces.
3. **Forums third**: Tests the compact variant and has the most complex integration (two forms: ThreadForm + ForumReplyForm, plus ThreadPage + ForumReplyItem displays).
4. **Announcements fourth**: Tests the transition from a single-line InputField to a full rich text editor (biggest UI change). Also requires layout handling for announcement cards.
5. **Assignments fifth**: Tests adding a brand new optional field (description) that does not exist in the current schema, requiring server action updates.
6. **Polish last**: Cross-cutting concerns (a11y, i18n, bundle verification) after all surfaces are integrated.

### Parallelization Opportunities

Phases 2, 3, 4, and 5 are **independent of each other** and can theoretically be parallelized after Phase 1. However, in DDD mode, each phase should be completed sequentially to maintain clear characterization test boundaries. If using Agent Teams, assign each surface to a different teammate with file ownership.

---

## 6. Risk Mitigation

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Lexical ^0.40.0 incompatible with React 19 | Low | Critical | Verify compatibility before Phase 1. Lexical 0.40+ supports React 19. If issues found, test with latest 0.39.x as fallback. |
| Editor bundle exceeds 150KB gzip target | Medium | Medium | Use `next/bundle-analyzer` after Phase 1 to measure. If over budget, tree-shake unused plugins or split the full variant plugins into separate chunks. |
| DOMPurify server-side import fails (no DOM) | Medium | High | DOMPurify 3.x supports `isomorphic-dompurify` or can use `dompurify` with `jsdom` for server. However, our `lexicalRenderer.ts` runs in Node.js -- verify DOMPurify works with `@lexical/headless` which provides its own DOM. Import DOMPurify dynamically or use the `dompurify/dist/purify.cjs` entry. |
| Lexical headless rendering fails in Next.js server environment | Low | High | `@lexical/headless` creates a minimal DOM. Test in isolation first (Phase 1 Task 1.4). If it fails, fall back to client-side rendering for the renderer (defeats the purpose but is a safety net). |
| React Hook Form `setValue` does not trigger Zod validation | Low | Medium | The `{ shouldValidate: true }` option handles this. Verify in Phase 2 characterization tests. |
| Plain text detection gives false positives on JSON-like content | Low | Medium | The detection checks for `JSON.parse` success AND a `root` key. User content starting with `{` but lacking `root` key will correctly be treated as plain text. |
| Forum character limit increase causes Prisma query performance issues | Low | Low | PostgreSQL TEXT type is unbounded. 50K characters is negligible for modern databases. No performance concern. |
| Prisma migration alters existing columns destructively | Low | High | The `@db.Text` annotation change on PostgreSQL is typically a no-op (already uses `text` type). Always review generated migration SQL with `prisma migrate dev --create-only` before applying. |

### Operational Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Phase 1 takes too long, blocking all other phases | Medium | High | Break Phase 1 into smaller tasks. Start with a minimal viable editor (bold/italic/lists only) and add advanced features (tables, images, YouTube) in Phase 6. |
| Existing content breaks after deployment | Low | Critical | The backward compatibility strategy (auto-detect plain text vs JSON) ensures zero data migration. Add explicit test cases for both content types. |
| Token budget exceeded during implementation | Medium | Medium | Phase 1 is the largest phase. Execute `/clear` after Phase 1. Each subsequent phase is small enough for a single session. |

### DOMPurify Server-Side Strategy

This is the most likely technical obstacle. Options in order of preference:

1. **Primary**: Use `dompurify` with the JSDOM environment that `@lexical/headless` creates. Test this in Phase 1 Task 1.4.
2. **Fallback A**: Use `isomorphic-dompurify` which bundles JSDOM internally.
3. **Fallback B**: Use `sanitize-html` as an alternative sanitizer (different API but same result).
4. **Fallback C**: Perform sanitization on the client side only (acceptable since `@lexical/headless` generates controlled HTML, but weakens the defense-in-depth model).

---

## 7. Dependency Analysis

### External Dependencies (New Packages)

| Package | Version | Risk | Notes |
|---------|---------|------|-------|
| `lexical` | `^0.40.0` | Low | Core engine, well-maintained by Meta |
| `@lexical/react` | `^0.40.0` | Low | Official React bindings |
| `@lexical/headless` | `^0.40.0` | Medium | Server-side rendering, less widely used |
| `@lexical/rich-text` | `^0.40.0` | Low | Standard plugin |
| `@lexical/list` | `^0.40.0` | Low | Standard plugin |
| `@lexical/link` | `^0.40.0` | Low | Standard plugin |
| `@lexical/code` | `^0.40.0` | Low | Standard plugin |
| `@lexical/table` | `^0.40.0` | Low | Standard plugin |
| `@lexical/html` | `^0.40.0` | Low | HTML export utility |
| `@lexical/selection` | `^0.40.0` | Low | Selection utilities |
| `@lexical/utils` | `^0.40.0` | Low | General utilities |
| `dompurify` | `^3.3.1` | Medium | Server-side usage needs testing |
| `@types/dompurify` | `^3.2.0` | Low | TypeScript definitions only |

**Critical constraint**: ALL `@lexical/*` packages MUST use the exact same version to avoid internal incompatibilities.

### Internal Dependencies (Between Phases)

```
Phase 1 ──────────────────────────────────────────┐
  [1.1 Install deps]                               |
       |                                           |
  [1.2 DB schema] ──────────────────────┐          |
       |                                |          |
  [1.3 Editor component] ─── depends on 1.1       |
       |                                |          |
  [1.4 Renderer] ─── depends on 1.1    |          |
       |                                |          |
  [1.5 Dynamic wrapper] ─── depends on 1.3        |
       |                                |          |
  [1.6 CSS] ─── depends on 1.3         |          |
       |                                |          |
  [1.7 Utils] ─── depends on 1.1       |          |
       |                                |          |
  [1.8 Barrel export] ─── depends on all above     |
                                        |          |
Phase 2 ─── depends on 1.3, 1.4, 1.5 ──|          |
Phase 3 ─── depends on 1.3, 1.4, 1.5 ──|          |
Phase 4 ─── depends on 1.3, 1.4, 1.5 ──|          |
Phase 5 ─── depends on 1.2, 1.3, 1.4, 1.5 (needs Assignment.description field)
Phase 6 ─── depends on Phases 1-5 (polish after all surfaces integrated)
```

### File Dependency Map

**Files that will be created** (no conflicts possible -- all new):

```
src/components/editor/
  index.ts
  RichTextEditor.tsx
  RichTextEditorDynamic.tsx
  RichTextRenderer.tsx
  EditorToolbar.tsx
  theme.ts
  nodes.ts
  plugins/ToolbarPlugin.tsx
  plugins/ImagePlugin.tsx
  plugins/YouTubePlugin.tsx
  plugins/CodeHighlightPlugin.tsx
src/lib/lexicalRenderer.ts
src/lib/lexicalUtils.ts
prisma/migrations/*_add_rich_text_support/migration.sql
```

**Files that will be modified** (potential conflict zones):

| File | Phase | Change Type | Risk |
|------|-------|-------------|------|
| `package.json` | 1 | Add dependencies | Low (additive) |
| `prisma/schema.prisma` | 1 | Add `@db.Text` + new field | Low (additive) |
| `src/app/globals.css` | 1 | Add editor CSS classes | Low (append-only) |
| `src/components/forms/LmsLessonForm.tsx` | 2 | Replace textarea block | Medium |
| `src/app/(dashboard)/list/courses/[id]/lesson/[lessonId]/page.tsx` | 2 | Replace content display | Low |
| `src/lib/formValidationSchemas.ts` | 2, 4, 5 | Update schemas | Medium (multi-phase) |
| `src/components/forms/ThreadForm.tsx` | 3 | Replace textarea block | Medium |
| `src/components/ForumReplyForm.tsx` | 3 | Replace textarea block | Medium |
| `src/app/(dashboard)/list/courses/[id]/forum/[threadId]/page.tsx` | 3 | Replace content display | Low |
| `src/components/ForumReplyItem.tsx` | 3 | Replace content display | Low |
| `src/lib/forumValidationSchemas.ts` | 3 | Increase limits | Low |
| `src/components/forms/AnnouncementForm.tsx` | 4 | Replace InputField | Medium |
| `src/components/Announcements.tsx` | 4 | Replace text display | Medium |
| `src/components/forms/AssignmentForm.tsx` | 5 | Add new editor field | Medium |
| `src/lib/actions.ts` | 5 | Add description to assignment actions | Low |
| `messages/en.json` | 6 | Add editor i18n keys | Low |
| `messages/ms.json` | 6 | Add editor i18n keys | Low |

---

## 8. DDD Phase Details

### Phase 1: Foundation

**ANALYZE:**
- Read `package.json` for existing dependencies (React 19, Next.js 16, Prisma 5.19+)
- Read `prisma/schema.prisma` for current field types (confirm no existing `@db.Text` on content fields)
- Read `src/app/globals.css` for existing CSS architecture (Tailwind v4 with `@theme` block)
- Verify no existing `src/components/editor/` directory exists (confirmed: does not exist)
- Verify no existing test infrastructure (confirmed: no `*.test.*` files in `src/`)

**PRESERVE:**
- No existing behavior to characterize for the new editor components (they are entirely new)
- However, create characterization tests for the **rendering** of existing plain text content to ensure backward compatibility
- Create test for `isLexicalJSON()` detection function against known plain text patterns found in the database

**IMPROVE:**
- Install 13 Lexical packages + DOMPurify + @types/dompurify
- Create all 14 new files in `src/components/editor/` and `src/lib/`
- Add `@db.Text` annotations to 4 fields + add `Assignment.description`
- Run `prisma migrate dev --name add-rich-text-support`
- Add editor CSS classes to `globals.css`

### Phase 2: LMS Lesson Integration

**ANALYZE (current behavior):**
- `LmsLessonForm.tsx` (183 lines): Uses `<textarea {...register("content")}` at lines 159-170. Standard React Hook Form pattern with `register()`.
- Lesson display at `lesson/[lessonId]/page.tsx` (213 lines): Renders with `<div className="whitespace-pre-wrap text-gray-700 leading-relaxed">{lesson.content}</div>` at lines 187-190.
- `lmsLessonSchema.content`: Validates as `z.string().min(1, { message: "contentRequired" })` -- no max limit.
- Server actions `createLmsLesson`/`updateLmsLesson`: Store `content` as string via Prisma. No structural changes needed.

**PRESERVE (characterization tests):**
1. Test that LmsLessonForm renders a textarea for content input
2. Test that lesson display page renders plain text with whitespace-pre-wrap
3. Test that lmsLessonSchema accepts non-empty strings
4. Test that lmsLessonSchema rejects empty strings

**IMPROVE:**
1. In `LmsLessonForm.tsx`: Replace textarea block (lines 157-170) with `RichTextEditorDynamic` + hidden input pattern
2. In lesson page: Replace `whitespace-pre-wrap` div (lines 187-190) with `<RichTextRenderer content={lesson.content} />`
3. In `formValidationSchemas.ts`: No change needed (already accepts any non-empty string)

### Phase 3: Forum Integration

**ANALYZE (current behavior):**
- `ThreadForm.tsx` (119 lines): Uses `<textarea {...register("content")} rows={5}` at lines 78-86. Uses `reset()` on success.
- `ForumReplyForm.tsx` (123 lines): Uses `<textarea {...register("content")} rows={3}` at lines 75-83.
- `ForumReplyItem.tsx` (228 lines): Renders with `<p className="text-sm text-gray-700 whitespace-pre-wrap mb-3">{reply.content}</p>` at line 149.
- Thread page (276 lines): Renders with `<p className="text-sm text-gray-700 whitespace-pre-wrap">{thread.content}</p>` at line 222.
- `forumValidationSchemas.ts`: Thread content max 10,000 chars, reply max 5,000 chars.

**PRESERVE (characterization tests):**
1. Test ThreadForm renders textarea and submits content as string
2. Test ForumReplyForm renders textarea and submits content as string
3. Test ForumReplyItem renders content with whitespace-pre-wrap
4. Test thread page renders thread content with whitespace-pre-wrap
5. Test threadSchema.content max(10000) accepts/rejects at boundary
6. Test replySchema.content max(5000) accepts/rejects at boundary

**IMPROVE:**
1. `ThreadForm.tsx`: Replace textarea with `RichTextEditorDynamic` (compact variant). Need to add `setValue` since currently using `register()`. Handle `reset()` for editor state.
2. `ForumReplyForm.tsx`: Replace textarea with `RichTextEditorDynamic` (compact variant). Handle `reset()`.
3. Thread page line 222: Replace `<p>` with `<RichTextRenderer content={thread.content} />`
4. `ForumReplyItem.tsx` line 149: Replace `<p>` with `<RichTextRenderer content={reply.content} />`
5. `forumValidationSchemas.ts`: Increase thread content to 50,000, reply to 25,000. Update all 4 schemas (create+update for both).

**Special considerations:**
- ThreadForm and ForumReplyForm currently use `register("content")` which directly binds to the textarea. Switching to `RichTextEditorDynamic` requires using `setValue()` instead, since the editor is not a native form element. This changes the form integration pattern.
- Both forms use `reset()` on success. The editor needs to be reset too -- either via a `key` prop change or by exposing a reset method.

### Phase 4: Announcement Integration

**ANALYZE (current behavior):**
- `AnnouncementForm.tsx` (136 lines): Uses `<InputField label={t("labels.description")} name="description" .../>` at lines 80-86. This is a **single-line text input**, not a textarea.
- `Announcements.tsx` (76 lines): Server component. Renders `<p className="text-sm text-gray-400 mt-1">{data[0].description}</p>` at lines 46, 57, 68.
- `announcementSchema.description`: `z.string().min(1, { message: "descriptionRequired" })` -- no max limit.
- Server actions: `createAnnouncement`/`updateAnnouncement` store `description` as string.

**PRESERVE (characterization tests):**
1. Test AnnouncementForm renders InputField for description
2. Test Announcements component renders description as plain text
3. Test announcementSchema accepts non-empty strings, rejects empty

**IMPROVE:**
1. `AnnouncementForm.tsx`: Replace InputField (lines 80-86) with `RichTextEditorDynamic` (full variant). This is the biggest UI change -- going from a single-line input to a multi-line rich text editor.
2. `Announcements.tsx`: Replace `<p>` elements (lines 46, 57, 68) with `<RichTextRenderer content={data[N].description} />`. Add max-height overflow handling for card layout.
3. `formValidationSchemas.ts`: Add reasonable max limit: `.max(100000)`.

**Special consideration:** The Announcements component is a Server Component. `RichTextRenderer` is also designed as a Server Component, so no `"use client"` boundary is needed. This is a natural fit.

### Phase 5: Assignment Integration

**ANALYZE (current behavior):**
- `AssignmentForm.tsx` (136 lines): Has title, startDate, dueDate, lessonId fields. **No description field exists**.
- `Assignment` model in Prisma: Has id, title, startDate, dueDate, lessonId. **No description field**.
- `assignmentSchema`: Has id, title, startDate, dueDate, lessonId. **No description field**.
- `createAssignment`/`updateAssignment` in `actions.ts`: Prisma create/update with title, startDate, dueDate, lessonId. **No description**.
- Assignment display page (`/list/assignments/page.tsx`): Need to verify current rendering.

**PRESERVE (characterization tests):**
1. Test AssignmentForm renders with existing fields (no description)
2. Test createAssignment server action succeeds without description
3. Test updateAssignment server action succeeds without description
4. Test assignmentSchema validates existing fields correctly

**IMPROVE:**
1. `prisma/schema.prisma`: `Assignment.description` field already added in Phase 1.
2. `AssignmentForm.tsx`: Add `RichTextEditorDynamic` for description (full variant, optional field).
3. `formValidationSchemas.ts`: Add `description: z.string().max(100000).optional().or(z.literal(""))` to assignmentSchema.
4. `actions.ts`: Add `description: data.description` to both `createAssignment` and `updateAssignment` Prisma calls.
5. Assignment display: Add conditional `<RichTextRenderer>` rendering.

### Phase 6: Polish

**Tasks (no DDD cycle needed -- these are additive features):**
1. Image plugin: Implement URL-based image insertion with validation
2. YouTube plugin: Implement URL validation, video ID extraction, responsive iframe node
3. Accessibility: Add `aria-label` to all toolbar buttons, `aria-pressed` for active states, `role="textbox"` + `aria-multiline="true"` to editor area, Tab key navigation
4. i18n: Add 20+ translation keys to `messages/en.json` and `messages/ms.json` under an `editor` namespace
5. Bundle verification: Run `npx next build` and verify chunk sizes

---

## 9. Task Decomposition for DDD Agent

### Atomic Task List

| Task ID | Phase | Description | Dependencies | Acceptance Criteria |
|---------|-------|-------------|--------------|---------------------|
| TASK-001 | 1 | Install Lexical + DOMPurify dependencies | None | `npm install` succeeds, `package.json` updated |
| TASK-002 | 1 | Update Prisma schema: @db.Text + Assignment.description | None | `prisma migrate dev` succeeds without data loss |
| TASK-003 | 1 | Create editor theme.ts + nodes.ts | TASK-001 | Theme maps CSS classes, nodes registers all custom types |
| TASK-004 | 1 | Create RichTextEditor.tsx + EditorToolbar.tsx | TASK-001, TASK-003 | Editor mounts, onChange emits Lexical JSON, both variants work |
| TASK-005 | 1 | Create ToolbarPlugin.tsx | TASK-004 | Toolbar state syncs with editor selection, buttons toggle formatting |
| TASK-006 | 1 | Create lexicalRenderer.ts + RichTextRenderer.tsx | TASK-001 | Renders Lexical JSON to sanitized HTML, plain text with pre-wrap |
| TASK-007 | 1 | Create RichTextEditorDynamic.tsx | TASK-004 | Dynamic import works, loading skeleton shows, SSR disabled |
| TASK-008 | 1 | Create lexicalUtils.ts (extractPlainText, truncateContent) | TASK-001 | Extracts text from JSON, truncates with ellipsis |
| TASK-009 | 1 | Add editor CSS to globals.css + barrel export index.ts | TASK-004 | All editor elements styled correctly |
| TASK-010 | 2 | LMS Lesson: Replace textarea with editor + update display | TASK-004-009 | AC-LESSON-01/02/03 pass |
| TASK-011 | 3 | Forum Thread: Replace textarea with compact editor + display | TASK-004-009 | AC-FORUM-01/02 pass |
| TASK-012 | 3 | Forum Reply: Replace textarea with compact editor + display | TASK-004-009 | AC-REPLY-01/02 pass |
| TASK-013 | 3 | Update forum validation schemas (50K/25K limits) | TASK-011 | AC-FORUM-03 pass |
| TASK-014 | 4 | Announcement: Replace InputField with editor + update display | TASK-004-009 | AC-ANN-01/02/03 pass |
| TASK-015 | 5 | Assignment: Add description field + editor + display + actions | TASK-002, TASK-004-009 | AC-ASSIGN-01/02/03 pass |
| TASK-016 | 6 | Image + YouTube plugins implementation | TASK-004 | Image/YouTube insertion works in full variant |
| TASK-017 | 6 | Accessibility (ARIA attributes, keyboard nav) | TASK-004 | AC-A11Y-01/02/03 pass |
| TASK-018 | 6 | i18n translation keys for en/ms | TASK-004 | AC-I18N-01 pass |

---

## 10. Context Management Notes

### Token Budget Strategy

- **Phase 1 (Foundation)**: This is the largest phase. Expect to consume most of the 180K token budget. Execute `/clear` after Phase 1 if context is heavy.
- **Phases 2-5**: Each phase modifies 3-4 files following the same pattern. Target 20-30K tokens per phase.
- **Phase 6**: Polish work, 20-30K tokens.

### File Loading Strategy

- Load editor component files only when working on Phase 1
- For Phases 2-5, load only the specific form + display + schema files for that surface
- Never load all modified files at once -- use targeted reads

### Key Files to Read Before Each Phase

| Phase | Must Read |
|-------|-----------|
| 1 | `package.json`, `prisma/schema.prisma`, `globals.css` |
| 2 | `LmsLessonForm.tsx`, `lesson/[lessonId]/page.tsx`, `formValidationSchemas.ts` |
| 3 | `ThreadForm.tsx`, `ForumReplyForm.tsx`, `forum/[threadId]/page.tsx`, `ForumReplyItem.tsx`, `forumValidationSchemas.ts` |
| 4 | `AnnouncementForm.tsx`, `Announcements.tsx`, `formValidationSchemas.ts` |
| 5 | `AssignmentForm.tsx`, `assignments/page.tsx`, `formValidationSchemas.ts`, `actions.ts` (lines 693-772) |
| 6 | Editor plugin files, `messages/en.json`, `messages/ms.json` |

---

## 11. Critical Path Analysis

The critical path is:

```
TASK-001 (deps) -> TASK-003 (theme/nodes) -> TASK-004 (editor) -> TASK-005 (toolbar) -> TASK-007 (dynamic)
                                                |
                                           TASK-006 (renderer)
                                                |
                                           TASK-009 (CSS/export)
                                                |
                                           TASK-010 (LMS Lesson -- validates integration pattern)
                                                |
                                 +---------+----+-----+---------+
                                 |         |          |         |
                              TASK-011  TASK-014   TASK-015  TASK-016
                              TASK-012                       TASK-017
                              TASK-013                       TASK-018
```

**Bottleneck**: TASK-004 (RichTextEditor creation) is the single largest task and the critical dependency for everything else. Breaking it into sub-tasks:
- Core editor with LexicalComposer + RichTextPlugin + HistoryPlugin + OnChangePlugin
- Toolbar with basic formatting (bold/italic/underline/strikethrough)
- List support (ordered/unordered)
- Link support
- Heading support (full variant only)
- Table support (full variant only)
- Code block support

Start with a minimal viable editor (first 4 items), then add advanced features.

---

## 12. Summary Recommendation

**Proceed with implementation** following the phased DDD approach. The SPEC is well-defined with clear requirements, acceptance criteria, and a sound architectural design. The main technical risk is DOMPurify server-side compatibility, which should be validated immediately in Phase 1 Task 1.6 (lexicalRenderer.ts).

The recommended approach is:
1. Start Phase 1 with dependency installation and a minimal viable editor
2. Validate the integration pattern end-to-end in Phase 2 (LMS Lessons)
3. Apply the validated pattern to remaining surfaces (Phases 3-5)
4. Polish with accessibility, i18n, and advanced plugins (Phase 6)
