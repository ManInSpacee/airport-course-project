import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { authenticate } from '../middleware/auth'
import { requireRole } from '../middleware/requireRole'

const router = Router()

/**
 * @swagger
 * tags:
 *   name: Audit
 *   description: Журнал действий (только ADMIN)
 */

/**
 * @swagger
 * /api/audit:
 *   get:
 *     summary: Журнал действий (только ADMIN)
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: entity_type
 *         schema:
 *           type: string
 *           enum: [Flight, Gate, User]
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Список записей журнала
 *       403:
 *         description: Недостаточно прав
 */
router.get('/', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const { entity_type, user_id, limit = '50' } = req.query as Record<string, string>
  const where: any = {}
  if (entity_type) where.entityType = entity_type
  if (user_id) where.userId = Number(user_id)

  const logs = await prisma.auditLog.findMany({
    where,
    include: { user: { select: { id: true, username: true } } },
    orderBy: { createdAt: 'desc' },
    take: Number(limit)
  })
  res.json(logs)
})

export default router
