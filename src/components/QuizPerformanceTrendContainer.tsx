import prisma from "@/lib/prisma";
import QuizPerformanceTrend from "@/components/QuizPerformanceTrend";

const QuizPerformanceTrendContainer = async ({
  studentId,
}: {
  studentId: string;
}) => {
  // Fetch all submitted quiz attempts for this student
  const attempts = await prisma.quizAttempt.findMany({
    where: {
      studentId,
      submittedAt: { not: null },
    },
    select: {
      submittedAt: true,
      percentage: true,
      quiz: { select: { title: true } },
    },
    orderBy: { submittedAt: "asc" },
  });

  // Map to chart-friendly data
  const chartData = attempts
    .filter((a) => a.submittedAt !== null && a.percentage !== null)
    .map((a) => ({
      date: a.submittedAt!.toISOString().slice(0, 10),
      percentage: Math.round(a.percentage!),
      quizTitle: a.quiz.title,
    }));

  return (
    <QuizPerformanceTrend data={chartData} passingScore={70} />
  );
};

export default QuizPerformanceTrendContainer;
