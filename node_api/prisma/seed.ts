import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

async function main() {
  const adminHash = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@airport.com" },
    update: {},
    create: {
      username: "admin",
      email: "admin@airport.com",
      passwordHash: adminHash,
      role: "ADMIN",
    },
  });

  const dispHash = await bcrypt.hash("disp123", 10);
  const dispatcher = await prisma.user.upsert({
    where: { email: "dispatcher@airport.com" },
    update: {},
    create: {
      username: "dispatcher",
      email: "dispatcher@airport.com",
      passwordHash: dispHash,
      role: "DISPATCHER",
    },
  });

  const gates = await Promise.all([
    prisma.gate.upsert({
      where: { name: "A1" },
      update: {},
      create: { name: "A1", terminal: "A" },
    }),
    prisma.gate.upsert({
      where: { name: "A2" },
      update: {},
      create: { name: "A2", terminal: "A" },
    }),
    prisma.gate.upsert({
      where: { name: "B1" },
      update: {},
      create: { name: "B1", terminal: "B" },
    }),
    prisma.gate.upsert({
      where: { name: "B2" },
      update: {},
      create: { name: "B2", terminal: "B" },
    }),
  ]);

  const now = new Date();
  await prisma.flight.upsert({
    where: { flightNumber: "SU-101" },
    update: {},
    create: {
      flightNumber: "SU-101",
      origin: "Москва",
      destination: "Санкт-Петербург",
      departureTime: new Date(now.getTime() + 2 * 3600000),
      arrivalTime: new Date(now.getTime() + 3.5 * 3600000),
      gateId: gates[0].id,
      status: "SCHEDULED",
      createdById: admin.id,
    },
  });
  await prisma.flight.upsert({
    where: { flightNumber: "U6-205" },
    update: {},
    create: {
      flightNumber: "U6-205",
      origin: "Екатеринбург",
      destination: "Москва",
      departureTime: new Date(now.getTime() + 4 * 3600000),
      arrivalTime: new Date(now.getTime() + 6 * 3600000),
      gateId: gates[1].id,
      status: "BOARDING",
      createdById: dispatcher.id,
    },
  });
  await prisma.flight.upsert({
    where: { flightNumber: "DP-301" },
    update: {},
    create: {
      flightNumber: "DP-301",
      origin: "Казань",
      destination: "Сочи",
      departureTime: new Date(now.getTime() + 1 * 3600000),
      arrivalTime: new Date(now.getTime() + 4 * 3600000),
      gateId: gates[2].id,
      status: "DELAYED",
      createdById: dispatcher.id,
    },
  });

  console.log("Seed выполнен");
  console.log("Admin:      admin@airport.com / admin123");
  console.log("Dispatcher: dispatcher@airport.com / disp123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
