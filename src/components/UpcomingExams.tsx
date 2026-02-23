import prisma from "@/lib/prisma";
import { getLocale, getTranslations } from "next-intl/server";
import { getIntlLocale } from "@/lib/formatUtils";

const UpcomingExams = async ({ classId }: { classId: number }) => {
  const t = await getTranslations("dashboard.student");
  const locale = await getLocale();

  const now = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(now.getDate() + 7);

  const exams = await prisma.exam.findMany({
    where: {
      lesson: { classId },
      startTime: { gte: now, lte: nextWeek },
    },
    include: {
      lesson: {
        select: {
          subject: { select: { name: true } },
        },
      },
    },
    orderBy: { startTime: "asc" },
  });

  return (
    <div className="bg-white rounded-md p-4">
      <h1 className="text-xl font-semibold">{t("upcomingExams")}</h1>
      {exams.length === 0 ? (
        <p className="text-gray-400 mt-4">{t("noExamsNextWeek")}</p>
      ) : (
        <div className="flex flex-col gap-4 mt-4">
          {exams.map((exam) => (
            <div key={exam.id}>
              <p className="font-medium">{exam.lesson.subject.name}</p>
              <p className="text-sm text-gray-500">{exam.title}</p>
              <p className="text-sm text-gray-500">
                {new Intl.DateTimeFormat(getIntlLocale(locale), {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(exam.startTime)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UpcomingExams;
