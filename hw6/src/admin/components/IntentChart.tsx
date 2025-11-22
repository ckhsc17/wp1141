'use client';

import { Card, CardContent, Typography, Box } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface IntentDistribution {
  intent: string;
  count: number;
  percentage: number;
}

interface IntentChartProps {
  data: IntentDistribution[];
}

const COLORS = ['#1976d2', '#2e7d32', '#ed6c02', '#d32f2f', '#9c27b0', '#00acc1', '#f57c00'];

const INTENT_LABELS: Record<string, string> = {
  insight: '靈感',
  knowledge: '知識',
  memory: '記憶',
  music: '音樂',
  life: '生活',
  link: '連結',
  feedback: '回饋',
  recommendation: '推薦',
  chat_history: '對話紀錄',
  todo: '待辦',
  other: '其他',
};

export function IntentChart({ data }: IntentChartProps) {
  const chartData = data.map((item) => ({
    name: INTENT_LABELS[item.intent] || item.intent,
    value: item.count,
    percentage: item.percentage,
  }));

  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
          Intent 分類分布
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ percentage }) => `${percentage.toFixed(1)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <Box sx={{ mt: 2, width: '100%' }}>
            <Typography variant="body2" sx={{ textAlign: 'center', mb: 1, fontWeight: 'bold' }}>
              總數: {total}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
              {chartData.map((item, index) => (
                <Box
                  key={item.name}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    fontSize: '0.875rem',
                  }}
                >
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      backgroundColor: COLORS[index % COLORS.length],
                      borderRadius: '2px',
                    }}
                  />
                  <Typography variant="body2">
                    {item.name}: {item.percentage.toFixed(1)}%
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

