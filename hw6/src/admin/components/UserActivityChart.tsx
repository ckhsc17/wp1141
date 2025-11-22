'use client';

import { Card, CardContent, Typography } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface DailyActivity {
  date: string;
  conversations: number;
  users: number;
}

interface UserActivityChartProps {
  data: DailyActivity[];
}

export function UserActivityChart({ data }: UserActivityChartProps) {
  const chartData = data.map((item) => ({
    date: format(new Date(item.date), 'MM/dd'),
    conversations: item.conversations,
    users: item.users,
  }));

  return (
    <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
          每日活動趨勢
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="conversations"
              stroke="#2e7d32"
              strokeWidth={2}
              name="對話數"
            />
            <Line
              type="monotone"
              dataKey="users"
              stroke="#1976d2"
              strokeWidth={2}
              name="活躍使用者"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

