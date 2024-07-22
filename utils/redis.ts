import Redis from 'ioredis';
require('dotenv').config();

const redisClient = () => {
    if (process.env.REDIS_URL) {
        console.log(`Connecting to Redis...`);

        const redis = new Redis(process.env.REDIS_URL, {
            enableOfflineQueue: true, // Enable offline queueing
            retryStrategy: (times) => {
                // Exponential backoff for retry strategy
                return Math.min(times * 50, 2000);
            },
        });

        redis.on('error', (err) => {
            console.error('Redis error:', err);
        });

        redis.on('connect', () => {
            console.log('Connected to Redis');

            // Set memory limits and eviction policy programmatically
            redis.config('SET', 'maxmemory', '256mb').catch(console.error);
            redis.config('SET', 'maxmemory-policy', 'allkeys-lru').catch(console.error);
        });

        redis.on('reconnecting', () => {
            console.log('Reconnecting to Redis');
        });

        return redis;
    }
    throw new Error('Redis connection failed');
};

export const redis = redisClient();
