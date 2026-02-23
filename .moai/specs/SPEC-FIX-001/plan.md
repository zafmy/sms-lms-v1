---
id: SPEC-FIX-001
type: plan
version: "1.0.0"
created: "2026-02-21"
updated: "2026-02-21"
author: ZaF
methodology: DDD (ANALYZE-PRESERVE-IMPROVE)
---

# SPEC-FIX-001: Implementation Plan

## Overview

This plan addresses critical security hardening and bug fixes for the Next.js school management dashboard. The implementation follows the DDD methodology (ANALYZE-PRESERVE-IMPROVE) since all changes modify existing code.

**Estimated files modified**: ~15 files
**Development methodology**: DDD (ANALYZE-PRESERVE-IMPROVE) -- existing code modification

---

## Milestone 1: Security Foundation (Primary Goal)

### Task 1.1: Secrets Removal and .gitignore

- **Priority**: Critical
- **Risk**: None (additive change)
- **Files**: `.gitignore`, `.env.example` (new)
- **Dependencies**: None
- **Actions**:
  - Add `.env`, `.env.*`, `.env.local`, `.env.production` to `.gitignore`
  - Create `.env.example` with placeholder values for all required environment variables
  - Document which variables are required vs optional
- **ANALYZE**: Read current `.gitignore` and `.env` to identify all secret variables
- **PRESERVE**: No behavior change; existing runtime unaffected
- **IMPROVE**: Add exclusion rules and template file

### Task 1.2: Middleware Authorization Fix

- **Priority**: Critical
- **Risk**: Low (isolated to middleware)
- **Files**: `src/middleware.ts`
- **Dependencies**: None
- **Actions**:
  - Remove the non-null assertion `role!` on line 15-17
  - Add explicit check: if `userId` exists but `role` is undefined, redirect to a safe page (e.g., `/no-role`)
  - Ensure the redirect does not create an infinite loop (exclude `/no-role` from middleware matching)
- **ANALYZE**: Map all middleware routing paths and identify the undefined role gap
- **PRESERVE**: Write characterization test for current middleware behavior with valid roles
- **IMPROVE**: Add undefined role handling with redirect

### Task 1.3: Server Action Authorization

- **Priority**: Critical
- **Risk**: Medium (behavior change -- previously unauthenticated calls would succeed)
- **Files**: `src/lib/actions.ts`
- **Dependencies**: Task 1.2 (middleware pattern established)
- **Actions**:
  - Add `auth()` call at the top of all 15 server action functions
  - Verify `userId` exists; return error response if not
  - Extract `role` from `sessionClaims?.metadata?.role`
  - Validate role against allowed roles per action:
    - Admin-only: createTeacher, updateTeacher, deleteTeacher, createStudent, updateStudent, deleteStudent
    - Admin + Teacher: createExam, updateExam, deleteExam, createSubject, updateSubject, deleteSubject, createClass, updateClass, deleteClass
  - For teacher actions: verify ownership via database lookup
  - Uncomment and complete exam CRUD authorization (lines 366-462)
- **ANALYZE**: Map each action to its required roles and ownership rules
- **PRESERVE**: Document current behavior (no auth = open access) as baseline
- **IMPROVE**: Add authorization guards to all 15 functions

---

## Milestone 2: Data Integrity (Secondary Goal)

### Task 2.1: Uncomment revalidatePath Calls

- **Priority**: High
- **Risk**: Low (restoring intended functionality)
- **Files**: `src/lib/actions.ts`
- **Dependencies**: Task 1.3 (modifying same file)
- **Actions**:
  - Uncomment all 15 `revalidatePath()` calls at lines 30, 55, 75, 92, 111, 131, 174, 220, 242, 292, 336, 358, 396, 437, 462
  - Verify each path string is correct for its corresponding entity list page
- **ANALYZE**: Map each revalidatePath call to its target list page
- **PRESERVE**: No existing behavior depends on stale cache (cache was simply never invalidated)
- **IMPROVE**: Activate cache invalidation for fresh data on CRUD operations

### Task 2.2: Fix deleteActionMap in FormModal

- **Priority**: High
- **Risk**: Medium (requires new server actions or UI changes)
- **Files**: `src/components/FormModal.tsx`, `src/lib/actions.ts`
- **Dependencies**: Task 1.3 (actions.ts already modified)
- **Actions**:
  - Option A (preferred): Create proper delete actions (`deleteParent`, `deleteLesson`, `deleteAssignment`, `deleteResult`, `deleteAttendance`, `deleteEvent`, `deleteAnnouncement`) in `actions.ts`
  - Option B (fallback): Disable the delete button for entity types without implemented delete actions
  - Update the `deleteActionMap` object in FormModal to reference correct actions
- **ANALYZE**: Identify which entity delete actions already exist vs need creation
- **PRESERVE**: Existing working deletes (subject, class, teacher, student, exam) remain unchanged
- **IMPROVE**: Map all 12 entity types to correct delete actions

### Task 2.3: Fix Results Page Null Safety

- **Priority**: High
- **Risk**: Low (additive filter)
- **Files**: `src/app/(dashboard)/list/results/page.tsx`
- **Dependencies**: None
- **Actions**:
  - Add `.filter(Boolean)` after the `.map()` call on lines 188-206
  - Alternatively, add a type guard filter: `.filter((item): item is ResultItem => item !== null)`
- **ANALYZE**: Trace data flow to understand when null values appear
- **PRESERVE**: Non-null entries render identically
- **IMPROVE**: Filter null entries to prevent Table component crash

### Task 2.4: Transactional Clerk + Prisma Deletes

- **Priority**: High
- **Risk**: Medium (error handling change)
- **Files**: `src/lib/actions.ts`
- **Dependencies**: Task 1.3
- **Actions**:
  - Wrap `deleteTeacher` (lines 234-237) Prisma delete in try/catch after Clerk deletion
  - Wrap `deleteStudent` (lines 350-357) Prisma delete in try/catch after Clerk deletion
  - On Prisma failure: log error with both Clerk and Prisma identifiers
  - Return error response indicating partial failure
- **ANALYZE**: Map the Clerk-then-Prisma deletion sequence and failure modes
- **PRESERVE**: Success path remains identical
- **IMPROVE**: Add error handling for partial failure scenario

---

## Milestone 3: Bug Fixes (Tertiary Goal)

### Task 3.1: Fix Assignment Page Operator Precedence

- **Priority**: Medium
- **Risk**: Low (single-line fix)
- **Files**: `src/app/(dashboard)/list/assignments/page.tsx`
- **Dependencies**: None
- **Actions**:
  - Change `role === "admin" || role === "teacher" && (...)` to `(role === "admin" || role === "teacher") && (...)`
  - Lines 180-183
- **ANALYZE**: Confirm the operator precedence issue via code inspection
- **PRESERVE**: Teacher visibility remains unchanged
- **IMPROVE**: Admin now correctly sees the create button

### Task 3.2: Fix Student Page Empty Class Crash

- **Priority**: Medium
- **Risk**: Low (null guard)
- **Files**: `src/app/(dashboard)/student/page.tsx`
- **Dependencies**: None
- **Actions**:
  - Add guard before `classItem[0].id` on line 24
  - Example: `const classId = classItem?.[0]?.id` with fallback behavior
  - If no class: show appropriate message or empty state
- **ANALYZE**: Determine what data student dashboard needs from class
- **PRESERVE**: Students with classes see identical UI
- **IMPROVE**: Students without classes see graceful fallback

### Task 3.3: Fix Form Validation Error Message

- **Priority**: Low
- **Risk**: None (string change)
- **Files**: `src/lib/formValidationSchemas.ts`
- **Dependencies**: None
- **Actions**:
  - Change "Subject name is required!" to "Class name is required!" on line 13
- **ANALYZE**: Verify this is the class form schema, not subject
- **PRESERVE**: Subject form schema retains its correct message
- **IMPROVE**: Class form shows correct error

### Task 3.4: Remove console.log Statements

- **Priority**: Medium
- **Risk**: Low (removal of debug code)
- **Files**: `src/lib/actions.ts`, `src/components/forms/StudentForm.tsx`, `src/components/forms/TeacherForm.tsx`, `src/components/forms/ClassForm.tsx`, `src/components/forms/ExamForm.tsx`, `src/components/forms/SubjectForm.tsx`, `src/app/(dashboard)/student/page.tsx`
- **Dependencies**: None (can be done in parallel with other tasks)
- **Actions**:
  - Search all `.ts` and `.tsx` files for `console.log`
  - Remove all 24+ instances
  - Verify no `console.error` or `console.warn` used for legitimate error logging is removed
- **ANALYZE**: Grep for all console.log statements and classify
- **PRESERVE**: No runtime behavior depends on console.log output
- **IMPROVE**: Clean production code free of debug statements

### Task 3.5: Rename BigCalender to BigCalendar

- **Priority**: Low
- **Risk**: Low (requires import updates across files)
- **Files**: `src/components/BigCalender.tsx`, all importing files
- **Dependencies**: None
- **Actions**:
  - Rename `src/components/BigCalender.tsx` to `src/components/BigCalendar.tsx`
  - Search and update all imports: `import BigCalendar from "@/components/BigCalender"` to `BigCalendar`
  - Verify no dynamic imports or string references exist
- **ANALYZE**: Grep for all references to BigCalender
- **PRESERVE**: Component behavior unchanged
- **IMPROVE**: Correct spelling across codebase

### Task 3.6: Fix Prisma Schema Typo

- **Priority**: Medium
- **Risk**: Medium (requires migration)
- **Files**: `prisma/schema.prisma`
- **Dependencies**: Must be done before any other Prisma changes
- **Actions**:
  - Change `classess` to `classes` on line 73
  - Generate Prisma migration: `npx prisma migrate dev --name fix-classess-typo`
  - Verify migration renames the relation field correctly
  - Test all queries that reference this field
- **ANALYZE**: Identify all code referencing `classess` vs `classes`
- **PRESERVE**: All existing data remains intact via rename migration
- **IMPROVE**: Correct field name in schema

### Task 3.7: Fix Docker Compose Typo

- **Priority**: Low
- **Risk**: None (config fix)
- **Files**: `docker-compose.yml`
- **Dependencies**: None
- **Actions**:
  - Change `postgress` to `postgres`
- **ANALYZE**: Identify where the typo appears (service name, image name, or both)
- **PRESERVE**: If service name changes, update all references
- **IMPROVE**: Correct spelling

---

## Milestone 4: Dependency Upgrade (Final Goal)

### Task 4.1: Next.js Upgrade

- **Priority**: Critical (security)
- **Risk**: High (potential breaking changes)
- **Files**: `package.json`, `package-lock.json`
- **Dependencies**: All other tasks should be completed first to isolate upgrade issues
- **Actions**:
  - Research latest patched Next.js 14.x version
  - Update `package.json` with new version
  - Run `npm install`
  - Run `npm audit fix` for remaining vulnerabilities
  - Test all pages, server actions, and middleware
  - Verify no breaking changes in routing, server components, or middleware behavior
- **ANALYZE**: Review Next.js 14.x changelog for breaking changes between 14.2.5 and latest
- **PRESERVE**: Full application functionality test before and after upgrade
- **IMPROVE**: Resolve 13 known CVEs

---

## Risk Analysis

| Risk | Severity | Mitigation |
|------|----------|------------|
| Prisma schema rename requires migration | Medium | Use `prisma migrate dev` with explicit rename; test on local DB first |
| Next.js upgrade breaks existing pages | High | Upgrade last; test all pages manually and with automated tests |
| Server action auth breaks existing workflows | Medium | Implement incrementally; test each action with valid and invalid roles |
| Clerk+Prisma delete partial failure | Medium | Add comprehensive error logging; manual resolution documented |
| BigCalendar rename breaks imports | Low | Use Grep to find all references before renaming |
| `.env` removal from VCS history | Low | Use `.gitignore` going forward; advise credential rotation |

---

## Dependency Graph

```
Task 1.1 (.gitignore) ──────────────────────────────────────> Independent
Task 1.2 (Middleware) ──────────────────────────────────────> Independent
Task 1.3 (Server Auth) ────> depends on Task 1.2 pattern
Task 2.1 (revalidatePath) ─> depends on Task 1.3 (same file)
Task 2.2 (deleteActionMap) ─> depends on Task 1.3 (same file)
Task 2.3 (Results null) ───────────────────────────────────> Independent
Task 2.4 (Transactional) ──> depends on Task 1.3 (same file)
Task 3.1 (Assignments) ────────────────────────────────────> Independent
Task 3.2 (Student page) ───────────────────────────────────> Independent
Task 3.3 (Validation msg) ─────────────────────────────────> Independent
Task 3.4 (console.log) ────────────────────────────────────> Independent
Task 3.5 (BigCalendar) ────────────────────────────────────> Independent
Task 3.6 (Prisma typo) ────> must precede any other Prisma changes
Task 3.7 (Docker typo) ────────────────────────────────────> Independent
Task 4.1 (Next.js upgrade) ─> depends on ALL other tasks
```

---

## Implementation Order (Recommended Sequence)

1. Task 1.1 -- `.gitignore` and `.env.example` (no risk, immediate security win)
2. Task 1.2 -- Middleware fix (low risk, isolated)
3. Task 3.6 -- Prisma schema fix + migration (must precede other Prisma work)
4. Task 1.3 -- Server action authorization (medium risk, behavior change)
5. Task 2.1 -- Uncomment revalidatePath calls (low risk, same file as 1.3)
6. Task 2.2 -- Fix deleteActionMap (medium risk, needs new server actions)
7. Task 2.4 -- Transactional Clerk+Prisma deletes (medium risk)
8. Task 2.3 -- Fix null crash in results page (low risk)
9. Task 3.1 -- Fix assignment page operator precedence (low risk)
10. Task 3.2 -- Fix student page crash (low risk)
11. Task 3.3 -- Fix form validation error message (low risk)
12. Task 3.4 -- Remove console.logs (low risk)
13. Task 3.5 -- Rename BigCalender to BigCalendar (low risk, import updates)
14. Task 3.7 -- Docker-compose typo fix (low risk)
15. Task 4.1 -- Next.js upgrade (high risk, test thoroughly)

---

## Expert Consultation Recommendations

- **expert-backend**: Recommended for server action authorization patterns, transactional delete handling, and Prisma migration strategy
- **expert-security**: Recommended for validating authorization implementation, secrets management, and CVE remediation
- **expert-frontend**: Recommended for UI bug fixes (operator precedence, empty state handling, component rename)
