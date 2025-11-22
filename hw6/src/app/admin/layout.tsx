'use client';

import { QueryProvider } from '@/admin/providers/QueryProvider';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppBar, Toolbar, Typography, Container, Box, Tabs, Tab } from '@mui/material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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

  const currentTab = tabs.findIndex((tab) => pathname === tab.path || pathname?.startsWith(tab.path + '/'));

  return (
    <Tabs
      value={currentTab >= 0 ? currentTab : 0}
      sx={{ borderBottom: 1, borderColor: 'divider' }}
    >
      {tabs.map((tab) => (
        <Tab
          key={tab.path}
          label={tab.label}
          component={Link}
          href={tab.path}
          sx={{ textTransform: 'none' }}
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
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                Booboo Admin Dashboard
              </Typography>
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

