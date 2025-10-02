'use client';

import { useCallback } from 'react';
import { useCart } from '@/contexts/CartContext';
import { AntiqueItem } from '@/types';

export const useAntiqueActions = () => {
  const { dispatch } = useCart();
  
  const addToCart = useCallback((antique: AntiqueItem) => {
    dispatch({ type: 'ADD_ITEM', payload: antique });
  }, [dispatch]);
  
  const addToFavorites = useCallback((antique: AntiqueItem) => {
    try {
      const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      const updatedFavorites = [...new Set([...favorites, antique.id])];
      localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
    } catch (error) {
      console.error('Error adding to favorites:', error);
    }
  }, []);
  
  return { addToCart, addToFavorites };
};