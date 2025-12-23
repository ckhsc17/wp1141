import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
  Checkbox,
  Avatar,
} from '@mui/material';
import { X } from 'lucide-react';
import { useFriends } from '../hooks/useFriends';
import api from '../api/axios';

interface CreateGroupDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function CreateGroupDialog({ open, onClose }: CreateGroupDialogProps) {
  const navigate = useNavigate();
  const { friends, loadFriends, loading } = useFriends();
  const [groupName, setGroupName] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (open) {
      loadFriends();
    }
  }, [open, loadFriends]);

  const handleToggleFriend = (userId: string) => {
    setSelectedFriends((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreate = async () => {
    if (!groupName.trim() || selectedFriends.length === 0) {
      return;
    }

    try {
      setCreating(true);
      // Create group via groups API
      const response = await api.post('/events', {
        name: groupName.trim(),
        groupId: null, // Will be created as a chat group
      });

      const groupId = response.data.event?.groupId;
      
      if (groupId) {
        // Navigate to group chat
        navigate(`/chat/group/${groupId}`);
        onClose();
      }
    } catch (error) {
      console.error('Error creating group:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    setGroupName('');
    setSelectedFriends([]);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
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
        <Typography sx={{ fontWeight: 900, fontSize: '1.25rem' }}>建立群組</Typography>
        <Box
          onClick={handleClose}
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
      <DialogContent sx={{ px: 3, pb: 2 }}>
        <TextField
          fullWidth
          placeholder="群組名稱"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          sx={{
            mb: 3,
            '& .MuiOutlinedInput-root': {
              borderRadius: 4,
              bgcolor: '#f1f5f9',
              '& fieldset': { border: 'none' },
            },
          }}
        />

        <Typography sx={{ fontWeight: 700, color: '#1e293b', mb: 2, fontSize: '0.875rem' }}>
          選擇好友 ({selectedFriends.length})
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : friends.length > 0 ? (
          <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
            {friends.map((friend) => (
              <Box
                key={friend.userId}
                onClick={() => handleToggleFriend(friend.userId)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 1.5,
                  borderRadius: 4,
                  cursor: 'pointer',
                  mb: 1,
                  bgcolor: selectedFriends.includes(friend.userId) ? '#dbeafe' : 'transparent',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: selectedFriends.includes(friend.userId) ? '#dbeafe' : '#f1f5f9',
                  },
                }}
              >
                <Checkbox
                  checked={selectedFriends.includes(friend.userId)}
                  sx={{
                    p: 0,
                    color: '#2563eb',
                    '&.Mui-checked': {
                      color: '#2563eb',
                    },
                  }}
                />
                <Avatar
                  src={friend.avatar || undefined}
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: '#dbeafe',
                    fontSize: '1rem',
                    borderRadius: 4,
                    color: '#2563eb',
                    fontWeight: 700,
                  }}
                >
                  {friend.name.charAt(0).toUpperCase()}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.875rem' }}>
                    {friend.name}
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>
                    {friend.userId}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography sx={{ fontWeight: 700, color: '#64748b', fontSize: '1rem', mb: 1 }}>
              還沒有好友
            </Typography>
            <Typography sx={{ fontSize: '0.875rem', color: '#94a3b8' }}>
              請先加入好友
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button
          onClick={handleClose}
          sx={{
            borderRadius: 3,
            fontWeight: 700,
            fontSize: '0.875rem',
            textTransform: 'none',
            color: '#64748b',
            '&:hover': { bgcolor: '#f1f5f9' },
          }}
        >
          取消
        </Button>
        <Button
          variant="contained"
          onClick={handleCreate}
          disabled={!groupName.trim() || selectedFriends.length === 0 || creating}
          sx={{
            borderRadius: 3,
            fontWeight: 700,
            fontSize: '0.875rem',
            textTransform: 'none',
            bgcolor: '#2563eb',
            '&:hover': { bgcolor: '#1d4ed8' },
            '&:disabled': {
              bgcolor: '#e2e8f0',
              color: '#94a3b8',
            },
          }}
        >
          {creating ? '建立中...' : '建立'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

