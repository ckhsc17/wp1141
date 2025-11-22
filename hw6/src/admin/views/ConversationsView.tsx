'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ConversationList } from '../components/ConversationList';
import { ConversationFilters } from '../components/ConversationFilters';
import { Box, Typography } from '@mui/material';

interface ConversationWithUser {
  id: string;
  userId: string;
  title?: string;
  content: string;
  url?: string;
  tags: string[];
  metadata?: Record<string, unknown>;
  location?: string;
  createdAt: Date;
  updatedAt: Date;
  userDisplayName?: string;
}

interface ConversationsResponse {
  conversations: ConversationWithUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function ConversationsView() {
  const [userName, setUserName] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const buildQueryParams = useCallback(() => {
    const params = new URLSearchParams();
    if (userName) params.set('userName', userName);
    if (startDate) params.set('startDate', startDate.toISOString());
    if (endDate) params.set('endDate', endDate.toISOString());
    if (search) params.set('search', search);
    params.set('page', page.toString());
    params.set('limit', '20');
    return params.toString();
  }, [userName, startDate, endDate, search, page]);

  const { data, isLoading } = useQuery<ConversationsResponse>({
    queryKey: ['conversations', userName, startDate, endDate, search, page],
    queryFn: async () => {
      const params = buildQueryParams();
      const res = await fetch(`/api/admin/conversations?${params}`);
      if (!res.ok) throw new Error('Failed to fetch conversations');
      return res.json();
    },
  });

  const handleReset = useCallback(() => {
    setUserName('');
    setStartDate(null);
    setEndDate(null);
    setSearch('');
    setPage(1);
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        對話紀錄
      </Typography>
      <ConversationFilters
        userName={userName}
        startDate={startDate}
        endDate={endDate}
        search={search}
        onUserNameChange={setUserName}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onSearchChange={setSearch}
        onReset={handleReset}
      />
      <ConversationList
        conversations={data?.conversations || []}
        totalPages={data?.totalPages || 0}
        page={page}
        onPageChange={setPage}
        loading={isLoading}
      />
    </Box>
  );
}

