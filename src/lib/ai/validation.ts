// AI response validation using Zod schemas.
// Validates raw JSON strings from AI providers into typed results.
// Returns null on validation failure (caller handles logging).
// @MX:NOTE: [AUTO] Zod-based AI response validation layer (SPEC-AI-001 Phase 2)
// @MX:SPEC: SPEC-AI-001

import { z } from "zod";
import type {
  QuestionGenerationResult,
  SummaryGenerationResult,
} from "./types";

// Schema for a single question option
const questionOptionSchema = z.object({
  text: z.string().min(1),
  isCorrect: z.boolean(),
  order: z.number().int().min(0),
});

// Schema for a single generated question
const generatedQuestionSchema = z.object({
  text: z.string().min(1),
  type: z.enum(["MULTIPLE_CHOICE", "TRUE_FALSE"]),
  explanation: z.string().min(1),
  points: z.number().int().min(1),
  options: z.array(questionOptionSchema).min(2),
});

// Schema for the complete question generation result
export const questionGenerationResultSchema = z.object({
  questions: z.array(generatedQuestionSchema).min(1),
});

// Schema for the complete summary generation result
export const summaryGenerationResultSchema = z.object({
  summary: z.string().min(1),
  keyPoints: z.array(z.string().min(1)).min(1),
});

// Parse and validate question generation response.
// Returns null if the raw JSON is malformed or fails schema validation.
export function parseQuestionGenerationResponse(
  rawJson: string
): QuestionGenerationResult | null {
  try {
    const parsed: unknown = JSON.parse(rawJson);
    const validated = questionGenerationResultSchema.safeParse(parsed);
    if (!validated.success) {
      return null;
    }
    return validated.data;
  } catch {
    return null;
  }
}

// Parse and validate summary generation response.
// Returns null if the raw JSON is malformed or fails schema validation.
export function parseSummaryGenerationResponse(
  rawJson: string
): SummaryGenerationResult | null {
  try {
    const parsed: unknown = JSON.parse(rawJson);
    const validated = summaryGenerationResultSchema.safeParse(parsed);
    if (!validated.success) {
      return null;
    }
    return validated.data;
  } catch {
    return null;
  }
}
