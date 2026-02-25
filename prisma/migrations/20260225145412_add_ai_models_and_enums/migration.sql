-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "aiGenerationLogId" INTEGER,
ADD COLUMN     "aiStatus" "AIContentStatus",
ADD COLUMN     "isAIGenerated" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ReviewCard" ADD COLUMN     "aiAdjustedInterval" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "aiConfidence" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "AIGenerationLog" (
    "id" SERIAL NOT NULL,
    "teacherId" TEXT NOT NULL,
    "lessonId" INTEGER,
    "generationType" "AIGenerationType" NOT NULL,
    "status" "AIGenerationStatus" NOT NULL DEFAULT 'PENDING',
    "provider" TEXT,
    "model" TEXT,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "estimatedCost" DOUBLE PRECISION,
    "metadata" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIGenerationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonSummary" (
    "id" SERIAL NOT NULL,
    "lessonId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "status" "AIContentStatus" NOT NULL DEFAULT 'DRAFT',
    "generatedByTeacherId" TEXT NOT NULL,
    "approvedByTeacherId" TEXT,
    "aiGenerationLogId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AISettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "provider" TEXT NOT NULL DEFAULT 'openai',
    "modelId" TEXT NOT NULL DEFAULT 'gpt-4o-mini',
    "monthlyQuotaPerTeacher" INTEGER NOT NULL DEFAULT 100,
    "maxTokensPerRequest" INTEGER NOT NULL DEFAULT 4000,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AISettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AIGenerationLog_teacherId_createdAt_idx" ON "AIGenerationLog"("teacherId", "createdAt");

-- CreateIndex
CREATE INDEX "AIGenerationLog_teacherId_generationType_createdAt_idx" ON "AIGenerationLog"("teacherId", "generationType", "createdAt");

-- CreateIndex
CREATE INDEX "LessonSummary_lessonId_status_idx" ON "LessonSummary"("lessonId", "status");

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_aiGenerationLogId_fkey" FOREIGN KEY ("aiGenerationLogId") REFERENCES "AIGenerationLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIGenerationLog" ADD CONSTRAINT "AIGenerationLog_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIGenerationLog" ADD CONSTRAINT "AIGenerationLog_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "LmsLesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonSummary" ADD CONSTRAINT "LessonSummary_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "LmsLesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonSummary" ADD CONSTRAINT "LessonSummary_generatedByTeacherId_fkey" FOREIGN KEY ("generatedByTeacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonSummary" ADD CONSTRAINT "LessonSummary_approvedByTeacherId_fkey" FOREIGN KEY ("approvedByTeacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonSummary" ADD CONSTRAINT "LessonSummary_aiGenerationLogId_fkey" FOREIGN KEY ("aiGenerationLogId") REFERENCES "AIGenerationLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

