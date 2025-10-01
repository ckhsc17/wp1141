'use client';

import React from 'react';
import { AntiqueItem } from '@/types';
import { useCart } from '@/contexts/CartContext';
import IframeViewer from './IframeViewer';

interface AntiqueViewerProps {
  antique: AntiqueItem;
}

const AntiqueViewer: React.FC<AntiqueViewerProps> = ({ antique }) => {
  const { dispatch } = useCart();

  const handleAddToCart = () => {
    dispatch({ type: 'ADD_ITEM', payload: antique });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden group">
      {/* Square 3D Model Container */}
      <div className="aspect-square bg-gray-100 relative overflow-hidden">
        {antique.iframe ? (
          <IframeViewer iframeContent={antique.iframe} />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <span className="text-gray-500">No 3D Model Available</span>
          </div>
        )}
        
        {/* Floating Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          className="absolute top-4 right-4 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          title="Add to Collection"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
      </div>

      {/* Quick info and action */}
      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-semibold text-gray-900 truncate">{antique.name}</h4>
          <span className="text-lg font-bold text-green-600">
            ${antique.price.toLocaleString()}
          </span>
        </div>
        
        <button
          onClick={handleAddToCart}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors duration-200 font-medium"
        >
          Add to Collection
        </button>
      </div>
    </div>
  );
};

export default AntiqueViewer;