import { PriceRule, PriceTier } from '@/types';

/**
 * Build a lookup map for O(1) price queries
 * Key: "item_id|supplier_id|price_tier"
 */
export function buildPriceMap(prices: PriceRule[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const price of prices) {
    const key = `${price.item_id}|${price.supplier_id}|${price.price_tier}`;
    map[key] = price.unit_price;
  }
  return map;
}

/**
 * Get unit price for an item/supplier/tier combination
 */
export function getUnitPrice(
  itemId: string,
  supplierId: string,
  tier: PriceTier,
  priceMap: Record<string, number>
): number {
  const key = `${itemId}|${supplierId}|${tier}`;
  return priceMap[key] || 0;
}
