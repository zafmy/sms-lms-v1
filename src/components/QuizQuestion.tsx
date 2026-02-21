"use client";

type QuizQuestionProps = {
  question: {
    id: number;
    text: string;
    type: string;
    points: number;
    options: Array<{ id: number; text: string; order: number }>;
  };
  questionNumber: number;
  totalQuestions: number;
  currentAnswer?: { selectedOptionId?: number; textResponse?: string };
  onChange: (answer: { selectedOptionId?: number; textResponse?: string }) => void;
};

const QuizQuestion = ({
  question,
  questionNumber,
  totalQuestions,
  currentAnswer,
  onChange,
}: QuizQuestionProps) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">
          Question {questionNumber} of {totalQuestions}
        </span>
        <span className="text-sm text-gray-500">
          {question.points} {question.points === 1 ? "point" : "points"}
        </span>
      </div>

      <h2 className="text-lg font-medium">{question.text}</h2>

      {(question.type === "MULTIPLE_CHOICE" || question.type === "TRUE_FALSE") && (
        <div className="flex flex-col gap-2">
          {question.options
            .sort((a, b) => a.order - b.order)
            .map((option) => (
              <label
                key={option.id}
                className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                  currentAnswer?.selectedOptionId === option.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  checked={currentAnswer?.selectedOptionId === option.id}
                  onChange={() => onChange({ selectedOptionId: option.id })}
                  className="w-4 h-4"
                />
                <span>{option.text}</span>
              </label>
            ))}
        </div>
      )}

      {question.type === "FILL_IN_BLANK" && (
        <div>
          <input
            type="text"
            className="ring-[1.5px] ring-gray-300 p-3 rounded-md text-sm w-full"
            placeholder="Type your answer..."
            value={currentAnswer?.textResponse || ""}
            onChange={(e) => onChange({ textResponse: e.target.value })}
          />
        </div>
      )}
    </div>
  );
};

export default QuizQuestion;
