import Image from "next/image";
import ClassOccupancyChart from "./ClassOccupancyChart";
import prisma from "@/lib/prisma";
import { getTranslations } from "next-intl/server";

const ClassOccupancyChartContainer = async () => {
  const t = await getTranslations("dashboard.admin");

  const data = await prisma.class.findMany({
    select: {
      name: true,
      capacity: true,
      _count: {
        select: { students: true },
      },
    },
  });

  const chartData = data.map((cls) => ({
    name: cls.name,
    capacity: cls.capacity,
    students: cls._count.students,
  }));

  return (
    <div className="bg-white rounded-xl w-full h-full p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-semibold">{t("classOccupancy")}</h1>
        <Image src="/moreDark.png" alt="" width={20} height={20} />
      </div>
      <ClassOccupancyChart data={chartData} />
    </div>
  );
};

export default ClassOccupancyChartContainer;
