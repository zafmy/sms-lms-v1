"use client";

import { useState } from "react";

type RankedStudent = {
  rank: number;
  studentId: string;
  name: string;
  totalXp: number;
  currentLevel: number;
};

const ClassLeaderboard = ({
  allTimeRanking,
  weeklyRanking,
}: {
  allTimeRanking: RankedStudent[];
  weeklyRanking: RankedStudent[];
}) => {
  const [tab, setTab] = useState<"allTime" | "weekly">("allTime");
  const [showAll, setShowAll] = useState(false);

  const ranking = tab === "allTime" ? allTimeRanking : weeklyRanking;
  const displayedRanking = showAll ? ranking : ranking.slice(0, 10);

  const getBorderColor = (rank: number): string => {
    if (rank === 1) return "border-l-4 border-l-[#FFD700]";
    if (rank === 2) return "border-l-4 border-l-[#C0C0C0]";
    if (rank === 3) return "border-l-4 border-l-[#CD7F32]";
    return "";
  };

  return (
    <div className="bg-white p-4 rounded-md">
      <h3 className="text-lg font-semibold">Class Leaderboard</h3>
      {/* Tab toggle */}
      <div className="flex gap-2 mt-3">
        <button
          className={`px-3 py-1 rounded-md text-sm ${
            tab === "allTime"
              ? "bg-lamaPurple text-white"
              : "bg-gray-100 text-gray-600"
          }`}
          onClick={() => {
            setTab("allTime");
            setShowAll(false);
          }}
        >
          All Time
        </button>
        <button
          className={`px-3 py-1 rounded-md text-sm ${
            tab === "weekly"
              ? "bg-lamaPurple text-white"
              : "bg-gray-100 text-gray-600"
          }`}
          onClick={() => {
            setTab("weekly");
            setShowAll(false);
          }}
        >
          This Week
        </button>
      </div>
      {/* Leaderboard list */}
      <div className="mt-3">
        {displayedRanking.length === 0 ? (
          <p className="text-gray-400 text-sm">No student data available</p>
        ) : (
          <>
            <div className="flex text-xs text-gray-400 font-medium mb-1 px-2">
              <span className="w-8">#</span>
              <span className="flex-1">Student</span>
              <span className="w-12 text-center">Lv</span>
              <span className="w-16 text-right">XP</span>
            </div>
            {displayedRanking.map((student) => (
              <div
                key={student.studentId}
                className={`flex items-center px-2 py-1.5 rounded text-sm ${getBorderColor(student.rank)}`}
              >
                <span className="w-8 font-bold text-gray-600">
                  {student.rank}
                </span>
                <span className="flex-1 truncate">{student.name}</span>
                <span className="w-12 text-center text-blue-500 font-medium">
                  {student.currentLevel}
                </span>
                <span className="w-16 text-right font-semibold">
                  {student.totalXp.toLocaleString()}
                </span>
              </div>
            ))}
            {!showAll && ranking.length > 10 && (
              <button
                className="text-sm text-blue-500 mt-2 hover:underline"
                onClick={() => setShowAll(true)}
              >
                View All ({ranking.length})
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ClassLeaderboard;
