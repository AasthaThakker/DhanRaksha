from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import numpy as np
import os

app = FastAPI()

# Load the model
model_path = os.path.join(os.path.dirname(__file__), "fraud_model.pkl")
if os.path.exists(model_path):
    model = joblib.load(model_path)
else:
    model = None

class Features(BaseModel):
    avg_amount_7d: float
    tx_velocity_1h: float
    device_change_freq: float
    time_of_day_deviation: float

@app.post("/score")
async def score(features: Features):
    if model is None:
        return {"ml_score": 0, "error": "Model not loaded"}
    
    # Convert dict to array in correct order
    X = np.array([[
        features.avg_amount_7d,
        features.tx_velocity_1h,
        features.device_change_freq,
        features.time_of_day_deviation
    ]])
    
    # Isolation Forest: decision_function returns raw anomaly score
    # Lower = more anomalous
    raw = model.decision_function(X)[0]

    # Convert to 0-100 scale (Higher = riskier)
    # raw is usually between -0.5 and 0.5
    # (1 - raw) * 50 maps ~0 to 50, -0.5 to 75+, 0.5 to 25
    risk = int((1 - raw) * 50)
    risk = min(max(risk, 0), 100)

    return { "ml_score": risk }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
