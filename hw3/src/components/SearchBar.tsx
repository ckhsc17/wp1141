'use client';

import React from 'react';
import { cardStyles, inputStyles, textStyles } from '@/styles/components';

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  sortBy: 'name' | 'price' | 'era';
  onSortByChange: (sortBy: 'name' | 'price' | 'era') => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (order: 'asc' | 'desc') => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  searchTerm,
  onSearchChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
}) => {
  return (
    <div className={`${cardStyles.baseSimple} ${cardStyles.content} mb-8`}>
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search antiques by name, description, origin, era, or material..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className={inputStyles.search}
            />
          </div>
        </div>

        {/* Sort Controls */}
        <div className="flex gap-4">
          <div>
            <select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value as 'name' | 'price' | 'era')}
              className={inputStyles.base}
            >
              <option value="name">Name</option>
              <option value="price">Price</option>
              <option value="era">Era</option>
            </select>
          </div>

          <div>
            <select
              value={sortOrder}
              onChange={(e) => onSortOrderChange(e.target.value as 'asc' | 'desc')}
              className={inputStyles.base}
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;