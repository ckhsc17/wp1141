'use client';

import React, { useEffect, useRef } from 'react';

interface CustomMetronomeProps {
  bpm: number;
  isRunning: boolean;
  soundEnabled?: boolean;
  gameTime?: number; // 遊戲時間（秒）
}

const CustomMetronome: React.FC<CustomMetronomeProps> = ({ 
  bpm, 
  isRunning, 
  soundEnabled = true,
  gameTime = 0
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

    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);

    oscillator.frequency.setValueAtTime(800, audioContextRef.current.currentTime);
    oscillator.type = 'square';

    gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContextRef.current.currentTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0.001, audioContextRef.current.currentTime + 0.1);

    oscillator.start(audioContextRef.current.currentTime);
    oscillator.stop(audioContextRef.current.currentTime + 0.1);
  }, [soundEnabled]);

  const lastBeatRef = useRef<number>(-1);

  useEffect(() => {
    if (isRunning && gameTime > 0) {
      const beatInterval = 60 / bpm; // 每拍的時間間隔（秒）
      const currentBeat = Math.floor(gameTime / beatInterval);
      
      // 如果到了新的拍子且還沒播放過這一拍
      if (currentBeat > lastBeatRef.current) {
        createMetronomeClick();
        lastBeatRef.current = currentBeat;
      }
    } else if (!isRunning) {
      lastBeatRef.current = -1; // 重置
    }
  }, [gameTime, bpm, isRunning, createMetronomeClick]);

  // 這個組件不需要渲染任何視覺內容
  return null;
};

export default CustomMetronome;
