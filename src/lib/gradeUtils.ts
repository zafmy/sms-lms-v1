import prisma from "@/lib/prisma";

// Shared types for grade aggregation
export interface SubjectGradeRow {
  subjectName: string;
  examAverage: number | null;
  assignmentAverage: number | null;
  overallAverage: number;
  examCount: number;
  assignmentCount: number;
  totalAssessments: number;
}

export interface GradeSummaryData {
  totalResults: number;
  overallAverage: number;
  highestScore: number;
  lowestScore: number;
  examAverage: number | null;
  assignmentAverage: number | null;
}

// Raw result type from Prisma query
type ResultWithSubject = {
  score: number;
  examId: number | null;
  assignmentId: number | null;
  exam: { lesson: { subject: { name: string } } } | null;
  assignment: { lesson: { subject: { name: string } } } | null;
};

// Fetch all results for a student with subject resolution
export async function fetchStudentResults(studentId: string) {
  return prisma.result.findMany({
    where: { studentId },
    select: {
      score: true,
      examId: true,
      assignmentId: true,
      exam: {
        select: {
          lesson: { select: { subject: { select: { name: true } } } },
        },
      },
      assignment: {
        select: {
          lesson: { select: { subject: { select: { name: true } } } },
        },
      },
    },
  });
}

// Compute per-subject grade rows from raw results
export function computeSubjectGrades(
  results: ResultWithSubject[]
): SubjectGradeRow[] {
  const subjectMap = new Map<
    string,
    { examScores: number[]; assignmentScores: number[] }
  >();

  for (const result of results) {
    const subjectName =
      result.exam?.lesson.subject.name ??
      result.assignment?.lesson.subject.name;
    if (!subjectName) continue;

    if (!subjectMap.has(subjectName)) {
      subjectMap.set(subjectName, { examScores: [], assignmentScores: [] });
    }
    const entry = subjectMap.get(subjectName)!;

    if (result.examId) {
      entry.examScores.push(result.score);
    } else {
      entry.assignmentScores.push(result.score);
    }
  }

  const rows: SubjectGradeRow[] = [];
  Array.from(subjectMap.entries()).forEach(([subjectName, { examScores, assignmentScores }]) => {
    const allScores = [...examScores, ...assignmentScores];
    rows.push({
      subjectName,
      examAverage:
        examScores.length > 0
          ? Math.round(
              (examScores.reduce((a: number, b: number) => a + b, 0) / examScores.length) * 10
            ) / 10
          : null,
      assignmentAverage:
        assignmentScores.length > 0
          ? Math.round(
              (assignmentScores.reduce((a: number, b: number) => a + b, 0) /
                assignmentScores.length) *
                10
            ) / 10
          : null,
      overallAverage:
        Math.round(
          (allScores.reduce((a: number, b: number) => a + b, 0) / allScores.length) * 10
        ) / 10,
      examCount: examScores.length,
      assignmentCount: assignmentScores.length,
      totalAssessments: allScores.length,
    });
  });

  return rows.sort((a, b) => a.subjectName.localeCompare(b.subjectName));
}

// Compute overall grade summary statistics
export function computeGradeSummary(
  results: { score: number; examId: number | null; assignmentId: number | null }[]
): GradeSummaryData {
  if (results.length === 0) {
    return {
      totalResults: 0,
      overallAverage: 0,
      highestScore: 0,
      lowestScore: 0,
      examAverage: null,
      assignmentAverage: null,
    };
  }

  const scores = results.map((r) => r.score);
  const examScores = results.filter((r) => r.examId).map((r) => r.score);
  const assignmentScores = results
    .filter((r) => r.assignmentId)
    .map((r) => r.score);

  return {
    totalResults: results.length,
    overallAverage:
      Math.round(
        (scores.reduce((a: number, b: number) => a + b, 0) / scores.length) * 10
      ) / 10,
    highestScore: Math.max(...scores),
    lowestScore: Math.min(...scores),
    examAverage:
      examScores.length > 0
        ? Math.round(
            (examScores.reduce((a: number, b: number) => a + b, 0) / examScores.length) * 10
          ) / 10
        : null,
    assignmentAverage:
      assignmentScores.length > 0
        ? Math.round(
            (assignmentScores.reduce((a: number, b: number) => a + b, 0) /
              assignmentScores.length) *
              10
          ) / 10
        : null,
  };
}
