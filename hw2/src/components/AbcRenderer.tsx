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
