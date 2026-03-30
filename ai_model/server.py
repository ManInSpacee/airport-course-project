from fastapi import FastAPI
from pydantic import BaseModel, Field
import joblib
import numpy as np

app = FastAPI(title="Airport AI — Delay Risk Model")

model = joblib.load("ai_model/model.joblib")

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

def get_reason(features: FlightFeatures) -> str:
    if features.gate_load >= 3:
        return "Высокая загрузка гейта"
    if features.historical_delays >= 5:
        return "Частые задержки на данном маршруте"
    is_peak = (6 <= features.hour <= 9) or (16 <= features.hour <= 20)
    if is_peak and features.gate_load >= 2:
        return "Час пик и загруженный гейт"
    if features.historical_delays >= 2:
        return "Повышенная история задержек на маршруте"
    if is_peak:
        return "Час пик"
    if features.is_weekend:
        return "Повышенный пассажиропоток в выходной день"
    if features.gate_load >= 1:
        return "Умеренная загрузка гейта"
    return "Нет выраженных факторов риска"

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
    score = round(float(probabilities[prediction]) * 100)

    return {
        "level": LABELS[prediction],
        "interpretation": INTERPRETATIONS[prediction],
        "score": score,
        "probabilities": {
            "LOW": round(float(probabilities[0]) * 100),
            "MEDIUM": round(float(probabilities[1]) * 100),
            "HIGH": round(float(probabilities[2]) * 100)
        },
        "expected_delay_minutes": get_expected_minutes(score, prediction),
        "reason": get_reason(features)
    }

@app.get("/health")
def health():
    return {"status": "ok"}
