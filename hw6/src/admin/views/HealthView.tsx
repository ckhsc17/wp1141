'use client';

import { useQuery } from '@tanstack/react-query';
import { Box, Typography } from '@mui/material';
import { HealthStatus } from '../components/HealthStatus';

interface HealthData {
  health: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    database: {
      connected: boolean;
      responseTime?: number;
    };
    timestamp: string;
  };
  performance: {
    averageResponseTime: number;
    errorRate: number;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
  };
}

export function HealthView() {
  const { data, isLoading } = useQuery<HealthData>({
    queryKey: ['health'],
    queryFn: async () => {
      const res = await fetch('/api/admin/health');
      if (!res.ok) throw new Error('Failed to fetch health status');
      return res.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>載入中...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        健康監控
      </Typography>
      {data && (
        <HealthStatus
          status={data.health.status}
          database={data.health.database}
          performance={{
            averageResponseTime: data.performance.averageResponseTime,
            errorRate: data.performance.errorRate,
            totalRequests: data.performance.totalRequests,
          }}
        />
      )}
    </Box>
  );
}

