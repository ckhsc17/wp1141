import { z } from 'zod'

export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, '留言內容不能為空')
    .max(280, '留言最多 280 字元'),
})

export type CreateCommentInput = z.infer<typeof createCommentSchema>

