'use client';

import React from 'react';
import { AntiqueItem } from '@/types';
import { useAntiqueActions } from '@/hooks/useAntiqueActions';
import { buttonStyles, cardStyles, textStyles } from '@/styles/components';
import IframeViewer from './IframeViewer';

interface AntiqueViewerProps {
  antique: AntiqueItem;
}

const AntiqueViewer: React.FC<AntiqueViewerProps> = ({ antique }) => {
  const { addToCart } = useAntiqueActions(); // ✅ 業務邏輯抽離到 hook

  const handleAddToCart = () => addToCart(antique); // ✅ 簡化事件處理

  return (
    <div className={`${cardStyles.base} group`}>
      {/* Square 3D Model Container */}
      <div className="aspect-square bg-gray-100 relative overflow-hidden">
        {antique.iframe ? (
          <IframeViewer iframeContent={antique.iframe} />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <span className="text-gray-500">No 3D Model Available</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className={cardStyles.content}>
        <div className="flex justify-between items-start mb-3">
          <h3 className={cardStyles.title}>
            {antique.name}
          </h3>
          <span className={cardStyles.price}>
            ${antique.price.toLocaleString()}
          </span>
        </div>

        <p className={cardStyles.description}>
          {antique.description}
        </p>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className={textStyles.detail}>Origin:</span>
            <span className={textStyles.value}>{antique.origin}</span>
          </div>
          <div className="flex justify-between">
            <span className={textStyles.detail}>Era:</span>
            <span className={textStyles.value}>{antique.era}</span>
          </div>
          <div className="flex justify-between">
            <span className={textStyles.detail}>Material:</span>
            <span className={textStyles.value}>{antique.material}</span>
          </div>
          <div className="flex justify-between">
            <span className={textStyles.detail}>Size:</span>
            <span className={textStyles.value}>{antique.size}</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className={textStyles.small}>
            {antique.history}
          </p>
        </div>

        <button
          onClick={handleAddToCart}
          className={`w-full mt-4 ${buttonStyles.primary}`}
        >
          Add to Collection
        </button>
      </div>
      {/*End of Content*/}

       
    </div>
  );
};

export default AntiqueViewer;