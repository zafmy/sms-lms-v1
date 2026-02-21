import prisma from "@/lib/prisma";

const UpcomingExams = async ({ classId }: { classId: number }) => {
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
      <h1 className="text-xl font-semibold">Upcoming Exams</h1>
      {exams.length === 0 ? (
        <p className="text-gray-400 mt-4">No exams in the next 7 days</p>
      ) : (
        <div className="flex flex-col gap-4 mt-4">
          {exams.map((exam) => (
            <div key={exam.id}>
              <p className="font-medium">{exam.lesson.subject.name}</p>
              <p className="text-sm text-gray-500">{exam.title}</p>
              <p className="text-sm text-gray-500">
                {new Intl.DateTimeFormat("en-US", {
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
