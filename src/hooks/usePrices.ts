import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loadPrices } from '@/store/slices/pricesSlice';

export function usePrices() {
  const dispatch = useAppDispatch();
  const { data, byKey, status, error } = useAppSelector(state => state.prices);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(loadPrices());
    }
  }, [status, dispatch]);

  return {
    prices: data,
    priceByKey: byKey,
    isLoading: status === 'loading',
    isReady: status === 'ready',
    error,
  };
}
