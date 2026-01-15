const { redis, isReady } = require('../config/redis');

class RedisService {
    
    // 🔐 DISTRIBUTION LOCKS (For Wallet/Transactions)
    // Returns a function to release the lock, or null if acquiry failed
    static async acquireLock(key, ttlSeconds = 10) {
        if (!isReady() || !redis) return () => {}; // Pass-through
        
        try {
            // Upstash Syntax: redis.set(key, value, { nx: true, ex: seconds })
            const result = await redis.set(key, 'LOCKED', { nx: true, ex: ttlSeconds });
            
            // Upstash returns 'OK' or null/false depending on version, handled broadly
            if (result === 'OK' || result === 1 || result === true) {
                return async () => await redis.del(key); 
            }
            return null; // Lock busy
        } catch (e) {
            console.error('Redis Lock Error:', e);
            return () => {}; // Fail safe
        }
    }

    // 🚦 RATE LIMITING (Token Bucket / Sliding Window)
    static async checkRateLimit(key, limit, windowSeconds) {
        if (!isReady() || !redis) return true; 

        try {
            const current = await redis.incr(key);
            if (current === 1) {
                await redis.expire(key, windowSeconds);
            }
            return current <= limit;
        } catch (e) {
            return true; // Fail open
        }
    }

    // 📩 CACHING (Marketplace/Configs)
    static async getOrSet(key, fetchFn, ttlSeconds = 300) {
        if (!isReady() || !redis) return await fetchFn();

        try {
            const cached = await redis.get(key);
            // Upstash might return object directly if stored as JSON, or string
            if (cached) {
                 return typeof cached === 'string' ? JSON.parse(cached) : cached;
            }

            const data = await fetchFn();
            if (data) {
                // Upstash automatically serializes objects, but explicit stringify is safer across clients
                await redis.set(key, JSON.stringify(data), { ex: ttlSeconds });
            }
            return data;
        } catch (e) {
            return await fetchFn();
        }
    }

    // 🔑 OTP & SHORT-LIVED TOKENS
    static async setEx(key, value, seconds) {
        if (!isReady() || !redis) return;
        await redis.set(key, value, { ex: seconds });
    }

    static async get(key) {
        if (!isReady() || !redis) return null;
        return await redis.get(key);
    }

    static async del(key) {
        if (!isReady() || !redis) return;
        return await redis.del(key);
    }
}

module.exports = RedisService;
