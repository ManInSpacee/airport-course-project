const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function calculateDelayRisk(flightId) {
  const flight = await prisma.flight.findUnique({
    where: { id: flightId },
    include: { gate: true }
  })
  if (!flight) return null

  let score = 0
  const reasons = []
  const departureTime = new Date(flight.departureTime)

  //Загрузка гейта - рейсы на том же гейте в пределах 2 часов
  if (flight.gateId) {
    const from = new Date(departureTime.getTime() - 2 * 3600000)
    const to = new Date(departureTime.getTime() + 2 * 3600000)
    const gateLoad = await prisma.flight.count({
      where: {
        gateId: flight.gateId,
        id: { not: flightId },
        departureTime: { gte: from, lte: to },
        status: { notIn: ['CANCELLED', 'DEPARTED', 'ARRIVED'] }
      }
    })
    if (gateLoad >= 3) { score += 40; reasons.push('Высокая загрузка гейта') }
    else if (gateLoad >= 2) { score += 25; reasons.push('Средняя загрузка гейта') }
    else if (gateLoad >= 1) { score += 10; reasons.push('Небольшая загрузка гейта') }
  } else {
    score += 15; reasons.push('Гейт не назначен')
  }

  //Час пик (6-9 утра, 16-20 вечера)
  const departureHour = departureTime.getHours()
  if ((departureHour >= 6 && departureHour <= 9) || (departureHour >= 16 && departureHour <= 20)) {
    score += 20; reasons.push('Час пик')
  }

  //Выходной день
  const departureDay = departureTime.getDay()
  if (departureDay === 0 || departureDay === 6) { score += 15; reasons.push('Выходной день') }

  //Количество задержанных рейсов на этом направлении за последние 30 дней
  const thirtyDaysAgo = new Date(departureTime)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const historicalLoad = await prisma.flight.count({
    where: {
      origin: flight.origin,
      destination: flight.destination,
      departureTime: { gte: thirtyDaysAgo, lt: departureTime },
      status: { in: ['DELAYED', 'CANCELLED'] }
    }
  })
  if (historicalLoad >= 5) { score += 20; reasons.push('Часто задерживается это направление') }
  else if (historicalLoad >= 2) { score += 10; reasons.push('Бывали задержки на этом направлении') }

  //Рейс уже задержан
  if (flight.status === 'DELAYED') { score += 30; reasons.push('Рейс уже задержан') }

  score = Math.min(score, 100)
  const level = score <= 33 ? 'LOW' : score <= 66 ? 'MEDIUM' : 'HIGH'
  const interpretation = score <= 33 ? 'Низкий риск задержки' : score <= 66 ? 'Средний риск задержки' : 'Высокий риск задержки'

  return { score, level, interpretation, reasons, flight: { id: flight.id, flightNumber: flight.flightNumber } }
}

module.exports = { calculateDelayRisk }
