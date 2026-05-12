import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../app'

// Логин с реальным пользователем из seed
const ADMIN = { email: 'admin@airport.com', password: 'admin123' }

async function getToken() {
  const res = await request(app).post('/api/auth/login').send(ADMIN)
  return res.body.token as string
}

describe('POST /api/auth/login', () => {
  it('возвращает токен при верных данных', async () => {
    const res = await request(app).post('/api/auth/login').send(ADMIN)
    expect(res.status).toBe(200)
    expect(res.body.token).toBeDefined()
  })

  it('возвращает 401 при неверном пароле', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: ADMIN.email, password: 'wrongpass' })
    expect(res.status).toBe(401)
  })
})

describe('GET /api/auth/me', () => {
  it('возвращает данные пользователя с токеном', async () => {
    const token = await getToken()
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.email).toBe(ADMIN.email)
  })

  it('возвращает 401 без токена', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
  })
})

describe('POST /api/flights', () => {
  it('возвращает 400 если номер рейса в неверном формате', async () => {
    const token = await getToken()
    const res = await request(app)
      .post('/api/flights')
      .set('Authorization', `Bearer ${token}`)
      .send({
        flight_number: 'INVALID',
        origin: 'Москва',
        destination: 'Сочи',
        departure_time: '2026-06-01T10:00:00Z',
        arrival_time: '2026-06-01T12:00:00Z',
      })
    expect(res.status).toBe(400)
    expect(res.body.error).toContain('формат')
  })
})
