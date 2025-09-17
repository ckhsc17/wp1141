'use client';

import React from 'react';
import { Card, CardProps, useTheme } from '@mui/material';

interface GlassCardProps extends Omit<CardProps, 'elevation'> {
  /** 透明度級別 (1-5, 1最透明, 5最不透明) */
  glassLevel?: 1 | 2 | 3 | 4 | 5;
  /** 是否啟用進入動畫 */
  animated?: boolean;
  /** 動畫延遲時間（秒） */
  animationDelay?: number;
  /** 是否啟用懸停效果 */
  hover?: boolean;
}

/**
 * 玻璃態卡片組件
 * 提供半透明毛玻璃效果和進入動畫
 */
const GlassCard: React.FC<GlassCardProps> = ({
  children,
  glassLevel = 3,
  animated = true,
  animationDelay = 0,
  hover = true,
  sx = {},
  ...props
}) => {
  const theme = useTheme();

  // 根據透明度級別設置背景透明度
  const getGlassOpacity = (level: number) => {
    const opacities = {
      1: 0.1,
      2: 0.15,
      3: 0.2,
      4: 0.25,
      5: 0.3,
    };
    return opacities[level as keyof typeof opacities] || 0.2;
  };

  const glassOpacity = getGlassOpacity(glassLevel);

  return (
    <Card
      {...props}
      sx={{
        // 玻璃態效果
        background: `rgba(255, 255, 255, ${glassOpacity})`,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)', // Safari 支援
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        
        // 進入動畫
        ...(animated && {
          animation: `glassCardFadeIn 0.8s ease-out ${animationDelay}s both`,
        }),
        
        // 懸停效果
        ...(hover && {
          transition: 'all 0.3s ease',
          cursor: 'default',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
            background: `rgba(255, 255, 255, ${Math.min(glassOpacity + 0.05, 0.4)})`,
          },
        }),
        
        // 響應式調整
        [theme.breakpoints.down('sm')]: {
          backdropFilter: 'blur(5px)',
          WebkitBackdropFilter: 'blur(5px)',
          background: `rgba(255, 255, 255, ${Math.min(glassOpacity + 0.1, 0.4)})`,
        },
        
        // 動畫關鍵幀
        '@keyframes glassCardFadeIn': {
          '0%': {
            opacity: 0,
            transform: 'translateY(20px) scale(0.95)',
            backdropFilter: 'blur(0px)',
          },
          '50%': {
            opacity: 0.7,
            backdropFilter: 'blur(5px)',
          },
          '100%': {
            opacity: 1,
            transform: 'translateY(0) scale(1)',
            backdropFilter: 'blur(10px)',
          },
        },
        
        // 合併用戶自定義樣式
        ...sx,
      }}
    >
      {children}
    </Card>
  );
};

export default GlassCard;
