import { SubOrder, OrderType } from '@/types';

// Priority order: EMERGENCY > OVERDUE > DAILY
const PRIORITY_ORDER: Record<OrderType, number> = {
  EMERGENCY: 0,
  OVERDUE: 1,
  DAILY: 2
};

/**
 * Sort orders by priority tier, then FIFO by create_date
 */
export function sortSubOrders(orders: SubOrder[]): SubOrder[] {
  return [...orders].sort((a, b) => {
    const priorityDiff = PRIORITY_ORDER[a.type] - PRIORITY_ORDER[b.type];
    if (priorityDiff !== 0) return priorityDiff;

    // Same priority: FIFO by date, then by order_id for tiebreak
    const dateDiff = a.create_date.localeCompare(b.create_date);
    if (dateDiff !== 0) return dateDiff;

    return a.order_id.localeCompare(b.order_id);
  });
}
