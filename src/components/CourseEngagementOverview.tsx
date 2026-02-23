import { getTranslations } from "next-intl/server";
import { CourseEngagementData } from "./CourseEngagementOverviewContainer";

function colorClass(value: number): string {
  if (value >= 90) return "text-green-600";
  if (value >= 75) return "text-yellow-600";
  return "text-red-600";
}

const CourseEngagementOverview = async ({
  courses,
}: {
  courses: CourseEngagementData[];
}) => {
  const t = await getTranslations("dashboard.teacher");

  if (courses.length === 0) {
    return (
      <div className="bg-white rounded-md p-4">
        <h1 className="text-xl font-semibold">{t("courseEngagement")}</h1>
        <p className="text-sm text-gray-400 mt-4">{t("noActiveCourses")}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-md p-4">
      <h1 className="text-xl font-semibold">{t("courseEngagement")}</h1>
      <div className="flex flex-col gap-4 mt-4">
        {courses.map((course) => (
          <div
            key={course.courseId}
            className="border border-gray-100 rounded-md p-3"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm">{course.title}</span>
              <span className="text-xs text-gray-400">{course.code}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xs text-gray-500">{t("engaged7d")}</p>
                <p className="text-sm font-bold">
                  {course.engagedStudents}/{course.totalStudents}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">{t("completion")}</p>
                <p className={`text-sm font-bold ${colorClass(course.completionRate)}`}>
                  {course.completionRate}%
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">{t("avgQuiz")}</p>
                <p className={`text-sm font-bold ${colorClass(course.avgQuizScore)}`}>
                  {course.avgQuizScore}%
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CourseEngagementOverview;
