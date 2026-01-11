
import { db } from '../lib/db'
import { redis } from '../lib/redisClient'

async function check() {
    console.log("🔍 Checking Environment...")

    // 1. Check Redis
    try {
        console.log("👉 Checking Redis...")
        if (!process.env.UPSTASH_REDIS_REST_URL) console.error("❌ UPSTASH_REDIS_REST_URL is missing")
        else console.log("✅ UPSTASH_REDIS_REST_URL is set")

        await redis.set('test-key', 'ok')
        const val = await redis.get('test-key')
        if (val === 'ok') console.log("✅ Redis Connection Successful")
        else console.error("❌ Redis returned wrong value:", val)
    } catch (e: any) {
        console.error("❌ Redis Connection Failed:", e.message)
    }

    // 2. Check Database
    try {
        console.log("👉 Checking Database...")
        const userCount = await db.user.count()
        console.log("✅ Database Connection Successful. Users:", userCount)
    } catch (e: any) {
        console.error("❌ Database Connection Failed:", e.message)
    }

    // 3. Check ML Service
    try {
        console.log("👉 Checking ML Service (http://localhost:8000)...")
        const res = await fetch('http://localhost:8000/docs')
        if (res.ok) console.log("✅ ML Service is reachable")
        else console.error("❌ ML Service returned:", res.status)
    } catch (e: any) { // Type 'any' to catch fetch errors
        console.error("❌ ML Service Unreachable:", e.cause?.code || e.message)
    }
}

check()
