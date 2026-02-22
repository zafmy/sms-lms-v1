import prisma from "@/lib/prisma";
import {
  computeClassReviewStats,
  identifyStruggledCards,
  type StudentReviewData,
} from "@/lib/reviewAnalyticsUtils";
import ClassReviewAnalytics from "./ClassReviewAnalytics";

interface ClassReviewAnalyticsContainerProps {
  courseId: number;
}

const ClassReviewAnalyticsContainer = async ({
  courseId,
}: ClassReviewAnalyticsContainerProps) => {
  // Fetch enrolled students for this course
  const enrollments = await prisma.enrollment.findMany({
    where: { courseId, status: "ACTIVE" },
    select: {
      student: {
        select: {
          id: true,
          name: true,
          surname: true,
        },
      },
    },
  });

  if (enrollments.length === 0) {
    return null;
  }

  const studentIds = enrollments.map((e) => e.student.id);

  // Fetch review cards, sessions, and logs in parallel
  const [reviewCards, reviewSessions, reviewLogs] = await Promise.all([
    prisma.reviewCard.findMany({
      where: { courseId, studentId: { in: studentIds } },
      select: {
        studentId: true,
        leitnerBox: true,
        isActive: true,
      },
    }),

    prisma.reviewSession.findMany({
      where: { studentId: { in: studentIds } },
      select: {
        studentId: true,
        completedAt: true,
        totalCards: true,
        correctCards: true,
      },
    }),

    prisma.reviewLog.findMany({
      where: {
        studentId: { in: studentIds },
        reviewCard: { courseId },
      },
      select: {
        reviewCardId: true,
        rating: true,
        reviewCard: { select: { front: true } },
      },
    }),
  ]);

  // Build StudentReviewData for each student
  const students: StudentReviewData[] = enrollments.map((e) => {
    const sid = e.student.id;
    const cards = reviewCards.filter((c) => c.studentId === sid);
    const sessions = reviewSessions.filter((s) => s.studentId === sid);
    const completedSessions = sessions.filter((s) => s.completedAt !== null);

    const totalCards = cards.filter((c) => c.isActive).length;
    const masteredCards = cards.filter(
      (c) => c.isActive && c.leitnerBox >= 4
    ).length;

    const totalCorrect = completedSessions.reduce(
      (sum, s) => sum + s.correctCards,
      0
    );
    const totalAttempted = completedSessions.reduce(
      (sum, s) => sum + s.totalCards,
      0
    );
    const averageCorrectRate =
      totalAttempted > 0 ? (totalCorrect / totalAttempted) * 100 : 0;

    const lastSession = completedSessions
      .filter((s) => s.completedAt !== null)
      .sort(
        (a, b) =>
          new Date(b.completedAt!).getTime() -
          new Date(a.completedAt!).getTime()
      )[0];

    return {
      studentId: sid,
      studentName: `${e.student.name} ${e.student.surname}`,
      sessionsCompleted: completedSessions.length,
      totalCards,
      masteredCards,
      averageCorrectRate,
      lastSessionDate: lastSession?.completedAt ?? null,
    };
  });

  const stats = computeClassReviewStats(students);
  const struggledCards = identifyStruggledCards(reviewLogs);

  return (
    <ClassReviewAnalytics
      stats={stats}
      students={students}
      struggledCards={struggledCards}
    />
  );
};

export default ClassReviewAnalyticsContainer;
