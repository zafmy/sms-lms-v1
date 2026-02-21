import prisma from "@/lib/prisma";

const AssignmentsDue = async ({ classId }: { classId: number }) => {
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
      <h1 className="text-xl font-semibold">Assignments Due</h1>
      {assignments.length === 0 ? (
        <p className="text-gray-400 mt-4">
          No assignments due in the next 7 days
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
                Due:{" "}
                {new Intl.DateTimeFormat("en-US", {
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
