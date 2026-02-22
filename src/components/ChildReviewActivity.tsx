"use client";

const BOX_COLORS = [
  "bg-red-400",    // Box 1 - New / Reset
  "bg-orange-400", // Box 2
  "bg-yellow-400", // Box 3
  "bg-blue-400",   // Box 4
  "bg-green-400",  // Box 5 - Mastered
];

const BOX_LABELS = ["Box 1", "Box 2", "Box 3", "Box 4", "Box 5"];

interface ChildReviewActivityProps {
  studentName: string;
  completionRate: number;
  currentStreak: number;
  totalCards: number;
  subjects: Array<{ name: string; percentage: number }>;
  distribution: number[];
  isEmpty?: boolean;
}

const ChildReviewActivity = ({
  studentName,
  completionRate,
  currentStreak,
  totalCards,
  subjects,
  distribution,
  isEmpty,
}: ChildReviewActivityProps) => {
  if (isEmpty) {
    return (
      <div className="bg-white rounded-md p-4">
        <h2 className="text-lg font-semibold border-b pb-2">
          {studentName} - Review Activity
        </h2>
        <p className="text-gray-400 text-sm mt-3">
          No review cards yet.
        </p>
      </div>
    );
  }

  const completionColor =
    completionRate >= 75
      ? "text-green-600"
      : completionRate >= 50
        ? "text-yellow-600"
        : "text-red-600";

  const streakColor =
    currentStreak > 0 ? "text-orange-500" : "text-gray-400";

  const totalDistribution = distribution.reduce((sum, val) => sum + val, 0);

  return (
    <div className="bg-white rounded-md p-4">
      <h2 className="text-lg font-semibold border-b pb-2">
        {studentName} - Review Activity
      </h2>

      {/* Stats Row */}
      <div className="flex gap-4 mt-3">
        {/* Completion Rate */}
        <div className="flex-1 flex flex-col items-center">
          <span className={`text-2xl font-bold ${completionColor}`}>
            {completionRate}%
          </span>
          <span className="text-xs text-gray-400">Completion</span>
        </div>

        {/* Current Streak */}
        <div className="flex-1 flex flex-col items-center">
          <span className={`text-2xl font-bold ${streakColor}`}>
            {currentStreak > 0 ? `${currentStreak}` : "0"}
          </span>
          <span className="text-xs text-gray-400">Streak</span>
        </div>

        {/* Total Cards */}
        <div className="flex-1 flex flex-col items-center">
          <span className="text-2xl font-bold">{totalCards}</span>
          <span className="text-xs text-gray-400">Cards</span>
        </div>
      </div>

      {/* Subject Mastery */}
      {subjects.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            Subject Mastery
          </h3>
          <div className="space-y-2">
            {subjects.map((subject) => (
              <div key={subject.name} className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-24 truncate">
                  {subject.name}
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${subject.percentage}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-8 text-right">
                  {subject.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Box Distribution */}
      {totalDistribution > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            Box Distribution
          </h3>
          <div className="flex h-4 rounded-full overflow-hidden">
            {distribution.map((count, index) => {
              if (count === 0) return null;
              const widthPercent = (count / totalDistribution) * 100;
              return (
                <div
                  key={index}
                  className={`${BOX_COLORS[index]} transition-all`}
                  style={{ width: `${widthPercent}%` }}
                  title={`${BOX_LABELS[index]}: ${count} cards`}
                />
              );
            })}
          </div>
          <div className="flex justify-between mt-1">
            {distribution.map((count, index) => (
              <span key={index} className="text-[10px] text-gray-400">
                B{index + 1}: {count}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChildReviewActivity;
