# SPEC-GUIDE-001: Implementation Plan

| Field | Value          |
| ----- | -------------- |
| id    | SPEC-GUIDE-001 |
| phase | plan           |
| tags  | guide, help, knowledge-base, tour, driver.js |

---

## Overview

This plan implements a Help and Knowledge Base System for the Hua Readwise school management system. The implementation follows the DDD (ANALYZE-PRESERVE-IMPROVE) methodology: first analyzing existing patterns (Container/Presenter, FormModal, Server Actions), then preserving existing behavior, then adding the new guide feature incrementally across 7 milestones.

This SPEC depends on SPEC-I18N-001 (next-intl multi-language infrastructure) being completed first.

---

## TAG-1: Database Schema and Seed Data (Priority High)

**Goal**: Add Guide, GuideTranslation, and GuideCategory models to Prisma schema, run migration, and seed initial data.

### Tasks

| #   | Task                                                      | File                      | Depends On |
| --- | --------------------------------------------------------- | ------------------------- | ---------- |
| 1.1 | Add `GuideCategory` model with slug, nameEn, nameMs, order | `prisma/schema.prisma`   | -          |
| 1.2 | Add `Guide` model with all fields, indexes, and relations  | `prisma/schema.prisma`   | 1.1        |
| 1.3 | Add `GuideTranslation` model with unique constraint        | `prisma/schema.prisma`   | 1.2        |
| 1.4 | Run `npx prisma migrate dev --name add_guide_models`       | CLI                      | 1.1-1.3    |
| 1.5 | Run `npx prisma generate` to regenerate client types       | CLI                      | 1.4        |
| 1.6 | Add seed data: 5 default categories with en/ms names       | `prisma/seed.ts` (or similar) | 1.5   |
| 1.7 | Add seed data: 3-5 sample guides per role with en/ms translations | `prisma/seed.ts`  | 1.6        |
| 1.8 | Run seed script and verify data in database                | CLI                      | 1.7        |

### Seed Categories

| Slug               | nameEn                    | nameMs                   | order |
| ------------------- | ------------------------- | ------------------------ | ----- |
| getting-started     | Getting Started           | Mula Di Sini             | 1     |
| school-management   | School Management         | Pengurusan Sekolah       | 2     |
| lms-courses         | LMS & Courses             | LMS & Kursus             | 3     |
| assessments-quizzes | Assessments & Quizzes     | Penilaian & Kuiz         | 4     |
| for-parents         | For Parents               | Untuk Ibu Bapa           | 5     |

### Files to Create/Modify

| File                    | Action  | Description                                    |
| ----------------------- | ------- | ---------------------------------------------- |
| `prisma/schema.prisma`  | Modify  | Add 3 new models (GuideCategory, Guide, GuideTranslation) |
| `prisma/seed.ts`        | Modify  | Add category and guide seed data               |

### Verification

- `npx prisma validate` passes without errors
- Migration applies cleanly
- Seed data creates 5 categories and 15-25 sample guides
- Prisma client types include `Guide`, `GuideTranslation`, `GuideCategory`
- Existing models and relations remain unaffected

---

## TAG-2: Server Actions and Validation (Priority High)

**Goal**: Implement all guide Server Actions with Zod validation and multi-role authorization.

### Tasks

| #   | Task                                                      | File                                  | Depends On |
| --- | --------------------------------------------------------- | ------------------------------------- | ---------- |
| 2.1 | Add `guideSchema` Zod schema for guide form validation     | `src/lib/formValidationSchemas.ts`   | TAG-1      |
| 2.2 | Add `guideCategorySchema` Zod schema for category form     | `src/lib/formValidationSchemas.ts`   | TAG-1      |
| 2.3 | Create `src/lib/guideActions.ts` with `getGuides` action   | `src/lib/guideActions.ts`            | 2.1        |
| 2.4 | Implement `getGuideById` action                            | `src/lib/guideActions.ts`            | 2.3        |
| 2.5 | Implement `createGuide` action with dual-locale translations | `src/lib/guideActions.ts`          | 2.1        |
| 2.6 | Implement `updateGuide` action with translation upsert     | `src/lib/guideActions.ts`            | 2.5        |
| 2.7 | Implement `deleteGuide` action with cascade                | `src/lib/guideActions.ts`            | 2.3        |
| 2.8 | Implement `createCategory` action (admin only)             | `src/lib/guideActions.ts`            | 2.2        |
| 2.9 | Implement `updateCategory` action (admin only)             | `src/lib/guideActions.ts`            | 2.8        |
| 2.10 | Implement `deleteCategory` action (admin only)            | `src/lib/guideActions.ts`            | 2.8        |

### Authorization Rules

| Action         | Admin                | Teacher                       | Student/Parent |
| -------------- | -------------------- | ----------------------------- | -------------- |
| getGuides      | All (incl. unpublished) | Published + own unpublished | Published only (role-filtered) |
| getGuideById   | Any guide            | Published + own unpublished   | Published only (role-filtered) |
| createGuide    | Allowed              | Allowed (sets own authorId)   | Denied         |
| updateGuide    | Any guide            | Own guides only               | Denied         |
| deleteGuide    | Any guide            | Own guides only               | Denied         |
| createCategory | Allowed              | Denied                        | Denied         |
| updateCategory | Allowed              | Denied                        | Denied         |
| deleteCategory | Allowed              | Denied                        | Denied         |

### Files to Create/Modify

| File                                | Action  | Description                                      |
| ----------------------------------- | ------- | ------------------------------------------------ |
| `src/lib/formValidationSchemas.ts`  | Modify  | Add guideSchema and guideCategorySchema           |
| `src/lib/guideActions.ts`           | Create  | All 8 server actions with authorization           |

### Verification

- All server actions compile without TypeScript errors
- Each action validates input with Zod before database access
- Admin can CRUD all guides and categories
- Teacher can create guides and edit/delete only own guides
- Teacher cannot create/edit/delete categories
- Student and parent cannot access any write actions
- Server actions return `{ success: boolean; error: boolean; message?: string }`

---

## TAG-3: Guide Listing Page (Priority High)

**Goal**: Build the guide listing page with role-filtered cards, search, and category filter.

### Tasks

| #   | Task                                                      | File                                              | Depends On |
| --- | --------------------------------------------------------- | ------------------------------------------------- | ---------- |
| 3.1 | Create guide listing page (Server Component)               | `src/app/(dashboard)/list/guides/page.tsx`        | TAG-2      |
| 3.2 | Create GuideList component (guide cards grid)              | `src/components/GuideList.tsx`                     | 3.1        |
| 3.3 | Create GuideCard component (title, category, excerpt, author) | `src/components/GuideCard.tsx`                 | 3.2        |
| 3.4 | Implement search functionality (query parameter)           | `src/app/(dashboard)/list/guides/page.tsx`        | 3.1        |
| 3.5 | Implement category filter dropdown                         | `src/app/(dashboard)/list/guides/page.tsx`        | 3.1        |
| 3.6 | Add `/list/guides` to `routeAccessMap` (all 4 roles)      | `src/lib/settings.ts`                             | -          |
| 3.7 | Add "Guides" menu item to Menu.tsx (all 4 roles)           | `src/components/Menu.tsx`                          | -          |
| 3.8 | Apply next-intl translations for all UI text               | `messages/en.json`, `messages/ms.json`            | TAG-2      |

### Files to Create/Modify

| File                                              | Action  | Description                                |
| ------------------------------------------------- | ------- | ------------------------------------------ |
| `src/app/(dashboard)/list/guides/page.tsx`        | Create  | Server Component with search and filter    |
| `src/components/GuideList.tsx`                     | Create  | Grid layout rendering GuideCard components |
| `src/components/GuideCard.tsx`                     | Create  | Card with title, category, excerpt, author |
| `src/lib/settings.ts`                             | Modify  | Add guide routes to routeAccessMap         |
| `src/components/Menu.tsx`                          | Modify  | Add Guides menu item                       |
| `messages/en.json`                                | Modify  | Add guide page translations (en)           |
| `messages/ms.json`                                | Modify  | Add guide page translations (ms)           |

### Verification

- Admin sees all guides (published and unpublished)
- Teacher sees published guides + own unpublished guides
- Student sees only published guides with student in roleAccess
- Parent sees only published guides with parent in roleAccess
- Search filters by title and content in the active locale
- Category filter shows only guides of the selected category
- Guides are sorted by category order, then guide order
- "Guides" appears in sidebar menu for all roles
- Pagination works correctly with `ITEM_PER_PAGE`

---

## TAG-4: Guide Detail Page (Priority High)

**Goal**: Build the guide detail page with Markdown rendering and locale-aware content.

### Tasks

| #   | Task                                                      | File                                                   | Depends On |
| --- | --------------------------------------------------------- | ------------------------------------------------------ | ---------- |
| 4.1 | Create guide detail page (Server Component)                | `src/app/(dashboard)/list/guides/[id]/page.tsx`       | TAG-3      |
| 4.2 | Create GuideDetail component (Markdown renderer)           | `src/components/GuideDetail.tsx`                       | 4.1        |
| 4.3 | Install and configure react-markdown and remark-gfm        | `package.json`                                         | -          |
| 4.4 | Implement locale-aware content display                     | `src/components/GuideDetail.tsx`                       | 4.2        |
| 4.5 | Add breadcrumb navigation (Guides > Category > Title)      | `src/components/GuideDetail.tsx`                       | 4.2        |
| 4.6 | Add `/list/guides/[id]` to `routeAccessMap` (all 4 roles) | `src/lib/settings.ts`                                  | -          |
| 4.7 | Add next-intl translations for detail page UI text         | `messages/en.json`, `messages/ms.json`                 | TAG-3      |

### Files to Create/Modify

| File                                                   | Action  | Description                                      |
| ------------------------------------------------------ | ------- | ------------------------------------------------ |
| `src/app/(dashboard)/list/guides/[id]/page.tsx`       | Create  | Server Component loading guide by ID             |
| `src/components/GuideDetail.tsx`                       | Create  | Full article renderer with Markdown + breadcrumb |
| `src/lib/settings.ts`                                  | Modify  | Add guide detail route to routeAccessMap         |
| `messages/en.json`                                     | Modify  | Add detail page translations                     |
| `messages/ms.json`                                     | Modify  | Add detail page translations                     |

### Verification

- Guide articles render Markdown correctly (headings, lists, images, code blocks, links)
- When locale is `en`, English translation content is displayed
- When locale is `ms`, Bahasa Malaysia translation content is displayed
- If `ms` translation is missing, English fallback is used
- Breadcrumb shows "Guides > Category Name > Article Title"
- Non-existent guide ID returns 404
- Users cannot access guides outside their role's visibility

---

## TAG-5: Guide Form and Admin/Teacher CRUD (Priority Medium)

**Goal**: Build the GuideForm for creating and editing guides, and the GuideCategoryForm for admin category management.

### Tasks

| #   | Task                                                      | File                                              | Depends On |
| --- | --------------------------------------------------------- | ------------------------------------------------- | ---------- |
| 5.1 | Create GuideForm component (dual-locale editing)           | `src/components/forms/GuideForm.tsx`              | TAG-2      |
| 5.2 | Integrate GuideForm with FormModal and FormContainer       | `src/components/forms/GuideForm.tsx`              | 5.1        |
| 5.3 | Add title, excerpt, content fields for both en and ms      | `src/components/forms/GuideForm.tsx`              | 5.1        |
| 5.4 | Add category selector dropdown                             | `src/components/forms/GuideForm.tsx`              | 5.1        |
| 5.5 | Add role access multi-select (checkboxes)                  | `src/components/forms/GuideForm.tsx`              | 5.1        |
| 5.6 | Add publish toggle                                         | `src/components/forms/GuideForm.tsx`              | 5.1        |
| 5.7 | Add tour steps JSON editor (textarea, optional)            | `src/components/forms/GuideForm.tsx`              | 5.1        |
| 5.8 | Implement teacher restriction (can only see/edit own)      | `src/components/forms/GuideForm.tsx`              | 5.2        |
| 5.9 | Create GuideCategoryForm component (admin only)            | `src/components/forms/GuideCategoryForm.tsx`      | TAG-2      |
| 5.10 | Integrate category management into guide listing page     | `src/app/(dashboard)/list/guides/page.tsx`        | 5.9        |

### Files to Create/Modify

| File                                              | Action  | Description                                      |
| ------------------------------------------------- | ------- | ------------------------------------------------ |
| `src/components/forms/GuideForm.tsx`              | Create  | Dual-locale guide editor with all fields         |
| `src/components/forms/GuideCategoryForm.tsx`      | Create  | Category CRUD form (admin only)                  |
| `src/app/(dashboard)/list/guides/page.tsx`        | Modify  | Add create/edit buttons and FormModal integration |

### Verification

- Admin can create a guide with content in both en and ms
- Admin can edit any guide, including changing translations
- Admin can delete any guide
- Teacher can create a guide (authorId auto-set to their Clerk ID)
- Teacher can edit and delete only their own guides
- Teacher cannot see edit/delete controls for other authors' guides
- Category selector loads all categories from database
- Role access multi-select allows selecting any combination of roles
- Publish toggle controls guide visibility
- Tour steps JSON field accepts valid JSON or empty value
- Form validation shows Zod errors for invalid input
- Admin can create, edit, and delete categories

---

## TAG-6: Interactive Tours with driver.js (Priority Medium)

**Goal**: Implement interactive UI tours using driver.js, with completion tracking via localStorage.

### Tasks

| #   | Task                                                      | File                                       | Depends On |
| --- | --------------------------------------------------------- | ------------------------------------------ | ---------- |
| 6.1 | Install driver.js package                                  | `package.json`                             | -          |
| 6.2 | Create GuideTour Client Component wrapper                  | `src/components/GuideTour.tsx`             | 6.1        |
| 6.3 | Parse tourSteps JSON from Guide model                      | `src/components/GuideTour.tsx`             | 6.2        |
| 6.4 | Initialize driver.js with parsed step configuration        | `src/components/GuideTour.tsx`             | 6.3        |
| 6.5 | Add "Start Tour" button to guide detail page               | `src/components/GuideDetail.tsx`           | TAG-4, 6.2 |
| 6.6 | Implement tour completion tracking via localStorage        | `src/components/GuideTour.tsx`             | 6.4        |
| 6.7 | Show "Start Tour" button only for guides with tourSteps    | `src/components/GuideDetail.tsx`           | 6.5        |

### Files to Create/Modify

| File                                       | Action  | Description                                      |
| ------------------------------------------ | ------- | ------------------------------------------------ |
| `src/components/GuideTour.tsx`             | Create  | Client Component wrapping driver.js              |
| `src/components/GuideDetail.tsx`           | Modify  | Add Start Tour button (conditional on tourSteps) |

### Verification

- driver.js initializes correctly with tour step configuration
- Tour highlights correct DOM elements in sequence
- User can navigate forward and backward through steps
- Tour can be dismissed at any point
- Completion is recorded in localStorage keyed by guide ID
- "Start Tour" button only appears on guides with non-null tourSteps
- Previously completed tours can be re-triggered manually

---

## TAG-7: Help Integration and Polish (Priority Low)

**Goal**: Add the floating help button to the dashboard layout, optional new-user tour prompt, and final i18n pass.

### Tasks

| #   | Task                                                      | File                                       | Depends On |
| --- | --------------------------------------------------------- | ------------------------------------------ | ---------- |
| 7.1 | Create HelpFloatingButton Client Component                 | `src/components/HelpFloatingButton.tsx`    | TAG-3      |
| 7.2 | Add HelpFloatingButton to dashboard layout.tsx             | `src/app/(dashboard)/layout.tsx`           | 7.1        |
| 7.3 | Optional: Add "Take the Tour" prompt for new users         | `src/components/HelpFloatingButton.tsx`    | TAG-6, 7.1 |
| 7.4 | Final i18n pass on all guide components                    | All guide component files                 | TAG-3-6    |
| 7.5 | Verify all translations exist in en.json and ms.json       | `messages/en.json`, `messages/ms.json`     | 7.4        |

### Files to Create/Modify

| File                                       | Action  | Description                                      |
| ------------------------------------------ | ------- | ------------------------------------------------ |
| `src/components/HelpFloatingButton.tsx`    | Create  | Fixed-position floating button linking to guides |
| `src/app/(dashboard)/layout.tsx`           | Modify  | Add HelpFloatingButton component                 |
| `messages/en.json`                         | Modify  | Final translation keys                           |
| `messages/ms.json`                         | Modify  | Final translation keys                           |

### Verification

- Floating help button renders on all dashboard pages
- Clicking the button navigates to `/list/guides`
- Button does not obstruct other UI elements
- (Optional) New-user prompt appears once, then does not repeat
- All user-facing text is translated in both en and ms
- No hardcoded English strings remain in guide components

---

## TAG Dependency Graph

```
TAG-1 (Schema + Seed)
  |
  v
TAG-2 (Server Actions + Validation)
  |
  +---> TAG-3 (Listing Page) ---> TAG-4 (Detail Page) ---> TAG-6 (Tours)
  |                                                            |
  +---> TAG-5 (Guide Form + CRUD)                              v
                                                          TAG-7 (Help Button + Polish)
```

---

## Risk Assessment

| Risk                                        | Mitigation                                                    |
| ------------------------------------------- | ------------------------------------------------------------- |
| SPEC-I18N-001 not completed first           | Block implementation; verify next-intl setup before starting  |
| driver.js DOM selectors break on UI changes | Document selectors in tourSteps; validate on page load        |
| Large Markdown content degrades performance | Lazy-load react-markdown; consider virtualization if needed   |
| Search performance with Prisma contains     | Acceptable for <100 articles; monitor and add full-text if needed |
| Tour steps JSON authoring is error-prone    | Provide JSON validation in GuideForm; show preview if possible |

---

## Summary of Files

### New Files (10)

| File                                                   | TAG   |
| ------------------------------------------------------ | ----- |
| `src/lib/guideActions.ts`                              | TAG-2 |
| `src/app/(dashboard)/list/guides/page.tsx`             | TAG-3 |
| `src/components/GuideList.tsx`                          | TAG-3 |
| `src/components/GuideCard.tsx`                          | TAG-3 |
| `src/app/(dashboard)/list/guides/[id]/page.tsx`        | TAG-4 |
| `src/components/GuideDetail.tsx`                        | TAG-4 |
| `src/components/forms/GuideForm.tsx`                    | TAG-5 |
| `src/components/forms/GuideCategoryForm.tsx`            | TAG-5 |
| `src/components/GuideTour.tsx`                          | TAG-6 |
| `src/components/HelpFloatingButton.tsx`                 | TAG-7 |

### Modified Files (7)

| File                                | TAG       |
| ----------------------------------- | --------- |
| `prisma/schema.prisma`             | TAG-1     |
| `prisma/seed.ts`                   | TAG-1     |
| `src/lib/formValidationSchemas.ts` | TAG-2     |
| `src/lib/settings.ts`             | TAG-3, TAG-4 |
| `src/components/Menu.tsx`          | TAG-3     |
| `src/app/(dashboard)/layout.tsx`   | TAG-7     |
| `messages/en.json`, `messages/ms.json` | TAG-3, TAG-4, TAG-7 |
