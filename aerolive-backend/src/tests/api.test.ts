import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app";

// Логин с реальным пользователем из seed
const ADMIN = { email: "admin@airport.com", password: "admin123" };

function hoursFromNow(h: number) {
  return new Date(Date.now() + h * 3600000).toISOString();
}

async function getToken() {
  const res = await request(app).post("/api/auth/login").send(ADMIN);
  return res.body.token as string;
}

describe("POST /api/auth/login", () => {
  it("возвращает токен при верных данных", async () => {
    const res = await request(app).post("/api/auth/login").send(ADMIN);
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it("возвращает 401 при неверном пароле", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: ADMIN.email, password: "wrongpass" });
    expect(res.status).toBe(401);
  });
});

describe("GET /api/auth/me", () => {
  it("возвращает данные пользователя с токеном", async () => {
    const token = await getToken();
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(ADMIN.email);
  });

  it("возвращает 401 без токена", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });
});

describe("POST /api/flights", () => {
  it("возвращает 400 если номер рейса в неверном формате", async () => {
    const token = await getToken();
    const res = await request(app)
      .post("/api/flights")
      .set("Authorization", `Bearer ${token}`)
      .send({
        flight_number: "INVALID",
        origin: "Москва (SVO)",
        destination: "Сочи (AER)",
        departure_time: hoursFromNow(2),
        arrival_time: hoursFromNow(4),
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("формат");
  });

  it("возвращает 401 без токена", async () => {
    const res = await request(app)
      .post("/api/flights")
      .send({
        flight_number: "SU-101",
        origin: "Москва (SVO)",
        destination: "Сочи (AER)",
        departure_time: hoursFromNow(2),
        arrival_time: hoursFromNow(4),
      });
    expect(res.status).toBe(401);
  });

  it("возвращает 400 если откуда и куда совпадают", async () => {
    const token = await getToken();
    const res = await request(app)
      .post("/api/flights")
      .set("Authorization", `Bearer ${token}`)
      .send({
        flight_number: "SU-102",
        origin: "Москва",
        destination: "Москва",
        departure_time: hoursFromNow(2),
        arrival_time: hoursFromNow(4),
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("совпадать");
  });

  it("возвращает 400 если прилёт раньше вылета", async () => {
    const token = await getToken();
    const res = await request(app)
      .post("/api/flights")
      .set("Authorization", `Bearer ${token}`)
      .send({
        flight_number: "SU-103",
        origin: "Москва (SVO)",
        destination: "Сочи (AER)",
        departure_time: hoursFromNow(4),
        arrival_time: hoursFromNow(2),
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("позже");
  });

  it("создаёт рейс с корректными данными", async () => {
    const token = await getToken();
    const number = `SU-${Math.floor(Math.random() * 9000) + 1000}`;
    const res = await request(app)
      .post("/api/flights")
      .set("Authorization", `Bearer ${token}`)
      .send({
        flight_number: number,
        origin: "Москва (SVO)",
        destination: "Казань (KZN)",
        departure_time: hoursFromNow(24),
        arrival_time: hoursFromNow(26),
      });
    expect(res.status).toBe(201);
    expect(res.body.flightNumber).toBe(number);
  });
});

describe("GET /api/flights", () => {
  it("возвращает список рейсов", async () => {
    const token = await getToken();
    const res = await request(app)
      .get("/api/flights")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("возвращает 401 без токена", async () => {
    const res = await request(app).get("/api/flights");
    expect(res.status).toBe(401);
  });

  it("поддерживает фильтрацию по статусу", async () => {
    const token = await getToken();
    const res = await request(app)
      .get("/api/flights?status=SCHEDULED")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
