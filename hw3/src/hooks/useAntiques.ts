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
        
        const lines = csvText.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',');
        
        const data: AntiqueItem[] = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          
          // Use a more robust parsing method for complex CSV with HTML
          const matches = line.match(/^(\d+),([^,]+),(\d+),([^,]+),([^,]+),([^,]+),([^,]+),"([^"]+)",([^,]+),([^,]+),(.*)$/);
          
          if (matches && matches.length >= 12) {
            const item: AntiqueItem = {
              id: parseInt(matches[1]),
              name: matches[2],
              price: parseInt(matches[3]),
              description: matches[4],
              collected_at: matches[5],
              origin: matches[6],
              era: matches[7],
              material: matches[8], // This was in quotes in CSV
              size: matches[9],
              history: matches[10],
              iframe: matches[11] || '',
            };
            data.push(item);
          } else {
            // Fallback to simple split for lines that don't match the expected pattern
            const values = line.split(',');
            if (values.length >= 11) {
              // Find where iframe content starts (everything after the 10th comma)
              const firstTenFields = values.slice(0, 10);
              const iframeContent = values.slice(10).join(',');
              
              const item: AntiqueItem = {
                id: parseInt(firstTenFields[0]),
                name: firstTenFields[1],
                price: parseInt(firstTenFields[2]),
                description: firstTenFields[3],
                collected_at: firstTenFields[4],
                origin: firstTenFields[5],
                era: firstTenFields[6],
                material: firstTenFields[7].replace(/^"(.*)"$/, '$1'), // Remove quotes
                size: firstTenFields[8],
                history: firstTenFields[9],
                iframe: iframeContent || '',
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

// Helper function to parse CSV line with proper handling of quoted fields and complex HTML
const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    
    if (char === '"' && (i === 0 || line[i - 1] === ',')) {
      // Start of quoted field
      inQuotes = true;
      i++;
      continue;
    } else if (char === '"' && inQuotes && (i === line.length - 1 || line[i + 1] === ',')) {
      // End of quoted field
      inQuotes = false;
      i++;
      continue;
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current.trim());
      current = '';
      i++;
      continue;
    } else {
      current += char;
      i++;
    }
  }
  
  result.push(current.trim());
  return result;
};