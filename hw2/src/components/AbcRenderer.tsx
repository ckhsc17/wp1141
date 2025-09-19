'use client';

import React, { useEffect, useRef } from 'react';
import { Box, IconButton, Stack, Typography, Slider, Select, MenuItem, Chip } from '@mui/material';
import { Refresh, PlayArrow, Pause, Hearing, EmojiEvents, CheckCircle, Cancel, Error } from '@mui/icons-material';

interface Note {
  id: string;
  time: number;
  duration: number;
  hit?: boolean;
  missed?: boolean;
  wrong?: boolean;
  isRest?: boolean; // 是否為休止符
}

type Difficulty = 'Easy' | 'Medium' | 'Hard';

interface GameSettings {
  bpm: number;
  measures: number;
  difficulty: Difficulty;
}

interface GameStats {
  score: number;
  hitNotes: number;
  missedNotes: number;
  wrongNotes: number;
}

interface AbcRendererProps {
  abcNotation: string;
  currentTime?: number;
  notes?: Note[];
  gameStats?: GameStats;
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
  gameStats,
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

  // 自動滾動到當前音符（手機版）
  useEffect(() => {
    if (!containerRef.current || !currentTime || !notes.length) return;
    
    const isMobile = window.innerWidth < 768;
    if (!isMobile) return; // 只在手機版啟用自動滾動
    
    // 找到當前應該播放的音符（更寬鬆的時間容錯）
    const currentNoteIndex = notes.findIndex(note => 
      currentTime >= note.time - 0.2 && currentTime <= note.time + note.duration + 0.2
    );
    
    if (currentNoteIndex >= 0) {
      // 使用音符索引來定位 DOM 元素（更可靠）
      const noteElements = containerRef.current.querySelectorAll('.abcjs-note');
      const currentNoteElement = noteElements[currentNoteIndex];
      
      if (currentNoteElement) {
        // 獲取容器的滾動位置
        const container = containerRef.current;
        const noteRect = currentNoteElement.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        // 計算是否需要滾動
        const isNoteVisible = noteRect.top >= containerRect.top && 
                             noteRect.bottom <= containerRect.bottom;
        
        if (!isNoteVisible) {
          // 滾動到音符位置，讓音符出現在容器中央
          const scrollTop = container.scrollTop + 
                           (noteRect.top - containerRect.top) - 
                           (containerRect.height / 2) + 
                           (noteRect.height / 2);
          
          container.scrollTo({
            top: Math.max(0, scrollTop),
            behavior: 'smooth'
          });
        }
      }
    }
  }, [currentTime, notes]);

  useEffect(() => {
    if (!containerRef.current || !abcNotation) return;

    try {
      // 動態導入 abcjs
      import('abcjs').then((abcjs) => {
        if (!containerRef.current) return;
        
        // 清除之前的內容
        containerRef.current.innerHTML = '';

        // 動態計算渲染參數
        const containerWidth = containerRef.current.offsetWidth || 800;
        const isMobile = window.innerWidth < 768;
        
        // 根據設備調整參數
        const renderOptions = {
          responsive: 'resize' as const,
          scale: isMobile ? 0.75 : 1.0, // 手機上進一步縮小比例
          staffwidth: Math.max(isMobile ? 300 : 400, containerWidth - 40), // 手機上更小的寬度
          add_classes: true,
          paddingleft: 10,
          paddingright: 10,
          paddingtop: isMobile ? 80 : 60, // 手機上更多頂部間距
          paddingbottom: 20,
          wrap: {
            minSpacing: isMobile ? 1.5 : 1.8, // 手機上更緊湊的間距
            maxSpacing: isMobile ? 2.0 : 2.5, // 手機上更小的最大間距
            maxWidth: isMobile ? 280 : 500, // 手機上更窄的換行寬度
            preferredMeasuresPerLine: isMobile ? 2 : 4 // 手機上每行2小節，桌面4小節
          },
          clickListener: (abcElem: unknown) => {
            console.log('Clicked element:', abcElem);
          }
        };
        
        // 渲染 ABC 記譜法
        const visualObj = abcjs.renderAbc(containerRef.current, abcNotation, renderOptions);

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
          .abcjs-rest {
            fill: #000000 !important;
            stroke: #000000 !important;
          }
          .abcjs-rest.current {
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

      // 重置所有音符和休止符樣式
      const allNotes = svg.querySelectorAll('.abcjs-note');
      const allRests = svg.querySelectorAll('.abcjs-rest');
      
      // 清除所有視覺元素的樣式
      [...allNotes, ...allRests].forEach((element: Element) => {
        (element as SVGElement).classList.remove('hit', 'missed', 'current');
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

      // 建立音符到 DOM 元素的映射（過濾掉休止符）
      const nonRestNotes = notes.filter(note => !note.isRest);
      const allVisualElements = [...allNotes, ...allRests];

      // 根據遊戲狀態更新音符顏色和結果
      notes.forEach((note, index) => {
        let visualElement: SVGElement | null = null;
        
        if (note.isRest) {
          // 休止符：通過在休止符數組中的位置來找到對應的 DOM 元素
          const restIndex = notes.slice(0, index).filter(n => n.isRest).length;
          visualElement = allRests[restIndex] as SVGElement;
        } else {
          // 音符：通過在非休止符數組中的位置來找到對應的 DOM 元素
          const noteIndex = notes.slice(0, index).filter(n => !n.isRest).length;
          visualElement = allNotes[noteIndex] as SVGElement;
        }
        
        if (visualElement) {
          // 只有最接近的音符顯示灰色（包括休止符）
          if (index === closestNoteIndex) {
            visualElement.classList.add('current');
          }
          
          // 在音符下方顯示結果
          if (note.hit || note.missed || note.wrong) {
            const bbox = (visualElement as SVGGraphicsElement).getBBox();
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
        minHeight: 'auto', // 讓高度完全自適應
        maxHeight: '90vh', // 限制最大高度，避免超出視窗
        borderRadius: 2,
        overflow: 'auto', // 改回 auto，允許滾動
        display: 'flex',
        flexDirection: 'column',
        
        // 玻璃態效果
        background: 'rgba(255, 255, 255, 0.25)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)', // Safari 支援
        border: '1px solid rgba(255, 255, 255, 0.3)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        
        // 進入動畫 - 減少動畫時間避免阻擋交互
        animation: 'scoreGlassFadeIn 0.5s ease-out both',
        
        // 懸停效果 - 減少過渡時間
        transition: 'background 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          background: 'rgba(255, 255, 255, 0.3)',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
        },
        
        // 確保點擊事件正常工作
        pointerEvents: 'auto',
        userSelect: 'none', // 防止文字選取干擾點擊
        
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
      {/* 功能列 - 改為正常流式布局，不使用絕對定位 */}
      <Box
        sx={{
          position: 'relative', // 改為相對定位
          p: { xs: 1, sm: 2 }, // 添加適當的內邊距
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' }, // 手機版垂直排列，桌面版水平排列
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: { xs: 1, sm: 2 }, // 手機版元素間距
          // 確保功能列不阻擋交互
          pointerEvents: 'auto',
          userSelect: 'none',
          // 使用與 renderer 相同的背景色
          // background: 'transparent',
          // borderRadius: 1,
          // backdropFilter: 'blur(10px)',
          // WebkitBackdropFilter: 'blur(10px)',
          // border: '1px solid rgba(255, 255, 255, 0.3)',
        }}
      >
        {/* 統計信息 - 自適應 */}
        {gameStats && (
          <Stack 
            direction="row" 
            spacing={{ xs: 0.5, sm: 1 }} // 手機版更緊湊的間距
            sx={{
              flexWrap: 'wrap', // 允許換行
              justifyContent: { xs: 'center', sm: 'flex-start' },
              order: { xs: 2, sm: 1 }, // 手機版統計信息在下方
            }}
          >
            {/* 得分 */}
            <Chip
              icon={<EmojiEvents sx={{ 
                fontSize: { xs: '20px !important', sm: '32px !important' }, 
                color: '#FFD700 !important', 
                opacity: 0.8 
              }} />}
              label={gameStats.score}
              size="medium"
              sx={{
                background: 'transparent !important',
                backgroundColor: 'transparent !important',
                color: 'white',
                fontSize: { xs: 14, sm: 20 },
                height: { xs: 24, sm: 32 },
                '& .MuiChip-label': { 
                  px: 0.5, 
                  fontSize: { xs: 14, sm: 20 }, 
                  fontWeight: 'bold', 
                  textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)' 
                },
                '& .MuiChip-icon': { 
                  ml: 1, 
                  color: '#FFD700 !important',
                  '& svg': { color: '#FFD700 !important', opacity: 0.8 }
                },
                border: 'none',
                boxShadow: 'none',
              }}
            />
            
            {/* 命中 */}
            <Chip
              icon={<CheckCircle sx={{ 
                fontSize: { xs: '20px !important', sm: '32px !important' }, 
                color: '#4CAF50 !important', 
                opacity: 0.8 
              }} />}
              label={gameStats.hitNotes}
              size="medium"
              sx={{
                background: 'transparent !important',
                backgroundColor: 'transparent !important',
                color: 'white',
                fontSize: { xs: 14, sm: 20 },
                height: { xs: 24, sm: 32 },
                '& .MuiChip-label': { 
                  px: 0.5, 
                  fontSize: { xs: 14, sm: 20 }, 
                  fontWeight: 'bold', 
                  textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)' 
                },
                '& .MuiChip-icon': { 
                  ml: 1, 
                  color: '#4CAF50 !important',
                  '& svg': { color: '#4CAF50 !important', opacity: 0.8 }
                },
                border: 'none',
                boxShadow: 'none',
              }}
            />
            
            {/* 錯過 */}
            <Chip
              icon={<Cancel sx={{ 
                fontSize: { xs: '20px !important', sm: '32px !important' }, 
                color: '#F44336 !important', // 改為紅色
                opacity: 0.8 
              }} />}
              label={gameStats.missedNotes}
              size="medium"
              sx={{
                background: 'transparent !important',
                backgroundColor: 'transparent !important',
                color: 'white',
                fontSize: { xs: 14, sm: 20 },
                height: { xs: 24, sm: 32 },
                '& .MuiChip-label': { 
                  px: 0.5, 
                  fontSize: { xs: 14, sm: 20 }, 
                  fontWeight: 'bold', 
                  textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)' 
                },
                '& .MuiChip-icon': { 
                  ml: 1, 
                  color: '#F44336 !important', // 改為紅色
                  '& svg': { color: '#F44336 !important', opacity: 0.8 }
                },
                border: 'none',
                boxShadow: 'none',
              }}
            />
            
            {/* 錯誤 */}
            <Chip
              icon={<Error sx={{ 
                fontSize: { xs: '20px !important', sm: '32px !important' }, 
                color: '#FF9800 !important', // 保持橘色
                opacity: 0.8 
              }} />}
              label={gameStats.wrongNotes}
              size="medium"
              sx={{
                background: 'transparent !important',
                backgroundColor: 'transparent !important',
                color: 'white',
                fontSize: { xs: 14, sm: 20 },
                height: { xs: 24, sm: 32 },
                '& .MuiChip-label': { 
                  px: 0.5, 
                  fontSize: { xs: 14, sm: 20 }, 
                  fontWeight: 'bold', 
                  textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)' 
                },
                '& .MuiChip-icon': { 
                  ml: 1, 
                  color: '#FF9800 !important', // 保持橘色
                  '& svg': { color: '#FF9800 !important', opacity: 0.8 }
                },
                border: 'none',
                boxShadow: 'none',
              }}
            />
          </Stack>
        )}

        {/* 控制按鈕 - 自適應 */}
        <Stack
          direction={{ xs: 'row', sm: 'row' }}
          spacing={{ xs: 0.5, sm: 1 }}
          sx={{
            flexWrap: 'wrap',
            justifyContent: { xs: 'center', sm: 'flex-end' },
            order: { xs: 1, sm: 2 }, // 手機版控制按鈕在上方
            '& > *': { // 所有子元素
              flexShrink: 0, // 防止按鈕被壓縮
            }
          }}
        >
        {/* BPM 控制桿 - 響應式 */}
        {gameSettings && updateGameSettings && (
          <Box sx={{
            background: 'transparent',
            borderRadius: 1,
            p: { xs: 0.3, sm: 0.5 },
            minWidth: { xs: 70, sm: 100 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            <Typography variant="caption" sx={{ 
              fontSize: { xs: 8, sm: 10 }, 
              fontWeight: 'bold', 
              mb: 0.2,
              color: 'white',
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
            }}>
              BPM: {gameSettings.bpm}
            </Typography>
            <Slider
              value={gameSettings.bpm}
              onChange={(e, value) => {
                e.stopPropagation(); // 防止事件冒泡
                updateGameSettings({ bpm: value as number });
              }}
              min={60}
              max={180}
              step={10}
              disabled={isGameActive}
              size="small"
              sx={{
                width: { xs: 60, sm: 80 },
                height: 4,
                color: 'white',
                // 確保滑桿可以正常交互
                pointerEvents: 'auto',
                '& .MuiSlider-thumb': {
                  width: { xs: 10, sm: 12 },
                  height: { xs: 10, sm: 12 },
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

        {/* 小節數控制桿 - 響應式 */}
        {gameSettings && updateGameSettings && (
          <Box sx={{
            background: 'transparent',
            borderRadius: 1,
            p: { xs: 0.3, sm: 0.5 },
            minWidth: { xs: 70, sm: 100 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            <Typography variant="caption" sx={{ 
              fontSize: { xs: 8, sm: 10 }, 
              fontWeight: 'bold', 
              mb: 0.2,
              color: 'white',
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
            }}>
              小節: {gameSettings.measures}
            </Typography>
            <Slider
              value={gameSettings.measures}
              onChange={(e, value) => {
                e.stopPropagation(); // 防止事件冒泡
                updateGameSettings({ measures: value as number });
              }}
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
                width: { xs: 60, sm: 80 },
                height: 4,
                color: 'white',
                // 確保滑桿可以正常交互
                pointerEvents: 'auto',
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

        {/* 難度選擇器 - 小型版本 */}
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
              難度: {gameSettings.difficulty}
            </Typography>
            <Select
              value={gameSettings.difficulty}
              onChange={(e) => {
                e.stopPropagation(); // 防止事件冒泡
                updateGameSettings({ difficulty: e.target.value as Difficulty });
              }}
              onOpen={(e) => {
                e?.stopPropagation(); // 防止打開時的事件冒泡
              }}
              disabled={isGameActive}
              size="small"
              sx={{
                minWidth: 80,
                height: 24,
                color: 'white',
                fontSize: 10,
                // 確保點擊事件正常工作
                pointerEvents: 'auto',
                '& .MuiSelect-select': {
                  padding: '2px 8px',
                  color: 'white',
                  fontSize: 10,
                  pointerEvents: 'auto', // 確保選擇框可點擊
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  borderWidth: 1,
                },
                '& .MuiSvgIcon-root': {
                  color: 'white',
                  fontSize: 14,
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'white',
                  borderWidth: 1,
                },
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    bgcolor: 'rgba(0, 0, 0, 0.8)',
                    backdropFilter: 'blur(10px)',
                    '& .MuiMenuItem-root': {
                      color: 'white',
                      fontSize: 10,
                      minHeight: 24,
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                      },
                      '&.Mui-selected': {
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                        '&:hover': {
                          bgcolor: 'rgba(255, 255, 255, 0.3)',
                        },
                      },
                    },
                  },
                },
              }}
            >
              <MenuItem value="Easy">Easy</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="Hard">Hard</MenuItem>
            </Select>
          </Box>
        )}

        {/* 練習模式按鈕 */}
        <IconButton
          onClick={(e) => {
            e.stopPropagation(); // 防止事件冒泡
            onTogglePracticeMode && onTogglePracticeMode(!isPracticeMode);
          }}
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
            // 確保按鈕可以正常點擊
            pointerEvents: 'auto',
            userSelect: 'none',
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
          onClick={(e) => {
            e.stopPropagation(); // 防止事件冒泡
            onGenerateNewRhythm && onGenerateNewRhythm();
          }}
          disabled={isGameActive}
          sx={{
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(5px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: '#1976d2',
            width: 40,
            height: 40,
            // 確保按鈕可以正常點擊
            pointerEvents: 'auto',
            userSelect: 'none',
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
          onClick={(e) => {
            e.stopPropagation(); // 防止事件冒泡
            isPlaying ? onPauseGame && onPauseGame() : onStartGame && onStartGame();
          }}
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
            // 確保按鈕可以正常點擊
            pointerEvents: 'auto',
            userSelect: 'none',
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
      </Box>

      {/* ABC 記譜容器 - 完全自適應高度 */}
      <Box
        ref={containerRef}
        sx={{
          p: { xs: 2, sm: 3 }, // 移除多餘的 padding-top
          minHeight: 'auto', // 移除固定的最小高度
          position: 'relative',
          overflow: 'auto', // 允許滾動，避免內容超出
          height: 'auto', // 讓高度完全根據內容決定
          flex: 1, // 讓譜面容器佔用剩餘空間
          maxHeight: 'calc(90vh - 120px)', // 限制最大高度，預留工具列空間
          
          // 確保五線譜內容適應容器
          '& svg': {
            maxWidth: '100%',
            maxHeight: '100%', // 限制最大高度
            height: 'auto',
            width: '100%',
            // 優化 SVG 顯示
            objectFit: 'contain',
          },
          
          // 優化五線譜在不同屏幕上的顯示
          '& .abcjs-staff': {
            strokeWidth: '1px', // 減少線條粗細以節省空間
          },
        }}
      />
    </Box>
  );
};

export default AbcRenderer;
