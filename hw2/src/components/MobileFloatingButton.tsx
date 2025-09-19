'use client';

import React, { useCallback, useRef, useEffect, useState } from 'react';
import { Fab, Box } from '@mui/material';
import { MusicNote, TouchApp } from '@mui/icons-material';
import { useTranslation } from '@/hooks/useTranslation';

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
  /** 按鈕點擊事件處理函數 */
  onTap: () => void;
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
  const { t } = useTranslation();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rippleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // 檢查是否為手機模式
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768); // 設定手機模式的閾值
    };

    checkMobile(); // 初始化檢查
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

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

  // 處理觸控事件
  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    event.preventDefault(); // 防止滾動等默認行為
    
    if (!isGameActive || isPracticeDemo) {
      return;
    }

    // 觸發點擊事件
    onTap();
    
    // 添加視覺反饋
    addVisualFeedback();
    
    console.log('🎯 Touch input processed successfully');
  }, [isGameActive, isPracticeDemo, onTap, addVisualFeedback]);

  // 處理點擊事件（桌面版備用）
  const handleClick = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    
    if (!isGameActive || isPracticeDemo) {
      return;
    }

    onTap();
    addVisualFeedback();
    
    console.log('🎯 Click input processed successfully');
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
  
  // 簡化顯示邏輯：使用父組件傳入的 visible 或內部的 isMobile 檢測
  const shouldShow = visible && isMobile;
  
  if (!shouldShow) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: '10%',
        right: '10%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
        zIndex: 1000, 
      }}
    >
      {/* 提示文字
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
          ...fontStyle,
        }}
      >
        {isPracticeDemo ? t('mobile.demo') : t('mobile.tapBeat')}
      </Typography> */}

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
        aria-label={t('mobile.tapBeat')}
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