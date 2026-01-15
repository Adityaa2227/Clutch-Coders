const { Redis } = require('@upstash/redis');

let redis = null;
let isRedisReady = false;

// Check for HTTP credentials (preferred for Upstash)
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
        console.log('🔌 Connecting to Upstash Redis (HTTP)...');
        redis = new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL,
            token: process.env.UPSTASH_REDIS_REST_TOKEN,
        });
        isRedisReady = true; // HTTP is stateless, so we assume ready if config exists
        console.log('✅ Upstash Redis Configured');
    } catch (error) {
        console.error('⚠️ Upstash Redis Config Error:', error);
        isRedisReady = false;
    }
} 
// Fallback to TCP if legacy REDIS_URL is present (optional, but good for backward compat)
else if (process.env.REDIS_URL) {
    console.warn('⚠️ HTTP Redis vars missing, falling back to basic checks or disabled.');
    // For now, let's strictly switch to HTTP as requested by user to fix the issues
} else {
    console.warn('⚠️ Redis not configured. Features disabled.');
}

module.exports = {
    redis,
    isReady: () => isRedisReady
};
