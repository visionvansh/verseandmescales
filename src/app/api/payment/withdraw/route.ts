// src/app/api/earnings/withdraw/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const MIN_WITHDRAWAL = 10; // Minimum \$10

type DecodedToken = {
  userId: string;
};

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    const userId = decoded.userId;

    const { amount }: { amount: number } = await request.json();

    if (!amount || amount < MIN_WITHDRAWAL) {
      return NextResponse.json(
        { error: `Minimum withdrawal is $${MIN_WITHDRAWAL}` },
        { status: 400 }
      );
    }

    const earnings = await prisma.earnings.findUnique({
      where: { userId },
    });

    if (!earnings) {
      return NextResponse.json({ error: 'Earnings record not found' }, { status: 404 });
    }

    if (parseFloat(earnings.availableBalance.toString()) < amount) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    if (!earnings.stripeAccountId || earnings.stripeAccountStatus !== 'active') {
      return NextResponse.json(
        { error: 'Please connect your Stripe account first' },
        { status: 400 }
      );
    }

    // Create payout
    const payout = await stripe.payouts.create(
      {
        amount: Math.round(amount * 100),
        currency: 'usd',
        metadata: {
          userId,
        },
      },
      {
        stripeAccount: earnings.stripeAccountId,
      }
    );

    // Create withdrawal record
    const withdrawal = await prisma.withdrawal.create({
      data: {
        earningsId: earnings.id,
        amount,
        currency: 'USD',
        status: 'processing',
        stripePayoutId: payout.id,
        method: 'bank_account',
      },
    });

    // Update earnings balance
    await prisma.earnings.update({
      where: { id: earnings.id },
      data: {
        availableBalance: {
          decrement: amount,
        },
        withdrawnAmount: {
          increment: amount,
        },
      },
    });

    return NextResponse.json({
      success: true,
      withdrawal: {
        id: withdrawal.id,
        amount,
        status: 'processing',
      },
    });
  } catch (error: any) {
    console.error('Withdrawal error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process withdrawal' },
      { status: 500 }
    );
  }
}