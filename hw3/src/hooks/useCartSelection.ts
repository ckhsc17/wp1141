'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';

export const useCartSelection = (totalItems: number, validItemIds?: number[]) => {
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  
  // 當 validItemIds 變化時，清理無效的選擇
  useEffect(() => {
    if (validItemIds && validItemIds.length > 0) {
      setSelectedItems(prev => {
        const validIds = new Set(validItemIds);
        const cleanedSelection = new Set<number>();
        
        prev.forEach(id => {
          if (validIds.has(id)) {
            cleanedSelection.add(id);
          }
        });
        
        return cleanedSelection;
      });
    }
  }, [validItemIds]);
  
  const selectItem = useCallback((id: number, selected: boolean) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  }, []);
  
  const selectAll = useCallback((selected: boolean, allItemIds: number[]) => {
    if (selected) {
      setSelectedItems(new Set(allItemIds));
    } else {
      setSelectedItems(new Set());
    }
  }, []);
  
  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
  }, []);
  
  const isAllSelected = useMemo(() => 
    selectedItems.size > 0 && selectedItems.size === totalItems
  , [selectedItems.size, totalItems]);
  
  // Remove selected item when it's deleted from cart
  const removeFromSelection = useCallback((id: number) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  }, []);
  
  return {
    selectedItems,
    selectItem,
    selectAll,
    clearSelection,
    removeFromSelection,
    isAllSelected
  };
};