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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
    <Box sx={fontStyle}>
      {/* 語言切換按鈕 */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <LanguageToggle />
      </Box>

      {/* 主遊戲區域 */}
      <Box sx={{ mb: 3 }}>
        <Stack spacing={3}>


            {/* 遊戲設置區 */}
            <GlassCard glassLevel={3} animated={true} animationDelay={0.3}>
              <Box sx={{ p: 2 }}>
                <Stack spacing={2}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, ...fontStyle }}>
                    <Speed /> {t('game.gameSettings')}
                  </Typography>
                  
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                    {/* BPM 設置 */}
                    <Box sx={{ minWidth: 200 }}>
                      <Typography gutterBottom sx={fontStyle}>
                        {t('game.bpm')}: {gameSettings.bpm}
                      </Typography>
                      <Slider
                        value={gameSettings.bpm}
                        onChange={(_, value) => updateGameSettings({ bpm: value as number })}
                        min={60}
                        max={180}
                        step={10}
                        marks={[
                          { value: 60, label: t('game.slow') },
                          { value: 120, label: t('game.medium') },
                          { value: 180, label: t('game.fast') }
                        ]}
                        disabled={isGameActive}
                      />
                    </Box>

                    {/* 小節數設置 */}
                    <Box sx={{ minWidth: 200 }}>
                      <Typography gutterBottom sx={fontStyle}>
                        {t('game.measures')}: {gameSettings.measures}
                      </Typography>
                      <Slider
                        value={gameSettings.measures}
                        onChange={(_, value) => updateGameSettings({ measures: value as number })}
                        min={1}
                        max={8}
                        step={1}
                        marks={[
                          { value: 1, label: '1' },
                          { value: 4, label: '4' },
                          { value: 8, label: '8' }
                        ]}
                        disabled={isGameActive}
                      />
                    </Box>

                  </Stack>

                  {/* 節拍器狀態 */}
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <VolumeUp color={uiState.metronomeActive ? "primary" : "disabled"} />
                    <Typography variant="body2" color={uiState.metronomeActive ? "primary" : "text.secondary"} sx={fontStyle}>
                      {uiState.metronomeActive ? t('game.metronomeRunning') : t('game.metronomeStopped')}
                    </Typography>
                  </Stack>

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
            </GlassCard>
          </Stack>
      </Box>

      {/* 遊戲統計和進度 */}
      <GlassCard glassLevel={2} animated={true} animationDelay={0.5} sx={{ mt: 3, mb: 3 }}>
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

      {/* 譜面顯示區域 */}
      <Box sx={{ mt: 3 }}>
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
          />
        )}
      </Box>


      {/* 結果對話框 */}
      <Dialog open={uiState.showResults} maxWidth="sm" fullWidth>
        <DialogTitle align="center" sx={fontStyle}>{t('results.title')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} alignItems="center">
            <Typography variant="h4" color="primary" sx={fontStyle}>
              {t('stats.score')}: {gameState.score}
            </Typography>
            <Stack direction="row" spacing={2}>
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
            <Typography variant="body1" align="center" sx={fontStyle}>
              {gameState.score >= 90 ? t('results.perfect') :
               gameState.score >= 70 ? t('results.great') :
               gameState.score >= 50 ? t('results.good') : t('results.keepTrying')}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            updateUIState({ showResults: false });
          }} sx={fontStyle}>
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
        </DialogActions>
      </Dialog>

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