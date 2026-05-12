import os
from dotenv import load_dotenv
load_dotenv()
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib
from sqlalchemy import create_engine

DATABASE_URL = os.environ["DATABASE_URL"]

engine = create_engine(DATABASE_URL)
with engine.connect() as conn:
    df = pd.read_sql("SELECT * FROM flight_history", conn)
engine.dispose()

df["hour"] = (df["departure_time"].fillna(0) // 100).astype(int).clip(0, 23)

df["is_weekend"] = df["day_of_week"].isin([6, 7]).astype(int)

df["gate_load"] = (
    df.groupby(["origin_airport", "month", "day", "hour"])["hour"]
    .transform("count") - 1
).clip(0, 10).astype(int)

df["is_delayed_flag"] = (
    (df["arrival_delay"].fillna(0) > 15) | (df["cancelled"] == 1)
).astype(int)

route_rate = (
    df.groupby(["origin_airport", "destination_airport"])["is_delayed_flag"]
    .mean()
    .rename("delay_rate")
)
df = df.join(route_rate, on=["origin_airport", "destination_airport"])
df["historical_delays"] = (df["delay_rate"] * 10).round().clip(0, 10).fillna(0).astype(int)

df["risk"] = 0
df.loc[df["arrival_delay"].fillna(0) > 15, "risk"] = 1
df.loc[(df["arrival_delay"].fillna(0) > 45) | (df["cancelled"] == 1), "risk"] = 2

df = df.dropna(subset=["hour", "is_weekend", "gate_load", "historical_delays"])

print(df["risk"].value_counts().sort_index().rename({0: "LOW", 1: "MEDIUM", 2: "HIGH"}))

features = ["hour", "is_weekend", "gate_load", "historical_delays"]
X = df[features]
y = df["risk"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1, class_weight="balanced")
model.fit(X_train, y_train)

print(classification_report(y_test, model.predict(X_test), target_names=["LOW", "MEDIUM", "HIGH"]))

out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "model.joblib")
joblib.dump(model, out)
print(f"Модель сохранена: {out}")
