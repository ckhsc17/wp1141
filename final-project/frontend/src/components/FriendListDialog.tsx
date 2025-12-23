import { useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Avatar,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import { X, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFriends } from '../hooks/useFriends';

interface FriendListDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function FriendListDialog({ open, onClose }: FriendListDialogProps) {
  const navigate = useNavigate();
  const { friends, loadFriends, deleteFriend, loading } = useFriends();

  useEffect(() => {
    if (open) {
      loadFriends();
    }
  }, [open, loadFriends]);

  const handleDeleteFriend = async (friendId: string, friendName: string) => {
    if (window.confirm(`確定要刪除好友 ${friendName} 嗎？`)) {
      await deleteFriend(friendId);
    }
  };

  const handleSendMessage = (friendId: string) => {
    navigate(`/chat/user/${friendId}`);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '2rem',
          border: '1px solid #f1f5f9',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontWeight: 900,
          color: '#0f172a',
          pb: 2,
        }}
      >
        <Typography sx={{ fontWeight: 900, fontSize: '1.25rem' }}>好友列表</Typography>
        <Box
          onClick={onClose}
          sx={{
            width: 32,
            height: 32,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#64748b',
            '&:hover': { bgcolor: '#f1f5f9' },
          }}
        >
          <X size={20} />
        </Box>
      </DialogTitle>
      <DialogContent sx={{ px: 3, pb: 2, '&.MuiDialogContent-root': { px: 3 } }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : friends.length > 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {friends.map((friend) => (
              <Box
                key={friend.userId}
                sx={{
                  bgcolor: 'white',
                  pl: 2,
                  pr: 1,
                  py: 2,
                  borderRadius: '1.5rem',
                  border: '1px solid #f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: '#f8fafc',
                    '& .friend-name': { color: '#2563eb' },
                  },
                }}
                onClick={() => handleSendMessage(friend.userId)}
              >
                <Avatar
                  src={friend.avatar || undefined}
                  sx={{
                    width: 48,
                    height: 48,
                    bgcolor: '#dbeafe',
                    fontSize: '1.25rem',
                    borderRadius: 4,
                    color: '#2563eb',
                    fontWeight: 700,
                  }}
                >
                  {friend.name.charAt(0).toUpperCase()}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography className="friend-name" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.875rem', transition: 'color 0.2s ease' }}>
                    {friend.name}
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>
                    {friend.userId}
                  </Typography>
                </Box>
                <Box
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFriend(friend.userId, friend.name);
                  }}
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 3,
                    bgcolor: '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ef4444',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': { bgcolor: '#fee2e2' },
                  }}
                >
                  <Trash2 size={18} />
                </Box>
              </Box>
            ))}
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 12 }}>
            <Typography sx={{ fontWeight: 700, color: '#64748b', fontSize: '1rem', mb: 1 }}>
              還沒有好友
            </Typography>
            <Typography sx={{ fontSize: '0.875rem', color: '#94a3b8' }}>
              開始添加好友吧
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={onClose}
          sx={{
            borderRadius: 3,
            fontWeight: 700,
            fontSize: '0.875rem',
            textTransform: 'none',
            bgcolor: '#2563eb',
            color: 'white',
            px: 3,
            '&:hover': { bgcolor: '#1d4ed8' },
          }}
        >
          關閉
        </Button>
      </DialogActions>
    </Dialog>
  );
}

