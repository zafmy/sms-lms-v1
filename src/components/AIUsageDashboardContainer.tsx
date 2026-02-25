// Server component wrapper for the AI usage dashboard.
// Fetches usage data and passes it to the client component.
// @MX:NOTE: [AUTO] Server-side data fetching for AI usage analytics
// @MX:SPEC: SPEC-AI-001

import { getAIUsageStats } from "@/lib/aiActions";
import AIUsageDashboard from "./AIUsageDashboard";

const AIUsageDashboardContainer = async () => {
  const stats = await getAIUsageStats();

  return (
    <AIUsageDashboard
      teachers={[...stats.teachers]}
      monthlyTrends={[...stats.monthlyTrends]}
      quota={stats.quota}
    />
  );
};

export default AIUsageDashboardContainer;
