import prisma from "@/lib/prisma";

const PendingGrading = async ({ teacherId }: { teacherId: string }) => {
  const exams = await prisma.exam.findMany({
    where: {
      lesson: { teacherId },
      endTime: { lt: new Date() },
    },
    include: {
      results: true,
      lesson: {
        include: {
          class: {
            include: {
              _count: { select: { students: true } },
            },
          },
        },
      },
    },
  });

  const assignments = await prisma.assignment.findMany({
    where: {
      lesson: { teacherId },
      dueDate: { lt: new Date() },
    },
    include: {
      results: true,
      lesson: {
        include: {
          class: {
            include: {
              _count: { select: { students: true } },
            },
          },
        },
      },
    },
  });

  const pendingExams = exams.filter(
    (exam) => exam.results.length < exam.lesson.class._count.students
  ).length;

  const pendingAssignments = assignments.filter(
    (assignment) =>
      assignment.results.length < assignment.lesson.class._count.students
  ).length;

  const nothingPending = pendingExams === 0 && pendingAssignments === 0;

  return (
    <div className="bg-white rounded-md p-4">
      <h1 className="text-xl font-semibold">Pending Grading</h1>
      {nothingPending ? (
        <p className="text-sm text-green-600 mt-4">All caught up!</p>
      ) : (
        <div className="flex flex-col gap-4 mt-4">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">{pendingExams}</span>
            <span className="text-sm text-gray-400">Exams pending</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">{pendingAssignments}</span>
            <span className="text-sm text-gray-400">Assignments pending</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingGrading;
