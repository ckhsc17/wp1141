'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { PortfolioViewModel } from '@/viewModels';
import { SocialIcon } from './SocialIcon';

interface AboutSectionProps {
  portfolioVM: PortfolioViewModel;
}

const AboutSection: React.FC<AboutSectionProps> = ({ portfolioVM }) => {
  const { personalInfo, socialLinks } = portfolioVM;
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 載入 description 內容
    portfolioVM.loadDescription().then(content => {
      setDescription(content);
      setIsLoading(false);
    });
  }, [portfolioVM]);

  return (
    <section id="about" className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-20">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Main content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-primary-400 text-lg font-mono"
            >
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl sm:text-5xl lg:text-6xl font-bold text-gray-100"
            >
              {personalInfo.name}
            </motion.h1>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-2xl sm:text-4xl lg:text-5xl font-bold text-gray-400"
            >
              {personalInfo.title}
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-base text-gray-400 max-w-lg leading-relaxed min-h-[120px] flex flex-col justify-start"
            >
              {isLoading ? (
                // 載入中的骨架屏，避免跑版
                <div className="space-y-4">
                  <div className="h-4 bg-gray-600/30 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-600/30 rounded animate-pulse w-4/5"></div>
                  <div className="h-4 bg-gray-600/30 rounded animate-pulse w-3/4"></div>
                  <div className="h-4 bg-gray-600/30 rounded animate-pulse w-4/5"></div>
                </div>
              ) : (
                description.split('\n\n').map((paragraph, index) => (
                  <span key={index} className="block mb-4">
                    {paragraph}
                  </span>
                ))
              )}
            </motion.div>

            {/* Skills preview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-semibold text-gray-300">Core Technologies</h3>
              <div className="flex flex-wrap gap-3">
                {portfolioVM.getSkillsByCategory('frontend').slice(0, 8).map((skill, index) => (
                  <motion.span
                    key={skill.name}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    // 註解掉 theme 相關的 class，只保留暗色設定
                    className="px-3 py-1 bg-blue-400/10 text-blue-400 rounded-full text-sm font-mono border border-blue-400/20"
                  >
                    {skill.name}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* Right side - Photo */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:flex flex-col justify-center items-center hidden"
          >
            <div className="relative">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-80 h-80 relative overflow-hidden rounded-lg"
              >
                <div className="relative w-full h-full bg-gradient-to-br from-primary-400/20 to-primary-600/20 border border-primary-400/30 rounded-lg">
                  {personalInfo.profileImage ? (
                    <Image
                      src={personalInfo.profileImage}
                      alt={personalInfo.name}
                      fill
                      className="object-cover rounded-lg hover:scale-105 transition-all duration-300"
                      onError={() => {
                        // 如果圖片載入失敗，將顯示 placeholder
                        console.log('Image failed to load, showing placeholder');
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-primary-400 font-mono text-sm">Professional Photo</span>
                    </div>
                  )}
                </div>
                
                {/* Hover overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  className="absolute inset-0 bg-primary-400/10 rounded-lg"
                />
              </motion.div>
              
              {/* Decorative elements */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -top-4 -right-4 w-8 h-8 border-2 border-primary-400 rounded"
              />
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-4 -left-4 w-6 h-6 bg-primary-400/30 rounded-full"
              />
            </div>
            
            {/* View Resume Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="mt-6 flex flex-col items-center space-y-4"
            >
              <a
                href="/files/resume.pdf"
                target="_blank"
                rel="noopener noreferrer"
                // 註解掉 theme 相關的 class，只保留暗色設定
                className="inline-flex items-center px-6 py-2 bg-blue-500 text-white rounded font-mono text-sm shadow hover:bg-blue-600 transition-colors duration-200"
              >
                View my resume
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-4 h-4 ml-2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H10M17 7v7" />
                </svg>
              </a>
              
              {/* CTA Button - 移到這裡 */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-3 bg-transparent border-2 border-blue-400 text-blue-400 rounded font-mono text-sm hover:bg-blue-400/10 transition-all duration-300"
              >
                Check out my work!
              </motion.button>
            </motion.div>
          </motion.div>
        </div>

        {/* Social Links */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="fixed left-8 bottom-0 hidden lg:flex flex-col items-center space-y-6"
        >
          {socialLinks.map((link, index) => (
            <motion.a
              key={link.platform}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 + index * 0.1 }}
              whileHover={{ y: -3, color: '#38bdf8' }}
              className="text-gray-400 hover:text-blue-400 transition-colors"
            >
              <span className="sr-only">{link.platform}</span>
              <SocialIcon 
                icon={link.icon} 
                size={20}
                className="hover:scale-110 transition-transform duration-200"
              />
            </motion.a>
          ))}
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 80 }}
            transition={{ delay: 1.5, duration: 0.8 }}
            className="w-px bg-gray-400"
          />
        </motion.div>

        {/* Email */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="fixed right-8 bottom-0 hidden lg:flex flex-col items-center space-y-6"
        >
          <motion.a
            href="mailto:bowenchen0227@gmail.com"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            whileHover={{ y: -3, color: '#38bdf8' }}
            className="text-gray-400 hover:text-blue-400 transition-colors font-mono text-sm vertical-text"
            style={{ writingMode: 'vertical-rl' }}
          >
            bowenchen0227@gmail.com
          </motion.a>
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 80 }}
            transition={{ delay: 1.5, duration: 0.8 }}
            className="w-px bg-gray-400"
          />
        </motion.div>
      </div>
    </section>
  );
};

export default AboutSection;
