import { NextResponse } from 'next/server';
import { prices } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(prices);
}
