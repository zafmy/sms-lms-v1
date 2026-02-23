"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { getIntlLocale } from "@/lib/formatUtils";

interface Transaction {
  id: number;
  amount: number;
  source: string;
  sourceId: string | null;
  createdAt: Date;
}

const PAGE_SIZE = 10;

const XpTransactionHistory = ({
  transactions,
}: {
  transactions: Transaction[];
}) => {
  const t = useTranslations("gamification.xp");
  const locale = useLocale();
  const [page, setPage] = useState(0);

  const SOURCE_LABELS: Record<string, string> = {
    LESSON: t("sourceLessonComplete"),
    QUIZ: t("sourceQuizAttempt"),
    STREAK: t("sourceDailyStreak"),
    BADGE: t("sourceBadgeReward"),
    MANUAL: t("sourceManualAward"),
  };
  const totalPages = Math.max(1, Math.ceil(transactions.length / PAGE_SIZE));
  const paged = transactions.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE
  );

  if (transactions.length === 0) {
    return (
      <div className="bg-white p-4 rounded-md">
        <h2 className="text-lg font-semibold mb-2">{t("history")}</h2>
        <p className="text-gray-400 text-sm">{t("noTransactions")}</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-md">
      <h2 className="text-lg font-semibold mb-3">{t("history")}</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-2 text-gray-500 font-medium">{t("date")}</th>
            <th className="text-left py-2 text-gray-500 font-medium">
              {t("source")}
            </th>
            <th className="text-right py-2 text-gray-500 font-medium">
              {t("amount")}
            </th>
          </tr>
        </thead>
        <tbody>
          {paged.map((tx) => (
            <tr key={tx.id} className="border-b border-gray-50">
              <td className="py-2 text-gray-600">
                {new Date(tx.createdAt).toLocaleDateString(getIntlLocale(locale))}
              </td>
              <td className="py-2 text-gray-600">
                {SOURCE_LABELS[tx.source] ?? tx.source}
              </td>
              <td className="py-2 text-right font-medium text-green-600">
                +{tx.amount}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="text-xs px-3 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t("previous")}
          </button>
          <span className="text-xs text-gray-500">
            {t("pageOf", { page: page + 1, total: totalPages })}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="text-xs px-3 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t("next")}
          </button>
        </div>
      )}
    </div>
  );
};

export default XpTransactionHistory;
