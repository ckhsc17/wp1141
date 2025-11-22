'use client';

import { Card, CardContent, Typography, Box } from '@mui/material';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: 'primary' | 'success' | 'error' | 'warning';
}

export function StatsCard({ title, value, subtitle, color = 'primary' }: StatsCardProps) {
  const colorMap = {
    primary: '#1976d2',
    success: '#2e7d32',
    error: '#d32f2f',
    warning: '#ed6c02',
  };

  const bgColor = color === 'success' ? '#2e7d32' : '#ffffff';

  return (
    <Card
      sx={{
        backgroundColor: bgColor,
        color: color === 'success' ? '#ffffff' : '#000000',
        borderRadius: 2,
        boxShadow: 2,
        minHeight: 120,
      }}
    >
      <CardContent>
        <Typography
          variant="body2"
          sx={{
            fontSize: '0.875rem',
            opacity: color === 'success' ? 0.9 : 0.7,
            mb: 1,
          }}
        >
          {title}
        </Typography>
        <Typography
          variant="h4"
          sx={{
            fontSize: '2rem',
            fontWeight: 'bold',
            mb: subtitle ? 1 : 0,
          }}
        >
          {value}
        </Typography>
        {subtitle && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Typography variant="body2" sx={{ opacity: color === 'success' ? 0.9 : 0.7 }}>
              {subtitle}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

