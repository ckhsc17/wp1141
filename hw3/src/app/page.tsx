'use client';

import React from 'react';
import { useAntiques } from '@/hooks/useAntiques';
import { useSearch } from '@/hooks/useSearch';
import SearchBar from '@/components/SearchBar';
import AntiqueGrid from '@/components/AntiqueGrid';

export default function Home() {
  const { antiques, loading, error } = useAntiques();
  const {
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    filteredAndSortedAntiques,
  } = useSearch(antiques);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-xl text-gray-700">Error loading antiques</p>
          <p className="text-gray-500 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Discover Timeless Treasures
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explore our curated collection of authentic antiques, each with its own unique story and heritage.
            Browse through centuries of craftsmanship and add your favorites to your personal collection.
          </p>
        </div>

        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          sortOrder={sortOrder}
          onSortOrderChange={setSortOrder}
        />

        <div className="mb-6">
          <p className="text-gray-600">
            {loading ? 'Loading...' : `${filteredAndSortedAntiques.length} antique${filteredAndSortedAntiques.length !== 1 ? 's' : ''} found`}
          </p>
        </div>

        <AntiqueGrid antiques={filteredAndSortedAntiques} loading={loading} />
      </div>
    </div>
  );
}
