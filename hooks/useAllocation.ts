import { useEffect, useState, useCallback } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { setAllocations, clearAllocations } from '@/store/slices/allocationsSlice';
import { resetStock, updateStock } from '@/store/slices/stockSlice';
import { resetCredit, updateCreditUsed } from '@/store/slices/customersSlice';
import { updateOrderAllocated } from '@/store/slices/ordersSlice';
import { runAutoAllocation } from '@/lib/allocation';
import { fetchOrders, fetchPrices, fetchStock, fetchCustomers } from '@/lib/mockApi';

export function useAllocation() {
  const dispatch = useAppDispatch();

  const [isReady, setIsReady] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  // Load data and run allocation
  useEffect(() => {
    const loadDataAndAllocate = async () => {
      setIsRunning(true);
      setProgress(0);

      try {
        // Load all data
        setProgress(10);
        const [orders, prices, stock, customers] = await Promise.all([
          fetchOrders(),
          fetchPrices(),
          fetchStock(),
          fetchCustomers(),
        ]);

        setProgress(50);

        // Run allocation (synchronous but fast for 5000 records)
        const result = runAutoAllocation({ orders, stock, customers, prices });

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

        setProgress(100);
        setIsReady(true);
      } catch (error) {
        console.error('Failed to load data or run allocation:', error);
      } finally {
        setIsRunning(false);
      }
    };

    loadDataAndAllocate();
  }, [dispatch]);

  const reset = useCallback(() => {
    dispatch(clearAllocations());
    dispatch(resetStock());
    dispatch(resetCredit());
  }, [dispatch]);

  const runAuto = useCallback(() => {
    // Reload page to re-run allocation
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
