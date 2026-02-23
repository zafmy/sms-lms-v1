import prisma from "@/lib/prisma";
import { getTranslations } from "next-intl/server";

const RecentGrades = async ({ studentId }: { studentId: string }) => {
  const t = await getTranslations("dashboard.student");

  const results = await prisma.result.findMany({
    where: { studentId },
    take: 5,
    orderBy: { id: "desc" },
    include: {
      exam: { select: { title: true } },
      assignment: { select: { title: true } },
    },
  });

  return (
    <div className="bg-white rounded-md p-4">
      <h1 className="text-xl font-semibold">{t("recentGrades")}</h1>
      {results.length === 0 ? (
        <p className="text-gray-400 mt-4">{t("noGradesYet")}</p>
      ) : (
        <div className="flex flex-col gap-4 mt-4">
          {results.map((result) => {
            const title =
              result.exam?.title ||
              result.assignment?.title ||
              t("unknown");
            const isExam = result.examId !== null;

            return (
              <div
                key={result.id}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{title}</span>
                  {isExam ? (
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                      {t("exam")}
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                      {t("assignment")}
                    </span>
                  )}
                </div>
                <span className="text-lg font-bold">{result.score}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecentGrades;
