# Airport API — Контекст проекта

## Тема курсовой
«Проектирование и разработка информационной системы Аэропорт — управление рейсами»

## Стек
- Node.js + Express
- Prisma ORM
- PostgreSQL (в Docker)
- JWT авторизация
- Swagger UI (`/docs`)

## Структура проекта
```
backend_spo/
├── docker-compose.yml       ← только PostgreSQL
└── node_api/
    ├── package.json
    ├── .env                 ← создать из .env.example
    ├── prisma/
    │   ├── schema.prisma    ← схема БД
    │   └── seed.js          ← тестовые данные
    └── src/
        ├── index.js         ← главный сервер
        ├── middleware/
        │   ├── auth.js      ← проверка JWT токена
        │   └── requireRole.js ← проверка роли
        ├── routes/
        │   ├── auth.js      ← регистрация/логин
        │   ├── flights.js   ← CRUD рейсов
        │   ├── gates.js     ← CRUD гейтов
        │   ├── users.js     ← управление пользователями
        │   ├── ai.js        ← AI риск задержки
        │   └── audit.js     ← журнал действий
        └── utils/
            ├── audit.js     ← запись в журнал
            └── aiRisk.js    ← rule-based логика риска
```

## Запуск
```bash
# 1. Поднять БД (из корня backend_spo/)
docker-compose up -d

# 2. Установить зависимости (только первый раз)
cd node_api
npm install

# 3. Создать таблицы в БД (только первый раз или при изменении схемы)
npx prisma db push

# 4. Залить тестовые данные (только первый раз)
npm run db:seed

# 5. Запустить сервер
npm run dev
```

Swagger: http://localhost:3000/docs

## Тестовые пользователи
| Email | Пароль | Роль |
|-------|--------|------|
| admin@airport.com | admin123 | ADMIN |
| dispatcher@airport.com | disp123 | DISPATCHER |

## Роли и доступ
- **ADMIN** — полный доступ: управление пользователями, гейтами, рейсами, журнал
- **DISPATCHER** — создание/редактирование рейсов, смена статуса

## Эндпоинты
| Метод | URL | Роль | Описание |
|-------|-----|------|----------|
| POST | /api/auth/register | — | Регистрация |
| POST | /api/auth/login | — | Вход, возвращает JWT |
| GET | /api/auth/me | любой | Текущий пользователь |
| GET | /api/flights | любой | Список рейсов (фильтры: status, origin, destination, gate_id) |
| POST | /api/flights | любой | Создать рейс (проверка конфликта гейта) |
| PUT | /api/flights/:id | любой | Обновить рейс |
| PATCH | /api/flights/:id/status | любой | Сменить статус |
| DELETE | /api/flights/:id | ADMIN | Удалить рейс |
| GET | /api/gates | любой | Список гейтов |
| POST | /api/gates | ADMIN | Создать гейт |
| PUT | /api/gates/:id | ADMIN | Обновить гейт |
| DELETE | /api/gates/:id | ADMIN | Удалить гейт |
| GET | /api/users | ADMIN | Список пользователей |
| PATCH | /api/users/:id/role | ADMIN | Сменить роль |
| DELETE | /api/users/:id | ADMIN | Удалить пользователя |
| POST | /api/ai/delay-risk | любой | Оценка риска задержки рейса |
| GET | /api/audit | ADMIN | Журнал действий |

## Статусы рейса
`SCHEDULED` → `BOARDING` → `DEPARTED` → `ARRIVED`  
Также: `DELAYED`, `CANCELLED`

## AI эндпоинт
Rule-based логика. Принимает `{ flight_id }`, возвращает:
```json
{
  "score": 45,
  "level": "MEDIUM",
  "interpretation": "Средний риск задержки",
  "reasons": ["Час пик", "Небольшая загрузка гейта"]
}
```
Факторы: загрузка гейта, час пик, выходной день, история задержек на маршруте, текущий статус рейса.

## БД — подключение
```
DATABASE_URL="postgresql://airport_user:airport_pass@localhost:5433/airport_db"
JWT_SECRET="super-secret-key-change-in-production"
PORT=3000
```
