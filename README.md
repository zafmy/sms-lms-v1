# Hua Readwise - School Management & LMS Platform

A comprehensive school management system with an integrated Learning Management System (LMS) built for bi-weekly schools. Built with Next.js 16, React 19, Prisma, and PostgreSQL.

## Features

### School Management

- Student, Teacher, Parent, and Admin role management
- Class and Subject organization
- Lesson scheduling with timetable views
- Exam and Assignment management with grading
- Attendance tracking with heatmap visualization
- Grade reports with advanced filtering and CSV export
- Event and Announcement management
- In-app notification system
- Role-based dashboards (Admin, Teacher, Student, Parent)

### Learning Management System (LMS)

- Course creation and lifecycle management (Draft/Active/Archived)
- Hierarchical content organization (Course > Module > Lesson)
- Rich lesson content delivery with YouTube embed support
- Student enrollment management with notifications
- Individual lesson progress tracking
- Course progress visualization with progress bars
- Quiz engine with auto-grading (Multiple Choice, True/False, Fill-in-the-Blank)
- Configurable quiz settings (time limits, attempt limits, scoring policies)
- Question banks organized by subject
- Quiz results with per-question breakdowns

## Tech Stack

- **Framework**: Next.js 16 (App Router, Server Components, Server Actions)
- **Language**: TypeScript 5
- **UI**: React 19, Tailwind CSS v4
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk (role-based: admin, teacher, student, parent)
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Calendar**: React Big Calendar

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Clerk account for authentication

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables (copy `.env.example` to `.env`)
4. Push database schema:
   ```bash
   npx prisma db push
   ```
5. Generate Prisma client:
   ```bash
   npx prisma generate
   ```
6. Run development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
src/
  app/(dashboard)/           # Dashboard pages by role
    admin/                   # Admin dashboard
    teacher/                 # Teacher dashboard
    student/                 # Student dashboard
    parent/                  # Parent dashboard
    list/                    # Entity list pages
      courses/               # LMS course management
        [id]/                # Course detail
          lesson/[lessonId]/ # Lesson viewer
          quiz/[quizId]/     # Quiz taking
      enrollments/           # Enrollment management
      students/              # Student management
      teachers/              # Teacher management
      ...
  components/                # Reusable components
    forms/                   # Form components for CRUD
  lib/                       # Utilities and server actions
    actions.ts               # Server Actions
    formValidationSchemas.ts # Zod validation schemas
    quizUtils.ts             # Quiz auto-grading engine
    prisma.ts                # Prisma client
    settings.ts              # Route access configuration
prisma/
  schema.prisma              # Database schema
```

## Roles and Access

| Role    | Dashboard | Courses | Enrollments | Quiz Taking |
| ------- | --------- | ------- | ----------- | ----------- |
| Admin   | Full      | Full    | Full        | View only   |
| Teacher | Own data  | Own     | View        | View own    |
| Student | Own data  | Enrolled| N/A         | Take quizzes|
| Parent  | Child data| N/A     | N/A         | N/A         |

## License

This project is for educational purposes.
