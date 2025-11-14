// src/app/api/atomic/checkout/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import { loadCompleteCheckoutData } from '@/lib/loaders/checkout-loader';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('⚡ Atomic checkout API called for:', id);
    const startTime = Date.now();

    // Get authenticated user
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // ✅ Load ALL checkout data atomically
    const atomicData = await loadCompleteCheckoutData(id, user.id);

    const totalTime = Date.now() - startTime;
    console.log(`⚡ Atomic checkout API completed in ${totalTime}ms`);

    return NextResponse.json(
      {
        ...atomicData,
        loadTime: totalTime,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
          'X-Load-Time': String(totalTime),
        },
      }
    );
  } catch (error) {
    console.error('❌ Atomic checkout API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to load checkout',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: error instanceof Error && error.message.includes('enrolled') ? 400 : 500 }
    );
  }
}