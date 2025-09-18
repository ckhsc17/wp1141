'use client';

import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Chip,
  Stack,
  Slider,
  FormControlLabel,
  Switch,
  Divider,
} from '@mui/material';
import { 
  PlayArrow, 
  Pause, 
  Refresh, 
  MusicNote,
  Speed,
  LibraryMusic,
  VolumeUp,
} from '@mui/icons-material';
import AbcRenderer from '@/components/AbcRenderer';
import CustomMetronome from '@/components/CustomMetronome';
import MobileFloatingButton from '@/components/MobileFloatingButton';
import LanguageToggle from '@/components/LanguageToggle';
import GlassCard from '@/components/GlassCard';
import { useRhythmGameViewModel } from '@/viewModels/RhythmGameViewModel';
import { useDeviceDetection } from '@/utils/deviceDetection';
import { useTranslation } from '@/hooks/useTranslation';

/**
 * 節奏遊戲主組件 - 純 UI 組件，遵循 MVVM 架構
 * 
 * 職責：
 * - 渲染遊戲界面
 * - 處理用戶交互
 * - 展示遊戲狀態
 * 
 * 業務邏輯完全委託給 RhythmGameViewModel
 */
const RhythmGame: React.FC = () => {
  // 國際化 Hook
  const { t, locale } = useTranslation();
  
  // 使用 ViewModel Hook - 所有業務邏輯都在這裡
  const viewModel = useRhythmGameViewModel();
  
  // 設備檢測 Hook
  const { isMobileDevice, isTouchDevice } = useDeviceDetection();

  // 解構 ViewModel 的狀態和方法
  const {
    gameState,
    gameSettings,
    audioSettings,
    uiState,
    notes,
    abcNotation,
    isGameActive,
    generateNewRhythm,
    startGame,
    pauseGame,
    updateGameSettings,
    updateGameState,
    updateUIState,
    handleTouchInput,
  } = viewModel;

  // 異步處理開始遊戲
  const handleStartGame = async () => {
    try {
      await startGame();
    } catch (error) {
      console.error('❌ Failed to start game:', error);
    }
  };

  // 異步處理觸控輸入（為 MobileFloatingButton 創建異步包裝）
  const handleAsyncTouchInput = async (): Promise<void> => {
    try {
      // 調用同步的 handleTouchInput，但包裝為異步
      handleTouchInput();
      return Promise.resolve();
    } catch (error) {
      console.error('❌ Touch input failed:', error);
      return Promise.reject(error);
    }
  };


  // 根據語言設置字體樣式
  const fontStyle = {
    fontFamily: locale === 'en' ? '"Times New Roman", serif' : 'inherit',
  };

  // 計算等級
  const getScoreGrade = (score: number): { grade: string; color: string; bgGradient: string } => {
    if (score >= 90) {
      return { 
        grade: 'S', 
        color: '#FFD700', 
        bgGradient: 'linear-gradient(135deg, #FFD700, #FFA500)' 
      };
    } else if (score >= 70) {
      return { 
        grade: 'A', 
        color: '#4CAF50', 
        bgGradient: 'linear-gradient(135deg, #4CAF50, #8BC34A)' 
      };
    } else if (score >= 50) {
      return { 
        grade: 'B', 
        color: '#2196F3', 
        bgGradient: 'linear-gradient(135deg, #2196F3, #03DAC6)' 
      };
    } else {
      return { 
        grade: 'C', 
        color: '#FF5722', 
        bgGradient: 'linear-gradient(135deg, #FF5722, #FF9800)' 
      };
    }
  };

  return (
    <Box sx={{ 
      ...fontStyle,
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      {/* 語言切換按鈕 */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <LanguageToggle />
      </Box>

      {/* 上方內容區域 */}
      <Box sx={{ flex: '0 0 auto', mb: 3 }}>
        <Stack spacing={3}>


            {/* 隱藏的節拍器組件 */}
            <Box sx={{ display: 'none' }}>
              <CustomMetronome
                bpm={gameSettings.bpm}
                isRunning={uiState.metronomeActive}
                soundEnabled={audioSettings.soundEnabled}
                gameTime={gameState.currentTime}
                countInBeats={gameState.isPracticeMode && gameState.isFirstRound ? 0 : 4}
              />
            </Box>

        </Stack>
      </Box>


      {/* 譜面顯示區域 - 固定在距離底部10%的位置，增加高度 */}
      <Box sx={{ 
        position: 'absolute',
        bottom: '10vh', // 距離底部10%視窗高度
        top: '65vh', // 從頂部30%開始，增加整體高度
        left: 0,
        right: 0,
        px: { xs: 2, sm: 3 }, // 左右邊距與主內容一致
        zIndex: 10,
        '@media (max-height: 600px)': {
          bottom: '5vh', // 小屏幕時調整為5%
          top: '25vh',
        },
        '@media (max-height: 400px)': {
          bottom: '15vh', // 非常小的屏幕時調整為15%
          top: '20vh',
        }
      }}>
        {abcNotation && (
          <AbcRenderer 
            abcNotation={abcNotation} 
            currentTime={gameState.currentTime}
            notes={notes}
            gameStats={{
              score: gameState.score,
              hitNotes: gameState.hitNotes,
              missedNotes: gameState.missedNotes,
              wrongNotes: gameState.wrongNotes,
            }}
            onGenerateNewRhythm={generateNewRhythm}
            onStartGame={handleStartGame}
            onPauseGame={pauseGame}
            onTogglePracticeMode={(enabled) => updateGameState({ 
              isPracticeMode: enabled,
              isFirstRound: enabled // 切換到練習模式時重置為第一輪
            })}
            isPlaying={gameState.isPlaying}
            isGameActive={isGameActive}
            isPracticeMode={gameState.isPracticeMode}
            // 新增控制桿相關 props
            gameSettings={gameSettings}
            updateGameSettings={updateGameSettings}
          />
        )}
      </Box>


      {/* 結果覆蓋層 - 優化位置避免遮擋譜面 */}
      {uiState.showResults && (
        <Box sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: '15vh', // 避免遮擋底部的譜面區域
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1300, // 高於其他元素
          p: 2,
        }}>
          <GlassCard 
            glassLevel={5} // 提高不透明度
            animated={true} 
            animationDelay={0}
            sx={{
              maxWidth: 400,
              width: '100%',
              maxHeight: '70vh', // 調整最大高度
              overflow: 'auto',
              // 額外的不透明度增強
              background: 'rgba(255, 255, 255, 0.7) !important',
              backdropFilter: 'blur(15px) !important',
            }}
          >
            <Box sx={{ p: 4 }}>
              <Stack spacing={3} alignItems="center">
                {/* 等級顯示 - 大大的動感等級 */}
                {(() => {
                  const { grade, color, bgGradient } = getScoreGrade(gameState.score);
                  return (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 120,
                        height: 120,
                        borderRadius: '50%',
                        background: bgGradient,
                        boxShadow: `0 8px 32px ${color}40`,
                        position: 'relative',
                        animation: 'gradeAnimation 0.8s ease-out',
                        '@keyframes gradeAnimation': {
                          '0%': {
                            transform: 'scale(0.5) rotate(-180deg)',
                            opacity: 0,
                          },
                          '50%': {
                            transform: 'scale(1.2) rotate(-90deg)',
                            opacity: 0.8,
                          },
                          '100%': {
                            transform: 'scale(1) rotate(0deg)',
                            opacity: 1,
                          },
                        },
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: -4,
                          left: -4,
                          right: -4,
                          bottom: -4,
                          borderRadius: '50%',
                          background: bgGradient,
                          opacity: 0.3,
                          animation: 'pulse 2s infinite',
                        },
                        '@keyframes pulse': {
                          '0%, 100%': {
                            transform: 'scale(1)',
                            opacity: 0.3,
                          },
                          '50%': {
                            transform: 'scale(1.1)',
                            opacity: 0.1,
                          },
                        },
                      }}
                    >
                      <Typography
                        variant="h1"
                        sx={{
                          ...fontStyle,
                          fontSize: '4rem',
                          fontWeight: 'bold',
                          color: 'white',
                          textShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
                          letterSpacing: '0.1em',
                        }}
                      >
                        {grade}
                      </Typography>
                    </Box>
                  );
                })()}
                
                {/* 統計數據 */}
                <Stack direction="row" spacing={2} flexWrap="wrap" justifyContent="center">
                  <Box textAlign="center">
                    <Typography variant="h6" color="success.main" sx={fontStyle}>
                      {gameState.hitNotes}
                    </Typography>
                    <Typography variant="body2" sx={fontStyle}>{t('results.hit')}</Typography>
                  </Box>
                  <Box textAlign="center">
                    <Typography variant="h6" color="error.main" sx={fontStyle}>
                      {gameState.missedNotes}
                    </Typography>
                    <Typography variant="body2" sx={fontStyle}>{t('results.missed')}</Typography>
                  </Box>
                  <Box textAlign="center">
                    <Typography variant="h6" color="warning.main" sx={fontStyle}>
                      {gameState.wrongNotes}
                    </Typography>
                    <Typography variant="body2" sx={fontStyle}>{t('results.wrong')}</Typography>
                  </Box>
                </Stack>
                
                {/* 得分顯示 - 替換原本的評價文字 */}
                <Typography variant="h5" align="center" sx={{ ...fontStyle, fontWeight: 'bold', color: 'primary.main' }}>
                  {t('stats.score')}: {gameState.score}
                </Typography>
                
                {/* 按鈕區域 */}
                <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                  <Button 
                    variant="outlined"
                    onClick={() => {
                      updateUIState({ showResults: false });
                    }} 
                    sx={fontStyle}
                  >
                    {t('results.close')}
                  </Button>
                  <Button 
                    variant="contained" 
                    onClick={() => {
                      updateUIState({ showResults: false });
                      generateNewRhythm();
                    }}
                    sx={fontStyle}
                  >
                    {t('results.playAgain')}
                  </Button>
                </Stack>
              </Stack>
            </Box>
          </GlassCard>
        </Box>
      )}

      {/* 手機版浮動按鈕 */}
      <MobileFloatingButton
        visible={isMobileDevice || isTouchDevice}
        onTap={handleAsyncTouchInput}
        isGameActive={isGameActive}
        isPracticeDemo={gameState.isPracticeMode && gameState.isFirstRound}
      />
    </Box>
  );
};

export default RhythmGame;