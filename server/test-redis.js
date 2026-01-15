require('dotenv').config();
const { Redis } = require('@upstash/redis');

async function testConnection() {
    console.log("🔍 Checking Redis Connection...");
    
    if (!process.env.UPSTASH_REDIS_REST_URL) {
        console.error("❌ Missing UPSTASH_REDIS_REST_URL");
        return;
    }

    try {
        const redis = new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL,
            token: process.env.UPSTASH_REDIS_REST_TOKEN,
        });

        const key = 'test_connection_' + Date.now();
        await redis.set(key, 'success');
        const val = await redis.get(key);
        await redis.del(key);

        if (val === 'success') {
            console.log("✅ Redis is CONNECTED and working (Read/Write verified).");
        } else {
            console.error("❌ Redis Write succeeded but Read returned mismatch:", val);
        }

    } catch (e) {
        console.error("❌ Redis Connection Failed:", e.message);
    }
}

testConnection();
