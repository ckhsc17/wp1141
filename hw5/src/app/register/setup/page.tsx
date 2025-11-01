'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import axios from 'axios'
import AppBar from '@/components/AppBar'

const setupUserIdSchema = z.object({
  userId: z
    .string()
    .min(4, 'UserID 至少 4 個字元')
    .max(20, 'UserID 最多 20 個字元')
    .regex(/^[a-zA-Z0-9_]+$/, 'UserID 只能包含英數字與底線'),
})

type SetupUserIdInput = z.infer<typeof setupUserIdSchema>

export default function SetupUserIdPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SetupUserIdInput>({
    resolver: zodResolver(setupUserIdSchema),
  })

  // 如果未登入，重定向到首頁
  if (status === 'loading') {
    return (
      <>
        <AppBar />
        <Container maxWidth="sm" sx={{ py: 8 }}>
          <Box display="flex" justifyContent="center">
            <CircularProgress />
          </Box>
        </Container>
      </>
    )
  }

  if (status === 'unauthenticated') {
    router.push('/')
    return null
  }

  // 如果已有 userID，重定向到首頁
  if (session?.user?.userId) {
    router.push('/')
    return null
  }

  const onSubmit = async (data: SetupUserIdInput) => {
    try {
      setIsChecking(true)
      setError(null)

      // 檢查 userID 是否已被使用
      const checkResponse = await axios.get(`/api/users/${data.userId}/check`)
      if (!checkResponse.data.available) {
        setError('此 UserID 已被使用，請選擇其他 UserID')
        setIsChecking(false)
        return
      }

      // 設定 userID
      await axios.post('/api/users/setup', { userId: data.userId })

      // 重新整理 session
      router.refresh()
      router.push('/')
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || '設定失敗，請稍後再試')
      } else {
        setError('發生未知錯誤')
      }
      setIsChecking(false)
    }
  }

  return (
    <>
      <AppBar />
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper
          elevation={0}
          sx={{
            p: 4,
            backgroundColor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 1 }}>
            設定您的 UserID
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            UserID 是您的唯一識別碼，其他人可以使用 @your_userid 找到您
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <TextField
              fullWidth
              label="UserID"
              placeholder="例如: john_doe_123"
              {...register('userId')}
              error={!!errors.userId}
              helperText={errors.userId?.message}
              sx={{ mb: 3 }}
              disabled={isSubmitting || isChecking}
              inputProps={{
                maxLength: 20,
                pattern: '[a-zA-Z0-9_]+',
              }}
            />

            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary">
                規則：
              </Typography>
              <Typography variant="caption" color="text.secondary" component="div">
                • 4-20 個字元
              </Typography>
              <Typography variant="caption" color="text.secondary" component="div">
                • 只能包含英文字母、數字與底線
              </Typography>
              <Typography variant="caption" color="text.secondary" component="div">
                • UserID 一旦設定後無法修改
              </Typography>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isSubmitting || isChecking}
              sx={{ mb: 2 }}
            >
              {isSubmitting || isChecking ? (
                <CircularProgress size={24} sx={{ mr: 1 }} />
              ) : null}
              {isChecking ? '檢查中...' : isSubmitting ? '設定中...' : '完成設定'}
            </Button>
          </form>
        </Paper>
      </Container>
    </>
  )
}

