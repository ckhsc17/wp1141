'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, Typography, Grid, Select, MenuItem, FormControl, InputLabel, Alert } from '@mui/material';
import { StatsCard } from '../components/StatsCard';
import { IntentChart } from '../components/IntentChart';
import { UserActivityChart } from '../components/UserActivityChart';
import { subDays, startOfMonth, endOfMonth } from 'date-fns';

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

export function AnalyticsView() {
  const [dateRange, setDateRange] = useState<'7days' | '30days' | 'month' | 'all'>('30days');

  const dateRangeObj = useMemo(() => {
    if (dateRange === 'all') {
      return undefined;
    }
    
    const now = new Date();
    switch (dateRange) {
      case '7days':
        return {
          startDate: subDays(now, 7),
          endDate: now,
        };
      case '30days':
        return {
          startDate: subDays(now, 30),
          endDate: now,
        };
      case 'month':
        return {
          startDate: startOfMonth(now),
          endDate: endOfMonth(now),
        };
      default:
        return undefined;
    }
  }, [dateRange]);

  // Use ISO strings in queryKey to ensure stable references
  const queryKey = useMemo(() => {
    if (dateRange === 'all') {
      return ['analytics', 'all'];
    }
    return [
      'analytics',
      dateRangeObj?.startDate?.toISOString(),
      dateRangeObj?.endDate?.toISOString(),
    ];
  }, [dateRange, dateRangeObj]);

  const { data, isLoading, error } = useQuery<AnalyticsData>({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRangeObj?.startDate) {
        params.set('startDate', dateRangeObj.startDate.toISOString());
      }
      if (dateRangeObj?.endDate) {
        params.set('endDate', dateRangeObj.endDate.toISOString());
      }
      const res = await fetch(`/api/admin/analytics?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch analytics');
      return res.json();
    },
    enabled: true, // Always enabled, even for 'all' case
  });

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          統計分析
        </Typography>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>時間範圍</InputLabel>
          <Select
            value={dateRange}
            label="時間範圍"
            onChange={(e) => setDateRange(e.target.value as any)}
          >
            <MenuItem value="7days">最近 7 天</MenuItem>
            <MenuItem value="30days">最近 30 天</MenuItem>
            <MenuItem value="month">本月</MenuItem>
            <MenuItem value="all">全部</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          載入統計資料時發生錯誤：{error instanceof Error ? error.message : '未知錯誤'}
        </Alert>
      ) : null}

      {isLoading ? (
        <Typography>載入中...</Typography>
      ) : data ? (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <StatsCard
                title="總對話數"
                value={data.conversationStats.totalConversations || 0}
                color="success"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <StatsCard
                title="總使用者數"
                value={data.userStats.totalUsers || 0}
                subtitle={`活躍: ${data.userStats.activeUsers || 0}`}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <StatsCard
                title="活躍使用者"
                value={data.userStats.activeUsers || 0}
              />
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <IntentChart data={data.intentDistribution || []} />
            </Grid>
            <Grid item xs={12} md={6}>
              <UserActivityChart data={data.dailyActivity || []} />
            </Grid>
          </Grid>
        </>
      ) : null}
    </Box>
  );
}

