import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loadStock } from '@/store/slices/stockSlice';

export function useStock() {
  const dispatch = useAppDispatch();
  const { initial, remaining, status, error } = useAppSelector(state => state.stock);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(loadStock());
    }
  }, [status, dispatch]);

  return {
    stock: initial,
    remaining,
    isLoading: status === 'loading',
    isReady: status === 'ready',
    error,
  };
}
