'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Pagination,
  CircularProgress,
} from '@mui/material';
import { format } from 'date-fns';

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

interface ConversationListProps {
  conversations: ConversationWithUser[];
  totalPages: number;
  page: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

export function ConversationList({
  conversations,
  totalPages,
  page,
  onPageChange,
  loading,
}: ConversationListProps) {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (conversations.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          沒有找到對話紀錄
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>時間</TableCell>
              <TableCell>使用者名稱</TableCell>
              <TableCell>內容</TableCell>
              <TableCell>標籤</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {conversations.map((conv) => (
              <TableRow key={conv.id}>
                <TableCell>
                  {format(new Date(conv.createdAt), 'yyyy-MM-dd HH:mm')}
                </TableCell>
                <TableCell>
                  {conv.userDisplayName || `使用者 ${conv.userId.slice(0, 8)}...`}
                </TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    sx={{
                      maxWidth: 400,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {conv.content}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {conv.tags.slice(0, 3).map((tag) => (
                      <Typography
                        key={tag}
                        variant="caption"
                        sx={{
                          backgroundColor: '#e3f2fd',
                          color: '#1976d2',
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                        }}
                      >
                        {tag}
                      </Typography>
                    ))}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, newPage) => onPageChange(newPage)}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
}

