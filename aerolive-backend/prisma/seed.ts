import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

function daysAgo(d: number) {
  return new Date(Date.now() - d * 86400000);
}

function hoursFromNow(h: number) {
  return new Date(Date.now() + h * 3600000);
}

const AIRLINES = {
  SU: { name: "Аэрофлот", aircraft: ["Airbus A320", "Airbus A321", "Boeing 737-800", "Airbus A330-300"] },
  U6: { name: "Уральские авиалинии", aircraft: ["Airbus A320", "Airbus A321"] },
  DP: { name: "Победа", aircraft: ["Boeing 737-800"] },
  S7: { name: "S7 Airlines", aircraft: ["Airbus A320neo", "Embraer E170"] },
  N4: { name: "Nordwind Airlines", aircraft: ["Boeing 737-800", "Airbus A321"] },
};

function tail() {
  return "RA-" + (Math.floor(Math.random() * 90000) + 10000);
}

async function main() {
  // --- 1. Полная очистка операционных данных ---
  console.log("Очищаю операционные данные...");
  await prisma.auditLog.deleteMany();
  await prisma.flight.deleteMany();
  await prisma.flightHistory.deleteMany();

  // --- 2. Пользователи (upsert — не теряем логины) ---
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

  // --- 3. Гейты ---
  const gateNames = [
    ["A1", "A"], ["A2", "A"], ["A3", "A"],
    ["B1", "B"], ["B2", "B"], ["B3", "B"],
    ["C1", "C"], ["C2", "C"],
    ["D1", "D"], ["D2", "D"],
  ] as const;

  const gates = await Promise.all(
    gateNames.map(([name, terminal]) =>
      prisma.gate.upsert({
        where: { name },
        update: { terminal },
        create: { name, terminal },
      })
    )
  );
  const g = Object.fromEntries(gates.map(x => [x.name, x.id]));

  // --- 4. Историческая база рейсов из/в Москву (последние 30 дней) ---
  // Эти данные нужны для ML — модель учится по истории задержек на маршрутах
  const historicalRoutes: Array<{ from: string; to: string; airline: keyof typeof AIRLINES; delays: number; ok: number }> = [
    { from: "Москва (SVO)", to: "Сочи (AER)", airline: "SU", delays: 5, ok: 3 },
    { from: "Москва (SVO)", to: "Сочи (AER)", airline: "DP", delays: 4, ok: 2 },
    { from: "Москва (VKO)", to: "Минеральные Воды (MRV)", airline: "DP", delays: 3, ok: 1 },
    { from: "Москва (SVO)", to: "Казань (KZN)", airline: "SU", delays: 2, ok: 5 },
    { from: "Москва (DME)", to: "Новосибирск (OVB)", airline: "S7", delays: 2, ok: 4 },
    { from: "Москва (SVO)", to: "Екатеринбург (SVX)", airline: "U6", delays: 1, ok: 3 },
    { from: "Москва (SVO)", to: "Санкт-Петербург (LED)", airline: "SU", delays: 0, ok: 8 },
    { from: "Москва (DME)", to: "Санкт-Петербург (LED)", airline: "S7", delays: 0, ok: 5 },
    { from: "Москва (SVO)", to: "Калининград (KGD)", airline: "SU", delays: 0, ok: 4 },
  ];

  let histCounter = 1;
  for (const route of historicalRoutes) {
    const total = route.delays + route.ok;
    for (let i = 0; i < total; i++) {
      const isDelayed = i < route.delays;
      const ago = Math.floor(Math.random() * 29) + 1; // 1-29 дней назад
      const dep = daysAgo(ago);
      dep.setHours(6 + Math.floor(Math.random() * 16)); // 06:00-22:00
      const arr = new Date(dep.getTime() + (1.5 + Math.random() * 3) * 3600000);
      const airline = AIRLINES[route.airline];
      const flightNumber = `H-${String(histCounter++).padStart(3, "0")}`;

      await prisma.flight.create({
        data: {
          flightNumber,
          origin: route.from,
          destination: route.to,
          departureTime: dep,
          arrivalTime: arr,
          status: isDelayed ? (Math.random() > 0.7 ? "CANCELLED" : "DELAYED") : "ARRIVED",
          airlineName: airline.name,
          airlineCode: route.airline,
          aircraftModel: airline.aircraft[Math.floor(Math.random() * airline.aircraft.length)],
          aircraftRegistration: tail(),
          createdById: admin.id,
        },
      });
    }
  }

  // --- 5. Текущие рейсы (актуальное расписание) ---
  const currentFlights = [
    // НИЗКИЙ РИСК: дневной рейс на чистом маршруте
    {
      number: "SU-006", from: "Москва (SVO)", to: "Санкт-Петербург (LED)", airline: "SU" as const,
      dep: 10, arr: 11.5, gate: "A1", status: "SCHEDULED" as const,
    },
    {
      number: "SU-012", from: "Москва (SVO)", to: "Калининград (KGD)", airline: "SU" as const,
      dep: 8, arr: 10.5, gate: "A2", status: "SCHEDULED" as const,
    },
    // СРЕДНИЙ РИСК: вечер + умеренная история задержек
    {
      number: "S7-1015", from: "Москва (DME)", to: "Новосибирск (OVB)", airline: "S7" as const,
      dep: 5, arr: 9, gate: "B1", status: "SCHEDULED" as const,
    },
    {
      number: "U6-126", from: "Москва (SVO)", to: "Екатеринбург (SVX)", airline: "U6" as const,
      dep: 3, arr: 5.5, gate: "C1", status: "SCHEDULED" as const,
    },
    // Соседи U6-126 на C1 — нагрузка гейта
    {
      number: "U6-128", from: "Москва (SVO)", to: "Уфа (UFA)", airline: "U6" as const,
      dep: 2, arr: 4, gate: "C1", status: "BOARDING" as const,
    },
    // ВЫСОКИЙ РИСК: ночной + проблемный маршрут + перегруженный гейт
    {
      number: "DP-407", from: "Москва (VKO)", to: "Сочи (AER)", airline: "DP" as const,
      dep: 1, arr: 3.5, gate: "B2", status: "DELAYED" as const,
    },
    {
      number: "DP-409", from: "Москва (VKO)", to: "Минеральные Воды (MRV)", airline: "DP" as const,
      dep: 0.5, arr: 3, gate: "B2", status: "BOARDING" as const,
    },
    {
      number: "DP-411", from: "Москва (VKO)", to: "Краснодар (KRR)", airline: "DP" as const,
      dep: 1.5, arr: 4, gate: "B2", status: "SCHEDULED" as const,
    },
    {
      number: "N4-538", from: "Москва (SVO)", to: "Анталья (AYT)", airline: "N4" as const,
      dep: 6, arr: 10.5, gate: "D1", status: "SCHEDULED" as const,
    },
    {
      number: "SU-1404", from: "Москва (SVO)", to: "Казань (KZN)", airline: "SU" as const,
      dep: 4, arr: 5.5, gate: "A3", status: "SCHEDULED" as const,
    },
  ];

  for (const f of currentFlights) {
    const airline = AIRLINES[f.airline];
    const isNight = f.number.startsWith("DP-40");
    let depTime = hoursFromNow(f.dep);
    if (isNight) depTime.setHours(2 + (depTime.getHours() % 3));

    await prisma.flight.create({
      data: {
        flightNumber: f.number,
        origin: f.from,
        destination: f.to,
        departureTime: depTime,
        arrivalTime: new Date(depTime.getTime() + (f.arr - f.dep) * 3600000),
        gateId: g[f.gate],
        status: f.status,
        airlineName: airline.name,
        airlineCode: f.airline,
        aircraftModel: airline.aircraft[Math.floor(Math.random() * airline.aircraft.length)],
        aircraftRegistration: tail(),
        createdById: f.number.startsWith("SU") ? admin.id : dispatcher.id,
      },
    });
  }

  const total = await prisma.flight.count();
  console.log(`✓ Создано рейсов: ${total} (исторических + текущих)`);
  console.log(`✓ Пользователи: admin@airport.com / admin123, dispatcher@airport.com / disp123`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
