import { SubOrder, StockCell, Customer, PriceRule, Allocation, AllocationResult } from '@/types';
import { sortSubOrders } from './sortSubOrders';
import { buildStockMap } from './resolveSource';
import { buildPriceMap } from './getUnitPrice';
import { allocateOne } from './allocateOne';

/**
 * Main auto-allocation orchestrator
 * Processes orders by priority, allocating stock while respecting credit limits
 */
export function runAutoAllocation(input: {
  orders: SubOrder[];
  stock: StockCell[];
  customers: Customer[];
  prices: PriceRule[];
}): AllocationResult {
  const { orders, stock, customers, prices } = input;

  // Build lookup maps
  const stockMap = buildStockMap(stock);
  const priceMap = buildPriceMap(prices);

  // Initialize credit map from customers
  const creditMap: Record<string, number> = {};
  for (const customer of customers) {
    creditMap[customer.customer_id] = customer.credit_limit;
  }

  // Sort orders by priority (emergency > overdue > daily) then FIFO
  const sortedOrders = sortSubOrders(orders);

  const allAllocations: Allocation[] = [];
  const unallocated: string[] = [];

  // Process each order
  for (const order of sortedOrders) {
    const ctx = {
      stockMap,
      creditMap,
      priceMap
    };

    const result = allocateOne(order, ctx);

    if (result.allocations.length > 0) {
      allAllocations.push(...result.allocations);
    }

    if (result.remainingQty > 0) {
      unallocated.push(order.sub_order_id);
    }
  }

  return {
    allocations: allAllocations,
    remainingStock: stockMap,
    remainingCredit: creditMap,
    unallocated
  };
}
