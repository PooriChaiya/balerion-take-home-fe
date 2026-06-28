// Domain entity types

export interface SubOrder {
  order_id: string;
  sub_order_id: string;
  item_id: string;
  warehouse_id: string; // 'WH-000' = wildcard (any warehouse)
  supplier_id: string; // 'SP-000' = wildcard (any supplier)
  request_qty: number;
  type: 'EMERGENCY' | 'OVERDUE' | 'DAILY';
  create_date: string; // YYYY-MM-DD
  customer_id: string;
  remark: string;
  // Runtime fields (not in JSON)
  allocated_qty?: number;
  resolved_source?: { warehouse_id: string; supplier_id: string };
}

export interface PriceRule {
  item_id: string;
  supplier_id: string;
  price_tier: 'EMERGENCY' | 'OVERDUE' | 'DAILY';
  base_price: number;
  multiplier_pct: number; // 125, 100, 90
  unit_price: number; // base_price * (multiplier_pct / 100)
}

export interface StockCell {
  warehouse_id: string;
  supplier_id: string;
  item_id: string;
  remaining_qty: number;
}

export interface Customer {
  customer_id: string;
  name: string;
  credit_limit: number; // THB
  tier: 'STANDARD' | 'GOLD' | 'VIP';
  // Runtime field
  credit_used?: number;
}

export interface Allocation {
  sub_order_id: string;
  warehouse_id: string;
  supplier_id: string;
  item_id: string;
  qty: number;
  unit_price: number;
  total_price: number;
}

export type OrderType = 'EMERGENCY' | 'OVERDUE' | 'DAILY';
export type AllocationStatus = 'NONE' | 'PARTIAL' | 'FULL';
export type PriceTier = 'EMERGENCY' | 'OVERDUE' | 'DAILY';

// UI state types
export interface FilterState {
  search: string;
  typeFilter: OrderType | 'ALL';
  statusFilter: AllocationStatus | 'ALL';
  sourceFilter: 'ALL' | 'WILDCARD' | 'SPECIFIC';
}

export interface SortState {
  column: string;
  direction: 'asc' | 'desc';
}

export interface UIState extends FilterState {
  selectedIds: string[];
  sortBy: SortState;
}

// Redux slice state types
export interface OrdersState {
  data: SubOrder[];
}

export interface StockState {
  initial: StockCell[];
  remaining: Record<string, number>; // key: "wh|sp|item"
}

export interface CustomersState {
  data: Customer[];
  creditUsed: Record<string, number>;
}

export interface PricesState {
  data: PriceRule[];
  byKey: Record<string, PriceRule>; // "item|supplier|tier"
}

export interface AllocationsState {
  byId: Record<string, Allocation[]>; // sub_order_id -> allocations
}

export interface RootState {
  orders: OrdersState;
  stock: StockState;
  customers: CustomersState;
  prices: PricesState;
  allocations: AllocationsState;
  ui: UIState;
}

// Algorithm input/output
export interface AllocationContext {
  stockMap: Record<string, number>;
  creditMap: Record<string, number>;
  priceMap: Record<string, number>;
}

export interface AllocationResult {
  allocations: Allocation[];
  remainingStock: Record<string, number>;
  remainingCredit: Record<string, number>;
  unallocated: string[]; // sub_order_ids
}

export interface AutoAllocationInput {
  orders: SubOrder[];
  stock: StockCell[];
  customers: Customer[];
  prices: PriceRule[];
}
