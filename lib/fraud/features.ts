export function buildFeatures(ctx: {
    avgAmount7d: number
    txVelocity1h: number
    deviceChangeFreq: number
    currentHour: number
    usualHourMean: number
}) {
    return {
        avg_amount_7d: ctx.avgAmount7d,
        tx_velocity_1h: ctx.txVelocity1h,
        device_change_freq: ctx.deviceChangeFreq,
        time_of_day_deviation: Math.abs(ctx.currentHour - ctx.usualHourMean),
    }
}
