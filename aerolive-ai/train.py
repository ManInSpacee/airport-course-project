import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib

np.random.seed(42)
n = 2000

# Генерируем признаки
hour = np.random.randint(0, 24, n)
is_weekend = np.random.randint(0, 2, n)
gate_load = np.random.randint(0, 6, n)
historical_delays = np.random.randint(0, 11, n)

score = np.zeros(n)

# Загрузка гейта
score += np.where(gate_load >= 3, 40, np.where(gate_load >= 2, 25, np.where(gate_load >= 1, 10, 0)))

# Час пик
is_peak = ((hour >= 6) & (hour <= 9)) | ((hour >= 16) & (hour <= 20))
score += np.where(is_peak, 20, 0)

# Выходной
score += np.where(is_weekend == 1, 15, 0)

# История задержек
score += np.where(historical_delays >= 5, 20, np.where(historical_delays >= 2, 10, 0))

# Шум
score += np.random.normal(0, 8, n)
score = np.clip(score, 0, 100)

# Метки классов
risk = np.where(score <= 33, 0, np.where(score <= 66, 1, 2))  # 0=LOW, 1=MEDIUM, 2=HIGH

# Датафрейм
df = pd.DataFrame({
    'hour': hour,
    'is_weekend': is_weekend,
    'gate_load': gate_load,
    'historical_delays': historical_delays,
    'risk': risk
})

print("Распределение классов:")
print(df['risk'].value_counts().sort_index().rename({0: 'LOW', 1: 'MEDIUM', 2: 'HIGH'}))

X = df[['hour', 'is_weekend', 'gate_load', 'historical_delays']]
y = df['risk']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

print("\nОценка модели:")
print(classification_report(y_test, model.predict(X_test), target_names=['LOW', 'MEDIUM', 'HIGH']))

joblib.dump(model, 'ai_model/model.joblib')
