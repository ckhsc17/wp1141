'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Box, Sphere, Html, OrbitControls } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { useThreeD } from '../contexts/ThreeDContext';
import { personalInfo, experiences, projects, skills, milestones, socialLinks } from '../data/mockData';

// 內容顯示組件
const ContentDisplay: React.FC<{
  section: string;
  onClose: () => void;
}> = ({ section, onClose }) => {
  const getSectionContent = () => {
    switch (section) {
      case 'about':
        return (
          <div className="p-8">
            <h2 className="text-3xl font-bold text-white mb-6">關於我</h2>
            <div className="space-y-4 text-white/90">
              <p className="text-xl">{personalInfo.title}</p>
              <p className="text-lg">{personalInfo.description}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">聯絡資訊</h3>
                  <p>📧 chen.bowen@example.com</p>
                  <p>📱 +886 912-345-678</p>
                  <p>📍 {personalInfo.location}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">個人特質</h3>
                  <p>🎓 持續學習新技術</p>
                  <p>🤝 良好的團隊合作</p>
                  <p>💡 創新思維與解決問題</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'experience':
        return (
          <div className="p-8">
            <h2 className="text-3xl font-bold text-white mb-6">工作經驗</h2>
            <div className="space-y-6">
              {experiences.map((exp, index) => (
                <div key={index} className="bg-white/5 rounded-lg p-6 border border-white/10">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-white">{exp.position}</h3>
                      <p className="text-blue-300">{exp.company}</p>
                    </div>
                    <span className="text-white/70 text-sm">{exp.period}</span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-white/80">{exp.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {exp.technologies.map((tech, i) => (
                      <span key={i} className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-sm">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'projects':
        return (
          <div className="p-8">
            <h2 className="text-3xl font-bold text-white mb-6">專案作品</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.map((project, index) => (
                <div key={index} className="bg-white/5 rounded-lg p-6 border border-white/10">
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold text-white mb-2">{project.title}</h3>
                    <p className="text-white/80">{project.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.technologies.map((tech, i) => (
                      <span key={i} className="bg-green-500/20 text-green-300 px-2 py-1 rounded text-sm">
                        {tech}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    {project.githubUrl && (
                      <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" 
                         className="text-blue-400 hover:text-blue-300 text-sm">
                        📂 GitHub
                      </a>
                    )}
                    {project.liveUrl && (
                      <a href={project.liveUrl} target="_blank" rel="noopener noreferrer"
                         className="text-green-400 hover:text-green-300 text-sm">
                        🚀 Live Demo
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'skills':
        return (
          <div className="p-8">
            <h2 className="text-3xl font-bold text-white mb-6">技能專長</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {skills.map((skill, index) => (
                <div key={index} className="bg-white/5 rounded-lg p-4 border border-white/10 text-center">
                  <div className="text-2xl mb-2">⚡</div>
                  <h3 className="text-white font-medium mb-1">{skill.name}</h3>
                  <div className="w-full bg-white/20 rounded-full h-2 mb-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full"
                      style={{ width: `${skill.level}%` }}
                    ></div>
                  </div>
                  <p className="text-white/70 text-sm">{skill.level}%</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'milestones':
        return (
          <div className="p-8">
            <h2 className="text-3xl font-bold text-white mb-6">重要里程碑</h2>
            <div className="space-y-4">
              {milestones.map((milestone, index) => {
                // 將圖標字符串轉換為 emoji
                const getIcon = (iconName: string) => {
                  const iconMap: Record<string, string> = {
                    'FaChessBoard': '♟️',
                    'FaBicycle': '🚴',
                    'FaRoute': '🗺️',
                    'FaGraduationCap': '🎓',
                    'FaMicrophone': '🎤',
                    'FaGlobeAsia': '🌏',
                    'FaMountain': '⛰️',
                    'FaLaptopCode': '💻',
                    'FaBullhorn': '📢',
                    'FaGuitar': '🎸',
                    'FaUsers': '👥',
                    'FaRocket': '🚀'
                  };
                  return iconMap[iconName] || '⭐';
                };

                return (
                  <div key={index} className="flex items-start gap-4 bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="text-2xl">{getIcon(milestone.icon || '')}</div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold text-white">{milestone.title}</h3>
                        <span className="text-white/70 text-sm">{milestone.date}</span>
                      </div>
                      <p className="text-white/80">{milestone.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'traveling':
        return (
          <div className="p-8">
            <h2 className="text-3xl font-bold text-white mb-6">旅行足跡</h2>
            <div className="text-center space-y-6">
              <p className="text-white/80 text-lg">探索世界，豐富人生體驗</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {['🇯🇵 日本', '🇰🇷 韓國', '🇺🇸 美國', '🇨🇦 加拿大', '🇬🇧 英國', '🇫🇷 法國'].map((country, index) => (
                  <div key={index} className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <p className="text-white text-lg">{country}</p>
                  </div>
                ))}
              </div>
              <p className="text-white/70">持續探索中...</p>
            </div>
          </div>
        );

      case 'connect':
        return (
          <div className="p-8">
            <h2 className="text-3xl font-bold text-white mb-6">聯絡方式</h2>
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-white/80 text-lg mb-6">歡迎與我聯絡交流</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {socialLinks.map((link, index) => {
                  // 將圖標字符串轉換為 emoji
                  const getIcon = (iconName: string) => {
                    const iconMap: Record<string, string> = {
                      'github': '⚡',
                      'linkedin': '💼',
                      'instagram': '📷',
                      'facebook': '📘'
                    };
                    return iconMap[iconName] || '🔗';
                  };

                  return (
                    <a key={index} href={link.url} target="_blank" rel="noopener noreferrer"
                       className="bg-white/5 rounded-lg p-6 border border-white/10 hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="text-3xl">{getIcon(link.icon)}</div>
                        <div>
                          <h3 className="text-white font-semibold">{link.platform}</h3>
                          <p className="text-white/70">@{link.platform.toLowerCase()}</p>
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
              <div className="text-center pt-4">
                <p className="text-white/70">📧 chen.bowen@example.com</p>
                <p className="text-white/70">📱 +886 912-345-678</p>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="p-8 text-center">
            <h2 className="text-2xl font-bold text-white">未知區域</h2>
            <p className="text-white/70 mt-2">這個區域還在開發中...</p>
          </div>
        );
    }
  };

  return (
    <div className="relative">
      {/* 關閉按鈕 */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/70 hover:text-white z-10 bg-white/10 rounded-full p-2"
      >
        ✕
      </button>
      
      {/* 內容 */}
            <div className="max-h-[70vh] overflow-y-auto">
        {getSectionContent()}
      </div>
    </div>
  );
};

// 3D 人物角色
const Character: React.FC<{
  position: [number, number, number];
  onSectionTrigger: (section: string | null) => void;
  onContentTrigger: (section: string) => void;
  onPositionChange?: (newPosition: [number, number, number]) => void;
}> = ({ position, onSectionTrigger, onContentTrigger, onPositionChange }) => {
  const characterRef = useRef<THREE.Group>(null);
  const [currentPosition, setCurrentPosition] = useState<[number, number, number]>(position);
  const [velocity, setVelocity] = useState<[number, number, number]>([0, 0, 0]); // 添加速度狀態
  const [isMoving, setIsMoving] = useState(false);
  const [keysPressed, setKeysPressed] = useState<Set<string>>(new Set()); // 追蹤按下的按鍵

  // 定義音樂會場地中紫色地毯區域的座標和對應的 section
  const floorSections = [
    { position: [0, 0, 0], section: 'about', color: '#4a90e2', tolerance: 1.2 },          // 中央舞台區域
    { position: [2.5, 0, 2.5], section: 'experience', color: '#f39c12', tolerance: 1.0 }, // 右前方地毯
    { position: [-2.5, 0, 2.5], section: 'projects', color: '#e74c3c', tolerance: 1.0 },  // 左前方地毯
    { position: [2.5, 0, -2.5], section: 'skills', color: '#2ecc71', tolerance: 1.0 },    // 右後方地毯
    { position: [-2.5, 0, -2.5], section: 'milestones', color: '#9b59b6', tolerance: 1.0 }, // 左後方地毯
    { position: [0, 0, 3.5], section: 'traveling', color: '#1abc9c', tolerance: 1.0 },    // 前方中央地毯
    { position: [0, 0, -3.5], section: 'connect', color: '#34495e', tolerance: 1.0 },     // 後方中央地毯
  ];

  // 鍵盤控制 - 改為連續移動
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (['w', 's', 'a', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        setKeysPressed(prev => new Set(prev).add(key));
        setIsMoving(true);
      }
      
      if (key === 'enter') {
        // 處理 Enter 鍵 - 顯示當前區域內容
        const nearbySection = floorSections.find(section => {
          const distance = Math.sqrt(
            Math.pow(currentPosition[0] - section.position[0], 2) +
            Math.pow(currentPosition[2] - section.position[2], 2)
          );
          return distance < section.tolerance;
        });
        if (nearbySection) {
          console.log(`Displaying content for section: ${nearbySection.section}`);
          onContentTrigger(nearbySection.section);
        }
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      setKeysPressed(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        
        // 檢查新的 set 是否還有移動鍵
        const hasMovementKeys = Array.from(newSet).some(k => 
          ['w', 's', 'a', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)
        );
        
        if (!hasMovementKeys) {
          setIsMoving(false);
          setVelocity([0, 0, 0]);
        }
        
        return newSet;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [currentPosition, keysPressed, floorSections, onContentTrigger]);

  // 角色移動動畫 - 連續平滑移動
  useFrame((state, delta) => {
    if (characterRef.current) {
      // 計算當前幀的移動速度
      const moveSpeed = 3; // 移動速度
      let newVelocity: [number, number, number] = [0, 0, 0];
      
      // 根據按下的按鍵計算速度
      if (keysPressed.has('w') || keysPressed.has('arrowup')) {
        newVelocity[2] -= moveSpeed;
      }
      if (keysPressed.has('s') || keysPressed.has('arrowdown')) {
        newVelocity[2] += moveSpeed;
      }
      if (keysPressed.has('a') || keysPressed.has('arrowleft')) {
        newVelocity[0] -= moveSpeed;
      }
      if (keysPressed.has('d') || keysPressed.has('arrowright')) {
        newVelocity[0] += moveSpeed;
      }
      
      // 對角線移動時速度正規化
      if (newVelocity[0] !== 0 && newVelocity[2] !== 0) {
        const normalizedSpeed = moveSpeed / Math.sqrt(2);
        newVelocity[0] = newVelocity[0] > 0 ? normalizedSpeed : -normalizedSpeed;
        newVelocity[2] = newVelocity[2] > 0 ? normalizedSpeed : -normalizedSpeed;
      }
      
      setVelocity(newVelocity);
      
      // 應用移動
      if (newVelocity[0] !== 0 || newVelocity[2] !== 0) {
        const newPosition: [number, number, number] = [
          Math.max(-6, Math.min(6, currentPosition[0] + newVelocity[0] * delta)),
          currentPosition[1],
          Math.max(-6, Math.min(6, currentPosition[2] + newVelocity[2] * delta))
        ];
        
        setCurrentPosition(newPosition);
        characterRef.current.position.set(newPosition[0], newPosition[1], newPosition[2]);
        
        // 通知父組件位置變化
        if (onPositionChange) {
          onPositionChange(newPosition);
        }
        
        // 檢查是否到達特定位置
        const nearbySection = floorSections.find(section => {
          const distance = Math.sqrt(
            Math.pow(newPosition[0] - section.position[0], 2) +
            Math.pow(newPosition[2] - section.position[2], 2)
          );
          return distance < section.tolerance;
        });
        
        onSectionTrigger(nearbySection ? nearbySection.section : null);
      }
    }
  });

  return (
    <group ref={characterRef} position={currentPosition}>
      {/* 簡單的人物模型 - 調整到地面高度 */}
      <group>
        {/* 身體 - 向下移動讓腳踩在地面 */}
        <Box position={[0, 0.6, 0]} args={[0.4, 0.8, 0.3]}>
          <meshStandardMaterial color="#4a90e2" />
        </Box>
        
        {/* 頭部 - 向下移動 */}
        <Sphere position={[0, 1.2, 0]} args={[0.25]}>
          <meshStandardMaterial color="#ffdbac" />
        </Sphere>
        
        {/* 腿部 - 腳踩在地面 (y=0) */}
        <Box position={[-0.1, 0.0, 0]} args={[0.15, 0.4, 0.15]}>
          <meshStandardMaterial color="#2c3e50" />
        </Box>
        <Box position={[0.1, 0.0, 0]} args={[0.15, 0.4, 0.15]}>
          <meshStandardMaterial color="#2c3e50" />
        </Box>
        
        {/* 手臂 - 向下移動 */}
        <Box position={[-0.3, 0.8, 0]} args={[0.12, 0.5, 0.12]}>
          <meshStandardMaterial color="#ffdbac" />
        </Box>
        <Box position={[0.3, 0.8, 0]} args={[0.12, 0.5, 0.12]}>
          <meshStandardMaterial color="#ffdbac" />
        </Box>
      </group>
      
      {/* 腳下指示圈 - 在地面上 */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.4, 0.5, 16]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
      </mesh>

      {/* 當前區域指示器 */}
      {(() => {
        const nearbySection = floorSections.find(section => {
          const distance = Math.sqrt(
            Math.pow(currentPosition[0] - section.position[0], 2) +
            Math.pow(currentPosition[2] - section.position[2], 2)
          );
          return distance < section.tolerance;
        });

        return nearbySection ? (
          <Html position={[0, 1.5, 0]} center>
            <div className="bg-purple-600/90 backdrop-blur-sm rounded-lg px-4 py-2 text-white text-sm font-medium border border-purple-400/50 shadow-lg animate-pulse">
              {nearbySection.section} - Press Enter
            </div>
          </Html>
        ) : null;
      })()}
    </group>
  );
};

// 3D圖標組件 - 直接使用 emoji 作為圖標，固定位置
const InteractiveIcons: React.FC = () => {
  // 🎯 在這裡調整圖標座標 - 對應到 iframe 背景的地毯位置
  const iconSections = [
    { position: [100, 0.15, 10], section: 'about', color: '#4a90e2', emoji: '👤', label: '關於我' },
    { position: [2.5, 0.15, 2.5], section: 'experience', color: '#f39c12', emoji: '💼', label: '工作經驗' },
    { position: [-2.5, 0.15, 2.5], section: 'projects', color: '#e74c3c', emoji: '🚀', label: '專案作品' },
    { position: [2.5, 0.15, -2.5], section: 'skills', color: '#2ecc71', emoji: '⚡', label: '技能專長' },
    { position: [-2.5, 0.15, -2.5], section: 'milestones', color: '#9b59b6', emoji: '🏆', label: '重要里程碑' },
    { position: [0, 0.15, 3.5], section: 'traveling', color: '#1abc9c', emoji: '🌍', label: '旅行足跡' },
    { position: [0, 0.15, -3.5], section: 'connect', color: '#34495e', emoji: '📧', label: '聯絡方式' },
  ];

  return (
    <>
      {iconSections.map((icon, index) => (
        <group 
          key={index} 
          position={icon.position as [number, number, number]}
        >
          {/* 直接顯示 emoji 圖標 - 固定位置 */}
          <Html position={[0, 0, 0]} center distanceFactor={8}>
            <div className="text-6xl select-none pointer-events-none transform -translate-y-1/2">
              {icon.emoji}
            </div>
          </Html>
          
          {/* 柔和的光暈效果 */}
          <pointLight
            position={[0, 0.3, 0]}
            color={icon.color}
            intensity={0.15}
            distance={2}
            decay={2}
          />
        </group>
      ))}
    </>
  );
};

// 主要3D場景
const ThreeDScene: React.FC<{ 
  currentSection: string;
  onSectionChange: (section: string | null) => void;
  onContentDisplay: (section: string) => void;
}> = ({ currentSection, onSectionChange, onContentDisplay }) => {
  const [characterPosition, setCharacterPosition] = useState<[number, number, number]>([0, 0, 0]);

  const handleSectionTrigger = useCallback((section: string | null) => {
    onSectionChange(section);
  }, [onSectionChange]);

  const handleContentTrigger = useCallback((section: string) => {
    onContentDisplay(section);
  }, [onContentDisplay]);

  const handleCharacterMove = useCallback((newPosition: [number, number, number]) => {
    setCharacterPosition(newPosition);
  }, []);

  return (
    <>
      {/* 柔和的環境光照 */}
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 10, 5]} intensity={0.5} color="#ffffff" />
      
      {/* 舞台聚光燈效果 */}
      <spotLight
        position={[0, 8, 0]}
        angle={Math.PI / 6}
        penumbra={0.3}
        intensity={1}
        color="#ffffff"
        target-position={[0, 0, 0]}
      />
      
      {/* 3D 人物角色 */}
      <Character 
        position={[0, 0, 0]} 
        onSectionTrigger={handleSectionTrigger}
        onContentTrigger={handleContentTrigger}
        onPositionChange={handleCharacterMove}
      />
      
      {/* 簡潔的 3D 互動圖標 */}
      <InteractiveIcons />
      
      {/* 自由視角控制 - 可以旋轉和縮放來觀察角色移動 */}
      <OrbitControls 
        enableZoom={true}
        enablePan={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={20}
        maxPolarAngle={Math.PI / 2}
      />
    </>
  );
};

// 主要3D容器組件
const ThreeDContainer: React.FC = () => {
  const { currentSection, setCurrentSection } = useThreeD();
  const [showContent, setShowContent] = useState(false);
  const [contentSection, setContentSection] = useState<string>('');

  const handleContentDisplay = (section: string) => {
    setContentSection(section);
    setShowContent(true);
  };

  const handleContentClose = () => {
    setShowContent(false);
    setContentSection('');
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-black">
      {/* Sketchfab 音樂會場地背景 */}
      <div className="absolute inset-0 w-full h-full">
        <iframe 
          title="MUSIC CONCERT FESTIVAL DJ SCENE INSTRUMENT 🎶🎸" 
          className="w-full h-full"
          frameBorder="0" 
          allowFullScreen 
          allow="autoplay; fullscreen; xr-spatial-tracking" 
          src="https://sketchfab.com/models/a889e86112834c41950d85a6d629fe77/embed?ui_theme=dark&autostart=1&camera=0"
        />
      </div>
      
      {/* 3D 人物和交互場景 - 透明覆蓋層 */}
      <div className="absolute inset-0 w-full h-full">
        <Canvas
          camera={{ 
            position: [0, 3, 8], 
            fov: 60,
            near: 0.1,
            far: 1000
          }}
          gl={{ 
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
          }}
        >
          <ThreeDScene 
            currentSection={currentSection} 
            onSectionChange={(section) => {
              if (section) {
                setCurrentSection(section);
              }
            }}
            onContentDisplay={handleContentDisplay}
          />
        </Canvas>
      </div>

      {/* 內容顯示彈窗 */}
      <AnimatePresence>
        {showContent && (
          <motion.div
            initial={{ opacity: 0.5, scale: 0.8 }}
            animate={{ opacity: 0.5, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={handleContentClose}
          >
            <motion.div
              initial={{ y: 50, opacity: 0.5 }}
              animate={{ y: 0, opacity: 0.5 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl max-w-4xl max-h-[80vh] overflow-y-auto m-4"
              onClick={(e) => e.stopPropagation()}
            >
              <ContentDisplay section={contentSection} onClose={handleContentClose} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThreeDContainer;
