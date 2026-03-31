import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { authenticate } from '../middleware/auth'
import { requireRole } from '../middleware/requireRole'
import { logAction } from '../utils/audit'

const router = Router()

/**
 * @swagger
 * tags:
 *   name: Gates
 *   description: Управление гейтами
 */

/**
 * @swagger
 * /api/gates:
 *   get:
 *     summary: Список всех гейтов
 *     tags: [Gates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список гейтов с количеством рейсов
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  const { terminal, name } = req.query as Record<string, string>
  const where: any = {}
  if (terminal) where.terminal = terminal
  if (name) where.name = { contains: name, mode: 'insensitive' }

  const gates = await prisma.gate.findMany({ where, include: { _count: { select: { flights: true } } } })
  res.json(gates)
})

/**
 * @swagger
 * /api/gates:
 *   post:
 *     summary: Создать гейт (только ADMIN)
 *     tags: [Gates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, terminal]
 *             properties:
 *               name:
 *                 type: string
 *                 example: A3
 *               terminal:
 *                 type: string
 *                 example: A
 *     responses:
 *       201:
 *         description: Гейт создан
 *       403:
 *         description: Недостаточно прав
 */
router.post('/', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const { name, terminal } = req.body
  try {
    const gate = await prisma.gate.create({ data: { name, terminal } })
    await logAction(req.user!.id, 'CREATE', 'Gate', gate.id, `Создан гейт ${name}`)
    res.status(201).json(gate)
  } catch {
    res.status(400).json({ error: 'Гейт с таким именем уже существует' })
  }
})

/**
 * @swagger
 * /api/gates/{id}:
 *   put:
 *     summary: Обновить гейт (только ADMIN)
 *     tags: [Gates]
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
 *               name:
 *                 type: string
 *               terminal:
 *                 type: string
 *     responses:
 *       200:
 *         description: Гейт обновлён
 *       404:
 *         description: Гейт не найден
 */
router.put('/:id', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const { name, terminal } = req.body
  try {
    const gate = await prisma.gate.update({ where: { id: Number(req.params.id) }, data: { name, terminal } })
    await logAction(req.user!.id, 'UPDATE', 'Gate', gate.id, `Обновлён гейт ${gate.name}`)
    res.json(gate)
  } catch {
    res.status(404).json({ error: 'Гейт не найден' })
  }
})

/**
 * @swagger
 * /api/gates/{id}:
 *   delete:
 *     summary: Удалить гейт (только ADMIN)
 *     tags: [Gates]
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
 *         description: Гейт удалён
 *       404:
 *         description: Гейт не найден или к нему привязаны рейсы
 */
router.delete('/:id', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    await prisma.gate.delete({ where: { id: Number(req.params.id) } })
    await logAction(req.user!.id, 'DELETE', 'Gate', Number(req.params.id))
    res.json({ message: 'Гейт удалён' })
  } catch {
    res.status(404).json({ error: 'Гейт не найден или к нему привязаны рейсы' })
  }
})

export default router
