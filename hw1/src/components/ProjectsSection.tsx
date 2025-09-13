'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { FaGithub, FaYoutube, FaApple } from 'react-icons/fa';
import { PortfolioViewModel } from '@/viewModels';

interface ProjectsSectionProps {
  portfolioVM: PortfolioViewModel;
}

const ProjectsSection: React.FC<ProjectsSectionProps> = ({ portfolioVM }) => {
  const projects = portfolioVM.projects;
  const featuredProjects = portfolioVM.featuredProjects;
  const [imageAspectRatios, setImageAspectRatios] = useState<Record<string, number>>({});
  
  // 根據 URL 獲取對應的圖示
  const getUrlIcon = (url: string) => {
    if (url.includes('github.com')) {
      return <FaGithub className="w-5 h-5" />;
    } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return <FaYoutube className="w-5 h-5" />;
    } else if (url.includes('testflight.apple.com')) {
      return <FaApple className="w-5 h-5" />;
    }
    // 預設圖示
    return <div className="w-5 h-5 bg-current rounded"></div>;
  };
  
  // 獲取專案的長寬比類型
  const getAspectRatioType = (project: any): 'wide' | 'tall' | 'square' => {
    // 優先使用動態計算的長寬比
    if (imageAspectRatios[project.id]) {
      const ratio = imageAspectRatios[project.id];
      if (ratio > 1.5) return 'wide';
      if (ratio < 0.8) return 'tall';
      return 'square';
    }
    // 後備使用預設的 aspectRatio
    return project.aspectRatio || 'square';
  };

  return (
    <section id="projects" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-4xl font-bold text-center mb-8"
          >
            <span className="text-blue-400 font-mono text-lg mr-2">03.</span>
            Some Things I've Built
          </motion.h2>
          <div className="w-20 h-1 bg-blue-400 mx-auto"></div>
        </motion.div>

        {/* Featured Projects */}
        <div className="space-y-20 mb-20">
          {featuredProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className={`grid lg:grid-cols-12 gap-8 items-center ${
                index % 2 === 1 ? 'lg:text-right' : ''
              }`}
            >
              {/* Project Image */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className={`${
                  // 根據長寬比調整網格大小
                  (() => {
                    const aspectType = getAspectRatioType(project);
                    switch (aspectType) {
                      case 'wide': return 'lg:col-span-8';
                      case 'tall': return 'lg:col-span-5'; // 從 6 減少到 5
                      default: return 'lg:col-span-7';
                    }
                  })()
                } ${
                  index % 2 === 1 
                    ? (() => {
                        const aspectType = getAspectRatioType(project);
                        switch (aspectType) {
                          case 'wide': return 'lg:col-start-5';
                          case 'tall': return 'lg:col-start-8'; // 從第8列開始 (12-5+1=8)
                          default: return 'lg:col-start-6';
                        }
                      })()
                    : ''
                }`}
              >
                <div className="relative group">
                  {/* Project Image */}
                  <div className={`relative rounded-lg overflow-hidden border border-blue-400/30 ${
                    (() => {
                      const aspectType = getAspectRatioType(project);
                      switch (aspectType) {
                        case 'wide': return 'aspect-video'; // 寬圖：16:9
                        case 'tall': return 'aspect-[2/3]'; // 直圖：2:3 (比 3:4 更窄一點)
                        default: return 'aspect-square'; // 方圖：1:1
                      }
                    })()
                  }`}>
                    {project.imageUrl ? (
                      <Image
                        src={project.imageUrl}
                        alt={project.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        onLoad={(e) => {
                          const img = e.target as HTMLImageElement;
                          const aspectRatio = img.naturalWidth / img.naturalHeight;
                          setImageAspectRatios((prev: Record<string, number>) => ({
                            ...prev,
                            [project.id]: aspectRatio
                          }));
                        }}
                      />
                    ) : (
                      <div className="bg-gradient-to-br from-blue-400/20 to-blue-600/20 w-full h-full flex items-center justify-center">
                        <span className="text-blue-400 font-mono text-sm">
                          Project Preview
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Overlay */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    className="absolute inset-0 bg-blue-400/10 rounded-lg flex items-center justify-center"
                  >
                    <div className="flex space-x-4">
                      {project.githubUrl && (
                        <motion.a
                          href={project.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          whileHover={{ scale: 1.1 }}
                          className="w-10 h-10 bg-background-primary/80 rounded-full flex items-center justify-center text-blue-400 hover:text-white transition-colors"
                        >
                          <span className="sr-only">GitHub</span>
                          {getUrlIcon(project.githubUrl)}
                        </motion.a>
                      )}
                      
                      {project.liveUrl && (
                        <motion.a
                          href={project.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          whileHover={{ scale: 1.1 }}
                          className="w-10 h-10 bg-background-primary/80 rounded-full flex items-center justify-center text-blue-400 hover:text-white transition-colors"
                        >
                          <span className="sr-only">Live Demo</span>
                          {getUrlIcon(project.liveUrl)}
                        </motion.a>
                      )}
                    </div>
                  </motion.div>
                </div>
              </motion.div>

              {/* Project Content */}
              <div className={`${
                // 根據圖片長寬比調整內容區域大小
                (() => {
                  const aspectType = getAspectRatioType(project);
                  switch (aspectType) {
                    case 'wide': return 'lg:col-span-4'; // 寬圖時內容區域較小
                    case 'tall': return 'lg:col-span-7'; // 直圖時內容區域較大 (12-5=7)
                    default: return 'lg:col-span-5'; // 方圖標準大小
                  }
                })()
              } ${
                index % 2 === 1 ? 'lg:col-start-1 lg:row-start-1' : ''
              }`}>
                <motion.div
                  initial={{ opacity: 0, x: index % 2 === 1 ? 50 : -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="space-y-4"
                >
                  <p className="text-blue-400 font-mono text-sm">
                    Featured Project
                  </p>
                  
                  <h3 className="text-2xl font-bold text-gray-100">
                    {project.title}
                  </h3>
                  
                  <div className="bg-background-secondary/80 p-6 rounded-lg border border-gray-700/50">
                    <p className="text-gray-300 leading-relaxed">
                      {project.description}
                    </p>
                  </div>
                  
                  <div className={`flex flex-wrap gap-2 ${
                    index % 2 === 1 ? 'lg:justify-end' : ''
                  }`}>
                    {project.technologies.map((tech, techIndex) => (
                      <span
                        key={techIndex}
                        className="text-gray-400 font-mono text-sm"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.filter(p => !p.featured).map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-background-secondary/50 rounded-lg p-6 border border-gray-700/50 hover:border-blue-400/30 transition-all duration-300 h-full flex flex-col"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400/20 to-blue-600/20 rounded border border-blue-400/30 flex items-center justify-center">
                  <div className="w-5 h-5 bg-blue-400/50 rounded"></div>
                </div>
                
                <div className="flex space-x-3">
                  {project.githubUrl && (
                    <motion.a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.1 }}
                      className="text-gray-400 hover:text-blue-400 transition-colors"
                    >
                      <span className="sr-only">GitHub</span>
                      {getUrlIcon(project.githubUrl)}
                    </motion.a>
                  )}
                  
                  {project.liveUrl && (
                    <motion.a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.1 }}
                      className="text-gray-400 hover:text-blue-400 transition-colors"
                    >
                      <span className="sr-only">Live Demo</span>
                      {getUrlIcon(project.liveUrl)}
                    </motion.a>
                  )}
                </div>
              </div>
              
              <h4 className="text-xl font-bold text-gray-100 mb-3">
                {project.title}
              </h4>
              
              <p className="text-gray-400 text-sm leading-relaxed mb-6 flex-grow">
                {project.description}
              </p>
              
              <div className="flex flex-wrap gap-2">
                {project.technologies.slice(0, 4).map((tech, techIndex) => (
                  <span
                    key={techIndex}
                    className="text-gray-400 font-mono text-xs"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProjectsSection;
