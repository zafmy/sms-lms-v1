import prisma from "@/lib/prisma";
import { computeCardDistribution } from "@/lib/spacedRepetitionUtils";
import CardProgressionChart from "./CardProgressionChart";

interface CardProgressionChartContainerProps {
  studentId: string;
}

const CardProgressionChartContainer = async ({
  studentId,
}: CardProgressionChartContainerProps) => {
  const reviewCards = await prisma.reviewCard.findMany({
    where: { studentId, isActive: true },
    select: { leitnerBox: true },
  });

  const distribution = computeCardDistribution(reviewCards);

  return <CardProgressionChart distribution={distribution} />;
};

export default CardProgressionChartContainer;
