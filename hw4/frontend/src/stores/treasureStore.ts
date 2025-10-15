import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TreasureStore, TreasureDTO, TreasureDetailDTO, TreasureQuery } from '@/types';
import { STORAGE_KEYS } from '@/utils/constants';

export const useTreasureStore = create<TreasureStore>()(
  persist(
    (set, get) => ({
      treasures: [],
      selectedTreasure: null,
      filters: {},

      setTreasures: (treasures: TreasureDTO[]) => {
        set({ treasures });
      },

      addTreasure: (treasure: TreasureDTO) => {
        set((state) => ({
          treasures: [treasure, ...state.treasures]
        }));
      },

      updateTreasure: (id: string, updates: Partial<TreasureDTO>) => {
        set((state) => ({
          treasures: state.treasures.map(treasure =>
            treasure.id === id ? { ...treasure, ...updates } : treasure
          ),
          selectedTreasure: state.selectedTreasure?.id === id
            ? { ...state.selectedTreasure, ...updates }
            : state.selectedTreasure
        }));
      },

      removeTreasure: (id: string) => {
        set((state) => ({
          treasures: state.treasures.filter(treasure => treasure.id !== id),
          selectedTreasure: state.selectedTreasure?.id === id ? null : state.selectedTreasure
        }));
      },

      setSelectedTreasure: (treasure: TreasureDetailDTO | null) => {
        set({ selectedTreasure: treasure });
      },

      setFilters: (filters: Partial<TreasureQuery>) => {
        set((state) => ({
          filters: { ...state.filters, ...filters }
        }));
      }
    }),
    {
      name: STORAGE_KEYS.FILTERS,
      partialize: (state) => ({
        filters: state.filters
      })
    }
  )
);