import ForumThreadList from "@/components/ForumThreadList";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

const ForumPage = async ({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; search?: string }>;
}) => {
  const { id } = await params;
  const sp = await searchParams;
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const courseId = parseInt(id);
  const t = await getTranslations("lms.forums");

  if (!userId || !role) return notFound();

  // Verify access
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, title: true, teacherId: true },
  });
  if (!course) return notFound();

  // Teacher can only see own course
  if (role === "teacher" && course.teacherId !== userId) return notFound();

  // Student must be enrolled
  if (role === "student") {
    const enrollment = await prisma.enrollment.findFirst({
      where: { courseId, studentId: userId, status: "ACTIVE" },
    });
    if (!enrollment) return notFound();
  }

  // Parent has no access
  if (role === "parent") return notFound();

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href={`/list/courses/${courseId}`}
            className="text-sm text-gray-500 hover:underline"
          >
            &larr; {t("backToCourse")}
          </Link>
          <h1 className="text-xl font-semibold">
            {t("discussionForum", { title: course.title })}
          </h1>
        </div>
      </div>
      <ForumThreadList
        courseId={courseId}
        searchParams={sp}
        role={role}
        userId={userId}
      />
    </div>
  );
};

export default ForumPage;
