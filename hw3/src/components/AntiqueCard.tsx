'use client';

import React from 'react';
import { AntiqueItem } from '@/types';
import { useCart } from '@/contexts/CartContext';

interface AntiqueCardProps {
  antique: AntiqueItem;
}

const AntiqueCard: React.FC<AntiqueCardProps> = ({ antique }) => {
  const { dispatch } = useCart();

  const handleAddToCart = () => {
    dispatch({ type: 'ADD_ITEM', payload: antique });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden group">
      {/* 3D Model Container */}
      <div className="h-64 bg-gray-100 relative overflow-hidden">
        {antique.iframe ? (
          <div 
            className="w-full h-full"
            dangerouslySetInnerHTML={{ __html: antique.iframe }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <span className="text-gray-500">No 3D Model Available</span>
          </div>
        )}
        
        {/* Floating Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          className="absolute top-4 right-4 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          title="Add to Collection"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
            {antique.name}
          </h3>
          <span className="text-2xl font-bold text-green-600">
            ${antique.price.toLocaleString()}
          </span>
        </div>

        <p className="text-gray-600 mb-4 line-clamp-3">
          {antique.description}
        </p>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="font-medium text-gray-700">Origin:</span>
            <span className="text-gray-600">{antique.origin}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-700">Era:</span>
            <span className="text-gray-600">{antique.era}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-700">Material:</span>
            <span className="text-gray-600">{antique.material}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-700">Size:</span>
            <span className="text-gray-600">{antique.size}</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 italic">
            {antique.history}
          </p>
        </div>

        <button
          onClick={handleAddToCart}
          className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors duration-200 font-medium"
        >
          Add to Collection
        </button>
      </div>
    </div>
  );
};

export default AntiqueCard;