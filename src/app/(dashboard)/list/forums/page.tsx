import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

const ForumsPage = async () => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (!userId || role === "parent") return notFound();
  const t = await getTranslations("entities");

  // Build query based on role
  let courses;
  if (role === "admin") {
    courses = await prisma.course.findMany({
      where: { status: "ACTIVE" },
      include: {
        teacher: { select: { name: true, surname: true } },
        subject: { select: { name: true } },
        _count: { select: { forumThreads: true, enrollments: { where: { status: "ACTIVE" } } } },
      },
      orderBy: { title: "asc" },
    });
  } else if (role === "teacher") {
    courses = await prisma.course.findMany({
      where: { teacherId: userId, status: "ACTIVE" },
      include: {
        teacher: { select: { name: true, surname: true } },
        subject: { select: { name: true } },
        _count: { select: { forumThreads: true, enrollments: { where: { status: "ACTIVE" } } } },
      },
      orderBy: { title: "asc" },
    });
  } else {
    // Student: only enrolled courses
    courses = await prisma.course.findMany({
      where: {
        status: "ACTIVE",
        enrollments: { some: { studentId: userId, status: "ACTIVE" } },
      },
      include: {
        teacher: { select: { name: true, surname: true } },
        subject: { select: { name: true } },
        _count: { select: { forumThreads: true, enrollments: { where: { status: "ACTIVE" } } } },
      },
      orderBy: { title: "asc" },
    });
  }

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <h1 className="text-xl font-semibold mb-6">{t("forums.pageTitle")}</h1>

      {courses.length === 0 ? (
        <p className="text-gray-500 text-sm">
          {role === "student"
            ? t("forums.notEnrolled")
            : t("forums.noActiveCourses")}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/list/courses/${course.id}/forum`}
              className="border rounded-lg p-4 hover:bg-lamaSkyLight transition-colors group"
            >
              <h2 className="font-semibold group-hover:text-blue-600">
                {course.title}
              </h2>
              <p className="text-xs text-gray-400 font-mono">{course.code}</p>
              <p className="text-sm text-gray-500 mt-1">
                {course.subject.name}
              </p>
              <div className="flex gap-4 mt-3 text-xs text-gray-400">
                <span>
                  {course._count.forumThreads}{" "}
                  {course._count.forumThreads === 1 ? t("forums.thread") : t("forums.threads")}
                </span>
                <span>{course._count.enrollments} {t("forums.students")}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {course.teacher.name} {course.teacher.surname}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ForumsPage;
