'use client';

import React, { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { PurchaseItem } from '@/types';

const Cart: React.FC = () => {
  const { state, dispatch } = useCart();
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  const totalPrice = state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  const selectedTotalPrice = state.items
    .filter(item => selectedItems.has(item.id))
    .reduce((total, item) => total + (item.price * item.quantity), 0);

  const handleQuantityChange = (id: number, quantity: number) => {
    if (quantity <= 0) {
      dispatch({ type: 'REMOVE_ITEM', payload: id });
      setSelectedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    } else {
      dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
    }
  };

  const handleRemoveItem = (id: number) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const handleSelectItem = (id: number, selected: boolean) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedItems(new Set(state.items.map(item => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handlePurchase = () => {
    if (selectedItems.size === 0) {
      alert('Please select items to purchase.');
      return;
    }

    const purchaseItems: PurchaseItem[] = state.items
      .filter(item => selectedItems.has(item.id))
      .map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      }));

    // Save to localStorage
    const existingPurchases = localStorage.getItem('antiquePurchases');
    const allPurchases = existingPurchases ? JSON.parse(existingPurchases) : [];
    
    const newPurchase = {
      id: Date.now(),
      date: new Date().toISOString(),
      items: purchaseItems,
      total: selectedTotalPrice,
    };

    allPurchases.push(newPurchase);
    localStorage.setItem('antiquePurchases', JSON.stringify(allPurchases));

    // Remove purchased items from cart
    selectedItems.forEach(id => {
      dispatch({ type: 'REMOVE_ITEM', payload: id });
    });

    setSelectedItems(new Set());
    alert(`Purchase successful! Total: $${selectedTotalPrice.toLocaleString()}`);
  };

  if (!state.isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
      <div className="bg-white w-full max-w-md h-full overflow-y-auto shadow-xl">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">My Shopping List</h2>
            <button
              onClick={() => dispatch({ type: 'CLOSE_CART' })}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {state.items.length === 0 ? (
          <div className="p-6 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <p className="text-gray-500">Your shopping list is empty</p>
          </div>
        ) : (
          <>
            <div className="p-6">
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  checked={selectedItems.size === state.items.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm font-medium">Select All</span>
              </div>

              <div className="space-y-4">
                {state.items.map((item) => (
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
                            <span className="w-8 text-center">{item.quantity}</span>
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

            <div className="border-t border-gray-200 p-6">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>Total Collection Value:</span>
                  <span>${totalPrice.toLocaleString()}</span>
                </div>
                {selectedItems.size > 0 && (
                  <div className="flex justify-between font-bold">
                    <span>Selected Items Total:</span>
                    <span>${selectedTotalPrice.toLocaleString()}</span>
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