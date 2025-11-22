'use client';

import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  Grid,
} from '@mui/material';

interface ConversationFiltersProps {
  userId: string;
  startDate: Date | null;
  endDate: Date | null;
  search: string;
  onUserIdChange: (value: string) => void;
  onStartDateChange: (value: Date | null) => void;
  onEndDateChange: (value: Date | null) => void;
  onSearchChange: (value: string) => void;
  onReset: () => void;
}

export function ConversationFilters({
  userId,
  startDate,
  endDate,
  search,
  onUserIdChange,
  onStartDateChange,
  onEndDateChange,
  onSearchChange,
  onReset,
}: ConversationFiltersProps) {
  return (
    <Paper sx={{ p: 3, mb: 3, borderRadius: 2, boxShadow: 2 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
        篩選條件
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="使用者 ID"
            value={userId}
            onChange={(e) => onUserIdChange(e.target.value)}
            placeholder="輸入使用者 ID"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="開始日期"
            type="date"
            value={startDate ? startDate.toISOString().split('T')[0] : ''}
            onChange={(e) => onStartDateChange(e.target.value ? new Date(e.target.value) : null)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="結束日期"
            type="date"
            value={endDate ? endDate.toISOString().split('T')[0] : ''}
            onChange={(e) => onEndDateChange(e.target.value ? new Date(e.target.value) : null)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="搜尋內容"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="搜尋標題或內容"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', height: '100%' }}>
            <Button variant="outlined" onClick={onReset}>
              重置
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}

