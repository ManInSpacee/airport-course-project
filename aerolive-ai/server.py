from fastapi import FastAPI
from pydantic import BaseModel, Field
import joblib
import numpy as np
import os

app = FastAPI(title="Airport AI — Delay Risk Model")

_dir = os.path.dirname(os.path.abspath(__file__))
model = joblib.load(os.path.join(_dir, "model.joblib"))

LABELS = {0: "LOW", 1: "MEDIUM", 2: "HIGH"}
INTERPRETATIONS = {
    0: "Низкий риск задержки",
    1: "Средний риск задержки",
    2: "Высокий риск задержки"
}

class FlightFeatures(BaseModel):
    hour: int = Field(..., ge=0, le=23, description="Час вылета (0–23)")
    is_weekend: int = Field(..., ge=0, le=1, description="Выходной день (0 или 1)")
    gate_load: int = Field(..., ge=0, le=10, description="Кол-во рейсов на гейте в ±2 часа (0–10)")
    historical_delays: int = Field(..., ge=0, le=50, description="Задержки на маршруте за 30 дней (0–50)")

def get_reasons(features: FlightFeatures) -> list[str]:
    reasons = []
    is_peak = (6 <= features.hour <= 9) or (16 <= features.hour <= 20)

    if features.gate_load >= 3:
        reasons.append("Высокая загрузка гейта")
    elif features.gate_load >= 1:
        reasons.append("Умеренная загрузка гейта")

    if features.historical_delays >= 5:
        reasons.append("Частые задержки на данном маршруте")
    elif features.historical_delays >= 2:
        reasons.append("Повышенная история задержек на маршруте")

    if is_peak:
        reasons.append("Час пик")

    if features.is_weekend:
        reasons.append("Повышенный пассажиропоток в выходной день")

    if not reasons:
        reasons.append("Нет выраженных факторов риска")

    return reasons

def get_expected_minutes(score: int, prediction: int) -> int:
    if prediction == 0:
        return round(score * 0.3)        # LOW:    0–10 мин (score 0–33)
    if prediction == 1:
        return round(10 + (score - 33) * 0.9)  # MEDIUM: 10–40 мин
    return round(40 + (score - 66) * 1.5)      # HIGH:   40–91 мин

@app.post("/predict")
def predict(features: FlightFeatures):
    X = np.array([[
        features.hour,
        features.is_weekend,
        features.gate_load,
        features.historical_delays
    ]])

    prediction = int(model.predict(X)[0])
    probabilities = model.predict_proba(X)[0]
    confidence = round(float(probabilities[prediction]) * 100)

    return {
        "level": LABELS[prediction],
        "interpretation": INTERPRETATIONS[prediction],
        "confidence": confidence,
        "probabilities": {
            "LOW": round(float(probabilities[0]) * 100),
            "MEDIUM": round(float(probabilities[1]) * 100),
            "HIGH": round(float(probabilities[2]) * 100)
        },
        "expected_delay_minutes": get_expected_minutes(confidence, prediction),
        "reasons": get_reasons(features)
    }

@app.get("/health")
def health():
    return {"status": "ok"}
