'use client';

import React, { useEffect, useState } from 'react';
import { usePointerLockGallery } from '@/hooks/usePointerLockGallery';

interface PointerLockGalleryProps {
  isOpen: boolean;
  onClose: () => void;
}

const PointerLockGallery: React.FC<PointerLockGalleryProps> = ({ isOpen, onClose }) => {
  const {
    mountRef,
    isLoading,
    isLocked,
    nearbyAntique,
    setNearbyAntique,
    initThreeJS,
    loadModels,
    autoLockPointer,
    unlockPointer,
    resetState,
    completeCleanup,
    controlsRef
  } = usePointerLockGallery();

  const [showEscHint, setShowEscHint] = useState(false);
  const [needsUserGesture, setNeedsUserGesture] = useState(true);

  // Reset UI state when gallery opens (but keep 3D scene cached)
  useEffect(() => {
    if (isOpen) {
      setNeedsUserGesture(true);
      setShowEscHint(false);
      // Don't reset hook state to preserve model cache
      console.log('Gallery opened, resetting UI state...');
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && mountRef.current) {
      // Always try to initialize when opening
      console.log('Initializing PointerLock Gallery...');
      const cleanup = initThreeJS();
      loadModels();

      return () => {
        console.log('Cleaning up PointerLock Gallery...');
        // Only cleanup controls and events, keep scene cached
        if (controlsRef.current && (controlsRef.current as any).cleanup) {
          (controlsRef.current as any).cleanup();
        }
        // Don't call cleanup() to preserve the scene
      };
    }
  }, [isOpen]);

  // Complete cleanup on component unmount
  useEffect(() => {
    return () => {
      completeCleanup();
    };
  }, [completeCleanup]);

  // Show click instruction when loading is complete
  useEffect(() => {
    if (!isLoading && isOpen && needsUserGesture) {
      setShowEscHint(true);
    }
  }, [isLoading, isOpen, needsUserGesture]);

  // Handle canvas click to start pointer lock
  const handleCanvasClick = () => {
    if (needsUserGesture && !isLocked && !isLoading) {
      console.log('Canvas clicked, attempting to lock pointer...');
      autoLockPointer();
      setNeedsUserGesture(false);
      setShowEscHint(true);
      
      // Hide ESC hint after 2 seconds
      setTimeout(() => {
        setShowEscHint(false);
      }, 2000);
    } else {
      console.log('Canvas click ignored:', { needsUserGesture, isLocked, isLoading });
    }
  };

  // Handle ESC key to exit gallery
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Escape' && isOpen) {
        event.preventDefault();
        console.log('ESC pressed, exiting gallery...');
        unlockPointer();
        onClose(); // Exit to homepage
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, unlockPointer, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-40">
          <div className="bg-white bg-opacity-90 rounded-lg p-6 flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-lg font-medium">Loading 3D Gallery...</span>
          </div>
        </div>
      )}

    {/* ESC Hint / Click Instruction */}
    {showEscHint && !isLoading && (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
        {needsUserGesture ? (
        // 👉 "Click anywhere to start"
        <div
            className="
            text-gray-800 text-xl font-medium 
            px-8 py-4 rounded-lg
            bg-white bg-opacity-40 backdrop-blur-sm
            animate-pulse-scale
            "
        >
            Click anywhere to start
        </div>
        ) : (
        // 👉 "Press ESC to leave"
        <div className="text-gray-800 text-xl font-medium 
            px-8 py-4 rounded-lg
            bg-white bg-opacity-40 backdrop-blur-sm
            animate-pulse-scale
            ">
            Press ESC to leave <br />
            Press WASD to move
        </div>
        )}
    </div>
    )}

      {/* Crosshair */}
      {isLocked && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="w-6 h-6">
            <div className="absolute inset-0">
              <div className="absolute top-1/2 left-1/2 w-0.5 h-6 bg-white opacity-75 transform -translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute top-1/2 left-1/2 w-6 h-0.5 bg-white opacity-75 transform -translate-x-1/2 -translate-y-1/2"></div>
            </div>
          </div>
        </div>
      )}

      {/* Antique Info Popup */}
      {nearbyAntique && isLocked && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
          <div className="bg-white bg-opacity-95 rounded-lg shadow-2xl p-6 max-w-md backdrop-blur-sm border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-gray-800">古董資訊</h3>
              <button
                onClick={() => setNearbyAntique(null)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">名稱:</span>
                <span className="text-sm text-gray-600 capitalize">
                  {nearbyAntique.name.replace(/_/g, ' ')}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">位置:</span>
                <span className="text-sm text-gray-600">
                  展示櫃 ({nearbyAntique.position.x}, {nearbyAntique.position.z})
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Three.js mount point */}
      <div 
        ref={mountRef} 
        className="w-full h-full cursor-crosshair" 
        onClick={handleCanvasClick}
      />
    </div>
  );
};

export default PointerLockGallery;