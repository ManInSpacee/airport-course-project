import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { authenticate } from '../middleware/auth'
import { requireRole } from '../middleware/requireRole'
import { logAction } from '../utils/audit'

const router = Router()
const VALID_STATUSES = ['SCHEDULED', 'BOARDING', 'DEPARTED', 'ARRIVED', 'DELAYED', 'CANCELLED']

/**
 * @swagger
 * tags:
 *   name: Flights
 *   description: Управление рейсами
 */

/**
 * @swagger
 * /api/flights:
 *   get:
 *     summary: Список рейсов с фильтрацией
 *     tags: [Flights]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [SCHEDULED, BOARDING, DEPARTED, ARRIVED, DELAYED, CANCELLED]
 *       - in: query
 *         name: origin
 *         schema:
 *           type: string
 *       - in: query
 *         name: destination
 *         schema:
 *           type: string
 *       - in: query
 *         name: gate_id
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Список рейсов
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  const { status, origin, destination, gate_id } = req.query as Record<string, string>
  const where: any = {}
  if (status) where.status = status
  if (origin) where.origin = { contains: origin, mode: 'insensitive' }
  if (destination) where.destination = { contains: destination, mode: 'insensitive' }
  if (gate_id) where.gateId = Number(gate_id)

  const flights = await prisma.flight.findMany({
    where,
    include: { gate: true, createdBy: { select: { id: true, username: true } } },
    orderBy: { departureTime: 'asc' }
  })
  res.json(flights)
})

/**
 * @swagger
 * /api/flights/{id}:
 *   get:
 *     summary: Получить рейс по ID
 *     tags: [Flights]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Данные рейса
 *       404:
 *         description: Рейс не найден
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  const flight = await prisma.flight.findUnique({
    where: { id: Number(req.params.id) },
    include: { gate: true, createdBy: { select: { id: true, username: true } } }
  })
  if (!flight) return res.status(404).json({ error: 'Рейс не найден' })
  res.json(flight)
})

/**
 * @swagger
 * /api/flights:
 *   post:
 *     summary: Создать рейс (с проверкой конфликта гейта)
 *     tags: [Flights]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [flight_number, origin, destination, departure_time, arrival_time]
 *             properties:
 *               flight_number:
 *                 type: string
 *                 example: SU-999
 *               origin:
 *                 type: string
 *                 example: Москва
 *               destination:
 *                 type: string
 *                 example: Сочи
 *               departure_time:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-03-20T10:00:00Z"
 *               arrival_time:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-03-20T12:30:00Z"
 *               gate_id:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Рейс создан
 *       409:
 *         description: Конфликт гейта
 */
router.post('/', authenticate, async (req: Request, res: Response) => {
  const { flight_number, origin, destination, departure_time, arrival_time, gate_id } = req.body

  if (new Date(arrival_time) <= new Date(departure_time)) {
    return res.status(400).json({ error: 'Время прилёта должно быть позже времени вылета' })
  }

  if (gate_id) {
    const dep = new Date(departure_time)
    const arr = new Date(arrival_time)
    const conflict = await prisma.flight.findFirst({
      where: {
        gateId: Number(gate_id),
        status: { notIn: ['CANCELLED', 'DEPARTED', 'ARRIVED'] },
        departureTime: { lte: arr },
        arrivalTime: { gte: dep }
      }
    })
    if (conflict) {
      return res.status(409).json({
        error: 'Конфликт гейта',
        conflict: `Рейс ${conflict.flightNumber} уже занимает этот гейт в указанное время`
      })
    }
  }

  try {
    const flight = await prisma.flight.create({
      data: {
        flightNumber: flight_number, origin, destination,
        departureTime: new Date(departure_time),
        arrivalTime: new Date(arrival_time),
        gateId: gate_id ? Number(gate_id) : null,
        createdById: req.user!.id
      },
      include: { gate: true }
    })
    await logAction(req.user!.id, 'CREATE', 'Flight', flight.id, `Создан рейс ${flight_number}`)
    res.status(201).json(flight)
  } catch (err: any) {
    if (err.code === 'P2002') return res.status(400).json({ error: 'Рейс с таким номером уже существует' })
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

/**
 * @swagger
 * /api/flights/{id}:
 *   put:
 *     summary: Обновить данные рейса
 *     tags: [Flights]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               flight_number:
 *                 type: string
 *               origin:
 *                 type: string
 *               destination:
 *                 type: string
 *               departure_time:
 *                 type: string
 *                 format: date-time
 *               arrival_time:
 *                 type: string
 *                 format: date-time
 *               gate_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Рейс обновлён
 *       404:
 *         description: Рейс не найден
 */
router.put('/:id', authenticate, async (req: Request, res: Response) => {
  const { flight_number, origin, destination, departure_time, arrival_time, gate_id } = req.body
  try {
    const flight = await prisma.flight.update({
      where: { id: Number(req.params.id) },
      data: {
        flightNumber: flight_number, origin, destination,
        departureTime: departure_time ? new Date(departure_time) : undefined,
        arrivalTime: arrival_time ? new Date(arrival_time) : undefined,
        gateId: gate_id !== undefined ? (gate_id ? Number(gate_id) : null) : undefined
      },
      include: { gate: true }
    })
    await logAction(req.user!.id, 'UPDATE', 'Flight', flight.id, `Обновлён рейс ${flight.flightNumber}`)
    res.json(flight)
  } catch {
    res.status(404).json({ error: 'Рейс не найден' })
  }
})

/**
 * @swagger
 * /api/flights/{id}/status:
 *   patch:
 *     summary: Изменить статус рейса
 *     tags: [Flights]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [SCHEDULED, BOARDING, DEPARTED, ARRIVED, DELAYED, CANCELLED]
 *                 example: BOARDING
 *     responses:
 *       200:
 *         description: Статус изменён
 *       400:
 *         description: Недопустимый статус
 *       404:
 *         description: Рейс не найден
 */
router.patch('/:id/status', authenticate, async (req: Request, res: Response) => {
  const { status } = req.body
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Допустимые статусы: ${VALID_STATUSES.join(', ')}` })
  }
  try {
    const flight = await prisma.flight.update({
      where: { id: Number(req.params.id) },
      data: { status }
    })
    await logAction(req.user!.id, 'STATUS_CHANGE', 'Flight', flight.id, `Статус рейса ${flight.flightNumber} → ${status}`)
    res.json(flight)
  } catch {
    res.status(404).json({ error: 'Рейс не найден' })
  }
})

/**
 * @swagger
 * /api/flights/{id}:
 *   delete:
 *     summary: Удалить рейс (только ADMIN)
 *     tags: [Flights]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Рейс удалён
 *       403:
 *         description: Недостаточно прав
 *       404:
 *         description: Рейс не найден
 */
router.delete('/:id', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const flight = await prisma.flight.delete({ where: { id: Number(req.params.id) } })
    await logAction(req.user!.id, 'DELETE', 'Flight', Number(req.params.id), `Удалён рейс ${flight.flightNumber}`)
    res.json({ message: 'Рейс удалён' })
  } catch {
    res.status(404).json({ error: 'Рейс не найден' })
  }
})

export default router
