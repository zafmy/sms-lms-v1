import Announcements from "@/components/Announcements";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import ChildGamificationStats from "@/components/ChildGamificationStats";
import ChildGradeOverview from "@/components/ChildGradeOverview";
import ChildLearningActivity from "@/components/ChildLearningActivity";
import ChildLmsProgressCard from "@/components/ChildLmsProgressCard";
import ChildQuickStats from "@/components/ChildQuickStats";
import RecentActivity from "@/components/RecentActivity";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

const ParentPage = async () => {
  const { userId } = await auth();
  const currentUserId = userId;

  const students = await prisma.student.findMany({
    where: {
      parentId: currentUserId!,
    },
  });

  return (
    <div className="flex-1 p-4 flex gap-4 flex-col xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3">
        {students.length === 0 ? (
          <div className="bg-white p-4 rounded-md">
            <p className="text-gray-400">No children found</p>
          </div>
        ) : (
          students.map((student) => (
            <div key={student.id} className="mb-4">
              <ChildQuickStats
                studentId={student.id}
                studentName={student.name + " " + student.surname}
              />
              <div className="mt-4">
                <ChildGradeOverview
                  studentId={student.id}
                  studentName={student.name + " " + student.surname}
                />
              </div>
              <div className="mt-4">
                <ChildLmsProgressCard
                  studentId={student.id}
                  studentName={student.name + " " + student.surname}
                />
              </div>
              <div className="mt-4">
                <ChildGamificationStats
                  studentId={student.id}
                  studentName={student.name + " " + student.surname}
                />
              </div>
              <div className="mt-4">
                <ChildLearningActivity
                  studentId={student.id}
                  studentName={student.name + " " + student.surname}
                />
              </div>
              <div className="mt-4 bg-white p-4 rounded-md">
                <h1 className="text-xl font-semibold">
                  Schedule ({student.name + " " + student.surname})
                </h1>
                <BigCalendarContainer type="classId" id={student.classId} />
              </div>
            </div>
          ))
        )}
      </div>
      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-8">
        <RecentActivity studentIds={students.map((s) => s.id)} />
        <Announcements />
      </div>
    </div>
  );
};

export default ParentPage;
