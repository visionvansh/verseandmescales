// src/lib/cache/init.ts
import { cacheWarmer } from './warmer';

let isInitialized = false;

/**
 * ✅ Initialize cache warming system
 * Call this ONCE when your app starts
 */
export async function initializeCacheWarming() {
  if (isInitialized) {
    console.log('⏭️ Cache warming already initialized');
    return;
  }

  console.log('🔥 Initializing cache warming system...');
  
  try {
    // Trigger first warm immediately (non-blocking)
    cacheWarmer.warmAllCaches().catch(err => {
      console.error('❌ Initial cache warming failed:', err);
    });

    isInitialized = true;
    console.log('✅ Cache warming system initialized');
  } catch (error) {
    console.error('❌ Failed to initialize cache warming:', error);
  }
}

// ✅ Export for manual warming if needed
export { cacheWarmer };