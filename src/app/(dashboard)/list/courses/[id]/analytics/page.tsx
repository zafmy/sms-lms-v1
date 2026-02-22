import ClassReviewAnalyticsContainer from "@/components/ClassReviewAnalyticsContainer";
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
    <div className="flex-1 m-4 mt-0 space-y-4">
      <div className="bg-white p-4 rounded-md">
        <CourseAnalyticsContainer courseId={course.id} />
      </div>
      <div className="bg-white p-4 rounded-md">
        <ClassReviewAnalyticsContainer courseId={course.id} />
      </div>
    </div>
  );
};

export default CourseAnalyticsPage;
