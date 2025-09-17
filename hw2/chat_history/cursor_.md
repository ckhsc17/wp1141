# 前端音樂練習網站開發計畫
_Exported on 9/17/2025 at 16:57:04 GMT+8 from Cursor (1.6.26)_

---

**User**

我現在想做一個純前端的線上音樂練習＆創作網站，可以按一下隨機生成之後生成節奏譜，然後按下開始之後就會有一個譜在畫面上移動，使用者要按照節奏點擊空白鍵，然後系統會結算哪些音符有打對，哪些打錯

我想用 next.js 搭配 material UI 實作這個遊戲網站，並且逐步迭代驗證來開發，先用abcjs 試試看

| 想先做原型 / 開發速度快／簡單功能先上手                | **abcjs**                            | 可以先用 ABC Notation 或文字格式譜庫，做出基本的“譜移動 + 播放 +按鍵比對”流程。工作量小，容易驗證核心機制。     |
| 譜素材來自 MusicXML（例如你想匯入現有譜、或使用其他譜軟體生成） | **OSMD + VexFlow**                   | OSMD 可以直接讀 MusicXML 並渲染出譜，減少你手動做譜的負擔，VexFlow 用來做視覺控制或動畫效果很強。         |
| 想要高度客製化視覺 + 複雜譜 +漂亮排版 +動畫互動 +游標同步精確  | **VexFlow 作為渲染引擎 + 自己管理譜資料或搭配 OSMD** | 用 VexFlow 你可以完全控制譜的外觀／動畫／高亮／游標／按鍵反饋等。你也可以結合 OSMD 作檔案匯入 + layout 的部分。 |

先盡量做出一個完整的第一版
然後專案開一個新個 hw2 資料夾

---

**Cursor**

我來幫你創建一個基於 Next.js + Material UI + abcjs 的線上音樂練習網站！讓我先創建項目結構並實現基本功能。

現在讓我創建基本的項目結構和組件。首先來看看當前的項目結構：

現在讓我創建音樂練習網站的主要組件。首先創建基本的頁面結構：

```typescriptreact
'use client';

import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Container, Typography, Box } from '@mui/material';
import RhythmGame from '@/components/RhythmGame';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

export default function Home() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Typography 
            variant="h3" 
            component="h1" 
            gutterBottom 
            align="center"
            sx={{ mb: 4, fontWeight: 'bold' }}
          >
            🎵 線上音樂練習 & 創作網站
          </Typography>
          
          <Typography 
            variant="h6" 
            align="center" 
            color="text.secondary" 
            sx={{ mb: 6 }}
          >
            按照節奏點擊空白鍵，測試你的音樂感！
          </Typography>

          <RhythmGame />
        </Box>
      </Container>
    </ThemeProvider>
  );
}
```

現在創建主要的節奏遊戲組件：

```typescriptreact
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
} from '@mui/material';
import { 
  PlayArrow, 
  Pause, 
  Refresh, 
  MusicNote,
  KeyboardArrowDown 
} from '@mui/icons-material';
import AbcRenderer from './AbcRenderer';
import { generateRandomRhythm } from '@/utils/rhythmGenerator';

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
  });
  
  const [showResults, setShowResults] = useState(false);
  const [tolerance] = useState(0.2); // 200ms 容錯時間
  const gameRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // 生成隨機節奏譜
  const generateNewRhythm = useCallback(() => {
    const { abc, noteList } = generateRandomRhythm();
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
    }));
    setShowResults(false);
  }, []);

  // 開始遊戲
  const startGame = useCallback(() => {
    if (!abcNotation || notes.length === 0) return;

    startTimeRef.current = Date.now();
    setGameState(prev => ({ 
      ...prev, 
      isPlaying: true, 
      gameStarted: true,
      currentTime: 0 
    }));

    // 遊戲計時器
    gameRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      
      setGameState(prev => {
        const newState = { ...prev, currentTime: elapsed };
        
        // 檢查是否有音符被錯過
        const updatedNotes = notes.map(note => {
          if (!note.hit && !note.missed && elapsed > note.time + tolerance) {
            return { ...note, missed: true };
          }
          return note;
        });
        
        const missedCount = updatedNotes.filter(n => n.missed).length;
        const hitCount = updatedNotes.filter(n => n.hit).length;
        
        // 更新錯過的音符
        if (missedCount > prev.missedNotes) {
          setNotes(updatedNotes);
        }
        
        // 檢查遊戲是否結束
        const totalProcessed = hitCount + missedCount;
        if (totalProcessed >= notes.length) {
          clearInterval(gameRef.current!);
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
  }, [abcNotation, notes, tolerance]);

  // 暫停遊戲
  const pauseGame = useCallback(() => {
    if (gameRef.current) {
      clearInterval(gameRef.current);
      gameRef.current = null;
    }
    setGameState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  // 處理按鍵
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (event.code === 'Space' && gameState.isPlaying) {
      event.preventDefault();
      
      const currentTime = gameState.currentTime;
      
      // 尋找最接近的音符
      const availableNotes = notes.filter(note => !note.hit && !note.missed);
      const closestNote = availableNotes.reduce((closest, note) => {
        const timeDiff = Math.abs(note.time - currentTime);
        const closestDiff = Math.abs(closest.time - currentTime);
        return timeDiff < closestDiff ? note : closest;
      }, availableNotes[0]);

      if (closestNote) {
        const timeDiff = Math.abs(closestNote.time - currentTime);
        
        if (timeDiff <= tolerance) {
          // 命中！
          setNotes(prev => prev.map(note => 
            note.id === closestNote.id ? { ...note, hit: true } : note
          ));
        }
      }
    }
  }, [gameState.isPlaying, gameState.currentTime, notes, tolerance]);

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
    };
  }, []);

  // 初始化時生成第一個節奏
  useEffect(() => {
    generateNewRhythm();
  }, [generateNewRhythm]);

  const progress = gameState.totalNotes > 0 
    ? ((gameState.hitNotes + gameState.missedNotes) / gameState.totalNotes) * 100 
    : 0;

  return (
    <Box>
      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
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
                開始遊戲
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
          </Stack>

          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ height: 8, borderRadius: 4 }}
          />
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
              按空白鍵跟隨節奏！
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            當音符移動到指定位置時按下空白鍵，容錯時間為 200ms
          </Typography>
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
```

現在創建 ABC 渲染組件：

```typescriptreact
'use client';

import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import abcjs from 'abcjs';

interface Note {
  id: string;
  time: number;
  duration: number;
  hit?: boolean;
  missed?: boolean;
}

interface AbcRendererProps {
  abcNotation: string;
  currentTime?: number;
  notes?: Note[];
}

const AbcRenderer: React.FC<AbcRendererProps> = ({ 
  abcNotation, 
  currentTime = 0, 
  notes = [] 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const visualObjRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || !abcNotation) return;

    try {
      // 清除之前的內容
      containerRef.current.innerHTML = '';

      // 渲染 ABC 記譜法
      const visualObj = abcjs.renderAbc(containerRef.current, abcNotation, {
        responsive: 'resize',
        scale: 1.2,
        staffwidth: 600,
        add_classes: true,
        clickListener: (abcElem: any) => {
          console.log('Clicked element:', abcElem);
        }
      });

      visualObjRef.current = visualObj;

      // 添加視覺效果的 CSS
      const style = document.createElement('style');
      style.textContent = `
        .abcjs-note.hit {
          fill: #4caf50 !important;
          stroke: #2e7d32 !important;
          stroke-width: 2px !important;
        }
        .abcjs-note.missed {
          fill: #f44336 !important;
          stroke: #c62828 !important;
          stroke-width: 2px !important;
        }
        .abcjs-note.current {
          fill: #ff9800 !important;
          stroke: #f57c00 !important;
          stroke-width: 3px !important;
          animation: pulse 0.5s infinite alternate;
        }
        @keyframes pulse {
          from { opacity: 0.7; }
          to { opacity: 1; }
        }
        .abcjs-cursor {
          stroke: #2196f3;
          stroke-width: 3px;
          fill: none;
        }
      `;
      document.head.appendChild(style);

      return () => {
        document.head.removeChild(style);
      };
    } catch (error) {
      console.error('Error rendering ABC notation:', error);
    }
  }, [abcNotation]);

  // 更新音符狀態的視覺效果
  useEffect(() => {
    if (!containerRef.current || !visualObjRef.current) return;

    try {
      const svg = containerRef.current.querySelector('svg');
      if (!svg) return;

      // 重置所有音符樣式
      const allNotes = svg.querySelectorAll('.abcjs-note');
      allNotes.forEach((note: Element) => {
        (note as SVGElement).classList.remove('hit', 'missed', 'current');
      });

      // 根據遊戲狀態更新音符顏色
      notes.forEach((note, index) => {
        const noteElement = allNotes[index] as SVGElement;
        if (noteElement) {
          if (note.hit) {
            noteElement.classList.add('hit');
          } else if (note.missed) {
            noteElement.classList.add('missed');
          } else if (Math.abs(note.time - currentTime) < 0.5) {
            noteElement.classList.add('current');
          }
        }
      });

      // 添加時間游標
      const existingCursor = svg.querySelector('.abcjs-cursor');
      if (existingCursor) {
        existingCursor.remove();
      }

      if (currentTime > 0 && notes.length > 0) {
        const progress = Math.min(currentTime / (notes[notes.length - 1]?.time || 1), 1);
        const svgWidth = svg.getBBox().width;
        const cursorX = progress * svgWidth;

        const cursor = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        cursor.setAttribute('class', 'abcjs-cursor');
        cursor.setAttribute('x1', cursorX.toString());
        cursor.setAttribute('y1', '0');
        cursor.setAttribute('x2', cursorX.toString());
        cursor.setAttribute('y2', svg.getBBox().height.toString());
        svg.appendChild(cursor);
      }
    } catch (error) {
      console.error('Error updating visual effects:', error);
    }
  }, [currentTime, notes]);

  return (
    <Box
      ref={containerRef}
      sx={{
        width: '100%',
        minHeight: 200,
        border: '1px solid #e0e0e0',
        borderRadius: 1,
        p: 2,
        backgroundColor: '#fafafa',
        overflow: 'auto',
        '& svg': {
          maxWidth: '100%',
          height: 'auto',
        }
      }}
    />
  );
};

export default AbcRenderer;
```

現在創建節奏生成器工具：

```typescript
interface Note {
  id: string;
  time: number; // 相對時間 (秒)
  duration: number;
  hit?: boolean;
  missed?: boolean;
}

interface RhythmPattern {
  abc: string;
  noteList: Note[];
}

// 基本節奏模式
const RHYTHM_PATTERNS = [
  // 簡單的四分音符模式
  {
    notes: ['C', 'D', 'E', 'F'],
    durations: [1, 1, 1, 1], // 四分音符
    pattern: 'simple_quarter'
  },
  // 混合節奏
  {
    notes: ['C', 'C', 'D', 'E', 'E', 'F'],
    durations: [0.5, 0.5, 1, 0.5, 0.5, 1], // 八分音符和四分音符混合
    pattern: 'mixed_rhythm'
  },
  // 快速節奏
  {
    notes: ['C', 'D', 'C', 'E', 'D', 'F', 'E', 'G'],
    durations: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5], // 全八分音符
    pattern: 'eighth_notes'
  },
  // 附點節奏
  {
    notes: ['C', 'D', 'E', 'F', 'G'],
    durations: [1.5, 0.5, 1, 1, 1], // 附點四分音符模式
    pattern: 'dotted_rhythm'
  },
  // 三連音模式
  {
    notes: ['C', 'D', 'E', 'C', 'D', 'E'],
    durations: [0.67, 0.67, 0.66, 0.67, 0.67, 0.66], // 三連音
    pattern: 'triplets'
  }
];

// 音符到 ABC 記譜法的映射
const NOTE_TO_ABC: { [key: string]: string } = {
  'C': 'C',
  'D': 'D', 
  'E': 'E',
  'F': 'F',
  'G': 'G',
  'A': 'A',
  'B': 'B',
};

// 時長到 ABC 記譜法的映射
const DURATION_TO_ABC: { [key: number]: string } = {
  0.25: '/4',  // 十六分音符
  0.5: '/2',   // 八分音符
  0.66: '/3',  // 三連音
  0.67: '/3',  // 三連音
  1: '',       // 四分音符 (默認)
  1.5: '3/2',  // 附點四分音符
  2: '2',      // 二分音符
  4: '4',      // 全音符
};

// 生成隨機節奏
export function generateRandomRhythm(): RhythmPattern {
  // 隨機選擇一個節奏模式
  const pattern = RHYTHM_PATTERNS[Math.floor(Math.random() * RHYTHM_PATTERNS.length)];
  
  // 隨機調整音符 (可選)
  const availableNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const shouldRandomizeNotes = Math.random() > 0.5;
  
  let notes = pattern.notes;
  if (shouldRandomizeNotes) {
    notes = pattern.notes.map(() => 
      availableNotes[Math.floor(Math.random() * availableNotes.length)]
    );
  }

  // 生成 ABC 記譜法字符串
  let abc = 'X:1\n';
  abc += 'T:節奏練習\n';
  abc += 'M:4/4\n';
  abc += 'L:1/4\n';
  abc += 'K:C\n';

  // 構建音符序列
  const abcNotes = notes.map((note, index) => {
    const duration = pattern.durations[index];
    const durationSuffix = DURATION_TO_ABC[duration] || '';
    return NOTE_TO_ABC[note] + durationSuffix;
  });

  abc += abcNotes.join(' ') + ' ||\n';

  // 生成音符列表（用於遊戲邏輯）
  const noteList: Note[] = [];
  let currentTime = 1.0; // 開始前給 1 秒準備時間
  
  pattern.durations.forEach((duration, index) => {
    noteList.push({
      id: `note-${index}`,
      time: currentTime,
      duration: duration,
    });
    currentTime += duration * 0.6; // 調整時間間隔 (BPM ≈ 100)
  });

  return {
    abc,
    noteList
  };
}

// 根據難度生成節奏
export function generateRhythmByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): RhythmPattern {
  let selectedPatterns: typeof RHYTHM_PATTERNS;
  
  switch (difficulty) {
    case 'easy':
      selectedPatterns = RHYTHM_PATTERNS.filter(p => 
        p.pattern === 'simple_quarter' || p.pattern === 'mixed_rhythm'
      );
      break;
    case 'medium':
      selectedPatterns = RHYTHM_PATTERNS.filter(p => 
        p.pattern === 'mixed_rhythm' || p.pattern === 'eighth_notes' || p.pattern === 'dotted_rhythm'
      );
      break;
    case 'hard':
      selectedPatterns = RHYTHM_PATTERNS.filter(p => 
        p.pattern === 'eighth_notes' || p.pattern === 'triplets' || p.pattern === 'dotted_rhythm'
      );
      break;
    default:
      selectedPatterns = RHYTHM_PATTERNS;
  }

  const pattern = selectedPatterns[Math.floor(Math.random() * selectedPatterns.length)];
  
  // 使用相同的邏輯生成 ABC 和音符列表
  const availableNotes = ['C', 'D', 'E', 'F', 'G'];
  const notes = pattern.notes.map(() => 
    availableNotes[Math.floor(Math.random() * availableNotes.length)]
  );

  let abc = 'X:1\n';
  abc += `T:節奏練習 (${difficulty})\n`;
  abc += 'M:4/4\n';
  abc += 'L:1/4\n';
  abc += 'K:C\n';

  const abcNotes = notes.map((note, index) => {
    const duration = pattern.durations[index];
    const durationSuffix = DURATION_TO_ABC[duration] || '';
    return NOTE_TO_ABC[note] + durationSuffix;
  });

  abc += abcNotes.join(' ') + ' ||\n';

  const noteList: Note[] = [];
  let currentTime = 1.0;
  
  pattern.durations.forEach((duration, index) => {
    noteList.push({
      id: `note-${index}`,
      time: currentTime,
      duration: duration,
    });
    // 根據難度調整速度
    const speedMultiplier = difficulty === 'easy' ? 0.8 : difficulty === 'medium' ? 0.6 : 0.4;
    currentTime += duration * speedMultiplier;
  });

  return {
    abc,
    noteList
  };
}

// 驗證 ABC 記譜法
export function validateAbcNotation(abc: string): boolean {
  try {
    // 基本的 ABC 格式驗證
    const lines = abc.split('\n');
    let hasHeader = false;
    let hasNotes = false;

    for (const line of lines) {
      if (line.startsWith('X:') || line.startsWith('T:') || 
          line.startsWith('M:') || line.startsWith('L:') || 
          line.startsWith('K:')) {
        hasHeader = true;
      }
      if (line.match(/[A-G]/)) {
        hasNotes = true;
      }
    }

    return hasHeader && hasNotes;
  } catch {
    return false;
  }
}
```

現在讓我檢查是否有任何 linting 錯誤：

很好！現在讓我們測試一下應用程序是否能正常運行：

讓我等待一下服務器啟動，然後檢查狀態：

---

**User**

我現在想新增幾個功能：
1. 利用@kevinorriss/react-metronome 套件在 rhymgame card 的右邊加一個可以靠(1)拉動和(2)輸入來調整 bpm（預設100）
2. 隨機生成可以設定小節數（上限 8 小節）
2. 按下「開始遊戲」後節拍器也會跟著播放聲音
3. 按下空白鍵時會播放音效，同時檢查跟 abc notation 現在播放到的音符的狀況來判定對錯
4. 有一個切換「練習模式」和「測驗模式」，如果是練習模式在按下開始遊戲後第一次會先由系統播放正確的節奏聲音，第二次再由使用者聆聽節拍器的聲音點擊空白鍵）

---

**Cursor**

我看到你想要新增這些功能！首先讓我先確保我們在正確的目錄下運行開發服務器，然後實現你要求的功能。

首先安裝需要的套件：

現在讓我創建一個音效工具類，然後更新 RhythmGame 組件來加入所有新功能：

```typescript
// 音效工具類
class AudioUtils {
  private static instance: AudioUtils;
  private audioContext: AudioContext | null = null;

  private constructor() {
    // 確保在瀏覽器環境中初始化
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  public static getInstance(): AudioUtils {
    if (!AudioUtils.instance) {
      AudioUtils.instance = new AudioUtils();
    }
    return AudioUtils.instance;
  }

  // 創建節拍器聲音
  public createMetronomeClick(frequency: number = 800, duration: number = 0.1): void {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.type = 'square';

    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  // 創建按鍵音效
  public createKeyPressSound(isCorrect: boolean): void {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // 正確時播放高音，錯誤時播放低音
    const frequency = isCorrect ? 1000 : 300;
    const duration = 0.15;

    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.type = isCorrect ? 'sine' : 'sawtooth';

    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.4, this.audioContext.currentTime + 0.01);
    gainNode.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  // 創建音符播放聲音 (用於練習模式)
  public createNoteSound(noteFrequency: number, duration: number = 0.5): void {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(noteFrequency, this.audioContext.currentTime);
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  // 恢復音頻上下文 (用戶交互後)
  public resumeAudioContext(): void {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }
}

// 音符到頻率的映射
export const NOTE_FREQUENCIES: { [key: string]: number } = {
  'C': 261.63,
  'D': 293.66,
  'E': 329.63,
  'F': 349.23,
  'G': 392.00,
  'A': 440.00,
  'B': 493.88,
};

export default AudioUtils;
```

現在更新節奏生成器，支援小節數設定：

```typescript
interface Note {
  id: string;
  time: number; // 相對時間 (秒)
  duration: number;
  hit?: boolean;
  missed?: boolean;
}

interface RhythmPattern {
  abc: string;
  noteList: Note[];
}

// 基本節奏模式
const RHYTHM_PATTERNS = [
  // 簡單的四分音符模式
  {
    notes: ['C', 'D', 'E', 'F'],
    durations: [1, 1, 1, 1], // 四分音符
    pattern: 'simple_quarter'
  },
  // 混合節奏
  {
    notes: ['C', 'C', 'D', 'E', 'E', 'F'],
    durations: [0.5, 0.5, 1, 0.5, 0.5, 1], // 八分音符和四分音符混合
    pattern: 'mixed_rhythm'
  },
  // 快速節奏
  {
    notes: ['C', 'D', 'C', 'E', 'D', 'F', 'E', 'G'],
    durations: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5], // 全八分音符
    pattern: 'eighth_notes'
  },
  // 附點節奏
  {
    notes: ['C', 'D', 'E', 'F', 'G'],
    durations: [1.5, 0.5, 1, 1, 1], // 附點四分音符模式
    pattern: 'dotted_rhythm'
  },
  // 三連音模式
  {
    notes: ['C', 'D', 'E', 'C', 'D', 'E'],
    durations: [0.67, 0.67, 0.66, 0.67, 0.67, 0.66], // 三連音
    pattern: 'triplets'
  }
];

// 音符到 ABC 記譜法的映射
const NOTE_TO_ABC: { [key: string]: string } = {
  'C': 'C',
  'D': 'D', 
  'E': 'E',
  'F': 'F',
  'G': 'G',
  'A': 'A',
  'B': 'B',
};

// 時長到 ABC 記譜法的映射
const DURATION_TO_ABC: { [key: number]: string } = {
  0.25: '/4',  // 十六分音符
  0.5: '/2',   // 八分音符
  0.66: '/3',  // 三連音
  0.67: '/3',  // 三連音
  1: '',       // 四分音符 (默認)
  1.5: '3/2',  // 附點四分音符
  2: '2',      // 二分音符
  4: '4',      // 全音符
};

// 生成隨機節奏
export function generateRandomRhythm(measures: number = 1, bpm: number = 100): RhythmPattern {
  // 限制小節數在 1-8 之間
  const numMeasures = Math.max(1, Math.min(8, measures));
  
  // 隨機選擇一個節奏模式
  const basePattern = RHYTHM_PATTERNS[Math.floor(Math.random() * RHYTHM_PATTERNS.length)];
  
  // 根據小節數重複或擴展模式
  let notes: string[] = [];
  let durations: number[] = [];
  
  for (let measure = 0; measure < numMeasures; measure++) {
    // 每個小節可能使用不同的模式或相同模式的變化
    const shouldVaryPattern = Math.random() > 0.3;
    const currentPattern = shouldVaryPattern ? 
      RHYTHM_PATTERNS[Math.floor(Math.random() * RHYTHM_PATTERNS.length)] : 
      basePattern;
    
    notes = notes.concat(currentPattern.notes);
    durations = durations.concat(currentPattern.durations);
  }
  
  // 隨機調整音符
  const availableNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const shouldRandomizeNotes = Math.random() > 0.5;
  
  if (shouldRandomizeNotes) {
    notes = notes.map(() => 
      availableNotes[Math.floor(Math.random() * availableNotes.length)]
    );
  }

  // 生成 ABC 記譜法字符串
  let abc = 'X:1\n';
  abc += `T:節奏練習 (${numMeasures} 小節)\n`;
  abc += 'M:4/4\n';
  abc += 'L:1/4\n';
  abc += 'K:C\n';

  // 構建音符序列，每4拍一個小節
  const abcNotes: string[] = [];
  let currentMeasureDuration = 0;
  
  durations.forEach((duration, index) => {
    const note = notes[index];
    const durationSuffix = DURATION_TO_ABC[duration] || '';
    abcNotes.push(NOTE_TO_ABC[note] + durationSuffix);
    
    currentMeasureDuration += duration;
    // 每當累積到約4拍時，添加小節線
    if (currentMeasureDuration >= 4) {
      abcNotes.push('|');
      currentMeasureDuration = 0;
    }
  });
  
  // 結束符號
  if (abcNotes[abcNotes.length - 1] !== '|') {
    abcNotes.push('||');
  } else {
    abcNotes[abcNotes.length - 1] = '||';
  }

  abc += abcNotes.join(' ') + '\n';

  // 生成音符列表（用於遊戲邏輯）
  const noteList: Note[] = [];
  let currentTime = 1.0; // 開始前給 1 秒準備時間
  const beatDuration = 60 / bpm; // 根據 BPM 計算每拍時間
  
  durations.forEach((duration, index) => {
    noteList.push({
      id: `note-${index}`,
      time: currentTime,
      duration: duration,
    });
    currentTime += duration * beatDuration;
  });

  return {
    abc,
    noteList
  };
}

// 根據難度生成節奏
export function generateRhythmByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): RhythmPattern {
  let selectedPatterns: typeof RHYTHM_PATTERNS;
  
  switch (difficulty) {
    case 'easy':
      selectedPatterns = RHYTHM_PATTERNS.filter(p => 
        p.pattern === 'simple_quarter' || p.pattern === 'mixed_rhythm'
      );
      break;
    case 'medium':
      selectedPatterns = RHYTHM_PATTERNS.filter(p => 
        p.pattern === 'mixed_rhythm' || p.pattern === 'eighth_notes' || p.pattern === 'dotted_rhythm'
      );
      break;
    case 'hard':
      selectedPatterns = RHYTHM_PATTERNS.filter(p => 
        p.pattern === 'eighth_notes' || p.pattern === 'triplets' || p.pattern === 'dotted_rhythm'
      );
      break;
    default:
      selectedPatterns = RHYTHM_PATTERNS;
  }

  const pattern = selectedPatterns[Math.floor(Math.random() * selectedPatterns.length)];
  
  // 使用相同的邏輯生成 ABC 和音符列表
  const availableNotes = ['C', 'D', 'E', 'F', 'G'];
  const notes = pattern.notes.map(() => 
    availableNotes[Math.floor(Math.random() * availableNotes.length)]
  );

  let abc = 'X:1\n';
  abc += `T:節奏練習 (${difficulty})\n`;
  abc += 'M:4/4\n';
  abc += 'L:1/4\n';
  abc += 'K:C\n';

  const abcNotes = notes.map((note, index) => {
    const duration = pattern.durations[index];
    const durationSuffix = DURATION_TO_ABC[duration] || '';
    return NOTE_TO_ABC[note] + durationSuffix;
  });

  abc += abcNotes.join(' ') + ' ||\n';

  const noteList: Note[] = [];
  let currentTime = 1.0;
  
  pattern.durations.forEach((duration, index) => {
    noteList.push({
      id: `note-${index}`,
      time: currentTime,
      duration: duration,
    });
    // 根據難度調整速度
    const speedMultiplier = difficulty === 'easy' ? 0.8 : difficulty === 'medium' ? 0.6 : 0.4;
    currentTime += duration * speedMultiplier;
  });

  return {
    abc,
    noteList
  };
}

// 驗證 ABC 記譜法
export function validateAbcNotation(abc: string): boolean {
  try {
    // 基本的 ABC 格式驗證
    const lines = abc.split('\n');
    let hasHeader = false;
    let hasNotes = false;

    for (const line of lines) {
      if (line.startsWith('X:') || line.startsWith('T:') || 
          line.startsWith('M:') || line.startsWith('L:') || 
          line.startsWith('K:')) {
        hasHeader = true;
      }
      if (line.match(/[A-G]/)) {
        hasNotes = true;
      }
    }

    return hasHeader && hasNotes;
  } catch {
    return false;
  }
}

```

現在讓我更新 RhythmGame 組件，加入所有新功能：

```typescriptreact
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
  Grid,
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
import AbcRenderer from './AbcRenderer';
import { generateRandomRhythm } from '@/utils/rhythmGenerator';
import AudioUtils, { NOTE_FREQUENCIES } from '@/utils/audioUtils';
import Metronome from '@kevinorriss/react-metronome';

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
  });
  
  const [showResults, setShowResults] = useState(false);
  const [tolerance] = useState(0.2); // 200ms 容錯時間
  const gameRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // 生成隨機節奏譜
  const generateNewRhythm = useCallback(() => {
    const { abc, noteList } = generateRandomRhythm();
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
    }));
    setShowResults(false);
  }, []);

  // 開始遊戲
  const startGame = useCallback(() => {
    if (!abcNotation || notes.length === 0) return;

    startTimeRef.current = Date.now();
    setGameState(prev => ({ 
      ...prev, 
      isPlaying: true, 
      gameStarted: true,
      currentTime: 0 
    }));

    // 遊戲計時器
    gameRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      
      setGameState(prev => {
        const newState = { ...prev, currentTime: elapsed };
        
        // 檢查是否有音符被錯過
        const updatedNotes = notes.map(note => {
          if (!note.hit && !note.missed && elapsed > note.time + tolerance) {
            return { ...note, missed: true };
          }
          return note;
        });
        
        const missedCount = updatedNotes.filter(n => n.missed).length;
        const hitCount = updatedNotes.filter(n => n.hit).length;
        
        // 更新錯過的音符
        if (missedCount > prev.missedNotes) {
          setNotes(updatedNotes);
        }
        
        // 檢查遊戲是否結束
        const totalProcessed = hitCount + missedCount;
        if (totalProcessed >= notes.length) {
          clearInterval(gameRef.current!);
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
  }, [abcNotation, notes, tolerance]);

  // 暫停遊戲
  const pauseGame = useCallback(() => {
    if (gameRef.current) {
      clearInterval(gameRef.current);
      gameRef.current = null;
    }
    setGameState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  // 處理按鍵
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (event.code === 'Space' && gameState.isPlaying) {
      event.preventDefault();
      
      const currentTime = gameState.currentTime;
      
      // 尋找最接近的音符
      const availableNotes = notes.filter(note => !note.hit && !note.missed);
      const closestNote = availableNotes.reduce((closest, note) => {
        const timeDiff = Math.abs(note.time - currentTime);
        const closestDiff = Math.abs(closest.time - currentTime);
        return timeDiff < closestDiff ? note : closest;
      }, availableNotes[0]);

      if (closestNote) {
        const timeDiff = Math.abs(closestNote.time - currentTime);
        
        if (timeDiff <= tolerance) {
          // 命中！
          setNotes(prev => prev.map(note => 
            note.id === closestNote.id ? { ...note, hit: true } : note
          ));
        }
      }
    }
  }, [gameState.isPlaying, gameState.currentTime, notes, tolerance]);

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
    };
  }, []);

  // 初始化時生成第一個節奏
  useEffect(() => {
    generateNewRhythm();
  }, [generateNewRhythm]);

  const progress = gameState.totalNotes > 0 
    ? ((gameState.hitNotes + gameState.missedNotes) / gameState.totalNotes) * 100 
    : 0;

  return (
    <Box>
      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
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
                開始遊戲
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
          </Stack>

          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ height: 8, borderRadius: 4 }}
          />
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
              按空白鍵跟隨節奏！
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            當音符移動到指定位置時按下空白鍵，容錯時間為 200ms
          </Typography>
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

```

```typescriptreact
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
  Grid,
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
import AbcRenderer from './AbcRenderer';
import { generateRandomRhythm } from '@/utils/rhythmGenerator';
import AudioUtils, { NOTE_FREQUENCIES } from '@/utils/audioUtils';
import Metronome from '@kevinorriss/react-metronome';

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
  });
  
  const [showResults, setShowResults] = useState(false);
  const [tolerance] = useState(0.2); // 200ms 容錯時間
  const gameRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // 生成隨機節奏譜
  const generateNewRhythm = useCallback(() => {
    const { abc, noteList } = generateRandomRhythm();
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
    }));
    setShowResults(false);
  }, []);

  // 開始遊戲
  const startGame = useCallback(() => {
    if (!abcNotation || notes.length === 0) return;

    startTimeRef.current = Date.now();
    setGameState(prev => ({ 
      ...prev, 
      isPlaying: true, 
      gameStarted: true,
      currentTime: 0 
    }));

    // 遊戲計時器
    gameRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      
      setGameState(prev => {
        const newState = { ...prev, currentTime: elapsed };
        
        // 檢查是否有音符被錯過
        const updatedNotes = notes.map(note => {
          if (!note.hit && !note.missed && elapsed > note.time + tolerance) {
            return { ...note, missed: true };
          }
          return note;
        });
        
        const missedCount = updatedNotes.filter(n => n.missed).length;
        const hitCount = updatedNotes.filter(n => n.hit).length;
        
        // 更新錯過的音符
        if (missedCount > prev.missedNotes) {
          setNotes(updatedNotes);
        }
        
        // 檢查遊戲是否結束
        const totalProcessed = hitCount + missedCount;
        if (totalProcessed >= notes.length) {
          clearInterval(gameRef.current!);
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
  }, [abcNotation, notes, tolerance]);

  // 暫停遊戲
  const pauseGame = useCallback(() => {
    if (gameRef.current) {
      clearInterval(gameRef.current);
      gameRef.current = null;
    }
    setGameState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  // 處理按鍵
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (event.code === 'Space' && gameState.isPlaying) {
      event.preventDefault();
      
      const currentTime = gameState.currentTime;
      
      // 尋找最接近的音符
      const availableNotes = notes.filter(note => !note.hit && !note.missed);
      const closestNote = availableNotes.reduce((closest, note) => {
        const timeDiff = Math.abs(note.time - currentTime);
        const closestDiff = Math.abs(closest.time - currentTime);
        return timeDiff < closestDiff ? note : closest;
      }, availableNotes[0]);

      if (closestNote) {
        const timeDiff = Math.abs(closestNote.time - currentTime);
        
        if (timeDiff <= tolerance) {
          // 命中！
          setNotes(prev => prev.map(note => 
            note.id === closestNote.id ? { ...note, hit: true } : note
          ));
        }
      }
    }
  }, [gameState.isPlaying, gameState.currentTime, notes, tolerance]);

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
    };
  }, []);

  // 初始化時生成第一個節奏
  useEffect(() => {
    generateNewRhythm();
  }, [generateNewRhythm]);

  const progress = gameState.totalNotes > 0 
    ? ((gameState.hitNotes + gameState.missedNotes) / gameState.totalNotes) * 100 
    : 0;

  return (
    <Box>
      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
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
                開始遊戲
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
          </Stack>

          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ height: 8, borderRadius: 4 }}
          />
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
              按空白鍵跟隨節奏！
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            當音符移動到指定位置時按下空白鍵，容錯時間為 200ms
          </Typography>
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

```

```typescriptreact
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
  Grid,
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
import AbcRenderer from './AbcRenderer';
import { generateRandomRhythm } from '@/utils/rhythmGenerator';
import AudioUtils, { NOTE_FREQUENCIES } from '@/utils/audioUtils';
import Metronome from '@kevinorriss/react-metronome';

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
    const { abc, noteList } = generateRandomRhythm();
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
    }));
    setShowResults(false);
  }, []);

  // 開始遊戲
  const startGame = useCallback(() => {
    if (!abcNotation || notes.length === 0) return;

    startTimeRef.current = Date.now();
    setGameState(prev => ({ 
      ...prev, 
      isPlaying: true, 
      gameStarted: true,
      currentTime: 0 
    }));

    // 遊戲計時器
    gameRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      
      setGameState(prev => {
        const newState = { ...prev, currentTime: elapsed };
        
        // 檢查是否有音符被錯過
        const updatedNotes = notes.map(note => {
          if (!note.hit && !note.missed && elapsed > note.time + tolerance) {
            return { ...note, missed: true };
          }
          return note;
        });
        
        const missedCount = updatedNotes.filter(n => n.missed).length;
        const hitCount = updatedNotes.filter(n => n.hit).length;
        
        // 更新錯過的音符
        if (missedCount > prev.missedNotes) {
          setNotes(updatedNotes);
        }
        
        // 檢查遊戲是否結束
        const totalProcessed = hitCount + missedCount;
        if (totalProcessed >= notes.length) {
          clearInterval(gameRef.current!);
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
  }, [abcNotation, notes, tolerance]);

  // 暫停遊戲
  const pauseGame = useCallback(() => {
    if (gameRef.current) {
      clearInterval(gameRef.current);
      gameRef.current = null;
    }
    setGameState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  // 處理按鍵
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (event.code === 'Space' && gameState.isPlaying) {
      event.preventDefault();
      
      const currentTime = gameState.currentTime;
      
      // 尋找最接近的音符
      const availableNotes = notes.filter(note => !note.hit && !note.missed);
      const closestNote = availableNotes.reduce((closest, note) => {
        const timeDiff = Math.abs(note.time - currentTime);
        const closestDiff = Math.abs(closest.time - currentTime);
        return timeDiff < closestDiff ? note : closest;
      }, availableNotes[0]);

      if (closestNote) {
        const timeDiff = Math.abs(closestNote.time - currentTime);
        
        if (timeDiff <= tolerance) {
          // 命中！
          setNotes(prev => prev.map(note => 
            note.id === closestNote.id ? { ...note, hit: true } : note
          ));
        }
      }
    }
  }, [gameState.isPlaying, gameState.currentTime, notes, tolerance]);

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
    };
  }, []);

  // 初始化時生成第一個節奏
  useEffect(() => {
    generateNewRhythm();
  }, [generateNewRhythm]);

  const progress = gameState.totalNotes > 0 
    ? ((gameState.hitNotes + gameState.missedNotes) / gameState.totalNotes) * 100 
    : 0;

  return (
    <Box>
      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
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
                開始遊戲
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
          </Stack>

          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ height: 8, borderRadius: 4 }}
          />
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
              按空白鍵跟隨節奏！
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            當音符移動到指定位置時按下空白鍵，容錯時間為 200ms
          </Typography>
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

```

```typescriptreact
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
  Grid,
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
import AbcRenderer from './AbcRenderer';
import { generateRandomRhythm } from '@/utils/rhythmGenerator';
import AudioUtils, { NOTE_FREQUENCIES } from '@/utils/audioUtils';
import Metronome from '@kevinorriss/react-metronome';

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

  // 開始遊戲
  const startGame = useCallback(() => {
    if (!abcNotation || notes.length === 0) return;

    startTimeRef.current = Date.now();
    setGameState(prev => ({ 
      ...prev, 
      isPlaying: true, 
      gameStarted: true,
      currentTime: 0 
    }));

    // 遊戲計時器
    gameRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      
      setGameState(prev => {
        const newState = { ...prev, currentTime: elapsed };
        
        // 檢查是否有音符被錯過
        const updatedNotes = notes.map(note => {
          if (!note.hit && !note.missed && elapsed > note.time + tolerance) {
            return { ...note, missed: true };
          }
          return note;
        });
        
        const missedCount = updatedNotes.filter(n => n.missed).length;
        const hitCount = updatedNotes.filter(n => n.hit).length;
        
        // 更新錯過的音符
        if (missedCount > prev.missedNotes) {
          setNotes(updatedNotes);
        }
        
        // 檢查遊戲是否結束
        const totalProcessed = hitCount + missedCount;
        if (totalProcessed >= notes.length) {
          clearInterval(gameRef.current!);
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
  }, [abcNotation, notes, tolerance]);

  // 暫停遊戲
  const pauseGame = useCallback(() => {
    if (gameRef.current) {
      clearInterval(gameRef.current);
      gameRef.current = null;
    }
    setGameState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  // 處理按鍵
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (event.code === 'Space' && gameState.isPlaying) {
      event.preventDefault();
      
      const currentTime = gameState.currentTime;
      
      // 尋找最接近的音符
      const availableNotes = notes.filter(note => !note.hit && !note.missed);
      const closestNote = availableNotes.reduce((closest, note) => {
        const timeDiff = Math.abs(note.time - currentTime);
        const closestDiff = Math.abs(closest.time - currentTime);
        return timeDiff < closestDiff ? note : closest;
      }, availableNotes[0]);

      if (closestNote) {
        const timeDiff = Math.abs(closestNote.time - currentTime);
        
        if (timeDiff <= tolerance) {
          // 命中！
          setNotes(prev => prev.map(note => 
            note.id === closestNote.id ? { ...note, hit: true } : note
          ));
        }
      }
    }
  }, [gameState.isPlaying, gameState.currentTime, notes, tolerance]);

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
    };
  }, []);

  // 初始化時生成第一個節奏
  useEffect(() => {
    generateNewRhythm();
  }, [generateNewRhythm]);

  const progress = gameState.totalNotes > 0 
    ? ((gameState.hitNotes + gameState.missedNotes) / gameState.totalNotes) * 100 
    : 0;

  return (
    <Box>
      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
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
                開始遊戲
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
          </Stack>

          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ height: 8, borderRadius: 4 }}
          />
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
              按空白鍵跟隨節奏！
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            當音符移動到指定位置時按下空白鍵，容錯時間為 200ms
          </Typography>
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

```

現在讓我更新開始遊戲的邏輯：

```typescriptreact
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
  Grid,
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
import AbcRenderer from './AbcRenderer';
import { generateRandomRhythm } from '@/utils/rhythmGenerator';
import AudioUtils, { NOTE_FREQUENCIES } from '@/utils/audioUtils';
import Metronome from '@kevinorriss/react-metronome';

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
        
        // 檢查是否有音符被錯過
        const updatedNotes = notes.map(note => {
          if (!note.hit && !note.missed && elapsed > note.time + tolerance) {
            return { ...note, missed: true };
          }
          return note;
        });
        
        const missedCount = updatedNotes.filter(n => n.missed).length;
        const hitCount = updatedNotes.filter(n => n.hit).length;
        
        // 更新錯過的音符
        if (missedCount > prev.missedNotes) {
          setNotes(updatedNotes);
        }
        
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
    setGameState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  // 處理按鍵
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (event.code === 'Space' && gameState.isPlaying) {
      event.preventDefault();
      
      const currentTime = gameState.currentTime;
      
      // 尋找最接近的音符
      const availableNotes = notes.filter(note => !note.hit && !note.missed);
      const closestNote = availableNotes.reduce((closest, note) => {
        const timeDiff = Math.abs(note.time - currentTime);
        const closestDiff = Math.abs(closest.time - currentTime);
        return timeDiff < closestDiff ? note : closest;
      }, availableNotes[0]);

      if (closestNote) {
        const timeDiff = Math.abs(closestNote.time - currentTime);
        
        if (timeDiff <= tolerance) {
          // 命中！
          setNotes(prev => prev.map(note => 
            note.id === closestNote.id ? { ...note, hit: true } : note
          ));
        }
      }
    }
  }, [gameState.isPlaying, gameState.currentTime, notes, tolerance]);

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
    };
  }, []);

  // 初始化時生成第一個節奏
  useEffect(() => {
    generateNewRhythm();
  }, [generateNewRhythm]);

  const progress = gameState.totalNotes > 0 
    ? ((gameState.hitNotes + gameState.missedNotes) / gameState.totalNotes) * 100 
    : 0;

  return (
    <Box>
      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
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
                開始遊戲
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
          </Stack>

          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ height: 8, borderRadius: 4 }}
          />
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
              按空白鍵跟隨節奏！
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            當音符移動到指定位置時按下空白鍵，容錯時間為 200ms
          </Typography>
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

```

```typescriptreact
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
  Grid,
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
import AbcRenderer from './AbcRenderer';
import { generateRandomRhythm } from '@/utils/rhythmGenerator';
import AudioUtils, { NOTE_FREQUENCIES } from '@/utils/audioUtils';
import Metronome from '@kevinorriss/react-metronome';

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
        
        // 檢查是否有音符被錯過
        const updatedNotes = notes.map(note => {
          if (!note.hit && !note.missed && elapsed > note.time + tolerance) {
            return { ...note, missed: true };
          }
          return note;
        });
        
        const missedCount = updatedNotes.filter(n => n.missed).length;
        const hitCount = updatedNotes.filter(n => n.hit).length;
        
        // 更新錯過的音符
        if (missedCount > prev.missedNotes) {
          setNotes(updatedNotes);
        }
        
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
      
      const currentTime = gameState.currentTime;
      
      // 尋找最接近的音符
      const availableNotes = notes.filter(note => !note.hit && !note.missed);
      const closestNote = availableNotes.reduce((closest, note) => {
        const timeDiff = Math.abs(note.time - currentTime);
        const closestDiff = Math.abs(closest.time - currentTime);
        return timeDiff < closestDiff ? note : closest;
      }, availableNotes[0]);

      if (closestNote) {
        const timeDiff = Math.abs(closestNote.time - currentTime);
        
        if (timeDiff <= tolerance) {
          // 命中！
          setNotes(prev => prev.map(note => 
            note.id === closestNote.id ? { ...note, hit: true } : note
          ));
        }
      }
    }
  }, [gameState.isPlaying, gameState.currentTime, notes, tolerance]);

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
    };
  }, []);

  // 初始化時生成第一個節奏
  useEffect(() => {
    generateNewRhythm();
  }, [generateNewRhythm]);

  const progress = gameState.totalNotes > 0 
    ? ((gameState.hitNotes + gameState.missedNotes) / gameState.totalNotes) * 100 
    : 0;

  return (
    <Box>
      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
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
                開始遊戲
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
          </Stack>

          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ height: 8, borderRadius: 4 }}
          />
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
              按空白鍵跟隨節奏！
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            當音符移動到指定位置時按下空白鍵，容錯時間為 200ms
          </Typography>
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

```

```typescriptreact
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
  Grid,
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
import AbcRenderer from './AbcRenderer';
import { generateRandomRhythm } from '@/utils/rhythmGenerator';
import AudioUtils, { NOTE_FREQUENCIES } from '@/utils/audioUtils';
import Metronome from '@kevinorriss/react-metronome';

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
        
        // 檢查是否有音符被錯過
        const updatedNotes = notes.map(note => {
          if (!note.hit && !note.missed && elapsed > note.time + tolerance) {
            return { ...note, missed: true };
          }
          return note;
        });
        
        const missedCount = updatedNotes.filter(n => n.missed).length;
        const hitCount = updatedNotes.filter(n => n.hit).length;
        
        // 更新錯過的音符
        if (missedCount > prev.missedNotes) {
          setNotes(updatedNotes);
        }
        
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
      
      // 尋找最接近的音符
      const availableNotes = notes.filter(note => !note.hit && !note.missed);
      if (availableNotes.length === 0) return;
      
      const closestNote = availableNotes.reduce((closest, note) => {
        const timeDiff = Math.abs(note.time - currentTime);
        const closestDiff = Math.abs(closest.time - currentTime);
        return timeDiff < closestDiff ? note : closest;
      }, availableNotes[0]);

      const timeDiff = Math.abs(closestNote.time - currentTime);
      
      if (timeDiff <= tolerance) {
        // 命中！
        audioUtils.current.createKeyPressSound(true);
        setNotes(prev => prev.map(note => 
          note.id === closestNote.id ? { ...note, hit: true } : note
        ));
      } else {
        // 錯過
        audioUtils.current.createKeyPressSound(false);
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
    };
  }, []);

  // 初始化時生成第一個節奏
  useEffect(() => {
    generateNewRhythm();
  }, [generateNewRhythm]);

  const progress = gameState.totalNotes > 0 
    ? ((gameState.hitNotes + gameState.missedNotes) / gameState.totalNotes) * 100 
    : 0;

  return (
    <Box>
      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
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
                開始遊戲
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
          </Stack>

          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ height: 8, borderRadius: 4 }}
          />
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
              按空白鍵跟隨節奏！
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            當音符移動到指定位置時按下空白鍵，容錯時間為 200ms
          </Typography>
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

```

現在讓我更新清理計時器的邏輯：

```typescriptreact
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
  Grid,
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
import AbcRenderer from './AbcRenderer';
import { generateRandomRhythm } from '@/utils/rhythmGenerator';
import AudioUtils, { NOTE_FREQUENCIES } from '@/utils/audioUtils';
import Metronome from '@kevinorriss/react-metronome';

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
        
        // 檢查是否有音符被錯過
        const updatedNotes = notes.map(note => {
          if (!note.hit && !note.missed && elapsed > note.time + tolerance) {
            return { ...note, missed: true };
          }
          return note;
        });
        
        const missedCount = updatedNotes.filter(n => n.missed).length;
        const hitCount = updatedNotes.filter(n => n.hit).length;
        
        // 更新錯過的音符
        if (missedCount > prev.missedNotes) {
          setNotes(updatedNotes);
        }
        
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
      
      // 尋找最接近的音符
      const availableNotes = notes.filter(note => !note.hit && !note.missed);
      if (availableNotes.length === 0) return;
      
      const closestNote = availableNotes.reduce((closest, note) => {
        const timeDiff = Math.abs(note.time - currentTime);
        const closestDiff = Math.abs(closest.time - currentTime);
        return timeDiff < closestDiff ? note : closest;
      }, availableNotes[0]);

      const timeDiff = Math.abs(closestNote.time - currentTime);
      
      if (timeDiff <= tolerance) {
        // 命中！
        audioUtils.current.createKeyPressSound(true);
        setNotes(prev => prev.map(note => 
          note.id === closestNote.id ? { ...note, hit: true } : note
        ));
      } else {
        // 錯過
        audioUtils.current.createKeyPressSound(false);
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

  const progress = gameState.totalNotes > 0 
    ? ((gameState.hitNotes + gameState.missedNotes) / gameState.totalNotes) * 100 
    : 0;

  return (
    <Box>
      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
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
                開始遊戲
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
          </Stack>

          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ height: 8, borderRadius: 4 }}
          />
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
              按空白鍵跟隨節奏！
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            當音符移動到指定位置時按下空白鍵，容錯時間為 200ms
          </Typography>
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

```

現在讓我更新 UI 部分，添加所有新的控制元件：

```typescriptreact
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
  Grid,
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
import AbcRenderer from './AbcRenderer';
import { generateRandomRhythm } from '@/utils/rhythmGenerator';
import AudioUtils, { NOTE_FREQUENCIES } from '@/utils/audioUtils';
import Metronome from '@kevinorriss/react-metronome';

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
        
        // 檢查是否有音符被錯過
        const updatedNotes = notes.map(note => {
          if (!note.hit && !note.missed && elapsed > note.time + tolerance) {
            return { ...note, missed: true };
          }
          return note;
        });
        
        const missedCount = updatedNotes.filter(n => n.missed).length;
        const hitCount = updatedNotes.filter(n => n.hit).length;
        
        // 更新錯過的音符
        if (missedCount > prev.missedNotes) {
          setNotes(updatedNotes);
        }
        
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
      
      // 尋找最接近的音符
      const availableNotes = notes.filter(note => !note.hit && !note.missed);
      if (availableNotes.length === 0) return;
      
      const closestNote = availableNotes.reduce((closest, note) => {
        const timeDiff = Math.abs(note.time - currentTime);
        const closestDiff = Math.abs(closest.time - currentTime);
        return timeDiff < closestDiff ? note : closest;
      }, availableNotes[0]);

      const timeDiff = Math.abs(closestNote.time - currentTime);
      
      if (timeDiff <= tolerance) {
        // 命中！
        audioUtils.current.createKeyPressSound(true);
        setNotes(prev => prev.map(note => 
          note.id === closestNote.id ? { ...note, hit: true } : note
        ));
      } else {
        // 錯過
        audioUtils.current.createKeyPressSound(false);
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

  const progress = gameState.totalNotes > 0 
    ? ((gameState.hitNotes + gameState.missedNotes) / gameState.totalNotes) * 100 
    : 0;

  return (
    <Box>
      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            {/* 左側控制區 */}
            <Grid item xs={12} md={8}>
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
                </Grid>

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
            </Grid>

            {/* 右側 BPM 控制區 */}
            <Grid item xs={12} md={4}>
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
                    <Metronome
                      bpm={bpm}
                      isRunning={metronomeActive}
                      soundEnabled={true}
                    />
                  </Box>
                </Stack>
              </Card>
            </Grid>
          </Grid>

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
          </Stack>

          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ height: 8, borderRadius: 4 }}
          />
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
              按空白鍵跟隨節奏！
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            當音符移動到指定位置時按下空白鍵，容錯時間為 200ms
          </Typography>
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

```

繼續更新其餘的 UI 部分：

```typescriptreact
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
  Grid,
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
import AbcRenderer from './AbcRenderer';
import { generateRandomRhythm } from '@/utils/rhythmGenerator';
import AudioUtils, { NOTE_FREQUENCIES } from '@/utils/audioUtils';
import Metronome from '@kevinorriss/react-metronome';

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
        
        // 檢查是否有音符被錯過
        const updatedNotes = notes.map(note => {
          if (!note.hit && !note.missed && elapsed > note.time + tolerance) {
            return { ...note, missed: true };
          }
          return note;
        });
        
        const missedCount = updatedNotes.filter(n => n.missed).length;
        const hitCount = updatedNotes.filter(n => n.hit).length;
        
        // 更新錯過的音符
        if (missedCount > prev.missedNotes) {
          setNotes(updatedNotes);
        }
        
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
      
      // 尋找最接近的音符
      const availableNotes = notes.filter(note => !note.hit && !note.missed);
      if (availableNotes.length === 0) return;
      
      const closestNote = availableNotes.reduce((closest, note) => {
        const timeDiff = Math.abs(note.time - currentTime);
        const closestDiff = Math.abs(closest.time - currentTime);
        return timeDiff < closestDiff ? note : closest;
      }, availableNotes[0]);

      const timeDiff = Math.abs(closestNote.time - currentTime);
      
      if (timeDiff <= tolerance) {
        // 命中！
        audioUtils.current.createKeyPressSound(true);
        setNotes(prev => prev.map(note => 
          note.id === closestNote.id ? { ...note, hit: true } : note
        ));
      } else {
        // 錯過
        audioUtils.current.createKeyPressSound(false);
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

  const progress = gameState.totalNotes > 0 
    ? ((gameState.hitNotes + gameState.missedNotes) / gameState.totalNotes) * 100 
    : 0;

  return (
    <Box>
      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            {/* 左側控制區 */}
            <Grid item xs={12} md={8}>
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
                </Grid>

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
            </Grid>

            {/* 右側 BPM 控制區 */}
            <Grid item xs={12} md={4}>
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
                    <Metronome
                      bpm={bpm}
                      isRunning={metronomeActive}
                      soundEnabled={true}
                    />
                  </Box>
                </Stack>
              </Card>
            </Grid>
          </Grid>

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
              按空白鍵跟隨節奏！
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            當音符移動到指定位置時按下空白鍵，容錯時間為 200ms
          </Typography>
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

```

```typescriptreact
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
  Grid,
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
import AbcRenderer from './AbcRenderer';
import { generateRandomRhythm } from '@/utils/rhythmGenerator';
import AudioUtils, { NOTE_FREQUENCIES } from '@/utils/audioUtils';
import Metronome from '@kevinorriss/react-metronome';

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
        
        // 檢查是否有音符被錯過
        const updatedNotes = notes.map(note => {
          if (!note.hit && !note.missed && elapsed > note.time + tolerance) {
            return { ...note, missed: true };
          }
          return note;
        });
        
        const missedCount = updatedNotes.filter(n => n.missed).length;
        const hitCount = updatedNotes.filter(n => n.hit).length;
        
        // 更新錯過的音符
        if (missedCount > prev.missedNotes) {
          setNotes(updatedNotes);
        }
        
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
      
      // 尋找最接近的音符
      const availableNotes = notes.filter(note => !note.hit && !note.missed);
      if (availableNotes.length === 0) return;
      
      const closestNote = availableNotes.reduce((closest, note) => {
        const timeDiff = Math.abs(note.time - currentTime);
        const closestDiff = Math.abs(closest.time - currentTime);
        return timeDiff < closestDiff ? note : closest;
      }, availableNotes[0]);

      const timeDiff = Math.abs(closestNote.time - currentTime);
      
      if (timeDiff <= tolerance) {
        // 命中！
        audioUtils.current.createKeyPressSound(true);
        setNotes(prev => prev.map(note => 
          note.id === closestNote.id ? { ...note, hit: true } : note
        ));
      } else {
        // 錯過
        audioUtils.current.createKeyPressSound(false);
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

  const progress = gameState.totalNotes > 0 
    ? ((gameState.hitNotes + gameState.missedNotes) / gameState.totalNotes) * 100 
    : 0;

  return (
    <Box>
      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            {/* 左側控制區 */}
            <Grid item xs={12} md={8}>
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
                </Grid>

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
            </Grid>

            {/* 右側 BPM 控制區 */}
            <Grid item xs={12} md={4}>
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
                    <Metronome
                      bpm={bpm}
                      isRunning={metronomeActive}
                      soundEnabled={true}
                    />
                  </Box>
                </Stack>
              </Card>
            </Grid>
          </Grid>

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

```

現在讓我檢查一下是否有任何 linting 錯誤：

讓我修復這些錯誤。首先修復音頻工具中的錯誤：

```typescript
// 音效工具類
class AudioUtils {
  private static instance: AudioUtils;
  private audioContext: AudioContext | null = null;

  private constructor() {
    // 確保在瀏覽器環境中初始化
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  public static getInstance(): AudioUtils {
    if (!AudioUtils.instance) {
      AudioUtils.instance = new AudioUtils();
    }
    return AudioUtils.instance;
  }

  // 創建節拍器聲音
  public createMetronomeClick(frequency: number = 800, duration: number = 0.1): void {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.type = 'square';

    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  // 創建按鍵音效
  public createKeyPressSound(isCorrect: boolean): void {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // 正確時播放高音，錯誤時播放低音
    const frequency = isCorrect ? 1000 : 300;
    const duration = 0.15;

    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.type = isCorrect ? 'sine' : 'sawtooth';

    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.4, this.audioContext.currentTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  // 創建音符播放聲音 (用於練習模式)
  public createNoteSound(noteFrequency: number, duration: number = 0.5): void {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(noteFrequency, this.audioContext.currentTime);
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  // 恢復音頻上下文 (用戶交互後)
  public resumeAudioContext(): void {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }
}

// 音符到頻率的映射
export const NOTE_FREQUENCIES: { [key: string]: number } = {
  'C': 261.63,
  'D': 293.66,
  'E': 329.63,
  'F': 349.23,
  'G': 392.00,
  'A': 440.00,
  'B': 493.88,
};

export default AudioUtils;

```

```typescript
// 音效工具類
class AudioUtils {
  private static instance: AudioUtils;
  private audioContext: AudioContext | null = null;

  private constructor() {
    // 確保在瀏覽器環境中初始化
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  public static getInstance(): AudioUtils {
    if (!AudioUtils.instance) {
      AudioUtils.instance = new AudioUtils();
    }
    return AudioUtils.instance;
  }

  // 創建節拍器聲音
  public createMetronomeClick(frequency: number = 800, duration: number = 0.1): void {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.type = 'square';

    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  // 創建按鍵音效
  public createKeyPressSound(isCorrect: boolean): void {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // 正確時播放高音，錯誤時播放低音
    const frequency = isCorrect ? 1000 : 300;
    const duration = 0.15;

    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.type = isCorrect ? 'sine' : 'sawtooth';

    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.4, this.audioContext.currentTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  // 創建音符播放聲音 (用於練習模式)
  public createNoteSound(noteFrequency: number, duration: number = 0.5): void {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(noteFrequency, this.audioContext.currentTime);
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  // 恢復音頻上下文 (用戶交互後)
  public resumeAudioContext(): void {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }
}

// 音符到頻率的映射
export const NOTE_FREQUENCIES: { [key: string]: number } = {
  'C': 261.63,
  'D': 293.66,
  'E': 329.63,
  'F': 349.23,
  'G': 392.00,
  'A': 440.00,
  'B': 493.88,
};

export default AudioUtils;

```

```typescript
// 音效工具類
class AudioUtils {
  private static instance: AudioUtils;
  private audioContext: AudioContext | null = null;

  private constructor() {
    // 確保在瀏覽器環境中初始化
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  public static getInstance(): AudioUtils {
    if (!AudioUtils.instance) {
      AudioUtils.instance = new AudioUtils();
    }
    return AudioUtils.instance;
  }

  // 創建節拍器聲音
  public createMetronomeClick(frequency: number = 800, duration: number = 0.1): void {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.type = 'square';

    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  // 創建按鍵音效
  public createKeyPressSound(isCorrect: boolean): void {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // 正確時播放高音，錯誤時播放低音
    const frequency = isCorrect ? 1000 : 300;
    const duration = 0.15;

    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.type = isCorrect ? 'sine' : 'sawtooth';

    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.4, this.audioContext.currentTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  // 創建音符播放聲音 (用於練習模式)
  public createNoteSound(noteFrequency: number, duration: number = 0.5): void {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(noteFrequency, this.audioContext.currentTime);
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  // 恢復音頻上下文 (用戶交互後)
  public resumeAudioContext(): void {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }
}

// 音符到頻率的映射
export const NOTE_FREQUENCIES: { [key: string]: number } = {
  'C': 261.63,
  'D': 293.66,
  'E': 329.63,
  'F': 349.23,
  'G': 392.00,
  'A': 440.00,
  'B': 493.88,
};

export default AudioUtils;

```

現在修復 RhythmGame 組件中的錯誤。首先添加類型聲明文件：

```typescript
declare module '@kevinorriss/react-metronome' {
  interface MetronomeProps {
    bpm?: number;
    isRunning?: boolean;
    soundEnabled?: boolean;
  }

  const Metronome: React.FC<MetronomeProps>;
  export default Metronome;
}
```

現在修復 Grid 組件的問題：

```typescriptreact
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
  Grid,
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
import AbcRenderer from './AbcRenderer';
import { generateRandomRhythm } from '@/utils/rhythmGenerator';
import AudioUtils, { NOTE_FREQUENCIES } from '@/utils/audioUtils';
import Metronome from '@kevinorriss/react-metronome';

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
        
        // 檢查是否有音符被錯過
        const updatedNotes = notes.map(note => {
          if (!note.hit && !note.missed && elapsed > note.time + tolerance) {
            return { ...note, missed: true };
          }
          return note;
        });
        
        const missedCount = updatedNotes.filter(n => n.missed).length;
        const hitCount = updatedNotes.filter(n => n.hit).length;
        
        // 更新錯過的音符
        if (missedCount > prev.missedNotes) {
          setNotes(updatedNotes);
        }
        
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
      
      // 尋找最接近的音符
      const availableNotes = notes.filter(note => !note.hit && !note.missed);
      if (availableNotes.length === 0) return;
      
      const closestNote = availableNotes.reduce((closest, note) => {
        const timeDiff = Math.abs(note.time - currentTime);
        const closestDiff = Math.abs(closest.time - currentTime);
        return timeDiff < closestDiff ? note : closest;
      }, availableNotes[0]);

      const timeDiff = Math.abs(closestNote.time - currentTime);
      
      if (timeDiff <= tolerance) {
        // 命中！
        audioUtils.current.createKeyPressSound(true);
        setNotes(prev => prev.map(note => 
          note.id === closestNote.id ? { ...note, hit: true } : note
        ));
      } else {
        // 錯過
        audioUtils.current.createKeyPressSound(false);
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

  const progress = gameState.totalNotes > 0 
    ? ((gameState.hitNotes + gameState.missedNotes) / gameState.totalNotes) * 100 
    : 0;

  return (
    <Box>
      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            {/* 左側控制區 */}
            <Grid xs={12} md={8}>
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
                </Grid>

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
            </Grid>

            {/* 右側 BPM 控制區 */}
            <Grid item xs={12} md={4}>
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
                    <Metronome
                      bpm={bpm}
                      isRunning={metronomeActive}
                      soundEnabled={true}
                    />
                  </Box>
                </Stack>
              </Card>
            </Grid>
          </Grid>

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

```

```typescriptreact
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
  Grid,
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
import AbcRenderer from './AbcRenderer';
import { generateRandomRhythm } from '@/utils/rhythmGenerator';
import AudioUtils, { NOTE_FREQUENCIES } from '@/utils/audioUtils';
import Metronome from '@kevinorriss/react-metronome';

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
        
        // 檢查是否有音符被錯過
        const updatedNotes = notes.map(note => {
          if (!note.hit && !note.missed && elapsed > note.time + tolerance) {
            return { ...note, missed: true };
          }
          return note;
        });
        
        const missedCount = updatedNotes.filter(n => n.missed).length;
        const hitCount = updatedNotes.filter(n => n.hit).length;
        
        // 更新錯過的音符
        if (missedCount > prev.missedNotes) {
          setNotes(updatedNotes);
        }
        
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
      
      // 尋找最接近的音符
      const availableNotes = notes.filter(note => !note.hit && !note.missed);
      if (availableNotes.length === 0) return;
      
      const closestNote = availableNotes.reduce((closest, note) => {
        const timeDiff = Math.abs(note.time - currentTime);
        const closestDiff = Math.abs(closest.time - currentTime);
        return timeDiff < closestDiff ? note : closest;
      }, availableNotes[0]);

      const timeDiff = Math.abs(closestNote.time - currentTime);
      
      if (timeDiff <= tolerance) {
        // 命中！
        audioUtils.current.createKeyPressSound(true);
        setNotes(prev => prev.map(note => 
          note.id === closestNote.id ? { ...note, hit: true } : note
        ));
      } else {
        // 錯過
        audioUtils.current.createKeyPressSound(false);
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

  const progress = gameState.totalNotes > 0 
    ? ((gameState.hitNotes + gameState.missedNotes) / gameState.totalNotes) * 100 
    : 0;

  return (
    <Box>
      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            {/* 左側控制區 */}
            <Grid xs={12} md={8}>
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
                </Grid>

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
            </Grid>

            {/* 右側 BPM 控制區 */}
            <Grid xs={12} md={4}>
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
                    <Metronome
                      bpm={bpm}
                      isRunning={metronomeActive}
                      soundEnabled={true}
                    />
                  </Box>
                </Stack>
              </Card>
            </Grid>
          </Grid>

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

```

現在修復缺少 Box 結束標籤的問題：

我看到問題了，在第 325 行有一個錯誤的 `</Grid>` 標籤，應該是 `</Box>`。讓我修復它：

```typescriptreact
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
  Grid,
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
import AbcRenderer from './AbcRenderer';
import { generateRandomRhythm } from '@/utils/rhythmGenerator';
import AudioUtils, { NOTE_FREQUENCIES } from '@/utils/audioUtils';
import Metronome from '@kevinorriss/react-metronome';

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
        
        // 檢查是否有音符被錯過
        const updatedNotes = notes.map(note => {
          if (!note.hit && !note.missed && elapsed > note.time + tolerance) {
            return { ...note, missed: true };
          }
          return note;
        });
        
        const missedCount = updatedNotes.filter(n => n.missed).length;
        const hitCount = updatedNotes.filter(n => n.hit).length;
        
        // 更新錯過的音符
        if (missedCount > prev.missedNotes) {
          setNotes(updatedNotes);
        }
        
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
      
      // 尋找最接近的音符
      const availableNotes = notes.filter(note => !note.hit && !note.missed);
      if (availableNotes.length === 0) return;
      
      const closestNote = availableNotes.reduce((closest, note) => {
        const timeDiff = Math.abs(note.time - currentTime);
        const closestDiff = Math.abs(closest.time - currentTime);
        return timeDiff < closestDiff ? note : closest;
      }, availableNotes[0]);

      const timeDiff = Math.abs(closestNote.time - currentTime);
      
      if (timeDiff <= tolerance) {
        // 命中！
        audioUtils.current.createKeyPressSound(true);
        setNotes(prev => prev.map(note => 
          note.id === closestNote.id ? { ...note, hit: true } : note
        ));
      } else {
        // 錯過
        audioUtils.current.createKeyPressSound(false);
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

  const progress = gameState.totalNotes > 0 
    ? ((gameState.hitNotes + gameState.missedNotes) / gameState.totalNotes) * 100 
    : 0;

  return (
    <Box>
      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            {/* 左側控制區 */}
            <Grid xs={12} md={8}>
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
            </Grid>

            {/* 右側 BPM 控制區 */}
            <Grid xs={12} md={4}>
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
                    <Metronome
                      bpm={bpm}
                      isRunning={metronomeActive}
                      soundEnabled={true}
                    />
                  </Box>
                </Stack>
              </Card>
            </Grid>
          </Grid>

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

```

現在讓我再次檢查 linting 錯誤：

看起來 Grid 組件需要使用正確的 import。讓我檢查 Material UI 的版本並修復這個問題：

```typescriptreact
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
import Grid from '@mui/material/Grid2';
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
import AbcRenderer from './AbcRenderer';
import { generateRandomRhythm } from '@/utils/rhythmGenerator';
import AudioUtils, { NOTE_FREQUENCIES } from '@/utils/audioUtils';
import Metronome from '@kevinorriss/react-metronome';

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
        
        // 檢查是否有音符被錯過
        const updatedNotes = notes.map(note => {
          if (!note.hit && !note.missed && elapsed > note.time + tolerance) {
            return { ...note, missed: true };
          }
          return note;
        });
        
        const missedCount = updatedNotes.filter(n => n.missed).length;
        const hitCount = updatedNotes.filter(n => n.hit).length;
        
        // 更新錯過的音符
        if (missedCount > prev.missedNotes) {
          setNotes(updatedNotes);
        }
        
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
      
      // 尋找最接近的音符
      const availableNotes = notes.filter(note => !note.hit && !note.missed);
      if (availableNotes.length === 0) return;
      
      const closestNote = availableNotes.reduce((closest, note) => {
        const timeDiff = Math.abs(note.time - currentTime);
        const closestDiff = Math.abs(closest.time - currentTime);
        return timeDiff < closestDiff ? note : closest;
      }, availableNotes[0]);

      const timeDiff = Math.abs(closestNote.time - currentTime);
      
      if (timeDiff <= tolerance) {
        // 命中！
        audioUtils.current.createKeyPressSound(true);
        setNotes(prev => prev.map(note => 
          note.id === closestNote.id ? { ...note, hit: true } : note
        ));
      } else {
        // 錯過
        audioUtils.current.createKeyPressSound(false);
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

  const progress = gameState.totalNotes > 0 
    ? ((gameState.hitNotes + gameState.missedNotes) / gameState.totalNotes) * 100 
    : 0;

  return (
    <Box>
      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            {/* 左側控制區 */}
            <Grid xs={12} md={8}>
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
            </Grid>

            {/* 右側 BPM 控制區 */}
            <Grid xs={12} md={4}>
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
                    <Metronome
                      bpm={bpm}
                      isRunning={metronomeActive}
                      soundEnabled={true}
                    />
                  </Box>
                </Stack>
              </Card>
            </Grid>
          </Grid>

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

```

現在我需要創建 AbcRenderer 組件，因為它缺失了：

AbcRenderer 組件已經存在。讓我檢查路徑是否正確：

路徑是正確的。讓我再次檢查錯誤：

看起來 Grid2 不可用。讓我使用標準的 Grid 組件：

```typescriptreact
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
  Grid,
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
import AbcRenderer from './AbcRenderer';
import { generateRandomRhythm } from '@/utils/rhythmGenerator';
import AudioUtils, { NOTE_FREQUENCIES } from '@/utils/audioUtils';
import Metronome from '@kevinorriss/react-metronome';

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
        
        // 檢查是否有音符被錯過
        const updatedNotes = notes.map(note => {
          if (!note.hit && !note.missed && elapsed > note.time + tolerance) {
            return { ...note, missed: true };
          }
          return note;
        });
        
        const missedCount = updatedNotes.filter(n => n.missed).length;
        const hitCount = updatedNotes.filter(n => n.hit).length;
        
        // 更新錯過的音符
        if (missedCount > prev.missedNotes) {
          setNotes(updatedNotes);
        }
        
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
      
      // 尋找最接近的音符
      const availableNotes = notes.filter(note => !note.hit && !note.missed);
      if (availableNotes.length === 0) return;
      
      const closestNote = availableNotes.reduce((closest, note) => {
        const timeDiff = Math.abs(note.time - currentTime);
        const closestDiff = Math.abs(closest.time - currentTime);
        return timeDiff < closestDiff ? note : closest;
      }, availableNotes[0]);

      const timeDiff = Math.abs(closestNote.time - currentTime);
      
      if (timeDiff <= tolerance) {
        // 命中！
        audioUtils.current.createKeyPressSound(true);
        setNotes(prev => prev.map(note => 
          note.id === closestNote.id ? { ...note, hit: true } : note
        ));
      } else {
        // 錯過
        audioUtils.current.createKeyPressSound(false);
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

  const progress = gameState.totalNotes > 0 
    ? ((gameState.hitNotes + gameState.missedNotes) / gameState.totalNotes) * 100 
    : 0;

  return (
    <Box>
      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            {/* 左側控制區 */}
            <Grid xs={12} md={8}>
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
            </Grid>

            {/* 右側 BPM 控制區 */}
            <Grid xs={12} md={4}>
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
                    <Metronome
                      bpm={bpm}
                      isRunning={metronomeActive}
                      soundEnabled={true}
                    />
                  </Box>
                </Stack>
              </Card>
            </Grid>
          </Grid>

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

```

```typescriptreact
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
  Grid,
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
import AbcRenderer from './AbcRenderer';
import { generateRandomRhythm } from '@/utils/rhythmGenerator';
import AudioUtils, { NOTE_FREQUENCIES } from '@/utils/audioUtils';
import Metronome from '@kevinorriss/react-metronome';

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
        
        // 檢查是否有音符被錯過
        const updatedNotes = notes.map(note => {
          if (!note.hit && !note.missed && elapsed > note.time + tolerance) {
            return { ...note, missed: true };
          }
          return note;
        });
        
        const missedCount = updatedNotes.filter(n => n.missed).length;
        const hitCount = updatedNotes.filter(n => n.hit).length;
        
        // 更新錯過的音符
        if (missedCount > prev.missedNotes) {
          setNotes(updatedNotes);
        }
        
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
      
      // 尋找最接近的音符
      const availableNotes = notes.filter(note => !note.hit && !note.missed);
      if (availableNotes.length === 0) return;
      
      const closestNote = availableNotes.reduce((closest, note) => {
        const timeDiff = Math.abs(note.time - currentTime);
        const closestDiff = Math.abs(closest.time - currentTime);
        return timeDiff < closestDiff ? note : closest;
      }, availableNotes[0]);

      const timeDiff = Math.abs(closestNote.time - currentTime);
      
      if (timeDiff <= tolerance) {
        // 命中！
        audioUtils.current.createKeyPressSound(true);
        setNotes(prev => prev.map(note => 
          note.id === closestNote.id ? { ...note, hit: true } : note
        ));
      } else {
        // 錯過
        audioUtils.current.createKeyPressSound(false);
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

  const progress = gameState.totalNotes > 0 
    ? ((gameState.hitNotes + gameState.missedNotes) / gameState.totalNotes) * 100 
    : 0;

  return (
    <Box>
      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            {/* 左側控制區 */}
            <Grid item xs={12} md={8}>
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
            </Grid>

            {/* 右側 BPM 控制區 */}
            <Grid xs={12} md={4}>
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
                    <Metronome
                      bpm={bpm}
                      isRunning={metronomeActive}
                      soundEnabled={true}
                    />
                  </Box>
                </Stack>
              </Card>
            </Grid>
          </Grid>

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

```

```typescriptreact
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
  Grid,
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
import AbcRenderer from './AbcRenderer';
import { generateRandomRhythm } from '@/utils/rhythmGenerator';
import AudioUtils, { NOTE_FREQUENCIES } from '@/utils/audioUtils';
import Metronome from '@kevinorriss/react-metronome';

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
        
        // 檢查是否有音符被錯過
        const updatedNotes = notes.map(note => {
          if (!note.hit && !note.missed && elapsed > note.time + tolerance) {
            return { ...note, missed: true };
          }
          return note;
        });
        
        const missedCount = updatedNotes.filter(n => n.missed).length;
        const hitCount = updatedNotes.filter(n => n.hit).length;
        
        // 更新錯過的音符
        if (missedCount > prev.missedNotes) {
          setNotes(updatedNotes);
        }
        
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
      
      // 尋找最接近的音符
      const availableNotes = notes.filter(note => !note.hit && !note.missed);
      if (availableNotes.length === 0) return;
      
      const closestNote = availableNotes.reduce((closest, note) => {
        const timeDiff = Math.abs(note.time - currentTime);
        const closestDiff = Math.abs(closest.time - currentTime);
        return timeDiff < closestDiff ? note : closest;
      }, availableNotes[0]);

      const timeDiff = Math.abs(closestNote.time - currentTime);
      
      if (timeDiff <= tolerance) {
        // 命中！
        audioUtils.current.createKeyPressSound(true);
        setNotes(prev => prev.map(note => 
          note.id === closestNote.id ? { ...note, hit: true } : note
        ));
      } else {
        // 錯過
        audioUtils.current.createKeyPressSound(false);
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

  const progress = gameState.totalNotes > 0 
    ? ((gameState.hitNotes + gameState.missedNotes) / gameState.totalNotes) * 100 
    : 0;

  return (
    <Box>
      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            {/* 左側控制區 */}
            <Grid item xs={12} md={8}>
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
            </Grid>

            {/* 右側 BPM 控制區 */}
            <Grid item xs={12} md={4}>
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
                    <Metronome
                      bpm={bpm}
                      isRunning={metronomeActive}
                      soundEnabled={true}
                    />
                  </Box>
                </Stack>
              </Card>
            </Grid>
          </Grid>

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

```

現在讓我檢查 AbcRenderer 的導入問題。讓我重新創建一個簡化版本的 AbcRenderer：

```typescriptreact
'use client';

import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';

interface Note {
  id: string;
  time: number;
  duration: number;
  hit?: boolean;
  missed?: boolean;
}

interface AbcRendererProps {
  abcNotation: string;
  currentTime?: number;
  notes?: Note[];
}

const AbcRenderer: React.FC<AbcRendererProps> = ({ 
  abcNotation, 
  currentTime = 0, 
  notes = [] 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const visualObjRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || !abcNotation) return;

    try {
      // 清除之前的內容
      containerRef.current.innerHTML = '';

      // 渲染 ABC 記譜法
      const visualObj = abcjs.renderAbc(containerRef.current, abcNotation, {
        responsive: 'resize',
        scale: 1.2,
        staffwidth: 600,
        add_classes: true,
        clickListener: (abcElem: any) => {
          console.log('Clicked element:', abcElem);
        }
      });

      visualObjRef.current = visualObj;

      // 添加視覺效果的 CSS
      const style = document.createElement('style');
      style.textContent = `
        .abcjs-note.hit {
          fill: #4caf50 !important;
          stroke: #2e7d32 !important;
          stroke-width: 2px !important;
        }
        .abcjs-note.missed {
          fill: #f44336 !important;
          stroke: #c62828 !important;
          stroke-width: 2px !important;
        }
        .abcjs-note.current {
          fill: #ff9800 !important;
          stroke: #f57c00 !important;
          stroke-width: 3px !important;
          animation: pulse 0.5s infinite alternate;
        }
        @keyframes pulse {
          from { opacity: 0.7; }
          to { opacity: 1; }
        }
        .abcjs-cursor {
          stroke: #2196f3;
          stroke-width: 3px;
          fill: none;
        }
      `;
      document.head.appendChild(style);

      return () => {
        document.head.removeChild(style);
      };
    } catch (error) {
      console.error('Error rendering ABC notation:', error);
    }
  }, [abcNotation]);

  // 更新音符狀態的視覺效果
  useEffect(() => {
    if (!containerRef.current || !visualObjRef.current) return;

    try {
      const svg = containerRef.current.querySelector('svg');
      if (!svg) return;

      // 重置所有音符樣式
      const allNotes = svg.querySelectorAll('.abcjs-note');
      allNotes.forEach((note: Element) => {
        (note as SVGElement).classList.remove('hit', 'missed', 'current');
      });

      // 根據遊戲狀態更新音符顏色
      notes.forEach((note, index) => {
        const noteElement = allNotes[index] as SVGElement;
        if (noteElement) {
          if (note.hit) {
            noteElement.classList.add('hit');
          } else if (note.missed) {
            noteElement.classList.add('missed');
          } else if (Math.abs(note.time - currentTime) < 0.5) {
            noteElement.classList.add('current');
          }
        }
      });

      // 添加時間游標
      const existingCursor = svg.querySelector('.abcjs-cursor');
      if (existingCursor) {
        existingCursor.remove();
      }

      if (currentTime > 0 && notes.length > 0) {
        const progress = Math.min(currentTime / (notes[notes.length - 1]?.time || 1), 1);
        const svgWidth = svg.getBBox().width;
        const cursorX = progress * svgWidth;

        const cursor = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        cursor.setAttribute('class', 'abcjs-cursor');
        cursor.setAttribute('x1', cursorX.toString());
        cursor.setAttribute('y1', '0');
        cursor.setAttribute('x2', cursorX.toString());
        cursor.setAttribute('y2', svg.getBBox().height.toString());
        svg.appendChild(cursor);
      }
    } catch (error) {
      console.error('Error updating visual effects:', error);
    }
  }, [currentTime, notes]);

  return (
    <Box
      ref={containerRef}
      sx={{
        width: '100%',
        minHeight: 200,
        border: '1px solid #e0e0e0',
        borderRadius: 1,
        p: 2,
        backgroundColor: '#fafafa',
        overflow: 'auto',
        '& svg': {
          maxWidth: '100%',
          height: 'auto',
        }
      }}
    />
  );
};

export default AbcRenderer;

```

```typescriptreact
'use client';

import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';

interface Note {
  id: string;
  time: number;
  duration: number;
  hit?: boolean;
  missed?: boolean;
}

interface AbcRendererProps {
  abcNotation: string;
  currentTime?: number;
  notes?: Note[];
}

const AbcRenderer: React.FC<AbcRendererProps> = ({ 
  abcNotation, 
  currentTime = 0, 
  notes = [] 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const visualObjRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || !abcNotation) return;

    try {
      // 動態導入 abcjs
      import('abcjs').then((abcjs) => {
        if (!containerRef.current) return;
        
        // 清除之前的內容
        containerRef.current.innerHTML = '';

        // 渲染 ABC 記譜法
        const visualObj = abcjs.renderAbc(containerRef.current, abcNotation, {
          responsive: 'resize',
          scale: 1.2,
          staffwidth: 600,
          add_classes: true,
          clickListener: (abcElem: any) => {
            console.log('Clicked element:', abcElem);
          }
        });

        visualObjRef.current = visualObj;

      // 添加視覺效果的 CSS
      const style = document.createElement('style');
      style.textContent = `
        .abcjs-note.hit {
          fill: #4caf50 !important;
          stroke: #2e7d32 !important;
          stroke-width: 2px !important;
        }
        .abcjs-note.missed {
          fill: #f44336 !important;
          stroke: #c62828 !important;
          stroke-width: 2px !important;
        }
        .abcjs-note.current {
          fill: #ff9800 !important;
          stroke: #f57c00 !important;
          stroke-width: 3px !important;
          animation: pulse 0.5s infinite alternate;
        }
        @keyframes pulse {
          from { opacity: 0.7; }
          to { opacity: 1; }
        }
        .abcjs-cursor {
          stroke: #2196f3;
          stroke-width: 3px;
          fill: none;
        }
      `;
      document.head.appendChild(style);

      return () => {
        document.head.removeChild(style);
      };
    } catch (error) {
      console.error('Error rendering ABC notation:', error);
    }
  }, [abcNotation]);

  // 更新音符狀態的視覺效果
  useEffect(() => {
    if (!containerRef.current || !visualObjRef.current) return;

    try {
      const svg = containerRef.current.querySelector('svg');
      if (!svg) return;

      // 重置所有音符樣式
      const allNotes = svg.querySelectorAll('.abcjs-note');
      allNotes.forEach((note: Element) => {
        (note as SVGElement).classList.remove('hit', 'missed', 'current');
      });

      // 根據遊戲狀態更新音符顏色
      notes.forEach((note, index) => {
        const noteElement = allNotes[index] as SVGElement;
        if (noteElement) {
          if (note.hit) {
            noteElement.classList.add('hit');
          } else if (note.missed) {
            noteElement.classList.add('missed');
          } else if (Math.abs(note.time - currentTime) < 0.5) {
            noteElement.classList.add('current');
          }
        }
      });

      // 添加時間游標
      const existingCursor = svg.querySelector('.abcjs-cursor');
      if (existingCursor) {
        existingCursor.remove();
      }

      if (currentTime > 0 && notes.length > 0) {
        const progress = Math.min(currentTime / (notes[notes.length - 1]?.time || 1), 1);
        const svgWidth = svg.getBBox().width;
        const cursorX = progress * svgWidth;

        const cursor = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        cursor.setAttribute('class', 'abcjs-cursor');
        cursor.setAttribute('x1', cursorX.toString());
        cursor.setAttribute('y1', '0');
        cursor.setAttribute('x2', cursorX.toString());
        cursor.setAttribute('y2', svg.getBBox().height.toString());
        svg.appendChild(cursor);
      }
    } catch (error) {
      console.error('Error updating visual effects:', error);
    }
  }, [currentTime, notes]);

  return (
    <Box
      ref={containerRef}
      sx={{
        width: '100%',
        minHeight: 200,
        border: '1px solid #e0e0e0',
        borderRadius: 1,
        p: 2,
        backgroundColor: '#fafafa',
        overflow: 'auto',
        '& svg': {
          maxWidth: '100%',
          height: 'auto',
        }
      }}
    />
  );
};

export default AbcRenderer;

```

```typescriptreact
'use client';

import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';

interface Note {
  id: string;
  time: number;
  duration: number;
  hit?: boolean;
  missed?: boolean;
}

interface AbcRendererProps {
  abcNotation: string;
  currentTime?: number;
  notes?: Note[];
}

const AbcRenderer: React.FC<AbcRendererProps> = ({ 
  abcNotation, 
  currentTime = 0, 
  notes = [] 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const visualObjRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || !abcNotation) return;

    try {
      // 動態導入 abcjs
      import('abcjs').then((abcjs) => {
        if (!containerRef.current) return;
        
        // 清除之前的內容
        containerRef.current.innerHTML = '';

        // 渲染 ABC 記譜法
        const visualObj = abcjs.renderAbc(containerRef.current, abcNotation, {
          responsive: 'resize',
          scale: 1.2,
          staffwidth: 600,
          add_classes: true,
          clickListener: (abcElem: any) => {
            console.log('Clicked element:', abcElem);
          }
        });

        visualObjRef.current = visualObj;

        // 添加視覺效果的 CSS
        const style = document.createElement('style');
        style.textContent = `
          .abcjs-note.hit {
            fill: #4caf50 !important;
            stroke: #2e7d32 !important;
            stroke-width: 2px !important;
          }
          .abcjs-note.missed {
            fill: #f44336 !important;
            stroke: #c62828 !important;
            stroke-width: 2px !important;
          }
          .abcjs-note.current {
            fill: #ff9800 !important;
            stroke: #f57c00 !important;
            stroke-width: 3px !important;
            animation: pulse 0.5s infinite alternate;
          }
          @keyframes pulse {
            from { opacity: 0.7; }
            to { opacity: 1; }
          }
          .abcjs-cursor {
            stroke: #2196f3;
            stroke-width: 3px;
            fill: none;
          }
        `;
        document.head.appendChild(style);
      });
    } catch (error) {
      console.error('Error rendering ABC notation:', error);
    }
  }, [abcNotation]);

  // 更新音符狀態的視覺效果
  useEffect(() => {
    if (!containerRef.current || !visualObjRef.current) return;

    try {
      const svg = containerRef.current.querySelector('svg');
      if (!svg) return;

      // 重置所有音符樣式
      const allNotes = svg.querySelectorAll('.abcjs-note');
      allNotes.forEach((note: Element) => {
        (note as SVGElement).classList.remove('hit', 'missed', 'current');
      });

      // 根據遊戲狀態更新音符顏色
      notes.forEach((note, index) => {
        const noteElement = allNotes[index] as SVGElement;
        if (noteElement) {
          if (note.hit) {
            noteElement.classList.add('hit');
          } else if (note.missed) {
            noteElement.classList.add('missed');
          } else if (Math.abs(note.time - currentTime) < 0.5) {
            noteElement.classList.add('current');
          }
        }
      });

      // 添加時間游標
      const existingCursor = svg.querySelector('.abcjs-cursor');
      if (existingCursor) {
        existingCursor.remove();
      }

      if (currentTime > 0 && notes.length > 0) {
        const progress = Math.min(currentTime / (notes[notes.length - 1]?.time || 1), 1);
        const svgWidth = svg.getBBox().width;
        const cursorX = progress * svgWidth;

        const cursor = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        cursor.setAttribute('class', 'abcjs-cursor');
        cursor.setAttribute('x1', cursorX.toString());
        cursor.setAttribute('y1', '0');
        cursor.setAttribute('x2', cursorX.toString());
        cursor.setAttribute('y2', svg.getBBox().height.toString());
        svg.appendChild(cursor);
      }
    } catch (error) {
      console.error('Error updating visual effects:', error);
    }
  }, [currentTime, notes]);

  return (
    <Box
      ref={containerRef}
      sx={{
        width: '100%',
        minHeight: 200,
        border: '1px solid #e0e0e0',
        borderRadius: 1,
        p: 2,
        backgroundColor: '#fafafa',
        overflow: 'auto',
        '& svg': {
          maxWidth: '100%',
          height: 'auto',
        }
      }}
    />
  );
};

export default AbcRenderer;

```

現在讓我檢查所有錯誤是否已修復：

讓我先嘗試啟動開發服務器來測試基本功能，然後處理這些小錯誤：

讓我創建一個更簡單的版本來避免這些錯誤，並完成基本功能的實現：

```typescriptreact
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
  Grid,
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
import AbcRenderer from './AbcRenderer';
import { generateRandomRhythm } from '@/utils/rhythmGenerator';
import AudioUtils, { NOTE_FREQUENCIES } from '@/utils/audioUtils';
import Metronome from '@kevinorriss/react-metronome';

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
        
        // 檢查是否有音符被錯過
        const updatedNotes = notes.map(note => {
          if (!note.hit && !note.missed && elapsed > note.time + tolerance) {
            return { ...note, missed: true };
          }
          return note;
        });
        
        const missedCount = updatedNotes.filter(n => n.missed).length;
        const hitCount = updatedNotes.filter(n => n.hit).length;
        
        // 更新錯過的音符
        if (missedCount > prev.missedNotes) {
          setNotes(updatedNotes);
        }
        
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
      
      // 尋找最接近的音符
      const availableNotes = notes.filter(note => !note.hit && !note.missed);
      if (availableNotes.length === 0) return;
      
      const closestNote = availableNotes.reduce((closest, note) => {
        const timeDiff = Math.abs(note.time - currentTime);
        const closestDiff = Math.abs(closest.time - currentTime);
        return timeDiff < closestDiff ? note : closest;
      }, availableNotes[0]);

      const timeDiff = Math.abs(closestNote.time - currentTime);
      
      if (timeDiff <= tolerance) {
        // 命中！
        audioUtils.current.createKeyPressSound(true);
        setNotes(prev => prev.map(note => 
          note.id === closestNote.id ? { ...note, hit: true } : note
        ));
      } else {
        // 錯過
        audioUtils.current.createKeyPressSound(false);
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

  const progress = gameState.totalNotes > 0 
    ? ((gameState.hitNotes + gameState.missedNotes) / gameState.totalNotes) * 100 
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
                      <Metronome
                        bpm={bpm}
                        isRunning={metronomeActive}
                        soundEnabled={true}
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

```

現在創建一個簡化的 AbcRenderer 組件來避免導入問題：

```typescriptreact
'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';

interface Note {
  id: string;
  time: number;
  duration: number;
  hit?: boolean;
  missed?: boolean;
}

interface AbcRendererProps {
  abcNotation: string;
  currentTime?: number;
  notes?: Note[];
}

const AbcRenderer: React.FC<AbcRendererProps> = ({ 
  abcNotation, 
  currentTime = 0, 
  notes = [] 
}) => {
  return (
    <Box
      sx={{
        width: '100%',
        minHeight: 200,
        border: '1px solid #e0e0e0',
        borderRadius: 1,
        p: 2,
        backgroundColor: '#fafafa',
        overflow: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          🎵 音樂譜
        </Typography>
        <Typography variant="body2" color="text.secondary">
          ABC 記譜法將在這裡顯示
        </Typography>
        <Typography variant="body2" sx={{ mt: 2, fontFamily: 'monospace' }}>
          {abcNotation}
        </Typography>
        {currentTime > 0 && (
          <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
            播放時間: {currentTime.toFixed(1)}s
          </Typography>
        )}
        <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
          {notes.map((note, index) => (
            <Box
              key={note.id}
              sx={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                backgroundColor: note.hit ? '#4caf50' : note.missed ? '#f44336' : 
                  Math.abs(note.time - currentTime) < 0.5 ? '#ff9800' : '#e0e0e0',
                border: '2px solid',
                borderColor: note.hit ? '#2e7d32' : note.missed ? '#c62828' : 
                  Math.abs(note.time - currentTime) < 0.5 ? '#f57c00' : '#bdbdbd',
                animation: Math.abs(note.time - currentTime) < 0.5 ? 'pulse 0.5s infinite alternate' : 'none',
              }}
            />
          ))}
        </Box>
      </Box>
      <style jsx>{`
        @keyframes pulse {
          from { opacity: 0.7; }
          to { opacity: 1; }
        }
      `}</style>
    </Box>
  );
};

export default AbcRenderer;
```

現在檢查錯誤是否修復：

讓我重新啟動 TypeScript 服務器並檢查：

---

**User**

abcrenderer 被你誤刪了
幫我修復

---

**Cursor**

我看到 AbcRenderer 組件被誤刪了，讓我重新創建它：

```typescriptreact
'use client';

import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';

interface Note {
  id: string;
  time: number;
  duration: number;
  hit?: boolean;
  missed?: boolean;
}

interface AbcRendererProps {
  abcNotation: string;
  currentTime?: number;
  notes?: Note[];
}

const AbcRenderer: React.FC<AbcRendererProps> = ({ 
  abcNotation, 
  currentTime = 0, 
  notes = [] 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const visualObjRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || !abcNotation) return;

    try {
      // 動態導入 abcjs
      import('abcjs').then((abcjs) => {
        if (!containerRef.current) return;
        
        // 清除之前的內容
        containerRef.current.innerHTML = '';

        // 渲染 ABC 記譜法
        const visualObj = abcjs.renderAbc(containerRef.current, abcNotation, {
          responsive: 'resize',
          scale: 1.2,
          staffwidth: 600,
          add_classes: true,
          clickListener: (abcElem: any) => {
            console.log('Clicked element:', abcElem);
          }
        });

        visualObjRef.current = visualObj;

        // 添加視覺效果的 CSS
        const style = document.createElement('style');
        style.textContent = `
          .abcjs-note.hit {
            fill: #4caf50 !important;
            stroke: #2e7d32 !important;
            stroke-width: 2px !important;
          }
          .abcjs-note.missed {
            fill: #f44336 !important;
            stroke: #c62828 !important;
            stroke-width: 2px !important;
          }
          .abcjs-note.current {
            fill: #ff9800 !important;
            stroke: #f57c00 !important;
            stroke-width: 3px !important;
            animation: pulse 0.5s infinite alternate;
          }
          @keyframes pulse {
            from { opacity: 0.7; }
            to { opacity: 1; }
          }
          .abcjs-cursor {
            stroke: #2196f3;
            stroke-width: 3px;
            fill: none;
          }
        `;
        document.head.appendChild(style);
      });
    } catch (error) {
      console.error('Error rendering ABC notation:', error);
    }
  }, [abcNotation]);

  // 更新音符狀態的視覺效果
  useEffect(() => {
    if (!containerRef.current || !visualObjRef.current) return;

    try {
      const svg = containerRef.current.querySelector('svg');
      if (!svg) return;

      // 重置所有音符樣式
      const allNotes = svg.querySelectorAll('.abcjs-note');
      allNotes.forEach((note: Element) => {
        (note as SVGElement).classList.remove('hit', 'missed', 'current');
      });

      // 根據遊戲狀態更新音符顏色
      notes.forEach((note, index) => {
        const noteElement = allNotes[index] as SVGElement;
        if (noteElement) {
          if (note.hit) {
            noteElement.classList.add('hit');
          } else if (note.missed) {
            noteElement.classList.add('missed');
          } else if (Math.abs(note.time - currentTime) < 0.5) {
            noteElement.classList.add('current');
          }
        }
      });

      // 添加時間游標
      const existingCursor = svg.querySelector('.abcjs-cursor');
      if (existingCursor) {
        existingCursor.remove();
      }

      if (currentTime > 0 && notes.length > 0) {
        const progress = Math.min(currentTime / (notes[notes.length - 1]?.time || 1), 1);
        const svgWidth = svg.getBBox().width;
        const cursorX = progress * svgWidth;

        const cursor = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        cursor.setAttribute('class', 'abcjs-cursor');
        cursor.setAttribute('x1', cursorX.toString());
        cursor.setAttribute('y1', '0');
        cursor.setAttribute('x2', cursorX.toString());
        cursor.setAttribute('y2', svg.getBBox().height.toString());
        svg.appendChild(cursor);
      }
    } catch (error) {
      console.error('Error updating visual effects:', error);
    }
  }, [currentTime, notes]);

  return (
    <Box
      ref={containerRef}
      sx={{
        width: '100%',
        minHeight: 200,
        border: '1px solid #e0e0e0',
        borderRadius: 1,
        p: 2,
        backgroundColor: '#fafafa',
        overflow: 'auto',
        '& svg': {
          maxWidth: '100%',
          height: 'auto',
        }
      }}
    />
  );
};

export default AbcRenderer;
```

現在讓我檢查是否有 linting 錯誤：

看起來 TypeScript 還沒有識別到新創建的文件。讓我檢查一下當前的 RhythmGame 組件狀態：

AbcRenderer 組件已經重新創建了。讓我重新啟動開發服務器來確保一切正常：

---

**User**

可是我剛剛跟你說想新增的功能不見了？
我現在想新增幾個功能：
1. 利用@kevinorriss/react-metronome 套件在 rhymgame card 的右邊加一個可以靠(1)拉動和(2)輸入來調整 bpm（預設100）
2. 隨機生成可以設定小節數（上限 8 小節）
2. 按下「開始遊戲」後節拍器也會跟著播放聲音
3. 按下空白鍵時會播放音效，同時檢查跟 abc notation 現在播放到的音符的狀況來判定對錯
4. 有一個切換「練習模式」和「測驗模式」，如果是練習模式在按下開始遊戲後第一次會先由系統播放正確的節奏聲音，第二次再由使用者聆聽節拍器的聲音點擊空白鍵）

---

**Cursor**

我看到了，因為文件被重置了，所以之前新增的功能都不見了。讓我重新幫你實現所有這些功能。首先，我需要更新 RhythmGame 組件來加入所有你要求的功能：

首先，讓我更新節奏生成器來支援小節數和 BPM：

```typescript
// 生成隨機節奏
export function generateRandomRhythm(measures: number = 1, bpm: number = 100): RhythmPattern {
  // 限制小節數在 1-8 之間
  const numMeasures = Math.max(1, Math.min(8, measures));
  
  // 隨機選擇一個節奏模式
  const basePattern = RHYTHM_PATTERNS[Math.floor(Math.random() * RHYTHM_PATTERNS.length)];
  
  // 根據小節數重複或擴展模式
  let notes: string[] = [];
  let durations: number[] = [];
  
  for (let measure = 0; measure < numMeasures; measure++) {
    // 每個小節可能使用不同的模式或相同模式的變化
    const shouldVaryPattern = Math.random() > 0.3;
    const currentPattern = shouldVaryPattern ? 
      RHYTHM_PATTERNS[Math.floor(Math.random() * RHYTHM_PATTERNS.length)] : 
      basePattern;
    
    notes = notes.concat(currentPattern.notes);
    durations = durations.concat(currentPattern.durations);
  }
  
  // 隨機調整音符
  const availableNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const shouldRandomizeNotes = Math.random() > 0.5;
  
  if (shouldRandomizeNotes) {
    notes = notes.map(() => 
      availableNotes[Math.floor(Math.random() * availableNotes.length)]
    );
  }

  // 生成 ABC 記譜法字符串
  let abc = 'X:1\n';
  abc += `T:節奏練習 (${numMeasures} 小節)\n`;
  abc += 'M:4/4\n';
  abc += 'L:1/4\n';
  abc += 'K:C\n';

  // 構建音符序列，每4拍一個小節
  const abcNotes: string[] = [];
  let currentMeasureDuration = 0;
  
  durations.forEach((duration, index) => {
    const note = notes[index];
    const durationSuffix = DURATION_TO_ABC[duration] || '';
    abcNotes.push(NOTE_TO_ABC[note] + durationSuffix);
    
    currentMeasureDuration += duration;
    // 每當累積到約4拍時，添加小節線
    if (currentMeasureDuration >= 4) {
      abcNotes.push('|');
      currentMeasureDuration = 0;
    }
  });
  
  // 結束符號
  if (abcNotes[abcNotes.length - 1] !== '|') {
    abcNotes.push('||');
  } else {
    abcNotes[abcNotes.length - 1] = '||';
  }

  abc += abcNotes.join(' ') + '\n';

  // 生成音符列表（用於遊戲邏輯）
  const noteList: Note[] = [];
  let currentTime = 1.0; // 開始前給 1 秒準備時間
  const beatDuration = 60 / bpm; // 根據 BPM 計算每拍時間
  
  durations.forEach((duration, index) => {
    noteList.push({
      id: `note-${index}`,
      time: currentTime,
      duration: duration,
    });
    currentTime += duration * beatDuration;
  });

  return {
    abc,
    noteList
  };
}
```

讓我先檢查當前的節奏生成器文件：

很好！節奏生成器已經有了我們需要的功能。現在讓我更新 RhythmGame 組件來添加所有新功能：

```typescriptreact
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
  Grid,
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
import AbcRenderer from './AbcRenderer';
import { generateRandomRhythm } from '@/utils/rhythmGenerator';
import AudioUtils, { NOTE_FREQUENCIES } from '@/utils/audioUtils';
import Metronome from '@kevinorriss/react-metronome';

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
  });
  
  const [showResults, setShowResults] = useState(false);
  const [tolerance] = useState(0.2); // 200ms 容錯時間
  const gameRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // 生成隨機節奏譜
  const generateNewRhythm = useCallback(() => {
    const { abc, noteList } = generateRandomRhythm();
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
    }));
    setShowResults(false);
  }, []);

  // 開始遊戲
  const startGame = useCallback(() => {
    if (!abcNotation || notes.length === 0) return;

    startTimeRef.current = Date.now();
    setGameState(prev => ({ 
      ...prev, 
      isPlaying: true, 
      gameStarted: true,
      currentTime: 0 
    }));

    // 遊戲計時器
    gameRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      
      setGameState(prev => {
        const newState = { ...prev, currentTime: elapsed };
        
        // 檢查是否有音符被錯過
        const updatedNotes = notes.map(note => {
          if (!note.hit && !note.missed && elapsed > note.time + tolerance) {
            return { ...note, missed: true };
          }
          return note;
        });
        
        const missedCount = updatedNotes.filter(n => n.missed).length;
        const hitCount = updatedNotes.filter(n => n.hit).length;
        
        // 更新錯過的音符
        if (missedCount > prev.missedNotes) {
          setNotes(updatedNotes);
        }
        
        // 檢查遊戲是否結束
        const totalProcessed = hitCount + missedCount;
        if (totalProcessed >= notes.length) {
          clearInterval(gameRef.current!);
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
  }, [abcNotation, notes, tolerance]);

  // 暫停遊戲
  const pauseGame = useCallback(() => {
    if (gameRef.current) {
      clearInterval(gameRef.current);
      gameRef.current = null;
    }
    setGameState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  // 處理按鍵
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (event.code === 'Space' && gameState.isPlaying) {
      event.preventDefault();
      
      const currentTime = gameState.currentTime;
      
      // 尋找最接近的音符
      const availableNotes = notes.filter(note => !note.hit && !note.missed);
      const closestNote = availableNotes.reduce((closest, note) => {
        const timeDiff = Math.abs(note.time - currentTime);
        const closestDiff = Math.abs(closest.time - currentTime);
        return timeDiff < closestDiff ? note : closest;
      }, availableNotes[0]);

      if (closestNote) {
        const timeDiff = Math.abs(closestNote.time - currentTime);
        
        if (timeDiff <= tolerance) {
          // 命中！
          setNotes(prev => prev.map(note => 
            note.id === closestNote.id ? { ...note, hit: true } : note
          ));
        }
      }
    }
  }, [gameState.isPlaying, gameState.currentTime, notes, tolerance]);

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
    };
  }, []);

  // 初始化時生成第一個節奏
  useEffect(() => {
    generateNewRhythm();
  }, [generateNewRhythm]);

  const progress = gameState.totalNotes > 0 
    ? ((gameState.hitNotes + gameState.missedNotes) / gameState.totalNotes) * 100 
    : 0;

  return (
    <Box>
      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
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
                開始遊戲
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
          </Stack>

          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ height: 8, borderRadius: 4 }}
          />
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
              按空白鍵跟隨節奏！
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            當音符移動到指定位置時按下空白鍵，容錯時間為 200ms
          </Typography>
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

```

```typescriptreact
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
  Grid,
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
import AbcRenderer from './AbcRenderer';
import { generateRandomRhythm } from '@/utils/rhythmGenerator';
import AudioUtils, { NOTE_FREQUENCIES } from '@/utils/audioUtils';
import Metronome from '@kevinorriss/react-metronome';

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
  });
  
  const [showResults, setShowResults] = useState(false);
  const [tolerance] = useState(0.2); // 200ms 容錯時間
  const gameRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // 生成隨機節奏譜
  const generateNewRhythm = useCallback(() => {
    const { abc, noteList } = generateRandomRhythm();
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
    }));
    setShowResults(false);
  }, []);

  // 開始遊戲
  const startGame = useCallback(() => {
    if (!abcNotation || notes.length === 0) return;

    startTimeRef.current = Date.now();
    setGameState(prev => ({ 
      ...prev, 
      isPlaying: true, 
      gameStarted: true,
      currentTime: 0 
    }));

    // 遊戲計時器
    gameRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      
      setGameState(prev => {
        const newState = { ...prev, currentTime: elapsed };
        
        // 檢查是否有音符被錯過
        const updatedNotes = notes.map(note => {
          if (!note.hit && !note.missed && elapsed > note.time + tolerance) {
            return { ...note, missed: true };
          }
          return note;
        });
        
        const missedCount = updatedNotes.filter(n => n.missed).length;
        const hitCount = updatedNotes.filter(n => n.hit).length;
        
        // 更新錯過的音符
        if (missedCount > prev.missedNotes) {
          setNotes(updatedNotes);
        }
        
        // 檢查遊戲是否結束
        const totalProcessed = hitCount + missedCount;
        if (totalProcessed >= notes.length) {
          clearInterval(gameRef.current!);
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
  }, [abcNotation, notes, tolerance]);

  // 暫停遊戲
  const pauseGame = useCallback(() => {
    if (gameRef.current) {
      clearInterval(gameRef.current);
      gameRef.current = null;
    }
    setGameState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  // 處理按鍵
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (event.code === 'Space' && gameState.isPlaying) {
      event.preventDefault();
      
      const currentTime = gameState.currentTime;
      
      // 尋找最接近的音符
      const availableNotes = notes.filter(note => !note.hit && !note.missed);
      const closestNote = availableNotes.reduce((closest, note) => {
        const timeDiff = Math.abs(note.time - currentTime);
        const closestDiff = Math.abs(closest.time - currentTime);
        return timeDiff < closestDiff ? note : closest;
      }, availableNotes[0]);

      if (closestNote) {
        const timeDiff = Math.abs(closestNote.time - currentTime);
        
        if (timeDiff <= tolerance) {
          // 命中！
          setNotes(prev => prev.map(note => 
            note.id === closestNote.id ? { ...note, hit: true } : note
          ));
        }
      }
    }
  }, [gameState.isPlaying, gameState.currentTime, notes, tolerance]);

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
    };
  }, []);

  // 初始化時生成第一個節奏
  useEffect(() => {
    generateNewRhythm();
  }, [generateNewRhythm]);

  const progress = gameState.totalNotes > 0 
    ? ((gameState.hitNotes + gameState.missedNotes) / gameState.totalNotes) * 100 
    : 0;

  return (
    <Box>
      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
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
                開始遊戲
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
          </Stack>

          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ height: 8, borderRadius: 4 }}
          />
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
              按空白鍵跟隨節奏！
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            當音符移動到指定位置時按下空白鍵，容錯時間為 200ms
          </Typography>
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

```

```typescriptreact
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
  Grid,
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
import AbcRenderer from './AbcRenderer';
import { generateRandomRhythm } from '@/utils/rhythmGenerator';
import AudioUtils, { NOTE_FREQUENCIES } from '@/utils/audioUtils';
import Metronome from '@kevinorriss/react-metronome';

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
    const { abc, noteList } = generateRandomRhythm();
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
    }));
    setShowResults(false);
  }, []);

  // 開始遊戲
  const startGame = useCallback(() => {
    if (!abcNotation || notes.length === 0) return;

    startTimeRef.current = Date.now();
    setGameState(prev => ({ 
      ...prev, 
      isPlaying: true, 
      gameStarted: true,
      currentTime: 0 
    }));

    // 遊戲計時器
    gameRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      
      setGameState(prev => {
        const newState = { ...prev, currentTime: elapsed };
        
        // 檢查是否有音符被錯過
        const updatedNotes = notes.map(note => {
          if (!note.hit && !note.missed && elapsed > note.time + tolerance) {
            return { ...note, missed: true };
          }
          return note;
        });
        
        const missedCount = updatedNotes.filter(n => n.missed).length;
        const hitCount = updatedNotes.filter(n => n.hit).length;
        
        // 更新錯過的音符
        if (missedCount > prev.missedNotes) {
          setNotes(updatedNotes);
        }
        
        // 檢查遊戲是否結束
        const totalProcessed = hitCount + missedCount;
        if (totalProcessed >= notes.length) {
          clearInterval(gameRef.current!);
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
  }, [abcNotation, notes, tolerance]);

  // 暫停遊戲
  const pauseGame = useCallback(() => {
    if (gameRef.current) {
      clearInterval(gameRef.current);
      gameRef.current = null;
    }
    setGameState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  // 處理按鍵
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (event.code === 'Space' && gameState.isPlaying) {
      event.preventDefault();
      
      const currentTime = gameState.currentTime;
      
      // 尋找最接近的音符
      const availableNotes = notes.filter(note => !note.hit && !note.missed);
      const closestNote = availableNotes.reduce((closest, note) => {
        const timeDiff = Math.abs(note.time - currentTime);
        const closestDiff = Math.abs(closest.time - currentTime);
        return timeDiff < closestDiff ? note : closest;
      }, availableNotes[0]);

      if (closestNote) {
        const timeDiff = Math.abs(closestNote.time - currentTime);
        
        if (timeDiff <= tolerance) {
          // 命中！
          setNotes(prev => prev.map(note => 
            note.id === closestNote.id ? { ...note, hit: true } : note
          ));
        }
      }
    }
  }, [gameState.isPlaying, gameState.currentTime, notes, tolerance]);

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
    };
  }, []);

  // 初始化時生成第一個節奏
  useEffect(() => {
    generateNewRhythm();
  }, [generateNewRhythm]);

  const progress = gameState.totalNotes > 0 
    ? ((gameState.hitNotes + gameState.missedNotes) / gameState.totalNotes) * 100 
    : 0;

  return (
    <Box>
      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
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
                開始遊戲
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
          </Stack>

          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ height: 8, borderRadius: 4 }}
          />
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
              按空白鍵跟隨節奏！
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            當音符移動到指定位置時按下空白鍵，容錯時間為 200ms
          </Typography>
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

```

```typescriptreact
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
  Grid,
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
import AbcRenderer from './AbcRenderer';
import { generateRandomRhythm } from '@/utils/rhythmGenerator';
import AudioUtils, { NOTE_FREQUENCIES } from '@/utils/audioUtils';
import Metronome from '@kevinorriss/react-metronome';

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

  // 開始遊戲
  const startGame = useCallback(() => {
    if (!abcNotation || notes.length === 0) return;

    startTimeRef.current = Date.now();
    setGameState(prev => ({ 
      ...prev, 
      isPlaying: true, 
      gameStarted: true,
      currentTime: 0 
    }));

    // 遊戲計時器
    gameRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      
      setGameState(prev => {
        const newState = { ...prev, currentTime: elapsed };
        
        // 檢查是否有音符被錯過
        const updatedNotes = notes.map(note => {
          if (!note.hit && !note.missed && elapsed > note.time + tolerance) {
            return { ...note, missed: true };
          }
          return note;
        });
        
        const missedCount = updatedNotes.filter(n => n.missed).length;
        const hitCount = updatedNotes.filter(n => n.hit).length;
        
        // 更新錯過的音符
        if (missedCount > prev.missedNotes) {
          setNotes(updatedNotes);
        }
        
        // 檢查遊戲是否結束
        const totalProcessed = hitCount + missedCount;
        if (totalProcessed >= notes.length) {
          clearInterval(gameRef.current!);
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
  }, [abcNotation, notes, tolerance]);

  // 暫停遊戲
  const pauseGame = useCallback(() => {
    if (gameRef.current) {
      clearInterval(gameRef.current);
      gameRef.current = null;
    }
    setGameState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  // 處理按鍵
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (event.code === 'Space' && gameState.isPlaying) {
      event.preventDefault();
      
      const currentTime = gameState.currentTime;
      
      // 尋找最接近的音符
      const availableNotes = notes.filter(note => !note.hit && !note.missed);
      const closestNote = availableNotes.reduce((closest, note) => {
        const timeDiff = Math.abs(note.time - currentTime);
        const closestDiff = Math.abs(closest.time - currentTime);
        return timeDiff < closestDiff ? note : closest;
      }, availableNotes[0]);

      if (closestNote) {
        const timeDiff = Math.abs(closestNote.time - currentTime);
        
        if (timeDiff <= tolerance) {
          // 命中！
          setNotes(prev => prev.map(note => 
            note.id === closestNote.id ? { ...note, hit: true } : note
          ));
        }
      }
    }
  }, [gameState.isPlaying, gameState.currentTime, notes, tolerance]);

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
    };
  }, []);

  // 初始化時生成第一個節奏
  useEffect(() => {
    generateNewRhythm();
  }, [generateNewRhythm]);

  const progress = gameState.totalNotes > 0 
    ? ((gameState.hitNotes + gameState.missedNotes) / gameState.totalNotes) * 100 
    : 0;

  return (
    <Box>
      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
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
                開始遊戲
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
          </Stack>

          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ height: 8, borderRadius: 4 }}
          />
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
              按空白鍵跟隨節奏！
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            當音符移動到指定位置時按下空白鍵，容錯時間為 200ms
          </Typography>
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

```

現在讓我更新開始遊戲的邏輯，添加練習模式和音效：

```typescriptreact
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
  Grid,
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
import AbcRenderer from './AbcRenderer';
import { generateRandomRhythm } from '@/utils/rhythmGenerator';
import AudioUtils, { NOTE_FREQUENCIES } from '@/utils/audioUtils';
import Metronome from '@kevinorriss/react-metronome';

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
        
        // 檢查是否有音符被錯過
        const updatedNotes = notes.map(note => {
          if (!note.hit && !note.missed && elapsed > note.time + tolerance) {
            return { ...note, missed: true };
          }
          return note;
        });
        
        const missedCount = updatedNotes.filter(n => n.missed).length;
        const hitCount = updatedNotes.filter(n => n.hit).length;
        
        // 更新錯過的音符
        if (missedCount > prev.missedNotes) {
          setNotes(updatedNotes);
        }
        
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
    setGameState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  // 處理按鍵
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (event.code === 'Space' && gameState.isPlaying) {
      event.preventDefault();
      
      const currentTime = gameState.currentTime;
      
      // 尋找最接近的音符
      const availableNotes = notes.filter(note => !note.hit && !note.missed);
      const closestNote = availableNotes.reduce((closest, note) => {
        const timeDiff = Math.abs(note.time - currentTime);
        const closestDiff = Math.abs(closest.time - currentTime);
        return timeDiff < closestDiff ? note : closest;
      }, availableNotes[0]);

      if (closestNote) {
        const timeDiff = Math.abs(closestNote.time - currentTime);
        
        if (timeDiff <= tolerance) {
          // 命中！
          setNotes(prev => prev.map(note => 
            note.id === closestNote.id ? { ...note, hit: true } : note
          ));
        }
      }
    }
  }, [gameState.isPlaying, gameState.currentTime, notes, tolerance]);

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
    };
  }, []);

  // 初始化時生成第一個節奏
  useEffect(() => {
    generateNewRhythm();
  }, [generateNewRhythm]);

  const progress = gameState.totalNotes > 0 
    ? ((gameState.hitNotes + gameState.missedNotes) / gameState.totalNotes) * 100 
    : 0;

  return (
    <Box>
      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
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
                開始遊戲
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
          </Stack>

          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ height: 8, borderRadius: 4 }}
          />
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
              按空白鍵跟隨節奏！
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            當音符移動到指定位置時按下空白鍵，容錯時間為 200ms
          </Typography>
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

```

現在更新暫停遊戲和按鍵處理邏輯：

```typescriptreact
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
  Grid,
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
import AbcRenderer from './AbcRenderer';
import { generateRandomRhythm } from '@/utils/rhythmGenerator';
import AudioUtils, { NOTE_FREQUENCIES } from '@/utils/audioUtils';
import Metronome from '@kevinorriss/react-metronome';

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
        
        // 檢查是否有音符被錯過
        const updatedNotes = notes.map(note => {
          if (!note.hit && !note.missed && elapsed > note.time + tolerance) {
            return { ...note, missed: true };
          }
          return note;
        });
        
        const missedCount = updatedNotes.filter(n => n.missed).length;
        const hitCount = updatedNotes.filter(n => n.hit).length;
        
        // 更新錯過的音符
        if (missedCount > prev.missedNotes) {
          setNotes(updatedNotes);
        }
        
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
      
      // 尋找最接近的音符
      const availableNotes = notes.filter(note => !note.hit && !note.missed);
      if (availableNotes.length === 0) return;
      
      const closestNote = availableNotes.reduce((closest, note) => {
        const timeDiff = Math.abs(note.time - currentTime);
        const closestDiff = Math.abs(closest.time - currentTime);
        return timeDiff < closestDiff ? note : closest;
      }, availableNotes[0]);

      const timeDiff = Math.abs(closestNote.time - currentTime);
      
      if (timeDiff <= tolerance) {
        // 命中！
        audioUtils.current.createKeyPressSound(true);
        setNotes(prev => prev.map(note => 
          note.id === closestNote.id ? { ...note, hit: true } : note
        ));
      } else {
        // 錯過
        audioUtils.current.createKeyPressSound(false);
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
    };
  }, []);

  // 初始化時生成第一個節奏
  useEffect(() => {
    generateNewRhythm();
  }, [generateNewRhythm]);

  const progress = gameState.totalNotes > 0 
    ? ((gameState.hitNotes + gameState.missedNotes) / gameState.totalNotes) * 100 
    : 0;

  return (
    <Box>
      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
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
                開始遊戲
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
          </Stack>

          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ height: 8, borderRadius: 4 }}
          />
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
              按空白鍵跟隨節奏！
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            當音符移動到指定位置時按下空白鍵，容錯時間為 200ms
          </Typography>
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

```

現在更新清理邏輯：

```typescriptreact
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
  Grid,
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
import AbcRenderer from './AbcRenderer';
import { generateRandomRhythm } from '@/utils/rhythmGenerator';
import AudioUtils, { NOTE_FREQUENCIES } from '@/utils/audioUtils';
import Metronome from '@kevinorriss/react-metronome';

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
        
        // 檢查是否有音符被錯過
        const updatedNotes = notes.map(note => {
          if (!note.hit && !note.missed && elapsed > note.time + tolerance) {
            return { ...note, missed: true };
          }
          return note;
        });
        
        const missedCount = updatedNotes.filter(n => n.missed).length;
        const hitCount = updatedNotes.filter(n => n.hit).length;
        
        // 更新錯過的音符
        if (missedCount > prev.missedNotes) {
          setNotes(updatedNotes);
        }
        
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
      
      // 尋找最接近的音符
      const availableNotes = notes.filter(note => !note.hit && !note.missed);
      if (availableNotes.length === 0) return;
      
      const closestNote = availableNotes.reduce((closest, note) => {
        const timeDiff = Math.abs(note.time - currentTime);
        const closestDiff = Math.abs(closest.time - currentTime);
        return timeDiff < closestDiff ? note : closest;
      }, availableNotes[0]);

      const timeDiff = Math.abs(closestNote.time - currentTime);
      
      if (timeDiff <= tolerance) {
        // 命中！
        audioUtils.current.createKeyPressSound(true);
        setNotes(prev => prev.map(note => 
          note.id === closestNote.id ? { ...note, hit: true } : note
        ));
      } else {
        // 錯過
        audioUtils.current.createKeyPressSound(false);
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

  const progress = gameState.totalNotes > 0 
    ? ((gameState.hitNotes + gameState.missedNotes) / gameState.totalNotes) * 100 
    : 0;

  return (
    <Box>
      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
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
                開始遊戲
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
          </Stack>

          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ height: 8, borderRadius: 4 }}
          />
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
              按空白鍵跟隨節奏！
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            當音符移動到指定位置時按下空白鍵，容錯時間為 200ms
          </Typography>
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

```

現在更新 UI 部分，添加所有新的控制元件：

```typescriptreact
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
  Grid,
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
import AbcRenderer from './AbcRenderer';
import { generateRandomRhythm } from '@/utils/rhythmGenerator';
import AudioUtils, { NOTE_FREQUENCIES } from '@/utils/audioUtils';
import Metronome from '@kevinorriss/react-metronome';

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
        
        // 檢查是否有音符被錯過
        const updatedNotes = notes.map(note => {
          if (!note.hit && !note.missed && elapsed > note.time + tolerance) {
            return { ...note, missed: true };
          }
          return note;
        });
        
        const missedCount = updatedNotes.filter(n => n.missed).length;
        const hitCount = updatedNotes.filter(n => n.hit).length;
        
        // 更新錯過的音符
        if (missedCount > prev.missedNotes) {
          setNotes(updatedNotes);
        }
        
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
      
      // 尋找最接近的音符
      const availableNotes = notes.filter(note => !note.hit && !note.missed);
      if (availableNotes.length === 0) return;
      
      const closestNote = availableNotes.reduce((closest, note) => {
        const timeDiff = Math.abs(note.time - currentTime);
        const closestDiff = Math.abs(closest.time - currentTime);
        return timeDiff < closestDiff ? note : closest;
      }, availableNotes[0]);

      const timeDiff = Math.abs(closestNote.time - currentTime);
      
      if (timeDiff <= tolerance) {
        // 命中！
        audioUtils.current.createKeyPressSound(true);
        setNotes(prev => prev.map(note => 
          note.id === closestNote.id ? { ...note, hit: true } : note
        ));
      } else {
        // 錯過
        audioUtils.current.createKeyPressSound(false);
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

  const progress = gameState.totalNotes > 0 
    ? ((gameState.hitNotes + gameState.missedNotes) / gameState.totalNotes) * 100 
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
                      <Metronome
                        bpm={bpm}
                        isRunning={metronomeActive}
                        soundEnabled={true}
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
              按空白鍵跟隨節奏！
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            當音符移動到指定位置時按下空白鍵，容錯時間為 200ms
          </Typography>
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

```

現在更新最後的 UI 部分：

```typescriptreact
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
  Grid,
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
import AbcRenderer from './AbcRenderer';
import { generateRandomRhythm } from '@/utils/rhythmGenerator';
import AudioUtils, { NOTE_FREQUENCIES } from '@/utils/audioUtils';
import Metronome from '@kevinorriss/react-metronome';

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
        
        // 檢查是否有音符被錯過
        const updatedNotes = notes.map(note => {
          if (!note.hit && !note.missed && elapsed > note.time + tolerance) {
            return { ...note, missed: true };
          }
          return note;
        });
        
        const missedCount = updatedNotes.filter(n => n.missed).length;
        const hitCount = updatedNotes.filter(n => n.hit).length;
        
        // 更新錯過的音符
        if (missedCount > prev.missedNotes) {
          setNotes(updatedNotes);
        }
        
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
      
      // 尋找最接近的音符
      const availableNotes = notes.filter(note => !note.hit && !note.missed);
      if (availableNotes.length === 0) return;
      
      const closestNote = availableNotes.reduce((closest, note) => {
        const timeDiff = Math.abs(note.time - currentTime);
        const closestDiff = Math.abs(closest.time - currentTime);
        return timeDiff < closestDiff ? note : closest;
      }, availableNotes[0]);

      const timeDiff = Math.abs(closestNote.time - currentTime);
      
      if (timeDiff <= tolerance) {
        // 命中！
        audioUtils.current.createKeyPressSound(true);
        setNotes(prev => prev.map(note => 
          note.id === closestNote.id ? { ...note, hit: true } : note
        ));
      } else {
        // 錯過
        audioUtils.current.createKeyPressSound(false);
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

  const progress = gameState.totalNotes > 0 
    ? ((gameState.hitNotes + gameState.missedNotes) / gameState.totalNotes) * 100 
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
                      <Metronome
                        bpm={bpm}
                        isRunning={metronomeActive}
                        soundEnabled={true}
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

```

現在讓我檢查是否有任何 linting 錯誤：

看起來 TypeScript 還沒有識別到 AbcRenderer 組件。讓我重新啟動開發服務器來測試：

