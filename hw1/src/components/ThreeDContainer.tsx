'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

// 2D 角色組件 - 簡單的 2D 版本
const Character2D: React.FC<{
  onContentTrigger: (section: string) => void;
}> = ({ onContentTrigger }) => {
  const [position, setPosition] = useState({ x: 50, y: 50 }); // 百分比位置
  const [keysPressed, setKeysPressed] = useState<Set<string>>(new Set());

  // 定義互動區域 - 對應 iframe 中的地毯位置（百分比）
  const interactionZones = [
    { x: 50, y: 60, section: 'about', tolerance: 8, emoji: '👤', label: '關於我' },
    { x: 70, y: 70, section: 'experience', tolerance: 6, emoji: '💼', label: '工作經驗' },
    { x: 30, y: 70, section: 'projects', tolerance: 6, emoji: '🚀', label: '專案作品' },
    { x: 70, y: 40, section: 'skills', tolerance: 6, emoji: '⚡', label: '技能專長' },
    { x: 30, y: 40, section: 'milestones', tolerance: 6, emoji: '🏆', label: '重要里程碑' },
    { x: 50, y: 80, section: 'traveling', tolerance: 6, emoji: '🌍', label: '旅行足跡' },
    { x: 50, y: 30, section: 'connect', tolerance: 6, emoji: '📧', label: '聯絡方式' },
  ];

  // 鍵盤控制
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (['w', 's', 'a', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        setKeysPressed(prev => new Set(prev).add(key));
      }
      
      if (key === 'enter') {
        const nearbyZone = interactionZones.find(zone => {
          const distance = Math.sqrt(
            Math.pow(position.x - zone.x, 2) + Math.pow(position.y - zone.y, 2)
          );
          return distance < zone.tolerance;
        });
        if (nearbyZone) {
          onContentTrigger(nearbyZone.section);
        }
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      setKeysPressed(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [position, interactionZones, onContentTrigger]);

  // 移動邏輯
  useEffect(() => {
    const moveSpeed = 30; // 每秒移動的百分比
    let animationFrame: number;

    const animate = () => {
      setPosition(prevPosition => {
        let newX = prevPosition.x;
        let newY = prevPosition.y;

        if (keysPressed.has('a') || keysPressed.has('arrowleft')) {
          newX = Math.max(5, newX - moveSpeed / 60);
        }
        if (keysPressed.has('d') || keysPressed.has('arrowright')) {
          newX = Math.min(95, newX + moveSpeed / 60);
        }
        if (keysPressed.has('w') || keysPressed.has('arrowup')) {
          newY = Math.max(5, newY - moveSpeed / 60);
        }
        if (keysPressed.has('s') || keysPressed.has('arrowdown')) {
          newY = Math.min(95, newY + moveSpeed / 60);
        }

        return { x: newX, y: newY };
      });

      if (keysPressed.size > 0) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    if (keysPressed.size > 0) {
      animationFrame = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [keysPressed]);

  const nearbyZone = interactionZones.find(zone => {
    const distance = Math.sqrt(
      Math.pow(position.x - zone.x, 2) + Math.pow(position.y - zone.y, 2)
    );
    return distance < zone.tolerance;
  });

  return (
    <>
      {/* 2D 角色 */}
      <div
        className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-75 z-20"
        style={{
          left: `${position.x}%`,
          top: `${position.y}%`,
        }}
      >
        {/* 簡單的 2D 角色圖標 */}
        <div className="w-8 h-8 bg-blue-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
          <span className="text-white text-xs font-bold">👤</span>
        </div>
        
        {/* 當前區域提示 */}
        {nearbyZone && (
          <div className="absolute top-[-40px] left-1/2 transform -translate-x-1/2 bg-purple-600/90 backdrop-blur-sm rounded-lg px-3 py-1 text-white text-xs font-medium border border-purple-400/50 shadow-lg animate-pulse whitespace-nowrap">
            {nearbyZone.label} - Press Enter
          </div>
        )}
      </div>

      {/* 2D 圖標 */}
      {interactionZones.map((zone, index) => (
        <div
          key={index}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
          style={{
            left: `${zone.x}%`,
            top: `${zone.y}%`,
          }}
        >
          <div className="text-4xl md:text-6xl select-none pointer-events-none opacity-80 hover:opacity-100 transition-opacity">
            {zone.emoji}
          </div>
        </div>
      ))}
    </>
  );
};

// 主要3D容器組件 - 現在主要是 2D 元素
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
      
      {/* 2D 角色和圖標覆蓋層 */}
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        <Character2D onContentTrigger={handleContentDisplay} />
      </div>

      {/* 控制說明 */}
      <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 text-white text-sm z-30">
        <div className="space-y-1">
          <div>🎮 WASD 或方向鍵：移動</div>
          <div>⚡ Enter：互動</div>
        </div>
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
              className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl max-w-4xl max-h-[80vh] overflow-y-auto m-4 pointer-events-auto"
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
