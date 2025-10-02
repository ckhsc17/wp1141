'use client';

import { useMemo, useCallback } from 'react';
import { useCart } from '@/contexts/CartContext';
import { PurchaseItem } from '@/types';

export const useCartOperations = () => {
  const { state, dispatch } = useCart();
  
  // 計算邏輯抽離到 useMemo
  const totalPrice = useMemo(() => 
    state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  , [state.items]);
  
  const totalItems = useMemo(() => 
    state.items.reduce((sum, item) => sum + item.quantity, 0)
  , [state.items]);
  
  const selectedTotalPrice = useMemo(() => 
    (selectedIds: Set<number>) => 
      state.items
        .filter(item => selectedIds.has(item.id))
        .reduce((total, item) => total + (item.price * item.quantity), 0)
  , [state.items]);
  
  // 操作邏輯抽離到 useCallback
  const removeItem = useCallback((id: number) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
  }, [dispatch]);
  
  const updateQuantity = useCallback((id: number, quantity: number) => {
    if (quantity <= 0) {
      dispatch({ type: 'REMOVE_ITEM', payload: id });
    } else {
      dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
    }
  }, [dispatch]);
  
  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' });
  }, [dispatch]);
  
  const toggleCart = useCallback(() => {
    dispatch({ type: 'TOGGLE_CART' });
  }, [dispatch]);
  
  const openCart = useCallback(() => {
    dispatch({ type: 'OPEN_CART' });
  }, [dispatch]);
  
  const closeCart = useCallback(() => {
    dispatch({ type: 'CLOSE_CART' });
  }, [dispatch]);
  
  // 購買邏輯
  const purchaseItems = useCallback((selectedItems: Set<number>) => {
    if (selectedItems.size === 0) {
      throw new Error('Please select items to purchase.');
    }

    const purchaseItems: PurchaseItem[] = state.items
      .filter(item => selectedItems.has(item.id))
      .map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      }));

    const totalPrice = selectedTotalPrice(selectedItems);

    // Save to localStorage
    try {
      const existingPurchases = localStorage.getItem('antiquePurchases');
      const allPurchases = existingPurchases ? JSON.parse(existingPurchases) : [];
      
      const newPurchase = {
        id: Date.now(),
        date: new Date().toISOString(),
        items: purchaseItems,
        total: totalPrice,
      };

      allPurchases.push(newPurchase);
      localStorage.setItem('antiquePurchases', JSON.stringify(allPurchases));

      // Remove purchased items from cart
      selectedItems.forEach(id => {
        dispatch({ type: 'REMOVE_ITEM', payload: id });
      });

      return { success: true, total: totalPrice };
    } catch (error) {
      console.error('Error during purchase:', error);
      throw new Error('Purchase failed. Please try again.');
    }
  }, [state.items, selectedTotalPrice, dispatch]);
  
  return {
    // State
    items: state.items,
    isOpen: state.isOpen,
    totalPrice,
    totalItems,
    
    // Computed values
    selectedTotalPrice,
    
    // Actions
    removeItem,
    updateQuantity,
    clearCart,
    toggleCart,
    openCart,
    closeCart,
    purchaseItems
  };
};