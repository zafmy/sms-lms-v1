import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { convertToCSV } from "@/lib/csvUtils";
import { NextRequest, NextResponse } from "next/server";

type ColumnDef = { key: string; header: string };

// Generate header-only CSV when data is empty
function headersOnlyCSV(columns: ColumnDef[]): string {
  return columns.map((c) => c.header).join(",");
}

export async function GET(
  request: NextRequest,
  { params }: { params: { table: string } }
) {
  // Auth check - admin and teacher only
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (!userId || (role !== "admin" && role !== "teacher")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { table } = params;
  const searchParams = request.nextUrl.searchParams;

  try {
    let csvContent = "";

    switch (table) {
      case "lessons": {
        const query: Record<string, unknown> = {};
        const classId = searchParams.get("classId");
        const teacherId = searchParams.get("teacherId");
        const search = searchParams.get("search");

        if (classId) query.classId = parseInt(classId);
        if (teacherId) query.teacherId = teacherId;
        if (search) {
          query.OR = [
            { subject: { name: { contains: search, mode: "insensitive" } } },
            { teacher: { name: { contains: search, mode: "insensitive" } } },
          ];
        }
        // Teacher role restriction
        if (role === "teacher") {
          query.teacherId = userId;
        }

        const columns: ColumnDef[] = [
          { key: "name", header: "Lesson Name" },
          { key: "day", header: "Day" },
          { key: "startTime", header: "Start Time" },
          { key: "endTime", header: "End Time" },
          { key: "subject", header: "Subject" },
          { key: "class", header: "Class" },
          { key: "teacher", header: "Teacher" },
        ];

        const data = await prisma.lesson.findMany({
          where: query,
          include: {
            subject: { select: { name: true } },
            class: { select: { name: true } },
            teacher: { select: { name: true, surname: true } },
          },
          orderBy: { name: "asc" },
        });

        const mapped = data.map((d) => ({
          name: d.name,
          day: d.day,
          startTime: new Intl.DateTimeFormat("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          }).format(d.startTime),
          endTime: new Intl.DateTimeFormat("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          }).format(d.endTime),
          subject: d.subject.name,
          class: d.class.name,
          teacher: d.teacher.name + " " + d.teacher.surname,
        }));

        csvContent =
          mapped.length > 0
            ? convertToCSV(mapped, columns)
            : headersOnlyCSV(columns);
        break;
      }

      case "students": {
        const query: Record<string, unknown> = {};
        const classIdParam = searchParams.get("classId");
        const search = searchParams.get("search");

        if (classIdParam) query.classId = parseInt(classIdParam);
        if (search) {
          query.name = { contains: search, mode: "insensitive" };
        }
        if (role === "teacher") {
          query.class = { lessons: { some: { teacherId: userId } } };
        }

        const columns: ColumnDef[] = [
          { key: "name", header: "Student Name" },
          { key: "email", header: "Email" },
          { key: "phone", header: "Phone" },
          { key: "address", header: "Address" },
          { key: "sex", header: "Sex" },
          { key: "bloodType", header: "Blood Type" },
          { key: "birthday", header: "Birthday" },
          { key: "class", header: "Class" },
          { key: "grade", header: "Grade" },
        ];

        const data = await prisma.student.findMany({
          where: query,
          include: {
            class: { select: { name: true } },
            grade: { select: { level: true } },
          },
          orderBy: { name: "asc" },
        });

        const mapped = data.map((d) => ({
          name: d.name + " " + d.surname,
          email: d.email || "",
          phone: d.phone || "",
          address: d.address || "",
          sex: d.sex,
          bloodType: d.bloodType,
          birthday: new Intl.DateTimeFormat("en-US").format(d.birthday),
          class: d.class.name,
          grade: String(d.grade.level),
        }));

        csvContent =
          mapped.length > 0
            ? convertToCSV(mapped, columns)
            : headersOnlyCSV(columns);
        break;
      }

      case "teachers": {
        const query: Record<string, unknown> = {};
        const search = searchParams.get("search");

        if (search) {
          query.name = { contains: search, mode: "insensitive" };
        }

        const columns: ColumnDef[] = [
          { key: "name", header: "Teacher Name" },
          { key: "email", header: "Email" },
          { key: "phone", header: "Phone" },
          { key: "address", header: "Address" },
          { key: "sex", header: "Sex" },
          { key: "bloodType", header: "Blood Type" },
          { key: "birthday", header: "Birthday" },
          { key: "subjects", header: "Subjects" },
          { key: "classes", header: "Classes" },
        ];

        const data = await prisma.teacher.findMany({
          where: query,
          include: {
            subjects: { select: { name: true } },
            classes: { select: { name: true } },
          },
          orderBy: { name: "asc" },
        });

        const mapped = data.map((d) => ({
          name: d.name + " " + d.surname,
          email: d.email || "",
          phone: d.phone || "",
          address: d.address || "",
          sex: d.sex,
          bloodType: d.bloodType,
          birthday: new Intl.DateTimeFormat("en-US").format(d.birthday),
          subjects: d.subjects.map((s) => s.name).join("; "),
          classes: d.classes.map((c) => c.name).join("; "),
        }));

        csvContent =
          mapped.length > 0
            ? convertToCSV(mapped, columns)
            : headersOnlyCSV(columns);
        break;
      }

      case "exams": {
        const query: Record<string, unknown> = {};

        if (role === "teacher") {
          query.lesson = { teacherId: userId };
        }

        const columns: ColumnDef[] = [
          { key: "title", header: "Exam Title" },
          { key: "subject", header: "Subject" },
          { key: "class", header: "Class" },
          { key: "teacher", header: "Teacher" },
          { key: "startTime", header: "Start Time" },
          { key: "endTime", header: "End Time" },
        ];

        const data = await prisma.exam.findMany({
          where: query,
          include: {
            lesson: {
              select: {
                subject: { select: { name: true } },
                class: { select: { name: true } },
                teacher: { select: { name: true, surname: true } },
              },
            },
          },
          orderBy: { startTime: "desc" },
        });

        const mapped = data.map((d) => ({
          title: d.title,
          subject: d.lesson.subject.name,
          class: d.lesson.class.name,
          teacher: d.lesson.teacher.name + " " + d.lesson.teacher.surname,
          startTime: new Intl.DateTimeFormat("en-US").format(d.startTime),
          endTime: new Intl.DateTimeFormat("en-US").format(d.endTime),
        }));

        csvContent =
          mapped.length > 0
            ? convertToCSV(mapped, columns)
            : headersOnlyCSV(columns);
        break;
      }

      case "assignments": {
        const query: Record<string, unknown> = {};

        if (role === "teacher") {
          query.lesson = { teacherId: userId };
        }

        const columns: ColumnDef[] = [
          { key: "title", header: "Assignment Title" },
          { key: "subject", header: "Subject" },
          { key: "class", header: "Class" },
          { key: "startDate", header: "Start Date" },
          { key: "dueDate", header: "Due Date" },
        ];

        const data = await prisma.assignment.findMany({
          where: query,
          include: {
            lesson: {
              select: {
                subject: { select: { name: true } },
                class: { select: { name: true } },
              },
            },
          },
          orderBy: { dueDate: "desc" },
        });

        const mapped = data.map((d) => ({
          title: d.title,
          subject: d.lesson.subject.name,
          class: d.lesson.class.name,
          startDate: new Intl.DateTimeFormat("en-US").format(d.startDate),
          dueDate: new Intl.DateTimeFormat("en-US").format(d.dueDate),
        }));

        csvContent =
          mapped.length > 0
            ? convertToCSV(mapped, columns)
            : headersOnlyCSV(columns);
        break;
      }

      case "attendance": {
        const query: Record<string, unknown> = {};

        if (role === "teacher") {
          query.lesson = { teacherId: userId };
        }

        const columns: ColumnDef[] = [
          { key: "student", header: "Student" },
          { key: "lesson", header: "Lesson" },
          { key: "date", header: "Date" },
          { key: "status", header: "Status" },
        ];

        const data = await prisma.attendance.findMany({
          where: query,
          include: {
            student: { select: { name: true, surname: true } },
            lesson: { select: { name: true } },
          },
          orderBy: { date: "desc" },
        });

        const mapped = data.map((d) => ({
          student: d.student.name + " " + d.student.surname,
          lesson: d.lesson.name,
          date: new Intl.DateTimeFormat("en-US").format(d.date),
          status: d.present ? "Present" : "Absent",
        }));

        csvContent =
          mapped.length > 0
            ? convertToCSV(mapped, columns)
            : headersOnlyCSV(columns);
        break;
      }

      case "results": {
        const query: Record<string, unknown> = {};

        if (role === "teacher") {
          query.OR = [
            { exam: { lesson: { teacherId: userId } } },
            { assignment: { lesson: { teacherId: userId } } },
          ];
        }

        const columns: ColumnDef[] = [
          { key: "student", header: "Student" },
          { key: "title", header: "Title" },
          { key: "type", header: "Type" },
          { key: "score", header: "Score" },
        ];

        const data = await prisma.result.findMany({
          where: query,
          include: {
            student: { select: { name: true, surname: true } },
            exam: { select: { title: true } },
            assignment: { select: { title: true } },
          },
        });

        const mapped = data.map((d) => ({
          student: d.student.name + " " + d.student.surname,
          title: d.exam?.title || d.assignment?.title || "",
          type: d.examId ? "Exam" : "Assignment",
          score: String(d.score),
        }));

        csvContent =
          mapped.length > 0
            ? convertToCSV(mapped, columns)
            : headersOnlyCSV(columns);
        break;
      }

      case "classes": {
        const columns: ColumnDef[] = [
          { key: "name", header: "Class Name" },
          { key: "capacity", header: "Capacity" },
          { key: "grade", header: "Grade" },
          { key: "supervisor", header: "Supervisor" },
          { key: "students", header: "Student Count" },
        ];

        const data = await prisma.class.findMany({
          include: {
            grade: { select: { level: true } },
            supervisor: { select: { name: true, surname: true } },
            _count: { select: { students: true } },
          },
          orderBy: { name: "asc" },
        });

        const mapped = data.map((d) => ({
          name: d.name,
          capacity: String(d.capacity),
          grade: String(d.grade.level),
          supervisor: d.supervisor
            ? d.supervisor.name + " " + d.supervisor.surname
            : "",
          students: String(d._count.students),
        }));

        csvContent =
          mapped.length > 0
            ? convertToCSV(mapped, columns)
            : headersOnlyCSV(columns);
        break;
      }

      default:
        return NextResponse.json(
          { error: "Invalid table" },
          { status: 400 }
        );
    }

    // Return CSV as downloadable file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${table}-export.csv"`,
      },
    });
  } catch (err) {
    console.error("CSV export error:", err);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
