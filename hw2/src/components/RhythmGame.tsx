'use client';

import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  LinearProgress,
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
    progress,
    totalDuration,
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

  // 計算顯示用的時間信息
  const displayTime = gameState.currentTime < 0 
    ? `${t('stats.countDown')}: ${Math.ceil(-gameState.currentTime)}` 
    : `${t('stats.timeProgress')}: ${gameState.currentTime.toFixed(1)}s / ${totalDuration.toFixed(1)}s`;

  // 根據語言設置字體樣式
  const fontStyle = {
    fontFamily: locale === 'en' ? '"Times New Roman", serif' : 'inherit',
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

            {/* 遊戲統計和進度 */}
            <GlassCard glassLevel={2} animated={true} animationDelay={0.5}>
              <Box sx={{ p: 2 }}>
                {/* 遊戲統計 */}
                <Stack direction="row" spacing={2} sx={{ mb: 2 }} flexWrap="wrap">
                  <Chip 
                    icon={<MusicNote />} 
                    label={`${t('stats.score')}: ${gameState.score}`} 
                    color="primary" 
                    variant="outlined"
                    sx={fontStyle}
                  />
                  <Chip 
                    label={`${t('stats.hit')}: ${gameState.hitNotes}`} 
                    color="success" 
                    variant="outlined"
                    sx={fontStyle}
                  />
                  <Chip 
                    label={`${t('stats.missed')}: ${gameState.missedNotes}`} 
                    color="error" 
                    variant="outlined"
                    sx={fontStyle}
                  />
                  <Chip 
                    label={`${t('stats.wrong')}: ${gameState.wrongNotes}`} 
                    color="warning" 
                    variant="outlined"
                    sx={fontStyle}
                  />
                  <Chip 
                    label={`${t('stats.total')}: ${gameState.totalNotes}`} 
                    variant="outlined"
                    sx={fontStyle}
                  />
                  {gameState.isPracticeMode && gameState.isFirstRound && gameState.isPlaying && (
                    <Chip 
                      label={t('stats.demoRunning')}
                      color="info" 
                      variant="filled"
                      sx={fontStyle}
                    />
                  )}
                </Stack>

                {/* 進度條和時間顯示 */}
                <LinearProgress 
                  variant="determinate" 
                  value={progress} 
                  sx={{ height: 8, borderRadius: 4, mb: 1 }}
                />
                <Typography variant="body2" color="text.secondary" sx={fontStyle}>
                  {displayTime}
                </Typography>
              </Box>
            </GlassCard>
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


      {/* 結果覆蓋層 */}
      {uiState.showResults && (
        <Box sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1300, // 高於其他元素
          p: 2,
        }}>
          <GlassCard 
            glassLevel={3} 
            animated={true} 
            animationDelay={0}
            sx={{
              maxWidth: 500,
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto',
            }}
          >
            <Box sx={{ p: 4 }}>
              <Stack spacing={3} alignItems="center">
                {/* 分數顯示 */}
                <Typography variant="h4" color="primary" sx={fontStyle}>
                  {t('stats.score')}: {gameState.score}
                </Typography>
                
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
                  <Box textAlign="center">
                    <Typography variant="h6" sx={fontStyle}>
                      {gameState.totalNotes}
                    </Typography>
                    <Typography variant="body2" sx={fontStyle}>{t('results.total')}</Typography>
                  </Box>
                </Stack>
                
                {/* 評價文字 */}
                <Typography variant="h6" align="center" sx={fontStyle}>
                  {gameState.score >= 90 ? t('results.perfect') :
                   gameState.score >= 70 ? t('results.great') :
                   gameState.score >= 50 ? t('results.good') : t('results.keepTrying')}
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