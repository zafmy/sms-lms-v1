import prisma from "@/lib/prisma";
import Link from "next/link";

const MyStudentsOverview = async ({ teacherId }: { teacherId: string }) => {
  const classes = await prisma.class.findMany({
    where: {
      lessons: { some: { teacherId } },
    },
    select: {
      id: true,
      name: true,
      _count: { select: { students: true } },
    },
    orderBy: { name: "asc" },
  });

  const totalStudents = classes.reduce(
    (sum, cls) => sum + cls._count.students,
    0
  );

  return (
    <div className="bg-white rounded-md p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">My Students</h1>
        <span className="text-sm text-gray-500">{totalStudents} total</span>
      </div>
      {classes.length === 0 ? (
        <p className="text-sm text-gray-400 mt-4">No classes assigned.</p>
      ) : (
        <div className="flex flex-col gap-3 mt-4">
          {classes.map((cls) => (
            <Link
              key={cls.id}
              href={`/list/students?classId=${cls.id}`}
              className="flex items-center justify-between p-3 rounded-md bg-lamaPurpleLight hover:bg-lamaPurple hover:text-white transition-colors"
            >
              <span className="font-medium">{cls.name}</span>
              <span className="text-sm">{cls._count.students} students</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyStudentsOverview;
