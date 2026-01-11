import { Redis } from '@upstash/redis'

// Check if Redis environment variables are available
const redisUrl = process.env.UPSTASH_REDIS_REST_URL
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

if (!redisUrl || !redisToken) {
    console.warn('Redis environment variables not found. Redis caching will be disabled.')
}

export const redis = redisUrl && redisToken ? new Redis({
    url: redisUrl,
    token: redisToken,
}) : null
