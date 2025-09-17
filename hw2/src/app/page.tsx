'use client';

import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Container, Typography, Box } from '@mui/material';
import RhythmGame from '@/components/RhythmGame';
import BackgroundContainer from '@/components/BackgroundContainer';
import GlassCard from '@/components/GlassCard';
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

export default function Home() {
  const { t, locale } = useTranslation();

  // 根據語言設置字體樣式
  const fontStyle = {
    fontFamily: locale === 'en' ? '"Times New Roman", serif' : 'inherit',
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BackgroundContainer>
        <Container maxWidth="lg">
          <Box sx={{ py: 4 }}>
            {/* 標題卡片 */}
            <GlassCard 
              glassLevel={2} 
              animated={true} 
              animationDelay={0.2}
              sx={{ mb: 4, textAlign: 'center' }}
            >
              <Box sx={{ p: 3 }}>
                <Typography 
                  variant="h3" 
                  component="h1" 
                  gutterBottom 
                  sx={{ 
                    fontWeight: 'bold', 
                    color: 'rgba(0, 0, 0, 0.8)',
                    textShadow: '0 2px 4px rgba(255, 255, 255, 0.3)',
                    ...fontStyle 
                  }}
                >
                  {t('common.title')}
                </Typography>
                
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: 'rgba(0, 0, 0, 0.7)',
                    textShadow: '0 1px 2px rgba(255, 255, 255, 0.2)',
                    ...fontStyle 
                  }}
                >
                  {t('common.description')}
                </Typography>
              </Box>
            </GlassCard>

            {/* 遊戲區域 */}
            <Box 
              sx={{ 
                animation: 'slideInUp 1s ease-out 0.5s both',
                '@keyframes slideInUp': {
                  '0%': {
                    opacity: 0,
                    transform: 'translateY(40px)',
                  },
                  '100%': {
                    opacity: 1,
                    transform: 'translateY(0)',
                  },
                },
              }}
            >
              <RhythmGame />
            </Box>
          </Box>
        </Container>
      </BackgroundContainer>
    </ThemeProvider>
  );
}