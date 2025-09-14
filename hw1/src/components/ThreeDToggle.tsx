'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FaCube, FaRegSquare } from 'react-icons/fa';
import { useThreeD } from '@/contexts/ThreeDContext';

const ThreeDToggle: React.FC = () => {
  const { is3DMode, toggle3DMode } = useThreeD();

  return (
    <motion.button
      onClick={toggle3DMode}
      className={`
        fixed top-20 right-4 z-50 w-12 h-12 rounded-full
        flex items-center justify-center
        transition-all duration-300 backdrop-blur-md
        ${is3DMode 
          ? 'bg-purple-500/80 text-white shadow-lg shadow-purple-500/25' 
          : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700/80'
        }
        border border-gray-600/30 hover:border-purple-400/50
      `}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      title={is3DMode ? "Switch to 2D Mode" : "Enter 3D Mode"}
    >
      <motion.div
        animate={{ rotateY: is3DMode ? 180 : 0 }}
        transition={{ duration: 0.5 }}
      >
        {is3DMode ? <FaCube size={20} /> : <FaRegSquare size={20} />}
      </motion.div>
    </motion.button>
  );
};

export default ThreeDToggle;
