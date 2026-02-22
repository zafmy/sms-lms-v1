"use client";

interface SubjectMasteryMeterProps {
  data: Array<{ subjectName: string; percentage: number }>;
}

const SubjectMasteryMeter = ({ data }: SubjectMasteryMeterProps) => {
  if (data.length === 0) {
    return (
      <div className="bg-white p-4 rounded-md">
        <h3 className="text-md font-medium mb-2">Subject Mastery</h3>
        <p className="text-gray-400 text-sm">No review data yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-md">
      <h3 className="text-md font-medium mb-3">Subject Mastery</h3>
      <div className="space-y-3">
        {data.map(({ subjectName, percentage }) => (
          <div key={subjectName}>
            <div className="flex justify-between text-sm mb-1">
              <span>{subjectName}</span>
              <span
                className={
                  percentage >= 70
                    ? "text-green-600"
                    : percentage >= 40
                      ? "text-yellow-600"
                      : "text-red-500"
                }
              >
                {Math.round(percentage)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full transition-all ${
                  percentage >= 70
                    ? "bg-green-500"
                    : percentage >= 40
                      ? "bg-yellow-500"
                      : "bg-red-400"
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubjectMasteryMeter;
