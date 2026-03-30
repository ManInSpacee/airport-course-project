# ИС Аэропорт — Управление рейсами

Бэкенд системы управления рейсами аэропорта.

**Стек:** Node.js + Express + TypeScript + Prisma 7 + PostgreSQL + FastAPI (ML)

---

## Требования

- [Node.js 20+](https://nodejs.org)
- [Python 3.10+](https://python.org)
- [Docker Desktop](https://docker.com)

---

## Запуск

### 1. База данных
```bash
docker-compose up -d
```

### 2. Node.js сервер
```bash
cd node_api
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Сервер: http://localhost:3000
Swagger: http://localhost:3000/docs

### 3. ML-сервис (для AI-оценки риска)
```bash
# Первый раз — обучить модель
python ai_model/train.py

# Запустить сервис
uvicorn ai_model.server:app --port 8000 --reload
```

ML-сервис: http://localhost:8000
ML Swagger: http://localhost:8000/docs

---

## Переменные окружения

Файл `node_api/.env`:
```env
DATABASE_URL="postgresql://airport_user:airport_pass@localhost:5433/airport_db"
JWT_SECRET="your_secret_key"
ML_SERVICE_URL="http://localhost:8000"
PORT=3000
```

---

## Тестовые пользователи

| Email | Пароль | Роль |
|---|---|---|
| admin@airport.com | admin123 | ADMIN |
| dispatcher@airport.com | disp123 | DISPATCHER |

---

## API

| Метод | URL | Доступ |
|---|---|---|
| POST | /api/auth/register | публичный |
| POST | /api/auth/login | публичный |
| GET | /api/auth/me | авторизован |
| GET | /api/flights | авторизован |
| POST | /api/flights | авторизован |
| PUT | /api/flights/:id | авторизован |
| PATCH | /api/flights/:id/status | авторизован |
| DELETE | /api/flights/:id | ADMIN |
| GET | /api/gates | авторизован |
| POST | /api/gates | ADMIN |
| PUT | /api/gates/:id | ADMIN |
| DELETE | /api/gates/:id | ADMIN |
| GET | /api/users | ADMIN |
| PATCH | /api/users/:id/role | ADMIN |
| DELETE | /api/users/:id | ADMIN |
| POST | /api/ai/delay-risk | авторизован |
| GET | /api/audit | ADMIN |
