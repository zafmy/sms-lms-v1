// Client component for displaying AI usage statistics.
// Shows per-teacher usage table and monthly trend summary.
// @MX:NOTE: [AUTO] Admin dashboard for AI usage monitoring with quota warnings
// @MX:SPEC: SPEC-AI-001

"use client";

type TeacherUsage = {
  readonly teacherId: string;
  readonly teacherName: string;
  readonly requestCount: number;
  readonly totalInputTokens: number;
  readonly totalOutputTokens: number;
  readonly estimatedCost: number;
};

type MonthlyTrend = {
  readonly month: string;
  readonly requests: number;
  readonly tokens: number;
  readonly cost: number;
};

type AIUsageDashboardProps = {
  readonly teachers: ReadonlyArray<TeacherUsage>;
  readonly monthlyTrends: ReadonlyArray<MonthlyTrend>;
  readonly quota: number;
};

// Return a CSS class for quota-based row highlighting.
function getQuotaRowClass(requestCount: number, quota: number): string {
  const ratio = requestCount / quota;
  if (ratio >= 1) {
    return "bg-red-50";
  }
  if (ratio >= 0.8) {
    return "bg-yellow-50";
  }
  return "";
}

// Format a number as a compact cost string with 4 decimal places.
function formatCost(cost: number): string {
  return `$${cost.toFixed(4)}`;
}

// Format large token numbers with locale-aware separators.
function formatTokens(tokens: number): string {
  return tokens.toLocaleString();
}

const AIUsageDashboard = ({
  teachers,
  monthlyTrends,
  quota,
}: AIUsageDashboardProps) => {
  return (
    <div className="space-y-8">
      {/* Per-Teacher Usage */}
      <div>
        <h3 className="text-md font-semibold mb-3">
          Teacher Usage (Current Month)
        </h3>
        {teachers.length === 0 ? (
          <p className="text-sm text-gray-500">
            No AI usage recorded this month.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="p-3 font-medium text-gray-600">Teacher</th>
                  <th className="p-3 font-medium text-gray-600">Requests</th>
                  <th className="p-3 font-medium text-gray-600 hidden md:table-cell">
                    Input Tokens
                  </th>
                  <th className="p-3 font-medium text-gray-600 hidden md:table-cell">
                    Output Tokens
                  </th>
                  <th className="p-3 font-medium text-gray-600">
                    Est. Cost
                  </th>
                  <th className="p-3 font-medium text-gray-600">
                    Quota Usage
                  </th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher) => {
                  const ratio = quota > 0 ? teacher.requestCount / quota : 0;
                  const percentage = Math.min(100, Math.round(ratio * 100));
                  return (
                    <tr
                      key={teacher.teacherId}
                      className={`border-b border-gray-200 ${getQuotaRowClass(teacher.requestCount, quota)}`}
                    >
                      <td className="p-3">{teacher.teacherName}</td>
                      <td className="p-3">{teacher.requestCount}</td>
                      <td className="p-3 hidden md:table-cell">
                        {formatTokens(teacher.totalInputTokens)}
                      </td>
                      <td className="p-3 hidden md:table-cell">
                        {formatTokens(teacher.totalOutputTokens)}
                      </td>
                      <td className="p-3">
                        {formatCost(teacher.estimatedCost)}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                ratio >= 1
                                  ? "bg-red-500"
                                  : ratio >= 0.8
                                    ? "bg-yellow-500"
                                    : "bg-green-500"
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">
                            {percentage}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Monthly Trends */}
      <div>
        <h3 className="text-md font-semibold mb-3">
          Monthly Trends (Last 6 Months)
        </h3>
        {monthlyTrends.length === 0 ? (
          <p className="text-sm text-gray-500">
            No AI usage data available yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="p-3 font-medium text-gray-600">Month</th>
                  <th className="p-3 font-medium text-gray-600">Requests</th>
                  <th className="p-3 font-medium text-gray-600">
                    Total Tokens
                  </th>
                  <th className="p-3 font-medium text-gray-600">
                    Est. Cost
                  </th>
                </tr>
              </thead>
              <tbody>
                {monthlyTrends.map((trend) => (
                  <tr
                    key={trend.month}
                    className="border-b border-gray-200 even:bg-slate-50"
                  >
                    <td className="p-3">{trend.month}</td>
                    <td className="p-3">{trend.requests}</td>
                    <td className="p-3">{formatTokens(trend.tokens)}</td>
                    <td className="p-3">{formatCost(trend.cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIUsageDashboard;
