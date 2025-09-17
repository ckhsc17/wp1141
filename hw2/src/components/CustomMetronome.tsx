'use client';

import React, { useEffect, useRef } from 'react';

interface CustomMetronomeProps {
  bpm: number;
  isRunning: boolean;
  soundEnabled?: boolean;
  gameTime?: number; // 遊戲時間（秒）
  countInBeats?: number; // 預備拍數量
}

const CustomMetronome: React.FC<CustomMetronomeProps> = ({ 
  bpm, 
  isRunning, 
  soundEnabled = true,
  gameTime = 0,
  countInBeats = 0
}) => {
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // 初始化音頻上下文
    if (typeof window !== 'undefined' && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const createMetronomeClick = React.useCallback(() => {
    if (!soundEnabled || !audioContextRef.current) return;

    // 創建木頭聲效果：使用多個頻率和噪音
    const audioContext = audioContextRef.current;
    const now = audioContext.currentTime;
    
    // 主要木頭敲擊聲（低頻）
    const oscillator1 = audioContext.createOscillator();
    const gainNode1 = audioContext.createGain();
    
    oscillator1.connect(gainNode1);
    gainNode1.connect(audioContext.destination);
    
    oscillator1.frequency.setValueAtTime(200, now);
    oscillator1.type = 'triangle';
    
    gainNode1.gain.setValueAtTime(0, now);
    gainNode1.gain.linearRampToValueAtTime(0.4, now + 0.005);
    gainNode1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    
    oscillator1.start(now);
    oscillator1.stop(now + 0.15);
    
    // 高頻點擊聲（模擬木頭的清脆聲）
    const oscillator2 = audioContext.createOscillator();
    const gainNode2 = audioContext.createGain();
    
    oscillator2.connect(gainNode2);
    gainNode2.connect(audioContext.destination);
    
    oscillator2.frequency.setValueAtTime(1200, now);
    oscillator2.type = 'square';
    
    gainNode2.gain.setValueAtTime(0, now);
    gainNode2.gain.linearRampToValueAtTime(0.2, now + 0.002);
    gainNode2.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    
    oscillator2.start(now);
    oscillator2.stop(now + 0.05);
    
    // 添加噪音模擬木頭質感
    const bufferSize = audioContext.sampleRate * 0.1;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const output = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.1;
    }
    
    const noiseSource = audioContext.createBufferSource();
    const noiseGain = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    
    noiseSource.buffer = buffer;
    noiseSource.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(audioContext.destination);
    
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(800, now);
    
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(0.1, now + 0.001);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    
    noiseSource.start(now);
    noiseSource.stop(now + 0.03);
  }, [soundEnabled]);

  const lastBeatRef = useRef<number>(-1);

  useEffect(() => {
    if (isRunning) {
      const beatInterval = 60 / bpm; // 每拍的時間間隔（秒）
      
      // 新的邏輯：gameTime 從 0 開始，但節拍器需要提前 countInBeats 拍開始
      // 例如：countInBeats = 4，那麼節拍器在 gameTime = 0 時已經是第 5 拍
      const adjustedTime = gameTime + (countInBeats * beatInterval);
      const currentBeat = Math.floor(adjustedTime / beatInterval);
      
      // 如果到了新的拍子且還沒播放過這一拍
      if (currentBeat > lastBeatRef.current) {
        createMetronomeClick();
        lastBeatRef.current = currentBeat;
      }
    } else if (!isRunning) {
      lastBeatRef.current = -999; // 重置到一個很小的值，確保下次開始時能正確觸發
    }
  }, [gameTime, bpm, isRunning, createMetronomeClick, countInBeats]);

  // 這個組件不需要渲染任何視覺內容
  return null;
};

export default CustomMetronome;
