import CourseAnalyticsContainer from "@/components/CourseAnalyticsContainer";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";

const CourseAnalyticsPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  // Only admin and teacher can view analytics
  if (role !== "admin" && role !== "teacher") return notFound();

  const course = await prisma.course.findUnique({
    where: { id: parseInt(id) },
    select: { id: true, teacherId: true },
  });

  if (!course) return notFound();

  // Teacher must own the course
  if (role === "teacher" && course.teacherId !== userId) return notFound();

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <CourseAnalyticsContainer courseId={course.id} />
    </div>
  );
};

export default CourseAnalyticsPage;
