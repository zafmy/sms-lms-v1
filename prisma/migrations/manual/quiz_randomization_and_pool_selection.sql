-- SPEC-QUIZ-002: Question Randomization and Pool Selection
-- Run this migration manually if prisma migrate dev is not available.

-- Add poolSize to Quiz model (null = use all questions)
ALTER TABLE "Quiz" ADD COLUMN IF NOT EXISTS "poolSize" INTEGER;

-- Add questionOrder and optionOrder to QuizAttempt model
-- questionOrder: JSON array of question IDs in shuffled order
-- optionOrder: JSON object mapping questionId -> array of option IDs
ALTER TABLE "QuizAttempt" ADD COLUMN IF NOT EXISTS "questionOrder" JSONB;
ALTER TABLE "QuizAttempt" ADD COLUMN IF NOT EXISTS "optionOrder" JSONB;
