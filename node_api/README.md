# Airport API — Node.js

## Запуск

```bash
# 1. Поднять БД
cd ..
docker-compose up -d

# 2. Установить зависимости
cd node_api
npm install

# 3. Применить схему БД
npx prisma db push

# 4. Залить тестовые данные
npm run db:seed

# 5. Запустить сервер
npm run dev
```

Swagger: http://localhost:3000/docs

## Тестовые пользователи
- admin@airport.com / admin123  (роль: ADMIN)
- dispatcher@airport.com / disp123  (роль: DISPATCHER)

## Эндпоинты
| Метод | URL | Роль |
|-------|-----|------|
| POST | /api/auth/register | — |
| POST | /api/auth/login | — |
| GET | /api/auth/me | любой |
| GET | /api/flights | любой |
| POST | /api/flights | любой |
| PUT | /api/flights/:id | любой |
| PATCH | /api/flights/:id/status | любой |
| DELETE | /api/flights/:id | ADMIN |
| GET | /api/gates | любой |
| POST | /api/gates | ADMIN |
| PUT | /api/gates/:id | ADMIN |
| DELETE | /api/gates/:id | ADMIN |
| GET | /api/users | ADMIN |
| PATCH | /api/users/:id/role | ADMIN |
| DELETE | /api/users/:id | ADMIN |
| POST | /api/ai/delay-risk | любой |
| GET | /api/audit | ADMIN |
