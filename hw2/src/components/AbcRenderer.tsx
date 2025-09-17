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
          .abcjs-cursor {
            stroke: #2196f3;
            stroke-width: 3px;
            fill: none;
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

      // 重置所有音符樣式
      const allNotes = svg.querySelectorAll('.abcjs-note');
      allNotes.forEach((note: Element) => {
        (note as SVGElement).classList.remove('hit', 'missed', 'current');
      });

      // 清除舊的結果標記
      const oldResults = svg.querySelectorAll('.note-result');
      oldResults.forEach(result => result.remove());
      
      // 根據遊戲狀態更新音符顏色和結果
      notes.forEach((note, index) => {
        const noteElement = allNotes[index] as SVGElement;
        if (noteElement) {
          // 只有當前演奏的音符顯示灰色
          if (Math.abs(note.time - currentTime) < 0.3) {
            noteElement.classList.add('current');
          }
          
          // 在音符下方顯示結果
          if (note.hit || note.missed) {
            const bbox = (noteElement as SVGGraphicsElement).getBBox();
            const resultText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            // 優先級：hit > missed（命中優先於錯過）
            const isHit = note.hit; // hit 優先
            resultText.setAttribute('class', `note-result ${isHit ? 'hit' : 'missed'}`);
            resultText.setAttribute('x', (bbox.x + bbox.width / 2).toString());
            resultText.setAttribute('y', (bbox.y + bbox.height + 20).toString());
            resultText.textContent = isHit ? '✓' : '✗';
            svg.appendChild(resultText);
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
