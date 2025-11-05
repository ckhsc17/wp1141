'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Divider,
} from '@mui/material'
import WarningIcon from '@mui/icons-material/Warning'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import { Metadata } from 'next'

export default function DeleteAccountPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [openDialog, setOpenDialog] = useState(false)
  const [confirmationText, setConfirmationText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const confirmationWord = 'DELETE'
  const isConfirmed = confirmationText === confirmationWord

  const handleDeleteAccount = async () => {
    if (!isConfirmed) {
      return
    }

    setIsDeleting(true)
    setError(null)

    try {
      const response = await fetch('/api/users/delete', {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '刪除失敗')
      }

      // 登出並重定向到首頁
      await signOut({ redirect: false })
      router.push('/?deleted=true')
    } catch (err) {
      setError(err instanceof Error ? err.message : '刪除帳號時發生錯誤')
      setIsDeleting(false)
    }
  }

  // 如果未登入，顯示提示
  if (status === 'loading') {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography>載入中...</Typography>
      </Container>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={0} sx={{ p: 4, border: '1px solid', borderColor: 'divider' }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            請先登入以刪除您的帳號
          </Alert>
          <Button variant="contained" onClick={() => router.push('/')}>
            返回首頁
          </Button>
        </Paper>
      </Container>
    )
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={0} sx={{ p: 4, border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <WarningIcon color="error" sx={{ fontSize: 40, mr: 2 }} />
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            刪除帳號
          </Typography>
        </Box>

        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
            警告：此操作無法復原
          </Typography>
          <Typography variant="body2">
            刪除您的帳號將會永久刪除：
          </Typography>
          <Box component="ul" sx={{ mt: 1, mb: 0, pl: 3 }}>
            <li>您的個人資料資訊</li>
            <li>您發布的所有貼文</li>
            <li>您的所有評論</li>
            <li>您的按讚記錄</li>
            <li>您的草稿</li>
            <li>您的追蹤和粉絲關係</li>
            <li>所有其他相關資料</li>
          </Box>
        </Alert>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            如何刪除您的資料
          </Typography>
          <Typography variant="body1" paragraph>
            如果您想刪除您的帳號和所有相關資料，請點擊下方的「刪除我的帳號」按鈕。
            系統會要求您確認此操作。
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Facebook 用戶
          </Typography>
          <Typography variant="body1" paragraph>
            如果您使用 Facebook 登入，您也可以透過 Facebook 的設定頁面請求刪除資料。
            我們會處理來自 Facebook 的資料刪除請求。
          </Typography>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Box sx={{ textAlign: 'center' }}>
          <Button
            variant="contained"
            color="error"
            size="large"
            startIcon={<DeleteForeverIcon />}
            onClick={() => setOpenDialog(true)}
            sx={{ mb: 2 }}
          >
            刪除我的帳號
          </Button>
          <Box>
            <Button
              variant="text"
              onClick={() => router.push('/')}
              sx={{ mr: 2 }}
            >
              取消
            </Button>
          </Box>
        </Box>

        {/* 確認對話框 */}
        <Dialog
          open={openDialog}
          onClose={() => !isDeleting && setOpenDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <WarningIcon color="error" sx={{ mr: 1 }} />
              確認刪除帳號
            </Box>
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
              此操作無法復原。所有您的資料將被永久刪除。
            </DialogContentText>
            <DialogContentText sx={{ mb: 2 }}>
              請在下方輸入 <strong>{confirmationWord}</strong> 以確認刪除：
            </DialogContentText>
            <TextField
              autoFocus
              fullWidth
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder={confirmationWord}
              disabled={isDeleting}
              error={confirmationText !== '' && !isConfirmed}
              helperText={
                confirmationText !== '' && !isConfirmed
                  ? '請輸入正確的確認文字'
                  : ''
              }
            />
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setOpenDialog(false)
                setConfirmationText('')
                setError(null)
              }}
              disabled={isDeleting}
            >
              取消
            </Button>
            <Button
              onClick={handleDeleteAccount}
              color="error"
              variant="contained"
              disabled={!isConfirmed || isDeleting}
              startIcon={isDeleting ? undefined : <DeleteForeverIcon />}
            >
              {isDeleting ? '刪除中...' : '確認刪除'}
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  )
}

