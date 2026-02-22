import Announcements from "@/components/Announcements";
import AttendanceChartContainer from "@/components/AttendanceChartContainer";
import CountChartContainer from "@/components/CountChartContainer";
import EventCalendarContainer from "@/components/EventCalendarContainer";
import ClassOccupancyChartContainer from "@/components/ClassOccupancyChartContainer";
import GamificationAdoptionMetrics from "@/components/GamificationAdoptionMetrics";
import LmsAdoptionMetrics from "@/components/LmsAdoptionMetrics";
import ReviewAdoptionMetricsContainer from "@/components/ReviewAdoptionMetricsContainer";
import UserCard from "@/components/UserCard";

const AdminPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [keys: string]: string | undefined }>;
}) => {
  const resolvedParams = await searchParams;
  return (
    <div className="p-4 flex gap-4 flex-col md:flex-row">
      {/* LEFT */}
      <div className="w-full lg:w-2/3 flex flex-col gap-8">
        {/* USER CARDS */}
        <div className="flex gap-4 justify-between flex-wrap">
          <UserCard type="admin" />
          <UserCard type="teacher" />
          <UserCard type="student" />
          <UserCard type="parent" />
        </div>
        {/* LMS ADOPTION METRICS */}
        <div className="w-full">
          <LmsAdoptionMetrics />
        </div>
        {/* GAMIFICATION ADOPTION METRICS */}
        <div className="w-full">
          <GamificationAdoptionMetrics />
        </div>
        {/* REVIEW SYSTEM ADOPTION METRICS */}
        <div className="w-full">
          <ReviewAdoptionMetricsContainer />
        </div>
        {/* MIDDLE CHARTS */}
        <div className="flex gap-4 flex-col lg:flex-row">
          {/* COUNT CHART */}
          <div className="w-full lg:w-1/3 h-[450px]">
            <CountChartContainer />
          </div>
          {/* ATTENDANCE CHART */}
          <div className="w-full lg:w-2/3 h-[450px]">
            <AttendanceChartContainer />
          </div>
        </div>
        {/* CLASS OCCUPANCY CHART */}
        <div className="w-full h-[500px]">
          <ClassOccupancyChartContainer />
        </div>
      </div>
      {/* RIGHT */}
      <div className="w-full lg:w-1/3 flex flex-col gap-8">
        <EventCalendarContainer searchParams={resolvedParams}/>
        <Announcements />
      </div>
    </div>
  );
};

export default AdminPage;
