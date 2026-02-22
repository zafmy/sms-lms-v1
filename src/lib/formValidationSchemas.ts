import { z } from "zod";

export const subjectSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, { message: "Subject name is required!" }),
  teachers: z.array(z.string()), //teacher ids
});

export type SubjectSchema = z.infer<typeof subjectSchema>;

export const classSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, { message: "Class name is required!" }),
  capacity: z.coerce.number().min(1, { message: "Capacity name is required!" }),
  gradeId: z.coerce.number().min(1, { message: "Grade name is required!" }),
  supervisorId: z.coerce.string().optional(),
});

export type ClassSchema = z.infer<typeof classSchema>;

export const teacherSchema = z.object({
  id: z.string().optional(),
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters long!" })
    .max(20, { message: "Username must be at most 20 characters long!" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long!" })
    .optional()
    .or(z.literal("")),
  name: z.string().min(1, { message: "First name is required!" }),
  surname: z.string().min(1, { message: "Last name is required!" }),
  email: z
    .string()
    .email({ message: "Invalid email address!" })
    .optional()
    .or(z.literal("")),
  phone: z.string().optional(),
  address: z.string(),
  img: z.string().optional(),
  bloodType: z.string().min(1, { message: "Blood Type is required!" }),
  birthday: z.coerce.date({ message: "Birthday is required!" }),
  sex: z.enum(["MALE", "FEMALE"], { message: "Sex is required!" }),
  subjects: z.array(z.string()).optional(), // subject ids
});

export type TeacherSchema = z.infer<typeof teacherSchema>;

export const studentSchema = z.object({
  id: z.string().optional(),
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters long!" })
    .max(20, { message: "Username must be at most 20 characters long!" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long!" })
    .optional()
    .or(z.literal("")),
  name: z.string().min(1, { message: "First name is required!" }),
  surname: z.string().min(1, { message: "Last name is required!" }),
  email: z
    .string()
    .email({ message: "Invalid email address!" })
    .optional()
    .or(z.literal("")),
  phone: z.string().optional(),
  address: z.string(),
  img: z.string().optional(),
  bloodType: z.string().min(1, { message: "Blood Type is required!" }),
  birthday: z.coerce.date({ message: "Birthday is required!" }),
  sex: z.enum(["MALE", "FEMALE"], { message: "Sex is required!" }),
  gradeId: z.coerce.number().min(1, { message: "Grade is required!" }),
  classId: z.coerce.number().min(1, { message: "Class is required!" }),
  parentId: z.string().min(1, { message: "Parent Id is required!" }),
});

export type StudentSchema = z.infer<typeof studentSchema>;

export const examSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1, { message: "Title name is required!" }),
  startTime: z.coerce.date({ message: "Start time is required!" }),
  endTime: z.coerce.date({ message: "End time is required!" }),
  lessonId: z.coerce.number({ message: "Lesson is required!" }),
});

export type ExamSchema = z.infer<typeof examSchema>;

export const assignmentSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1, { message: "Title is required!" }),
  startDate: z.coerce.date({ message: "Start date is required!" }),
  dueDate: z.coerce.date({ message: "Due date is required!" }),
  lessonId: z.coerce.number({ message: "Lesson is required!" }),
});

export type AssignmentSchema = z.infer<typeof assignmentSchema>;

export const eventSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1, { message: "Title is required!" }),
  description: z.string().min(1, { message: "Description is required!" }),
  startTime: z.coerce.date({ message: "Start time is required!" }),
  endTime: z.coerce.date({ message: "End time is required!" }),
  classId: z.coerce.number().optional(),
});

export type EventSchema = z.infer<typeof eventSchema>;

export const announcementSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1, { message: "Title is required!" }),
  description: z.string().min(1, { message: "Description is required!" }),
  date: z.coerce.date({ message: "Date is required!" }),
  classId: z.coerce.number().optional(),
});

export type AnnouncementSchema = z.infer<typeof announcementSchema>;

export const resultSchema = z.object({
  id: z.coerce.number().optional(),
  score: z.coerce.number().min(0, { message: "Score must be at least 0!" }),
  examId: z.coerce.number().optional(),
  assignmentId: z.coerce.number().optional(),
  studentId: z.string().min(1, { message: "Student is required!" }),
});

export type ResultSchema = z.infer<typeof resultSchema>;

export const lessonSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, { message: "Lesson name is required!" }),
  day: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"], { message: "Day is required!" }),
  startTime: z.coerce.date({ message: "Start time is required!" }),
  endTime: z.coerce.date({ message: "End time is required!" }),
  subjectId: z.coerce.number({ message: "Subject is required!" }),
  classId: z.coerce.number({ message: "Class is required!" }),
  teacherId: z.string().min(1, { message: "Teacher is required!" }),
});

export type LessonSchema = z.infer<typeof lessonSchema>;

export const parentSchema = z.object({
  id: z.string().optional(),
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters long!" })
    .max(20, { message: "Username must be at most 20 characters long!" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long!" })
    .optional()
    .or(z.literal("")),
  name: z.string().min(1, { message: "First name is required!" }),
  surname: z.string().min(1, { message: "Last name is required!" }),
  email: z
    .string()
    .email({ message: "Invalid email address!" })
    .optional()
    .or(z.literal("")),
  phone: z.string().min(1, { message: "Phone is required!" }),
  address: z.string().min(1, { message: "Address is required!" }),
});

export type ParentSchema = z.infer<typeof parentSchema>;

export const attendanceSchema = z.object({
  id: z.coerce.number().optional(),
  date: z.coerce.date({ message: "Date is required!" }),
  present: z.coerce.boolean(),
  studentId: z.string().min(1, { message: "Student is required!" }),
  lessonId: z.coerce.number({ message: "Lesson is required!" }),
});

export type AttendanceSchema = z.infer<typeof attendanceSchema>;

export const courseSchema = z.object({
  id: z.coerce.number().optional(),
  title: z
    .string()
    .min(1, { message: "Title is required!" })
    .max(200, { message: "Title must be at most 200 characters!" }),
  description: z
    .string()
    .max(1000, { message: "Description must be at most 1000 characters!" })
    .optional()
    .or(z.literal("")),
  code: z
    .string()
    .min(2, { message: "Code must be at least 2 characters!" })
    .max(20, { message: "Code must be at most 20 characters!" })
    .regex(/^[A-Z0-9-]+$/, { message: "Code must contain only uppercase letters, numbers, and hyphens!" }),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"], { message: "Status is required!" }),
  teacherId: z.string().min(1, { message: "Teacher is required!" }),
  subjectId: z.coerce.number({ message: "Subject is required!" }),
  maxEnrollments: z.coerce.number().int().positive().nullable().optional(),
});

export type CourseSchema = z.infer<typeof courseSchema>;

export const moduleSchema = z.object({
  id: z.coerce.number().optional(),
  title: z
    .string()
    .min(1, { message: "Title is required!" })
    .max(200, { message: "Title must be at most 200 characters!" }),
  description: z
    .string()
    .max(500, { message: "Description must be at most 500 characters!" })
    .optional()
    .or(z.literal("")),
  order: z.coerce.number().min(1, { message: "Order must be at least 1!" }),
  isLocked: z.coerce.boolean().default(false),
  courseId: z.coerce.number({ message: "Course is required!" }),
});

export type ModuleSchema = z.infer<typeof moduleSchema>;

export const enrollmentSchema = z.object({
  studentId: z.string().min(1, { message: "Student is required!" }),
  courseId: z.coerce.number({ message: "Course is required!" }),
});

export type EnrollmentSchema = z.infer<typeof enrollmentSchema>;

export const selfEnrollmentSchema = z.object({
  courseId: z.coerce.number().int().positive(),
});

export type SelfEnrollmentSchema = z.infer<typeof selfEnrollmentSchema>;

export const lmsLessonSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1, { message: "Title is required!" }).max(200),
  content: z.string().min(1, { message: "Content is required!" }),
  contentType: z.enum(["TEXT", "VIDEO", "LINK", "MIXED"]),
  externalUrl: z.string().url().optional().or(z.literal("")),
  order: z.coerce.number().int().min(1, { message: "Order must be at least 1!" }),
  estimatedMinutes: z.coerce.number().int().min(1).optional(),
  moduleId: z.coerce.number().min(1, { message: "Module is required!" }),
  flagForReview: z.coerce.boolean().default(false),
});

export type LmsLessonSchema = z.infer<typeof lmsLessonSchema>;

export const quizSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1, { message: "Title is required!" }).max(200),
  description: z.string().max(500).optional().or(z.literal("")),
  timeLimit: z.coerce.number().int().min(1).optional().or(z.literal("")),
  maxAttempts: z.coerce.number().int().min(1).default(1),
  passScore: z.coerce.number().int().min(0).max(100).default(70),
  scoringPolicy: z.enum(["BEST", "LATEST", "AVERAGE"]),
  randomizeQuestions: z.coerce.boolean().default(false),
  randomizeOptions: z.coerce.boolean().default(false),
  lessonId: z.coerce.number().min(1, { message: "Lesson is required!" }),
});
export type QuizSchema = z.infer<typeof quizSchema>;

export const questionSchema = z.object({
  id: z.coerce.number().optional(),
  text: z.string().min(1, { message: "Question text is required!" }).max(1000),
  type: z.enum(["MULTIPLE_CHOICE", "TRUE_FALSE", "FILL_IN_BLANK"]),
  explanation: z.string().max(500).optional().or(z.literal("")),
  points: z.coerce.number().int().min(1).default(1),
  order: z.coerce.number().int().min(1),
  quizId: z.coerce.number().optional(),
  questionBankId: z.coerce.number().optional(),
  options: z.array(z.object({
    text: z.string().min(1, { message: "Option text is required!" }),
    isCorrect: z.boolean(),
    order: z.coerce.number().int().min(1),
  })).min(2, { message: "At least 2 options required!" }),
});
export type QuestionSchema = z.infer<typeof questionSchema>;

export const questionBankSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, { message: "Name is required!" }).max(200),
  description: z.string().max(500).optional().or(z.literal("")),
  subjectId: z.coerce.number().min(1, { message: "Subject is required!" }),
});
export type QuestionBankSchema = z.infer<typeof questionBankSchema>;

export const badgeSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, { message: "Badge name is required!" }),
  description: z.string().min(1, { message: "Description is required!" }),
  iconUrl: z.string().optional().nullable(),
  category: z.enum(["streak", "quiz", "course", "xp", "special"], {
    message: "Category is required!",
  }),
  threshold: z.coerce.number().int().min(0).optional().nullable(),
  xpReward: z.coerce.number().int().min(0, { message: "XP reward must be non-negative!" }),
});
export type BadgeSchema = z.infer<typeof badgeSchema>;

export const reviewCardSchema = z.object({
  front: z.string().min(1, { message: "Front text is required!" }),
  back: z.string().min(1, { message: "Back text is required!" }),
  cardType: z.enum(["FLASHCARD", "VOCABULARY"]),
  courseId: z.coerce.number().int().positive(),
  targetStudents: z.string().optional(), // JSON string of student IDs
});
export type ReviewCardSchema = z.infer<typeof reviewCardSchema>;
