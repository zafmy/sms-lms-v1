import EnrollButton from "@/components/EnrollButton";
import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";

import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Course, Prisma, Subject, Teacher } from "@prisma/client";
import Image from "next/image";

import { auth } from "@clerk/nextjs/server";

type CourseList = Course & {
  teacher: Teacher;
  subject: Subject;
  _count: { modules: number; enrollments: number };
  enrollments?: { id: number; status: string }[];
};

const CourseListPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) => {
  const resolvedParams = await searchParams;
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  const columns = [
    {
      header: "Code",
      accessor: "code",
    },
    {
      header: "Title",
      accessor: "title",
    },
    {
      header: "Teacher",
      accessor: "teacher",
      className: "hidden md:table-cell",
    },
    {
      header: "Subject",
      accessor: "subject",
      className: "hidden md:table-cell",
    },
    ...(role !== "student"
      ? [
          {
            header: "Status",
            accessor: "status",
            className: "hidden md:table-cell",
          },
        ]
      : []),
    {
      header: "Modules",
      accessor: "modules",
      className: "hidden lg:table-cell",
    },
    {
      header: "Enrollments",
      accessor: "enrollments",
      className: "hidden lg:table-cell",
    },
    ...(role === "student"
      ? [
          {
            header: "Action",
            accessor: "action",
          },
        ]
      : []),
    ...(role === "admin" || role === "teacher"
      ? [
          {
            header: "Actions",
            accessor: "action",
          },
        ]
      : []),
  ];

  const renderRow = (item: CourseList) => {
    const studentEnrollment = item.enrollments?.[0] || null;
    const isFull =
      item.maxEnrollments !== null &&
      item._count.enrollments >= item.maxEnrollments;

    return (
      <tr
        key={item.id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
      >
        <td className="p-4 font-mono">{item.code}</td>
        <td>{item.title}</td>
        <td className="hidden md:table-cell">
          {item.teacher.name + " " + item.teacher.surname}
        </td>
        <td className="hidden md:table-cell">{item.subject.name}</td>
        {role !== "student" && (
          <td className="hidden md:table-cell">
            <span
              className={`px-2 py-1 rounded-full text-xs ${
                item.status === "ACTIVE"
                  ? "bg-green-100 text-green-700"
                  : item.status === "DRAFT"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {item.status}
            </span>
          </td>
        )}
        <td className="hidden lg:table-cell">{item._count.modules}</td>
        <td className="hidden lg:table-cell">
          {item._count.enrollments}
          {item.maxEnrollments ? `/${item.maxEnrollments}` : ""}
        </td>
        <td>
          <div className="flex items-center gap-2">
            {role === "student" && (
              <EnrollButton
                courseId={item.id}
                enrollmentId={studentEnrollment?.id ?? null}
                enrollmentStatus={
                  (studentEnrollment?.status as
                    | "ACTIVE"
                    | "DROPPED"
                    | "COMPLETED") ?? null
                }
                isFull={isFull}
                courseName={item.title}
              />
            )}
            {(role === "admin" || role === "teacher") && (
              <>
                <FormContainer table="course" type="update" data={item} />
                <FormContainer table="course" type="delete" id={item.id} />
              </>
            )}
          </div>
        </td>
      </tr>
    );
  };

  const { page, ...queryParams } = resolvedParams;

  const p = page ? parseInt(page) : 1;

  const query: Prisma.CourseWhereInput = {};

  // Teachers can only see their own courses
  if (role === "teacher") {
    query.teacherId = userId!;
  }

  // Students only see ACTIVE courses
  if (role === "student") {
    query.status = "ACTIVE";
  }

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "teacherId":
            query.teacherId = value;
            break;
          case "subjectId":
            query.subjectId = parseInt(value);
            break;
          case "status":
            query.status = value as any;
            break;
          case "search":
            query.OR = [
              { title: { contains: value, mode: "insensitive" } },
              { code: { contains: value, mode: "insensitive" } },
            ];
            break;
          default:
            break;
        }
      }
    }
  }

  const [data, count] = await Promise.all([
    prisma.course.findMany({
      where: query,
      include: {
        teacher: { select: { name: true, surname: true } },
        subject: { select: { name: true } },
        _count: {
          select: {
            modules: true,
            enrollments: { where: { status: "ACTIVE" } },
          },
        },
        ...(role === "student"
          ? {
              enrollments: {
                where: { studentId: userId! },
                select: { id: true, status: true },
                take: 1,
              },
            }
          : {}),
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: { createdAt: "desc" },
    }),
    prisma.course.count({ where: query }),
  ]);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">
          {role === "student" ? "Available Courses" : "All Courses"}
        </h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {(role === "admin" || role === "teacher") && (
              <FormContainer table="course" type="create" />
            )}
          </div>
        </div>
      </div>
      {/* LIST */}
      <Table columns={columns} renderRow={renderRow} data={data} />
      {/* PAGINATION */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default CourseListPage;
