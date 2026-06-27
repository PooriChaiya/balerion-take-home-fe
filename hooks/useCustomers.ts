import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loadCustomers } from '@/store/slices/customersSlice';

export function useCustomers() {
  const dispatch = useAppDispatch();
  const { data, creditUsed, status, error } = useAppSelector(state => state.customers);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(loadCustomers());
    }
  }, [status, dispatch]);

  return {
    customers: data,
    creditUsed,
    isLoading: status === 'loading',
    isReady: status === 'ready',
    error,
  };
}
