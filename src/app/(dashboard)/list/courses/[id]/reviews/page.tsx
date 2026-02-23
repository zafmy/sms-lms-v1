import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getIntlLocale } from "@/lib/formatUtils";

const CourseReviewsPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  const courseId = parseInt(id);
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const locale = await getLocale();

  if (!userId || (role !== "admin" && role !== "teacher")) {
    return notFound();
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      title: true,
      teacherId: true,
    },
  });

  if (!course) {
    return notFound();
  }

  if (role === "teacher" && course.teacherId !== userId) {
    return notFound();
  }

  const reviewCards = await prisma.reviewCard.findMany({
    where: {
      courseId,
      cardType: { in: ["FLASHCARD", "VOCABULARY"] },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      front: true,
      cardType: true,
      createdAt: true,
      _count: {
        select: {
          reviewLogs: true,
        },
      },
    },
    distinct: ["front"],
  });

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Review Cards</h1>
          <p className="text-sm text-gray-500">{course.title}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/list/courses/${courseId}`}
            className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            Back to Course
          </Link>
          <Link
            href={`/list/courses/${courseId}/reviews/create`}
            className="px-3 py-1 rounded-full text-sm bg-blue-500 text-white hover:bg-blue-600"
          >
            Create Review Card
          </Link>
        </div>
      </div>

      {reviewCards.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-2">No review cards yet</p>
          <p className="text-sm">
            Create review cards to help students with spaced repetition learning.
          </p>
        </div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-500 border-b">
              <th className="pb-2 px-2">Front</th>
              <th className="pb-2 px-2">Card Type</th>
              <th className="pb-2 px-2">Created At</th>
              <th className="pb-2 px-2">Review Count</th>
            </tr>
          </thead>
          <tbody>
            {reviewCards.map((card) => (
              <tr key={card.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-2 text-sm">
                  {card.front.length > 80
                    ? card.front.substring(0, 80) + "..."
                    : card.front}
                </td>
                <td className="py-3 px-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      card.cardType === "FLASHCARD"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-teal-100 text-teal-700"
                    }`}
                  >
                    {card.cardType}
                  </span>
                </td>
                <td className="py-3 px-2 text-sm text-gray-500">
                  {card.createdAt.toLocaleDateString(getIntlLocale(locale))}
                </td>
                <td className="py-3 px-2 text-sm text-gray-500">
                  {card._count.reviewLogs}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default CourseReviewsPage;
