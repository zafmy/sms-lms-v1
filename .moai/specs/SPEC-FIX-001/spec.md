---
id: SPEC-FIX-001
version: "1.0.0"
status: approved
created: "2026-02-21"
updated: "2026-02-21"
author: ZaF
priority: critical
tags:
  - security
  - bug-fix
  - data-integrity
  - code-hygiene
---

# SPEC-FIX-001: Security Hardening and Critical Bug Fixes

## History

| Version | Date       | Author | Description                                      |
|---------|------------|--------|--------------------------------------------------|
| 1.0.0   | 2026-02-21 | ZaF    | Initial specification from codebase audit results |

---

## 1. Environment

- **Platform**: Next.js 14.x school management dashboard
- **Authentication**: Clerk (middleware + server-side `auth()`)
- **Database**: PostgreSQL via Prisma ORM
- **Containerization**: Docker Compose
- **Hosting**: Node.js runtime (SSR + Server Actions)

---

## 2. Assumptions

- A1: The Clerk SDK provides `auth()` and `currentUser()` functions that return session data including `userId` and `sessionClaims.metadata.role`.
- A2: Prisma schema changes require a migration step (`prisma migrate dev`) and may cause data loss if field names change without a rename migration.
- A3: The `BigCalender.tsx` rename requires updating all import paths across the codebase; no dynamic imports reference this file by string.
- A4: Next.js upgrade from 14.2.5 to the latest patched 14.x release may introduce breaking changes that require testing of all pages and server actions.
- A5: The `.env` file currently committed to the repository contains real credentials that must be rotated after removal from version control.

---

## 3. Requirements

### Module 1: Server Action Authorization

**REQ-FIX-001-M1-R1 (Event-Driven)**
**WHEN** a server action in `src/lib/actions.ts` receives a CRUD request, **THEN** the system **shall** verify user authentication via `auth()` from Clerk and enforce role-based authorization before executing any database mutation.

**REQ-FIX-001-M1-R2 (Event-Driven)**
**WHEN** the exam CRUD actions (lines 366-462) are invoked, **THEN** the system **shall** execute the currently commented-out authorization code after uncommenting and completing it with proper role checks.

**REQ-FIX-001-M1-R3 (State-Driven)**
**IF** the authenticated user has the role `teacher`, **THEN** teacher-specific actions (lesson exams, assignments) **shall** verify that the teacher owns the resource before allowing modification.

**REQ-FIX-001-M1-R4 (Unwanted)**
The system **shall not** allow users with `student` or `parent` roles to invoke server actions designated for `admin` or `teacher` roles.

### Module 2: Secrets and Dependency Security

**REQ-FIX-001-M2-R1 (Ubiquitous)**
The system **shall not** store any secrets (API keys, database URLs, authentication tokens) in version-controlled files.

**REQ-FIX-001-M2-R2 (Event-Driven)**
**WHEN** a developer clones the repository, **THEN** the `.gitignore` file **shall** exclude `.env` and `.env.*` files, and a `.env.example` file with placeholder values **shall** be present.

**REQ-FIX-001-M2-R3 (Event-Driven)**
**WHEN** dependencies are installed, **THEN** Next.js **shall** be at a version that resolves all 13 known CVEs present in version 14.2.5, including cache poisoning (CVE-2024-46982), auth bypass, and SSRF vulnerabilities.

**REQ-FIX-001-M2-R4 (Event-Driven)**
**WHEN** `npm audit` is executed, **THEN** the system **shall** report zero critical or high severity vulnerabilities.

### Module 3: Middleware Authorization Fix

**REQ-FIX-001-M3-R1 (State-Driven)**
**IF** a user is authenticated (has a valid `userId`) but has no role assigned in session metadata, **THEN** the middleware **shall** deny access by redirecting the user to a safe denial or role-assignment page instead of implicitly allowing the request.

**REQ-FIX-001-M3-R2 (Unwanted)**
The system **shall not** use non-null assertion operators (`role!`) on the role value in middleware; undefined roles **shall** be handled with explicit conditional logic.

### Module 4: Data Integrity Fixes

**REQ-FIX-001-M4-R1 (Event-Driven)**
**WHEN** a delete action is triggered for any entity type (parent, lesson, assignment, result, attendance, event, announcement) in `src/components/FormModal.tsx`, **THEN** the system **shall** invoke the correct entity-specific delete action instead of the placeholder `deleteSubject`.

**REQ-FIX-001-M4-R2 (Event-Driven)**
**WHEN** a CRUD operation completes successfully in `src/lib/actions.ts`, **THEN** the system **shall** call `revalidatePath()` to invalidate the relevant cached page data. All 15 currently commented-out `revalidatePath()` calls **shall** be uncommented and active.

**REQ-FIX-001-M4-R3 (State-Driven)**
**IF** the results data array in `src/app/(dashboard)/list/results/page.tsx` contains null or undefined entries after the `.map()` transformation, **THEN** the system **shall** filter out those entries before passing data to the `Table` component.

**REQ-FIX-001-M4-R4 (Event-Driven)**
**WHEN** `deleteTeacher` or `deleteStudent` executes a Clerk deletion followed by a Prisma deletion, **THEN** the system **shall** handle failures transactionally: if the Prisma deletion fails after Clerk deletion succeeds, the system **shall** log the inconsistency and either attempt rollback or flag the record for manual resolution.

### Module 5: Bug Fixes and Code Hygiene

**REQ-FIX-001-M5-R1 (State-Driven)**
**IF** a student has no associated class (empty class array), **THEN** the student dashboard page (`src/app/(dashboard)/student/page.tsx`) **shall** render gracefully without crashing on `classItem[0].id`.

**REQ-FIX-001-M5-R2 (Event-Driven)**
**WHEN** a user with `admin` role views the assignments list page, **THEN** the create button **shall** be visible. The operator precedence bug in `src/app/(dashboard)/list/assignments/page.tsx:180-183` **shall** be corrected by wrapping the role check in parentheses.

**REQ-FIX-001-M5-R3 (Ubiquitous)**
The system **shall** display the correct validation error message "Class name is required!" in `src/lib/formValidationSchemas.ts:13` instead of the current incorrect message "Subject name is required!".

**REQ-FIX-001-M5-R4 (Ubiquitous)**
The system **shall not** contain any `console.log` statements in production code. All 24+ instances across `actions.ts`, `StudentForm.tsx`, `TeacherForm.tsx`, `ClassForm.tsx`, `ExamForm.tsx`, `SubjectForm.tsx`, and `student/page.tsx` **shall** be removed.

**REQ-FIX-001-M5-R5 (Ubiquitous)**
The component file `src/components/BigCalender.tsx` **shall** be renamed to `BigCalendar.tsx` (correct spelling), and all import references across the codebase **shall** be updated accordingly.

**REQ-FIX-001-M5-R6 (Ubiquitous)**
The typo `classess` in `prisma/schema.prisma:73` **shall** be corrected to `classes`.

**REQ-FIX-001-M5-R7 (Ubiquitous)**
The typo `postgress` in `docker-compose.yml` **shall** be corrected to `postgres`.

---

## 4. Specifications

### 4.1 Authorization Architecture

All 15 server action functions in `src/lib/actions.ts` shall follow this authorization pattern:

1. Call `const { userId, sessionClaims } = auth()` at the top of each function.
2. If `!userId`, throw an unauthorized error or return an error response.
3. Extract `role` from `sessionClaims?.metadata?.role`.
4. Validate `role` against the allowed roles for the specific action.
5. For teacher-specific actions, verify resource ownership via a database query.

### 4.2 Middleware Flow

The middleware in `src/middleware.ts` shall follow this decision tree:

1. If `!userId` and route is protected: redirect to sign-in.
2. If `userId` and `!role`: redirect to `/no-role` or `/role-assignment`.
3. If `userId` and `role`: proceed with role-based route matching.

### 4.3 Delete Action Map

`src/components/FormModal.tsx` shall maintain a complete mapping:

| Entity       | Delete Action Function |
|--------------|----------------------|
| subject      | deleteSubject        |
| class        | deleteClass          |
| teacher      | deleteTeacher        |
| student      | deleteStudent        |
| exam         | deleteExam           |
| parent       | deleteParent (new)   |
| lesson       | deleteLesson (new)   |
| assignment   | deleteAssignment (new)|
| result       | deleteResult (new)   |
| attendance   | deleteAttendance (new)|
| event        | deleteEvent (new)    |
| announcement | deleteAnnouncement (new)|

### 4.4 Transactional Delete Pattern

For `deleteTeacher` and `deleteStudent`:

1. Begin by deleting from Clerk.
2. Wrap Prisma deletion in try/catch.
3. On Prisma failure: log error with details (Clerk ID deleted, Prisma ID failed).
4. Return error response indicating partial failure requiring manual intervention.

### 4.5 Files in Scope

| File | Changes |
|------|---------|
| `.gitignore` | Add `.env`, `.env.*` |
| `.env.example` | New file with placeholders |
| `src/middleware.ts` | Fix undefined role handling |
| `src/lib/actions.ts` | Auth checks, uncomment revalidatePath, transactional deletes |
| `src/components/FormModal.tsx` | Fix deleteActionMap |
| `src/app/(dashboard)/list/results/page.tsx` | Add `.filter(Boolean)` |
| `src/app/(dashboard)/list/assignments/page.tsx` | Fix operator precedence |
| `src/app/(dashboard)/student/page.tsx` | Add empty class guard |
| `src/lib/formValidationSchemas.ts` | Fix error message |
| `src/components/BigCalender.tsx` | Rename to BigCalendar.tsx |
| All files importing BigCalender | Update import paths |
| `prisma/schema.prisma` | Fix `classess` typo |
| `docker-compose.yml` | Fix `postgress` typo |
| `package.json` | Upgrade Next.js version |
| Multiple form/page files | Remove console.log statements |

### 4.6 Traceability

| Requirement | Module | Priority | Risk |
|-------------|--------|----------|------|
| REQ-FIX-001-M1-R1 to R4 | Server Action Auth | Critical | Medium |
| REQ-FIX-001-M2-R1 to R4 | Secrets & Deps | Critical | High (upgrade) |
| REQ-FIX-001-M3-R1 to R2 | Middleware Fix | Critical | Low |
| REQ-FIX-001-M4-R1 to R4 | Data Integrity | High | Medium |
| REQ-FIX-001-M5-R1 to R7 | Bugs & Hygiene | Medium | Low-Medium |
