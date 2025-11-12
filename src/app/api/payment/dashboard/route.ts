// src/app/api/earnings/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const STRIPE_FEE_PERCENTAGE = 0.029; // 2.9% + \$0.30

// Type definitions
type DecodedToken = {
  userId: string;
};

type Transaction = {
  id: string;
  amount: any;
  platformFee: any;
  sellerAmount: any;
  status: string;
  paymentMethod: string | null;
  stripePaymentId: string;
  createdAt: Date;
  course: {
    title: string;
  };
  buyer: {
    name: string | null;
    username: string;
    email: string;
  };
};

type FormattedTransaction = {
  id: string;
  amount: number;
  platformFee: number;
  stripeFee: number;
  netAmount: number;
  sellerAmount: number;
  courseName: string;
  buyerName: string;
  buyerEmail: string;
  date: string;
  status: string;
  paymentMethod: string;
  stripePaymentId: string;
};

type MonthlyData = {
  month: string;
  sales: number;
  fees: number;
  net: number;
};

type CourseBreakdown = {
  courseName: string;
  sales: number;
  revenue: number;
};

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    const userId = decoded.userId;

    // Get or create earnings record
    let earnings = await prisma.earnings.findUnique({
      where: { userId },
      include: {
        withdrawals: {
          orderBy: { requestedAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!earnings) {
      earnings = await prisma.earnings.create({
        data: {
          userId,
          totalEarned: 0,
          availableBalance: 0,
          pendingBalance: 0,
          withdrawnAmount: 0,
        },
        include: {
          withdrawals: true,
        },
      });
    }

    // Get all transactions
    const allTransactions = await prisma.payment.findMany({
      where: {
        sellerId: userId,
      },
      include: {
        course: {
          select: {
            title: true,
          },
        },
        buyer: {
          select: {
            name: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    }) as Transaction[];

    // Calculate fees and net amounts
    const totalPlatformFees = allTransactions
      .filter((t: Transaction) => t.status === 'succeeded')
      .reduce((sum: number, t: Transaction) => sum + parseFloat(t.platformFee?.toString() || '0'), 0);

    const totalStripeFees = allTransactions
      .filter((t: Transaction) => t.status === 'succeeded')
      .reduce((sum: number, t: Transaction) => {
        const amount = parseFloat(t.amount.toString());
        return sum + (amount * STRIPE_FEE_PERCENTAGE + 0.30);
      }, 0);

    const totalEarned = parseFloat(earnings.totalEarned.toString());
    const netEarnings = totalEarned - totalPlatformFees - totalStripeFees;

    // Format transactions with detailed breakdown
    const recentTransactions: FormattedTransaction[] = allTransactions.map((tx: Transaction) => {
      const amount = parseFloat(tx.amount.toString());
      const platformFee = parseFloat(tx.platformFee?.toString() || '0');
      const stripeFee = amount * STRIPE_FEE_PERCENTAGE + 0.30;
      const netAmount = amount - platformFee - stripeFee;

      return {
        id: tx.id,
        amount,
        platformFee,
        stripeFee,
        netAmount,
        sellerAmount: parseFloat(tx.sellerAmount.toString()),
        courseName: tx.course.title,
        buyerName: tx.buyer.name || tx.buyer.username || 'Unknown',
        buyerEmail: tx.buyer.email,
        date: tx.createdAt.toISOString(),
        status: tx.status,
        paymentMethod: tx.paymentMethod || 'card',
        stripePaymentId: tx.stripePaymentId,
      };
    });

    // Calculate monthly data
    const monthlyData = calculateMonthlyData(allTransactions);

    // Calculate course breakdown
    const courseBreakdown = calculateCourseBreakdown(allTransactions);

    // Calculate metrics
    const succeededTransactions = allTransactions.filter((t: Transaction) => t.status === 'succeeded');
    const avgTransactionValue = succeededTransactions.length > 0
      ? succeededTransactions.reduce((sum: number, t: Transaction) => sum + parseFloat(t.amount.toString()), 0) / succeededTransactions.length
      : 0;

    return NextResponse.json({
      totalEarned,
      availableBalance: parseFloat(earnings.availableBalance.toString()),
      pendingBalance: parseFloat(earnings.pendingBalance.toString()),
      withdrawnAmount: parseFloat(earnings.withdrawnAmount.toString()),
      totalPlatformFees,
      totalStripeFees,
      netEarnings,
      stripeAccountId: earnings.stripeAccountId,
      stripeAccountStatus: earnings.stripeAccountStatus,
      transactionCount: succeededTransactions.length,
      avgTransactionValue,
      recentTransactions,
      withdrawals: earnings.withdrawals.map((w: any) => ({
        id: w.id,
        amount: parseFloat(w.amount.toString()),
        status: w.status,
        requestedAt: w.requestedAt.toISOString(),
        completedAt: w.completedAt?.toISOString(),
        stripePayoutId: w.stripePayoutId,
      })),
      monthlyData,
      courseBreakdown,
    });
  } catch (error: any) {
    console.error('Earnings dashboard error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch earnings' },
      { status: 500 }
    );
  }
}

function calculateMonthlyData(transactions: Transaction[]): MonthlyData[] {
  const monthlyMap = new Map<string, MonthlyData>();

  transactions
    .filter((t: Transaction) => t.status === 'succeeded')
    .forEach((tx: Transaction) => {
      const date = new Date(tx.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          month: monthKey,
          sales: 0,
          fees: 0,
          net: 0,
        });
      }

      const data = monthlyMap.get(monthKey)!;
      const amount = parseFloat(tx.amount.toString());
      const platformFee = parseFloat(tx.platformFee?.toString() || '0');
      const stripeFee = amount * STRIPE_FEE_PERCENTAGE + 0.30;

      data.sales += amount;
      data.fees += (platformFee + stripeFee);
      data.net += (amount - platformFee - stripeFee);
    });

  return Array.from(monthlyMap.values()).slice(-6); // Last 6 months
}

function calculateCourseBreakdown(transactions: Transaction[]): CourseBreakdown[] {
  const courseMap = new Map<string, CourseBreakdown>();

  transactions
    .filter((t: Transaction) => t.status === 'succeeded')
    .forEach((tx: Transaction) => {
      const courseName = tx.course.title;
      
      if (!courseMap.has(courseName)) {
        courseMap.set(courseName, {
          courseName,
          sales: 0,
          revenue: 0,
        });
      }

      const data = courseMap.get(courseName)!;
      data.sales += 1;
      data.revenue += parseFloat(tx.amount.toString());
    });

  return Array.from(courseMap.values())
    .sort((a: CourseBreakdown, b: CourseBreakdown) => b.revenue - a.revenue)
    .slice(0, 10); // Top 10 courses
}