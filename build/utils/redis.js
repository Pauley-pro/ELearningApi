"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
require('dotenv').config();
const redisClient = () => {
    if (process.env.REDIS_URL) {
        console.log('Connecting to Redis...');
        const redis = new ioredis_1.default(process.env.REDIS_URL, {
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
        // Set the maximum memory limit
        redis.config('SET', 'maxmemory', '512mb', (err, res) => {
            if (err) {
                console.error('Error setting maxmemory:', err);
            }
            else {
                console.log('Maxmemory set to 512mb:', res);
            }
        });
        // Set the eviction policy to allkeys-lru
        redis.config('SET', 'maxmemory-policy', 'allkeys-lru', (err, res) => {
            if (err) {
                console.error('Error setting maxmemory-policy:', err);
            }
            else {
                console.log('Maxmemory-policy set to allkeys-lru:', res);
            }
        });
        return redis;
    }
    throw new Error('Redis connection failed');
};
exports.redis = redisClient();
