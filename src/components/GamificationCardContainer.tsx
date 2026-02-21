import prisma from "@/lib/prisma";
import GamificationCard from "./GamificationCard";

const GamificationCardContainer = async ({
  studentId,
}: {
  studentId: string;
}) => {
  const gamification = await prisma.studentGamification.findUnique({
    where: { studentId },
  });

  return (
    <GamificationCard
      data={
        gamification
          ? {
              totalXp: gamification.totalXp,
              currentLevel: gamification.currentLevel,
              currentStreak: gamification.currentStreak,
              longestStreak: gamification.longestStreak,
            }
          : {
              totalXp: 0,
              currentLevel: 1,
              currentStreak: 0,
              longestStreak: 0,
            }
      }
    />
  );
};

export default GamificationCardContainer;
