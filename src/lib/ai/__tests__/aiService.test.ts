import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AIProvider, AIResponse } from "../types";

// Mock the adapters module before importing the service
const mockProvider: AIProvider = {
  generateCompletion: vi.fn(),
};

vi.mock("../adapters", () => ({
  getAIProvider: () => mockProvider,
}));

// Import after mock setup
const { generateQuestions, generateSummary } = await import("../aiService");

const validQuestionResponse: AIResponse = {
  content: JSON.stringify({
    questions: [
      {
        text: "What is photosynthesis?",
        type: "MULTIPLE_CHOICE",
        explanation: "Photosynthesis converts light to energy.",
        points: 1,
        options: [
          { text: "Light to energy conversion", isCorrect: true, order: 0 },
          { text: "Energy to light conversion", isCorrect: false, order: 1 },
          { text: "Water to ice conversion", isCorrect: false, order: 2 },
          { text: "None of the above", isCorrect: false, order: 3 },
        ],
      },
    ],
  }),
  inputTokens: 100,
  outputTokens: 200,
  model: "gpt-4o-mini",
  provider: "openai",
};

const validSummaryResponse: AIResponse = {
  content: JSON.stringify({
    summary: "This lesson covers photosynthesis fundamentals.",
    keyPoints: [
      "Plants convert light energy",
      "Chlorophyll is essential",
      "Oxygen is produced",
    ],
  }),
  inputTokens: 80,
  outputTokens: 150,
  model: "gpt-4o-mini",
  provider: "openai",
};

describe("generateQuestions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const questionRequest = {
    lessonContent: "Photosynthesis is the process by which plants convert light.",
    lessonTitle: "Photosynthesis",
    questionCount: 1,
    questionTypes: ["MULTIPLE_CHOICE" as const],
  };

  it("calls provider and returns structured result", async () => {
    vi.mocked(mockProvider.generateCompletion).mockResolvedValue(validQuestionResponse);

    const result = await generateQuestions(questionRequest);

    expect(mockProvider.generateCompletion).toHaveBeenCalledOnce();
    expect(result.result).not.toBeNull();
    expect(result.result?.questions).toHaveLength(1);
    expect(result.result?.questions[0].text).toBe("What is photosynthesis?");
    expect(result.rawResponse).toBe(validQuestionResponse.content);
    expect(result.inputTokens).toBe(100);
    expect(result.outputTokens).toBe(200);
    expect(result.model).toBe("gpt-4o-mini");
    expect(result.provider).toBe("openai");
  });

  it("returns result: null when validation fails (invalid AI response)", async () => {
    const invalidResponse: AIResponse = {
      ...validQuestionResponse,
      content: "not valid json at all",
    };
    vi.mocked(mockProvider.generateCompletion).mockResolvedValue(invalidResponse);

    const result = await generateQuestions(questionRequest);

    expect(result.result).toBeNull();
    expect(result.rawResponse).toBe("not valid json at all");
    expect(result.inputTokens).toBe(100);
  });

  it("passes default config when no override provided", async () => {
    vi.mocked(mockProvider.generateCompletion).mockResolvedValue(validQuestionResponse);

    await generateQuestions(questionRequest);

    const callArgs = vi.mocked(mockProvider.generateCompletion).mock.calls[0];
    const configArg = callArgs[1];
    expect(configArg).toEqual({
      maxTokens: 4000,
      temperature: 0.7,
      responseFormat: "json",
    });
  });

  it("merges partial config with defaults", async () => {
    vi.mocked(mockProvider.generateCompletion).mockResolvedValue(validQuestionResponse);

    await generateQuestions(questionRequest, { temperature: 0.3 });

    const callArgs = vi.mocked(mockProvider.generateCompletion).mock.calls[0];
    const configArg = callArgs[1];
    expect(configArg).toEqual({
      maxTokens: 4000,
      temperature: 0.3,
      responseFormat: "json",
    });
  });

  it("uses all override values when full config provided", async () => {
    vi.mocked(mockProvider.generateCompletion).mockResolvedValue(validQuestionResponse);

    await generateQuestions(questionRequest, {
      maxTokens: 2000,
      temperature: 0.5,
      responseFormat: "json",
    });

    const callArgs = vi.mocked(mockProvider.generateCompletion).mock.calls[0];
    const configArg = callArgs[1];
    expect(configArg).toEqual({
      maxTokens: 2000,
      temperature: 0.5,
      responseFormat: "json",
    });
  });
});

describe("generateSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const summaryRequest = {
    lessonContent: "Photosynthesis is the process by which plants convert light.",
    lessonTitle: "Photosynthesis",
    summaryLength: "standard" as const,
  };

  it("calls provider and returns structured result", async () => {
    vi.mocked(mockProvider.generateCompletion).mockResolvedValue(validSummaryResponse);

    const result = await generateSummary(summaryRequest);

    expect(mockProvider.generateCompletion).toHaveBeenCalledOnce();
    expect(result.result).not.toBeNull();
    expect(result.result?.summary).toBe(
      "This lesson covers photosynthesis fundamentals."
    );
    expect(result.result?.keyPoints).toHaveLength(3);
    expect(result.rawResponse).toBe(validSummaryResponse.content);
    expect(result.inputTokens).toBe(80);
    expect(result.outputTokens).toBe(150);
    expect(result.model).toBe("gpt-4o-mini");
    expect(result.provider).toBe("openai");
  });

  it("returns result: null when validation fails (invalid AI response)", async () => {
    const invalidResponse: AIResponse = {
      ...validSummaryResponse,
      content: '{"wrong_field": "data"}',
    };
    vi.mocked(mockProvider.generateCompletion).mockResolvedValue(invalidResponse);

    const result = await generateSummary(summaryRequest);

    expect(result.result).toBeNull();
    expect(result.rawResponse).toBe('{"wrong_field": "data"}');
  });

  it("passes default config when no override provided", async () => {
    vi.mocked(mockProvider.generateCompletion).mockResolvedValue(validSummaryResponse);

    await generateSummary(summaryRequest);

    const callArgs = vi.mocked(mockProvider.generateCompletion).mock.calls[0];
    const configArg = callArgs[1];
    expect(configArg).toEqual({
      maxTokens: 4000,
      temperature: 0.7,
      responseFormat: "json",
    });
  });

  it("merges partial config with defaults", async () => {
    vi.mocked(mockProvider.generateCompletion).mockResolvedValue(validSummaryResponse);

    await generateSummary(summaryRequest, { maxTokens: 1000 });

    const callArgs = vi.mocked(mockProvider.generateCompletion).mock.calls[0];
    const configArg = callArgs[1];
    expect(configArg).toEqual({
      maxTokens: 1000,
      temperature: 0.7,
      responseFormat: "json",
    });
  });
});
