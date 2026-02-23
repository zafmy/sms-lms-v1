# SPEC-NEXTJS-UPGRADE-001: Acceptance Criteria

## Metadata

| Field       | Value                                       |
|-------------|---------------------------------------------|
| SPEC ID     | SPEC-NEXTJS-UPGRADE-001                     |
| Title       | Next.js 14 to 16 Full Stack Upgrade         |
| Created     | 2026-02-21                                  |

---

## Quality Gate Criteria

- **Build**: `next build` produces zero errors and zero warnings
- **Dev Server**: `next dev` starts successfully with Turbopack
- **Lint**: `eslint .` produces zero errors
- **TypeScript**: `npx tsc --noEmit` produces zero type errors
- **Prisma**: `npx prisma generate` completes successfully

---

## Milestone 1: Core Framework Upgrade

### AC-1.1: Next.js and React Version Verification

```gherkin
Given the application dependencies have been upgraded
When I check the installed versions with "npm ls next react react-dom"
Then Next.js version shall be 16.x.x
And React version shall be 19.x.x
And React DOM version shall be 19.x.x
```

### AC-1.2: Build Success

```gherkin
Given all Milestone 1 changes are applied
When I run "next build"
Then the build shall complete with zero errors
And the build output shall show all routes compiled successfully
```

### AC-1.3: Dev Server with Turbopack

```gherkin
Given all Milestone 1 changes are applied
When I run "next dev"
Then the dev server shall start using Turbopack by default
And no startup errors or warnings shall appear
And the application shall be accessible at localhost:3000
```

### AC-1.4: Async searchParams - Teacher List Page

```gherkin
Given the teacher list page has been migrated to async searchParams
When I navigate to "/list/teachers"
Then the page shall render the teacher list correctly

When I navigate to "/list/teachers?search=John"
Then the page shall filter teachers by the search term "John"

When I navigate to "/list/teachers?page=2"
Then the page shall display the second page of results

When I navigate to "/list/teachers?subjectId=1"
Then the page shall filter teachers by subject
```

### AC-1.5: Async searchParams - All List Pages

```gherkin
Given all 13 list pages have been migrated to async searchParams
When I navigate to each of the following pages:
  | Page URL                  |
  | /admin                    |
  | /list/announcements       |
  | /list/assignments         |
  | /list/attendance          |
  | /list/classes             |
  | /list/events              |
  | /list/exams               |
  | /list/lessons             |
  | /list/parents             |
  | /list/results             |
  | /list/students            |
  | /list/subjects            |
  | /list/teachers            |
Then each page shall render without errors
And pagination shall work correctly on each page
And search filtering shall work correctly on each page
```

### AC-1.6: Async params - Dynamic Routes

```gherkin
Given all dynamic route pages have been migrated to async params
When I navigate to "/list/teachers/[valid-teacher-id]"
Then the teacher detail page shall render correctly with teacher data

When I navigate to "/list/students/[valid-student-id]"
Then the student detail page shall render correctly with student data

When I navigate to "/list/students/[valid-student-id]/report-card"
Then the report card page shall render correctly
```

### AC-1.7: Async params - API Route

```gherkin
Given the export API route has been migrated to async params
When I send a GET request to "/api/export/teachers"
Then the API shall return CSV data with correct headers
And the response status shall be 200
```

### AC-1.8: useActionState Migration - Form Submission

```gherkin
Given all form components have been migrated from useFormState to useActionState
When I open the teacher creation form
And I fill in all required fields with valid data
And I submit the form
Then the form shall submit successfully
And a success message shall appear
And the new teacher shall appear in the teacher list

When I fill in the form with invalid data (empty required fields)
And I submit the form
Then validation errors shall be displayed
And the form shall not submit
```

### AC-1.9: useActionState Migration - All Form Types

```gherkin
Given all 12 form types have been migrated to useActionState
When I test create operations for each form type:
  | Form Type      |
  | Teacher        |
  | Student        |
  | Parent         |
  | Subject        |
  | Class          |
  | Lesson         |
  | Exam           |
  | Assignment     |
  | Result         |
  | Attendance     |
  | Event          |
  | Announcement   |
Then each form shall submit successfully with valid data
And each form shall display validation errors for invalid data
And update operations shall work for each form type
And delete operations shall work for each form type
```

### AC-1.10: Middleware (Proxy) Route Protection

```gherkin
Given middleware.ts has been renamed to proxy.ts
When an unauthenticated user navigates to "/list/teachers"
Then the user shall be redirected to the sign-in page

When an authenticated user with "teacher" role navigates to "/admin"
Then the user shall be redirected to their role-appropriate page

When an authenticated user with "admin" role navigates to "/admin"
Then the admin dashboard shall render correctly
```

### AC-1.11: Clerk Auth Async Migration

```gherkin
Given all auth() calls have been updated to await auth()
When an authenticated admin user navigates to any list page
Then the "Actions" column shall be visible in tables
And the "Create" button shall be visible

When an authenticated teacher user navigates to any list page
Then the "Actions" column shall not be visible
And the "Create" button shall not be visible
```

---

## Milestone 2: Dependency and Library Updates

### AC-2.1: Clerk v6 Authentication

```gherkin
Given @clerk/nextjs has been upgraded to v6
When a user signs in with valid credentials
Then the user shall be authenticated successfully
And the session shall be established with correct role metadata

When a user signs out
Then the session shall be destroyed
And the user shall be redirected to the sign-in page

When middleware protects a route
Then unauthenticated requests shall be redirected
And role-based access control shall function correctly
```

### AC-2.2: Recharts v3 Charts

```gherkin
Given recharts has been upgraded to v3
When I navigate to the admin dashboard
Then all chart components shall render correctly:
  | Chart Type         | Location            |
  | BarChart           | Dashboard overview  |
  | LineChart          | Analytics section   |
  | PieChart           | Distribution view   |
  | RadialBarChart     | Performance widget  |
And chart data shall display correctly
And chart interactivity (tooltips, hover) shall work
And responsive sizing shall function at all breakpoints
```

### AC-2.3: react-hook-form Compatibility

```gherkin
Given react-hook-form has been verified for React 19 compatibility
When I open any form and type in an input field
Then the form state shall update correctly
And validation shall trigger on blur or submit

When I use controlled inputs with watch()/useWatch()
Then the watched values shall update in real-time
And no React warnings shall appear in the console
```

### AC-2.4: react-big-calendar Rendering

```gherkin
Given react-big-calendar is compatible with React 19
When I navigate to a teacher detail page
Then the teacher's schedule calendar shall render correctly
And calendar events shall display with correct styling
And week/day view navigation shall work
And custom event styling from globals.css shall apply correctly
```

### AC-2.5: Prisma Database Operations

```gherkin
Given Prisma is compatible with Turbopack
When I run "npx prisma generate"
Then the Prisma client shall generate successfully

When I run "npx prisma db seed"
Then the seed data shall be inserted correctly

When the application performs database queries
Then all CRUD operations shall work correctly
And Prisma transaction queries shall function correctly
And relation queries (include, select) shall return correct data
```

### AC-2.6: Supporting Libraries

```gherkin
Given all supporting libraries have been updated
When I trigger a toast notification (react-toastify)
Then the notification shall appear correctly

When I interact with the calendar widget (react-calendar)
Then the calendar shall render and respond to clicks

When I upload an image (next-cloudinary)
Then the upload shall function correctly

When Zod validates form data
Then validation shall work identically to pre-upgrade behavior
```

### AC-2.7: No Console Warnings

```gherkin
Given all Milestone 2 dependencies are updated
When I navigate through the application
Then the browser console shall not contain React deprecation warnings
And the browser console shall not contain "useFormState is deprecated" warnings
And the server console shall not contain peer dependency warnings during runtime
```

---

## Milestone 3: ESLint 9 Flat Config Migration

### AC-3.1: ESLint Configuration

```gherkin
Given ESLint has been upgraded to v9 with flat config
When I check for the configuration file
Then "eslint.config.mjs" shall exist in the project root
And ".eslintrc.json" shall not exist in the project root
```

### AC-3.2: Lint Execution

```gherkin
Given the flat config is properly configured
When I run "npm run lint"
Then ESLint shall execute using the flat config format
And the lint run shall complete with zero errors
And TypeScript files shall be included in the lint scope
```

### AC-3.3: Next.js Rules Active

```gherkin
Given eslint-config-next rules are configured via FlatCompat
When I introduce a Next.js anti-pattern (e.g., using <img> instead of <Image>)
Then ESLint shall report the Next.js specific warning/error
```

---

## Milestone 4: Tailwind CSS v4 Migration

### AC-4.1: Tailwind CSS Configuration

```gherkin
Given Tailwind CSS has been upgraded to v4
When I check the project configuration
Then "postcss.config.mjs" shall use "@tailwindcss/postcss" plugin
And "globals.css" shall use "@import "tailwindcss"" instead of "@tailwind" directives
And custom colors shall be defined in "@theme" block in CSS
And "tailwind.config.ts" shall be removed (config in CSS)
```

### AC-4.2: Custom Colors Rendering

```gherkin
Given custom colors are migrated to @theme CSS variables
When I navigate to any page using lamaSky color
Then the background shall render as #C3EBFA

When I navigate to any page using lamaPurple color
Then the background shall render as #CFCEFF

When I navigate to any page using lamaYellow color
Then the background shall render as #FAE27C

And all Light variants (lamaSkyLight, lamaPurpleLight, lamaYellowLight) shall render correctly
```

### AC-4.3: Utility Class Rendering

```gherkin
Given utility classes have been updated for Tailwind v4
When I inspect rounded elements
Then border-radius shall match the expected visual appearance

When I inspect elements with shadow classes
Then box-shadow shall match the expected visual appearance

When I inspect elements with border classes
Then border-color shall default correctly (not unexpectedly change to currentColor)
```

### AC-4.4: Responsive Layout

```gherkin
Given Tailwind v4 styles are applied
When I view the application at mobile width (< 768px)
Then the sidebar shall be hidden
And tables shall show only essential columns
And forms shall stack vertically

When I view the application at tablet width (768px - 1024px)
Then the layout shall adapt to medium screen
And additional table columns shall appear

When I view the application at desktop width (> 1024px)
Then the full layout shall display with sidebar
And all table columns shall be visible
```

### AC-4.5: Custom CSS Preservation

```gherkin
Given globals.css contains custom CSS for third-party components
When I view the calendar component
Then react-big-calendar custom styles shall render correctly:
  | Style                          | Expected                    |
  | Calendar width                 | 100%                        |
  | Calendar border                | None                        |
  | Navigation label font weight   | 600 (semibold)              |
  | Active tile background         | #c3ebfa (lamaSky)           |
  | Event nth-child colors         | Alternating pastel colors   |
  | Toolbar label alignment        | Right                       |

When I view the react-calendar widget
Then custom calendar styles shall render correctly
```

### AC-4.6: Table Styling

```gherkin
Given Tailwind v4 border defaults have changed
When I view any list page with a data table
Then table rows shall have bottom borders (border-b)
And even rows shall have slate-50 background
And hover state shall show lamaPurpleLight background
And text sizing shall remain consistent
```

---

## Cross-Cutting Acceptance Criteria

### AC-X.1: Full Build Pipeline

```gherkin
Given all 4 milestones are complete
When I run the following commands in sequence:
  | Command               | Expected Result    |
  | npx prisma generate   | Success            |
  | npx tsc --noEmit      | Zero type errors   |
  | eslint .              | Zero errors        |
  | next build            | Zero errors        |
Then all commands shall pass with expected results
```

### AC-X.2: Complete Smoke Test

```gherkin
Given the fully upgraded application is running
When I perform the following end-to-end workflow:
  1. Sign in as admin user
  2. Navigate to admin dashboard
  3. View all charts on dashboard
  4. Navigate to each list page (13 total)
  5. Use search on teacher list
  6. Use pagination on student list
  7. Use filter on class list
  8. View teacher detail page with calendar
  9. View student detail page
  10. View student report card
  11. Create a new subject via form
  12. Update an existing class via form
  13. Delete a test record via form
  14. Export teachers to CSV
  15. Sign out
  16. Verify redirect to sign-in page
Then all 16 steps shall complete successfully without errors
```

### AC-X.3: No Regressions

```gherkin
Given the upgrade introduces no feature changes
When I compare application behavior before and after upgrade
Then all existing functionality shall work identically
And no new console errors shall appear
And no visual regressions shall be visible
And page load performance shall be equal to or better than pre-upgrade
```

---

## Definition of Done

1. All acceptance criteria in AC-1.x through AC-4.x pass
2. Cross-cutting criteria AC-X.1 through AC-X.3 pass
3. `next build` produces zero errors
4. `next dev` starts with Turbopack without errors
5. `eslint .` produces zero errors
6. `npx tsc --noEmit` produces zero type errors
7. No React deprecation warnings in browser or server console
8. All custom Tailwind colors render correctly
9. All forms submit with proper validation
10. Authentication and authorization work correctly
11. All chart components render with data
12. Calendar component displays events correctly
13. CSV export produces valid output
14. All changes committed with conventional commit format

---

## Verification Methods

| Method | Tools | Coverage |
|--------|-------|----------|
| Build verification | `next build`, `tsc --noEmit` | Type safety, compilation |
| Lint verification | `eslint .` | Code quality, Next.js rules |
| Manual smoke test | Browser, DevTools | All pages, forms, features |
| Console monitoring | Browser DevTools, Server logs | Deprecation warnings, errors |
| Visual review | Browser at multiple viewports | Layout, colors, spacing |
| API testing | curl or browser | Export endpoint, API routes |
| Auth testing | Sign in/out, role switching | Route protection, access control |
