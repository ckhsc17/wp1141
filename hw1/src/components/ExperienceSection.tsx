'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { PortfolioViewModel } from '@/viewModels';

interface ExperienceSectionProps {
  portfolioVM: PortfolioViewModel;
}

const ExperienceSection: React.FC<ExperienceSectionProps> = ({ portfolioVM }) => {
  const experiences = portfolioVM.experiences;

  return (
    <section id="experience" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-100 mb-4">
            <span className="text-primary-400 font-mono text-lg mr-2">02.</span>
            Where I've Worked
          </h2>
          <div className="w-20 h-1 bg-primary-400 mx-auto"></div>
        </motion.div>

        <div className="space-y-8">
          {experiences.map((experience, index) => (
            <motion.div
              key={experience.id}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="relative"
            >
              <div className="bg-background-secondary/50 rounded-lg p-6 border border-gray-700/50 hover:border-primary-400/30 transition-all duration-300">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-center gap-2 mb-3">
                      <h3 className="text-xl font-bold text-gray-100">
                        {experience.position}
                      </h3>
                      <span className="text-primary-400 font-mono">@</span>
                      <span className="text-primary-400 font-semibold">
                        {experience.company}
                      </span>
                    </div>
                    
                    <p className="text-gray-400 text-sm font-mono mb-4">
                      {experience.period}
                    </p>

                    <p className="text-gray-300 leading-relaxed mb-6">
                      {experience.description}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {experience.technologies.map((tech, techIndex) => (
                        <span
                          key={techIndex}
                          className="px-3 py-1 bg-primary-400/10 text-primary-400 rounded-full text-xs font-mono border border-primary-400/20"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="w-16 h-16 bg-gradient-to-br from-primary-400/20 to-primary-600/20 rounded-lg border border-primary-400/30 flex items-center justify-center flex-shrink-0"
                  >
                    <span className="text-primary-400 font-bold text-sm">
                      {experience.company.charAt(0)}
                    </span>
                  </motion.div>
                </div>

                {/* Decorative line */}
                {index < experiences.length - 1 && (
                  <motion.div
                    initial={{ scaleY: 0 }}
                    whileInView={{ scaleY: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="absolute left-1/2 transform -translate-x-1/2 bottom-0 w-px h-8 bg-gradient-to-b from-primary-400/50 to-transparent"
                  />
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ExperienceSection;
