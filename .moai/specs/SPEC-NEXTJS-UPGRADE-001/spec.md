# SPEC-NEXTJS-UPGRADE-001: Next.js 14 to 16 Full Stack Upgrade

## Metadata

| Field       | Value                                       |
|-------------|---------------------------------------------|
| SPEC ID     | SPEC-NEXTJS-UPGRADE-001                     |
| Title       | Next.js 14 to 16 Full Stack Upgrade         |
| Created     | 2026-02-21                                  |
| Status      | Completed                                   |
| Priority    | High                                        |
| Lifecycle   | spec-first                                  |

---

## 1. Environment

### 1.1 Current System State

- **Framework**: Next.js 14.2.35 with App Router
- **Runtime**: React 18, React DOM 18
- **Language**: TypeScript 5 with strict mode
- **Styling**: Tailwind CSS 3.4.1 with PostCSS
- **Auth**: @clerk/nextjs 5.7.5 with @clerk/elements 0.14.6
- **Database**: Prisma 5.19.1 (@prisma/client 5.19.1)
- **Forms**: react-hook-form 7.52.2 with @hookform/resolvers 3.9.0
- **Validation**: Zod 3.23.8
- **Charts**: recharts 2.12.7
- **Calendar**: react-big-calendar 1.13.2, react-calendar 5.0.0
- **Media**: next-cloudinary 6.13.0
- **Linting**: ESLint 8 with eslint-config-next 14.2.35 (.eslintrc.json format)
- **Notifications**: react-toastify 10.0.5
- **Date**: moment 2.30.1

### 1.2 Codebase Metrics

- ~87 TypeScript/TSX files
- ~11,160 lines of code
- 13 list pages with searchParams
- 4 dynamic route pages with params
- 13 form components using useFormState
- 26 client components total
- 1 middleware file (src/middleware.ts)
- Project mode: Personal

### 1.3 Target System State

- **Framework**: Next.js 16 (latest stable)
- **Runtime**: React 19, React DOM 19
- **Language**: TypeScript 5.7+
- **Styling**: Tailwind CSS 4 with @tailwindcss/postcss
- **Auth**: @clerk/nextjs 6 (React 19 compatible)
- **Database**: Prisma 6 (Turbopack compatible)
- **Forms**: react-hook-form 7.54+ (React 19 compatible)
- **Validation**: Zod 3.24+
- **Charts**: recharts 3 (React 19 compatible)
- **Linting**: ESLint 9 with flat config (eslint.config.mjs)
- **Bundler**: Turbopack (default in Next.js 16)

---

## 2. Assumptions

### 2.1 Technical Assumptions

- **A1**: Node.js 20.9+ is available in the development environment (required by Next.js 16).
- **A2**: All current functionality works correctly on Next.js 14.2.35 (baseline is stable).
- **A3**: The Next.js codemod CLI (`npx @next/codemod@latest upgrade`) can handle the majority of async API migrations automatically.
- **A4**: Clerk v6 supports the same middleware pattern currently used but requires the middleware.ts to proxy.ts rename and async auth() calls.
- **A5**: Prisma 6 maintains backward compatibility with the existing schema and seed configuration.
- **A6**: react-big-calendar may require `--legacy-peer-deps` for React 19 until its peer dependency is updated.
- **A7**: The Tailwind CSS v4 upgrade tool (`npx @tailwindcss/upgrade`) handles the majority of class renames and config migration automatically.

### 2.2 Risk Assumptions

- **A8**: Some third-party libraries may not yet have React 19 peer dependency declarations, requiring `--legacy-peer-deps` during installation.
- **A9**: The recharts v2 to v3 migration may require API changes in chart components.
- **A10**: Custom CSS for react-big-calendar and react-calendar in globals.css may need adjustments after Tailwind v4 migration.

---

## 3. Requirements

### Milestone 1: Core Framework Upgrade (Next.js 16 + React 19)

#### R1.1 - Next.js and React Version Upgrade

The system **shall** upgrade from Next.js 14.2.35 to the latest stable Next.js 16 release and from React 18 to React 19.

#### R1.2 - Async searchParams Migration

**When** a server component page receives `searchParams`, **then** the system **shall** convert the `searchParams` prop type to `Promise<{ [key: string]: string | undefined }>` and `await` the promise before accessing values.

Affected files (13):
1. `src/app/(dashboard)/admin/page.tsx`
2. `src/app/(dashboard)/list/announcements/page.tsx`
3. `src/app/(dashboard)/list/assignments/page.tsx`
4. `src/app/(dashboard)/list/attendance/page.tsx`
5. `src/app/(dashboard)/list/classes/page.tsx`
6. `src/app/(dashboard)/list/events/page.tsx`
7. `src/app/(dashboard)/list/exams/page.tsx`
8. `src/app/(dashboard)/list/lessons/page.tsx`
9. `src/app/(dashboard)/list/parents/page.tsx`
10. `src/app/(dashboard)/list/results/page.tsx`
11. `src/app/(dashboard)/list/students/page.tsx`
12. `src/app/(dashboard)/list/subjects/page.tsx`
13. `src/app/(dashboard)/list/teachers/page.tsx`

Pattern (before):
```typescript
const Page = async ({ searchParams }: { searchParams: { [key: string]: string | undefined } }) => {
  const { page, ...queryParams } = searchParams;
```

Pattern (after):
```typescript
const Page = async ({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) => {
  const resolvedParams = await searchParams;
  const { page, ...queryParams } = resolvedParams;
```

#### R1.3 - Async params Migration

**When** a server component page or API route receives `params`, **then** the system **shall** convert the `params` prop type to a `Promise` and `await` the promise before destructuring.

Affected files (4):
1. `src/app/(dashboard)/list/students/[id]/page.tsx`
2. `src/app/(dashboard)/list/students/[id]/report-card/page.tsx`
3. `src/app/(dashboard)/list/teachers/[id]/page.tsx`
4. `src/app/api/export/[table]/route.ts`

Pattern (before):
```typescript
const SingleTeacherPage = async ({ params: { id } }: { params: { id: string } }) => {
```

Pattern (after):
```typescript
const SingleTeacherPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
```

#### R1.4 - useFormState to useActionState Migration

**When** a client component uses `useFormState` from `react-dom`, **then** the system **shall** replace it with `useActionState` from `react`.

Affected files (13):
1. `src/components/FormModal.tsx`
2. `src/components/forms/LessonForm.tsx`
3. `src/components/forms/AttendanceForm.tsx`
4. `src/components/forms/ResultForm.tsx`
5. `src/components/forms/ParentForm.tsx`
6. `src/components/forms/AnnouncementForm.tsx`
7. `src/components/forms/EventForm.tsx`
8. `src/components/forms/AssignmentForm.tsx`
9. `src/components/forms/ExamForm.tsx`
10. `src/components/forms/ClassForm.tsx`
11. `src/components/forms/SubjectForm.tsx`
12. `src/components/forms/StudentForm.tsx`
13. `src/components/forms/TeacherForm.tsx`

Pattern (before):
```typescript
import { useFormState } from "react-dom";
const [state, formAction] = useFormState(serverAction, initialState);
```

Pattern (after):
```typescript
import { useActionState } from "react";
const [state, formAction, isPending] = useActionState(serverAction, initialState);
```

#### R1.5 - Middleware Rename

**When** Next.js 16 is installed, **then** the system **shall** rename `src/middleware.ts` to `src/proxy.ts` to comply with the new middleware naming convention.

#### R1.6 - Async Clerk Auth Migration

**When** middleware or server components call Clerk's `auth()` function, **then** the system **shall** update calls to `await auth()` as required by @clerk/nextjs v6.

Pattern (before):
```typescript
const { sessionClaims } = auth();
```

Pattern (after):
```typescript
const { sessionClaims } = await auth();
```

#### R1.7 - React Type Definitions Update

The system **shall** update `@types/react` and `@types/react-dom` to versions compatible with React 19.

#### R1.8 - Package Scripts Update

**When** Next.js 16 removes the built-in `next lint` command, **then** the system **shall** update the `lint` script in `package.json` to use `eslint .` directly.

#### R1.9 - Next.js Config Update

**When** upgrading to Next.js 16, **then** the system **shall** update `next.config.mjs` with any required configuration changes including `images.remotePatterns` format validation and Turbopack compatibility.

---

### Milestone 2: Dependency and Library Updates

#### R2.1 - Clerk SDK Upgrade

**When** React 19 is installed, **then** the system **shall** upgrade `@clerk/nextjs` to v6 and `@clerk/elements` to the latest compatible version.

The system **shall not** break any existing authentication flows, route protection, or role-based access control during the Clerk upgrade.

#### R2.2 - Recharts Upgrade

**When** React 19 is installed, **then** the system **shall** upgrade `recharts` from v2.12.7 to v3 (latest stable) for full React 19 compatibility.

**If** recharts v3 introduces API changes, **then** the system **shall** update all chart components accordingly.

#### R2.3 - react-hook-form Compatibility

**When** React 19 is installed, **then** the system **shall** verify react-hook-form compatibility and migrate any `watch()` calls to `useWatch()` hook pattern if required.

The system **shall** verify `@hookform/resolvers` compatibility with the updated Zod version.

#### R2.4 - react-big-calendar Compatibility

**When** React 19 is installed, **then** the system **shall** verify react-big-calendar compatibility with React 19 and install with `--legacy-peer-deps` if peer dependency issues arise.

The system **shall not** lose any calendar rendering or event display functionality.

#### R2.5 - Prisma Turbopack Compatibility

**When** Turbopack becomes the default bundler in Next.js 16, **then** the system **shall** verify that Prisma client generation works correctly with Turbopack and the `prisma-client-js` generator provider is preserved.

#### R2.6 - Supporting Library Updates

The system **shall** update the following supporting libraries to their latest compatible versions:
- `react-toastify` (React 19 compatible)
- `react-calendar` (React 19 compatible)
- `next-cloudinary` (Next.js 16 compatible)
- `moment` (no breaking changes expected)
- `zod` (latest 3.x stable)

#### R2.7 - Peer Dependency Resolution

**If** any dependency declares an incompatible React peer dependency, **then** the system **shall** use `--legacy-peer-deps` as a temporary measure and document the dependency for future resolution.

The system **shall not** use `--force` flag which silently overrides peer dependency conflicts.

---

### Milestone 3: ESLint 9 Flat Config Migration

#### R3.1 - ESLint Version Upgrade

The system **shall** upgrade from ESLint 8 to ESLint 9.

#### R3.2 - Flat Config Migration

**When** ESLint 9 is installed, **then** the system **shall** replace the `.eslintrc.json` file with an `eslint.config.mjs` flat config file.

Current `.eslintrc.json`:
```json
{
  "extends": "next/core-web-vitals"
}
```

Target `eslint.config.mjs`:
```javascript
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
];

export default eslintConfig;
```

#### R3.3 - ESLint Dependencies Update

**When** migrating to ESLint 9, **then** the system **shall** remove `eslint-config-next@14.2.35` and install the Next.js 16 compatible ESLint plugin (`@next/eslint-plugin-next` or updated `eslint-config-next`).

#### R3.4 - Lint Script Update

**When** `next lint` is removed in Next.js 16, **then** the system **shall** update the `lint` script in `package.json` from `"lint": "next lint"` to `"lint": "eslint ."` or equivalent.

---

### Milestone 4: Tailwind CSS v4 Migration

#### R4.1 - Tailwind CSS Version Upgrade

The system **shall** upgrade from Tailwind CSS 3.4.1 to Tailwind CSS 4.

#### R4.2 - CSS Directive Migration

**When** Tailwind CSS 4 is installed, **then** the system **shall** replace the `@tailwind` directives in `src/app/globals.css`:

Before:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

After:
```css
@import "tailwindcss";
```

#### R4.3 - PostCSS Configuration Update

**When** Tailwind CSS 4 is installed, **then** the system **shall** update `postcss.config.mjs` to use `@tailwindcss/postcss` plugin instead of `tailwindcss`.

Before:
```javascript
const config = {
  plugins: {
    tailwindcss: {},
  },
};
```

After:
```javascript
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

#### R4.4 - Tailwind Config to CSS Migration

**When** Tailwind CSS 4 is installed, **then** the system **shall** migrate the `tailwind.config.ts` configuration to CSS `@theme` directives in `globals.css`.

Custom colors to migrate:
- `lamaSky: "#C3EBFA"`
- `lamaSkyLight: "#EDF9FD"`
- `lamaPurple: "#CFCEFF"`
- `lamaPurpleLight: "#F1F0FF"`
- `lamaYellow: "#FAE27C"`
- `lamaYellowLight: "#FEFCE8"`

Custom background images:
- `gradient-radial`
- `gradient-conic`

Target CSS:
```css
@import "tailwindcss";

@theme {
  --color-lamaSky: #C3EBFA;
  --color-lamaSkyLight: #EDF9FD;
  --color-lamaPurple: #CFCEFF;
  --color-lamaPurpleLight: #F1F0FF;
  --color-lamaYellow: #FAE27C;
  --color-lamaYellowLight: #FEFCE8;
}
```

#### R4.5 - Utility Class Renames

**When** Tailwind CSS 4 is installed, **then** the system **shall** audit and update renamed utility classes across all template files:

| Tailwind 3 Class | Tailwind 4 Class |
|-------------------|------------------|
| `rounded` | `rounded-sm` |
| `rounded-sm` | `rounded-xs` |
| `rounded-lg` | `rounded-md` |
| `shadow` | `shadow-sm` |
| `shadow-sm` | `shadow-xs` |
| `shadow-md` | `shadow-sm` |
| `ring` | `ring-3` |
| `outline-none` | `outline-hidden` |

**Note**: The `npx @tailwindcss/upgrade` tool should handle most of these renames automatically.

#### R4.6 - Border Color Default Change

**While** Tailwind CSS 4 changes the default border color from `gray-200` to `currentColor`, **when** any component uses bare `border` class, **then** the system **shall** verify the visual appearance remains correct or explicitly add `border-gray-200`.

#### R4.7 - Opacity Syntax Migration

**If** any component uses `bg-opacity-*` or `text-opacity-*` classes, **then** the system **shall** migrate to the modifier syntax (e.g., `bg-black/50`).

---

## 4. Specifications

### 4.1 Non-Functional Requirements

- **NFR1**: The application **shall** build successfully with `next build` producing zero errors after upgrade.
- **NFR2**: The application **shall** start in development mode with `next dev` using Turbopack without errors.
- **NFR3**: All existing page routes **shall** render correctly with no visual regressions.
- **NFR4**: All form submissions **shall** complete successfully with proper validation feedback.
- **NFR5**: Authentication and role-based access control **shall** function identically to pre-upgrade behavior.
- **NFR6**: ESLint **shall** run cleanly with zero errors on the entire codebase.
- **NFR7**: All Tailwind utility classes **shall** render correct styles with no visual regressions.

### 4.2 Constraints

- **C1**: Node.js >= 20.9 is required for Next.js 16.
- **C2**: The upgrade must preserve all existing database migrations and seed data.
- **C3**: No feature changes or additions are included in this upgrade -- this is a dependency-only upgrade.
- **C4**: The Prisma schema and seed script must remain functional.
- **C5**: Environment variables (.env) must not change.

### 4.3 Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| react-big-calendar React 19 incompatibility | Medium | High | Use `--legacy-peer-deps`, test calendar rendering thoroughly |
| recharts v3 API breaking changes | Medium | Medium | Review migration guide, update chart components |
| Clerk v6 auth flow changes | Low | High | Follow official Clerk migration guide, test all protected routes |
| Tailwind v4 visual regressions | Medium | Medium | Run upgrade tool first, then manual visual review of all pages |
| useFormState third-argument change | Low | Low | Codemod handles this; verify isPending usage |
| Prisma + Turbopack generation issues | Low | High | Verify prisma-client-js provider, test build with Turbopack |
| Third-party CSS overrides break in Tailwind v4 | Medium | Low | Custom CSS in globals.css is plain CSS, not Tailwind classes |

### 4.4 Dependencies

- Next.js 16 release must be stable (not RC/canary)
- @clerk/nextjs v6 must support Next.js 16
- recharts v3 must support React 19
- react-hook-form must support React 19

### 4.5 Out of Scope

- Feature additions or UI changes
- Database schema changes
- New page creation
- Performance optimization beyond what the framework upgrade provides
- Testing framework setup (no test suite currently exists)

---

## 5. Traceability

| Requirement | Plan Reference | Acceptance Criteria |
|-------------|----------------|---------------------|
| R1.1-R1.9   | Milestone 1    | AC-1.x              |
| R2.1-R2.7   | Milestone 2    | AC-2.x              |
| R3.1-R3.4   | Milestone 3    | AC-3.x              |
| R4.1-R4.7   | Milestone 4    | AC-4.x              |
