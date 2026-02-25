import { describe, it, expect } from "vitest";
import { gradeQuizAttempt } from "../quizUtils";

// Characterization tests capturing current behavior of gradeQuizAttempt.
// These tests document what the function actually does so that refactoring
// does not unintentionally change behavior.

const makeQuestion = (
  id: number,
  type: string,
  points: number,
  options: Array<{ id: number; text: string; isCorrect: boolean }>
) => ({ id, type, points, options });

const mcQuestion = (id: number, correctOptionId: number, points = 1) =>
  makeQuestion(id, "MULTIPLE_CHOICE", points, [
    { id: correctOptionId, text: "Correct", isCorrect: true },
    { id: correctOptionId + 100, text: "Wrong A", isCorrect: false },
    { id: correctOptionId + 200, text: "Wrong B", isCorrect: false },
  ]);

const tfQuestion = (id: number, correctOptionId: number, points = 1) =>
  makeQuestion(id, "TRUE_FALSE", points, [
    { id: correctOptionId, text: "True", isCorrect: true },
    { id: correctOptionId + 100, text: "False", isCorrect: false },
  ]);

const fibQuestion = (id: number, correctText: string, points = 1) =>
  makeQuestion(id, "FILL_IN_BLANK", points, [
    { id: id * 1000, text: correctText, isCorrect: true },
  ]);

describe("gradeQuizAttempt - characterization", () => {
  it("test_characterize_grading_order_independence", () => {
    // Grading must match by questionId, not by position.
    // This is critical for randomization safety.
    const questions = [mcQuestion(1, 10, 2), mcQuestion(2, 20, 3), mcQuestion(3, 30, 5)];

    // Responses in a different order than questions
    const responsesReversed = [
      { questionId: 3, selectedOptionId: 30 },
      { questionId: 1, selectedOptionId: 10 },
      { questionId: 2, selectedOptionId: 20 },
    ];

    const responsesInOrder = [
      { questionId: 1, selectedOptionId: 10 },
      { questionId: 2, selectedOptionId: 20 },
      { questionId: 3, selectedOptionId: 30 },
    ];

    const resultReversed = gradeQuizAttempt(questions, responsesReversed, 70);
    const resultInOrder = gradeQuizAttempt(questions, responsesInOrder, 70);

    // Both orderings must produce identical scores
    expect(resultReversed.score).toBe(resultInOrder.score);
    expect(resultReversed.maxScore).toBe(resultInOrder.maxScore);
    expect(resultReversed.percentage).toBe(resultInOrder.percentage);
    expect(resultReversed.passed).toBe(resultInOrder.passed);
    expect(resultReversed.score).toBe(10);
    expect(resultReversed.maxScore).toBe(10);
    expect(resultReversed.percentage).toBe(100);
    expect(resultReversed.passed).toBe(true);
  });

  it("test_characterize_grading_all_correct", () => {
    const questions = [mcQuestion(1, 10, 2), tfQuestion(2, 20, 3)];
    const responses = [
      { questionId: 1, selectedOptionId: 10 },
      { questionId: 2, selectedOptionId: 20 },
    ];
    const result = gradeQuizAttempt(questions, responses, 70);

    expect(result.score).toBe(5);
    expect(result.maxScore).toBe(5);
    expect(result.percentage).toBe(100);
    expect(result.passed).toBe(true);
    expect(result.questionResults).toHaveLength(2);
    expect(result.questionResults[0]).toEqual({
      questionId: 1,
      isCorrect: true,
      pointsEarned: 2,
    });
    expect(result.questionResults[1]).toEqual({
      questionId: 2,
      isCorrect: true,
      pointsEarned: 3,
    });
  });

  it("test_characterize_grading_all_wrong", () => {
    const questions = [mcQuestion(1, 10, 2), mcQuestion(2, 20, 3)];
    const responses = [
      { questionId: 1, selectedOptionId: 110 }, // wrong
      { questionId: 2, selectedOptionId: 120 }, // wrong
    ];
    const result = gradeQuizAttempt(questions, responses, 70);

    expect(result.score).toBe(0);
    expect(result.maxScore).toBe(5);
    expect(result.percentage).toBe(0);
    expect(result.passed).toBe(false);
  });

  it("test_characterize_grading_missing_response", () => {
    const questions = [mcQuestion(1, 10, 2), mcQuestion(2, 20, 3)];
    // Only respond to question 1
    const responses = [{ questionId: 1, selectedOptionId: 10 }];
    const result = gradeQuizAttempt(questions, responses, 70);

    expect(result.score).toBe(2);
    expect(result.maxScore).toBe(5);
    expect(result.percentage).toBe(40);
    expect(result.passed).toBe(false);
    // Missing response should produce isCorrect: false, pointsEarned: 0
    expect(result.questionResults[1]).toEqual({
      questionId: 2,
      isCorrect: false,
      pointsEarned: 0,
    });
  });

  it("test_characterize_grading_fill_in_blank_case_insensitive", () => {
    const questions = [fibQuestion(1, "Paris", 5)];
    const responses = [{ questionId: 1, textResponse: "paris" }];
    const result = gradeQuizAttempt(questions, responses, 70);

    expect(result.score).toBe(5);
    expect(result.percentage).toBe(100);
    expect(result.passed).toBe(true);
  });

  it("test_characterize_grading_fill_in_blank_whitespace_trimmed", () => {
    const questions = [fibQuestion(1, "Paris", 5)];
    const responses = [{ questionId: 1, textResponse: "  Paris  " }];
    const result = gradeQuizAttempt(questions, responses, 70);

    expect(result.score).toBe(5);
  });

  it("test_characterize_grading_pass_score_boundary", () => {
    const questions = [mcQuestion(1, 10, 7), mcQuestion(2, 20, 3)];
    // Only get question 1 correct: 7/10 = 70%
    const responses = [
      { questionId: 1, selectedOptionId: 10 },
      { questionId: 2, selectedOptionId: 120 },
    ];
    const result = gradeQuizAttempt(questions, responses, 70);

    expect(result.percentage).toBe(70);
    expect(result.passed).toBe(true); // 70 >= 70
  });

  it("test_characterize_grading_percentage_rounding", () => {
    // 1/3 = 33.333...% -- characterize rounding behavior
    const questions = [mcQuestion(1, 10, 1), mcQuestion(2, 20, 1), mcQuestion(3, 30, 1)];
    const responses = [
      { questionId: 1, selectedOptionId: 10 },
      { questionId: 2, selectedOptionId: 120 },
      { questionId: 3, selectedOptionId: 130 },
    ];
    const result = gradeQuizAttempt(questions, responses, 70);

    // Math.round((1/3) * 100 * 10) / 10 = Math.round(333.33) / 10 = 333 / 10 = 33.3
    expect(result.percentage).toBe(33.3);
  });

  it("test_characterize_grading_empty_questions", () => {
    const result = gradeQuizAttempt([], [], 70);

    expect(result.score).toBe(0);
    expect(result.maxScore).toBe(0);
    expect(result.percentage).toBe(0);
    expect(result.passed).toBe(false);
    expect(result.questionResults).toEqual([]);
  });

  it("test_characterize_grading_subset_of_questions", () => {
    // When grading only a subset of questions (pool selection scenario),
    // maxScore should be the sum of only the passed-in questions.
    const allQuestions = [
      mcQuestion(1, 10, 2),
      mcQuestion(2, 20, 3),
      mcQuestion(3, 30, 5),
    ];
    // Only grade questions 1 and 3 (simulating pool selection)
    const poolQuestions = [allQuestions[0], allQuestions[2]];
    const responses = [
      { questionId: 1, selectedOptionId: 10 },
      { questionId: 3, selectedOptionId: 30 },
    ];
    const result = gradeQuizAttempt(poolQuestions, responses, 70);

    expect(result.score).toBe(7);
    expect(result.maxScore).toBe(7); // Only pool questions: 2 + 5
    expect(result.percentage).toBe(100);
  });
});
