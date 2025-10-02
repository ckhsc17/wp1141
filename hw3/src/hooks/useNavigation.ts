'use client';

import { useState, useCallback } from 'react';

export const useNavigation = () => {
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  
  const openGallery = useCallback(() => {
    setIsGalleryOpen(true);
  }, []);
  
  const closeGallery = useCallback(() => {
    setIsGalleryOpen(false);
  }, []);
  
  const toggleGallery = useCallback(() => {
    setIsGalleryOpen(prev => !prev);
  }, []);
  
  return {
    isGalleryOpen,
    openGallery,
    closeGallery,
    toggleGallery
  };
};