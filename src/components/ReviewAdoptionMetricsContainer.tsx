import prisma from "@/lib/prisma";
import {
  computeSchoolWideReviewMetrics,
  type StudentReviewData,
} from "@/lib/reviewAnalyticsUtils";
import ReviewAdoptionMetrics from "./ReviewAdoptionMetrics";

const ReviewAdoptionMetricsContainer = async () => {
  // Fetch all students who have at least one review card
  const studentsWithCards = await prisma.student.findMany({
    where: {
      reviewCards: { some: {} },
    },
    select: {
      id: true,
      name: true,
      surname: true,
      reviewCards: {
        where: { isActive: true },
        select: { leitnerBox: true },
      },
      reviewSessions: {
        where: { completedAt: { not: null } },
        select: {
          completedAt: true,
          totalCards: true,
          correctCards: true,
        },
      },
    },
  });

  if (studentsWithCards.length === 0) {
    return (
      <ReviewAdoptionMetrics
        metrics={{
          adoptionRate: 0,
          avgMastery: 0,
          totalSessions: 0,
          totalStudents: 0,
          activeStudents: 0,
        }}
      />
    );
  }

  const students: StudentReviewData[] = studentsWithCards.map((s) => {
    const totalCards = s.reviewCards.length;
    const masteredCards = s.reviewCards.filter(
      (c) => c.leitnerBox >= 4
    ).length;

    const sessions = s.reviewSessions;
    const totalCorrect = sessions.reduce(
      (sum, sess) => sum + sess.correctCards,
      0
    );
    const totalAttempted = sessions.reduce(
      (sum, sess) => sum + sess.totalCards,
      0
    );
    const averageCorrectRate =
      totalAttempted > 0 ? (totalCorrect / totalAttempted) * 100 : 0;

    const lastSession = sessions
      .sort(
        (a, b) =>
          new Date(b.completedAt!).getTime() -
          new Date(a.completedAt!).getTime()
      )[0];

    return {
      studentId: s.id,
      studentName: `${s.name} ${s.surname}`,
      sessionsCompleted: sessions.length,
      totalCards,
      masteredCards,
      averageCorrectRate,
      lastSessionDate: lastSession?.completedAt ?? null,
    };
  });

  const metrics = computeSchoolWideReviewMetrics(students);

  return <ReviewAdoptionMetrics metrics={metrics} />;
};

export default ReviewAdoptionMetricsContainer;
