'use client';

import React, { useState } from 'react';
import ThreeGallery from './ThreeGallery';
import PointerLockGallery from './PointerLockGallery';

interface GalleryDemoProps {
  isOpen: boolean;
  onClose: () => void;
}

type GalleryMode = 'orbit' | 'fps';

const GalleryDemo: React.FC<GalleryDemoProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<GalleryMode>('orbit');

  if (!isOpen) return null;

  const handleModeSwitch = (newMode: GalleryMode) => {
    setMode(newMode);
  };

  const handleClose = () => {
    setMode('orbit'); // Reset to orbit mode when closing
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Mode Selection */}
      {mode === 'orbit' && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
          <div className="bg-white bg-opacity-90 rounded-lg p-3 flex space-x-2">
            <button
              onClick={() => handleModeSwitch('orbit')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
            >
              🎯 Orbit 模式
            </button>
            <button
              onClick={() => handleModeSwitch('fps')}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-sm font-medium"
            >
              🎮 FPS 模式
            </button>
          </div>
        </div>
      )}

      {mode === 'fps' && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
          <div className="bg-white bg-opacity-90 rounded-lg p-3 flex space-x-2">
            <button
              onClick={() => handleModeSwitch('orbit')}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-sm font-medium"
            >
              🎯 Orbit 模式
            </button>
            <button
              onClick={() => handleModeSwitch('fps')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium"
            >
              🎮 FPS 模式
            </button>
          </div>
        </div>
      )}

      {/* Render the appropriate gallery */}
      {mode === 'orbit' && (
        <ThreeGallery isOpen={isOpen} onClose={handleClose} />
      )}
      
      {mode === 'fps' && (
        <PointerLockGallery isOpen={isOpen} onClose={handleClose} />
      )}
    </div>
  );
};

export default GalleryDemo;