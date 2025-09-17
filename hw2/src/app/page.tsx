'use client';

import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Container, Typography, Box } from '@mui/material';
import RhythmGame from '@/components/RhythmGame';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

export default function Home() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Typography 
            variant="h3" 
            component="h1" 
            gutterBottom 
            align="center"
            sx={{ mb: 4, fontWeight: 'bold' }}
          >
            🎵 線上音樂練習 & 創作網站
          </Typography>
          
          <Typography 
            variant="h6" 
            align="center" 
            color="text.secondary" 
            sx={{ mb: 6 }}
          >
            按照節奏點擊空白鍵，測試你的音樂感！
          </Typography>

          <RhythmGame />
        </Box>
      </Container>
    </ThemeProvider>
  );
}