'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';

interface CountdownOverlayProps {
  /** 是否顯示倒數 */
  show: boolean;
  /** 當前遊戲時間（用來計算倒數） */
  currentTime?: number;
  /** BPM，用來計算節拍 */
  bpm?: number;
}

/**
 * 倒數計時覆蓋層組件
 * 顯示半透明圓形的倒數動畫，跟隨節拍器節奏
 */
const CountdownOverlay: React.FC<CountdownOverlayProps> = ({
  show,
  currentTime = 0,
  bpm = 120
}) => {
  const [currentCount, setCurrentCount] = useState(4);

  // 計算每拍的時間間隔（秒）
  const beatDuration = 60 / bpm;

  useEffect(() => {
    if (!show) {
      setCurrentCount(4);
      return;
    }

    // 根據當前遊戲時間計算倒數數字
    // currentTime 在前4拍期間是負數，從 -4*beatDuration 到 0
    if (currentTime < 0) {
      const beatsRemaining = Math.ceil(-currentTime / beatDuration);
      const displayCount = Math.min(4, Math.max(0, beatsRemaining));
      setCurrentCount(displayCount);
    }
  }, [show, currentTime, beatDuration]);

  if (!show) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000, // 確保在最上層
        backgroundColor: 'transparent', // 半透明背景
        pointerEvents: 'none', // 不阻擋其他交互
      }}
    >
    <Box
    sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: { xs: 120, sm: 150 },
        height: { xs: 120, sm: 150 },
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.4)', // 圈圈整體更透明
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        animation: currentCount > 0 ? 'countdownPulse 1s ease-out' : 'countdownFadeOut 0.5s ease-out',
        '@keyframes countdownPulse': {
        '0%': {
            transform: 'scale(0.8)',
        },
        '30%': {
            transform: 'scale(1.1)',
        },
        '100%': {
            transform: 'scale(1)',
        },
        },
        '@keyframes countdownFadeOut': {
        '0%': {
            transform: 'scale(1)',
        },
        '100%': {
            transform: 'scale(1.2)',
            opacity: 0, // 淡出才用透明度
        },
        },
    }}
    >
    <Typography
        variant="h1"
        sx={{
        fontSize: { xs: '3rem', sm: '4rem' },
        fontWeight: 'bold',
        color: '#1976d2',
        opacity: 0.7, // 數字固定透明度
        textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
        animation: 'countdownNumber 1s ease-out',
        '@keyframes countdownNumber': {
            '0%': {
            transform: 'scale(0.5) rotate(-90deg)',
            },
            '50%': {
            transform: 'scale(1.2) rotate(-45deg)',
            },
            '100%': {
            transform: 'scale(1) rotate(0deg)',
            },
        },
        }}
    >
        {currentCount > 0 ? currentCount : '開始!'}
    </Typography>
    </Box>
    </Box>
  );
};

export default CountdownOverlay;