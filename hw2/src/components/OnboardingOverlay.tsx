'use client';

import React, { useState } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { 
  Hearing, 
  PlayArrow, 
  TouchApp, 
  MusicNote, 
  Speed,
  EmojiEvents,
  Shuffle,
  Tune,
  Refresh
} from '@mui/icons-material';

interface OnboardingStepProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  position: { top?: string; bottom?: string; left?: string; right?: string };
}

interface OnboardingOverlayProps {
  /** 是否顯示引導 */
  show: boolean;
  /** 引導完成回調 */
  onComplete?: () => void;
}

/**
 * 新手引導覆蓋層組件
 * 顯示遊戲操作說明的引導步驟
 */
const OnboardingOverlay: React.FC<OnboardingOverlayProps> = ({
  show,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  // 引導步驟定義
  const steps: OnboardingStepProps[] = [
    {
        icon: (
        <img
            src="/favicon.ico"
            alt="favicon"
            style={{
            width: 40,
            height: 40,
            objectFit: 'contain',
            }}
        />
        ),
        title: '歡迎來到節拍遊戲！',
        description: '這是一個幫助你提升音樂節拍感的互動遊戲。讓我們快速了解如何遊玩吧！',
        position: { top: '30%', left: '50%' },
    },
    {
      icon: <MusicNote sx={{ fontSize: 40, color: '#1976d2' }} />,
      title: '觀察樂譜',
      description: '遊戲會顯示一段樂譜，包含不同的音符和休止符。你需要在正確的時間點按下按鈕。',
      position: { top: '30%', left: '50%' }
    },
    {
      icon: <Speed sx={{ fontSize: 40, color: '#4caf50' }} />,
      title: '聆聽節拍器',
      description: '遊戲開始前會有4拍預備拍。跟著節拍器的節奏，準備在音符出現時按下按鈕。',
      position: { top: '40%', left: '50%' }
    },
    {
      icon: <TouchApp sx={{ fontSize: 40, color: '#ff9800' }} />,
      title: '輸入操作',
      description: '桌面版：按下空白鍵\n手機版：點擊右下角的綠色浮動按鈕',
      position: { top: '50%', left: '50%' }
    },
    {
      icon: <Hearing sx={{ fontSize: 40, color: '#9c27b0' }} />,
      title: '練習模式',
      description: '點擊耳機圖標切換練習模式。系統會先示範一遍，然後你可以跟著練習。',
      position: { top: '60%', left: '50%' }
    },
    {
      icon: <Refresh sx={{ fontSize: 40, color: '#1976d2' }} />,
      title: '隨機生成新譜面',
      description: '點擊刷新按鈕可以生成新的隨機樂譜。如果覺得困難版太難，也可以先減少小節數或放慢速度試試看！',
      position: { top: '65%', left: '50%' }
    },
    {
      icon: <Tune sx={{ fontSize: 40, color: '#607d8b' }} />,
      title: '調整遊戲設定',
      description: '在樂譜下方可以調整小節數、BPM速度和難度。建議初學者從「簡單」難度和較慢的BPM開始！',
      position: { top: '70%', left: '50%' }
    },
    {
      icon: <EmojiEvents sx={{ fontSize: 40, color: '#ffd700' }} />,
      title: '獲得評分',
      description: '根據你的準確度獲得 S/A/B/C 等級評價。避免在休止符處點擊，那會被算作錯誤！',
      position: { top: '75%', left: '50%' }
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // 完成引導
      onComplete?.();
    }
  };

  const handleSkip = () => {
    onComplete?.();
  };

  if (!show) return null;

  const currentStepData = steps[currentStep];

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 2500, // 確保在最上層
        backgroundColor: 'transparent', // 完全透明背景
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'onboardingFadeIn 0.5s ease-out',
        '@keyframes onboardingFadeIn': {
          '0%': { opacity: 0 },
          '100%': { opacity: 0.7 }
        }
      }}
      onClick={handleNext} // 點擊任何地方都可以進到下一步
    >
     <Paper
        elevation={8}
        sx={{
            position: 'absolute', // 確保絕對定位
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)', // 居中
            maxWidth: 400,
            width: '90%',
            p: 4,
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.8)', // floating card 樣式
            borderRadius: 3,
            animation: 'stepAppear 0.6s ease-out',
            '@keyframes stepAppear': {
            '0%': {
                transform: 'translate(-50%, -50%) scale(0.8) rotate(-10deg)',
                opacity: 0,
            },
            '60%': {
                transform: 'translate(-50%, -50%) scale(1.05) rotate(2deg)',
                opacity: 0.9,
            },
            '100%': {
                transform: 'translate(-50%, -50%) scale(1) rotate(0deg)',
                opacity: 1,
            },
            },
        }}
        >
        {/* 步驟圖標 */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mb: 2,
            '& svg': {
              animation: 'iconBounce 2s ease-in-out infinite',
              '@keyframes iconBounce': {
                '0%, 100%': { transform: 'translateY(0)' },
                '50%': { transform: 'translateY(-10px)' }
              }
            }
          }}
        >
          {currentStepData.icon}
        </Box>

        {/* 步驟標題 */}
        <Typography 
          variant="h5" 
          sx={{ 
            fontWeight: 'bold', 
            color: '#333', 
            mb: 2,
            animation: 'titleSlide 0.8s ease-out 0.2s both',
            '@keyframes titleSlide': {
              '0%': { 
                transform: 'translateY(20px)', 
                opacity: 0 
              },
              '100%': { 
                transform: 'translateY(0)', 
                opacity: 1 
              }
            }
          }}
        >
          {currentStepData.title}
        </Typography>

        {/* 步驟描述 */}
        <Typography 
          variant="body1" 
          sx={{ 
            color: '#666', 
            mb: 3, 
            lineHeight: 1.6,
            whiteSpace: 'pre-line', // 支持換行
            animation: 'textFade 1s ease-out 0.4s both',
            '@keyframes textFade': {
              '0%': { opacity: 0 },
              '100%': { opacity: 1 }
            }
          }}
        >
          {currentStepData.description}
        </Typography>

        {/* 進度指示器 */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          {steps.map((_, index) => (
            <Box
              key={index}
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                mx: 0.5,
                backgroundColor: index === currentStep ? '#1976d2' : '#ddd',
                transition: 'background-color 0.3s ease',
                animation: index === currentStep ? 'dotPulse 1s ease-in-out infinite' : 'none',
                '@keyframes dotPulse': {
                  '0%, 100%': { transform: 'scale(1)' },
                  '50%': { transform: 'scale(1.3)' }
                }
              }}
            />
          ))}
        </Box>

        {/* 操作按鈕 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
          <Button 
            variant="outlined" 
            onClick={(e) => {
              e.stopPropagation(); // 防止觸發父元素的點擊事件
              handleSkip();
            }}
            sx={{ 
              flex: 1,
              animation: 'buttonSlideUp 0.8s ease-out 0.6s both',
              '@keyframes buttonSlideUp': {
                '0%': { 
                  transform: 'translateY(20px)', 
                  opacity: 0 
                },
                '100%': { 
                  transform: 'translateY(0)', 
                  opacity: 1 
                }
              }
            }}
          >
            跳過
          </Button>
          <Button 
            variant="contained" 
            onClick={(e) => {
              e.stopPropagation(); // 防止觸發父元素的點擊事件
              handleNext();
            }}
            sx={{ 
              flex: 1,
              animation: 'buttonSlideUp 0.8s ease-out 0.7s both'
            }}
          >
            {currentStep < steps.length - 1 ? '下一步' : '開始遊戲！'}
          </Button>
        </Box>

        {/* 提示文字 */}
        <Typography 
          variant="caption" 
          sx={{ 
            display: 'block', 
            mt: 2, 
            color: '#999',
            animation: 'hintFade 1s ease-out 1s both',
            '@keyframes hintFade': {
              '0%': { opacity: 0 },
              '100%': { opacity: 1 }
            }
          }}
        >
          點擊任何地方或按下按鈕繼續
        </Typography>
      </Paper>
    </Box>
  );
};

export default OnboardingOverlay;