import { StockCell } from '@/types';

const WAREHOUSE_WILDCARD = 'WH-000';
const SUPPLIER_WILDCARD = 'SP-000';

export interface SourceCandidate {
  warehouse_id: string;
  supplier_id: string;
  available: number;
}

/**
 * Build stock lookup map: key = "wh|sp|item" -> qty
 */
export function buildStockMap(stock: StockCell[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const cell of stock) {
    const key = `${cell.warehouse_id}|${cell.supplier_id}|${cell.item_id}`;
    map[key] = cell.remaining_qty;
  }
  return map;
}

/**
 * Resolve wildcard sources to ranked candidates
 * For WH-000 or SP-000, return all matching sources ranked by:
 * 1. Highest remaining stock
 * 2. Lowest unit price (tiebreak)
 * 3. Alphabetical supplier_id (final tiebreak)
 */
export function resolveSource(
  itemId: string,
  warehouseId: string,
  supplierId: string,
  stockMap: Record<string, number>,
  unitPrices?: Record<string, number>
): SourceCandidate[] {
  const candidates: SourceCandidate[] = [];

  const isWarehouseWildcard = warehouseId === WAREHOUSE_WILDCARD;
  const isSupplierWildcard = supplierId === SUPPLIER_WILDCARD;

  // If no wildcards, return single source
  if (!isWarehouseWildcard && !isSupplierWildcard) {
    const key = `${warehouseId}|${supplierId}|${itemId}`;
    return [{ warehouse_id: warehouseId, supplier_id: supplierId, available: stockMap[key] || 0 }];
  }

  // Gather all combinations that match wildcards
  const warehouses = isWarehouseWildcard ? getWarehouses(stockMap, itemId) : [warehouseId];
  const suppliers = isSupplierWildcard ? getSuppliers(stockMap, itemId) : [supplierId];

  for (const wh of warehouses) {
    for (const sp of suppliers) {
      const key = `${wh}|${sp}|${itemId}`;
      const available = stockMap[key] || 0;
      if (available > 0) {
        candidates.push({ warehouse_id: wh, supplier_id: sp, available });
      }
    }
  }

  // Sort by availability desc, then unit price asc, then supplier_id asc
  candidates.sort((a, b) => {
    if (a.available !== b.available) return b.available - a.available;

    if (unitPrices) {
      const priceA = unitPrices[`${itemId}|${a.supplier_id}`] ?? Infinity;
      const priceB = unitPrices[`${itemId}|${b.supplier_id}`] ?? Infinity;
      if (priceA !== priceB) return priceA - priceB;
    }

    return a.supplier_id.localeCompare(b.supplier_id);
  });

  return candidates;
}

function getWarehouses(stockMap: Record<string, number>, itemId: string): string[] {
  const warehouses = new Set<string>();
  for (const key of Object.keys(stockMap)) {
    const [, , item] = key.split('|');
    if (item === itemId) {
      const [wh] = key.split('|');
      if (wh !== WAREHOUSE_WILDCARD) warehouses.add(wh);
    }
  }
  return Array.from(warehouses);
}

function getSuppliers(stockMap: Record<string, number>, itemId: string): string[] {
  const suppliers = new Set<string>();
  for (const key of Object.keys(stockMap)) {
    const [, , item] = key.split('|');
    if (item === itemId) {
      const [, sp] = key.split('|');
      if (sp !== SUPPLIER_WILDCARD) suppliers.add(sp);
    }
  }
  return Array.from(suppliers);
}
