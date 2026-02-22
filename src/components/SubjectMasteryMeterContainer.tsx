import prisma from "@/lib/prisma";
import { computeSubjectMastery } from "@/lib/spacedRepetitionUtils";
import SubjectMasteryMeter from "./SubjectMasteryMeter";

interface SubjectMasteryMeterContainerProps {
  studentId: string;
}

const SubjectMasteryMeterContainer = async ({
  studentId,
}: SubjectMasteryMeterContainerProps) => {
  const reviewCards = await prisma.reviewCard.findMany({
    where: { studentId, isActive: true },
    select: {
      subjectId: true,
      leitnerBox: true,
      subject: { select: { name: true } },
    },
  });

  if (reviewCards.length === 0) {
    return <SubjectMasteryMeter data={[]} />;
  }

  // Build subject name map
  const subjectNames = new Map<number, string>();
  for (const card of reviewCards) {
    if (!subjectNames.has(card.subjectId)) {
      subjectNames.set(card.subjectId, card.subject.name);
    }
  }

  // Compute mastery using existing utility
  const masteryMap = computeSubjectMastery(
    reviewCards.map((c) => ({ subjectId: c.subjectId, leitnerBox: c.leitnerBox }))
  );

  const data = Array.from(masteryMap.entries()).map(
    ([subjectId, percentage]) => ({
      subjectName: subjectNames.get(subjectId) ?? `Subject ${subjectId}`,
      percentage,
    })
  );

  return <SubjectMasteryMeter data={data} />;
};

export default SubjectMasteryMeterContainer;
