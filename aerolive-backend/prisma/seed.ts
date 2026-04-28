import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

function daysAgo(d: number) {
  return new Date(Date.now() - d * 86400000);
}

function hoursFromNow(h: number) {
  return new Date(Date.now() + h * 3600000);
}

async function main() {
  // --- Пользователи ---
  const adminHash = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@airport.com" },
    update: {},
    create: { username: "admin", email: "admin@airport.com", passwordHash: adminHash, role: "ADMIN" },
  });

  const dispHash = await bcrypt.hash("disp123", 10);
  const dispatcher = await prisma.user.upsert({
    where: { email: "dispatcher@airport.com" },
    update: {},
    create: { username: "dispatcher", email: "dispatcher@airport.com", passwordHash: dispHash, role: "DISPATCHER" },
  });

  // --- Гейты ---
  const [gA1, gA2, gB1, gB2, gC1] = await Promise.all([
    prisma.gate.upsert({ where: { name: "A1" }, update: {}, create: { name: "A1", terminal: "A" } }),
    prisma.gate.upsert({ where: { name: "A2" }, update: {}, create: { name: "A2", terminal: "A" } }),
    prisma.gate.upsert({ where: { name: "B1" }, update: {}, create: { name: "B1", terminal: "B" } }),
    prisma.gate.upsert({ where: { name: "B2" }, update: {}, create: { name: "B2", terminal: "B" } }),
    prisma.gate.upsert({ where: { name: "C1" }, update: {}, create: { name: "C1", terminal: "C" } }),
  ]);

  // --- Исторические рейсы (30 дней назад) для маршрутов с высоким риском ---
  // Москва → Сочи — проблемный маршрут, много задержек
  const historicalFlights = [
    { fn: "H-001", from: "Москва", to: "Сочи", dep: daysAgo(28), arr: daysAgo(28), gate: gB1.id, status: "DELAYED" },
    { fn: "H-002", from: "Москва", to: "Сочи", dep: daysAgo(25), arr: daysAgo(25), gate: gB1.id, status: "DELAYED" },
    { fn: "H-003", from: "Москва", to: "Сочи", dep: daysAgo(21), arr: daysAgo(21), gate: gB2.id, status: "CANCELLED" },
    { fn: "H-004", from: "Москва", to: "Сочи", dep: daysAgo(18), arr: daysAgo(18), gate: gB1.id, status: "DELAYED" },
    { fn: "H-005", from: "Москва", to: "Сочи", dep: daysAgo(14), arr: daysAgo(14), gate: gB2.id, status: "DELAYED" },
    { fn: "H-006", from: "Москва", to: "Сочи", dep: daysAgo(10), arr: daysAgo(10), gate: gB1.id, status: "CANCELLED" },
    { fn: "H-007", from: "Москва", to: "Сочи", dep: daysAgo(7),  arr: daysAgo(7),  gate: gB2.id, status: "DELAYED" },
    // Казань → Новосибирск — средний риск, пара задержек
    { fn: "H-010", from: "Казань", to: "Новосибирск", dep: daysAgo(20), arr: daysAgo(20), gate: gA2.id, status: "DELAYED" },
    { fn: "H-011", from: "Казань", to: "Новосибирск", dep: daysAgo(10), arr: daysAgo(10), gate: gA2.id, status: "ARRIVED" },
    // Москва → Санкт-Петербург — чистый маршрут, задержек нет
    { fn: "H-020", from: "Москва", to: "Санкт-Петербург", dep: daysAgo(15), arr: daysAgo(15), gate: gA1.id, status: "ARRIVED" },
    { fn: "H-021", from: "Москва", to: "Санкт-Петербург", dep: daysAgo(8),  arr: daysAgo(8),  gate: gA1.id, status: "ARRIVED" },
  ];

  for (const f of historicalFlights) {
    const arr = new Date(f.arr.getTime() + 2 * 3600000);
    await prisma.flight.upsert({
      where: { flightNumber: f.fn },
      update: {},
      create: {
        flightNumber: f.fn,
        origin: f.from,
        destination: f.to,
        departureTime: f.dep,
        arrivalTime: arr,
        gateId: f.gate,
        status: f.status as any,
        createdById: admin.id,
      },
    });
  }

  // --- Текущие рейсы для демонстрации AI ---

  // НИЗКИЙ РИСК: дневной рейс, чистый маршрут, свободный гейт
  await prisma.flight.upsert({
    where: { flightNumber: "SU-101" },
    update: {},
    create: {
      flightNumber: "SU-101",
      origin: "Москва",
      destination: "Санкт-Петербург",
      departureTime: hoursFromNow(10), // дневное время
      arrivalTime: hoursFromNow(11.5),
      gateId: gA1.id,
      status: "SCHEDULED",
      createdById: admin.id,
    },
  });

  // СРЕДНИЙ РИСК: вечерний рейс, пара задержек в истории, гейт слегка занят
  await prisma.flight.upsert({
    where: { flightNumber: "U6-205" },
    update: {},
    create: {
      flightNumber: "U6-205",
      origin: "Казань",
      destination: "Новосибирск",
      departureTime: hoursFromNow(3),
      arrivalTime: hoursFromNow(7),
      gateId: gA2.id,
      status: "SCHEDULED",
      createdById: dispatcher.id,
    },
  });

  // Соседний рейс на том же гейте A2 — создаёт нагрузку для U6-205
  await prisma.flight.upsert({
    where: { flightNumber: "U6-206" },
    update: {},
    create: {
      flightNumber: "U6-206",
      origin: "Казань",
      destination: "Уфа",
      departureTime: hoursFromNow(2),
      arrivalTime: hoursFromNow(4),
      gateId: gA2.id,
      status: "BOARDING",
      createdById: dispatcher.id,
    },
  });

  // ВЫСОКИЙ РИСК: ночной рейс, очень проблемный маршрут (7 задержек за 30 дней), перегруженный гейт
  const nightDep = hoursFromNow(1);
  nightDep.setUTCHours(2); // 2 ночи UTC

  await prisma.flight.upsert({
    where: { flightNumber: "DP-301" },
    update: {},
    create: {
      flightNumber: "DP-301",
      origin: "Москва",
      destination: "Сочи",
      departureTime: nightDep,
      arrivalTime: new Date(nightDep.getTime() + 2.5 * 3600000),
      gateId: gB1.id,
      status: "DELAYED",
      createdById: dispatcher.id,
    },
  });

  // Два соседних рейса на том же гейте B1 — максимальная нагрузка
  await prisma.flight.upsert({
    where: { flightNumber: "DP-302" },
    update: {},
    create: {
      flightNumber: "DP-302",
      origin: "Краснодар",
      destination: "Сочи",
      departureTime: new Date(nightDep.getTime() - 30 * 60000),
      arrivalTime: new Date(nightDep.getTime() + 1.5 * 3600000),
      gateId: gB1.id,
      status: "BOARDING",
      createdById: admin.id,
    },
  });

  await prisma.flight.upsert({
    where: { flightNumber: "DP-303" },
    update: {},
    create: {
      flightNumber: "DP-303",
      origin: "Ростов-на-Дону",
      destination: "Москва",
      departureTime: new Date(nightDep.getTime() - 60 * 60000),
      arrivalTime: new Date(nightDep.getTime() + 0.5 * 3600000),
      gateId: gB1.id,
      status: "SCHEDULED",
      createdById: admin.id,
    },
  });

  // Рейс на отдельном гейте C1 — просто для разнообразия
  await prisma.flight.upsert({
    where: { flightNumber: "S7-401" },
    update: {},
    create: {
      flightNumber: "S7-401",
      origin: "Новосибирск",
      destination: "Москва",
      departureTime: hoursFromNow(6),
      arrivalTime: hoursFromNow(10),
      gateId: gC1.id,
      status: "SCHEDULED",
      createdById: dispatcher.id,
    },
  });

  console.log("Seed выполнен");
  console.log("Admin:      admin@airport.com / admin123");
  console.log("Dispatcher: dispatcher@airport.com / disp123");
  console.log("");
  console.log("Рейсы для демонстрации AI:");
  console.log("  SU-101 (Москва→Питер, гейт A1) — низкий риск");
  console.log("  U6-205 (Казань→Новосибирск, гейт A2) — средний риск");
  console.log("  DP-301 (Москва→Сочи, гейт B1, ночь) — высокий риск");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
