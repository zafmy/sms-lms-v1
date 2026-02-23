import { currentUser } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";

const menuItems = [
  {
    titleKey: "sectionMenu",
    items: [
      {
        icon: "/home.png",
        key: "home",
        href: "/",
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/teacher.png",
        key: "teachers",
        href: "/list/teachers",
        visible: ["admin", "teacher"],
      },
      {
        icon: "/student.png",
        key: "students",
        href: "/list/students",
        visible: ["admin", "teacher"],
      },
      {
        icon: "/parent.png",
        key: "parents",
        href: "/list/parents",
        visible: ["admin", "teacher"],
      },
      {
        icon: "/subject.png",
        key: "subjects",
        href: "/list/subjects",
        visible: ["admin"],
      },
      {
        icon: "/class.png",
        key: "classes",
        href: "/list/classes",
        visible: ["admin", "teacher"],
      },
      {
        icon: "/lesson.png",
        key: "lessons",
        href: "/list/lessons",
        visible: ["admin", "teacher"],
      },
      {
        icon: "/class.png",
        key: "courses",
        href: "/list/courses",
        visible: ["admin", "teacher", "student"],
      },
      {
        icon: "/message.png",
        key: "forums",
        href: "/list/forums",
        visible: ["admin", "teacher", "student"],
      },
      {
        icon: "/result.png",
        key: "enrollments",
        href: "/list/enrollments",
        visible: ["admin"],
      },
      {
        icon: "/result.png",
        key: "badges",
        href: "/list/badges",
        visible: ["admin"],
      },
      {
        icon: "/result.png",
        key: "achievements",
        href: "/list/achievements",
        visible: ["student"],
      },
      {
        icon: "/exam.png",
        key: "exams",
        href: "/list/exams",
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/assignment.png",
        key: "assignments",
        href: "/list/assignments",
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/result.png",
        key: "reviews",
        href: "/list/reviews",
        visible: ["student"],
      },
      {
        icon: "/result.png",
        key: "results",
        href: "/list/results",
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/attendance.png",
        key: "attendance",
        href: "/list/attendance",
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/calendar.png",
        key: "events",
        href: "/list/events",
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/message.png",
        key: "messages",
        href: "/list/messages",
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/announcement.png",
        key: "announcements",
        href: "/list/announcements",
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/result.png",
        key: "guides",
        href: "/list/guides",
        visible: ["admin", "teacher", "student", "parent"],
      },
    ],
  },
  {
    titleKey: "sectionOther",
    items: [
      {
        icon: "/profile.png",
        key: "profile",
        href: "/profile",
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/setting.png",
        key: "settings",
        href: "/settings",
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/logout.png",
        key: "logout",
        href: "/logout",
        visible: ["admin", "teacher", "student", "parent"],
      },
    ],
  },
];

const Menu = async () => {
  const user = await currentUser();
  const role = user?.publicMetadata.role as string;
  const t = await getTranslations("menu");

  return (
    <div className="mt-4 text-sm">
      {menuItems.map((i) => (
        <div className="flex flex-col gap-2" key={i.titleKey}>
          <span className="hidden lg:block text-gray-400 font-light my-4">
            {t(i.titleKey)}
          </span>
          {i.items.map((item) => {
            if (item.visible.includes(role)) {
              return (
                <Link
                  href={item.href}
                  key={item.key}
                  className="flex items-center justify-center lg:justify-start gap-4 text-gray-500 py-2 md:px-2 rounded-md hover:bg-lamaSkyLight"
                >
                  <Image src={item.icon} alt="" width={20} height={20} />
                  <span className="hidden lg:block">{t(item.key)}</span>
                </Link>
              );
            }
          })}
        </div>
      ))}
    </div>
  );
};

export default Menu;
