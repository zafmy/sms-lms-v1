import prisma from "@/lib/prisma";
import { getTodayDayEnum } from "@/lib/utils";
import { Day } from "@prisma/client";

const TodaySchedule = async ({ teacherId }: { teacherId: string }) => {
  const todayDay = getTodayDayEnum();

  if (!todayDay) {
    return (
      <div className="bg-white rounded-md p-4">
        <h1 className="text-xl font-semibold">Today&apos;s Schedule</h1>
        <p className="text-sm text-gray-400 mt-4">No lessons on weekends.</p>
      </div>
    );
  }

  const lessons = await prisma.lesson.findMany({
    where: {
      teacherId,
      day: todayDay as Day,
    },
    include: {
      subject: { select: { name: true } },
      class: { select: { name: true } },
    },
    orderBy: { startTime: "asc" },
  });

  return (
    <div className="bg-white rounded-md p-4">
      <h1 className="text-xl font-semibold">Today&apos;s Schedule</h1>
      {lessons.length === 0 ? (
        <p className="text-sm text-gray-400 mt-4">
          No lessons scheduled for today.
        </p>
      ) : (
        <div className="flex flex-col gap-4 mt-4">
          {lessons.map((lesson) => (
            <div key={lesson.id} className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                {lesson.startTime.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })}
                {" - "}
                {lesson.endTime.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })}
              </span>
              <span className="font-bold">{lesson.subject.name}</span>
              <span className="text-sm text-gray-500">
                {lesson.class.name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TodaySchedule;
