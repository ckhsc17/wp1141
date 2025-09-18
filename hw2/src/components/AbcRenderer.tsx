'use client';

import React, { useEffect, useRef } from 'react';
import { Box, IconButton, Stack, Typography, Slider } from '@mui/material';
import { Refresh, PlayArrow, Pause, Hearing } from '@mui/icons-material';

interface Note {
  id: string;
  time: number;
  duration: number;
  hit?: boolean;
  missed?: boolean;
  wrong?: boolean;
}

interface GameSettings {
  bpm: number;
  measures: number;
}

interface AbcRendererProps {
  abcNotation: string;
  currentTime?: number;
  notes?: Note[];
  onGenerateNewRhythm?: () => void;
  onStartGame?: () => void;
  onPauseGame?: () => void;
  onTogglePracticeMode?: (enabled: boolean) => void;
  isPlaying?: boolean;
  isGameActive?: boolean;
  isPracticeMode?: boolean;
  gameSettings?: GameSettings;
  updateGameSettings?: (settings: Partial<GameSettings>) => void;
}

const AbcRenderer: React.FC<AbcRendererProps> = ({ 
  abcNotation, 
  currentTime = 0, 
  notes = [],
  onGenerateNewRhythm,
  onStartGame,
  onPauseGame,
  onTogglePracticeMode,
  isPlaying = false,
  isGameActive = false,
  isPracticeMode = true,
  gameSettings,
  updateGameSettings
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const visualObjRef = useRef<unknown>(null);

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
          clickListener: (abcElem: unknown) => {
            console.log('Clicked element:', abcElem);
          }
        });

        visualObjRef.current = visualObj;

        // 添加視覺效果的 CSS
        const style = document.createElement('style');
        style.textContent = `
          .abcjs-note {
            fill: #000000 !important;
            stroke: #000000 !important;
          }
          .abcjs-note.current {
            fill: rgba(128, 128, 128, 0.4) !important;
            stroke: rgba(128, 128, 128, 0.6) !important;
            stroke-width: 2px !important;
          }
          .note-result {
            font-size: 16px;
            font-weight: bold;
            text-anchor: middle;
            dominant-baseline: text-before-edge;
          }
          .note-result.hit {
            fill: #4caf50;
          }
          .note-result.missed {
            fill: #f44336;
          }
          .note-result.wrong {
            fill: #ff9800;
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

      // 檢查音符狀態（用於調試）

      // 重置所有音符樣式
      const allNotes = svg.querySelectorAll('.abcjs-note');
      allNotes.forEach((note: Element) => {
        (note as SVGElement).classList.remove('hit', 'missed', 'current');
      });

      // 清除舊的結果標記
      const oldResults = svg.querySelectorAll('.note-result');
      oldResults.forEach(result => result.remove());
      
      // 找到最接近當前時間的音符（只有一個會被標記為灰色）
      let closestNoteIndex = -1;
      let closestTimeDiff = Infinity;
      
      notes.forEach((note, index) => {
        const timeDiff = Math.abs(note.time - currentTime);
        if (timeDiff < 0.2 && timeDiff < closestTimeDiff) { // 在範圍內且最接近
          closestTimeDiff = timeDiff;
          closestNoteIndex = index;
        }
      });

      // 根據遊戲狀態更新音符顏色和結果
      notes.forEach((note, index) => {
        const noteElement = allNotes[index] as SVGElement;
        if (noteElement) {
          // 只有最接近的音符顯示灰色
          if (index === closestNoteIndex) {
            noteElement.classList.add('current');
          }
          
          // 在音符下方顯示結果
          if (note.hit || note.missed || note.wrong) {
            const bbox = (noteElement as SVGGraphicsElement).getBBox();
            const centerX = bbox.x + bbox.width / 2;
            const centerY = svg.getBBox().y + svg.getBBox().height + 30; // 統一高度
            
            // 優先級：hit > missed > wrong
            if (note.hit) {
              // 綠色無邊框圓點
              const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
              circle.setAttribute('class', 'note-result hit');
              circle.setAttribute('cx', centerX.toString());
              circle.setAttribute('cy', centerY.toString());
              circle.setAttribute('r', '8');
              circle.setAttribute('fill', '#4caf50');
              circle.setAttribute('stroke', 'none');
              svg.appendChild(circle);
            } else if (note.missed) {
              // 紅色標準小叉叉 (錯過)
              const crossGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
              crossGroup.setAttribute('class', 'note-result missed');
              
              const size = 6; // 叉叉大小
              
              // 第一條線（左上到右下）
              const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
              line1.setAttribute('x1', (centerX - size).toString());
              line1.setAttribute('y1', (centerY - size).toString());
              line1.setAttribute('x2', (centerX + size).toString());
              line1.setAttribute('y2', (centerY + size).toString());
              line1.setAttribute('stroke', '#f44336');
              line1.setAttribute('stroke-width', '2');
              line1.setAttribute('stroke-linecap', 'round');
              
              // 第二條線（右上到左下）
              const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
              line2.setAttribute('x1', (centerX + size).toString());
              line2.setAttribute('y1', (centerY - size).toString());
              line2.setAttribute('x2', (centerX - size).toString());
              line2.setAttribute('y2', (centerY + size).toString());
              line2.setAttribute('stroke', '#f44336');
              line2.setAttribute('stroke-width', '2');
              line2.setAttribute('stroke-linecap', 'round');
              
              crossGroup.appendChild(line1);
              crossGroup.appendChild(line2);
              svg.appendChild(crossGroup);
            } else if (note.wrong) {
              // 橙色叉叉 (錯誤敲擊)
              const crossGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
              crossGroup.setAttribute('class', 'note-result wrong');
              
              const size = 6; // 叉叉大小
              
              // 第一條線（左上到右下）
              const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
              line1.setAttribute('x1', (centerX - size).toString());
              line1.setAttribute('y1', (centerY - size).toString());
              line1.setAttribute('x2', (centerX + size).toString());
              line1.setAttribute('y2', (centerY + size).toString());
              line1.setAttribute('stroke', '#ff9800');
              line1.setAttribute('stroke-width', '2');
              line1.setAttribute('stroke-linecap', 'round');
              
              // 第二條線（右上到左下）
              const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
              line2.setAttribute('x1', (centerX + size).toString());
              line2.setAttribute('y1', (centerY - size).toString());
              line2.setAttribute('x2', (centerX - size).toString());
              line2.setAttribute('y2', (centerY + size).toString());
              line2.setAttribute('stroke', '#ff9800');
              line2.setAttribute('stroke-width', '2');
              line2.setAttribute('stroke-linecap', 'round');
              
              crossGroup.appendChild(line1);
              crossGroup.appendChild(line2);
              svg.appendChild(crossGroup);
            }
          }
        }
      });

      // 移除了時間游標功能
    } catch (error) {
      console.error('Error updating visual effects:', error);
    }
  }, [currentTime, notes]);

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        minHeight: 275,
        borderRadius: 2,
        overflow: 'auto',
        
        // 玻璃態效果
        background: 'rgba(255, 255, 255, 0.25)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)', // Safari 支援
        border: '1px solid rgba(255, 255, 255, 0.3)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        
        // 進入動畫
        animation: 'scoreGlassFadeIn 1s ease-out 0.8s both',
        
        // 懸停效果
        transition: 'all 0.3s ease',
        '&:hover': {
          background: 'rgba(255, 255, 255, 0.3)',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
        },
        
        // 響應式調整
        '@media (max-width: 768px)': {
          backdropFilter: 'blur(5px)',
          WebkitBackdropFilter: 'blur(5px)',
          background: 'rgba(255, 255, 255, 0.35)',
        },
        
        // 動畫關鍵幀
        '@keyframes scoreGlassFadeIn': {
          '0%': {
            opacity: 0,
            transform: 'translateY(30px) scale(0.95)',
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
        
        // SVG 樣式優化
        '& svg': {
          maxWidth: '100%',
          height: 'auto',
          // 讓 SVG 內容更清晰
          filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))',
        },
        
        // 音符和線條的對比度增強
        '& .abcjs-note': {
          filter: 'drop-shadow(0 1px 1px rgba(0, 0, 0, 0.2))',
        },
        
        '& .abcjs-staff': {
          stroke: 'rgba(0, 0, 0, 0.8)',
          strokeWidth: '1.2px',
        },
        
        // 不支援毛玻璃效果的後備方案
        '@supports not (backdrop-filter: blur(10px))': {
          background: 'rgba(255, 255, 255, 0.4)',
          border: '1px solid rgba(0, 0, 0, 0.1)',
        },
      }}
    >
      {/* 浮動控制按鈕 */}
      <Stack
        direction="row"
        spacing={1}
        sx={{
          position: 'absolute',
          top: 12,
          right: 12,
          zIndex: 10,
        }}
      >
        {/* BPM 控制桿 - 小型版本 */}
        {gameSettings && updateGameSettings && (
          <Box sx={{
            background: 'transparent',
            borderRadius: 1,
            p: 0.5,
            minWidth: 100,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            <Typography variant="caption" sx={{ 
              fontSize: 10, 
              fontWeight: 'bold', 
              mb: 0.2,
              color: 'white',
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
            }}>
              BPM: {gameSettings.bpm}
            </Typography>
            <Slider
              value={gameSettings.bpm}
              onChange={(_, value) => updateGameSettings({ bpm: value as number })}
              min={60}
              max={180}
              step={10}
              disabled={isGameActive}
              size="small"
              sx={{
                width: 80,
                height: 4,
                color: 'white',
                '& .MuiSlider-thumb': {
                  width: 12,
                  height: 12,
                  backgroundColor: 'white',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                },
                '& .MuiSlider-track': {
                  height: 2,
                  backgroundColor: 'white',
                },
                '& .MuiSlider-rail': {
                  height: 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                },
              }}
            />
          </Box>
        )}

        {/* 小節數控制桿 - 小型版本 */}
        {gameSettings && updateGameSettings && (
          <Box sx={{
            background: 'transparent',
            borderRadius: 1,
            p: 0.5,
            minWidth: 100,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            <Typography variant="caption" sx={{ 
              fontSize: 10, 
              fontWeight: 'bold', 
              mb: 0.2,
              color: 'white',
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
            }}>
              小節: {gameSettings.measures}
            </Typography>
            <Slider
              value={gameSettings.measures}
              onChange={(_, value) => updateGameSettings({ measures: value as number })}
              min={1}
              max={8}
              step={1}
              disabled={isGameActive}
              size="small"
              marks={[
                { value: 1, label: '' },
                { value: 4, label: '' },
                { value: 8, label: '' }
              ]}
              sx={{
                width: 80,
                height: 4,
                color: 'white',
                '& .MuiSlider-thumb': {
                  width: 12,
                  height: 12,
                  backgroundColor: 'white',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                },
                '& .MuiSlider-track': {
                  height: 2,
                  backgroundColor: 'white',
                },
                '& .MuiSlider-rail': {
                  height: 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                },
                '& .MuiSlider-mark': {
                  width: 2,
                  height: 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.6)',
                },
              }}
            />
          </Box>
        )}

        {/* 練習模式按鈕 */}
        <IconButton
          onClick={() => onTogglePracticeMode && onTogglePracticeMode(!isPracticeMode)}
          disabled={isGameActive}
          sx={{
            background: isPracticeMode 
              ? 'rgba(156, 39, 176, 0.8)' 
              : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(5px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: isPracticeMode ? 'white' : '#9c27b0',
            width: 40,
            height: 40,
            transition: 'all 0.2s ease',
            transform: isPracticeMode ? 'scale(0.95)' : 'scale(1)', // 按下去的視覺效果
            boxShadow: isPracticeMode 
              ? 'inset 0 2px 4px rgba(0, 0, 0, 0.2), 0 2px 8px rgba(156, 39, 176, 0.3)'
              : '0 4px 12px rgba(0, 0, 0, 0.1)',
            '&:hover': {
              background: isPracticeMode 
                ? 'rgba(156, 39, 176, 0.9)' 
                : 'rgba(255, 255, 255, 0.9)',
              transform: isPracticeMode ? 'scale(0.97)' : 'scale(1.05)',
              boxShadow: isPracticeMode
                ? 'inset 0 2px 4px rgba(0, 0, 0, 0.3), 0 4px 12px rgba(156, 39, 176, 0.4)'
                : '0 4px 12px rgba(156, 39, 176, 0.3)',
            },
            '&:disabled': {
              background: 'rgba(255, 255, 255, 0.5)',
              color: 'rgba(156, 39, 176, 0.5)',
              transform: 'scale(1)',
            },
          }}
        >
          <Hearing fontSize="small" />
        </IconButton>

        {/* 生成新節奏按鈕 */}
        <IconButton
          onClick={onGenerateNewRhythm}
          disabled={isGameActive}
          sx={{
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(5px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: '#1976d2',
            width: 40,
            height: 40,
            transition: 'all 0.2s ease',
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.9)',
              transform: 'scale(1.05)',
              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
            },
            '&:disabled': {
              background: 'rgba(255, 255, 255, 0.5)',
              color: 'rgba(25, 118, 210, 0.5)',
            },
          }}
        >
          <Refresh fontSize="small" />
        </IconButton>

        {/* 開始/暫停按鈕 */}
        <IconButton
          onClick={isPlaying ? onPauseGame : onStartGame}
          disabled={!abcNotation}
          sx={{
            background: isPlaying 
              ? 'rgba(255, 152, 0, 0.8)' 
              : 'rgba(76, 175, 80, 0.8)',
            backdropFilter: 'blur(5px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: 'white',
            width: 40,
            height: 40,
            transition: 'all 0.2s ease',
            '&:hover': {
              background: isPlaying 
                ? 'rgba(255, 152, 0, 0.9)' 
                : 'rgba(76, 175, 80, 0.9)',
              transform: 'scale(1.05)',
              boxShadow: isPlaying
                ? '0 4px 12px rgba(255, 152, 0, 0.4)'
                : '0 4px 12px rgba(76, 175, 80, 0.4)',
            },
            '&:disabled': {
              background: 'rgba(158, 158, 158, 0.5)',
              color: 'rgba(255, 255, 255, 0.7)',
            },
          }}
        >
          {isPlaying ? <Pause fontSize="small" /> : <PlayArrow fontSize="small" />}
        </IconButton>
      </Stack>

      {/* ABC 記譜容器 */}
      <Box
        ref={containerRef}
        sx={{
          p: 3,
          '@media (max-width: 768px)': {
            p: 2,
          },
        }}
      />
    </Box>
  );
};

export default AbcRenderer;
