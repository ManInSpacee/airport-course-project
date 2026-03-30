import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { authenticate } from '../middleware/auth'
import { requireRole } from '../middleware/requireRole'
import { logAction } from '../utils/audit'

const router = Router()

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Управление пользователями (только ADMIN)
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Список всех пользователей (только ADMIN)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список пользователей
 *       403:
 *         description: Недостаточно прав
 */
router.get('/', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    select: { id: true, username: true, email: true, role: true, createdAt: true }
  })
  res.json(users)
})

/**
 * @swagger
 * /api/users/{id}/role:
 *   patch:
 *     summary: Изменить роль пользователя (только ADMIN)
 *     tags: [Users]
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
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [ADMIN, DISPATCHER]
 *                 example: ADMIN
 *     responses:
 *       200:
 *         description: Роль изменена
 *       400:
 *         description: Недопустимая роль
 *       404:
 *         description: Пользователь не найден
 */
router.patch('/:id/role', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const { role } = req.body
  if (!['ADMIN', 'DISPATCHER'].includes(role)) return res.status(400).json({ error: 'Недопустимая роль' })
  try {
    const user = await prisma.user.update({
      where: { id: Number(req.params.id) },
      data: { role },
      select: { id: true, username: true, email: true, role: true }
    })
    await logAction(req.user!.id, 'ROLE_CHANGE', 'User', user.id, `Роль ${user.username} → ${role}`)
    res.json(user)
  } catch {
    res.status(404).json({ error: 'Пользователь не найден' })
  }
})

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Удалить пользователя (только ADMIN)
 *     tags: [Users]
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
 *         description: Пользователь удалён
 *       404:
 *         description: Пользователь не найден
 */
router.delete('/:id', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    await prisma.user.delete({ where: { id: Number(req.params.id) } })
    await logAction(req.user!.id, 'DELETE', 'User', Number(req.params.id))
    res.json({ message: 'Пользователь удалён' })
  } catch {
    res.status(404).json({ error: 'Пользователь не найден' })
  }
})

export default router
