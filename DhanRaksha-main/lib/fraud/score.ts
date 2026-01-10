export function unifiedScore(rule: number, ml: number) {
    return Math.round(rule * 0.6 + ml * 0.4)
}
