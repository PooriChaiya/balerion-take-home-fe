import { NextRequest, NextResponse } from 'next/server';
import { Allocation } from '@/types';

export const dynamic = 'force-dynamic';

// In-memory storage for allocations (mock persistence)
let allocations: Allocation[] = [];

export async function GET() {
  return NextResponse.json(allocations);
}

export async function POST(request: NextRequest) {
  try {
    const allocation: Allocation = await request.json();

    // Validate required fields
    if (!allocation.sub_order_id || !allocation.qty) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Add allocation to storage
    allocations.push(allocation);

    return NextResponse.json({
      success: true,
      allocation,
      message: 'Allocation saved successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
