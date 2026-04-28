import { prisma } from '../lib/prisma'

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000'

export async function calculateDelayRisk(flightId: number) {
  const flight = await prisma.flight.findUnique({
    where: { id: flightId },
    include: { gate: true }
  })
  if (!flight) return null

  const departureTime = new Date(flight.departureTime)

  // Загрузка гейта — рейсы на том же гейте в пределах 2 часов
  let gateLoad = 0
  if (flight.gateId) {
    const from = new Date(departureTime.getTime() - 2 * 3600000)
    const to = departureTime
    gateLoad = await prisma.flight.count({
      where: {
        gateId: flight.gateId,
        id: { not: flightId },
        departureTime: { gte: from, lte: to },
        status: { notIn: ['CANCELLED', 'DEPARTED', 'ARRIVED'] }
      }
    })
  }

  // История задержек на маршруте за 30 дней
  const thirtyDaysAgo = new Date(departureTime)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const historicalDelays = await prisma.flight.count({
    where: {
      origin: flight.origin,
      destination: flight.destination,
      departureTime: { gte: thirtyDaysAgo, lt: departureTime },
      status: { in: ['DELAYED', 'CANCELLED'] }
    }
  })

  // Собираем признаки и отправляем в ML сервис
  const features = {
    hour: departureTime.getUTCHours(),
    is_weekend: [0, 6].includes(departureTime.getUTCDay()) ? 1 : 0,
    gate_load: gateLoad,
    historical_delays: historicalDelays
  }

  const response = await fetch(`${ML_SERVICE_URL}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(features)
  })

  const result = await response.json() as any

  return {
    ...result,
    flight: { id: flight.id, flightNumber: flight.flightNumber },
    features
  }
}
