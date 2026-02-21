import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";

import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Course, Enrollment, Prisma, Student } from "@prisma/client";

import { auth } from "@clerk/nextjs/server";

type EnrollmentList = Enrollment & {
  student: Student;
  course: Course;
};

const EnrollmentListPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) => {
  const resolvedParams = await searchParams;
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  // Admin only
  if (role !== "admin") {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <h1 className="text-lg font-semibold">Access Denied</h1>
      </div>
    );
  }

  const columns = [
    {
      header: "Student",
      accessor: "student",
    },
    {
      header: "Course",
      accessor: "course",
    },
    {
      header: "Status",
      accessor: "status",
      className: "hidden md:table-cell",
    },
    {
      header: "Enrolled At",
      accessor: "enrolledAt",
      className: "hidden md:table-cell",
    },
    {
      header: "Actions",
      accessor: "action",
    },
  ];

  const renderRow = (item: EnrollmentList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="p-4">
        {item.student.name + " " + item.student.surname}
      </td>
      <td>{item.course.title}</td>
      <td className="hidden md:table-cell">
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            item.status === "ACTIVE"
              ? "bg-green-100 text-green-700"
              : item.status === "COMPLETED"
              ? "bg-blue-100 text-blue-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {item.status}
        </span>
      </td>
      <td className="hidden md:table-cell">
        {new Intl.DateTimeFormat("en-US").format(item.enrolledAt)}
      </td>
      <td>
        <div className="flex items-center gap-2">
          <FormContainer table="enrollment" type="delete" id={item.id} />
        </div>
      </td>
    </tr>
  );

  const { page, ...queryParams } = resolvedParams;

  const p = page ? parseInt(page) : 1;

  const query: Prisma.EnrollmentWhereInput = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "status":
            query.status = value as any;
            break;
          case "search":
            query.OR = [
              {
                student: {
                  OR: [
                    { name: { contains: value, mode: "insensitive" } },
                    { surname: { contains: value, mode: "insensitive" } },
                  ],
                },
              },
              {
                course: {
                  title: { contains: value, mode: "insensitive" },
                },
              },
            ];
            break;
          default:
            break;
        }
      }
    }
  }

  const [data, count] = await Promise.all([
    prisma.enrollment.findMany({
      where: query,
      include: {
        student: true,
        course: true,
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: { enrolledAt: "desc" },
    }),
    prisma.enrollment.count({ where: query }),
  ]);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">
          All Enrollments
        </h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <FormContainer table="enrollment" type="create" />
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

export default EnrollmentListPage;
