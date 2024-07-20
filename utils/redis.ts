import { Redis } from "ioredis";
require('dotenv').config();

const redisClient = () => {
    if (process.env.REDIS_URL) {
        console.log(`Connecting to Redis at ${process.env.REDIS_URL}`);
        return process.env.REDIS_URL;
    }
    throw new Error('Redis connection URL is missing');
};

export const redis = new Redis(redisClient(), {
    maxRetriesPerRequest: 50, // Increase retries if necessary
    enableOfflineQueue: false, // Disable offline queue if you prefer to fail fast
});

// Event listeners for better error handling and debugging
redis.on('connect', () => {
    console.log('Redis client connected');
});

redis.on('error', (err) => {
    console.error('Redis connection error:', err);
});

redis.on('reconnecting', () => {
    console.log('Redis client reconnecting');
});
