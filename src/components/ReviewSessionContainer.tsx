import { startReviewSession } from "@/lib/reviewActions";
import ReviewSessionClient from "./ReviewSessionClient";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

const ReviewSessionContainer = async ({
  studentId,
}: {
  studentId: string;
}) => {
  const t = await getTranslations("entities");
  const result = await startReviewSession(studentId);

  if (
    !result.success ||
    !result.sessionId ||
    !result.cards ||
    result.cards.length === 0
  ) {
    redirect("/list/reviews");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawCards = result.cards as any[];
  const cards = rawCards.map((c) => ({
    id: c.id as number,
    front: c.front as string,
    back: c.back as string,
    leitnerBox: c.leitnerBox as number,
    cardType: c.cardType as string,
    subjectName: (c.subject?.name as string) || t("reviews.unknown"),
  }));

  return <ReviewSessionClient sessionId={result.sessionId} cards={cards} />;
};

export default ReviewSessionContainer;
