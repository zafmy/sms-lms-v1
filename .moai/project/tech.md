# Technology Stack: Hua Readwise

## Core Stack

### Next.js 16
**Version**: `^16` (next@16)
**Role**: Full-stack framework providing App Router, Server Components, Server Actions, and static/dynamic rendering.
**Configuration**: `next.config.mjs` at project root.
**Key features used**:
- App Router with file-system routing
- React Server Components (default for all pages)
- Server Actions for all mutations (form submissions, CRUD operations)
- `revalidatePath` for on-demand cache invalidation after mutations
- Dynamic route segments for entity detail pages (`[id]`)
- Route groups `(dashboard)` for layout sharing without URL impact
- Image optimization via `next/image`

### React 19 + React DOM 19
**Version**: `^19` (react, react-dom)
**Role**: UI rendering library.
**Key features used**:
- Server Components (zero client JavaScript unless explicitly opted in)
- `useActionState` / `useFormState` for Server Action response handling in forms
- `useOptimistic` pattern for responsive UI during action execution
- `Suspense` boundaries for streaming and loading states

### TypeScript 5
**Version**: `^5` (typescript)
**Mode**: Strict mode enabled in `tsconfig.json`
**Role**: Static type checking across the entire codebase.
**Key patterns**:
- Typed Prisma query results used directly as component props
- Zod-inferred types shared between client validation and server action typing
- Explicit return types on all Server Actions

### Tailwind CSS v4
**Version**: `^4.2.0` (tailwindcss, @tailwindcss/postcss)
**Role**: Utility-first CSS framework for all styling.
**Configuration**: CSS-first configuration in `src/app/globals.css` (no `tailwind.config.js` required with v4).
**PostCSS**: `postcss.config.mjs` uses `@tailwindcss/postcss` plugin.
**Key patterns**:
- Responsive design with Tailwind breakpoint prefixes
- Dark mode via Tailwind class strategy
- Custom colors and design tokens defined in `globals.css`

## Database

### PostgreSQL
**Role**: Primary relational database.
**Connection**: Managed via `DATABASE_URL` environment variable.
**Local development**: Docker Compose configuration in `docker-compose.yml` with a PostgreSQL service.

### Prisma ORM
**Version**: `^5.19.1` (@prisma/client, prisma)
**Role**: Type-safe database query client with schema-based migrations.
**Schema location**: `prisma/schema.prisma`
**Key configuration**:
- Generator: `prisma-client-js` outputting to `node_modules/@prisma/client`
- Datasource: PostgreSQL via `DATABASE_URL`
- Seed script: `ts-node --compiler-options {"module":"CommonJS"} prisma/seed.ts`
**Models (24)**: Admin, Student, Teacher, Parent, Class, Subject, Lesson, Exam, Assignment, Result, Attendance, Event, Announcement — plus 11 LMS models added in SPEC-LMS-001: Course, Module, LmsLesson, LessonProgress, Enrollment, Quiz, Question, QuestionBank, AnswerOption, QuizAttempt, QuestionResponse.
**Enums (8)**: `Day` (MONDAY–SUNDAY), `UserSex` (MALE, FEMALE) — plus 6 LMS enums: `CourseStatus` (DRAFT, ACTIVE, ARCHIVED), `ContentType` (TEXT, VIDEO, LINK, MIXED), `ProgressStatus` (NOT_STARTED, IN_PROGRESS, COMPLETED), `EnrollmentStatus` (ACTIVE, DROPPED, COMPLETED), `QuestionType` (MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER, ESSAY), `ScoringPolicy` (BEST, LATEST, AVERAGE).
**Singleton pattern**: `src/lib/prisma.ts` uses `global.prisma` to prevent connection pool exhaustion during Next.js development hot reloads.

## Authentication

### Clerk
**Version**: `^6.38.1` (@clerk/nextjs, @clerk/elements)
**Role**: Authentication provider with embedded user management.
**Integration**:
- `ClerkProvider` wraps the root layout in `src/app/layout.tsx`
- Middleware at `middleware.ts` (not shown in tree but implied) protects dashboard routes and redirects unauthenticated users
- `@clerk/elements` provides customizable sign-in UI components for the `[[...sign-in]]` route
**Authorization model**:
- `publicMetadata.role` field on each Clerk user stores one of four values: `admin`, `teacher`, `student`, `parent`
- Server Actions call `auth()` from `@clerk/nextjs/server` to retrieve the current user and their role
- `routeAccessMap` in `settings.ts` maps URL patterns to permitted roles for middleware-level route protection
**Identity mapping**: Clerk user IDs are stored as `clerkId` string fields on the `Admin`, `Student`, `Teacher`, and `Parent` Prisma models to enable lookups from the authenticated session to the database record.

## Form Stack

### React Hook Form
**Version**: `^7.52.2` (react-hook-form)
**Role**: Performant form state management with uncontrolled inputs.
**Pattern**: Used in all 12 entity form components (`src/components/forms/`). Forms are Client Components using the `useForm` hook.

### Zod
**Version**: `^3.23.8` (zod)
**Role**: Schema declaration and validation.
**Pattern**: Schemas defined in `src/lib/formValidationSchemas.ts` serve dual purpose:
- Client-side validation via `@hookform/resolvers/zod` (passed to `useForm` as `resolver`)
- Server-side validation in Server Actions via `schema.safeParse(data)` before any database operation

### @hookform/resolvers
**Version**: `^3.9.0` (@hookform/resolvers)
**Role**: Bridges React Hook Form and Zod for declarative validation.
**Usage**: `zodResolver(schema)` passed as the `resolver` option to `useForm`.

## UI Libraries

### Recharts
**Version**: `^3.7.0` (recharts)
**Role**: Data visualization charts on dashboards.
**Components used**: `BarChart`, `Bar`, `PieChart`, `Pie`, `RadialBarChart`, `RadialBar`, `LineChart`, `Line`, `ResponsiveContainer`, `Tooltip`, `Legend`
**Pattern**: Chart components are Client Components. Server Component `*Container.tsx` counterparts fetch data from Prisma and pass it as props to the chart Client Components.

### React Big Calendar
**Version**: `^1.19.4` (react-big-calendar)
**Role**: Weekly lesson schedule display.
**Integration**: Wrapped in `BigCalendar.tsx` (Client Component). The `BigCalendarContainer.tsx` Server Component fetches lessons from Prisma, formats them as calendar events using utilities in `utils.ts`, and passes them to `BigCalendar`.
**Localizer**: Uses Moment.js via `momentLocalizer`.
**Types**: `@types/react-big-calendar ^1.8.9` for TypeScript support.

### React Calendar
**Version**: `^5.0.0` (react-calendar)
**Role**: Date picker for selecting the week displayed in BigCalendar.
**Usage**: `EventCalendar.tsx` uses React Calendar for event browsing. Day selection updates a state value that filters the BigCalendar view.

### React Toastify
**Version**: `^10.0.5` (react-toastify)
**Role**: Toast notification system for user feedback on form submissions.
**Setup**: `ToastContainer` added to root layout `src/app/layout.tsx`.
**Usage**: Called in form components after Server Action responses to display success or error messages.

### Next Cloudinary
**Version**: `^6.13.0` (next-cloudinary)
**Role**: Image upload and delivery via Cloudinary CDN.
**Components**: `CldUploadWidget` for image upload in teacher and student forms. `CldImage` for optimized image delivery.
**Configuration**: `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` environment variable.

### Moment.js
**Version**: `^2.30.1` (moment)
**Role**: Date utility library used as the React Big Calendar localizer.
**Note**: Used specifically for `momentLocalizer` in React Big Calendar. New date logic should prefer native `Date` or the `date-fns` library if added in the future.

## Dev Tools

### ESLint
**Version**: `^9.39.3` (eslint)
**Configuration**: `eslint.config.mjs` using ESLint v9 flat config format.
**Plugins**:
- `@next/eslint-plugin-next ^16.1.6` - Next.js-specific rules
- `eslint-plugin-react ^7.37.5` - React best practices
- `eslint-plugin-react-hooks ^5.2.0` - Rules of Hooks enforcement

### TypeScript ESLint
**Version**: `^8.56.0` (typescript-eslint)
**Role**: TypeScript-aware linting rules integrated into ESLint flat config.

### ts-node
**Version**: `^10.9.2` (ts-node)
**Role**: TypeScript execution for the Prisma seed script (`prisma/seed.ts`).
**Configuration**: Compiler options set in `package.json` Prisma config: `{"module":"CommonJS"}`.

## Build and Deploy

### npm
**Role**: Package manager (no Yarn or pnpm; `package-lock.json` present).
**Key scripts**:
- `npm run dev` - Start development server with hot reload (`next dev`)
- `npm run build` - Production build (`next build`)
- `npm run start` - Start production server (`next start`)
- `npm run lint` - Run ESLint (`eslint .`)
- `npx prisma migrate dev` - Apply database migrations in development
- `npx prisma db seed` - Seed the database with initial data
- `npx prisma generate` - Regenerate Prisma client after schema changes

### Docker
**Configuration**: `Dockerfile` and `docker-compose.yml` at project root.
**Usage**: Local development with a containerized PostgreSQL instance. The `docker-compose.yml` defines a `postgres` service for consistent database setup.

### PostCSS
**Version**: `^8` (postcss)
**Configuration**: `postcss.config.mjs` with `@tailwindcss/postcss` plugin.
**Role**: CSS processing pipeline for Tailwind v4.

## Architecture Decisions

### Server Actions Over API Routes
**Decision**: All data mutations use Next.js Server Actions rather than traditional API routes.
**Rationale**: Server Actions eliminate the need for client-side fetch wrappers, provide automatic CSRF protection, enable progressive enhancement, and integrate natively with React's form model. The `api/export/` route is the only API route, used specifically for file streaming (CSV download) which cannot be done via Server Actions.

### Prisma Singleton Pattern
**Decision**: Prisma client is instantiated once and stored on the `global` object in `src/lib/prisma.ts`.
**Rationale**: Next.js development mode creates new module instances on every hot reload. Without the singleton pattern, each reload would create a new database connection, eventually exhausting the PostgreSQL connection pool.

### `revalidatePath` for Cache Invalidation
**Decision**: Server Actions call `revalidatePath` after successful mutations rather than using `router.refresh()` on the client.
**Rationale**: `revalidatePath` invalidates the Next.js full route cache on the server, ensuring that the next request to the affected route fetches fresh data from the database. This approach keeps cache invalidation co-located with the mutation logic.

### `CldUploadWidget` for Image Handling
**Decision**: Image uploads go directly to Cloudinary from the browser using `CldUploadWidget`, bypassing the Next.js server.
**Rationale**: Direct browser-to-Cloudinary uploads avoid large file payloads passing through the application server. The resulting Cloudinary URL is then stored in the Prisma model as a string field.

### Role-Based Access at Server Action Level
**Decision**: Authorization checks (`auth()` + role verification) are performed inside each Server Action, not only at the middleware level.
**Rationale**: Middleware protects routes but does not prevent direct Server Action invocations. Defense-in-depth requires authorization to be verified at the data mutation layer, regardless of how the action is triggered.

### Zod Schemas Shared Between Client and Server
**Decision**: A single Zod schema per entity is used for both React Hook Form client validation and Server Action server validation.
**Rationale**: Maintaining separate validation schemas creates divergence risk. Sharing schemas via `formValidationSchemas.ts` ensures the client and server always apply identical validation rules.

### LMS Auto-Grading Engine as Pure Functions
**Decision**: The quiz auto-grading logic lives entirely in `src/lib/quizUtils.ts` as pure functions that accept data and return results with no database side effects.
**Rationale**: Keeping grading logic outside of Server Actions makes it independently testable and reusable. The Server Action responsible for quiz submission calls `quizUtils` to compute the score, then writes the result inside a Prisma `$transaction` to guarantee atomicity. This separation prevents a partial submission state where some responses are saved but the attempt record is missing its final score.

### Atomic Quiz Submission via Prisma $transaction
**Decision**: The quiz submission Server Action wraps all writes — creating each `QuestionResponse` record and updating the `QuizAttempt` with its computed score — inside a single `prisma.$transaction` call.
**Rationale**: Quiz submission involves writing multiple rows atomically. If any write fails, the transaction rolls back entirely, preventing the database from entering a state where a student has responses recorded but no finalized attempt. This is critical for scoring correctness and for enforcing attempt limits.

### Atomic Enrollment Capacity Enforcement via Prisma $transaction
**Decision**: The `selfEnrollStudent` Server Action wraps the enrollment capacity check and the enrollment creation inside a single `prisma.$transaction` call when a course has a `maxEnrollments` limit set.
**Rationale**: Without transactional isolation, two concurrent enrollment requests could both pass the capacity check and both create enrollments, exceeding the course capacity. The transaction ensures that the count of active enrollments and the creation of a new enrollment occur atomically, preventing race conditions. When `maxEnrollments` is null (unlimited capacity), the transaction overhead is skipped as an optimization.

### LMS Content Type System
**Decision**: LMS lessons use a `ContentType` enum (`TEXT`, `VIDEO`, `LINK`, `MIXED`) stored on the `LmsLesson` model to describe the primary media type of a lesson's content.
**Rationale**: Typed content enables the frontend to render the appropriate viewer component for each lesson without runtime content sniffing. The `MIXED` type signals that a lesson contains heterogeneous content requiring a combined renderer. This pattern allows content-type-specific UI optimizations (e.g., embedding a video player only when `ContentType` is `VIDEO`) without branching on unstructured content fields.

### Quiz Scoring Policies
**Decision**: The `Quiz` model stores a `ScoringPolicy` enum field (`BEST`, `LATEST`, `AVERAGE`) that determines how the canonical score is computed from a student's multiple attempts.
**Rationale**: Different assessment philosophies require different scoring behaviors. `BEST` rewards effort and retries. `LATEST` reflects the most recent demonstrated understanding. `AVERAGE` measures consistency across attempts. Storing the policy on the quiz model allows teachers to choose the appropriate policy per quiz without requiring application-level configuration changes. The scoring policy is evaluated by `quizUtils.ts` when producing the final score for an enrollment record.

## Development Environment Requirements

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | 18+ | Required for Next.js 16 |
| npm | 9+ | Included with Node.js 18 |
| PostgreSQL | 14+ | Local install or Docker (`docker-compose up`) |
| Clerk account | - | Requires API keys: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` |
| Cloudinary account | - | Requires: `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` |

### Required Environment Variables

```
DATABASE_URL=postgresql://user:password@localhost:5432/hua_readwise
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/admin
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

### Local Setup Steps

1. Clone the repository.
2. Run `npm install` to install all dependencies.
3. Start PostgreSQL via `docker-compose up -d` or a local PostgreSQL instance.
4. Copy `.env.example` to `.env.local` and fill in the required values.
5. Run `npx prisma migrate dev` to apply all migrations to the local database.
6. Run `npx prisma db seed` to populate the database with seed data.
7. Run `npm run dev` to start the development server at `http://localhost:3000`.
