"use client";

import type { StudentReviewData, StruggledCardData } from "@/lib/reviewAnalyticsUtils";

interface ClassReviewAnalyticsProps {
  stats: {
    avgCompletion: number;
    avgMastery: number;
    totalSessions: number;
    activeStudents: number;
  };
  students: StudentReviewData[];
  struggledCards: StruggledCardData[];
}

const rateColor = (rate: number) =>
  rate >= 70
    ? "text-green-600"
    : rate >= 40
      ? "text-yellow-600"
      : "text-red-600";

const ClassReviewAnalytics = ({
  stats,
  students,
  struggledCards,
}: ClassReviewAnalyticsProps) => {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Review Analytics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-3 rounded-md text-center">
            <span className={`text-2xl font-bold ${rateColor(stats.avgCompletion)}`}>
              {stats.avgCompletion}%
            </span>
            <p className="text-xs text-gray-400 mt-1">Avg Correct Rate</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-md text-center">
            <span className={`text-2xl font-bold ${rateColor(stats.avgMastery)}`}>
              {stats.avgMastery}%
            </span>
            <p className="text-xs text-gray-400 mt-1">Avg Mastery</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-md text-center">
            <span className="text-2xl font-bold">{stats.totalSessions}</span>
            <p className="text-xs text-gray-400 mt-1">Total Sessions</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-md text-center">
            <span className="text-2xl font-bold">{stats.activeStudents}</span>
            <p className="text-xs text-gray-400 mt-1">Active Students</p>
          </div>
        </div>
      </div>

      {/* Struggled Cards Table */}
      {struggledCards.length > 0 && (
        <div>
          <h4 className="text-md font-medium mb-2">Most Struggled Cards</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-2 pr-4">Card Front</th>
                  <th className="py-2 pr-4 text-right">Hard Rate</th>
                  <th className="py-2 pr-4 text-right">Hard Count</th>
                  <th className="py-2 text-right">Total Reviews</th>
                </tr>
              </thead>
              <tbody>
                {struggledCards.map((card) => (
                  <tr key={card.cardId} className="border-b last:border-0">
                    <td className="py-2 pr-4 max-w-[200px] truncate">
                      {card.front}
                    </td>
                    <td className={`py-2 pr-4 text-right font-medium ${rateColor(100 - card.hardRate)}`}>
                      {card.hardRate}%
                    </td>
                    <td className="py-2 pr-4 text-right">{card.hardCount}</td>
                    <td className="py-2 text-right">{card.totalReviews}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Per-Student Table */}
      {students.length > 0 && (
        <div>
          <h4 className="text-md font-medium mb-2">Student Review Progress</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-2 pr-4">Student</th>
                  <th className="py-2 pr-4 text-right">Sessions</th>
                  <th className="py-2 pr-4 text-right">Mastery</th>
                  <th className="py-2 pr-4 text-right">Correct Rate</th>
                  <th className="py-2 text-right">Last Session</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const masteryPct =
                    student.totalCards > 0
                      ? Math.round(
                          (student.masteredCards / student.totalCards) * 100
                        )
                      : 0;
                  return (
                    <tr
                      key={student.studentId}
                      className="border-b last:border-0"
                    >
                      <td className="py-2 pr-4">{student.studentName}</td>
                      <td className="py-2 pr-4 text-right">
                        {student.sessionsCompleted}
                      </td>
                      <td
                        className={`py-2 pr-4 text-right font-medium ${rateColor(masteryPct)}`}
                      >
                        {masteryPct}%
                      </td>
                      <td
                        className={`py-2 pr-4 text-right font-medium ${rateColor(student.averageCorrectRate)}`}
                      >
                        {Math.round(student.averageCorrectRate)}%
                      </td>
                      <td className="py-2 text-right text-gray-500">
                        {student.lastSessionDate
                          ? new Date(student.lastSessionDate).toLocaleDateString()
                          : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassReviewAnalytics;
