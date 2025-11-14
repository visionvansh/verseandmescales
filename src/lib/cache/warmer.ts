// src/lib/cache/warmer.ts
import prisma from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { courseCacheKeys, COURSE_CACHE_TIMES } from '@/lib/cache/course-cache';
import { loadCompleteCoursesData } from '@/lib/loaders/course-page-loader';
import { loadCompleteCourseDetail } from '@/lib/loaders/course-detail-loader';

interface CacheWarmingStats {
  coursesListWarmed: boolean;
  courseDetailsWarmed: number;
  userDataWarmed: number;
  navbarDataWarmed: number; // ✅ NEW
  totalTime: number;
  errors: string[];
}

class AutoCacheWarmer {
  private isWarming = false;
  private warmingInterval: NodeJS.Timeout | null = null;
  private lastWarmTime = 0;
  private stats: CacheWarmingStats = {
    coursesListWarmed: false,
    courseDetailsWarmed: 0,
    userDataWarmed: 0,
    navbarDataWarmed: 0, // ✅ NEW
    totalTime: 0,
    errors: [],
  };
  
  // ✅ Increase intervals to prevent overlapping
  private readonly MIN_WARM_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private readonly BACKGROUND_REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes
  private readonly MAX_CONCURRENT_QUERIES = 2; // ✅ Reduce concurrency
  private readonly BATCH_DELAY = 200; // ✅ Increase delay

  constructor() {
    // ✅ DON'T warm immediately on instantiation
    // Let the explicit call handle it
  }

  /**
   * ✅ Initialize - only start background warming, don't warm immediately
   */
  async initialize(): Promise<void> {
    if (this.warmingInterval) {
      console.log('⏭️ Background warming already active');
      return;
    }
    
    console.log('🚀 Initializing automatic cache warming system...');
    
    // Start background refresh loop (don't warm immediately)
    this.startBackgroundWarming();
    
    console.log('✅ Cache warming system initialized');
  }

  /**
   * ✅ MAIN: Warm ALL caches for all pages
   */
  async warmAllCaches(): Promise<CacheWarmingStats> {
    const now = Date.now();
    
    // ✅ Strict duplicate prevention
    if (this.isWarming) {
      console.log('⏭️ Cache warming already in progress, skipping');
      return this.stats;
    }

    // ✅ Rate limiting
    if (now - this.lastWarmTime < this.MIN_WARM_INTERVAL) {
      const waitTime = Math.round((this.MIN_WARM_INTERVAL - (now - this.lastWarmTime)) / 1000);
      console.log(`⏭️ Cache warmed recently, wait ${waitTime}s before next warm`);
      return this.stats;
    }

    // ✅ Distributed lock with shorter timeout
    const lockKey = 'cache:warming:lock';
    const lockValue = `${Date.now()}-${Math.random()}`;
    
    try {
      const lockAcquired = await redis.set(lockKey, lockValue, 'EX', 120, 'NX');
      
      if (!lockAcquired) {
        console.log('⏭️ Another instance is warming cache, skipping');
        return this.stats;
      }

      console.log('🔥 Starting comprehensive cache warming for all pages...');
      const startTime = Date.now();
      this.isWarming = true;
      this.lastWarmTime = now; // ✅ Set BEFORE warming

      // Reset stats
      this.stats = {
        coursesListWarmed: false,
        courseDetailsWarmed: 0,
        userDataWarmed: 0,
        navbarDataWarmed: 0, // ✅ NEW
        totalTime: 0,
        errors: [],
      };

      // ✅ Run sequentially with delays
      await this.warmSequentially();

      const duration = Date.now() - startTime;
      this.stats.totalTime = duration;
      
      console.log(`✅ Cache warming completed in ${duration}ms`);
      console.log(`📊 Stats:`, {
        coursesListWarmed: this.stats.coursesListWarmed,
        courseDetailsWarmed: this.stats.courseDetailsWarmed,
        userDataWarmed: this.stats.userDataWarmed,
        navbarDataWarmed: this.stats.navbarDataWarmed, // ✅ NEW
        errors: this.stats.errors.length,
      });
      
      return this.stats;
    } catch (error) {
      console.error('❌ Cache warming failed:', error);
      this.stats.errors.push(error instanceof Error ? error.message : 'Unknown error');
      
      return this.stats;
    } finally {
      this.isWarming = false;
      // Release lock
      await redis.del(lockKey).catch(() => {});
    }
  }

  /**
   * ✅ UPDATE: Run warming tasks sequentially (now with navbar warming)
   */
  private async warmSequentially(): Promise<void> {
    // Task 1: Courses list page (/courses)
    await this.warmCoursesListPage();
    await this.delay(this.BATCH_DELAY);
    
    // Task 2: Top course detail pages (/courses/[id])
    await this.warmCourseDetailPages();
    await this.delay(this.BATCH_DELAY);
    
    // Task 3: User avatars and enrollments (for all pages)
    await this.warmUserData();
    await this.delay(this.BATCH_DELAY);
    
    // Task 4: Common checkout data
    await this.warmCheckoutData();
    await this.delay(this.BATCH_DELAY);
    
    // ✅ Task 5: Navbar data
    await this.warmNavbarData();
  }

  /**
   * ✅ Warm all caches in parallel for maximum speed (OLD - DEPRECATED)
   */
  private async warmInParallel(): Promise<void> {
    const warmingTasks = [
      // Task 1: Courses list page (/courses)
      this.warmCoursesListPage(),
      
      // Task 2: Top course detail pages (/courses/[id])
      this.warmCourseDetailPages(),
      
      // Task 3: User avatars and enrollments (for all pages)
      this.warmUserData(),
      
      // Task 4: Common checkout data
      this.warmCheckoutData(),
      
      // ✅ Task 5: Navbar data
      this.warmNavbarData(),
    ];

    await Promise.allSettled(warmingTasks);
  }

  /**
   * ✅ PAGE 1: Warm /courses (courses list page)
   */
  private async warmCoursesListPage(): Promise<void> {
    try {
      console.log('  📚 [1/5] Warming /courses page...');
      const startTime = Date.now();

      // Warm for anonymous users
      const cacheKey = courseCacheKeys.publicCourses();
      const data = await loadCompleteCoursesData();
      
      await this.setCacheData(cacheKey, data, COURSE_CACHE_TIMES.PUBLIC_COURSES);
      
      const duration = Date.now() - startTime;
      this.stats.coursesListWarmed = true;
      
      console.log(`    ✓ /courses warmed in ${duration}ms (${data.courses.length} courses, ${data.users.size} users)`);
    } catch (error) {
      console.error('    ✗ Failed to warm /courses:', error);
      this.stats.errors.push(`courses-list: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  /**
   * ✅ PAGE 2: Warm /courses/[id] (top 15 course detail pages)
   */
  private async warmCourseDetailPages(): Promise<void> {
    try {
      console.log('  🏆 [2/5] Warming /courses/[id] pages...');
      const startTime = Date.now();

      // Get top 15 most popular courses (by enrollments + recent activity)
      const topCourses = await prisma.course.findMany({
        where: {
          status: 'PUBLISHED',
          isPublished: true,
        },
        select: {
          id: true,
          title: true,
          _count: {
            select: {
              enrollments: true,
            },
          },
        },
        orderBy: [
          {
            enrollments: {
              _count: 'desc',
            },
          },
          {
            updatedAt: 'desc',
          },
        ],
        take: 15,
      });

      console.log(`    ℹ️ Found ${topCourses.length} top courses to warm`);

      // ✅ Process in smaller batches with delays
      for (let i = 0; i < topCourses.length; i += this.MAX_CONCURRENT_QUERIES) {
        const batch = topCourses.slice(i, i + this.MAX_CONCURRENT_QUERIES);
        
        await Promise.allSettled(
          batch.map(async (course) => {
            try {
              const cacheKey = courseCacheKeys.courseDetail(course.id);
              const data = await loadCompleteCourseDetail(course.id);
              
              await this.setCacheData(cacheKey, data, COURSE_CACHE_TIMES.COURSE_DETAIL);
              
              this.stats.courseDetailsWarmed++;
              console.log(`    ✓ Warmed: ${course.title.substring(0, 40)}... (${course._count.enrollments} students)`);
            } catch (error) {
              console.error(`    ✗ Failed: ${course.title}:`, error);
              this.stats.errors.push(`course-detail-${course.id}: ${error instanceof Error ? error.message : 'Unknown'}`);
            }
          })
        );
        
        // ✅ Add delay between batches
        if (i + this.MAX_CONCURRENT_QUERIES < topCourses.length) {
          await this.delay(this.BATCH_DELAY);
        }
      }

      const duration = Date.now() - startTime;
      console.log(`    ✓ Course details warmed in ${duration}ms (${this.stats.courseDetailsWarmed}/${topCourses.length} successful)`);
    } catch (error) {
      console.error('    ✗ Failed to warm course details:', error);
      this.stats.errors.push(`course-details: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  /**
   * ✅ Warm user data (avatars, enrollments) for all pages
   */
  private async warmUserData(): Promise<void> {
    try {
      console.log('  👥 [3/5] Warming user data (avatars & enrollments)...');
      const startTime = Date.now();

      // Get users with recent activity (last 30 days)
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 30);

      const activeUsers = await prisma.student.findMany({
        where: {
          OR: [
            {
              lastLogin: {
                gte: recentDate,
              },
            },
            {
              enrollments: {
                some: {
                  lastAccessedAt: {
                    gte: recentDate,
                  },
                },
              },
            },
          ],
        },
        select: {
          id: true,
          username: true,
        },
        take: 30,
      });

      console.log(`    ℹ️ Found ${activeUsers.length} active users`);

      // ✅ Smaller batches with delays
      const batchSize = this.MAX_CONCURRENT_QUERIES;
      for (let i = 0; i < activeUsers.length; i += batchSize) {
        const batch = activeUsers.slice(i, i + batchSize);
        
        await Promise.allSettled(
          batch.map(user => this.warmSingleUserData(user.id))
        );
        
        // ✅ Add delay between batches
        if (i + batchSize < activeUsers.length) {
          await this.delay(this.BATCH_DELAY);
        }
      }

      const duration = Date.now() - startTime;
      console.log(`    ✓ User data warmed in ${duration}ms (${this.stats.userDataWarmed}/${activeUsers.length} users)`);
    } catch (error) {
      console.error('    ✗ Failed to warm user data:', error);
      this.stats.errors.push(`user-data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * ✅ Warm single user data with connection error handling
   */
  private async warmSingleUserData(userId: string, retries = 2): Promise<void> {
    try {
      // ✅ Add delay before each user query
      await this.delay(50);
      
      const avatars = await prisma.avatar.findMany({
        where: { userId },
        orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
        select: {
          id: true,
          avatarIndex: true,
          avatarSeed: true,
          avatarStyle: true,
          isPrimary: true,
          isCustomUpload: true,
          customImageUrl: true,
        },
      });
      
      const avatarKey = courseCacheKeys.userAvatars(userId);
      await this.setCacheData(avatarKey, avatars, COURSE_CACHE_TIMES.USER_AVATARS);

      // ✅ Add delay between queries
      await this.delay(50);

      const enrollments = await prisma.courseEnrollment.findMany({
        where: { userId, status: 'active' },
        select: { courseId: true },
      });
      
      const enrollmentKey = courseCacheKeys.bulkEnrollments(userId);
      const enrollmentIds = enrollments.map(e => e.courseId);
      await this.setCacheData(enrollmentKey, enrollmentIds, COURSE_CACHE_TIMES.ENROLLMENT_STATUS);

      this.stats.userDataWarmed++;
    } catch (error: any) {
      if (retries > 0 && error.message?.includes('connection')) {
        console.log(`    ⚠️ Retrying user ${userId} (${retries} left)...`);
        await this.delay(1000); // ✅ Longer wait before retry
        return this.warmSingleUserData(userId, retries - 1);
      }
      
      // Silent fail for individual users
      console.error(`    ✗ Failed user ${userId}:`, error.message);
    }
  }

  /**
   * ✅ PAGE 3 & 4: Warm checkout-related data
   */
  private async warmCheckoutData(): Promise<void> {
    try {
      console.log('  💳 [4/5] Warming checkout data...');
      const startTime = Date.now();

      // Get courses that are frequently purchased
      const popularPurchases = await prisma.payment.groupBy({
        by: ['courseId'],
        _count: {
          courseId: true,
        },
        where: {
          status: 'succeeded',
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
        orderBy: {
          _count: {
            courseId: 'desc',
          },
        },
        take: 10,
      });

      console.log(`    ℹ️ Found ${popularPurchases.length} frequently purchased courses`);

      // Pre-warm course data for these (they're likely to be purchased again)
      for (const purchase of popularPurchases) {
        try {
          const courseKey = courseCacheKeys.courseDetail(purchase.courseId);
          const exists = await redis.exists(courseKey);
          
          if (!exists) {
            const data = await loadCompleteCourseDetail(purchase.courseId);
            await this.setCacheData(courseKey, data, COURSE_CACHE_TIMES.COURSE_DETAIL);
          }
          
          // ✅ Add small delay between courses
          await this.delay(50);
        } catch (error) {
          // Silent fail
        }
      }

      const duration = Date.now() - startTime;
      console.log(`    ✓ Checkout data warmed in ${duration}ms`);
    } catch (error) {
      console.error('    ✗ Failed to warm checkout data:', error);
      this.stats.errors.push(`checkout-data: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  /**
   * ✅ NEW: Warm navbar data for active users
   */
  private async warmNavbarData(): Promise<void> {
    try {
      console.log('  📊 [5/5] Warming navbar data...');
      const startTime = Date.now();

      // Get users with recent activity (last 7 days)
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 7);

      const activeUsers = await prisma.student.findMany({
        where: {
          OR: [
            {
              lastLogin: {
                gte: recentDate,
              },
            },
            {
              sessions: {
                some: {
                  lastUsed: {
                    gte: recentDate,
                  },
                },
              },
            },
          ],
        },
        select: {
          id: true,
          username: true,
        },
        take: 50,
      });

      console.log(`    ℹ️ Found ${activeUsers.length} active users for navbar warming`);

      // ✅ Warm navbar data in batches
      const { batchLoadNavbarData } = await import('@/lib/loaders/navbar-loader');
      const userIds = activeUsers.map(u => u.id);
      
      for (let i = 0; i < userIds.length; i += this.MAX_CONCURRENT_QUERIES) {
        const batch = userIds.slice(i, i + this.MAX_CONCURRENT_QUERIES);
        await batchLoadNavbarData(batch);
        
        this.stats.navbarDataWarmed += batch.length;
        
        if (i + this.MAX_CONCURRENT_QUERIES < userIds.length) {
          await this.delay(this.BATCH_DELAY);
        }
      }

      const duration = Date.now() - startTime;
      console.log(`    ✓ Navbar data warmed in ${duration}ms (${this.stats.navbarDataWarmed} users)`);
    } catch (error) {
      console.error('    ✗ Failed to warm navbar data:', error);
      this.stats.errors.push(`navbar-data: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  /**
   * ✅ Set cache data with proper serialization
   */
  private async setCacheData(key: string, data: any, ttl: number): Promise<void> {
    try {
      const cacheData = {
        data: this.serializeMapsForCache(data),
        _timestamp: Date.now(),
      };
      
      await redis.set(key, JSON.stringify(cacheData), 'EX', ttl);
    } catch (error) {
      console.error(`Failed to set cache for ${key}:`, error);
      throw error;
    }
  }

  /**
   * ✅ Serialize Maps to arrays for JSON
   */
  private serializeMapsForCache(data: any): any {
    if (data === null || data === undefined) return data;
    
    if (data instanceof Map) {
      return Array.from(data.entries());
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.serializeMapsForCache(item));
    }
    
    if (typeof data === 'object') {
      const serialized: any = {};
      for (const [key, value] of Object.entries(data)) {
        serialized[key] = this.serializeMapsForCache(value);
      }
      return serialized;
    }
    
    return data;
  }

  /**
   * ✅ Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * ✅ BACKGROUND: Continuously refresh cache before expiry
   */
  private startBackgroundWarming(): void {
    console.log(`🔄 Starting background refresh (every ${this.BACKGROUND_REFRESH_INTERVAL / 1000}s)`);
    
    this.warmingInterval = setInterval(() => {
      // ✅ More strict check
      if (this.isWarming) {
        console.log('⏭️ Skipping background refresh (warming in progress)');
        return;
      }

      const timeSinceLastWarm = Date.now() - this.lastWarmTime;
      if (timeSinceLastWarm < this.MIN_WARM_INTERVAL) {
        console.log('⏭️ Skipping background refresh (too soon)');
        return;
      }

      console.log('🔄 Background refresh triggered');
      this.warmAllCaches().catch(err => {
        console.error('❌ Background refresh failed:', err);
      });
    }, this.BACKGROUND_REFRESH_INTERVAL);

    // Cleanup on process exit
    process.on('SIGTERM', () => this.shutdown());
    process.on('SIGINT', () => this.shutdown());
  }

  /**
   * ✅ Cleanup on shutdown
   */
  private shutdown(): void {
    console.log('🛑 Shutting down cache warming service...');
    
    if (this.warmingInterval) {
      clearInterval(this.warmingInterval);
      this.warmingInterval = null;
    }
    
    console.log('✅ Cache warming service stopped');
  }

  /**
   * ✅ Get current stats
   */
  getStats(): CacheWarmingStats {
    return { ...this.stats };
  }
}

// ✅ Create singleton but DON'T auto-start
export const cacheWarmer = new AutoCacheWarmer();

// ✅ Export warming function for manual triggers if needed
export async function warmCaches(): Promise<CacheWarmingStats> {
  return await cacheWarmer.warmAllCaches();
}