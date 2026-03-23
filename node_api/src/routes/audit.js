const express = require('express')
const { PrismaClient } = require('@prisma/client')
const { authenticate } = require('../middleware/auth')
const { requireRole } = require('../middleware/requireRole')

const router = express.Router()
const prisma = new PrismaClient()

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
 *     summary: Журнал всех действий в системе (только ADMIN)
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: entity_type
 *         schema:
 *           type: string
 *           enum: [Flight, Gate, User]
 *         description: Фильтр по типу сущности
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *         description: Фильтр по ID пользователя
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
router.get('/', authenticate, requireRole('ADMIN'), async (req, res) => {
  const { entity_type, user_id, limit = 50 } = req.query
  const where = {}
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

module.exports = router
