import prisma from "@/lib/prisma";
import {
  computeLeaderboardRanking,
  computeWeeklyXp,
} from "@/lib/gamificationUtils";
import ClassLeaderboard from "./ClassLeaderboard";

const ClassLeaderboardContainer = async ({
  teacherId,
}: {
  teacherId: string;
}) => {
  // Find distinct classIds for lessons taught by this teacher
  const lessons = await prisma.lesson.findMany({
    where: { teacherId },
    select: { classId: true },
    distinct: ["classId"],
  });

  const classIds = lessons.map((l) => l.classId);

  if (classIds.length === 0) {
    return (
      <div className="bg-white p-4 rounded-md">
        <h3 className="text-lg font-semibold">Class Leaderboard</h3>
        <p className="text-gray-400 text-sm mt-2">No student data available</p>
      </div>
    );
  }

  // Fetch students in those classes with their gamification data
  const students = await prisma.student.findMany({
    where: { classId: { in: classIds } },
    include: {
      gamification: {
        select: { totalXp: true, currentLevel: true },
      },
    },
  });

  // Prepare all-time ranking data
  const allTimeData = students
    .filter((s) => s.gamification !== null)
    .map((s) => ({
      studentId: s.id,
      name: s.name + " " + s.surname,
      totalXp: s.gamification!.totalXp,
      currentLevel: s.gamification!.currentLevel,
    }));

  const allTimeRanking = computeLeaderboardRanking(allTimeData);

  // Fetch XP transactions from last 7 days for weekly ranking
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  weekStart.setHours(0, 0, 0, 0);

  const studentIds = students.map((s) => s.id);

  const recentTransactions = await prisma.xpTransaction.findMany({
    where: {
      studentId: { in: studentIds },
      createdAt: { gte: weekStart },
    },
    select: {
      studentId: true,
      amount: true,
      createdAt: true,
    },
  });

  // Group transactions by student and compute weekly XP
  const weeklyData = students
    .filter((s) => s.gamification !== null)
    .map((s) => {
      const studentTx = recentTransactions.filter(
        (tx) => tx.studentId === s.id
      );
      const weeklyXp = computeWeeklyXp(studentTx, weekStart);
      return {
        studentId: s.id,
        name: s.name + " " + s.surname,
        totalXp: weeklyXp,
        currentLevel: s.gamification!.currentLevel,
      };
    })
    .filter((s) => s.totalXp > 0);

  const weeklyRanking = computeLeaderboardRanking(weeklyData);

  return (
    <ClassLeaderboard
      allTimeRanking={allTimeRanking}
      weeklyRanking={weeklyRanking}
    />
  );
};

export default ClassLeaderboardContainer;
