import { auth } from "@clerk/nextjs/server";
import ReviewSessionContainer from "@/components/ReviewSessionContainer";

const ReviewSessionPage = async () => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || role !== "student") return null;

  return <ReviewSessionContainer studentId={userId} />;
};

export default ReviewSessionPage;
