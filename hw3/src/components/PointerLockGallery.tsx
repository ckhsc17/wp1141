'use client';

import React, { useEffect } from 'react';
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
    lockPointer,
    unlockPointer,
    controlsRef
  } = usePointerLockGallery();

  useEffect(() => {
    if (isOpen && mountRef.current && !controlsRef.current) {
      console.log('Initializing PointerLock Gallery...');
      const cleanup = initThreeJS();
      loadModels();

      return () => {
        console.log('Cleaning up PointerLock Gallery...');
        cleanup?.();
        if (controlsRef.current && (controlsRef.current as any).cleanup) {
          (controlsRef.current as any).cleanup();
        }
        // Ensure pointer is unlocked when component unmounts
        unlockPointer();
      };
    }
  }, [isOpen]); // Remove other dependencies to prevent re-initialization

  // Handle ESC key to unlock pointer
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Escape' && isLocked) {
        unlockPointer();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, isLocked, unlockPointer]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Control buttons */}
      <div className="absolute top-4 right-4 z-10">
        {/* Close button */}
        <button
          onClick={onClose}
          className="bg-white hover:bg-gray-100 text-black p-3 rounded-full shadow-lg"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Instructions */}
      <div className="absolute top-4 left-4 z-10 bg-white bg-opacity-90 rounded-lg p-4 max-w-xs">
        <h3 className="font-bold mb-2">FPS 控制說明:</h3>
        <ul className="text-sm space-y-1">
          <li>• 點擊畫面鎖定滑鼠</li>
          <li>• 滑鼠移動控制視角</li>
          <li>• WASD 鍵移動</li>
          <li>• ESC 鍵解除滑鼠鎖定</li>
          <li>• 靠近展示櫃查看古董詳情</li>
        </ul>
      </div>

      {/* Pointer Lock Instructions */}
      {!isLocked && !isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
          <div className="bg-white rounded-lg p-8 text-center max-w-md mx-4">
            <div className="mb-4">
              <svg className="w-16 h-16 mx-auto text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.122 2.122" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">FPS 模式</h3>
            <p className="text-gray-600 mb-6">
              點擊下方按鈕進入第一人稱模式，使用 WASD 移動，滑鼠控制視角
            </p>
            <button
              onClick={lockPointer}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              🎮 開始 FPS 模式
            </button>
            <p className="text-xs text-gray-500 mt-4">
              按 ESC 鍵可隨時退出 FPS 模式
            </p>
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-lg">Loading 3D Gallery...</span>
          </div>
        </div>
      )}

      {/* FPS Status Indicator */}
      {isLocked && (
        <div className="absolute bottom-4 right-4 z-10">
          <div className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium">
            🎮 FPS 模式已啟用
          </div>
        </div>
      )}

      {/* Crosshair */}
      {isLocked && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="w-4 h-4">
            <div className="absolute inset-0 border border-white opacity-75">
              <div className="absolute top-1/2 left-1/2 w-0.5 h-0.5 bg-white transform -translate-x-1/2 -translate-y-1/2"></div>
            </div>
          </div>
        </div>
      )}

      {/* Antique Info Popup */}
      {nearbyAntique && (
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
              
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-800">
                  🎮 在 FPS 模式中，您可以自由移動觀察這件古董
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Three.js mount point */}
      <div ref={mountRef} className="w-full h-full cursor-crosshair" />
    </div>
  );
};

export default PointerLockGallery;