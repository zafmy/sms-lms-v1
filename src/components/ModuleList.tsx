import FormContainer from "@/components/FormContainer";
import LessonCard from "@/components/LessonCard";
import { LmsLesson, Module } from "@prisma/client";

type ModuleWithLessons = Module & {
  lessons: LmsLesson[];
};

const ModuleList = ({
  modules,
  role,
  courseId,
  studentProgress,
}: {
  modules: ModuleWithLessons[];
  role?: string;
  courseId: number;
  studentProgress?: any[];
}) => {
  const canEdit = role === "admin" || role === "teacher";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Modules</h2>
        {canEdit && (
          <FormContainer
            table="module"
            type="create"
            data={{ courseId }}
          />
        )}
      </div>

      {modules.length === 0 ? (
        <p className="text-gray-500 text-sm">No modules yet.</p>
      ) : (
        modules.map((mod) => {
          const completedCount = mod.lessons.filter((lesson) =>
            studentProgress?.find(
              (p) => p.lessonId === lesson.id && p.status === "COMPLETED"
            )
          ).length;

          return (
            <div
              key={mod.id}
              className="border border-gray-200 rounded-md p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-400">
                    #{mod.order}
                  </span>
                  <h3 className="font-semibold">{mod.title}</h3>
                  {mod.isLocked && (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">
                      Locked
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {studentProgress && mod.lessons.length > 0 && (
                    <span className="text-xs text-gray-500">
                      {completedCount}/{mod.lessons.length} completed
                    </span>
                  )}
                  {!studentProgress && (
                    <span className="text-xs text-gray-500">
                      {mod.lessons.length} lesson{mod.lessons.length !== 1 ? "s" : ""}
                    </span>
                  )}
                  {canEdit && (
                    <>
                      <FormContainer
                        table="module"
                        type="update"
                        data={mod}
                      />
                      <FormContainer
                        table="module"
                        type="delete"
                        id={mod.id}
                      />
                    </>
                  )}
                </div>
              </div>
              {mod.description && (
                <p className="text-sm text-gray-500 mb-2">{mod.description}</p>
              )}
              {canEdit && (
                <div className="ml-4 mb-2">
                  <FormContainer
                    table="lmsLesson"
                    type="create"
                    data={{ moduleId: mod.id }}
                  />
                </div>
              )}
              {mod.lessons.length > 0 && (
                <div className="ml-4 flex flex-col">
                  {mod.lessons.map((lesson) => {
                    const progress = studentProgress?.find(
                      (p) => p.lessonId === lesson.id
                    );
                    return (
                      <LessonCard
                        key={lesson.id}
                        lesson={lesson}
                        courseId={courseId}
                        role={role}
                        progress={progress || null}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default ModuleList;
