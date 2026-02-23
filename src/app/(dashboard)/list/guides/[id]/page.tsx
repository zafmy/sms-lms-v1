import { auth } from "@clerk/nextjs/server";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { getGuideById } from "@/lib/guideActions";
import GuideDetail from "@/components/GuideDetail";

const GuideDetailPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const locale = await getLocale();
  const t = await getTranslations("guides");

  const guide = await getGuideById(id, role!, userId!);
  if (!guide) notFound();

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <GuideDetail guide={guide} locale={locale} />
    </div>
  );
};

export default GuideDetailPage;
