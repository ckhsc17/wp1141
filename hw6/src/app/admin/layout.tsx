'use client';

import { QueryProvider } from '@/admin/providers/QueryProvider';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppBar, Toolbar, Typography, Container, Box, Tabs, Tab } from '@mui/material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2e7d32',
    },
    success: {
      main: '#2e7d32',
    },
  },
});

function NavigationTabs() {
  const pathname = usePathname();
  
  const tabs = [
    { label: '總覽', path: '/admin' },
    { label: '對話紀錄', path: '/admin/conversations' },
    { label: '統計分析', path: '/admin/analytics' },
    { label: '健康監控', path: '/admin/health' },
  ];

  // 計算當前選中的 tab
  // 對於 /admin，只匹配精確路徑
  // 對於其他路徑，匹配以該路徑開頭的路徑
  const currentTab = tabs.findIndex((tab) => {
    if (tab.path === '/admin') {
      // 總覽頁面只匹配精確的 /admin
      return pathname === '/admin';
    } else {
      // 其他頁面匹配以該路徑開頭的路徑
      return pathname?.startsWith(tab.path);
    }
  });

  return (
    <Tabs
      value={currentTab >= 0 ? currentTab : 0}
      sx={{
        borderBottom: 1,
        borderColor: 'divider',
        '& .MuiTabs-indicator': {
          backgroundColor: '#2e7d32',
          height: 3,
        },
      }}
    >
      {tabs.map((tab) => (
        <Tab
          key={tab.path}
          label={tab.label}
          component={Link}
          href={tab.path}
          sx={{
            textTransform: 'none',
            '&.Mui-selected': {
              color: '#2e7d32',
            },
          }}
        />
      ))}
    </Tabs>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <AppBar position="static" sx={{ backgroundColor: '#2e7d32' }}>
            <Toolbar>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
                <Image
                  src="/favicon.ico"
                  alt="Booboo"
                  width={32}
                  height={32}
                  style={{ borderRadius: '4px' }}
                />
                <Typography variant="h6" component="div">
                  Booboo Admin Dashboard
                </Typography>
              </Box>
            </Toolbar>
          </AppBar>
          <NavigationTabs />
          <Container maxWidth="xl" sx={{ flexGrow: 1, py: 3 }}>
            {children}
          </Container>
        </Box>
      </ThemeProvider>
    </QueryProvider>
  );
}

