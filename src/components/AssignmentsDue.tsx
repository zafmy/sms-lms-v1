import prisma from "@/lib/prisma";
import { getLocale, getTranslations } from "next-intl/server";
import { getIntlLocale } from "@/lib/formatUtils";

const AssignmentsDue = async ({ classId }: { classId: number }) => {
  const t = await getTranslations("dashboard.student");
  const locale = await getLocale();

  const now = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(now.getDate() + 7);

  const assignments = await prisma.assignment.findMany({
    where: {
      lesson: { classId },
      dueDate: { gte: now, lte: nextWeek },
    },
    include: {
      lesson: {
        select: {
          subject: { select: { name: true } },
        },
      },
    },
    orderBy: { dueDate: "asc" },
  });

  return (
    <div className="bg-white rounded-md p-4">
      <h1 className="text-xl font-semibold">{t("assignmentsDue")}</h1>
      {assignments.length === 0 ? (
        <p className="text-gray-400 mt-4">
          {t("noAssignmentsNextWeek")}
        </p>
      ) : (
        <div className="flex flex-col gap-4 mt-4">
          {assignments.map((assignment) => (
            <div key={assignment.id}>
              <p className="font-medium">
                {assignment.lesson.subject.name}
              </p>
              <p className="text-sm text-gray-500">{assignment.title}</p>
              <p className="text-sm text-gray-500">
                {t("due")}:{" "}
                {new Intl.DateTimeFormat(getIntlLocale(locale), {
                  dateStyle: "medium",
                }).format(assignment.dueDate)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssignmentsDue;
