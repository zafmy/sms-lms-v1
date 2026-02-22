export const ITEM_PER_PAGE = 10

type RouteAccessMap = {
  [key: string]: string[];
};

export const routeAccessMap: RouteAccessMap = {
  "/admin(.*)": ["admin"],
  "/student(.*)": ["student"],
  "/teacher(.*)": ["teacher"],
  "/parent(.*)": ["parent"],
  "/list/teachers": ["admin", "teacher"],
  "/list/students": ["admin", "teacher"],
  "/list/parents": ["admin", "teacher"],
  "/list/subjects": ["admin"],
  "/list/classes": ["admin", "teacher"],
  "/list/exams": ["admin", "teacher", "student", "parent"],
  "/list/assignments": ["admin", "teacher", "student", "parent"],
  "/list/results": ["admin", "teacher", "student", "parent"],
  "/list/attendance": ["admin", "teacher", "student", "parent"],
  "/list/events": ["admin", "teacher", "student", "parent"],
  "/list/announcements": ["admin", "teacher", "student", "parent"],
  "/list/courses/(.*/analytics)": ["admin", "teacher"],
  "/list/courses/(.*/forum)": ["admin", "teacher", "student"],
  "/list/courses": ["admin", "teacher", "student"],
  "/list/enrollments": ["admin"],
  "/list/achievements": ["student"],
  "/list/badges": ["admin"],
  "/list/reviews": ["student"],
  "/list/reviews/session": ["student"],
  "/list/reviews/session/summary": ["student"],
};