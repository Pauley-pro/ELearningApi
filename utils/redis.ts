import Redis from 'ioredis';
require('dotenv').config();

const redisClient = () => {
    if (process.env.REDIS_URL) {
        console.log('Connecting to Redis...');

        const redis = new Redis(process.env.REDIS_URL, {
            enableOfflineQueue: true,
            retryStrategy: (times) => {
                console.log(`Redis client reconnect attempt: ${times}`);
                // Exponential backoff for retry strategy
                return Math.min(times * 50, 2000);
            },
        });

        redis.on('error', (err) => {
            console.error('Redis connection error:', err);
        });

        redis.on('connect', () => {
            console.log('Connected to Redis');
        });

        redis.on('reconnecting', () => {
            console.log('Redis client reconnecting');
        });

        return redis;
    }
    throw new Error('Redis connection failed');
};

export const redis = redisClient();
