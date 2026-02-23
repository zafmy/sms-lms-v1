import Link from "next/link";
import { GuideCategory, GuideTranslation } from "@prisma/client";
import { getTranslations } from "next-intl/server";

type GuideWithRelations = {
  id: string;
  slug: string;
  isPublished: boolean;
  authorId: string;
  category: GuideCategory;
  translations: GuideTranslation[];
};

const GuideCard = async ({
  guide,
  role,
  userId,
  locale,
  actions,
}: {
  guide: GuideWithRelations;
  role: string;
  userId: string;
  locale: string;
  actions?: React.ReactNode;
}) => {
  const t = await getTranslations("guides");
  // Find translation for current locale, fallback to English
  const translation =
    guide.translations.find((tr) => tr.locale === locale) ||
    guide.translations.find((tr) => tr.locale === "en") ||
    guide.translations[0];

  const categoryName =
    locale === "ms" ? guide.category.nameMs : guide.category.nameEn;

  const title = translation?.title || "Untitled";
  const excerpt = translation?.excerpt || "";

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md hover:border-lamaPurple transition-all duration-200">
      <Link
        href={`/list/guides/${guide.id}`}
        className="block"
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-lamaSkyLight text-lamaSky font-medium">
            {categoryName}
          </span>
          {!guide.isPublished && (
            <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-700 font-medium">
              {t("draft")}
            </span>
          )}
        </div>
        <h3 className="text-sm font-semibold text-gray-800 mb-1 line-clamp-2">
          {title}
        </h3>
        <p className="text-xs text-gray-500 line-clamp-3">{excerpt}</p>
      </Link>
      {actions && (
        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-100">
          {actions}
        </div>
      )}
    </div>
  );
};

export default GuideCard;
