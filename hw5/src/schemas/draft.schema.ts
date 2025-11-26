import { z } from 'zod'

export const draftSchema = z.object({
  content: z
    .string()
    .max(280, '草稿最多 280 字元'),
})

export type DraftInput = z.infer<typeof draftSchema>



