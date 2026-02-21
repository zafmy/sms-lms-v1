"use client";

import {
  computeLevelProgress,
  LEVEL_THRESHOLDS,
} from "@/lib/gamificationUtils";

const LevelProgressBar = ({
  totalXp,
  currentLevel,
}: {
  totalXp: number;
  currentLevel: number;
}) => {
  const progress = computeLevelProgress(totalXp);
  const maxXp = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];

  // Overall percentage across all levels
  const overallPercentage = Math.min(
    (totalXp / maxXp) * 100,
    100
  );

  return (
    <div className="bg-white p-4 rounded-md">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">Level Progress</h2>
        <div className="text-right">
          <span className="text-2xl font-bold text-purple-600">
            Level {currentLevel}
          </span>
          <p className="text-xs text-gray-500">{totalXp} total XP</p>
        </div>
      </div>

      {/* Full progress bar with level markers */}
      <div className="relative mt-4 mb-6">
        {/* Background bar */}
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-purple-500 h-4 rounded-full transition-all"
            style={{ width: `${overallPercentage}%` }}
          />
        </div>

        {/* Level markers */}
        <div className="relative w-full mt-1">
          {LEVEL_THRESHOLDS.map((threshold, index) => {
            const position = (threshold / maxXp) * 100;
            const levelNum = index + 1;
            const isReached = currentLevel >= levelNum;

            return (
              <div
                key={index}
                className="absolute -translate-x-1/2"
                style={{ left: `${position}%` }}
              >
                <div
                  className={`w-3 h-3 rounded-full border-2 mx-auto ${
                    isReached
                      ? "bg-purple-500 border-purple-600"
                      : "bg-white border-gray-300"
                  }`}
                />
                <span
                  className={`text-xs block text-center mt-0.5 ${
                    isReached ? "text-purple-600 font-medium" : "text-gray-400"
                  }`}
                >
                  {levelNum}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current level progress details */}
      {progress.nextLevelXp > 0 && (
        <p className="text-xs text-gray-500 text-center">
          {progress.currentXp} / {progress.nextLevelXp} XP to Level{" "}
          {currentLevel + 1}
        </p>
      )}
      {progress.nextLevelXp === 0 && (
        <p className="text-xs text-green-600 text-center font-medium">
          Maximum level reached!
        </p>
      )}
    </div>
  );
};

export default LevelProgressBar;
