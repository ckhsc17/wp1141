'use client';

import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';

interface Note {
  id: string;
  time: number;
  duration: number;
  hit?: boolean;
  missed?: boolean;
  wrong?: boolean;
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
          paddingtop: 10,
          paddingbottom: 50, // 增加底部空間給結果標記
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
      console.log('Current notes state:', notes.map((note, i) => ({
        index: i,
        time: note.time,
        hit: note.hit,
        missed: note.missed,
        wrong: note.wrong
      })));

      // 重置所有音符樣式
      const allNotes = svg.querySelectorAll('.abcjs-note');
      console.log(`Found ${allNotes.length} notes in SVG, expected ${notes.length} notes`);
      
      // 也嘗試查找其他可能的音符選擇器
      const alternativeNotes = svg.querySelectorAll('[data-name*="note"], .abcjs-note-head, .abcjs-chord');
      console.log(`Alternative note elements found: ${alternativeNotes.length}`);
      
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
        // 為每個有結果的音符創建標記，直接根據其在 notes 數組中的位置
        if (note.hit || note.missed || note.wrong) {
          // 嘗試找到對應的音符元素
          let noteElement = null;
          let centerX = 0;
          let centerY = 0;
          
          if (index < allNotes.length) {
            // 如果有對應的 SVG 元素，使用其位置
            noteElement = allNotes[index] as SVGElement;
            try {
              const bbox = (noteElement as SVGGraphicsElement).getBBox();
              centerX = bbox.x + bbox.width / 2;
              centerY = bbox.y + bbox.height + 15; // 放在音符正下方 15px
              
              console.log(`Note ${index} using SVG position:`, { centerX, centerY, bbox });
            } catch (error) {
              console.error(`Error getting bbox for note ${index}:`, error);
              noteElement = null; // 標記為失敗，使用備用方案
            }
          }
          
          // 如果沒有對應的 SVG 元素或 bbox 計算失敗，使用備用定位
          if (!noteElement || centerX === 0) {
            const svgBBox = svg.getBBox();
            const svgWidth = svgBBox.width;
            const totalDuration = notes.length > 0 ? notes[notes.length - 1].time : 1;
            const relativePosition = note.time / totalDuration;
            centerX = svgBBox.x + (svgWidth * relativePosition);
            centerY = svgBBox.y + svgBBox.height + 25;
            
            console.log(`Note ${index} using fallback position:`, { centerX, centerY, relativePosition });
          }
          
          // 創建結果標記
          try {
            if (note.hit) {
              // 綠色圓點 - 調小一點
              const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
              circle.setAttribute('class', 'note-result hit');
              circle.setAttribute('cx', centerX.toString());
              circle.setAttribute('cy', centerY.toString());
              circle.setAttribute('r', '4'); // 從 6 改為 4
              circle.setAttribute('fill', '#4caf50');
              circle.setAttribute('stroke', 'none');
              svg.appendChild(circle);
              
              console.log(`✅ Created hit marker for note ${index} at (${centerX}, ${centerY})`);
              
            } else if (note.missed) {
              // 紅色叉叉 - 調小一點
              const crossGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
              crossGroup.setAttribute('class', 'note-result missed');
              
              const size = 3.5; // 從 5 改為 3.5
              
              const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
              line1.setAttribute('x1', (centerX - size).toString());
              line1.setAttribute('y1', (centerY - size).toString());
              line1.setAttribute('x2', (centerX + size).toString());
              line1.setAttribute('y2', (centerY + size).toString());
              line1.setAttribute('stroke', '#f44336');
              line1.setAttribute('stroke-width', '2'); // 從 2.5 改為 2
              line1.setAttribute('stroke-linecap', 'round');
              
              const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
              line2.setAttribute('x1', (centerX + size).toString());
              line2.setAttribute('y1', (centerY - size).toString());
              line2.setAttribute('x2', (centerX - size).toString());
              line2.setAttribute('y2', (centerY + size).toString());
              line2.setAttribute('stroke', '#f44336');
              line2.setAttribute('stroke-width', '2'); // 從 2.5 改為 2
              line2.setAttribute('stroke-linecap', 'round');
              
              crossGroup.appendChild(line1);
              crossGroup.appendChild(line2);
              svg.appendChild(crossGroup);
              
              console.log(`❌ Created missed marker for note ${index} at (${centerX}, ${centerY})`);
              
            } else if (note.wrong) {
              // 橙色叉叉 - 調小一點
              const crossGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
              crossGroup.setAttribute('class', 'note-result wrong');
              
              const size = 3.5; // 從 5 改為 3.5
              
              const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
              line1.setAttribute('x1', (centerX - size).toString());
              line1.setAttribute('y1', (centerY - size).toString());
              line1.setAttribute('x2', (centerX + size).toString());
              line1.setAttribute('y2', (centerY + size).toString());
              line1.setAttribute('stroke', '#ff9800');
              line1.setAttribute('stroke-width', '2'); // 從 2.5 改為 2
              line1.setAttribute('stroke-linecap', 'round');
              
              const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
              line2.setAttribute('x1', (centerX + size).toString());
              line2.setAttribute('y1', (centerY - size).toString());
              line2.setAttribute('x2', (centerX - size).toString());
              line2.setAttribute('y2', (centerY + size).toString());
              line2.setAttribute('stroke', '#ff9800');
              line2.setAttribute('stroke-width', '2'); // 從 2.5 改為 2
              line2.setAttribute('stroke-linecap', 'round');
              
              crossGroup.appendChild(line1);
              crossGroup.appendChild(line2);
              svg.appendChild(crossGroup);
              
              console.log(`⚠️ Created wrong marker for note ${index} at (${centerX}, ${centerY})`);
            }
          } catch (error) {
            console.error(`Error creating result marker for note ${index}:`, error);
          }
        }
        
        // 處理當前音符的灰色高亮
        if (index < allNotes.length && index === closestNoteIndex) {
          const noteElement = allNotes[index] as SVGElement;
          noteElement.classList.add('current');
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
        minHeight: 250, // 增加高度以容納音符下方的標記
        border: '1px solid #e0e0e0',
        borderRadius: 1,
        p: 2,
        backgroundColor: '#fafafa',
        overflow: 'auto',
        '& svg': {
          maxWidth: '100%',
          height: 'auto',
          minHeight: '200px', // 確保 SVG 有足夠高度
        }
      }}
    />
  );
};

export default AbcRenderer;
