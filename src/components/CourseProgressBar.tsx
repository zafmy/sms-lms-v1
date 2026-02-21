"use client";

const CourseProgressBar = ({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) => {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="w-full">
      <div className="flex justify-between text-sm mb-1">
        <span>
          {completed}/{total} lessons completed
        </span>
        <span>{percentage}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-lamaPurple h-2.5 rounded-full"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default CourseProgressBar;
