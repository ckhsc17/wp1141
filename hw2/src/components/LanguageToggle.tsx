'use client';

import React from 'react';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  Typography,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Language as LanguageIcon,
  KeyboardArrowDown,
} from '@mui/icons-material';
import { useTranslation } from '@/hooks/useTranslation';

/**
 * 語言切換組件
 * 提供中英文切換功能
 */
const LanguageToggle: React.FC = () => {
  const { t, locale, changeLanguage } = useTranslation();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (newLocale: string) => {
    changeLanguage(newLocale);
    handleClose();
  };

  const getCurrentLanguageLabel = () => {
    return locale === 'zh-TW' ? '中文' : 'English';
  };

  return (
    <Box>
      <Button
        variant="outlined"
        startIcon={<LanguageIcon />}
        endIcon={<KeyboardArrowDown />}
        onClick={handleClick}
        sx={{
          fontFamily: '"Times New Roman", serif',
          textTransform: 'none',
          borderColor: 'rgba(0, 0, 0, 0.12)',
          color: 'text.primary',
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: 'rgba(25, 118, 210, 0.04)',
          },
        }}
      >
        <Typography
          variant="body2"
          sx={{
            fontFamily: '"Times New Roman", serif',
            fontWeight: 400,
          }}
        >
          {getCurrentLanguageLabel()}
        </Typography>
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        sx={{
          '& .MuiPaper-root': {
            minWidth: 120,
            fontFamily: '"Times New Roman", serif',
          },
        }}
      >
        <MenuItem
          onClick={() => handleLanguageChange('zh-TW')}
          selected={locale === 'zh-TW'}
          sx={{ fontFamily: '"Times New Roman", serif' }}
        >
          <ListItemIcon>
            🇹🇼
          </ListItemIcon>
          <ListItemText
            primary={t('common.chinese')}
            sx={{
              '& .MuiTypography-root': {
                fontFamily: '"Times New Roman", serif',
              },
            }}
          />
        </MenuItem>
        <MenuItem
          onClick={() => handleLanguageChange('en')}
          selected={locale === 'en'}
          sx={{ fontFamily: '"Times New Roman", serif' }}
        >
          <ListItemIcon>
            🇺🇸
          </ListItemIcon>
          <ListItemText
            primary={t('common.english')}
            sx={{
              '& .MuiTypography-root': {
                fontFamily: '"Times New Roman", serif',
              },
            }}
          />
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default LanguageToggle;
