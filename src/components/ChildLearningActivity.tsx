import prisma from "@/lib/prisma";

// Format a date into a relative human-readable string
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffSeconds < 60) return "just now";
  if (diffMinutes < 60) {
    return diffMinutes === 1 ? "1 minute ago" : `${diffMinutes} minutes ago`;
  }
  if (diffHours < 24) {
    return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
  }
  if (diffDays < 7) {
    return diffDays === 1 ? "1 day ago" : `${diffDays} days ago`;
  }
  return diffWeeks === 1 ? "1 week ago" : `${diffWeeks} weeks ago`;
}

interface ActivityEvent {
  date: Date;
  description: string;
}

const ChildLearningActivity = async ({
  studentId,
  studentName,
}: {
  studentId: string;
  studentName: string;
}) => {
  // Fetch 3 types of LMS events in parallel
  const [completedLessons, quizAttempts, recentEnrollments] =
    await Promise.all([
      // Completed lessons with course title via relations
      prisma.lessonProgress.findMany({
        where: {
          studentId,
          status: "COMPLETED",
          completedAt: { not: null },
        },
        orderBy: { completedAt: "desc" },
        take: 10,
        include: {
          lesson: {
            include: {
              module: {
                include: {
                  course: { select: { title: true } },
                },
              },
            },
          },
        },
      }),
      // Submitted quiz attempts with quiz and course title
      prisma.quizAttempt.findMany({
        where: {
          studentId,
          submittedAt: { not: null },
        },
        orderBy: { submittedAt: "desc" },
        take: 10,
        include: {
          quiz: {
            include: {
              lesson: {
                include: {
                  module: {
                    include: {
                      course: { select: { title: true } },
                    },
                  },
                },
              },
            },
          },
        },
      }),
      // Recent enrollments
      prisma.enrollment.findMany({
        where: { studentId },
        orderBy: { enrolledAt: "desc" },
        take: 10,
        include: {
          course: { select: { title: true } },
        },
      }),
    ]);

  // Build unified activity events
  const events: ActivityEvent[] = [];

  for (const lp of completedLessons) {
    if (lp.completedAt) {
      const courseTitle = lp.lesson.module.course.title;
      events.push({
        date: new Date(lp.completedAt),
        description: `Completed lesson "${lp.lesson.title}" in ${courseTitle}`,
      });
    }
  }

  for (const qa of quizAttempts) {
    if (qa.submittedAt) {
      const quizTitle = qa.quiz.title;
      const courseTitle = qa.quiz.lesson.module.course.title;
      const pct = qa.percentage != null ? Math.round(qa.percentage) : 0;
      const passLabel = qa.passed ? "Pass" : "Fail";
      events.push({
        date: new Date(qa.submittedAt),
        description: `Took quiz "${quizTitle}" in ${courseTitle} - scored ${pct}% (${passLabel})`,
      });
    }
  }

  for (const enr of recentEnrollments) {
    events.push({
      date: new Date(enr.enrolledAt),
      description: `Enrolled in ${enr.course.title}`,
    });
  }

  // Sort by date descending and take first 10
  events.sort((a, b) => b.date.getTime() - a.date.getTime());
  const topEvents = events.slice(0, 10);

  if (topEvents.length === 0) {
    return (
      <div className="bg-white p-4 rounded-md">
        <h3 className="text-lg font-semibold">
          {studentName} - Learning Activity
        </h3>
        <p className="text-gray-400 mt-2 text-sm">No learning activity yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-md">
      <h3 className="text-lg font-semibold">
        {studentName} - Learning Activity
      </h3>
      <ul className="mt-3 space-y-2">
        {topEvents.map((event, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm">
            <span className="text-gray-300 mt-0.5">&#8226;</span>
            <div className="flex-1">
              <p className="text-gray-700">{event.description}</p>
              <p className="text-xs text-gray-400">
                {formatRelativeTime(event.date)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ChildLearningActivity;
