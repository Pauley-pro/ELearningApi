"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
const ioredis_1 = require("ioredis");
require('dotenv').config();
const redisClient = () => {
    if (process.env.REDIS_URL) {
        console.log(`Connecting to Redis at ${process.env.REDIS_URL}`);
        return process.env.REDIS_URL;
    }
    throw new Error('Redis connection URL is missing');
};
exports.redis = new ioredis_1.Redis(redisClient(), {
    maxRetriesPerRequest: 50,
    enableOfflineQueue: false, // Disable offline queue if you prefer to fail fast
});
// Event listeners for better error handling and debugging
exports.redis.on('connect', () => {
    console.log('Redis client connected');
});
exports.redis.on('error', (err) => {
    console.error('Redis connection error:', err);
});
exports.redis.on('reconnecting', () => {
    console.log('Redis client reconnecting');
});
