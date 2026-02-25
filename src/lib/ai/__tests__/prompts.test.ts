import { describe, it, expect } from "vitest";
import { buildQuestionPrompt, buildSummaryPrompt } from "../prompts";

describe("buildQuestionPrompt", () => {
  const baseRequest = {
    lessonContent: "Photosynthesis is the process by which plants convert light energy.",
    lessonTitle: "Introduction to Photosynthesis",
    questionCount: 2,
    questionTypes: ["MULTIPLE_CHOICE" as const],
  };

  it("returns a PromptTemplate with system and user fields", () => {
    const result = buildQuestionPrompt(baseRequest);

    expect(result).toHaveProperty("system");
    expect(result).toHaveProperty("user");
    expect(typeof result.system).toBe("string");
    expect(typeof result.user).toBe("string");
    expect(result.system.length).toBeGreaterThan(0);
    expect(result.user.length).toBeGreaterThan(0);
  });

  it("includes lesson title and content in user prompt", () => {
    const result = buildQuestionPrompt(baseRequest);

    expect(result.user).toContain(baseRequest.lessonTitle);
    expect(result.user).toContain(baseRequest.lessonContent);
  });

  it("includes question count in user prompt", () => {
    const result = buildQuestionPrompt(baseRequest);

    expect(result.user).toContain("2 quiz question(s)");
  });

  it("filters out empty subjectName (no blank lines from empty string)", () => {
    const requestWithoutSubject = { ...baseRequest, subjectName: "" };
    const result = buildQuestionPrompt(requestWithoutSubject);

    // Empty string is filtered out by .filter(Boolean), so "Subject:" should not appear
    expect(result.user).not.toContain("Subject:");
  });

  it("includes subjectName when provided", () => {
    const requestWithSubject = { ...baseRequest, subjectName: "Biology" };
    const result = buildQuestionPrompt(requestWithSubject);

    expect(result.user).toContain("Subject: Biology");
  });

  it("handles MULTIPLE_CHOICE question type description", () => {
    const result = buildQuestionPrompt(baseRequest);

    expect(result.user).toContain("MULTIPLE_CHOICE: 4 options, exactly 1 correct");
  });

  it("handles TRUE_FALSE question type description", () => {
    const request = {
      ...baseRequest,
      questionTypes: ["TRUE_FALSE" as const],
    };
    const result = buildQuestionPrompt(request);

    expect(result.user).toContain("TRUE_FALSE: 2 options (True/False), exactly 1 correct");
  });

  it("handles multiple question types in request", () => {
    const request = {
      ...baseRequest,
      questionTypes: ["MULTIPLE_CHOICE" as const, "TRUE_FALSE" as const],
    };
    const result = buildQuestionPrompt(request);

    expect(result.user).toContain("MULTIPLE_CHOICE: 4 options, exactly 1 correct");
    expect(result.user).toContain("TRUE_FALSE: 2 options (True/False), exactly 1 correct");
  });

  it("includes JSON output format instructions", () => {
    const result = buildQuestionPrompt(baseRequest);

    expect(result.user).toContain("Output Format (strict JSON)");
    expect(result.user).toContain('"questions"');
  });

  it("truncates content exceeding MAX_CONTENT_LENGTH", () => {
    const longContent = "A".repeat(9000);
    const request = { ...baseRequest, lessonContent: longContent };
    const result = buildQuestionPrompt(request);

    expect(result.user).toContain("...[Content truncated for AI processing]");
    expect(result.user).not.toContain("A".repeat(9000));
  });

  it("does not truncate content within MAX_CONTENT_LENGTH", () => {
    const shortContent = "A".repeat(7000);
    const request = { ...baseRequest, lessonContent: shortContent };
    const result = buildQuestionPrompt(request);

    expect(result.user).not.toContain("...[Content truncated for AI processing]");
    expect(result.user).toContain(shortContent);
  });
});

describe("buildSummaryPrompt", () => {
  const baseRequest = {
    lessonContent: "Photosynthesis is the process by which plants convert light energy.",
    lessonTitle: "Introduction to Photosynthesis",
    summaryLength: "standard" as const,
  };

  it("returns a PromptTemplate with system and user fields", () => {
    const result = buildSummaryPrompt(baseRequest);

    expect(result).toHaveProperty("system");
    expect(result).toHaveProperty("user");
    expect(typeof result.system).toBe("string");
    expect(typeof result.user).toBe("string");
    expect(result.system.length).toBeGreaterThan(0);
    expect(result.user.length).toBeGreaterThan(0);
  });

  it("includes lesson title and content in user prompt", () => {
    const result = buildSummaryPrompt(baseRequest);

    expect(result.user).toContain(baseRequest.lessonTitle);
    expect(result.user).toContain(baseRequest.lessonContent);
  });

  it("handles brief summary length", () => {
    const request = { ...baseRequest, summaryLength: "brief" as const };
    const result = buildSummaryPrompt(request);

    expect(result.user).toContain("brief");
    expect(result.user).toContain("2-3 sentences");
  });

  it("handles standard summary length", () => {
    const result = buildSummaryPrompt(baseRequest);

    expect(result.user).toContain("standard");
    expect(result.user).toContain("1-2 paragraphs");
  });

  it("handles detailed summary length", () => {
    const request = { ...baseRequest, summaryLength: "detailed" as const };
    const result = buildSummaryPrompt(request);

    expect(result.user).toContain("detailed");
    expect(result.user).toContain("3-4 paragraphs");
  });

  it("filters out empty subjectName", () => {
    const requestWithoutSubject = { ...baseRequest, subjectName: "" };
    const result = buildSummaryPrompt(requestWithoutSubject);

    expect(result.user).not.toContain("Subject:");
  });

  it("includes subjectName when provided", () => {
    const requestWithSubject = { ...baseRequest, subjectName: "Biology" };
    const result = buildSummaryPrompt(requestWithSubject);

    expect(result.user).toContain("Subject: Biology");
  });

  it("includes JSON output format instructions", () => {
    const result = buildSummaryPrompt(baseRequest);

    expect(result.user).toContain("Output Format (strict JSON)");
    expect(result.user).toContain('"summary"');
    expect(result.user).toContain('"keyPoints"');
  });

  it("truncates content exceeding MAX_CONTENT_LENGTH", () => {
    const longContent = "B".repeat(9000);
    const request = { ...baseRequest, lessonContent: longContent };
    const result = buildSummaryPrompt(request);

    expect(result.user).toContain("...[Content truncated for AI processing]");
    expect(result.user).not.toContain("B".repeat(9000));
  });

  it("does not truncate content within MAX_CONTENT_LENGTH", () => {
    const shortContent = "B".repeat(7000);
    const request = { ...baseRequest, lessonContent: shortContent };
    const result = buildSummaryPrompt(request);

    expect(result.user).not.toContain("...[Content truncated for AI processing]");
    expect(result.user).toContain(shortContent);
  });
});
