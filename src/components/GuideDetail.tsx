"use client";

import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTranslations } from "next-intl";
import { GuideCategory, GuideTranslation } from "@prisma/client";
import GuideTour from "@/components/GuideTour";

type GuideDetailProps = {
  guide: {
    id: string;
    slug: string;
    isPublished: boolean;
    tourSteps: unknown;
    category: GuideCategory;
    translations: GuideTranslation[];
  };
  locale: string;
};

const GuideDetail = ({ guide, locale }: GuideDetailProps) => {
  const t = useTranslations("guides");

  // Get translation for current locale, fallback to en
  const translation =
    guide.translations.find((tr) => tr.locale === locale) ||
    guide.translations.find((tr) => tr.locale === "en") ||
    guide.translations[0];

  const categoryName =
    locale === "ms" ? guide.category.nameMs : guide.category.nameEn;

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/list/guides" className="hover:text-lamaPurple">
          {t("breadcrumbGuides")}
        </Link>
        <span>/</span>
        <span>{categoryName}</span>
        <span>/</span>
        <span className="text-gray-700">{translation.title}</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{translation.title}</h1>
        <div className="flex items-center gap-2">
          {Array.isArray(guide.tourSteps) && guide.tourSteps.length > 0 && (
            <GuideTour tourSteps={guide.tourSteps} guideId={guide.id} />
          )}
          {!guide.isPublished && (
            <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">
              {t("draft")}
            </span>
          )}
        </div>
      </div>

      {/* Markdown Content */}
      <div className="[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-3 [&_h3]:text-lg [&_h3]:font-medium [&_h3]:mt-4 [&_h3]:mb-2 [&_p]:mb-3 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-3 [&_li]:mb-1 [&_strong]:font-semibold [&_a]:text-lamaPurple [&_a]:underline [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:rounded [&_pre]:bg-gray-100 [&_pre]:p-4 [&_pre]:rounded-md [&_pre]:overflow-x-auto [&_pre]:mb-3 [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:mb-3 [&_table]:w-full [&_table]:border-collapse [&_table]:mb-3 [&_th]:border [&_th]:border-gray-300 [&_th]:px-3 [&_th]:py-2 [&_th]:bg-gray-50 [&_th]:text-left [&_td]:border [&_td]:border-gray-300 [&_td]:px-3 [&_td]:py-2 [&_hr]:my-6 [&_hr]:border-gray-200">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {translation.content}
        </ReactMarkdown>
      </div>

      {/* Back link */}
      <div className="mt-8 pt-4 border-t">
        <Link
          href="/list/guides"
          className="text-sm text-lamaPurple hover:underline"
        >
          &larr; {t("backToGuides")}
        </Link>
      </div>
    </div>
  );
};

export default GuideDetail;
