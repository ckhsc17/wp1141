import { z } from 'zod'

// UserID 驗證規則：4-20 字元，英數字與底線
export const userIdSchema = z
  .string()
  .min(4, 'UserID 至少 4 個字元')
  .max(20, 'UserID 最多 20 個字元')
  .regex(/^[a-zA-Z0-9_]+$/, 'UserID 只能包含英數字與底線')

export const createUserIdSchema = z.object({
  userId: userIdSchema,
})

export const updateProfileSchema = z.object({
  name: z.string().min(1, '名稱不能為空').max(50, '名稱最多 50 字元'),
  bio: z.string().max(200, '簡介最多 200 字元').optional(),
})

export type CreateUserIdInput = z.infer<typeof createUserIdSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

