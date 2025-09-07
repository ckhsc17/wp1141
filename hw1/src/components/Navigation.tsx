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

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const navItems = [
    { id: 'about', label: 'About' },
    { id: 'skills', label: 'Skills' },
    { id: 'experience', label: 'Experience' },
    { id: 'projects', label: 'Projects' },
    { id: 'milestones', label: 'Milestones' },
    { id: 'connect', label: 'Connect' },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrollVM.isScrolled 
          ? 'bg-background-primary/90 dark:bg-white/90 backdrop-blur-md shadow-lg' 
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="text-xl font-bold text-primary-400 dark:text-blue-600"
          >
            BC
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
                className={`text-sm font-medium transition-colors duration-200 hover:text-primary-400 ${
                  navigationVM.activeSection === item.id
                    ? 'text-primary-400'
                    : 'text-gray-300'
                }`}
              >
                <span className="text-primary-400 text-xs mr-1">0{index + 1}.</span>
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
                  rotate: navigationVM.isMenuOpen ? 45 : 0,
                  y: navigationVM.isMenuOpen ? 8 : 0,
                }}
                className="w-full h-0.5 bg-primary-400 block"
              />
              <motion.span
                animate={{
                  opacity: navigationVM.isMenuOpen ? 0 : 1,
                }}
                className="w-full h-0.5 bg-primary-400 block"
              />
              <motion.span
                animate={{
                  rotate: navigationVM.isMenuOpen ? -45 : 0,
                  y: navigationVM.isMenuOpen ? -8 : 0,
                }}
                className="w-full h-0.5 bg-primary-400 block"
              />
            </div>
          </motion.button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {navigationVM.isMenuOpen && (
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
                  className="block w-full text-left text-gray-300 hover:text-primary-400 transition-colors"
                >
                  <span className="text-primary-400 text-sm mr-2">0{index + 1}.</span>
                  {item.label}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Bar */}
      <motion.div
        className="absolute bottom-0 left-0 h-0.5 bg-primary-400"
        style={{ width: `${scrollVM.getScrollProgress()}%` }}
      />
    </motion.nav>
  );
};

export default Navigation;
