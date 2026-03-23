const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')
const { authenticate } = require('../middleware/auth')

const router = express.Router()
const prisma = new PrismaClient()

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Авторизация и регистрация
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Регистрация нового пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email, password]
 *             properties:
 *               username:
 *                 type: string
 *                 example: ivan
 *               email:
 *                 type: string
 *                 example: ivan@airport.com
 *               password:
 *                 type: string
 *                 example: secret123
 *               role:
 *                 type: string
 *                 enum: [ADMIN, DISPATCHER]
 *                 example: DISPATCHER
 *     responses:
 *       201:
 *         description: Пользователь создан
 *       400:
 *         description: Email или username уже занят
 */
router.post('/register', async (req, res) => {
  const { username, email, password, role } = req.body
  try {
    const passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { username, email, passwordHash, role: role || 'DISPATCHER' },
      select: { id: true, username: true, email: true, role: true, createdAt: true }
    })
    res.status(201).json(user)
  } catch (err) {
    if (err.code === 'P2002') return res.status(400).json({ error: 'Email или username уже занят' })
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Вход в систему
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@airport.com
 *               password:
 *                 type: string
 *                 example: admin123
 *     responses:
 *       200:
 *         description: Возвращает JWT токен
 *       401:
 *         description: Неверный email или пароль
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return res.status(401).json({ error: 'Неверный email или пароль' })
  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) return res.status(401).json({ error: 'Неверный email или пароль' })

  const token = jwt.sign(
    { id: user.id, username: user.username, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  )
  res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } })
})

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Получить данные текущего пользователя
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Данные из JWT токена
 *       401:
 *         description: Токен не предоставлен
 */
router.get('/me', authenticate, (req, res) => res.json(req.user))

module.exports = router
