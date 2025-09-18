'use client';

import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Container, Box } from '@mui/material';
import RhythmGame from '@/components/RhythmGame';
import BackgroundContainer from '@/components/BackgroundContainer';

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
  //const { t, locale } = useTranslation();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BackgroundContainer>
        <Container maxWidth="lg">
          <Box sx={{ py: 4 }}>
            {/* 遊戲區域 */}
            <Box 
              sx={{ 
                animation: 'slideInUp 1s ease-out 0.2s both',
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