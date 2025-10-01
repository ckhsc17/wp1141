'use client';

import { useState, useMemo } from 'react';
import { AntiqueItem } from '@/types';

export const useSearch = (antiques: AntiqueItem[]) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'era'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const filteredAndSortedAntiques = useMemo(() => {
    let filtered = antiques.filter(antique =>
      antique.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      antique.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      antique.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      antique.era.toLowerCase().includes(searchTerm.toLowerCase()) ||
      antique.material.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'era':
          aValue = a.era;
          bValue = b.era;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

    return filtered;
  }, [antiques, searchTerm, sortBy, sortOrder]);

  return {
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    filteredAndSortedAntiques,
  };
};