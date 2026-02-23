import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import GuideList from "@/components/GuideList";
import GuideCategoryFilter from "@/components/GuideCategoryFilter";
import FormContainer from "@/components/FormContainer";
import { getGuides } from "@/lib/guideActions";
import { auth } from "@clerk/nextjs/server";
import { getTranslations, getLocale } from "next-intl/server";
import prisma from "@/lib/prisma";

const GuideListPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) => {
  const resolvedParams = await searchParams;
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const currentUserId = userId!;
  const locale = await getLocale();
  const t = await getTranslations("guides");

  const page = resolvedParams.page ? parseInt(resolvedParams.page) : 1;
  const search = resolvedParams.search || undefined;
  const categoryId = resolvedParams.categoryId || undefined;

  const { data: guides, count } = await getGuides({
    role: role!,
    userId: currentUserId,
    search,
    categoryId,
    page,
  });

  // Get all categories for filter dropdown
  const categories = await prisma.guideCategory.findMany({
    orderBy: { order: "asc" },
  });

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">
          {t("pageTitle")}
        </h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <GuideCategoryFilter
              categories={categories.map((c) => ({
                id: c.id,
                name: locale === "ms" ? c.nameMs : c.nameEn,
              }))}
              currentCategoryId={categoryId}
            />
            {(role === "admin" || role === "teacher") && (
              <FormContainer table="guide" type="create" />
            )}
          </div>
        </div>
      </div>
      {/* GUIDE GRID */}
      <GuideList
        guides={guides}
        role={role!}
        userId={currentUserId}
        locale={locale}
      />
      {/* PAGINATION */}
      <Pagination page={page} count={count} />
    </div>
  );
};

export default GuideListPage;
