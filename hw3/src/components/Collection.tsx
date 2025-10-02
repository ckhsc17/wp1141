'use client';

import React, { useMemo } from 'react';
import { useCollection } from '@/contexts/CollectionContext';
import { useCartSelection } from '@/hooks/useCartSelection';
import { buttonStyles, cartStyles, textStyles, layoutStyles } from '@/styles/components';

const Collection: React.FC = () => {
  const { 
    isOpen,
    purchasedItems,
    totalValue,
    closeCollection,
    sellItems 
  } = useCollection();

  const allItemIds = useMemo(() => purchasedItems.map(item => item.id), [purchasedItems]);
  
  const {
    selectedItems,
    selectItem,
    selectAll,
    clearSelection,
    removeFromSelection,
    isAllSelected
  } = useCartSelection(purchasedItems.length, allItemIds); // 傳遞有效的 ID 列表

  const selectedTotalValue = useMemo(() => 
    purchasedItems
      .filter(item => selectedItems.has(item.id))
      .reduce((sum, item) => sum + item.price, 0)
  , [purchasedItems, selectedItems]);

  const handleSelectItem = (id: number, selected: boolean) => {
    selectItem(id, selected);
  };

  const handleSelectAll = (selected: boolean) => {
    selectAll(selected, allItemIds);
  };

  const handleSell = () => {
    try {
      console.log('Selected items to sell:', selectedItems);
      console.log('Items being sold:', purchasedItems.filter(item => selectedItems.has(item.id)));
      
      const result = sellItems(selectedItems);
      console.log('Sell result:', result);
      
      alert(`Sell successful! Total earned: $${result.total.toLocaleString()}`);
      clearSelection();
    } catch (error) {
      console.error('Sell error:', error);
      alert(error instanceof Error ? error.message : 'Sell failed');
    }
  };

  if (!isOpen) return null;

  return (
    <div className={cartStyles.overlay}>
      <div className={cartStyles.sidebar}>
        <div className={cartStyles.header}>
          <div className={layoutStyles.flexBetween}>
            <h2 className={textStyles.title}>My Collection</h2>
            <button
              onClick={closeCollection}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {purchasedItems.length === 0 ? (
          <div className={cartStyles.contentCenter}>
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p className={textStyles.value}>Your collection is empty</p>
            <p className="text-sm text-gray-400 mt-2">Purchase some antiques to build your collection!</p>
          </div>
        ) : (
          <>
            <div className="p-6">
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-900">Select All</span>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {purchasedItems.map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                        className="mt-1"
                      />
                      
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{item.name}</h3>
                        <p className="text-sm text-gray-500 mb-2">
                          Purchased: {new Date(item.collected_at).toLocaleDateString()}
                        </p>
                        <p className="text-lg font-bold text-green-600">${item.price.toLocaleString()}</p>
                        
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Owned
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-400 p-6">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm text-gray-900">
                  <span>Total Collection Value:</span>
                  <span>${totalValue.toLocaleString()}</span>
                </div>
                {selectedItems.size > 0 && (
                  <div className="flex justify-between font-bold text-gray-900">
                    <span>Selected Items Value:</span>
                    <span>${selectedTotalValue.toLocaleString()}</span>
                  </div>
                )}
              </div>

              <button
                onClick={handleSell}
                disabled={selectedItems.size === 0}
                className={`w-full py-3 px-4 rounded-lg font-medium ${
                  selectedItems.size === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-orange-600 hover:bg-orange-700 text-white'
                }`}
              >
                Sell Selected Items
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Collection;