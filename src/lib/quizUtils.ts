type QuestionWithOptions = {
  id: number;
  type: string;
  points: number;
  options: Array<{ id: number; text: string; isCorrect: boolean }>;
};

type SubmittedResponse = {
  questionId: number;
  selectedOptionId?: number;
  textResponse?: string;
};

type QuestionResult = {
  questionId: number;
  isCorrect: boolean;
  pointsEarned: number;
};

type GradingResult = {
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  questionResults: QuestionResult[];
};

export function gradeQuizAttempt(
  questions: QuestionWithOptions[],
  responses: SubmittedResponse[],
  passScore: number
): GradingResult {
  let totalPoints = 0;
  let earnedPoints = 0;
  const questionResults: QuestionResult[] = [];

  for (const question of questions) {
    totalPoints += question.points;
    const response = responses.find((r) => r.questionId === question.id);

    if (!response) {
      questionResults.push({
        questionId: question.id,
        isCorrect: false,
        pointsEarned: 0,
      });
      continue;
    }

    let isCorrect = false;

    switch (question.type) {
      case "MULTIPLE_CHOICE":
      case "TRUE_FALSE": {
        const correctOption = question.options.find((o) => o.isCorrect);
        isCorrect = response.selectedOptionId === correctOption?.id;
        break;
      }
      case "FILL_IN_BLANK": {
        const correctOption = question.options.find((o) => o.isCorrect);
        isCorrect =
          response.textResponse?.trim().toLowerCase() ===
          correctOption?.text.trim().toLowerCase();
        break;
      }
    }

    const pointsEarned = isCorrect ? question.points : 0;
    if (isCorrect) earnedPoints += question.points;
    questionResults.push({ questionId: question.id, isCorrect, pointsEarned });
  }

  const percentage =
    totalPoints > 0
      ? Math.round((earnedPoints / totalPoints) * 100 * 10) / 10
      : 0;

  return {
    score: earnedPoints,
    maxScore: totalPoints,
    percentage,
    passed: percentage >= passScore,
    questionResults,
  };
}
