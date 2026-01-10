export function decision(score: number) {
    if (score < 30) return "ALLOW"
    if (score < 70) return "HOLD"
    return "BLOCK"
}
