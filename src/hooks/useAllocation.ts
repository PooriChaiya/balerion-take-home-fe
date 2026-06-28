import { useEffect, useState, useCallback } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { setAllocations, clearAllocations } from '@/store/slices/allocationsSlice';
import { resetStock, updateStock, loadStock } from '@/store/slices/stockSlice';
import { resetCredit, updateCreditUsed, loadCustomers } from '@/store/slices/customersSlice';
import { updateOrderAllocated, loadOrders } from '@/store/slices/ordersSlice';
import { loadPrices } from '@/store/slices/pricesSlice';
import { runAutoAllocation } from '@/lib/allocation';
import { fetchOrders, fetchPrices, fetchStock, fetchCustomers } from '@/lib/mockApi';

export function useAllocation() {
  const dispatch = useAppDispatch();

  const [isReady, setIsReady] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  // Load data and run allocation on mount (client-side only)
  useEffect(() => {
    let isMounted = true;

    const loadDataAndAllocate = async () => {
      if (!isMounted) return;

      setIsRunning(true);
      setProgress(10);

      try {
        // Load all data directly
        setProgress(20);
        const [orders, prices, stock, customers] = await Promise.all([
          fetchOrders(),
          fetchPrices(),
          fetchStock(),
          fetchCustomers(),
        ]);

        if (!isMounted) return;
        setProgress(40);

        // Populate Redux with base data (thunks fetch internally)
        dispatch(loadOrders());
        dispatch(loadPrices());
        dispatch(loadStock());
        dispatch(loadCustomers());

        if (!isMounted) return;
        setProgress(50);

        // Run allocation
        const result = runAutoAllocation({ orders, stock, customers, prices });

        if (!isMounted) return;
        setProgress(80);

        // Update Redux state with results
        dispatch(setAllocations({ allocations: result.allocations }));

        // Update stock remaining
        for (const [key, remaining] of Object.entries(result.remainingStock)) {
          const [wh, sp, item] = key.split('|');
          const originalCell = stock.find(
            s => s.warehouse_id === wh && s.supplier_id === sp && s.item_id === item
          );
          if (originalCell) {
            const used = originalCell.remaining_qty - remaining;
            dispatch(updateStock({
              warehouseId: wh,
              supplierId: sp,
              itemId: item,
              qty: used,
            }));
          }
        }

        // Update credit used
        for (const [customerId, remaining] of Object.entries(result.remainingCredit)) {
          const customer = customers.find(c => c.customer_id === customerId);
          if (customer) {
            const used = customer.credit_limit - remaining;
            dispatch(updateCreditUsed({ customerId, amount: used }));
          }
        }

        // Update orders with allocated amounts
        const orderAllocations: Record<string, number> = {};
        for (const alloc of result.allocations) {
          orderAllocations[alloc.sub_order_id] = (orderAllocations[alloc.sub_order_id] || 0) + alloc.qty;
        }
        for (const [subOrderId, qty] of Object.entries(orderAllocations)) {
          dispatch(updateOrderAllocated({ subOrderId, allocatedQty: qty }));
        }

        if (!isMounted) return;

        setProgress(100);
        setIsReady(true);
        setIsRunning(false);
      } catch (error) {
        console.error('Failed to load data or run allocation:', error);
        if (isMounted) {
          setIsRunning(false);
        }
      }
    };

    loadDataAndAllocate();

    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array - run once on mount

  const reset = useCallback(() => {
    setIsReady(false);
    dispatch(clearAllocations());
    dispatch(resetStock());
    dispatch(resetCredit());
  }, [dispatch]);

  const runAuto = useCallback(() => {
    window.location.reload();
  }, []);

  return {
    isReady,
    isRunning,
    progress,
    runAuto,
    reset,
  };
}
