import prisma from "@/lib/prisma";
import {
  fetchStudentResults,
  computeSubjectGrades,
  computeGradeSummary,
} from "@/lib/gradeUtils";
import ReportCardTable from "@/components/ReportCardTable";
import PrintButton from "@/components/PrintButton";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getLocale } from "next-intl/server";
import { getIntlLocale } from "@/lib/formatUtils";

const ReportCardPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  // Access control
  let isAuthorized = false;

  if (role === "admin") {
    isAuthorized = true;
  } else if (role === "teacher") {
    const lesson = await prisma.lesson.findFirst({
      where: {
        teacherId: userId!,
        class: { students: { some: { id } } },
      },
    });
    isAuthorized = !!lesson;
  } else if (role === "student") {
    isAuthorized = userId === id;
  } else if (role === "parent") {
    const student = await prisma.student.findFirst({
      where: { id, parentId: userId! },
    });
    isAuthorized = !!student;
  }

  if (!isAuthorized) {
    redirect("/list/students");
  }

  // Fetch student info
  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      class: { include: { grade: true } },
    },
  });

  if (!student) {
    return notFound();
  }

  // Fetch results and compute grades
  const results = await fetchStudentResults(id);
  const subjectGrades = computeSubjectGrades(results);
  const gradeSummary = computeGradeSummary(results);
  const locale = await getLocale();

  const formattedDate = new Intl.DateTimeFormat(getIntlLocale(locale), {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <div className="p-4 flex flex-col gap-6">
      {/* Print Button and Back Link */}
      <div className="flex justify-between items-center print:hidden">
        <Link
          href={`/list/students/${id}`}
          className="text-sm text-gray-500 hover:underline"
        >
          &larr; Back to Student Profile
        </Link>
        <PrintButton />
      </div>

      {/* Student Header */}
      <div className="bg-white p-6 rounded-md">
        <h1 className="text-2xl font-bold">
          {student.name} {student.surname}
        </h1>
        <div className="flex gap-4 text-sm text-gray-500 mt-2">
          <span>Class: {student.class.name}</span>
          <span>Grade: {student.class.grade.level}</span>
          <span>Date: {formattedDate}</span>
        </div>
      </div>

      {/* Report Card Table */}
      <div className="bg-white p-6 rounded-md">
        <h2 className="text-xl font-semibold mb-4">Academic Performance</h2>
        {subjectGrades.length > 0 ? (
          <ReportCardTable data={subjectGrades} />
        ) : (
          <p className="text-sm text-gray-500">
            No assessment results available for this student.
          </p>
        )}
      </div>

      {/* Overall Statistics */}
      <div className="bg-white p-6 rounded-md">
        <h2 className="text-xl font-semibold mb-4">Overall Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-lamaSkyLight p-4 rounded-md">
            <p className="text-sm text-gray-500">Total Assessments</p>
            <p className="text-2xl font-bold">{gradeSummary.totalResults}</p>
          </div>
          <div className="bg-lamaPurpleLight p-4 rounded-md">
            <p className="text-sm text-gray-500">Overall Average</p>
            <p className="text-2xl font-bold">{gradeSummary.overallAverage}</p>
          </div>
          <div className="bg-lamaYellowLight p-4 rounded-md">
            <p className="text-sm text-gray-500">Exam Average</p>
            <p className="text-2xl font-bold">
              {gradeSummary.examAverage ?? "-"}
            </p>
          </div>
          <div className="bg-lamaSkyLight p-4 rounded-md">
            <p className="text-sm text-gray-500">Assignment Average</p>
            <p className="text-2xl font-bold">
              {gradeSummary.assignmentAverage ?? "-"}
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-md">
            <p className="text-sm text-gray-500">Highest Score</p>
            <p className="text-2xl font-bold text-green-600">
              {gradeSummary.highestScore || "-"}
            </p>
          </div>
          <div className="bg-red-50 p-4 rounded-md">
            <p className="text-sm text-gray-500">Lowest Score</p>
            <p className="text-2xl font-bold text-red-600">
              {gradeSummary.lowestScore || "-"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportCardPage;
