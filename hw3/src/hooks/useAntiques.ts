'use client';

import { useState, useEffect } from 'react';
import { AntiqueItem } from '@/types';

export const useAntiques = () => {
  const [antiques, setAntiques] = useState<AntiqueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAntiques = async () => {
      try {
        const response = await fetch('/antique_items.csv');
        const csvText = await response.text();
        
        const lines = csvText.split('\n');
        const headers = lines[0].split(',');
        
        const data: AntiqueItem[] = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          if (line.trim()) {
            // Handle CSV parsing with potential commas in quoted fields
            const values = parseCSVLine(line);
            if (values.length >= headers.length) {
              const item: AntiqueItem = {
                id: parseInt(values[0]),
                name: values[1],
                price: parseInt(values[2]),
                description: values[3],
                collected_at: values[4],
                origin: values[5],
                era: values[6],
                material: values[7],
                size: values[8],
                history: values[9],
                iframe: values[10] || '',
              };
              data.push(item);
            }
          }
        }
        
        setAntiques(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load antiques data');
        setLoading(false);
      }
    };

    fetchAntiques();
  }, []);

  return { antiques, loading, error };
};

// Helper function to parse CSV line with proper handling of quoted fields
const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
};