export async function getMLScore(features: any) {
    const res = await fetch("http://ml-service:8000/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(features),
    })

    const data = await res.json()
    return data.ml_score
}
