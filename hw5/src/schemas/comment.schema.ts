import { z } from 'zod'
import { calculateEffectiveLength } from '@/utils/mention'

export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, '留言內容不能為空')
    .refine(
      (val) => calculateEffectiveLength(val) <= 280,
      '留言最多 280 字元（連結佔用 23 字元）'
    ),
})

export type CreateCommentInput = z.infer<typeof createCommentSchema>

