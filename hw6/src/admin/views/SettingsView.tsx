'use client';

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

interface User {
  id: string;
  displayName?: string;
  isVIP: boolean;
  tokenLimit: number | null;
  createdAt: Date;
}

interface Settings {
  regularTokenLimit: number;
  vipTokenLimit: number;
}

export function SettingsView() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [regularLimit, setRegularLimit] = useState<string>('');
  const [vipLimit, setVipLimit] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch settings
  const { data: settings, isLoading: settingsLoading } = useQuery<Settings>({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await fetch('/api/admin/settings');
      if (!res.ok) throw new Error('Failed to fetch settings');
      return res.json();
    },
  });

  // Update local state when settings are fetched
  useEffect(() => {
    if (settings) {
      setRegularLimit(String(settings.regularTokenLimit));
      setVipLimit(String(settings.vipTokenLimit));
    }
  }, [settings]);

  // Search users
  const { data: usersData, isLoading: usersLoading } = useQuery<{ users: User[] }>({
    queryKey: ['users', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return { users: [] };
      const res = await fetch(`/api/admin/users?query=${encodeURIComponent(searchQuery)}&limit=20`);
      if (!res.ok) throw new Error('Failed to search users');
      return res.json();
    },
    enabled: searchQuery.trim().length > 0,
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: { regularTokenLimit: number; vipTokenLimit: number }) => {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update settings');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setMessage({ type: 'success', text: '設定已更新' });
      setTimeout(() => setMessage(null), 3000);
    },
    onError: () => {
      setMessage({ type: 'error', text: '更新設定失敗' });
      setTimeout(() => setMessage(null), 3000);
    },
  });

  // Update user VIP mutation
  const updateUserVIPMutation = useMutation({
    mutationFn: async ({ userId, isVIP }: { userId: string; isVIP: boolean }) => {
      const res = await fetch(`/api/admin/users?id=${encodeURIComponent(userId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVIP }),
      });
      if (!res.ok) throw new Error('Failed to update user');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setMessage({ type: 'success', text: '用戶狀態已更新' });
      setTimeout(() => setMessage(null), 3000);
    },
    onError: () => {
      setMessage({ type: 'error', text: '更新用戶狀態失敗' });
      setTimeout(() => setMessage(null), 3000);
    },
  });

  // Update user token limit mutation
  const updateUserTokenLimitMutation = useMutation({
    mutationFn: async ({ userId, tokenLimit }: { userId: string; tokenLimit: number | null }) => {
      const res = await fetch(`/api/admin/users?id=${encodeURIComponent(userId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenLimit }),
      });
      if (!res.ok) throw new Error('Failed to update user token limit');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setMessage({ type: 'success', text: '用戶 Token 上限已更新' });
      setTimeout(() => setMessage(null), 3000);
    },
    onError: () => {
      setMessage({ type: 'error', text: '更新用戶 Token 上限失敗' });
      setTimeout(() => setMessage(null), 3000);
    },
  });

  const handleToggleUser = useCallback((userId: string) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }, []);

  const handleBulkSetVIP = useCallback(async (isVIP: boolean) => {
    if (selectedUserIds.size === 0) {
      setMessage({ type: 'error', text: '請選擇至少一個用戶' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    const promises = Array.from(selectedUserIds).map((userId) =>
      updateUserVIPMutation.mutateAsync({ userId, isVIP })
    );

    await Promise.all(promises);
    setSelectedUserIds(new Set());
  }, [selectedUserIds, updateUserVIPMutation]);

  const handleSaveSettings = useCallback(() => {
    const regularLimitNum = parseInt(regularLimit, 10);
    const vipLimitNum = parseInt(vipLimit, 10);

    if (isNaN(regularLimitNum) || regularLimitNum <= 0) {
      setMessage({ type: 'error', text: '一般用戶 Token 上限必須為正整數' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    if (isNaN(vipLimitNum) || vipLimitNum <= 0) {
      setMessage({ type: 'error', text: 'VIP 用戶 Token 上限必須為正整數' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    updateSettingsMutation.mutate({
      regularTokenLimit: regularLimitNum,
      vipTokenLimit: vipLimitNum,
    });
  }, [regularLimit, vipLimit, updateSettingsMutation]);

  const users = usersData?.users || [];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        系統設定
      </Typography>

      {message && (
        <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Token Limit Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              預設 Token 上限
            </Typography>
            {settingsLoading ? (
              <CircularProgress />
            ) : (
              <>
                <TextField
                  fullWidth
                  label="一般用戶 Token 上限"
                  type="number"
                  value={regularLimit}
                  onChange={(e) => setRegularLimit(e.target.value)}
                  sx={{ mb: 2 }}
                  InputProps={{
                    inputProps: { min: 1 },
                  }}
                />
                <TextField
                  fullWidth
                  label="VIP 用戶 Token 上限"
                  type="number"
                  value={vipLimit}
                  onChange={(e) => setVipLimit(e.target.value)}
                  sx={{ mb: 2 }}
                  InputProps={{
                    inputProps: { min: 1 },
                  }}
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSaveSettings}
                  disabled={updateSettingsMutation.isPending}
                >
                  {updateSettingsMutation.isPending ? '儲存中...' : '儲存設定'}
                </Button>
              </>
            )}
          </Paper>
        </Grid>

        {/* User Management */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              用戶管理
            </Typography>
            <TextField
              fullWidth
              placeholder="搜尋用戶名稱或 ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />

            {selectedUserIds.size > 0 && (
              <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleBulkSetVIP(true)}
                  disabled={updateUserVIPMutation.isPending}
                >
                  設為 VIP ({selectedUserIds.size})
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleBulkSetVIP(false)}
                  disabled={updateUserVIPMutation.isPending}
                >
                  取消 VIP ({selectedUserIds.size})
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setSelectedUserIds(new Set())}
                >
                  清除選擇
                </Button>
              </Box>
            )}

            {usersLoading ? (
              <CircularProgress />
            ) : users.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                {searchQuery ? '找不到符合條件的用戶' : '輸入用戶名稱或 ID 開始搜尋'}
              </Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">選擇</TableCell>
                      <TableCell>用戶 ID</TableCell>
                      <TableCell>顯示名稱</TableCell>
                      <TableCell>狀態</TableCell>
                      <TableCell>Token 上限</TableCell>
                      <TableCell>操作</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedUserIds.has(user.id)}
                            onChange={() => handleToggleUser(user.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                            {user.id.slice(0, 8)}...
                          </Typography>
                        </TableCell>
                        <TableCell>{user.displayName || '(無名稱)'}</TableCell>
                        <TableCell>
                          {user.isVIP ? (
                            <Chip label="VIP" color="primary" size="small" />
                          ) : (
                            <Chip label="一般" size="small" />
                          )}
                        </TableCell>
                        <TableCell>
                          {user.tokenLimit ? (
                            <Typography variant="body2">{user.tokenLimit}</Typography>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              預設
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            onClick={() => {
                              const newVIP = !user.isVIP;
                              updateUserVIPMutation.mutate({ userId: user.id, isVIP: newVIP });
                            }}
                            disabled={updateUserVIPMutation.isPending}
                          >
                            {user.isVIP ? '取消 VIP' : '設為 VIP'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
