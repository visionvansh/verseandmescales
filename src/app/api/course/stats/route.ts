//api/course/stats
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import prisma from '@/lib/prisma';

// Define types
type StatsUpdateData = {
  activeStudents?: number;
  courseRating?: number;
  monthlyIncome?: string;
  avgGrowth?: string;
};

/**
 * GET /api/course-stats
 * Fetch real-time course statistics
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get or create course stats
    let stats = await prisma.courseStats.findFirst({
      where: { userId: user.id }
    });

    if (!stats) {
      // Create default stats
      const homepage = await prisma.courseHomepage.findFirst({
        where: { userId: user.id }
      });

      if (homepage) {
        stats = await prisma.courseStats.create({
          data: {
            homepageId: homepage.id,
            userId: user.id,
            activeStudents: 0,
            courseRating: 0,
            monthlyIncome: '\$0',
            avgGrowth: '0'
          }
        });
      } else {
        return NextResponse.json({
          activeStudents: 0,
          courseRating: 0,
          monthlyIncome: '\$0',
          avgGrowth: '0'
        });
      }
    }

    return NextResponse.json({
      activeStudents: stats.activeStudents,
      courseRating: stats.courseRating,
      monthlyIncome: stats.monthlyIncome,
      avgGrowth: stats.avgGrowth,
      lastCalculated: stats.lastCalculated
    });

  } catch (error) {
    console.error('Error fetching course stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/course-stats
 * Update course statistics
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data: StatsUpdateData = await request.json();
    
    const homepage = await prisma.courseHomepage.findFirst({
      where: { userId: user.id }
    });

    if (!homepage) {
      return NextResponse.json(
        { error: 'Homepage not found' },
        { status: 404 }
      );
    }

    const stats = await prisma.courseStats.upsert({
      where: { homepageId: homepage.id },
      update: {
        activeStudents: data.activeStudents ?? 0,
        courseRating: data.courseRating ?? 0,
        monthlyIncome: data.monthlyIncome ?? '\$0',
        avgGrowth: data.avgGrowth ?? '0',
        lastCalculated: new Date()
      },
      create: {
        homepageId: homepage.id,
        userId: user.id,
        activeStudents: data.activeStudents ?? 0,
        courseRating: data.courseRating ?? 0,
        monthlyIncome: data.monthlyIncome ?? '\$0',
        avgGrowth: data.avgGrowth ?? '0'
      }
    });

    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Error updating course stats:', error);
    return NextResponse.json(
      { error: 'Failed to update stats' },
      { status: 500 }
    );
  }
}