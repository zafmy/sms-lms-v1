// Admin-only page for AI settings and usage dashboard.
// @MX:NOTE: [AUTO] AI Settings page combining settings form and usage analytics
// @MX:SPEC: SPEC-AI-001

import AISettingsForm from "@/components/AISettingsForm";
import AIUsageDashboardContainer from "@/components/AIUsageDashboardContainer";
import { getAISettings } from "@/lib/aiActions";
import { auth } from "@clerk/nextjs/server";

const AISettingsPage = async () => {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "admin") {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <h1 className="text-lg font-semibold">Access Denied</h1>
      </div>
    );
  }

  const settings = await getAISettings();

  return (
    <div className="flex-1 m-4 mt-0 space-y-6">
      {/* Settings Section */}
      <div className="bg-white p-6 rounded-md">
        <h1 className="text-lg font-semibold mb-4">AI Settings</h1>
        <AISettingsForm settings={settings} />
      </div>

      {/* Usage Dashboard Section */}
      <div className="bg-white p-6 rounded-md">
        <h2 className="text-lg font-semibold mb-4">AI Usage Dashboard</h2>
        <AIUsageDashboardContainer />
      </div>
    </div>
  );
};

export default AISettingsPage;
