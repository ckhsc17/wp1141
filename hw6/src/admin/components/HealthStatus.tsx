'use client';

import { Card, CardContent, Typography, Box, Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';

interface HealthStatusProps {
  status: 'healthy' | 'degraded' | 'unhealthy';
  database: {
    connected: boolean;
    responseTime?: number;
  };
  performance?: {
    averageResponseTime: number;
    errorRate: number;
    totalRequests: number;
  };
}

export function HealthStatus({ status, database, performance }: HealthStatusProps) {
  const statusConfig = {
    healthy: {
      color: 'success' as const,
      icon: <CheckCircleIcon />,
      label: '正常',
    },
    degraded: {
      color: 'warning' as const,
      icon: <WarningIcon />,
      label: '降級',
    },
    unhealthy: {
      color: 'error' as const,
      icon: <ErrorIcon />,
      label: '異常',
    },
  };

  const config = statusConfig[status];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              系統狀態
            </Typography>
            <Chip
              icon={config.icon}
              label={config.label}
              color={config.color}
              sx={{ fontWeight: 'bold' }}
            />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                資料庫連線:
              </Typography>
              <Chip
                label={database.connected ? '已連線' : '未連線'}
                color={database.connected ? 'success' : 'error'}
                size="small"
              />
            </Box>
            {database.responseTime !== undefined && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  回應時間:
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {database.responseTime}ms
                </Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      {performance && (
        <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              效能指標
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  平均回應時間:
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {performance.averageResponseTime.toFixed(2)}ms
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  錯誤率:
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {(performance.errorRate * 100).toFixed(2)}%
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  總請求數:
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {performance.totalRequests}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

