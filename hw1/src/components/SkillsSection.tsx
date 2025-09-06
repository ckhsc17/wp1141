import React from 'react';
import { motion } from 'framer-motion';
import { PortfolioViewModel } from '@/viewModels';

interface SkillsSectionProps {
  portfolioVM: PortfolioViewModel;
}

const SkillsSection: React.FC<SkillsSectionProps> = ({ portfolioVM }) => {
  const skillCategories = [
    { key: 'languages', title: 'Languages', color: 'bg-blue-500' },
    { key: 'frontend', title: 'Frontend', color: 'bg-green-500' },
    { key: 'backend', title: 'Backend', color: 'bg-purple-500' },
    { key: 'tools', title: 'Tools', color: 'bg-orange-500' },
  ];

  return (
    <section id="skills" className="py-20 px-6 bg-gray-800">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Skills & <span className="text-blue-400">Technologies</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Here are the technologies and tools I work with
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {skillCategories.map((category, categoryIndex) => {
            const skills = portfolioVM.getSkillsByCategory(category.key as any);
            
            return (
              <motion.div
                key={category.key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: categoryIndex * 0.1 }}
                className="bg-gray-900 rounded-lg p-6 border border-gray-700"
              >
                <div className="flex items-center space-x-3 mb-6">
                  <div className={`w-3 h-3 rounded-full ${category.color}`}></div>
                  <h3 className="text-xl font-semibold text-white">
                    {category.title}
                  </h3>
                </div>

                <div className="space-y-4">
                  {skills.map((skill, skillIndex) => (
                    <motion.div
                      key={skill.name}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ 
                        duration: 0.4, 
                        delay: categoryIndex * 0.1 + skillIndex * 0.05 
                      }}
                      className="space-y-2"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 font-medium">
                          {skill.name}
                        </span>
                        <span className="text-sm text-gray-400">
                          {skill.level}%
                        </span>
                      </div>
                      
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${skill.level}%` }}
                          viewport={{ once: true }}
                          transition={{ 
                            duration: 1, 
                            delay: categoryIndex * 0.1 + skillIndex * 0.05 + 0.2 
                          }}
                          className={`h-2 rounded-full ${category.color}`}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default SkillsSection;
