'use client';

import React, { useCallback, useRef, useEffect } from 'react';
import { Fab, Box, Typography } from '@mui/material';
import { MusicNote, TouchApp } from '@mui/icons-material';

/**
 * Mobile Floating Button Component
 * 
 * 遵循 Clean Architecture 原則：
 * - 單一職責：只負責手機版的觸控輸入
 * - 依賴倒置：通過 props 接收事件處理函數
 * - 開閉原則：可擴展但不需修改核心邏輯
 */

export interface MobileFloatingButtonProps {
  /** 是否顯示按鈕 */
  visible: boolean;
  /** 按鈕點擊事件處理函數 - 改為異步 */
  onTap: () => Promise<void>;
  /** 遊戲是否正在進行中 */
  isGameActive: boolean;
  /** 是否為練習模式的示範階段 */
  isPracticeDemo: boolean;
  /** 自定義樣式 */
  sx?: React.ComponentProps<typeof Fab>['sx'];
}

/**
 * 浮動按鈕組件
 * 提供手機版的觸控輸入界面
 */
const MobileFloatingButton: React.FC<MobileFloatingButtonProps> = ({
  visible,
  onTap,
  isGameActive,
  isPracticeDemo,
  sx = {},
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rippleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 添加視覺反饋效果
  const addVisualFeedback = useCallback(() => {
    const button = buttonRef.current;
    if (!button) return;

    // 清除之前的 timeout
    if (rippleTimeoutRef.current) {
      clearTimeout(rippleTimeoutRef.current);
    }

    // 添加按下效果
    button.style.transform = 'scale(0.95)';
    button.style.boxShadow = '0 2px 8px rgba(76, 175, 80, 0.3)';

    // 恢復效果
    rippleTimeoutRef.current = setTimeout(() => {
      button.style.transform = 'scale(1)';
      button.style.boxShadow = '0 4px 20px rgba(76, 175, 80, 0.4)';
    }, 150);
  }, []);

  // 處理觸控事件 - 改為異步
  const handleTouchStart = useCallback(async (event: React.TouchEvent) => {
    event.preventDefault(); // 防止滾動等默認行為
    
    if (!isGameActive || isPracticeDemo) {
      return;
    }

    try {
      // 觸發點擊事件
      await onTap();
      
      // 添加視覺反饋
      addVisualFeedback();
      
      console.log('🎯 Touch input processed successfully');
    } catch (error) {
      console.error('❌ Touch input failed:', error);
    }
  }, [isGameActive, isPracticeDemo, onTap, addVisualFeedback]);

  // 處理點擊事件（桌面版備用） - 改為異步
  const handleClick = useCallback(async (event: React.MouseEvent) => {
    event.preventDefault();
    
    if (!isGameActive || isPracticeDemo) {
      return;
    }

    try {
      await onTap();
      addVisualFeedback();
      
      console.log('🎯 Click input processed successfully');
    } catch (error) {
      console.error('❌ Click input failed:', error);
    }
  }, [isGameActive, isPracticeDemo, onTap, addVisualFeedback]);

  // 清理 effect
  useEffect(() => {
    return () => {
      if (rippleTimeoutRef.current) {
        clearTimeout(rippleTimeoutRef.current);
      }
    };
  }, []);

  // 計算按鈕狀態
  const isDisabled = !isGameActive || isPracticeDemo;
  const buttonOpacity = isDisabled ? 0.5 : 1;
  
  if (!visible) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: { xs: 80, sm: 100 }, // 響應式底部距離
        right: { xs: 20, sm: 30 },   // 響應式右側距離
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
      }}
    >
      {/* 提示文字 */}
      <Typography
        variant="caption"
        sx={{
          color: 'rgba(76, 175, 80, 0.8)',
          fontWeight: 'bold',
          textAlign: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          padding: '4px 8px',
          borderRadius: '12px',
          fontSize: '0.7rem',
          opacity: buttonOpacity,
          transition: 'opacity 0.3s ease',
        }}
      >
        {isPracticeDemo ? '示範中...' : '點擊節拍'}
      </Typography>

      {/* 浮動按鈕 */}
      <Fab
        ref={buttonRef}
        size="large"
        disabled={isDisabled}
        onTouchStart={handleTouchStart}
        onClick={handleClick}
        sx={{
          backgroundColor: '#4caf50', // 淺綠色
          color: 'white',
          width: { xs: 70, sm: 80 },   // 響應式大小
          height: { xs: 70, sm: 80 },
          opacity: buttonOpacity,
          boxShadow: '0 4px 20px rgba(76, 175, 80, 0.4)',
          transition: 'all 0.3s ease',
          '&:hover': {
            backgroundColor: '#45a049',
            transform: 'scale(1.05)',
            boxShadow: '0 6px 25px rgba(76, 175, 80, 0.5)',
          },
          '&:active': {
            transform: 'scale(0.95)',
            boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)',
          },
          '&:disabled': {
            backgroundColor: '#4caf50',
            color: 'white',
            opacity: 0.5,
          },
          // 防止選中文字
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
          WebkitTapHighlightColor: 'transparent',
          ...sx,
        }}
        aria-label="節拍輸入按鈕"
        role="button"
      >
        {isPracticeDemo ? (
          <MusicNote sx={{ fontSize: { xs: 28, sm: 32 } }} />
        ) : (
          <TouchApp sx={{ fontSize: { xs: 28, sm: 32 } }} />
        )}
      </Fab>

      {/* 脈衝動畫效果 */}
      {isGameActive && !isPracticeDemo && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: 70, sm: 80 },
            height: { xs: 70, sm: 80 },
            borderRadius: '50%',
            border: '2px solid rgba(76, 175, 80, 0.6)',
            animation: 'pulse 2s infinite',
            pointerEvents: 'none',
            '@keyframes pulse': {
              '0%': {
                transform: 'translate(-50%, -50%) scale(1)',
                opacity: 1,
              },
              '100%': {
                transform: 'translate(-50%, -50%) scale(1.4)',
                opacity: 0,
              },
            },
          }}
        />
      )}
    </Box>
  );
};

export default MobileFloatingButton;