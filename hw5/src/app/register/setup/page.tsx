'use client'

import { useState, useEffect } from 'react'
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
  IconButton,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import axios from 'axios'

const setupUserIdSchema = z.object({
  userId: z
    .string()
    .min(4, 'UserID 至少 4 個字元')
    .max(20, 'UserID 最多 20 個字元')
    .regex(/^[a-zA-Z0-9_]+$/, 'UserID 只能包含英數字與底線'),
})

type SetupUserIdInput = z.infer<typeof setupUserIdSchema>

// 產生建議的 UserID
function generateSuggestedUserId(email: string | null | undefined): string {
  if (!email) {
    return `user_${Math.random().toString(36).substr(2, 8)}`
  }
  
  // 取 email 的前綴（@ 前面的部分），移除非英數字
  const prefix = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').substring(0, 10)
  
  // 產生 5 位數亂碼
  const randomChars = Math.random().toString(36).substr(2, 5)
  
  // 組合並確保總長度不超過 20
  let userId = `${prefix}_${randomChars}`
  if (userId.length > 20) {
    userId = userId.substring(0, 20)
  }
  
  // 確保至少 4 個字元
  if (userId.length < 4) {
    userId = userId + Math.random().toString(36).substr(2, 4 - userId.length)
  }
  
  return userId
}

export default function SetupUserIdPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestedUserId, setSuggestedUserId] = useState('')
  const [regenerateCount, setRegenerateCount] = useState(0)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SetupUserIdInput>({
    resolver: zodResolver(setupUserIdSchema),
  })

  const watchedUserId = watch('userId')

  // 初始化建議的 UserID
  useEffect(() => {
    if (session?.user?.email) {
      const suggested = generateSuggestedUserId(session.user.email)
      setSuggestedUserId(suggested)
      setValue('userId', suggested)
    }
  }, [session, setValue, regenerateCount])

  // 檢查是否需要重定向
  useEffect(() => {
    if (status === 'unauthenticated' || (status === 'authenticated' && session?.user?.userId)) {
      router.push('/')
    }
  }, [status, session, router])

  // 如果未登入，顯示 loading
  if (status === 'loading') {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Box display="flex" justifyContent="center">
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  // 如果未登入或已有 userId，顯示 loading（redirecting）
  if (status === 'unauthenticated' || (status === 'authenticated' && session?.user?.userId)) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Box display="flex" justifyContent="center">
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  const handleRegenerate = () => {
    setRegenerateCount(prev => prev + 1)
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

      // 更新 session
      await update()
      
      // 重新導向到首頁
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
          <Box sx={{ position: 'relative', mb: 3 }}>
            <TextField
              fullWidth
              label="UserID"
              placeholder="例如: john_doe_123"
              {...register('userId')}
              error={!!errors.userId}
              helperText={errors.userId?.message}
              disabled={isSubmitting || isChecking}
              inputProps={{
                maxLength: 20,
                pattern: '[a-zA-Z0-9_]+',
              }}
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={handleRegenerate}
                    edge="end"
                    disabled={isSubmitting || isChecking}
                    title="重新產生 UserID"
                    sx={{ mr: -1 }}
                  >
                    <RefreshIcon />
                  </IconButton>
                ),
              }}
            />
          </Box>

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
  )
}

