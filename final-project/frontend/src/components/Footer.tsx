import { Box, Typography, Link } from '@mui/material';
import { GitHub as GitHubIcon } from '@mui/icons-material';

export default function Footer() {
  return (
    <Box 
      component="footer" 
      sx={{ 
        py: 3, 
        px: 2,
        mt: 'auto',
        textAlign: 'center', 
        bgcolor: 'background.paper',
        borderTop: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          © 2025 MeetHalf - 找到完美的聚會地點，成為守時大師！
        </Typography>
      </Box>
    </Box>
  );
}


