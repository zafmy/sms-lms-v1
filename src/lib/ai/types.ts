// Shared types and interfaces for the AI service layer.
// Pure type definitions -- no runtime dependencies.
// @MX:NOTE: [AUTO] Provider-agnostic AI abstraction types (SPEC-AI-001 Phase 2)
// @MX:SPEC: SPEC-AI-001

// Core provider interface -- all AI adapters must implement this contract
export interface AIProvider {
  generateCompletion(
    prompt: string,
    config: GenerationConfig
  ): Promise<AIResponse>;
}

export interface GenerationConfig {
  readonly maxTokens: number;
  readonly temperature: number;
  readonly responseFormat: "json";
}

export interface AIResponse {
  readonly content: string;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly model: string;
  readonly provider: string;
}

// Result types for question generation
export interface QuestionGenerationResult {
  readonly questions: ReadonlyArray<{
    readonly text: string;
    readonly type: "MULTIPLE_CHOICE" | "TRUE_FALSE";
    readonly explanation: string;
    readonly points: number;
    readonly options: ReadonlyArray<{
      readonly text: string;
      readonly isCorrect: boolean;
      readonly order: number;
    }>;
  }>;
}

// Result type for summary generation
export interface SummaryGenerationResult {
  readonly summary: string;
  readonly keyPoints: readonly string[];
}

// Prompt template type
export interface PromptTemplate {
  readonly system: string;
  readonly user: string;
}

// AI generation request (from Server Actions)
export interface AIGenerationRequest {
  readonly lessonContent: string;
  readonly lessonTitle: string;
  readonly subjectName?: string;
}

export interface QuestionGenerationRequest extends AIGenerationRequest {
  readonly questionCount: number;
  readonly questionTypes: ReadonlyArray<"MULTIPLE_CHOICE" | "TRUE_FALSE">;
}

export interface SummaryGenerationRequest extends AIGenerationRequest {
  readonly summaryLength: "brief" | "standard" | "detailed";
}

// AI service result wrapper with token metadata
export interface AIServiceResult<T> {
  readonly result: T | null;
  readonly rawResponse: string;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly model: string;
  readonly provider: string;
}

// Quota check result
export interface QuotaCheckResult {
  readonly available: boolean;
  readonly remaining: number;
  readonly used: number;
}
