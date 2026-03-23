require('dotenv').config()
const express = require('express')
const swaggerUi = require('swagger-ui-express')
const swaggerJsdoc = require('swagger-jsdoc')

const authRoutes = require('./routes/auth')
const flightRoutes = require('./routes/flights')
const gateRoutes = require('./routes/gates')
const userRoutes = require('./routes/users')
const aiRoutes = require('./routes/ai')
const auditRoutes = require('./routes/audit')

const app = express()
app.use(express.json())

// Swagger
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: { title: 'Airport API (Node.js)', version: '1.0.0' },
    components: {
      securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } }
    }
  },
  apis: ['./src/routes/*.js']
})
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

// Роуты
app.use('/api/auth', authRoutes)
app.use('/api/flights', flightRoutes)
app.use('/api/gates', gateRoutes)
app.use('/api/users', userRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/audit', auditRoutes)

app.get('/', (req, res) => res.json({ message: 'Airport API (Node.js)', docs: '/docs' }))

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server: http://localhost:${PORT}`)
  console.log(`Swagger: http://localhost:${PORT}/docs`)
})
