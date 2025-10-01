'use client';

import React, { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import ThreeGallery from './ThreeGallery';

const Header: React.FC = () => {
  const { state, dispatch } = useCart();
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  
  const totalItems = state.items.reduce((total, item) => total + item.quantity, 0);

  return (
    <>
      <header className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Antique Gallery
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              {/* 3D Gallery Button */}
              <button
                onClick={() => setIsGalleryOpen(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full transition-colors duration-200"
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
                onClick={() => dispatch({ type: 'TOGGLE_CART' })}
                className="relative bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full transition-colors duration-200"
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
        onClose={() => setIsGalleryOpen(false)} 
      />
    </>
  );
};

export default Header;