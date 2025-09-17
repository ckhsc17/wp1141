'use client';

import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Container, Typography, Box } from '@mui/material';
import RhythmGame from '@/components/RhythmGame';
import { useTranslation } from '@/hooks/useTranslation';

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

export default function EnglishHome() {
  const { t, locale } = useTranslation();

  // 根據語言設置字體樣式
  const fontStyle = {
    fontFamily: locale === 'en' ? '"Times New Roman", serif' : 'inherit',
  };

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
            sx={{ mb: 4, fontWeight: 'bold', ...fontStyle }}
          >
            {t('common.title')}
          </Typography>
          
          <Typography 
            variant="h6" 
            align="center" 
            color="text.secondary" 
            sx={{ mb: 6, ...fontStyle }}
          >
            {t('common.description')}
          </Typography>

          <RhythmGame />
        </Box>
      </Container>
    </ThemeProvider>
  );
}
