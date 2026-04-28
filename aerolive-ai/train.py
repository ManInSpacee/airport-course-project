import os
import kagglehub
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib

print("Скачиваем датасет...")
path = kagglehub.dataset_download("usdot/flight-delays")
flights_path = os.path.join(path, "flights.csv")
print(f"Датасет: {flights_path}")

print("Загружаем данные...")
df = pd.read_csv(
    flights_path,
    usecols=[
        "MONTH", "DAY", "DAY_OF_WEEK",
        "DEPARTURE_TIME", "ARRIVAL_DELAY",
        "CANCELLED", "ORIGIN_AIRPORT", "DESTINATION_AIRPORT"
    ],
    low_memory=False
)

df = df.sample(n=300_000, random_state=42).reset_index(drop=True)
print(f"Строк после выборки: {len(df)}")

# --- Признак: hour ---
df["hour"] = (df["DEPARTURE_TIME"].fillna(0) // 100).astype(int).clip(0, 23)

# --- Признак: is_weekend ---
df["is_weekend"] = df["DAY_OF_WEEK"].isin([6, 7]).astype(int)

# --- Признак: gate_load ---
df["gate_load"] = (
    df.groupby(["ORIGIN_AIRPORT", "MONTH", "DAY", "hour"])["hour"]
    .transform("count") - 1
).clip(0, 10).astype(int)

# --- Признак: historical_delays ---
df["is_delayed_flag"] = (
    (df["ARRIVAL_DELAY"].fillna(0) > 15) | (df["CANCELLED"] == 1)
).astype(int)

route_rate = (
    df.groupby(["ORIGIN_AIRPORT", "DESTINATION_AIRPORT"])["is_delayed_flag"]
    .mean()
    .rename("delay_rate")
)
df = df.join(route_rate, on=["ORIGIN_AIRPORT", "DESTINATION_AIRPORT"])
df["historical_delays"] = (df["delay_rate"] * 10).round().clip(0, 10).fillna(0).astype(int)

# --- Целевая переменная ---
df["risk"] = 0
df.loc[df["ARRIVAL_DELAY"].fillna(0) > 15, "risk"] = 1
df.loc[(df["ARRIVAL_DELAY"].fillna(0) > 45) | (df["CANCELLED"] == 1), "risk"] = 2

df = df.dropna(subset=["hour", "is_weekend", "gate_load", "historical_delays"])

print("\nРаспределение классов:")
print(df["risk"].value_counts().sort_index().rename({0: "LOW", 1: "MEDIUM", 2: "HIGH"}))

features = ["hour", "is_weekend", "gate_load", "historical_delays"]
X = df[features]
y = df["risk"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print("\nОбучаем модель...")
model = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1, class_weight="balanced")
model.fit(X_train, y_train)

print("\nОценка модели:")
print(classification_report(y_test, model.predict(X_test), target_names=["LOW", "MEDIUM", "HIGH"]))

out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "model.joblib")
joblib.dump(model, out)
print(f"\nМодель сохранена: {out}")

