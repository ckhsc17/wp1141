import { Box, Typography, Button } from '@mui/material';
import Link from 'next/link';

export default function NotFound() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 2,
      }}
    >
      <Typography variant="h4" component="h1">
        404 - 頁面未找到
      </Typography>
      <Typography variant="body1" color="text.secondary">
        抱歉，您訪問的頁面不存在。
      </Typography>
      <Button
        component={Link}
        href="/"
        variant="contained"
        color="primary"
      >
        返回首頁
      </Button>
    </Box>
  );
}
