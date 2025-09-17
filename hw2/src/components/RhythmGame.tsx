'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  TextField,
  FormControlLabel,
  Switch,
  Divider,
} from '@mui/material';
import { 
  PlayArrow, 
  Pause, 
  Refresh, 
  MusicNote,
  KeyboardArrowDown,
  Speed,
  LibraryMusic,
  VolumeUp,
} from '@mui/icons-material';
import AbcRenderer from '@/components/AbcRenderer';
import { generateRandomRhythm } from '@/utils/rhythmGenerator';
import AudioUtils, { NOTE_FREQUENCIES } from '@/utils/audioUtils';
import CustomMetronome from '@/components/CustomMetronome';

interface Note {
  id: string;
  time: number; // 相對時間 (秒)
  duration: number;
  hit?: boolean;
  missed?: boolean;
}

interface GameState {
  isPlaying: boolean;
  currentTime: number;
  score: number;
  totalNotes: number;
  hitNotes: number;
  missedNotes: number;
  gameStarted: boolean;
  gameEnded: boolean;
  isPracticeMode: boolean;
  isFirstRound: boolean; // 練習模式的第一輪（系統示範）
}

const RhythmGame: React.FC = () => {
  const [abcNotation, setAbcNotation] = useState<string>('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    currentTime: 0,
    score: 0,
    totalNotes: 0,
    hitNotes: 0,
    missedNotes: 0,
    gameStarted: false,
    gameEnded: false,
    isPracticeMode: true,
    isFirstRound: true,
  });
  
  const [showResults, setShowResults] = useState(false);
  const [tolerance] = useState(0.2); // 200ms 容錯時間
  const [bpm, setBpm] = useState(100);
  const [measures, setMeasures] = useState(2);
  const [metronomeActive, setMetronomeActive] = useState(false);
  
  const gameRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const audioUtils = useRef<AudioUtils>(AudioUtils.getInstance());
  const practiceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 生成隨機節奏譜
  const generateNewRhythm = useCallback(() => {
    const { abc, noteList } = generateRandomRhythm(measures, bpm);
    setAbcNotation(abc);
    setNotes(noteList);
    setGameState(prev => ({
      ...prev,
      totalNotes: noteList.length,
      score: 0,
      hitNotes: 0,
      missedNotes: 0,
      currentTime: 0,
      gameStarted: false,
      gameEnded: false,
      isPlaying: false,
      isFirstRound: prev.isPracticeMode,
    }));
    setShowResults(false);
    setMetronomeActive(false);
  }, [measures, bpm]);

  // 播放練習模式的示範
  const playPracticeDemo = useCallback(() => {
    if (!notes.length) return;

    notes.forEach((note, index) => {
      practiceTimeoutRef.current = setTimeout(() => {
        // 播放音符聲音
        const noteFrequency = NOTE_FREQUENCIES['C']; // 簡化，都用C音
        audioUtils.current.createNoteSound(noteFrequency, 0.3);
        
        // 最後一個音符後結束示範
        if (index === notes.length - 1) {
          setTimeout(() => {
            setGameState(prev => ({
              ...prev,
              isPlaying: false,
              isFirstRound: false,
            }));
          }, 500);
        }
      }, note.time * 1000);
    });
  }, [notes]);

  // 開始遊戲
  const startGame = useCallback(() => {
    if (!abcNotation || notes.length === 0) return;

    // 恢復音頻上下文
    audioUtils.current.resumeAudioContext();

    startTimeRef.current = Date.now();
    setGameState(prev => ({ 
      ...prev, 
      isPlaying: true, 
      gameStarted: true,
      currentTime: 0 
    }));

    // 啟動節拍器
    setMetronomeActive(true);

    // 如果是練習模式的第一輪，播放示範
    if (gameState.isPracticeMode && gameState.isFirstRound) {
      playPracticeDemo();
      return;
    }

    // 遊戲計時器
    gameRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      
      setGameState(prev => {
        const newState = { ...prev, currentTime: elapsed };
        
        // 檢查是否有音符被錯過（超過容錯時間且未被命中）
        // 使用函數式更新來確保獲取最新的 notes 狀態
        let latestNotes = notes;
        
        setNotes(currentNotes => {
          const updatedNotes = currentNotes.map(note => {
            // 關鍵修復：只有未被命中(hit=false)且未被標記為錯過的音符才會被檢查
            // 這確保了一旦音符被標記為 hit，就不會再被標記為 missed
            if (!note.hit && !note.missed && elapsed > note.time + tolerance) {
              return { ...note, missed: true };
            }
            return note;
          });
          latestNotes = updatedNotes;
          return updatedNotes;
        });
        
        // 基於更新後的音符計算統計數據
        const missedCount = latestNotes.filter(n => n.missed).length;
        const hitCount = latestNotes.filter(n => n.hit).length;
        
        // 檢查遊戲是否結束
        const totalProcessed = hitCount + missedCount;
        if (totalProcessed >= notes.length) {
          clearInterval(gameRef.current!);
          setMetronomeActive(false);
          return {
            ...newState,
            isPlaying: false,
            gameEnded: true,
            missedNotes: missedCount,
            hitNotes: hitCount,
            score: Math.round((hitCount / notes.length) * 100)
          };
        }
        
        return {
          ...newState,
          missedNotes: missedCount,
          hitNotes: hitCount,
          score: Math.round((hitCount / Math.max(totalProcessed, 1)) * 100)
        };
      });
    }, 50);
  }, [abcNotation, notes, tolerance, gameState.isPracticeMode, gameState.isFirstRound, playPracticeDemo]);

  // 暫停遊戲
  const pauseGame = useCallback(() => {
    if (gameRef.current) {
      clearInterval(gameRef.current);
      gameRef.current = null;
    }
    if (practiceTimeoutRef.current) {
      clearTimeout(practiceTimeoutRef.current);
      practiceTimeoutRef.current = null;
    }
    setMetronomeActive(false);
    setGameState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  // 處理按鍵
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (event.code === 'Space' && gameState.isPlaying) {
      event.preventDefault();
      
      // 如果是練習模式的第一輪（示範），不處理按鍵
      if (gameState.isPracticeMode && gameState.isFirstRound) {
        return;
      }
      
      const currentTime = gameState.currentTime;
      
      // 尋找在容錯範圍內的音符
      const availableNotes = notes.filter(note => !note.hit && !note.missed);
      if (availableNotes.length === 0) return;
      
      // 找到在容錯時間內的音符
      const validNotes = availableNotes.filter(note => {
        const timeDiff = Math.abs(note.time - currentTime);
        return timeDiff <= tolerance;
      });
      
      if (validNotes.length > 0) {
        // 如果有多個在範圍內的音符，選擇最接近的
        const closestNote = validNotes.reduce((closest, note) => {
          const timeDiff = Math.abs(note.time - currentTime);
          const closestDiff = Math.abs(closest.time - currentTime);
          return timeDiff < closestDiff ? note : closest;
        }, validNotes[0]);
        
        // 命中！
        audioUtils.current.createKeyPressSound(true);
        setNotes(prev => prev.map(note => 
          note.id === closestNote.id ? { ...note, hit: true, missed: false } : note
        ));
      } else {
        // 沒有在範圍內的音符，這是一個錯誤的按鍵
        audioUtils.current.createKeyPressSound(false);
        // 不標記任何音符，這只是一個錯誤的按鍵時機
      }
    }
  }, [gameState.isPlaying, gameState.currentTime, gameState.isPracticeMode, gameState.isFirstRound, notes, tolerance]);

  // 鍵盤事件監聽
  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  // 遊戲結束處理
  useEffect(() => {
    if (gameState.gameEnded) {
      setShowResults(true);
    }
  }, [gameState.gameEnded]);

  // 清理計時器
  useEffect(() => {
    return () => {
      if (gameRef.current) {
        clearInterval(gameRef.current);
      }
      if (practiceTimeoutRef.current) {
        clearTimeout(practiceTimeoutRef.current);
      }
    };
  }, []);

  // 初始化時生成第一個節奏
  useEffect(() => {
    generateNewRhythm();
  }, [generateNewRhythm]);

  // 計算時間進度（而不是音符完成進度）
  const totalDuration = notes.length > 0 ? notes[notes.length - 1]?.time || 0 : 0;
  const progress = totalDuration > 0 
    ? Math.min((gameState.currentTime / totalDuration) * 100, 100)
    : 0;

  return (
    <Box>
      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent>
          <Stack spacing={3}>
            {/* 模式切換 */}
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={gameState.isPracticeMode}
                    onChange={(e) => setGameState(prev => ({
                      ...prev,
                      isPracticeMode: e.target.checked,
                      isFirstRound: e.target.checked,
                    }))}
                    disabled={gameState.isPlaying}
                  />
                }
                label={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <LibraryMusic />
                    <Typography>
                      {gameState.isPracticeMode ? '練習模式' : '測驗模式'}
                    </Typography>
                  </Stack>
                }
              />
              {gameState.isPracticeMode && (
                <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                  第一次播放：系統示範 | 第二次播放：跟隨練習
                </Typography>
              )}
            </Box>

            {/* 控制區域 */}
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              {/* 左側控制 */}
              <Box sx={{ flex: '1 1 400px' }}>
                <Stack spacing={3}>
                  {/* 小節數設定 */}
                  <Box>
                    <Typography gutterBottom>小節數: {measures}</Typography>
                    <Slider
                      value={measures}
                      onChange={(_, value) => setMeasures(value as number)}
                      min={1}
                      max={8}
                      marks
                      step={1}
                      disabled={gameState.isPlaying}
                      sx={{ maxWidth: 300 }}
                    />
                  </Box>

                  {/* 控制按鈕 */}
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Button
                      variant="contained"
                      startIcon={<Refresh />}
                      onClick={generateNewRhythm}
                      disabled={gameState.isPlaying}
                    >
                      隨機生成
                    </Button>
                    
                    {!gameState.gameStarted ? (
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<PlayArrow />}
                        onClick={startGame}
                        disabled={!abcNotation}
                      >
                        開始{gameState.isPracticeMode && gameState.isFirstRound ? '示範' : '遊戲'}
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        color={gameState.isPlaying ? "warning" : "success"}
                        startIcon={gameState.isPlaying ? <Pause /> : <PlayArrow />}
                        onClick={gameState.isPlaying ? pauseGame : startGame}
                      >
                        {gameState.isPlaying ? '暫停' : '繼續'}
                      </Button>
                    )}
                  </Stack>
                </Stack>
              </Box>

              {/* 右側 BPM 控制區 */}
              <Box sx={{ flex: '0 0 300px' }}>
                <Card variant="outlined" sx={{ p: 2, height: 'fit-content' }}>
                  <Stack spacing={2}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Speed />
                      <Typography variant="h6">節拍器</Typography>
                    </Stack>
                    
                    {/* BPM 滑動條 */}
                    <Box>
                      <Typography gutterBottom>BPM: {bpm}</Typography>
                      <Slider
                        value={bpm}
                        onChange={(_, value) => setBpm(value as number)}
                        min={60}
                        max={200}
                        step={5}
                        disabled={gameState.isPlaying}
                        marks={[
                          { value: 60, label: '60' },
                          { value: 100, label: '100' },
                          { value: 140, label: '140' },
                          { value: 200, label: '200' },
                        ]}
                      />
                    </Box>

                    {/* BPM 輸入框 */}
                    <TextField
                      label="BPM"
                      type="number"
                      value={bpm}
                      onChange={(e) => {
                        const value = Math.max(60, Math.min(200, parseInt(e.target.value) || 60));
                        setBpm(value);
                      }}
                      inputProps={{ min: 60, max: 200, step: 5 }}
                      disabled={gameState.isPlaying}
                      size="small"
                    />

                    {/* 節拍器狀態 */}
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <VolumeUp color={metronomeActive ? "primary" : "disabled"} />
                      <Typography variant="body2" color={metronomeActive ? "primary" : "text.secondary"}>
                        {metronomeActive ? '節拍器運行中' : '節拍器已停止'}
                      </Typography>
                    </Stack>

                    {/* 隱藏的節拍器組件 */}
                    <Box sx={{ display: 'none' }}>
                      <CustomMetronome
                        bpm={bpm}
                        isRunning={metronomeActive}
                        soundEnabled={true}
                        gameTime={gameState.currentTime}
                      />
                    </Box>
                  </Stack>
                </Card>
              </Box>
            </Box>
          </Stack>

          <Divider sx={{ my: 3 }} />

          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <Chip 
              icon={<MusicNote />} 
              label={`得分: ${gameState.score}%`} 
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
          </Stack>

          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ height: 8, borderRadius: 4 }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            時間進度: {gameState.currentTime.toFixed(1)}s / {totalDuration.toFixed(1)}s
          </Typography>
        </CardContent>
      </Card>

      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            節奏譜
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

      <Card elevation={3}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <KeyboardArrowDown />
            <Typography variant="h6">
              {gameState.isPracticeMode && gameState.isFirstRound 
                ? '🎧 聆聽系統示範' 
                : '按空白鍵跟隨節奏！'
              }
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {gameState.isPracticeMode && gameState.isFirstRound 
              ? '第一輪：仔細聆聽系統播放的正確節奏，準備下一輪的練習'
              : '當音符移動到指定位置時按下空白鍵，容錯時間為 200ms'
            }
          </Typography>
          {metronomeActive && (
            <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
              🔊 節拍器正在以 {bpm} BPM 的速度播放
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* 結果對話框 */}
      <Dialog open={showResults} maxWidth="sm" fullWidth>
        <DialogTitle align="center">🎉 遊戲結果</DialogTitle>
        <DialogContent>
          <Stack spacing={2} alignItems="center">
            <Typography variant="h4" color="primary">
              得分: {gameState.score}%
            </Typography>
            <Stack direction="row" spacing={3}>
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
          <Button onClick={() => setShowResults(false)}>
            關閉
          </Button>
          <Button 
            variant="contained" 
            onClick={() => {
              setShowResults(false);
              generateNewRhythm();
            }}
          >
            再玩一次
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RhythmGame;
