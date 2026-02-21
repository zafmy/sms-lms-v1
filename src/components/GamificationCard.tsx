"use client";

import { computeLevelProgress } from "@/lib/gamificationUtils";
import Link from "next/link";

interface GamificationData {
  totalXp: number;
  currentLevel: number;
  currentStreak: number;
  longestStreak: number;
}

const GamificationCard = ({ data }: { data: GamificationData }) => {
  const progress = computeLevelProgress(data.totalXp);

  const progressBarColor =
    progress.percentage >= 75
      ? "bg-green-500"
      : progress.percentage >= 50
        ? "bg-yellow-500"
        : "bg-blue-500";

  return (
    <div className="bg-white p-4 rounded-md">
      <div className="flex items-center gap-3 mb-3">
        {/* Level circle */}
        <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
          <span className="text-purple-700 font-bold text-lg">
            {data.currentLevel}
          </span>
        </div>
        <div>
          <h2 className="text-md font-semibold">Level {data.currentLevel}</h2>
          <p className="text-xs text-gray-500">{data.totalXp} XP</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Progress</span>
          <span>{progress.percentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`${progressBarColor} h-2 rounded-full transition-all`}
            style={{ width: `${Math.min(progress.percentage, 100)}%` }}
          />
        </div>
        {progress.nextLevelXp > 0 && (
          <p className="text-xs text-gray-400 mt-1">
            {progress.currentXp} / {progress.nextLevelXp} XP to next level
          </p>
        )}
      </div>

      {/* Streak info */}
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-1">
          <span className="text-orange-500 text-lg">&#128293;</span>
          <span className="text-sm font-medium">
            {data.currentStreak} day{data.currentStreak !== 1 ? "s" : ""}
          </span>
        </div>
        <span className="text-xs text-gray-400">
          Longest: {data.longestStreak} day
          {data.longestStreak !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Link to achievements */}
      <Link
        href="/list/achievements"
        className="text-xs text-blue-600 hover:underline"
      >
        View all achievements
      </Link>
    </div>
  );
};

export default GamificationCard;
