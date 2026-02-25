import { describe, it, expect } from "vitest";
import {
  parseQuestionGenerationResponse,
  parseSummaryGenerationResponse,
} from "../validation";

describe("parseQuestionGenerationResponse", () => {
  const validMultipleChoiceQuestion = {
    text: "What is the capital of France?",
    type: "MULTIPLE_CHOICE",
    explanation: "Paris is the capital city of France.",
    points: 1,
    options: [
      { text: "Paris", isCorrect: true, order: 0 },
      { text: "London", isCorrect: false, order: 1 },
      { text: "Berlin", isCorrect: false, order: 2 },
      { text: "Madrid", isCorrect: false, order: 3 },
    ],
  };

  const validTrueFalseQuestion = {
    text: "The Earth is flat.",
    type: "TRUE_FALSE",
    explanation: "The Earth is approximately spherical.",
    points: 1,
    options: [
      { text: "True", isCorrect: false, order: 0 },
      { text: "False", isCorrect: true, order: 1 },
    ],
  };

  it("parses valid multiple choice question response", () => {
    const json = JSON.stringify({ questions: [validMultipleChoiceQuestion] });
    const result = parseQuestionGenerationResponse(json);

    expect(result).not.toBeNull();
    expect(result?.questions).toHaveLength(1);
    expect(result?.questions[0].type).toBe("MULTIPLE_CHOICE");
    expect(result?.questions[0].options).toHaveLength(4);
  });

  it("parses valid true/false question response", () => {
    const json = JSON.stringify({ questions: [validTrueFalseQuestion] });
    const result = parseQuestionGenerationResponse(json);

    expect(result).not.toBeNull();
    expect(result?.questions).toHaveLength(1);
    expect(result?.questions[0].type).toBe("TRUE_FALSE");
    expect(result?.questions[0].options).toHaveLength(2);
  });

  it("parses response with multiple questions", () => {
    const json = JSON.stringify({
      questions: [validMultipleChoiceQuestion, validTrueFalseQuestion],
    });
    const result = parseQuestionGenerationResponse(json);

    expect(result).not.toBeNull();
    expect(result?.questions).toHaveLength(2);
  });

  it("returns null for invalid JSON string", () => {
    expect(parseQuestionGenerationResponse("not json")).toBeNull();
  });

  it("returns null for empty JSON string", () => {
    expect(parseQuestionGenerationResponse("")).toBeNull();
  });

  it("returns null when questions array is empty", () => {
    const json = JSON.stringify({ questions: [] });
    expect(parseQuestionGenerationResponse(json)).toBeNull();
  });

  it("returns null when questions field is missing", () => {
    const json = JSON.stringify({ data: [] });
    expect(parseQuestionGenerationResponse(json)).toBeNull();
  });

  it("returns null when question text is empty", () => {
    const invalidQuestion = { ...validMultipleChoiceQuestion, text: "" };
    const json = JSON.stringify({ questions: [invalidQuestion] });
    expect(parseQuestionGenerationResponse(json)).toBeNull();
  });

  it("returns null when question type is invalid", () => {
    const invalidQuestion = {
      ...validMultipleChoiceQuestion,
      type: "ESSAY",
    };
    const json = JSON.stringify({ questions: [invalidQuestion] });
    expect(parseQuestionGenerationResponse(json)).toBeNull();
  });

  it("returns null when explanation is missing", () => {
    const { explanation: _, ...noExplanation } = validMultipleChoiceQuestion;
    const json = JSON.stringify({ questions: [noExplanation] });
    expect(parseQuestionGenerationResponse(json)).toBeNull();
  });

  it("returns null when options have fewer than 2 entries", () => {
    const invalidQuestion = {
      ...validMultipleChoiceQuestion,
      options: [{ text: "Only one", isCorrect: true, order: 0 }],
    };
    const json = JSON.stringify({ questions: [invalidQuestion] });
    expect(parseQuestionGenerationResponse(json)).toBeNull();
  });

  it("returns null when option text is empty", () => {
    const invalidQuestion = {
      ...validMultipleChoiceQuestion,
      options: [
        { text: "", isCorrect: true, order: 0 },
        { text: "Option 2", isCorrect: false, order: 1 },
        { text: "Option 3", isCorrect: false, order: 2 },
        { text: "Option 4", isCorrect: false, order: 3 },
      ],
    };
    const json = JSON.stringify({ questions: [invalidQuestion] });
    expect(parseQuestionGenerationResponse(json)).toBeNull();
  });

  it("returns null when points is zero or negative", () => {
    const invalidQuestion = { ...validMultipleChoiceQuestion, points: 0 };
    const json = JSON.stringify({ questions: [invalidQuestion] });
    expect(parseQuestionGenerationResponse(json)).toBeNull();
  });
});

describe("parseSummaryGenerationResponse", () => {
  const validSummary = {
    summary: "This lesson covers the fundamentals of photosynthesis.",
    keyPoints: [
      "Plants convert light energy to chemical energy",
      "Chlorophyll is essential for photosynthesis",
      "Oxygen is a byproduct of photosynthesis",
    ],
  };

  it("parses valid summary response", () => {
    const json = JSON.stringify(validSummary);
    const result = parseSummaryGenerationResponse(json);

    expect(result).not.toBeNull();
    expect(result?.summary).toBe(validSummary.summary);
    expect(result?.keyPoints).toHaveLength(3);
  });

  it("parses summary with single key point", () => {
    const json = JSON.stringify({
      summary: "Brief summary.",
      keyPoints: ["Single key point"],
    });
    const result = parseSummaryGenerationResponse(json);

    expect(result).not.toBeNull();
    expect(result?.keyPoints).toHaveLength(1);
  });

  it("returns null for invalid JSON string", () => {
    expect(parseSummaryGenerationResponse("not json")).toBeNull();
  });

  it("returns null for empty JSON string", () => {
    expect(parseSummaryGenerationResponse("")).toBeNull();
  });

  it("returns null when summary is empty", () => {
    const json = JSON.stringify({ summary: "", keyPoints: ["Point"] });
    expect(parseSummaryGenerationResponse(json)).toBeNull();
  });

  it("returns null when summary field is missing", () => {
    const json = JSON.stringify({ keyPoints: ["Point"] });
    expect(parseSummaryGenerationResponse(json)).toBeNull();
  });

  it("returns null when keyPoints is empty", () => {
    const json = JSON.stringify({ summary: "Summary text.", keyPoints: [] });
    expect(parseSummaryGenerationResponse(json)).toBeNull();
  });

  it("returns null when keyPoints field is missing", () => {
    const json = JSON.stringify({ summary: "Summary text." });
    expect(parseSummaryGenerationResponse(json)).toBeNull();
  });

  it("returns null when keyPoints contains empty strings", () => {
    const json = JSON.stringify({ summary: "Summary.", keyPoints: [""] });
    expect(parseSummaryGenerationResponse(json)).toBeNull();
  });
});
