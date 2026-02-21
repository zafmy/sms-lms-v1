import prisma from "@/lib/prisma";
import RecentBadges from "./RecentBadges";

const RecentBadgesContainer = async ({
  studentId,
}: {
  studentId: string;
}) => {
  const badges = await prisma.studentBadge.findMany({
    where: { studentId },
    include: { badge: true },
    orderBy: { earnedAt: "desc" },
    take: 3,
  });

  return (
    <RecentBadges
      badges={badges.map((sb) => ({
        id: sb.badge.id,
        name: sb.badge.name,
        description: sb.badge.description,
        iconUrl: sb.badge.iconUrl,
        earnedAt: sb.earnedAt,
      }))}
    />
  );
};

export default RecentBadgesContainer;
