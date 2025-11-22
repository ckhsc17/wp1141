'use client';

import { useQuery } from '@tanstack/react-query';
import { Box, Typography, Grid, CircularProgress } from '@mui/material';
import { StatsCard } from '@/admin/components/StatsCard';
import { IntentChart } from '@/admin/components/IntentChart';
import { UserActivityChart } from '@/admin/components/UserActivityChart';

interface AnalyticsData {
  userStats: {
    totalUsers: number;
    activeUsers: number;
  };
  conversationStats: {
    totalConversations: number;
    dailyConversations: Array<{ date: string; count: number }>;
  };
  intentDistribution: Array<{
    intent: string;
    count: number;
    percentage: number;
  }>;
  dailyActivity: Array<{
    date: string;
    conversations: number;
    users: number;
  }>;
}

export default function AdminDashboard() {
  const { data, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['analytics', 'overview'],
    queryFn: async () => {
      const res = await fetch('/api/admin/analytics');
      if (!res.ok) throw new Error('Failed to fetch analytics');
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        總覽
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <StatsCard
            title="總對話數"
            value={data?.conversationStats.totalConversations || 0}
            color="success"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatsCard
            title="總使用者數"
            value={data?.userStats.totalUsers || 0}
            subtitle={`活躍: ${data?.userStats.activeUsers || 0}`}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatsCard
            title="活躍使用者"
            value={data?.userStats.activeUsers || 0}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <IntentChart data={data?.intentDistribution || []} />
        </Grid>
        <Grid item xs={12} md={6}>
          <UserActivityChart data={data?.dailyActivity || []} />
        </Grid>
      </Grid>
    </Box>
  );
}

