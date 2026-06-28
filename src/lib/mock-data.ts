// Mock data generator for salmon allocation system
// This file is for generating mock data JSON files - not used at runtime
// Types are defined inline since they differ from runtime types
// import { Order, Price, Customer, Inventory, OrderType, PriceTier } from './types';

// Local types for mock data generation (different structure than runtime types)
type OrderType = 'EMERGENCY' | 'OVER_DUE' | 'DAILY';
type PriceTier = 'EMERGENCY' | 'OVER_DUE' | 'DAILY';

interface Customer {
  id: string;
  name: string;
  creditLimit: number;
  creditUsed: number;
}

interface Price {
  itemId: string;
  supplierId: string;
  basePrice: number;
  tier: PriceTier;
  percentage: number;
}

interface Inventory {
  supplierId: string;
  warehouseId: string;
  itemId: string;
  available: number;
}

interface Order {
  order: string;
  subOrder: string;
  itemId: string;
  warehouseId: string;
  supplierId: string;
  request: number;
  allocated: number;
  type: OrderType;
  createDate: string;
  customerId: string;
  remark: string;
}

// Constants
const ORDER_COUNT = 5000;
const ITEM_COUNT = 50;
const CUSTOMER_COUNT = 100;
const SUPPLIER_COUNT = 5;
const WAREHOUSE_COUNT = 5;

// Helper: Banker's rounding
const bankersRound = (n: number, decimals = 2): number => {
  const multiplier = Math.pow(10, decimals);
  const rounded = Math.round(n * multiplier) / multiplier;
  return rounded;
};

// Helper: Random item from array
const randomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Helper: Random date within range
const randomDate = (start: Date, end: Date): string => {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().split('T')[0];
};

// Helper: Format date for display (MM/DD/YYYY)
const formatDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear().toString().slice(-2)}`;
};

// Generate Item IDs
const itemIds = Array.from({ length: ITEM_COUNT }, (_, i) => `Item-${i + 1}`);

// Generate Supplier IDs
const supplierIds = Array.from({ length: SUPPLIER_COUNT }, (_, i) => `SP-${String(i + 1).padStart(3, '0')}`);

// Generate Warehouse IDs
const warehouseIds = Array.from({ length: WAREHOUSE_COUNT }, (_, i) => `WH-${String(i + 1).padStart(3, '0')}`);

// Generate Customers
const customers: Customer[] = Array.from({ length: CUSTOMER_COUNT }, (_, i) => {
  const creditLimit = randomItem([10000, 25000, 50000, 100000, 250000]);
  return {
    id: `CT-${String(i + 1).padStart(4, '0')}`,
    name: `Customer ${i + 1}`,
    creditLimit,
    creditUsed: bankersRound(Math.random() * creditLimit * 0.6), // Start with 0-60% used
  };
});

// Generate Prices
const priceTiers: PriceTier[] = ['EMERGENCY', 'OVER_DUE', 'DAILY'];
const tierPercentages: Record<PriceTier, number> = {
  EMERGENCY: 125,
  OVER_DUE: 100,
  DAILY: 90,
};

const prices: Price[] = [];
itemIds.forEach(itemId => {
  supplierIds.forEach(supplierId => {
    const basePrice = bankersRound(Math.random() * 100 + 50, 2); // $50-150
    priceTiers.forEach(tier => {
      prices.push({
        itemId,
        supplierId,
        basePrice,
        tier,
        percentage: tierPercentages[tier],
      });
    });
  });
});

// Generate Inventory
const inventory: Inventory[] = [];
itemIds.forEach(itemId => {
  supplierIds.forEach(supplierId => {
    warehouseIds.forEach(warehouseId => {
      inventory.push({
        supplierId,
        warehouseId,
        itemId,
        available: Math.floor(Math.random() * 5000) + 1000, // 1000-6000 units
      });
    });
  });
});

// Helper: Calculate final price based on tier
const calculatePrice = (itemId: string, supplierId: string, tier: PriceTier): number => {
  const price = prices.find(
    p => p.itemId === itemId && p.supplierId === supplierId && p.tier === tier
  );
  if (!price) return 0;
  return bankersRound(price.basePrice * (price.percentage / 100));
};

// Generate Orders
const orderTypes: OrderType[] = ['EMERGENCY', 'OVER_DUE', 'DAILY'];
const startDate = new Date('2024-01-01');
const endDate = new Date('2025-12-31');

const orders: Order[] = Array.from({ length: ORDER_COUNT }, (_, i) => {
  const orderNum = Math.floor(i / 3) + 1; // ~3 sub-orders per order
  const subOrderNum = (i % 3) + 1;
  const order = `ORDER-${String(orderNum).padStart(4, '0')}`;
  const subOrder = `${order}-${String(subOrderNum).padStart(3, '0')}`;
  const customerId = randomItem(customers).id;
  const customer = customers.find(c => c.id === customerId)!;

  // Determine order type based on some logic (not purely random for realism)
  const orderTypeRoll = Math.random();
  let type: OrderType;
  if (orderTypeRoll < 0.15) {
    type = 'EMERGENCY';
  } else if (orderTypeRoll < 0.35) {
    type = 'OVER_DUE';
  } else {
    type = 'DAILY';
  }

  const itemId = randomItem(itemIds);
  const requestQty = Math.floor(Math.random() * 500) + 10; // 10-510 units

  // Check if WH-000/SP-000 should be used (any available)
  const useAnySource = Math.random() < 0.2;
  const warehouseId = useAnySource ? 'WH-000' : randomItem(warehouseIds);
  const supplierId = useAnySource ? 'SP-000' : randomItem(supplierIds);

  const createDate = randomDate(startDate, endDate);

  return {
    order,
    subOrder,
    itemId,
    warehouseId,
    supplierId,
    request: requestQty,
    allocated: 0, // Initially unallocated
    type,
    createDate: formatDate(createDate),
    customerId,
    remark: Math.random() < 0.3 ? randomItem(['VIP Customer', 'Rush Order', 'Special Request', '']) : '',
  };
});

// Export all mock data
export {
  customers,
  prices,
  inventory,
  orders,
  itemIds,
  supplierIds,
  warehouseIds,
  calculatePrice,
};

// Helper to get inventory by item
export const getInventoryByItem = (itemId: string): Inventory[] => {
  return inventory.filter(inv => inv.itemId === itemId);
};

// Helper to get price for order
export const getPriceForOrder = (order: Order): Price => {
  const price = prices.find(
    p => p.itemId === order.itemId && p.supplierId === order.supplierId && p.tier === order.type
  );
  // Fallback to any supplier if SP-000
  if (!price && order.supplierId === 'SP-000') {
    const fallback = prices.find(
      p => p.itemId === order.itemId && p.tier === order.type
    );
    if (fallback) return fallback;
  }
  return price || {
    itemId: order.itemId,
    supplierId: order.supplierId,
    basePrice: 100,
    tier: order.type,
    percentage: 100,
  };
};

// Helper to get customer by ID
export const getCustomerById = (customerId: string): Customer | undefined => {
  return customers.find(c => c.id === customerId);
};
