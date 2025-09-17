'use client';

import React, { useEffect, useRef } from 'react';

interface CustomMetronomeProps {
  bpm: number;
  isRunning: boolean;
  soundEnabled?: boolean;
}

const CustomMetronome: React.FC<CustomMetronomeProps> = ({ 
  bpm, 
  isRunning, 
  soundEnabled = true 
}) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
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

  const createMetronomeClick = () => {
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
  };

  useEffect(() => {
    if (isRunning) {
      const interval = 60000 / bpm; // 轉換為毫秒
      
      intervalRef.current = setInterval(() => {
        createMetronomeClick();
      }, interval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [bpm, isRunning, soundEnabled]);

  // 這個組件不需要渲染任何視覺內容
  return null;
};

export default CustomMetronome;
