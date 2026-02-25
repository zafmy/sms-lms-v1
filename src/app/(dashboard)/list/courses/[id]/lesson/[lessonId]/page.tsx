import LessonCompleteButton from "@/components/LessonCompleteButton";
import QuizCard from "@/components/QuizCard";
import { RichTextRenderer } from "@/components/editor";
import prisma from "@/lib/prisma";
import { startLessonProgress } from "@/lib/actions";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

const LessonViewerPage = async ({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>;
}) => {
  const { id, lessonId } = await params;
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const t = await getTranslations("lms.courses");

  const lesson = await prisma.lmsLesson.findUnique({
    where: { id: parseInt(lessonId) },
    include: {
      module: {
        include: {
          course: {
            include: {
              teacher: { select: { id: true } },
            },
          },
        },
      },
      quizzes: {
        include: {
          _count: { select: { questions: true } },
          ...(role === "student"
            ? {
                attempts: {
                  where: { studentId: userId! },
                  orderBy: { startedAt: "desc" as const },
                  select: {
                    score: true,
                    maxScore: true,
                    percentage: true,
                    passed: true,
                  },
                },
              }
            : {}),
        },
      },
    },
  });

  if (!lesson) {
    return notFound();
  }

  const course = lesson.module.course;

  // Access control
  if (role === "teacher" && course.teacher.id !== userId) {
    return notFound();
  }

  let isCompleted = false;

  if (role === "student") {
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: userId!,
          courseId: course.id,
        },
      },
    });
    if (!enrollment || enrollment.status !== "ACTIVE") {
      return notFound();
    }

    // Auto-start progress
    await startLessonProgress(lesson.id);

    // Check completion status
    const progress = await prisma.lessonProgress.findUnique({
      where: {
        studentId_lessonId: {
          studentId: userId!,
          lessonId: lesson.id,
        },
      },
    });
    isCompleted = progress?.status === "COMPLETED";
  }

  const isYouTubeUrl = (url: string) => {
    return (
      url.includes("youtube.com") ||
      url.includes("youtu.be") ||
      url.includes("youtube-nocookie.com")
    );
  };

  const getYouTubeEmbedUrl = (url: string) => {
    let videoId = "";
    if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1]?.split("?")[0] || "";
    } else if (url.includes("watch?v=")) {
      videoId = url.split("watch?v=")[1]?.split("&")[0] || "";
    } else if (url.includes("embed/")) {
      videoId = url.split("embed/")[1]?.split("?")[0] || "";
    }
    return `https://www.youtube-nocookie.com/embed/${videoId}`;
  };

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* BREADCRUMB */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link
          href="/list/courses"
          className="hover:text-lamaPurple"
        >
          {t("breadcrumbCourses")}
        </Link>
        <span>/</span>
        <Link
          href={`/list/courses/${course.id}`}
          className="hover:text-lamaPurple"
        >
          {course.title}
        </Link>
        <span>/</span>
        <span className="text-gray-700">{lesson.module.title}</span>
        <span>/</span>
        <span className="text-gray-700 font-medium">{lesson.title}</span>
      </div>

      {/* LESSON HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">{lesson.title}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs">
              {lesson.contentType}
            </span>
            {lesson.estimatedMinutes && (
              <span>{t("minEstimated", { minutes: lesson.estimatedMinutes })}</span>
            )}
          </div>
        </div>
        {role === "student" && (
          <LessonCompleteButton
            lessonId={lesson.id}
            isCompleted={isCompleted}
          />
        )}
      </div>

      {/* EXTERNAL URL / VIDEO */}
      {lesson.externalUrl && (
        <div className="mb-6">
          {isYouTubeUrl(lesson.externalUrl) ? (
            <div className="aspect-video w-full max-w-3xl">
              <iframe
                src={getYouTubeEmbedUrl(lesson.externalUrl)}
                className="w-full h-full rounded-md"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                sandbox="allow-scripts allow-same-origin allow-presentation"
              />
            </div>
          ) : (
            <a
              href={lesson.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lamaPurple hover:underline flex items-center gap-1"
            >
              {t("externalResource")}
              <span className="text-xs">&#8599;</span>
            </a>
          )}
        </div>
      )}

      {/* LESSON CONTENT */}
      <div className="prose max-w-none">
        <RichTextRenderer
          content={lesson.content}
          className="text-gray-700 leading-relaxed"
        />
      </div>

      {/* QUIZZES */}
      {lesson.quizzes.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-3">{t("quizzesHeading")}</h2>
          <div className="flex flex-col gap-3">
            {lesson.quizzes.map((quiz) => (
              <QuizCard
                key={quiz.id}
                quiz={quiz}
                courseId={course.id}
                role={role}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonViewerPage;
