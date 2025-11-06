import { z } from 'zod'
import { calculateEffectiveLength } from '@/utils/mention'

export const createPostSchema = z.object({
  content: z
    .string()
    .min(1, '貼文內容不能為空')
    .refine(
      (val) => calculateEffectiveLength(val) <= 280,
      '貼文最多 280 字元（連結佔用 23 字元）'
    ),
})

export const updatePostSchema = z.object({
  content: z
    .string()
    .min(1, '貼文內容不能為空')
    .refine(
      (val) => calculateEffectiveLength(val) <= 280,
      '貼文最多 280 字元（連結佔用 23 字元）'
    ),
})

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export type CreatePostInput = z.infer<typeof createPostSchema>
export type UpdatePostInput = z.infer<typeof updatePostSchema>
export type PaginationInput = z.infer<typeof paginationSchema>

