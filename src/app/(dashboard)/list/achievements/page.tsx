import BadgeGallery from "@/components/BadgeGallery";
import LevelProgressBar from "@/components/LevelProgressBar";
import StreakCalendar from "@/components/StreakCalendar";
import XpTransactionHistory from "@/components/XpTransactionHistory";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const AchievementsPage = async () => {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Fetch all data in parallel
  const [gamification, allBadges, earnedBadges, transactions] =
    await Promise.all([
      prisma.studentGamification.findUnique({
        where: { studentId: userId },
      }),
      prisma.badge.findMany({
        orderBy: { category: "asc" },
      }),
      prisma.studentBadge.findMany({
        where: { studentId: userId },
        include: { badge: true },
        orderBy: { earnedAt: "desc" },
      }),
      prisma.xpTransaction.findMany({
        where: { studentId: userId },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    ]);

  // Extract unique activity dates for streak calendar
  const activityDates = [
    ...new Set(
      transactions.map((tx) => tx.createdAt.toISOString().split("T")[0])
    ),
  ];

  const totalXp = gamification?.totalXp ?? 0;
  const currentLevel = gamification?.currentLevel ?? 1;
  const currentStreak = gamification?.currentStreak ?? 0;

  return (
    <div className="p-4 flex flex-col gap-4">
      {/* Top: Level Progress */}
      <LevelProgressBar totalXp={totalXp} currentLevel={currentLevel} />

      {/* Middle: Badge Gallery */}
      <BadgeGallery
        badges={allBadges.map((b) => ({
          id: b.id,
          name: b.name,
          description: b.description,
          iconUrl: b.iconUrl,
          category: b.category,
        }))}
        earnedBadges={earnedBadges.map((sb) => ({
          badgeId: sb.badgeId,
          earnedAt: sb.earnedAt,
        }))}
      />

      {/* Bottom: XP History + Streak Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <XpTransactionHistory
          transactions={transactions.map((tx) => ({
            id: tx.id,
            amount: tx.amount,
            source: tx.source,
            sourceId: tx.sourceId,
            createdAt: tx.createdAt,
          }))}
        />
        <StreakCalendar
          activityDates={activityDates}
          currentStreak={currentStreak}
        />
      </div>
    </div>
  );
};

export default AchievementsPage;
