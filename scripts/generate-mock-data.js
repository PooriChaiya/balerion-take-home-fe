// Generate mock data for salmon allocation
const fs = require('fs');
const path = require('path');

const ITEMS = Array.from({ length: 8 }, (_, i) => `Item-${i + 1}`);
const WAREHOUSES = ['WH-001', 'WH-002', 'WH-003', 'WH-004', 'WH-005'];
const SUPPLIERS = ['SP-001', 'SP-002', 'SP-003', 'SP-004', 'SP-005', 'SP-006'];
const WAREHOUSE_WILDCARD = 'WH-000';
const SUPPLIER_WILDCARD = 'SP-000';
const ORDER_TYPES = ['EMERGENCY', 'OVERDUE', 'DAILY'];
const CUSTOMER_TIERS = ['STANDARD', 'GOLD', 'VIP'];
const PRICE_MULTIPLIERS = { EMERGENCY: 125, OVERDUE: 100, DAILY: 90 };

// Generate customers
function generateCustomers() {
  const customers = [];
  for (let i = 1; i <= 200; i++) {
    const tier = CUSTOMER_TIERS[Math.floor(Math.random() * CUSTOMER_TIERS.length)];
    let creditLimit;
    switch (tier) {
      case 'VIP':
        creditLimit = 100000 + Math.floor(Math.random() * 100000); // 100k-200k
        break;
      case 'GOLD':
        creditLimit = 50000 + Math.floor(Math.random() * 50000); // 50k-100k
        break;
      default:
        creditLimit = 5000 + Math.floor(Math.random() * 45000); // 5k-50k
    }
    customers.push({
      customer_id: `CT-${String(i).padStart(4, '0')}`,
      name: `Customer ${i}`,
      credit_limit: creditLimit,
      tier
    });
  }
  return customers;
}

// Generate price rules
function generatePrices() {
  const prices = [];
  for (const item of ITEMS) {
    for (const supplier of SUPPLIERS) {
      for (const type of ORDER_TYPES) {
        const basePrice = 50 + Math.random() * 450; // 50-500 THB
        const multiplier_pct = PRICE_MULTIPLIERS[type];
        prices.push({
          item_id: item,
          supplier_id: supplier,
          price_tier: type,
          base_price: Math.round(basePrice * 100) / 100,
          multiplier_pct,
          unit_price: Math.round(basePrice * (multiplier_pct / 100) * 100) / 100
        });
      }
    }
  }
  return prices;
}

// Generate stock
function generateStock() {
  const stock = [];
  const totalDemand = 450000; // Approximate total demand

  for (const warehouse of WAREHOUSES) {
    for (const supplier of SUPPLIERS) {
      for (const item of ITEMS) {
        // Stock at ~91% of demand to force realistic allocations
        const baseQty = 800 + Math.floor(Math.random() * 400);
        stock.push({
          warehouse_id: warehouse,
          supplier_id: supplier,
          item_id: item,
          remaining_qty: baseQty
        });
      }
    }
  }
  return stock;
}

// Generate orders
function generateOrders() {
  const orders = [];
  let orderId = 1;

  for (let i = 0; i < 5000; i++) {
    const customer = `CT-${String(Math.floor(Math.random() * 200) + 1).padStart(4, '0')}`;
    const item = ITEMS[Math.floor(Math.random() * ITEMS.length)];
    const type = ORDER_TYPES[Math.random() < 0.1 ? 0 : Math.random() < 0.3 ? 1 : 2]; // 10% emergency, 20% overdue, 70% daily
    const requestQty = 10 + Math.floor(Math.random() * 190); // 10-200 units

    // Wildcard: ~8% for warehouse, ~8% for supplier
    const useWarehouseWildcard = Math.random() < 0.08;
    const useSupplierWildcard = Math.random() < 0.08;

    const warehouse = useWarehouseWildcard ? WAREHOUSE_WILDCARD : WAREHOUSES[Math.floor(Math.random() * WAREHOUSES.length)];
    const supplier = useSupplierWildcard ? SUPPLIER_WILDCARD : SUPPLIERS[Math.floor(Math.random() * SUPPLIERS.length)];

    // Generate date within last 90 days
    const daysAgo = Math.floor(Math.random() * 90);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    const create_date = date.toISOString().split('T')[0];

    const subOrderId = `ORDER-${String(orderId).padStart(4, '0')}-${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`;

    orders.push({
      order_id: `ORDER-${String(orderId).padStart(4, '0')}`,
      sub_order_id: subOrderId,
      item_id: item,
      warehouse_id: warehouse,
      supplier_id: supplier,
      request_qty: requestQty,
      type,
      create_date,
      customer_id: customer,
      remark: `${type.toLowerCase()} order`
    });

    if (Math.random() < 0.3) orderId++; // Some orders have multiple sub-orders
  }

  return orders;
}

// Create output directory
const outputDir = path.join(__dirname, '..', 'public', 'mock-data');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}


const customers = generateCustomers();
fs.writeFileSync(path.join(outputDir, 'customers.json'), JSON.stringify(customers, null, 2));

const prices = generatePrices();
fs.writeFileSync(path.join(outputDir, 'prices.json'), JSON.stringify(prices, null, 2));

const stock = generateStock();
fs.writeFileSync(path.join(outputDir, 'stock.json'), JSON.stringify(stock, null, 2));

const orders = generateOrders();
fs.writeFileSync(path.join(outputDir, 'orders.json'), JSON.stringify(orders, null, 2));

