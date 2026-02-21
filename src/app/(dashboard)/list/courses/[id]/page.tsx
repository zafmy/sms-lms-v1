import CourseProgressBar from "@/components/CourseProgressBar";
import ModuleList from "@/components/ModuleList";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound } from "next/navigation";

const CourseDetailPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  const course = await prisma.course.findUnique({
    where: { id: parseInt(id) },
    include: {
      teacher: { select: { name: true, surname: true } },
      subject: { select: { name: true } },
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
          },
        },
      },
      _count: { select: { enrollments: true } },
    },
  });

  if (!course) {
    return notFound();
  }

  // Teacher can only see own courses
  if (role === "teacher" && course.teacherId !== userId) {
    return notFound();
  }

  // Student must have active enrollment
  let studentProgress: any[] = [];
  if (role === "student") {
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: userId!,
          courseId: course.id,
        },
      },
    });
    if (!enrollment || enrollment.status !== "ACTIVE") {
      return notFound();
    }

    // Fetch student's lesson progress
    const lessonIds = course.modules.flatMap((m) =>
      m.lessons.map((l) => l.id)
    );
    if (lessonIds.length > 0) {
      studentProgress = await prisma.lessonProgress.findMany({
        where: {
          studentId: userId!,
          lessonId: { in: lessonIds },
        },
      });
    }
  }

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* COURSE INFO HEADER */}
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{course.title}</h1>
            <p className="text-sm text-gray-500 font-mono">{course.code}</p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-sm ${
                course.status === "ACTIVE"
                  ? "bg-green-100 text-green-700"
                  : course.status === "DRAFT"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {course.status}
            </span>
            {(role === "admin" ||
              (role === "teacher" && course.teacherId === userId)) && (
              <Link
                href={`/list/courses/${course.id}/analytics`}
                className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700 hover:bg-blue-200"
              >
                Analytics
              </Link>
            )}
          </div>
        </div>
        {course.description && (
          <p className="text-gray-600">{course.description}</p>
        )}
        <div className="flex gap-6 text-sm text-gray-500">
          <span>
            Teacher: {course.teacher.name} {course.teacher.surname}
          </span>
          <span>Subject: {course.subject.name}</span>
          <span>Enrolled: {course._count.enrollments}</span>
          <span>Modules: {course.modules.length}</span>
        </div>
      </div>

      {/* PROGRESS BAR FOR STUDENTS */}
      {role === "student" && (
        <div className="mb-6">
          <CourseProgressBar
            completed={studentProgress.filter((p) => p.status === "COMPLETED").length}
            total={course.modules.reduce((acc, m) => acc + m.lessons.length, 0)}
          />
        </div>
      )}

      {/* MODULE LIST */}
      <ModuleList
        modules={course.modules}
        role={role}
        courseId={course.id}
        studentProgress={studentProgress}
      />
    </div>
  );
};

export default CourseDetailPage;
