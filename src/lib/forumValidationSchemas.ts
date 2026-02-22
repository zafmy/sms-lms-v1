import { z } from "zod";

export const threadSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be under 200 characters"),
  content: z
    .string()
    .min(1, "Content is required")
    .max(10000, "Content must be under 10,000 characters"),
  courseId: z.coerce.number().int().positive(),
  isAnonymous: z.boolean().default(false),
});

export const threadUpdateSchema = z.object({
  id: z.coerce.number().int().positive(),
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be under 200 characters"),
  content: z
    .string()
    .min(1, "Content is required")
    .max(10000, "Content must be under 10,000 characters"),
});

export const replySchema = z.object({
  content: z
    .string()
    .min(1, "Reply cannot be empty")
    .max(5000, "Reply must be under 5,000 characters"),
  threadId: z.coerce.number().int().positive(),
  parentId: z.coerce.number().int().positive().optional(),
  isAnonymous: z.boolean().default(false),
});

export const replyUpdateSchema = z.object({
  id: z.coerce.number().int().positive(),
  content: z
    .string()
    .min(1, "Reply cannot be empty")
    .max(5000, "Reply must be under 5,000 characters"),
});

export const moderationSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const pinSchema = z.object({
  id: z.coerce.number().int().positive(),
  isPinned: z.boolean(),
});

export const lockSchema = z.object({
  id: z.coerce.number().int().positive(),
  isLocked: z.boolean(),
});

export const acceptReplySchema = z.object({
  replyId: z.coerce.number().int().positive(),
  threadId: z.coerce.number().int().positive(),
});

export const voteSchema = z.object({
  replyId: z.coerce.number().int().positive(),
});

export type ThreadFormData = z.infer<typeof threadSchema>;
export type ThreadUpdateFormData = z.infer<typeof threadUpdateSchema>;
export type ReplyFormData = z.infer<typeof replySchema>;
export type ReplyUpdateFormData = z.infer<typeof replyUpdateSchema>;
