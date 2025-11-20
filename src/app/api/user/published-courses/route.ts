// src/app/api/published-courses/route.ts
import { NextResponse } from "next/server";
import { getAuthUser } from "@/utils/auth";
import prisma from "@/lib/prisma";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // === Authentication using your shared utils/auth.ts ===
    const user = await getAuthUser(req);

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = user.id;

    // === Fetch user's published courses with stats ===
    const courses = await prisma.course.findMany({
      where: {
        userId,
        status: "PUBLISHED",
        isPublished: true,
      },
      include: {
        _count: {
          select: {
            enrollments: true,
            modules: true,
          },
        },
        payments: {
          where: {
            status: "succeeded",
          },
          select: {
            id: true,
            amount: true,
            createdAt: true,
            buyer: {
              select: {
                id: true,
                username: true,
                name: true,
                img: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        publishedAt: "desc",
      },
    });

    // === Transform data for frontend ===
    const publishedCourses = courses.map((course) => {
      const totalRevenue = course.payments.reduce(
        (sum, payment) => sum + Number(payment.amount),
        0
      );

      const totalPurchases = course.payments.length;

      // Recent 10 buyers (for avatar scroll, etc.)
      const recentBuyers = course.payments.slice(0, 10).map((payment) => ({
        id: payment.buyer.id,
        username: payment.buyer.username ?? null,
        name: payment.buyer.name ?? null,
        img: payment.buyer.img ?? null,
        purchasedAt: payment.createdAt,
      }));

      return {
        id: course.id,
        title: course.title,
        thumbnail: course.thumbnail,
        averageRating: course.averageRating ?? 0,
        totalPurchases,
        totalRevenue: totalRevenue.toFixed(2),
        recentBuyers,
        totalModules: course._count.modules,
        totalEnrollments: course._count.enrollments,
        publishedAt: course.publishedAt,
        status: course.status,
      };
    });

    return NextResponse.json({
      success: true,
      courses: publishedCourses,
    });
  } catch (error) {
    console.error("Error fetching published courses:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}