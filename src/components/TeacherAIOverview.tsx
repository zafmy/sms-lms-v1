// Teacher AI overview widget showing quota usage and pending review counts.
// @MX:NOTE: [AUTO] Client component for AI quota display and quick stats
// @MX:SPEC: SPEC-AI-001

"use client";

interface TeacherAIOverviewProps {
  readonly quota: number;
  readonly used: number;
  readonly pendingQuestions: number;
  readonly pendingSummaries: number;
  readonly recentGenerations: number;
}

const TeacherAIOverview = ({
  quota,
  used,
  pendingQuestions,
  pendingSummaries,
  recentGenerations,
}: TeacherAIOverviewProps) => {
  const totalPending = pendingQuestions + pendingSummaries;
  const usagePercent = quota > 0 ? Math.min((used / quota) * 100, 100) : 0;
  const isApproaching = quota > 0 && used / quota >= 0.8;

  return (
    <div className="bg-white rounded-md p-4">
      <h1 className="text-xl font-semibold">AI Overview</h1>

      {/* Quota Usage */}
      <div className="mt-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-500">Monthly Quota</span>
          <span className={isApproaching ? "text-red-600 font-medium" : "text-gray-700"}>
            {used} / {quota} requests used
          </span>
        </div>
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isApproaching ? "bg-red-400" : "bg-lamaPurple"
            }`}
            style={{ width: `${usagePercent}%` }}
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        <div className="text-center p-2 bg-gray-50 rounded-md">
          <p className="text-lg font-bold text-lamaPurple">{totalPending}</p>
          <p className="text-xs text-gray-500">Pending Reviews</p>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded-md">
          <p className="text-lg font-bold text-lamaPurple">{pendingQuestions}</p>
          <p className="text-xs text-gray-500">Draft Questions</p>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded-md">
          <p className="text-lg font-bold text-lamaPurple">{pendingSummaries}</p>
          <p className="text-xs text-gray-500">Draft Summaries</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
        <span>{recentGenerations} generations this month</span>
        {totalPending > 0 && (
          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
            {totalPending} to review
          </span>
        )}
      </div>
    </div>
  );
};

export default TeacherAIOverview;
