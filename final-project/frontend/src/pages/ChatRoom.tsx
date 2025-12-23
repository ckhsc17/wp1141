import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  TextField,
  IconButton,
  Avatar,
  Typography,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  Divider,
} from '@mui/material';
import { ArrowLeft, Send, Users } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useChat } from '../hooks/useChat';
import { groupsApi, Group } from '../api/groups';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';

export default function ChatRoom() {
  const { type, id } = useParams<{ type: 'user' | 'group'; id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const chatId = id ? (type === 'group' ? parseInt(id) : id) : undefined;
  const { messages, conversations, loadMessages, loadConversations, sendMessage, markConversationAsRead, loading } = useChat(user?.userId ?? undefined, type ?? undefined, chatId);
  
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [chatName, setChatName] = useState('');
  const [chatAvatar, setChatAvatar] = useState<string | null>(null);
  const [conversationsLoaded, setConversationsLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Group members dialog state
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  
  // Use React Query for group info (with cache)
  const { data: groupData, isLoading: loadingMembers } = useQuery<{ group: Group }>({
    queryKey: ['group', type === 'group' ? parseInt(id || '0') : null],
    queryFn: async () => {
      if (type !== 'group' || !id) throw new Error('Not a group chat');
      return await groupsApi.getGroup(parseInt(id));
    },
    enabled: type === 'group' && !!id && membersDialogOpen, // Only fetch when dialog is open
    staleTime: 30 * 1000, // 30 seconds
  });
  
  const groupInfo = useMemo(() => groupData?.group || null, [groupData]);

  // Initialize from location.state if available (passed from previous page)
  useEffect(() => {
    const state = location.state as { conversation?: { name: string; avatar: string | null } } | null;
    if (state?.conversation) {
      setChatName(state.conversation.name);
      setChatAvatar(state.conversation.avatar);
      setConversationsLoaded(true); // Mark as loaded since we have the data
      return; // Don't load conversations if we already have the data
    }
  }, [location.state]);

  // Load conversations to get chat name and avatar (only if not provided via location.state)
  useEffect(() => {
    const state = location.state as { conversation?: { name: string; avatar: string | null } } | null;
    if (user && !state?.conversation) {
      loadConversations()
        .then(() => {
          setConversationsLoaded(true);
        })
        .catch((err) => {
          console.error('[ChatRoom] Failed to load conversations:', err);
          setConversationsLoaded(true); // Still mark as loaded even on error
        });
    }
  }, [user, loadConversations, location.state]);

  // Find conversation info from conversations list (only if not already set from location.state)
  useEffect(() => {
    if (chatName) return; // Already set from location.state

    if (conversations.length > 0 && type && id) {
      const conversation = conversations.find((conv) => {
        if (type === 'user') {
          return conv.type === 'user' && conv.id === id;
        } else {
          return conv.type === 'group' && conv.id === parseInt(id);
        }
      });

      if (conversation) {
        setChatName(conversation.name);
        setChatAvatar(conversation.avatar);
        return; // Found conversation, no need for fallback
      }
    }

    // Fallback: Get name from messages if conversation not found
    // Only try fallback if conversations have been loaded
    if (conversationsLoaded && type === 'user' && messages.length > 0 && !chatName) {
      // Find the first message from the other user
      const otherUserMessage = messages.find((msg) => msg.senderId !== user?.userId);
      if (otherUserMessage?.sender?.name) {
        setChatName(otherUserMessage.sender.name);
        setChatAvatar(otherUserMessage.sender.avatar || null);
      } else if (id) {
        // Still show ID if no name found
        setChatName(id);
      }
    } else if (conversationsLoaded && type === 'group' && !chatName && id) {
      // For groups, use ID as fallback
      setChatName(`群組 ${id}`);
    }
  }, [conversations, type, id, messages, user?.userId, chatName, conversationsLoaded]);

  // Track if we've already marked this conversation as read
  const hasMarkedAsReadRef = useRef<{ type?: string; id?: string }>({});

  // Load messages
  useEffect(() => {
    if (user && type && id) {
      loadMessages();
    }
  }, [user, type, id, loadMessages]);

  // Mark conversation as read (only once per conversation)
  useEffect(() => {
    if (user && type && id) {
      // Only mark as read if we haven't already marked this conversation
      if (hasMarkedAsReadRef.current.type !== type || hasMarkedAsReadRef.current.id !== id) {
        hasMarkedAsReadRef.current = { type, id };
        if (type === 'user') {
          markConversationAsRead({ receiverId: id });
        } else {
          markConversationAsRead({ groupId: parseInt(id) });
        }
      }
    }
  }, [user, type, id, markConversationAsRead]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || sending) return;

    setSending(true);
    const receiverId = type === 'user' ? id : undefined;
    const groupId = type === 'group' ? parseInt(id!) : undefined;

    await sendMessage(inputMessage.trim(), receiverId, groupId);
    setInputMessage('');
    setSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleOpenMembersDialog = () => {
    if (type !== 'group' || !id) return;
    setMembersDialogOpen(true);
    // Data will be fetched automatically by React Query when dialog opens
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
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#f8fafc',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          bgcolor: 'white',
          borderBottom: '1px solid #f1f5f9',
          px: 3,
          py: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          flexShrink: 0,
        }}
      >
        <IconButton
          onClick={() => navigate('/friends')}
          sx={{
            color: '#64748b',
            '&:hover': { bgcolor: '#f1f5f9' },
          }}
        >
          <ArrowLeft size={20} />
        </IconButton>
        <Avatar
          src={chatAvatar || undefined}
          sx={{
            width: 40,
            height: 40,
            bgcolor: type === 'group' ? '#dcfce7' : '#dbeafe',
            fontSize: '1rem',
            borderRadius: 4,
            color: type === 'group' ? '#15803d' : '#2563eb',
            fontWeight: 700,
          }}
        >
          {chatName.charAt(0).toUpperCase()}
        </Avatar>
        <Typography
          sx={{
            flexGrow: 1,
            fontWeight: 700,
            color: '#0f172a',
            fontSize: '1rem',
          }}
        >
          {chatName}
        </Typography>
        {type === 'group' && (
          <IconButton
            onClick={handleOpenMembersDialog}
            sx={{
              color: '#64748b',
              '&:hover': { bgcolor: '#f1f5f9' },
            }}
          >
            <Users size={20} />
          </IconButton>
        )}
      </Box>

      {/* Messages Area */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          minHeight: 0, // Important for flex children to respect overflow
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
                  {!isOwn && type === 'group' && (
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

      {/* Input Area */}
      <Box
        sx={{
          p: 2,
          bgcolor: 'white',
          borderTop: '1px solid #f1f5f9',
          display: 'flex',
          gap: 1.5,
          alignItems: 'flex-end',
          flexShrink: 0,
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

      {/* Group Members Dialog */}
      <Dialog
        open={membersDialogOpen}
        onClose={() => setMembersDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '1.5rem',
            maxHeight: '80vh',
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            color: '#0f172a',
            fontSize: '1.25rem',
            pb: 1,
          }}
        >
          群組成員
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {loadingMembers ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : groupInfo && groupInfo.members ? (
            <Box>
              <Box sx={{ px: 3, py: 2 }}>
                <Typography sx={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600 }}>
                  共 {groupInfo.members.length} 位成員
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ maxHeight: '50vh', overflowY: 'auto' }}>
                {groupInfo.members.map((member, index) => (
                  <Box key={member.id}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        p: 2.5,
                        px: 3,
                      }}
                    >
                      <Avatar
                        src={member.avatar || undefined}
                        sx={{
                          width: 48,
                          height: 48,
                          bgcolor: '#dbeafe',
                          fontSize: '1rem',
                          borderRadius: 3,
                          color: '#2563eb',
                          fontWeight: 700,
                        }}
                      >
                        {member.email.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          sx={{
                            fontWeight: 600,
                            color: '#0f172a',
                            fontSize: '0.875rem',
                            mb: 0.5,
                          }}
                        >
                          {member.name}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: '0.75rem',
                            color: '#94a3b8',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {member.email}
                        </Typography>
                      </Box>
                      {groupInfo.owner && groupInfo.owner.id === member.id && (
                        <Box
                          sx={{
                            px: 1.5,
                            py: 0.5,
                            bgcolor: '#fef3c7',
                            borderRadius: 2,
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              color: '#f59e0b',
                            }}
                          >
                            群主
                          </Typography>
                        </Box>
                      )}
                    </Box>
                    {index < groupInfo.members.length - 1 && <Divider />}
                  </Box>
                ))}
              </Box>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography sx={{ color: '#64748b', fontSize: '0.875rem' }}>
                無法載入成員列表
              </Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}


