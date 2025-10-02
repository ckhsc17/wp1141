'use client';

import React, { useMemo } from 'react';
import { useCartOperations } from '@/hooks/useCartOperations';
import { useCartSelection } from '@/hooks/useCartSelection';
import { buttonStyles, cartStyles, textStyles, layoutStyles } from '@/styles/components';

const Cart: React.FC = () => {
  const { 
    items, 
    isOpen, 
    totalPrice, 
    selectedTotalPrice, 
    removeItem, 
    updateQuantity, 
    closeCart, 
    purchaseItems 
  } = useCartOperations();

  const allItemIds = useMemo(() => items.map(item => item.id), [items]);
  
  const {
    selectedItems,
    selectItem,
    selectAll,
    clearSelection,
    removeFromSelection,
    isAllSelected
  } = useCartSelection(items.length);

  const handleQuantityChange = (id: number, quantity: number) => {
    updateQuantity(id, quantity);
    if (quantity <= 0) {
      removeFromSelection(id);
    }
  };

  const handleRemoveItem = (id: number) => {
    removeItem(id);
    removeFromSelection(id);
  };

  const handleSelectItem = (id: number, selected: boolean) => {
    selectItem(id, selected);
  };

  const handleSelectAll = (selected: boolean) => {
    selectAll(selected, allItemIds);
  };

  const handlePurchase = () => {
    try {
      const result = purchaseItems(selectedItems);
      alert(`Purchase successful! Total: $${result.total.toLocaleString()}`);
      clearSelection();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Purchase failed');
    }
  };

  if (!isOpen) return null;

  return (
    <div className={cartStyles.overlay}>
      <div className={cartStyles.sidebar}>
        <div className={cartStyles.header}>
          <div className={layoutStyles.flexBetween}>
            <h2 className={textStyles.title}>My Shopping List</h2>
            <button
              onClick={closeCart}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className={cartStyles.contentCenter}>
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <p className={textStyles.value}>Your shopping list is empty</p>
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

              <div className="space-y-4">
                {items.map((item) => (
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
                        <p className="text-sm text-gray-500 mb-2">{item.origin} • {item.era}</p>
                        <p className="text-lg font-bold text-green-600">${item.price.toLocaleString()}</p>
                        
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              className="bg-gray-200 hover:bg-gray-300 text-gray-700 w-8 h-8 rounded-full flex items-center justify-center"
                            >
                              -
                            </button>
                            <span className="w-8 text-center text-gray-900">{item.quantity}</span>
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                              className="bg-gray-200 hover:bg-gray-300 text-gray-700 w-8 h-8 rounded-full flex items-center justify-center"
                            >
                              +
                            </button>
                          </div>
                          
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
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
                  <span>Total Value:</span>
                  <span>${totalPrice.toLocaleString()}</span>
                </div>
                {selectedItems.size > 0 && (
                  <div className="flex justify-between font-bold text-gray-900">
                    <span>Selected Items Total:</span>
                    <span>${selectedTotalPrice(selectedItems).toLocaleString()}</span>
                  </div>
                )}
              </div>

              <button
                onClick={handlePurchase}
                disabled={selectedItems.size === 0}
                className={`w-full py-3 px-4 rounded-lg font-medium ${
                  selectedItems.size === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                Purchase Selected Items
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Cart;