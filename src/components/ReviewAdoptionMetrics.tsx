"use client";

interface ReviewAdoptionMetricsProps {
  metrics: {
    adoptionRate: number;
    avgMastery: number;
    totalSessions: number;
    totalStudents: number;
    activeStudents: number;
  };
}

const rateColor = (rate: number) =>
  rate >= 90
    ? "text-green-600"
    : rate >= 75
      ? "text-yellow-600"
      : "text-red-600";

const ReviewAdoptionMetrics = ({ metrics }: ReviewAdoptionMetricsProps) => {
  return (
    <div className="bg-white p-4 rounded-md">
      <h3 className="text-lg font-semibold">Review System Adoption</h3>
      <div className="flex gap-4 mt-3">
        {/* Adoption Rate */}
        <div className="flex-1 flex flex-col items-center">
          <span className={`text-2xl font-bold ${rateColor(metrics.adoptionRate)}`}>
            {metrics.adoptionRate}%
          </span>
          <span className="text-xs text-gray-400">Adoption Rate</span>
        </div>
        {/* Avg Mastery */}
        <div className="flex-1 flex flex-col items-center">
          <span className={`text-2xl font-bold ${rateColor(metrics.avgMastery)}`}>
            {metrics.avgMastery}%
          </span>
          <span className="text-xs text-gray-400">Avg Mastery</span>
        </div>
        {/* Total Sessions */}
        <div className="flex-1 flex flex-col items-center">
          <span className="text-2xl font-bold">{metrics.totalSessions}</span>
          <span className="text-xs text-gray-400">Total Sessions</span>
        </div>
        {/* Active / Total Students */}
        <div className="flex-1 flex flex-col items-center">
          <span className="text-2xl font-bold">
            {metrics.activeStudents}/{metrics.totalStudents}
          </span>
          <span className="text-xs text-gray-400">Active Students</span>
        </div>
      </div>
    </div>
  );
};

export default ReviewAdoptionMetrics;
