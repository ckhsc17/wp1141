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
            fill: #808080 !important;
            stroke: #808080 !important;
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
          if (note.hit || note.missed) {
            const bbox = (noteElement as SVGGraphicsElement).getBBox();
            // 優先級：hit > missed（命中優先於錯過）
            const isHit = note.hit; // hit 優先
            
            if (isHit) {
              // 綠色無邊框圓點
              const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
              circle.setAttribute('class', 'note-result hit');
              circle.setAttribute('cx', (bbox.x + bbox.width / 2).toString());
              circle.setAttribute('cy', (svg.getBBox().y + svg.getBBox().height + 30).toString()); // 統一高度
              circle.setAttribute('r', '8');
              circle.setAttribute('fill', '#4caf50');
              circle.setAttribute('stroke', 'none');
              svg.appendChild(circle);
            } else {
              // 紅色標準小叉叉
              const crossGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
              crossGroup.setAttribute('class', 'note-result missed');
              
              const centerX = bbox.x + bbox.width / 2;
              const centerY = svg.getBBox().y + svg.getBBox().height + 30; // 統一高度
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
