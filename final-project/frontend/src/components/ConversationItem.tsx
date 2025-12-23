import {
  Avatar,
  Badge,
  Typography,
  Box,
} from '@mui/material';
import { Users } from 'lucide-react';
import { Conversation } from '../types/chat';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';

interface ConversationItemProps {
  conversation: Conversation;
  onClick: () => void;
}

export default function ConversationItem({ conversation, onClick }: ConversationItemProps) {
  const { type, name, avatar, lastMessage, unreadCount } = conversation;

  const formatTimestamp = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: zhTW,
      });
    } catch {
      return '';
    }
  };

  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 2,
        cursor: 'pointer',
      }}
    >
      <Badge
        badgeContent={unreadCount > 0 ? unreadCount : undefined}
        color="error"
        max={99}
        overlap="circular"
        sx={{
          '& .MuiBadge-badge': {
            fontSize: '0.625rem',
            minWidth: 18,
            height: 18,
          },
        }}
      >
        <Avatar
          src={avatar || undefined}
          sx={{
            width: 48,
            height: 48,
            bgcolor: type === 'group' ? '#dcfce7' : '#dbeafe',
            fontSize: '1.25rem',
            borderRadius: 4,
            color: type === 'group' ? '#15803d' : '#2563eb',
            fontWeight: 700,
          }}
        >
          {type === 'group' ? (
            <Users size={24} />
          ) : (
            name.charAt(0).toUpperCase()
          )}
        </Avatar>
      </Badge>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
          <Typography
            sx={{
              fontWeight: unreadCount > 0 ? 900 : 700,
              color: '#0f172a',
              fontSize: '0.875rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {name}
          </Typography>
          {lastMessage && (
            <Typography
              sx={{
                fontSize: '0.75rem',
                color: '#94a3b8',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                ml: 1,
              }}
            >
              {formatTimestamp(lastMessage.createdAt)}
            </Typography>
          )}
        </Box>
        <Typography
          sx={{
            fontSize: '0.75rem',
            color: '#94a3b8',
            fontWeight: 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontStyle: !lastMessage ? 'italic' : 'normal',
          }}
        >
          {lastMessage ? (
            <>
              {lastMessage.sender?.name && type === 'group' ? `${lastMessage.sender.name}: ` : ''}
              {lastMessage.content}
            </>
          ) : (
            '還沒有訊息'
          )}
        </Typography>
      </Box>
    </Box>
  );
}

