# Product Overview: Hua Readwise - School Management System

## Project Identity

**Project Name**: Hua Readwise - School Management System
**Version**: 0.1.0
**Type**: Full-stack web application (Next.js 16, App Router)
**Status**: Active development

## Description

Hua Readwise is a comprehensive school management dashboard built with Next.js 16, designed to manage the full scope of academic operations for a bi-weekly school (Saturday and Sunday sessions only). The platform serves K-12 and Secondary students through four distinct user roles: admin, teacher, student, and parent.

The system addresses a unique operational challenge: with only two school days per week, a 12-day gap exists between sessions. This creates measurable knowledge retention challenges that the planned LMS features are designed to solve through spaced repetition and ongoing digital engagement between physical school days.

## Target Audience

### School Administrators
Administrators require a centralized view of all school operations. They manage the complete roster of students, teachers, parents, classes, subjects, lessons, exams, assignments, and announcements. They monitor attendance trends across the school, review grade distributions, and resolve scheduling conflicts before they affect learning. The admin role has unrestricted access to all CRUD operations across all 12 entities.

### Teachers
Teachers require tools to manage their specific classes and subjects without being exposed to system-wide administrative data. They create and update lesson schedules, record attendance, enter exam and assignment results, and communicate with students and parents through announcements. The teacher dashboard surfaces class-specific analytics so educators can identify struggling students before issues escalate.

### Students
Students require a read-focused interface that surfaces their personal academic data. They view their weekly schedule via BigCalendar, track upcoming exams and assignment deadlines, review their own grades and attendance history, and receive school announcements. The student experience is designed to be informative and low-friction, with no administrative capabilities.

### Parents
Parents require visibility into their children's academic progress without direct access to operational tools. They monitor attendance records, review grade reports, view upcoming events, and read school announcements. Where a parent has multiple children enrolled, the parent dashboard aggregates data for each child in a unified view.

## Business Context

**School Type**: Bi-weekly (Saturday and Sunday sessions only)
**Student Levels**: K-12 and Secondary
**Scale**: Under 500 users across all roles
**Core Challenge**: The 12-day gap between school sessions creates knowledge retention and re-engagement difficulties. Students lose momentum between sessions. Teachers must re-establish context at the start of each Saturday session. The planned LMS features are designed to bridge this gap through asynchronous digital engagement.

## Core Features (Existing)

### 1. Role-Based Dashboards
Each of the four roles receives a distinct dashboard with role-appropriate widgets, navigation, and data visibility. Admin sees school-wide analytics. Teacher sees class and subject data. Student sees personal academic data. Parent sees child-specific data. Access control is enforced at both the routing level and the Server Action level using Clerk's `publicMetadata.role` field.

### 2. Complete CRUD for 12 Entities
Full create, read, update, and delete operations are implemented for: students, teachers, parents, classes, subjects, lessons, exams, assignments, results, attendance, events, and announcements. Each entity has a dedicated list page under `/list/[entity]`, a server-side-rendered table, pagination, search, and a modal-based form for create and update operations.

### 3. Attendance Tracking with Heatmap Visualization
Attendance is recorded per student per lesson. The `AttendanceHeatmap` component renders a calendar-based heatmap showing attendance density over time. The `AttendanceChart` provides bar chart breakdowns by period. Attendance data feeds into student detail pages and parent dashboards as quick-stat cards.

### 4. Grade Reports with CSV Export
Grade data from the `Result` model (exam scores and assignment scores) is aggregated into report cards. The `ReportCardTable` component calculates per-subject averages and overall student performance. The `ExportButton` triggers a call to `/api/export` to generate a downloadable CSV file containing the grade data, suitable for external record-keeping.

### 5. Lesson Conflict Detection
When creating or updating lessons, the system checks for scheduling conflicts where a teacher or class is already assigned to another lesson in the same time slot on the same day. Conflicts are detected in the `createLesson` and `updateLesson` Server Actions before the Prisma write, and validation errors are surfaced back to the form.

### 6. BigCalendar Weekly Schedules
The `BigCalendar` component (backed by React Big Calendar) renders a weekly view of lessons. For teachers and students, the calendar is filtered to show only their assigned lessons. The `BigCalendarContainer` fetches the current day's lessons and passes them as events to the calendar. Day selection via `react-calendar` updates the displayed week.

### 7. In-App Notification System
The `NotificationBell` component in the navbar displays an unread count badge. The `NotificationDropdown` renders a list of recent notifications. Notifications are created by Server Actions when relevant events occur. The `notificationActions.ts` module handles notification creation and marking notifications as read.

### 8. Advanced Filtering with ListFilter Component
The `ListFilter` component provides multi-criteria filtering on list pages. Users can filter by multiple fields simultaneously. Filters are reflected in URL query parameters, making filtered views shareable and bookmarkable. Server Components read the search params and pass filter conditions to Prisma queries.

### 9. Student and Teacher Detail Pages with Report Cards
Each student has a detail page at `/list/students/[id]` that aggregates all data related to that student: personal information, class enrollment, attendance history, grade summary, and upcoming events. Teacher detail pages similarly aggregate class assignments, subject coverage, and schedule. Report card sections use the `ReportCardTable` component.

### 10. Class Occupancy and Analytics Charts
The `ClassOccupancyChart` visualizes how many students are enrolled in each class relative to its capacity. The `CountChart` and `CountChartContainer` provide gender breakdown charts for student and teacher populations. The `AttendanceChartContainer` provides school-wide attendance trend data for the admin dashboard. All charts use Recharts.

## LMS Features (Implemented - Phase 1)

The following LMS features were implemented in SPEC-LMS-001 to address the knowledge retention challenge created by the bi-weekly schedule.

### 11. Learning Management System

A full course and content delivery layer allowing teachers to publish learning materials and instructional content that students can access between school sessions. Courses are organized into modules, and modules contain individual lessons. Each lesson supports four content types: `TEXT`, `VIDEO`, `LINK`, and `MIXED`.

**Target users:**
- **Teachers**: Create and publish courses, organize content into modules and lessons, set course status (DRAFT, PUBLISHED, ARCHIVED), manage enrollments.
- **Students**: Browse available courses, enroll in courses, consume lesson content, track their own lesson completion progress, take quizzes.
- **Admins**: Manage all enrollments, view enrollment status across all courses, manually enroll or unenroll students.

**Key capabilities:**
- Course creation with title, description, subject link, and status lifecycle (DRAFT → PUBLISHED → ARCHIVED)
- Module-based content organization with ordering and descriptions
- Lesson content delivery supporting text, embedded video, external links, and mixed media
- Per-student lesson completion tracking with timestamps and progress status (`NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`)
- `CourseProgressBar` component showing aggregate completion percentage per enrolled student
- `EnrolledCourses` widget on the student dashboard surfacing active enrollments

**Routes added:**
- `/list/courses` — Course listing page with enrollment status indicators
- `/list/courses/[id]` — Course detail page with module and lesson tree
- `/list/courses/[id]/lesson/[lessonId]` — Individual lesson view with completion tracking
- `/list/enrollments` — Admin and teacher enrollment management page

### 12. Quiz and Assessment Engine

An in-platform quiz builder with a reusable question bank. Teachers author quizzes directly attached to courses. Students take quizzes asynchronously, and the system auto-grades submissions. Quiz scores are recorded per attempt and are available for review.

**Key capabilities:**
- Quiz creation with title, time limit, maximum attempts, passing score threshold, and scheduling (available from / until dates)
- Reusable question bank (`QuestionBank`) allowing questions to be shared across multiple quizzes
- Four question types: `MULTIPLE_CHOICE`, `TRUE_FALSE`, `SHORT_ANSWER`, `ESSAY`
- Per-question answer options with correctness flags and optional explanations
- Auto-grading engine (`src/lib/quizUtils.ts`) using pure functions with no side effects; handles multiple-choice and true/false automatically; flags short answer and essay for manual review
- Three scoring policies: `BEST` (highest attempt score), `LATEST` (most recent attempt score), `AVERAGE` (mean across all attempts)
- Atomic quiz submission via Prisma `$transaction` — all `QuestionResponse` records and the `QuizAttempt` record are written in a single transaction to prevent partial submissions
- `QuizTimer` component providing a countdown with automatic form submission on expiry
- Per-attempt result review at `/list/courses/[id]/quiz/[quizId]/results`

**Routes added:**
- `/list/courses/[id]/quiz/[quizId]` — Quiz-taking interface
- `/list/courses/[id]/quiz/[quizId]/results` — Attempt result review page

### 13. Student Self-Enrollment

A self-service enrollment system allowing students to browse available courses, enroll with a single click, and drop courses they no longer wish to take. Implemented in SPEC-LMS-002.

**Target users:**
- **Students**: Browse ACTIVE courses, self-enroll with capacity enforcement, drop enrolled courses with confirmation dialog
- **Teachers**: Receive notifications when students enroll in or drop their courses
- **Admins**: Set enrollment capacity limits (maxEnrollments) on courses during creation/editing

**Key capabilities:**
- Student-facing course catalog filtered to ACTIVE status courses only
- One-click enrollment with real-time capacity checking
- Atomic capacity enforcement via Prisma `$transaction` to prevent race conditions on capacity-limited courses
- Course drop with confirmation dialog and status update (ACTIVE → DROPPED)
- Re-enrollment support for previously dropped courses (DROPPED → ACTIVE)
- Enrollment capacity limits per course (`maxEnrollments` field, null = unlimited)
- In-app notifications for both students and teachers on enrollment changes
- `EnrollButton` component with contextual states: Enroll (green), Drop Course (red), Full (gray disabled), Completed (blue badge)

## Planned Features (Post-Phase 1)

The following features remain planned for future sprints:

### Discussion Forums
Peer and teacher-moderated forums attached to subjects and classes. Students can continue academic discussions during the 12-day gap between sessions.

### Gamification
Experience points (XP), achievement badges, and learning streaks to incentivize student engagement between sessions. A leaderboard would be visible to students and teachers.

### Progress Tracking and Analytics
Per-student learning velocity dashboards showing time spent on content, quiz performance trends, and engagement metrics between sessions. Teachers receive aggregate class-level insights.

### Spaced Repetition for Knowledge Retention
A spaced repetition system presenting students with review material at algorithmically determined intervals designed to counteract the 12-day retention drop between sessions.

## Primary Use Cases

### Admin Use Cases
1. **Enroll a new student**: Admin creates a student record, links them to a parent, assigns them to a class, and verifies the enrollment is reflected in the class occupancy chart.
2. **Resolve a lesson scheduling conflict**: Admin opens the lesson form, receives a conflict warning for an overlapping time slot, adjusts the time or assigns a different classroom, and saves the updated schedule.
3. **Generate school-wide attendance report**: Admin views the attendance chart on the dashboard to identify weeks with abnormally low attendance and investigates by drilling into individual class or student records.
4. **Post a school announcement**: Admin creates an announcement with a target audience (all roles, or specific role), and the announcement appears in the relevant dashboard feeds immediately.
5. **Export grade data for academic records**: Admin navigates to a class or student result list and triggers the CSV export to download a formatted grade report for submission to a governing body.
6. **Monitor class capacity**: Admin reviews the class occupancy chart to identify classes at or near maximum capacity before approving new student enrollments.

### Teacher Use Cases
1. **Record daily attendance**: Teacher opens the attendance form for their current lesson, marks each student as present, absent, or late, and submits. The record is immediately available to parents on their dashboards.
2. **Enter exam results**: After grading, the teacher opens the result form for the relevant exam, enters scores per student, and submits. Students and parents can view the results through their respective dashboards.
3. **View today's schedule**: Teacher opens the BigCalendar view and sees all lessons assigned to them for the current week, including subject, class, start time, and end time.
4. **Create a new lesson**: Teacher fills out the lesson form specifying subject, class, day, start time, and end time. The system validates against conflicts before saving.
5. **Review student performance**: Teacher opens a student detail page to review that student's attendance rate, recent exam scores, and grade trend before a parent meeting.
6. **Post a class announcement**: Teacher creates an announcement targeted to a specific class to notify students and parents of upcoming assignments or schedule changes.

### Student Use Cases
1. **Check weekly schedule**: Student opens the BigCalendar view to see all lessons for the coming Saturday and Sunday sessions.
2. **Review upcoming exams**: Student views the upcoming exams widget on their dashboard to see exam dates, subjects, and any attached notes from the teacher.
3. **Check assignment deadlines**: Student reviews the assignments due widget to see open assignments and their due dates.
4. **View grade history**: Student navigates to their grade summary to see scores for completed exams and assignments, organized by subject.
5. **Check attendance record**: Student reviews their attendance heatmap to see which sessions they have missed and verify their overall attendance percentage.
6. **Read school announcements**: Student reads the announcements feed on their dashboard to stay informed about school events, closures, or policy changes.

### Parent Use Cases
1. **Monitor child's attendance**: Parent opens the child overview section and views the attendance card showing the current attendance rate and recent absence dates.
2. **Review child's latest grades**: Parent views the grade summary for their child to see recent exam and assignment scores by subject.
3. **Check upcoming events**: Parent views the event calendar to see scheduled school events, exam dates, and other important dates.
4. **Read announcements**: Parent reviews the announcements feed to stay informed about school news and teacher communications.
5. **View child's schedule**: Parent can view the weekly lesson schedule for their child to know which subjects are being covered each session.
6. **Monitor multiple children**: Where a parent has more than one enrolled child, the parent dashboard provides a tabbed or aggregated view for each child's data.
