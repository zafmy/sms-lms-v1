"use server";

import { revalidatePath } from "next/cache";
import prisma from "./prisma";
import { auth } from "@clerk/nextjs/server";
import { GuideSchema, GuideCategorySchema } from "./formValidationSchemas";
import { ITEM_PER_PAGE } from "./settings";

type CurrentState = { success: boolean; error: boolean; message?: string };

// --- 1. createGuide ---

export const createGuide = async (
  currentState: CurrentState,
  data: GuideSchema
) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || !role) {
    return { success: false, error: true, message: "Not authenticated" };
  }

  if (role !== "admin" && role !== "teacher") {
    return { success: false, error: true, message: "Access denied" };
  }

  let parsedTourSteps = null;
  if (data.tourSteps) {
    try {
      parsedTourSteps = JSON.parse(data.tourSteps);
    } catch {
      return {
        success: false,
        error: true,
        message: "Invalid tour steps JSON",
      };
    }
  }

  try {
    await prisma.guide.create({
      data: {
        slug: data.slug,
        categoryId: data.categoryId,
        roleAccess: data.roleAccess,
        isPublished: data.isPublished,
        order: data.order,
        tourSteps: parsedTourSteps,
        authorId: userId,
        authorRole: role,
        translations: {
          create: [
            {
              locale: "en",
              title: data.translations.en.title,
              excerpt: data.translations.en.excerpt,
              content: data.translations.en.content,
            },
            {
              locale: "ms",
              title: data.translations.ms.title,
              excerpt: data.translations.ms.excerpt,
              content: data.translations.ms.content,
            },
          ],
        },
      },
    });

    revalidatePath("/list/guides");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true, message: "Failed to create guide" };
  }
};

// --- 2. updateGuide ---

export const updateGuide = async (
  currentState: CurrentState,
  data: GuideSchema
) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || !role) {
    return { success: false, error: true, message: "Not authenticated" };
  }

  if (role !== "admin" && role !== "teacher") {
    return { success: false, error: true, message: "Access denied" };
  }

  if (!data.id) {
    return { success: false, error: true, message: "Guide ID is required" };
  }

  try {
    const guide = await prisma.guide.findUnique({
      where: { id: data.id },
      select: { authorId: true },
    });
    if (!guide) {
      return { success: false, error: true, message: "Guide not found" };
    }

    // Teacher can only update own guides
    if (role === "teacher" && guide.authorId !== userId) {
      return { success: false, error: true, message: "Access denied" };
    }

    let parsedTourSteps = undefined;
    if (data.tourSteps !== undefined) {
      if (data.tourSteps) {
        try {
          parsedTourSteps = JSON.parse(data.tourSteps);
        } catch {
          return {
            success: false,
            error: true,
            message: "Invalid tour steps JSON",
          };
        }
      } else {
        parsedTourSteps = null;
      }
    }

    await prisma.guide.update({
      where: { id: data.id },
      data: {
        slug: data.slug,
        categoryId: data.categoryId,
        roleAccess: data.roleAccess,
        isPublished: data.isPublished,
        order: data.order,
        ...(parsedTourSteps !== undefined && { tourSteps: parsedTourSteps }),
        translations: {
          upsert: [
            {
              where: { guideId_locale: { guideId: data.id, locale: "en" } },
              create: {
                locale: "en",
                title: data.translations.en.title,
                excerpt: data.translations.en.excerpt,
                content: data.translations.en.content,
              },
              update: {
                title: data.translations.en.title,
                excerpt: data.translations.en.excerpt,
                content: data.translations.en.content,
              },
            },
            {
              where: { guideId_locale: { guideId: data.id, locale: "ms" } },
              create: {
                locale: "ms",
                title: data.translations.ms.title,
                excerpt: data.translations.ms.excerpt,
                content: data.translations.ms.content,
              },
              update: {
                title: data.translations.ms.title,
                excerpt: data.translations.ms.excerpt,
                content: data.translations.ms.content,
              },
            },
          ],
        },
      },
    });

    revalidatePath("/list/guides");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true, message: "Failed to update guide" };
  }
};

// --- 3. deleteGuide ---

export const deleteGuide = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || !role) {
    return { success: false, error: true, message: "Not authenticated" };
  }

  if (role !== "admin" && role !== "teacher") {
    return { success: false, error: true, message: "Access denied" };
  }

  try {
    const guide = await prisma.guide.findUnique({
      where: { id },
      select: { authorId: true },
    });
    if (!guide) {
      return { success: false, error: true, message: "Guide not found" };
    }

    // Teacher can only delete own guides
    if (role === "teacher" && guide.authorId !== userId) {
      return { success: false, error: true, message: "Access denied" };
    }

    await prisma.guide.delete({
      where: { id },
    });

    revalidatePath("/list/guides");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true, message: "Failed to delete guide" };
  }
};

// --- 4. createCategory ---

export const createCategory = async (
  currentState: CurrentState,
  data: GuideCategorySchema
) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || role !== "admin") {
    return { success: false, error: true, message: "Access denied" };
  }

  try {
    await prisma.guideCategory.create({
      data: {
        slug: data.slug,
        nameEn: data.nameEn,
        nameMs: data.nameMs,
        order: data.order,
      },
    });

    revalidatePath("/list/guides");
    return { success: true, error: false };
  } catch (err) {
    return {
      success: false,
      error: true,
      message: "Failed to create category",
    };
  }
};

// --- 5. updateCategory ---

export const updateCategory = async (
  currentState: CurrentState,
  data: GuideCategorySchema
) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || role !== "admin") {
    return { success: false, error: true, message: "Access denied" };
  }

  if (!data.id) {
    return {
      success: false,
      error: true,
      message: "Category ID is required",
    };
  }

  try {
    await prisma.guideCategory.update({
      where: { id: data.id },
      data: {
        slug: data.slug,
        nameEn: data.nameEn,
        nameMs: data.nameMs,
        order: data.order,
      },
    });

    revalidatePath("/list/guides");
    return { success: true, error: false };
  } catch (err) {
    return {
      success: false,
      error: true,
      message: "Failed to update category",
    };
  }
};

// --- 6. deleteCategory ---

export const deleteCategory = async (
  currentState: CurrentState,
  data: { id: string }
) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || role !== "admin") {
    return { success: false, error: true, message: "Access denied" };
  }

  try {
    const guidesCount = await prisma.guide.count({
      where: { categoryId: data.id },
    });
    if (guidesCount > 0) {
      return {
        success: false,
        error: true,
        message: "Cannot delete category with existing guides",
      };
    }

    await prisma.guideCategory.delete({
      where: { id: data.id },
    });

    revalidatePath("/list/guides");
    return { success: true, error: false };
  } catch (err) {
    return {
      success: false,
      error: true,
      message: "Failed to delete category",
    };
  }
};

// --- 7. getGuides ---

export const getGuides = async (params: {
  role: string;
  userId: string;
  search?: string;
  categoryId?: string;
  page?: number;
}) => {
  const { role, userId, search, categoryId, page = 1 } = params;

  const publishedFilter: Record<string, unknown> = {};

  if (role === "admin") {
    // Admin sees all including unpublished
  } else if (role === "teacher") {
    // Teacher sees published + own unpublished
    publishedFilter.OR = [
      { isPublished: true },
      { isPublished: false, authorId: userId },
    ];
  } else {
    // Student/Parent sees only published
    publishedFilter.isPublished = true;
  }

  const roleFilter = {
    roleAccess: { has: role },
  };

  const searchFilter: Record<string, unknown> = {};
  if (search) {
    searchFilter.translations = {
      some: {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { content: { contains: search, mode: "insensitive" } },
        ],
      },
    };
  }

  const categoryFilter: Record<string, unknown> = {};
  if (categoryId) {
    categoryFilter.categoryId = categoryId;
  }

  const where = {
    ...roleFilter,
    ...publishedFilter,
    ...searchFilter,
    ...categoryFilter,
  };

  const [data, count] = await Promise.all([
    prisma.guide.findMany({
      where,
      include: {
        translations: true,
        category: true,
      },
      orderBy: [{ category: { order: "asc" } }, { order: "asc" }],
      take: ITEM_PER_PAGE,
      skip: (page - 1) * ITEM_PER_PAGE,
    }),
    prisma.guide.count({ where }),
  ]);

  return { data, count };
};

// --- 8. getGuideById ---

export const getGuideById = async (
  id: string,
  role: string,
  userId: string
) => {
  const guide = await prisma.guide.findUnique({
    where: { id },
    include: {
      translations: true,
      category: true,
    },
  });

  if (!guide) return null;

  // Check role access
  if (!guide.roleAccess.includes(role)) {
    return null;
  }

  // Unpublished: only visible to admin or author
  if (!guide.isPublished) {
    if (role !== "admin" && guide.authorId !== userId) {
      return null;
    }
  }

  return guide;
};
