// src/app/api/checkout/atomic/success/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import { loadCheckoutSuccessData } from '@/lib/loaders/checkout-success-loader';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    console.log('⚡ Atomic success API called');
    const startTime = Date.now();

    // Get authenticated user
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { paymentIntentId } = await request.json();

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment Intent ID is required' },
        { status: 400 }
      );
    }

    // ✅ Load ALL success data atomically
    const atomicData = await loadCheckoutSuccessData(paymentIntentId, user.id);

    const totalTime = Date.now() - startTime;
    console.log(`⚡ Atomic success API completed in ${totalTime}ms`);

    return NextResponse.json(
      {
        success: true,
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
    console.error('❌ Atomic success API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to verify payment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
} 