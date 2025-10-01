'use client';

import React from 'react';
import { AntiqueItem } from '@/types';

interface AntiqueInfoProps {
  antique: AntiqueItem;
}

const AntiqueInfo: React.FC<AntiqueInfoProps> = ({ antique }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-4">
      {/* Header with name and price */}
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold text-gray-900">
          {antique.name}
        </h3>
        <span className="text-2xl font-bold text-green-600">
          ${antique.price.toLocaleString()}
        </span>
      </div>

      {/* Description */}
      <p className="text-gray-600 mb-4 line-clamp-3">
        {antique.description}
      </p>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
        <div>
          <span className="font-medium text-gray-700 block">Origin:</span>
          <span className="text-gray-600">{antique.origin}</span>
        </div>
        <div>
          <span className="font-medium text-gray-700 block">Era:</span>
          <span className="text-gray-600">{antique.era}</span>
        </div>
        <div>
          <span className="font-medium text-gray-700 block">Material:</span>
          <span className="text-gray-600">{antique.material}</span>
        </div>
        <div>
          <span className="font-medium text-gray-700 block">Size:</span>
          <span className="text-gray-600">{antique.size}</span>
        </div>
        <div className="col-span-2">
          <span className="font-medium text-gray-700 block">Collected:</span>
          <span className="text-gray-600">{new Date(antique.collected_at).toLocaleDateString()}</span>
        </div>
      </div>

      {/* History */}
      <div className="pt-4 border-t border-gray-200">
        <span className="font-medium text-gray-700 block mb-2">History:</span>
        <p className="text-xs text-gray-500 italic">
          {antique.history}
        </p>
      </div>
    </div>
  );
};

export default AntiqueInfo;