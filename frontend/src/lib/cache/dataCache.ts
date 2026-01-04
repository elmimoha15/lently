/**
 * Global data cache to prevent re-fetching data on every page navigation
 * Data is cached in memory and persists across page changes
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class DataCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes default

  /**
   * Get cached data if available and not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now > entry.expiresAt) {
      // Cache expired, remove it
      this.cache.delete(key);
      return null;
    }

    console.log(`✅ Cache hit: ${key}`);
    return entry.data as T;
  }

  /**
   * Set data in cache with optional TTL (time to live in milliseconds)
   */
  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl,
    });
    console.log(`💾 Cached: ${key} (expires in ${ttl / 1000}s)`);
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
    console.log(`🗑️  Invalidated cache: ${key}`);
  }

  /**
   * Invalidate all cache entries matching a pattern
   */
  invalidatePattern(pattern: string): void {
    const keys = Array.from(this.cache.keys());
    keys.forEach(key => {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        console.log(`🗑️  Invalidated cache: ${key}`);
      }
    });
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    console.log('🗑️  Cleared all cache');
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }
}

// Export singleton instance
export const dataCache = new DataCache();

// Cache keys
export const CACHE_KEYS = {
  USER_PROFILE: 'user:profile',
  USER_VIDEOS: 'user:videos',
  VIDEO_DETAILS: (videoId: string) => `video:${videoId}`,
  VIDEO_COMMENTS: (videoId: string) => `comments:${videoId}`,
  ALL_COMMENTS: 'comments:all',
};
