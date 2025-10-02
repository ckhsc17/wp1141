'use client';

import React from 'react';
import { useCartOperations } from '@/hooks/useCartOperations';
import { useNavigation } from '@/hooks/useNavigation';
import { layoutStyles, buttonStyles } from '@/styles/components';
import ThreeGallery from './ThreeGallery';

const Header: React.FC = () => {
  const { totalItems, toggleCart } = useCartOperations(); // ✅ 購物車邏輯抽離
  const { isGalleryOpen, openGallery, closeGallery } = useNavigation(); // ✅ 導航邏輯抽離

  return (
    <>
      <header className="bg-white shadow-md sticky top-0 z-40">
        <div className={layoutStyles.container}>
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Antique Gallery
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              {/* 3D Gallery Button */}
              <button
                onClick={openGallery}
                className={buttonStyles.gallery}
                title="View 3D Gallery"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </button>

              {/* Cart Button */}
              <button
                onClick={toggleCart}
                className={buttonStyles.cart}
                title="View Cart"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 3D Gallery Modal */}
      <ThreeGallery 
        isOpen={isGalleryOpen} 
        onClose={closeGallery} 
      />
    </>
  );
};

export default Header;