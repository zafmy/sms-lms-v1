---
id: SPEC-FORM-001
type: plan
methodology: hybrid
note: "TDD for new form components (7 new files), DDD for existing file modifications (actions.ts, formValidationSchemas.ts, FormModal.tsx, FormContainer.tsx, assignments page)"
---

# Implementation Plan: SPEC-FORM-001

## 1. Overview

Create 7 missing CRUD form components and integrate them into the existing FormModal/FormContainer architecture. This involves adding Zod schemas, server actions, form components, dynamic imports, relatedData loading, and fixing the assignments page.

## 2. Dependency Graph

```
formValidationSchemas.ts (7 schemas)
         |
         v
    actions.ts (14 server actions) --- depends on schemas for type imports
         |
         v
  Form Components (7 files) --- depend on schemas + actions
         |
         v
  FormModal.tsx (dynamic imports + forms object) --- depends on form components
         |
  FormContainer.tsx (relatedData switch cases) --- independent of form components
         |
         v
  assignments/page.tsx (FormModal -> FormContainer swap) --- depends on FormContainer cases
```

## 3. Milestones

### Milestone 1: Infrastructure (Primary Goal)

**Scope**: Zod validation schemas and server actions for all 7 entities.

**Files Modified**:
- `src/lib/formValidationSchemas.ts` (DDD: modify existing)
- `src/lib/actions.ts` (DDD: modify existing)

**Tasks**:

1.1. Add 7 Zod schemas to `formValidationSchemas.ts`:
  - `assignmentSchema` + `AssignmentSchema` type
  - `eventSchema` + `EventSchema` type
  - `announcementSchema` + `AnnouncementSchema` type
  - `resultSchema` + `ResultSchema` type
  - `lessonSchema` + `LessonSchema` type
  - `parentSchema` + `ParentSchema` type
  - `attendanceSchema` + `AttendanceSchema` type

1.2. Add schema type imports to `actions.ts`:
  - Import all 7 new schema types

1.3. Add `createAssignment` and `updateAssignment` server actions:
  - Auth guard: admin or teacher
  - Teacher ownership verification on lesson (same pattern as exam)
  - Prisma create/update with title, startDate, dueDate, lessonId
  - revalidatePath("/list/assignments")

1.4. Add `createEvent` and `updateEvent` server actions:
  - Auth guard: admin only
  - Prisma create/update with title, description, startTime, endTime, classId (nullable)
  - revalidatePath("/list/events")

1.5. Add `createAnnouncement` and `updateAnnouncement` server actions:
  - Auth guard: admin only
  - Prisma create/update with title, description, date, classId (nullable)
  - revalidatePath("/list/announcements")

1.6. Add `createResult` and `updateResult` server actions:
  - Auth guard: admin or teacher
  - Teacher: verify ownership of exam/assignment lesson
  - Prisma create/update with score, examId, assignmentId, studentId
  - revalidatePath("/list/results")

1.7. Add `createLesson` and `updateLesson` server actions:
  - Auth guard: admin only
  - Prisma create/update with name, day, startTime, endTime, subjectId, classId, teacherId
  - revalidatePath("/list/lessons")

1.8. Add `createParent` and `updateParent` server actions:
  - Auth guard: admin only
  - Create: Clerk user creation with `role: "parent"` metadata (same pattern as Teacher)
  - Update: Clerk user update (username, password, name, surname)
  - Prisma create/update with all Parent fields
  - revalidatePath("/list/parents")

1.9. Add `createAttendance` and `updateAttendance` server actions:
  - Auth guard: admin only
  - Prisma create/update with date, present, studentId, lessonId
  - revalidatePath("/list/attendance")

**Verification**: TypeScript compilation passes, schemas export correctly.

---

### Milestone 2: High-Priority Forms (Secondary Goal)

**Scope**: Assignment, Event, Announcement form components.

**Files Created**:
- `src/components/forms/AssignmentForm.tsx` (TDD: new file)
- `src/components/forms/EventForm.tsx` (TDD: new file)
- `src/components/forms/AnnouncementForm.tsx` (TDD: new file)

**Tasks**:

2.1. Create `AssignmentForm.tsx`:
  - Fields: title (InputField), startDate (InputField datetime-local), dueDate (InputField datetime-local)
  - Select: lessonId from relatedData.lessons
  - Hidden: id (for update)
  - Pattern: matches ExamForm structure

2.2. Create `EventForm.tsx`:
  - Fields: title (InputField), description (InputField), startTime (InputField datetime-local), endTime (InputField datetime-local)
  - Select: classId from relatedData.classes (with empty option for "None")
  - Hidden: id (for update)

2.3. Create `AnnouncementForm.tsx`:
  - Fields: title (InputField), description (InputField), date (InputField datetime-local)
  - Select: classId from relatedData.classes (with empty option for "None")
  - Hidden: id (for update)

**Verification**: Components render without errors, form validation works.

---

### Milestone 3: Medium-Priority Forms (Tertiary Goal)

**Scope**: Result, Lesson form components.

**Files Created**:
- `src/components/forms/ResultForm.tsx` (TDD: new file)
- `src/components/forms/LessonForm.tsx` (TDD: new file)

**Tasks**:

3.1. Create `ResultForm.tsx`:
  - Fields: score (InputField number type)
  - Selects: examId (optional), assignmentId (optional), studentId (required)
  - Hidden: id (for update)
  - Note: Must have at least one of examId or assignmentId

3.2. Create `LessonForm.tsx`:
  - Fields: name (InputField)
  - Selects: day (MONDAY-FRIDAY enum), startTime (datetime-local), endTime (datetime-local), subjectId, classId, teacherId
  - Hidden: id (for update)
  - Most complex form due to 7 fields + 3 selects

**Verification**: Components render, all select dropdowns populate correctly.

---

### Milestone 4: Low-Priority Forms (Optional Goal)

**Scope**: Parent, Attendance form components.

**Files Created**:
- `src/components/forms/ParentForm.tsx` (TDD: new file)
- `src/components/forms/AttendanceForm.tsx` (TDD: new file)

**Tasks**:

4.1. Create `ParentForm.tsx`:
  - Fields: username, password (create only), name, surname, email, phone, address
  - Pattern: similar to TeacherForm but simpler (no img, bloodType, sex, birthday, subjects)
  - No relatedData select dropdowns needed
  - Clerk user creation on create (with parent role)

4.2. Create `AttendanceForm.tsx`:
  - Fields: date (InputField datetime-local), present (checkbox input)
  - Selects: studentId, lessonId from relatedData
  - Hidden: id (for update)

**Verification**: Components render, ParentForm creates Clerk user on create.

---

### Milestone 5: Integration (Final Goal)

**Scope**: Wire everything together in FormModal, FormContainer, and fix assignments page.

**Files Modified**:
- `src/components/FormModal.tsx` (DDD: modify existing)
- `src/components/FormContainer.tsx` (DDD: modify existing)
- `src/app/(dashboard)/list/assignments/page.tsx` (DDD: modify existing)

**Tasks**:

5.1. Add 7 dynamic imports to `FormModal.tsx`:
  ```
  const AssignmentForm = dynamic(() => import("./forms/AssignmentForm"), { loading: () => <h1>Loading...</h1> });
  const EventForm = dynamic(() => import("./forms/EventForm"), { loading: () => <h1>Loading...</h1> });
  const AnnouncementForm = dynamic(() => import("./forms/AnnouncementForm"), { loading: () => <h1>Loading...</h1> });
  const ResultForm = dynamic(() => import("./forms/ResultForm"), { loading: () => <h1>Loading...</h1> });
  const LessonForm = dynamic(() => import("./forms/LessonForm"), { loading: () => <h1>Loading...</h1> });
  const ParentForm = dynamic(() => import("./forms/ParentForm"), { loading: () => <h1>Loading...</h1> });
  const AttendanceForm = dynamic(() => import("./forms/AttendanceForm"), { loading: () => <h1>Loading...</h1> });
  ```

5.2. Add 7 entries to the `forms` object in `FormModal.tsx`:
  - assignment, event, announcement, result, lesson, parent, attendance
  - Each follows the standard `(setOpen, type, data, relatedData) => <XxxForm ... />` pattern

5.3. Add 7 switch cases to `FormContainer.tsx`:
  - `case "assignment"`: Load lessons (with teacher filter if role is teacher)
  - `case "event"`: Load classes
  - `case "announcement"`: Load classes
  - `case "result"`: Load students, exams, assignments (with teacher filter for exams/assignments)
  - `case "lesson"`: Load subjects, classes, teachers
  - `case "parent"`: No relatedData needed (empty object)
  - `case "attendance"`: Load students, lessons (with teacher filter)

5.4. Fix assignments page:
  - Replace `import FormModal from "@/components/FormModal"` with `import FormContainer from "@/components/FormContainer"`
  - Replace `<FormModal table="assignment" type="create" />` with `<FormContainer table="assignment" type="create" />`
  - Replace `<FormModal table="assignment" type="update" data={item} />` with `<FormContainer table="assignment" type="update" data={item} />`
  - Replace `<FormModal table="assignment" type="delete" id={item.id} />` with `<FormContainer table="assignment" type="delete" id={item.id} />`

**Verification**: All 12 entity types render forms when create/update is clicked. No "Form not found!" messages. Assignments page loads relatedData.

---

## 4. Technical Approach

### 4.1 Form Component Template

Every new form follows this exact structure:

```
"use client" directive
imports: zodResolver, useForm, InputField, schema, actions, useFormState, React hooks, toast, useRouter
component props: { type, data, setOpen, relatedData }
useForm with zodResolver
useFormState with create/update action toggle
onSubmit = handleSubmit -> formAction
useEffect for success toast + close + refresh
destructure relatedData
JSX: form > h1 > fields + selects > error span > submit button
export default
```

### 4.2 Server Action Template

Every new server action follows this structure:

```
auth() -> userId + role extraction
role check -> return error if unauthorized
teacher ownership check (if applicable)
prisma.entity.create/update with data mapping
revalidatePath
return success/error
```

### 4.3 Nullable FK Handling

For `classId` in Event and Announcement schemas:
- Schema uses `z.coerce.number().optional()`
- Server action maps: `classId: data.classId || null`
- Form select includes an empty "None" option with value ""

## 5. Risk Analysis

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Type mismatch between Zod schema and Prisma model | Build failure | Medium | Cross-reference schema.prisma for each field type |
| Missing relatedData causing runtime crash | Form unusable | High | Verify all switch cases in FormContainer are complete before testing |
| Teacher ownership check missing for assignments/results | Security gap | Medium | Follow exact same pattern as createExam/updateExam |
| Clerk user creation failure for Parent entity | Create fails silently | Low | Add try-catch with specific Clerk error handling |
| FormContainer async data loading timeout | Slow form rendering | Low | Use Prisma select to minimize query payload |
| `z.coerce.number()` on empty string for optional selects | Validation error on optional fields | High | Use `.optional()` or `.nullable()` and handle empty string in action |

## 6. Architecture Notes

- No new database models or migrations needed
- No new API routes -- all mutations via server actions
- No new pages -- all list pages already exist
- The `FormContainerProps` type in `FormContainer.tsx` already includes all 12 entity names in its union type
- Delete actions for all 7 entities already exist in `actions.ts` (added in SPEC-FIX-001 or present originally)
- The `deleteActionMap` in `FormModal.tsx` already includes all 12 entity types
