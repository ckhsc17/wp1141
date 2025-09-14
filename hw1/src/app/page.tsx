'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import AboutSection from '@/components/AboutSection';
import ExperienceSection from '@/components/ExperienceSection';
import ProjectsSection from '@/components/ProjectsSection';
import MilestonesSection from '@/components/MilestonesSection';
import TravelingSection from '@/components/TravelingSection';
import ConnectSection from '@/components/ConnectSection';
import ThreeDToggle from '@/components/ThreeDToggle';
import ThreeDContainer from '@/components/ThreeDContainer';
// import ThemeToggle from '@/components/ThemeToggle'; // 註解掉 theme toggle
import { PortfolioViewModel, NavigationViewModel, ScrollViewModel } from '@/viewModels';
import { useThreeD } from '@/contexts/ThreeDContext';

export default function Home() {
  const [portfolioVM] = useState(() => PortfolioViewModel.getInstance());
  const [navigationVM] = useState(() => new NavigationViewModel());
  const [scrollVM] = useState(() => new ScrollViewModel());
  const { is3DMode } = useThreeD();

  useEffect(() => {
    const handleScroll = () => {
      scrollVM.updateScroll(window.scrollY);
      
      // Update active section based on scroll position
      const sections = ['about', 'experience', 'projects', 'milestones', 'traveling', 'connect'];
      const scrollPosition = window.scrollY + 200;
      
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const offsetTop = element.offsetTop;
          const offsetBottom = offsetTop + element.offsetHeight;
          
          if (scrollPosition >= offsetTop && scrollPosition < offsetBottom) {
            navigationVM.setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [navigationVM, scrollVM]);

  return (
    // 註解掉 dark mode classes，只保留暗色設定
    <div className="min-h-screen bg-gradient-to-br from-background-primary via-background-primary to-background-secondary text-white transition-colors duration-300">

      {/* Coming Soon Toggle Buttons - 右上角，往下移避開 navigation */}
      <div className="fixed top-24 right-4 z-50 flex flex-col space-y-4">
        {/* Theme Toggle - 採用原本 3D toggle 樣式 */}
        <div className="relative group">
          <motion.button
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-md bg-gray-800/80 text-gray-300 hover:bg-gray-700/80 border border-gray-600/30 hover:border-blue-400/50 opacity-70"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {}} // 空函數，可以點但沒反應
          >
            <motion.div
              transition={{ duration: 0.5 }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </motion.div>
          </motion.button>
          {/* Hover 提示 */}
          <div className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <div className="bg-gray-800/90 backdrop-blur-sm text-white text-sm font-medium px-3 py-2 rounded-lg border border-gray-600/30 whitespace-nowrap">
              Theme Toggle - Coming Soon
              <div className="absolute left-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-l-gray-800/90"></div>
            </div>
          </div>
        </div>
        
        {/* 3D Toggle - 使用原本的立方體圖標 */}
        <div className="relative group">
          <motion.button
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-md bg-gray-800/80 text-gray-300 hover:bg-gray-700/80 border border-gray-600/30 hover:border-purple-400/50 opacity-70"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {}} // 空函數，可以點但沒反應
          >
            <motion.div
              transition={{ duration: 0.5 }}
            >
              {/* 立方體圖標 - 模仿 FaCube */}
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 512 512">
                <path d="M239.1 6.3l-208 78c-18.7 7-31.1 25-31.1 45v225.1c0 18.2 10.3 34.8 26.5 42.9l208 104c13.5 6.8 29.4 6.8 42.9 0l208-104c16.3-8.1 26.5-24.8 26.5-42.9V129.3c0-20-12.4-37.9-31.1-45l-208-78C262.7 2.2 249.3 2.2 239.1 6.3zM256 68.4l192 72v1.1l-192 78-192-78v-1.1l192-72zm32 356V275.5l160-65v133.9l-160 80z"/>
              </svg>
            </motion.div>
          </motion.button>
          {/* Hover 提示 */}
          <div className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <div className="bg-gray-800/90 backdrop-blur-sm text-white text-sm font-medium px-3 py-2 rounded-lg border border-gray-600/30 whitespace-nowrap">
              3D Mode - Coming Soon
              <div className="absolute left-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-l-gray-800/90"></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 3D Toggle Button - 隱藏但保留功能 */}
      {/* <ThreeDToggle /> */}
      
      {/* 3D Mode */}
      <AnimatePresence>
        {is3DMode && <ThreeDContainer />}
      </AnimatePresence>
      
      {/* Regular 2D Mode */}
      <div className={is3DMode ? 'hidden' : 'block'}>
        <Navigation navigationVM={navigationVM} scrollVM={scrollVM} />
        {/* 註解掉 ThemeToggle */}
        {/* <ThemeToggle /> */}
        
        <main>
          <AboutSection portfolioVM={portfolioVM} />
          <ExperienceSection portfolioVM={portfolioVM} />
          <ProjectsSection portfolioVM={portfolioVM} />
          <MilestonesSection portfolioVM={portfolioVM} />
          <TravelingSection />
          <ConnectSection />
        </main>
      </div>
    </div>
  );
}
