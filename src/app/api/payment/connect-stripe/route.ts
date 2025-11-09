// src/app/api/earnings/connect-stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      console.error('❌ No auth token found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const userId = decoded.userId;

    console.log('✅ User authenticated:', userId);

    const user = await prisma.student.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        earnings: {
          select: {
            stripeAccountId: true,
            stripeAccountStatus: true,
          },
        },
      },
    });

    if (!user) {
      console.error('❌ User not found:', userId);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('✅ User found:', user.email);

    let accountId = user.earnings?.stripeAccountId;

    // Create Stripe Connect account if doesn't exist
    if (!accountId) {
      console.log('📝 Creating new Stripe Connect account...');
      
      try {
        const account = await stripe.accounts.create({
          type: 'express',
          country: 'US', // Change this based on your needs
          email: user.email,
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
          business_type: 'individual',
          metadata: {
            userId: user.id,
            email: user.email,
          },
        });

        accountId = account.id;
        console.log('✅ Stripe account created:', accountId);

        // Update or create earnings record
        await prisma.earnings.upsert({
          where: { userId },
          create: {
            userId,
            stripeAccountId: accountId,
            stripeAccountStatus: 'pending',
            totalEarned: 0,
            availableBalance: 0,
            pendingBalance: 0,
            withdrawnAmount: 0,
          },
          update: {
            stripeAccountId: accountId,
            stripeAccountStatus: 'pending',
          },
        });

        console.log('✅ Earnings record updated');
      } catch (stripeError: any) {
        console.error('❌ Stripe account creation failed:', stripeError);
        return NextResponse.json(
          { error: `Stripe error: ${stripeError.message}` },
          { status: 500 }
        );
      }
    } else {
      console.log('✅ Using existing Stripe account:', accountId);
    }

    // Create account link for onboarding
    console.log('📝 Creating account link...');
    
    try {
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/users/payment?refresh=true`,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/users/payment?success=true`,
        type: 'account_onboarding',
      });

      console.log('✅ Account link created:', accountLink.url);

      return NextResponse.json({ 
        url: accountLink.url,
        accountId,
      });
    } catch (linkError: any) {
      console.error('❌ Account link creation failed:', linkError);
      return NextResponse.json(
        { error: `Failed to create onboarding link: ${linkError.message}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('❌ Stripe Connect error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to create Stripe Connect link',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}