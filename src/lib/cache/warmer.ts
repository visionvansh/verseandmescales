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
  
  // ✅ CRITICAL: Increase intervals to prevent exhausting limit
  private readonly MIN_WARM_INTERVAL = 60 * 60 * 1000; // 1 hour minimum between full warms
  private readonly BACKGROUND_REFRESH_INTERVAL = 60 * 60 * 1000; // 1 hour between background refreshes
  private readonly MAX_CONCURRENT_QUERIES = 1;
  private readonly BATCH_DELAY = 1000; // 1 second between batches
  private readonly DB_CONNECTION_TIMEOUT = 5000;
  private readonly MAX_RETRIES = 2; // Reduce retries

  /**
   * ✅ Initialize - ONLY start background warming (NO immediate warming)
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('⏭️ Cache warmer already initialized');
      return;
    }

    console.log('🚀 Initializing cache warming system...');
    
    // Test database connection
    const isDbReady = await this.waitForDatabase();
    if (!isDbReady) {
      console.error('❌ Database not ready, cache warming disabled');
      return;
    }

    this.isInitialized = true;
    
    // Start background refresh (runs every hour)
    this.startBackgroundWarming();
    
    console.log('✅ Cache warming system initialized (1-hour intervals)');
  }

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
          const waitTime = Math.min(2000 * Math.pow(2, i), 10000);
          console.log(`⏳ Waiting ${waitTime}ms before retry...`);
          await this.delay(waitTime);
        }
      }
    }
    
    return false;
  }

  /**
   * ✅ MAIN: Warm critical caches only (minimal operations)
   */
  async warmAllCaches(): Promise<CacheWarmingStats> {
    const now = Date.now();
    
    if (this.isWarming) {
      console.log('⏭️ Cache warming already in progress');
      return this.stats;
    }

    // ✅ Strict rate limiting - only warm once per hour
    if (now - this.lastWarmTime < this.MIN_WARM_INTERVAL) {
      const waitTime = Math.round((this.MIN_WARM_INTERVAL - (now - this.lastWarmTime)) / 60000);
      console.log(`⏭️ Cache warmed recently, wait ${waitTime} minutes`);
      return this.stats;
    }

    // Check database health
    const isDbHealthy = await this.checkDatabaseHealth();
    if (!isDbHealthy) {
      console.error('❌ Database unhealthy, skipping cache warm');
      this.stats.errors.push('Database health check failed');
      return this.stats;
    }

    // Distributed lock with longer TTL
    const lockKey = 'cache:warming:lock';
    const lockValue = `${Date.now()}-${Math.random()}`;
    
    try {
      const lockAcquired = await redis.set(lockKey, lockValue, 'EX', 600, 'NX'); // 10 min lock
      
      if (!lockAcquired) {
        console.log('⏭️ Another instance is warming cache');
        return this.stats;
      }

      console.log('🔥 Starting cache warming (limited scope)...');
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

      // ✅ CRITICAL: Only warm essential caches
      await this.warmCriticalCachesOnly();

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
   * ✅ NEW: Only warm the most critical caches
   */
  private async warmCriticalCachesOnly(): Promise<void> {
    const tasks = [
      { name: 'Anonymous Courses List', fn: () => this.warmCoursesListPage() },
      { name: 'Top 3 Course Details', fn: () => this.warmTopCourseDetailsOnly() },
      // ✅ REMOVED: User data warming, checkout data, navbar data
    ];

    for (const task of tasks) {
      try {
        await task.fn();
        await this.delay(this.BATCH_DELAY); // 1 second between tasks
      } catch (error: any) {
        console.error(`❌ Failed to warm ${task.name}:`, error.message);
        this.stats.errors.push(`${task.name}: ${error.message}`);
      }
    }
  }

  /**
   * ✅ Warm courses list page (anonymous only)
   */
  private async warmCoursesListPage(): Promise<void> {
    try {
      console.log('  📚 [1/2] Warming anonymous /courses page...');
      const startTime = Date.now();

      const anonymousCacheKey = courseCacheKeys.publicCoursesAnonymous();
      
      // Check if already cached
      const exists = await redis.exists(anonymousCacheKey);
      if (exists) {
        console.log('    ⏭️ Already cached, skipping');
        this.stats.coursesListWarmed = true;
        return;
      }

      const data = await loadCompleteCoursesData();
      
      await this.setCacheData(
        anonymousCacheKey, 
        data, 
        COURSE_CACHE_TIMES.PUBLIC_COURSES_ANONYMOUS
      );
      
      const duration = Date.now() - startTime;
      this.stats.coursesListWarmed = true;
      
      console.log(`    ✓ Anonymous /courses warmed in ${duration}ms`);
    } catch (error: any) {
      console.error('    ✗ Failed to warm /courses:', error.message);
      throw error;
    }
  }

  /**
   * ✅ NEW: Only warm top 3 course details (not 10)
   */
  private async warmTopCourseDetailsOnly(): Promise<void> {
    try {
      console.log('  🏆 [2/2] Warming top 3 /courses/[id] pages...');
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
          take: 3, // ✅ REDUCED from 10 to 3
        }),
        []
      );

      console.log(`    ℹ️ Found ${topCourses.length} top courses`);

      for (const course of topCourses) {
        try {
          const anonymousCacheKey = courseCacheKeys.courseDetailAnonymous(course.id);
          
          // Check if already cached
          const exists = await redis.exists(anonymousCacheKey);
          if (exists) {
            console.log(`    ⏭️ Already cached: ${course.title.substring(0, 30)}...`);
            continue;
          }

          const data = await loadCompleteCourseDetail(course.id);
          
          await this.setCacheData(
            anonymousCacheKey, 
            data, 
            COURSE_CACHE_TIMES.COURSE_DETAIL_ANONYMOUS
          );
          
          this.stats.courseDetailsWarmed++;
          console.log(`    ✓ Warmed: ${course.title.substring(0, 40)}...`);
          
          await this.delay(this.BATCH_DELAY); // 1 second between courses
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
   * ✅ Safe query wrapper
   */
  private async safeQuery<T>(
    queryFn: () => Promise<T>,
    fallback: T,
    retries = 1 // Reduced from 2
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
        await this.delay(2000 * (i + 1));
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

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * ✅ Background warming (HOURLY instead of 15 minutes)
   */
  private startBackgroundWarming(): void {
    console.log(`🔄 Starting background refresh (every ${this.BACKGROUND_REFRESH_INTERVAL / 60000} minutes)`);
    
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

  private shutdown(): void {
    console.log('🛑 Shutting down cache warming...');
    if (this.warmingInterval) {
      clearInterval(this.warmingInterval);
      this.warmingInterval = null;
    }
    console.log('✅ Cache warming stopped');
  }

  getStats(): CacheWarmingStats {
    return { ...this.stats };
  }
}

export const cacheWarmer = new AutoCacheWarmer();

export async function warmCaches(): Promise<CacheWarmingStats> {
  return await cacheWarmer.warmAllCaches();
}