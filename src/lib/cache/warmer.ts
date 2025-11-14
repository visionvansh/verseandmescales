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
  navbarDataWarmed: number;
  totalTime: number;
  errors: string[];
}

class AutoCacheWarmer {
  private isWarming = false;
  private warmingInterval: NodeJS.Timeout | null = null;
  private lastWarmTime = 0;
  private isInitialized = false;
  private stats: CacheWarmingStats = {
    coursesListWarmed: false,
    courseDetailsWarmed: 0,
    userDataWarmed: 0,
    navbarDataWarmed: 0,
    totalTime: 0,
    errors: [],
  };
  
  private readonly MIN_WARM_INTERVAL = 10 * 60 * 1000; // 10 minutes
  private readonly BACKGROUND_REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes
  private readonly MAX_CONCURRENT_QUERIES = 1; // ✅ ONE at a time
  private readonly BATCH_DELAY = 500; // ✅ Longer delays
  private readonly DB_CONNECTION_TIMEOUT = 5000; // 5 seconds
  private readonly MAX_RETRIES = 3;

  /**
   * ✅ Initialize - ONLY start background warming, no immediate warming
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('⏭️ Cache warmer already initialized');
      return;
    }

    console.log('🚀 Initializing cache warming system...');
    
    // ✅ Test database connection first
    const isDbReady = await this.waitForDatabase();
    if (!isDbReady) {
      console.error('❌ Database not ready, cache warming disabled');
      return;
    }

    this.isInitialized = true;
    
    // ✅ Start background refresh (NO immediate warm)
    this.startBackgroundWarming();
    
    console.log('✅ Cache warming system initialized (background only)');
  }

  /**
   * ✅ NEW: Wait for database to be ready
   */
  private async waitForDatabase(retries = this.MAX_RETRIES): Promise<boolean> {
    for (let i = 0; i < retries; i++) {
      try {
        console.log(`🔍 Testing database connection (attempt ${i + 1}/${retries})...`);
        
        await Promise.race([
          prisma.$queryRaw`SELECT 1`,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Connection timeout')), this.DB_CONNECTION_TIMEOUT)
          )
        ]);
        
        console.log('✅ Database connection successful');
        return true;
      } catch (error: any) {
        console.error(`❌ Database connection failed (attempt ${i + 1}):`, error.message);
        
        if (i < retries - 1) {
          const waitTime = Math.min(1000 * Math.pow(2, i), 10000); // Exponential backoff
          console.log(`⏳ Waiting ${waitTime}ms before retry...`);
          await this.delay(waitTime);
        }
      }
    }
    
    return false;
  }

  /**
   * ✅ MAIN: Warm ALL caches (with connection checks)
   */
  async warmAllCaches(): Promise<CacheWarmingStats> {
    const now = Date.now();
    
    // ✅ Check if already warming
    if (this.isWarming) {
      console.log('⏭️ Cache warming already in progress');
      return this.stats;
    }

    // ✅ Rate limiting
    if (now - this.lastWarmTime < this.MIN_WARM_INTERVAL) {
      const waitTime = Math.round((this.MIN_WARM_INTERVAL - (now - this.lastWarmTime)) / 1000);
      console.log(`⏭️ Cache warmed recently, wait ${waitTime}s`);
      return this.stats;
    }

    // ✅ Check database health
    const isDbHealthy = await this.checkDatabaseHealth();
    if (!isDbHealthy) {
      console.error('❌ Database unhealthy, skipping cache warm');
      this.stats.errors.push('Database health check failed');
      return this.stats;
    }

    // ✅ Distributed lock
    const lockKey = 'cache:warming:lock';
    const lockValue = `${Date.now()}-${Math.random()}`;
    
    try {
      const lockAcquired = await redis.set(lockKey, lockValue, 'EX', 300, 'NX'); // 5 min lock
      
      if (!lockAcquired) {
        console.log('⏭️ Another instance is warming cache');
        return this.stats;
      }

      console.log('🔥 Starting cache warming...');
      const startTime = Date.now();
      this.isWarming = true;
      this.lastWarmTime = now;

      // Reset stats
      this.stats = {
        coursesListWarmed: false,
        courseDetailsWarmed: 0,
        userDataWarmed: 0,
        navbarDataWarmed: 0,
        totalTime: 0,
        errors: [],
      };

      // ✅ Run sequentially with health checks
      await this.warmSequentially();

      const duration = Date.now() - startTime;
      this.stats.totalTime = duration;
      
      console.log(`✅ Cache warming completed in ${duration}ms`);
      console.log(`📊 Stats:`, this.stats);
      
      return this.stats;
    } catch (error: any) {
      console.error('❌ Cache warming failed:', error);
      this.stats.errors.push(error.message || 'Unknown error');
      return this.stats;
    } finally {
      this.isWarming = false;
      await redis.del(lockKey).catch(() => {});
    }
  }

  /**
   * ✅ Check database health before warming
   */
  private async checkDatabaseHealth(): Promise<boolean> {
    try {
      await Promise.race([
        prisma.$queryRaw`SELECT 1`,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Health check timeout')), 3000)
        )
      ]);
      return true;
    } catch (error) {
      console.error('❌ Database health check failed:', error);
      return false;
    }
  }

  /**
   * ✅ Run warming tasks sequentially
   */
  private async warmSequentially(): Promise<void> {
    const tasks = [
      { name: 'Courses List', fn: () => this.warmCoursesListPage() },
      { name: 'Course Details', fn: () => this.warmCourseDetailPages() },
      { name: 'User Data', fn: () => this.warmUserData() },
      { name: 'Checkout Data', fn: () => this.warmCheckoutData() },
      { name: 'Navbar Data', fn: () => this.warmNavbarData() },
    ];

    for (const task of tasks) {
      try {
        await task.fn();
        await this.delay(this.BATCH_DELAY);
      } catch (error: any) {
        console.error(`❌ Failed to warm ${task.name}:`, error.message);
        this.stats.errors.push(`${task.name}: ${error.message}`);
      }
    }
  }

  /**
   * ✅ Warm courses list page
   */
  private async warmCoursesListPage(): Promise<void> {
    try {
      console.log('  📚 [1/5] Warming /courses page...');
      const startTime = Date.now();

      const cacheKey = courseCacheKeys.publicCourses();
      const data = await loadCompleteCoursesData();
      
      await this.setCacheData(cacheKey, data, COURSE_CACHE_TIMES.PUBLIC_COURSES);
      
      const duration = Date.now() - startTime;
      this.stats.coursesListWarmed = true;
      
      console.log(`    ✓ /courses warmed in ${duration}ms`);
    } catch (error: any) {
      console.error('    ✗ Failed to warm /courses:', error.message);
      throw error;
    }
  }

  /**
   * ✅ Warm course detail pages with retry logic
   */
  private async warmCourseDetailPages(): Promise<void> {
    try {
      console.log('  🏆 [2/5] Warming /courses/[id] pages...');
      const startTime = Date.now();

      const topCourses = await this.safeQuery(
        () => prisma.course.findMany({
          where: {
            status: 'PUBLISHED',
            isPublished: true,
          },
          select: {
            id: true,
            title: true,
            _count: { select: { enrollments: true } },
          },
          orderBy: [
            { enrollments: { _count: 'desc' } },
            { updatedAt: 'desc' },
          ],
          take: 10, // ✅ Reduced from 15
        }),
        []
      );

      console.log(`    ℹ️ Found ${topCourses.length} courses`);

      // ✅ Process ONE at a time
      for (const course of topCourses) {
        try {
          const cacheKey = courseCacheKeys.courseDetail(course.id);
          const data = await loadCompleteCourseDetail(course.id);
          
          await this.setCacheData(cacheKey, data, COURSE_CACHE_TIMES.COURSE_DETAIL);
          
          this.stats.courseDetailsWarmed++;
          console.log(`    ✓ Warmed: ${course.title.substring(0, 40)}...`);
          
          await this.delay(this.BATCH_DELAY);
        } catch (error: any) {
          console.error(`    ✗ Failed: ${course.title}`, error.message);
        }
      }

      const duration = Date.now() - startTime;
      console.log(`    ✓ Course details warmed in ${duration}ms`);
    } catch (error: any) {
      console.error('    ✗ Failed to warm course details:', error.message);
      throw error;
    }
  }

  /**
   * ✅ Warm user data
   */
  private async warmUserData(): Promise<void> {
    try {
      console.log('  👥 [3/5] Warming user data...');
      const startTime = Date.now();

      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 30);

      const activeUsers = await this.safeQuery(
        () => prisma.student.findMany({
          where: {
            OR: [
              { lastLogin: { gte: recentDate } },
              { enrollments: { some: { lastAccessedAt: { gte: recentDate } } } },
            ],
          },
          select: { id: true, username: true },
          take: 20, // ✅ Reduced from 30
        }),
        []
      );

      console.log(`    ℹ️ Found ${activeUsers.length} active users`);

      // ✅ Process ONE at a time
      for (const user of activeUsers) {
        try {
          await this.warmSingleUserData(user.id);
          this.stats.userDataWarmed++;
          await this.delay(100); // Small delay between users
        } catch (error) {
          // Silent fail
        }
      }

      const duration = Date.now() - startTime;
      console.log(`    ✓ User data warmed in ${duration}ms`);
    } catch (error: any) {
      console.error('    ✗ Failed to warm user data:', error.message);
      throw error;
    }
  }

  /**
   * ✅ Warm single user with retries
   */
  private async warmSingleUserData(userId: string, retries = 2): Promise<void> {
    try {
      await this.delay(100);
      
      const avatars = await this.safeQuery(
        () => prisma.avatar.findMany({
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
        }),
        []
      );
      
      const avatarKey = courseCacheKeys.userAvatars(userId);
      await this.setCacheData(avatarKey, avatars, COURSE_CACHE_TIMES.USER_AVATARS);

      await this.delay(100);

      const enrollments = await this.safeQuery(
        () => prisma.courseEnrollment.findMany({
          where: { userId, status: 'active' },
          select: { courseId: true },
        }),
        []
      );
      
      const enrollmentKey = courseCacheKeys.bulkEnrollments(userId);
      const enrollmentIds = enrollments.map(e => e.courseId);
      await this.setCacheData(enrollmentKey, enrollmentIds, COURSE_CACHE_TIMES.ENROLLMENT_STATUS);

    } catch (error: any) {
      if (retries > 0 && error.message?.includes('connection')) {
        await this.delay(2000);
        return this.warmSingleUserData(userId, retries - 1);
      }
      throw error;
    }
  }

  /**
   * ✅ Warm checkout data
   */
  private async warmCheckoutData(): Promise<void> {
    try {
      console.log('  💳 [4/5] Warming checkout data...');
      const startTime = Date.now();

      const popularPurchases = await this.safeQuery(
        () => prisma.payment.groupBy({
          by: ['courseId'],
          _count: { courseId: true },
          where: {
            status: 'succeeded',
            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
          orderBy: { _count: { courseId: 'desc' } },
          take: 5, // ✅ Reduced from 10
        }),
        []
      );

      for (const purchase of popularPurchases) {
        try {
          const courseKey = courseCacheKeys.courseDetail(purchase.courseId);
          const exists = await redis.exists(courseKey);
          
          if (!exists) {
            const data = await loadCompleteCourseDetail(purchase.courseId);
            await this.setCacheData(courseKey, data, COURSE_CACHE_TIMES.COURSE_DETAIL);
          }
          
          await this.delay(200);
        } catch (error) {
          // Silent fail
        }
      }

      const duration = Date.now() - startTime;
      console.log(`    ✓ Checkout data warmed in ${duration}ms`);
    } catch (error: any) {
      console.error('    ✗ Failed to warm checkout data:', error.message);
      throw error;
    }
  }

  /**
   * ✅ Warm navbar data
   */
  private async warmNavbarData(): Promise<void> {
    try {
      console.log('  📊 [5/5] Warming navbar data...');
      const startTime = Date.now();

      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 7);

      const activeUsers = await this.safeQuery(
        () => prisma.student.findMany({
          where: {
            OR: [
              { lastLogin: { gte: recentDate } },
              { sessions: { some: { lastUsed: { gte: recentDate } } } },
            ],
          },
          select: { id: true },
          take: 20, // ✅ Reduced from 50
        }),
        []
      );

      const { batchLoadNavbarData } = await import('@/lib/loaders/navbar-loader');
      const userIds = activeUsers.map(u => u.id);
      
      // ✅ Process in small batches
      for (let i = 0; i < userIds.length; i += 5) {
        const batch = userIds.slice(i, i + 5);
        await batchLoadNavbarData(batch);
        this.stats.navbarDataWarmed += batch.length;
        await this.delay(this.BATCH_DELAY);
      }

      const duration = Date.now() - startTime;
      console.log(`    ✓ Navbar data warmed in ${duration}ms`);
    } catch (error: any) {
      console.error('    ✗ Failed to warm navbar data:', error.message);
      throw error;
    }
  }

  /**
   * ✅ Safe query wrapper with timeout and retry
   */
  private async safeQuery<T>(
    queryFn: () => Promise<T>,
    fallback: T,
    retries = 2
  ): Promise<T> {
    for (let i = 0; i < retries; i++) {
      try {
        return await Promise.race([
          queryFn(),
          new Promise<T>((_, reject) => 
            setTimeout(() => reject(new Error('Query timeout')), 8000)
          )
        ]);
      } catch (error: any) {
        if (i === retries - 1) {
          console.error(`Query failed after ${retries} attempts:`, error.message);
          return fallback;
        }
        await this.delay(1000 * (i + 1));
      }
    }
    return fallback;
  }

  /**
   * ✅ Set cache data
   */
  private async setCacheData(key: string, data: any, ttl: number): Promise<void> {
    try {
      const cacheData = {
        data: this.serializeMapsForCache(data),
        _timestamp: Date.now(),
      };
      await redis.set(key, JSON.stringify(cacheData), 'EX', ttl);
    } catch (error: any) {
      console.error(`Failed to set cache for ${key}:`, error.message);
      throw error;
    }
  }

  /**
   * ✅ Serialize Maps
   */
  private serializeMapsForCache(data: any): any {
    if (data === null || data === undefined) return data;
    if (data instanceof Map) return Array.from(data.entries());
    if (Array.isArray(data)) return data.map(item => this.serializeMapsForCache(item));
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
   * ✅ Background warming (conservative)
   */
  private startBackgroundWarming(): void {
    console.log(`🔄 Starting background refresh (every ${this.BACKGROUND_REFRESH_INTERVAL / 1000}s)`);
    
    this.warmingInterval = setInterval(() => {
      if (this.isWarming) {
        console.log('⏭️ Skipping background refresh (warming in progress)');
        return;
      }

      const timeSinceLastWarm = Date.now() - this.lastWarmTime;
      if (timeSinceLastWarm < this.MIN_WARM_INTERVAL) {
        return;
      }

      console.log('🔄 Background refresh triggered');
      this.warmAllCaches().catch(err => {
        console.error('❌ Background refresh failed:', err);
      });
    }, this.BACKGROUND_REFRESH_INTERVAL);

    process.on('SIGTERM', () => this.shutdown());
    process.on('SIGINT', () => this.shutdown());
  }

  /**
   * ✅ Shutdown
   */
  private shutdown(): void {
    console.log('🛑 Shutting down cache warming...');
    if (this.warmingInterval) {
      clearInterval(this.warmingInterval);
      this.warmingInterval = null;
    }
    console.log('✅ Cache warming stopped');
  }

  /**
   * ✅ Get stats
   */
  getStats(): CacheWarmingStats {
    return { ...this.stats };
  }
}

export const cacheWarmer = new AutoCacheWarmer();

export async function warmCaches(): Promise<CacheWarmingStats> {
  return await cacheWarmer.warmAllCaches();
}