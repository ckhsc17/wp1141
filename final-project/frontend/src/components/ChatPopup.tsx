import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  TextField,
  IconButton,
  Avatar,
  Typography,
  CircularProgress,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { X, Send } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useChat } from '../hooks/useChat';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';

interface ChatPopupProps {
  open: boolean;
  onClose: () => void;
  groupId: number;
  groupName: string;
}

export default function ChatPopup({ open, onClose, groupId, groupName }: ChatPopupProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();
  const { messages, loadMessages, sendMessage, markConversationAsRead, loading } = useChat(
    user?.userId ?? undefined,
    'group',
    groupId.toString()
  );

  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Track if we've already marked this conversation as read
  const hasMarkedAsReadRef = useRef(false);

  // Load messages when dialog opens
  useEffect(() => {
    if (open && user && groupId) {
      loadMessages();
      // Only mark as read once per dialog open
      if (!hasMarkedAsReadRef.current) {
        hasMarkedAsReadRef.current = true;
        markConversationAsRead({ groupId });
      }
    } else if (!open) {
      // Reset when dialog closes
      hasMarkedAsReadRef.current = false;
    }
  }, [open, user, groupId, loadMessages, markConversationAsRead]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || sending) return;

    setSending(true);
    await sendMessage(inputMessage.trim(), undefined, groupId);
    setInputMessage('');
    setSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

      if (diffInHours < 24) {
        return format(date, 'HH:mm', { locale: zhTW });
      } else if (diffInHours < 24 * 7) {
        return format(date, 'EEE HH:mm', { locale: zhTW });
      } else {
        return format(date, 'MM/dd HH:mm', { locale: zhTW });
      }
    } catch {
      return '';
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={false}
      maxWidth={false}
      fullWidth={false}
      PaperProps={{
        sx: {
          width: isMobile ? '90vw' : '480px',
          maxWidth: isMobile ? '90vw' : '90vw',
          height: isMobile ? '80vh' : '75vh',
          minHeight: isMobile ? '400px' : '400px',
          maxHeight: isMobile ? '80vh' : '75vh',
          borderRadius: '2rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          margin: 'auto',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          bgcolor: 'white',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 2.5,
          px: isMobile ? 2.5 : 3,
          flexShrink: 0,
          borderRadius: '2rem 2rem 0 0',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{
              width: 40,
              height: 40,
              bgcolor: '#dcfce7',
              fontSize: '1rem',
              borderRadius: 4,
              color: '#15803d',
              fontWeight: 700,
            }}
          >
            {groupName.charAt(0).toUpperCase()}
          </Avatar>
          <Typography
            sx={{
              fontWeight: 700,
              color: '#0f172a',
              fontSize: '1rem',
            }}
          >
            {groupName}
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          sx={{
            color: '#64748b',
            '&:hover': { bgcolor: '#f1f5f9' },
          }}
        >
          <X size={20} />
        </IconButton>
      </DialogTitle>

      {/* Messages Area */}
      <DialogContent
        sx={{
          bgcolor: '#f8fafc',
          p: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          flex: 1,
          minHeight: 0, // 確保 flex 子元素可以正確縮小
        }}
      >
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: isMobile ? 2 : 2.5,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            minHeight: 0, // 確保可以正確滾動
          }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : messages.length > 0 ? (
            messages.map((message) => {
              const isOwn = message.senderId === user.userId;
              return (
                <Box
                  key={message.id}
                  sx={{
                    display: 'flex',
                    justifyContent: isOwn ? 'flex-end' : 'flex-start',
                    alignItems: 'flex-end',
                    gap: 1,
                  }}
                >
                  {!isOwn && (
                    <Avatar
                      src={message.sender?.avatar || undefined}
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: '#dbeafe',
                        fontSize: '0.75rem',
                        borderRadius: 3,
                        color: '#2563eb',
                        fontWeight: 700,
                      }}
                    >
                      {message.sender?.name?.charAt(0).toUpperCase() || '?'}
                    </Avatar>
                  )}
                  <Box
                    sx={{
                      maxWidth: '75%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isOwn ? 'flex-end' : 'flex-start',
                    }}
                  >
                    {!isOwn && (
                      <Typography
                        sx={{
                          fontSize: '0.75rem',
                          color: '#94a3b8',
                          fontWeight: 500,
                          mb: 0.5,
                          px: 1,
                        }}
                      >
                        {message.sender?.name || 'Unknown'}
                      </Typography>
                    )}
                    <Box
                      sx={{
                        p: 1.5,
                        bgcolor: isOwn ? '#2563eb' : '#f1f5f9',
                        color: isOwn ? 'white' : '#0f172a',
                        borderRadius: isOwn ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
                        wordBreak: 'break-word',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          lineHeight: 1.5,
                          color: isOwn ? 'white' : '#0f172a',
                        }}
                      >
                        {message.content}
                      </Typography>
                    </Box>
                    <Typography
                      sx={{
                        fontSize: '0.625rem',
                        color: '#94a3b8',
                        mt: 0.5,
                        px: 1,
                        fontWeight: 500,
                      }}
                    >
                      {formatMessageTime(message.createdAt)}
                      {isOwn && message.readBy.length > 1 && ' · 已讀'}
                    </Typography>
                  </Box>
                </Box>
              );
            })
          ) : (
            <Box sx={{ textAlign: 'center', py: 12 }}>
              <Typography sx={{ fontWeight: 700, color: '#64748b', fontSize: '1rem', mb: 1 }}>
                還沒有訊息
              </Typography>
              <Typography sx={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                開始聊天吧！
              </Typography>
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Box>
      </DialogContent>

      {/* Input Area */}
      <Box
        sx={{
          p: isMobile ? 2 : 2.5,
          bgcolor: 'white',
          borderTop: '1px solid #f1f5f9',
          display: 'flex',
          gap: 1.5,
          alignItems: 'flex-end',
          flexShrink: 0,
          borderRadius: '0 0 2rem 2rem',
        }}
      >
        <TextField
          fullWidth
          multiline
          maxRows={4}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="輸入訊息..."
          variant="outlined"
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 4,
              bgcolor: '#f1f5f9',
              '& fieldset': {
                border: 'none',
              },
              '&:hover fieldset': {
                border: 'none',
              },
              '&.Mui-focused fieldset': {
                border: '1px solid #2563eb',
              },
            },
          }}
        />
        <IconButton
          onClick={handleSendMessage}
          disabled={!inputMessage.trim() || sending}
          sx={{
            bgcolor: inputMessage.trim() ? '#2563eb' : '#e2e8f0',
            color: inputMessage.trim() ? 'white' : '#94a3b8',
            width: 40,
            height: 40,
            borderRadius: 3,
            '&:hover': {
              bgcolor: inputMessage.trim() ? '#1d4ed8' : '#e2e8f0',
            },
            '&:disabled': {
              bgcolor: '#e2e8f0',
              color: '#94a3b8',
            },
            transition: 'all 0.2s ease',
          }}
        >
          {sending ? (
            <CircularProgress size={20} sx={{ color: 'inherit' }} />
          ) : (
            <Send size={18} />
          )}
        </IconButton>
      </Box>
    </Dialog>
  );
}

