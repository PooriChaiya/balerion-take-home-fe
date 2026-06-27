import { SubOrder, Allocation } from '@/types';
import { bankersRound } from './bankersRound';
import { resolveSource, SourceCandidate } from './resolveSource';

export interface AllocationContext {
  stockMap: Record<string, number>;
  creditMap: Record<string, number>;
  priceMap: Record<string, number>;
}

/**
 * Allocate salmon to a single sub-order
 * Handles splitting across multiple sources if needed
 * Respects both stock limits and credit limits
 */
export function allocateOne(
  order: SubOrder,
  ctx: AllocationContext
): { allocations: Allocation[]; remainingQty: number; creditUsed: number } {
  const { stockMap, creditMap, priceMap } = ctx;

  // Get candidates (handles wildcards)
  const candidates = resolveSource(
    order.item_id,
    order.warehouse_id,
    order.supplier_id,
    stockMap
  );

  if (candidates.length === 0) {
    return { allocations: [], remainingQty: order.request_qty, creditUsed: 0 };
  }

  const remainingToAllocate = order.request_qty - (order.allocated_qty || 0);
  if (remainingToAllocate <= 0) {
    return { allocations: [], remainingQty: 0, creditUsed: 0 };
  }

  const allocations: Allocation[] = [];
  let allocated = 0;
  let creditUsed = 0;
  let remainingCredit = creditMap[order.customer_id] || 0;

  // Try each candidate in order
  for (const candidate of candidates) {
    if (allocated >= remainingToAllocate) break;

    const stockKey = `${candidate.warehouse_id}|${candidate.supplier_id}|${order.item_id}`;
    const availableStock = stockMap[stockKey] || 0;

    if (availableStock <= 0) continue;

    // Calculate unit price
    const unitPrice = priceMap[`${order.item_id}|${candidate.supplier_id}|${order.type}`] || 0;

    // Max we can allocate from this source: min(stock, credit allows, remaining need)
    const maxFromStock = availableStock;
    const maxFromCredit = unitPrice > 0 ? Math.floor(remainingCredit / unitPrice) : Infinity;
    const maxNeeded = remainingToAllocate - allocated;

    let canAllocate = Math.min(maxFromStock, maxFromCredit, maxNeeded);
    if (canAllocate <= 0) continue;

    // Banker's round to 2 decimals
    canAllocate = bankersRound(canAllocate, 2);

    // Update state
    stockMap[stockKey] = bankersRound(availableStock - canAllocate, 2);
    creditMap[order.customer_id] = bankersRound(remainingCredit - canAllocate * unitPrice, 2);

    const totalPrice = bankersRound(canAllocate * unitPrice, 2);

    allocations.push({
      sub_order_id: order.sub_order_id,
      warehouse_id: candidate.warehouse_id,
      supplier_id: candidate.supplier_id,
      item_id: order.item_id,
      qty: canAllocate,
      unit_price: unitPrice,
      total_price: totalPrice
    });

    allocated += canAllocate;
    creditUsed += totalPrice;
    remainingCredit -= totalPrice;
  }

  return {
    allocations,
    remainingQty: remainingToAllocate - allocated,
    creditUsed
  };
}
