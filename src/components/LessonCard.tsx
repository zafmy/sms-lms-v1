import FormContainer from "@/components/FormContainer";
import Link from "next/link";
import { LmsLesson } from "@prisma/client";

type LessonCardProps = {
  lesson: LmsLesson;
  courseId: number;
  role?: string;
  progress?: {
    status: string;
  } | null;
};

const LessonCard = ({ lesson, courseId, role, progress }: LessonCardProps) => {
  const canEdit = role === "admin" || role === "teacher";

  const statusIcon = () => {
    if (!progress) {
      return (
        <span className="w-5 h-5 rounded-full border-2 border-gray-300 inline-block" />
      );
    }
    if (progress.status === "COMPLETED") {
      return (
        <span className="w-5 h-5 rounded-full bg-green-500 inline-flex items-center justify-center text-white text-xs">
          &#10003;
        </span>
      );
    }
    if (progress.status === "IN_PROGRESS") {
      return (
        <span className="w-5 h-5 rounded-full border-2 border-yellow-500 inline-block relative">
          <span className="absolute inset-0 bg-yellow-500 rounded-full" style={{ clipPath: "inset(0 50% 0 0)" }} />
        </span>
      );
    }
    return (
      <span className="w-5 h-5 rounded-full border-2 border-gray-300 inline-block" />
    );
  };

  return (
    <div className="flex items-center justify-between text-sm py-2 px-2 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 rounded">
      <Link
        href={`/list/courses/${courseId}/lesson/${lesson.id}`}
        className="flex items-center gap-3 flex-1"
      >
        {statusIcon()}
        <div className="flex items-center gap-2">
          <span className="text-gray-400">#{lesson.order}</span>
          <span className="hover:text-lamaPurple">{lesson.title}</span>
          <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">
            {lesson.contentType}
          </span>
        </div>
      </Link>
      <div className="flex items-center gap-2">
        {lesson.estimatedMinutes && (
          <span className="text-xs text-gray-400">
            {lesson.estimatedMinutes} min
          </span>
        )}
        {lesson.externalUrl && (
          <span className="text-xs text-gray-400" title="Has external resource">
            &#128279;
          </span>
        )}
        {canEdit && (
          <>
            <FormContainer
              table="lmsLesson"
              type="update"
              data={lesson}
            />
            <FormContainer
              table="lmsLesson"
              type="delete"
              id={lesson.id}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default LessonCard;
