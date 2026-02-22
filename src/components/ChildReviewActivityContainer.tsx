import prisma from "@/lib/prisma";
import {
  computeSubjectMastery,
  computeCardDistribution,
} from "@/lib/spacedRepetitionUtils";
import ChildReviewActivity from "./ChildReviewActivity";

const ChildReviewActivityContainer = async ({
  studentId,
  studentName,
}: {
  studentId: string;
  studentName: string;
}) => {
  // Fetch active review cards with subject relation, review sessions, and gamification in parallel
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

  const [activeCards, reviewSessions, gamification] = await Promise.all([
    prisma.reviewCard.findMany({
      where: { studentId, isActive: true },
      select: {
        id: true,
        leitnerBox: true,
        subjectId: true,
        subject: { select: { name: true } },
      },
    }),
    prisma.reviewSession.findMany({
      where: {
        studentId,
        startedAt: { gte: fourWeeksAgo },
        completedAt: { not: null },
      },
      select: { startedAt: true },
    }),
    prisma.studentGamification.findUnique({
      where: { studentId },
      select: { currentStreak: true },
    }),
  ]);

  if (activeCards.length === 0) {
    return (
      <ChildReviewActivity
        studentName={studentName}
        completionRate={0}
        currentStreak={0}
        totalCards={0}
        subjects={[]}
        distribution={[0, 0, 0, 0, 0]}
        isEmpty
      />
    );
  }

  // Completion rate: completed sessions / expected weekends (4 weeks = 4 weekends)
  const expectedWeekends = 4;
  const completionRate = Math.round(
    (reviewSessions.length / expectedWeekends) * 100
  );

  // Current streak from gamification record
  const currentStreak = gamification?.currentStreak ?? 0;

  // Subject mastery using utility function
  const masteryMap = computeSubjectMastery(
    activeCards.map((c) => ({ subjectId: c.subjectId, leitnerBox: c.leitnerBox }))
  );

  // Build subject name -> percentage array (max 5 subjects)
  const subjectNameMap = new Map<number, string>();
  for (const card of activeCards) {
    if (!subjectNameMap.has(card.subjectId)) {
      subjectNameMap.set(card.subjectId, card.subject.name);
    }
  }

  const subjects = Array.from(masteryMap.entries())
    .map(([subjectId, percentage]) => ({
      name: subjectNameMap.get(subjectId) ?? "Unknown",
      percentage: Math.round(percentage),
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 5);

  // Card distribution across boxes
  const distribution = computeCardDistribution(activeCards);

  return (
    <ChildReviewActivity
      studentName={studentName}
      completionRate={Math.min(completionRate, 100)}
      currentStreak={currentStreak}
      totalCards={activeCards.length}
      subjects={subjects}
      distribution={distribution}
    />
  );
};

export default ChildReviewActivityContainer;
