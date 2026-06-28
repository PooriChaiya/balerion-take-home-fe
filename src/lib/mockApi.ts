import { SubOrder, PriceRule, StockCell, Customer } from '@/types';

// Simulated network delay (toggle with env var)
const DELAY = process.env.NEXT_PUBLIC_NO_MOCK_DELAY ? 0 : 100 + Math.random() * 200;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchJSON<T>(filename: string): Promise<T> {
  await delay(DELAY);
  const response = await fetch(`/mock-data/${filename}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${filename}: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchOrders(): Promise<SubOrder[]> {
  return fetchJSON<SubOrder[]>('orders.json');
}

export async function fetchPrices(): Promise<PriceRule[]> {
  return fetchJSON<PriceRule[]>('prices.json');
}

export async function fetchStock(): Promise<StockCell[]> {
  return fetchJSON<StockCell[]>('stock.json');
}

export async function fetchCustomers(): Promise<Customer[]> {
  return fetchJSON<Customer[]>('customers.json');
}
