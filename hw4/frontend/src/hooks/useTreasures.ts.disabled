import { useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  UseTreasuresResult,
  TreasureDTO,
  CreateTreasureRequest,
  UpdateTreasureRequest,
  TreasureQuery 
} from '@/types';
import { treasureService } from '@/services/treasureService';
import { useTreasureStore } from '@/stores/treasureStore';
import { useAuthStore } from '@/stores/authStore';
import { notifications } from '@mantine/notifications';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/utils/constants';

export const useTreasures = (query?: TreasureQuery): UseTreasuresResult => {
  const queryClient = useQueryClient();
  const { setTreasures, addTreasure, updateTreasure, removeTreasure } = useTreasureStore();
  const { isAuthenticated } = useAuthStore();

  // 查詢寶藏列表
  const {
    data: treasuresData,
    isLoading: loading,
    error,
    refetch
  } = useQuery({
    queryKey: ['treasures', query],
    queryFn: () => treasureService.getTreasures(query),
    enabled: true,
    staleTime: 1000 * 60 * 5 // 5 分鐘快取
  });

  // 當資料更新時，同步到 store
  useEffect(() => {
    if (treasuresData?.data) {
      setTreasures(treasuresData.data);
    }
  }, [treasuresData, setTreasures]);

  // 創建寶藏
  const createTreasureMutation = useMutation({
    mutationFn: (data: CreateTreasureRequest) => treasureService.createTreasure(data),
    onSuccess: (newTreasure) => {
      addTreasure(newTreasure);
      queryClient.invalidateQueries({ queryKey: ['treasures'] });
      notifications.show({
        title: '成功',
        message: SUCCESS_MESSAGES.TREASURE_CREATED,
        color: 'green'
      });
    },
    onError: (error: any) => {
      notifications.show({
        title: '錯誤',
        message: error.message || ERROR_MESSAGES.SERVER_ERROR,
        color: 'red'
      });
    }
  });

  // 更新寶藏
  const updateTreasureMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTreasureRequest }) =>
      treasureService.updateTreasure(id, data),
    onSuccess: (updatedTreasure, variables) => {
      updateTreasure(variables.id, updatedTreasure);
      queryClient.invalidateQueries({ queryKey: ['treasures'] });
      queryClient.invalidateQueries({ queryKey: ['treasure', variables.id] });
      notifications.show({
        title: '成功',
        message: SUCCESS_MESSAGES.TREASURE_UPDATED,
        color: 'green'
      });
    },
    onError: (error: any) => {
      notifications.show({
        title: '錯誤',
        message: error.message || ERROR_MESSAGES.SERVER_ERROR,
        color: 'red'
      });
    }
  });

  // 刪除寶藏
  const deleteTreasureMutation = useMutation({
    mutationFn: (id: string) => treasureService.deleteTreasure(id),
    onSuccess: (_, id) => {
      removeTreasure(id);
      queryClient.invalidateQueries({ queryKey: ['treasures'] });
      notifications.show({
        title: '成功',
        message: SUCCESS_MESSAGES.TREASURE_DELETED,
        color: 'green'
      });
    },
    onError: (error: any) => {
      notifications.show({
        title: '錯誤',
        message: error.message || ERROR_MESSAGES.SERVER_ERROR,
        color: 'red'
      });
    }
  });

  // 按讚/取消按讚
  const likeTreasureMutation = useMutation({
    mutationFn: (id: string) => treasureService.toggleLike(id),
    onSuccess: (_, id) => {
      // 更新本地狀態
      const currentTreasures = treasuresData?.data || [];
      const treasure = currentTreasures.find((t: TreasureDTO) => t.id === id);
      if (treasure) {
        const newIsLiked = !treasure.isLiked;
        const newLikesCount = newIsLiked ? 
          treasure.likesCount + 1 : 
          treasure.likesCount - 1;
        
        updateTreasure(id, {
          isLiked: newIsLiked,
          likesCount: newLikesCount
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['treasure', id] });
      
      notifications.show({
        title: '成功',
        message: treasure?.isLiked ? SUCCESS_MESSAGES.UNLIKED : SUCCESS_MESSAGES.LIKED,
        color: 'green'
      });
    },
    onError: (error: any) => {
      notifications.show({
        title: '錯誤',
        message: error.message || ERROR_MESSAGES.SERVER_ERROR,
        color: 'red'
      });
    }
  });

  // 收藏/取消收藏
  const favoriteTreasureMutation = useMutation({
    mutationFn: (id: string) => treasureService.toggleFavorite(id),
    onSuccess: (_, id) => {
      // 更新本地狀態
      const currentTreasures = treasuresData?.data || [];
      const treasure = currentTreasures.find((t: TreasureDTO) => t.id === id);
      if (treasure) {
        updateTreasure(id, {
          isFavorited: !treasure.isFavorited
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['treasure', id] });
      
      notifications.show({
        title: '成功',
        message: treasure?.isFavorited ? SUCCESS_MESSAGES.UNFAVORITED : SUCCESS_MESSAGES.FAVORITED,
        color: 'green'
      });
    },
    onError: (error: any) => {
      notifications.show({
        title: '錯誤',
        message: error.message || ERROR_MESSAGES.SERVER_ERROR,
        color: 'red'
      });
    }
  });

  const createTreasure = useCallback(async (data: CreateTreasureRequest): Promise<TreasureDTO> => {
    if (!isAuthenticated) {
      throw new Error(ERROR_MESSAGES.LOGIN_REQUIRED);
    }
    return createTreasureMutation.mutateAsync(data);
  }, [createTreasureMutation, isAuthenticated]);

  const updateTreasureCallback = useCallback(async (id: string, data: UpdateTreasureRequest): Promise<TreasureDTO> => {
    if (!isAuthenticated) {
      throw new Error(ERROR_MESSAGES.LOGIN_REQUIRED);
    }
    return updateTreasureMutation.mutateAsync({ id, data });
  }, [updateTreasureMutation, isAuthenticated]);

  const deleteTreasure = useCallback(async (id: string): Promise<void> => {
    if (!isAuthenticated) {
      throw new Error(ERROR_MESSAGES.LOGIN_REQUIRED);
    }
    return deleteTreasureMutation.mutateAsync(id);
  }, [deleteTreasureMutation, isAuthenticated]);

  const likeTreasure = useCallback(async (id: string): Promise<void> => {
    if (!isAuthenticated) {
      throw new Error(ERROR_MESSAGES.LOGIN_REQUIRED);
    }
    return likeTreasureMutation.mutateAsync(id);
  }, [likeTreasureMutation, isAuthenticated]);

  const favoriteTreasure = useCallback(async (id: string): Promise<void> => {
    if (!isAuthenticated) {
      throw new Error(ERROR_MESSAGES.LOGIN_REQUIRED);
    }
    return favoriteTreasureMutation.mutateAsync(id);
  }, [favoriteTreasureMutation, isAuthenticated]);

  return {
    treasures: treasuresData?.data || [],
    loading,
    error: error?.message || null,
    refetch,
    createTreasure,
    updateTreasure: updateTreasureCallback,
    deleteTreasure,
    likeTreasure,
    favoriteTreasure
  };
};