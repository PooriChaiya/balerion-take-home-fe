import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loadOrders } from '@/store/slices/ordersSlice';

export function useOrders() {
  const dispatch = useAppDispatch();
  const { data, status, error } = useAppSelector(state => state.orders);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(loadOrders());
    }
  }, [status, dispatch]);

  return {
    orders: data,
    isLoading: status === 'loading',
    isReady: status === 'ready',
    error,
  };
}
