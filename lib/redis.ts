import { redis } from '@/lib/redisClient'

type RiskCalculator = () => Promise<number>

export async function getCachedRiskScore(
    userId: string,
    amount: number,
    calculateRisk: RiskCalculator
): Promise<number> {

    const key = `risk:${userId}:${amount}`

    const cached = await redis.get(key)
    if (cached) {
        return Number(cached)
    }

    const score = await calculateRisk()

    await redis.set(key, score.toString(), { ex: 600 }) // 10 minutes

    return score
}
