'use client';

import React from 'react';
import { AntiqueItem } from '@/types';
import { layoutStyles } from '@/styles/components';
import AntiqueViewer from './AntiqueViewer';

interface AntiqueGridProps {
  antiques: AntiqueItem[];
  loading: boolean;
}

const AntiqueGrid: React.FC<AntiqueGridProps> = ({ antiques, loading }) => {
  if (loading) {
    return (
      <div className={layoutStyles.gridLarge}>
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="space-y-4">
            {/* 3D Viewer Skeleton */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
              <div className="aspect-square bg-gray-300"></div>
              <div className="p-4">
                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                <div className="h-4 bg-gray-300 rounded mb-3 w-1/2"></div>
                <div className="h-8 bg-gray-300 rounded"></div>
              </div>
            </div>
            
            {/* Info Card Skeleton */}
            <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
              <div className="h-6 bg-gray-300 rounded mb-3"></div>
              <div className="h-4 bg-gray-300 rounded mb-2"></div>
              <div className="h-4 bg-gray-300 rounded mb-4 w-3/4"></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="h-3 bg-gray-300 rounded"></div>
                <div className="h-3 bg-gray-300 rounded"></div>
                <div className="h-3 bg-gray-300 rounded"></div>
                <div className="h-3 bg-gray-300 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (antiques.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <p className="text-xl text-gray-500">No antiques found</p>
        <p className="text-gray-400 mt-2">Try adjusting your search terms</p>
      </div>
    );
  }

  return (
    <div className={layoutStyles.gridLarge}>
      {antiques.map((antique) => (
        <div key={antique.id} className="space-y-4">
          <AntiqueViewer antique={antique} />
        </div>
      ))}
    </div>
  );
};

export default AntiqueGrid;