'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { PortfolioViewModel } from '@/viewModels';

interface ProjectsSectionProps {
  portfolioVM: PortfolioViewModel;
}

const ProjectsSection: React.FC<ProjectsSectionProps> = ({ portfolioVM }) => {
  const projects = portfolioVM.projects;
  const featuredProjects = portfolioVM.featuredProjects;

  return (
    <section id="projects" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-100 mb-4">
            <span className="text-primary-400 font-mono text-lg mr-2">03.</span>
            Some Things I've Built
          </h2>
          <div className="w-20 h-1 bg-primary-400 mx-auto"></div>
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
                className={`lg:col-span-7 ${
                  index % 2 === 1 ? 'lg:col-start-6' : ''
                }`}
              >
                <div className="relative group">
                  <div className="bg-gradient-to-br from-primary-400/20 to-primary-600/20 rounded-lg aspect-video border border-primary-400/30 flex items-center justify-center hover:from-primary-400/30 hover:to-primary-600/30 transition-all duration-300">
                    <span className="text-primary-400 font-mono text-sm">
                      Project Preview
                    </span>
                  </div>
                  
                  {/* Overlay */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    className="absolute inset-0 bg-primary-400/10 rounded-lg flex items-center justify-center"
                  >
                    <div className="flex space-x-4">
                      {project.githubUrl && (
                        <motion.a
                          href={project.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          whileHover={{ scale: 1.1 }}
                          className="w-10 h-10 bg-background-primary/80 rounded-full flex items-center justify-center text-primary-400 hover:text-white transition-colors"
                        >
                          <span className="sr-only">GitHub</span>
                          <div className="w-5 h-5 bg-current rounded"></div>
                        </motion.a>
                      )}
                      
                      {project.liveUrl && (
                        <motion.a
                          href={project.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          whileHover={{ scale: 1.1 }}
                          className="w-10 h-10 bg-background-primary/80 rounded-full flex items-center justify-center text-primary-400 hover:text-white transition-colors"
                        >
                          <span className="sr-only">Live Demo</span>
                          <div className="w-5 h-5 bg-current rounded"></div>
                        </motion.a>
                      )}
                    </div>
                  </motion.div>
                </div>
              </motion.div>

              {/* Project Content */}
              <div className={`lg:col-span-5 ${
                index % 2 === 1 ? 'lg:col-start-1 lg:row-start-1' : ''
              }`}>
                <motion.div
                  initial={{ opacity: 0, x: index % 2 === 1 ? 50 : -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="space-y-4"
                >
                  <p className="text-primary-400 font-mono text-sm">
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

        {/* Other Projects Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h3 className="text-2xl font-bold text-gray-100 mb-4">
            Other Noteworthy Projects
          </h3>
          <p className="text-primary-400 font-mono text-sm">
            view the archive
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.filter(p => !p.featured).map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-background-secondary/50 rounded-lg p-6 border border-gray-700/50 hover:border-primary-400/30 transition-all duration-300 h-full flex flex-col"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-400/20 to-primary-600/20 rounded border border-primary-400/30 flex items-center justify-center">
                  <div className="w-5 h-5 bg-primary-400/50 rounded"></div>
                </div>
                
                <div className="flex space-x-3">
                  {project.githubUrl && (
                    <motion.a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.1 }}
                      className="text-gray-400 hover:text-primary-400 transition-colors"
                    >
                      <span className="sr-only">GitHub</span>
                      <div className="w-5 h-5 bg-current rounded"></div>
                    </motion.a>
                  )}
                  
                  {project.liveUrl && (
                    <motion.a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.1 }}
                      className="text-gray-400 hover:text-primary-400 transition-colors"
                    >
                      <span className="sr-only">Live Demo</span>
                      <div className="w-5 h-5 bg-current rounded"></div>
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
