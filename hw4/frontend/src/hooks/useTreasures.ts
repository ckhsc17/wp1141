import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { treasureService } from '@/services/treasureService';

// 請求失敗重試配置
const MAX_RETRY_COUNT = 3;
const RETRY_DELAY = 1000; // 1秒
import {
  TreasureDTO,
  TreasureDetailDTO,
  CreateTreasureRequest,
  UpdateTreasureRequest,
  TreasureQuery,
  PaginatedResponse
} from '@/types';

export interface UseTreasuresResult {
  treasures: TreasureDTO[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  createTreasure: (data: CreateTreasureRequest) => Promise<TreasureDTO>;
  updateTreasure: (id: string, data: UpdateTreasureRequest) => Promise<TreasureDTO>;
  deleteTreasure: (id: string) => Promise<void>;
  likeTreasure: (id: string) => Promise<void>;
  favoriteTreasure: (id: string) => Promise<void>;
}

export const useTreasures = (query?: TreasureQuery): UseTreasuresResult => {
  const [treasures, setTreasures] = useState<TreasureDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);
  
  // 使用 ref 來防止重複請求
  const isRequestingRef = useRef(false);
  const retryCountRef = useRef(0);
  const lastRequestTimeRef = useRef(0);
  
  // 使用 useMemo 來穩定 query 物件，避免不必要的重新渲染
  const stableQuery = useMemo(() => query || {}, [
    query?.page,
    query?.limit,
    query?.type,
    query?.userId,
    query?.latitude,
    query?.longitude,
    query?.radius,
    query?.tags?.join(',') // 將陣列轉為字串來比較
  ]);

  const fetchTreasures = useCallback(async (reset = false, customPage?: number) => {
    const now = Date.now();
    
    // 防止重複請求
    if (isRequestingRef.current) {
      console.log('請求進行中，跳過重複請求');
      return;
    }
    
    // 防止短時間內重複請求（節流）
    if (now - lastRequestTimeRef.current < 500) {
      console.log('請求過於頻繁，跳過請求');
      return;
    }
    
    isRequestingRef.current = true;
    lastRequestTimeRef.current = now;
    setLoading(true);
    setError(null);

    try {
      const currentPage = customPage || (reset ? 1 : (pagination?.page || 1));
      console.log('發送寶藏請求:', { ...stableQuery, page: currentPage });
      
      const response: PaginatedResponse<TreasureDTO> = await treasureService.getTreasures({
        ...stableQuery,
        page: currentPage
      });

      if (reset) {
        setTreasures(response.data);
      } else {
        setTreasures(prev => [...prev, ...response.data]);
      }
      
      setPagination(response.pagination);
      retryCountRef.current = 0; // 成功後重置重試次數
      console.log('寶藏請求成功:', response.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '載入寶藏失敗';
      console.error('獲取寶藏失敗:', err);
      
      // 如果是網路錯誤且未超過重試次數，則進行重試
      if (retryCountRef.current < MAX_RETRY_COUNT && 
          (errorMessage.includes('網路') || errorMessage.includes('timeout') || errorMessage.includes('fetch'))) {
        retryCountRef.current++;
        console.log(`第 ${retryCountRef.current} 次重試，${RETRY_DELAY}ms 後重試`);
        
        setTimeout(() => {
          isRequestingRef.current = false;
          fetchTreasures(reset, customPage);
        }, RETRY_DELAY);
        return;
      }
      
      setError(errorMessage);
      retryCountRef.current = 0; // 重置重試次數
    } finally {
      setLoading(false);
      isRequestingRef.current = false;
    }
  }, [stableQuery, pagination?.page]);

  const refetch = useCallback(() => fetchTreasures(true), [fetchTreasures]);

  const loadMore = useCallback(async () => {
    if (!pagination || pagination.page >= pagination.totalPages || loading) return;
    
    const nextPage = pagination.page + 1;
    await fetchTreasures(false, nextPage);
  }, [pagination, loading, fetchTreasures]);

  const createTreasure = useCallback(async (data: CreateTreasureRequest): Promise<TreasureDTO> => {
    try {
      const newTreasure = await treasureService.createTreasure(data);
      setTreasures(prev => [newTreasure, ...prev]);
      return newTreasure;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '創建寶藏失敗';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const updateTreasure = useCallback(async (id: string, data: UpdateTreasureRequest): Promise<TreasureDTO> => {
    try {
      const updatedTreasure = await treasureService.updateTreasure(id, data);
      setTreasures(prev => prev.map(treasure => 
        treasure.id === id ? updatedTreasure : treasure
      ));
      return updatedTreasure;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新寶藏失敗';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const deleteTreasure = useCallback(async (id: string): Promise<void> => {
    try {
      await treasureService.deleteTreasure(id);
      setTreasures(prev => prev.filter(treasure => treasure.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '刪除寶藏失敗';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const likeTreasure = useCallback(async (id: string): Promise<void> => {
    try {
      const result = await treasureService.toggleLike(id);
      setTreasures(prev => prev.map(treasure => 
        treasure.id === id 
          ? { 
              ...treasure, 
              isLiked: result.isLiked, 
              likesCount: result.likesCount 
            }
          : treasure
      ));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '按讚失敗';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const favoriteTreasure = useCallback(async (id: string): Promise<void> => {
    try {
      const result = await treasureService.toggleFavorite(id);
      setTreasures(prev => prev.map(treasure => 
        treasure.id === id 
          ? { ...treasure, isFavorited: result.isFavorited }
          : treasure
      ));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '收藏失敗';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // 初始載入 - 使用 stableQuery 來避免不必要的重新呼叫
  useEffect(() => {
    console.log('useTreasures useEffect 觸發:', stableQuery);
    refetch();
  }, [stableQuery]);

  return {
    treasures,
    loading,
    error,
    pagination,
    refetch,
    loadMore,
    createTreasure,
    updateTreasure,
    deleteTreasure,
    likeTreasure,
    favoriteTreasure
  };
};

export interface UseTreasureDetailResult {
  treasure: TreasureDetailDTO | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  likeTreasure: () => Promise<void>;
  favoriteTreasure: () => Promise<void>;
}

export const useTreasureDetail = (id: string): UseTreasureDetailResult => {
  const [treasure, setTreasure] = useState<TreasureDetailDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTreasure = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const treasureData = await treasureService.getTreasure(id);
      setTreasure(treasureData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入寶藏失敗');
      console.error('獲取寶藏詳情失敗:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const refetch = useCallback(() => fetchTreasure(), [fetchTreasure]);

  const likeTreasure = useCallback(async () => {
    if (!treasure) return;

    try {
      const result = await treasureService.toggleLike(treasure.id);
      setTreasure(prev => prev ? {
        ...prev,
        isLiked: result.isLiked,
        likesCount: result.likesCount
      } : null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '按讚失敗';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [treasure]);

  const favoriteTreasure = useCallback(async () => {
    if (!treasure) return;

    try {
      const result = await treasureService.toggleFavorite(treasure.id);
      setTreasure(prev => prev ? {
        ...prev,
        isFavorited: result.isFavorited
      } : null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '收藏失敗';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [treasure]);

  // 初始載入
  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    treasure,
    loading,
    error,
    refetch,
    likeTreasure,
    favoriteTreasure
  };
};