import prisma from "@/lib/prisma";
import { computeQuizDifficulty } from "@/lib/lmsAnalyticsUtils";
import ClassQuizAnalytics from "./ClassQuizAnalytics";

export interface QuizAnalyticsData {
  quizId: number;
  title: string;
  studentsAttempted: number;
  totalEnrolled: number;
  avgScore: number;
  passRate: number;
  mostMissedQuestion: string | null;
}

export interface CourseQuizGroup {
  courseId: number;
  courseTitle: string;
  quizzes: QuizAnalyticsData[];
}

const ClassQuizAnalyticsContainer = async ({
  teacherId,
}: {
  teacherId: string;
}) => {
  // Fetch all ACTIVE courses with quizzes, attempts, and question responses
  const courses = await prisma.course.findMany({
    where: { teacherId, status: "ACTIVE" },
    select: {
      id: true,
      title: true,
      enrollments: {
        where: { status: "ACTIVE" },
        select: { studentId: true },
      },
      modules: {
        select: {
          lessons: {
            select: {
              quizzes: {
                select: {
                  id: true,
                  title: true,
                  attempts: {
                    where: { submittedAt: { not: null } },
                    select: {
                      studentId: true,
                      percentage: true,
                      passed: true,
                      responses: {
                        select: {
                          isCorrect: true,
                          question: {
                            select: { id: true, text: true },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const courseGroups: CourseQuizGroup[] = [];

  for (const course of courses) {
    const totalEnrolled = course.enrollments.length;
    const quizzes: QuizAnalyticsData[] = [];

    for (const mod of course.modules) {
      for (const lesson of mod.lessons) {
        for (const quiz of lesson.quizzes) {
          if (quiz.attempts.length === 0) continue;

          const uniqueStudents = new Set(
            quiz.attempts.map((a) => a.studentId)
          );

          const difficulty = computeQuizDifficulty(quiz.attempts);

          quizzes.push({
            quizId: quiz.id,
            title: quiz.title,
            studentsAttempted: uniqueStudents.size,
            totalEnrolled,
            avgScore: difficulty.averageScore,
            passRate: difficulty.passRate,
            mostMissedQuestion: difficulty.mostMissedQuestion,
          });
        }
      }
    }

    // Only include courses that have quizzes with attempts
    if (quizzes.length > 0) {
      courseGroups.push({
        courseId: course.id,
        courseTitle: course.title,
        quizzes,
      });
    }
  }

  return <ClassQuizAnalytics courseGroups={courseGroups} />;
};

export default ClassQuizAnalyticsContainer;
