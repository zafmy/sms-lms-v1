import Announcements from "@/components/Announcements";
import AtRiskStudentsAlert from "@/components/AtRiskStudentsAlert";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import ClassAttendanceOverview from "@/components/ClassAttendanceOverview";
import ClassQuizAnalyticsContainer from "@/components/ClassQuizAnalyticsContainer";
import CourseEngagementOverviewContainer from "@/components/CourseEngagementOverviewContainer";
import MyStudentsOverview from "@/components/MyStudentsOverview";
import PendingGrading from "@/components/PendingGrading";
import PreClassEngagementReport from "@/components/PreClassEngagementReport";
import TodaySchedule from "@/components/TodaySchedule";
import { auth } from "@clerk/nextjs/server";

const TeacherPage = async () => {
  const { userId } = await auth();
  return (
    <div className="flex-1 p-4 flex gap-4 flex-col xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3">
        <div className="h-full bg-white p-4 rounded-md">
          <h1 className="text-xl font-semibold">Schedule</h1>
          <BigCalendarContainer type="teacherId" id={userId!} />
        </div>
      </div>
      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-8">
        <TodaySchedule teacherId={userId!} />
        <PreClassEngagementReport teacherId={userId!} />
        <AtRiskStudentsAlert teacherId={userId!} />
        <CourseEngagementOverviewContainer teacherId={userId!} />
        <ClassQuizAnalyticsContainer teacherId={userId!} />
        <PendingGrading teacherId={userId!} />
        <ClassAttendanceOverview teacherId={userId!} />
        <MyStudentsOverview teacherId={userId!} />
        <Announcements />
      </div>
    </div>
  );
};

export default TeacherPage;
