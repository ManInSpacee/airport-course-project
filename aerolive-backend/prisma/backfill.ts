import 'dotenv/config'
import { prisma } from '../src/lib/prisma'

const airlines = [
  { name: 'Аэрофлот', code: 'SU', models: ['Airbus A320', 'Airbus A321', 'Boeing 737-800'] },
  { name: 'Уральские авиалинии', code: 'U6', models: ['Airbus A320', 'Airbus A321'] },
  { name: 'Победа', code: 'DP', models: ['Boeing 737-800'] },
  { name: 'S7 Airlines', code: 'S7', models: ['Airbus A320neo', 'Embraer E170'] },
]

async function main() {
  const flights = await prisma.flight.findMany({ where: { airlineCode: null } })
  console.log('Найдено рейсов без данных авиакомпании:', flights.length)
  for (const f of flights) {
    const a = airlines[Math.floor(Math.random() * airlines.length)]
    const model = a.models[Math.floor(Math.random() * a.models.length)]
    const reg = 'RA-' + (Math.floor(Math.random() * 90000) + 10000)
    await prisma.flight.update({
      where: { id: f.id },
      data: {
        airlineName: a.name,
        airlineCode: a.code,
        aircraftModel: model,
        aircraftRegistration: reg,
      },
    })
  }
  console.log('Обновлено:', flights.length)
}

main().catch(console.error).finally(() => prisma.$disconnect())
