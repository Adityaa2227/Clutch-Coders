const RedisService = require('../services/RedisService');

const rateLimit = (limit, windowSeconds, errorMessage = 'Too many requests') => {
    return async (req, res, next) => {
        const key = `rate:${req.ip}:${req.originalUrl}`;
        const allowed = await RedisService.checkRateLimit(key, limit, windowSeconds);
        
        if (!allowed) {
            return res.status(429).json({ msg: errorMessage });
        }
        next();
    };
};

module.exports = rateLimit;
