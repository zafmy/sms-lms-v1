import prisma from "@/lib/prisma";
import FormModal from "./FormModal";
import { auth } from "@clerk/nextjs/server";

export type FormContainerProps = {
  table:
    | "teacher"
    | "student"
    | "parent"
    | "subject"
    | "class"
    | "lesson"
    | "exam"
    | "assignment"
    | "result"
    | "attendance"
    | "event"
    | "announcement"
    | "course"
    | "module"
    | "enrollment"
    | "lmsLesson"
    | "quiz"
    | "question"
    | "questionBank"
    | "badge"
    | "guide"
    | "guideCategory";
  type: "create" | "update" | "delete";
  data?: any;
  id?: number | string;
};

const FormContainer = async ({ table, type, data, id }: FormContainerProps) => {
  let relatedData = {};

  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const currentUserId = userId;

  if (type !== "delete") {
    switch (table) {
      case "subject":
        const subjectTeachers = await prisma.teacher.findMany({
          select: { id: true, name: true, surname: true },
        });
        relatedData = { teachers: subjectTeachers };
        break;
      case "class":
        const classGrades = await prisma.grade.findMany({
          select: { id: true, level: true },
        });
        const classTeachers = await prisma.teacher.findMany({
          select: { id: true, name: true, surname: true },
        });
        relatedData = { teachers: classTeachers, grades: classGrades };
        break;
      case "teacher":
        const teacherSubjects = await prisma.subject.findMany({
          select: { id: true, name: true },
        });
        relatedData = { subjects: teacherSubjects };
        break;
      case "student":
        const studentGrades = await prisma.grade.findMany({
          select: { id: true, level: true },
        });
        const studentClasses = await prisma.class.findMany({
          include: { _count: { select: { students: true } } },
        });
        relatedData = { classes: studentClasses, grades: studentGrades };
        break;
      case "exam":
        const examLessons = await prisma.lesson.findMany({
          where: {
            ...(role === "teacher" ? { teacherId: currentUserId! } : {}),
          },
          select: { id: true, name: true },
        });
        relatedData = { lessons: examLessons };
        break;
      case "assignment":
        const assignmentLessons = await prisma.lesson.findMany({
          where: {
            ...(role === "teacher" ? { teacherId: currentUserId! } : {}),
          },
          select: { id: true, name: true },
        });
        relatedData = { lessons: assignmentLessons };
        break;
      case "event":
        const eventClasses = await prisma.class.findMany({
          select: { id: true, name: true },
        });
        relatedData = { classes: eventClasses };
        break;
      case "announcement":
        const announcementClasses = await prisma.class.findMany({
          select: { id: true, name: true },
        });
        relatedData = { classes: announcementClasses };
        break;
      case "result":
        const resultStudents = await prisma.student.findMany({
          select: { id: true, name: true, surname: true },
        });
        const resultExams = await prisma.exam.findMany({
          where: {
            ...(role === "teacher" ? { lesson: { teacherId: currentUserId! } } : {}),
          },
          select: { id: true, title: true },
        });
        const resultAssignments = await prisma.assignment.findMany({
          where: {
            ...(role === "teacher" ? { lesson: { teacherId: currentUserId! } } : {}),
          },
          select: { id: true, title: true },
        });
        relatedData = { students: resultStudents, exams: resultExams, assignments: resultAssignments };
        break;
      case "lesson":
        const lessonSubjects = await prisma.subject.findMany({
          select: { id: true, name: true },
        });
        const lessonClasses = await prisma.class.findMany({
          select: { id: true, name: true },
        });
        const lessonTeachers = await prisma.teacher.findMany({
          select: { id: true, name: true, surname: true },
        });
        relatedData = { subjects: lessonSubjects, classes: lessonClasses, teachers: lessonTeachers };
        break;
      case "parent":
        break;
      case "attendance":
        const attendanceStudents = await prisma.student.findMany({
          select: { id: true, name: true, surname: true },
        });
        const attendanceLessons = await prisma.lesson.findMany({
          where: {
            ...(role === "teacher" ? { teacherId: currentUserId! } : {}),
          },
          select: { id: true, name: true },
        });
        relatedData = { students: attendanceStudents, lessons: attendanceLessons };
        break;
      case "course":
        const courseTeachers = await prisma.teacher.findMany({
          select: { id: true, name: true, surname: true },
        });
        const courseSubjects = await prisma.subject.findMany({
          select: { id: true, name: true },
        });
        relatedData = { teachers: courseTeachers, subjects: courseSubjects };
        break;
      case "module":
        const moduleCourses = await prisma.course.findMany({
          where: {
            ...(role === "teacher" ? { teacherId: currentUserId! } : {}),
          },
          select: { id: true, title: true },
        });
        relatedData = { courses: moduleCourses };
        break;
      case "enrollment":
        const enrollmentStudents = await prisma.student.findMany({
          select: { id: true, name: true, surname: true },
        });
        const enrollmentCourses = await prisma.course.findMany({
          where: {
            status: { in: ["ACTIVE", "DRAFT"] },
          },
          select: { id: true, title: true, code: true },
        });
        relatedData = { students: enrollmentStudents, courses: enrollmentCourses };
        break;
      case "lmsLesson":
        const lmsLessonModules = await prisma.module.findMany({
          where: {
            course: {
              ...(role === "teacher" ? { teacherId: currentUserId! } : {}),
            },
          },
          include: { course: { select: { title: true } } },
        });
        relatedData = { modules: lmsLessonModules };
        break;
      case "quiz":
        const quizLessons = await prisma.lmsLesson.findMany({
          where: {
            module: {
              course: {
                ...(role === "teacher" ? { teacherId: currentUserId! } : {}),
              },
            },
          },
          include: { module: { include: { course: { select: { title: true } } } } },
        });
        relatedData = { lessons: quizLessons };
        break;
      case "question":
        const questionQuizzes = await prisma.quiz.findMany({
          where: {
            lesson: {
              module: {
                course: {
                  ...(role === "teacher" ? { teacherId: currentUserId! } : {}),
                },
              },
            },
          },
          select: { id: true, title: true },
        });
        relatedData = { quizzes: questionQuizzes };
        break;
      case "questionBank":
        const questionBankSubjects = await prisma.subject.findMany({
          select: { id: true, name: true },
        });
        relatedData = { subjects: questionBankSubjects };
        break;
      case "badge":
        break;
      case "guide":
        const guideCategories = await prisma.guideCategory.findMany({
          select: { id: true, nameEn: true, nameMs: true },
          orderBy: { order: "asc" },
        });
        relatedData = { categories: guideCategories };
        break;
      case "guideCategory":
        break;

      default:
        break;
    }
  }

  return (
    <div className="">
      <FormModal
        table={table}
        type={type}
        data={data}
        id={id}
        relatedData={relatedData}
      />
    </div>
  );
};

export default FormContainer;
