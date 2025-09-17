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
import { useRhythmGameViewModel } from '@/viewModels/RhythmGameViewModel';
import { useDeviceDetection } from '@/utils/deviceDetection';

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

  // 計算顯示用的時間信息
  const displayTime = gameState.currentTime < 0 
    ? `預備拍: ${Math.ceil(-gameState.currentTime)}` 
    : `時間進度: ${gameState.currentTime.toFixed(1)}s / ${totalDuration.toFixed(1)}s`;

  return (
    <Box>
      {/* 主遊戲區域 */}
      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent>
          <Stack spacing={3}>
            {/* 標題 */}
            <Typography variant="h4" component="h1" align="center" gutterBottom>
              🎵 節奏練習遊戲
            </Typography>

            {/* 遊戲控制區 */}
            <Stack direction="row" spacing={2} justifyContent="center" alignItems="center">
              <Button
                variant="contained"
                color="primary"
                startIcon={<Refresh />}
                onClick={generateNewRhythm}
                disabled={isGameActive}
              >
                生成新節奏
              </Button>
              
              <Button
                variant={gameState.isPlaying ? "outlined" : "contained"}
                color={gameState.isPlaying ? "secondary" : "success"}
                startIcon={gameState.isPlaying ? <Pause /> : <PlayArrow />}
                onClick={gameState.isPlaying ? pauseGame : startGame}
                disabled={!abcNotation}
              >
                {gameState.isPlaying ? '暫停' : '開始'}
              </Button>
            </Stack>

            {/* 遊戲設置區 */}
            <Box sx={{ 
              border: '1px solid #e0e0e0', 
              borderRadius: 2, 
              p: 2, 
              backgroundColor: '#fafafa' 
            }}>
              <Stack spacing={2}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Speed /> 遊戲設置
                </Typography>
                
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                  {/* BPM 設置 */}
                  <Box sx={{ minWidth: 200 }}>
                    <Typography gutterBottom>BPM (速度): {gameSettings.bpm}</Typography>
                    <Slider
                      value={gameSettings.bpm}
                      onChange={(_, value) => updateGameSettings({ bpm: value as number })}
                      min={60}
                      max={180}
                      step={10}
                      marks={[
                        { value: 60, label: '慢' },
                        { value: 120, label: '中' },
                        { value: 180, label: '快' }
                      ]}
                      disabled={isGameActive}
                    />
                  </Box>

                  {/* 小節數設置 */}
                  <Box sx={{ minWidth: 200 }}>
                    <Typography gutterBottom>小節數: {gameSettings.measures}</Typography>
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

                  {/* 遊戲模式切換 */}
                  <Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={gameState.isPracticeMode}
                          onChange={(e) => updateGameState({ 
                            isPracticeMode: e.target.checked,
                            isFirstRound: e.target.checked // 切換到練習模式時重置為第一輪
                          })}
                          disabled={isGameActive}
                        />
                      }
                      label="練習模式"
                    />
                  </Box>
                </Stack>

                {/* 節拍器狀態 */}
                <Stack direction="row" alignItems="center" spacing={1}>
                  <VolumeUp color={uiState.metronomeActive ? "primary" : "disabled"} />
                  <Typography variant="body2" color={uiState.metronomeActive ? "primary" : "text.secondary"}>
                    {uiState.metronomeActive ? '節拍器運行中' : '節拍器已停止'}
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
          </Stack>
        </CardContent>
      </Card>

      <Divider sx={{ my: 3 }} />

      {/* 遊戲統計 */}
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <Chip 
          icon={<MusicNote />} 
          label={`得分: ${gameState.score}`} 
          color="primary" 
          variant="outlined"
        />
        <Chip 
          label={`命中: ${gameState.hitNotes}`} 
          color="success" 
          variant="outlined"
        />
        <Chip 
          label={`錯過: ${gameState.missedNotes}`} 
          color="error" 
          variant="outlined"
        />
        <Chip 
          label={`錯誤: ${gameState.wrongNotes}`} 
          color="warning" 
          variant="outlined"
        />
        <Chip 
          label={`總計: ${gameState.totalNotes}`} 
          variant="outlined"
        />
        {gameState.isPracticeMode && gameState.isFirstRound && gameState.isPlaying && (
          <Chip 
            label="🎵 系統示範中..." 
            color="info" 
            variant="filled"
          />
        )}
        {gameState.isPracticeMode && !gameState.isFirstRound && !gameState.isPlaying && gameState.gameStarted === false && (
          <Chip 
            label="✅ 示範完成，點擊開始練習！" 
            color="success" 
            variant="filled"
          />
        )}
      </Stack>

      {/* 進度條和時間顯示 */}
      <LinearProgress 
        variant="determinate" 
        value={progress} 
        sx={{ height: 8, borderRadius: 4 }}
      />
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        {displayTime}
      </Typography>

      {/* 譜面顯示區域 */}
      <Card elevation={2} sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LibraryMusic /> 節奏譜面
          </Typography>
          {abcNotation && (
            <AbcRenderer 
              abcNotation={abcNotation} 
              currentTime={gameState.currentTime}
              notes={notes}
            />
          )}
        </CardContent>
      </Card>

      {/* 操作說明 */}
      <Card elevation={1} sx={{ mt: 3, backgroundColor: '#f5f5f5' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🎮 操作說明
          </Typography>
          <Stack spacing={1}>
            <Typography variant="body2">
              • <strong>{isMobileDevice ? '觸控按鈕' : '空格鍵'}</strong>：按照節拍點擊
            </Typography>
            <Typography variant="body2">
              • <strong>練習模式</strong>：先播放示範，再進行練習
            </Typography>
            <Typography variant="body2">
              • <strong>測驗模式</strong>：直接開始，有4拍預備拍
            </Typography>
            <Typography variant="body2" color="primary">
              💡 <strong>提示</strong>：注意觀察灰色標記，它指示當前應該演奏的音符
            </Typography>
            {isMobileDevice && (
              <Typography variant="body2" color="success.main">
                📱 <strong>手機版</strong>：使用右下角的綠色浮動按鈕進行操作
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* 結果對話框 */}
      <Dialog open={uiState.showResults} maxWidth="sm" fullWidth>
        <DialogTitle align="center">🎉 遊戲結果</DialogTitle>
        <DialogContent>
          <Stack spacing={2} alignItems="center">
            <Typography variant="h4" color="primary">
              得分: {gameState.score}
            </Typography>
            <Stack direction="row" spacing={2}>
              <Box textAlign="center">
                <Typography variant="h6" color="success.main">
                  {gameState.hitNotes}
                </Typography>
                <Typography variant="body2">命中</Typography>
              </Box>
              <Box textAlign="center">
                <Typography variant="h6" color="error.main">
                  {gameState.missedNotes}
                </Typography>
                <Typography variant="body2">錯過</Typography>
              </Box>
              <Box textAlign="center">
                <Typography variant="h6" color="warning.main">
                  {gameState.wrongNotes}
                </Typography>
                <Typography variant="body2">錯誤</Typography>
              </Box>
              <Box textAlign="center">
                <Typography variant="h6">
                  {gameState.totalNotes}
                </Typography>
                <Typography variant="body2">總計</Typography>
              </Box>
            </Stack>
            <Typography variant="body1" align="center">
              {gameState.score >= 90 ? '🏆 完美！' :
               gameState.score >= 70 ? '👏 很好！' :
               gameState.score >= 50 ? '👍 不錯！' : '💪 繼續努力！'}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            updateUIState({ showResults: false });
          }}>
            關閉
          </Button>
          <Button 
            variant="contained" 
            onClick={() => {
              updateUIState({ showResults: false });
              generateNewRhythm();
            }}
          >
            再玩一次
          </Button>
        </DialogActions>
      </Dialog>

      {/* 手機版浮動按鈕 */}
      <MobileFloatingButton
        visible={isMobileDevice || isTouchDevice}
        onTap={handleTouchInput}
        isGameActive={isGameActive}
        isPracticeDemo={gameState.isPracticeMode && gameState.isFirstRound}
      />
    </Box>
  );
};

export default RhythmGame;