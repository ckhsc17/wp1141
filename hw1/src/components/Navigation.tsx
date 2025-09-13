'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavigationViewModel, ScrollViewModel } from '@/viewModels';

interface NavigationProps {
  navigationVM: NavigationViewModel;
  scrollVM: ScrollViewModel;
}

const Navigation: React.FC<NavigationProps> = ({ navigationVM, scrollVM }) => {
  const [mounted, setMounted] = useState(false);
  const [activeSection, setActiveSection] = useState(navigationVM.activeSection);
  const [isMenuOpen, setIsMenuOpen] = useState(navigationVM.isMenuOpen);

  useEffect(() => {
    setMounted(true);
    
    // 監聽 navigationVM 的狀態變更
    const handleStateChange = () => {
      setActiveSection(navigationVM.activeSection);
      setIsMenuOpen(navigationVM.isMenuOpen);
    };

    navigationVM.addListener(handleStateChange);

    return () => {
      navigationVM.removeListener(handleStateChange);
    };
  }, [navigationVM]);

  if (!mounted) return null;

  const navItems = [
    { id: 'about', label: 'About' },
    { id: 'experience', label: 'Experience' },
    { id: 'projects', label: 'Projects' },
    { id: 'milestones', label: 'Milestones' },
    { id: 'traveling', label: 'Traveling' },
    { id: 'connect', label: 'Connect' },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      // 註解掉 theme 相關的 class，只保留暗色設定
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrollVM.isScrolled 
        ? 'bg-background-primary/90 backdrop-blur-md shadow-lg' 
        : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            // 註解掉 theme 相關的 class，只保留暗色設定
            className="text-xl font-bold text-blue-400"
          >
            Bowen Chen
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8">
            {navItems.map((item, index) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => navigationVM.scrollToSection(item.id)}
                // 註解掉 theme 相關的 class，只保留暗色設定
                className={`text-sm font-medium transition-colors duration-200 hover:text-blue-400 ${
                  activeSection === item.id
                    ? 'text-blue-400'
                    : 'text-gray-300'
                }`}
              >
                <span className="text-blue-400 text-xs mr-1">0{index + 1}.</span>
                {item.label}
              </motion.button>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigationVM.toggleMenu()}
            className="md:hidden p-2"
          >
            <div className="w-6 h-6 flex flex-col justify-center space-y-1">
              <motion.span
                animate={{
                  rotate: isMenuOpen ? 45 : 0,
                  y: isMenuOpen ? 8 : 0,
                }}
                className="w-full h-0.5 bg-blue-400 block"
              />
              <motion.span
                animate={{
                  opacity: isMenuOpen ? 0 : 1,
                }}
                className="w-full h-0.5 bg-blue-400 block"
              />
              <motion.span
                animate={{
                  rotate: isMenuOpen ? -45 : 0,
                  y: isMenuOpen ? -8 : 0,
                }}
                className="w-full h-0.5 bg-blue-400 block"
              />
            </div>
          </motion.button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background-primary/95 backdrop-blur-md"
          >
            <div className="px-4 py-4 space-y-4">
              {navItems.map((item, index) => (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => navigationVM.scrollToSection(item.id)}
                  // 註解掉 theme 相關的 class，只保留暗色設定
                  className="block w-full text-left text-gray-300 hover:text-blue-400 transition-colors"
                >
                  <span className="text-blue-400 text-sm mr-2">0{index + 1}.</span>
                  {item.label}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Bar */}
      <motion.div
        className="absolute bottom-0 left-0 h-0.5 bg-blue-400"
        style={{ width: `${scrollVM.getScrollProgress()}%` }}
      />
    </motion.nav>
  );
};

export default Navigation;
