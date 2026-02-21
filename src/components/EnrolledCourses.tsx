import CourseProgressBar from "@/components/CourseProgressBar";
import prisma from "@/lib/prisma";
import Link from "next/link";

const EnrolledCourses = async ({ studentId }: { studentId: string }) => {
  const enrollments = await prisma.enrollment.findMany({
    where: {
      studentId,
      status: "ACTIVE",
    },
    include: {
      course: {
        include: {
          teacher: { select: { name: true, surname: true } },
          subject: { select: { name: true } },
          modules: {
            include: {
              lessons: {
                select: { id: true },
              },
            },
          },
        },
      },
    },
  });

  // Fetch all lesson progress for this student across enrolled courses
  const allLessonIds = enrollments.flatMap((e) =>
    e.course.modules.flatMap((m) => m.lessons.map((l) => l.id))
  );

  const progressRecords =
    allLessonIds.length > 0
      ? await prisma.lessonProgress.findMany({
          where: {
            studentId,
            lessonId: { in: allLessonIds },
            status: "COMPLETED",
          },
          select: { lessonId: true },
        })
      : [];

  const completedLessonIds = new Set(progressRecords.map((p) => p.lessonId));

  return (
    <div className="bg-white p-4 rounded-md">
      <h2 className="text-lg font-semibold mb-4">My Courses</h2>
      {enrollments.length === 0 ? (
        <p className="text-gray-400 text-sm">No courses enrolled yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {enrollments.map((enrollment) => {
            const totalLessons = enrollment.course.modules.reduce(
              (acc, m) => acc + m.lessons.length,
              0
            );
            const completedLessons = enrollment.course.modules.reduce(
              (acc, m) =>
                acc +
                m.lessons.filter((l) => completedLessonIds.has(l.id)).length,
              0
            );

            return (
              <Link
                key={enrollment.id}
                href={`/list/courses/${enrollment.course.id}`}
                className="border border-gray-200 rounded-md p-4 hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold text-md mb-1">
                  {enrollment.course.title}
                </h3>
                <div className="flex gap-3 text-xs text-gray-500 mb-3">
                  <span>
                    {enrollment.course.teacher.name}{" "}
                    {enrollment.course.teacher.surname}
                  </span>
                  <span>{enrollment.course.subject.name}</span>
                </div>
                <CourseProgressBar
                  completed={completedLessons}
                  total={totalLessons}
                />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EnrolledCourses;
