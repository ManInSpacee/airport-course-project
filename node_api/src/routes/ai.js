const express = require('express')
const { authenticate } = require('../middleware/auth')
const { calculateDelayRisk } = require('../utils/aiRisk')

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: AI
 *   description: AI-эндпоинт на основе rule-based логики
 */

/**
 * @swagger
 * /api/ai/delay-risk:
 *   post:
 *     summary: Оценить риск задержки рейса
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [flight_id]
 *             properties:
 *               flight_id:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Результат оценки риска
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 score:
 *                   type: integer
 *                   description: Оценка риска от 0 до 100
 *                 level:
 *                   type: string
 *                   enum: [LOW, MEDIUM, HIGH]
 *                 interpretation:
 *                   type: string
 *                 reasons:
 *                   type: array
 *                   items:
 *                     type: string
 *       404:
 *         description: Рейс не найден
 */
router.post('/delay-risk', authenticate, async (req, res) => {
  const { flight_id } = req.body
  if (!flight_id) return res.status(400).json({ error: 'Нужен flight_id' })
  const result = await calculateDelayRisk(Number(flight_id))
  if (!result) return res.status(404).json({ error: 'Рейс не найден' })
  res.json(result)
})

module.exports = router
