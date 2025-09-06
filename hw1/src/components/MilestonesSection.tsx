import React from 'react';
import { motion } from 'framer-motion';
import { PortfolioViewModel } from '@/viewModels';

interface MilestonesSectionProps {
  portfolioVM: PortfolioViewModel;
}

const MilestonesSection: React.FC<MilestonesSectionProps> = ({ portfolioVM }) => {
  const milestones = portfolioVM.milestones;

  const getMilestoneIcon = (type: string) => {
    switch (type) {
      case 'education':
        return '🎓';
      case 'achievement':
        return '🏆';
      case 'life':
        return '🌟';
      default:
        return '📍';
    }
  };

  const getMilestoneColor = (type: string) => {
    switch (type) {
      case 'education':
        return 'border-blue-400 bg-blue-400/10';
      case 'achievement':
        return 'border-yellow-400 bg-yellow-400/10';
      case 'life':
        return 'border-green-400 bg-green-400/10';
      default:
        return 'border-gray-400 bg-gray-400/10';
    }
  };

  return (
    <section id="milestones" className="py-20 px-6 bg-gray-900">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            My <span className="text-blue-400">Journey</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Key milestones and memorable moments in my life and career
          </p>
        </motion.div>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-400 via-green-400 to-yellow-400 opacity-30"></div>

          <div className="space-y-12">
            {milestones.map((milestone, index) => (
              <motion.div
                key={milestone.id}
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="relative flex items-start space-x-6"
              >
                {/* Timeline dot */}
                <div className={`flex-shrink-0 w-16 h-16 rounded-full border-2 ${getMilestoneColor(milestone.type)} flex items-center justify-center text-2xl backdrop-blur-sm`}>
                  {getMilestoneIcon(milestone.type)}
                </div>

                {/* Content */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.2 + 0.2 }}
                  className="flex-1 bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors duration-300"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
                    <h3 className="text-xl font-semibold text-white mb-2 sm:mb-0">
                      {milestone.title}
                    </h3>
                    <span className="text-sm font-mono text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full">
                      {milestone.date}
                    </span>
                  </div>
                  <p className="text-gray-400 leading-relaxed">
                    {milestone.description}
                  </p>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Call to action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-16"
        >
          <p className="text-gray-400 mb-6">
            Want to be part of my next milestone?
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => document.getElementById('connect')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-green-600 transition-all duration-300"
          >
            Let's Connect
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

export default MilestonesSection;
