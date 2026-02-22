import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import {
  buildReviewQueue,
  estimateReviewTime,
  computeSubjectMastery,
  computeCardDistribution,
} from "@/lib/spacedRepetitionUtils";
import ReviewQueue from "@/components/ReviewQueue";

const ReviewsPage = async () => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || role !== "student") return null;

  // Fetch active review cards with subject info
  const cards = await prisma.reviewCard.findMany({
    where: { studentId: userId, isActive: true },
    include: {
      subject: { select: { id: true, name: true } },
      course: { select: { id: true, title: true } },
    },
    orderBy: { nextReviewDate: "asc" },
  });

  // Build queue for display
  const queueCards = buildReviewQueue(
    cards.map((c) => ({
      id: c.id,
      nextReviewDate: c.nextReviewDate,
      leitnerBox: c.leitnerBox,
      reviewCount: c.reviewCount,
      isActive: c.isActive,
    })),
    15
  );

  const totalDue = cards.filter(
    (c) => c.nextReviewDate <= new Date()
  ).length;
  const estimatedSeconds = estimateReviewTime(Math.min(totalDue, 15));

  // Subject breakdown of due cards
  const dueCards = cards.filter((c) => c.nextReviewDate <= new Date());
  const subjectBreakdown: Record<string, number> = {};
  for (const card of dueCards) {
    const name = card.subject.name;
    subjectBreakdown[name] = (subjectBreakdown[name] || 0) + 1;
  }

  // Card distribution for history chart
  const distribution = computeCardDistribution(cards);

  // Subject mastery
  const mastery = computeSubjectMastery(
    cards.map((c) => ({ subjectId: c.subjectId, leitnerBox: c.leitnerBox }))
  );
  const subjectNames = new Map(
    cards.map((c) => [c.subjectId, c.subject.name])
  );
  const masteryData = Array.from(mastery.entries()).map(
    ([subjectId, pct]) => ({
      subjectId,
      subjectName: subjectNames.get(subjectId) || "Unknown",
      percentage: pct,
    })
  );

  // Recent sessions
  const recentSessions = await prisma.reviewSession.findMany({
    where: { studentId: userId, completedAt: { not: null } },
    orderBy: { completedAt: "desc" },
    take: 5,
  });

  return (
    <div className="p-4 flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Review Cards</h1>
      <ReviewQueue
        totalDue={totalDue}
        estimatedMinutes={Math.ceil(estimatedSeconds / 60)}
        subjectBreakdown={subjectBreakdown}
        distribution={distribution}
        masteryData={masteryData}
        recentSessions={recentSessions.map((s) => ({
          id: s.id,
          completedAt: s.completedAt!.toISOString(),
          totalCards: s.totalCards,
          correctCards: s.correctCards,
          xpEarned: s.xpEarned,
        }))}
      />
    </div>
  );
};

export default ReviewsPage;
