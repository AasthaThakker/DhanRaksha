export function ruleEngine(input: {
  amount: number
  avgDailyAmount: number
  isNewDevice: boolean
  velocity1m: number
  ipCountry: string
  lastCountry: string
}) {
  let score = 0
  const reasons: string[] = []

  if (input.amount > 3 * input.avgDailyAmount) {
    score += 25
    reasons.push("Amount > 3x daily average")
  }

  if (input.isNewDevice && input.amount > 500) {
    score += 20
    reasons.push("New device + high amount")
  }

  if (input.velocity1m > 3) {
    score += 15
    reasons.push("High transaction velocity")
  }

  if (input.ipCountry !== input.lastCountry) {
    score += 20
    reasons.push("Geo/IP mismatch")
  }

  return { ruleScore: Math.min(score, 60), reasons }
}
