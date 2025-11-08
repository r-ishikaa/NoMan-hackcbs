import { createClient } from "redis";

let redisClient = null;
let isConnected = false;

/**
 * Initialize Redis client
 * @returns {Promise<RedisClient>}
 */
export async function initRedis() {
  if (redisClient && isConnected) {
    return redisClient;
  }

  try {
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

    redisClient = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error("[Redis] Max reconnection attempts reached");
            return new Error("Max reconnection attempts reached");
          }
          // Exponential backoff: 100ms, 200ms, 400ms, 800ms, etc.
          return Math.min(retries * 100, 3000);
        },
      },
    });

    redisClient.on("error", (err) => {
      console.error("[Redis] Error:", err.message);
      isConnected = false;
    });

    redisClient.on("connect", () => {
      console.log("[Redis] Connecting...");
    });

    redisClient.on("ready", () => {
      console.log("[Redis] ✅ Connected and ready");
      isConnected = true;
    });

    redisClient.on("reconnecting", () => {
      console.log("[Redis] Reconnecting...");
      isConnected = false;
    });

    redisClient.on("end", () => {
      console.log("[Redis] Connection closed");
      isConnected = false;
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error("[Redis] Failed to initialize:", error.message);
    console.warn("[Redis] ⚠️  Running without Redis cache");
    redisClient = null;
    isConnected = false;
    return null;
  }
}

/**
 * Get Redis client instance
 * @returns {RedisClient|null}
 */
export function getRedisClient() {
  return isConnected ? redisClient : null;
}

/**
 * Check if Redis is available
 * @returns {boolean}
 */
export function isRedisAvailable() {
  return isConnected && redisClient !== null;
}

/**
 * Cache helper: Get data from cache or fetch from database
 * @param {string} key - Cache key
 * @param {Function} fetchFn - Function to fetch data if not in cache
 * @param {number} ttl - Time to live in seconds (default: 300 = 5 minutes)
 * @returns {Promise<any>}
 */
export async function cacheGet(key, fetchFn, ttl = 300) {
  try {
    if (!isRedisAvailable()) {
      // Redis not available, fetch directly from database
      return await fetchFn();
    }

    // Try to get from cache
    const cached = await redisClient.get(key);
    if (cached) {
      console.log(`[Redis] Cache HIT: ${key}`);
      return JSON.parse(cached);
    }

    console.log(`[Redis] Cache MISS: ${key}`);
    // Fetch from database
    const data = await fetchFn();

    // Store in cache (fire and forget - don't wait)
    redisClient
      .setEx(key, ttl, JSON.stringify(data))
      .catch((err) =>
        console.error(`[Redis] Cache set error for ${key}:`, err.message)
      );

    return data;
  } catch (error) {
    console.error(`[Redis] Cache get error for ${key}:`, error.message);
    // Fallback to database on error
    return await fetchFn();
  }
}

/**
 * Cache helper: Set data in cache
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 * @param {number} ttl - Time to live in seconds (default: 300 = 5 minutes)
 * @returns {Promise<void>}
 */
export async function cacheSet(key, data, ttl = 300) {
  try {
    if (!isRedisAvailable()) {
      return;
    }
    await redisClient.setEx(key, ttl, JSON.stringify(data));
    console.log(`[Redis] Cache SET: ${key} (TTL: ${ttl}s)`);
  } catch (error) {
    console.error(`[Redis] Cache set error for ${key}:`, error.message);
  }
}

/**
 * Cache helper: Delete data from cache
 * @param {string|string[]} keys - Cache key(s) to delete
 * @returns {Promise<void>}
 */
export async function cacheDel(keys) {
  try {
    if (!isRedisAvailable()) {
      return;
    }
    const keyArray = Array.isArray(keys) ? keys : [keys];
    await redisClient.del(keyArray);
    console.log(`[Redis] Cache DEL: ${keyArray.join(", ")}`);
  } catch (error) {
    console.error(`[Redis] Cache delete error:`, error.message);
  }
}

/**
 * Cache helper: Delete all keys matching a pattern
 * @param {string} pattern - Pattern to match (e.g., "user:*")
 * @returns {Promise<void>}
 */
export async function cacheDelPattern(pattern) {
  try {
    if (!isRedisAvailable()) {
      return;
    }
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log(
        `[Redis] Cache DEL pattern: ${pattern} (${keys.length} keys)`
      );
    }
  } catch (error) {
    console.error(`[Redis] Cache delete pattern error:`, error.message);
  }
}

/**
 * Cache helper: Increment a counter
 * @param {string} key - Cache key
 * @param {number} ttl - Time to live in seconds (optional)
 * @returns {Promise<number>} - New value after increment
 */
export async function cacheIncr(key, ttl = null) {
  try {
    if (!isRedisAvailable()) {
      return 1;
    }
    const value = await redisClient.incr(key);
    if (ttl && value === 1) {
      // Set TTL only on first increment
      await redisClient.expire(key, ttl);
    }
    return value;
  } catch (error) {
    console.error(`[Redis] Cache incr error for ${key}:`, error.message);
    return 1;
  }
}

/**
 * Gracefully close Redis connection
 */
export async function closeRedis() {
  if (redisClient) {
    try {
      await redisClient.quit();
      console.log("[Redis] Connection closed gracefully");
    } catch (error) {
      console.error("[Redis] Error closing connection:", error.message);
    }
  }
}

export default {
  initRedis,
  getRedisClient,
  isRedisAvailable,
  cacheGet,
  cacheSet,
  cacheDel,
  cacheDelPattern,
  cacheIncr,
  closeRedis,
};
