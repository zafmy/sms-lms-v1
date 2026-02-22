import prisma from "@/lib/prisma";
import PreClassReviewReport from "./PreClassReviewReport";

const PreClassReviewReportContainer = async ({
  courseId,
}: {
  courseId: number;
}) => {
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  // Fetch enrolled students
  const enrollments = await prisma.enrollment.findMany({
    where: {
      courseId,
      status: "ACTIVE",
    },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          surname: true,
        },
      },
    },
  });

  // Fetch total review cards for this course
  const totalCardsPerStudent = await prisma.reviewCard.groupBy({
    by: ["studentId"],
    where: {
      courseId,
      isActive: true,
    },
    _count: {
      id: true,
    },
  });

  const totalCardsMap = new Map(
    totalCardsPerStudent.map((item) => [item.studentId, item._count.id])
  );

  // Fetch review sessions from last 2 weeks
  const recentSessions = await prisma.reviewSession.findMany({
    where: {
      studentId: { in: enrollments.map((e) => e.studentId) },
      startedAt: { gte: twoWeeksAgo },
      completedAt: { not: null },
    },
    select: {
      studentId: true,
      totalCards: true,
      correctCards: true,
    },
  });

  // Compute per-student metrics
  const sessionsByStudent = new Map<
    string,
    { totalCards: number; correctCards: number }[]
  >();

  for (const session of recentSessions) {
    const existing = sessionsByStudent.get(session.studentId) || [];
    existing.push({
      totalCards: session.totalCards,
      correctCards: session.correctCards,
    });
    sessionsByStudent.set(session.studentId, existing);
  }

  const students = enrollments.map((enrollment) => {
    const sessions = sessionsByStudent.get(enrollment.studentId) || [];
    const reviewsCompleted = sessions.length;
    const totalCards = totalCardsMap.get(enrollment.studentId) || 0;

    let completionRate = 0;
    if (totalCards > 0 && reviewsCompleted > 0) {
      const totalReviewed = sessions.reduce(
        (sum, s) => sum + s.totalCards,
        0
      );
      completionRate = Math.min(
        Math.round((totalReviewed / totalCards) * 100),
        100
      );
    }

    let averageScore = 0;
    if (reviewsCompleted > 0) {
      const totalCorrect = sessions.reduce(
        (sum, s) => sum + s.correctCards,
        0
      );
      const totalAttempted = sessions.reduce(
        (sum, s) => sum + s.totalCards,
        0
      );
      averageScore =
        totalAttempted > 0
          ? Math.round((totalCorrect / totalAttempted) * 100)
          : 0;
    }

    return {
      name: `${enrollment.student.name} ${enrollment.student.surname}`,
      reviewsCompleted,
      completionRate,
      averageScore,
    };
  });

  return <PreClassReviewReport students={students} />;
};

export default PreClassReviewReportContainer;
