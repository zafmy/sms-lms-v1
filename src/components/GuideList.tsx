import GuideCard from "./GuideCard";
import FormContainer from "./FormContainer";
import { GuideCategory, GuideTranslation } from "@prisma/client";
import { getTranslations } from "next-intl/server";

type GuideWithRelations = {
  id: string;
  slug: string;
  isPublished: boolean;
  authorId: string;
  roleAccess: string[];
  order: number;
  tourSteps: any;
  categoryId: string;
  category: GuideCategory;
  translations: GuideTranslation[];
};

const GuideList = async ({
  guides,
  role,
  userId,
  locale,
}: {
  guides: GuideWithRelations[];
  role: string;
  userId: string;
  locale: string;
}) => {
  const t = await getTranslations("guides");

  if (guides.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
        {t("noGuides")}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
      {guides.map((guide) => {
        // Admin can edit/delete all guides; teacher can only edit/delete own
        const canManage =
          role === "admin" ||
          (role === "teacher" && guide.authorId === userId);

        return (
          <GuideCard
            key={guide.id}
            guide={guide}
            role={role}
            userId={userId}
            locale={locale}
            actions={
              canManage ? (
                <>
                  <FormContainer
                    table="guide"
                    type="update"
                    data={guide}
                  />
                  <FormContainer
                    table="guide"
                    type="delete"
                    id={guide.id}
                  />
                </>
              ) : undefined
            }
          />
        );
      })}
    </div>
  );
};

export default GuideList;
