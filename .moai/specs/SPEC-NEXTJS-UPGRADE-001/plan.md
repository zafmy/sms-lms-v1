# SPEC-NEXTJS-UPGRADE-001: Implementation Plan

## Metadata

| Field       | Value                                       |
|-------------|---------------------------------------------|
| SPEC ID     | SPEC-NEXTJS-UPGRADE-001                     |
| Title       | Next.js 14 to 16 Full Stack Upgrade         |
| Created     | 2026-02-21                                  |

---

## Overview

This plan covers the full-stack upgrade of the hua-readwise-v1 school management LMS from Next.js 14 to Next.js 16, including React 19, ESLint 9, Tailwind CSS 4, and all ecosystem dependencies. The upgrade is organized into 4 milestones executed sequentially, as each milestone depends on the previous one being stable.

---

## Milestone 1: Core Framework Upgrade (Primary Goal)

**Objective**: Upgrade Next.js to 16 and React to 19, fix all breaking API changes.

**Dependencies**: None (first milestone)

### Task 1.1: Run Next.js Codemod

- Execute `npx @next/codemod@latest upgrade` to auto-migrate as many patterns as possible
- Review codemod output for any changes it could not apply automatically
- Commit codemod results separately for clear Git history

### Task 1.2: Fix Async searchParams (13 files)

- Convert `searchParams` prop type from sync object to `Promise<...>`
- Add `await searchParams` at the top of each page component
- Update destructuring to use the resolved object
- Files: All 13 list pages listed in spec.md R1.2

**Technical Approach**:
```typescript
// Each page follows this transformation pattern:
// 1. Change type: { searchParams: { ... } } -> { searchParams: Promise<{ ... }> }
// 2. Add await: const resolvedParams = await searchParams;
// 3. Update references: use resolvedParams instead of searchParams
```

### Task 1.3: Fix Async params (4 files)

- Convert `params` prop type from sync object to `Promise<...>`
- Add `await params` before accessing route parameters
- Update destructuring patterns
- Files: 3 dynamic pages + 1 API route listed in spec.md R1.3

### Task 1.4: Migrate useFormState to useActionState (13 files)

- Change import from `react-dom` to `react`
- Replace `useFormState` with `useActionState`
- Add `isPending` third return value where beneficial for UI feedback
- Files: FormModal.tsx + 12 form components listed in spec.md R1.4

### Task 1.5: Rename Middleware

- Rename `src/middleware.ts` to `src/proxy.ts`
- Verify Clerk middleware integration works with new filename
- Update any imports referencing middleware if they exist

### Task 1.6: Migrate Clerk auth() to Async

- Update all `auth()` calls to `await auth()` across the codebase
- Verify in middleware/proxy, server components, and API routes
- Update `@clerk/nextjs` import patterns if required by v6

### Task 1.7: Update React Type Definitions

- Update `@types/react` to React 19 compatible version
- Update `@types/react-dom` to React 19 compatible version
- Update `@types/react-big-calendar` if new version available
- Update `@types/node` to latest LTS compatible version

### Task 1.8: Update Next Config and Scripts

- Update `next.config.mjs` for Next.js 16 compatibility
- Update `package.json` scripts (lint script change)
- Verify `images.remotePatterns` format still valid

### Task 1.9: Verification Checkpoint

- Run `next build` and verify zero errors
- Run `next dev` and verify Turbopack starts cleanly
- Navigate all 13 list pages and verify searchParams work
- Navigate all 4 detail/route pages and verify params work
- Test form submissions on at least 3 different forms
- Verify middleware route protection still works

---

## Milestone 2: Dependency and Library Updates (Secondary Goal)

**Objective**: Update all third-party libraries to React 19 compatible versions.

**Dependencies**: Milestone 1 must be complete and stable.

### Task 2.1: Upgrade Clerk SDK

- Upgrade `@clerk/nextjs` to v6
- Upgrade `@clerk/elements` to latest compatible version
- Follow Clerk v5 to v6 migration guide
- Verify middleware pattern compatibility
- Test: Sign in, sign out, role-based access on all protected routes

### Task 2.2: Upgrade recharts to v3

- Upgrade `recharts` from v2.12.7 to v3
- Review recharts v3 migration guide for API changes
- Update chart components if APIs have changed:
  - Verify BarChart, LineChart, PieChart, RadialBarChart usage
  - Check for deprecated props or renamed components
- Test: All dashboard charts render correctly with real data

### Task 2.3: Verify react-hook-form Compatibility

- Update `react-hook-form` to latest v7 (React 19 compatible)
- Update `@hookform/resolvers` to latest compatible version
- Audit all form components for `watch()` usage
- If `watch()` breaks with React 19, migrate to `useWatch()` hook
- Test: All 12 form types submit successfully with validation

### Task 2.4: Verify react-big-calendar

- Test `react-big-calendar` with React 19
- If peer dependency issue: install with `--legacy-peer-deps`
- Verify calendar rendering on teacher and student detail pages
- Verify event display and navigation (week/day views)
- Document any workaround applied

### Task 2.5: Verify Prisma Turbopack Compatibility

- Ensure `prisma generate` works correctly
- Verify `prisma-client-js` generator provider is preserved
- Test database queries in development (Turbopack) and production build
- Verify seed script still functions: `npx prisma db seed`
- Consider upgrading to Prisma 6 if required for Turbopack support

### Task 2.6: Update Supporting Libraries

- Update `react-toastify` to latest React 19 compatible version
- Update `react-calendar` to latest compatible version
- Update `next-cloudinary` to Next.js 16 compatible version
- Update `zod` to latest 3.x
- Update `moment` to latest (no breaking changes expected)
- Update `ts-node` if needed for seed script compatibility

### Task 2.7: Resolve Peer Dependencies

- Run `npm ls` to identify all peer dependency warnings
- Document each warning and resolution approach
- Apply `--legacy-peer-deps` only where necessary
- Create a tracking list for libraries needing future React 19 declarations

### Task 2.8: Verification Checkpoint

- Run `next build` and verify zero errors
- Run full application smoke test (all pages, forms, charts, calendar)
- Verify no console warnings related to deprecated APIs
- Verify authentication flows work end-to-end

---

## Milestone 3: ESLint 9 Flat Config Migration (Tertiary Goal)

**Objective**: Migrate from ESLint 8 to ESLint 9 with flat config format.

**Dependencies**: Milestone 2 must be complete and stable.

### Task 3.1: Remove Old ESLint Config

- Remove `eslint-config-next@14.2.35` from devDependencies
- Delete `.eslintrc.json` file

### Task 3.2: Install ESLint 9 Dependencies

- Upgrade `eslint` to v9
- Install `@eslint/eslintrc` for FlatCompat (to reuse next/core-web-vitals)
- Install updated `eslint-config-next` compatible with Next.js 16
- Install any additional required plugins

### Task 3.3: Create Flat Config

- Create `eslint.config.mjs` with flat config format
- Use `FlatCompat` wrapper for `next/core-web-vitals` extends
- Verify TypeScript files are included in linting scope
- Add any project-specific rules as needed

### Task 3.4: Update Lint Script

- Update `package.json` lint script from `"next lint"` to `"eslint ."`
- Add `--max-warnings 0` for strict linting (optional)
- Verify lint runs clean on entire codebase

### Task 3.5: Verification Checkpoint

- Run `eslint .` and verify zero errors
- Verify VS Code / editor ESLint integration works (if applicable)
- Commit all ESLint changes as a single atomic commit

---

## Milestone 4: Tailwind CSS v4 Migration (Final Goal)

**Objective**: Upgrade from Tailwind CSS 3.4.1 to Tailwind CSS 4.

**Dependencies**: Milestone 3 must be complete and stable.

### Task 4.1: Run Tailwind Upgrade Tool

- Execute `npx @tailwindcss/upgrade` to auto-migrate configuration
- Review output for any changes that need manual intervention
- The tool should handle:
  - `tailwind.config.ts` to CSS `@theme` conversion
  - `@tailwind` directives to `@import "tailwindcss"` conversion
  - PostCSS plugin rename
  - Utility class renames across all files

### Task 4.2: Update PostCSS Configuration

- Update `postcss.config.mjs` plugin from `tailwindcss` to `@tailwindcss/postcss`
- Remove `tailwind.config.ts` after migration (config moves to CSS)
- Verify PostCSS pipeline works correctly

### Task 4.3: Migrate globals.css

- Replace `@tailwind base/components/utilities` with `@import "tailwindcss"`
- Add `@theme` block with custom color definitions:
  - `--color-lamaSky`, `--color-lamaSkyLight`
  - `--color-lamaPurple`, `--color-lamaPurpleLight`
  - `--color-lamaYellow`, `--color-lamaYellowLight`
- Migrate custom gradient background images if needed
- Preserve all custom CSS for react-big-calendar and react-calendar

### Task 4.4: Audit Utility Class Renames

- Search codebase for renamed classes that the upgrade tool may have missed
- Key renames to verify:
  - `rounded` in all components (should not be auto-renamed to `rounded-sm` if used intentionally)
  - `shadow` classes throughout the UI
  - `ring` classes on focus states
  - `outline-none` on interactive elements
- Manually fix any remaining class discrepancies

### Task 4.5: Verify Border Color Default

- The default `border` color changes from `gray-200` to `currentColor` in Tailwind v4
- Search for bare `border` usage without explicit color
- Add `border-gray-200` where the old default is expected
- Key area: Table rows in list pages use `border-b border-gray-200` (already explicit -- verify)

### Task 4.6: Verify Opacity Syntax

- Search for `bg-opacity-*`, `text-opacity-*`, `border-opacity-*` patterns
- Migrate to modifier syntax: `bg-black/50`, `text-white/75`
- The upgrade tool should handle most of these automatically

### Task 4.7: Visual Regression Review

- Navigate every page in the application
- Compare visual appearance against pre-upgrade screenshots (if available)
- Pay special attention to:
  - Custom colors (lamaSky, lamaPurple, lamaYellow variants)
  - Table layouts and borders
  - Form styling and input elements
  - Chart container styling
  - Calendar component styling (relies on custom CSS)
  - Responsive layouts at different breakpoints

### Task 4.8: Verification Checkpoint

- Run `next build` with zero errors
- Run `next dev` with Turbopack
- Verify all custom colors render correctly
- Verify responsive layouts at mobile, tablet, desktop breakpoints
- Verify dark mode is not accidentally enabled (Tailwind v4 changes)

---

## Technical Approach

### Codemod Strategy

1. **Automated First**: Run `npx @next/codemod@latest upgrade` to handle the bulk of Next.js/React changes automatically
2. **Tailwind Automated**: Run `npx @tailwindcss/upgrade` to handle Tailwind migration
3. **Manual Cleanup**: Address any remaining issues the codemods cannot handle
4. **Incremental Verification**: Build and test after each milestone

### Git Strategy

- Create a dedicated branch: `upgrade/nextjs-16`
- Commit after each major task for rollback granularity
- Use conventional commit format: `chore(deps): upgrade next.js to 16`
- Final squash or merge commit into main after full verification

### Rollback Strategy

- If Milestone 1 fails: Revert to package.json before upgrade
- If a specific library fails: Pin to last working version and document
- If Tailwind migration causes visual issues: Revert CSS changes and re-apply selectively
- The `package-lock.json` from before the upgrade should be preserved as a backup reference

---

## Architecture Design Direction

### No Architectural Changes

This SPEC is a dependency-only upgrade. The existing architecture remains:

- **App Router** pattern (already in use) continues
- **Server Components** default (already in use) continues
- **Server Actions** for form handling (already in use) continues
- **Prisma ORM** for database access (unchanged)
- **Clerk authentication** middleware pattern (renamed file only)

### Turbopack Adoption

- Next.js 16 uses Turbopack as the default dev bundler
- No code changes required; Turbopack is a transparent replacement
- Faster dev server startup and hot module replacement expected
- Webpack remains available as fallback via `--webpack` flag if needed

---

## Risks and Response Plans

### High Risk

| Risk | Response |
|------|----------|
| Clerk v6 breaking auth flow | Follow official migration guide step-by-step; test every protected route |
| Prisma + Turbopack build failure | Keep `prisma-client-js` provider; fall back to `--webpack` if needed |
| react-big-calendar incompatibility | Use `--legacy-peer-deps`; if rendering breaks, pin to working version |

### Medium Risk

| Risk | Response |
|------|----------|
| recharts v3 API changes | Review migration guide; budget time for chart component updates |
| Tailwind v4 visual regressions | Use automated upgrade tool first; manual page-by-page review |
| ESLint flat config complexity | Use FlatCompat wrapper for existing config; migrate rules incrementally |

### Low Risk

| Risk | Response |
|------|----------|
| react-hook-form watch() issue | Migrate to useWatch() if needed; well-documented pattern |
| moment.js compatibility | Stable library with no React dependency; should work unchanged |
| TypeScript strict mode issues | Already using strict mode; type updates should be additive |

---

## Expert Consultation Recommendations

This SPEC involves cross-cutting concerns across the full stack. The following expert consultations are recommended during the `/moai:2-run` phase:

- **expert-frontend**: For Tailwind v4 migration, React 19 patterns, and visual regression verification
- **expert-backend**: For Prisma compatibility, API route migration, and server action updates

---

## Success Criteria Summary

1. `next build` completes with zero errors
2. `next dev` starts cleanly with Turbopack
3. All 13 list pages render and filter correctly
4. All 4 detail/dynamic pages render correctly
5. All 13 form types submit successfully
6. Authentication and role-based access works correctly
7. All charts render with data
8. Calendar displays events correctly
9. CSV export functionality works
10. ESLint runs with zero errors
11. All Tailwind styles render correctly with no visual regressions
12. No React 18 deprecated API warnings in console
