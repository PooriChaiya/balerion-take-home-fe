import { describe, it, expect } from 'vitest';
import { bankersRound } from '@/lib/allocation/bankersRound';
import { sortSubOrders } from '@/lib/allocation/sortSubOrders';
import { getUnitPrice, buildPriceMap } from '@/lib/allocation/getUnitPrice';
import { resolveSource, buildStockMap } from '@/lib/allocation/resolveSource';
import { allocateOne } from '@/lib/allocation/allocateOne';
import { runAutoAllocation } from '@/lib/allocation/runAutoAllocation';
import { SubOrder, StockCell, Customer, PriceRule } from '@/types';

describe('bankersRound', () => {
  it('rounds half to even', () => {
    expect(bankersRound(0.125, 2)).toBe(0.12);
    expect(bankersRound(0.135, 2)).toBe(0.14);
    expect(bankersRound(0.145, 2)).toBe(0.14);
  });

  it('handles standard rounding', () => {
    expect(bankersRound(1.234, 2)).toBe(1.23);
    expect(bankersRound(1.235, 2)).toBe(1.24);
    expect(bankersRound(1.246, 2)).toBe(1.25);
  });

  it('handles edge cases', () => {
    expect(bankersRound(0, 2)).toBe(0);
    expect(bankersRound(-1.5, 0)).toBe(-2);
    expect(bankersRound(-2.5, 0)).toBe(-2);
  });
});

describe('sortSubOrders', () => {
  const orders: SubOrder[] = [
    {
      order_id: 'ORDER-0001',
      sub_order_id: 'ORDER-0001-001',
      item_id: 'Item-1',
      warehouse_id: 'WH-001',
      supplier_id: 'SP-001',
      request_qty: 100,
      type: 'DAILY',
      create_date: '2026-01-01',
      customer_id: 'CT-0001',
      remark: ''
    },
    {
      order_id: 'ORDER-0002',
      sub_order_id: 'ORDER-0002-001',
      item_id: 'Item-1',
      warehouse_id: 'WH-001',
      supplier_id: 'SP-001',
      request_qty: 100,
      type: 'EMERGENCY',
      create_date: '2026-01-03',
      customer_id: 'CT-0001',
      remark: ''
    },
    {
      order_id: 'ORDER-0003',
      sub_order_id: 'ORDER-0003-001',
      item_id: 'Item-1',
      warehouse_id: 'WH-001',
      supplier_id: 'SP-001',
      request_qty: 100,
      type: 'OVERDUE',
      create_date: '2026-01-02',
      customer_id: 'CT-0001',
      remark: ''
    },
  ];

  it('sorts by priority: emergency > overdue > daily', () => {
    const sorted = sortSubOrders(orders);
    expect(sorted[0].type).toBe('EMERGENCY');
    expect(sorted[1].type).toBe('OVERDUE');
    expect(sorted[2].type).toBe('DAILY');
  });

  it('sorts FIFO within same priority', () => {
    const samePriority: SubOrder[] = [
      { ...orders[0], type: 'EMERGENCY', create_date: '2026-01-02' },
      { ...orders[1], type: 'EMERGENCY', create_date: '2026-01-01' },
    ];
    const sorted = sortSubOrders(samePriority);
    expect(sorted[0].create_date).toBe('2026-01-01');
    expect(sorted[1].create_date).toBe('2026-01-02');
  });
});

describe('getUnitPrice', () => {
  const prices: PriceRule[] = [
    {
      item_id: 'Item-1',
      supplier_id: 'SP-001',
      price_tier: 'EMERGENCY',
      base_price: 100,
      multiplier_pct: 125,
      unit_price: 125
    },
    {
      item_id: 'Item-1',
      supplier_id: 'SP-001',
      price_tier: 'DAILY',
      base_price: 100,
      multiplier_pct: 90,
      unit_price: 90
    },
  ];

  it('returns correct unit price', () => {
    const map = buildPriceMap(prices);
    expect(getUnitPrice('Item-1', 'SP-001', 'EMERGENCY', map)).toBe(125);
    expect(getUnitPrice('Item-1', 'SP-001', 'DAILY', map)).toBe(90);
  });

  it('returns 0 for unknown combination', () => {
    const map = buildPriceMap(prices);
    expect(getUnitPrice('Item-2', 'SP-001', 'EMERGENCY', map)).toBe(0);
  });
});

describe('resolveSource', () => {
  const stock: StockCell[] = [
    { warehouse_id: 'WH-001', supplier_id: 'SP-001', item_id: 'Item-1', remaining_qty: 100 },
    { warehouse_id: 'WH-002', supplier_id: 'SP-001', item_id: 'Item-1', remaining_qty: 200 },
    { warehouse_id: 'WH-001', supplier_id: 'SP-002', item_id: 'Item-1', remaining_qty: 150 },
  ];

  it('returns specific source for non-wildcard', () => {
    const map = buildStockMap(stock);
    const candidates = resolveSource('Item-1', 'WH-001', 'SP-001', map);
    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toEqual({ warehouse_id: 'WH-001', supplier_id: 'SP-001', available: 100 });
  });

  it('returns all sources ranked by stock for wildcard', () => {
    const map = buildStockMap(stock);
    const candidates = resolveSource('Item-1', 'WH-000', 'SP-001', map);
    expect(candidates.length).toBeGreaterThan(1);
    expect(candidates[0].available).toBeGreaterThanOrEqual(candidates[1].available);
  });

  it('prioritizes higher stock', () => {
    const map = buildStockMap(stock);
    const candidates = resolveSource('Item-1', 'WH-000', 'SP-000', map);
    expect(candidates[0].available).toBe(200); // WH-002 has most
  });
});

describe('allocateOne', () => {
  const order: SubOrder = {
    order_id: 'ORDER-0001',
    sub_order_id: 'ORDER-0001-001',
    item_id: 'Item-1',
    warehouse_id: 'WH-001',
    supplier_id: 'SP-001',
    request_qty: 100,
    type: 'DAILY',
    create_date: '2026-01-01',
    customer_id: 'CT-0001',
    remark: ''
  };

  it('allocates full amount when stock and credit sufficient', () => {
    const stockMap = { 'WH-001|SP-001|Item-1': 100 };
    const creditMap = { 'CT-0001': 10000 };
    const priceMap = { 'Item-1|SP-001|DAILY': 100 };

    const result = allocateOne(order, { stockMap, creditMap, priceMap });

    expect(result.allocations).toHaveLength(1);
    expect(result.allocations[0].qty).toBe(100);
    expect(result.remainingQty).toBe(0);
  });

  it('handles stock cutoff with partial allocation', () => {
    const stockMap = { 'WH-001|SP-001|Item-1': 50 };
    const creditMap = { 'CT-0001': 10000 };
    const priceMap = { 'Item-1|SP-001|DAILY': 100 };

    const result = allocateOne(order, { stockMap, creditMap, priceMap });

    expect(result.allocations[0].qty).toBe(50);
    expect(result.remainingQty).toBe(50);
    expect(result.allocations[0].qty).toBe(50);
  });

  it('handles credit cutoff with partial allocation', () => {
    const stockMap = { 'WH-001|SP-001|Item-1': 200 };
    const creditMap = { 'CT-0001': 5000 }; // Only enough for 50 units at 100 each
    const priceMap = { 'Item-1|SP-001|DAILY': 100 };

    const result = allocateOne(order, { stockMap, creditMap, priceMap });

    expect(result.allocations[0].qty).toBe(50);
    expect(result.remainingQty).toBe(50);
  });

  it('splits across multiple sources when single source insufficient', () => {
    const stockMap = {
      'WH-001|SP-001|Item-1': 60,
      'WH-002|SP-001|Item-1': 40,
    };
    const creditMap = { 'CT-0001': 20000 };
    const priceMap = { 'Item-1|SP-001|DAILY': 100 };

    const wildcardOrder = { ...order, supplier_id: 'SP-000' };
    const result = allocateOne(wildcardOrder, { stockMap, creditMap, priceMap });

    expect(result.allocations).toHaveLength(2);
    expect(result.allocations[0].qty).toBe(60); // Highest stock first
    expect(result.allocations[1].qty).toBe(40);
    expect(result.remainingQty).toBe(0);
  });
});

describe('runAutoAllocation', () => {
  const orders: SubOrder[] = [
    {
      order_id: 'ORDER-0001',
      sub_order_id: 'ORDER-0001-001',
      item_id: 'Item-1',
      warehouse_id: 'WH-001',
      supplier_id: 'SP-001',
      request_qty: 100,
      type: 'EMERGENCY',
      create_date: '2026-01-01',
      customer_id: 'CT-0001',
      remark: ''
    },
    {
      order_id: 'ORDER-0002',
      sub_order_id: 'ORDER-0002-001',
      item_id: 'Item-1',
      warehouse_id: 'WH-001',
      supplier_id: 'SP-001',
      request_qty: 100,
      type: 'DAILY',
      create_date: '2026-01-01',
      customer_id: 'CT-0001',
      remark: ''
    },
  ];

  const stock: StockCell[] = [
    { warehouse_id: 'WH-001', supplier_id: 'SP-001', item_id: 'Item-1', remaining_qty: 150 },
  ];

  const customers: Customer[] = [
    { customer_id: 'CT-0001', name: 'Test Customer', credit_limit: 20000, tier: 'STANDARD' },
  ];

  const prices: PriceRule[] = [
    {
      item_id: 'Item-1',
      supplier_id: 'SP-001',
      price_tier: 'EMERGENCY',
      base_price: 100,
      multiplier_pct: 125,
      unit_price: 125
    },
    {
      item_id: 'Item-1',
      supplier_id: 'SP-001',
      price_tier: 'DAILY',
      base_price: 100,
      multiplier_pct: 90,
      unit_price: 90
    },
  ];

  it('allocates by priority', () => {
    const result = runAutoAllocation({ orders, stock, customers, prices });

    // Emergency gets full allocation first (100)
    // Daily gets remaining (50)
    expect(result.allocations).toHaveLength(2);
    expect(result.allocations[0].qty).toBe(100);
    expect(result.allocations[1].qty).toBe(50);
  });

  it('tracks unallocated orders', () => {
    const result = runAutoAllocation({ orders, stock, customers, prices });

    // Daily order is partially unallocated (needed 100, got 50)
    expect(result.unallocated).toContain('ORDER-0002-001');
  });
});
