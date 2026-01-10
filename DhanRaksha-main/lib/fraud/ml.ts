export async function getMLScore(features: any) {
    // Use localhost for development, ml-service for production
    const mlUrl = process.env.NODE_ENV === 'production' 
        ? "http://ml-service:8000/score" 
        : "http://localhost:8000/score"
    
    // Map feature names to match ML service expectations
    const mappedFeatures = {
        avg_amount_7d: features.avgAmount7d || 0,
        tx_velocity_1h: features.txVelocity1h || 0,
        device_change_freq: features.deviceChangeFreq || 0,
        time_of_day_deviation: Math.abs((features.currentHour || 12) - (features.usualHourMean || 12))
    }
    
    const res = await fetch(mlUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mappedFeatures),
    })

    if (!res.ok) {
        throw new Error(`ML Service responded with status: ${res.status}`)
    }

    const data = await res.json()
    
    if (data.error) {
        throw new Error(`ML Service error: ${data.error}`)
    }
    
    return data.ml_score
}
