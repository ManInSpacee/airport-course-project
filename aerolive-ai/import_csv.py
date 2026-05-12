import os
from dotenv import load_dotenv
load_dotenv()
import kagglehub
import pandas as pd
import psycopg2
from psycopg2.extras import execute_values

DATABASE_URL = os.environ["DATABASE_URL"]

path = kagglehub.dataset_download("usdot/flight-delays")
flights_path = os.path.join(path, "flights.csv")

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

df["DEPARTURE_TIME"] = pd.to_numeric(df["DEPARTURE_TIME"], errors="coerce")
df["ARRIVAL_DELAY"] = pd.to_numeric(df["ARRIVAL_DELAY"], errors="coerce")
df["CANCELLED"] = df["CANCELLED"].fillna(0).astype(int)


conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

cur.execute("""
    CREATE TABLE IF NOT EXISTS flight_history (
        id SERIAL PRIMARY KEY,
        month INT,
        day INT,
        day_of_week INT,
        departure_time INT,
        arrival_delay FLOAT,
        cancelled INT,
        origin_airport VARCHAR,
        destination_airport VARCHAR
    )
""")
cur.execute("TRUNCATE TABLE flight_history")

rows = [
    (
        int(row.MONTH),
        int(row.DAY),
        int(row.DAY_OF_WEEK),
        int(row.DEPARTURE_TIME) if pd.notna(row.DEPARTURE_TIME) else None,
        float(row.ARRIVAL_DELAY) if pd.notna(row.ARRIVAL_DELAY) else None,
        int(row.CANCELLED),
        str(row.ORIGIN_AIRPORT),
        str(row.DESTINATION_AIRPORT),
    )
    for row in df.itertuples()
]

execute_values(cur, """
    INSERT INTO flight_history
        (month, day, day_of_week, departure_time, arrival_delay, cancelled, origin_airport, destination_airport)
    VALUES %s
""", rows, page_size=5000)

conn.commit()
cur.close()
conn.close()

