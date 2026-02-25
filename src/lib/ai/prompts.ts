// Prompt templates for AI generation tasks.
// Pure functions -- no side effects, no external dependencies.
// @MX:NOTE: [AUTO] Prompt engineering for question and summary generation (SPEC-AI-001 Phase 2)
// @MX:SPEC: SPEC-AI-001

import type {
  PromptTemplate,
  QuestionGenerationRequest,
  SummaryGenerationRequest,
} from "./types";

// Maximum character length for lesson content before truncation
const MAX_CONTENT_LENGTH = 8000;

// Truncate content to prevent exceeding token limits
function truncateContent(content: string): string {
  if (content.length <= MAX_CONTENT_LENGTH) {
    return content;
  }
  return content.slice(0, MAX_CONTENT_LENGTH) + "\n...[Content truncated for AI processing]";
}

// Build prompt for quiz question generation
export function buildQuestionPrompt(
  request: QuestionGenerationRequest
): PromptTemplate {
  const questionTypeDescriptions = request.questionTypes
    .map((type) => {
      if (type === "MULTIPLE_CHOICE") {
        return "MULTIPLE_CHOICE: 4 options, exactly 1 correct";
      }
      return "TRUE_FALSE: 2 options (True/False), exactly 1 correct";
    })
    .join("\n- ");

  const system = [
    "You are an expert quiz question generator for educational content.",
    "Generate questions in valid JSON format.",
    "Each question must be pedagogically sound and test understanding of the content.",
    "Provide clear, concise explanations for each answer.",
  ].join(" ");

  const content = truncateContent(request.lessonContent);

  const user = [
    `Generate ${request.questionCount} quiz question(s) based on the following lesson content.`,
    "",
    `Lesson Title: ${request.lessonTitle}`,
    request.subjectName ? `Subject: ${request.subjectName}` : "",
    "",
    "Lesson Content:",
    content,
    "",
    "Question Types to Generate:",
    `- ${questionTypeDescriptions}`,
    "",
    "Output Format (strict JSON):",
    "{",
    '  "questions": [',
    "    {",
    '      "text": "Question text here",',
    '      "type": "MULTIPLE_CHOICE" or "TRUE_FALSE",',
    '      "explanation": "Why the correct answer is correct",',
    '      "points": 1,',
    '      "options": [',
    '        { "text": "Option text", "isCorrect": true, "order": 0 },',
    '        { "text": "Option text", "isCorrect": false, "order": 1 },',
    '        { "text": "Option text", "isCorrect": false, "order": 2 },',
    '        { "text": "Option text", "isCorrect": false, "order": 3 }',
    "      ]",
    "    }",
    "  ]",
    "}",
    "",
    "Rules:",
    "- For MULTIPLE_CHOICE: exactly 4 options, exactly 1 correct",
    "- For TRUE_FALSE: exactly 2 options (True and False), exactly 1 correct",
    "- Each question must have points = 1",
    "- Options must have sequential order starting from 0",
    "- Respond with ONLY the JSON object, no additional text",
  ]
    .filter(Boolean)
    .join("\n");

  return { system, user };
}

// Build prompt for lesson summary generation
export function buildSummaryPrompt(
  request: SummaryGenerationRequest
): PromptTemplate {
  const lengthInstructions: Record<
    SummaryGenerationRequest["summaryLength"],
    string
  > = {
    brief: "2-3 sentences providing a concise overview",
    standard: "1-2 paragraphs covering the main concepts",
    detailed:
      "3-4 paragraphs providing comprehensive coverage of all key topics",
  };

  const system = [
    "You are an expert lesson summarizer for educational content.",
    "Generate summaries in valid JSON format.",
    "Summaries should be clear, accurate, and highlight the most important concepts.",
  ].join(" ");

  const content = truncateContent(request.lessonContent);

  const user = [
    "Generate a summary of the following lesson content.",
    "",
    `Lesson Title: ${request.lessonTitle}`,
    request.subjectName ? `Subject: ${request.subjectName}` : "",
    "",
    "Lesson Content:",
    content,
    "",
    `Summary Length: ${request.summaryLength} (${lengthInstructions[request.summaryLength]})`,
    "",
    "Output Format (strict JSON):",
    "{",
    '  "summary": "The full summary text here",',
    '  "keyPoints": [',
    '    "Key point 1",',
    '    "Key point 2",',
    '    "Key point 3"',
    "  ]",
    "}",
    "",
    "Rules:",
    "- summary: A coherent summary matching the requested length",
    "- keyPoints: 3-7 key takeaways from the lesson",
    "- Respond with ONLY the JSON object, no additional text",
  ]
    .filter(Boolean)
    .join("\n");

  return { system, user };
}
