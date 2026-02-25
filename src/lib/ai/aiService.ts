// Main AI service orchestrator.
// Coordinates adapters, prompts, and validation for AI generation tasks.
// @MX:ANCHOR: [AUTO] Central AI service entry point -- coordinates all generation flows
// @MX:REASON: High fan_in; called by server actions for question and summary generation
// @MX:SPEC: SPEC-AI-001

import { getAIProvider } from "./adapters";
import { buildQuestionPrompt, buildSummaryPrompt } from "./prompts";
import {
  parseQuestionGenerationResponse,
  parseSummaryGenerationResponse,
} from "./validation";
import type {
  QuestionGenerationRequest,
  SummaryGenerationRequest,
  QuestionGenerationResult,
  SummaryGenerationResult,
  GenerationConfig,
  AIServiceResult,
} from "./types";

const DEFAULT_CONFIG: GenerationConfig = {
  maxTokens: 4000,
  temperature: 0.7,
  responseFormat: "json",
};

// Merge partial config with defaults, producing a complete GenerationConfig
function mergeConfig(
  override?: Partial<GenerationConfig>
): GenerationConfig {
  if (!override) {
    return DEFAULT_CONFIG;
  }
  return {
    maxTokens: override.maxTokens ?? DEFAULT_CONFIG.maxTokens,
    temperature: override.temperature ?? DEFAULT_CONFIG.temperature,
    responseFormat: override.responseFormat ?? DEFAULT_CONFIG.responseFormat,
  };
}

// Generate quiz questions from lesson content.
// Returns structured result with token metadata for logging.
export async function generateQuestions(
  request: QuestionGenerationRequest,
  config?: Partial<GenerationConfig>
): Promise<AIServiceResult<QuestionGenerationResult>> {
  const provider = getAIProvider();
  const prompt = buildQuestionPrompt(request);
  const fullConfig = mergeConfig(config);

  const fullPrompt = `${prompt.system}\n\n${prompt.user}`;
  const aiResponse = await provider.generateCompletion(fullPrompt, fullConfig);

  const result = parseQuestionGenerationResponse(aiResponse.content);

  return {
    result,
    rawResponse: aiResponse.content,
    inputTokens: aiResponse.inputTokens,
    outputTokens: aiResponse.outputTokens,
    model: aiResponse.model,
    provider: aiResponse.provider,
  };
}

// Generate lesson summary from lesson content.
// Returns structured result with token metadata for logging.
export async function generateSummary(
  request: SummaryGenerationRequest,
  config?: Partial<GenerationConfig>
): Promise<AIServiceResult<SummaryGenerationResult>> {
  const provider = getAIProvider();
  const prompt = buildSummaryPrompt(request);
  const fullConfig = mergeConfig(config);

  const fullPrompt = `${prompt.system}\n\n${prompt.user}`;
  const aiResponse = await provider.generateCompletion(fullPrompt, fullConfig);

  const result = parseSummaryGenerationResponse(aiResponse.content);

  return {
    result,
    rawResponse: aiResponse.content,
    inputTokens: aiResponse.inputTokens,
    outputTokens: aiResponse.outputTokens,
    model: aiResponse.model,
    provider: aiResponse.provider,
  };
}
