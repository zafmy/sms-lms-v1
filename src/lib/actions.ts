"use server";

import { revalidatePath } from "next/cache";
import {
  AnnouncementSchema,
  AssignmentSchema,
  AttendanceSchema,
  ClassSchema,
  CourseSchema,
  EnrollmentSchema,
  EventSchema,
  ExamSchema,
  LessonSchema,
  LmsLessonSchema,
  ModuleSchema,
  ParentSchema,
  QuestionBankSchema,
  QuestionSchema,
  QuizSchema,
  ResultSchema,
  StudentSchema,
  SubjectSchema,
  TeacherSchema,
  selfEnrollmentSchema,
} from "./formValidationSchemas";
import prisma from "./prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";

type CurrentState = { success: boolean; error: boolean; message?: string };

export const createSubject = async (
  currentState: CurrentState,
  data: SubjectSchema
) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || role !== "admin") {
    return { success: false, error: true };
  }
  try {
    await prisma.subject.create({
      data: {
        name: data.name,
        teachers: {
          connect: data.teachers.map((teacherId) => ({ id: teacherId })),
        },
      },
    });

    revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true };
  }
};

export const updateSubject = async (
  currentState: CurrentState,
  data: SubjectSchema
) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || role !== "admin") {
    return { success: false, error: true };
  }
  try {
    await prisma.subject.update({
      where: {
        id: data.id,
      },
      data: {
        name: data.name,
        teachers: {
          set: data.teachers.map((teacherId) => ({ id: teacherId })),
        },
      },
    });

    revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true };
  }
};

export const deleteSubject = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || role !== "admin") {
    return { success: false, error: true };
  }
  try {
    await prisma.subject.delete({
      where: {
        id: parseInt(id),
      },
    });

    revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true };
  }
};

export const createClass = async (
  currentState: CurrentState,
  data: ClassSchema
) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || role !== "admin") {
    return { success: false, error: true };
  }
  try {
    await prisma.class.create({
      data,
    });

    revalidatePath("/list/class");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true };
  }
};

export const updateClass = async (
  currentState: CurrentState,
  data: ClassSchema
) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || role !== "admin") {
    return { success: false, error: true };
  }
  try {
    await prisma.class.update({
      where: {
        id: data.id,
      },
      data,
    });

    revalidatePath("/list/class");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true };
  }
};

export const deleteClass = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || role !== "admin") {
    return { success: false, error: true };
  }
  try {
    await prisma.class.delete({
      where: {
        id: parseInt(id),
      },
    });

    revalidatePath("/list/class");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true };
  }
};

export const createTeacher = async (
  currentState: CurrentState,
  data: TeacherSchema
) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || role !== "admin") {
    return { success: false, error: true };
  }
  try {
    const user = await (await clerkClient()).users.createUser({
      username: data.username,
      password: data.password,
      firstName: data.name,
      lastName: data.surname,
      publicMetadata:{role:"teacher"}
    });

    await prisma.teacher.create({
      data: {
        id: user.id,
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        subjects: {
          connect: data.subjects?.map((subjectId: string) => ({
            id: parseInt(subjectId),
          })),
        },
      },
    });

    revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true };
  }
};

export const updateTeacher = async (
  currentState: CurrentState,
  data: TeacherSchema
) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || role !== "admin") {
    return { success: false, error: true };
  }
  if (!data.id) {
    return { success: false, error: true };
  }
  try {
    const user = await (await clerkClient()).users.updateUser(data.id, {
      username: data.username,
      ...(data.password !== "" && { password: data.password }),
      firstName: data.name,
      lastName: data.surname,
    });

    await prisma.teacher.update({
      where: {
        id: data.id,
      },
      data: {
        ...(data.password !== "" && { password: data.password }),
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        subjects: {
          set: data.subjects?.map((subjectId: string) => ({
            id: parseInt(subjectId),
          })),
        },
      },
    });
    revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true };
  }
};

export const deleteTeacher = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || role !== "admin") {
    return { success: false, error: true };
  }
  try {
    await (await clerkClient()).users.deleteUser(id);
    try {
      await prisma.teacher.delete({
        where: {
          id: id,
        },
      });
    } catch (prismaErr) {
      console.error(
        `[PARTIAL FAILURE] deleteTeacher: Clerk user ${id} deleted, but Prisma teacher record ${id} failed to delete. Manual resolution required.`,
        prismaErr
      );
      return {
        success: false,
        error: true,
        message: "Partial failure: user account deleted but database record remains. Contact administrator.",
      };
    }

    revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true };
  }
};

export const createStudent = async (
  currentState: CurrentState,
  data: StudentSchema
) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || role !== "admin") {
    return { success: false, error: true };
  }
  try {
    const classItem = await prisma.class.findUnique({
      where: { id: data.classId },
      include: { _count: { select: { students: true } } },
    });

    if (classItem && classItem.capacity === classItem._count.students) {
      return { success: false, error: true };
    }

    const user = await (await clerkClient()).users.createUser({
      username: data.username,
      password: data.password,
      firstName: data.name,
      lastName: data.surname,
      publicMetadata:{role:"student"}
    });

    await prisma.student.create({
      data: {
        id: user.id,
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        gradeId: data.gradeId,
        classId: data.classId,
        parentId: data.parentId,
      },
    });

    revalidatePath("/list/students");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true };
  }
};

export const updateStudent = async (
  currentState: CurrentState,
  data: StudentSchema
) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || role !== "admin") {
    return { success: false, error: true };
  }
  if (!data.id) {
    return { success: false, error: true };
  }
  try {
    const user = await (await clerkClient()).users.updateUser(data.id, {
      username: data.username,
      ...(data.password !== "" && { password: data.password }),
      firstName: data.name,
      lastName: data.surname,
    });

    await prisma.student.update({
      where: {
        id: data.id,
      },
      data: {
        ...(data.password !== "" && { password: data.password }),
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        gradeId: data.gradeId,
        classId: data.classId,
        parentId: data.parentId,
      },
    });
    revalidatePath("/list/students");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true };
  }
};

export const deleteStudent = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || role !== "admin") {
    return { success: false, error: true };
  }
  try {
    await (await clerkClient()).users.deleteUser(id);
    try {
      await prisma.student.delete({
        where: {
          id: id,
        },
      });
    } catch (prismaErr) {
      console.error(
        `[PARTIAL FAILURE] deleteStudent: Clerk user ${id} deleted, but Prisma student record ${id} failed to delete. Manual resolution required.`,
        prismaErr
      );
      return {
        success: false,
        error: true,
        message: "Partial failure: user account deleted but database record remains. Contact administrator.",
      };
    }

    revalidatePath("/list/students");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true };
  }
};

export const createExam = async (
  currentState: CurrentState,
  data: ExamSchema
) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || (role !== "admin" && role !== "teacher")) {
    return { success: false, error: true };
  }

  try {
    if (role === "teacher") {
      const teacherLesson = await prisma.lesson.findFirst({
        where: {
          teacherId: userId,
          id: data.lessonId,
        },
      });

      if (!teacherLesson) {
        return { success: false, error: true };
      }
    }

    await prisma.exam.create({
      data: {
        title: data.title,
        startTime: data.startTime,
        endTime: data.endTime,
        lessonId: data.lessonId,
      },
    });

    revalidatePath("/list/exams");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true };
  }
};

export const updateExam = async (
  currentState: CurrentState,
  data: ExamSchema
) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || (role !== "admin" && role !== "teacher")) {
    return { success: false, error: true };
  }

  try {
    if (role === "teacher") {
      const teacherLesson = await prisma.lesson.findFirst({
        where: {
          teacherId: userId,
          id: data.lessonId,
        },
      });

      if (!teacherLesson) {
        return { success: false, error: true };
      }
    }

    await prisma.exam.update({
      where: {
        id: data.id,
      },
      data: {
        title: data.title,
        startTime: data.startTime,
        endTime: data.endTime,
        lessonId: data.lessonId,
      },
    });

    revalidatePath("/list/exams");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true };
  }
};

export const deleteExam = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;

  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || (role !== "admin" && role !== "teacher")) {
    return { success: false, error: true };
  }

  try {
    await prisma.exam.delete({
      where: {
        id: parseInt(id),
        ...(role === "teacher" ? { lesson: { teacherId: userId } } : {}),
      },
    });

    revalidatePath("/list/exams");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true };
  }
};

export const deleteParent = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || role !== "admin") {
    return { success: false, error: true };
  }
  try {
    await prisma.parent.delete({ where: { id } });
    revalidatePath("/list/parents");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true };
  }
};

export const deleteLesson = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || role !== "admin") {
    return { success: false, error: true };
  }
  try {
    await prisma.lesson.delete({ where: { id: parseInt(id) } });
    revalidatePath("/list/lessons");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true };
  }
};

export const deleteAssignment = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || (role !== "admin" && role !== "teacher")) {
    return { success: false, error: true };
  }
  try {
    await prisma.assignment.delete({ where: { id: parseInt(id) } });
    revalidatePath("/list/assignments");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true };
  }
};

export const deleteResult = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || (role !== "admin" && role !== "teacher")) {
    return { success: false, error: true };
  }
  try {
    await prisma.result.delete({ where: { id: parseInt(id) } });
    revalidatePath("/list/results");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true };
  }
};

export const deleteAttendance = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || role !== "admin") {
    return { success: false, error: true };
  }
  try {
    await prisma.attendance.delete({ where: { id: parseInt(id) } });
    revalidatePath("/list/attendance");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true };
  }
};

export const deleteEvent = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || role !== "admin") {
    return { success: false, error: true };
  }
  try {
    await prisma.event.delete({ where: { id: parseInt(id) } });
    revalidatePath("/list/events");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true };
  }
};

export const deleteAnnouncement = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || role !== "admin") {
    return { success: false, error: true };
  }
  try {
    await prisma.announcement.delete({ where: { id: parseInt(id) } });
    revalidatePath("/list/announcements");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true };
  }
};

export const createAssignment = async (
  currentState: CurrentState,
  data: AssignmentSchema
) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || (role !== "admin" && role !== "teacher")) {
    return { success: false, error: true };
  }

  try {
    if (role === "teacher") {
      const teacherLesson = await prisma.lesson.findFirst({
        where: {
          teacherId: userId,
          id: data.lessonId,
        },
      });

      if (!teacherLesson) {
        return { success: false, error: true };
      }
    }

    await prisma.assignment.create({
      data: {
        title: data.title,
        description: data.description || null,
        startDate: data.startDate,
        dueDate: data.dueDate,
        lessonId: data.lessonId,
      },
    });

    revalidatePath("/list/assignments");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true };
  }
};

export const updateAssignment = async (
  currentState: CurrentState,
  data: AssignmentSchema
) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || (role !== "admin" && role !== "teacher")) {
    return { success: false, error: true };
  }

  try {
    if (role === "teacher") {
      const teacherLesson = await prisma.lesson.findFirst({
        where: {
          teacherId: userId,
          id: data.lessonId,
        },
      });

      if (!teacherLesson) {
        return { success: false, error: true };
      }
    }

    await prisma.assignment.update({
      where: {
        id: data.id,
      },
      data: {
        title: data.title,
        description: data.description || null,
        startDate: data.startDate,
        dueDate: data.dueDate,
        lessonId: data.lessonId,
      },
    });

    revalidatePath("/list/assignments");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true };
  }
};

export const createEvent = async (
  currentState: CurrentState,
  data: EventSchema
) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || role !== "admin") {
    return { success: false, error: true };
  }
  try {
    await prisma.event.create({
      data: {
        title: data.title,
        description: data.description,
        startTime: data.startTime,
        endTime: data.endTime,
        classId: data.classId || null,
      },
    });

    revalidatePath("/list/events");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true };
  }
};

export const updateEvent = async (
  currentState: CurrentState,
  data: EventSchema
) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || role !== "admin") {
    return { success: false, error: true };
  }
  try {
    await prisma.event.update({
      where: {
        id: data.id,
      },
      data: {
        title: data.title,
        description: data.description,
        startTime: data.startTime,
        endTime: data.endTime,
        classId: data.classId || null,
      },
    });

    revalidatePath("/list/events");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true };
  }
};

export const createAnnouncement = async (
  currentState: CurrentState,
  data: AnnouncementSchema
) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || role !== "admin") {
    return { success: false, error: true };
  }
  try {
    await prisma.announcement.create({
      data: {
        title: data.title,
        description: data.description,
        date: data.date,
        classId: data.classId || null,
      },
    });

    revalidatePath("/list/announcements");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true };
  }
};

export const updateAnnouncement = async (
  currentState: CurrentState,
  data: AnnouncementSchema
) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || role !== "admin") {
    return { success: false, error: true };
  }
  try {
    await prisma.announcement.update({
      where: {
        id: data.id,
      },
      data: {
        title: data.title,
        description: data.description,
        date: data.date,
        classId: data.classId || null,
      },
    });

    revalidatePath("/list/announcements");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true };
  }
};

export const createResult = async (
  currentState: CurrentState,
  data: ResultSchema
) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || (role !== "admin" && role !== "teacher")) {
    return { success: false, error: true };
  }

  try {
    if (role === "teacher") {
      if (data.examId) {
        const exam = await prisma.exam.findFirst({
          where: { id: data.examId, lesson: { teacherId: userId } },
        });
        if (!exam) return { success: false, error: true };
      }
      if (data.assignmentId) {
        const assignment = await prisma.assignment.findFirst({
          where: { id: data.assignmentId, lesson: { teacherId: userId } },
        });
        if (!assignment) return { success: false, error: true };
      }
    }

    await prisma.result.create({
      data: {
        score: data.score,
        examId: data.examId || null,
        assignmentId: data.assignmentId || null,
        studentId: data.studentId,
      },
    });

    // Notify student about new grade
    try {
      let assessmentTitle = "an assessment";
      if (data.examId) {
        const exam = await prisma.exam.findUnique({
          where: { id: data.examId },
          select: { title: true },
        });
        if (exam) assessmentTitle = exam.title;
      } else if (data.assignmentId) {
        const assignment = await prisma.assignment.findUnique({
          where: { id: data.assignmentId },
          select: { title: true },
        });
        if (assignment) assessmentTitle = assignment.title;
      }
      await prisma.notification.create({
        data: {
          userId: data.studentId,
          type: "GRADE",
          message: `New grade: ${data.score} on ${assessmentTitle}`,
        },
      });
    } catch {
      // Notification failure should not block the result creation
    }

    revalidatePath("/list/results");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true };
  }
};

export const updateResult = async (
  currentState: CurrentState,
  data: ResultSchema
) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || (role !== "admin" && role !== "teacher")) {
    return { success: false, error: true };
  }

  try {
    if (role === "teacher") {
      if (data.examId) {
        const exam = await prisma.exam.findFirst({
          where: { id: data.examId, lesson: { teacherId: userId } },
        });
        if (!exam) return { success: false, error: true };
      }
      if (data.assignmentId) {
        const assignment = await prisma.assignment.findFirst({
          where: { id: data.assignmentId, lesson: { teacherId: userId } },
        });
        if (!assignment) return { success: false, error: true };
      }
    }

    await prisma.result.update({
      where: {
        id: data.id,
      },
      data: {
        score: data.score,
        examId: data.examId || null,
        assignmentId: data.assignmentId || null,
        studentId: data.studentId,
      },
    });

    revalidatePath("/list/results");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true };
  }
};

export const createLesson = async (
  currentState: CurrentState,
  data: LessonSchema
) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || role !== "admin") {
    return { success: false, error: true };
  }
  try {
    // Check for teacher conflict
    const teacherConflict = await prisma.lesson.findFirst({
      where: {
        teacherId: data.teacherId,
        day: data.day,
        OR: [
          {
            startTime: { lte: data.startTime },
            endTime: { gt: data.startTime },
          },
          {
            startTime: { lt: data.endTime },
            endTime: { gte: data.endTime },
          },
          {
            startTime: { gte: data.startTime },
            endTime: { lte: data.endTime },
          },
        ],
      },
    });

    if (teacherConflict) {
      return {
        success: false,
        error: true,
        message: "Teacher already has a lesson at this time",
      };
    }

    // Check for class conflict
    const classConflict = await prisma.lesson.findFirst({
      where: {
        classId: data.classId,
        day: data.day,
        OR: [
          {
            startTime: { lte: data.startTime },
            endTime: { gt: data.startTime },
          },
          {
            startTime: { lt: data.endTime },
            endTime: { gte: data.endTime },
          },
          {
            startTime: { gte: data.startTime },
            endTime: { lte: data.endTime },
          },
        ],
      },
    });

    if (classConflict) {
      return {
        success: false,
        error: true,
        message: "Class already has a lesson at this time",
      };
    }

    await prisma.lesson.create({
      data: {
        name: data.name,
        day: data.day,
        startTime: data.startTime,
        endTime: data.endTime,
        subjectId: data.subjectId,
        classId: data.classId,
        teacherId: data.teacherId,
      },
    });

    revalidatePath("/list/lessons");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true };
  }
};

export const updateLesson = async (
  currentState: CurrentState,
  data: LessonSchema
) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || role !== "admin") {
    return { success: false, error: true };
  }
  try {
    // Check for teacher conflict (exclude self)
    const teacherConflict = await prisma.lesson.findFirst({
      where: {
        teacherId: data.teacherId,
        day: data.day,
        id: { not: data.id },
        OR: [
          {
            startTime: { lte: data.startTime },
            endTime: { gt: data.startTime },
          },
          {
            startTime: { lt: data.endTime },
            endTime: { gte: data.endTime },
          },
          {
            startTime: { gte: data.startTime },
            endTime: { lte: data.endTime },
          },
        ],
      },
    });

    if (teacherConflict) {
      return {
        success: false,
        error: true,
        message: "Teacher already has a lesson at this time",
      };
    }

    // Check for class conflict (exclude self)
    const classConflict = await prisma.lesson.findFirst({
      where: {
        classId: data.classId,
        day: data.day,
        id: { not: data.id },
        OR: [
          {
            startTime: { lte: data.startTime },
            endTime: { gt: data.startTime },
          },
          {
            startTime: { lt: data.endTime },
            endTime: { gte: data.endTime },
          },
          {
            startTime: { gte: data.startTime },
            endTime: { lte: data.endTime },
          },
        ],
      },
    });

    if (classConflict) {
      return {
        success: false,
        error: true,
        message: "Class already has a lesson at this time",
      };
    }

    await prisma.lesson.update({
      where: {
        id: data.id,
      },
      data: {
        name: data.name,
        day: data.day,
        startTime: data.startTime,
        endTime: data.endTime,
        subjectId: data.subjectId,
        classId: data.classId,
        teacherId: data.teacherId,
      },
    });

    revalidatePath("/list/lessons");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true };
  }
};

export const createParent = async (
  currentState: CurrentState,
  data: ParentSchema
) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || role !== "admin") {
    return { success: false, error: true };
  }
  try {
    const user = await (await clerkClient()).users.createUser({
      username: data.username,
      password: data.password,
      firstName: data.name,
      lastName: data.surname,
      publicMetadata: { role: "parent" },
    });

    await prisma.parent.create({
      data: {
        id: user.id,
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone,
        address: data.address,
      },
    });

    revalidatePath("/list/parents");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true };
  }
};

export const updateParent = async (
  currentState: CurrentState,
  data: ParentSchema
) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || role !== "admin") {
    return { success: false, error: true };
  }
  if (!data.id) {
    return { success: false, error: true };
  }
  try {
    const user = await (await clerkClient()).users.updateUser(data.id, {
      username: data.username,
      ...(data.password !== "" && { password: data.password }),
      firstName: data.name,
      lastName: data.surname,
    });

    await prisma.parent.update({
      where: {
        id: data.id,
      },
      data: {
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone,
        address: data.address,
      },
    });

    revalidatePath("/list/parents");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true };
  }
};

export const createAttendance = async (
  currentState: CurrentState,
  data: AttendanceSchema
) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || role !== "admin") {
    return { success: false, error: true };
  }
  try {
    await prisma.attendance.create({
      data: {
        date: data.date,
        present: data.present,
        studentId: data.studentId,
        lessonId: data.lessonId,
      },
    });

    revalidatePath("/list/attendance");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true };
  }
};

export const updateAttendance = async (
  currentState: CurrentState,
  data: AttendanceSchema
) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || role !== "admin") {
    return { success: false, error: true };
  }
  try {
    await prisma.attendance.update({
      where: {
        id: data.id,
      },
      data: {
        date: data.date,
        present: data.present,
        studentId: data.studentId,
        lessonId: data.lessonId,
      },
    });

    revalidatePath("/list/attendance");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true };
  }
};

// COURSE ACTIONS

export const createCourse = async (
  currentState: CurrentState,
  data: CourseSchema
) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || (role !== "admin" && role !== "teacher")) {
    return { success: false, error: true };
  }
  try {
    await prisma.course.create({
      data: {
        title: data.title,
        description: data.description || null,
        code: data.code,
        status: data.status,
        maxEnrollments: data.maxEnrollments ?? null,
        teacherId: role === "teacher" ? userId : data.teacherId,
        subjectId: data.subjectId,
      },
    });

    revalidatePath("/list/courses");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true };
  }
};

export const updateCourse = async (
  currentState: CurrentState,
  data: CourseSchema
) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || (role !== "admin" && role !== "teacher")) {
    return { success: false, error: true };
  }
  try {
    if (role === "teacher") {
      const course = await prisma.course.findFirst({
        where: { id: data.id, teacherId: userId },
      });
      if (!course) {
        return { success: false, error: true };
      }
    }

    await prisma.course.update({
      where: {
        id: data.id,
      },
      data: {
        title: data.title,
        description: data.description || null,
        code: data.code,
        status: data.status,
        maxEnrollments: data.maxEnrollments ?? null,
        teacherId: role === "teacher" ? userId : data.teacherId,
        subjectId: data.subjectId,
      },
    });

    revalidatePath("/list/courses");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true };
  }
};

export const deleteCourse = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || (role !== "admin" && role !== "teacher")) {
    return { success: false, error: true };
  }
  try {
    await prisma.course.delete({
      where: {
        id: parseInt(id),
        ...(role === "teacher" ? { teacherId: userId } : {}),
      },
    });

    revalidatePath("/list/courses");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true };
  }
};

// MODULE ACTIONS

export const createModule = async (
  currentState: CurrentState,
  data: ModuleSchema
) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || (role !== "admin" && role !== "teacher")) {
    return { success: false, error: true };
  }
  try {
    const course = await prisma.course.findFirst({
      where: {
        id: data.courseId,
        ...(role === "teacher" ? { teacherId: userId } : {}),
      },
    });
    if (!course) {
      return { success: false, error: true };
    }

    await prisma.module.create({
      data: {
        title: data.title,
        description: data.description || null,
        order: data.order,
        isLocked: data.isLocked,
        courseId: data.courseId,
      },
    });

    revalidatePath("/list/courses");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true };
  }
};

export const updateModule = async (
  currentState: CurrentState,
  data: ModuleSchema
) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || (role !== "admin" && role !== "teacher")) {
    return { success: false, error: true };
  }
  try {
    const course = await prisma.course.findFirst({
      where: {
        id: data.courseId,
        ...(role === "teacher" ? { teacherId: userId } : {}),
      },
    });
    if (!course) {
      return { success: false, error: true };
    }

    await prisma.module.update({
      where: {
        id: data.id,
      },
      data: {
        title: data.title,
        description: data.description || null,
        order: data.order,
        isLocked: data.isLocked,
        courseId: data.courseId,
      },
    });

    revalidatePath("/list/courses");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true };
  }
};

export const deleteModule = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || (role !== "admin" && role !== "teacher")) {
    return { success: false, error: true };
  }
  try {
    const moduleItem = await prisma.module.findUnique({
      where: { id: parseInt(id) },
      include: { course: true },
    });
    if (!moduleItem) {
      return { success: false, error: true };
    }
    if (role === "teacher" && moduleItem.course.teacherId !== userId) {
      return { success: false, error: true };
    }

    await prisma.module.delete({
      where: {
        id: parseInt(id),
      },
    });

    revalidatePath("/list/courses");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true };
  }
};

// ENROLLMENT ACTIONS

export const enrollStudent = async (
  currentState: CurrentState,
  data: EnrollmentSchema
) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || role !== "admin") {
    return { success: false, error: true };
  }
  try {
    // Check course is not ARCHIVED
    const course = await prisma.course.findUnique({
      where: { id: data.courseId },
    });
    if (!course || course.status === "ARCHIVED") {
      return { success: false, error: true };
    }

    // Check no duplicate enrollment
    const existing = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: data.studentId,
          courseId: data.courseId,
        },
      },
    });
    if (existing) {
      return { success: false, error: true };
    }

    await prisma.enrollment.create({
      data: {
        studentId: data.studentId,
        courseId: data.courseId,
      },
    });

    // Create notification for the student
    try {
      await prisma.notification.create({
        data: {
          userId: data.studentId,
          type: "ENROLLMENT",
          message: `You have been enrolled in ${course.title}`,
        },
      });
    } catch {
      // Notification failure should not block the enrollment
    }

    revalidatePath("/list/enrollments");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true };
  }
};

export const dropEnrollment = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || role !== "admin") {
    return { success: false, error: true };
  }
  try {
    await prisma.enrollment.update({
      where: {
        id: parseInt(id),
      },
      data: {
        status: "DROPPED",
      },
    });

    revalidatePath("/list/enrollments");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true };
  }
};

// SELF-ENROLLMENT ACTIONS

export const selfEnrollStudent = async (
  currentState: CurrentState,
  data: { courseId: number }
): Promise<CurrentState> => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || role !== "student") {
    return { success: false, error: true };
  }
  try {
    // Look up student record by Clerk ID
    const student = await prisma.student.findUnique({
      where: { id: userId },
    });
    if (!student) {
      return { success: false, error: true };
    }

    // Validate courseId
    const parsed = selfEnrollmentSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: true };
    }
    const { courseId } = parsed.data;

    // Fetch course and verify it's ACTIVE
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { teacher: { select: { id: true, name: true } } },
    });
    if (!course || course.status !== "ACTIVE") {
      return { success: false, error: true };
    }

    // Check for existing enrollment
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: userId,
          courseId,
        },
      },
    });

    if (existingEnrollment) {
      if (existingEnrollment.status === "ACTIVE") {
        // Already enrolled
        return { success: false, error: true, message: "Already enrolled" };
      }
      if (existingEnrollment.status === "COMPLETED") {
        // Cannot re-enroll in completed course
        return { success: false, error: true, message: "Course already completed" };
      }
      // DROPPED status - re-enroll by updating back to ACTIVE
      if (existingEnrollment.status === "DROPPED") {
        // Capacity check for re-enrollment
        if (course.maxEnrollments !== null) {
          const activeCount = await prisma.enrollment.count({
            where: { courseId, status: "ACTIVE" },
          });
          if (activeCount >= course.maxEnrollments) {
            return { success: false, error: true, message: "Course is full" };
          }
        }

        await prisma.enrollment.update({
          where: { id: existingEnrollment.id },
          data: { status: "ACTIVE", enrolledAt: new Date() },
        });

        // Notifications for re-enrollment
        try {
          await prisma.notification.create({
            data: {
              userId,
              type: "ENROLLMENT",
              message: `You have enrolled in ${course.title}`,
            },
          });
          await prisma.notification.create({
            data: {
              userId: course.teacherId,
              type: "ENROLLMENT",
              message: `${student.name} ${student.surname} has enrolled in your course ${course.title}`,
            },
          });
        } catch {
          // Notification failure should not block enrollment
        }

        revalidatePath("/list/courses");
        return { success: true, error: false };
      }
    }

    // New enrollment - atomic capacity check + create
    if (course.maxEnrollments !== null) {
      await prisma.$transaction(async (tx) => {
        const activeCount = await tx.enrollment.count({
          where: { courseId, status: "ACTIVE" },
        });
        if (activeCount >= course.maxEnrollments!) {
          throw new Error("Course is full");
        }
        await tx.enrollment.create({
          data: {
            studentId: userId,
            courseId,
            status: "ACTIVE",
          },
        });
      });
    } else {
      // Unlimited capacity - create directly
      await prisma.enrollment.create({
        data: {
          studentId: userId,
          courseId,
          status: "ACTIVE",
        },
      });
    }

    // Notifications
    try {
      await prisma.notification.create({
        data: {
          userId,
          type: "ENROLLMENT",
          message: `You have enrolled in ${course.title}`,
        },
      });
      await prisma.notification.create({
        data: {
          userId: course.teacherId,
          type: "ENROLLMENT",
          message: `${student.name} ${student.surname} has enrolled in your course ${course.title}`,
        },
      });
    } catch {
      // Notification failure should not block enrollment
    }

    revalidatePath("/list/courses");
    return { success: true, error: false };
  } catch (err: any) {
    if (err.message === "Course is full") {
      return { success: false, error: true, message: "Course is full" };
    }
    return { success: false, error: true };
  }
};

export const unenrollSelf = async (
  currentState: CurrentState,
  data: { enrollmentId: number }
): Promise<CurrentState> => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || role !== "student") {
    return { success: false, error: true };
  }
  try {
    // Fetch enrollment and verify ownership
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: data.enrollmentId },
      include: {
        course: {
          select: { title: true, teacherId: true },
        },
      },
    });

    if (!enrollment || enrollment.studentId !== userId) {
      return { success: false, error: true };
    }

    // Cannot drop completed enrollment
    if (enrollment.status !== "ACTIVE") {
      return { success: false, error: true, message: "Can only drop active enrollments" };
    }

    // Update status to DROPPED
    await prisma.enrollment.update({
      where: { id: data.enrollmentId },
      data: { status: "DROPPED" },
    });

    // Notify teacher
    try {
      const student = await prisma.student.findUnique({
        where: { id: userId },
        select: { name: true, surname: true },
      });
      if (student) {
        await prisma.notification.create({
          data: {
            userId: enrollment.course.teacherId,
            type: "ENROLLMENT",
            message: `${student.name} ${student.surname} has dropped your course ${enrollment.course.title}`,
          },
        });
      }
    } catch {
      // Notification failure should not block unenrollment
    }

    revalidatePath("/list/courses");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true };
  }
};

// LMS LESSON ACTIONS

export const createLmsLesson = async (
  currentState: CurrentState,
  data: LmsLessonSchema
) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || (role !== "admin" && role !== "teacher")) {
    return { success: false, error: true };
  }
  try {
    const module = await prisma.module.findFirst({
      where: { id: data.moduleId },
      include: { course: true },
    });
    if (!module) {
      return { success: false, error: true };
    }
    if (role === "teacher" && module.course.teacherId !== userId) {
      return { success: false, error: true };
    }

    await prisma.lmsLesson.create({
      data: {
        title: data.title,
        content: data.content,
        contentType: data.contentType,
        externalUrl: data.externalUrl || null,
        order: data.order,
        estimatedMinutes: data.estimatedMinutes || null,
        moduleId: data.moduleId,
        flagForReview: data.flagForReview ?? false,
      },
    });

    revalidatePath("/list/courses");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true };
  }
};

export const updateLmsLesson = async (
  currentState: CurrentState,
  data: LmsLessonSchema
) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || (role !== "admin" && role !== "teacher")) {
    return { success: false, error: true };
  }
  try {
    const module = await prisma.module.findFirst({
      where: { id: data.moduleId },
      include: { course: true },
    });
    if (!module) {
      return { success: false, error: true };
    }
    if (role === "teacher" && module.course.teacherId !== userId) {
      return { success: false, error: true };
    }

    await prisma.lmsLesson.update({
      where: { id: data.id },
      data: {
        title: data.title,
        content: data.content,
        contentType: data.contentType,
        externalUrl: data.externalUrl || null,
        order: data.order,
        estimatedMinutes: data.estimatedMinutes || null,
        moduleId: data.moduleId,
        flagForReview: data.flagForReview ?? false,
      },
    });

    revalidatePath("/list/courses");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true };
  }
};

export const deleteLmsLesson = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || (role !== "admin" && role !== "teacher")) {
    return { success: false, error: true };
  }
  try {
    const lesson = await prisma.lmsLesson.findUnique({
      where: { id: parseInt(id) },
      include: { module: { include: { course: true } } },
    });
    if (!lesson) {
      return { success: false, error: true };
    }
    if (role === "teacher" && lesson.module.course.teacherId !== userId) {
      return { success: false, error: true };
    }

    await prisma.lmsLesson.delete({
      where: { id: parseInt(id) },
    });

    revalidatePath("/list/courses");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true };
  }
};

// PROGRESS TRACKING ACTIONS

export const startLessonProgress = async (lessonId: number) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || role !== "student") {
    return { success: false, error: true };
  }

  try {
    const lesson = await prisma.lmsLesson.findFirst({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            course: {
              include: {
                enrollments: {
                  where: { studentId: userId, status: "ACTIVE" },
                },
              },
            },
          },
        },
      },
    });
    if (!lesson || lesson.module.course.enrollments.length === 0) {
      return { success: false, error: true };
    }

    await prisma.lessonProgress.upsert({
      where: {
        studentId_lessonId: { studentId: userId, lessonId },
      },
      create: {
        studentId: userId,
        lessonId,
        status: "IN_PROGRESS",
        startedAt: new Date(),
      },
      update: {},
    });

    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true };
  }
};

export const markLessonComplete = async (lessonId: number) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || role !== "student") {
    return { success: false, error: true };
  }

  try {
    const lesson = await prisma.lmsLesson.findFirst({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            course: {
              include: {
                enrollments: {
                  where: { studentId: userId, status: "ACTIVE" },
                },
              },
            },
          },
        },
      },
    });
    if (!lesson || lesson.module.course.enrollments.length === 0) {
      return { success: false, error: true };
    }

    await prisma.lessonProgress.upsert({
      where: {
        studentId_lessonId: { studentId: userId, lessonId },
      },
      create: {
        studentId: userId,
        lessonId,
        status: "COMPLETED",
        startedAt: new Date(),
        completedAt: new Date(),
      },
      update: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    // Fire-and-forget gamification event; failure must not affect lesson completion
    const { processGamificationEvent } = await import("./gamificationActions");
    processGamificationEvent(userId, "LESSON_COMPLETE", { lessonId }).catch(() => {});

    // Fire-and-forget review card generation from flagged lessons
    if (lesson.flagForReview) {
      import("./reviewActions").then(({ generateReviewCardFromLesson }) => {
        generateReviewCardFromLesson(userId, lessonId).catch(() => {});
      });
    }

    revalidatePath("/list/courses");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true };
  }
};

// QUIZ ACTIONS

export const createQuiz = async (
  currentState: CurrentState,
  data: QuizSchema
) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || (role !== "admin" && role !== "teacher")) {
    return { success: false, error: true };
  }
  try {
    const lesson = await prisma.lmsLesson.findFirst({
      where: { id: data.lessonId },
      include: { module: { include: { course: true } } },
    });
    if (!lesson) return { success: false, error: true };
    if (role === "teacher" && lesson.module.course.teacherId !== userId) {
      return { success: false, error: true };
    }

    await prisma.quiz.create({
      data: {
        title: data.title,
        description: data.description || null,
        timeLimit: data.timeLimit ? Number(data.timeLimit) : null,
        maxAttempts: data.maxAttempts,
        passScore: data.passScore,
        scoringPolicy: data.scoringPolicy,
        randomizeQuestions: data.randomizeQuestions,
        randomizeOptions: data.randomizeOptions,
        poolSize: data.poolSize ?? null,
        lessonId: data.lessonId,
      },
    });

    revalidatePath("/list/courses");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true };
  }
};

export const updateQuiz = async (
  currentState: CurrentState,
  data: QuizSchema
) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || (role !== "admin" && role !== "teacher")) {
    return { success: false, error: true };
  }
  try {
    const lesson = await prisma.lmsLesson.findFirst({
      where: { id: data.lessonId },
      include: { module: { include: { course: true } } },
    });
    if (!lesson) return { success: false, error: true };
    if (role === "teacher" && lesson.module.course.teacherId !== userId) {
      return { success: false, error: true };
    }

    await prisma.quiz.update({
      where: { id: data.id },
      data: {
        title: data.title,
        description: data.description || null,
        timeLimit: data.timeLimit ? Number(data.timeLimit) : null,
        maxAttempts: data.maxAttempts,
        passScore: data.passScore,
        scoringPolicy: data.scoringPolicy,
        randomizeQuestions: data.randomizeQuestions,
        randomizeOptions: data.randomizeOptions,
        poolSize: data.poolSize ?? null,
        lessonId: data.lessonId,
      },
    });

    revalidatePath("/list/courses");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true };
  }
};

export const deleteQuiz = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || (role !== "admin" && role !== "teacher")) {
    return { success: false, error: true };
  }
  try {
    const quiz = await prisma.quiz.findFirst({
      where: { id: parseInt(id) },
      include: { lesson: { include: { module: { include: { course: true } } } } },
    });
    if (!quiz) return { success: false, error: true };
    if (role === "teacher" && quiz.lesson.module.course.teacherId !== userId) {
      return { success: false, error: true };
    }

    await prisma.quiz.delete({
      where: { id: parseInt(id) },
    });

    revalidatePath("/list/courses");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true };
  }
};

// QUESTION ACTIONS

export const createQuestion = async (
  currentState: CurrentState,
  data: QuestionSchema
) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || (role !== "admin" && role !== "teacher")) {
    return { success: false, error: true };
  }
  try {
    if (data.quizId) {
      const quiz = await prisma.quiz.findFirst({
        where: { id: data.quizId },
        include: { lesson: { include: { module: { include: { course: true } } } } },
      });
      if (!quiz) return { success: false, error: true };
      if (role === "teacher" && quiz.lesson.module.course.teacherId !== userId) {
        return { success: false, error: true };
      }
    }

    await prisma.question.create({
      data: {
        text: data.text,
        type: data.type,
        explanation: data.explanation || null,
        points: data.points,
        order: data.order,
        quizId: data.quizId || null,
        questionBankId: data.questionBankId || null,
        options: {
          create: data.options.map((opt) => ({
            text: opt.text,
            isCorrect: opt.isCorrect,
            order: opt.order,
          })),
        },
      },
    });

    revalidatePath("/list/courses");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true };
  }
};

export const updateQuestion = async (
  currentState: CurrentState,
  data: QuestionSchema
) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || (role !== "admin" && role !== "teacher")) {
    return { success: false, error: true };
  }
  try {
    if (data.quizId) {
      const quiz = await prisma.quiz.findFirst({
        where: { id: data.quizId },
        include: { lesson: { include: { module: { include: { course: true } } } } },
      });
      if (!quiz) return { success: false, error: true };
      if (role === "teacher" && quiz.lesson.module.course.teacherId !== userId) {
        return { success: false, error: true };
      }
    }

    await prisma.$transaction(async (tx) => {
      // Delete existing options and recreate
      await tx.answerOption.deleteMany({
        where: { questionId: data.id },
      });

      await tx.question.update({
        where: { id: data.id },
        data: {
          text: data.text,
          type: data.type,
          explanation: data.explanation || null,
          points: data.points,
          order: data.order,
          quizId: data.quizId || null,
          questionBankId: data.questionBankId || null,
          options: {
            create: data.options.map((opt) => ({
              text: opt.text,
              isCorrect: opt.isCorrect,
              order: opt.order,
            })),
          },
        },
      });
    });

    revalidatePath("/list/courses");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true };
  }
};

export const deleteQuestion = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || (role !== "admin" && role !== "teacher")) {
    return { success: false, error: true };
  }
  try {
    const question = await prisma.question.findFirst({
      where: { id: parseInt(id) },
      include: {
        quiz: {
          include: { lesson: { include: { module: { include: { course: true } } } } },
        },
      },
    });
    if (!question) return { success: false, error: true };
    if (question.quiz && role === "teacher" && question.quiz.lesson.module.course.teacherId !== userId) {
      return { success: false, error: true };
    }

    await prisma.question.delete({
      where: { id: parseInt(id) },
    });

    revalidatePath("/list/courses");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true };
  }
};

// QUESTION BANK ACTIONS

export const createQuestionBank = async (
  currentState: CurrentState,
  data: QuestionBankSchema
) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || (role !== "admin" && role !== "teacher")) {
    return { success: false, error: true };
  }
  try {
    await prisma.questionBank.create({
      data: {
        name: data.name,
        description: data.description || null,
        subjectId: data.subjectId,
        teacherId: userId,
      },
    });

    revalidatePath("/list/courses");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true };
  }
};

export const updateQuestionBank = async (
  currentState: CurrentState,
  data: QuestionBankSchema
) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || (role !== "admin" && role !== "teacher")) {
    return { success: false, error: true };
  }
  try {
    const bank = await prisma.questionBank.findFirst({
      where: { id: data.id },
    });
    if (!bank) return { success: false, error: true };
    if (role === "teacher" && bank.teacherId !== userId) {
      return { success: false, error: true };
    }

    await prisma.questionBank.update({
      where: { id: data.id },
      data: {
        name: data.name,
        description: data.description || null,
        subjectId: data.subjectId,
      },
    });

    revalidatePath("/list/courses");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true };
  }
};

export const deleteQuestionBank = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || (role !== "admin" && role !== "teacher")) {
    return { success: false, error: true };
  }
  try {
    const bank = await prisma.questionBank.findFirst({
      where: { id: parseInt(id) },
    });
    if (!bank) return { success: false, error: true };
    if (role === "teacher" && bank.teacherId !== userId) {
      return { success: false, error: true };
    }

    await prisma.questionBank.delete({
      where: { id: parseInt(id) },
    });

    revalidatePath("/list/courses");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true };
  }
};

// QUIZ ATTEMPT ACTIONS

// @MX:ANCHOR: [AUTO] startQuizAttempt -- entry point for quiz attempt creation, handles pool selection and shuffle persistence
// @MX:REASON: fan_in >= 3 (quiz page, enrollment flow, retry logic)
// @MX:SPEC: SPEC-QUIZ-002
export const startQuizAttempt = async (quizId: number) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || role !== "student") {
    return { success: false, error: true };
  }

  try {
    const quiz = await prisma.quiz.findFirst({
      where: { id: quizId },
      include: {
        lesson: {
          include: {
            module: {
              include: {
                course: {
                  include: {
                    enrollments: {
                      where: { studentId: userId, status: "ACTIVE" },
                    },
                  },
                },
              },
            },
          },
        },
        attempts: { where: { studentId: userId } },
        questions: {
          orderBy: { order: "asc" },
          include: {
            options: { orderBy: { order: "asc" } },
          },
        },
      },
    });

    if (!quiz || quiz.lesson.module.course.enrollments.length === 0) {
      return { success: false, error: true, message: "Not enrolled" };
    }

    if (quiz.attempts.length >= quiz.maxAttempts) {
      return { success: false, error: true, message: "Maximum attempts reached" };
    }

    // Compute shuffled order for persistence
    const { fisherYatesShuffle, selectPool } = await import("./shuffleUtils");

    let selectedQuestions = [...quiz.questions];

    // Pool selection: pick N random questions from total
    if (quiz.poolSize && quiz.poolSize > 0 && quiz.poolSize < selectedQuestions.length) {
      selectedQuestions = selectPool(selectedQuestions, quiz.poolSize);
    } else if (quiz.randomizeQuestions) {
      selectedQuestions = fisherYatesShuffle(selectedQuestions);
    }

    // Compute question order (IDs in presentation sequence)
    const questionOrder = selectedQuestions.map((q) => q.id);

    // Compute option order per question
    const optionOrder: Record<string, number[]> = {};
    for (const q of selectedQuestions) {
      if (quiz.randomizeOptions && q.type !== "FILL_IN_BLANK") {
        optionOrder[String(q.id)] = fisherYatesShuffle(q.options).map((o) => o.id);
      } else {
        optionOrder[String(q.id)] = q.options.map((o) => o.id);
      }
    }

    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId,
        studentId: userId,
        attemptNumber: quiz.attempts.length + 1,
        questionOrder,
        optionOrder,
      },
    });

    return { success: true, error: false, message: String(attempt.id) };
  } catch (err) {
    return { success: false, error: true };
  }
};

export const submitQuizAttempt = async (
  attemptId: number,
  responses: Array<{ questionId: number; selectedOptionId?: number; textResponse?: string }>
) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || role !== "student") {
    return { success: false, error: true };
  }

  try {
    const attempt = await prisma.quizAttempt.findFirst({
      where: { id: attemptId, studentId: userId },
      include: { quiz: { include: { questions: { include: { options: true } } } } },
    });

    if (!attempt || attempt.submittedAt) {
      return { success: false, error: true, message: "Invalid attempt" };
    }

    // Filter questions to pool-selected subset if questionOrder exists
    // @MX:NOTE: [AUTO] Pool selection: grade only the questions the student actually received
    // @MX:SPEC: SPEC-QUIZ-002
    const storedQuestionOrder = attempt.questionOrder as number[] | null;
    const questionsForGrading = storedQuestionOrder
      ? attempt.quiz.questions.filter((q) => storedQuestionOrder.includes(q.id))
      : attempt.quiz.questions;

    const { gradeQuizAttempt } = await import("./quizUtils");
    const gradingResult = gradeQuizAttempt(questionsForGrading, responses, attempt.quiz.passScore);

    await prisma.$transaction(async (tx) => {
      for (const resp of responses) {
        const questionGrade = gradingResult.questionResults.find(
          (qr) => qr.questionId === resp.questionId
        );

        await tx.questionResponse.create({
          data: {
            questionId: resp.questionId,
            attemptId,
            selectedOptionId: resp.selectedOptionId || null,
            textResponse: resp.textResponse || null,
            isCorrect: questionGrade?.isCorrect ?? false,
            pointsEarned: questionGrade?.pointsEarned ?? 0,
          },
        });
      }

      await tx.quizAttempt.update({
        where: { id: attemptId },
        data: {
          submittedAt: new Date(),
          score: gradingResult.score,
          maxScore: gradingResult.maxScore,
          percentage: gradingResult.percentage,
          passed: gradingResult.passed,
        },
      });
    });

    // Fire-and-forget gamification event; failure must not affect quiz submission
    const { processGamificationEvent } = await import("./gamificationActions");
    processGamificationEvent(userId, "QUIZ_SUBMIT", {
      quizId: attempt.quiz.id,
      percentage: gradingResult.percentage,
      passed: gradingResult.passed,
      passScore: attempt.quiz.passScore,
    }).catch(() => {});

    // Fire-and-forget review card generation from incorrect answers
    import("./reviewActions").then(({ generateReviewCardsFromQuiz }) => {
      generateReviewCardsFromQuiz(userId, attemptId).catch(() => {});
    });

    revalidatePath("/list/courses");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true };
  }
};
