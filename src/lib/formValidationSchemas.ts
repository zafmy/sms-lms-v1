import { z } from "zod";

export const subjectSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, { message: "subjectNameRequired" }),
  teachers: z.array(z.string()), //teacher ids
});

export type SubjectSchema = z.infer<typeof subjectSchema>;

export const classSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, { message: "classNameRequired" }),
  capacity: z.coerce.number().min(1, { message: "capacityRequired" }),
  gradeId: z.coerce.number().min(1, { message: "gradeRequired" }),
  supervisorId: z.coerce.string().optional(),
});

export type ClassSchema = z.infer<typeof classSchema>;

export const teacherSchema = z.object({
  id: z.string().optional(),
  username: z
    .string()
    .min(3, { message: "usernameMinLength" })
    .max(20, { message: "usernameMaxLength" }),
  password: z
    .string()
    .min(8, { message: "passwordMinLength" })
    .optional()
    .or(z.literal("")),
  name: z.string().min(1, { message: "firstNameRequired" }),
  surname: z.string().min(1, { message: "lastNameRequired" }),
  email: z
    .string()
    .email({ message: "invalidEmail" })
    .optional()
    .or(z.literal("")),
  phone: z.string().optional(),
  address: z.string(),
  img: z.string().optional(),
  bloodType: z.string().min(1, { message: "bloodTypeRequired" }),
  birthday: z.coerce.date({ message: "birthdayRequired" }),
  sex: z.enum(["MALE", "FEMALE"], { message: "sexRequired" }),
  subjects: z.array(z.string()).optional(), // subject ids
});

export type TeacherSchema = z.infer<typeof teacherSchema>;

export const studentSchema = z.object({
  id: z.string().optional(),
  username: z
    .string()
    .min(3, { message: "usernameMinLength" })
    .max(20, { message: "usernameMaxLength" }),
  password: z
    .string()
    .min(8, { message: "passwordMinLength" })
    .optional()
    .or(z.literal("")),
  name: z.string().min(1, { message: "firstNameRequired" }),
  surname: z.string().min(1, { message: "lastNameRequired" }),
  email: z
    .string()
    .email({ message: "invalidEmail" })
    .optional()
    .or(z.literal("")),
  phone: z.string().optional(),
  address: z.string(),
  img: z.string().optional(),
  bloodType: z.string().min(1, { message: "bloodTypeRequired" }),
  birthday: z.coerce.date({ message: "birthdayRequired" }),
  sex: z.enum(["MALE", "FEMALE"], { message: "sexRequired" }),
  gradeId: z.coerce.number().min(1, { message: "gradeRequired" }),
  classId: z.coerce.number().min(1, { message: "classRequired" }),
  parentId: z.string().min(1, { message: "parentIdRequired" }),
});

export type StudentSchema = z.infer<typeof studentSchema>;

export const examSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1, { message: "titleRequired" }),
  startTime: z.coerce.date({ message: "startTimeRequired" }),
  endTime: z.coerce.date({ message: "endTimeRequired" }),
  lessonId: z.coerce.number({ message: "lessonRequired" }),
});

export type ExamSchema = z.infer<typeof examSchema>;

export const assignmentSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1, { message: "titleRequired" }),
  description: z.string().max(100000).optional().or(z.literal("")),
  startDate: z.coerce.date({ message: "startDateRequired" }),
  dueDate: z.coerce.date({ message: "dueDateRequired" }),
  lessonId: z.coerce.number({ message: "lessonRequired" }),
});

export type AssignmentSchema = z.infer<typeof assignmentSchema>;

export const eventSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1, { message: "titleRequired" }),
  description: z.string().min(1, { message: "descriptionRequired" }),
  startTime: z.coerce.date({ message: "startTimeRequired" }),
  endTime: z.coerce.date({ message: "endTimeRequired" }),
  classId: z.coerce.number().optional(),
});

export type EventSchema = z.infer<typeof eventSchema>;

export const announcementSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1, { message: "titleRequired" }),
  description: z.string().min(1, { message: "descriptionRequired" }).max(100000),
  date: z.coerce.date({ message: "dateRequired" }),
  classId: z.coerce.number().optional(),
});

export type AnnouncementSchema = z.infer<typeof announcementSchema>;

export const resultSchema = z.object({
  id: z.coerce.number().optional(),
  score: z.coerce.number().min(0, { message: "scoreMinZero" }),
  examId: z.coerce.number().optional(),
  assignmentId: z.coerce.number().optional(),
  studentId: z.string().min(1, { message: "studentRequired" }),
});

export type ResultSchema = z.infer<typeof resultSchema>;

export const lessonSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, { message: "lessonNameRequired" }),
  day: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"], { message: "dayRequired" }),
  startTime: z.coerce.date({ message: "startTimeRequired" }),
  endTime: z.coerce.date({ message: "endTimeRequired" }),
  subjectId: z.coerce.number({ message: "subjectRequired" }),
  classId: z.coerce.number({ message: "classRequired" }),
  teacherId: z.string().min(1, { message: "teacherRequired" }),
});

export type LessonSchema = z.infer<typeof lessonSchema>;

export const parentSchema = z.object({
  id: z.string().optional(),
  username: z
    .string()
    .min(3, { message: "usernameMinLength" })
    .max(20, { message: "usernameMaxLength" }),
  password: z
    .string()
    .min(8, { message: "passwordMinLength" })
    .optional()
    .or(z.literal("")),
  name: z.string().min(1, { message: "firstNameRequired" }),
  surname: z.string().min(1, { message: "lastNameRequired" }),
  email: z
    .string()
    .email({ message: "invalidEmail" })
    .optional()
    .or(z.literal("")),
  phone: z.string().min(1, { message: "phoneRequired" }),
  address: z.string().min(1, { message: "addressRequired" }),
});

export type ParentSchema = z.infer<typeof parentSchema>;

export const attendanceSchema = z.object({
  id: z.coerce.number().optional(),
  date: z.coerce.date({ message: "dateRequired" }),
  present: z.coerce.boolean(),
  studentId: z.string().min(1, { message: "studentRequired" }),
  lessonId: z.coerce.number({ message: "lessonRequired" }),
});

export type AttendanceSchema = z.infer<typeof attendanceSchema>;

export const courseSchema = z.object({
  id: z.coerce.number().optional(),
  title: z
    .string()
    .min(1, { message: "titleRequired" })
    .max(200, { message: "titleMaxLength" }),
  description: z
    .string()
    .max(1000, { message: "descriptionMaxLength1000" })
    .optional()
    .or(z.literal("")),
  code: z
    .string()
    .min(2, { message: "codeMinLength" })
    .max(20, { message: "codeMaxLength" })
    .regex(/^[A-Z0-9-]+$/, { message: "codeFormat" }),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"], { message: "statusRequired" }),
  teacherId: z.string().min(1, { message: "teacherRequired" }),
  subjectId: z.coerce.number({ message: "subjectRequired" }),
  maxEnrollments: z.coerce.number().int().positive().nullable().optional(),
});

export type CourseSchema = z.infer<typeof courseSchema>;

export const moduleSchema = z.object({
  id: z.coerce.number().optional(),
  title: z
    .string()
    .min(1, { message: "titleRequired" })
    .max(200, { message: "titleMaxLength" }),
  description: z
    .string()
    .max(500, { message: "descriptionMaxLength" })
    .optional()
    .or(z.literal("")),
  order: z.coerce.number().min(1, { message: "orderMinOne" }),
  isLocked: z.coerce.boolean().default(false),
  courseId: z.coerce.number({ message: "courseRequired" }),
});

export type ModuleSchema = z.infer<typeof moduleSchema>;

export const enrollmentSchema = z.object({
  studentId: z.string().min(1, { message: "studentRequired" }),
  courseId: z.coerce.number({ message: "courseRequired" }),
});

export type EnrollmentSchema = z.infer<typeof enrollmentSchema>;

export const selfEnrollmentSchema = z.object({
  courseId: z.coerce.number().int().positive(),
});

export type SelfEnrollmentSchema = z.infer<typeof selfEnrollmentSchema>;

export const lmsLessonSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1, { message: "titleRequired" }).max(200),
  content: z.string().min(1, { message: "contentRequired" }),
  contentType: z.enum(["TEXT", "VIDEO", "LINK", "MIXED"]),
  externalUrl: z.string().url().optional().or(z.literal("")),
  order: z.coerce.number().int().min(1, { message: "orderMinOne" }),
  estimatedMinutes: z.coerce.number().int().min(1).optional(),
  moduleId: z.coerce.number().min(1, { message: "moduleRequired" }),
  flagForReview: z.coerce.boolean().default(false),
});

export type LmsLessonSchema = z.infer<typeof lmsLessonSchema>;

export const quizSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1, { message: "titleRequired" }).max(200),
  description: z.string().max(500).optional().or(z.literal("")),
  timeLimit: z.coerce.number().int().min(1).optional().or(z.literal("")),
  maxAttempts: z.coerce.number().int().min(1).default(1),
  passScore: z.coerce.number().int().min(0).max(100).default(70),
  scoringPolicy: z.enum(["BEST", "LATEST", "AVERAGE"]),
  randomizeQuestions: z.coerce.boolean().default(false),
  randomizeOptions: z.coerce.boolean().default(false),
  lessonId: z.coerce.number().min(1, { message: "lessonRequired" }),
});
export type QuizSchema = z.infer<typeof quizSchema>;

export const questionSchema = z.object({
  id: z.coerce.number().optional(),
  text: z.string().min(1, { message: "questionTextRequired" }).max(1000),
  type: z.enum(["MULTIPLE_CHOICE", "TRUE_FALSE", "FILL_IN_BLANK"]),
  explanation: z.string().max(500).optional().or(z.literal("")),
  points: z.coerce.number().int().min(1).default(1),
  order: z.coerce.number().int().min(1),
  quizId: z.coerce.number().optional(),
  questionBankId: z.coerce.number().optional(),
  options: z.array(z.object({
    text: z.string().min(1, { message: "optionTextRequired" }),
    isCorrect: z.boolean(),
    order: z.coerce.number().int().min(1),
  })).min(2, { message: "minTwoOptions" }),
});
export type QuestionSchema = z.infer<typeof questionSchema>;

export const questionBankSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, { message: "nameRequired" }).max(200),
  description: z.string().max(500).optional().or(z.literal("")),
  subjectId: z.coerce.number().min(1, { message: "subjectRequired" }),
});
export type QuestionBankSchema = z.infer<typeof questionBankSchema>;

export const badgeSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, { message: "badgeNameRequired" }),
  description: z.string().min(1, { message: "descriptionRequired" }),
  iconUrl: z.string().optional().nullable(),
  category: z.enum(["streak", "quiz", "course", "xp", "special"], {
    message: "categoryRequired",
  }),
  threshold: z.coerce.number().int().min(0).optional().nullable(),
  xpReward: z.coerce.number().int().min(0, { message: "xpRewardNonNegative" }),
});
export type BadgeSchema = z.infer<typeof badgeSchema>;

export const reviewCardSchema = z.object({
  front: z.string().min(1, { message: "frontTextRequired" }),
  back: z.string().min(1, { message: "backTextRequired" }),
  cardType: z.enum(["FLASHCARD", "VOCABULARY"]),
  courseId: z.coerce.number().int().positive(),
  targetStudents: z.string().optional(), // JSON string of student IDs
});
export type ReviewCardSchema = z.infer<typeof reviewCardSchema>;

export const guideSchema = z.object({
  id: z.string().optional(),
  slug: z
    .string()
    .min(1, { message: "slugRequired" })
    .regex(/^[a-z0-9-]+$/, {
      message: "slugUrlSafe",
    }),
  categoryId: z.string().min(1, { message: "categoryRequired" }),
  roleAccess: z
    .array(z.enum(["admin", "teacher", "student", "parent"]))
    .min(1, { message: "atLeastOneRole" }),
  isPublished: z.boolean().default(false),
  order: z.coerce.number().default(0),
  tourSteps: z.string().optional(),
  translations: z.object({
    en: z.object({
      title: z.string().min(1, { message: "englishTitleRequired" }),
      excerpt: z
        .string()
        .min(1, { message: "englishExcerptRequired" }),
      content: z
        .string()
        .min(1, { message: "englishContentRequired" }),
    }),
    ms: z.object({
      title: z.string().min(1, { message: "malayTitleRequired" }),
      excerpt: z
        .string()
        .min(1, { message: "malayExcerptRequired" }),
      content: z
        .string()
        .min(1, { message: "malayContentRequired" }),
    }),
  }),
});

export type GuideSchema = z.infer<typeof guideSchema>;

export const guideCategorySchema = z.object({
  id: z.string().optional(),
  slug: z
    .string()
    .min(1, { message: "slugRequired" })
    .regex(/^[a-z0-9-]+$/, { message: "slugUrlSafeShort" }),
  nameEn: z.string().min(1, { message: "englishNameRequired" }),
  nameMs: z.string().min(1, { message: "malayNameRequired" }),
  order: z.coerce.number().default(0),
});

export type GuideCategorySchema = z.infer<typeof guideCategorySchema>;
