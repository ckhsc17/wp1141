import { Card, CardContent, CardActionArea, Typography, Box, Chip, Avatar } from '@mui/material';
import { 
  Group as GroupIcon, 
  Person as PersonIcon,
  CalendarToday as CalendarIcon 
} from '@mui/icons-material';

interface GroupCardProps {
  id: number;
  name: string;
  memberCount: number;
  createdAt: string;
  onClick: () => void;
}

export default function GroupCard({ id, name, memberCount, createdAt, onClick }: GroupCardProps) {
  return (
    <Card 
      sx={{ 
        height: '100%',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        }
      }}
    >
      <CardActionArea 
        onClick={onClick}
        sx={{ 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          p: 0
        }}
      >
        <CardContent sx={{ width: '100%', p: 3 }}>
          {/* Header with Avatar */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar 
              sx={{ 
                bgcolor: 'primary.main',
                width: 48,
                height: 48,
                mr: 2
              }}
            >
              <GroupIcon />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography 
                variant="h6" 
                component="h3" 
                sx={{ 
                  fontWeight: 'bold',
                  color: 'text.primary',
                  mb: 0.5
                }}
              >
                {name}
              </Typography>
              <Chip 
                label={`活動 #${id}`} 
                size="small" 
                sx={{ 
                  height: 20,
                  fontSize: '0.75rem',
                  bgcolor: 'grey.100',
                  color: 'text.secondary'
                }}
              />
            </Box>
          </Box>

          {/* Member Count */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            mb: 1.5,
            color: 'text.secondary'
          }}>
            <PersonIcon sx={{ fontSize: 20 }} />
            <Typography variant="body2">
              {memberCount} 位成員
            </Typography>
          </Box>

          {/* Created Date */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            color: 'text.secondary'
          }}>
            <CalendarIcon sx={{ fontSize: 18 }} />
            <Typography variant="body2">
              建立於 {new Date(createdAt).toLocaleString('zh-TW', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              })}
            </Typography>
          </Box>

          {/* Bottom Border */}
          <Box 
            sx={{ 
              mt: 2,
              pt: 2,
              borderTop: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'primary.main',
                fontWeight: 'medium'
              }}
            >
              點擊查看詳情 →
            </Typography>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}


