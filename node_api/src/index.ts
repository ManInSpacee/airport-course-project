import 'dotenv/config'
import express from 'express'
import swaggerUi from 'swagger-ui-express'
import swaggerJsdoc from 'swagger-jsdoc'

import authRoutes from './routes/auth'
import flightRoutes from './routes/flights'
import gateRoutes from './routes/gates'
import userRoutes from './routes/users'
import aiRoutes from './routes/ai'
import auditRoutes from './routes/audit'

const app = express()
app.use(express.json())

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: { title: 'Airport API', version: '1.0.0' },
    components: {
      securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } }
    }
  },
  apis: ['./src/routes/*.ts']
})
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

app.use('/api/auth', authRoutes)
app.use('/api/flights', flightRoutes)
app.use('/api/gates', gateRoutes)
app.use('/api/users', userRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/audit', auditRoutes)

app.get('/', (req, res) => res.json({ message: 'Airport API (Node.js + TypeScript)', docs: '/docs' }))

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server: http://localhost:${PORT}`)
  console.log(`Swagger: http://localhost:${PORT}/docs`)
})
