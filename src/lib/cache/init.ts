// lib/cache/init.ts
import { checkDatabaseConnection } from '@/lib/prisma';
import { cacheWarmer } from './warmer';

let isInitialized = false;
let initPromise: Promise<void> | null = null;

/**
 * ✅ Initialize cache warming system ONCE (with database health check)
 */
export async function initializeCacheWarming() {
  // Return existing promise if already initializing
  if (initPromise) {
    console.log('⏭️ Cache warming initialization in progress');
    return initPromise;
  }

  if (isInitialized) {
    console.log('⏭️ Cache warming already initialized');
    return Promise.resolve();
  }

  console.log('🔥 Initializing cache warming system...');
  
  initPromise = (async () => {
    try {
      // ✅ STEP 1: Wait for database to be ready
      console.log('🔍 Checking database connection...');
      
      let isDbReady = false;
      const maxRetries = 5;
      
      for (let i = 0; i < maxRetries; i++) {
        isDbReady = await checkDatabaseConnection(3000);
        
        if (isDbReady) {
          console.log('✅ Database connection verified');
          break;
        }
        
        if (i < maxRetries - 1) {
          console.log(`⏳ Database not ready, retrying in 2s (${i + 1}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      if (!isDbReady) {
        console.error('❌ Database connection failed after 5 attempts');
        console.log('⚠️ Cache warming system disabled');
        isInitialized = false;
        initPromise = null;
        return;
      }

      // ✅ STEP 2: Mark as initialized BEFORE warming
      isInitialized = true;
      
      // ✅ STEP 3: Initialize the cache warmer (background only)
      await cacheWarmer.initialize();
      
      console.log('✅ Cache warming system initialized successfully');
      
    } catch (error) {
      isInitialized = false;
      initPromise = null;
      console.error('❌ Failed to initialize cache warming:', error);
      
      // ✅ Don't throw - just log and continue
      console.log('⚠️ Application will continue without cache warming');
    }
  })();

  return initPromise;
}

export { cacheWarmer };