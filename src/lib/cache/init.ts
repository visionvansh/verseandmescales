// lib/cache/init.ts
import { cacheWarmer } from './warmer';

let isInitialized = false;
let initPromise: Promise<void> | null = null;

/**
 * ✅ Initialize cache warming system ONCE
 */
export async function initializeCacheWarming() {
  // Return existing promise if already initializing
  if (initPromise) {
    return initPromise;
  }

  if (isInitialized) {
    console.log('⏭️ Cache warming already initialized');
    return Promise.resolve();
  }

  console.log('🔥 Initializing cache warming system...');
  
  initPromise = (async () => {
    try {
      // Mark as initialized BEFORE warming to prevent duplicates
      isInitialized = true;
      
      // Trigger initial warm (non-blocking)
      cacheWarmer.warmAllCaches().catch(err => {
        console.error('❌ Initial cache warming failed:', err);
      });

      console.log('✅ Cache warming system initialized');
    } catch (error) {
      isInitialized = false;
      initPromise = null;
      console.error('❌ Failed to initialize cache warming:', error);
      throw error;
    }
  })();

  return initPromise;
}

export { cacheWarmer };