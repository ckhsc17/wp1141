import React from 'react';
import { motion } from 'framer-motion';
import { PortfolioViewModel } from '@/viewModels';

interface MilestonesSectionProps {
  portfolioVM: PortfolioViewModel;
}

const MilestonesSection: React.FC<MilestonesSectionProps> = ({ portfolioVM }) => {
  const milestones = portfolioVM.milestones;

  const getMilestoneColor = (type: string) => {
    switch (type) {
      case 'education':
        return 'border-blue-400 text-blue-400';
      case 'achievement':
        return 'border-yellow-400 text-yellow-400';
      case 'life':
        return 'border-green-400 text-green-400';
      case 'career':
        return 'border-purple-400 text-purple-400';
      default:
        return 'border-gray-400 text-gray-400';
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
          <div className="absolute left-4 top-8 bottom-8 w-px bg-gradient-to-b from-blue-400 via-purple-400 to-green-400 opacity-40"></div>

          <div className="space-y-8">
            {milestones.map((milestone, index) => (
              <motion.div
                key={milestone.id}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative flex items-start space-x-6"
              >
                {/* Timeline dot */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full border-2 ${getMilestoneColor(milestone.type)} flex items-center justify-center backdrop-blur-sm relative z-10`}>
                  <div className="w-2 h-2 rounded-full bg-current opacity-80"></div>
                </div>

                {/* Content */}
                <div className="flex-1 pb-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                    <h3 className="text-lg font-semibold text-white mb-1 sm:mb-0">
                      {milestone.title}
                    </h3>
                    <span className="text-xs font-mono text-blue-400 bg-blue-400/10 px-2 py-1 rounded">
                      {milestone.date}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {milestone.description}
                  </p>
                  
                  {/* Type indicator */}
                  <div className="mt-3">
                    <span className={`inline-flex items-center text-xs px-2 py-1 rounded-full ${
                      milestone.type === 'education' ? 'text-blue-300 bg-blue-400/10' :
                      milestone.type === 'achievement' ? 'text-yellow-300 bg-yellow-400/10' :
                      milestone.type === 'life' ? 'text-green-300 bg-green-400/10' :
                      'text-purple-300 bg-purple-400/10'
                    }`}>
                      {milestone.type === 'education' && '🎓'}
                      {milestone.type === 'achievement' && '🏆'}
                      {milestone.type === 'life' && '🌟'}
                      {milestone.type === 'career' && '💼'}
                      <span className="ml-1 capitalize">{milestone.type}</span>
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MilestonesSection;
