'use client';

import React from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';

interface BackgroundContainerProps {
  children: React.ReactNode;
  backgroundImage?: string;
}

/**
 * 背景容器組件
 * 提供自適應背景圖片和響應式佈局
 */
const BackgroundContainer: React.FC<BackgroundContainerProps> = ({
  children,
  backgroundImage = '/images/music-background.png', // 默認背景圖片路徑
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        // 背景圖片設置
        backgroundImage: `linear-gradient(
          rgba(0, 0, 0, 0.3), 
          rgba(0, 0, 0, 0.4)
        ), url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: isMobile ? 'scroll' : 'fixed', // 手機版使用 scroll 避免性能問題
        
        // 響應式調整
        [theme.breakpoints.down('sm')]: {
          backgroundAttachment: 'scroll',
          backgroundPosition: 'center top',
        },
        
        // 確保內容可以滾動
        display: 'flex',
        flexDirection: 'column',
        
        // 添加微妙的動畫效果
        transition: 'all 0.3s ease-in-out',
        
        // 為了更好的可讀性，添加額外的遮罩
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.1), rgba(220, 0, 78, 0.1))',
          pointerEvents: 'none',
          zIndex: 1,
        },
      }}
    >
      {/* 內容容器 */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 2,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          
          // 添加進入動畫
          animation: 'fadeInUp 1s ease-out',
          
          '@keyframes fadeInUp': {
            '0%': {
              opacity: 0,
              transform: 'translateY(30px)',
            },
            '100%': {
              opacity: 1,
              transform: 'translateY(0)',
            },
          },
        }}
      >
        {children}
      </Box>
      
      {/* 可選：添加浮動音符動畫 */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          zIndex: 1,
          opacity: 0.1,
          
          '&::after': {
            content: '"♪"',
            position: 'absolute',
            fontSize: '2rem',
            color: 'white',
            animation: 'floatNote 8s infinite linear',
            top: '10%',
            left: '10%',
          },
          
          '&::before': {
            content: '"♫"',
            position: 'absolute',
            fontSize: '1.5rem',
            color: 'white',
            animation: 'floatNote 6s infinite linear reverse',
            top: '20%',
            right: '15%',
            animationDelay: '2s',
          },
          
          '@keyframes floatNote': {
            '0%': {
              transform: 'translateY(100vh) rotate(0deg)',
              opacity: 0,
            },
            '10%': {
              opacity: 1,
            },
            '90%': {
              opacity: 1,
            },
            '100%': {
              transform: 'translateY(-100px) rotate(360deg)',
              opacity: 0,
            },
          },
        }}
      />
    </Box>
  );
};

export default BackgroundContainer;
