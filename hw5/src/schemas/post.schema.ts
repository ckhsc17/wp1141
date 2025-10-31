import { z } from 'zod'

export const createPostSchema = z.object({
  content: z
    .string()
    .min(1, '貼文內容不能為空')
    .max(280, '貼文最多 280 字元'),
})

export const updatePostSchema = z.object({
  content: z
    .string()
    .min(1, '貼文內容不能為空')
    .max(280, '貼文最多 280 字元'),
})

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export type CreatePostInput = z.infer<typeof createPostSchema>
export type UpdatePostInput = z.infer<typeof updatePostSchema>
export type PaginationInput = z.infer<typeof paginationSchema>

