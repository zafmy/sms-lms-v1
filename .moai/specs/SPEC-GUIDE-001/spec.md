# SPEC-GUIDE-001: Help and Knowledge Base System

| Field    | Value                                                                      |
| -------- | -------------------------------------------------------------------------- |
| id       | SPEC-GUIDE-001                                                             |
| version  | 1.0.0                                                                      |
| status   | draft                                                                      |
| created  | 2026-02-23                                                                 |
| updated  | 2026-02-23                                                                 |
| author   | MoAI                                                                       |
| priority | Medium                                                                     |
| parent   | School System Enhancements                                                 |
| depends  | SPEC-I18N-001 (multi-language infrastructure with next-intl)               |
| tags     | guide, help, knowledge-base, tour, driver.js, i18n, markdown, categories   |

---

## History

| Version | Date       | Author | Change Description             |
| ------- | ---------- | ------ | ------------------------------ |
| 1.0.0   | 2026-02-23 | MoAI   | Initial SPEC creation (draft). |

---

## Problem Statement

Hua Readwise is a bi-weekly school management system serving four distinct user roles (admin, teacher, student, parent). The platform has grown to include courses, forums, spaced repetition, gamification, and numerous administrative features. New users face a steep learning curve when navigating the system for the first time. There is no in-app guidance, no searchable help content, and no interactive walkthroughs to help users discover and understand features relevant to their role.

Teachers and administrators frequently receive the same questions from students and parents about how to use the system. Without a centralized knowledge base, answers are scattered across informal channels with no searchable archive.

A Help and Knowledge Base System solves this by providing:

1. **Searchable guide articles** authored by admins and teachers, with Markdown-rendered content and multi-language support (English and Bahasa Malaysia).
2. **Role-based visibility** so each user role sees only the guides relevant to them.
3. **Interactive tours** powered by driver.js that walk users through UI elements step-by-step.
4. **A floating help button** in the dashboard layout providing quick access to guides from any page.
5. **Category organization** enabling logical grouping of guides by topic (Getting Started, School Management, LMS & Courses, etc.).

---

## Environment

- **Framework**: Next.js 16 with App Router, React 19 Server Components
- **Language**: TypeScript 5 (strict mode)
- **Database**: PostgreSQL 14+ via Prisma 5 ORM (singleton pattern at `src/lib/prisma.ts`)
- **Authentication**: Clerk v6 with 4 roles (admin, teacher, student, parent) via `publicMetadata.role`
- **Styling**: Tailwind CSS v4 (CSS-first configuration)
- **Forms**: React Hook Form v7 + Zod v3.23 + `useActionState`
- **I18N**: next-intl (from SPEC-I18N-001), supported locales: `en`, `ms`
- **Tour Library**: driver.js (lightweight, TypeScript-native)
- **Markdown Rendering**: react-markdown (with remark-gfm for GitHub Flavored Markdown)
- **Existing patterns**: Container/Presenter for data components, Server Actions returning `{ success: boolean; error: boolean; message?: string }`, FormModal for CRUD forms, FormContainer pattern
- **Routing**: `routeAccessMap` in `src/lib/settings.ts` for route access control
- **Navigation**: `menuItems` array in `src/components/Menu.tsx` for sidebar navigation
- **Pagination**: `ITEM_PER_PAGE` constant from `src/lib/settings.ts`

---

## Assumptions

1. SPEC-I18N-001 is implemented before this SPEC, providing `useTranslations()` hook and locale detection infrastructure.
2. The system has fewer than 100 guide articles, making Prisma `contains` search sufficient without a dedicated search engine.
3. Admin and teacher users have the domain knowledge to author helpful guide content.
4. Users will primarily access guides through the floating help button or the sidebar menu item.
5. Tour step configurations target existing DOM elements via CSS selectors; guides with tours are authored by users who understand the page structure.
6. localStorage is available in all target browsers for persisting tour completion state.
7. Markdown content is trusted (authored by admin/teacher only) and does not require sanitization beyond standard rendering.

---

## Requirements

### Ubiquitous Requirements (Always Active)

**REQ-GUIDE-001**: The system shall display guide article content using a Markdown renderer that supports headings, lists, images, code blocks, and links.

**REQ-GUIDE-002**: The system shall filter guide visibility based on the current user's role, showing only guides whose `roleAccess` array includes the user's role.

**REQ-GUIDE-003**: The system shall display guide content in the user's active locale (en or ms), falling back to English if a translation for the active locale does not exist.

**REQ-GUIDE-004**: The system shall sort guides by category order first, then by guide order within each category.

**REQ-GUIDE-005**: The system shall render all user-facing text in guide pages through next-intl `useTranslations` for UI chrome (buttons, labels, headings), while guide article content comes from the `GuideTranslation` model.

### Event-Driven Requirements (When/Then)

**REQ-GUIDE-010**: When a user navigates to `/list/guides`, the system shall display a paginated grid of guide cards filtered by the user's role, showing title, category badge, excerpt, and author name.

**REQ-GUIDE-011**: When a user clicks on a guide card, the system shall navigate to `/list/guides/[id]` and render the full Markdown article content from the matching locale translation.

**REQ-GUIDE-012**: When a user enters a search query on the guide listing page, the system shall filter guides by matching the query against the title and content fields of the active locale's `GuideTranslation` records using Prisma `contains`.

**REQ-GUIDE-013**: When a user selects a category filter on the guide listing page, the system shall display only guides belonging to that category.

**REQ-GUIDE-014**: When an admin or teacher submits the GuideForm to create a guide, the system shall create a `Guide` record with associated `GuideTranslation` records for both en and ms locales.

**REQ-GUIDE-015**: When an admin or teacher submits the GuideForm to update a guide, the system shall update the `Guide` record and upsert the `GuideTranslation` records for both locales.

**REQ-GUIDE-016**: When a user clicks "Start Tour" on a guide detail page (for a guide that has `tourSteps` data), the system shall initialize driver.js with the parsed step configuration and begin the interactive tour.

**REQ-GUIDE-017**: When a user completes an interactive tour, the system shall record the completion in localStorage keyed by guide ID to prevent repeated prompts.

**REQ-GUIDE-018**: When a user clicks the floating help button in the dashboard, the system shall navigate to the guide listing page.

**REQ-GUIDE-019**: When an admin submits the category form, the system shall create or update a `GuideCategory` record with `nameEn`, `nameMs`, `slug`, and `order` fields.

### State-Driven Requirements (If/Then)

**REQ-GUIDE-020**: If the current user is an admin, then the system shall allow creating, editing, and deleting any guide regardless of authorship.

**REQ-GUIDE-021**: If the current user is a teacher, then the system shall allow creating new guides and editing or deleting only guides where `authorId` matches the teacher's Clerk user ID.

**REQ-GUIDE-022**: If a guide has `isPublished` set to false, then the system shall hide the guide from all non-admin users on the listing page.

**REQ-GUIDE-023**: If a guide has `tourSteps` set to a non-null JSON value, then the guide detail page shall display a "Start Tour" button.

**REQ-GUIDE-024**: If the user has already completed a tour (recorded in localStorage), then the system shall not automatically prompt the tour but shall still allow manual re-triggering via the "Start Tour" button.

### Unwanted Behavior Requirements (Shall Not)

**REQ-GUIDE-030**: The system shall not allow a teacher to edit or delete a guide authored by another teacher.

**REQ-GUIDE-031**: The system shall not display unpublished guides to student or parent users.

**REQ-GUIDE-032**: The system shall not allow student or parent users to access the guide creation or editing forms.

**REQ-GUIDE-033**: The system shall not store tour completion data on the server; localStorage shall be the sole persistence mechanism for tour state.

### Optional Requirements (Where Possible)

**REQ-GUIDE-040**: Where possible, the system shall display a "Take the Tour" prompt on the dashboard for new users (detected via localStorage) linking to a Getting Started guide.

**REQ-GUIDE-041**: Where possible, the system shall display breadcrumb navigation on the guide detail page showing "Guides > Category > Article Title".

---

## Specifications

### Data Models

#### Guide

| Field        | Type                | Description                                       |
| ------------ | ------------------- | ------------------------------------------------- |
| id           | String (cuid)       | Primary key                                       |
| slug         | String (unique)     | URL-friendly identifier                           |
| categoryId   | String              | Foreign key to GuideCategory                      |
| roleAccess   | String[]            | Roles that can view: admin, teacher, student, parent |
| tourSteps    | Json?               | driver.js step config array, null if no tour      |
| isPublished  | Boolean             | Default false; unpublished hidden from non-admins |
| order        | Int                 | Sort order within category, default 0             |
| authorId     | String              | Clerk user ID of the author                       |
| authorRole   | String              | "admin" or "teacher"                              |
| translations | GuideTranslation[]  | Relation to translations                          |
| createdAt    | DateTime            | Auto-set on creation                              |
| updatedAt    | DateTime            | Auto-updated                                      |

Indexes: `categoryId`, `isPublished`

#### GuideTranslation

| Field   | Type   | Description                                  |
| ------- | ------ | -------------------------------------------- |
| id      | String (cuid) | Primary key                            |
| guideId | String | Foreign key to Guide (cascade delete)        |
| locale  | String | "en" or "ms"                                 |
| title   | String | Localized title                              |
| excerpt | String | Localized short description                  |
| content | String (@db.Text) | Localized Markdown article content  |

Unique constraint: `[guideId, locale]`
Index: `locale`

#### GuideCategory

| Field  | Type   | Description                     |
| ------ | ------ | ------------------------------- |
| id     | String (cuid) | Primary key              |
| slug   | String (unique) | URL-friendly identifier |
| nameEn | String | English category name           |
| nameMs | String | Bahasa Malaysia category name   |
| order  | Int    | Sort order, default 0           |
| guides | Guide[] | Relation to guides             |

### Seed Data

Five initial categories (in order):

| Slug               | nameEn                    | nameMs                         | order |
| ------------------- | ------------------------- | ------------------------------ | ----- |
| getting-started     | Getting Started           | Mula Di Sini                   | 1     |
| school-management   | School Management         | Pengurusan Sekolah             | 2     |
| lms-courses         | LMS & Courses             | LMS & Kursus                   | 3     |
| assessments-quizzes | Assessments & Quizzes     | Penilaian & Kuiz               | 4     |
| for-parents         | For Parents               | Untuk Ibu Bapa                 | 5     |

Seed 3-5 sample guides per category with translations in both en and ms locales, targeting different role combinations.

### UI Components

| Component              | Type             | Description                                         |
| ---------------------- | ---------------- | --------------------------------------------------- |
| GuideList              | Server Component | Grid layout displaying GuideCard components          |
| GuideCard              | Client Component | Card showing title, category badge, excerpt, author  |
| GuideDetail            | Server Component | Full article renderer with Markdown content          |
| GuideForm              | Client Component | Dual-locale editor for creating/editing guides       |
| GuideCategoryForm      | Client Component | Category CRUD form for admins                        |
| GuideTour              | Client Component | driver.js wrapper, parses tourSteps, tracks completion |
| HelpFloatingButton     | Client Component | Fixed-position button linking to guide listing       |

### Route Configuration

| Route                | Access Roles                          | Purpose              |
| -------------------- | ------------------------------------- | -------------------- |
| `/list/guides`       | admin, teacher, student, parent       | Guide listing page   |
| `/list/guides/[id]`  | admin, teacher, student, parent       | Guide detail page    |

### Menu Configuration

Add a "Guides" item to the MENU section of `menuItems` in `src/components/Menu.tsx`, visible to all four roles (admin, teacher, student, parent), positioned after "Announcements".

### Server Actions

| Action           | File                      | Authorization                              |
| ---------------- | ------------------------- | ------------------------------------------ |
| createGuide      | src/lib/guideActions.ts   | Admin or Teacher                           |
| updateGuide      | src/lib/guideActions.ts   | Admin (any guide) or Teacher (own guides)  |
| deleteGuide      | src/lib/guideActions.ts   | Admin (any guide) or Teacher (own guides)  |
| getGuides        | src/lib/guideActions.ts   | All authenticated roles (filtered by role) |
| getGuideById     | src/lib/guideActions.ts   | All authenticated roles (if role matches)  |
| createCategory   | src/lib/guideActions.ts   | Admin only                                 |
| updateCategory   | src/lib/guideActions.ts   | Admin only                                 |
| deleteCategory   | src/lib/guideActions.ts   | Admin only                                 |

### Validation Schemas

Add to `src/lib/formValidationSchemas.ts`:

- **guideSchema**: slug (string, regex for URL-safe), categoryId (string), roleAccess (array of enum strings), isPublished (boolean), order (number), tourSteps (optional JSON string), translations object with en and ms sub-objects each containing title (string, min 1), excerpt (string, min 1), and content (string, min 1).

- **guideCategorySchema**: slug (string, regex for URL-safe), nameEn (string, min 1), nameMs (string, min 1), order (number).

### Dependencies

| Package          | Purpose                                | Version    |
| ---------------- | -------------------------------------- | ---------- |
| driver.js        | Interactive step-by-step UI tours      | ^1.3.1     |
| react-markdown   | Markdown to React component rendering  | ^9.0.1     |
| remark-gfm       | GitHub Flavored Markdown support       | ^4.0.0     |

---

## Expert Consultation Recommendations

**Frontend Expert**: This SPEC involves multiple UI components (GuideList, GuideCard, GuideDetail, GuideForm, GuideTour, HelpFloatingButton), Markdown rendering, driver.js integration, and responsive layout. Consulting with expert-frontend is recommended for component architecture and driver.js integration patterns.

**Backend Expert**: This SPEC involves Prisma model design, Server Actions with multi-role authorization, search queries, and seed data. Consulting with expert-backend is recommended for query optimization and authorization patterns.

---

## Traceability

| Requirement   | Plan TAG | Acceptance Scenario |
| ------------- | -------- | ------------------- |
| REQ-GUIDE-001 | TAG-4    | AC-04               |
| REQ-GUIDE-002 | TAG-3    | AC-01, AC-02        |
| REQ-GUIDE-003 | TAG-4    | AC-04               |
| REQ-GUIDE-004 | TAG-3    | AC-06               |
| REQ-GUIDE-005 | TAG-3, TAG-7 | AC-04           |
| REQ-GUIDE-010 | TAG-3    | AC-01               |
| REQ-GUIDE-011 | TAG-4    | AC-04               |
| REQ-GUIDE-012 | TAG-3    | AC-05               |
| REQ-GUIDE-013 | TAG-3    | AC-06               |
| REQ-GUIDE-014 | TAG-5    | AC-03               |
| REQ-GUIDE-015 | TAG-5    | AC-03               |
| REQ-GUIDE-016 | TAG-6    | AC-07               |
| REQ-GUIDE-017 | TAG-6    | AC-07               |
| REQ-GUIDE-018 | TAG-7    | AC-01               |
| REQ-GUIDE-019 | TAG-5    | AC-06               |
| REQ-GUIDE-020 | TAG-2    | AC-09               |
| REQ-GUIDE-021 | TAG-2    | AC-08               |
| REQ-GUIDE-022 | TAG-3    | AC-10               |
| REQ-GUIDE-023 | TAG-6    | AC-07               |
| REQ-GUIDE-024 | TAG-6    | AC-07               |
| REQ-GUIDE-030 | TAG-2    | AC-08               |
| REQ-GUIDE-031 | TAG-3    | AC-10               |
| REQ-GUIDE-032 | TAG-2    | AC-08               |
| REQ-GUIDE-033 | TAG-6    | AC-07               |
| REQ-GUIDE-040 | TAG-7    | -                   |
| REQ-GUIDE-041 | TAG-4    | AC-04               |
