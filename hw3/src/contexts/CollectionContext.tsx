'use client';

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { PurchaseRecord, AntiqueItem } from '@/types';

interface CollectionState {
  isOpen: boolean;
  purchasedItems: AntiqueItem[];
  totalValue: number;
}

interface CollectionContextType extends CollectionState {
  openCollection: () => void;
  closeCollection: () => void;
  sellItems: (selectedItemIds: Set<number>) => { success: boolean; total: number };
  refreshCollection: () => void; // 新增：手動刷新收藏
}

const CollectionContext = createContext<CollectionContextType | null>(null);

export const CollectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // 用於觸發重新讀取

  // 監聽 localStorage 變化
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'antiquePurchases') {
        setRefreshTrigger(prev => prev + 1);
      }
    };

    // 監聽來自其他窗口的變化
    window.addEventListener('storage', handleStorageChange);
    
    // 監聽同一窗口內的變化（自定義事件）
    const handleCustomStorageChange = () => {
      setRefreshTrigger(prev => prev + 1);
    };
    
    window.addEventListener('antiquePurchasesUpdated', handleCustomStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('antiquePurchasesUpdated', handleCustomStorageChange);
    };
  }, []);

  // 獲取已購買的商品
  const purchasedItems = useMemo(() => {
    try {
      const purchases = localStorage.getItem('antiquePurchases');
      if (!purchases) return [];
      
      const purchaseRecords: PurchaseRecord[] = JSON.parse(purchases);
      const items: AntiqueItem[] = [];
      
      // 從購買記錄中提取商品
      purchaseRecords.forEach(record => {
        record.items.forEach(purchaseItem => {
          // 這裡需要重建完整的 AntiqueItem，因為 localStorage 只存了部分資訊
          const fullItem: AntiqueItem = {
            id: purchaseItem.id,
            name: purchaseItem.name,
            price: purchaseItem.price,
            description: '', // 可以從其他地方補充
            collected_at: record.date,
            origin: '',
            era: '',
            material: '',
            size: '',
            history: '',
            iframe: ''
          };
          
          // 根據數量添加多個項目
          for (let i = 0; i < purchaseItem.quantity; i++) {
            items.push({ 
              ...fullItem, 
              id: purchaseItem.id * 1000 + i, // 改用更簡單的 ID 生成邏輯
              originalId: purchaseItem.id // 保存原始 ID 用於 sell 時查找
            });
          }
        });
      });
      
      return items;
    } catch (error) {
      console.error('Error reading purchased items:', error);
      return [];
    }
  }, [refreshTrigger]); // 當 refreshTrigger 改變時重新讀取

  // 計算總價值
  const totalValue = useMemo(() => 
    purchasedItems.reduce((sum, item) => sum + item.price, 0)
  , [purchasedItems]);

  // 賣出選中的商品
  const sellItems = useCallback((selectedItemIds: Set<number>) => {
    if (selectedItemIds.size === 0) {
      throw new Error('Please select items to sell.');
    }

    try {
      const purchases = localStorage.getItem('antiquePurchases');
      if (!purchases) return { success: false, total: 0 };

      const purchaseRecords: PurchaseRecord[] = JSON.parse(purchases);
      let totalSellValue = 0;

      console.log('Before sell - purchaseRecords:', purchaseRecords);
      console.log('Selected item IDs:', Array.from(selectedItemIds));

      // 找到要賣出的商品並計算價值
      const itemsToSell = purchasedItems.filter(item => selectedItemIds.has(item.id));
      console.log('Items to sell:', itemsToSell);

      // 建立 originalId 到數量的映射
      const sellCounts = new Map<number, number>();
      itemsToSell.forEach(item => {
        if (item.originalId !== undefined) {
          const currentCount = sellCounts.get(item.originalId) || 0;
          sellCounts.set(item.originalId, currentCount + 1);
          totalSellValue += item.price;
        }
      });

      console.log('Sell counts by originalId:', sellCounts);
      console.log('Total sell value calculated:', totalSellValue);

      // 更新購買記錄，減少對應商品的數量
      const updatedRecords = purchaseRecords.map(record => {
        const updatedItems = record.items.map(item => {
          const sellCount = sellCounts.get(item.id) || 0;
          if (sellCount > 0) {
            return {
              ...item,
              quantity: Math.max(0, item.quantity - sellCount)
            };
          }
          return item;
        }).filter(item => item.quantity > 0);

        return {
          ...record,
          items: updatedItems,
          total: updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        };
      }).filter(record => record.items.length > 0);

      console.log('Updated records:', updatedRecords);

      localStorage.setItem('antiquePurchases', JSON.stringify(updatedRecords));

      // 觸發自定義事件通知其他組件
      window.dispatchEvent(new CustomEvent('antiquePurchasesUpdated'));

      // 觸發重新讀取數據
      setRefreshTrigger(prev => prev + 1);

      return { success: true, total: totalSellValue };
    } catch (error) {
      console.error('Error selling items:', error);
      throw new Error('Failed to sell items');
    }
  }, [purchasedItems]); // 添加 purchasedItems 作為依賴

  const openCollection = useCallback(() => setIsOpen(true), []);
  const closeCollection = useCallback(() => setIsOpen(false), []);
  const refreshCollection = useCallback(() => setRefreshTrigger(prev => prev + 1), []);

  const value: CollectionContextType = {
    isOpen,
    purchasedItems,
    totalValue,
    openCollection,
    closeCollection,
    sellItems,
    refreshCollection
  };

  return (
    <CollectionContext.Provider value={value}>
      {children}
    </CollectionContext.Provider>
  );
};

export const useCollection = () => {
  const context = useContext(CollectionContext);
  if (!context) {
    throw new Error('useCollection must be used within a CollectionProvider');
  }
  return context;
};