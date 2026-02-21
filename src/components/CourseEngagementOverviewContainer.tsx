import prisma from "@/lib/prisma";
import {
  computeCourseCompletion,
  computeAverageQuizScore,
} from "@/lib/lmsAnalyticsUtils";
import CourseEngagementOverview from "./CourseEngagementOverview";

export interface CourseEngagementData {
  courseId: number;
  title: string;
  code: string;
  engagedStudents: number;
  totalStudents: number;
  completionRate: number;
  avgQuizScore: number;
}

const CourseEngagementOverviewContainer = async ({
  teacherId,
}: {
  teacherId: string;
}) => {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Fetch teacher's ACTIVE courses with ACTIVE enrollments and course structure
  const courses = await prisma.course.findMany({
    where: { teacherId, status: "ACTIVE" },
    select: {
      id: true,
      title: true,
      code: true,
      modules: {
        select: {
          lessons: { select: { id: true } },
        },
      },
      enrollments: {
        where: { status: "ACTIVE" },
        select: {
          studentId: true,
        },
      },
    },
  });

  if (courses.length === 0) {
    return <CourseEngagementOverview courses={[]} />;
  }

  // Collect all enrolled student IDs across all courses
  const allStudentIds = [
    ...new Set(
      courses.flatMap((c) => c.enrollments.map((e) => e.studentId))
    ),
  ];

  // Batch fetch lesson progress and quiz attempts for all enrolled students in last 7 days
  const [recentProgress, recentAttempts, allProgress, allAttempts] =
    await Promise.all([
      prisma.lessonProgress.findMany({
        where: {
          studentId: { in: allStudentIds },
          completedAt: { gte: sevenDaysAgo },
        },
        select: { studentId: true, lessonId: true },
      }),
      prisma.quizAttempt.findMany({
        where: {
          studentId: { in: allStudentIds },
          submittedAt: { gte: sevenDaysAgo },
        },
        select: { studentId: true, quizId: true, quiz: { select: { lessonId: true } } },
      }),
      prisma.lessonProgress.findMany({
        where: { studentId: { in: allStudentIds } },
        select: { studentId: true, lessonId: true, status: true },
      }),
      prisma.quizAttempt.findMany({
        where: {
          studentId: { in: allStudentIds },
          submittedAt: { not: null },
        },
        select: {
          studentId: true,
          quizId: true,
          percentage: true,
          passed: true,
          quiz: { select: { lessonId: true } },
        },
      }),
    ]);

  // Build sets for quick lookup: studentId -> set of lessonIds with recent activity
  const recentActivityByStudent = new Map<string, Set<number>>();
  for (const p of recentProgress) {
    if (!recentActivityByStudent.has(p.studentId)) {
      recentActivityByStudent.set(p.studentId, new Set());
    }
    recentActivityByStudent.get(p.studentId)!.add(p.lessonId);
  }
  for (const a of recentAttempts) {
    if (!recentActivityByStudent.has(a.studentId)) {
      recentActivityByStudent.set(a.studentId, new Set());
    }
    recentActivityByStudent.get(a.studentId)!.add(a.quiz.lessonId);
  }

  const courseData: CourseEngagementData[] = courses.map((course) => {
    const enrolledStudentIds = course.enrollments.map((e) => e.studentId);
    const courseLessonIds = new Set(
      course.modules.flatMap((m) => m.lessons.map((l) => l.id))
    );

    // Count students with any activity in last 7 days for this course's lessons
    let engagedCount = 0;
    for (const sid of enrolledStudentIds) {
      const studentLessons = recentActivityByStudent.get(sid);
      if (studentLessons) {
        const hasActivity = [...studentLessons].some((lid) =>
          courseLessonIds.has(lid)
        );
        if (hasActivity) {
          engagedCount++;
        }
      }
    }

    // Compute average completion rate across enrolled students
    const completionRates: number[] = [];
    for (const sid of enrolledStudentIds) {
      const studentProgress = allProgress.filter(
        (p) => p.studentId === sid
      );
      const result = computeCourseCompletion(
        { modules: course.modules },
        studentProgress
      );
      completionRates.push(result.percentage);
    }
    const avgCompletion =
      completionRates.length > 0
        ? Math.round(
            completionRates.reduce((a, b) => a + b, 0) /
              completionRates.length
          )
        : 0;

    // Compute average quiz score for enrolled students
    const courseAttempts = allAttempts.filter(
      (a) =>
        enrolledStudentIds.includes(a.studentId) &&
        courseLessonIds.has(a.quiz.lessonId)
    );
    const quizResult = computeAverageQuizScore(courseAttempts);

    return {
      courseId: course.id,
      title: course.title,
      code: course.code,
      engagedStudents: engagedCount,
      totalStudents: enrolledStudentIds.length,
      completionRate: avgCompletion,
      avgQuizScore: quizResult.averagePercentage,
    };
  });

  return <CourseEngagementOverview courses={courseData} />;
};

export default CourseEngagementOverviewContainer;
