# SPEC-GUIDE-001: Acceptance Criteria

| Field | Value          |
| ----- | -------------- |
| id    | SPEC-GUIDE-001 |
| phase | acceptance     |
| tags  | guide, help, knowledge-base, tour |

---

## Acceptance Scenarios (Given/When/Then)

### REQ-GUIDE-002, REQ-GUIDE-010: Role-Based Guide Visibility

#### AC-01: Admin Sees All Published Guides

```gherkin
Given an admin user is authenticated and has role "admin"
  And there are 10 published guides with various roleAccess configurations
  And there are 3 unpublished guides
When the admin navigates to "/list/guides"
Then all 10 published guides are displayed in the guide list
  And all 3 unpublished guides are also displayed (marked as draft)
  And guides are sorted by category order, then by guide order within each category
  And the "Guides" menu item is visible in the sidebar
```

#### AC-02: Student Sees Only Role-Appropriate Published Guides

```gherkin
Given a student user is authenticated and has role "student"
  And there are 5 published guides with roleAccess including "student"
  And there are 3 published guides with roleAccess ["admin", "teacher"] only
  And there are 2 unpublished guides with roleAccess including "student"
When the student navigates to "/list/guides"
Then only the 5 published guides with "student" in roleAccess are displayed
  And the 3 admin/teacher-only guides are not displayed
  And the 2 unpublished guides are not displayed
  And no create or edit buttons are visible
```

---

### REQ-GUIDE-014, REQ-GUIDE-015: Guide CRUD Operations

#### AC-03: Teacher Creates a Guide in Both Locales

```gherkin
Given a teacher user is authenticated and has role "teacher"
  And the teacher clicks "Create Guide" on the guide listing page
When the teacher fills in the GuideForm with:
  | Field          | Value (en)                    | Value (ms)                        |
  | title          | How to Use the LMS            | Cara Menggunakan LMS              |
  | excerpt        | A quick guide to the LMS      | Panduan ringkas untuk LMS         |
  | content        | ## Getting Started\n...        | ## Mula Di Sini\n...              |
  | category       | LMS & Courses                 | -                                 |
  | roleAccess     | student, teacher              | -                                 |
  | isPublished    | true                          | -                                 |
  And the teacher submits the form
Then a new Guide record is created in the database
  And the Guide's authorId matches the teacher's Clerk userId
  And the Guide's authorRole is "teacher"
  And a GuideTranslation record is created for locale "en" with the English content
  And a GuideTranslation record is created for locale "ms" with the Malay content
  And the guide appears on the listing page for student and teacher users
```

---

### REQ-GUIDE-001, REQ-GUIDE-003, REQ-GUIDE-011: Guide Detail and Markdown Rendering

#### AC-04: Guide Displays in Bahasa Malaysia When Locale Is ms

```gherkin
Given a student user is authenticated with active locale "ms"
  And a published guide exists with:
  | locale | title                     | content                              |
  | en     | How to Submit Assignments | ## Steps\n1. Go to Assignments...    |
  | ms     | Cara Hantar Tugasan       | ## Langkah\n1. Pergi ke Tugasan...   |
When the student navigates to the guide detail page for this guide
Then the page displays the title "Cara Hantar Tugasan"
  And the Markdown content is rendered with the Malay translation
  And headings, ordered lists, and other Markdown elements render correctly
  And breadcrumb navigation shows "Guides > [Category Name in ms] > Cara Hantar Tugasan"
  And all UI chrome (buttons, labels) uses next-intl translations in Bahasa Malaysia
```

---

### REQ-GUIDE-012: Search Functionality

#### AC-05: Search Filters Guides by Title in Active Locale

```gherkin
Given a teacher user is authenticated with active locale "en"
  And the following published guides exist:
  | en title                    | ms title                     | roleAccess         |
  | How to Grade Assignments    | Cara Menilai Tugasan         | admin, teacher     |
  | Setting Up Your Classroom   | Menyediakan Bilik Darjah     | admin, teacher     |
  | Getting Started for Parents | Mula Di Sini untuk Ibu Bapa  | parent             |
When the teacher enters "Grade" in the search field on the guide listing page
Then only "How to Grade Assignments" is displayed in the results
  And "Setting Up Your Classroom" is not displayed
  And "Getting Started for Parents" is not displayed (also excluded by role)
```

---

### REQ-GUIDE-013, REQ-GUIDE-004: Category Filtering

#### AC-06: Category Filtering Works Correctly

```gherkin
Given a student user is authenticated
  And there are published guides in the following categories:
  | Category            | Guide Count (visible to student) |
  | Getting Started     | 2                                |
  | LMS & Courses       | 3                                |
  | For Parents         | 0 (roleAccess excludes student)  |
When the student selects "LMS & Courses" from the category filter dropdown
Then only the 3 guides in "LMS & Courses" category are displayed
  And guides from "Getting Started" are hidden
  And the category filter dropdown shows all categories that have visible guides
  And guides within the filtered category are sorted by their order field
```

---

### REQ-GUIDE-016, REQ-GUIDE-017, REQ-GUIDE-023, REQ-GUIDE-024, REQ-GUIDE-033: Interactive Tours

#### AC-07: Interactive Tour Highlights Elements in Sequence

```gherkin
Given a teacher user is viewing a guide detail page
  And the guide has tourSteps configured as:
  | step | element          | title              | description                    |
  | 1    | #sidebar-menu    | Navigation Menu    | Use this menu to navigate...   |
  | 2    | #course-list     | Your Courses       | Here you can see all courses...|
  | 3    | #create-button   | Create New         | Click here to create...        |
  And the user has not previously completed this tour (no localStorage entry)
When the user clicks the "Start Tour" button
Then driver.js initializes and highlights the #sidebar-menu element
  And the popover shows title "Navigation Menu" and description "Use this menu to navigate..."
When the user clicks "Next"
Then the highlight moves to #course-list with its corresponding popover
When the user clicks "Next"
Then the highlight moves to #create-button with its corresponding popover
When the user clicks "Done" (or the tour auto-completes)
Then the tour overlay is removed
  And localStorage contains an entry keyed by the guide ID indicating completion
  And the "Start Tour" button remains visible for manual re-triggering
  And no data is sent to the server for tour completion tracking
```

---

### REQ-GUIDE-021, REQ-GUIDE-030, REQ-GUIDE-032: Teacher Authorization Restrictions

#### AC-08: Teacher Cannot Edit Another Teacher's Guide

```gherkin
Given teacher "Alice" has authored a guide titled "Alice's Guide to Math"
  And teacher "Bob" is authenticated and has role "teacher"
When Bob views the guide listing page
Then "Alice's Guide to Math" is displayed (it is published with teacher in roleAccess)
  And no edit or delete controls are visible for "Alice's Guide to Math"
When Bob attempts to directly call the updateGuide server action with Alice's guide ID
Then the server action returns { success: false, error: true, message: "Unauthorized" }
  And the guide remains unchanged in the database
```

---

### REQ-GUIDE-020: Admin Universal Edit Access

#### AC-09: Admin Can Edit Any Guide

```gherkin
Given teacher "Alice" has authored a guide titled "Alice's Guide to Math"
  And an admin user is authenticated and has role "admin"
When the admin views the guide listing page
Then edit and delete controls are visible for "Alice's Guide to Math"
When the admin clicks edit on "Alice's Guide to Math"
  And changes the title to "Updated Guide to Math" in both locales
  And submits the form
Then the guide's translations are updated in the database
  And the authorId still reflects Alice's Clerk userId (authorship is preserved)
  And the guide listing shows the updated title
```

---

### REQ-GUIDE-022, REQ-GUIDE-031: Unpublished Guide Visibility

#### AC-10: Unpublished Guides Hidden from Non-Admin Users

```gherkin
Given an admin has created a guide with isPublished set to false
  And the guide has roleAccess set to ["admin", "teacher", "student", "parent"]
When a student user navigates to "/list/guides"
Then the unpublished guide is not displayed in the listing
When a teacher user (who is not the author) navigates to "/list/guides"
Then the unpublished guide is not displayed in the listing
When an admin user navigates to "/list/guides"
Then the unpublished guide is displayed with a visual "Draft" indicator
When the guide author (a teacher) navigates to "/list/guides"
Then the unpublished guide is displayed with a visual "Draft" indicator (own guide)
```

---

## Quality Gate Criteria

### Functional Completeness

- All 8 server actions (createGuide, updateGuide, deleteGuide, getGuides, getGuideById, createCategory, updateCategory, deleteCategory) work correctly
- Guide listing page renders with search, category filter, and pagination
- Guide detail page renders Markdown content in the active locale
- GuideForm supports dual-locale content editing
- driver.js tours initialize and complete correctly
- Floating help button navigates to guide listing

### Authorization

- Admin: Full CRUD on all guides and categories
- Teacher: Create guides; edit/delete only own guides; no category management
- Student/Parent: Read-only access to published, role-filtered guides
- No write endpoints accessible to student or parent roles

### Internationalization

- All UI chrome uses next-intl translations
- Guide content displays in active locale with English fallback
- Category names display in active locale
- No hardcoded English strings in guide components

### Data Integrity

- GuideTranslation has unique constraint on [guideId, locale]
- Deleting a Guide cascades to its GuideTranslation records
- Seed data creates consistent categories and sample guides
- Prisma migration applies and rolls back cleanly

### Performance

- Guide listing page loads within acceptable time for <100 guides
- Prisma contains search returns results without noticeable delay
- Markdown rendering does not block page load (lazy-loaded if needed)

### Accessibility

- Guide cards and buttons are keyboard navigable
- Proper ARIA labels on interactive elements
- Color contrast meets WCAG AA standards
- Floating help button does not obstruct screen reader navigation

---

## Definition of Done

- [ ] All 10 acceptance scenarios pass
- [ ] TypeScript compiles with zero errors
- [ ] ESLint passes with zero errors
- [ ] All guide routes added to routeAccessMap
- [ ] "Guides" menu item visible to all four roles
- [ ] Seed data creates 5 categories and sample guides
- [ ] driver.js tours work with localStorage tracking
- [ ] Floating help button renders on all dashboard pages
- [ ] All text translated in both en and ms locales
- [ ] No console.log statements in production code
